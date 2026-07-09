# Features & Problem Solved

## The Problem

Karnataka State Police officers deal with thousands of FIRs (First Information Reports) across hundreds of stations. Finding patterns — which areas are hotspots, which accused are connected, how crime is trending — requires manually querying databases or waiting for reports.

**Ibha** makes this instant. Any officer, from a Constable to a DSP, can ask questions in plain English and get real answers from the live database — filtered to exactly what they are authorised to see.

---

## Features

### 1. Natural Language Crime Search
**What it does:** Officers type questions like *"Show theft cases in my station last 30 days"* or *"List heinous crimes from January"* and get back a list of matching FIRs.

**How it helps:** No SQL knowledge needed. Any officer can query the database as if they're asking a colleague. Results are shown as structured cards with case number, date, crime type, and status.

---

### 2. Crime Trends & Hotspot Detection
**What it does:** The Trends page ranks stations by crime count, labels each with a risk level (HIGH / MEDIUM / LOW), and shows month-by-month crime breakdowns.

**How it helps:** Senior officers (DSP, Inspector) can immediately see which areas need more patrol resources. The colour-coded risk badges make the situation readable at a glance.

---

### 3. Criminal Network Visualisation
**What it does:** Enter any accused person's ID and see a graph of everyone connected to them — co-accused, shared cases, and how many crimes link them.

**How it helps:** Investigators can quickly spot repeat offenders and criminal gangs without manually cross-referencing case files. Links that would take hours to find appear in seconds.

---

### 4. Role-Based Access Control (RLS)
**What it does:** Every user's data access is restricted based on their rank. A Constable sees only their station's cases. A DSP sees their full district. An SCRB Analyst sees the whole state.

**How it helps:** Sensitive case data stays within the right hands. The restriction is enforced at the database query level — it cannot be bypassed through the UI.

| Role | Data Access |
|------|------------|
| Constable / Sub-Inspector / Inspector | Own station |
| DSP | Full district |
| SCRB_Analyst | State-wide |
| Admin | State-wide + system logs |

---

### 5. Audit Logging
**What it does:** Every query made through the system is logged — who asked, what they asked, when, and how many results were returned.

**How it helps:** Supervisors and administrators can review how the system is being used, detect unusual access patterns, and maintain accountability.

---

### 6. Multilingual Ready
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

- **No external LLM or paid API** — NLP runs locally with keyword matching.
- **Real database** — 35 FIR records, proper KSP schema, live SQL queries.
- **Security by design** — JWT auth, row-level security, audit logging.
- **Production architecture** — Zoho Catalyst serverless backend, Next.js frontend, PostgreSQL.
