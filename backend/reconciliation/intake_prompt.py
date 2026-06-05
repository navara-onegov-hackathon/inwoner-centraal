import json
from typing import Any

from .config_registry import load_agent_registry, load_api_registry, load_process_registry


def build_system_prompt() -> str:
    apis = _prompt_api_registry()
    agents = load_agent_registry()
    return (
        'You determine which processes are relevant for a deceased person\'s case.\n\n'
        'You will receive:\n'
        '- current known case information\n'
        '- a list of possible processes\n'
        '- available REST APIs with their OpenAPI endpoints\n'
        '- available agent-to-agent endpoints\n\n'
        'Your job:\n'
        '- determine the basic case information first and register it through set_user_info\n'
        '- determine which processes are relevant and which are irrelevant\n'
        '- use the available APIs to gather the information needed to decide that\n'
        '- retrieve Belastingdienst letters through the available A2A endpoint and use them to determine additional processes\n'
        '- match required data for handling a process against the provided case data and data available from APIs\n'
        '- when information or user choices cannot be determined automatically, generate an ag-ui form\n'
        '- register every relevant process through register_process tool calls\n'
        '- call complete_discovery after user info and all relevant processes have been registered\n\n'
        'Do not invent APIs, endpoints, fields, processes, or facts. Use the available tools.\n'
        'Do not register irrelevant processes.\n'
        'Use emit_progress for concrete Dutch progress lines that mention the organisation or source being checked.\n\n'
        f'Available REST APIs:\n{json.dumps(apis, ensure_ascii=False, indent=2)}\n\n'
        f'Available A2A endpoints:\n{json.dumps(agents, ensure_ascii=False, indent=2)}'
    )


def build_user_prompt(
    *,
    deceased_bsn: str,
    assistance: str,
    known_case_information: dict[str, Any],
    stored_case_data: dict[str, Any],
    completed_task_ids: set[str],
) -> str:
    payload = {
        'deceased_bsn': deceased_bsn,
        'assistance': assistance,
        'known_case_information': known_case_information,
        'stored_case_data': stored_case_data,
        'completed_task_ids': sorted(completed_task_ids),
        'possible_processes': load_process_registry(),
    }
    return (
        'Current runtime discovery input:\n'
        f'{json.dumps(payload, ensure_ascii=False, indent=2)}\n\n'
        'Determine the base user/case information first and call set_user_info.\n'
        'Then determine which processes are relevant for this case.\n'
        'Use the available APIs and A2A endpoint(s).\n'
        'Register each relevant process with register_process tool calls.\n'
        'If required information or a user choice is missing and cannot be determined automatically, generate an ag-ui form.\n'
        'Finish with complete_discovery.'
    )


def _prompt_api_registry() -> list[dict[str, str]]:
    return [
        {
            'id': api['id'],
            'name': api['name'],
            'description': api['description'],
            'base_url': api['base_url'],
            'openapi_url': api['openapi_url'],
        }
        for api in load_api_registry()
    ]
