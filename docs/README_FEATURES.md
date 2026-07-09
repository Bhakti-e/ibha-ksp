# Features & Problem Solved

## The Problem

Karnataka State Police officers deal with thousands of FIRs (First Information Reports) across hundreds of stations. Finding patterns — which areas are hotspots, which accused are connected, how crime is trending — requires manually querying databases or waiting for reports.

**Ibha** makes this instant. Any officer, from a Constable to a DSP, can ask questions in plain English and get real answers from the live database — filtered to exactly what they are authorised to see.

---

## Features

### 1. Natural Language Crime Search With Tool Calls
**What it does:** Officers type questions like *"Show theft cases"*, *"Tell me more about FIR 104430002202600012"*, or *"How many theft cases are there"*. The chat agent selects safe backend tools such as `search_cases`, `lookup_case`, or `count_cases` and returns grounded results.

**How it helps:** No SQL knowledge needed. Any officer can query the database as if they're asking a colleague. The UI shows the answer, structured data, and the backend tools used.

---

### 2. Crime Analytics & Hotspot Mapping
**What it does:** The Analytics page ranks stations by crime count, labels risk level, shows month-by-month crime breakdowns, and maps filtered hotspots using Leaflet/OpenStreetMap.

**How it helps:** Senior officers (DSP, Inspector) can immediately see which areas need more patrol resources. The colour-coded risk badges make the situation readable at a glance.

---

### 3. Criminal Network Visualisation
**What it does:** Enter any accused person's ID and see a D3 canvas graph of everyone connected to them — co-accused, shared cases, and how many crimes link them. Chat can also call graph tools such as `get_accused_network`.

**How it helps:** Investigators can quickly spot repeat offenders and criminal gangs without manually cross-referencing case files. Links that would take hours to find appear in seconds.

---

### 4. Investigation Decision Support

**What it does:** The Investigations hub combines accused profile, network graph, AI-assisted case summary, similar cases, timeline, leads, and synthetic financial test links.

**How it helps:** Investigators get one workspace for case triage instead of switching between disconnected pages.

---

### 5. OCR And RAG Hooks

**What it does:** The chat screen supports OCR upload for documents. The backend includes a guarded `rag_search_knowledge` tool for approved indexed documents when document tables are available.

**How it helps:** Uploaded FIRs and supporting documents can feed future retrieval workflows while keeping tool execution controlled.

---

### 6. Role-Based Access Control (RLS)
**What it does:** Every user's data access is restricted based on their rank. A Constable sees only their station's cases. A DSP sees their full district. An SCRB Analyst sees the whole state.

**How it helps:** Sensitive case data stays within the right hands. The restriction is enforced at the database query level — it cannot be bypassed through the UI.

| Role | Data Access |
|------|------------|
| Constable / Sub-Inspector / Inspector | Own station |
| DSP | Full district |
| SCRB_Analyst | State-wide |
| Admin | State-wide + system logs |

---

### 7. Audit Logging
**What it does:** Every query made through the system is logged — who asked, what they asked, when, and how many results were returned.

**How it helps:** Supervisors and administrators can review how the system is being used, detect unusual access patterns, and maintain accountability.

---

### 8. Multilingual Ready
**What it does:** The API accepts a `language` parameter. The NLP layer is designed to be extended with Kannada and other regional language support.

**How it helps:** Officers who are more comfortable in Kannada can eventually query in their native language — making the tool accessible to all ranks.

---

## Demo Users

| Email | Password | Role |
|-------|----------|------|
| rajesh.kumar@ksp.gov.in | password123 | Constable — Station 1 |
| arun.desai@ksp.gov.in | password123 | Inspector — Station 1 |
| lakshmi.rao@ksp.gov.in | password123 | DSP — District-wide |
| priya.menon@ksp.gov.in | password123 | SCRB_Analyst — State-wide |
| admin.system@ksp.gov.in | password123 | Admin — Full access |

---

## Tech Summary (for judges)

- **Agent tool calls** — OpenRouter can plan registered tools; deterministic keyword fallback remains available.
- **Real database** — 35 FIR records, proper KSP schema, live SQL queries.
- **Security by design** — JWT auth, row-level security, audit logging, no model-generated SQL.
- **Production architecture** — Zoho Catalyst serverless backend, Next.js frontend, PostgreSQL.
