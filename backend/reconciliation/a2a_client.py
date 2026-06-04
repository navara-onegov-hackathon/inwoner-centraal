import asyncio
import json
import logging
import os

import httpx

from a2a.client import A2ACardResolver, ClientCallContext, ClientConfig, create_client
from a2a.helpers import get_artifact_text, new_text_message
from a2a.types.a2a_pb2 import Role, SendMessageRequest

A2A_AGENT_URL = os.getenv('A2A_AGENT_URL', 'http://127.0.0.1:9999')

logger = logging.getLogger('reconciliation')


class A2AClientError(RuntimeError):
    pass


async def _get_agent_card():
    async with httpx.AsyncClient() as httpx_client:
        resolver = A2ACardResolver(httpx_client=httpx_client, base_url=A2A_AGENT_URL)
        return await resolver.get_agent_card()


async def _send_query(agent_card, bsn: str, query: str) -> dict:
    config = ClientConfig(streaming=False)
    client = await create_client(agent=agent_card, client_config=config)
    try:
        payload = json.dumps({'bsn': bsn, 'query': query})
        message = new_text_message(payload, role=Role.ROLE_USER)
        request = SendMessageRequest(message=message)

        async for chunk in client.send_message(request, context=ClientCallContext(timeout=30.0)):
            if chunk.HasField('task'):
                for artifact in chunk.task.artifacts:
                    text = get_artifact_text(artifact)
                    if text:
                        return json.loads(text)
        return {}
    finally:
        await client.close()


async def _fetch_both(bsn: str, postcode: str, huisnummer: str) -> tuple[dict, dict]:
    agent_card = await _get_agent_card()
    brieven_task = _send_query(agent_card, bsn, 'Geef alle brieven voor dit BSN')

    if postcode and huisnummer:
        mismatch_query = (
            f'Controleer adres mismatch met postcode {postcode} en huisnummer {huisnummer}'
        )
        mismatch_task = _send_query(agent_card, bsn, mismatch_query)
        brieven_result, mismatch_result = await asyncio.gather(brieven_task, mismatch_task)
    else:
        brieven_result = await brieven_task
        mismatch_result = {}

    return brieven_result, mismatch_result


def get_reconciliation_data(bsn: str, postcode: str, huisnummer: str) -> tuple[dict, dict]:
    """Fetch brieven and address mismatch data from the Belastingdienst A2A agent.

    Raises A2AClientError if the agent is unreachable or returns an error.
    """
    logger.info('Fetching Belastingdienst data via A2A agent for BSN ***-%s', bsn[-3:] if bsn else '???')
    try:
        brieven_result, mismatch_result = asyncio.run(_fetch_both(bsn, postcode, huisnummer))
    except A2AClientError:
        raise
    except Exception as exc:
        logger.exception('A2A agent call failed: %s', exc)
        raise A2AClientError(f'A2A agent call failed: {exc}') from exc

    brieven_count = brieven_result.get('count', len(brieven_result.get('brieven', [])))
    logger.info('A2A agent returned %d brief(en), mismatch=%s', brieven_count, mismatch_result.get('mismatch'))
    return brieven_result, mismatch_result


def build_belastingdienst_source(brieven_result: dict) -> dict:
    """Build a source dict from A2A brieven result in the same schema as CAK/RDW sources."""
    brieven = brieven_result.get('brieven', [])
    address = None
    if brieven:
        sorted_brieven = sorted(brieven, key=lambda b: b.get('verzonden_op', ''), reverse=True)
        raw_adres = sorted_brieven[0].get('adres') or {}
        if raw_adres:
            address = {
                'street': raw_adres.get('straat', ''),
                'house_number': str(raw_adres.get('huisnummer', '')),
                'postal_code': raw_adres.get('postcode', '').replace(' ', ''),
                'city': raw_adres.get('woonplaats', ''),
                'country_code': 'NL',
            }

    return {
        'display_name': 'Belastingdienst',
        'kind': 'a2a',
        'address': address,
        'brieven': brieven,
        'brieven_count': len(brieven),
        'can_update_address': False,
    }
