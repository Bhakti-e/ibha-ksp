# Cloud PostgreSQL Setup — Ibha KSP

## 1. Get a PostgreSQL database

Any provider works. Recommended free-tier options:

| Provider | Notes |
|---|---|
| [ElephantSQL](https://www.elephantsql.com) | Free 20 MB, instant signup |
| [Supabase](https://supabase.com) | Free 500 MB, includes GUI |
| [Neon](https://neon.tech) | Free tier, serverless |
| [Railway](https://railway.app) | Free trial |
| [Render](https://render.com) | Free PostgreSQL (expires 90d) |

After signup you will receive a connection string like:
```
postgres://USER:PASSWORD@HOST:PORT/DBNAME
```

## 2. Configure credentials

```bash
cp .env.backend.example .env.backend
```

Open `.env.backend` and set your values:

```
DB_HOST=your-host.db.example.com
DB_PORT=5432
DB_NAME=ibha
DB_USER=your_user
DB_PASSWORD=your_password
DB_SSLMODE=require          # always "require" for cloud PostgreSQL
IBHA_JWT_SECRET=<32-char random string>
USE_CATALYST_DS=false
```

> **Never commit `.env.backend`** — it is in `.gitignore`.

Generate a secure JWT secret:
```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

## 3. Test the connection

```bash
python scripts/test_db_connection.py
```

Expected output:
```
✅  Connection successful — PostgreSQL is reachable.
   Tables found: 0
   Required tables missing: casemaster, accused, unit, users, audit_logs
   Run: psql -U postgres -d ibha -f catalyst/datastore/init_db.sql
```

## 4. Validate setup files (no DB required)

```bash
python scripts/setup_cloud_postgres.py --dry-run
```

## 5. Initialize schema and seed data

```bash
python scripts/setup_cloud_postgres.py
```

This will:
- Create all tables (CaseMaster, Accused, Victim, Unit, users, audit_logs, etc.)
- Insert lookup data (crime types, police stations, districts)
- Insert 6 demo users
- Insert 35+ sample FIR cases
- Import CSV sample data from `data/samples/`

Run schema only (no CSV):
```bash
python scripts/setup_cloud_postgres.py --schema-only
```

Run CSV import only (schema already created):
```bash
python scripts/setup_cloud_postgres.py --data-only
```

## 6. Start the backend

```bash
python local_server.py
```

The startup banner will show:
```
Database: PostgreSQL
Host:     your-host.db.example.com
DB name:  ibha
SSL mode: require
```

## 7. Start the frontend

```bash
cd web
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## 8. Demo login

| Role | Email | Password |
|---|---|---|
| Inspector | arun.desai@ksp.gov.in | password123 |
| Admin | admin.system@ksp.gov.in | password123 |
| SCRB Analyst | vikram.mehta@ksp.gov.in | password123 |
| Constable | rajesh.kumar@ksp.gov.in | password123 |

## Troubleshooting

**Connection refused** — wrong host/port, or firewall blocking port 5432.
Check your provider dashboard for the correct connection string.

**SSL error** — set `DB_SSLMODE=require` for cloud providers.

**Authentication failed** — wrong user or password. Copy credentials exactly from provider dashboard.

**Tables missing after setup** — run `python scripts/setup_cloud_postgres.py` again.
The script is idempotent (uses `ON CONFLICT DO NOTHING` and `CREATE TABLE IF NOT EXISTS`).

**password authentication failed** — double-check DB_PASSWORD in `.env.backend`.
The password is never printed by any script.
