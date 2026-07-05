# Ibha Deployment Checklist

**Last Updated**: July 5, 2026  
**Status**: Setup Phase Complete, Deployment Pending

---

## ✅ What is Complete (Setup Phase)

- [x] Project structure created (48 files)
- [x] Official KSP ERD documented (`/data/erd/ksp_erd_official.md`)
- [x] Sample CSVs aligned with official schema (`casemaster_sample.csv`, `accused_sample.csv`, `victims_sample.csv`)
- [x] Backend function stubs created with clear TODOs
- [x] Database schema designed (Ibha tables in `schema.sql`, official KSP tables in `schema_official_ksp.sql`)
- [x] Frontend scaffold with Next.js (login page exists, API client configured)
- [x] Complete documentation (README, architecture, security model, etc.)
- [x] GitHub repository created and pushed

---

## ❌ What is NOT Done Yet (Deployment Phase)

### Phase 1: Catalyst Infrastructure Setup

- [ ] **1.1** Create Catalyst project
  ```bash
  catalyst init
  # Choose project name: "Ibha"
  # Choose datacenter: India (recommended for KSP)
  ```

- [ ] **1.2** Enable required Catalyst services
  - Go to [Catalyst Console](https://console.catalyst.zoho.com/)
  - Enable: Auth, Serverless Functions, API Gateway, Data Store, NoSQL, QuickML, Zia AI, Stratus, Circuits, Cron

### Phase 2: Database Setup

- [ ] **2.1** Create Catalyst Data Store instance
  - Console → Data Store → Create Instance
  - Choose: PostgreSQL-compatible
  - Note: Connection will be automatic via Catalyst SDK

- [ ] **2.2** Run Ibha schema
  ```bash
  catalyst sql:run catalyst/datastore/schema.sql --env dev
  ```

- [ ] **2.3** Run official KSP schema
  ```bash
  catalyst sql:run catalyst/datastore/schema_official_ksp.sql --env dev
  ```

- [ ] **2.4** Verify tables created
  ```bash
  catalyst sql:query "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';" --env dev
  ```

- [ ] **2.5** Load sample data (optional for testing)
  ```bash
  catalyst sql:run catalyst/datastore/seed.sql --env dev
  ```

- [ ] **2.6** Import official KSP dataset (when provided by organizers)
  ```bash
  # Place official files in /data/official/
  catalyst datastore:import --table CaseMaster --file data/official/casemaster.csv --env dev
  catalyst datastore:import --table Accused --file data/official/accused.csv --env dev
  catalyst datastore:import --table Victim --file data/official/victims.csv --env dev
  # etc.
  ```

### Phase 3: Authentication Setup

- [ ] **3.1** Create Catalyst Auth application
  - Console → Auth → Create Application
  - Type: OAuth 2.0
  - Note: Copy Issuer URL and Client ID

- [ ] **3.2** Configure roles
  - Import roles from `/catalyst/auth/roles.json`
  - Create: Constable, SI, Inspector, DSP, SCRB_Analyst, Admin

- [ ] **3.3** Update frontend `.env.local`
  ```bash
  cd web
  cp .env.example .env.local
  # Edit .env.local:
  NEXT_PUBLIC_CATALYST_AUTH_ISSUER=<your_issuer_url>
  NEXT_PUBLIC_CATALYST_CLIENT_ID=<your_client_id>
  ```

- [ ] **3.4** Update backend functions to use real JWT validation
  - Replace fake auth in `/catalyst/functions/lib/auth_utils.py`
  - Import Catalyst Auth SDK
  - Implement `get_user_claims(token)` with real validation

### Phase 4: Backend Deployment

- [ ] **4.1** Install Catalyst SDK in functions
  ```bash
  # Add to each function's requirements (if needed)
  catalyst-sdk>=1.0.0
  ```

- [ ] **4.2** Update `chat.py` with real implementations
  - [ ] Replace line 80-91 TODOs with QuickML RAG calls
  - [ ] Implement `handle_chat_query()` function
  - [ ] Add RLS filtering logic
  - [ ] Add confidence scoring
  - [ ] Add citation extraction

- [ ] **4.3** Update `audit.py` with real DB insert
  - [ ] Replace line 60-73 TODO with Data Store INSERT
  - [ ] Use Catalyst SDK for DB connection

- [ ] **4.4** Update `ingest_upload.py` with real storage
  - [ ] Add Stratus file upload (line 89-91)
  - [ ] Add Zia OCR trigger (line 94-96)
  - [ ] Add DB insert for `documents_pending` (line 97-105)

- [ ] **4.5** Update `ingest_review.py` with approval logic
  - [ ] Implement approve/reject DB updates
  - [ ] Move from `documents_pending` to `documents`

- [ ] **4.6** Update `ingest_index.py` with RAG indexing
  - [ ] Implement QuickML RAG batch indexing
  - [ ] Query approved documents from DB
  - [ ] Index into RAG with metadata (station_id for RLS)

- [ ] **4.7** Deploy all functions
  ```bash
  cd catalyst/functions
  catalyst function:deploy health --env dev
  catalyst function:deploy chat --env dev
  catalyst function:deploy audit --env dev
  catalyst function:deploy ingest_upload --env dev
  catalyst function:deploy ingest_review --env dev
  catalyst function:deploy ingest_index --env dev
  ```

### Phase 5: API Gateway Setup

- [ ] **5.1** Create API Gateway
  - Console → API Gateway → Create
  - Import: `/catalyst/api/openapi.yaml`

- [ ] **5.2** Link functions to routes
  - `/health` → health function
  - `/chat` → chat function
  - `/audit` → audit function
  - `/ingest/*` → ingest_* functions

- [ ] **5.3** Configure OAuth on API Gateway
  - Link to Auth app created in Phase 3
  - Set scopes: read, write, admin
  - Enable rate limiting (60 req/min)

- [ ] **5.4** Get BASE_URL
  - Copy API Gateway URL (e.g., `https://1234567890-ibha.catalyst.zoho.com/baas/v1`)
  - Update frontend `.env.local`:
    ```
    NEXT_PUBLIC_CATALYST_API_BASE_URL=<your_api_gateway_url>
    ```

### Phase 6: AI/ML Setup (QuickML)

- [ ] **6.1** Create QuickML RAG project
  - Console → QuickML → Create RAG Project
  - Use config from `/catalyst/quickml/rag_config.json`
  - Data source: CaseMaster.BriefFacts, documents.text_content

- [ ] **6.2** Configure RAG settings
  - Model: Qwen 2.5 14B Instruct
  - Chunking: Semantic, 512 tokens, 64 overlap
  - Hybrid search: BM25 + Dense (0.4/0.6 weights)

- [ ] **6.3** Add RLS metadata to chunks
  - Ensure each chunk has: station_id, district_id, sensitivity
  - Filter: `metadata.station_id IN (user_stations)`

- [ ] **6.4** Create QuickML LLM Serving
  - Deploy Qwen 2.5 14B Instruct (primary)
  - Deploy Qwen 2.5 7B Coder (tool calling)
  - Use system prompt from `/catalyst/quickml/llm_config.json`

- [ ] **6.5** Index initial data
  ```bash
  catalyst function:invoke ingest_index --env dev
  # OR wait for nightly cron job
  ```

- [ ] **6.6** Test RAG queries
  ```bash
  # Use QuickML console or call chat.py directly
  curl -X POST <api_gateway_url>/chat \
    -H "Authorization: Bearer $TOKEN" \
    -d '{"query": "How many theft cases?", "mode": "text", "language": "en"}'
  ```

### Phase 7: Voice & OCR (Zia AI)

- [ ] **7.1** Enable Zia STT (Speech-to-Text)
  - Console → Zia → Enable STT
  - Languages: English, Kannada

- [ ] **7.2** Enable Zia TTS (Text-to-Speech)
  - Console → Zia → Enable TTS
  - Languages: English, Kannada

- [ ] **7.3** Enable Zia OCR
  - Console → Zia → Enable OCR
  - For document ingestion (scanned PDFs/images)

- [ ] **7.4** Enable Zia Translation
  - Kannada ↔ English

- [ ] **7.5** Update chat.py to use Zia
  - Add STT call if mode == "voice"
  - Add TTS call for voice response

### Phase 8: Automation Setup

- [ ] **8.1** Deploy Circuits workflow (optional)
  - Console → Circuits → Import
  - Use `/catalyst/circuits/document_ingestion_workflow.json`
  - Workflow: Upload → OCR → Notify Reviewers

- [ ] **8.2** Schedule Cron jobs
  - Console → Cron → Create
  - Nightly Analytics (2 AM): `/catalyst/cron/nightly_analytics.json`
  - Nightly Ingestion (3 AM): `/catalyst/cron/nightly_ingestion.json`

### Phase 9: Frontend Development

- [ ] **9.1** Build Chat UI
  - [ ] Create `/web/app/screens/chat/page.tsx`
  - [ ] Create `/web/app/components/chat/MessageList.tsx`
  - [ ] Create `/web/app/components/chat/ChatInput.tsx`
  - [ ] Create `/web/app/components/chat/CitationCard.tsx`
  - [ ] Connect to `/api/chat` endpoint

- [ ] **9.2** Build Network Analysis UI
  - [ ] Create `/web/app/screens/network/page.tsx`
  - [ ] Create `/web/app/components/network/GraphViewer.tsx` (Cytoscape)
  - [ ] Fetch and display criminal networks

- [ ] **9.3** Build Trends & Hotspot UI
  - [ ] Create `/web/app/screens/trends/page.tsx`
  - [ ] Create `/web/app/components/trends/MapViewer.tsx` (Leaflet)
  - [ ] Create `/web/app/components/trends/TrendsChart.tsx`

- [ ] **9.4** Build Admin & Ingestion UI
  - [ ] Create `/web/app/screens/admin/page.tsx`
  - [ ] Create `/web/app/components/ingestion/DocumentUpload.tsx`
  - [ ] Create `/web/app/components/ingestion/ReviewQueue.tsx`
  - [ ] Connect to `/api/ingest/*` endpoints

- [ ] **9.5** Build Layout Components
  - [ ] Create `/web/app/components/layout/Header.tsx`
  - [ ] Create `/web/app/components/layout/Sidebar.tsx`
  - [ ] Create `/web/app/components/layout/Footer.tsx`

- [ ] **9.6** Test frontend end-to-end
  ```bash
  cd web
  npm run dev
  # Test: Login → Chat → Send query → Receive answer
  ```

### Phase 10: Frontend Deployment

- [ ] **10.1** Build production frontend
  ```bash
  cd web
  npm run build
  ```

- [ ] **10.2** Deploy to Catalyst Web Client Hosting
  ```bash
  catalyst web:deploy --env production
  ```

- [ ] **10.3** Get production URL
  - Copy URL from Catalyst Console
  - Update CORS in API Gateway to allow production domain

### Phase 11: Testing & Quality Assurance

- [ ] **11.1** Test Authentication
  - [ ] Login with Catalyst Auth
  - [ ] Verify JWT token validation
  - [ ] Test role-based access (Constable vs Admin)

- [ ] **11.2** Test RLS (Row-Level Security)
  - [ ] Login as Station A officer
  - [ ] Verify only Station A FIRs are returned
  - [ ] Login as SCRB_Analyst
  - [ ] Verify all FIRs are visible

- [ ] **11.3** Test Chat AI
  - [ ] Send queries in English and Kannada
  - [ ] Verify RAG citations are correct
  - [ ] Verify confidence scores
  - [ ] Verify audit logging

- [ ] **11.4** Test Document Ingestion
  - [ ] Upload a PDF document
  - [ ] Verify OCR extraction
  - [ ] Approve/reject documents
  - [ ] Verify batch indexing (trigger cron manually)

- [ ] **11.5** Load Testing
  - [ ] Test with 100 concurrent users
  - [ ] Verify API Gateway rate limiting
  - [ ] Monitor Catalyst function performance

### Phase 12: Production Readiness

- [ ] **12.1** Security Hardening
  - [ ] Review all RBAC policies
  - [ ] Enable PII masking in responses
  - [ ] Enable audit log encryption
  - [ ] Review API Gateway CORS settings

- [ ] **12.2** Monitoring Setup
  - [ ] Enable Catalyst Logs
  - [ ] Set up error alerts
  - [ ] Monitor QuickML token usage
  - [ ] Monitor Data Store query performance

- [ ] **12.3** Backup & Recovery
  - [ ] Schedule Data Store backups
  - [ ] Test restore procedure
  - [ ] Document recovery process

- [ ] **12.4** Documentation
  - [ ] Update README with production URLs
  - [ ] Create user manual for police officers
  - [ ] Create admin guide for SCRB analysts
  - [ ] Document troubleshooting procedures

---

## Quick Start (Minimum Viable Product)

If you want to get a **basic working demo quickly**, follow this subset:

### MVP Checklist (30 steps → 15 steps)

1. [ ] `catalyst init` (create project)
2. [ ] Enable: Auth, Serverless, API Gateway, Data Store, QuickML
3. [ ] Create Data Store instance
4. [ ] Run `schema_official_ksp.sql`
5. [ ] Import sample CSVs from `/data/samples/`
6. [ ] Create Auth app, get Client ID/Issuer
7. [ ] Update `.env.local` with Auth credentials
8. [ ] Deploy `health.py` and `chat.py` (with TODOs filled)
9. [ ] Create API Gateway, link functions
10. [ ] Update `.env.local` with BASE_URL
11. [ ] Create QuickML RAG, index CaseMaster.BriefFacts
12. [ ] Build Chat UI (`/web/app/screens/chat/page.tsx`)
13. [ ] Test: Login → Send query → Get response
14. [ ] Deploy frontend to Catalyst Hosting
15. [ ] Demo to stakeholders

---

## Estimated Timeline

| Phase | Time | Depends On |
|-------|------|------------|
| Phase 1: Infrastructure | 1-2 hours | None |
| Phase 2: Database | 2-3 hours | Phase 1 |
| Phase 3: Authentication | 2-3 hours | Phase 1 |
| Phase 4: Backend | 3-5 days | Phases 1-3 |
| Phase 5: API Gateway | 1-2 hours | Phase 4 |
| Phase 6: AI/ML (QuickML) | 1-2 days | Phase 2 |
| Phase 7: Voice & OCR | 1 day | Phase 1 |
| Phase 8: Automation | 1 day | Phases 4, 6 |
| Phase 9: Frontend | 3-5 days | Phase 5 |
| Phase 10: Deployment | 1 day | Phase 9 |
| Phase 11: Testing | 2-3 days | Phase 10 |
| Phase 12: Production | 1-2 days | Phase 11 |
| **TOTAL** | **2-3 weeks** | Sequential |

**MVP (Phases 1-6 + basic UI)**: 1 week

---

## Current Status Summary

**Setup Phase**: ✅ **100% Complete**  
**Deployment Phase**: ❌ **0% Complete**

**Next Step**: Phase 1.1 - Run `catalyst init` to create Catalyst project

---

**Maintainer**: Ibha Development Team  
**Last Audit**: July 5, 2026
