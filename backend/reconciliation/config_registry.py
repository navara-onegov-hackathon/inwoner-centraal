import json
from pathlib import Path
from urllib.parse import urljoin

from django.conf import settings


_CONFIG_DIR = Path(__file__).resolve().parent / 'config'


def load_api_registry() -> list[dict]:
    apis = _read_json('apis.json')
    return [_with_resolved_api_urls(api) for api in apis]


def load_agent_registry() -> list[dict]:
    return _read_json('agents.json')


def load_process_registry() -> list[dict]:
    return _read_json('processes.json')


def load_active_process_registry() -> list[dict]:
    return [
        process
        for process in load_process_registry()
        if not process.get('skip')
    ]


def _read_json(name: str):
    return json.loads((_CONFIG_DIR / name).read_text(encoding='utf-8'))


def _with_resolved_api_urls(api: dict) -> dict:
    base_url = getattr(settings, api['base_url_setting'], api['default_base_url']).rstrip('/')
    openapi_url = urljoin(f'{base_url}/', api.get('openapi_path', '/openapi.json').lstrip('/'))
    return {
        **api,
        'base_url': base_url,
        'openapi_url': openapi_url,
    }
