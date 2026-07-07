# 🔧 Setup Ibha Without PostgreSQL Password

Since we can't access PostgreSQL with the forgotten password, here are your options:

## Option 1: Reset PostgreSQL Password (RECOMMENDED)

### Method A: Using pgAdmin (Easiest)
1. Open **pgAdmin** (should be installed with PostgreSQL)
2. It may connect automatically without asking for password (if you saved it)
3. Right-click on "postgres" → Properties → Definition
4. Set new password: `yeet` (or whatever you want)
5. Save

### Method B: Using Command Line (Windows Authentication)
```powershell
# Stop PostgreSQL service
Stop-Service postgresql-x64-18

# Edit pg_hba.conf to allow passwordless local connections temporarily
# File location: C:\Program Files\PostgreSQL\18\data\pg_hba.conf
# Change this line:
#   host    all             all             127.0.0.1/32            scram-sha-256
# To:
#   host    all             all             127.0.0.1/32            trust

# Start PostgreSQL service
Start-Service postgresql-x64-18

# Now you can connect without password and reset it
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -c "ALTER USER postgres PASSWORD 'yeet';"

# Change pg_hba.conf back to scram-sha-256
# Restart service
Restart-Service postgresql-x64-18
```

---

## Option 2: Use SQLite Instead (Quick Alternative)

If you want to skip PostgreSQL setup entirely, I can convert Ibha to use SQLite (no password needed).

**Pros:**
- No password needed
- Single file database
- Easy to set up

**Cons:**
- Less features than PostgreSQL
- Not production-ready
- Need to modify code

**Would you like me to create an SQLite version?**

---

## Option 3: Try pgAdmin Password Recovery

1. Open: `C:\Users\YOUR_USERNAME\AppData\Roaming\pgAdmin\pgpass`
2. Look for a line with: `localhost:5432:*:postgres:YOUR_PASSWORD`
3. The password is in plain text there!

---

## Option 4: Manual Database Creation (If you remember ANY user password)

If you have access to PostgreSQL through pgAdmin or another user:

```sql
-- In pgAdmin or any PostgreSQL client:
CREATE DATABASE ibha;
CREATE USER ibha_user WITH PASSWORD 'ibha_password';
GRANT ALL PRIVILEGES ON DATABASE ibha TO ibha_user;
```

Then update `local_server.py`:
```python
os.environ['DB_USER'] = 'ibha_user'
os.environ['DB_PASSWORD'] = 'ibha_password'
```

---

## 🎯 What I Recommend

**EASIEST:** Try Option 3 first (check pgpass file)
**FASTEST:** Option 1 Method B (edit pg_hba.conf)
**SAFEST:** Option 1 Method A (use pgAdmin)

**Which option would you like to try?**
