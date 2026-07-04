# How Ibha Addresses KSP Datathon 2026 Judging Criteria

This document maps Ibha's features to the official judging criteria for **Challenge 1**.

---

## Judging Criteria Breakdown

### 1. Accuracy & Depth of Insights (25 points)

**Requirement**: Correct answers, pattern detection, network analysis, predictions, citations

**How Ibha Delivers**:

✅ **Retrieval-Augmented Generation (RAG)**:
- Grounds answers in actual FIR data
- Top-5 document retrieval with similarity threshold (0.7)
- Hybrid search (semantic + keyword) for better recall
- Reranking for precision

✅ **Citations with Every Answer**:
- Each claim includes source (FIR number, document ID)
- Snippet from source text
- Metadata (station, date, crime type)

✅ **Pattern Discovery**:
- Temporal analysis: Crime trends by day/week/month
- Geographic clustering: Hotspot detection (DBSCAN)
- MO analysis: Recurring modus operandi
- Offender profiling: Repeat offenders, crime specialization

✅ **Criminal Network Analysis**:
- Graph database (NoSQL) for relationships
- Edges: CO_OFFENDER_WITH, LINKED_TO_CASE, USED_MO
- Network metrics: Centrality, betweenness, community detection
- Link prediction: Suggest potential connections

✅ **Predictive Analytics** (Future Enhancement):
- Recidivism prediction model
- Crime forecasting by location/time
- Resource allocation recommendations

**Implementation**:
- QuickML RAG with Qwen 2.5 14B Instruct
- Cytoscape.js for network visualization
- Nightly cron job for pre-computed analytics
- Sample data includes repeat offenders and crime series

**Score Target**: 23-25/25

---

### 2. Multilingual & Voice Capabilities (15 points)

**Requirement**: English + Kannada, code-mixing, STT/TTS

**How Ibha Delivers**:

✅ **Dual Language Support**:
- English: Native LLM language
- Kannada: Via Zia Translation API
- Code-mixing: Detect and handle mixed queries

✅ **Voice Interaction**:
- Speech-to-Text (STT): Zia AI (English, Kannada)
- Text-to-Speech (TTS): Zia AI (English, Kannada)
- Mode toggle: Text vs. Voice

✅ **Query Translation Pipeline**:
```
Kannada Query
    ↓
Zia Translation → English
    ↓
RAG Retrieval (English)
    ↓
LLM Answer (English)
    ↓
Zia Translation → Kannada
    ↓
Return Kannada Answer
```

✅ **UI Language Toggle**:
- Switch between EN/KN in chat interface
- Mic button for voice input
- Audio playback for TTS responses

**Implementation**:
- Zia AI integration (STT, TTS, Translation)
- Language parameter in `/chat` endpoint
- Sample Kannada query in seed data

**Score Target**: 14-15/15

---

### 3. Explainability & Trust (20 points)

**Requirement**: Reasoning transparency, citations, confidence, audit

**How Ibha Delivers**:

✅ **Explanation Contract**:
Every answer includes:
- **Reasoning Sketch**: Step-by-step process (e.g., "Applied RLS filters → Retrieved top-5 docs → Generated answer")
- **Tool Trail**: Tools/models used (RAG, LLM, Translation, PII Filter)
- **Guardrails**: Security measures (RLS, content safety, PII masking)
- **Confidence Score**: 0.0 to 1.0 (based on retrieval similarity and LLM certainty)

✅ **Citations**:
- Every claim linked to source
- FIR number + document ID
- Snippet of source text
- Metadata (station, date, crime type)

✅ **Low-Confidence Warning**:
- Answers below 0.7 confidence include: "I have low confidence in this answer. Please verify manually."

✅ **Full Audit Trail**:
- All queries logged in `audit_logs` table
- Answer hash (SHA-256) for integrity
- 5-year retention for compliance
- Queryable by Admin for investigation

✅ **UI Display**:
- "Explain this answer" accordion in chat
- Citations panel on right side
- Confidence badge (color-coded: green > 0.8, yellow 0.7-0.8, red < 0.7)

**Implementation**:
- Explanation contract in `ChatResponse` type
- `ExplanationPanel` component
- `audit.py` function logs everything
- Sample explanation in demo response

**Score Target**: 19-20/20

---

### 4. Security & Access Control (20 points)

**Requirement**: RBAC, RLS, no data leaks, audit compliance

**How Ibha Delivers**:

✅ **OAuth 2.0 Authentication**:
- Catalyst Auth integration
- JWT tokens with 1-hour expiration
- MFA (optional)

✅ **Role-Based Access Control (RBAC)**:
- 6 roles: Constable, SI, Inspector, DSP, SCRB_Analyst, Admin
- Endpoint restrictions (e.g., only SCRB_Analyst can upload documents)
- UI features hidden based on role

✅ **Row-Level Security (RLS)**:
- Constable: Only own station data
- DSP: District-wide data
- SCRB_Analyst: State-wide data
- Filters applied to ALL queries (Data Store + RAG)

✅ **Sensitivity-Based Access**:
- 3 levels: NORMAL, CONFIDENTIAL, RESTRICTED
- Users have clearance level
- Queries filter by `sensitivity <= clearance`

✅ **PII Protection**:
- Names masked: `Rajesh K***`
- Phone numbers masked: `+91-98765-XXXXX`
- Addresses generalized (city only)

✅ **Rate Limiting**:
- 60-150 req/min per user (varies by role)
- API Gateway enforcement

✅ **Audit Logging**:
- Every query + answer logged
- SHA-256 hashes for integrity
- 5-year retention

✅ **PDF Watermarking**:
- Exports include: "Confidential - {user.name} - {station} - {date}"
- Deters unauthorized sharing

**Implementation**:
- `auth_utils.py` for RBAC/RLS
- `catalyst/auth/roles.json` and `policies.json`
- `audit_logs` table
- SmartBrowz for watermarked PDFs

**Score Target**: 19-20/20

---

### 5. User Experience & Usability (15 points)

**Requirement**: Intuitive, fast, role-aware, mobile-friendly

**How Ibha Delivers**:

✅ **Intuitive Interface**:
- Clean, modern UI (dark theme for police operations)
- Chat-first design (familiar like WhatsApp/ChatGPT)
- Clear navigation (sidebar: Chat, Network, Trends, Admin)

✅ **Fast Response Times**:
- Serverless auto-scaling
- Cached analytics (pre-computed nightly)
- Optimistic UI updates (React Query)

✅ **Role-Aware Features**:
- Constable: Chat only
- DSP: Chat + Trends
- SCRB_Analyst: Chat + Trends + Ingestion
- Admin: Full access

✅ **Mobile-Friendly**:
- Responsive design (Tailwind CSS)
- Collapsible sidebar on mobile
- Touch-friendly buttons (44px min tap target)

✅ **Professional Design**:
- Police-grade color scheme (deep blue, charcoal, amber accent)
- Good spacing, typography, icons (Lucide React)
- Subtle animations (Framer Motion)

✅ **Accessibility**:
- WCAG 2.1 AA target
- Keyboard navigation
- Screen reader support (ARIA labels)
- High contrast ratios

**Implementation**:
- Next.js 14 (App Router) for fast loading
- Tailwind CSS for consistent styling
- React Query for instant UI updates
- Lighthouse score target: > 90

**Score Target**: 14-15/15

---

### 6. Innovation & Scalability (5 points)

**Requirement**: Graph analytics, predictions, Catalyst-native, performance at scale

**How Ibha Delivers**:

✅ **Graph Analytics**:
- NoSQL for criminal network graph
- Cytoscape.js visualization
- Community detection (future)
- Link prediction (future)

✅ **Predictive Models** (Future):
- Recidivism prediction
- Crime forecasting (ARIMA, Prophet)
- Hotspot prediction

✅ **Catalyst-Native Architecture**:
- All services on Catalyst (no external dependencies)
- Serverless Functions (Python 3.11)
- Data Store + NoSQL
- QuickML (RAG + LLM)
- Zia AI (STT/TTS/OCR/Translation)
- SmartBrowz (PDF)
- Circuits (workflows)
- Cron Jobs (scheduled tasks)

✅ **Scalability**:
- Serverless auto-scaling (handle 10,000+ concurrent users)
- RAG index sharding (by district)
- Read replicas for audit logs (future)
- CDN for frontend assets

✅ **Innovation**:
- **Controlled Ingestion**: Human-in-the-loop prevents poisoning attacks
- **Explanation Contract**: Transparency standard for police AI
- **Multilingual Code-Mixing**: Handles real-world Kannada-English queries
- **Role-Aware RLS**: Automatic data filtering at query level

**Implementation**:
- Zero external services (100% Catalyst)
- Graph visualization (Cytoscape.js)
- Pre-computed analytics (nightly cron)
- Extensible architecture (easy to add new models)

**Score Target**: 5/5

---

## Total Score Target

| Criterion | Weight | Target Score |
|-----------|--------|--------------|
| Accuracy & Insights | 25% | 23-25 |
| Multilingual & Voice | 15% | 14-15 |
| Explainability & Trust | 20% | 19-20 |
| Security & Access | 20% | 19-20 |
| UX & Usability | 15% | 14-15 |
| Innovation & Scalability | 5% | 5 |
| **TOTAL** | **100%** | **94-100** |

---

## Demonstration Strategy

### Live Demo Script (10 minutes)

**Minute 0-1: Introduction**
- "Hello, I'm presenting **Ibha**, an intelligent crime analytics platform for KSP."
- Show homepage with Ibha branding

**Minute 1-3: Chat (English)**
- Login as Constable
- Query: "Show me theft cases in Koramangala in the last month"
- Show answer with citations
- Click "Explain this answer" → Show reasoning sketch
- Highlight: RLS filter applied (only Koramangala data)

**Minute 3-4: Chat (Kannada + Voice)**
- Switch language to Kannada
- Query (voice): "ಕೊರಮಂಗಲದಲ್ಲಿ ಕಳ್ಳತನ ಪ್ರಕರಣಗಳು"
- Show Kannada answer with TTS playback
- Highlight: Multilingual support

**Minute 4-5: Network Analysis**
- Navigate to Network page
- Query: "Show network of Ravi Kumar (Chotu)"
- Show graph with connections
- Highlight: 3 FIRs, same MO pattern detected

**Minute 5-6: Trends & Hotspots**
- Navigate to Trends page
- Show crime hotspot map with heatmap
- Time slider → Show trend over time
- Highlight: Koramangala 5th Block is a theft hotspot

**Minute 6-7: Security & RBAC**
- Logout and login as Admin
- Show ingestion management (new feature)
- Upload a document → Show pending review queue
- Approve document → Show batch indexing queue
- Highlight: Controlled ingestion prevents poisoning

**Minute 7-8: Audit Trail**
- Navigate to Admin → Audit Logs
- Show table of all queries (user, timestamp, query preview)
- Click on a query → Show full details (citations, tool trail, confidence)
- Highlight: Full compliance, 5-year retention

**Minute 8-9: Architecture**
- Show architecture diagram (slide)
- Explain Catalyst-native approach
- Highlight: Serverless, scalable, no external dependencies

**Minute 9-10: Judging Criteria Alignment**
- Show scorecard (slide)
- Briefly mention how each criterion is addressed
- Q&A

---

## Code Quality Highlights

- **Type Safety**: TypeScript on frontend, type hints on backend
- **Code Comments**: WHY, not WHAT
- **TODO Comments**: Clear markers for future implementation
- **Structured Logging**: JSON logs for observability
- **Error Handling**: Try/except with proper status codes
- **Security**: Input validation, parameterized queries, PII masking
- **Maintainability**: Modular functions, DRY principle
- **Documentation**: README, architecture, security, this file

---

## Differentiation from Competitors

| Feature | Ibha | Typical Competitors |
|---------|------|---------------------|
| **Controlled Ingestion** | ✅ Human-in-loop, batch indexing | ❌ Continuous retraining (risky) |
| **Explanation Contract** | ✅ Structured reasoning + confidence | ❌ Black-box answers |
| **RLS at Query Level** | ✅ Automatic filtering | ❌ Post-query filtering (data leaks) |
| **Multilingual Code-Mixing** | ✅ Kannada-English mix support | ❌ Single language only |
| **Role-Aware UI** | ✅ Different features per role | ❌ Same UI for everyone |
| **Catalyst-Native** | ✅ 100% Catalyst services | ❌ Mix of platforms (AWS, Azure, etc.) |

---

**Strategy**: Emphasize **security**, **explainability**, and **Catalyst integration** during demo.

**Last Updated**: July 3, 2026

**Team**: Ibha Development Team
