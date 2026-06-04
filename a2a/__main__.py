import uvicorn

from a2a.server.request_handlers import DefaultRequestHandler
from a2a.server.routes import (
    create_agent_card_routes,
    create_jsonrpc_routes,
)
from a2a.server.tasks import InMemoryTaskStore
from a2a.types import (
    AgentCapabilities,
    AgentCard,
    AgentInterface,
    AgentSkill,
)
from agent_executor import (
    BelastingdienstAgentExecutor,  # type: ignore[import-untyped]
)
from starlette.applications import Starlette


if __name__ == '__main__':
    skill_lookup = AgentSkill(
        id='lookup_brief',
        name='Opzoeken van brieven',
        description=(
            'Zoek alle brieven op voor een BSN of haal één specifieke brief op via het URN-id. '
            'Invoer is JSON: {"bsn": "<bsn>", "query": "<vraag>"}.'
        ),
        input_modes=['application/json'],
        output_modes=['application/json'],
        tags=['belastingdienst', 'brieven', 'lookup'],
        examples=[
            '{"bsn": "100407560", "query": "Geef alle brieven voor dit BSN"}',
            '{"bsn": "", "query": "Geef brief urn:brief:test:06814417-374d-450d-8f22-7452896b4bc3"}',
        ],
    )

    skill_filter = AgentSkill(
        id='filter_brieven',
        name='Filteren van brieven',
        description=(
            'Filter brieven voor een BSN op basis van actie-vereiste, type of brief_code. '
            'Invoer is JSON: {"bsn": "<bsn>", "query": "<filtervraag>"}.'
        ),
        input_modes=['application/json'],
        output_modes=['application/json'],
        tags=['belastingdienst', 'brieven', 'filter'],
        examples=[
            '{"bsn": "100407560", "query": "Welke brieven vereisen actie?"}',
            '{"bsn": "105593199", "query": "Geef alleen de terugvorderingen"}',
            '{"bsn": "105312605", "query": "Brieven met code TOESLAGEN.HERZIENE-BESCHIKKING-ZORG"}',
        ],
    )

    public_agent_card = AgentCard(
        name='Belastingdienst Brieven Agent',
        description=(
            'Een agent die correspondentie van de Belastingdienst opzoekt en filtert '
            'voor nabestaanden en partners van overledenen.'
        ),
        version='0.1.0',
        default_input_modes=['application/json'],
        default_output_modes=['application/json'],
        capabilities=AgentCapabilities(streaming=True, extended_agent_card=True),
        supported_interfaces=[
            AgentInterface(
                protocol_binding='JSONRPC',
                url='http://127.0.0.1:9999',
            )
        ],
        skills=[skill_lookup],
    )

    extended_agent_card = AgentCard(
        name='Belastingdienst Brieven Agent (Extended)',
        description=(
            'Volledige toegang tot opzoek- en filterfuncties voor Belastingdienst-brieven '
            'voor geauthenticeerde gebruikers.'
        ),
        version='0.1.0',
        default_input_modes=['application/json'],
        default_output_modes=['application/json'],
        capabilities=AgentCapabilities(streaming=True, extended_agent_card=True),
        supported_interfaces=[
            AgentInterface(
                protocol_binding='JSONRPC',
                url='http://127.0.0.1:9999',
            )
        ],
        skills=[skill_lookup, skill_filter],
    )

    request_handler = DefaultRequestHandler(
        agent_executor=BelastingdienstAgentExecutor(),
        task_store=InMemoryTaskStore(),
        agent_card=public_agent_card,
        extended_agent_card=extended_agent_card,
    )

    routes = []
    routes.extend(create_agent_card_routes(public_agent_card))
    routes.extend(create_jsonrpc_routes(request_handler, '/'))

    app = Starlette(routes=routes)
    uvicorn.run(app, host='127.0.0.1', port=9999)
