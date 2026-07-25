# Architecture
> Last updated: UI/UX institutional redesign + OCR + D3 network + Pydantic agents

Ibha is a crime intelligence system for Karnataka State Police (KSP). It lets officers query FIR data in natural language, view crime trends, and visualise criminal networks — all through a secure, role-restricted web interface.

---

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router) + Tailwind CSS |
| Backend | Zoho Catalyst — Python Cloud Functions |
| Database | PostgreSQL (official KSP schema) |
| NLP | Keyword-based intent parser (no external LLM) |
| Auth | JWT tokens, 4-hour expiry |

---

## How the pieces talk

```
┌─────────────────────────────────────────────────────────┐
│                        Browser                          │
│              Next.js 14  (web/)                         │
│  Login → Chat → Trends → Network → Admin               │
└──────────────────────┬──────────────────────────────────┘
                       │  HTTPS  REST/JSON
                       ▼
┌─────────────────────────────────────────────────────────┐
│            Zoho Catalyst  (catalyst/)                   │
│                                                         │
│  POST /auth/login     →  auth.py   (JWT sign)          │
│  POST /chat           →  chat.py   (NLP + SQL)         │
│  GET  /trends/*       →  trends.py (aggregations)      │
│  GET  /network/*      →  network.py (graph builder)    │
│  GET  /admin/*        →  admin.py  (audit logs)        │
│                                                         │
│  lib/nlp_simple.py    — keyword intent detection       │
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

## Request flow — Chat query example

```
Officer types: "Show theft cases last 30 days"
       │
       ▼
Frontend (chat/page.tsx)
  POST /api/v1/chat  { query, language }
       │
       ▼
chat.py
  → nlp_simple.py   detects intent = "query_firs", crime_type = "Theft"
  → query_builder.py builds parameterised SQL with RLS filter
       (WHERE station_id = <officer's station>  ← enforced for Constable)
  → db.py           executes query on PostgreSQL
  → returns { answer, data[], explanation_contract }
       │
       ▼
Frontend renders
  message bubble + FIR table + explanation panel
```

---

## Role-based data access (RLS)

| Role | Sees |
|------|------|
| Constable / Sub-Inspector / Inspector | Own station only |
| DSP | Full district |
| SCRB_Analyst | State-wide |
| Admin | State-wide + audit logs |

Enforced inside `query_builder.py` — not in the UI.
