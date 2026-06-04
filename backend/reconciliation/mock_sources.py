def get_synthetic_government_data():
    """Return mocked source data until real government APIs are available."""
    return {
        'person': {
            'bsn_reference': '***-**-482',
            'display_name': 'Froukje',
        },
        'sources': {
            'gemeente': {
                'display_name': 'Gemeente Utrecht',
                'address': {
                    'street': 'Oudegracht',
                    'house_number': '120',
                    'postal_code': '3511AW',
                    'city': 'Utrecht',
                },
                'bank_account_number': None,
                'last_updated': '2026-06-01',
            },
            'svb': {
                'display_name': 'Sociale Verzekeringsbank',
                'address': {
                    'street': 'Nieuwegracht',
                    'house_number': '8',
                    'postal_code': '3512LC',
                    'city': 'Utrecht',
                },
                'bank_account_number': None,
                'last_updated': '2026-05-28',
            },
            'belastingdienst': {
                'display_name': 'Belastingdienst',
                'address': {
                    'street': 'Oudegracht',
                    'house_number': '120',
                    'postal_code': '3511AW',
                    'city': 'Utrecht',
                },
                'bank_account_number': 'NL91ABNA0417164300',
                'last_updated': '2026-05-20',
            },
        },
    }


def format_address(address):
    if not address:
        return ''

    street_line = f"{address.get('street', '')} {address.get('house_number', '')}".strip()
    city_line = f"{address.get('postal_code', '')} {address.get('city', '')}".strip()
    return ', '.join(part for part in [street_line, city_line] if part)
