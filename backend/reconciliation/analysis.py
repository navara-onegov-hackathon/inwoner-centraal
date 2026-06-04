from .mock_sources import format_address


def build_discrepancies(aggregated_data):
    sources = aggregated_data['sources']
    discrepancies = []

    missing_bank_sources = [
        source_key
        for source_key, source_data in sources.items()
        if not source_data.get('bank_account_number')
    ]
    known_bank_sources = [
        {
            'source': source_key,
            'source_label': source_data['display_name'],
            'value': source_data.get('bank_account_number'),
        }
        for source_key, source_data in sources.items()
        if source_data.get('bank_account_number')
    ]

    if missing_bank_sources:
        discrepancies.append({
            'id': 'missing-bank-account-number',
            'field': 'bank_account_number',
            'label': 'IBAN',
            'type': 'missing',
            'issue': 'Uw IBAN ontbreekt bij een of meer organisaties.',
            'sources': [
                {
                    'source': source_key,
                    'source_label': sources[source_key]['display_name'],
                    'value': sources[source_key].get('bank_account_number'),
                    'status': 'missing',
                }
                for source_key in missing_bank_sources
            ],
            'known_values': known_bank_sources,
            'required_input': {
                'name': 'bank_account_number',
                'label': 'IBAN',
                'type': 'iban',
                'placeholder': 'NL00 BANK 0123 4567 89',
                'prefill': known_bank_sources[0]['value'] if known_bank_sources else '',
            },
            'explanation': (
                'We hebben uw IBAN nodig om betalingen of teruggaven goed te kunnen verwerken. '
                'U hoeft dit maar een keer door te geven; wij delen de correctie met de betrokken organisaties.'
            ),
        })

    address_values = {}
    for source_key, source_data in sources.items():
        formatted_address = format_address(source_data.get('address'))
        address_values.setdefault(formatted_address, []).append(source_key)

    if len(address_values) > 1:
        gemeente_address = format_address(sources['gemeente'].get('address'))
        discrepancies.append({
            'id': 'conflicting-address',
            'field': 'address',
            'label': 'Woonadres',
            'type': 'conflict',
            'issue': 'Niet elke organisatie heeft hetzelfde woonadres van u.',
            'sources': [
                {
                    'source': source_key,
                    'source_label': source_data['display_name'],
                    'value': format_address(source_data.get('address')),
                    'status': 'conflicting',
                }
                for source_key, source_data in sources.items()
            ],
            'known_values': [
                {
                    'value': address,
                    'sources': [sources[source_key]['display_name'] for source_key in source_keys],
                }
                for address, source_keys in address_values.items()
            ],
            'required_input': {
                'name': 'address',
                'label': 'Uw juiste woonadres',
                'type': 'text',
                'placeholder': 'Straat huisnummer, postcode plaats',
                'prefill': gemeente_address,
            },
            'explanation': (
                'We gebruiken uw woonadres om belangrijke berichten en regelingen aan de juiste plek te koppelen. '
                'Omdat de gegevens nu verschillen, vragen we u welk adres klopt.'
            ),
        })

    return discrepancies
