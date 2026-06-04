import json
from copy import deepcopy
from datetime import date
from pathlib import Path
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import urljoin
from urllib.request import Request, urlopen

from django.conf import settings

from .a2a_client import A2AClientError, call_a2a_agent

_FIXTURE_PATH = (
    Path(__file__).resolve().parents[2] / 'frontend' / 'src' / 'fixtures' / 'truus-cees.json'
)


def _load_fixture() -> dict[str, Any]:
    return json.loads(_FIXTURE_PATH.read_text(encoding='utf-8'))


def _fetch_json(url: str, method: str = 'GET', body: dict[str, Any] | None = None, headers=None):
    payload = json.dumps(body).encode('utf-8') if body is not None else None
    request_headers = {'Accept': 'application/json', **(headers or {})}
    if body is not None:
        request_headers['Content-Type'] = 'application/json'
    request = Request(url, data=payload, method=method, headers=request_headers)
    with urlopen(request, timeout=settings.MOCK_API_TIMEOUT_SECONDS) as response:
        return json.loads(response.read().decode('utf-8'))


def discover_api(api: str) -> dict[str, Any]:
    base_url = _api_registry()[api]
    try:
        return _fetch_json(urljoin(f'{base_url.rstrip("/")}/', 'openapi.json'))
    except (HTTPError, OSError, URLError, TimeoutError) as exc:
        raise RuntimeError(f'OpenAPI discovery failed for {api}: {exc}') from exc


def call_api(
    method: str,
    url: str,
    body: dict[str, Any] | None = None,
    headers: dict[str, str] | None = None,
) -> dict[str, Any] | list[Any] | None:
    try:
        return _fetch_json(url, method=method.upper(), body=body, headers=headers)
    except HTTPError as exc:
        if exc.code == 404:
            return None
        raise RuntimeError(f'API call failed: {method} {url} -> HTTP {exc.code}') from exc
    except (OSError, URLError, TimeoutError) as exc:
        raise RuntimeError(f'API call failed: {method} {url}') from exc


def _api_registry() -> dict[str, str]:
    return {
        'cak': settings.MOCK_CAK_BASE_URL,
        'rdw': settings.MOCK_RDW_BASE_URL,
        'svb': settings.MOCK_SVB_BASE_URL,
    }


def stream_intake_discovery(
    deceased_bsn: str,
    assistance: str,
):
    fixture = _load_fixture()

    yield 'progress', {'line': 'Algemene gegevens verzamelen'}
    general_information = _build_general_information(fixture)

    yield 'tool_call_started', {'tool': 'discover_api', 'api': 'cak'}
    try:
        discover_api('cak')
        yield 'tool_call_finished', {'tool': 'discover_api', 'api': 'cak', 'status': 'ok'}
    except RuntimeError as exc:
        yield 'progress', {'line': f'CAK API-beschrijving niet bereikbaar, demo-informatie blijft leidend ({exc})'}

    yield 'tool_call_started', {'tool': 'call_api', 'api': 'cak', 'operation': 'client + invoices'}
    cak_client = None
    cak_invoices = None
    try:
        cak_client = call_api('GET', f'{settings.MOCK_CAK_BASE_URL}/clienten/{deceased_bsn}')
        cak_invoices = call_api(
            'GET',
            f'{settings.MOCK_CAK_BASE_URL}/clienten/{deceased_bsn}/facturen',
        )
        yield 'tool_call_finished', {'tool': 'call_api', 'api': 'cak', 'status': 'ok'}
    except RuntimeError as exc:
        yield 'progress', {'line': f'CAK niet bereikbaar, we gebruiken demo-informatie ({exc})'}

    yield 'tool_call_started', {'tool': 'discover_api', 'api': 'rdw'}
    try:
        discover_api('rdw')
        yield 'tool_call_finished', {'tool': 'discover_api', 'api': 'rdw', 'status': 'ok'}
    except RuntimeError as exc:
        yield 'progress', {'line': f'RDW API-beschrijving niet bereikbaar, demo-informatie blijft leidend ({exc})'}

    yield 'tool_call_started', {'tool': 'call_api', 'api': 'rdw', 'operation': 'holder vehicles'}
    rdw_vehicles = []
    try:
        rdw_vehicles = call_api(
            'GET',
            f'{settings.MOCK_RDW_BASE_URL}/houders/{deceased_bsn}/voertuigen',
        ) or []
        yield 'tool_call_finished', {'tool': 'call_api', 'api': 'rdw', 'status': 'ok'}
    except RuntimeError as exc:
        yield 'progress', {'line': f'RDW niet bereikbaar, we gebruiken demo-informatie ({exc})'}

    partner_bsn = fixture['overledene']['partner']['bsn']
    yield 'tool_call_started', {'tool': 'discover_api', 'api': 'svb'}
    try:
        discover_api('svb')
        yield 'tool_call_finished', {'tool': 'discover_api', 'api': 'svb', 'status': 'ok'}
    except RuntimeError as exc:
        yield 'progress', {'line': f'SVB API-beschrijving niet bereikbaar, demo-informatie blijft leidend ({exc})'}

    yield 'tool_call_started', {'tool': 'call_api', 'api': 'svb', 'operation': 'partner + uitkeringen'}
    svb_partner = None
    svb_uitkeringen = None
    try:
        svb_partner = call_api('GET', f'{settings.MOCK_SVB_BASE_URL}/partners/{partner_bsn}')
        svb_uitkeringen = call_api(
            'GET',
            f'{settings.MOCK_SVB_BASE_URL}/partners/{partner_bsn}/uitkeringen',
        )
        yield 'tool_call_finished', {'tool': 'call_api', 'api': 'svb', 'status': 'ok'}
    except RuntimeError as exc:
        yield 'progress', {'line': f'SVB niet bereikbaar, we gebruiken demo-informatie ({exc})'}

    yield 'tool_call_started', {'tool': 'call_a2a_agent', 'agent': 'belastingdienst_brieven'}
    a2a_letters = []
    try:
        brieven_result = call_a2a_agent('Geef alle brieven voor dit BSN', deceased_bsn)
        a2a_letters = brieven_result.get('brieven', [])
        yield 'tool_call_finished', {
            'tool': 'call_a2a_agent',
            'agent': 'belastingdienst_brieven',
            'status': 'ok',
            'count': len(a2a_letters),
        }
    except A2AClientError as exc:
        yield 'progress', {'line': f'Belastingdienst-agent niet bereikbaar, we gaan verder zonder extra brieven ({exc})'}

    yield 'progress', {'line': 'Relevante processen bepalen'}
    overview = _build_overview(
        fixture=fixture,
        today=date.today().isoformat(),
        assistance=assistance,
        cak_client=cak_client,
        cak_invoices=cak_invoices,
        rdw_vehicles=rdw_vehicles,
        svb_partner=svb_partner,
        svb_uitkeringen=svb_uitkeringen,
        a2a_letters=a2a_letters,
    )
    overview['general_information'] = general_information
    overview['processes'] = _build_processes(overview)

    yield 'progress', {'line': 'Overzicht klaarzetten'}
    yield 'result', overview


def _build_general_information(fixture: dict[str, Any]) -> dict[str, Any]:
    deceased = fixture['overledene']['overledene']
    partner = fixture['overledene']['partner']
    relationship = fixture['overledene'].get('relatie') or {}
    return {
        'deceased': {
            'bsn': deceased['bsn'],
            'name': f"{deceased['voornamen']} {deceased['geslachtsnaam']}",
            'date_of_death': deceased['overlijdensdatum'],
            'address': deceased['woonadres'],
        },
        'partner': {
            'bsn': partner['bsn'],
            'name': f"{partner['voornamen']} {partner['geslachtsnaam']}",
            'address': partner['woonadres'],
        },
        'relationship': relationship,
    }


def _build_overview(
    *,
    fixture: dict[str, Any],
    today: str,
    assistance: str,
    cak_client: dict[str, Any] | None,
    cak_invoices: dict[str, Any] | None,
    rdw_vehicles: list[dict[str, Any]],
    svb_partner: dict[str, Any] | None,
    svb_uitkeringen: dict[str, Any] | None,
    a2a_letters: list[dict[str, Any]],
) -> dict[str, Any]:
    working = deepcopy(fixture)
    correspondentie = working['correspondentie']
    verplichtingen = working['verplichtingen']
    rechten = working['rechten']

    _apply_cak_live_data(correspondentie, verplichtingen, cak_client, cak_invoices)
    _apply_rdw_live_data(correspondentie, rdw_vehicles)
    _apply_svb_live_data(correspondentie, rechten, svb_partner, svb_uitkeringen, working)
    _append_a2a_letters(correspondentie, a2a_letters)

    taken = _build_taken(correspondentie, verplichtingen, rdw_vehicles, today, assistance)
    regelingen = _build_regelingen(rechten, assistance)
    agentstappen = _build_agentstappen(assistance)
    verwacht = _build_verwacht(rechten)
    geen_actie = _build_geen_actie(correspondentie)

    persona = _build_persona(working, cak_client, rdw_vehicles, a2a_letters)
    samenvatting = {
        'actie_van_u': 0,
        'op_achtergrond': 0,
        'geregeld_door_ons': 0,
        'wachten_op_organisatie': 0,
        'afgerond': 0,
    }

    return {
        'persona': persona,
        'samenvatting': samenvatting,
        'regelingen': regelingen,
        'agentstappen': agentstappen,
        'taken': taken,
        'verwacht_binnenkort': verwacht,
        'geen_actie_nodig': geen_actie,
        'correspondentie': [_map_raw_brief(item) for item in correspondentie],
        'verplichtingen': [_map_raw_verplichting(item) for item in verplichtingen],
        'rechten': [_map_raw_recht(item) for item in rechten],
    }


def _apply_cak_live_data(correspondentie, verplichtingen, cak_client, cak_invoices):
    if not cak_client:
        return

    invoices = (cak_invoices or {}).get('facturen', [])
    failed_invoice = next((invoice for invoice in invoices if invoice.get('status') == 'INCASSO_MISLUKT'), None)
    if failed_invoice and not any(item['id'] == 'live-cak-incasso-mislukt' for item in correspondentie):
        correspondentie.append({
            'id': 'live-cak-incasso-mislukt',
            'organisatie': 'CAK',
            'brief_code': 'CAK.INCASSO-MISLUKT',
            'type': 'informatiebrief',
            'verzonden_op': (failed_invoice.get('factuurdatum') or '')[:10],
            'actie_vereist': True,
            'actie_omschrijving': 'Nieuwe betaalmethode kiezen of handmatig betalen',
            'aanhef': 'Aan de erven van',
            'geadresseerde': 'erven',
            'adres': _mock_address_to_fixture(cak_client.get('correspondentieadres') or (cak_client.get('zorginstelling') or {}).get('adres')),
            'wettelijke_reactietermijn_dagen': failed_invoice.get('wettelijke_termijn_dagen'),
        })

    for verplichting in verplichtingen:
        if verplichting['organisatie'] != 'CAK':
            continue
        live_invoice = next((invoice for invoice in invoices if 'WLZ' in invoice.get('factuurtype', '')), None)
        if live_invoice:
            verplichting['bedrag'] = {'bedrag': f"{live_invoice['bedrag_eur']:.2f}", 'valuta': 'EUR'}
            verplichting['vervaldatum'] = live_invoice['vervaldatum'][:10]
            verplichting['status'] = live_invoice['status'].lower()


def _apply_rdw_live_data(correspondentie, rdw_vehicles):
    if rdw_vehicles:
        return
    correspondentie[:] = [item for item in correspondentie if item['organisatie'] != 'RDW']


def _apply_svb_live_data(correspondentie, rechten, svb_partner, svb_uitkeringen, fixture):
    if not svb_partner or not svb_uitkeringen:
        return

    partner_address = svb_partner.get('adres') or {}
    fixture['overledene']['partner']['woonadres'] = _mock_address_to_fixture(partner_address)

    if not any(item['organisatie'] == 'SVB' for item in rechten):
        for uitkering in svb_uitkeringen.get('uitkeringen', []):
            if uitkering.get('uitkering_type') == 'OVERLIJDENSUITKERING':
                rechten.append({
                    'id': f"live-{uitkering['uitkering_id']}",
                    'organisatie': 'SVB',
                    'categorie': 'overig',
                    'omschrijving': uitkering['omschrijving'],
                    'status': 'toegekend' if uitkering['status'] == 'UITBETAALD' else 'aanvraag_open',
                })

    if not any(item.get('brief_code') == 'SVB.OVERLIJDENSUITKERING' for item in correspondentie):
        for uitkering in svb_uitkeringen.get('uitkeringen', []):
            if uitkering.get('uitkering_type') != 'OVERLIJDENSUITKERING':
                continue
            correspondentie.append({
                'id': f"live-{uitkering['uitkering_id']}",
                'organisatie': 'SVB',
                'brief_code': 'SVB.OVERLIJDENSUITKERING',
                'type': 'informatiebrief',
                'verzonden_op': (uitkering.get('uitbetalingsdatum') or uitkering.get('ingangsdatum') or '')[:10],
                'actie_vereist': False,
                'actie_omschrijving': None,
                'aanhef': f"Geachte mevrouw {svb_partner.get('naam', '')}",
                'geadresseerde': 'partner',
                'adres': _mock_address_to_fixture(partner_address),
                'wettelijke_reactietermijn_dagen': None,
            })


def _append_a2a_letters(correspondentie, a2a_letters):
    known_ids = {item['id'] for item in correspondentie}
    for letter in a2a_letters:
        if letter.get('id') in known_ids:
            continue
        correspondentie.append({
            'id': letter['id'],
            'organisatie': letter.get('organisatie') or 'Belastingdienst',
            'brief_code': letter.get('brief_code') or 'BD.ONBEKEND',
            'type': letter.get('type') or 'informatiebrief',
            'verzonden_op': letter.get('verzonden_op') or '',
            'actie_vereist': bool(letter.get('actie_vereist')),
            'actie_omschrijving': letter.get('actie_omschrijving'),
            'aanhef': letter.get('aanhef') or '',
            'geadresseerde': letter.get('geadresseerde') or 'erven',
            'adres': letter.get('adres') or {},
            'wettelijke_reactietermijn_dagen': letter.get('wettelijke_reactietermijn_dagen'),
        })


def _build_taken(correspondentie, verplichtingen, rdw_vehicles, today: str, assistance: str):
    taken = []
    process_specs = [
        (
            'taak-cak-wlz',
            'CAK',
            'WLZ-eigen bijdrage betalen',
            'Factuur voor de laatste maand verzorging in het zorgcentrum.',
            lambda brief: brief.get('brief_code') == 'CAK.WLZ-FACTUUR',
            lambda item: item['organisatie'] == 'CAK' and 'WLZ' in item['omschrijving'],
        ),
        (
            'taak-cak-incasso',
            'CAK',
            'Mislukte CAK-incasso oplossen',
            'De automatische incasso is mislukt. Kies een nieuwe betaalmethode of betaal handmatig.',
            lambda brief: brief.get('brief_code') == 'CAK.INCASSO-MISLUKT',
            lambda item: False,
        ),
        (
            'taak-toeslagen-terugvordering',
            'Toeslagen',
            'Terugvordering zorgtoeslag',
            'Na herziening is een bedrag aan zorgtoeslag terug te betalen.',
            lambda brief: brief.get('brief_code') == 'TOESLAGEN.TERUGVORDERING-ZORG',
            lambda item: item['organisatie'] == 'Toeslagen' and 'Terugvordering' in item['omschrijving'],
        ),
        (
            'taak-erfbelasting',
            'Belastingdienst',
            'Aangifte erfbelasting',
            'Binnen acht maanden na overlijden aangifte doen bij de Belastingdienst.',
            lambda brief: brief.get('brief_code') == 'BD.AANGIFTE-ERFBELASTING',
            lambda item: item['organisatie'] == 'Belastingdienst' and 'erfbelasting' in item['omschrijving'].lower(),
        ),
        (
            'taak-waterschap',
            'Waterschap',
            'Waterschapsbelasting betalen',
            'Aanslag 2025 op basis van peildatum 1 januari.',
            lambda brief: brief.get('brief_code') == 'WS.AANSLAG',
            lambda item: item['organisatie'] == 'Waterschap',
        ),
    ]

    for taak_id, organisatie, titel, summary, brief_match, verplichting_match in process_specs:
        brief = next((item for item in correspondentie if item['organisatie'] == organisatie and brief_match(item)), None)
        verplichting = next((item for item in verplichtingen if verplichting_match(item)), None)
        if not brief and not verplichting:
            continue
        taken.append(_build_taak(taak_id, organisatie, titel, summary, brief, verplichting, today, assistance))

    rdw_brief = next((item for item in correspondentie if item['organisatie'] == 'RDW'), None)
    if rdw_vehicles or rdw_brief:
        taken.append({
            'id': 'taak-rdw-overschrijven',
            'titel': 'Voertuig overschrijven of vrijwaren',
            'samenvatting': 'Er staat nog een voertuig op naam van de overledene. Regel de tenaamstelling of vrijwaring.',
            'organisatie': 'RDW',
            'status': 'actie_nodig',
            'deadline': None,
            'urgent': False,
            'handeling_door_nabestaande': assistance != 'max',
            'handled_by': 'you' if assistance != 'max' else 'us',
            'state': 'open',
            'actie_type': 'bevestigen',
            'toon_cta_in_lijst': True,
            'cta_label': 'Voertuig regelen',
            'bron_brief_ids': [rdw_brief['id']] if rdw_brief else [],
            'bron_verplichting_ids': [],
        })

    dynamic_bd = _build_dynamic_letter_tasks(correspondentie, assistance)
    taken.extend(dynamic_bd)

    address_task = _build_address_task(correspondentie, assistance)
    if address_task:
        taken.insert(0, address_task)

    return taken


def _build_taak(taak_id, organisatie, titel, summary, brief, verplichting, today: str, assistance: str):
    deadline = None
    if verplichting and verplichting.get('vervaldatum'):
        deadline = verplichting['vervaldatum'][:10]
    elif brief and brief.get('wettelijke_reactietermijn_dagen') and brief.get('verzonden_op'):
        deadline = brief['verzonden_op']

    action_type = _infer_actie_type(
        f"{(verplichting or {}).get('omschrijving', '')} {(brief or {}).get('actie_omschrijving', '')}"
    )
    handeling = assistance != 'max'
    if action_type in {'betalen', 'indienen', 'bevestigen', 'tekenen'} and assistance == 'max':
        handeling = True

    return {
        'id': taak_id,
        'titel': titel,
        'samenvatting': summary,
        'organisatie': organisatie,
        'status': 'actie_nodig',
        'deadline': deadline,
        'urgent': False if deadline else None,
        'handeling_door_nabestaande': handeling,
        'handled_by': 'you' if handeling else 'us',
        'state': 'open',
        'actie_type': action_type,
        'toon_cta_in_lijst': True,
        'cta_label': _cta_label_for(action_type),
        'bron_brief_ids': [brief['id']] if brief else [],
        'bron_verplichting_ids': [verplichting['id']] if verplichting else [],
        'bedrag': _to_bedrag((verplichting or {}).get('bedrag')),
    }


def _build_dynamic_letter_tasks(correspondentie, assistance: str):
    tasks = []
    seen = {
        'BD.AANGIFTE-ERFBELASTING',
        'TOESLAGEN.TERUGVORDERING-ZORG',
        'CAK.WLZ-FACTUUR',
        'CAK.INCASSO-MISLUKT',
    }
    for brief in correspondentie:
        if not brief.get('actie_vereist'):
            continue
        brief_code = brief.get('brief_code') or ''
        if brief_code in seen:
            continue
        deadline = None
        if brief.get('wettelijke_reactietermijn_dagen') and brief.get('verzonden_op'):
            deadline = brief['verzonden_op']
        action_type = _infer_actie_type(brief.get('actie_omschrijving') or brief.get('type') or '')
        tasks.append({
            'id': f"dynamic:bd:{brief['id']}",
            'titel': brief.get('actie_omschrijving') or f"Actie voor {brief.get('organisatie', 'Belastingdienst')}",
            'samenvatting': brief.get('actie_omschrijving') or 'Er is een brief binnengekomen waarvoor mogelijk actie nodig is.',
            'organisatie': brief.get('organisatie') or 'Belastingdienst',
            'status': 'actie_nodig',
            'deadline': deadline,
            'urgent': False if deadline else None,
            'handeling_door_nabestaande': assistance != 'max',
            'handled_by': 'you' if assistance != 'max' else 'us',
            'state': 'open',
            'actie_type': action_type,
            'toon_cta_in_lijst': True,
            'cta_label': _cta_label_for(action_type),
            'bron_brief_ids': [brief['id']],
            'bron_verplichting_ids': [],
        })
    return tasks


def _build_address_task(correspondentie, assistance: str):
    partner_postcode = '3512 CD'
    mismatched = [
        brief for brief in correspondentie
        if (brief.get('adres') or {}).get('postcode') and (brief.get('adres') or {}).get('postcode') != partner_postcode
    ]
    if not mismatched:
        return None
    return {
        'id': 'taak-postadres-controleren',
        'titel': 'Postadres controleren',
        'samenvatting': 'Niet alle organisaties gebruiken hetzelfde postadres. Controleer dit eerst zodat u geen post mist.',
        'organisatie': 'Diverse',
        'status': 'actie_nodig',
        'urgent': True,
        'handeling_door_nabestaande': True,
        'handled_by': 'you' if assistance != 'max' else 'us',
        'state': 'open',
        'actie_type': 'bevestigen',
        'toon_cta_in_lijst': True,
        'cta_label': 'Postadres controleren',
        'bron_brief_ids': [brief['id'] for brief in mismatched],
        'bron_verplichting_ids': [],
    }


def _build_regelingen(rechten, assistance: str):
    regelingen = []
    for recht in rechten:
        if recht.get('status') == 'toegekend':
            regelingen.append({
                'id': f"regeling-{recht['id']}",
                'organisatie': recht['organisatie'],
                'titel': recht['omschrijving'],
                'toelichting': 'Deze regeling is al verwerkt.',
                'recht_id': recht['id'],
                'status': 'afgerond',
                'state': 'done',
                'handled_by': 'us',
            })
        elif recht.get('status') in {'aanvraag_open', 'in_behandeling'}:
            regelingen.append({
                'id': f"regeling-{recht['id']}",
                'organisatie': recht['organisatie'],
                'titel': recht['omschrijving'],
                'toelichting': 'Deze regeling is in behandeling.',
                'recht_id': recht['id'],
                'status': 'in_behandeling',
                'state': 'pending',
                'handled_by': 'us' if assistance == 'max' else 'you',
            })
    return regelingen


def _build_agentstappen(assistance: str):
    if assistance != 'max':
        return []
    return [
        {
            'id': 'agentstap-intake-cak',
            'organisatie': 'CAK',
            'omschrijving': 'CAK-dossier en openstaande facturen gecontroleerd',
            'uitgevoerd_op': date.today().isoformat(),
            'type': 'voorbereid_door_agent',
            'status': 'voltooid',
            'state': 'done',
            'handled_by': 'us',
        },
        {
            'id': 'agentstap-intake-bd',
            'organisatie': 'Belastingdienst',
            'omschrijving': 'Belastingdienst-correspondentie opgevraagd',
            'uitgevoerd_op': date.today().isoformat(),
            'type': 'voorbereid_door_agent',
            'status': 'bezig',
            'state': 'pending',
            'handled_by': 'us',
        },
    ]


def _build_verwacht(rechten):
    return [
        {
            'id': f"verwacht-{recht['id']}",
            'organisatie': recht['organisatie'],
            'titel': recht['omschrijving'],
            'toelichting': 'Deze beoordeling loopt nog.',
            'type': 'recht',
            'state': 'pending',
            'handled_by': 'us',
        }
        for recht in rechten
        if recht.get('status') in {'aanvraag_open', 'in_behandeling'}
    ]


def _build_geen_actie(correspondentie):
    return [
        {
            'id': f"geen-actie-{brief['id']}",
            'organisatie': brief['organisatie'],
            'titel': brief.get('actie_omschrijving') or _brief_title(brief),
            'verzonden_op': brief.get('verzonden_op') or '',
            'brief_id': brief['id'],
            'state': 'done',
            'handled_by': 'us',
        }
        for brief in correspondentie
        if not brief.get('actie_vereist')
    ]


def _build_persona(fixture, cak_client, rdw_vehicles, a2a_letters):
    partner = fixture['overledene']['partner']
    overledene = fixture['overledene']['overledene']
    alerts = []
    if cak_client and not cak_client.get('correspondentieadres'):
        alerts.append('CAK gebruikt nog het adres van de zorginstelling voor post.')
    if rdw_vehicles:
        alerts.append('RDW gebruikt nog het tenaamstellingsadres van de overledene.')
    if any((brief.get('adres') or {}).get('verzorgingstehuis') for brief in a2a_letters):
        alerts.append('Belastingdienst-post is nog naar het oude adres gestuurd.')
    return {
        'nabestaande': f"{partner['voornamen']} {partner['geslachtsnaam']}",
        'overledene': f"{overledene['voornamen']} {overledene['geslachtsnaam']}",
        'overlijdensdatum': overledene['overlijdensdatum'],
        'postadres_alert': ' '.join(alerts) or None,
        'postadres_cta_label': 'Postadres controleren' if alerts else None,
    }


def _build_processes(overview: dict[str, Any]) -> list[dict[str, Any]]:
    processes: list[dict[str, Any]] = []
    for taak in overview['taken']:
        processes.append({
            'id': taak['id'],
            'title': taak['titel'],
            'description': taak['samenvatting'],
            'organisation': taak['organisatie'],
            'state': taak.get('state', 'open'),
            'handled_by': taak.get('handled_by', 'you'),
            'deadline': taak.get('deadline'),
            'urgent': True if taak.get('urgent') else None,
            'evidence': {
                'brief_ids': taak.get('bron_brief_ids', []),
                'obligation_ids': taak.get('bron_verplichting_ids', []),
            },
        })

    for regeling in overview['regelingen']:
        processes.append({
            'id': regeling['id'],
            'title': regeling['titel'],
            'description': regeling['toelichting'],
            'organisation': regeling['organisatie'],
            'state': regeling.get('state', 'pending'),
            'handled_by': regeling.get('handled_by', 'us'),
            'evidence': {'right_id': regeling.get('recht_id')},
        })
    return [_normalize_process(process) for process in processes]


def _normalize_process(process: dict[str, Any]) -> dict[str, Any]:
    if process.get('deadline'):
        process.pop('urgent', None)
    elif not process.get('urgent'):
        process.pop('urgent', None)
    if process.get('deadline') is None:
        process.pop('deadline', None)
    return process


def _map_raw_brief(brief):
    return {
        'id': brief['id'],
        'organisatie': brief['organisatie'],
        'type': brief.get('type') or 'informatiebrief',
        'verzonden_op': brief.get('verzonden_op') or '',
        'actie_vereist': bool(brief.get('actie_vereist')),
        'actie_omschrijving': brief.get('actie_omschrijving'),
        'aanhef': brief.get('aanhef') or '',
        'geadresseerde': brief.get('geadresseerde') or '',
        'brief_code': brief.get('brief_code'),
    }


def _map_raw_verplichting(item):
    return {
        'id': item['id'],
        'organisatie': item['organisatie'],
        'omschrijving': item['omschrijving'],
        'bedrag': _to_bedrag(item.get('bedrag')),
        'vervaldatum': (item.get('vervaldatum') or '')[:10],
        'status': item.get('status') or '',
        'categorie': item.get('categorie'),
    }


def _map_raw_recht(item):
    return {
        'id': item['id'],
        'organisatie': item['organisatie'],
        'omschrijving': item['omschrijving'],
        'status': item.get('status') or '',
        'categorie': item.get('categorie'),
    }


def _to_bedrag(value):
    if not value:
        return None
    if isinstance(value, dict) and 'bedrag' in value:
        return {'bedrag': str(value['bedrag']), 'valuta': 'EUR'}
    return None


def _brief_title(brief):
    if brief.get('type') == 'condoleance':
        return 'Condoleance'
    if brief.get('type') == 'informatiebrief':
        return 'Informatiebrief'
    return f"{brief.get('type', 'Brief')} — {brief.get('organisatie', '')}"


def _infer_actie_type(text: str | None):
    lowered = (text or '').lower()
    if 'betaal' in lowered:
        return 'betalen'
    if 'aangifte' in lowered or 'indien' in lowered:
        return 'indienen'
    if 'teken' in lowered or 'onderteken' in lowered:
        return 'tekenen'
    if 'bevestig' in lowered or 'controleer' in lowered or 'regel' in lowered:
        return 'bevestigen'
    return None


def _cta_label_for(action_type):
    mapping = {
        'betalen': 'Nu betalen',
        'indienen': 'Aangifte starten',
        'tekenen': 'Ondertekenen',
        'bevestigen': 'Bekijk details',
    }
    return mapping.get(action_type, 'Bekijk details')


def _mock_address_to_fixture(address):
    if not address:
        return {}
    return {
        'straat': address.get('straat') or '',
        'huisnummer': address.get('huisnummer') or '',
        'postcode': address.get('postcode') or '',
        'woonplaats': address.get('stad') or address.get('woonplaats') or '',
        'verzorgingstehuis': False,
    }
