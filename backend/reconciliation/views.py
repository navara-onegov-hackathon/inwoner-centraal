import json
import re
from json import JSONDecodeError

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

from .analysis import build_discrepancies
from .greenpt import analyze_with_greenpt
from .mock_sources import get_synthetic_government_data


IBAN_PATTERN = re.compile(r'^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$')


def _build_reconciliation_payload():
    aggregated_data = get_synthetic_government_data()
    local_discrepancies = build_discrepancies(aggregated_data)
    analysis = analyze_with_greenpt(aggregated_data, local_discrepancies)
    return aggregated_data, analysis


def _normalize_iban(value):
    return re.sub(r'\s+', '', value or '').upper()


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

        if field_name == 'address' and len(value) < 8:
            errors[field_name] = 'Vul een volledig adres in.'

    return errors


@csrf_exempt
@require_http_methods(['GET', 'POST'])
def data_reconciliation(request):
    aggregated_data, analysis = _build_reconciliation_payload()
    discrepancies = analysis['discrepancies']

    if request.method == 'GET':
        return JsonResponse({
            'person': aggregated_data['person'],
            'sources': aggregated_data['sources'],
            'discrepancies': discrepancies,
            'has_discrepancies': bool(discrepancies),
            'greenpt': analysis['greenpt'],
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

    affected_agencies = sorted({
        source['source']
        for discrepancy in discrepancies
        for source in discrepancy.get('sources', [])
    })
    source_labels = aggregated_data['sources']
    simulated_updates = [
        {
            'source': source_key,
            'source_label': source_labels[source_key]['display_name'],
            'status': 'updated',
            'updated_fields': list(corrections.keys()),
        }
        for source_key in affected_agencies
    ]

    return JsonResponse({
        'status': 'success',
        'message': 'Dank u. We hebben uw correctie ontvangen en delen deze met de betrokken organisaties.',
        'corrections': corrections,
        'simulated_updates': simulated_updates,
    })
