import json
from dataclasses import dataclass, field
from typing import Any

from .a2a_client import call_a2a_agent as call_belastingdienst_agent
from .api_tools import call_api, discover_api
from .config_registry import load_active_process_registry, load_process_registry


@dataclass
class IntakeAgentState:
    assistance: str = 'max'
    user_info: dict[str, Any] | None = None
    processes: list[dict[str, Any]] = field(default_factory=list)
    irrelevant_processes: list[dict[str, Any]] = field(default_factory=list)
    progress: list[str] = field(default_factory=list)
    complete: bool = False


def build_openai_tools() -> list[dict[str, Any]]:
    return [
        _tool('emit_progress', 'Geef een concrete voortgangsregel voor de gebruiker.', {
            'type': 'object',
            'properties': {
                'message': {
                    'type': 'string',
                    'description': (
                        'Concrete Nederlandse voortgangsregel voor burgers. Gebruik neutrale tekst zoals '
                        '"Controle bij RDW: voertuiggegevens ophalen." Noem geen AI, agents, tools, '
                        'OpenAPI of eerste persoon zoals "Ik controleer bij ...".'
                    ),
                },
            },
            'required': ['message'],
            'additionalProperties': False,
        }),
        _tool('discover_api', 'Haal het volledige OpenAPI JSON-document op voor een geconfigureerde API.', {
            'type': 'object',
            'properties': {
                'api': {
                    'type': 'string',
                    'description': 'Geconfigureerde API-id, bijvoorbeeld cak, rdw of svb.',
                },
            },
            'required': ['api'],
            'additionalProperties': False,
        }),
        _tool('call_api', 'Roep een concreet REST-endpoint aan dat uit een OpenAPI-document is gekozen.', {
            'type': 'object',
            'properties': {
                'method': {'type': 'string', 'enum': ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']},
                'url': {
                    'type': 'string',
                    'description': 'Absolute URL onder een geconfigureerde API-base-URL, of /<api-id>/<pad>.',
                },
                'body': {
                    'type': ['object', 'null'],
                    'description': 'JSON-body als die nodig is. Gebruik null voor endpoints zonder body.',
                },
                'headers': {
                    'type': ['object', 'null'],
                    'additionalProperties': {'type': 'string'},
                },
            },
            'required': ['method', 'url'],
            'additionalProperties': False,
        }),
        _tool('call_a2a_agent', 'Roep een geconfigureerde agent-naar-agent-koppeling aan.', {
            'type': 'object',
            'properties': {
                'agent': {
                    'type': 'string',
                    'description': 'Geconfigureerde A2A-id, bijvoorbeeld belastingdienst_brieven.',
                },
                'input': {
                    'type': 'object',
                    'description': 'Invoer voor de koppeling. Gebruik voor belastingdienst_brieven bsn en query.',
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
        _tool('set_user_info', 'Leg de basisgegevens voor de intake vast.', _user_info_schema()),
        _tool('register_process', 'Registreer één relevant proces. Registreer irrelevante processen niet hiermee.', _process_schema()),
        _tool(
            'mark_process_irrelevant',
            'Markeer één actief proces als gecontroleerd en niet relevant.',
            _irrelevant_process_schema(),
        ),
        _tool('complete_discovery', 'Rond af nadat basisgegevens en alle actieve processen zijn verantwoord.', {
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
        _validate_process_policy(arguments, state)
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
            'id': {'type': 'string', 'description': 'Stabiele proces-id. Gebruik de geconfigureerde id of dynamic:<bron>:<id>.'},
            'organisation': {'type': 'string'},
            'title': {'type': 'string'},
            'summary': {'type': 'string'},
            'state': {'type': 'string', 'enum': ['open', 'blocked', 'pending']},
            'handled_by': {'type': 'string', 'enum': ['you', 'us']},
            'deadline': {'type': ['string', 'null'], 'description': 'ISO-datum als een concrete deadline bekend is. Gebruik niet tegelijk urgent.'},
            'urgent': {'type': ['boolean', 'null'], 'description': 'Alleen true als er geen deadline is maar direct aandacht nodig is.'},
            'blocked_reason': {'type': ['string', 'null']},
            'available_from': {'type': ['string', 'null'], 'description': 'ISO-datum waarop een geblokkeerd proces beschikbaar wordt.'},
            'reason': {'type': 'string', 'description': 'Waarom dit proces relevant is, in duidelijke Nederlandse tekst.'},
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


def _validate_process_policy(process: dict[str, Any], state: IntakeAgentState):
    if process.get('state') == 'done':
        raise ValueError(
            f"Process {process['id']} may not be done during intake discovery. "
            'The intake agent discovers tasks but does not complete them.'
        )
    if process.get('state') == 'blocked' and not process.get('blocked_reason'):
        raise ValueError(f"Blocked process {process['id']} requires blocked_reason.")
    if process.get('form') and process.get('handled_by') != 'you':
        raise ValueError(
            f"Process {process['id']} needs user input and must be handled_by you."
        )
    if process.get('amount') and process.get('handled_by') != 'you':
        raise ValueError(
            f"Step {process['id']} has an amount and must be handled_by you."
        )
    if process.get('form'):
        _validate_ag_ui_form(process['id'], process['form'])
    policy = _process_policy(process['id'])
    if not policy:
        return
    if policy.get('form_contract') and process.get('form'):
        _validate_form_contract(process['id'], process['form'], policy['form_contract'])
    if policy.get('skip'):
        raise ValueError(f"Process {process['id']} is skipped for this demo run.")
    if policy.get('agent_handles_when_assistance_max') and state.assistance == 'max':
        if process.get('handled_by') != 'us' or process.get('state') != 'pending':
            raise ValueError(
                f"Process {process['id']} must be handled_by us with state pending when assistance is max."
            )
    if policy.get('payment_button_required') and process.get('handled_by') != 'you':
        raise ValueError(f"Step {process['id']} with a Betalen button must be handled_by you.")
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
        if field not in form or form.get(field) is None:
            raise ValueError(f'Form for {process_id} misses {field}.')
        if field != 'fields' and form.get(field) == '':
            raise ValueError(f'Form for {process_id} misses {field}.')
    if not isinstance(form['fields'], list):
        raise ValueError(f'Form for {process_id} has non-list fields.')
    for field in form['fields']:
        for required in ['name', 'label', 'type', 'required']:
            if required not in field:
                raise ValueError(f"Form field for {process_id} misses {required}.")


def _validate_form_contract(process_id: str, form: dict[str, Any], contract: dict[str, Any]):
    fields = form.get('fields') or []
    fields_by_name = {field.get('name'): field for field in fields}
    choice = contract.get('choice_field') or {}
    conditional_fields = contract.get('conditional_fields') or []
    expected_names = {choice.get('name'), *(field.get('name') for field in conditional_fields)}
    actual_names = set(fields_by_name)

    if actual_names != expected_names:
        raise ValueError(
            f"Form for {process_id} must contain exactly these fields: {', '.join(sorted(expected_names))}."
        )

    choice_field = fields_by_name.get(choice.get('name'))
    if not choice_field:
        raise ValueError(f"Form for {process_id} misses choice field {choice.get('name')}.")
    if choice_field.get('type') != choice.get('type') or choice_field.get('required') is not True:
        raise ValueError(
            f"Choice field {choice.get('name')} for {process_id} must be a required {choice.get('type')} field."
        )

    actual_options = {
        option.get('value'): option.get('label')
        for option in choice_field.get('options') or []
    }
    expected_options = {
        option.get('value'): option.get('label')
        for option in choice.get('options') or []
    }
    if actual_options != expected_options:
        raise ValueError(
            f"Choice field {choice.get('name')} for {process_id} must use the configured option labels and values."
        )

    for expected in conditional_fields:
        field = fields_by_name.get(expected.get('name'))
        if not field:
            raise ValueError(f"Form for {process_id} misses conditional field {expected.get('name')}.")
        if field.get('type') != expected.get('type') or field.get('required') is not True:
            raise ValueError(
                f"Conditional field {expected.get('name')} for {process_id} must be a required {expected.get('type')} field."
            )
        if expected.get('label') and field.get('label') != expected.get('label'):
            raise ValueError(
                f"Conditional field {expected.get('name')} for {process_id} must use label {expected.get('label')}."
            )
        if expected.get('options') is not None:
            actual_options = {
                option.get('value'): option.get('label')
                for option in field.get('options') or []
            }
            expected_options = {
                option.get('value'): option.get('label')
                for option in expected.get('options') or []
            }
            if actual_options != expected_options:
                raise ValueError(
                    f"Conditional field {expected.get('name')} for {process_id} must use the configured option labels and values."
                )
        if field.get('show_when') != expected.get('show_when'):
            raise ValueError(
                f"Conditional field {expected.get('name')} for {process_id} must use the configured show_when condition."
            )
        if expected.get('prefill') is not None and not _field_has_default(form, field, expected):
            raise ValueError(
                f"Conditional field {expected.get('name')} for {process_id} must default to {expected.get('prefill')}."
            )


def _field_has_default(form: dict[str, Any], field: dict[str, Any], expected: dict[str, Any]) -> bool:
    expected_value = str(expected.get('prefill')).lower()
    prefill = field.get('prefill')
    if isinstance(prefill, str) and prefill.lower() == expected_value:
        return True
    defaults = ((form.get('meta') or {}).get('defaults') or {})
    default_value = defaults.get(field.get('name'))
    return isinstance(default_value, str) and default_value.lower() == expected_value
