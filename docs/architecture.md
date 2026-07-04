# Ibha Architecture Documentation

## High-Level Architecture

Ibha is built on **Zoho Catalyst**, a serverless cloud platform. The architecture follows a modern, scalable, and secure design:

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Layer                               │
│  (Police Officers: Constable, SI, Inspector, DSP, Analyst)      │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Presentation Layer                            │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  Next.js 14 Web Client (TypeScript + Tailwind CSS)     │    │
│  │  - Chat Interface                                       │    │
│  │  - Network Visualization (Cytoscape.js)                │    │
│  │  - Trends & Hotspots (Leaflet)                         │    │
│  │  - Admin & Ingestion UI                                │    │
│  └────────────────────────────────────────────────────────┘    │
│                    Hosted on Catalyst Web Hosting               │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    API Gateway Layer                             │
│  - OAuth 2.0 Authentication (Catalyst Auth)                     │
│  - Rate Limiting (60 req/min per user)                          │
│  - CORS & Security Headers                                      │
│  - Request Routing                                              │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Application Layer (Serverless)                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Python 3.11 Serverless Functions                        │  │
│  │  ┌─────────────────────────────────────────────────┐    │  │
│  │  │  health.py      - Health check                  │    │  │
│  │  │  chat.py        - Main AI query handler         │    │  │
│  │  │  audit.py       - Audit logging                 │    │  │
│  │  │  ingest_*.py    - Document ingestion pipeline   │    │  │
│  │  └─────────────────────────────────────────────────┘    │  │
│  │  ┌─────────────────────────────────────────────────┐    │  │
│  │  │  Shared Libraries (lib/)                        │    │  │
│  │  │  - auth_utils.py (RBAC/RLS)                     │    │  │
│  │  │  - logging_utils.py (Structured logging)        │    │  │
│  │  └─────────────────────────────────────────────────┘    │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────┬───────────────┬──────────────┬──────────────┬────────┘
          │               │              │              │
          ▼               ▼              ▼              ▼
┌─────────────┐ ┌────────────┐ ┌───────────┐ ┌──────────────┐
│ Data Store  │ │   NoSQL    │ │  QuickML  │ │   Zia AI     │
│ (Postgres)  │ │ (Document  │ │           │ │              │
│             │ │  Store)    │ │  - RAG    │ │  - STT/TTS   │
│ - FIRs      │ │            │ │  - LLM    │ │  - OCR       │
│ - Accused   │ │ - Graph    │ │  Serving  │ │  - Translate │
│ - Victims   │ │  Edges     │ │           │ │              │
│ - Documents │ │ - Persons  │ │ Qwen 2.5  │ │              │
│ - Audit     │ │ - Cases    │ │ 14B       │ │              │
│             │ │            │ │ Instruct  │ │              │
└─────────────┘ └────────────┘ └───────────┘ └──────────────┘
          │                                           │
          └───────────────────┬───────────────────────┘
                              ▼
                    ┌──────────────────┐
                    │  Support Services│
                    │                  │
                    │  - SmartBrowz   │
                    │    (PDF Export) │
                    │  - Circuits     │
                    │    (Workflows)  │
                    │  - Cron Jobs    │
                    │  - Signals      │
                    └──────────────────┘
```

---

## Dataset Integration

### Official KSP Datathon 2026 Dataset

Ibha is designed to work with the **official crime database schema** provided by Karnataka State Police for the KSP Datathon 2026. The dataset includes:

- **FIRs** (First Information Reports) – Core crime records
- **Accused Persons** – Individuals accused in FIRs
- **Victims** – Persons affected by crimes
- **Locations** – Geographic locations with coordinates
- **Police Stations** – Station metadata
- **Officers** (optional) – Personnel for assignment tracking
- **Evidence** (optional) – Physical/digital evidence
- **Investigations** (optional) – Investigation status tracking

### Dataset Location

All dataset-related files are organized under `/data/`:

```
/data/
├── README.md                    # Dataset integration guide
├── erd/
│   └── ksp_erd_official.md      # Official database schema (ERD)
└── samples/
    ├── firs_sample.csv          # Sample FIR records (10 rows)
    ├── accused_sample.csv       # Sample accused persons
    ├── victims_sample.csv       # Sample victims
    └── locations_sample.csv     # Sample locations
```

**Documentation**:
- **Schema**: `/data/erd/ksp_erd_official.md` – Complete ERD with tables, columns, relationships
- **Samples**: `/data/samples/*.csv` – Stub CSV files for testing (synthetic data)
- **Guide**: `/data/README.md` – Step-by-step integration instructions

### Data Flow: Official Dataset → Ibha

```
Official KSP Dataset (CSV/SQL/JSON)
            ↓
   /data/official/ folder
            ↓
   Import Script or Catalyst CLI
            ↓
   Catalyst Data Store (PostgreSQL)
            ↓
   ┌───────┴───────┐
   ↓               ↓
Schema Tables   QuickML RAG
(firs, etc.)    (via batch indexing)
   ↓               ↓
Chat Queries ← RAG Retrieval
   ↓
User Interface
```

### Integration Steps

#### Step 1: Obtain Official Dataset

The official dataset will be provided after KSP Datathon registration via:
- Hack2Skill platform download
- Email from organizers
- Direct link in hackathon portal

Expected formats: `.sql`, `.csv`, `.json`, or `.xlsx`

#### Step 2: Place Dataset Files

Create `/data/official/` folder (not tracked in Git) and place files:

```bash
mkdir ibha-ksp/data/official
# Copy official files here
cp ~/Downloads/ksp_crime_data.sql ibha-ksp/data/official/
```

Or replace stub files in `/data/samples/` with official data.

#### Step 3: Import into Catalyst Data Store

Choose one of these import methods:

**Option A: SQL Dump**
```bash
catalyst sql:run data/official/ksp_crime_data.sql --env dev
```

**Option B: CSV Import (via Catalyst CLI)**
```bash
catalyst datastore:import --table firs --file data/official/firs.csv
catalyst datastore:import --table accused --file data/official/accused.csv
catalyst datastore:import --table victims --file data/official/victims.csv
catalyst datastore:import --table locations --file data/official/locations.csv
```

**Option C: PostgreSQL COPY** (if direct DB access)
```sql
COPY firs FROM '/path/to/firs.csv' DELIMITER ',' CSV HEADER;
COPY accused FROM '/path/to/accused.csv' DELIMITER ',' CSV HEADER;
-- etc.
```

See `/catalyst/datastore/seed.sql` for commented examples.

#### Step 4: Batch Index into QuickML RAG

After importing into Data Store, index FIR descriptions and documents into RAG:

```bash
# Trigger batch indexing function
catalyst function:invoke ingest_index --env dev

# Or wait for nightly cron job (3 AM IST)
# Configured in /catalyst/cron/nightly_ingestion.json
```

This makes the data searchable via conversational AI.

#### Step 5: Verify Data

```bash
# Check Data Store
catalyst sql:query "SELECT COUNT(*) FROM firs;" --env dev
catalyst sql:query "SELECT COUNT(*) FROM accused;" --env dev

# Check RAG index (via QuickML console or test query)
curl -X POST https://api.ibha.catalyst.zoho.com/v1/chat \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"query": "How many theft cases in Koramangala?", "mode": "text", "language": "en"}'
```

### Schema Alignment

Our Data Store schema (`/catalyst/datastore/schema.sql`) is **compatible** with the official KSP dataset:

| Official Table | Ibha Table | Alignment | Notes |
|----------------|------------|-----------|-------|
| FIRs | `firs` | ✅ Fully aligned | Extended with `sensitivity`, `status` |
| Accused | `accused` | ✅ Fully aligned | Extended with `previous_cases` |
| Victims | `victims` | ✅ Fully aligned | Extended with `injury_severity` |
| Locations | `locations` | ✅ Fully aligned | Extended with `location_type` |
| Stations | `stations` (TODO) | ⚠️ Add if needed | Create table if official dataset includes |
| Officers | `officers` (TODO) | ⚠️ Add if needed | Create table if official dataset includes |
| Evidence | `evidence` (TODO) | ⚠️ Add if needed | Create table if official dataset includes |

**Extensions** (Ibha-specific tables, do NOT conflict):
- `users` – Police personnel with RBAC roles
- `audit_logs` – Chat interaction logging
- `documents_pending`, `documents` – Controlled ingestion pipeline
- `crime_trends` – Pre-computed analytics

### Controlled Ingestion for New Documents

**IMPORTANT**: Once the initial dataset is loaded, **new FIR documents should ONLY be added via the Controlled Ingestion Pipeline**:

```
Upload (/admin/ingestion UI)
   ↓
Validation (file type, size)
   ↓
OCR (Zia AI for scanned PDFs)
   ↓
Human Review (SCRB_Analyst approves/rejects)
   ↓
Batch Indexing (nightly cron at 3 AM)
   ↓
QuickML RAG (searchable in chat)
```

**Why?**
- Prevents data poisoning attacks
- Ensures data quality through human review
- Provides full audit trail
- Maintains RAG index integrity

**How?**
- Web UI: `/admin/ingestion` page
- API: `POST /ingest/upload`, `POST /ingest/approve`
- See functions: `ingest_upload.py`, `ingest_review.py`, `ingest_index.py`

### Data Security

**⚠️ CRITICAL**: Official dataset contains sensitive police data:

1. **Do NOT commit to GitHub**: Use `.gitignore` to exclude `/data/official/`
2. **Access Control**: Only authorized personnel (SCRB_Analyst, Admin) can view state-wide data
3. **RLS Enforcement**: All queries are filtered by user role and station/district
4. **Sensitivity Levels**: Mark data as NORMAL, CONFIDENTIAL, or RESTRICTED
5. **Audit Trail**: Every query is logged in `audit_logs` table (5-year retention)

See `/docs/security_model.md` for complete security guidelines.

### Troubleshooting

**Issue**: CSV import fails with encoding errors  
**Solution**: Ensure CSV files are UTF-8 encoded. Convert if needed:
```bash
iconv -f ISO-8859-1 -t UTF-8 input.csv > output_utf8.csv
```

**Issue**: Schema mismatch (extra columns in official dataset)  
**Solution**: 
1. Compare official dataset with `/data/erd/ksp_erd_official.md`
2. Update `/catalyst/datastore/schema.sql` to add missing columns
3. Run migration: `ALTER TABLE firs ADD COLUMN new_field VARCHAR(100);`

**Issue**: RAG indexing is slow (takes > 10 minutes)  
**Solution**:
1. Increase Catalyst function timeout in `ingest_index.py`
2. Process in smaller batches (modify batch size in function)
3. Use multi-threading (if supported by Catalyst)

**Issue**: Queries return no results after import  
**Solution**:
1. Verify data was imported: `SELECT COUNT(*) FROM firs;`
2. Check RAG indexing completed: Review cron job logs
3. Test RAG directly via QuickML console
4. Verify RLS filters are not too restrictive (try Admin role)

---

## Detailed Component Architecture

### 1. Presentation Layer (Frontend)

**Technology**: Next.js 14 (App Router) + TypeScript + Tailwind CSS

**Components**:

```
app/
├── components/
│   ├── ui/               # Base UI components (buttons, inputs, cards)
│   ├── chat/             # Chat interface
│   │   ├── ChatMessage.tsx
│   │   ├── ChatInput.tsx
│   │   ├── CitationPanel.tsx
│   │   └── ExplanationPanel.tsx
│   ├── layout/           # Layout components
│   │   ├── Sidebar.tsx
│   │   ├── TopBar.tsx
│   │   └── ThemeToggle.tsx
│   ├── network/          # Criminal network visualization
│   │   └── GraphViewer.tsx (Cytoscape.js)
│   ├── trends/           # Crime trends & hotspots
│   │   └── MapViewer.tsx (Leaflet)
│   └── ingestion/        # Document management
│       ├── UploadDialog.tsx
│       ├── ReviewActions.tsx
│       └── IngestionQueueTable.tsx
├── screens/
│   ├── auth/login.tsx     # Login page
│   ├── chat/page.tsx      # Main chat interface
│   ├── network/page.tsx   # Network analysis
│   ├── trends/page.tsx    # Trends & hotspots
│   └── admin/
│       ├── page.tsx       # Admin dashboard
│       └── ingestion.tsx  # Document ingestion management
└── lib/
    ├── api.ts             # API client (axios)
    └── types.ts           # TypeScript type definitions
```

**Key Features**:
- **Dark Theme**: Police-grade professional UI
- **Responsive**: Works on desktop and mobile
- **Real-time Updates**: React Query for data fetching
- **Accessibility**: WCAG 2.1 AA compliant

---

### 2. API Gateway Layer

**Service**: Catalyst API Gateway

**Configuration**: OpenAPI 3.0 spec (`catalyst/api/openapi.yaml`)

**Endpoints**:

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/health` | Public | Health check |
| POST | `/chat` | OAuth | Submit query to AI |
| POST | `/audit` | OAuth | Log interaction |
| POST | `/ingest/upload` | OAuth | Upload document |
| POST | `/ingest/approve` | OAuth | Approve document |
| POST | `/ingest/reject` | OAuth | Reject document |
| GET | `/ingest/pending` | OAuth | List pending documents |

**Security Features**:
- OAuth 2.0 authentication via Catalyst Auth
- Rate limiting (60 req/min per user, varies by role)
- CORS headers for frontend access
- Request validation

---

### 3. Application Layer (Serverless Functions)

**Runtime**: Python 3.11

**Functions**:

#### 3.1 Health Check (`health.py`)
- **Purpose**: Service health monitoring
- **Auth**: None (public)
- **Returns**: `{status, service, version, timestamp}`

#### 3.2 Chat (`chat.py`)
- **Purpose**: Main AI query processing
- **Auth**: OAuth (all roles)
- **Input**: `{query, mode, language}`
- **Output**: `{answer, citations, explanation_contract}`
- **Process**:
  1. Extract user claims from JWT
  2. Apply RLS filters (station/district)
  3. Translate query if needed (Kannada → English)
  4. Retrieve top-k documents from RAG
  5. Generate answer using LLM
  6. Extract citations and explanation
  7. Mask PII if needed
  8. Return response

#### 3.3 Audit (`audit.py`)
- **Purpose**: Log all chat interactions
- **Auth**: OAuth (all roles)
- **Input**: `{user_id, query, answer_hash, tool_trail, citations}`
- **Process**:
  1. Validate input
  2. Log to console (structured JSON)
  3. TODO: Insert into `audit_logs` table

#### 3.4 Ingestion Pipeline (`ingest_*.py`)

##### `ingest_upload.py`
- **Purpose**: Upload document for review
- **Auth**: OAuth (SCRB_Analyst, Admin only)
- **Input**: File + metadata (FIR number, station, sensitivity)
- **Process**:
  1. Validate file type and size
  2. TODO: Save to Stratus (object storage)
  3. TODO: Insert into `documents_pending` table
  4. TODO: Trigger Circuits workflow (OCR if needed)
  5. Return `{status: "pending_review", document_id}`

##### `ingest_review.py`
- **Purpose**: Approve or reject document
- **Auth**: OAuth (SCRB_Analyst, Admin only)
- **Input**: `{document_id, reviewed_by, notes}`
- **Process**:
  1. Update `documents_pending` status
  2. If approved: Insert into `documents` table
  3. TODO: Insert audit record
  4. Return `{status: "approved"/"rejected"}`

##### `ingest_index.py`
- **Purpose**: Batch-index approved documents (cron job)
- **Auth**: System (no user auth)
- **Process**:
  1. Query all approved, non-indexed documents
  2. For each document:
     - TODO: Send to QuickML RAG for indexing
     - Mark as indexed in Data Store
     - Log results
  3. Return `{indexed_count, errors}`

**Shared Libraries** (`lib/`):

##### `auth_utils.py`
- `get_user_claims(token)`: Extract user from JWT
- `enforce_rls(claims, query)`: Apply station/district filters
- `check_ingestion_permission(claims)`: Verify upload access
- `check_admin_permission(claims)`: Verify admin access

##### `logging_utils.py`
- `log_info(message, context)`: Structured JSON logging
- `log_error(message, context, exception)`: Error logging
- `log_security_event(event_type, user_id, context)`: Security events

---

### 4. Data Layer

#### 4.1 Data Store (Relational Database)

**Service**: Catalyst Data Store (PostgreSQL-compatible)

**Schema** (`catalyst/datastore/schema.sql`):

**Core Tables**:
- `users`: Police personnel with roles and station assignments
- `firs`: First Information Reports (crime records)
- `accused`: Accused persons linked to FIRs
- `victims`: Victims linked to FIRs
- `locations`: Named locations with geo-coordinates
- `audit_logs`: All chat interactions
- `crime_trends`: Pre-computed analytics (materialized view)

**Ingestion Tables**:
- `documents_pending`: Quarantine zone for uploaded documents
- `documents`: Approved documents (indexed or ready for indexing)
- `ingestion_audit`: Document lifecycle tracking

**Indexes**:
- Station/district indexes for RLS filtering
- Date indexes for temporal queries
- Geo indexes for spatial queries
- Full-text indexes for search (TODO)

#### 4.2 NoSQL (Graph Database)

**Service**: Catalyst NoSQL (Document Store)

**Collections** (`catalyst/nosql/collections.json`):
- `Persons`: Graph nodes (accused, victims, witnesses)
- `Cases`: Graph nodes (FIRs, investigations)
- `Edges`: Relationships (CO_OFFENDER_WITH, LINKED_TO_CASE, USED_MO, etc.)
- `ModusOperandi`: Catalog of crime methods

**Purpose**: Criminal network analysis, link prediction, community detection

---

### 5. AI/ML Layer (QuickML)

**Service**: Catalyst QuickML

#### 5.1 RAG (Retrieval-Augmented Generation)

**Configuration**: `catalyst/quickml/rag_config.json`

**Model**: Qwen 2.5 14B Instruct (for embeddings)

**Data Sources**:
- FIR descriptions and modus operandi
- Approved documents (text_content)
- Case metadata (from NoSQL)

**Retrieval**:
- **Top-k**: 5 documents
- **Similarity Threshold**: 0.7
- **Hybrid Search**: Semantic (70%) + Keyword (30%)
- **Reranking**: Cross-encoder

**Security**:
- RLS filters applied BEFORE vector search
- PII masking in retrieved chunks

#### 5.2 LLM Serving

**Configuration**: `catalyst/quickml/llm_config.json`

**Primary Model**: Qwen 2.5 14B Instruct (answer generation)

**Tool Calling Model**: Qwen 2.5 7B Coder (agentic workflows)

**System Prompt**:
- Role: "You are Ibha, an AI assistant for Karnataka State Police..."
- Rules: Only use retrieved context, cite sources, respect sensitivity, etc.
- Output format: Answer + Explanation Contract

**Guardrails**:
- Content safety filters
- PII protection
- Hallucination detection (confidence threshold)

---

### 6. Support Services

#### 6.1 Zia AI

**Services**:
- **Speech-to-Text (STT)**: Convert voice queries to text (English, Kannada)
- **Text-to-Speech (TTS)**: Convert answers to voice
- **Translation**: Translate Kannada queries to English for RAG
- **OCR**: Extract text from scanned PDFs and images

#### 6.2 SmartBrowz

**Purpose**: Generate PDF exports of conversation history

**Features**:
- Watermarking with user info and timestamp
- Professional formatting
- Citation inclusion

#### 6.3 Circuits

**Purpose**: Workflow automation

**Workflows**:
- Document ingestion workflow (OCR → Validation → Notification)

#### 6.4 Cron Jobs

**Jobs**:
- **Nightly Analytics** (2 AM IST): Update crime trends, hotspots, anomaly scores
- **Nightly Ingestion** (3 AM IST): Batch-index approved documents

#### 6.5 Signals

**Purpose**: Event-driven triggers

**Triggers**:
- Data Store inserts → Circuits workflows
- Document approval → Batch indexing queue

---

## Data Flow Diagrams

### Chat Query Flow

```
User (Web) → API Gateway (Auth) → chat.py
                                      ↓
                          1. Extract JWT claims
                                      ↓
                          2. Apply RLS filters
                                      ↓
                          3. Query RAG (top-k docs)
                                      ↓
                          4. LLM generates answer
                                      ↓
                          5. Extract citations
                                      ↓
                          6. Mask PII
                                      ↓
                          7. Return response
                                      ↓
User (Web) ← API Gateway ← {answer, citations, explanation}
```

### Document Ingestion Flow

```
SCRB_Analyst uploads document
          ↓
    ingest_upload.py
          ↓
  Save to documents_pending
          ↓
  Trigger Circuits workflow
          ↓
    ┌─────────┴─────────┐
    ↓                   ↓
Validate            OCR (Zia)
    │                   │
    └─────────┬─────────┘
              ↓
    Notify reviewers (Mail)
              ↓
    Human review (UI)
              ↓
    ingest_review.py (approve/reject)
              ↓
    documents table (if approved)
              ↓
    Nightly cron job (3 AM)
              ↓
    ingest_index.py
              ↓
    QuickML RAG indexing
              ↓
    Mark as indexed
              ↓
    Document now searchable in chat
```

---

## Security Architecture

### Authentication Flow

```
User → Login (email/password) → Catalyst Auth (OAuth 2.0)
                                      ↓
                              JWT token issued
                                      ↓
                        Frontend stores token (localStorage)
                                      ↓
                        All API requests include:
                        Authorization: Bearer {token}
                                      ↓
                    API Gateway validates token
                                      ↓
                    Serverless function extracts claims
```

### RBAC/RLS Enforcement

```
API Request with JWT
          ↓
    Extract user claims:
    {role, station_id, district_id, clearance}
          ↓
    Check endpoint permission (RBAC)
          ↓
    Apply data filters (RLS):
    - Constable → station_id = user.station_id
    - DSP → district_id = user.district_id
    - SCRB_Analyst → no filters (state-wide)
          ↓
    Execute filtered query
          ↓
    Return only authorized data
```

---

## Scalability Considerations

1. **Serverless Auto-Scaling**: Functions scale automatically with load
2. **RAG Index Sharding**: Partition by district for faster retrieval
3. **Caching**: Cache common queries (Redis, if available)
4. **Read Replicas**: For audit logs and analytics (future)
5. **CDN**: Serve frontend assets via CDN

---

## Monitoring & Observability

1. **Logs**: Structured JSON logs in Catalyst Logs
2. **Metrics**: Function execution time, error rates, RAG latency
3. **Alerts**: Slack/Email notifications for errors
4. **Dashboards**: Grafana or Catalyst monitoring dashboards

---

## Deployment Architecture

```
GitHub Repository
        ↓
    CI/CD Pipeline (GitHub Actions / Catalyst Pipelines)
        ↓
    ┌───────────┬───────────┬───────────┐
    ↓           ↓           ↓           ↓
  Dev       Staging   Production  Testing
```

---

## Technology Choices Rationale

| Component | Choice | Why? |
|-----------|--------|------|
| Frontend | Next.js 14 | SSR, App Router, TypeScript support, great DX |
| Backend | Python 3.11 | Rich ML/data science ecosystem, readable |
| Database | Catalyst Data Store | Managed PostgreSQL, ACID compliance |
| Graph DB | NoSQL | Document store for flexible graph schema |
| AI/ML | QuickML | Catalyst-native, no external API keys |
| Voice | Zia AI | Catalyst-native, multilingual support |
| Styling | Tailwind CSS | Utility-first, fast prototyping, consistent |
| State Mgmt | React Query | Declarative data fetching, caching, optimistic UI |
| Graph Viz | Cytoscape.js | Powerful, customizable, no server required |
| Maps | Leaflet | Open-source, no API key friction |

---

**Last Updated**: July 3, 2026

**Contributors**: Ibha Development Team
