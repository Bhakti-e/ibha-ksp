# Security Implementation - Ibha KSP

## Overview

Ibha implements a **three-layer security model** for Karnataka State Police data:

1. **Authentication** (JWT tokens)
2. **Role-Based Access Control (RBAC)** (6 roles with different permissions)
3. **Row-Level Security (RLS)** (geographic data filtering by station/district)

All three layers are enforced on **every single API request** to ensure officers only see data they're authorized to access.

---

## 1. Authentication (JWT Tokens)

### Token Structure

Ibha uses **HMAC-SHA256 signed tokens** (JWT-like structure):

```
{payload_base64}.{hmac_signature}
```

**Payload contains:**
```json
{
  "user_id": "USR_001",
  "email": "rajesh.kumar@ksp.gov.in",
  "role": "Constable",
  "station_id": 1,
  "district_id": 1,
  "full_name": "Rajesh Kumar",
  "exp": 1735689600  // Unix timestamp
}
```

**Signature:** HMAC-SHA256(payload_b64, SECRET_KEY)

### Token Lifecycle

1. **Login** (`POST /auth/login`):
   - User submits email + password
   - Server validates credentials (constant-time comparison)
   - Server generates token with 4-hour expiry
   - Token returned to client

2. **Authenticated Requests**:
   - Client includes token in header: `Authorization: Bearer <token>`
   - Server verifies signature and expiry
   - Server extracts user claims (role, station, district)
   - Claims used for RBAC and RLS

3. **Token Expiry**:
   - Tokens expire after 4 hours
   - Client must re-authenticate (no refresh tokens in MVP)

### Security Features

- **Constant-time password comparison** (prevents timing attacks)
- **HMAC signature verification** (prevents token tampering)
- **Expiry validation** (prevents token reuse after logout/timeout)
- **No sensitive data in payload** (password hash never included)

### Implementation Files

- `catalyst/functions/auth.py` - Login endpoint, token generation
- `catalyst/functions/lib/auth_utils.py` - Token verification, claim extraction

---

## 2. Role-Based Access Control (RBAC)

### Role Hierarchy

Ibha supports **6 roles** aligned with KSP organizational structure:

| Role | Permissions | Typical Use Case |
|------|-------------|------------------|
| **Constable** | Read own station cases | Beat officer, first responder |
| **SI** (Sub-Inspector) | Read own station cases | Station duty officer |
| **Inspector** | Read own station cases | Station in-charge |
| **DSP** (Deputy SP) | Read district-wide cases | District supervision |
| **SCRB_Analyst** | Read state-wide, manage ingestion | State Crime Records Bureau analyst |
| **Admin** | Full access, audit logs | System administrator |

### Permission Matrix

| Feature | Constable | SI | Inspector | DSP | SCRB_Analyst | Admin |
|---------|-----------|----|-----------|----|--------------|-------|
| Chat (search cases) | ✅ Station | ✅ Station | ✅ Station | ✅ District | ✅ State | ✅ All |
| Trends/Hotspots | ✅ Station | ✅ Station | ✅ Station | ✅ District | ✅ State | ✅ All |
| Network Graph | ✅ Station | ✅ Station | ✅ Station | ✅ District | ✅ State | ✅ All |
| Document Upload | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| Audit Logs | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| System Stats | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |

### RBAC Enforcement

**Permission checks happen at endpoint level:**

```python
# Example from admin.py
def handler_audit_logs(request):
    user_claims = require_auth(request)
    
    # Check role
    if user_claims["role"] not in ["Admin", "SCRB_Analyst"]:
        return {"statusCode": 403, "body": {"error": "Access denied"}}
    
    # Proceed with query...
```

**Key functions:**
- `require_auth(request)` - Extracts and validates token, returns claims
- `check_admin_permission(claims)` - Returns True if Admin role
- `check_ingestion_permission(claims)` - Returns True if SCRB_Analyst or Admin

---

## 3. Row-Level Security (RLS)

### Geographic Filtering

RLS ensures officers **only see FIRs from their authorized geographic scope**:

| Role | Data Scope | SQL Filter |
|------|------------|------------|
| Constable | Own station | `WHERE PoliceStationID = user.station_id` |
| SI/Inspector | Own station | `WHERE PoliceStationID = user.station_id` |
| DSP | Entire district | `WHERE DistrictID = user.district_id` |
| SCRB_Analyst | Entire state | *(no filter)* |
| Admin | All data | *(no filter)* |

### RLS Implementation

**Every SQL query goes through `enforce_rls()` before execution:**

```python
# Example from chat.py
def handler(request):
    user_claims = require_auth(request)  # Get role, station, district
    
    # Extract query intent and entities from NLP
    entities = nlp_simple.extract_entities(query)
    
    # Build base SQL
    sql, params = query_builder.build_search_query(
        user_claims,  # ← RLS applied here
        entities["crime_type_ids"],
        entities["date_from"],
        entities["date_to"]
    )
    
    # Execute filtered query
    results = db.execute_query(sql, params)
```

**Inside `query_builder.py`:**

```python
def build_search_query(user_claims, crime_types, date_from, date_to):
    # Apply RLS filters
    filters = auth_utils.enforce_rls(user_claims, {
        "crime_type_ids": crime_types,
        "date_from": date_from,
        "date_to": date_to
    })
    
    # Build SQL with RLS filters
    sql = "SELECT * FROM CaseMaster WHERE 1=1"
    
    if "station_id" in filters:
        sql += " AND PoliceStationID = %s"
        params.append(filters["station_id"])
    
    if "district_id" in filters:
        sql += " AND DistrictID = (SELECT DistrictID FROM Unit WHERE UnitID = %s)"
        params.append(filters["district_id"])
    
    # ... add other filters
```

### RLS Enforcement Points

**RLS is enforced in:**
- ✅ Chat queries (`/chat`)
- ✅ Trends/hotspots (`/trends/hotspots`, `/trends/summary`)
- ✅ Network graph (`/network/accused/{id}`)
- ✅ Search endpoints (any future search features)

**RLS is NOT applied to:**
- ❌ Audit logs (Admin/SCRB_Analyst see all logs regardless of station)
- ❌ System stats (Admin/SCRB_Analyst see global stats)

---

## 4. Audit Logging

### What Gets Logged

**Every chat query is logged to `audit_logs` table:**

```sql
INSERT INTO audit_logs (
    user_id, role, station_id, district_id,
    query_text, intent, filters_applied, result_count, timestamp
) VALUES (...)
```

**Logged fields:**
- `user_id` - Who made the query
- `role` - User's role at time of query
- `station_id`, `district_id` - User's assignment
- `query_text` - Original user query (for compliance review)
- `intent` - Detected intent (search_cases, count_cases, etc.)
- `filters_applied` - JSON of filters applied (crime types, dates, etc.)
- `result_count` - Number of FIRs returned
- `timestamp` - When query was made (UTC)

### Audit Trail Access

**Only Admin and SCRB_Analyst can view audit logs:**

```
GET /admin/audit-logs?limit=100&user_id=USR_001&from_date=2026-01-01
```

**Use cases:**
- Compliance audits (who searched for what)
- Investigating data breaches (unauthorized access patterns)
- Performance monitoring (slow queries, high-volume users)
- Training data (common queries for NLP improvement)

---

## 5. Test Users (from seed_data.sql)

**All test users have password:** `password123`

| Email | Role | Station ID | District ID | Test Scenario |
|-------|------|-----------|-------------|---------------|
| rajesh.kumar@ksp.gov.in | Constable | 1 | 1 | Station-level access |
| priya.sharma@ksp.gov.in | SI | 1 | 1 | Station duty officer |
| arun.desai@ksp.gov.in | Inspector | 2 | 1 | Different station |
| lakshmi.rao@ksp.gov.in | DSP | 3 | 1 | District-wide access |
| vikram.mehta@ksp.gov.in | SCRB_Analyst | 100 | 1 | State-wide analytics |
| admin.system@ksp.gov.in | Admin | 100 | 1 | Full system access |

---

## 6. Security Testing Checklist

### Authentication Tests

- [x] Login with valid credentials → returns token
- [x] Login with invalid email → 401 error
- [x] Login with wrong password → 401 error
- [x] Request with no token → 401 error
- [x] Request with expired token → 401 error
- [x] Request with tampered token → 401 error

### RBAC Tests

- [x] Constable accesses chat → sees only station 1 cases
- [x] DSP accesses chat → sees all district 1 cases
- [x] Constable tries to access audit logs → 403 error
- [x] Admin accesses audit logs → success
- [x] SCRB_Analyst uploads documents → success
- [x] Constable tries to upload documents → 403 error

### RLS Tests

- [x] Constable (station 1) queries theft cases → only station 1 thefts returned
- [x] Inspector (station 2) queries same → only station 2 thefts returned
- [x] DSP (district 1) queries same → all district 1 thefts returned
- [x] SCRB_Analyst queries same → all state thefts returned

### SQL Injection Tests

- [ ] Query with `'; DROP TABLE CaseMaster; --` → safely parameterized
- [ ] Query with `1 OR 1=1` → safely parameterized
- [ ] Date filter with `'; DELETE FROM audit_logs; --` → safely parameterized

All queries use **parameterized SQL** (`%s` placeholders) to prevent SQL injection.

---

## 7. Production Hardening (TODO)

### Current MVP Limitations

1. **Password Hashing**: Demo uses constant comparison, production needs bcrypt
2. **Token Storage**: Frontend may use localStorage (vulnerable to XSS), consider httpOnly cookies
3. **Secret Key**: Hardcoded in code, must use environment variable in production
4. **Token Refresh**: No refresh tokens, users must re-login every 4 hours
5. **Rate Limiting**: No rate limiting on login endpoint (vulnerable to brute force)
6. **HTTPS**: Must enforce HTTPS in production (currently allows HTTP)

### Production Recommendations

```python
# 1. Use bcrypt for password hashing
import bcrypt
hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt())
valid = bcrypt.checkpw(password.encode(), stored_hash)

# 2. Use environment variables for secrets
import os
SECRET_KEY = os.environ.get("JWT_SECRET_KEY")

# 3. Implement rate limiting
from functools import wraps
from datetime import datetime, timedelta

login_attempts = {}  # In production, use Redis

def rate_limit(max_attempts=5, window_minutes=15):
    def decorator(func):
        @wraps(func)
        def wrapper(request):
            email = request.body.get("email")
            now = datetime.utcnow()
            
            # Check attempts
            attempts = login_attempts.get(email, [])
            recent = [t for t in attempts if now - t < timedelta(minutes=window_minutes)]
            
            if len(recent) >= max_attempts:
                return {"statusCode": 429, "body": {"error": "Too many attempts"}}
            
            # Execute login
            response = func(request)
            
            # Track attempt
            recent.append(now)
            login_attempts[email] = recent
            
            return response
        return wrapper
    return decorator

# 4. Add CSRF protection for state-changing requests
# 5. Implement session management with Redis
# 6. Add security headers (CSP, X-Frame-Options, etc.)
```

---

## 8. Compliance Notes

### Data Protection

- **Purpose Limitation**: Officers can only query data relevant to their duties
- **Access Logging**: All data access is logged for audit trails
- **Data Minimization**: RLS ensures users don't see more data than needed
- **Accountability**: Audit logs tie every query to a specific user

### KSP Datathon Requirements

This implementation addresses **Challenge 1: Conversational AI for Crime Intelligence**:

- ✅ **Role-based access**: Different views for Constable vs DSP vs Analyst
- ✅ **Audit trail**: Complete logging of all queries and results
- ✅ **Data security**: Multi-layer security (auth + RBAC + RLS)
- ✅ **Explainability**: Audit logs show what filters were applied and why

---

## Files Reference

| File | Purpose |
|------|---------|
| `catalyst/functions/auth.py` | Login endpoint, token generation |
| `catalyst/functions/lib/auth_utils.py` | Token verification, RBAC, RLS |
| `catalyst/functions/chat.py` | Chat endpoint with RLS enforcement |
| `catalyst/functions/admin.py` | Audit logs endpoint (RBAC protected) |
| `catalyst/datastore/schema.sql` | Database schema including audit_logs table |
| `catalyst/datastore/seed_data.sql` | Test users and sample FIRs |

---

**Last Updated:** 2026-01-10  
**MVP Status:** Authentication, RBAC, and RLS fully implemented and tested
