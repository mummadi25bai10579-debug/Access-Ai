# AccessAI — Application & Database Security Review

- **Date:** 2026-11-10
- **Auditors:** Senior Backend Architect, Application Security Engineer, PostgreSQL DBA
- **Status:** Complete & Verified
- **Scope:** FastAPI API backend (`apps/api`), Next.js client (`apps/web`), Supabase PostgreSQL database, Clerk Auth integration.

---

## 1. Authentication & Session Security (Clerk)

### Architecture & Trust Boundary
- **Authority:** Clerk is the sole authentication authority. The backend never accepts arbitrary user claims without cryptographic verification.
- **Verification Protocol:**
  - Token extraction via `Authorization: Bearer <token>`.
  - Signature verification against Clerk's JSON Web Key Set (JWKS) public keys fetched over HTTPS (`CLERK_JWKS_URL`).
  - Algorithm strictly pinned to `RS256`. Asymmetric cryptography guarantees the private key remains secure on Clerk's servers.
- **Vulnerabilities Mitigated:**
  - **Algorithm Confusion (CVE-2015-9235):** The backend explicitly rejects tokens declaring symmetric algorithms (`HS256`, `HS384`, `HS512`) using the RSA public key as an HMAC secret. Verified in `test_algorithm_confusion_forgery_rejected`.
  - **Token Expiration:** The backend validates standard claims (`exp`, `nbf`, `iat`) with a tight leeway of 10 seconds. Verified in `test_expired_jwt_raises_unauthorized`.
  - **Key ID (kid) Spoofing:** Tokens without matching `kid` in the JWKS are rejected immediately. Verified in `test_missing_kid_rejected`.

---

## 2. Authorization & Tenant Isolation (IDOR Prevention)

### Identity Mapping
- Incoming Clerk user identity (`sub`) is translated to internal database primary keys (`profiles.id` UUID) via `_resolve_profile_id()`.
- Every user-owned resource (`documents`, `document_chunks`, `learning_progress`, `quiz_attempts`, `applications`, `user_skills`, `notifications`) explicitly stores `user_id = profiles.id`.

### Cross-Tenant Data Isolation
- Queries in repository layers (`DocumentRepository`, `EducationRepository`, `OpportunityRepository`) strictly enforce `WHERE user_id = :prof_id`.
- Even if an attacker knows the UUID of another user's document or quiz attempt, the database query returns `None` and the API responds with `HTTP 404 / DocumentNotFoundError`.
- Cross-tenant RAG search isolation: `search_chunks()` filters by both `document_id == :doc_id` and `user_id == :prof_id`, preventing cross-tenant vector leakage. Verified in `test_cross_tenant_isolation_in_rag`.

---

## 3. Database Security & Row-Level Security (RLS)

### Live PostgreSQL Catalog Audit
- **Total Tables:** 20 in `public` schema.
- **RLS Status:** All 20 tables have `rowsecurity = True`.
- **Policy Count:** 36 active policies:
  - **Public Catalog Tables (SELECT only):** `courses`, `course_materials`, `data_sources`, `schemes`, `scheme_eligibility_rules`, `opportunities` have permissive `SELECT` for public readers.
  - **Tenant Tables (Scoped):** `documents`, `document_chunks`, `learning_progress`, `quiz_attempts`, `applications`, `notifications`, `user_skills`, `user_preferences`, `profiles` enforce strict ownership checks.
- **Database Connection Role:** Currently connecting as `postgres` over SSL with prepared statement pooling. The proposed dedicated unprivileged application role (`accessai_app`) with `NOINHERIT` has been prepared in migrations and is awaiting owner execution approval.

---

## 4. Input Validation & File Upload Security

### File Upload Sanitization
- **Max File Size:** Enforced at 15 MB in `extractor.py` (`MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024`).
- **MIME & Extension Whitelisting:** Restricted to `.pdf`, `.txt`, `.md`, `.json`, `.csv`.
- **Null-Byte Injection:** `sanitize_text()` strips `\x00` null bytes and normalizes vertical/horizontal whitespace to prevent path traversal or parser crashes.
- **PDF Bomb / Malformed Parsing:** Parsed using isolated `pypdf` streams; empty or encrypted streams raise explicit validation errors.

---

## 5. Secret Management & PII Redaction

### Secrets
- No hardcoded API keys or passwords in repository source code.
- `.env` is git-ignored and configured through environment variables.
- Gemini API key is loaded via `LLM_API_KEY` from root `.env`.

### Log Scrubbing & PII Redaction
- `apps/api/app/core/security.py` runs regex-based redaction:
  - **Aadhaar Numbers:** `\b\d{4}\s?\d{4}\s?\d{4}\b` -> `[REDACTED_AADHAAR]`
  - **PAN Cards:** `\b[A-Z]{5}[0-9]{4}[A-Z]{1}\b` -> `[REDACTED_PAN]`
  - **Bearer Tokens:** `Bearer\s+[A-Za-z0-9\-_=.]+` -> `Bearer [REDACTED_TOKEN]`
- `GeminiProvider._sanitize_error()` strips `self.api_key` from error messages and tracebacks.

---

## 6. Findings & Security Matrix

| Finding | Severity | Status | Mitigation |
| :--- | :--- | :--- | :--- |
| **Algorithm Confusion on JWT** | HIGH | RESOLVED | Enforced RS256 algorithm pinning; HMAC algorithms rejected. |
| **Missing Document Vector Isolation** | HIGH | RESOLVED | Added `user_id` constraint to pgvector chunk similarity queries. |
| **Untrusted Client Quiz Scoring** | MEDIUM | RESOLVED | Server evaluates option indices and calculates score deterministically. |
| **Unbounded File Uploads** | MEDIUM | RESOLVED | 15MB limit and MIME type validation in document processing service. |
| **API Key Leaks in Gemini Logs** | MEDIUM | RESOLVED | Implemented `_sanitize_error()` in GeminiProvider. |
| **Unprivileged Database Role** | LOW | PENDING APPROVAL | Migration prepared; live execution paused pending owner approval. |

