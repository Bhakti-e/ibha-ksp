# Ibha KSP Frontend — Deployment Guide

## Option A: Zoho Catalyst AppSail (recommended)

```bash
cd web
# Install Catalyst CLI if not already installed
npm install -g @zohotools/catalyst-cli

# Initialise AppSail for the frontend
catalyst init appsail
# When prompted:
#   Runtime: Node.js
#   Build command: npm run build
#   Start command: npm run start
#   Root directory: web/

# Set the required environment variable in Catalyst Console:
#   NEXT_PUBLIC_CATALYST_API_BASE_URL = https://ibha-ksp-backend.zohocatalyst.com/api/v1

# Deploy
catalyst deploy appsail
```

**Required environment variable:**

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_CATALYST_API_BASE_URL` | URL of the deployed backend AppSail service |

---

## Option B: Vercel (quickest for demos)

1. Push the repo to GitHub (already done — `origin/updated`).
2. Go to https://vercel.com → New Project → Import from GitHub.
3. Set **Root Directory** to `web/`.
4. Add environment variable:
   - `NEXT_PUBLIC_CATALYST_API_BASE_URL` = your backend URL
5. Click Deploy.

---

## Option C: Local development

```bash
cd web
cp ../.env.example .env.local   # then edit NEXT_PUBLIC_CATALYST_API_BASE_URL
npm install
npm run dev
# Frontend: http://localhost:3000
```

---

## Notes

- The frontend is a standard Next.js 14 App Router application.
- All API calls go to `NEXT_PUBLIC_CATALYST_API_BASE_URL` (set in `.env.local` or Catalyst/Vercel env panel).
- Build output: `.next/` (standard Next.js, compatible with all Node.js hosts).
- No server-side secrets are stored in the frontend — only `NEXT_PUBLIC_*` variables are embedded.
