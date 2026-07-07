# 🚀 Ibha Local Run Guide

Complete step-by-step guide to run Ibha locally for testing.

---

## ✅ Pre-Flight Checklist

Before starting, ensure you have:
- [ ] PostgreSQL 13+ installed and running
- [ ] Python 3.11 installed
- [ ] Node.js 18+ installed
- [ ] Git (to clone the repo)

---

## 📦 STEP 1: Database Setup (5 minutes)

### Start PostgreSQL

```powershell
# Check if PostgreSQL is running
Get-Service -Name postgresql*

# If not running, start it
Start-Service -Name postgresql-x64-13
```

### Create Database

```powershell
# Connect to PostgreSQL
psql -U postgres

# Inside psql:
CREATE DATABASE ibha;
\c ibha
GRANT ALL ON SCHEMA public TO postgres;
\q
```

### Load Schema and Data

```powershell
cd C:\Projects\Ibha\ibha-ksp

# Load schema files
psql -U postgres -d ibha -f catalyst\datastore\init_db.sql
psql -U postgres -d ibha -f catalyst\datastore\schema_official_ksp.sql
psql -U postgres -d ibha -f catalyst\datastore\seed_data.sql
```

### Verify Data

```powershell
psql -U postgres -d ibha -c "SELECT COUNT(*) FROM \"CaseMaster\";"
# Expected: 35

psql -U postgres -d ibha -c "SELECT email, role FROM users;"
# Expected: 6 users
```

---

## 🔧 STEP 2: Backend Setup (3 minutes)

### Install Python Dependencies

```powershell
pip install flask flask-cors psycopg2-binary PyJWT
```

### Start Backend Server

```powershell
cd C:\Projects\Ibha\ibha-ksp
python local_server.py
```

**✅ Success:** You should see:
```
============================================================
🚀 Ibha Local API Server Starting...
============================================================
   URL: http://localhost:8000
   
✅ Server ready! Press Ctrl+C to stop
```

**Keep this PowerShell window open!**

### Test Backend (Optional)

Open a **new PowerShell window**:

```powershell
Invoke-RestMethod -Uri "http://localhost:8000/api/v1/auth/login" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"email":"rajesh.kumar@ksp.gov.in","password":"password123"}'
```

You should get a JSON response with a token.

---

## 🎨 STEP 3: Frontend Setup (3 minutes)

### Install Frontend Dependencies

Open a **third PowerShell window**:

```powershell
cd C:\Projects\Ibha\ibha-ksp\web
npm install
```

### Start Frontend Server

```powershell
npm run dev
```

**✅ Success:** You should see:
```
  ▲ Next.js 14.2.35
  - Local:        http://localhost:3000
  
 ✓ Ready in 2.3s
```

**Keep this PowerShell window open!**

---

## 🧪 STEP 4: Test the Application

### Open in Browser

Navigate to: **http://localhost:3000**

### Login Test

1. **Email:** `rajesh.kumar@ksp.gov.in`
2. **Password:** `password123`
3. **Click "Sign In"**

**✅ Success:** You should:
- Be redirected to `/chat`
- See navigation bar: Chat, Trends, Network, Admin
- See user info: "Rajesh Kumar (Constable)"

### Chat Test

Type in chat input:
```
Show theft cases in my station in last 30 days
```

**✅ Expected:**
- Loading spinner appears
- Response: "Found X theft cases in the last 30 days."
- Table with FIR details
- Explanation section showing intent, filters, RLS

### Trends Test

1. Click **"Trends"** in navigation
2. You should see:
   - Bar chart of crime hotspots
   - Risk level badges (HIGH/MEDIUM/LOW)
   - Monthly trend line chart

### Network Test

1. Click **"Network"** in navigation
2. Enter Accused ID: **1** (Ravi Kumar)
3. Click **"Load Network"**
4. You should see:
   - Graph with central node (Ravi Kumar)
   - Connected cases (blue nodes)
   - Co-accused (gray nodes)
   - Colored edges showing relationships

### Admin Test

1. **Logout** (top right)
2. **Login as Admin:**
   - Email: `admin.system@ksp.gov.in`
   - Password: `password123`
3. Click **"Admin"** in navigation
4. You should see:
   - Audit logs table (all previous queries)
   - System stats dashboard

---

## 🎯 Test Script Summary

| Test | User | Action | Expected Result |
|------|------|--------|-----------------|
| **Login** | Constable | Login with credentials | Redirect to chat |
| **Chat (RLS)** | Constable | "Show theft cases..." | Only Station 1 FIRs |
| **Multilingual** | Constable | Query in Kannada | Kannada response |
| **Trends** | Constable | View trends page | Charts with risk levels |
| **Network** | Constable | Load network for ID 1 | Graph visualization |
| **Different Role** | DSP | Same chat query | More FIRs (district-wide) |
| **Admin** | Admin | View audit logs | Table of all queries |

---

## 🐛 Troubleshooting

### Backend won't start

**Error:** `ModuleNotFoundError: No module named 'flask'`

**Fix:**
```powershell
pip install flask flask-cors psycopg2-binary PyJWT
```

---

### Database connection failed

**Error:** `psycopg2.OperationalError: could not connect to server`

**Fix:**
```powershell
# Check PostgreSQL is running
Get-Service -Name postgresql*

# Start if stopped
Start-Service -Name postgresql-x64-13

# Check if ibha database exists
psql -U postgres -l | Select-String ibha
```

---

### Frontend can't reach backend

**Error in browser console:** `Network Error` or `CORS policy`

**Fix:**
1. Check backend is running: http://localhost:8000/health
2. Check `.env.local` in web folder:
   ```
   NEXT_PUBLIC_CATALYST_API_BASE_URL=http://localhost:8000/api/v1
   ```
3. Restart frontend: `npm run dev`

---

### Login fails with 401

**Error:** `Invalid email or password`

**Fix:**
1. Check you're using: `rajesh.kumar@ksp.gov.in` / `password123`
2. Verify users exist in database:
   ```powershell
   psql -U postgres -d ibha -c "SELECT email FROM users;"
   ```

---

### No FIRs returned in chat

**Error:** Chat returns "Found 0 cases"

**Fix:**
```powershell
# Check seed data loaded
psql -U postgres -d ibha -c "SELECT COUNT(*) FROM \"CaseMaster\";"
# If 0, reload seed data:
psql -U postgres -d ibha -f catalyst\datastore\seed_data.sql
```

---

## 🎉 Success Criteria

You know everything is working when:

✅ Login redirects to chat page  
✅ Chat query returns FIRs from database  
✅ Explanation contract shows RLS applied  
✅ Trends page shows charts  
✅ Network page shows graph  
✅ Admin page shows audit logs  
✅ Different roles see different data (RLS working)  
✅ No external LLM calls (check DevTools Network tab)

---

## 📊 Test Data Reference

### Users
| Email | Password | Role | Access |
|-------|----------|------|--------|
| rajesh.kumar@ksp.gov.in | password123 | Constable | Station 1 |
| priya.sharma@ksp.gov.in | password123 | SI | Station 1 |
| arun.desai@ksp.gov.in | password123 | Inspector | Station 2 |
| lakshmi.rao@ksp.gov.in | password123 | DSP | District 1 |
| vikram.mehta@ksp.gov.in | password123 | SCRB_Analyst | State-wide |
| admin.system@ksp.gov.in | password123 | Admin | Full access |

### Sample FIRs
- **Total:** 35 FIRs
- **Station 1 (Koramangala):** 20 FIRs
- **Station 2 (Whitefield):** 15 FIRs
- **Crime Types:** Theft, Burglary, Assault, Cyber, Drugs

### Sample Accused
- **ID 1:** Ravi Kumar (5 cases - repeat offender)
- **ID 2:** Deepak Shetty (1 case)
- **Others:** Various accused with 1-2 cases each

---

## 🚀 Next Steps

Once local testing is complete:

1. **Deploy to Catalyst:**
   ```bash
   catalyst deploy
   ```

2. **Load official KSP dataset:**
   - Place official files in `data/official/`
   - Run import scripts

3. **Production hardening:**
   - Switch to bcrypt for passwords
   - Use httpOnly cookies for tokens
   - Add rate limiting
   - Enable HTTPS

---

**Happy Testing! 🎯**

For issues, check:
- Backend logs (PowerShell window 1)
- Frontend logs (PowerShell window 2)
- Browser console (F12)
- Database connection (psql)
