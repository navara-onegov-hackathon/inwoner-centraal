from .mock_sources import format_address


def build_discrepancies(aggregated_data):
    sources = aggregated_data['sources']
    discrepancies = []
    confirmed_address = aggregated_data.get('confirmed_corrections', {}).get('address')

    address_sources = [
        {
            'source': source_key,
            'source_label': source_data['display_name'],
            'value': format_address(source_data.get('address')),
            'status': 'needs_confirmation' if source_data.get('address') else 'missing',
        }
        for source_key, source_data in sources.items()
        if source_key in {'cak', 'rdw'}
    ]
    known_addresses = [source['value'] for source in address_sources if source['value']]
    unique_addresses = set(known_addresses)
    has_missing_address = any(source['status'] == 'missing' for source in address_sources)

    if known_addresses and not confirmed_address and (len(unique_addresses) > 1 or has_missing_address):
        discrepancies.append({
            'id': 'preferred-correspondence-address',
            'field': 'address',
            'label': 'Correspondentieadres',
            'type': 'missing_confirmation',
            'issue': 'We hebben uw juiste correspondentieadres nodig.',
            'sources': address_sources,
            'known_values': [
                {
                    'value': address,
                    'sources': [
                        source['source_label']
                        for source in address_sources
                        if source['value'] == address
                    ],
                }
                for address in sorted(unique_addresses)
            ],
            'required_input': {
                'name': 'address',
                'label': 'Waar wilt u post over de zaken van Cees ontvangen?',
                'type': 'text',
                'placeholder': 'Straat huisnummer, postcode plaats',
                'prefill': known_addresses[0],
            },
            'explanation': (
                'CAK en RDW hebben gegevens uit de situatie van Cees. Om te voorkomen dat brieven '
                'naar de verkeerde plek gaan, vragen we een keer welk adres Truus wil gebruiken.'
            ),
        })

    return discrepancies
