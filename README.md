# Inwoner Centraal

Prototype for the **OneGov #2: Inwoner Centraal - Nabestaanden** hackathon by GovTech NL and ICTU.

When a partner dies, the surviving partner should not have to become the integration layer between government organisations. This project shows a calm, proactive government service that assembles the relevant information, prepares actions, and only asks the citizen for input when it is truly needed.

## What We Built

We focus on the Truus and Cees case from the challenge material. Cees has died, Truus is grieving, and several organisations may still send letters, obligations, or payments to different places and at different moments.

Our prototype gives Truus one guided flow:

- a condolence-first onboarding experience
- delegation choices, including support for someone else handling the process
- a service-level choice: do it myself, do it together, or handle as much as possible for me
- background discovery across government sources
- verification of gathered personal data
- one overview of what is already arranged, what needs attention, and what the system can handle

The product goal is not another dashboard. It is an orchestration layer that makes fragmented government processes feel like one coordinated service.

## Why It Fits The Brief

The prototype maps directly to the challenge themes:

- **Informeren:** Truus gets one understandable overview instead of scattered letters and unclear obligations.
- **Toegang geven:** the flow assumes scoped delegated access, so a bereaved partner or helper can act from one place.
- **Handelen namens:** the platform prepares or executes supported actions, such as address correction or process follow-up, when allowed.

AI is used in the background for discovery, tool selection, source interpretation, normalization, discrepancy detection, and generated follow-up questions. It is deliberately not presented as an open grief chatbot.

## Demo Flow

1. Truus opens the service and receives a calm condolence message.
2. She chooses who will handle the administrative process: herself, someone else, or together.
3. She chooses how much help she wants from the system.
4. The intake discovery agent starts gathering information from connected sources.
5. Truus verifies or corrects key data, such as address details.
6. She lands in a personalised overview with arranged items, open tasks, expected follow-up, and actions the platform can take.

The intended demo story is documented in [`docs/demo-narrative.md`](docs/demo-narrative.md).

## Architecture

The repository contains a local multi-service prototype:

- `frontend/` - React, TypeScript, Vite user interface
- `backend/` - Django orchestration backend and reconciliation APIs
- `mock-api/` - FastAPI mock government APIs for CAK, RDW, and SVB
- `a2a/` - Belastingdienst Agent-to-Agent service for correspondence data
- `docs/` - demo narrative, process definitions, and design notes

High-level flow:

1. Frontend starts onboarding and calls the backend through `/api`.
2. Backend streams intake discovery progress with Server-Sent Events.
3. The intake agent inspects configured APIs, process definitions, and A2A agents.
4. Mock APIs and the A2A service return source data for the Truus/Cees case.
5. Backend normalizes the result into the overview shape used by the frontend.

The deeper intake design is in [`docs/intake-discovery-design.md`](docs/intake-discovery-design.md).

## Run The Demo

Start the full local stack:

```bash
docker compose up --build
```

Then open:

- Frontend: http://localhost:5173
- Backend health: http://localhost:8000/api/health/
- Reconciliation API: http://localhost:8000/api/data-reconciliation/
- CAK mock API: http://localhost:8001/docs
- RDW mock API: http://localhost:8002/docs
- SVB mock API: http://localhost:8003/docs
- Belastingdienst A2A service: http://localhost:9999

If your Docker installation uses the standalone Compose binary, run `docker-compose up --build` instead.

## Local Development

For running services separately, see [`DEVELOPMENT.md`](DEVELOPMENT.md).

Common commands:

```bash
cd frontend
pnpm install
pnpm dev
```

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 127.0.0.1:8000
```

```bash
cd a2a
uv run .
```

## Environment

Copy `.env.example` if you want to enable external model-backed behavior:

```bash
cp .env.example .env
```

Supported variable:

```bash
GREENPT_API_KEY=
```

Without `GREENPT_API_KEY`, the backend keeps running and falls back where possible to local analysis for the reconciliation demo.

## Useful References

- [`docs/demo-narrative.md`](docs/demo-narrative.md) - jury story and spoken pitch track
- [`docs/intake-discovery-design.md`](docs/intake-discovery-design.md) - agent-driven intake design
- [`docs/challenge-processes.yaml`](docs/challenge-processes.yaml) - challenge process inventory
- [`DEVELOPMENT.md`](DEVELOPMENT.md) - manual local development setup
- Challenge source material: [`govtechnl/onegov2-inwoner-centraal`](https://github.com/govtechnl/onegov2-inwoner-centraal)
