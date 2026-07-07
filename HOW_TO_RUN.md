# 🚀 HOW TO RUN IBHA KSP LOCALLY

**Complete step-by-step guide to run the Ibha Crime Intelligence System**

---

## ✅ PREREQUISITES

- **PostgreSQL 18** installed and running
- **Python 3.11+** installed
- **Node.js 18+** and npm installed
- **Git** (to clone the repo)

---

## TASK 1: DATABASE SETUP

### Step 1: Create Database and User

Open PowerShell as Administrator and run:

```powershell
# Connect to PostgreSQL
psql -U postgres

# In psql prompt, run:
CREATE DATABASE ibha;
CREATE USER ibha_user WITH PASSWORD 'yeet';
GRANT ALL PRIVILEGES ON DATABASE ibha TO ibha_user;
\q
```

**Note:** Password is set to `yeet` for local development.

### Step 2: Load Schema and Seed Data

```powershell
# Navigate to project directory
cd c:\Projects\Ibha\ibha-ksp

# Run initialization script
psql -U postgres -d ibha -f catalyst/datastore/init_db.sql

# Load seed data (35 FIRs, 6 users)
psql -U postgres -d ibha -f catalyst/datastore/seed_data.sql
```

### Step 3: Verify Database

```powershell
psql -U postgres -d ibha
```

In psql prompt, run these verification queries:

```sql
-- Should return 35
SELECT COUNT(*) FROM "CaseMaster";

-- Should return 6 users
SELECT email, role, full_name FROM users;

-- Check stations
SELECT * FROM "Unit" WHERE "UnitID" IN (1, 2);

\q
```

**Expected Results:**
- 35 cases in CaseMaster
- 6 users (Constable, SI, Inspector, DSP, SCRB_Analyst, Admin)
- 2 stations (Koramangala, Whitefield)

---

## TASK 2: BACKEND SETUP

### Step 1: Install Python Dependencies

```powershell
cd c:\Projects\Ibha\ibha-ksp

# Install required packages
pip install flask flask-cors psycopg2-binary
```

### Step 2: Configure Database Connection

The `local_server.py` is already configured with:
- Host: localhost
- Port: 5432
- Database: ibha
- User: postgres
- Password: yeet

**No .env file needed** - configuration is in `local_server.py`

### Step 3: Start Backend Server

```powershell
# From project root
cd c:\Projects\Ibha\ibha-ksp

# Start Flask server
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

### Step 4: Verify Backend Endpoints

Open a new PowerShell window and test:

```powershell
# Test health endpoint
curl http://localhost:8000/health

# Should return: {"status": "ok"}
```

**Available Endpoints:**
- `POST /api/v1/auth/login` - User authentication
- `POST /api/v1/chat` - Chat queries
- `GET /api/v1/trends/hotspots?days=30` - Crime hotspots
- `GET /api/v1/trends/summary?months=12` - Monthly trends
- `GET /api/v1/network/accused/{person_id}` - Criminal network
- `GET /api/v1/admin/audit-logs` - Audit logs (Admin only)
- `GET /api/v1/admin/stats` - System statistics

---

## TASK 3: FRONTEND SETUP

### Step 1: Install Dependencies

```powershell
# Navigate to web directory
cd c:\Projects\Ibha\ibha-ksp\web

# Install npm packages (first time only)
npm install
```

### Step 2: Configure API URL

File `web/.env.local` should contain:

```env
NEXT_PUBLIC_CATALYST_API_BASE_URL=http://localhost:8000/api/v1
```

**Already configured** - no changes needed.

### Step 3: Start Frontend Server

```powershell
# From web directory
cd c:\Projects\Ibha\ibha-ksp\web

# Start Next.js dev server
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

## TASK 4: OPEN THE APP

### Step 1: Open Browser

Navigate to: **http://localhost:3000**

### Step 2: You Should See

- **Professional login screen** with:
  - Ibha shield logo (blue gradient)
  - Dark theme command center aesthetic
  - Email and password fields
  - Demo credentials displayed

### Step 3: Login with Demo User

**Constable (Station-level access):**
```
Email: rajesh.kumar@ksp.gov.in
Password: password123
```

**Other Demo Users:**
- **Inspector:** arun.desai@ksp.gov.in / password123
- **DSP (District):** lakshmi.rao@ksp.gov.in / password123
- **Admin:** admin.system@ksp.gov.in / password123

### Step 4: After Login

You should be redirected to `/chat` with:
- **Navbar** at top showing:
  - Ibha logo and branding
  - Navigation: Chat, Trends, Network, Admin
  - User info: Name, Role, Station
  - Logout button
- **Chat interface** ready for queries

---

## TASK 5: QUICK TEST SCRIPT

Follow these steps to verify everything works:

### Test 1: Login ✅
1. Open http://localhost:3000
2. Login as: `rajesh.kumar@ksp.gov.in` / `password123`
3. ✅ Should redirect to /chat
4. ✅ Navbar should show "Rajesh Kumar (Constable) • Station 1"

### Test 2: Chat Query ✅
1. In chat input, type:
   ```
   Show theft cases in my station in last 30 days
   ```
2. Press Enter or click Send
3. ✅ **Expected:**
   - System responds within 2-3 seconds
   - Answer text: "Found X theft cases in last 30 days"
   - Data table showing FIR cases with:
     - CrimeNo
     - Date
     - Station
     - Crime Type
     - Status
   - **THIS IS REAL DATA** from PostgreSQL database

### Test 3: Trends Page ⚠️
1. Click "Trends" in navbar
2. ✅ **Expected:**
   - Hotspots list showing stations by crime count
   - Risk levels (HIGH/MEDIUM/LOW) with color badges
   - Period selector (7/15/30/60/90 days)
3. ⚠️ **Note:** Charts are basic lists (visualization pending)

### Test 4: Network Page ⚠️
1. Click "Network" in navbar
2. Enter Person ID: `1` (Ravi Kumar)
3. Click "Load Network"
4. ✅ **Expected:**
   - Canvas graph showing:
     - Accused person nodes
     - Case nodes
     - Connections between them
5. ⚠️ **Note:** Basic canvas rendering (Cytoscape upgrade pending)

### Test 5: Admin Page (If Admin Role) ⚠️
1. Logout and login as: `admin.system@ksp.gov.in` / `password123`
2. Click "Admin" in navbar
3. ✅ **Expected:**
   - Audit logs table structure
4. ⚠️ **Note:** Table will be empty (audit logging not persisting yet)

### Test 6: Role-Based Access Control ✅
1. Login as Constable: `rajesh.kumar@ksp.gov.in`
   - Query: "Show theft cases"
   - ✅ Should see ONLY Koramangala station cases (RLS enforced)

2. Logout and login as DSP: `lakshmi.rao@ksp.gov.in`
   - Same query: "Show theft cases"
   - ✅ Should see cases from MULTIPLE stations (district-wide)

**This proves RLS is working!**

---

## 🐛 TROUBLESHOOTING

### Backend Won't Start
```powershell
# Check if port 8000 is in use
netstat -ano | findstr :8000

# If PostgreSQL connection fails, check password
psql -U postgres -d ibha -c "SELECT 1"
```

### Frontend Won't Start
```powershell
# Clear Next.js cache
cd web
rm -r .next
npm run dev
```

### Database Connection Error
```powershell
# Reset PostgreSQL password to 'yeet'
.\RESET_POSTGRES_PASSWORD.ps1
```

### Login Returns 400 Error
- Backend may not be running
- Check backend terminal for errors
- Run test: `curl http://localhost:8000/health`

---

## 📊 SYSTEM STATUS

### What's Working (Production Quality):
✅ **Login**: Professional UI, real JWT tokens  
✅ **Chat**: End-to-end with real database queries  
✅ **RLS**: Station/district filtering enforced  
✅ **API Integration**: All endpoints functional  
✅ **Dark Theme**: Command center aesthetic  

### What's Still Basic:
⚠️ **Charts**: Data works, visualization is lists  
⚠️ **Network Graph**: Basic canvas, not Cytoscape  
⚠️ **Audit Logs**: Table empty (not persisting)  
⚠️ **Password Hashing**: Simplified for demo  

---

## 🎯 DEMO-READY CHECKLIST

Before showing to judges:

- [x] Database loaded with 35 FIRs
- [x] All 6 demo users working
- [x] Login screen looks professional
- [x] Chat returns real data
- [x] Trends shows risk levels
- [x] Network shows connections
- [x] Navbar and navigation working
- [x] Dark theme consistent
- [ ] Charts visualization (pending)
- [ ] Cytoscape graph (pending)

**Status:** Ready for technical demo, needs visual polish for final presentation

---

## 📞 SUPPORT

If something doesn't work:

1. Check both terminal windows (backend + frontend) for errors
2. Verify database has data: `psql -U postgres -d ibha -c "SELECT COUNT(*) FROM \"CaseMaster\";"`
3. Check browser console (F12) for frontend errors
4. See `BRUTAL_HONEST_STATUS.md` for known limitations

---

**You're all set! 🚀**
