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
]


class GreenPTAgent:
    """LLM Agent powered by GreenPT (gemma4)."""

    def __init__(self) -> None:
        self.client = AsyncOpenAI(
            api_key=os.getenv('GREENPT_API_KEY'),
            base_url='https://api.greenpt.ai/v1',
        )

    async def invoke(
        self,
        messages: list[dict[str, Any]],
        tools: list[dict[str, Any]] | None = None,
    ):
        """Send messages to the GreenPT LLM and return the raw response."""
        kwargs: dict[str, Any] = {'model': 'gemma4', 'messages': messages}
        if tools:
            kwargs['tools'] = tools
            kwargs['tool_choice'] = 'auto'
        return await self.client.chat.completions.create(**kwargs)


_DATA_FILE = Path(__file__).parent / 'data' / 'belastingdienst.jsonl'


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
        all_brieven: list[dict[str, Any]] = []
        if choice.finish_reason == 'tool_calls' and choice.message.tool_calls:
            for tool_call in choice.message.tool_calls:
                fn_name = tool_call.function.name
                fn_args = json.loads(tool_call.function.arguments)
                all_brieven.extend(self._dispatch_tool(fn_name, fn_args))
            # Deduplicate by id while preserving order
            seen: set[str] = set()
            unique_brieven = []
            for b in all_brieven:
                if b['id'] not in seen:
                    seen.add(b['id'])
                    unique_brieven.append(b)
            result = json.dumps({'brieven': unique_brieven, 'count': len(unique_brieven)}, ensure_ascii=False)
        else:
            # LLM responded without tool use — wrap text response
            text = choice.message.content or ''
            result = json.dumps({'brieven': [], 'count': 0, 'message': text}, ensure_ascii=False)

        # 5. Emit JSON artifact and mark completed
        await task_updater.add_artifact(parts=[new_text_part(text=result, media_type='application/json')])
        await task_updater.update_status(
            state=TaskState.TASK_STATE_COMPLETED,
            message=new_text_message('Verzoek afgerond.'),
        )

    async def cancel(self, context: RequestContext, event_queue: EventQueue) -> None:
        raise NotImplementedError('Cancel is not supported.')

    # --8<-- [end:HelloWorldAgentExecutor_cancel]
