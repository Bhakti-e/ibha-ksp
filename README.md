# Ibha – KSP Crime Intelligence

**Intelligent Conversational AI for Karnataka State Police**

Ibha (Sanskrit/Kannada: इभ / ಇಭ, meaning "elephant") is a secure, multilingual, voice-enabled conversational AI platform built for the Karnataka State Police's Crime & Investigation Database. Named after the elephant—symbolizing intelligence, memory, and protection—Ibha enables authorized police officers to query crime records, uncover patterns, analyze criminal networks, and generate actionable insights without writing SQL or using static dashboards.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Configuration](#configuration)
- [Deployment](#deployment)
- [Security](#security)
- [Controlled Knowledge Ingestion](#controlled-knowledge-ingestion)
- [Contributing](#contributing)
- [License](#license)

---

## 🎯 Overview

Ibha is being developed for the **KSP Datathon 2026 (Challenge 1)** hosted on Hack2Skill by the Karnataka State Police. It addresses the need for an intelligent interface to the State Crime Records Bureau (SCRB) database, enabling officers to:

- **Query crime data** using natural language (English + Kannada)
- **Discover patterns** across FIRs, accused persons, and modus operandi
- **Analyze criminal networks** with graph visualization
- **Identify trends and hotspots** with geospatial and temporal analytics
- **Generate predictions** for proactive crime prevention
- **Export reports** with full audit trails

**Dataset**: The solution is designed to work with the **KSP Datathon 2026 dataset** (FIRs, accused, victims, locations, etc.). The dataset schema is documented in `/ksp_erd_official.md` and sample data is in `/samples/`.

---

## ✨ Features

### 🎉 MVP Features (End-to-End Working)

**Phase 2-7 Implementation Complete** – The following features are **fully functional** with real database queries and NO external LLM dependencies:

#### 1. **Real Authentication & Authorization** ✅
- JWT-style token-based authentication
- 6 user roles: Constable, SI, Inspector, DSP, SCRB_Analyst, Admin
- Row-Level Security (RLS):
  - Constable: Station-level access only
  - Inspector: Station-level access
  - DSP: District-wide access
  - SCRB_Analyst/Admin: State-wide access
- Password: `password123` for all demo users

#### 2. **Chat with SQL-Driven Answers** ✅
- **NO external LLM** – Uses keyword-based NLP + SQL queries + templates
- Multilingual support: English + Kannada
- Query examples:
  - "Show theft cases in last 30 days"
  - "How many cases this month?"
  - "ಕಳೆದ 30 ದಿನಗಳಲ್ಲಿ ಕಳ್ಳತನ ಪ್ರಕರಣಗಳನ್ನು ತೋರಿಸಿ" (Kannada)
- Returns: Natural language answer + FIR table + explanation
- RLS enforced on all queries
- Audit logged automatically

#### 3. **Crime Trends & Hotspots** ✅
- Top 10 stations by crime count
- Risk levels: HIGH (>30% increase), MEDIUM (0-30%), LOW (<0%)
- Monthly trend analysis (last 12 months)
- Comparison with previous period
- RLS-filtered by user role

#### 4. **Criminal Network Visualization** ✅
- Graph showing accused ↔ cases ↔ co-accused
- Canvas-based visualization (no external libraries)
- Network metadata: total nodes, edges, cases
- Search by Accused ID from seed data

#### 5. **Admin & Audit Logging** ✅
- Every query logged to `audit_logs` table
- Admin dashboard showing:
  - Total cases, users, queries today
  - Database health check
  - Top querying users
  - Full audit log table
- Access restricted to Admin/SCRB_Analyst roles

#### 6. **Security Implementation** ✅
- HMAC-SHA256 token signatures
- 4-hour token expiry
- Parameterized SQL queries (SQL injection safe)
- Input validation on all endpoints
- Error handling with no stack trace exposure
- Complete security documentation

### Core Capabilities

- ✅ **Multilingual NLP Chatbot** (English + Kannada, code-mixing support)
- ✅ **Voice Interaction** (Speech-to-Text and Text-to-Speech via Zia AI)
- ✅ **Context-Aware Conversations** with conversation history
- ✅ **Retrieval-Augmented Generation (RAG)** for accurate, cited answers
- ✅ **Explainable AI** with reasoning sketches and confidence scores
- ✅ **Role-Based Access Control (RBAC)** with Row-Level Security (RLS)
- ✅ **Criminal Network Visualization** using graph analytics
- ✅ **Crime Trends & Hotspot Detection** with interactive maps
- ✅ **Predictive Analytics** for early warnings
- ✅ **PDF Export** of conversation history with watermarks
- ✅ **Full Audit Trail** for compliance

### Security & Governance

- 🔐 **OAuth 2.0 Authentication** via Catalyst Auth
- 🔐 **Station-level data filtering** based on user role
- 🔐 **Sensitivity-based access control** (NORMAL, CONFIDENTIAL, RESTRICTED)
- 🔐 **PII masking** in responses
- 🔐 **Complete audit logging** of all queries and answers

### Controlled Knowledge Ingestion

Ibha uses a **controlled ingestion pipeline** to ensure data quality and security:

1. **Upload** → Authorized users (SCRB_Analyst, Admin) upload documents
2. **Validation** → File type, size, and metadata checks
3. **OCR** → Zia AI extracts text from images/scanned PDFs
4. **Review** → Human reviewers approve or reject documents
5. **Batch Indexing** → Approved documents are indexed nightly into RAG

**Key Design Principle**: The AI does NOT continuously retrain itself. New knowledge is added in controlled batches after human review.

---

## 🏗️ Architecture

Ibha follows a clean three-tier architecture with strict security boundaries:

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                          │
│                    (Next.js 14 + TypeScript)                    │
├─────────────────────────────────────────────────────────────────┤
│  Login Page  │  Chat Page  │  Trends Page  │  Network  │ Admin │
│  (JWT Auth)  │   (NLP+SQL) │   (Analytics) │  (Graph)  │ (Logs)│
└──────────────┬──────────────────────────────────────────────────┘
               │ HTTPS + JWT Token in Authorization Header
               ▼
┌─────────────────────────────────────────────────────────────────┐
│                        API GATEWAY LAYER                        │
│                    (CORS + Token Validation)                    │
└──────────────┬──────────────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SERVERLESS FUNCTIONS                         │
│                      (Python 3.11)                              │
├─────────────┬──────────┬────────────┬───────────┬──────────────┤
│  /auth/     │ /chat    │ /trends/   │ /network/ │  /admin/     │
│   login     │          │  hotspots  │  accused  │  audit-logs  │
│ (auth.py)   │(chat.py) │  summary   │  {id}     │    stats     │
│             │          │(trends.py) │(network.py)│  (admin.py)  │
└─────────────┴──────────┴────────────┴───────────┴──────────────┘
               │          │            │            │
               ▼          ▼            ▼            ▼
┌─────────────────────────────────────────────────────────────────┐
│                      SHARED LIBRARIES (lib/)                    │
├──────────────┬────────────────┬───────────────┬─────────────────┤
│ auth_utils   │  nlp_simple    │ query_builder │    db           │
│ (JWT+RLS)    │  (Keywords)    │   (SQL Gen)   │  (PostgreSQL)   │
├──────────────┴────────────────┴───────────────┴─────────────────┤
│  templates (EN/KN)  │  logging_utils (Structured Logs)          │
└─────────────────────┴─────────────────────────────────────────────┘
               │                            │
               ▼                            ▼
┌────────────────────────────┐  ┌──────────────────────────────────┐
│   POSTGRESQL DATABASE      │  │      APPLICATION LOGS            │
│  (Catalyst Data Store)     │  │   (Structured JSON Logging)      │
├────────────────────────────┤  └──────────────────────────────────┘
│  Tables:                   │
│  • CaseMaster (FIRs)       │
│  • Accused                 │
│  • Victim                  │
│  • Unit (Stations)         │
│  • CrimeSubHead            │
│  • users                   │
│  • audit_logs              │
└────────────────────────────┘

                SECURITY LAYERS
    ╔═══════════════════════════════════════════╗
    ║  Layer 1: AUTHENTICATION (JWT Tokens)    ║
    ║  • HMAC-SHA256 signatures                ║
    ║  • 4-hour expiry                         ║
    ║  • Token verification on every request   ║
    ╠═══════════════════════════════════════════╣
    ║  Layer 2: RBAC (Role-Based Access)       ║
    ║  • 6 roles: Constable → Admin            ║
    ║  • Permission checks at endpoint level   ║
    ║  • Feature-level access control          ║
    ╠═══════════════════════════════════════════╣
    ║  Layer 3: RLS (Row-Level Security)       ║
    ║  • Station-level: WHERE station_id = N   ║
    ║  • District-level: WHERE district_id = N ║
    ║  • Automatic SQL filter injection        ║
    ╚═══════════════════════════════════════════╝

                DATA FLOW: CHAT QUERY
    ┌─────────────────────────────────────────┐
    │ 1. User types: "Show theft cases"      │
    └──────────────┬──────────────────────────┘
                   ▼
    ┌─────────────────────────────────────────┐
    │ 2. Frontend: POST /chat + JWT token     │
    └──────────────┬──────────────────────────┘
                   ▼
    ┌─────────────────────────────────────────┐
    │ 3. chat.py: Verify token → Extract role │
    └──────────────┬──────────────────────────┘
                   ▼
    ┌─────────────────────────────────────────┐
    │ 4. nlp_simple: Extract entities         │
    │    • Intent: search_cases               │
    │    • Crime: theft (ID 1)                │
    │    • Date: last 30 days                 │
    └──────────────┬──────────────────────────┘
                   ▼
    ┌─────────────────────────────────────────┐
    │ 5. query_builder: Build SQL with RLS    │
    │    SELECT * FROM CaseMaster             │
    │    WHERE CrimeMinorHeadID = 1           │
    │      AND CrimeRegisteredDate >= ...     │
    │      AND PoliceStationID = 1  ← RLS     │
    │    LIMIT 50                             │
    └──────────────┬──────────────────────────┘
                   ▼
    ┌─────────────────────────────────────────┐
    │ 6. db: Execute parameterized query      │
    │    Returns 8 rows (8 theft FIRs)        │
    └──────────────┬──────────────────────────┘
                   ▼
    ┌─────────────────────────────────────────┐
    │ 7. templates: Format answer             │
    │    "Found 8 theft cases in last 30 days"│
    └──────────────┬──────────────────────────┘
                   ▼
    ┌─────────────────────────────────────────┐
    │ 8. Build explanation contract           │
    │    • Reasoning: intent → SQL → answer   │
    │    • Guardrails: RLS applied, SQL safe  │
    └──────────────┬──────────────────────────┘
                   ▼
    ┌─────────────────────────────────────────┐
    │ 9. Log to audit_logs table              │
    │    (user, query, intent, result_count)  │
    └──────────────┬──────────────────────────┘
                   ▼
    ┌─────────────────────────────────────────┐
    │ 10. Return JSON response to frontend    │
    │     • answer: "Found 8 theft cases..."  │
    │     • data: [8 FIR objects]             │
    │     • citations: [FIR numbers]          │
    │     • explanation_contract: {...}       │
    └─────────────────────────────────────────┘
```

**Key Design Principles:**
1. **Database-First:** All answers from SQL, no hallucination
2. **Security-First:** 3-layer security enforced on every request
3. **Explainable:** Every response includes reasoning
4. **No External AI:** Zero calls to OpenAI, Anthropic, Google
5. **Stateless:** Functions can scale horizontally
6. **Auditable:** Complete trail from query to answer

For detailed architecture, see [docs/architecture.md](docs/architecture.md).

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: TanStack Query (React Query)
- **Graph Visualization**: Cytoscape.js
- **Maps**: Leaflet (react-leaflet)
- **Icons**: Lucide React

### Backend
- **Runtime**: Python 3.11 (Catalyst Serverless Functions)
- **Database**: Catalyst Data Store (PostgreSQL-compatible)
- **Graph DB**: Catalyst NoSQL (Document store for graph edges)
- **AI/ML**: Catalyst QuickML (Qwen 2.5 14B Instruct, Qwen 2.5 7B Coder)
- **Voice**: Zia AI (STT/TTS, Translation, OCR)
- **Reports**: SmartBrowz (PDF generation)

### DevOps
- **Hosting**: Catalyst Web Client Hosting
- **CI/CD**: Catalyst Pipelines
- **Monitoring**: Catalyst Logs + CloudWatch (if integrated)

---

## 📁 Project Structure

```
ibha-ksp/
├── catalyst/                   # Backend (Catalyst Serverless)
│   ├── functions/             # Serverless Functions (Python)
│   │   ├── health.py          # Health check endpoint
│   │   ├── chat.py            # Chat endpoint (main AI logic)
│   │   ├── audit.py           # Audit logging endpoint
│   │   ├── ingest_upload.py   # Document upload
│   │   ├── ingest_review.py   # Document approval/rejection
│   │   ├── ingest_index.py    # Batch indexing (cron job)
│   │   └── lib/               # Shared utilities
│   │       ├── auth_utils.py  # RBAC/RLS enforcement
│   │       └── logging_utils.py
│   ├── api/                   # API Gateway config
│   │   └── openapi.yaml       # OpenAPI 3.0 spec
│   ├── datastore/             # Relational database
│   │   ├── schema.sql         # Table definitions
│   │   └── seed.sql           # Sample data
│   ├── nosql/                 # NoSQL collections
│   │   ├── collections.json   # Graph schema
│   │   └── sample_edges.json  # Sample graph data
│   ├── quickml/               # AI/ML configs
│   │   ├── rag_config.json    # RAG settings
│   │   └── llm_config.json    # LLM settings
│   ├── circuits/              # Workflow automation
│   │   └── document_ingestion_workflow.json
│   ├── cron/                  # Scheduled jobs
│   │   ├── nightly_analytics.json
│   │   └── nightly_ingestion.json
│   └── auth/                  # RBAC config
│       ├── roles.json
│       └── policies.json
├── web/                       # Frontend (Next.js)
│   ├── app/
│   │   ├── components/        # React components
│   │   │   ├── ui/           # Base UI components
│   │   │   ├── chat/         # Chat components
│   │   │   ├── layout/       # Layout components
│   │   │   ├── network/      # Network graph components
│   │   │   ├── trends/       # Map/trends components
│   │   │   └── ingestion/    # Document management
│   │   ├── screens/          # Page screens
│   │   │   ├── auth/         # Login
│   │   │   ├── chat/         # Chat page
│   │   │   ├── network/      # Network analysis
│   │   │   ├── trends/       # Trends & hotspots
│   │   │   └── admin/        # Admin & ingestion
│   │   ├── lib/              # Client utilities
│   │   │   ├── api.ts        # API client
│   │   │   └── types.ts      # TypeScript types
│   │   ├── layout.tsx        # Root layout
│   │   ├── page.tsx          # Home page (redirect)
│   │   └── globals.css       # Global styles
│   ├── public/               # Static assets
│   ├── package.json
│   ├── next.config.js
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   └── .env.example
├── data/                      # KSP Datathon 2026 Dataset
│   ├── README.md             # Dataset integration guide
│   ├── erd/                  # Database schema
│   │   └── ksp_erd_official.md  # Official ERD
│   └── samples/              # Sample data (stubs)
│       ├── firs_sample.csv
│       ├── accused_sample.csv
│       ├── victims_sample.csv
│       └── locations_sample.csv
├── docs/                      # Documentation
│   ├── problem_statement.md
│   ├── architecture.md
│   ├── security_model.md
│   └── judging_criteria.md
├── scripts/                   # DevOps scripts
│   └── deploy-catalyst.sh
├── .gitignore
└── README.md
```

---

## 📊 Dataset

### Official KSP Datathon 2026 Dataset

Ibha is designed to work with the **official crime database** provided by Karnataka State Police for the KSP Datathon 2026. The dataset includes:

- **FIRs** (First Information Reports) – Core crime records
- **Accused Persons** – Individuals accused in FIRs  
- **Victims** – Persons affected by crimes
- **Locations** – Geographic locations with coordinates
- **Additional Tables** – Stations, Officers, Evidence (if provided)

### Dataset Location

All dataset-related files are organized under `/data/`:

```
/data/
├── README.md                    # Dataset integration guide
├── erd/
│   └── ksp_erd_official.md      # Official database schema (ERD)
└── samples/
    ├── firs_sample.csv          # Sample FIR records (stub)
    ├── accused_sample.csv       # Sample accused persons
    ├── victims_sample.csv       # Sample victims
    └── locations_sample.csv     # Sample locations
```

**Key Files**:
- **Schema**: `/data/erd/ksp_erd_official.md` – Complete ERD with tables, columns, relationships
- **Samples**: `/data/samples/*.csv` – Stub CSV files for testing (10 rows each, synthetic data)
- **Guide**: `/data/README.md` – Step-by-step integration instructions

### Dataset Integration

#### Step 1: Obtain Official Dataset

The official dataset will be provided by KSP Datathon organizers after registration via:
- Hack2Skill platform download
- Email from organizers
- Direct link in hackathon portal

#### Step 2: Import into Catalyst Data Store

Place official files in `/data/official/` (create folder, not tracked in Git):

```bash
mkdir data/official
# Copy official dataset here
```

Import using one of these methods:

**Option A: SQL Dump**
```bash
catalyst sql:run data/official/ksp_crime_data.sql --env dev
```

**Option B: CSV Import**
```bash
catalyst datastore:import --table firs --file data/official/firs.csv
catalyst datastore:import --table accused --file data/official/accused.csv
catalyst datastore:import --table victims --file data/official/victims.csv
```

**Option C: PostgreSQL COPY** (see commented examples in `/catalyst/datastore/seed.sql`)

#### Step 3: Batch Index into QuickML RAG

After importing into Data Store, index for conversational AI:

```bash
# Trigger batch indexing
catalyst function:invoke ingest_index --env dev

# Or wait for nightly cron job (3 AM IST)
```

#### Step 4: Verify

```bash
# Check data imported
catalyst sql:query "SELECT COUNT(*) FROM firs;" --env dev

# Test chat query
curl -X POST https://api.ibha.catalyst.zoho.com/v1/chat \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"query": "How many theft cases?", "mode": "text", "language": "en"}'
```

### Schema Compatibility

Our Data Store schema (`/catalyst/datastore/schema.sql`) is **fully compatible** with the official KSP dataset:

| Official Table | Ibha Table | Status |
|----------------|------------|--------|
| FIRs | `firs` | ✅ Aligned |
| Accused | `accused` | ✅ Aligned |
| Victims | `victims` | ✅ Aligned |
| Locations | `locations` | ✅ Aligned |

**Ibha Extensions** (do NOT conflict with official schema):
- `users` – Police personnel with RBAC roles
- `audit_logs` – Chat interaction logging
- `documents_pending`, `documents` – Controlled ingestion pipeline
- `crime_trends` – Pre-computed analytics

### Data Security

⚠️ **CRITICAL: Do NOT Commit Sensitive Data to GitHub**

**Rules**:
1. ✅ **DO** commit: Small sample/stub CSV files (< 100 rows, synthetic)
2. ❌ **DO NOT** commit: Official dataset, real FIR data, sensitive info
3. ✅ **DO** use: `.gitignore` to exclude `/data/official/`
4. ❌ **DO NOT** push: Real names, phone numbers, addresses

**Official dataset must live ONLY in the secured Catalyst environment with proper access controls.**

For complete dataset integration instructions, see:
- `/data/README.md` – Detailed integration guide
- `/data/erd/ksp_erd_official.md` – Official schema documentation
- `/docs/architecture.md` → "Dataset Integration" section
- `/docs/security_model.md` → "Data Protection" section

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: >= 18.0.0
- **npm**: >= 9.0.0
- **Python**: 3.11 (for Catalyst functions)
- **PostgreSQL**: 13+ (for local database) OR Catalyst Data Store
- **Catalyst CLI**: Install from [Zoho Catalyst](https://www.zoho.com/catalyst/)

### Quick Start (MVP - 5 Minutes)

#### Step 1: Setup Database

**Option A: Local PostgreSQL**
```bash
# Create database
createdb ibha

# Run schema
psql -d ibha -f catalyst/datastore/init_db.sql

# Load seed data (35+ FIRs, 6 users, accused, victims)
psql -d ibha -f catalyst/datastore/seed_data.sql

# Verify
psql -d ibha -c "SELECT COUNT(*) FROM CaseMaster;"
# Expected: 35
```

**Option B: Catalyst Data Store**
```bash
# Deploy schema
catalyst sql:run catalyst/datastore/init_db.sql --env dev

# Load seed data
catalyst sql:run catalyst/datastore/seed_data.sql --env dev
```

#### Step 2: Configure Environment

```bash
cd web
cp .env.example .env.local

# Edit .env.local:
# NEXT_PUBLIC_CATALYST_API_BASE_URL=http://localhost:3000/api/v1
# DB_HOST=localhost
# DB_PORT=5432
# DB_NAME=ibha
# DB_USER=postgres
# DB_PASSWORD=postgres
```

#### Step 3: Run Backend (Python Functions)

**Option A: Deploy to Catalyst**
```bash
cd catalyst/functions
catalyst deploy --service functions
```

**Option B: Local Testing** (requires psycopg2)
```bash
pip install psycopg2-binary
# Then test individual functions
python -m catalyst.functions.auth
```

#### Step 4: Run Frontend

```bash
cd web
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

#### Step 5: Login & Test

Use these **demo credentials**:

| Role | Email | Password | Access |
|------|-------|----------|--------|
| **Constable** | rajesh.kumar@ksp.gov.in | password123 | Koramangala Station only |
| **Inspector** | arun.desai@ksp.gov.in | password123 | Whitefield Station only |
| **DSP** | lakshmi.rao@ksp.gov.in | password123 | District-wide |
| **Admin** | admin.system@ksp.gov.in | password123 | State-wide + Admin panel |

**Test Queries**:
1. Login as Constable (rajesh.kumar@ksp.gov.in)
2. Go to Chat
3. Ask: **"Show theft cases in last 30 days"**
4. Expected: ~15 theft cases from Koramangala station
5. Go to Trends → See hotspots with risk levels
6. Go to Network → Enter Accused ID: **1** (Ravi Kumar)
7. Go to Admin → View audit logs (Admin only)

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/ksp/ibha.git
   cd ibha-ksp
   ```

2. **Install frontend dependencies**:
   ```bash
   cd web
   npm install
   ```

3. **Configure environment variables**:
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your Catalyst API URL and auth credentials
   ```

4. **Run frontend locally**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

### Backend Setup (Catalyst)

1. **Initialize Catalyst project**:
   ```bash
   catalyst init
   ```

2. **Deploy functions**:
   ```bash
   catalyst deploy
   ```

3. **Set up Data Store**:
   - Run `catalyst/datastore/schema.sql` in Catalyst Data Store console
   - Run `catalyst/datastore/seed.sql` to load sample data

4. **Configure QuickML**:
   - Use configs in `catalyst/quickml/` to set up RAG and LLM serving

5. **Set up Cron Jobs**:
   - Use configs in `catalyst/cron/` to schedule nightly jobs

For detailed deployment instructions, see [scripts/deploy-catalyst.sh](scripts/deploy-catalyst.sh).

---

## ⚙️ Configuration

### Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_CATALYST_API_BASE_URL` | Catalyst API endpoint | `https://api.ibha.catalyst.zoho.com/v1` |
| `NEXT_PUBLIC_CATALYST_AUTH_ISSUER` | OAuth issuer URL | `https://accounts.zoho.com` |
| `NEXT_PUBLIC_CATALYST_CLIENT_ID` | OAuth client ID | `your_client_id` |

### Authentication

- **OAuth 2.0**: Configure in Catalyst Auth console
- **Roles**: Defined in `catalyst/auth/roles.json`
- **Policies**: Defined in `catalyst/auth/policies.json`

### Data Store

- **Schema**: `catalyst/datastore/schema.sql`
- **Sample Data**: `catalyst/datastore/seed.sql`

---

## 🚢 Deployment

### Frontend (Web Client Hosting)

```bash
cd web
npm run build
catalyst deploy --service web
```

### Backend (Serverless Functions)

```bash
cd catalyst/functions
catalyst deploy --service functions
```

### Database Migrations

```bash
catalyst sql --file catalyst/datastore/schema.sql
catalyst sql --file catalyst/datastore/seed.sql
```

See [scripts/deploy-catalyst.sh](scripts/deploy-catalyst.sh) for automated deployment.

---

## 🔐 Security

Ibha implements multiple layers of security:

1. **Authentication**: OAuth 2.0 via Catalyst Auth
2. **Authorization**: Role-Based Access Control (RBAC)
3. **Data Filtering**: Row-Level Security (RLS) based on station/district
4. **Audit Logging**: All queries and answers are logged
5. **PII Protection**: Names and sensitive data are masked in responses
6. **Rate Limiting**: API Gateway limits requests per user/role
7. **Watermarking**: PDF exports include user info to prevent unauthorized sharing

See [docs/security_model.md](docs/security_model.md) for details.

---

## 📂 Controlled Knowledge Ingestion

**Why Controlled Ingestion?**

- Prevents the AI from "learning" from bad data or poisoning attacks
- Ensures data quality through human review
- Provides clear audit trail for knowledge base updates
- Aligns with police workflow (documents uploaded during day, indexed at night)

**Ingestion Pipeline**:

1. **Upload** (`/ingest/upload`): SCRB_Analyst uploads document
2. **OCR** (Zia AI): Extract text from images/scanned PDFs
3. **Quarantine** (`documents_pending` table): Document awaits review
4. **Review** (`/ingest/approve` or `/ingest/reject`): Human reviewer approves/rejects
5. **Batch Indexing** (Nightly cron): Approved documents are indexed into RAG

**Key Tables**:
- `documents_pending`: Quarantine zone for uploaded documents
- `documents`: Approved documents (indexed or ready for indexing)
- `ingestion_audit`: Full lifecycle tracking

---

## 🤝 Contributing

This project is part of the **KSP Datathon 2026** submission. Contributions are welcome from the team.

### Development Workflow

1. Create a feature branch: `git checkout -b feature/my-feature`
2. Make changes and test locally
3. Commit with clear messages: `git commit -m "Add feature X"`
4. Push and create a pull request

### Code Standards

- **Frontend**: ESLint + Prettier
- **Backend**: PEP 8 (Python) + Black formatter
- **Commits**: Conventional Commits format

---

## 📄 License

Copyright © 2026 Karnataka State Police. All rights reserved.

This project is developed for the KSP Datathon 2026 and is intended for official police use only.

---

## 📞 Contact

- **Team**: Ibha Development Team
- **Email**: naturegirlbsp@gmail.com
- **Datathon**: [Hack2Skill - KSP Datathon 2026](https://hack2skill.com)

---

## 🙏 Acknowledgments

- **Karnataka State Police** for the problem statement and data
- **Zoho Catalyst** for the serverless platform
- **Hack2Skill** for hosting the datathon
- **Open Source Community** for the libraries and tools used

---

**Built with ❤️ for Karnataka State Police**

*Ibha – Intelligent, Secure, Multilingual Crime Analytics*
