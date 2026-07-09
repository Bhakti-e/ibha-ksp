# Ibha KSP

Crime intelligence web app for Karnataka State Police workflows: natural-language case search, analytics, investigation support, accused networks, OCR/RAG hooks, and role-aware backend access.

## Prerequisites

- Python 3.12 recommended
- `uv` for Python environment management
- Node.js 18+ and npm 9+
- PostgreSQL with a local database named `ibha`

Install `uv` if needed:

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

## Backend Setup

Create and populate the Python environment:

```bash
uv venv .venv
uv pip install -r catalyst/requirements.txt --python .venv/bin/python
```

Import the local database dump:

```bash
createdb ibha
psql -d ibha -f catalyst/datastore/ibha_dump.sql
psql -d ibha -f catalyst/datastore/extensions_4-5-6.sql
psql -d ibha -f catalyst/datastore/financial_test.sql
```

Backfill case embeddings after the database is loaded:

```bash
PYTHONPATH=$PWD .venv/bin/python scripts/backfill_embeddings.py
```

Create a local `.env` file. Do not commit it.

```bash
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ibha
DB_USER=your_postgres_user
DB_PASSWORD=

OPENROUTER_API_KEY=your_key_here
OPENROUTER_MODEL=qwen/qwen3.6-27b
OPENROUTER_FALLBACK_MODEL=google/gemma-3-27b-it
OPENROUTER_AGENT_MODEL=google/gemma-3-27b-it
OPENROUTER_REFERER=http://localhost:3000
OPENROUTER_TITLE=Ibha KSP
```

Start the local Flask wrapper:

```bash
PYTHONPATH=$PWD .venv/bin/python local_server.py
```

Backend runs at `http://localhost:8000/api/v1`.

## Frontend Setup

Install dependencies and run Next.js:

```bash
cd web
npm install
npm run dev
```

Frontend runs at `http://localhost:3000`.

For production build verification:

```bash
cd web
npm run build
```

## Demo Login

Use the admin demo account for full local visibility:

```text
admin.system@ksp.gov.in
password123
```

## Smoke Tests

After backend is running, login and check core endpoints:

```bash
TOKEN=$(curl -s -X POST http://localhost:8000/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin.system@ksp.gov.in","password":"password123"}' \
  | uv run python -c 'import sys,json; print(json.load(sys.stdin).get("token", ""))')

curl -H "Authorization: Bearer $TOKEN" http://localhost:8000/api/v1/admin/stats
curl -H "Authorization: Bearer $TOKEN" "http://localhost:8000/api/v1/trends/hotspots?days=30"
curl -H "Authorization: Bearer $TOKEN" http://localhost:8000/api/v1/decision-support/case/31/summary
```

Test chat tool calls:

```bash
curl -s -X POST http://localhost:8000/api/v1/chat \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"query":"Tell me more about 104430002202600012","mode":"text","language":"en"}'
```

Expected chat metadata includes `intent: tool_call` and a `tool_results` trace.

## Useful Routes

- `http://localhost:3000/chat`
- `http://localhost:3000/screens/analytics`
- `http://localhost:3000/screens/investigations`
- `http://localhost:3000/screens/admin`

## Dependency Notes

- Python dependencies are frozen in `catalyst/requirements.txt` from the local `.venv` using `uv pip freeze --python .venv/bin/python`.
- Frontend dependencies are managed by `web/package.json` and `web/package-lock.json`.
- `.env`, `.env.example`, private plans, and local agent notes are intentionally ignored.
