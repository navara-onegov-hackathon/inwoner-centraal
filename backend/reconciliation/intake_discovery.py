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
from .config_registry import load_active_process_registry, load_agent_registry, load_api_registry


def _resolve_fixture_path() -> Path:
    candidates = [
        os.getenv('INTAKE_FIXTURE_PATH'),
        settings.BASE_DIR / 'fixtures' / 'truus-cees.json',
        settings.BASE_DIR.parent / 'frontend' / 'src' / 'fixtures' / 'truus-cees.json',
    ]
    for candidate in candidates:
        if not candidate:
            continue
        path = Path(candidate)
        if path.is_file():
            return path
    raise FileNotFoundError(
        'Truus/Cees fixture not found. Expected backend/fixtures/truus-cees.json '
        'or frontend/src/fixtures/truus-cees.json.',
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
        'Intake discovery started model=%s base_url=%s seed=%s assistance=%s',
        settings.INTAKE_DISCOVERY_MODEL,
        settings.INTAKE_DISCOVERY_BASE_URL or _default_base_url_label(),
        settings.INTAKE_DISCOVERY_SEED if settings.INTAKE_DISCOVERY_SEED is not None else 'random',
        assistance,
    )
    yield 'progress', {'line': 'Basisgegevens verzamelen.'}

    for turn_index in range(40):
        logger.info('Intake discovery model turn %s started', turn_index + 1)
        tool_calls = _run_streamed_model_turn(
            client,
            system_prompt,
            _build_react_prompt(base_user_prompt, state, observations, successful_action_keys),
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
                _validate_phase_action(name, successful_action_keys, state)
                if action_key in successful_action_keys:
                    raise ValueError(
                        f'Duplicate successful tool call rejected for {name}. '
                        'Use the previous observation or choose the next action.'
                    )
                result = dispatch_tool(name, arguments, state)
                if name == 'emit_progress':
                    yield 'progress', {'line': arguments['message']}
                if name == 'mark_process_irrelevant':
                    yield 'progress', {'line': _irrelevant_progress_line(arguments)}
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
    if name in {'emit_progress', 'register_process', 'mark_process_irrelevant', 'complete_discovery'}:
        return None
    if name == 'discover_api':
        return f"discover_api:{arguments.get('api')}"
    if name == 'call_a2a_agent':
        return f"call_a2a_agent:{arguments.get('agent')}"
    if name == 'call_api':
        return f"call_api:{arguments.get('method')}:{arguments.get('url')}"
    encoded_arguments = json.dumps(arguments, ensure_ascii=False, sort_keys=True)
    return f'{name}:{encoded_arguments}'


def _run_streamed_model_turn(client, system_prompt: str, user_prompt: str, tools: list[dict[str, Any]]):
    request_args = {
        'model': settings.INTAKE_DISCOVERY_MODEL,
        'messages': [
            {'role': 'system', 'content': system_prompt},
            {'role': 'user', 'content': user_prompt},
        ],
        'tools': tools,
        'tool_choice': 'auto',
        'stream': True,
        'temperature': 0,
        'timeout': settings.INTAKE_DISCOVERY_TIMEOUT_SECONDS,
    }
    if settings.INTAKE_DISCOVERY_SEED is not None:
        request_args['seed'] = settings.INTAKE_DISCOVERY_SEED

    stream = client.chat.completions.create(**request_args)

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
    successful_action_keys: set[str],
) -> str:
    return (
        f'{base_user_prompt}\n\n'
        'Current working memory:\n'
        f'{json.dumps(_state_snapshot(state, successful_action_keys), ensure_ascii=False, indent=2)}\n\n'
        'Recent observations from your previous actions:\n'
        f'{json.dumps(observations[-16:], ensure_ascii=False, indent=2)}\n\n'
        'Choose the next best action by calling one or more tools. '
        'Do not repeat actions that are already complete unless a previous observation shows an error. '
        'Progress is not an action: do not call emit_progress by itself. '
        'If you mention checking a source, call the relevant discover_api, call_api, or call_a2a_agent tool in the same turn. '
        'Progress lines must be neutral citizen-facing Dutch, for example "Controle bij RDW: voertuiggegevens ophalen." '
        'Never mention AI, agents, tools, OpenAPI, or first-person text like "Ik controleer bij ...". '
        'Once any process is registered or marked irrelevant, the source-discovery phase is closed: do not call source-discovery tools again. '
        'Every active process id must be accounted for exactly once: use register_process when relevant, or mark_process_irrelevant when not relevant. '
        'Processes marked skip=true are not active and must not be checked. '
        'Processes marked demo_always_relevant=true must be registered as relevant without an external applicability check. '
        'When all active processes are accounted for, call complete_discovery.'
    )


def _state_snapshot(state: IntakeAgentState, successful_action_keys: set[str]) -> dict[str, Any]:
    return {
        'user_info_set': state.user_info is not None,
        'source_status': _source_status(successful_action_keys),
        'next_required_action': _next_required_action(state, successful_action_keys),
        'process_coverage': _process_coverage(state),
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
        'irrelevant_processes': [
            {
                'id': process.get('id'),
                'organisation': process.get('organisation'),
                'title': process.get('title'),
            }
            for process in state.irrelevant_processes
        ],
        'progress_messages': state.progress[-10:],
        'complete': state.complete,
    }


def _source_status(successful_action_keys: set[str]) -> dict[str, Any]:
    configured_apis = [api['id'] for api in load_api_registry()]
    configured_agents = [agent['id'] for agent in load_agent_registry()]
    return {
        'a2a_agents_called': [
            agent_id
            for agent_id in configured_agents
            if f'call_a2a_agent:{agent_id}' in successful_action_keys
        ],
        'apis_discovered': [
            api_id
            for api_id in configured_apis
            if f'discover_api:{api_id}' in successful_action_keys
        ],
        'api_calls_made': sorted(
            key.removeprefix('call_api:')
            for key in successful_action_keys
            if key.startswith('call_api:')
        ),
        'apis_with_data_calls': _api_ids_with_data_calls(successful_action_keys),
        'all_required_sources_checked': _all_required_sources_checked(successful_action_keys),
        'all_required_api_data_checked': _all_required_api_data_checked(successful_action_keys),
    }


def _next_required_action(state: IntakeAgentState, successful_action_keys: set[str]) -> str:
    if state.user_info is None:
        return 'call set_user_info'
    if not _all_required_sources_checked(successful_action_keys):
        return 'finish required A2A and OpenAPI discovery before registering processes'
    if not _all_required_api_data_checked(successful_action_keys):
        return 'call concrete data endpoints from every configured API before deciding process relevance'
    coverage = _process_coverage(state)
    if coverage['missing_process_ids']:
        return 'account for every missing process id using register_process or mark_process_irrelevant'
    return 'call complete_discovery'


def _process_coverage(state: IntakeAgentState) -> dict[str, Any]:
    configured_ids = [process['id'] for process in load_active_process_registry()]
    relevant_ids = [process.get('id') for process in state.processes]
    irrelevant_ids = [process.get('id') for process in state.irrelevant_processes]
    accounted_ids = set(relevant_ids) | set(irrelevant_ids)
    duplicated_ids = sorted(set(relevant_ids) & set(irrelevant_ids))
    return {
        'total_configured_processes': len(configured_ids),
        'relevant_process_ids': [process_id for process_id in relevant_ids if process_id],
        'irrelevant_process_ids': [process_id for process_id in irrelevant_ids if process_id],
        'missing_process_ids': [process_id for process_id in configured_ids if process_id not in accounted_ids],
        'duplicated_process_ids': duplicated_ids,
        'all_processes_accounted_for': not duplicated_ids and all(
            process_id in accounted_ids for process_id in configured_ids
        ),
    }


def _all_required_sources_checked(successful_action_keys: set[str]) -> bool:
    required_agent_keys = {
        f"call_a2a_agent:{agent['id']}"
        for agent in load_agent_registry()
    }
    required_api_keys = {
        f"discover_api:{api['id']}"
        for api in load_api_registry()
    }
    return required_agent_keys.issubset(successful_action_keys) and required_api_keys.issubset(successful_action_keys)


def _all_required_api_data_checked(successful_action_keys: set[str]) -> bool:
    configured_api_ids = {api['id'] for api in load_api_registry()}
    return configured_api_ids.issubset(set(_api_ids_with_data_calls(successful_action_keys)))


def _api_ids_with_data_calls(successful_action_keys: set[str]) -> list[str]:
    called_api_ids = set()
    for key in successful_action_keys:
        if not key.startswith('call_api:'):
            continue
        url = key.removeprefix('call_api:').split(':', 1)[1]
        for api in load_api_registry():
            if url.startswith(f"/{api['id']}/") or url.startswith(f"{api['base_url']}/"):
                called_api_ids.add(api['id'])
    return sorted(called_api_ids)


def _validate_phase_action(name: str, successful_action_keys: set[str], state: IntakeAgentState):
    if name == 'complete_discovery' and not _all_required_sources_checked(successful_action_keys):
        raise ValueError('complete_discovery requires the configured A2A agents and OpenAPI documents to be checked first.')
    if name in {'register_process', 'mark_process_irrelevant', 'complete_discovery'} and not _all_required_api_data_checked(successful_action_keys):
        raise ValueError(
            'Process relevance requires concrete data calls from every configured API before registering or marking processes.'
        )
    if name == 'complete_discovery':
        coverage = _process_coverage(state)
        if coverage['missing_process_ids']:
            raise ValueError(
                'complete_discovery requires every active process to be registered or marked irrelevant. '
                f"Missing: {', '.join(coverage['missing_process_ids'])}"
            )
        if coverage['duplicated_process_ids']:
            raise ValueError(
                'A process cannot be both relevant and irrelevant. '
                f"Duplicated: {', '.join(coverage['duplicated_process_ids'])}"
            )
    if (state.processes or state.irrelevant_processes) and name in {'discover_api', 'call_a2a_agent', 'call_api'}:
        raise ValueError(
            'Discovery source calls are closed after registering processes. '
            'Use existing observations to update/register processes or call complete_discovery.'
        )


def _irrelevant_progress_line(process: dict[str, Any]) -> str:
    organisation = process.get('organisation') or 'organisatie'
    title = process.get('title') or process.get('id') or 'proces'
    return f'Controle bij {organisation}: {title}.'


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
    fixture = json.loads(_resolve_fixture_path().read_text(encoding='utf-8'))
    case = fixture.get('overledene') or {}
    return {
        'deceased': case.get('overledene') or {},
        'surviving_partner': case.get('partner') or {},
        'relationship': case.get('relatie') or {},
    }
