# 🚀 Quick Fix: Use SQLite (No Password Needed!)

Since PostgreSQL password is forgotten, let's use SQLite instead. It's **much simpler** and requires **no password**.

## What You Need To Do

Just run these commands in PowerShell:

```powershell
# 1. Install SQLite support
pip install sqlite3

# 2. Start backend (it will create the database automatically)
cd C:\Projects\Ibha\ibha-ksp
python local_server_sqlite.py

# 3. In another window, start frontend
cd C:\Projects\Ibha\ibha-ksp\web
npm run dev

# 4. Open browser
start http://localhost:3000
```

That's it! No database setup needed.

---

**Or if you want to fix PostgreSQL password:**

The **fastest way** is to temporarily disable password authentication:

1. Open Notepad as Administrator
2. Edit: `C:\Program Files\PostgreSQL\18\data\pg_hba.conf`
3. Find line: `host    all             all             127.0.0.1/32            scram-sha-256`
4. Change `scram-sha-256` to `trust`
5. Save file
6. Restart PostgreSQL: `Restart-Service postgresql-x64-18`
7. Now you can connect without password!

Then reset it:
```powershell
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -c "ALTER USER postgres PASSWORD 'yeet';"
```

**Which do you prefer? SQLite (easier) or fix PostgreSQL (more powerful)?**
