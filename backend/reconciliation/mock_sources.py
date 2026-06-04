import json
from urllib.error import HTTPError, URLError
from urllib.parse import quote
from urllib.request import Request, urlopen

from django.conf import settings

def _fetch_json(base_url, path):
    url = f"{base_url.rstrip('/')}/{path.lstrip('/')}"
    request = Request(url, headers={'Accept': 'application/json'})
    try:
        with urlopen(request, timeout=settings.MOCK_API_TIMEOUT_SECONDS) as response:
            return json.loads(response.read().decode('utf-8'))
    except HTTPError as exc:
        if exc.code == 404:
            return None
        raise MockApiError(f'Mock API request failed: {url} returned HTTP {exc.code}') from exc
    except (OSError, URLError, TimeoutError) as exc:
        raise MockApiError(f'Mock API request failed: {url}') from exc


def _post_json(base_url, path, payload, method='POST'):
    url = f"{base_url.rstrip('/')}/{path.lstrip('/')}"
    body = json.dumps(payload).encode('utf-8')
    request = Request(
        url,
        data=body,
        headers={
            'Accept': 'application/json',
            'Content-Type': 'application/json',
        },
        method=method,
    )
    try:
        with urlopen(request, timeout=settings.MOCK_API_TIMEOUT_SECONDS) as response:
            return json.loads(response.read().decode('utf-8'))
    except HTTPError as exc:
        raise MockApiError(f'Mock API update failed: {url} returned HTTP {exc.code}') from exc
    except (OSError, URLError, TimeoutError) as exc:
        raise MockApiError(f'Mock API update failed: {url}') from exc


class MockApiError(RuntimeError):
    pass


def _normalize_mock_address(address):
    if not address:
        return None

    return {
        'street': address.get('straat') or address.get('street') or '',
        'house_number': address.get('huisnummer') or address.get('house_number') or '',
        'postal_code': address.get('postcode') or address.get('postal_code') or '',
        'city': address.get('stad') or address.get('city') or '',
        'country_code': address.get('landcode') or address.get('country_code') or 'NL',
    }


def _denormalize_mock_address(address):
    return {
        'straat': address['street'],
        'huisnummer': address['house_number'],
        'postcode': address['postal_code'],
        'stad': address['city'],
        'landcode': address.get('country_code') or 'NL',
    }


def fetch_cak_client(bsn):
    return _fetch_json(settings.MOCK_CAK_BASE_URL, f'/clienten/{quote(bsn, safe="")}')


def fetch_cak_invoices(bsn):
    return _fetch_json(settings.MOCK_CAK_BASE_URL, f'/clienten/{quote(bsn, safe="")}/facturen')


def fetch_rdw_vehicles(bsn):
    return _fetch_json(settings.MOCK_RDW_BASE_URL, f'/houders/{quote(bsn, safe="")}/voertuigen') or []


def patch_cak_correspondence_address(bsn, address):
    payload = {
        'correspondentieadres': _denormalize_mock_address(address),
    }
    return _post_json(
        settings.MOCK_CAK_BASE_URL,
        f'/clienten/{quote(bsn, safe="")}',
        payload,
        method='PATCH',
    )


def _extract_cak_address(client):
    correspondence_address = (client or {}).get('correspondentieadres')
    if correspondence_address:
        return _normalize_mock_address(correspondence_address)

    zorginstelling = (client or {}).get('zorginstelling') or {}
    return _normalize_mock_address(zorginstelling.get('adres'))


def _extract_rdw_address(vehicles):
    for vehicle in vehicles or []:
        address = ((vehicle.get('tenaamstelling') or {}).get('adres'))
        if address:
            return _normalize_mock_address(address)
    return None


def build_government_data_from_tool_results(case_context, tool_results, confirmed_corrections=None):
    """Normalize tool outputs into the reconciliation case model."""
    from .tool_router import get_tool_result

    confirmed_corrections = confirmed_corrections or {}
    deceased_bsn = case_context['deceased_bsn']
    cak_client = get_tool_result(tool_results, 'cak.get_client')
    cak_invoices = get_tool_result(tool_results, 'cak.get_invoices')
    rdw_vehicles = get_tool_result(tool_results, 'rdw.get_holder_vehicles', []) or []

    open_invoice_statuses = {'OPENSTAAND', 'INCASSO_MISLUKT'}
    invoices = (cak_invoices or {}).get('facturen', [])
    open_invoices = [invoice for invoice in invoices if invoice.get('status') in open_invoice_statuses]
    primary_vehicle = rdw_vehicles[0] if rdw_vehicles else None

    return {
        'person': {
            'display_name': case_context['surviving_partner_name'].split()[0],
            'surviving_partner_name': case_context['surviving_partner_name'],
            'surviving_partner_bsn': case_context['surviving_partner_bsn'],
            'deceased_name': case_context['deceased_name'],
            'deceased_bsn': deceased_bsn,
            'bsn_reference': f"***-**-{deceased_bsn[-3:]}",
        },
        'confirmed_corrections': confirmed_corrections,
        'sources': {
            'cak': {
                'display_name': 'CAK',
                'kind': 'mock-api',
                'api_base_url': settings.MOCK_CAK_BASE_URL,
                'address': _extract_cak_address(cak_client),
                'client': cak_client,
                'open_invoices': open_invoices,
                'invoice_count': len(invoices),
                'can_update_address': True,
            },
            'rdw': {
                'display_name': 'RDW',
                'kind': 'mock-api',
                'api_base_url': settings.MOCK_RDW_BASE_URL,
                'address': _extract_rdw_address(rdw_vehicles),
                'vehicles': rdw_vehicles,
                'vehicle': primary_vehicle,
                'kenteken': primary_vehicle.get('kenteken') if primary_vehicle else None,
                'can_update_address': bool(primary_vehicle),
            },
        },
    }


def patch_rdw_vehicle_address(kenteken, address):
    payload = _denormalize_mock_address(address)
    return _post_json(
        settings.MOCK_RDW_BASE_URL,
        f'/voertuigen/{quote(kenteken, safe="")}/adres',
        payload,
        method='PATCH',
    )


def format_address(address):
    if not address:
        return ''

    street_line = f"{address.get('street', '')} {address.get('house_number', '')}".strip()
    city_line = f"{address.get('postal_code', '')} {address.get('city', '')}".strip()
    return ', '.join(part for part in [street_line, city_line] if part)
