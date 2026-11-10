# AccessAI — Repository Audit Report

**Date:** November 2026  
**Auditor:** Principal Software Architect & Technical Lead  
**Audit Target:** AccessAI Monorepo (`/home/nageshwar/Desktop/cntl v hackethon`)  
**Phase:** Phase 0 — Project Initialization & Engineering Audit  
**Status:** Audit Complete — Ready for Review & Approval  

---

## 1. Executive Summary

An exhaustive engineering audit was performed across all directories, configuration files, backend services, frontend pages, database migrations, shared contracts, and test suites in the AccessAI repository. 

The repository has an established monorepo scaffolding consisting of a **Next.js 15 (App Router)** frontend, a **FastAPI** backend designed as a **modular monolith**, a **Supabase PostgreSQL** database schema with **pgvector** and Row-Level Security (RLS), and a shared contract package (`@accessai/contracts`).

### Critical Audit Findings
1. **Frontend State vs. Live API Gap:** The frontend dashboard and module pages (`/access`, `/education`, `/schemes`, `/opportunities`, `/documents`, `/profile`) currently render static mock data and simulate async delays using `setTimeout`, rather than executing live network calls through `ApiClient` (`apps/web/src/lib/api/client.ts`).
2. **In-Memory Backend Repositories:** The backend domain repositories (`apps/api/app/modules/*/repository.py`) operate on fast in-memory Python dictionaries (`_DOCUMENTS_STORE`, `_SCHEMES_STORE`, `_OPPORTUNITIES_STORE`, `_COURSES_STORE`) rather than executing SQL queries against PostgreSQL.
3. **Missing Dockerfile in `apps/web`:** `docker-compose.yml` configures the `web` container to build from `./apps/web/Dockerfile`, but this file does not exist in `apps/web/`.
4. **Missing Provider File:** `apps/api/app/intelligence/providers/provider_factory.py` attempts to conditionally import `OpenAIProvider` from `app.intelligence.providers.openai_provider`, but `openai_provider.py` does not exist (it falls back safely to `MockAIProvider`).
5. **Local Host Runtimes:** The host environment possesses Python 3.14.4, Git, and Docker, but does not have `node` or `npm` installed in the standard PATH, and `fastapi`/`pytest` are not installed in the global Python environment. However, the test runner (`scripts/run_tests.sh`) successfully runs all 17 unit, security, and integration tests using Python's standard `unittest` library.
6. **Authoritative Seed & Schema Integrity:** The database schema (`20261107000001_initial_schema.sql`), RLS policies (`20261107000002_row_level_security.sql`), and seed data (`supabase/seed.sql`) are high quality, containing authentic Indian government scheme data (PM-KISAN, Jagananna Vidya Deevena, AICTE Pragati, Post-Matric Minority) and structured Boolean/relational rule criteria.

---

## 2. Directory Structure & File Inventory

```
cntl v hackethon/
├── .env.example                               # Environment configuration template
├── .gitignore                                 # Git ignore patterns
├── .github/workflows/ci.yml                   # CI workflow configuration
├── AGENTS.md                                  # Architectural laws and domain constraints
├── docker-compose.yml                         # Container runtime (postgres, api, web)
├── README.md                                  # Platform overview & getting started
├── docs/                                      # Existing architecture and design docs
│   ├── AI_PIPELINE.md                         # RAG & ML pipeline specification
│   ├── API.md                                 # REST API specification
│   ├── ARCHITECTURE.md                        # Modular monolith architectural blueprint
│   ├── CHANGELOG.md                           # Version history
│   ├── DATABASE.md                            # Entity relationships & RLS design
│   ├── EVALUATION.md                          # Benchmark and evaluation framework
│   ├── PRD.md                                 # Product requirements document
│   ├── ROADMAP.md                             # 10-phase execution roadmap
│   └── SECURITY.md                            # Threat model & WCAG compliance
├── packages/
│   └── contracts/                             # Shared contracts
│       ├── openapi/openapi.json               # OpenAPI 3.1 specification
│       ├── package.json                       # Package manifest
│       └── types/index.ts                     # TypeScript type definitions
├── scripts/
│   ├── run_tests.sh                           # Test suite execution runner
│   ├── seed_db.py                             # Seed integrity verification script
│   └── setup_dev.sh                           # Development environment setup script
├── supabase/
│   ├── config.toml                            # Supabase CLI configuration
│   ├── migrations/
│   │   ├── 20261107000001_initial_schema.sql  # 16 relational tables & pgvector
│   │   └── 20261107000002_row_level_security.sql # RLS policies for multi-tenancy
│   └── seed.sql                               # Seed data for schemes and opportunities
└── apps/
    ├── api/                                   # FastAPI backend
    │   ├── Dockerfile                         # Python 3.12 slim container build
    │   ├── alembic.ini                        # Database migration configuration
    │   ├── alembic/                           # Migration scripts (currently empty)
    │   ├── requirements.txt                   # Backend dependencies
    │   ├── app/
    │   │   ├── __init__.py
    │   │   ├── main.py                        # FastAPI application entrypoint & middleware
    │   │   ├── config.py                      # App settings with dataclass fallback
    │   │   ├── api/                           # HTTP controllers & routers
    │   │   │   ├── deps.py                    # Dependency injection & service singletons
    │   │   │   └── v1/
    │   │   │       ├── router.py              # Root v1 API router
    │   │   │       ├── access.py              # Module 01 endpoints
    │   │   │       ├── documents.py           # Ingestion endpoints
    │   │   │       ├── education.py           # Module 02 endpoints
    │   │   │       ├── opportunities.py       # Module 04 endpoints
    │   │   │       ├── schemes.py             # Module 03 endpoints
    │   │   │       ├── users.py               # User profile endpoints
    │   │   │       └── voice.py               # Speech endpoints
    │   │   ├── core/                          # Infrastructure & security
    │   │   │   ├── exceptions.py              # Typed domain exceptions
    │   │   │   ├── logging.py                 # Structured logging & PII masking
    │   │   │   ├── middleware.py              # Request context & security headers
    │   │   │   ├── permissions.py             # Resource ownership validation
    │   │   │   └── security.py                # Supabase JWT token verification
    │   │   ├── intelligence/                  # Shared AI engine
    │   │   │   ├── multilingual/languages.py  # 11 Indic language definitions
    │   │   │   ├── orchestrator/orchestrator.py # Grounded QA & tutor orchestrator
    │   │   │   ├── prompts/templates.py       # Sandboxed prompt templates
    │   │   │   ├── providers/
    │   │   │   │   ├── base.py                # Abstract AIProvider interface
    │   │   │   │   ├── mock_provider.py       # Deterministic mock provider
    │   │   │   │   └── provider_factory.py    # Provider factory
    │   │   │   ├── rag/chunker.py             # Structure-aware document chunker
    │   │   │   ├── recommendations/engine.py  # Multi-factor scoring formula
    │   │   │   └── verification/grounding.py  # Citation verification & evidence tiers
    │   │   ├── modules/                       # Domain business logic
    │   │   │   ├── access/                    # Module A: AccessAI Assistant
    │   │   │   │   ├── repository.py
    │   │   │   │   ├── schemas.py
    │   │   │   │   └── service.py
    │   │   │   ├── education/                 # Module B: EduBridge
    │   │   │   │   ├── repository.py
    │   │   │   │   └── service.py
    │   │   │   ├── opportunities/             # Module D: OpportunityBridge
    │   │   │   │   ├── repository.py
    │   │   │   │   ├── resume_parser.py
    │   │   │   │   └── service.py
    │   │   │   └── schemes/                   # Module C: SchemeConnect
    │   │   │       ├── eligibility.py
    │   │   │       ├── repository.py
    │   │   │       └── service.py
    │   │   ├── database/                      # Skeleton directories (empty)
    │   │   ├── integrations/                  # Skeleton directories (empty)
    │   │   ├── services/                      # Skeleton directories (empty)
    │   │   ├── utils/                         # Skeleton directory (empty)
    │   │   └── workers/                       # Skeleton directory (empty)
    │   └── tests/                             # Test suite (17 tests)
    │       ├── integration/test_api_endpoints.py
    │       ├── security/test_security_isolation.py
    │       └── unit/
    │           ├── test_chunker.py
    │           ├── test_eligibility_engine.py
    │           └── test_recommendation_math.py
    └── web/                                   # Next.js 15 frontend
        ├── next.config.ts                     # Next.js configuration
        ├── package.json                       # Dependencies & scripts
        ├── postcss.config.mjs                 # PostCSS Tailwind config
        ├── tailwind.config.ts                 # Accessible theme & color variables
        ├── tsconfig.json                      # Path aliases (@/* -> ./src/*)
        ├── public/                            # Static assets
        └── src/
            ├── components/
            │   ├── accessibility/AccessibilityToolbar.tsx # WCAG 2.2 AA toolbar
            │   └── layout/Sidebar.tsx         # Navigation sidebar
            ├── lib/api/client.ts              # Typed API client
            ├── stores/accessibilityStore.ts   # Zustand accessibility store
            ├── styles/globals.css             # High contrast & font scaling CSS
            └── app/
                ├── layout.tsx                 # Root layout with AccessibilityToolbar
                ├── page.tsx                   # Landing page
                ├── (auth)/login/page.tsx      # Login form
                ├── (auth)/register/page.tsx   # Registration form
                └── (dashboard)/
                    ├── layout.tsx             # Dashboard shell with Sidebar
                    ├── dashboard/page.tsx     # Overview dashboard
                    ├── access/page.tsx        # Assistant & document Q&A
                    ├── education/page.tsx     # EduBridge tutor & quizzes
                    ├── schemes/page.tsx       # SchemeConnect eligibility
                    ├── opportunities/page.tsx # OpportunityBridge matching
                    ├── documents/page.tsx     # Document management
                    ├── profile/page.tsx       # Profile management
                    └── settings/page.tsx      # Accessibility preferences
```

---

## 3. Detailed Component Audit

### 3.1 Frontend Audit (`apps/web`)

| Feature / File | Current Implementation | Status | Issues / Gaps |
|---|---|---|---|
| `apps/web/package.json` | Next.js 15.0.3, React 19-rc, Tailwind CSS 3.4.15, Zustand 5.0.1, lucide-react 0.454.0 | Configured | Dependencies defined; host lacks global node/npm in PATH. |
| `apps/web/Dockerfile` | Non-existent | **Missing** | Referenced in `docker-compose.yml`, causing container build failure. |
| `AccessibilityToolbar.tsx` | Font scale (0.8x-2.0x), high contrast toggle, Web Speech TTS, 8 Indian languages | **Functional** | Fully operable via Zustand store and CSS custom properties. |
| `accessibilityStore.ts` | State management for font scale, high contrast, voice, and language | **Functional** | Clean Zustand store with browser environment guards. |
| `Sidebar.tsx` | Main navigation with icon badges and active route highlighting | **Functional** | Accessible semantic navigation. |
| `lib/api/client.ts` | Typed HTTP client for all backend endpoints | **Functional** | Defined with `@accessai/contracts`, but uncalled by page components. |
| `access/page.tsx` | Assistant UI for document ingestion and grounded Q&A | **Mocked** | Uses hardcoded mock state and `setTimeout` rather than `ApiClient`. |
| `education/page.tsx` | EduBridge contextual tutor, course list, and quiz UI | **Mocked** | Uses hardcoded quiz questions and simulated responses. |
| `schemes/page.tsx` | SchemeConnect scheme directory and rule checklist | **Mocked** | Hardcoded list of 3 schemes with inline rule evaluation. |
| `opportunities/page.tsx`| Opportunity matching and resume upload UI | **Mocked** | Hardcoded opportunity cards with simulated match percentages. |
| `documents/page.tsx` | Document list and upload dropzone | **Mocked** | Hardcoded uploaded document records. |
| `profile/page.tsx` | Citizen profile editor (income, caste, state, education) | **Mocked** | Local state only; not saving to backend `/users/me`. |
| `settings/page.tsx` | Accessibility preferences control center | **Mocked** | Connects to Zustand store, but does not sync to `/users/preferences`. |

### 3.2 Backend Audit (`apps/api`)

| Feature / File | Current Implementation | Status | Issues / Gaps |
|---|---|---|---|
| `main.py` | FastAPI app, CORS, RequestContextMiddleware, error handler, `/health` | **Functional** | Clean architecture; operational `/health` endpoint. |
| `config.py` | Pydantic Settings with `@dataclass` fallback for zero-dep execution | **Functional** | Robust against missing libraries in isolated environments. |
| `api/deps.py` | Dependency injection for current user, services, and repositories | **Functional** | Falls back to synthetic test user in development mode. |
| `core/security.py` | JWT token validation with `jwt.decode` and dev token bypass | **Functional** | Fully validates HS256 tokens and rejects expired signatures. |
| `core/middleware.py` | Request ID correlation, latency tracking, security headers | **Functional** | Injects `X-Request-ID`, `X-Response-Time-Ms`, `nosniff`, `DENY`. |
| `core/logging.py` | Structured logger with PII redaction for Aadhaar and PAN | **Functional** | Verified by unit tests; masks 12-digit Aadhaar and 10-char PAN. |
| `core/permissions.py` | Multi-tenant resource ownership guard (`assert_resource_owner`) | **Functional** | Verified by unit tests; raises `ForbiddenError` on mismatch. |
| `intelligence/orchestrator.py` | Central AI orchestrator with prompt wrapping and citation verification | **Functional** | Wraps context in `<untrusted_document_context>`; verifies citations. |
| `intelligence/rag/chunker.py` | Structure-aware text chunker with 50-word overlap | **Functional** | Tested and verified; tracks character bounds and page numbers. |
| `intelligence/recommendations/engine.py` | Formula $S = w_1E + w_2R + w_3P + w_4F$ with hard eligibility gate | **Functional** | Mathematical logic passes all unit tests. |
| `intelligence/verification/grounding.py` | Citation verifier & 4-tier evidence classification | **Functional** | Classifies into official, grounded, synthetic, unavailable. |
| `intelligence/providers/mock_provider.py` | Deterministic text generation, structured quiz, 384-dim unit embeddings | **Functional** | Enables full CI execution without paid API keys. |
| `intelligence/providers/openai_provider.py` | Referenced in factory, but file does not exist | **Missing** | Must be implemented for production OpenAI / Azure / local LLMs. |
| `modules/*/repository.py` | In-memory Python dictionary stores | **Temporary Mock** | Needs migration to SQLAlchemy 2.0 / Supabase PostgreSQL client. |
| `modules/schemes/eligibility.py` | Deterministic rule evaluator for `==`, `!=`, `<=`, `>=`, `in`, `contains` | **Functional** | 100% deterministic; zero LLM hallucinations. |
| `modules/opportunities/resume_parser.py` | Regex-based skill and education extractor | **Functional** | Basic keyword matcher; should be augmented with LLM extraction. |

### 3.3 Database & Migrations Audit (`supabase/`)

| File | Purpose | Verification Status |
|---|---|---|
| `20261107000001_initial_schema.sql` | 16 core relational tables, foreign keys, triggers, and `VECTOR(384)` pgvector column | **Verified Valid SQL** |
| `20261107000002_row_level_security.sql` | RLS enabled on all 16 tables with `auth.uid() = user_id` policies | **Verified Valid SQL** |
| `seed.sql` | Real Indian welfare data (PM-KISAN, Jagananna Vidya Deevena, AICTE Pragati) | **Verified Valid SQL** |
| `config.toml` | Supabase CLI local development configuration | **Verified Valid** |

---

## 4. Test Suite Execution Audit

Running `./scripts/run_tests.sh` executes Python's built-in `unittest` runner discovering all tests in `apps/api/tests/`:

```
==========================================
AccessAI Test Suite Runner
==========================================
test_document_ingestion_and_grounded_qa (integration.test_api_endpoints.TestApiServicesIntegration.test_document_ingestion_and_grounded_qa) ... ok
test_education_tutor_and_quiz (integration.test_api_endpoints.TestApiServicesIntegration.test_education_tutor_and_quiz) ... ok
test_opportunity_matching_pipeline (integration.test_api_endpoints.TestApiServicesIntegration.test_opportunity_matching_pipeline) ... ok
test_scheme_matching_pipeline (integration.test_api_endpoints.TestApiServicesIntegration.test_scheme_matching_pipeline) ... ok
test_assert_resource_owner_match (security.test_security_isolation.TestSecurityIsolation.test_assert_resource_owner_match) ... ok
test_assert_resource_owner_mismatch_raises_forbidden (security.test_security_isolation.TestSecurityIsolation.test_assert_resource_owner_mismatch_raises_forbidden) ... ok
test_pii_redaction_aadhaar_and_pan (security.test_security_isolation.TestSecurityIsolation.test_pii_redaction_aadhaar_and_pan) ... ok
test_pii_redaction_auth_token (security.test_security_isolation.TestSecurityIsolation.test_pii_redaction_auth_token) ... ok
test_chunking_with_overlap (unit.test_chunker.TestStructureAwareChunker.test_chunking_with_overlap) ... ok
test_empty_text_handling (unit.test_chunker.TestStructureAwareChunker.test_empty_text_handling) ... ok
test_in_list_operator (unit.test_eligibility_engine.TestEligibilityEngine.test_in_list_operator) ... ok
test_income_inequality_operator (unit.test_eligibility_engine.TestEligibilityEngine.test_income_inequality_operator) ... ok
test_missing_info_returns_unknown (unit.test_eligibility_engine.TestEligibilityEngine.test_missing_info_returns_unknown) ... ok
test_vidya_deevena_scheme_evaluation (unit.test_eligibility_engine.TestEligibilityEngine.test_vidya_deevena_scheme_evaluation) ... ok
test_mandatory_eligibility_failure_clamps_to_zero (unit.test_recommendation_math.TestRecommendationEngine.test_mandatory_eligibility_failure_clamps_to_zero) ... ok
test_missing_skills_calculation (unit.test_recommendation_math.TestRecommendationEngine.test_missing_skills_calculation) ... ok
test_perfect_match (unit.test_recommendation_math.TestRecommendationEngine.test_perfect_match) ... ok

----------------------------------------------------------------------
Ran 17 tests in 0.001s

OK
==========================================
All 17 Tests Passed Successfully!
==========================================
```

**Result:** 17 of 17 tests pass with zero errors and zero warnings.

---

## 5. Technical Debt & Risks Inventory

1. **Risk 1: Frontend Client-Side Disconnect (High)**
   - *Impact:* The user experiences a demo UI that does not persist data to the database or utilize real AI processing.
   - *Mitigation:* In Phase 3 & 4, wire every Next.js page directly to `ApiClient`, replacing `useState` mock initializers with React Query / SWR / standard `useEffect` fetchers.
2. **Risk 2: In-Memory Data Volatility (High)**
   - *Impact:* Server restarts wipe all uploaded documents, user progress, and chat messages.
   - *Mitigation:* Implement SQLAlchemy 2.0 models and PostgreSQL session adapters connecting to Supabase in Phase 2.
3. **Risk 3: Host Tooling Mismatch (Medium)**
   - *Impact:* Host environment has Python 3.14.4 without global pip dependencies and lacks Node.js in the sandboxed PATH.
   - *Mitigation:* Use Docker containers (`docker-compose.yml`) for running the full stack, or configure isolated user-space virtual environments and Node binaries.
4. **Risk 4: OCR & Multimodal Parsing Realism (Medium)**
   - *Impact:* Scanned physical certificates or PDF forms cannot be read if the upload endpoint only performs string decoding (`decode('utf-8')`).
   - *Mitigation:* Add PyMuPDF for native PDF text extraction and an OCR abstraction service in `apps/api/app/services/document_processing/`.
5. **Risk 5: Missing OpenAI Provider (Low)**
   - *Impact:* If an API key is provided, the factory fails to load `OpenAIProvider`.
   - *Mitigation:* Create `apps/api/app/intelligence/providers/openai_provider.py` with structured output support using official SDK or standard `httpx`.

---

## 6. What Can Be Reused vs. What Needs Implementation

### Reusable Assets (100% Keep)
- Database schema (`supabase/migrations/20261107000001_initial_schema.sql`) and RLS policies (`20261107000002_row_level_security.sql`).
- Authoritative seed dataset (`supabase/seed.sql`).
- Shared contract definitions (`packages/contracts/openapi/openapi.json` and `types/index.ts`).
- Accessibility toolbar and Zustand store (`AccessibilityToolbar.tsx`, `accessibilityStore.ts`).
- Deterministic scheme eligibility engine (`RuleEvaluator`).
- Multi-factor recommendation engine (`RecommendationEngine`).
- Structure-aware chunker (`StructureAwareChunker`).
- Security middleware and PII redaction (`redact_pii`, `assert_resource_owner`, `RequestContextMiddleware`).
- All 17 passing test cases.

### Needs Implementation
- `apps/web/Dockerfile` for Docker container build.
- `apps/api/app/intelligence/providers/openai_provider.py` for real LLM integration.
- Database persistence layer (SQLAlchemy models and session management to replace in-memory dictionaries).
- Document ingestion service using PyMuPDF for native PDFs.
- Connecting frontend pages (`access`, `education`, `schemes`, `opportunities`) to `ApiClient`.
- Supabase Auth client integration on frontend and token validation in API requests.

