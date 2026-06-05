_STATE = {
    'confirmed_corrections': {},
    'case_data': {},
    'completed_task_ids': set(),
}


def get_confirmed_corrections():
    return dict(_STATE['confirmed_corrections'])


def remember_confirmed_address(address):
    _STATE['confirmed_corrections']['address'] = dict(address)
    return _STATE['confirmed_corrections']['address']


def get_case_data():
    return dict(_STATE['case_data'])


def remember_case_data(data):
    _STATE['case_data'].update(dict(data))
    return get_case_data()


def get_completed_task_ids():
    return set(_STATE['completed_task_ids'])


def mark_task_completed(task_id):
    _STATE['completed_task_ids'].add(task_id)
    return get_completed_task_ids()
