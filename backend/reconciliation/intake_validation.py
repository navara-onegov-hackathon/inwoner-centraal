from typing import Any

from .config_registry import load_process_registry


def build_overview_from_agent_output(
    *,
    user_info: dict[str, Any],
    processes: list[dict[str, Any]],
    completed_task_ids: set[str],
) -> dict[str, Any]:
    validated_processes = [_validate_process(process) for process in processes]
    taken = [_process_to_taak(process, completed_task_ids) for process in validated_processes]

    return {
        'general_information': _general_information(user_info),
        'processes': [_public_process(process) for process in validated_processes],
        'persona': _persona(user_info),
        'samenvatting': {
            'actie_van_u': 0,
            'op_achtergrond': 0,
            'geregeld_door_ons': 0,
            'wachten_op_organisatie': 0,
            'afgerond': 0,
        },
        'regelingen': [],
        'agentstappen': [],
        'taken': taken,
        'verwacht_binnenkort': [],
        'geen_actie_nodig': [],
        'correspondentie': [],
        'verplichtingen': [],
        'rechten': [],
    }


def _validate_process(process: dict[str, Any]) -> dict[str, Any]:
    required = ['id', 'organisation', 'title', 'summary', 'state', 'handled_by', 'reason']
    missing = [field for field in required if not process.get(field)]
    if missing:
        raise ValueError(f"Registered process {process.get('id') or '<unknown>'} misses fields: {', '.join(missing)}")
    if process['state'] not in {'open', 'blocked', 'done', 'pending'}:
        raise ValueError(f"Invalid state for process {process['id']}: {process['state']}")
    if process['handled_by'] not in {'you', 'us'}:
        raise ValueError(f"Invalid handled_by for process {process['id']}: {process['handled_by']}")
    if process.get('deadline') and process.get('urgent'):
        raise ValueError(f"Process {process['id']} has both deadline and urgent.")
    if process['state'] == 'blocked' and not process.get('blocked_reason'):
        raise ValueError(f"Blocked process {process['id']} requires blocked_reason.")
    if process.get('form'):
        _validate_ag_ui_form(process['id'], process['form'])
    return dict(process)


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


def _process_to_taak(process: dict[str, Any], completed_task_ids: set[str]) -> dict[str, Any]:
    state = 'done' if process['id'] in completed_task_ids else process['state']
    deadline = process.get('deadline') or None
    urgent = True if process.get('urgent') and not deadline else None
    payment_button_required = _process_policy(process['id']).get('payment_button_required') is True
    action_type = _action_type(process, payment_button_required)
    return {
        'id': process['id'],
        'titel': process['title'],
        'samenvatting': process['summary'],
        'organisatie': process['organisation'],
        'status': 'in_behandeling' if state in {'done', 'pending'} else 'actie_nodig',
        'deadline': deadline,
        'urgent': urgent,
        'bedrag': _amount(process.get('amount')),
        'handeling_door_nabestaande': process['handled_by'] == 'you',
        'handled_by': process['handled_by'],
        'state': state,
        'actie_type': action_type,
        'toon_cta_in_lijst': state == 'open',
        'cta_label': process.get('cta_label') or _cta_label_for(action_type),
        'blocked_reason': process.get('blocked_reason') or None,
        'available_from': process.get('available_from') or None,
        'bron_brief_ids': _evidence_refs(process, 'brief'),
        'bron_verplichting_ids': _evidence_refs(process, 'obligation'),
        'form': _task_form(process, state, payment_button_required),
        'resolution_options': [] if state == 'done' else process.get('resolution_options') or [],
    }


def _public_process(process: dict[str, Any]) -> dict[str, Any]:
    payment_button_required = _process_policy(process['id']).get('payment_button_required') is True
    public = {
        'id': process['id'],
        'title': process['title'],
        'description': process['summary'],
        'organisation': process['organisation'],
        'state': process['state'],
        'handled_by': process['handled_by'],
        'evidence': {'items': process.get('evidence') or []},
        'form': _task_form(process, process['state'], payment_button_required),
    }
    if process.get('deadline'):
        public['deadline'] = process['deadline']
    elif process.get('urgent'):
        public['urgent'] = True
    if process.get('blocked_reason'):
        public['blocked_reason'] = process['blocked_reason']
    if process.get('available_from'):
        public['available_from'] = process['available_from']
    return public


def _general_information(user_info: dict[str, Any]) -> dict[str, Any]:
    return {
        'deceased': user_info.get('deceased') or {},
        'partner': user_info.get('surviving_partner') or {},
        'relationship': user_info.get('relationship') or {},
    }


def _persona(user_info: dict[str, Any]) -> dict[str, Any]:
    deceased = user_info.get('deceased') or {}
    partner = user_info.get('surviving_partner') or {}
    notices = user_info.get('notices') or []
    return {
        'nabestaande': _name(partner) or 'Nabestaande',
        'overledene': _name(deceased) or 'Overledene',
        'overlijdensdatum': deceased.get('date_of_death') or deceased.get('overlijdensdatum') or '',
        'postadres_alert': ' '.join(notices) or None,
        'postadres_cta_label': 'Postadres controleren' if notices else None,
    }


def _name(value: dict[str, Any]) -> str:
    return (
        value.get('name')
        or value.get('naam')
        or ' '.join(part for part in [value.get('voornamen'), value.get('geslachtsnaam')] if part)
    )




def _amount(value):
    if not value:
        return None
    return {
        'bedrag': str(value.get('amount') or value.get('bedrag') or ''),
        'valuta': value.get('currency') or value.get('valuta') or 'EUR',
    }


def _action_type(process: dict[str, Any], payment_button_required: bool):
    if payment_button_required:
        return 'betalen'
    return process.get('action_type') if process.get('action_type') in {'betalen', 'tekenen', 'indienen', 'bevestigen'} else None


def _task_form(process: dict[str, Any], state: str, payment_button_required: bool):
    if state == 'done':
        return None
    if payment_button_required:
        base = process.get('form') or {}
        return {
            'id': base.get('id') or f"{process['id']}-betalen",
            'title': base.get('title') or process['title'],
            'description': base.get('description') or 'Gebruik deze knop om verder te gaan.',
            'submit_label': 'Betalen',
            'fields': [],
            **({'meta': base['meta']} if isinstance(base.get('meta'), dict) else {}),
        }
    return process.get('form')


def _process_policy(process_id: str) -> dict[str, Any]:
    return next((process for process in load_process_registry() if process['id'] == process_id), {})


def _evidence_refs(process: dict[str, Any], expected_type: str) -> list[str]:
    refs = []
    for item in process.get('evidence') or []:
        source_type = (item.get('source_type') or '').lower()
        if expected_type in source_type:
            refs.append(item.get('reference') or '')
    return [ref for ref in refs if ref]


def _cta_label_for(action_type):
    mapping = {
        'betalen': 'Nu betalen',
        'indienen': 'Aangifte starten',
        'tekenen': 'Ondertekenen',
        'bevestigen': 'Bekijk details',
    }
    return mapping.get(action_type, 'Bekijk details')
