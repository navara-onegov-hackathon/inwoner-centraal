import json
import re
from json import JSONDecodeError

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

from .analysis import build_discrepancies
from .demo_state import get_confirmed_corrections, remember_confirmed_address
from .greenpt import analyze_with_greenpt
from .mock_sources import MockApiError, build_government_data_from_tool_results
from .tool_router import build_case_context, execute_tool_plan, plan_read_tools, plan_write_tools


IBAN_PATTERN = re.compile(r'^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$')
ADDRESS_PATTERN = re.compile(
    r'^\s*(?P<street>.*?)\s+(?P<house_number>\d+\w*)\s*,?\s+'
    r'(?P<postal_code>\d{4}\s?[A-Z]{2})\s+(?P<city>.+?)\s*$',
    re.IGNORECASE,
)


def _build_reconciliation_payload():
    case_context = build_case_context()
    tool_plan = plan_read_tools(case_context)
    tool_results = execute_tool_plan(tool_plan)
    aggregated_data = build_government_data_from_tool_results(
        case_context,
        tool_results,
        confirmed_corrections=get_confirmed_corrections(),
    )
    local_discrepancies = build_discrepancies(aggregated_data)
    analysis = analyze_with_greenpt(aggregated_data, local_discrepancies)
    return aggregated_data, analysis, tool_plan, tool_results


def _normalize_iban(value):
    return re.sub(r'\s+', '', value or '').upper()


def _parse_address(value):
    normalized = re.sub(r'\s+', ' ', value or '').strip()
    match = ADDRESS_PATTERN.match(normalized)
    if not match:
        return None

    return {
        'street': match.group('street').strip(),
        'house_number': match.group('house_number').strip(),
        'postal_code': re.sub(r'\s+', '', match.group('postal_code')).upper(),
        'city': match.group('city').strip(),
        'country_code': 'NL',
    }


def _validate_corrections(corrections, discrepancies):
    errors = {}
    required_fields = {
        discrepancy['required_input']['name']: discrepancy
        for discrepancy in discrepancies
        if discrepancy.get('required_input', {}).get('name')
    }

    for field_name, discrepancy in required_fields.items():
        raw_value = corrections.get(field_name)
        value = raw_value.strip() if isinstance(raw_value, str) else raw_value

        if not value:
            errors[field_name] = f"Vul {discrepancy['label'].lower()} in."
            continue

        if field_name == 'bank_account_number':
            normalized = _normalize_iban(value)
            if not IBAN_PATTERN.match(normalized):
                errors[field_name] = 'Vul een geldig IBAN in, bijvoorbeeld NL91 ABNA 0417 1643 00.'
            else:
                corrections[field_name] = normalized

        if field_name == 'address':
            address = _parse_address(value)
            if not address:
                errors[field_name] = 'Vul een volledig adres in, bijvoorbeeld Oudegracht 120, 3511AW Utrecht.'
            else:
                corrections[field_name] = address

    return errors


def _apply_mock_api_corrections(corrections, aggregated_data):
    updates = []
    write_plan = plan_write_tools(corrections, aggregated_data)
    write_results = execute_tool_plan(write_plan)

    for result in write_results:
        if result['tool'] == 'cak.patch_correspondence_address':
            updates.append({
                'source': 'cak',
                'source_label': aggregated_data['sources']['cak']['display_name'],
                'status': 'updated',
                'updated_fields': ['address'],
                'resource': {
                    'type': 'client',
                    'id': result['result'].get('bsn'),
                },
            })
        if result['tool'] == 'rdw.patch_vehicle_address':
            updates.append({
                'source': 'rdw',
                'source_label': aggregated_data['sources']['rdw']['display_name'],
                'status': 'updated',
                'updated_fields': ['address'],
                'resource': {
                    'type': 'vehicle',
                    'id': result['result'].get('kenteken'),
                },
            })
    if corrections.get('address'):
        remember_confirmed_address(corrections['address'])

    return updates, write_plan, write_results


@csrf_exempt
@require_http_methods(['GET', 'POST'])
def data_reconciliation(request):
    try:
        aggregated_data, analysis, tool_plan, tool_results = _build_reconciliation_payload()
    except MockApiError as exc:
        return JsonResponse({
            'errors': {
                'mock_api': (
                    'De CAK/RDW mock API is niet bereikbaar. Start CAK op poort 8001 en RDW op poort 8002.'
                ),
            },
            'detail': str(exc),
        }, status=503)

    discrepancies = analysis['discrepancies']

    if request.method == 'GET':
        return JsonResponse({
            'person': aggregated_data['person'],
            'sources': aggregated_data['sources'],
            'discrepancies': discrepancies,
            'has_discrepancies': bool(discrepancies),
            'greenpt': analysis['greenpt'],
            'tool_plan': tool_plan,
            'tool_results': tool_results,
        })

    try:
        body = json.loads(request.body.decode('utf-8') or '{}')
    except (UnicodeDecodeError, JSONDecodeError):
        return JsonResponse({'errors': {'body': 'Stuur geldige JSON mee.'}}, status=400)

    corrections = body.get('corrections', {})
    if not isinstance(corrections, dict):
        return JsonResponse({'errors': {'corrections': 'Corrections moet een object zijn.'}}, status=400)

    errors = _validate_corrections(corrections, discrepancies)
    if errors:
        return JsonResponse({'errors': errors}, status=400)

    try:
        mock_api_updates, write_plan, write_results = _apply_mock_api_corrections(corrections, aggregated_data)
    except MockApiError as exc:
        return JsonResponse({
            'errors': {
                'mock_api': 'De correctie kon niet naar de RDW mock API worden verstuurd.',
            },
            'detail': str(exc),
        }, status=502)

    return JsonResponse({
        'status': 'success',
        'message': 'Dank u. We hebben uw correctie ontvangen en de betrokken mock API\'s bijgewerkt.',
        'corrections': corrections,
        'mock_api_updates': mock_api_updates,
        'tool_plan': write_plan,
        'tool_results': write_results,
    })
