import json
import os
from pathlib import Path
from typing import Any

from dotenv import load_dotenv
from openai import AsyncOpenAI

from brieven_repository import BriefRepository
from a2a.helpers import (
    get_message_text,
    new_task_from_user_message,
    new_text_message,
    new_text_part,
)
from a2a.server.agent_execution import AgentExecutor, RequestContext
from a2a.server.events import EventQueue
from a2a.server.tasks import TaskUpdater
from a2a.types.a2a_pb2 import TaskState

load_dotenv()

_SYSTEM_PROMPT = """\
Je bent een assistent die vragen beantwoordt over Belastingdienst-correspondentie (brieven) \
voor nabestaanden of partners van overledenen. \
Je beschikt over tools om de brievenrepository te bevragen. \
Gebruik altijd een tool om de gevraagde gegevens op te halen. \
Geef geen antwoord zonder eerst een tool aan te roepen als er data nodig is.
"""

_TOOLS: list[dict[str, Any]] = [
    {
        'type': 'function',
        'function': {
            'name': 'get_by_bsn',
            'description': 'Haal alle brieven op voor een gegeven BSN van de overledene.',
            'parameters': {
                'type': 'object',
                'properties': {
                    'bsn': {'type': 'string', 'description': 'BSN van de overledene.'},
                },
                'required': ['bsn'],
            },
        },
    },
    {
        'type': 'function',
        'function': {
            'name': 'get_by_id',
            'description': 'Haal één brief op aan de hand van het URN-id.',
            'parameters': {
                'type': 'object',
                'properties': {
                    'brief_id': {'type': 'string', 'description': 'URN-id van de brief.'},
                },
                'required': ['brief_id'],
            },
        },
    },
    {
        'type': 'function',
        'function': {
            'name': 'get_requiring_action',
            'description': 'Haal brieven op waarvoor actie vereist is voor een gegeven BSN.',
            'parameters': {
                'type': 'object',
                'properties': {
                    'bsn': {'type': 'string', 'description': 'BSN van de overledene.'},
                },
                'required': ['bsn'],
            },
        },
    },
    {
        'type': 'function',
        'function': {
            'name': 'get_by_type',
            'description': (
                'Haal brieven op voor een gegeven BSN gefilterd op type '
                '("beschikking" of "terugvordering").'
            ),
            'parameters': {
                'type': 'object',
                'properties': {
                    'bsn': {'type': 'string', 'description': 'BSN van de overledene.'},
                    'brief_type': {
                        'type': 'string',
                        'enum': ['beschikking', 'terugvordering'],
                        'description': 'Type brief.',
                    },
                },
                'required': ['bsn', 'brief_type'],
            },
        },
    },
    {
        'type': 'function',
        'function': {
            'name': 'get_by_brief_code',
            'description': 'Haal brieven op voor een gegeven BSN gefilterd op exacte brief_code.',
            'parameters': {
                'type': 'object',
                'properties': {
                    'bsn': {'type': 'string', 'description': 'BSN van de overledene.'},
                    'brief_code': {'type': 'string', 'description': 'Exacte brief_code.'},
                },
                'required': ['bsn', 'brief_code'],
            },
        },
    },
    {
        'type': 'function',
        'function': {
            'name': 'check_address_mismatch',
            'description': (
                'Controleer of er brieven zijn voor een BSN die naar een afwijkend adres zijn '
                'gestuurd ten opzichte van het opgegeven adres (postcode + huisnummer). '
                'Retourneert een overzicht van afwijkende brieven en een mismatch-vlag.'
            ),
            'parameters': {
                'type': 'object',
                'properties': {
                    'bsn': {'type': 'string', 'description': 'BSN van de overledene.'},
                    'postcode': {
                        'type': 'string',
                        'description': 'Verwachte postcode (bijv. "5787ZP" of "5787 ZP").',
                    },
                    'huisnummer': {
                        'type': 'string',
                        'description': 'Verwacht huisnummer.',
                    },
                },
                'required': ['bsn', 'postcode', 'huisnummer'],
            },
        },
    },
]


class GreenPTAgent:
    """LLM Agent configured from environment variables."""

    def __init__(self) -> None:
        a2a_api_key = os.getenv('A2A_LLM_API_KEY')
        greenpt_api_key = os.getenv('GREENPT_API_KEY')
        openai_api_key = os.getenv('OPENAI_API_KEY')

        if a2a_api_key:
            api_key = a2a_api_key
            base_url = os.getenv('A2A_LLM_BASE_URL') or os.getenv('OPENAI_BASE_URL')
            self.model = os.getenv('A2A_LLM_MODEL') or os.getenv('OPENAI_MODEL') or 'gpt-4.1-mini'
        elif greenpt_api_key:
            api_key = greenpt_api_key
            base_url = os.getenv('A2A_LLM_BASE_URL') or 'https://api.greenpt.ai/v1'
            self.model = os.getenv('A2A_LLM_MODEL') or 'gemma4'
        elif openai_api_key:
            api_key = openai_api_key
            base_url = os.getenv('A2A_LLM_BASE_URL') or os.getenv('OPENAI_BASE_URL')
            self.model = os.getenv('A2A_LLM_MODEL') or os.getenv('OPENAI_MODEL') or 'gpt-4.1-mini'
        else:
            raise RuntimeError(
                'Set A2A_LLM_API_KEY, GREENPT_API_KEY, or OPENAI_API_KEY before starting the A2A server.'
            )

        self.client = AsyncOpenAI(
            api_key=api_key,
            base_url=base_url,
        )

    async def invoke(
        self,
        messages: list[dict[str, Any]],
        tools: list[dict[str, Any]] | None = None,
    ):
        """Send messages to the configured LLM and return the raw response."""
        kwargs: dict[str, Any] = {'model': self.model, 'messages': messages}
        if tools:
            kwargs['tools'] = tools
            kwargs['tool_choice'] = 'auto'
        return await self.client.chat.completions.create(**kwargs)


_DATA_FILE = Path(__file__).parent / 'data' / 'belastingdienst.jsonl'


def _format_demo_address(address: Any) -> str:
    if not isinstance(address, dict):
        return str(address or '')

    street = address.get('straat', '')
    number = address.get('huisnummer', '')
    postcode = address.get('postcode', '')
    city = address.get('woonplaats', '')
    return ' '.join(part for part in (f'{street} {number}'.strip(), postcode, city) if part)


def _demo_response_rows(payload: Any) -> list[dict[str, str]]:
    if not isinstance(payload, dict):
        return []

    if isinstance(payload.get('brieven'), list):
        brieven = payload['brieven']
    elif isinstance(payload.get('afwijkende_brieven'), list):
        brieven = [
            item['brief'] if isinstance(item, dict) and isinstance(item.get('brief'), dict) else item
            for item in payload['afwijkende_brieven']
        ]
    else:
        return []

    rows = []
    for brief in brieven:
        if not isinstance(brief, dict):
            continue
        rows.append(
            {
                'brief_code': str(brief.get('brief_code', '')),
                'verzonden_op': str(brief.get('verzonden_op', '')),
                'adres': _format_demo_address(brief.get('adres')),
            }
        )
    return rows


def _format_demo_response_table(text: str) -> str:
    try:
        payload = json.loads(text)
    except json.JSONDecodeError:
        return text

    rows = _demo_response_rows(payload)
    if not rows:
        if isinstance(payload, dict) and payload.get('message'):
            return str(payload['message'])
        return '(no brieven)'

    headers = ('brief_code', 'verzonden_op', 'adres')
    widths = {
        header: max(len(header), *(len(row[header]) for row in rows))
        for header in headers
    }
    header_row = ' | '.join(header.ljust(widths[header]) for header in headers)
    separator = '-+-'.join('-' * widths[header] for header in headers)
    data_rows = [
        ' | '.join(row[header].ljust(widths[header]) for header in headers)
        for row in rows
    ]

    return '\n'.join([header_row, separator, *data_rows])


def _format_demo_message(text: str) -> str:
    """Pretty-print JSON log bodies while keeping plain text readable."""
    if not text:
        return '(empty)'

    try:
        parsed = json.loads(text)
    except json.JSONDecodeError:
        return text

    return json.dumps(parsed, indent=2, ensure_ascii=False)


def _print_demo_message(title: str, text: str, *, compact_response: bool = False) -> None:
    print(f'\n=== A2A {title} ===', flush=True)
    if compact_response:
        print(_format_demo_response_table(text), flush=True)
        return

    print(_format_demo_message(text), flush=True)


class BelastingdienstAgentExecutor(AgentExecutor):
    """AgentExecutor for querying Belastingdienst correspondence via LLM tool-calling."""

    def __init__(self) -> None:
        self.agent = GreenPTAgent()
        self.brieven = BriefRepository(_DATA_FILE)

    def _dispatch_tool(self, name: str, args: dict[str, Any]) -> list[dict[str, Any]]:
        """Call the appropriate BriefRepository method and return serialisable results."""
        repo = self.brieven
        if name == 'get_by_bsn':
            results = repo.get_by_bsn(args['bsn'])
        elif name == 'get_by_id':
            brief = repo.get_by_id(args['brief_id'])
            results = [brief] if brief else []
        elif name == 'get_requiring_action':
            results = repo.get_requiring_action(args['bsn'])
        elif name == 'get_by_type':
            results = repo.get_by_type(args['bsn'], args['brief_type'])
        elif name == 'get_by_brief_code':
            results = repo.get_by_brief_code(args['bsn'], args['brief_code'])
        elif name == 'check_address_mismatch':
            mismatch_result = repo.check_address_mismatch(
                args['bsn'], args['postcode'], args['huisnummer']
            )
            return [mismatch_result.model_dump(mode='json')]
        else:
            results = []
        return [b.model_dump(mode='json') for b in results]

    async def execute(
        self,
        context: RequestContext,
        event_queue: EventQueue,
    ) -> None:
        """Process a JSON query request using LLM tool-calling."""
        # 1. Collect or create the task
        if context.current_task:
            task = context.current_task
        else:
            task = new_task_from_user_message(context.message)
            await event_queue.enqueue_event(task)

        task_updater = TaskUpdater(
            event_queue=event_queue, task_id=task.id, context_id=task.context_id
        )
        await task_updater.update_status(
            state=TaskState.TASK_STATE_WORKING,
            message=new_text_message('Verzoek wordt verwerkt...'),
        )

        # 2. Parse incoming message — expect JSON {"bsn": "...", "query": "..."}
        raw = get_message_text(context.message) or ''
        _print_demo_message('REQUEST', raw)
        try:
            payload = json.loads(raw)
            bsn = payload.get('bsn', '')
            query = payload.get('query', raw)
        except (json.JSONDecodeError, AttributeError):
            bsn = ''
            query = raw

        user_content = f'BSN: {bsn}\nVraag: {query}' if bsn else query

        # 3. First LLM call with tools
        messages: list[dict[str, Any]] = [
            {'role': 'system', 'content': _SYSTEM_PROMPT},
            {'role': 'user', 'content': user_content},
        ]
        response = await self.agent.invoke(messages=messages, tools=_TOOLS)
        choice = response.choices[0]

        # 4. Dispatch all tool calls (may be multiple)
        all_results: list[dict[str, Any]] = []
        called_tools: set[str] = set()
        if choice.finish_reason == 'tool_calls' and choice.message.tool_calls:
            for tool_call in choice.message.tool_calls:
                fn_name = tool_call.function.name
                fn_args = json.loads(tool_call.function.arguments)
                called_tools.add(fn_name)
                all_results.extend(self._dispatch_tool(fn_name, fn_args))

            if 'check_address_mismatch' in called_tools:
                # Emit the dedicated mismatch shape
                mismatch_data = next(r for r in all_results if 'mismatch' in r)
                result = json.dumps(mismatch_data, ensure_ascii=False)
            else:
                # Deduplicate brieven by id while preserving order
                seen: set[str] = set()
                unique_brieven = []
                for b in all_results:
                    if b['id'] not in seen:
                        seen.add(b['id'])
                        unique_brieven.append(b)
                result = json.dumps({'brieven': unique_brieven, 'count': len(unique_brieven)}, ensure_ascii=False)
        else:
            # LLM responded without tool use — wrap text response
            text = choice.message.content or ''
            result = json.dumps({'brieven': [], 'count': 0, 'message': text}, ensure_ascii=False)

        _print_demo_message('RESPONSE', result, compact_response=True)

        # 5. Emit JSON artifact and mark completed
        await task_updater.add_artifact(parts=[new_text_part(text=result, media_type='application/json')])
        await task_updater.update_status(
            state=TaskState.TASK_STATE_COMPLETED,
            message=new_text_message('Verzoek afgerond.'),
        )

    async def cancel(self, context: RequestContext, event_queue: EventQueue) -> None:
        raise NotImplementedError('Cancel is not supported.')

    # --8<-- [end:HelloWorldAgentExecutor_cancel]
