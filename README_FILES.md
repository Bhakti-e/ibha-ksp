# Repository Files Overview

```
ibha-ksp/
├── web/                          Next.js 14 frontend application
├── catalyst/                     Zoho Catalyst backend configuration
├── data/                         Sample data and schema diagrams
├── docs/                         (removed — see README_*.md files)
├── local_server.py               Flask dev wrapper — runs backend locally on port 8000
├── ibha_dump.sql                 Full PostgreSQL dump — import to set up the database
├── README_ARCHITECTURE.md        System architecture and request flow
├── README_FILES.md               This file — repo structure overview
└── README_FEATURES.md            Features and problem statement (for judges)
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
| `web/app/screens/trends/page.tsx` | Crime trends — hotspot list, risk badges, monthly table |
| `web/app/screens/network/page.tsx` | Network graph — canvas visualisation of accused links |
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
| `catalyst/functions/chat.py` | Chat endpoint — orchestrates NLP → SQL → response |
| `catalyst/functions/trends.py` | Hotspots and monthly trend aggregations |
| `catalyst/functions/network.py` | Criminal network graph builder |
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
| `seed_data.sql` | Inserts 35 sample FIRs + 6 demo users |
| `schema_official_ksp.sql` | Full official KSP schema |
| `schema.sql` | Simplified working schema |

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
| `ibha_dump.sql` | Full pg_dump of the ibha database — use this to set up locally |
| `test_login.py` | Quick Python script to test the login endpoint |
| `START_IBHA.ps1` | PowerShell script to start backend + open browser |
