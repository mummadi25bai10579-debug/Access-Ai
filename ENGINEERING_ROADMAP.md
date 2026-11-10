# Engineering Implementation Roadmap — AccessAI

**Project:** AccessAI — Universal Access & Opportunity Intelligence Platform  
**Target Milestone:** DataNova Hackathon Production Delivery  
**Methodology:** Incremental Modular Monolith Execution  
**Current Phase:** Phase 0 (Complete — Awaiting Review & Approval)  

---

## Roadmap Overview & Progress Matrix

| Phase | Description | Status | Primary Output | Gate Dependency |
|---|---|---|---|---|
| **Phase 0** | Repository Audit & Engineering Planning | **Complete** | Audit Report, Architecture, 10 Blueprint Specs | — |
| **Phase 1** | Project Foundation & Folder Architecture | **Ready** | Standardized monorepo, contracts build, dockerfile fix | Phase 0 Review |
| **Phase 2** | Database Design & Authentication | Pending | Supabase PostgreSQL schema execution, RLS, Auth flow | Phase 1 |
| **Phase 3** | Shared Frontend Design System | Pending | WCAG 2.2 AA toolbar, accessible UI components, theme engine | Phase 2 |
| **Phase 4** | Backend API Foundation | Pending | FastAPI middleware, Pydantic validation, error handling | Phase 2 |
| **Phase 5** | AI Orchestration Infrastructure | Pending | Provider factory, OpenAI provider, chunker, grounding | Phase 4 |
| **Phase 6** | Module 01: AccessAI Assistant | Pending | Multimodal ingestion, OCR, grounded Q&A, voice narration | Phase 5 |
| **Phase 7** | Module 02: EduBridge | Pending | Contextual tutor, quiz generator, difficulty adaptation | Phase 6 |
| **Phase 8** | Module 03: SchemeConnect | Pending | Deterministic rule engine, verified scheme catalog | Phase 5 |
| **Phase 9** | Module 04: OpportunityBridge | Pending | Resume parser, hybrid ranking formula, skill-gap analysis | Phase 7 & 8 |
| **Phase 10** | Cross-Module Integration | Pending | Dashboard aggregation, unified profile, cross-recommendations | Phase 6-9 |
| **Phase 11** | Testing, Security & Optimization | Pending | Security audit, WCAG audit, performance benchmarks | Phase 10 |
| **Phase 12** | Deployment & Demonstration | Pending | Production build, Docker deployment, video demonstration | Phase 11 |

---

## Detailed Phase Specifications

### Phase 0: Repository Audit & Engineering Planning *(Current)*
- **Objective:** Deep audit of existing repository assets, dependency manifests, tests, schemas, and mock implementations; author the full engineering blueprint suite.
- **Key Deliverables:**
  1. `REPOSITORY_AUDIT.md`: Complete codebase inventory and technical debt log.
  2. `SYSTEM_ARCHITECTURE.md`: Six-tier modular monolith blueprint.
  3. `ENGINEERING_ROADMAP.md`: Sequential 13-phase implementation plan.
  4. `TECH_STACK.md`: Architectural rationale and version requirements.
  5. `DATABASE_DESIGN.md`: Relational schema, pgvector, and RLS policies.
  6. `API_DESIGN.md`: Standard REST envelopes and endpoint contracts.
  7. `MODULE_SPECIFICATIONS.md`: Functional and technical specs for all 4 modules.
  8. `INTEGRATION_PLAN.md`: System integration and provider wiring plan.
  9. `SECURITY_PLAN.md`: Multi-tenant isolation, prompt injection defense, WCAG 2.2 AA.
  10. `IMPLEMENTATION_STATUS.md`: Current implementation status matrix.
- **Verification Gate:** User review and formal approval before writing Phase 1 code.

---

### Phase 1: Project Foundation & Folder Architecture
- **Objective:** Establish clean workspace hygiene, fix configuration gaps, and create build artifacts.
- **Key Tasks:**
  - Create `apps/web/Dockerfile` matching the multi-stage Next.js production build pattern.
  - Standardize dependency manifests in `apps/api/requirements.txt` and `apps/web/package.json`.
  - Validate monorepo workspace references between `packages/contracts` and `apps/web`.
  - Ensure development scripts (`scripts/setup_dev.sh`, `scripts/run_tests.sh`) execute cleanly.
- **Deliverables:** Working Docker build for web and api; valid contracts package export.

---

### Phase 2: Database Design & Authentication
- **Objective:** Implement reliable database persistence and secure multi-tenant identity.
- **Key Tasks:**
  - Verify PostgreSQL 16 + pgvector container initialization via `docker-compose.yml`.
  - Execute migrations `20261107000001_initial_schema.sql` and `20261107000002_row_level_security.sql`.
  - Execute `supabase/seed.sql` to populate authoritative government schemes and opportunities.
  - Implement Supabase Auth JWT validation in FastAPI (`app/core/security.py`) and Next.js client.
  - Replace in-memory dictionaries in repository layer with SQLAlchemy 2.0 / Supabase database client sessions.
- **Deliverables:** Persistent PostgreSQL database; user profiles auto-created on auth trigger; zero cross-tenant vector leakage verified via automated security tests.

---

### Phase 3: Shared Frontend Design System
- **Objective:** Build an accessible, responsive, multilingual frontend UI shell compliant with WCAG 2.2 AA.
- **Key Tasks:**
  - Enhance `AccessibilityToolbar.tsx`: Verify font scale (0.8x-2.0x), high-contrast toggle, and Web Speech API TTS.
  - Implement accessible design tokens in `tailwind.config.ts` with 4.5:1 minimum text contrast ratios.
  - Build reusable UI components (accessible buttons, dialog modals, tab panels, file dropzones, alert banners).
  - Implement full keyboard navigation traps, skip links, and ARIA live regions for screen readers.
- **Deliverables:** Accessible layout shell, verified keyboard navigation, functional accessibility toolbar.

---

### Phase 4: Backend API Foundation
- **Objective:** Solidify API infrastructure, error handling, validation, and request tracing.
- **Key Tasks:**
  - Refine `RequestContextMiddleware` for request ID correlation and response latency headers.
  - Complete Pydantic v2 validation models for all incoming and outgoing payloads.
  - Establish standardized error response envelopes (`ApiErrorResponse`) with error codes.
  - Enforce PII masking (Aadhaar, PAN, tokens) across all application log streams.
- **Deliverables:** Hardened FastAPI gateway; comprehensive OpenAPI documentation at `/docs`.

---

### Phase 5: AI Orchestration Infrastructure
- **Objective:** Implement pluggable, vendor-agnostic AI provider layer and vector search pipeline.
- **Key Tasks:**
  - Implement `OpenAIProvider` in `apps/api/app/intelligence/providers/openai_provider.py` with structured output support.
  - Refine `provider_factory.py` to seamlessly fallback to `MockAIProvider` when `LLM_API_KEY` is omitted.
  - Configure dense embedding generation (384 dimensions) using `sentence-transformers` / OpenAI embeddings.
  - Implement pgvector cosine similarity search queries in `DocumentRepository` filtering strictly by `user_id`.
  - Connect citation grounding and hallucination verification checks.
- **Deliverables:** Pluggable AI engine capable of running in mock, local, or cloud LLM modes.

---

### Phase 6: Module 01 — AccessAI Assistant
- **Objective:** Real multimodal document understanding, plain language simplification, and grounded Q&A.
- **Key Tasks:**
  - Build document upload handler supporting PDFs, PNGs, and JPGs with PyMuPDF text extraction.
  - Implement structure-aware text chunking and vector storage on upload.
  - Wire `/access/ask` to perform vector search, construct untrusted context prompt, and return verified answers.
  - Wire `/access/simplify` to convert complex circulars into 6th-grade plain language representations.
  - Wire frontend `apps/web/src/app/(dashboard)/access/page.tsx` to live backend endpoints via `ApiClient`.
- **Deliverables:** Fully functioning document ingestion, grounded Q&A with page citations, and voice readout.

---

### Phase 7: Module 02 — EduBridge
- **Objective:** Contextual tutoring, difficulty adaptation, formative quizzes, and learning path tracking.
- **Key Tasks:**
  - Wire `/education/tutor` to provide conversational explanations referencing uploaded textbooks.
  - Implement difficulty level controls ("Beginner", "High School", "Advanced").
  - Wire `/education/quiz/generate` to produce structured multiple-choice quizzes with explanations.
  - Implement learning path progression tracker linked to student skill masteries.
  - Wire frontend `apps/web/src/app/(dashboard)/education/page.tsx` to live backend endpoints.
- **Deliverables:** Interactive educational tutor, real-time quiz assessment, and skill mastery tracking.

---

### Phase 8: Module 03 — SchemeConnect
- **Objective:** Deterministic, hallucination-free government scheme discovery and application roadmaps.
- **Key Tasks:**
  - Query seeded government schemes (PM-KISAN, Jagananna Vidya Deevena, AICTE Pragati, NSP).
  - Execute deterministic `RuleEvaluator` against citizen profile attributes (income, state, category, education).
  - Generate human-readable checklists of required official documents.
  - Provide direct links to official government portals (`.gov.in`) with freshness timestamps.
  - Wire frontend `apps/web/src/app/(dashboard)/schemes/page.tsx` to live backend endpoints.
- **Deliverables:** Verified scheme discovery engine with zero generative hallucinations and official citations.

---

### Phase 9: Module 04 — OpportunityBridge
- **Objective:** Structured resume analysis, qualification filtering, and multi-factor opportunity matching.
- **Key Tasks:**
  - Implement resume parser extracting education level and technical skills from uploaded text/PDF.
  - Implement multi-factor scoring formula: $S = w_1E + w_2R + w_3P + w_4F$ with hard eligibility gate.
  - Implement skill-gap analysis linking missing requirements directly to EduBridge study modules.
  - Wire frontend `apps/web/src/app/(dashboard)/opportunities/page.tsx` to live backend endpoints.
- **Deliverables:** Opportunity matching pipeline with explicit match scores, missing skill alerts, and learning links.

---

### Phase 10: Cross-Module Integration
- **Objective:** Unify all four modules into a cohesive user journey on the central dashboard.
- **Key Tasks:**
  - Implement unified user profile syncing preferences, documents, eligibility status, and career goals.
  - Build central dashboard (`/dashboard`) displaying aggregated alerts, upcoming deadlines, and study progress.
  - Connect OpportunityBridge missing skills directly to EduBridge course modules.
  - Provide cross-module voice navigation and multilingual switching.
- **Deliverables:** Seamless multi-module platform workflow verified from registration to opportunity submission.

---

### Phase 11: Testing, Security & Optimization
- **Objective:** End-to-end verification, performance tuning, and compliance audits.
- **Key Tasks:**
  - Expand test suite to cover all edge cases across unit, security, and integration categories.
  - Conduct automated accessibility scans with axe-core; verify zero WCAG 2.2 AA violations.
  - Execute adversarial prompt injection tests against document ingestion endpoints.
  - Benchmark API response latencies and optimize database vector indexes (`IVFFlat`).
- **Deliverables:** 100% passing test suite; WCAG 2.2 AA compliance certificate; security audit log.

---

### Phase 12: Deployment & Hackathon Demonstration
- **Objective:** Containerized production deployment, seed verification, and presentation deliverables.
- **Key Tasks:**
  - Validate full-stack deployment using `docker-compose up --build`.
  - Verify database seeding and automated health checks (`/api/v1/health`).
  - Prepare high-impact demonstration scenarios (Lakshmi persona: Telugu scholarship discovery & resume match).
  - Author comprehensive submission documentation and record end-to-end walkthrough video.
- **Deliverables:** Live containerized application, demonstration script, and final hackathon submission package.

