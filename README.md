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

**Dataset**: The solution is designed to work with the **official KSP Datathon 2026 dataset** (FIRs, accused, victims, locations, etc.). The dataset schema is documented in `/data/erd/ksp_erd_official.md` and sample data is in `/data/samples/`.

---

## ✨ Features

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

Ibha is built on **Zoho Catalyst**, a serverless cloud platform. The architecture follows a clean separation of concerns:

```
User (Web/Mobile)
     ↓
Web Client Hosting (Next.js)
     ↓
API Gateway (OAuth, Rate Limiting)
     ↓
Serverless Functions (Python)
     ↓
┌─────────────┬─────────────┬─────────────┬─────────────┐
│  Data Store │   NoSQL     │  QuickML    │   Zia AI    │
│  (Postgres) │  (Graph DB) │  (RAG/LLM)  │ (STT/TTS)   │
└─────────────┴─────────────┴─────────────┴─────────────┘
     ↓                            ↓
SmartBrowz (PDF)          Circuits (Workflows)
```

**Key Components**:
- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **Backend**: Python 3.11 Serverless Functions
- **Database**: Catalyst Data Store (Relational) + NoSQL (Graph)
- **AI/ML**: QuickML (RAG + LLM Serving with Qwen 2.5 models)
- **Voice**: Zia Speech-to-Text & Text-to-Speech
- **Reports**: SmartBrowz for PDF generation
- **Automation**: Circuits (document processing) + Cron Jobs (nightly indexing)

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
- **Python**: 3.11 (for local testing of functions)
- **Catalyst CLI**: Install from [Zoho Catalyst](https://www.zoho.com/catalyst/)

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
- **Email**: scrb@ksp.gov.in
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
