import json
from typing import Any

from .config_registry import load_active_process_registry, load_agent_registry, load_api_registry


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
        '- always retrieve Belastingdienst letters through call_a2a_agent exactly once before completing discovery\n'
        '- always inspect every available REST API OpenAPI document exactly once before completing discovery\n'
        '- after inspecting each OpenAPI document, call concrete data endpoints from every API before deciding process relevance\n'
        '- determine which processes are relevant and which are irrelevant\n'
        '- use the available APIs to gather the information needed to decide that\n'
        '- use Belastingdienst letters to determine additional processes\n'
        '- match required data for handling a process against the provided case data and data available from APIs\n'
        '- when information or user choices cannot be determined automatically, generate an ag-ui form\n'
        '- register every relevant process through register_process tool calls\n'
        '- mark every irrelevant configured process through mark_process_irrelevant tool calls\n'
        '- call complete_discovery after user info and every configured process has been registered or marked irrelevant\n\n'
        'Do not invent APIs, endpoints, fields, processes, or facts. Use the available tools.\n'
        'Do not register irrelevant processes.\n'
        'Do not omit irrelevant active processes: every active process must be checked and marked irrelevant when it does not apply.\n'
        'Processes with skip=true are intentionally outside this demo run and are not included in the active list.\n'
        'Processes with demo_always_relevant=true must be registered as relevant without an external applicability check.\n'
        'Other non-challenge demo processes default to not applicable unless discovered data explicitly makes them relevant.\n'
        'Use emit_progress for concrete Dutch progress lines that mention the organisation or source being checked.\n'
        'Progress lines are shown to citizens, so never mention AI, agents, LLMs, tools, OpenAPI, or internal implementation.\n'
        'Write progress lines in a neutral style like "Controle bij RDW: voertuiggegevens ophalen." '
        'Do not write first-person messages like "Ik controleer bij ...".\n'
        'Do not call register_process or mark_process_irrelevant until concrete data endpoints have been called for every available API.\n'
        'For the same input, follow the same source order: set_user_info, Belastingdienst A2A, discover APIs, call concrete API data endpoints, register relevant and demo-always-relevant processes, mark irrelevant active processes, complete_discovery.\n\n'
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
        'possible_processes': load_active_process_registry(),
    }
    return (
        'Current runtime discovery input:\n'
        f'{json.dumps(payload, ensure_ascii=False, indent=2)}\n\n'
        'Determine the base user/case information first and call set_user_info.\n'
        'Then determine which processes are relevant for this case.\n'
        'Use the available APIs and A2A endpoint(s), including the Belastingdienst letters endpoint.\n'
        'Call concrete data endpoints from each available API before deciding which processes apply.\n'
        'Register each relevant process with register_process tool calls.\n'
        'Mark each irrelevant active process with mark_process_irrelevant tool calls.\n'
        'If required information or a user choice is missing and cannot be determined automatically, generate an ag-ui form.\n'
        'Finish with complete_discovery only after every active process id is accounted for.'
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
