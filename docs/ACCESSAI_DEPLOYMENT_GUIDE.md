# AccessAI — Production Deployment & Operations Guide

- **Target Architecture:** Vercel (Next.js 15 Frontend) + Container / VM Hosting (FastAPI Backend) + Supabase (Managed PostgreSQL 17 with `pgvector`) + Clerk (Production RS256 Identity).
- **Deployment Status:** **READY FOR DEPLOYMENT** (Pending operator approval).

---

## 1. Hosting Architecture & Prerequisites

```
                      ┌──────────────────────────────────────┐
                      │            Clerk Identity            │
                      │  (RS256 JWKS Session Verification)   │
                      └──────────────┬───────────────────────┘
                                     │ User JWT
                                     ▼
┌─────────────────────────┐     HTTPS API Calls     ┌───────────────────────────────────┐
│     Vercel Hosting      ├────────────────────────►│  Container / Cloud Hosting (API)  │
│  (apps/web Next.js 15)  │  (Clerk Auth + CORS)    │    (apps/api FastAPI + Uvicorn)   │
└─────────────────────────┘                         └─────────────────┬─────────────────┘
                                                                      │
                                              SQL / pgvector (384d)   │ SSL
                                                                      ▼
                                                    ┌───────────────────────────────────┐
                                                    │    Supabase Managed PostgreSQL    │
                                                    │ (20 Tables, 100% RLS, Vector Ind) │
                                                    └───────────────────────────────────┘
```

### Required External Accounts & Provisions:
1. **Vercel Account:** For deploying the Next.js frontend (`apps/web`).
2. **Container Platform:** (Google Cloud Run, Railway, Render, Fly.io, or AWS ECS/App Runner) for running the Dockerized FastAPI backend (`apps/api`).
3. **Supabase Project:** Managed PostgreSQL with `pgvector` and `pgcrypto` extensions enabled.
4. **Clerk Production Application:** Production instance with domain verification and RS256 JWKS endpoint.
5. **Google AI Studio API Key:** Quota for `gemini-3.5-flash` generation and `gemini-embedding-001` (384 dimensions).

---

## 2. Environment Variables Specification

Safe example templates are provided in:
- Monorepo Root: [`.env.example`](file:///home/nageshwar/Desktop/cntl%20v%20hackethon/.env.example)
- Backend: [`apps/api/.env.example`](file:///home/nageshwar/Desktop/cntl%20v%20hackethon/apps/api/.env.example)
- Frontend: [`apps/web/.env.example`](file:///home/nageshwar/Desktop/cntl%20v%20hackethon/apps/web/.env.example)

### Backend Environment Variables (`apps/api`):

| Variable Name | Required | Example / Description |
| :--- | :--- | :--- |
| `APP_ENV` | Yes | `production` |
| `DEBUG` | Yes | `false` |
| `PORT` | Yes | `8000` (or dynamic port assigned by host) |
| `HOST` | Yes | `0.0.0.0` |
| `CORS_ORIGINS` | Yes | `["https://accessai.vercel.app"]` or comma-separated |
| `DATABASE_URL` | Yes | `postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/postgres` |
| `SUPABASE_URL` | Yes | `https://[PROJECT-ID].supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | `eyJ...` (Kept secret; server-side only) |
| `SUPABASE_ANON_KEY` | Yes | `eyJ...` |
| `STORAGE_BUCKET` | Yes | `accessai-documents` |
| `CLERK_SECRET_KEY` | Yes | `sk_live_...` |
| `CLERK_PUBLISHABLE_KEY` | Yes | `pk_live_...` |
| `CLERK_ISSUER` | Optional | Auto-derived from publishable key if omitted |
| `CLERK_JWKS_URL` | Optional | Auto-derived from publishable key if omitted |
| `CLERK_PEM_PUBLIC_KEY` | Optional | Direct RSA public key for offline verification |
| `LLM_PROVIDER` | Yes | `gemini` |
| `LLM_API_KEY` | Yes | `AIzaSy...` (Kept secret) |
| `LLM_MODEL` | Yes | `gemini-3.5-flash` |
| `EMBEDDING_PROVIDER` | Yes | `gemini` |
| `EMBEDDING_MODEL` | Yes | `gemini-embedding-001` |
| `EMBEDDING_DIMENSION` | Yes | `384` |
| `EMBEDDING_BATCH_SIZE` | Yes | `64` |
| `OCR_ENGINE` | Yes | `tesseract` |
| `LOG_LEVEL` | Yes | `INFO` |
| `RATE_LIMIT_PER_MINUTE` | Yes | `60` |

### Frontend Environment Variables (`apps/web` on Vercel):

| Variable Name | Exposed to Client | Description |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_APP_NAME` | Yes | `AccessAI` |
| `NEXT_PUBLIC_API_URL` | Yes | Production backend URL: `https://api.accessai.org/api/v1` |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Yes | Production key: `pk_live_...` |
| `CLERK_SECRET_KEY` | **No** (Server only) | Production secret: `sk_live_...` |
| `NEXT_PUBLIC_DEFAULT_LOCALE` | Yes | `en` |

> [!CAUTION]
> Never prefix database passwords, Gemini API keys, or service role keys with `NEXT_PUBLIC_`. Frontend client bundles must never receive backend infrastructure credentials.

---

## 3. Database Deployment Procedure (Supabase PostgreSQL)

The database schema is fully defined and verified in the repository.

### Safe Migration Steps:
1. Verify database extensions in Supabase SQL editor:
   ```sql
   CREATE EXTENSION IF NOT EXISTS "vector";
   CREATE EXTENSION IF NOT EXISTS "pgcrypto";
   ```
2. Apply migrations in order (or execute the idempotent master script [`supabase/combined_migration.sql`](file:///home/nageshwar/Desktop/cntl%20v%20hackethon/supabase/combined_migration.sql)):
   ```bash
   # Via Supabase CLI:
   supabase db push
   
   # Or via psql:
   psql "$DATABASE_URL" -f supabase/combined_migration.sql
   ```
3. Seed authoritative catalog data (idempotent, skips existing rows):
   ```bash
   PYTHONPATH=apps/api python scripts/seed_db.py
   ```
4. Verify Row-Level Security:
   ```sql
   SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
   -- Confirms all 20 tables have rowsecurity = true
   ```

---

## 4. Backend Deployment Procedure

### Option A: Containerized Deployment (Cloud Run / Railway / Render / AWS ECS)

1. Build and push Docker image:
   ```bash
   docker build -t accessai-api:latest -f apps/api/Dockerfile apps/api
   ```
2. Run container:
   ```bash
   docker run -d \
     --name accessai-api \
     -p 8000:8000 \
     --env-file apps/api/.env \
     accessai-api:latest
   ```

### Option B: Procfile-Based Platforms (Render, Railway, Heroku)
The repository includes [`apps/api/Procfile`](file:///home/nageshwar/Desktop/cntl%20v%20hackethon/apps/api/Procfile) and [`render.yaml`](file:///home/nageshwar/Desktop/cntl%20v%20hackethon/render.yaml):
```
web: uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000} --workers ${WEB_CONCURRENCY:-2} --proxy-headers --forwarded-allow-ips '*'
```

### Health & Readiness Probes for Orchestrators:
- **Liveness Probe:** `GET /health/live` (HTTP 200 when ASGI process is responsive)
- **Readiness Probe:** `GET /health/ready` (HTTP 200 when PostgreSQL connection is healthy, HTTP 503 if disconnected)
- **Database Probe:** `GET /health/db` (Returns connection details and engine status)
- **Full Health Probe:** `GET /health` (Returns environment, database status, AI provider, and architecture)

---

## 5. Frontend Deployment Procedure (Vercel)

### Option A: Vercel CLI
```bash
# 1. Navigate to frontend root
cd apps/web

# 2. Deploy preview build
vercel

# 3. Promote to production (with explicit approval)
vercel --prod
```

### Option B: Vercel Git Integration
1. Connect Git repository in Vercel Dashboard.
2. In **Project Settings**:
   - **Framework Preset:** `Next.js`
   - **Root Directory:** `apps/web`
   - **Build Command:** `npm run build`
   - **Output Directory:** `.next`
3. Configure Environment Variables:
   - `NEXT_PUBLIC_API_URL`
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`
   - `NEXT_PUBLIC_APP_NAME`
4. The pre-configured [`apps/web/vercel.json`](file:///home/nageshwar/Desktop/cntl%20v%20hackethon/apps/web/vercel.json) automatically enforces HTTP security headers (`nosniff`, `DENY` framing, XSS protection, strict referrer policy).

---

## 6. Post-Deployment Verification & Smoke Testing

Once deployment approval is given and environments are active:

```bash
# 1. Probe Backend Readiness
curl -s -i https://api.accessai.org/health/ready | grep "HTTP/1.1 200"

# 2. Probe Backend Liveness
curl -s https://api.accessai.org/health/live

# 3. Test CORS Configuration
curl -s -I -H "Origin: https://accessai.vercel.app" \
  https://api.accessai.org/api/v1/health | grep -i "Access-Control-Allow-Origin"

# 4. Verify Frontend Status
curl -s -I https://accessai.vercel.app | grep "HTTP/2 200"
```

---

## 7. Security & Rollback Operations

- **Rollback Frontend:** In Vercel Dashboard, select the prior Instant Rollback target or run `vercel rollback`.
- **Rollback Backend:** Redeploy prior container image tag or commit SHA.
- **Database Safety:** Supabase backups and WAL archiving are active. All schema migrations are additive and non-destructive.
- **Algorithm Confusion Mitigation:** PyJWT strictly enforces `RS256` token headers with asymmetric verification keys; symmetric `HS256` forged tokens are actively rejected.
