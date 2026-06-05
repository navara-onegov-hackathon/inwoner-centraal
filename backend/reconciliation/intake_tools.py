import json
from dataclasses import dataclass, field
from typing import Any

from .a2a_client import call_a2a_agent as call_belastingdienst_agent
from .api_tools import call_api, discover_api
from .config_registry import load_active_process_registry, load_process_registry


@dataclass
class IntakeAgentState:
    user_info: dict[str, Any] | None = None
    processes: list[dict[str, Any]] = field(default_factory=list)
    irrelevant_processes: list[dict[str, Any]] = field(default_factory=list)
    progress: list[str] = field(default_factory=list)
    complete: bool = False


def build_openai_tools() -> list[dict[str, Any]]:
    return [
        _tool('emit_progress', 'Emit a concrete user-facing progress line for the SSE log.', {
            'type': 'object',
            'properties': {
                'message': {
                    'type': 'string',
                    'description': (
                        'Concrete Dutch progress message for citizens. Use neutral wording like '
                        '"Controle bij RDW: voertuiggegevens ophalen." Do not mention AI, agents, tools, '
                        'OpenAPI, or first-person wording such as "Ik controleer bij ...".'
                    ),
                },
            },
            'required': ['message'],
            'additionalProperties': False,
        }),
        _tool('discover_api', 'Return the complete OpenAPI JSON document for a configured API.', {
            'type': 'object',
            'properties': {
                'api': {
                    'type': 'string',
                    'description': 'Configured API id, for example cak, rdw, or svb.',
                },
            },
            'required': ['api'],
            'additionalProperties': False,
        }),
        _tool('call_api', 'Call a concrete REST endpoint selected by the agent from an OpenAPI document.', {
            'type': 'object',
            'properties': {
                'method': {'type': 'string', 'enum': ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']},
                'url': {
                    'type': 'string',
                    'description': 'Absolute URL under a configured API base URL, or /<api-id>/<path> for a configured API.',
                },
                'body': {
                    'type': ['object', 'null'],
                    'description': 'JSON request body when needed. Use null for endpoints without a body.',
                },
                'headers': {
                    'type': ['object', 'null'],
                    'additionalProperties': {'type': 'string'},
                },
            },
            'required': ['method', 'url'],
            'additionalProperties': False,
        }),
        _tool('call_a2a_agent', 'Call a configured agent-to-agent endpoint.', {
            'type': 'object',
            'properties': {
                'agent': {
                    'type': 'string',
                    'description': 'Configured A2A agent id, for example belastingdienst_brieven.',
                },
                'input': {
                    'type': 'object',
                    'description': 'Agent input. For belastingdienst_brieven use bsn and query.',
                    'properties': {
                        'bsn': {'type': 'string'},
                        'query': {'type': 'string'},
                    },
                    'required': ['bsn', 'query'],
                    'additionalProperties': True,
                },
            },
            'required': ['agent', 'input'],
            'additionalProperties': False,
        }),
        _tool('set_user_info', 'Register the basic user and case information for the intake UI.', _user_info_schema()),
        _tool('register_process', 'Register one relevant process. Irrelevant processes must not be registered.', _process_schema()),
        _tool(
            'mark_process_irrelevant',
            'Mark one configured process as checked and not relevant. Use this for every configured process that does not apply.',
            _irrelevant_process_schema(),
        ),
        _tool('complete_discovery', 'Mark discovery complete after user info and all relevant processes have been registered.', {
            'type': 'object',
            'properties': {
                'summary': {'type': 'string'},
                'process_count': {'type': 'integer'},
            },
            'required': [],
            'additionalProperties': False,
        }),
    ]


def dispatch_tool(name: str, arguments: dict[str, Any], state: IntakeAgentState):
    if name == 'emit_progress':
        message = arguments['message']
        state.progress.append(message)
        return {'ok': True, 'message': message}

    if name == 'discover_api':
        return discover_api(arguments['api'])

    if name == 'call_api':
        return call_api(
            arguments['method'],
            arguments['url'],
            arguments.get('body'),
            arguments.get('headers'),
        )

    if name == 'call_a2a_agent':
        if arguments['agent'] != 'belastingdienst_brieven':
            raise ValueError(f"Unknown A2A agent id: {arguments['agent']}")
        payload = arguments['input']
        return call_belastingdienst_agent(payload['query'], payload['bsn'])

    if name == 'set_user_info':
        state.user_info = arguments
        return {'ok': True}

    if name == 'register_process':
        if state.user_info is None:
            raise ValueError('set_user_info must be called before register_process.')
        _validate_deadline_xor_urgent(arguments)
        _validate_process_policy(arguments)
        _upsert_process(state, arguments)
        return {'ok': True, 'registered_process_id': arguments['id']}

    if name == 'mark_process_irrelevant':
        if state.user_info is None:
            raise ValueError('set_user_info must be called before mark_process_irrelevant.')
        _validate_irrelevant_process_id(arguments['id'])
        _upsert_irrelevant_process(state, arguments)
        return {'ok': True, 'irrelevant_process_id': arguments['id']}

    if name == 'complete_discovery':
        if state.user_info is None:
            raise ValueError('set_user_info must be called before complete_discovery.')
        state.complete = True
        return {'ok': True, 'registered_processes': len(state.processes)}

    raise ValueError(f'Unknown tool: {name}')


def tool_result_to_string(result: Any) -> str:
    return json.dumps(result, ensure_ascii=False, default=str)


def _tool(name: str, description: str, parameters: dict[str, Any]) -> dict[str, Any]:
    return {
        'type': 'function',
        'function': {
            'name': name,
            'description': description,
            'parameters': parameters,
        },
    }


def _user_info_schema() -> dict[str, Any]:
    return {
        'type': 'object',
        'properties': {
            'deceased': {'type': 'object', 'additionalProperties': True},
            'surviving_partner': {'type': 'object', 'additionalProperties': True},
            'relationship': {'type': 'object', 'additionalProperties': True},
            'addresses': {'type': 'array', 'items': {'type': 'object', 'additionalProperties': True}},
            'notices': {
                'type': 'array',
                'items': {'type': 'string'},
                'description': (
                    'Actual case alerts for the UI, such as an address mismatch or missing data. '
                    'Do not include runtime settings like the assistance level.'
                ),
            },
        },
        'required': ['deceased'],
        'additionalProperties': True,
    }


def _process_schema() -> dict[str, Any]:
    ag_ui_form_schema = {
        'type': ['object', 'null'],
        'description': 'ag-ui compatible form generated by the agent when missing info or choices are needed.',
        'properties': {
            'id': {'type': 'string'},
            'title': {'type': 'string'},
            'description': {'type': 'string'},
            'submit_label': {'type': 'string'},
            'fields': {
                'type': 'array',
                'items': {
                    'type': 'object',
                    'properties': {
                        'name': {'type': 'string'},
                        'label': {'type': 'string'},
                        'type': {'type': 'string', 'enum': ['text', 'select']},
                        'required': {'type': 'boolean'},
                        'placeholder': {'type': 'string'},
                        'prefill': {'type': 'string'},
                        'options': {
                            'type': 'array',
                            'items': {
                                'type': 'object',
                                'properties': {
                                    'label': {'type': 'string'},
                                    'value': {'type': 'string'},
                                },
                                'required': ['label', 'value'],
                                'additionalProperties': False,
                            },
                        },
                        'show_when': {
                            'type': 'object',
                            'properties': {
                                'field': {'type': 'string'},
                                'equals': {'type': 'string'},
                            },
                            'required': ['field', 'equals'],
                            'additionalProperties': False,
                        },
                        'show_when_all': {
                            'type': 'array',
                            'items': {
                                'type': 'object',
                                'properties': {
                                    'field': {'type': 'string'},
                                    'equals': {'type': 'string'},
                                },
                                'required': ['field', 'equals'],
                                'additionalProperties': False,
                            },
                        },
                    },
                    'required': ['name', 'label', 'type', 'required'],
                    'additionalProperties': True,
                },
            },
            'meta': {'type': 'object', 'additionalProperties': True},
        },
        'required': ['id', 'title', 'description', 'submit_label', 'fields'],
        'additionalProperties': True,
    }
    return {
        'type': 'object',
        'properties': {
            'id': {'type': 'string', 'description': 'Stable process id. Use configured id or dynamic:<source>:<id>.'},
            'organisation': {'type': 'string'},
            'title': {'type': 'string'},
            'summary': {'type': 'string'},
            'state': {'type': 'string', 'enum': ['open', 'blocked', 'done', 'pending']},
            'handled_by': {'type': 'string', 'enum': ['you', 'us']},
            'deadline': {'type': ['string', 'null'], 'description': 'ISO date when a concrete due date is known. Do not also set urgent.'},
            'urgent': {'type': ['boolean', 'null'], 'description': 'True only when no deadline exists but immediate attention is needed.'},
            'blocked_reason': {'type': ['string', 'null']},
            'available_from': {'type': ['string', 'null'], 'description': 'ISO date when a blocked process becomes actionable.'},
            'reason': {'type': 'string', 'description': 'Why this process is relevant.'},
            'evidence': {
                'type': 'array',
                'items': {
                    'type': 'object',
                    'properties': {
                        'source_type': {'type': 'string'},
                        'source_name': {'type': 'string'},
                        'reference': {'type': 'string'},
                        'description': {'type': 'string'},
                    },
                    'required': ['source_type', 'source_name', 'reference'],
                    'additionalProperties': True,
                },
            },
            'action_type': {
                'type': ['string', 'null'],
                'enum': ['betalen', 'tekenen', 'indienen', 'bevestigen', None],
            },
            'cta_label': {'type': ['string', 'null']},
            'amount': {
                'type': ['object', 'null'],
                'properties': {
                    'amount': {'type': 'string'},
                    'currency': {'type': 'string'},
                },
                'required': ['amount', 'currency'],
                'additionalProperties': False,
            },
            'form': {
                **ag_ui_form_schema,
            },
            'resolution_options': {
                'type': ['array', 'null'],
                'items': {'type': 'object', 'additionalProperties': True},
            },
        },
        'required': ['id', 'organisation', 'title', 'summary', 'state', 'handled_by', 'reason'],
        'additionalProperties': True,
    }


def _irrelevant_process_schema() -> dict[str, Any]:
    return {
        'type': 'object',
        'properties': {
            'id': {'type': 'string', 'description': 'Configured process id that was checked.'},
            'organisation': {'type': 'string'},
            'title': {'type': 'string'},
            'reason': {'type': 'string', 'description': 'Why this process is not relevant for this case.'},
            'evidence': {
                'type': 'array',
                'items': {
                    'type': 'object',
                    'properties': {
                        'source_type': {'type': 'string'},
                        'source_name': {'type': 'string'},
                        'reference': {'type': 'string'},
                        'description': {'type': 'string'},
                    },
                    'required': ['source_type', 'source_name', 'reference'],
                    'additionalProperties': True,
                },
            },
        },
        'required': ['id', 'organisation', 'title', 'reason'],
        'additionalProperties': True,
    }


def _validate_deadline_xor_urgent(process: dict[str, Any]):
    if process.get('deadline') and process.get('urgent'):
        raise ValueError('A process may have deadline or urgent, but not both.')


def _validate_process_policy(process: dict[str, Any]):
    if process.get('form'):
        _validate_ag_ui_form(process['id'], process['form'])
    policy = _process_policy(process['id'])
    if not policy:
        return
    if policy.get('skip'):
        raise ValueError(f"Process {process['id']} is skipped for this demo run.")
    if (
        policy.get('requires_form_when_relevant')
        and process.get('state') == 'open'
        and not process.get('form')
    ):
        raise ValueError(
            f"Process {process['id']} requires an agent-generated ag-ui form when relevant."
        )
    if (
        policy.get('requires_resolution_options_when_relevant')
        and process.get('state') == 'open'
        and process.get('handled_by') == 'you'
        and not process.get('resolution_options')
        and not process.get('form')
    ):
        raise ValueError(
            f"Process {process['id']} requires resolution options or an ag-ui form when handled by the user."
        )


def _process_policy(process_id: str) -> dict[str, Any] | None:
    return next((process for process in load_process_registry() if process['id'] == process_id), None)


def _validate_irrelevant_process_id(process_id: str):
    policy = _process_policy(process_id)
    active_ids = {process['id'] for process in load_active_process_registry()}
    if not policy:
        raise ValueError(f'Unknown configured process id: {process_id}')
    if process_id not in active_ids:
        raise ValueError(f'Process {process_id} is skipped for this demo run.')
    if policy.get('demo_always_relevant'):
        raise ValueError(f'Process {process_id} is always relevant for this demo and must be registered.')


def _upsert_process(state: IntakeAgentState, process: dict[str, Any]):
    state.processes = [existing for existing in state.processes if existing.get('id') != process['id']]
    state.processes.append(process)


def _upsert_irrelevant_process(state: IntakeAgentState, process: dict[str, Any]):
    state.irrelevant_processes = [
        existing for existing in state.irrelevant_processes if existing.get('id') != process['id']
    ]
    state.irrelevant_processes.append(process)


def _validate_ag_ui_form(process_id: str, form: dict[str, Any]):
    for field in ['id', 'title', 'description', 'submit_label', 'fields']:
        if not form.get(field):
            raise ValueError(f'Form for {process_id} misses {field}.')
    if not isinstance(form['fields'], list):
        raise ValueError(f'Form for {process_id} has non-list fields.')
    for field in form['fields']:
        for required in ['name', 'label', 'type', 'required']:
            if required not in field:
                raise ValueError(f"Form field for {process_id} misses {required}.")
