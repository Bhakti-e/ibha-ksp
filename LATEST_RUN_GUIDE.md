# 🚀 IBHA KSP - QUICK START GUIDE
**Last Updated:** After UI/UX Polish Push (Commit: 1d0b014)

---

## 📦 TASK 1 – GIT STATUS

### ✅ Successfully Pushed to GitHub

**Repository:** https://github.com/Bhakti-e/ibha-ksp  
**Branch:** main  
**Latest Commit:** `1d0b014` - UI polish: Update Tailwind config with refined command center theme

### Recent Commits:
```
1d0b014 (HEAD -> main, origin/main) UI polish: Update Tailwind config with refined command center theme
ff20008 Add comprehensive run guide and final summary
3c78a05 MVP Complete: Full-stack crime intelligence system with professional UI
1362603 Add MVP status and implementation guide - Phase 1 complete
5735a4b MVP Phase 1: Real database setup and authentication
```

**Status:** ✅ All changes successfully pushed to GitHub

---

## 🖥️ TASK 2 – HOW TO RUN LOCALLY

### Prerequisites
- PostgreSQL 18 (running)
- Python 3.11+
- Node.js 18+
- Git

---

### 🗄️ STEP 1: DATABASE SETUP

#### Create Database (if not already done)
```powershell
# Open psql as postgres user
psql -U postgres

# Run these commands:
CREATE DATABASE ibha;
CREATE USER ibha_user WITH PASSWORD 'yeet';
GRANT ALL PRIVILEGES ON DATABASE ibha TO ibha_user;
\q
```

#### Load Schema and Data
```powershell
# From project root: c:\Projects\Ibha\ibha-ksp
cd c:\Projects\Ibha\ibha-ksp

# Load schema
psql -U postgres -d ibha -f catalyst/datastore/init_db.sql

# Load seed data (35 FIRs, 6 users)
psql -U postgres -d ibha -f catalyst/datastore/seed_data.sql
```

#### Verify Database
```powershell
psql -U postgres -d ibha
```

Run verification queries:
```sql
-- Should return 35
SELECT COUNT(*) FROM "CaseMaster";

-- Should return 6 users
SELECT email, role, full_name FROM users;

-- Check demo user
SELECT * FROM users WHERE email = 'rajesh.kumar@ksp.gov.in';

\q
```

**Expected:**
- ✅ 35 cases in CaseMaster
- ✅ 6 users (Constable, SI, Inspector, DSP, SCRB_Analyst, Admin)
- ✅ Password for all users: `password123`

---

### 🔧 STEP 2: BACKEND SETUP

#### Install Python Dependencies
```powershell
cd c:\Projects\Ibha\ibha-ksp

# Install required packages
pip install flask flask-cors psycopg2-binary
```

#### Configuration
Database config in `local_server.py` (already set):
```python
DATABASE_URL = postgresql://postgres:yeet@localhost:5432/ibha
JWT_SECRET = ksp-secret-key-2025
```

#### Start Backend
```powershell
# From project root
python local_server.py
```

**Expected Output:**
```
============================================================
🚀 Ibha Local API Server Starting...
============================================================
   URL: http://localhost:8000
   Environment: Development (Local)
   Database: PostgreSQL @ localhost:5432/ibha
============================================================
✅ Server ready! Press Ctrl+C to stop
 * Running on http://127.0.0.1:8000
```

#### Verify Backend
Open new terminal:
```powershell
# Test health check
curl http://localhost:8000/health

# Should return: {"status":"ok"}
```

**Backend Endpoints:**
- `POST /api/v1/auth/login` - Authentication
- `POST /api/v1/chat` - Chat with intelligence system
- `GET /api/v1/trends/hotspots?days=30` - Crime hotspots
- `GET /api/v1/trends/summary?months=12` - Monthly trends
- `GET /api/v1/network/accused/{person_id}` - Criminal network graph
- `GET /api/v1/admin/audit-logs` - Audit logs (Admin only)
- `GET /api/v1/admin/stats` - System statistics

---

### 🌐 STEP 3: FRONTEND SETUP

#### Install Dependencies
```powershell
# Navigate to web directory
cd c:\Projects\Ibha\ibha-ksp\web

# Install npm packages (first time only)
npm install
```

**Installed Packages:**
- Next.js 14.2 (React framework)
- TanStack Query (data fetching)
- Axios (HTTP client)
- Recharts (for charts - installed but basic implementation)
- Cytoscape (for network graph - installed but basic canvas used)
- Lucide React (icons)
- Tailwind CSS (styling)

#### Configuration
File `web/.env.local` (already set):
```env
NEXT_PUBLIC_CATALYST_API_BASE_URL=http://localhost:8000/api/v1
```

#### Start Frontend
```powershell
# From web directory
npm run dev
```

**Expected Output:**
```
▲ Next.js 14.2.35
- Local:        http://localhost:3000
- Environments: .env.local

✓ Ready in 2.1s
```

---

### 🌍 STEP 4: OPEN THE APP IN BROWSER

#### 1. Open Browser
Navigate to: **http://localhost:3000**

#### 2. What You Should See
- **Professional login screen** with:
  - Ibha shield logo (blue gradient shield icon)
  - Dark blue/black command center theme
  - Email and password input fields
  - "Demo Credentials" section showing test users
  - Modern, clean design

#### 3. Demo User Credentials

**Constable (Station-level access):**
```
Email: rajesh.kumar@ksp.gov.in
Password: password123
Role: Constable
Station: 1 (Koramangala)
Access: Can only see cases from own station
```

**Sub-Inspector (Station-level access):**
```
Email: suresh.patil@ksp.gov.in
Password: password123
Role: Sub Inspector
Station: 2 (Whitefield)
```

**Inspector (Station-level access):**
```
Email: arun.desai@ksp.gov.in
Password: password123
Role: Inspector
Station: 1 (Koramangala)
```

**DSP (District-level access):**
```
Email: lakshmi.rao@ksp.gov.in
Password: password123
Role: DSP (Deputy Superintendent)
Access: Can see all cases in district
```

**SCRB Analyst (State-level access):**
```
Email: priya.menon@ksp.gov.in
Password: password123
Role: SCRB_Analyst
Access: State-wide data access
```

**Admin (Full access):**
```
Email: admin.system@ksp.gov.in
Password: password123
Role: Admin
Access: Full system access + admin panel
```

#### 4. After Login
- Redirects to `/chat`
- **Navbar** displays:
  - Ibha logo with shield icon
  - Navigation tabs: Chat, Trends, Network, Admin (if authorized)
  - User info: Full name, role, station ID
  - Logout button
- **Chat interface** ready with:
  - Message input field
  - Send button
  - Example queries displayed

---

## 🧪 TASK 3 – QUICK TEST SCRIPT

Follow this test flow to verify everything works:

### ✅ Test 1: Login & Authentication
```
1. Open http://localhost:3000
2. Enter: rajesh.kumar@ksp.gov.in / password123
3. Click "Login"
4. ✅ Should redirect to /chat
5. ✅ Navbar shows: "Rajesh Kumar" • "Constable • Station 1"
6. ✅ Navigation shows: Chat, Trends, Network (no Admin for Constable)
```

### ✅ Test 2: Chat Interface – Real Database Query
```
1. In chat input, type:
   "Show theft cases in my station in last 30 days"

2. Click Send (or press Enter)

3. ✅ Expected Response (within 2-3 seconds):
   - System answer: "Found X theft cases in Koramangala station in last 30 days"
   - Data table/cards showing FIR details:
     • CrimeNo (e.g., "001/2024")
     • Date (e.g., "2024-01-15")
     • Station Name
     • Crime Type (e.g., "Theft")
     • Status (e.g., "Under Investigation")
   - Explanation panel showing:
     • Intent: "query_firs"
     • Filters applied: station_id=1, date range, crime_type
     • Confidence: High
   
4. ✅ This is REAL DATA from PostgreSQL database!
5. ✅ RLS enforced: Only shows Station 1 (Koramangala) cases
```

**More Test Queries:**
```
"Show all murder cases"
"List cases from January 2024"
"Show heinous crimes"
"Cases where accused age is above 30"
```

### ✅ Test 3: Trends Page
```
1. Click "Trends" in navbar
2. ✅ Expected:
   - Page title: "Crime Trends & Hotspots"
   - Period selector: 7, 15, 30, 60, 90 days (30 selected by default)
   - Hotspots section showing:
     • Ranked list of stations by crime count
     • Risk levels: HIGH (red), MEDIUM (yellow), LOW (green)
     • Total cases, heinous count, change percentage
     • Reason for hotspot status
   - Monthly trends section:
     • Table with month, crime type, case count
   
3. Click "60 days" period selector
4. ✅ Data refreshes with 60-day analysis

5. ⚠️ Note: Data is correct, but visualization is tables/lists
   (Chart.js bar/line charts are planned but not yet implemented)
```

### ⚠️ Test 4: Network Page
```
1. Click "Network" in navbar
2. In input field, enter: 1
3. Click "Load Network"
4. ✅ Expected:
   - Canvas graph showing:
     • Yellow node: Central accused (Ravi Kumar)
     • Blue nodes: Co-accused
     • Red nodes: Cases
     • Lines connecting them
   - Legend showing node types
   - Metadata: Total nodes, connections, cases count
   - Node list below graph with details

5. Try other IDs: 2, 3, 4

6. ⚠️ Note: Basic canvas rendering works
   (Cytoscape.js upgrade for interactive graph is planned but not implemented)
```

### ⚠️ Test 5: Admin Page (Admin Role Only)
```
1. Logout (click Logout button in navbar)
2. Login as: admin.system@ksp.gov.in / password123
3. Click "Admin" in navbar (now visible)
4. ✅ Expected:
   - Page title: "System Administration"
   - Audit logs section with table structure
   - Columns: Timestamp, User, Action, Details, IP Address

5. ⚠️ Note: Table will be empty
   (Audit logs are not persisting to database yet - known limitation)
```

### ✅ Test 6: Role-Based Access Control (RLS)
```
Test A: Station-Level Access
1. Login as: rajesh.kumar@ksp.gov.in (Constable, Station 1)
2. Query: "Show theft cases"
3. ✅ Result: Only shows cases from Station 1 (Koramangala)

Test B: District-Level Access
1. Logout and login as: lakshmi.rao@ksp.gov.in (DSP)
2. Query: "Show theft cases"
3. ✅ Result: Shows cases from MULTIPLE stations in district

Test C: State-Level Access
1. Logout and login as: priya.menon@ksp.gov.in (SCRB_Analyst)
2. Query: "Show theft cases"
3. ✅ Result: Shows cases across entire state

🎯 This proves Row-Level Security (RLS) is working correctly!
```

---

## 📊 TASK 4 – FINAL SUMMARY

### 1️⃣ GitHub Status

**Repository:** https://github.com/Bhakti-e/ibha-ksp  
**Branch:** main  
**Status:** ✅ All changes pushed successfully  
**Latest Commit:** `1d0b014` - UI polish: Update Tailwind config  
**Total Commits:** 6 commits in project history  

**What's in the Repository:**
- Complete backend with Python/Flask + PostgreSQL
- Complete frontend with Next.js/React + Tailwind
- Database schema and seed data (35 FIRs, 6 users)
- Design system with command center dark theme
- Documentation: HOW_TO_RUN.md, architecture docs, etc.

---

### 2️⃣ Local Run Summary

#### Start Backend:
```powershell
cd c:\Projects\Ibha\ibha-ksp
python local_server.py
```
**URL:** http://localhost:8000  
**Endpoints:** `/api/v1/auth/login`, `/api/v1/chat`, `/api/v1/trends/*`, etc.

#### Start Frontend:
```powershell
cd c:\Projects\Ibha\ibha-ksp\web
npm run dev
```
**URL:** http://localhost:3000  
**Login:** rajesh.kumar@ksp.gov.in / password123

---

### 3️⃣ What's Now "Product-Like" ✅

#### 1. **Professional Design System**
- Command center dark theme (navy blue #0F172A background)
- Consistent color palette: primary blue (#2563EB), risk colors (red/yellow/green)
- Inter font family, refined spacing (4px-64px scale)
- Smooth animations: fade-in, slide-in-up, pulse-glow
- Custom scrollbars, hover states, focus rings

#### 2. **Polished Navbar & Layout**
- Shield logo with gradient (Karnataka branding)
- Persistent navigation across all pages
- User info display: name, role, station
- Active page highlighting
- Role-based navigation (Admin tab only for authorized users)

#### 3. **Professional Login Screen**
- Clean card-based design
- Shield logo prominently displayed
- Demo credentials section for easy testing
- Loading states, error handling
- Smooth transitions

#### 4. **End-to-End Working Chat**
- Real keyword-based NLP (no external LLM)
- SQL query builder with RLS enforcement
- Database-backed answers from 35 real FIRs
- Message history with user/system distinction
- Explanation panel showing intent, filters, confidence
- Loading and error states

#### 5. **Row-Level Security (RLS) Enforcement**
- Station-level users see only their station's cases
- District-level users see district-wide data
- State-level analysts see everything
- Enforced at query level (not just UI)
- Proven with different user roles

---

### 4️⃣ What's Still Minimal ⚠️

#### 1. **Trends Visualization**
- **Current:** Data is correct, displayed as tables and lists
- **Needs:** Chart.js or Recharts bar/line charts
  - Bar chart for hotspots (x: station, y: crime count)
  - Line chart for monthly trends (x: month, y: cases)
- **Status:** Recharts is installed in package.json, but not integrated into page

#### 2. **Network Graph Visualization**
- **Current:** Basic HTML Canvas with simple circular layout
- **Needs:** Cytoscape.js for interactive graph
  - Draggable nodes
  - Zoom/pan controls
  - Better layout algorithm (force-directed)
  - Hover tooltips on nodes/edges
- **Status:** Cytoscape is installed in package.json, but not integrated into page

#### 3. **Audit Logging Persistence**
- **Current:** Audit log endpoint exists, but logs don't persist to database
- **Needs:** Database table for audit logs, insert statements in backend
- **Status:** Table structure exists in Admin page, but always shows empty

#### 4. **Password Security**
- **Current:** Passwords stored as plain text in seed data (simplified for demo)
- **Needs:** bcrypt hashing in `catalyst/functions/lib/auth_utils.py`
- **Status:** Commented out for demo simplicity (all passwords are "password123")

---

## 🎯 PRODUCTION READINESS ASSESSMENT

### Ready for Demo ✅
- Login and authentication work flawlessly
- Chat returns real, accurate data from database
- RLS properly restricts data access by role
- UI looks professional and consistent
- Dark theme fits police/government aesthetic
- Navigation is intuitive

### Needs Work for Production ⚠️
- Add real charts (Recharts already installed)
- Upgrade network graph to Cytoscape (already installed)
- Fix audit logging to persist to database
- Enable bcrypt password hashing
- Add more error handling edge cases
- Performance optimization for large datasets

---

## 🔧 TROUBLESHOOTING

### Backend won't start
```powershell
# Check if port 8000 is in use
netstat -ano | findstr :8000

# Test PostgreSQL connection
psql -U postgres -d ibha -c "SELECT 1"
```

### Frontend won't start
```powershell
# Clear cache
cd web
rm -r .next
npm run dev
```

### Login returns 400 error
- Check backend is running: `curl http://localhost:8000/health`
- Check database has users: `psql -U postgres -d ibha -c "SELECT * FROM users;"`
- Check browser console (F12) for error details

### No data in chat responses
- Verify database has FIRs: `psql -U postgres -d ibha -c "SELECT COUNT(*) FROM \"CaseMaster\";"`
- Check backend terminal for SQL query errors

---

## 📁 KEY FILES REFERENCE

### Backend:
- `local_server.py` - Flask server entry point
- `catalyst/functions/chat.py` - Chat endpoint
- `catalyst/functions/lib/nlp_simple.py` - Keyword NLP
- `catalyst/functions/lib/query_builder.py` - SQL builder with RLS
- `catalyst/functions/lib/auth_utils.py` - JWT authentication
- `catalyst/datastore/seed_data.sql` - Sample data (35 FIRs)

### Frontend:
- `web/app/globals.css` - Global styles, design system
- `web/tailwind.config.ts` - Tailwind theme configuration
- `web/app/components/Navbar.tsx` - Navigation bar
- `web/app/login/page.tsx` - Login screen
- `web/app/chat/page.tsx` - Chat interface
- `web/app/screens/trends/page.tsx` - Trends page
- `web/app/screens/network/page.tsx` - Network page
- `web/app/screens/admin/page.tsx` - Admin page
- `web/app/lib/api.ts` - API integration functions

### Documentation:
- `HOW_TO_RUN.md` - Detailed setup guide
- `BRUTAL_HONEST_STATUS.md` - Technical assessment
- `FINAL_SUMMARY.md` - MVP summary
- `docs/architecture.md` - System architecture
- `data/erd/ksp_erd_official.md` - Database schema diagram

---

## ✅ YOU'RE ALL SET!

**Both servers running?**
- ✅ Backend: http://localhost:8000
- ✅ Frontend: http://localhost:3000

**Ready to test:**
1. Open http://localhost:3000
2. Login: rajesh.kumar@ksp.gov.in / password123
3. Try query: "Show theft cases in my station"
4. Explore: Trends, Network, Admin pages

**System is working and demo-ready! 🚀**

---

**Last Updated:** July 7, 2026  
**Commit:** 1d0b014  
**Status:** ✅ Pushed to GitHub
