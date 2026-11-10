# AccessAI — Environment Variables Reference

Comprehensive specification of all required and optional environment variables used by the AccessAI platform.

---

## 1. Core Server & Environment

| Variable | Required | Default | Description |
| :--- | :--- | :--- | :--- |
| `APP_ENV` | Yes | `development` | Deployment environment (`development`, `staging`, `production`, `test`). |
| `DEBUG` | No | `false` | Enables verbose stack traces and debug logging in development. |
| `PORT` | No | `8000` | Port on which the FastAPI Uvicorn server binds. |
| `HOST` | No | `0.0.0.0` | Network interface IP to bind to. |
| `CORS_ORIGINS` | Yes | `["http://localhost:3000"]` | JSON array of permitted origin URLs for CORS headers. |
| `LOG_LEVEL` | No | `INFO` | Python logging level (`DEBUG`, `INFO`, `WARNING`, `ERROR`). |
| `RATE_LIMIT_PER_MINUTE` | No | `60` | Maximum API requests allowed per client IP per minute. |

---

## 2. Authentication & Identity (Clerk)

| Variable | Required | Description |
| :--- | :--- | :--- |
| `CLERK_SECRET_KEY` | Yes | Backend secret key used for Clerk REST Admin API interactions. |
| `CLERK_PUBLISHABLE_KEY` | Yes | Public key for Clerk browser authentication initialization. |
| `CLERK_ISSUER` | Yes | Clerk authentication instance issuer domain (e.g. `https://example.clerk.accounts.dev`). |
| `CLERK_JWKS_URL` | Yes | Clerk JSON Web Key Set endpoint for RS256 token verification. |

---

## 3. Database & Storage (Supabase PostgreSQL)

| Variable | Required | Description |
| :--- | :--- | :--- |
| `DATABASE_URL` | Yes | PostgreSQL connection URI with SSL mode enabled (`postgresql://user:pass@host:port/dbname?sslmode=require`). |
| `SUPABASE_URL` | Yes | Supabase project API endpoint. |
| `SUPABASE_ANON_KEY` | Yes | Supabase client anon public key. |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes (Server) | Supabase admin secret key. Never expose to client applications. |
| `STORAGE_BUCKET` | No | `accessai-documents` default bucket for raw document blob storage. |

---

## 4. Shared Intelligence & AI (Google Gemini)

| Variable | Required | Value / Format | Description |
| :--- | :--- | :--- | :--- |
| `LLM_PROVIDER` | Yes | `gemini` or `mock` | Primary AI provider. Set to `gemini` for live models or `mock` for offline sandbox testing. |
| `LLM_MODEL` | Yes | `gemini-3.8-flash` | Google Gemini model identifier used for generation and Q&A. |
| `LLM_API_KEY` | Yes (when `gemini`) | Google AI Studio Key | API secret key generated in Google AI Studio. |
| `EMBEDDING_PROVIDER` | Yes | `gemini` | Embedding provider. Must match vector model dimensions. |
| `EMBEDDING_MODEL` | Yes | `gemini-embedding-001` | Official Gemini text embedding model. |
| `EMBEDDING_DIMENSION` | Yes | `384` | MRL output dimensionality matching PostgreSQL `vector(384)`. |

---

## 5. Frontend Client Configuration (Next.js)

| Variable | Required | Example |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_API_URL` | Yes | `http://localhost:8000/api/v1` or production HTTPS API URL. |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Yes | `pk_test_...` or `pk_live_...`. |
| `NEXT_PUBLIC_APP_NAME` | No | `AccessAI`. |
| `NEXT_PUBLIC_DEFAULT_LOCALE` | No | `en`. |

