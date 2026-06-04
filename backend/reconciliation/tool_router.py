from django.conf import settings

from .mock_sources import (
    fetch_cak_client,
    fetch_cak_invoices,
    fetch_rdw_vehicles,
    patch_cak_correspondence_address,
    patch_rdw_vehicle_address,
)


def plan_read_tools(case_context):
    deceased_bsn = case_context['deceased_bsn']
    return [
        {
            'tool': 'cak.get_client',
            'reason': 'Controleer of er CAK-zorg- of betalingszaken openstaan na het overlijden.',
            'args': {'bsn': deceased_bsn},
        },
        {
            'tool': 'cak.get_invoices',
            'reason': 'Haal open of mislukte CAK-facturen op voor het totaaloverzicht.',
            'args': {'bsn': deceased_bsn},
        },
        {
            'tool': 'rdw.get_holder_vehicles',
            'reason': 'Controleer of er voertuigen op naam van Cees staan en welk adres RDW gebruikt.',
            'args': {'bsn': deceased_bsn},
        },
    ]


def plan_write_tools(corrections, aggregated_data):
    plan = []
    address = corrections.get('address')
    cak_source = aggregated_data['sources'].get('cak') or {}
    rdw_source = aggregated_data['sources'].get('rdw') or {}

    if address and cak_source.get('can_update_address'):
        plan.append({
            'tool': 'cak.patch_correspondence_address',
            'reason': 'Werk het CAK-correspondentieadres bij met het door Truus bevestigde adres.',
            'args': {
                'bsn': aggregated_data['person']['deceased_bsn'],
                'address': address,
            },
        })

    if address and rdw_source.get('kenteken'):
        plan.append({
            'tool': 'rdw.patch_vehicle_address',
            'reason': 'Werk het RDW-correspondentieadres bij met het door Truus bevestigde adres.',
            'args': {
                'kenteken': rdw_source['kenteken'],
                'address': address,
            },
        })

    return plan


def execute_tool_plan(plan):
    results = []
    for step in plan:
        tool_name = step['tool']
        args = step.get('args', {})
        result = _execute_tool(tool_name, args)
        results.append({
            'tool': tool_name,
            'reason': step.get('reason', ''),
            'args': _redact_args(args),
            'status': 'success',
            'result': result,
        })
    return results


def build_case_context():
    return {
        'deceased_bsn': settings.DEMO_DECEASED_BSN,
        'deceased_name': settings.DEMO_DECEASED_NAME,
        'surviving_partner_bsn': settings.DEMO_SURVIVING_PARTNER_BSN,
        'surviving_partner_name': settings.DEMO_SURVIVING_PARTNER_NAME,
    }


def get_tool_result(tool_results, tool_name, default=None):
    for result in tool_results:
        if result['tool'] == tool_name:
            return result['result']
    return default


def _execute_tool(tool_name, args):
    if tool_name == 'cak.get_client':
        return fetch_cak_client(args['bsn'])
    if tool_name == 'cak.get_invoices':
        return fetch_cak_invoices(args['bsn'])
    if tool_name == 'rdw.get_holder_vehicles':
        return fetch_rdw_vehicles(args['bsn'])
    if tool_name == 'rdw.patch_vehicle_address':
        return patch_rdw_vehicle_address(args['kenteken'], args['address'])
    if tool_name == 'cak.patch_correspondence_address':
        return patch_cak_correspondence_address(args['bsn'], args['address'])
    raise ValueError(f'Unknown tool: {tool_name}')


def _redact_args(args):
    redacted = dict(args)
    if 'bsn' in redacted:
        bsn = str(redacted['bsn'])
        redacted['bsn'] = f'***-**-{bsn[-3:]}'
    return redacted
