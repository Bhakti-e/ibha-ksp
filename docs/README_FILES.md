# Repository Files Overview

```
ibha-ksp/
├── web/                          Next.js 14 frontend application
├── catalyst/                     Zoho Catalyst backend configuration
├── data/                         Sample data and schema diagrams
├── docs/                         Public documentation; docs/plan is ignored/private
├── scripts/                      Utility scripts such as embedding backfill
├── local_server.py               Flask dev wrapper — runs backend locally on port 8000
└── README.md                     Installation and local run guide
```

---

## `web/` — Frontend

| Path | What it is |
|------|-----------|
| `web/app/layout.tsx` | Root layout — imports globals.css, sets up Inter font |
| `web/app/globals.css` | Tailwind directives + base dark theme styles |
| `web/tailwind.config.ts` | Tailwind config — content paths, custom animations |
| `web/postcss.config.js` | PostCSS config — required for Tailwind to compile |
| `web/app/login/page.tsx` | Login route (`/login`) |
| `web/app/chat/page.tsx` | Chat route (`/chat`) |
| `web/app/screens/auth/login.tsx` | Login page component — dark card, demo credentials |
| `web/app/screens/chat/page.tsx` | Chat interface — message bubbles, FIR data table |
| `web/app/screens/analytics/page.tsx` | Consolidated analytics — hotspots, trends, map, sociological charts |
| `web/app/screens/investigations/page.tsx` | Consolidated investigation hub — graph, profile, decision support |
| `web/app/screens/trends/page.tsx` | Legacy/standalone crime trends route |
| `web/app/screens/network/page.tsx` | Legacy/standalone network graph route |
| `web/app/components/map/CrimeHeatmap.tsx` | Leaflet/OpenStreetMap hotspot map |
| `web/app/screens/admin/page.tsx` | Admin dashboard — stats cards, audit log table |
| `web/app/components/layout/Navbar.tsx` | Sticky nav bar — logo, links, user info, logout |
| `web/app/components/layout/BaseLayout.tsx` | Wraps all authed pages with Navbar + dark background |
| `web/app/lib/api.ts` | Axios API client — all backend calls in one place |
| `web/app/lib/types.ts` | TypeScript types for API request/response shapes |
| `web/.env.local` | `NEXT_PUBLIC_CATALYST_API_BASE_URL=http://localhost:8000/api/v1` |

---

## `catalyst/` — Backend

| Path | What it is |
|------|-----------|
| `catalyst/functions/auth.py` | Login endpoint — verifies credentials, returns JWT |
| `catalyst/functions/chat.py` | Chat endpoint — orchestrates entity extraction, tool planning, tool execution, response |
| `catalyst/functions/trends.py` | Hotspots and monthly trend aggregations |
| `catalyst/functions/network.py` | Criminal network graph builder |
| `catalyst/functions/decision_support.py` | Case summaries, similar cases, timelines, leads |
| `catalyst/functions/profiling.py` | Accused risk/profile endpoint |
| `catalyst/functions/sociological.py` | Demographic and sociological aggregates |
| `catalyst/functions/financial.py` | Synthetic financial test data endpoint |
| `catalyst/functions/agents/tools.py` | Registered safe tool-call handlers |
| `catalyst/functions/agents/orchestrator.py` | OpenRouter-first intent/entity extraction with fallback |
| `catalyst/functions/lib/openrouter_client.py` | OpenRouter client, tool planner, structured summary helpers |
| `catalyst/functions/lib/embeddings.py` | Embedding and cosine similarity helpers |
| `catalyst/functions/admin.py` | Audit logs and system stats endpoints |
| `catalyst/functions/health.py` | Health check — `GET /health` |
| `catalyst/functions/lib/nlp_simple.py` | Keyword intent parser — detects crime type, date range, etc. |
| `catalyst/functions/lib/query_builder.py` | SQL builder — constructs safe parameterised queries with RLS |
| `catalyst/functions/lib/auth_utils.py` | JWT encode/verify, password check |
| `catalyst/functions/lib/db.py` | PostgreSQL connection (reads DB_* env vars) |
| `catalyst/functions/lib/logging_utils.py` | Structured logging helpers |
| `catalyst/api/openapi.yaml` | OpenAPI spec for all API endpoints |
| `catalyst/auth/roles.json` | Role definitions (Constable, Inspector, DSP, etc.) |
| `catalyst/auth/policies.json` | Access policies per role |

---

## `catalyst/datastore/` — Database files

| File | What it is |
|------|-----------|
| `init_db.sql` | Creates all tables (CaseMaster, Accused, Victims, Unit, users) |
| `ibha_dump.sql` | Full pg_dump of the local `ibha` database — use this to set up locally |
| `seed_data.sql` | Inserts 35 sample FIRs + 6 demo users |
| `schema_official_ksp.sql` | Full official KSP schema |
| `schema.sql` | Simplified working schema |
| `extensions_4-5-6.sql` | Case embeddings, risk cache, and analysis views |
| `financial_test.sql` | Synthetic financial accounts and transactions for demo/testing |

---

## `data/` — Sample data

| File | What it is |
|------|-----------|
| `data/samples/casemaster_sample.csv` | Sample FIR rows |
| `data/samples/accused_sample.csv` | Sample accused records |
| `data/samples/victims_sample.csv` | Sample victim records |
| `data/samples/locations_sample.csv` | Sample location data |

---

## Root-level scripts

| File | What it is |
|------|-----------|
| `local_server.py` | Flask wrapper — runs all Catalyst functions locally on port 8000 |
| `test_login.py` | Quick Python script to test the login endpoint |
| `scripts/backfill_embeddings.py` | Backfills case embeddings after database import |
| `START_IBHA.ps1` | PowerShell script to start backend + open browser |

---

## `docs/` — Public documentation

| File | What it is |
|------|-----------|
| `docs/README_ARCHITECTURE.md` | System architecture and request flow |
| `docs/README_FEATURES.md` | Features and problem statement |
| `docs/README_FILES.md` | This file — repo structure overview |

`docs/plan/` is intentionally ignored and reserved for private local planning notes.
