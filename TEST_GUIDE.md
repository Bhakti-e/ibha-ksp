# 🧪 Ibha KSP - Testing Guide

## ✅ Current Status

**BOTH SERVERS RUNNING:**
- ✅ Backend: http://localhost:8000 (Flask API)
- ✅ Frontend: http://localhost:3000 (Next.js)
- ✅ Database: PostgreSQL with 35 FIRs, 6 users loaded
- ✅ Login endpoint tested and working!

---

## 🎯 How to Test the Application

### Step 1: Open the Application

1. Open your browser
2. Navigate to: **http://localhost:3000**
3. You should see the **Ibha login page**

### Step 2: Login with Demo User

Use these credentials:

**Email:** `rajesh.kumar@ksp.gov.in`  
**Password:** `password123`

Click "Sign In" button.

**Expected:** You should be redirected to `/chat` page with:
- Navigation bar at the top (Chat, Trends, Network, Admin)
- User name "Rajesh Kumar" displayed
- Role: "Constable" 
- Chat interface in the center

### Step 3: Test Chat Functionality

Once logged in, try these queries in the chat:

#### Query 1: Basic Case Search
```
Show theft cases in my station in last 30 days
```

**Expected Response:**
- List of FIR cases from Koramangala station (station_id: 1)
- Each case shows: Crime Number, Brief Facts, Registration Date
- "Explanation" section showing detected intent and filters
- RLS enforcement (only shows cases from Rajesh's station)

#### Query 2: Specific Crime Type
```
Show assault cases
```

**Expected:**
- List of assault cases (IPC 323, 324, 326)
- Only from Constable's authorized station

#### Query 3: Time-based Query
```
Cases registered this month
```

**Expected:**
- Cases from current month only
- Station-filtered (RLS enforced)

#### Query 4: Kannada Query (Multilingual Test)
```
ಕಳವು ಪ್ರಕರಣಗಳು
```
(Translation: "Theft cases")

**Expected:**
- Same data as English theft query
- Response might mix English/Kannada

### Step 4: Test Role-Based Access Control (RBAC)

Logout and login with different roles:

#### A) Sub-Inspector (More Access)
**Email:** `priya.sharma@ksp.gov.in`  
**Password:** `password123`

Query: `Show all theft cases`
- Should see cases from same station (Koramangala)
- SI has more query capabilities than Constable

#### B) DSP (District-Level Access)
**Email:** `lakshmi.rao@ksp.gov.in`  
**Password:** `password123`

Query: `Show theft cases in district`
- Should see cases from MULTIPLE stations in the district
- DSP has district-wide RLS scope

#### C) Admin (Full Access)
**Email:** `admin.system@ksp.gov.in`  
**Password:** `password123`

- Admin should see **all cases** regardless of station
- Can access Admin page to view audit logs

### Step 5: Test Trends Page

1. Click **"Trends"** in the navigation bar
2. **Expected:**
   - **Hotspots Chart:** Bar chart showing crime counts by station
   - **Monthly Trends:** Line chart showing cases over time
   - **Summary Text:** Risk levels and insights
   - Data should respect RLS (Constable sees only their station, DSP sees district)

### Step 6: Test Network Page

1. Click **"Network"** in the navigation bar
2. Enter a Person ID (try: `PERSON_001` or `PERSON_002`)
3. Click "Load Network"
4. **Expected:**
   - **Graph Visualization** (Cytoscape)
   - Central node: The accused person
   - Connected nodes: Cases they're involved in
   - Co-accused connections
   - Interactive graph (drag, zoom, click)

### Step 7: Test Admin Page (Admin Role Only)

1. Login as Admin: `admin.system@ksp.gov.in`
2. Click **"Admin"** in navigation
3. **Expected:**
   - **Audit Logs Table** showing all user queries
   - Columns: User, Role, Query, Intent, Filters, Result Count, Timestamp
   - Pagination controls
   - Search/filter options

---

## 🔍 What to Check in Browser Console

Open Developer Tools (F12) and check:

### Console Tab
- No JavaScript errors
- API calls should show 200 status
- Token being sent in Authorization header

### Network Tab
When you submit a chat query:
1. POST to `/api/v1/chat` - should return 200
2. Response body should have:
   ```json
   {
     "answer": "...",
     "data": [...],
     "explanation": {...}
   }
   ```

---

## 🐛 Common Issues and Solutions

### Issue 1: Login Returns 400 Error
**Solution:** Already fixed! The request body parsing issue has been resolved.

### Issue 2: "Network Error" on Login
**Check:**
- Backend server is running on port 8000
- Frontend .env.local has correct API URL
- No CORS errors in console

**Fix:**
```bash
# Restart backend
cd c:\Projects\Ibha\ibha-ksp
python local_server.py
```

### Issue 3: Chat Returns Empty Results
**Possible Causes:**
- RLS is filtering too aggressively (expected for Constable role)
- No matching cases in database
- NLP didn't extract correct intent

**Debug:**
- Check "Explanation" section in response
- Try different user roles (DSP sees more data)
- Look at backend logs for SQL queries

### Issue 4: Frontend Shows "Loading..." Forever
**Check:**
- Backend API is responding (test with curl or Postman)
- Check browser console for CORS errors
- Verify token is stored in localStorage

**Test Backend Directly:**
```bash
cd c:\Projects\Ibha\ibha-ksp
python test_login.py
```

### Issue 5: Database Connection Error
**Check:**
- PostgreSQL service is running
- Database 'ibha' exists
- Password is 'yeet' (configured in local_server.py)

**Verify:**
```powershell
psql -U postgres -d ibha -c "SELECT COUNT(*) FROM \"CaseMaster\";"
```

---

## 📊 Expected Data in Database

```sql
-- Users: 6 demo users
SELECT COUNT(*) FROM users;  -- Should return 6

-- Cases: 35 FIRs
SELECT COUNT(*) FROM "CaseMaster";  -- Should return 35

-- Stations: 2 stations
SELECT * FROM "PoliceStations" WHERE "StationID" IN (1, 2);
-- Koramangala (ID: 1), Whitefield (ID: 2)

-- Accused: 15 people
SELECT COUNT(*) FROM "Persons" WHERE "PersonID" LIKE 'PERSON_%';
```

---

## 🎬 Quick End-to-End Test Script

Copy and paste this sequence:

1. **Open:** http://localhost:3000
2. **Login:** rajesh.kumar@ksp.gov.in / password123
3. **Chat Query:** `Show theft cases in my station`
4. **Verify:** See list of FIR cases
5. **Click:** "Trends" tab
6. **Verify:** See charts and graphs
7. **Click:** "Network" tab
8. **Enter:** PERSON_001
9. **Verify:** See network graph
10. **Logout:** Click user menu → Logout
11. **Login as DSP:** lakshmi.rao@ksp.gov.in / password123
12. **Chat Query:** `Show all cases in district`
13. **Verify:** See MORE cases than Constable (district-wide)
14. **Success!** ✅

---

## 🚀 Performance Expectations

- **Login:** < 500ms
- **Chat Query:** 1-3 seconds (includes SQL query + NLP processing)
- **Trends:** 2-4 seconds (aggregation queries)
- **Network Graph:** 1-2 seconds (graph traversal)
- **Page Navigation:** Instant (client-side routing)

---

## 📝 What We're Testing

### ✅ Functional Requirements
- [x] User authentication (JWT tokens)
- [x] Role-Based Access Control (RBAC)
- [x] Row-Level Security (RLS)
- [x] Natural language query processing (NO external LLM)
- [x] SQL-based case retrieval
- [x] Multilingual support (English + Kannada keywords)
- [x] Trends and hotspot analysis
- [x] Criminal network visualization
- [x] Audit logging

### ✅ Non-Functional Requirements
- [x] Dark theme UI (professional, not "demo")
- [x] Responsive design
- [x] Error handling (loading states, error messages)
- [x] CORS enabled for local development
- [x] Secure password handling (constant-time comparison)
- [x] Token-based sessions

---

## 📞 Need Help?

If something doesn't work:

1. **Check Backend Logs:**
   - Look at the terminal running `python local_server.py`
   - Look for errors or SQL queries

2. **Check Frontend Logs:**
   - Open browser DevTools (F12) → Console tab
   - Look for red errors

3. **Check Database:**
   ```powershell
   psql -U postgres -d ibha
   \dt  # List tables
   SELECT COUNT(*) FROM "CaseMaster";  # Verify data
   ```

4. **Restart Everything:**
   ```powershell
   # Stop servers (Ctrl+C in their terminals)
   # Then restart:
   cd c:\Projects\Ibha\ibha-ksp
   python local_server.py  # Terminal 1
   cd web
   npm run dev  # Terminal 2
   ```

---

## ✨ You're All Set!

The application is fully functional and ready for testing. Go ahead and explore all the features!

**Happy Testing! 🎉**
