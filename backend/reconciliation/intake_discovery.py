import json
import logging
import os
from pathlib import Path
from typing import Any

from django.conf import settings

from .demo_state import get_case_data, get_completed_task_ids
from .intake_prompt import build_system_prompt, build_user_prompt
from .intake_tools import (
    IntakeAgentState,
    build_openai_tools,
    dispatch_tool,
)
from .intake_validation import build_overview_from_agent_output


_FIXTURE_PATH = (
    Path(__file__).resolve().parents[2] / 'frontend' / 'src' / 'fixtures' / 'truus-cees.json'
)
logger = logging.getLogger(__name__)


def stream_intake_discovery(
    deceased_bsn: str,
    assistance: str,
):
    state = IntakeAgentState()
    base_user_prompt = build_user_prompt(
        deceased_bsn=deceased_bsn,
        assistance=assistance,
        known_case_information=_known_case_information(),
        stored_case_data=get_case_data(),
        completed_task_ids=get_completed_task_ids(),
    )
    system_prompt = build_system_prompt()
    observations: list[dict[str, Any]] = []
    tools = build_openai_tools()
    client = _openai_client()
    successful_action_keys: set[str] = set()
    logger.info(
        'Intake discovery started model=%s base_url=%s assistance=%s',
        settings.INTAKE_DISCOVERY_MODEL,
        settings.INTAKE_DISCOVERY_BASE_URL or _default_base_url_label(),
        assistance,
    )

    for turn_index in range(40):
        logger.info('Intake discovery model turn %s started', turn_index + 1)
        tool_calls = _run_streamed_model_turn(
            client,
            system_prompt,
            _build_react_prompt(base_user_prompt, state, observations),
            tools,
        )
        logger.info(
            'Intake discovery model turn %s returned tools=%s',
            turn_index + 1,
            [tool_call['function']['name'] for tool_call in tool_calls],
        )

        if not tool_calls:
            raise RuntimeError('The intake discovery agent stopped without calling tools.')

        if _is_progress_only_turn(tool_calls):
            logger.warning('Intake discovery rejected progress-only model turn')
            for tool_call in tool_calls:
                arguments = _parse_tool_arguments(tool_call)
                yield 'tool_call_started', {'tool': 'emit_progress', 'arguments': _safe_event_arguments(arguments)}
                yield 'tool_call_finished', {
                    'tool': 'emit_progress',
                    'status': 'error',
                    'message': 'Progress-only turns are not allowed. Call a discovery/action tool or complete_discovery.',
                }
            observations.append({
                'tool': 'loop_guard',
                'arguments': {},
                'result': {
                    'ok': False,
                    'error': 'Progress-only turn rejected. Use data/action tools, register missing processes, or complete_discovery.',
                },
            })
            continue

        for tool_call in tool_calls:
            name = tool_call['function']['name']
            arguments = _parse_tool_arguments(tool_call)
            logger.info('Intake discovery tool started name=%s', name)
            yield 'tool_call_started', {'tool': name, 'arguments': _safe_event_arguments(arguments)}
            action_key = _action_key(name, arguments)
            try:
                if action_key in successful_action_keys:
                    raise ValueError(
                        f'Duplicate successful tool call rejected for {name}. '
                        'Use the previous observation or choose the next action.'
                    )
                result = dispatch_tool(name, arguments, state)
                if name == 'emit_progress':
                    yield 'progress', {'line': arguments['message']}
                yield 'tool_call_finished', {'tool': name, 'status': 'ok'}
                if action_key:
                    successful_action_keys.add(action_key)
                logger.info('Intake discovery tool finished name=%s status=ok', name)
            except Exception as exc:
                result = {'ok': False, 'error': str(exc)}
                yield 'tool_call_finished', {'tool': name, 'status': 'error', 'message': str(exc)}
                logger.warning('Intake discovery tool finished name=%s status=error error=%s', name, exc)
            observations.append(_observation_entry(name, arguments, result))

        if state.complete:
            logger.info('Intake discovery completed registered_processes=%s', len(state.processes))
            overview = build_overview_from_agent_output(
                user_info=state.user_info or {},
                processes=state.processes,
                completed_task_ids=get_completed_task_ids(),
            )
            yield 'result', overview
            return

    raise RuntimeError('The intake discovery agent did not complete within the tool-call limit.')


def _default_base_url_label() -> str:
    if os.getenv('GREENPT_API_KEY') and not os.getenv('OPENAI_API_KEY'):
        return 'https://api.greenpt.ai/v1'
    return 'OpenAI SDK default'


def _is_progress_only_turn(tool_calls: list[dict[str, Any]]) -> bool:
    return all(tool_call['function']['name'] == 'emit_progress' for tool_call in tool_calls)


def _action_key(name: str, arguments: dict[str, Any]) -> str | None:
    if name in {'emit_progress', 'register_process', 'complete_discovery'}:
        return None
    encoded_arguments = json.dumps(arguments, ensure_ascii=False, sort_keys=True)
    return f'{name}:{encoded_arguments}'


def _run_streamed_model_turn(client, system_prompt: str, user_prompt: str, tools: list[dict[str, Any]]):
    stream = client.chat.completions.create(
        model=settings.INTAKE_DISCOVERY_MODEL,
        messages=[
            {'role': 'system', 'content': system_prompt},
            {'role': 'user', 'content': user_prompt},
        ],
        tools=tools,
        tool_choice='auto',
        stream=True,
        temperature=0.1,
        timeout=settings.INTAKE_DISCOVERY_TIMEOUT_SECONDS,
    )

    content_parts: list[str] = []
    tool_calls_by_index: dict[int, dict[str, Any]] = {}
    for chunk in stream:
        if not chunk.choices:
            continue
        delta = chunk.choices[0].delta
        if delta.content:
            content_parts.append(delta.content)
        for delta_tool_call in delta.tool_calls or []:
            index = delta_tool_call.index
            tool_call = tool_calls_by_index.setdefault(index, {
                'id': '',
                'type': 'function',
                'function': {'name': '', 'arguments': ''},
            })
            if delta_tool_call.id:
                tool_call['id'] = delta_tool_call.id
            if delta_tool_call.function:
                if delta_tool_call.function.name:
                    tool_call['function']['name'] += delta_tool_call.function.name
                if delta_tool_call.function.arguments:
                    tool_call['function']['arguments'] += delta_tool_call.function.arguments

    tool_calls = [tool_calls_by_index[index] for index in sorted(tool_calls_by_index)]
    return tool_calls


def _build_react_prompt(
    base_user_prompt: str,
    state: IntakeAgentState,
    observations: list[dict[str, Any]],
) -> str:
    return (
        f'{base_user_prompt}\n\n'
        'Current working memory:\n'
        f'{json.dumps(_state_snapshot(state), ensure_ascii=False, indent=2)}\n\n'
        'Recent observations from your previous actions:\n'
        f'{json.dumps(observations[-16:], ensure_ascii=False, indent=2)}\n\n'
        'Choose the next best action by calling one or more tools. '
        'Do not repeat actions that are already complete unless a previous observation shows an error. '
        'Progress is not an action: do not call emit_progress by itself. '
        'If you mention checking a source, call the relevant discover_api, call_api, or call_a2a_agent tool in the same turn. '
        'When user info is set and all relevant processes are registered, call complete_discovery.'
    )


def _state_snapshot(state: IntakeAgentState) -> dict[str, Any]:
    return {
        'user_info_set': state.user_info is not None,
        'registered_processes': [
            {
                'id': process.get('id'),
                'organisation': process.get('organisation'),
                'title': process.get('title'),
                'state': process.get('state'),
                'handled_by': process.get('handled_by'),
                'has_form': bool(process.get('form')),
            }
            for process in state.processes
        ],
        'progress_messages': state.progress[-10:],
        'complete': state.complete,
    }


def _observation_entry(name: str, arguments: dict[str, Any], result: Any) -> dict[str, Any]:
    return {
        'tool': name,
        'arguments': _truncate_value(arguments, 4000),
        'result': _truncate_value(result, 18000),
    }


def _truncate_value(value: Any, max_chars: int):
    encoded = json.dumps(value, ensure_ascii=False, default=str)
    if len(encoded) <= max_chars:
        return value
    return {
        'truncated': True,
        'json_prefix': encoded[:max_chars],
    }


def _openai_client():
    try:
        from openai import OpenAI
    except ImportError as exc:
        raise RuntimeError('The openai package is not installed in the backend environment.') from exc

    api_key = (
        os.getenv('INTAKE_DISCOVERY_API_KEY')
        or os.getenv('OPENAI_API_KEY')
        or os.getenv('GREENPT_API_KEY')
    )
    if not api_key:
        raise RuntimeError('Set INTAKE_DISCOVERY_API_KEY or OPENAI_API_KEY before running intake discovery.')

    base_url = settings.INTAKE_DISCOVERY_BASE_URL
    if not base_url and os.getenv('GREENPT_API_KEY') and not os.getenv('OPENAI_API_KEY'):
        base_url = 'https://api.greenpt.ai/v1'
    return OpenAI(api_key=api_key, base_url=base_url)


def _parse_tool_arguments(tool_call: dict[str, Any]) -> dict[str, Any]:
    raw = tool_call['function'].get('arguments') or '{}'
    try:
        parsed = json.loads(raw)
    except json.JSONDecodeError as exc:
        raise ValueError(f"Invalid JSON arguments for {tool_call['function'].get('name')}: {raw}") from exc
    if not isinstance(parsed, dict):
        raise ValueError('Tool arguments must be a JSON object.')
    return parsed


def _safe_event_arguments(arguments: dict[str, Any]) -> dict[str, Any]:
    encoded = json.dumps(arguments, ensure_ascii=False)
    if len(encoded) <= 800:
        return arguments
    return {'summary': encoded[:800] + '...'}


def _known_case_information() -> dict[str, Any]:
    fixture = json.loads(_FIXTURE_PATH.read_text(encoding='utf-8'))
    case = fixture.get('overledene') or {}
    return {
        'deceased': case.get('overledene') or {},
        'surviving_partner': case.get('partner') or {},
        'relationship': case.get('relatie') or {},
    }
