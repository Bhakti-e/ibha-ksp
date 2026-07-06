# Ibha MVP - Implementation Guide

**For**: Development team continuing the MVP implementation  
**Status**: Phase 1 complete (Database + Auth), Phase 2-7 pending

---

## Quick Start

### What's Already Done ✅
1. Database schema (init_db.sql) - official KSP tables
2. Sample data (seed_data.sql) - 35+ realistic FIRs
3. Auth endpoint (auth.py) - real login with JWT tokens
4. Setup guide (SETUP_DB.md) - how to create database

### What You Need to Do ⚠️

The files listed below need to be created/updated. I've provided the exact implementation for most of them in this guide.

---

## Phase 2: Complete Authentication Integration

### File: `/catalyst/functions/lib/auth_utils.py`

**What to change**: Replace the fake `get_user_claims()` function with real token verification.

**Add these functions at the top** (after imports):

```python
import hmac
import hashlib
import base64
from datetime import datetime

SECRET_KEY = "ibha_ksp_secret_key_change_in_production"

def verify_token(token):
    """Verify JWT-like token and extract claims"""
    try:
        parts = token.split(".")
        if len(parts) != 2:
            raise ValueError("Invalid token format")
        
        payload_b64, signature = parts
        
        # Verify signature
        expected_sig = hmac.new(
            SECRET_KEY.encode(),
            payload_b64.encode(),
            hashlib.sha256
        ).hexdigest()
        
        if not hmac.compare_digest(signature, expected_sig):
            raise ValueError("Invalid signature")
        
        # Decode payload
        payload_json = base64.b64decode(payload_b64).decode()
        claims = json.loads(payload_json)
        
        # Check expiry
        if claims.get("exp", 0) < datetime.utcnow().timestamp():
            raise ValueError("Token expired")
        
        return claims
    except Exception as e:
        raise ValueError(f"Token verification failed: {str(e)}")

def require_auth(request):
    """Extract and validate token from request"""
    auth_header = ""
    if hasattr(request, 'headers'):
        auth_header = request.headers.get("Authorization", "")
    elif isinstance(request, dict):
        auth_header = request.get("headers", {}).get("Authorization", "")
    
    if not auth_header:
        raise ValueError("Authorization required")
    
    token = auth_header.replace("Bearer ", "").strip()
    return verify_token(token)
```

**Replace the old `get_user_claims()` function** with:

```python
def get_user_claims(token):
    """Backward compatible wrapper"""
    try:
        return verify_token(token)
    except:
        return None
```

---

## Phase 3: Implement Chat with SQL

### File: `/catalyst/functions/lib/nlp_simple.py` (NEW)

Create this file for simple keyword-based intent detection:

```python
"""
Simple NLP for Query Understanding
----------------------------------
Keyword-based intent and entity extraction (no external AI)
"""

import re
from datetime import datetime, timedelta

CRIME_KEYWORDS = {
    "theft": [1],  # Maps to CrimeMinorHeadID
    "burglary": [2],
    "robbery": [3],
    "vehicle theft": [4],
    "murder": [5],
    "assault": [6],
    "cyber": [10, 11],
    "drug": [12, 13]
}

def detect_intent(query):
    """Detect user intent from query"""
    q = query.lower()
    
    if any(word in q for word in ["show", "list", "display", "find"]):
        return "search_cases"
    elif any(word in q for word in ["how many", "count", "number of"]):
        return "count_cases"
    elif any(word in q for word in ["trend", "pattern", "increase"]):
        return "analyze_trends"
    else:
        return "search_cases"  # Default

def extract_crime_type(query):
    """Extract crime type from query"""
    q = query.lower()
    
    for crime, ids in CRIME_KEYWORDS.items():
        if crime in q:
            return ids
    
    return None  # All crime types

def extract_date_range(query):
    """Extract date range from query"""
    q = query.lower()
    
    # Last N days
    match = re.search(r'last (\d+) days?', q)
    if match:
        days = int(match.group(1))
        start_date = datetime.now() - timedelta(days=days)
        return start_date.strftime('%Y-%m-%d'), None
    
    # Last N months
    match = re.search(r'last (\d+) months?', q)
    if match:
        months = int(match.group(1))
        start_date = datetime.now() - timedelta(days=months*30)
        return start_date.strftime('%Y-%m-%d'), None
    
    # This month
    if "this month" in q:
        start_date = datetime.now().replace(day=1)
        return start_date.strftime('%Y-%m-%d'), None
    
    # Default: last 30 days
    start_date = datetime.now() - timedelta(days=30)
    return start_date.strftime('%Y-%m-%d'), None
```

### File: `/catalyst/functions/lib/db.py` (NEW)

Database connection helper:

```python
"""
Database Connection Helper
--------------------------
Simple wrapper for database queries
"""

# TODO: For local PostgreSQL, use psycopg2
# TODO: For Catalyst, use Catalyst SDK

# Mock implementation for now
def execute_query(sql, params=None):
    """
    Execute SQL query and return results
    
    Args:
        sql: SQL query string with %s placeholders
        params: tuple of parameters
    
    Returns:
        list of dict: Query results
    """
    # TODO: Real implementation
    # import psycopg2
    # conn = psycopg2.connect(...)
    # cursor = conn.cursor()
    # cursor.execute(sql, params)
    # results = cursor.fetchall()
    # return results
    
    # For now, return empty list
    return []
```

### File: `/catalyst/functions/lib/query_builder.py` (NEW)

SQL query constructor:

```python
"""
SQL Query Builder
-----------------
Build safe parameterized SQL queries from intents and entities
"""

def build_search_query(user_claims, crime_type_ids, date_from, date_to=None):
    """Build search query with RLS applied"""
    
    # Base query
    sql = """
        SELECT 
            cm.CaseMasterID,
            cm.CrimeNo,
            cm.CrimeRegisteredDate,
            cm.BriefFacts,
            cm.ModusOperandi,
            csh.CrimeHeadName,
            u.UnitName
        FROM CaseMaster cm
        LEFT JOIN CrimeSubHead csh ON cm.CrimeMinorHeadID = csh.CrimeSubHeadID
        LEFT JOIN Unit u ON cm.PoliceStationID = u.UnitID
        WHERE 1=1
    """
    
    params = []
    
    # Apply RLS
    role = user_claims.get("role")
    if role in ["Constable", "SI", "Inspector"]:
        sql += " AND cm.PoliceStationID = %s"
        params.append(user_claims.get("station_id"))
    elif role == "DSP":
        # Get district from unit table join
        sql += " AND u.DistrictID = %s"
        params.append(user_claims.get("district_id"))
    
    # Apply filters
    if crime_type_ids:
        placeholders = ",".join(["%s"] * len(crime_type_ids))
        sql += f" AND cm.CrimeMinorHeadID IN ({placeholders})"
        params.extend(crime_type_ids)
    
    if date_from:
        sql += " AND cm.CrimeRegisteredDate >= %s"
        params.append(date_from)
    
    if date_to:
        sql += " AND cm.CrimeRegisteredDate <= %s"
        params.append(date_to)
    
    sql += " ORDER BY cm.CrimeRegisteredDate DESC LIMIT 50"
    
    return sql, tuple(params)
```

---

## Phase 4-7: Quick Implementation Checklist

Due to length constraints, here are the key files you need to create:

### Backend Files to Create

1. ✅ `auth.py` - DONE
2. ⚠️ `lib/auth_utils.py` - UPDATE (add verify_token)
3. ❌ `lib/nlp_simple.py` - CREATE (see above)
4. ❌ `lib/query_builder.py` - CREATE (see above)
5. ❌ `lib/db.py` - CREATE (see above)
6. ❌ `chat.py` - UPDATE (replace TODOs)
7. ❌ `trends.py` - CREATE
8. ❌ `network.py` - CREATE
9. ❌ `audit.py` - UPDATE (add DB insert)

### Frontend Files to Create

1. ⚠️ `lib/api.ts` - UPDATE (fix login call)
2. ⚠️ `screens/auth/login.tsx` - UPDATE (remove mock note)
3. ❌ `screens/chat/page.tsx` - CREATE
4. ❌ `screens/trends/page.tsx` - CREATE
5. ❌ `screens/network/page.tsx` - CREATE
6. ❌ `components/layout/Navbar.tsx` - CREATE

---

## Testing the MVP

### Step 1: Setup Database
```bash
createdb ibha
psql -d ibha -f catalyst/datastore/init_db.sql
psql -d ibha -f catalyst/datastore/seed_data.sql
```

### Step 2: Deploy Backend
```bash
# Deploy to Catalyst or run locally
catalyst function:deploy auth
catalyst function:deploy chat
# etc.
```

### Step 3: Update Frontend
```bash
cd web
cp .env.example .env.local
# Edit .env.local with your backend URL
npm install
npm run dev
```

### Step 4: Test End-to-End
1. Open http://localhost:3000
2. Login: `rajesh.kumar@ksp.gov.in` / `password123`
3. Query: "show theft cases in last 30 days"
4. Verify: Should see ~15 theft cases from Koramangala station

---

## Current GitHub Status

**Last Commit**: MVP Phase 1: Real database setup and authentication  
**Branch**: main  
**Files Added**: init_db.sql, seed_data.sql, SETUP_DB.md, auth.py  

**Next Commit Should Include**:
- Updated auth_utils.py with real token verification
- New: nlp_simple.py, query_builder.py, db.py
- Updated: chat.py with real SQL implementation
- Updated: api.ts, login.tsx
- New: chat/page.tsx with basic UI

---

## Priority for Next Session

1. **Update auth_utils.py** (15 min) - Critical for all endpoints
2. **Create nlp_simple.py** (30 min) - Needed for chat
3. **Create query_builder.py** (30 min) - Needed for chat
4. **Update chat.py** (30 min) - Main feature
5. **Update api.ts** (10 min) - Fix login
6. **Create chat/page.tsx** (1 hour) - User-facing

Total: ~3 hours for basic working chat

---

## Questions?

See:
- `/MVP_STATUS.md` - Current implementation status
- `/SETUP_DB.md` - Database setup guide
- `/DEPLOYMENT_CHECKLIST.md` - Full deployment guide
- `/STATUS.md` - Original project status

**Repository**: https://github.com/Bhakti-e/ibha-ksp
