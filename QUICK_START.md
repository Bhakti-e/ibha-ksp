# Quick Start Guide - Run Ibha MVP in 10 Minutes

This guide gets Ibha running locally for testing/demo purposes.

---

## Prerequisites

- ✅ Windows 10/11
- ✅ Python 3.11 installed
- ✅ Node.js 18+ installed  
- ✅ PostgreSQL 13+ installed (or use Docker)
- ✅ Git

---

## Step 1: Clone & Install (2 minutes)

```bash
# Clone repository
git clone https://github.com/Bhakti-e/ibha-ksp.git
cd ibha-ksp

# Install Python dependencies
pip install psycopg2-binary PyJWT

# Install frontend dependencies
cd web
npm install
cd ..
```

---

## Step 2: Database Setup (3 minutes)

### Option A: PostgreSQL (Recommended for Local)

```bash
# Create database
createdb ibha

# Set environment variables
set DB_HOST=localhost
set DB_PORT=5432
set DB_NAME=ibha
set DB_USER=postgres
set DB_PASSWORD=postgres

# Run schema
psql -d ibha -f catalyst\datastore\init_db.sql
psql -d ibha -f catalyst\datastore\schema_official_ksp.sql

# Load seed data (35 FIRs, 6 test users)
psql -d ibha -f catalyst\datastore\seed_data.sql

# Verify data loaded
psql -d ibha -c "SELECT COUNT(*) FROM CaseMaster;"
# Should return: 35
```

### Option B: Docker PostgreSQL

```bash
# Run PostgreSQL in Docker
docker run --name ibha-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=ibha -p 5432:5432 -d postgres:13

# Wait 5 seconds for container to start
timeout /t 5

# Load schema and data
docker exec -i ibha-postgres psql -U postgres -d ibha < catalyst\datastore\init_db.sql
docker exec -i ibha-postgres psql -U postgres -d ibha < catalyst\datastore\schema_official_ksp.sql
docker exec -i ibha-postgres psql -U postgres -d ibha < catalyst\datastore\seed_data.sql
```

---

## Step 3: Test Backend Locally (2 minutes)

Create a simple test script to verify backend functions work:

```bash
# Test auth endpoint
python -c "import sys; sys.path.insert(0, 'catalyst/functions'); from auth import handler; print(handler({'body': '{\"email\":\"rajesh.kumar@ksp.gov.in\",\"password\":\"password123\"}'}))"
```

**Expected output:**
```json
{
  "statusCode": 200,
  "body": "{\"token\": \"eyJ...\", \"user\": {...}}"
}
```

If you see a token, authentication works! ✅

---

## Step 4: Start Frontend (1 minute)

```bash
cd web

# Create environment file
echo NEXT_PUBLIC_CATALYST_API_BASE_URL=http://localhost:8080 > .env.local

# Start dev server
npm run dev
```

Frontend will start at **http://localhost:3000**

---

## Step 5: Login & Test (2 minutes)

### Test Login

1. Open http://localhost:3000 in browser
2. You'll be redirected to login page
3. Login with:
   - **Email:** `rajesh.kumar@ksp.gov.in`
   - **Password:** `password123`

**⚠️ Important:** Since backend functions are not running as API server yet, you'll need to either:
- **Option A:** Deploy to Catalyst (real serverless)
- **Option B:** Create a local Flask/FastAPI wrapper (quick hack for testing)

Let me show you **Option B** for quick local testing:

---

## Step 5.5: Quick Local API Server (Optional)

Create `local_server.py` in project root:

```python
"""
Quick local API server for testing Ibha functions
DO NOT USE IN PRODUCTION - for development only
"""
from flask import Flask, request, jsonify
from flask_cors import CORS
import sys
import os

# Add functions to path
sys.path.insert(0, 'catalyst/functions')

# Set DB environment variables
os.environ['DB_HOST'] = 'localhost'
os.environ['DB_PORT'] = '5432'
os.environ['DB_NAME'] = 'ibha'
os.environ['DB_USER'] = 'postgres'
os.environ['DB_PASSWORD'] = 'postgres'

# Import handlers
from auth import handler as auth_handler
from chat import handler as chat_handler
from trends import handler as trends_handler
from network import handler as network_handler
from admin import handler_audit_logs, handler_stats

app = Flask(__name__)
CORS(app)

@app.route('/api/v1/auth/login', methods=['POST'])
def login():
    result = auth_handler(request)
    return jsonify(result['body']), result['statusCode']

@app.route('/api/v1/chat', methods=['POST'])
def chat():
    # Add auth header to request object
    auth_header = request.headers.get('Authorization', '')
    request_obj = {
        'body': request.get_json(),
        'headers': {'Authorization': auth_header}
    }
    result = chat_handler(request_obj)
    return jsonify(result['body']), result['statusCode']

@app.route('/api/v1/trends/hotspots', methods=['GET'])
def hotspots():
    request_obj = {
        'headers': {'Authorization': request.headers.get('Authorization', '')},
        'queryStringParameters': request.args.to_dict()
    }
    result = trends_handler(request_obj)
    return jsonify(result['body']), result['statusCode']

@app.route('/api/v1/admin/audit-logs', methods=['GET'])
def audit_logs():
    request_obj = {
        'headers': {'Authorization': request.headers.get('Authorization', '')},
        'queryStringParameters': request.args.to_dict()
    }
    result = handler_audit_logs(request_obj)
    return jsonify(result['body']), result['statusCode']

if __name__ == '__main__':
    print("🚀 Ibha Local API Server starting...")
    print("   http://localhost:8080")
    print("   Press Ctrl+C to stop")
    app.run(host='0.0.0.0', port=8080, debug=True)
```

**Install Flask:**
```bash
pip install flask flask-cors
```

**Run local server:**
```bash
python local_server.py
```

**Update frontend .env.local:**
```bash
cd web
echo NEXT_PUBLIC_CATALYST_API_BASE_URL=http://localhost:8080/api/v1 > .env.local
```

**Restart frontend:**
```bash
npm run dev
```

---

## Step 6: Full Test Flow (3 minutes)

Now test the complete flow:

### 1. Login
- Open http://localhost:3000
- Login: `rajesh.kumar@ksp.gov.in` / `password123`
- You should see the chat page

### 2. Test Chat
- Type: **"Show theft cases in last 30 days"**
- Expected result:
  - Natural language answer: "Found 8 theft cases in the last 30 days."
  - Table with ~8 FIRs from Koramangala station
  - Explanation contract showing RLS applied

### 3. Test Different Role
- Logout (top right)
- Login as DSP: `lakshmi.rao@ksp.gov.in` / `password123`
- Type same query: **"Show theft cases in last 30 days"**
- Expected: More results (~18 cases) because DSP sees district-wide

### 4. Test Multilingual
- Type in Kannada: **"ಕಳೆದ 7 ದಿನಗಳಲ್ಲಿ ಕಳ್ಳತನ ಪ್ರಕರಣಗಳು ತೋರಿಸಿ"**
- Expected: Kannada response

### 5. Test Trends
- Click **Trends** in navigation
- See top hotspots with risk levels
- Bar chart showing station vs crime count

### 6. Test Network
- Click **Network** in navigation
- Enter Accused ID: **1** (Ravi Kumar)
- Click "Load Network"
- See graph with accused person, cases, and co-accused

### 7. Test Admin (Admin only)
- Logout, login as Admin: `admin.system@ksp.gov.in` / `password123`
- Click **Admin** in navigation
- See audit logs table with all previous queries

---

## Troubleshooting

### Issue: Database connection failed

**Solution:**
```bash
# Check PostgreSQL is running
pg_isready

# Check environment variables
echo %DB_HOST%
echo %DB_NAME%

# Test connection manually
psql -h localhost -U postgres -d ibha -c "SELECT 1;"
```

### Issue: Python import errors

**Solution:**
```bash
# Verify __init__.py exists
dir catalyst\functions\lib\__init__.py

# If missing, create it:
echo # Ibha Library Package > catalyst\functions\lib\__init__.py
```

### Issue: Frontend can't connect to backend

**Solution:**
```bash
# Check backend server is running
curl http://localhost:8080/api/v1/health

# Check .env.local is correct
type web\.env.local

# Expected:
# NEXT_PUBLIC_CATALYST_API_BASE_URL=http://localhost:8080/api/v1
```

### Issue: No data in database

**Solution:**
```bash
# Check if seed data loaded
psql -d ibha -c "SELECT COUNT(*) FROM CaseMaster;"

# If 0, reload:
psql -d ibha -f catalyst\datastore\seed_data.sql
```

---

## What's Working Now?

After this quick start, you should have:

- ✅ **Authentication**: Login with 6 test users
- ✅ **Chat**: Natural language queries → SQL → Answers
- ✅ **RLS**: Different roles see different data
- ✅ **Multilingual**: English + Kannada support
- ✅ **Trends**: Crime hotspots with risk levels
- ✅ **Network**: Criminal network graphs
- ✅ **Audit**: Complete query logging (Admin view)

---

## Next Steps

### For Demo/Presentation
1. Follow [DEMO_WALKTHROUGH.md](DEMO_WALKTHROUGH.md)
2. Practice the 10-minute demo script
3. Prepare to show DevTools (no external AI calls)

### For Development
1. Read [docs/architecture.md](docs/architecture.md)
2. Read [docs/SECURITY_IMPLEMENTATION.md](docs/SECURITY_IMPLEMENTATION.md)
3. Check [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md) for what's complete

### For Production Deployment
1. Deploy to Catalyst: `catalyst deploy`
2. Set up Catalyst Data Store
3. Configure OAuth 2.0
4. Enable HTTPS
5. Use bcrypt for passwords
6. Set up Redis for caching

---

## Test Users Reference

| Email | Password | Role | Access Level |
|-------|----------|------|--------------|
| rajesh.kumar@ksp.gov.in | password123 | Constable | Station 1 only |
| priya.sharma@ksp.gov.in | password123 | SI | Station 1 only |
| arun.desai@ksp.gov.in | password123 | Inspector | Station 2 only |
| lakshmi.rao@ksp.gov.in | password123 | DSP | District 1 (all stations) |
| vikram.mehta@ksp.gov.in | password123 | SCRB_Analyst | State-wide + ingestion |
| admin.system@ksp.gov.in | password123 | Admin | Full access + audit logs |

---

## Sample Test Data

- **Total FIRs:** 35
- **Stations:** Koramangala (20 FIRs), Whitefield (15 FIRs)
- **Crime Types:** Theft, Burglary, Assault, Chain Snatching, Cyber Fraud, Drugs
- **Date Range:** Nov 2025 - Jan 2026
- **Accused:** 15 persons (including repeat offenders)
- **Victims:** 16 persons

---

## Performance Expectations

- Login: < 500ms
- Chat query: < 2 seconds
- Trends page load: < 1 second
- Network graph: < 3 seconds
- Database queries: < 100ms (with indexes)

---

**You're ready to demo Ibha! 🚀**

For the complete demo script, see [DEMO_WALKTHROUGH.md](DEMO_WALKTHROUGH.md)
