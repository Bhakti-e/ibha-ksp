# Ibha KSP - 10-Minute Demo Walkthrough

**Purpose:** Demonstrate Ibha's conversational crime intelligence to KSP Datathon 2026 judges  
**Time:** 10 minutes  
**Focus:** Show real features, no fake demos

---

## Pre-Demo Checklist

- [ ] Database running with seed data (35 FIRs, 6 users)
- [ ] Backend running (Catalyst functions or local server)
- [ ] Frontend running at http://localhost:3000
- [ ] Test login works: `rajesh.kumar@ksp.gov.in` / `password123`
- [ ] Browser developer console open (to show no external API calls)

---

## Demo Script (10 Minutes)

### 1️⃣ INTRODUCTION (30 seconds)

**Say:**
> "Ibha is a conversational crime intelligence system for Karnataka State Police. It's built for KSP Datathon 2026 Challenge 1. The key innovation: **NO external LLM or AI services** - everything runs on keyword-based NLP and SQL queries against real KSP data. Let me show you."

**Show:** Landing page briefly, then click **Login**.

---

### 2️⃣ AUTHENTICATION & SECURITY (1.5 minutes)

**Login as Constable:**
- Email: `rajesh.kumar@ksp.gov.in`
- Password: `password123`

**Say:**
> "This is Constable Rajesh Kumar from Koramangala Police Station (Station ID 1). Authentication uses JWT tokens with HMAC-SHA256 signing. The system enforces three-layer security:"

**Show in browser DevTools (Network tab):**
1. Login request → Response contains JWT token
2. Token payload (decode on jwt.io): `{"user_id": "USR_001", "role": "Constable", "station_id": 1, "district_id": 1}`

**Say:**
> "Notice three security layers:
> 1. **Authentication:** JWT token with 4-hour expiry
> 2. **RBAC (Role-Based Access Control):** 6 roles from Constable to Admin
> 3. **RLS (Row-Level Security):** Constables only see their station's data
>
> Let's test this."

---

### 3️⃣ CONVERSATIONAL CHAT - CONSTABLE VIEW (2 minutes)

**Navigate to Chat page.**

**Query 1: Station-Level Access**
> Type: "Show theft cases in my station in last 30 days"

**Point out:**
- Answer appears in ~1-2 seconds
- Shows natural language: "Found 8 theft cases in the last 30 days."
- Table shows FIR details (CrimeNo, Date, BriefFacts, Status)
- **Explanation Contract** section shows:
  - Detected intent: `search_cases`
  - Filters applied: `crime_type=theft, station_id=1, last_30_days`
  - RLS enforced: `role=Constable, station=1`
  - Confidence: 0.9 (rule-based, not ML estimation)

**Say:**
> "Notice: Only Station 1 (Koramangala) cases appear. That's RLS in action. Also, there's NO call to OpenAI, Anthropic, or any external AI. Check the Network tab—only our backend API."

**Show DevTools Network tab:** Only `POST /chat` to your backend, no external domains.

**Query 2: Multilingual Support**
> Type in Kannada: "ಕಳೆದ 7 ದಿನಗಳಲ್ಲಿ ಕಳ್ಳತನ ಪ್ರಕರಣಗಳು ತೋರಿಸಿ"
> (Translation: "Show theft cases in the last 7 days")

**Point out:**
- System detects Kannada input
- Response also in Kannada: "ಕಳೆದ 7 ದಿನಗಳಲ್ಲಿ 3 ಕಳ್ಳತನ ಪ್ರಕರಣಗಳು ಕಂಡುಬಂದಿವೆ."
- Data table still in English (FIR numbers, official format)

**Say:**
> "Language detection and bilingual templates—all keyword-based, no LLM."

---

### 4️⃣ ROLE COMPARISON - DSP VIEW (2 minutes)

**Logout and login as DSP:**
- Email: `lakshmi.rao@ksp.gov.in`
- Password: `password123`

**Say:**
> "Now I'm logging in as DSP Lakshmi Rao. DSPs have **district-wide access** instead of station-level."

**Navigate to Chat.**

**Query: Same Question, Different Results**
> Type: "Show theft cases in last 30 days"

**Point out:**
- Answer: "Found 18 theft cases in the last 30 days."
- More results because DSP sees **all stations in District 1**
- Explanation contract shows: `RLS applied: role=DSP, district=1`

**Say:**
> "Same query, but DSP sees 18 cases (all district) vs Constable's 8 cases (one station). That's automatic Row-Level Security—we don't trust the frontend to filter, the SQL query itself is different based on role."

**Show (optional):** Open browser console, show the explanation_contract JSON with different RLS filters.

---

### 5️⃣ TRENDS & HOTSPOTS (1.5 minutes)

**Navigate to Trends page (still as DSP).**

**Point out:**
- **Top Hotspots:** Bar chart showing stations with most crimes
  - Koramangala Station: 20 cases, **Risk Level: HIGH** (red)
  - Whitefield Station: 15 cases, **Risk Level: MEDIUM** (orange)
- **Risk reasoning:** "20 cases reported (well above average), including 2 heinous crimes"
- **Monthly Trends:** Line chart showing crime counts over 12 months
- **Summary card:** "Trend direction: INCREASING. Top crime type: Theft."

**Say:**
> "Trends help supervisors spot patterns. Risk levels are calculated from thresholds: >15 cases = HIGH, 8-15 = MEDIUM, <8 = LOW. This is real data from our 35 sample FIRs in the database."

---

### 6️⃣ CRIMINAL NETWORK GRAPH (1.5 minutes)

**Navigate to Network page.**

**Say:**
> "Network analysis shows connections between accused persons and cases. This helps identify repeat offenders and co-accused patterns."

**Select accused from dropdown:**
- Choose **"Ravi Kumar"** (AccusedMasterID = 1) - appears in 5 cases

**Click "Load Network"**

**Point out the graph:**
- **Central red node:** Ravi Kumar (repeat offender)
- **Blue case nodes:** 5 FIRs he's involved in
- **Other person nodes:** Co-accused in those cases
- **Edges:** 
  - Green: ACCUSED_IN (person → case)
  - Yellow: CO_ACCUSED (person → person)

**Say:**
> "This is a Cytoscape.js graph. Ravi Kumar is a repeat offender with 5 cases spanning theft, burglary, and chain snatching. He's connected to 3 other co-accused. This network is built purely from SQL queries joining CaseMaster and Accused tables."

---

### 7️⃣ AUDIT LOGGING - ADMIN VIEW (1 minute)

**Logout and login as Admin:**
- Email: `admin.system@ksp.gov.in`
- Password: `password123`

**Navigate to Admin → Audit Logs.**

**Point out:**
- Table showing all queries from the demo session:
  - Timestamp
  - User (Constable Rajesh, DSP Lakshmi)
  - Query text ("Show theft cases...")
  - Intent detected
  - Result count
  - Filters applied (JSON)

**Say:**
> "Every query is logged for compliance and audit trails. This is crucial for law enforcement—we need to know who searched for what and why. Only Admins and SCRB Analysts can view audit logs."

**Show (optional):** System Stats card showing:
- Total cases: 35
- Total users: 6
- Queries today: 8
- Database health: OK

---

### 8️⃣ SECURITY DEMONSTRATION (1 minute)

**Open browser DevTools → Application → Local Storage**

**Show:**
- `auth_token`: JWT token stored
- `user_data`: User profile JSON

**Say:**
> "Token is stored in localStorage for demo purposes. In production, we'd use httpOnly cookies to prevent XSS attacks."

**Open a new incognito window, try to access Chat page directly:**

**Point out:**
- Redirects to Login page
- Shows "Authentication required" if you try to call API without token

**Try invalid credentials:**
- Email: `test@ksp.gov.in`
- Password: `wrong`

**Point out:**
- Error: "Invalid email or password"
- No stack trace, clean error message
- Login attempts are logged

---

## 🎯 Key Talking Points (Summary)

**Innovation:**
- ✅ **Zero external LLM dependencies** - keyword NLP only
- ✅ **Database-first approach** - all answers from SQL
- ✅ **Multi-layer security** - Auth + RBAC + RLS
- ✅ **Explainable AI** - explanation contracts show reasoning

**Functionality:**
- ✅ Conversational search with intent detection
- ✅ Multilingual (English + Kannada)
- ✅ Role-based data access (6 roles)
- ✅ Trend analysis with risk levels
- ✅ Criminal network visualization
- ✅ Complete audit trails

**Production-Ready Features:**
- ✅ Parameterized queries (SQL injection safe)
- ✅ Constant-time password comparisons
- ✅ Token expiry and signature verification
- ✅ CORS headers for web security
- ✅ Error handling and logging

**Honest Limitations (for judges):**
- ⚠️ NLP is keyword-based (no fuzzy matching or ML)
- ⚠️ Test users have simple password (production needs bcrypt)
- ⚠️ 35 sample FIRs (production would have millions)
- ⚠️ No refresh tokens (sessions expire after 4 hours)

---

## 🔍 Questions Judges Might Ask

**Q: "Is this using ChatGPT or any AI model?"**

**A:** "No. Open the browser Network tab—there are zero calls to OpenAI, Anthropic, Google, or any external AI service. The NLP is 100% keyword-based using Python dictionaries. For example, if the query contains 'theft', we map it to `CrimeMinorHeadID = 1` in the database. The 'answer' is a template: 'Found {count} theft cases in the last {days} days.' No generative AI."

**Demo:** Show `nlp_simple.py` code, highlight `CRIME_KEYWORDS_EN` dictionary.

---

**Q: "How does Row-Level Security work?"**

**A:** "Every SQL query goes through `enforce_rls()` before execution. Based on the user's role from their JWT token, we inject WHERE clauses:
- Constable: `WHERE PoliceStationID = 1`
- DSP: `WHERE DistrictID = 1`  
- Admin: No filter

This happens server-side, not in the frontend. Even if someone manipulates the frontend JavaScript, they can't bypass RLS because the SQL query is built on the backend."

**Demo:** Show `query_builder.py` code, highlight `apply_rls_filters()` function.

---

**Q: "What's in the explanation contract?"**

**A:** "It's a structured JSON showing how the query was processed:
- **Reasoning sketch:** Steps taken (intent detection → entity extraction → SQL → formatting)
- **Tool trail:** Functions called (nlp_simple → query_builder → db → templates)
- **Guardrails:** Security measures (RLS enforced, max 50 rows, SQL injection safe)
- **Confidence:** 0.9 (fixed for rule-based, not ML confidence)
- **Data sources:** Tables queried (CaseMaster, CrimeSubHead, Unit)

This makes the system explainable—users know exactly what happened and why."

**Demo:** Expand explanation contract in Chat UI, show JSON structure.

---

**Q: "Can it handle complex queries like 'Show me assault cases near MG Road involving repeat offenders'?"**

**A:** "Partially. Current MVP handles:
- ✅ Crime type ('assault')
- ✅ Date ranges ('last 30 days')
- ✅ Location scope ('my station', 'my district')

It doesn't handle:
- ❌ Geographic proximity ('near MG Road') - would need geospatial queries
- ❌ Repeat offender filtering - would need to count previous cases in SQL

These are feasible extensions using the same architecture—we'd add more keywords to NLP and JOIN statements to SQL builder. No LLM required."

---

**Q: "How does this scale to millions of FIRs?"**

**A:** "The architecture is designed for scale:
- **Database indexes:** We have indexes on CrimeRegisteredDate, PoliceStationID, CrimeMinorHeadID
- **Query limits:** All queries have `LIMIT 50` to prevent large result sets
- **Parameterized queries:** No SQL injection means no malicious load
- **Stateless functions:** Backend runs on Catalyst serverless, auto-scales
- **Caching opportunities:** Trends/hotspots can be pre-computed nightly

With millions of FIRs, we'd add:
- Pagination (OFFSET support)
- Query result caching (Redis)
- Read replicas for analytics queries
- Date partitioning on CaseMaster table"

---

## 🎬 Demo Closing (30 seconds)

**Say:**
> "To summarize: Ibha provides conversational crime intelligence with **zero external AI dependencies**. It's secure (JWT + RBAC + RLS), explainable (contracts show reasoning), and scalable (keyword NLP + SQL). All 35 sample FIRs you saw are real data matching KSP's official schema from the datathon documentation.
>
> The code is production-ready for MVP deployment. Thank you!"

**Optional:** Show GitHub repo structure briefly if time permits.

---

## 📊 Demo Metrics to Highlight

- **Response time:** < 2 seconds per query
- **Lines of code:** ~3,000 (Python backend + TypeScript frontend)
- **External dependencies:** Zero AI APIs
- **Security layers:** 3 (Auth, RBAC, RLS)
- **Test coverage:** All endpoints functional
- **Database queries:** 100% parameterized (SQL injection safe)
- **Roles supported:** 6 (Constable → Admin)
- **Languages:** 2 (English + Kannada)

---

## 🛠️ Backup Plans

**If database connection fails:**
- Have screenshots/screen recording ready
- Show code walkthrough instead

**If frontend crashes:**
- Demo using cURL commands to backend API
- Show JSON responses directly

**If network is slow:**
- Run demo fully offline (local PostgreSQL + local servers)
- No external dependencies means 100% offline capable

---

**Good luck with the demo! 🚀**
