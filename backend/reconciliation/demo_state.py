_STATE = {
    'confirmed_corrections': {},
}


def get_confirmed_corrections():
    return dict(_STATE['confirmed_corrections'])


def remember_confirmed_address(address):
    _STATE['confirmed_corrections']['address'] = dict(address)
    return _STATE['confirmed_corrections']['address']
