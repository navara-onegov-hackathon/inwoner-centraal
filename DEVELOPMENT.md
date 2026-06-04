# Development

This repository contains multiple local services:

- `frontend/`: the user-facing web app
- `backend/`: the main backend application
- `mock-api/`: mock government APIs that the backend agent can consume
- `a2a/`: the Agent-to-Agent implementation, which runs as a server

For local development, run these as separate processes.

## Architecture Overview

The intended local setup is:

1. The frontend runs on `http://localhost:5173`.
2. The frontend proxies `/api` requests to the Django backend on `http://127.0.0.1:8000`.
3. The backend exposes the main application API.
4. Mock APIs under `mock-api/` provide external-source data for backend-agent integrations.
5. The A2A implementation runs as its own server on `http://127.0.0.1:9999`.

Current repo state:

- The frontend is already wired to the backend via the Vite `/api` proxy.
- The backend currently serves the reconciliation demo API from Django.
- The CAK mock API is present in this repository.
- The A2A service is present and runs as a standalone server.
- The broader "several mock APIs consumed by the backend agent" setup is the intended architecture, but today only the CAK mock API is included in-repo.

## Prerequisites

- Node.js 20+
- `pnpm` 10+
- Python 3.10+
- `uv` for the A2A service and mock API workflows

Optional:

- A `.env` file in the repository root if you want to enable GreenPT-backed behavior

## Environment Variables

Copy the example file if needed:

```bash
cp .env.example .env
```

Available variable:

```bash
GREENPT_API_KEY=
```

Notes:

- The backend loads `.env` from the repository root.
- The A2A server also loads environment variables from `.env`.
- If `GREENPT_API_KEY` is not set, the backend falls back to local discrepancy analysis instead of failing.

## 1. Run the Frontend

```bash
cd frontend
pnpm install
pnpm dev
```

Default URL:

- [http://localhost:5173](http://localhost:5173)

The frontend proxies `/api` to the backend at `http://127.0.0.1:8000`.

## 2. Run the Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 127.0.0.1:8000
```

Important endpoints:

- [http://127.0.0.1:8000/api/health/](http://127.0.0.1:8000/api/health/)
- [http://127.0.0.1:8000/api/data-reconciliation/](http://127.0.0.1:8000/api/data-reconciliation/)

## 3. Run the Mock APIs

Mock APIs live under `mock-api/` and should be started as separate services.

### CAK mock API

```bash
cd mock-api/cak
uv venv
source .venv/bin/activate
uv pip install -r requirements.txt
uvicorn main:app --host 127.0.0.1 --port 8001 --reload
```

Default URL:

- [http://127.0.0.1:8001](http://127.0.0.1:8001)

Useful endpoints:

- [http://127.0.0.1:8001/docs](http://127.0.0.1:8001/docs)
- [http://127.0.0.1:8001/openapi.json](http://127.0.0.1:8001/openapi.json)

At the moment, this is the only mock API included in the repository. If additional mock APIs are added later, start them in the same way from their own subdirectories under `mock-api/`.

## 4. Run the A2A Server

The A2A implementation runs as a server and should be started separately from the Django backend.

```bash
cd a2a
uv run .
```

Default URL:

- [http://127.0.0.1:9999](http://127.0.0.1:9999)

Optional test client:

```bash
cd a2a
uv run test_client.py
```

## Recommended Startup Order

Use four terminals:

1. Start the backend on `127.0.0.1:8000`.
2. Start the frontend on `localhost:5173`.
3. Start the mock APIs you need, beginning with CAK on `127.0.0.1:8001`.
4. Start the A2A server on `127.0.0.1:9999`.

This order keeps the frontend proxy working immediately and makes the backend integrations available as you bring them up.

## Quick Verification

After everything is running:

1. Open [http://localhost:5173](http://localhost:5173).
2. Check backend health at [http://127.0.0.1:8000/api/health/](http://127.0.0.1:8000/api/health/).
3. Check reconciliation data at [http://127.0.0.1:8000/api/data-reconciliation/](http://127.0.0.1:8000/api/data-reconciliation/).
4. Check CAK Swagger at [http://127.0.0.1:8001/docs](http://127.0.0.1:8001/docs).
5. If needed, verify the A2A server with `uv run test_client.py` from `a2a/`.

## Notes for Contributors

- The frontend and backend are separate applications and should be developed independently, even though the frontend can proxy backend API calls in development.
- The A2A implementation is not part of the Django process; treat it as its own server.
- Mock APIs represent external organizations and should stay isolated from the main backend process.
- If you add another mock API, place it under `mock-api/<service-name>/` and document its port and startup command here.
