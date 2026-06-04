import json
import logging
import os
from json import JSONDecodeError

from django.conf import settings


GREENPT_BASE_URL = 'https://api.greenpt.ai/v1'
GREENPT_MODEL = 'gemma4'
logger = logging.getLogger(__name__)


def _extract_json(content):
    stripped = content.strip()
    if stripped.startswith('```'):
        lines = stripped.splitlines()
        if lines and lines[0].startswith('```'):
            lines = lines[1:]
        if lines and lines[-1].startswith('```'):
            lines = lines[:-1]
        stripped = '\n'.join(lines).strip()
    return json.loads(stripped)


def analyze_with_greenpt(aggregated_data, fallback_discrepancies):
    """Use GreenPT to review discrepancies, with a safe local fallback."""
    if not fallback_discrepancies:
        logger.info('GreenPT skipped: no discrepancies detected.')
        return {
            'discrepancies': [],
            'greenpt': {
                'used': False,
                'reason': 'No discrepancies detected.',
            },
        }

    api_key = os.getenv('GREENPT_API_KEY')
    if not api_key:
        logger.info('GreenPT skipped: GREENPT_API_KEY is not set.')
        logger.info('GreenPT fallback discrepancies: %s', json.dumps(fallback_discrepancies, ensure_ascii=False))
        return {
            'discrepancies': fallback_discrepancies,
            'greenpt': {
                'used': False,
                'reason': 'GREENPT_API_KEY is not set.',
            },
        }

    try:
        from openai import OpenAI
    except ImportError:
        logger.exception('GreenPT skipped: openai package is not installed.')
        logger.info('GreenPT fallback discrepancies: %s', json.dumps(fallback_discrepancies, ensure_ascii=False))
        return {
            'discrepancies': fallback_discrepancies,
            'greenpt': {
                'used': False,
                'reason': 'The openai package is not installed in the backend environment.',
            },
        }

    prompt = (
        'You analyze reconciled government data for a Dutch citizen-facing service. '\
        'Return only valid JSON with a top-level key "discrepancies". '\
        'Keep the supplied ids, fields, required_input objects, and source names. '\
        'Improve only issue and explanation text where useful. '\
        'Use plain, empathetic Dutch. Avoid cold bureaucratic language and avoid salutations. '\
        'Explain why the data is needed and mention that one correction can update involved agencies.\n\n'
        f'Aggregated source data:\n{json.dumps(aggregated_data, ensure_ascii=False)}\n\n'
        f'Detected discrepancies:\n{json.dumps(fallback_discrepancies, ensure_ascii=False)}'
    )

    logger.info('GreenPT request model=%s base_url=%s', GREENPT_MODEL, GREENPT_BASE_URL)
    logger.info('GreenPT input aggregated_data: %s', json.dumps(aggregated_data, ensure_ascii=False))
    logger.info('GreenPT input fallback_discrepancies: %s', json.dumps(fallback_discrepancies, ensure_ascii=False))
    logger.info('GreenPT prompt: %s', prompt)

    try:
        client = OpenAI(api_key=api_key, base_url=GREENPT_BASE_URL)
        response = client.chat.completions.create(
            model=GREENPT_MODEL,
            messages=[{'role': 'user', 'content': prompt}],
            temperature=0.2,
            timeout=settings.GREENPT_TIMEOUT_SECONDS,
        )
        content = response.choices[0].message.content or ''
        logger.info('GreenPT raw output: %s', content)
        parsed = _extract_json(content)
        logger.info('GreenPT parsed output: %s', json.dumps(parsed, ensure_ascii=False))
        discrepancies = parsed.get('discrepancies')
        if not isinstance(discrepancies, list):
            raise ValueError('GreenPT response does not contain a discrepancies list.')
        return {
            'discrepancies': discrepancies,
            'greenpt': {
                'used': True,
                'model': GREENPT_MODEL,
            },
        }
    except (JSONDecodeError, ValueError, KeyError, IndexError, AttributeError) as exc:
        logger.exception('GreenPT response parsing failed. Falling back to local discrepancies.')
        logger.info('GreenPT fallback discrepancies: %s', json.dumps(fallback_discrepancies, ensure_ascii=False))
        return {
            'discrepancies': fallback_discrepancies,
            'greenpt': {
                'used': False,
                'reason': f'GreenPT returned an unexpected response: {exc}',
            },
        }
    except Exception as exc:  # pragma: no cover - network/API failures depend on runtime setup.
        logger.exception('GreenPT request failed. Falling back to local discrepancies.')
        logger.info('GreenPT fallback discrepancies: %s', json.dumps(fallback_discrepancies, ensure_ascii=False))
        return {
            'discrepancies': fallback_discrepancies,
            'greenpt': {
                'used': False,
                'reason': f'GreenPT request failed: {exc}',
            },
        }
