# Changelog — AccessAI

All notable engineering changes to the AccessAI platform will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.1.0-alpha] - 2026-11-07

### Added
- **Monorepo Architecture:** Established production-grade monorepo containing `apps/web` (Next.js 15), `apps/api` (FastAPI), `packages/contracts`, `supabase`, and `docs`.
- **Database Engineering Foundation:**
  - Designed core schema in `supabase/migrations/20261107000001_initial_schema.sql` supporting 15 primary relational tables and pgvector (`VECTOR(384)`).
  - Authored comprehensive Row-Level Security policies in `supabase/migrations/20261107000002_row_level_security.sql`.
  - Created authoritative seed dataset in `supabase/seed.sql` featuring real government schemes (PM-KISAN, National Scholarship Portal, AP Vidya Deevena) and opportunity taxonomies.
- **Backend Architecture (FastAPI):**
  - Configured modular monolith with isolated routers for all 4 product modules (`access`, `education`, `schemes`, `opportunities`).
  - Added centralized configuration management (`app/config.py`) and standard JSON response envelopes.
  - Implemented structured logging with PII masking and request ID tracking middleware.
  - Implemented operational `/health` endpoint and mockable intelligence service layer.
- **Frontend Architecture (Next.js 15):**
  - Configured accessible UI shell featuring WCAG 2.2 AA compliant toolbar (font scaling, high contrast, multilingual selector, voice narration).
  - Scaffolded dashboard, document studio, contextual tutor, scheme matcher, and opportunity explorer pages.
- **Contracts & Shared Types:**
  - Exported OpenAPI 3.1 specification and generated TypeScript contracts in `packages/contracts`.
- **Engineering Documentation:**
  - Authored PRD, ARCHITECTURE, DATABASE, API, AI_PIPELINE, SECURITY, EVALUATION, and ROADMAP specifications.
