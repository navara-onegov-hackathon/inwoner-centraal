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
    HelloWorldAgentExecutor,  # type: ignore[import-untyped]
)
from starlette.applications import Starlette


if __name__ == '__main__':
    # --8<-- [start:AgentSkill]
    # Defines the abilities or functions that agent can perform.
    skill = AgentSkill(
        id='llm_chat',
        name='LLM Chat',
        description='Answers questions and carries out tasks using the GreenPT gemma4 language model.',
        input_modes=['text/plain'],
        output_modes=['text/plain'],
        tags=['a2a', 'llm', 'greenpt'],
        examples=['What is the capital of France?', 'Summarise this text for me.'],
    )
    # --8<-- [end:AgentSkill]
    # Defines an optional additional skill for the agent that is not visible in the public card.
    extended_skill = AgentSkill(
        id='llm_chat_extended',
        name='LLM Chat (Extended)',
        description='Extended LLM chat capabilities for authenticated users.',
        tags=['a2a', 'llm', 'greenpt', 'extended'],
        examples=['Write a detailed report on...', 'Help me debug this code.'],
    )

    # --8<-- [start:AgentCard]
    # Define a public-facing agent card that allows clients to discover your agent's capabilities.
    public_agent_card = AgentCard(
        # Basic identity information of A2A server
        name='Inwoner Centraal Agent',  # Identity
        description='An LLM-powered agent using GreenPT (gemma4).',
        version='0.1.0',
        # Default Media Types for the agent's interactions
        default_input_modes=['text/plain'],  # Supported media types
        default_output_modes=['text/plain'],
        # Supported A2A features (like streaming or extended config)
        capabilities=AgentCapabilities(streaming=True, extended_agent_card=True),
        # Ordered list of endpoints and protocols where the service can be reached
        supported_interfaces=[
            AgentInterface(
                protocol_binding='JSONRPC',
                url='http://127.0.0.1:9999',
            )
        ],
        # The list of AgentSkill objects that this agent offers
        skills=[skill],
        # Optional attributes (omitted here for simplicity):
        # icon_url                         -> A URL to an icon representing the agent
    )
    # --8<-- [end:AgentCard]

    # Defines the authenticated extended agent card with
    # extended skills that are visible only to authenticated users
    extended_agent_card = AgentCard(
        name='Inwoner Centraal Agent (Extended)',
        description='Full-featured LLM agent for authenticated users.',
        version='0.1.0',
        default_input_modes=['text/plain'],
        default_output_modes=['text/plain'],
        capabilities=AgentCapabilities(streaming=True, extended_agent_card=True),
        supported_interfaces=[
            AgentInterface(
                protocol_binding='JSONRPC',
                url='http://127.0.0.1:9999',
            )
        ],
        skills=[
            skill,
            extended_skill,
        ],  # Both skills for the extended card
    )
    # --8<-- [start:RequestHandler]
    # The RequestHandler processes incoming requests and manages tasks
    request_handler = DefaultRequestHandler(
        # Agent executor handles the execution of the client requests
        agent_executor=HelloWorldAgentExecutor(),
        # The task_store is used to store and manage tasks
        task_store=InMemoryTaskStore(),
        # Public agent card for unauthenticated users
        agent_card=public_agent_card,
        # Extended agent card for authenticated users
        extended_agent_card=extended_agent_card,
    )
    # --8<-- [end:RequestHandler]
    # --8<-- [start:ServerRoutes]
    # Creating the routes for the A2A server
    # These routes handle the incoming requests from the clients
    # and the outgoing responses to the clients
    routes = []

    # Create routes for the agent card
    routes.extend(create_agent_card_routes(public_agent_card))

    # Create routes for the JSONRPC protocol
    # Alternatively, you can choose GRPC or HTTP_JSON as protocol bindings
    # based on your requirements
    routes.extend(create_jsonrpc_routes(request_handler, '/'))
    # --8<-- [end:ServerRoutes]
    # --8<-- [start:AppServer]

    # Create a web app with the defined routes
    # Here we are using Starlette, a lightweight ASGI web framework to serve the agent
    # Alternatively, you can choose FastAPI or other ASGI frameworks
    app = Starlette(routes=routes)

    # Run the app
    # Uvicorn is a production-ready ASGI HTTP server
    uvicorn.run(app, host='127.0.0.1', port=9999)
    # --8<-- [end:AppServer]
