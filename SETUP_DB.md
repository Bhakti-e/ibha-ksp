# Ibha Database Setup Guide

## Prerequisites

Choose ONE of these options:

### Option A: Zoho Catalyst Data Store (Recommended)
- Catalyst CLI installed
- Catalyst account with project created

### Option B: Local PostgreSQL
- PostgreSQL 13+ installed
- `psql` command available

---

## Setup Instructions

### Option A: Catalyst Data Store

```bash
# 1. Initialize Catalyst project (if not done)
catalyst init

# 2. Enable Data Store in Catalyst Console
# Go to https://console.catalyst.zoho.com → Enable Data Store

# 3. Run initialization script
catalyst sql:run catalyst/datastore/init_db.sql --env dev

# 4. Load sample data
catalyst sql:run catalyst/datastore/seed_data.sql --env dev

# 5. Verify
catalyst sql:query "SELECT COUNT(*) FROM users;" --env dev
# Expected: 6 users

catalyst sql:query "SELECT COUNT(*) FROM CaseMaster;" --env dev
# Expected: 35+ FIRs
```

### Option B: Local PostgreSQL

```bash
# 1. Create database
createdb ibha

# Or using psql:
psql -U postgres
CREATE DATABASE ibha;
\q

# 2. Run initialization script
psql -U postgres -d ibha -f catalyst/datastore/init_db.sql

# 3. Load sample data
psql -U postgres -d ibha -f catalyst/datastore/seed_data.sql

# 4. Verify
psql -U postgres -d ibha -c "SELECT COUNT(*) FROM users;"
# Expected: count = 6

psql -U postgres -d ibha -c "SELECT COUNT(*) FROM CaseMaster;"
# Expected: count = 35+

psql -U postgres -d ibha -c "SELECT role, COUNT(*) FROM users GROUP BY role;"
# Expected: breakdown of roles
```

---

## Verification Queries

After setup, run these to ensure everything is working:

```sql
-- Check users
SELECT user_id, email, role, full_name FROM users;

-- Check sample FIRs
SELECT CrimeNo, CrimeRegisteredDate, BriefFacts 
FROM CaseMaster 
ORDER BY CrimeRegisteredDate DESC 
LIMIT 5;

-- Check accused
SELECT a.AccusedName, a.PersonID, a.PreviousCases, cm.CrimeNo
FROM Accused a
JOIN CaseMaster cm ON a.CaseMasterID = cm.CaseMasterID
LIMIT 5;

-- Check crime distribution by station
SELECT u.UnitName, COUNT(cm.CaseMasterID) as case_count
FROM CaseMaster cm
JOIN Unit u ON cm.PoliceStationID = u.UnitID
GROUP BY u.UnitName
ORDER BY case_count DESC;

-- Check crime types
SELECT csh.CrimeHeadName, COUNT(*) as count
FROM CaseMaster cm
JOIN CrimeSubHead csh ON cm.CrimeMinorHeadID = csh.CrimeSubHeadID
GROUP BY csh.CrimeHeadName
ORDER BY count DESC;
```

Expected Results:
- **6 users** with different roles (Constable, SI, Inspector, DSP, SCRB_Analyst, Admin)
- **35+ FIRs** across multiple police stations
- **15+ accused** persons (some repeat offenders)
- **16+ victims**
- **Stations**: Koramangala (20 cases), Whitefield (15 cases), others

---

## Sample Login Credentials

All users have password: `password123` (for demo only)

| Email | Role | Station | Use Case |
|-------|------|---------|----------|
| `rajesh.kumar@ksp.gov.in` | Constable | Koramangala | Can only see Koramangala station FIRs |
| `priya.sharma@ksp.gov.in` | SI | Koramangala | Can see Koramangala station FIRs |
| `arun.desai@ksp.gov.in` | Inspector | Whitefield | Can see Whitefield station FIRs |
| `lakshmi.rao@ksp.gov.in` | DSP | Jayanagar | Can see entire Bangalore Urban district |
| `vikram.mehta@ksp.gov.in` | SCRB_Analyst | SCRB HQ | Can see all FIRs across state |
| `admin.system@ksp.gov.in` | Admin | SCRB HQ | Full access to all data |

---

## Troubleshooting

### Error: "relation already exists"
- Solution: Drop and recreate database, or run init_db.sql first (it has `IF NOT EXISTS` checks)

### Error: "permission denied"
- Solution: Ensure your PostgreSQL user has CREATE privileges
- Run: `GRANT ALL PRIVILEGES ON DATABASE ibha TO your_username;`

### Error: Foreign key constraint fails
- Solution: Ensure init_db.sql runs completely before seed_data.sql
- Order matters: init_db.sql THEN seed_data.sql

### No data visible after seed
- Check if INSERT statements succeeded
- Run: `SELECT COUNT(*) FROM CaseMaster;`
- If 0, re-run seed_data.sql

---

## Next Steps

After database setup:
1. Configure backend functions to connect to this database
2. Update `.env` files with DB connection details
3. Test authentication with sample users
4. Run end-to-end tests

See `/DEPLOYMENT_CHECKLIST.md` for complete deployment guide.
