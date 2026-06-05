import json
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from django.conf import settings

from .config_registry import load_api_registry


def discover_api(api: str) -> dict:
    api_config = _get_api(api)
    return _fetch_json(api_config['openapi_url'])


def call_api(
    method: str,
    url: str,
    body: dict | None = None,
    headers: dict[str, str] | None = None,
):
    resolved_url = _resolve_url(url)
    return _fetch_json(resolved_url, method=method.upper(), body=body, headers=headers)


def _fetch_json(url: str, method: str = 'GET', body: dict | None = None, headers=None):
    payload = json.dumps(body).encode('utf-8') if body is not None else None
    request_headers = {'Accept': 'application/json', **(headers or {})}
    if body is not None:
        request_headers['Content-Type'] = 'application/json'
    request = Request(url, data=payload, method=method, headers=request_headers)
    try:
        with urlopen(request, timeout=settings.MOCK_API_TIMEOUT_SECONDS) as response:
            if response.status == 204:
                return None
            raw = response.read().decode('utf-8')
            return json.loads(raw) if raw else None
    except HTTPError as exc:
        detail = exc.read().decode('utf-8', errors='replace')
        raise RuntimeError(f'{method} {url} failed with HTTP {exc.code}: {detail}') from exc
    except (OSError, URLError, TimeoutError) as exc:
        raise RuntimeError(f'{method} {url} failed: {exc}') from exc


def _get_api(api_id: str) -> dict:
    for api in load_api_registry():
        if api['id'] == api_id:
            return api
    raise ValueError(f'Unknown API id: {api_id}')


def _resolve_url(url: str) -> str:
    if url.startswith('http://') or url.startswith('https://'):
        _assert_allowed_url(url)
        return url

    if not url.startswith('/'):
        raise ValueError('call_api url must be absolute or start with /.')

    matches = [api for api in load_api_registry() if url.startswith(f"/{api['id']}/")]
    if not matches:
        raise ValueError('Relative call_api urls must start with /<api-id>/...')
    api = matches[0]
    return f"{api['base_url']}/{url.removeprefix('/' + api['id'] + '/').lstrip('/')}"


def _assert_allowed_url(url: str):
    allowed = [api['base_url'] for api in load_api_registry()]
    if not any(url.startswith(f'{base}/') or url == base for base in allowed):
        raise ValueError('call_api url must target a configured API base URL.')
