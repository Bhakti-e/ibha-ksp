# Architecture
> Last updated: agent tool calls, tactical UI, OCR/RAG hooks, D3 network, and decision support

Ibha is a crime intelligence system for Karnataka State Police (KSP). It lets officers query FIR data in natural language, view crime trends, and visualise criminal networks — all through a secure, role-restricted web interface.

---

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router) + Tailwind CSS |
| Backend | Zoho Catalyst — Python Cloud Functions |
| Database | PostgreSQL (official KSP schema) |
| Agent layer | OpenRouter-assisted tool planner with deterministic keyword fallback |
| Tool execution | Registered Python tools only; no model-generated SQL |
| Auth | JWT tokens, 4-hour expiry |

---

## How the pieces talk

```
┌─────────────────────────────────────────────────────────┐
│                        Browser                          │
│              Next.js 14  (web/)                         │
│  Login → Chat → Analytics → Investigations → Admin     │
└──────────────────────┬──────────────────────────────────┘
                       │  HTTPS  REST/JSON
                       ▼
┌─────────────────────────────────────────────────────────┐
│            Zoho Catalyst  (catalyst/)                   │
│                                                         │
│  POST /auth/login     →  auth.py   (JWT sign)          │
│  POST /chat           →  chat.py   (agent tools + SQL) │
│  GET  /trends/*       →  trends.py (hotspots + map)    │
│  GET  /network/*      →  network.py (graph builder)    │
│  GET  /profiling/*    →  profiling.py (risk profile)   │
│  GET  /decision-*     →  decision_support.py           │
│  GET  /admin/*        →  admin.py  (audit logs)        │
│                                                         │
│  agents/tools.py      — registered safe tool handlers  │
│  agents/orchestrator  — OpenRouter intent extraction   │
│  lib/openrouter_*     — model calls + tool planning    │
│  lib/query_builder.py — SQL builder with RLS           │
│  lib/auth_utils.py    — JWT encode / verify            │
│  lib/db.py            — PostgreSQL connection pool     │
└──────────────────────┬──────────────────────────────────┘
                       │  psycopg2  SQL
                       ▼
┌─────────────────────────────────────────────────────────┐
│              PostgreSQL  (ibha database)                │
│                                                         │
│  CaseMaster   — FIR records                            │
│  Accused      — Accused persons                        │
│  Victims      — Victim records                         │
│  Unit         — Police stations                        │
│  users        — Application users + roles              │
└─────────────────────────────────────────────────────────┘
```

---

## Request flow — Chat tool-call example

```
Officer types: "Profile accused 13 network"
       │
       ▼
Frontend (chat/page.tsx)
  POST /api/v1/chat  { query, language, conversation }
       │
       ▼
chat.py
  → orchestrator extracts entities using OpenRouter or keyword fallback
  → OpenRouter tool planner selects registered tools when configured
  → deterministic fallback planner selects tools if model planning fails
  → agents/tools.py validates tool names + arguments
  → query_builder.py builds parameterised SQL with RLS filter
  → db.py executes PostgreSQL queries
  → returns { answer, data[], metadata.tool_calls, metadata.tool_results }
       │
       ▼
Frontend renders
  message bubble + FIR/generic result table + tool trace + explanation panel
```

The model never sends raw SQL. It can only request registered tools such as `lookup_case`, `search_cases`, `count_cases`, `get_trends`, `get_accused_network`, `get_accused_profile`, `rag_search_knowledge`, and `ocr_extract_document`.

---

## Agent Tooling

| Tool | Purpose |
|------|---------|
| `search_cases` | Search FIR/case rows by crime type and date range |
| `lookup_case` | Retrieve one FIR/CaseMasterID |
| `count_cases` | Count cases by filter |
| `get_hotspots` | Return filtered station hotspots with coordinates |
| `get_trends` | Return monthly trend rows |
| `get_case_summary` | Return grounded case summary facts |
| `get_accused_network` | Return accused/case network rows |
| `get_accused_profile` | Return accused record and linked cases |
| `rag_search_knowledge` | Search approved indexed documents when available |
| `ocr_extract_document` | Guarded upload-only OCR hook |

All tool handlers live in `catalyst/functions/agents/tools.py`. They use fixed Python handlers and parameterized SQL.

---

## Role-based data access (RLS)

| Role | Sees |
|------|------|
| Constable / Sub-Inspector / Inspector | Own station only |
| DSP | Full district |
| SCRB_Analyst | State-wide |
| Admin | State-wide + audit logs |

Enforced inside `query_builder.py` and tool handlers — not in the UI.
