# AccessAI — System Architecture & Design Specification

- **Version:** 1.0.0 Production-Ready
- **Pattern:** Modular Monolith with Shared Intelligence Engine
- **Stack:** FastAPI (Python 3.14), Next.js 15 (App Router, React 19, Tailwind CSS), Supabase PostgreSQL (pgvector 384d, RLS), Clerk Auth, Google Gemini AI (`gemini-3.8-flash`, `gemini-embedding-001`).

---

## 1. Architectural Philosophy

AccessAI adheres to strict architectural laws established in `AGENTS.md`:

```
+-------------------------------------------------------------------------------+
|                             Next.js 15 Frontend                               |
|        WCAG 2.2 AA Accessibility Toolbar | Server Components | Client Views   |
+-------------------------------------------------------------------------------+
                                      |
                      HTTPS REST API / Clerk JWT Bearer
                                      v
+-------------------------------------------------------------------------------+
|                              FastAPI Monolith                                 |
|  +-------------------------------------------------------------------------+  |
|  | app/core: Security (RS256 JWKS), CORS, PII Redaction, Rate Limiting    |  |
|  +-------------------------------------------------------------------------+  |
|  | app/intelligence: Shared AI Engine (Gemini, RAG Chunker, Grounding)     |  |
|  +-------------------------------------------------------------------------+  |
|  | Domain Modules:                                                         |  |
|  |   - AccessAI (Doc Ingestion, PDF Extractor, pgvector RAG, Simplifier)   |  |
|  |   - EduBridge (Courses, Lesson Materials, Socratic Tutor, Quizzes)      |  |
|  |   - SchemeConnect (Welfare Directory, Deterministic Rules Engine)       |  |
|  |   - OpportunityBridge (Jobs, Internships, Skill Formula Recommendations)|  |
|  +-------------------------------------------------------------------------+  |
|  | app/database: SQLAlchemy 2.x ORM, Session Pool, Models & Repositories   |  |
+-------------------------------------------------------------------------------+
                                      |
                      PostgreSQL Connection / SSL
                                      v
+-------------------------------------------------------------------------------+
|                          Supabase PostgreSQL DB                                |
|  - 20 Tables with Row Level Security (RLS)                                    |
|  - pgvector Extension: 384-dimensional cosine distance (<=>)                  |
|  - Authoritative Seed Catalog: Schemes, Opportunities, Courses, Data Sources   |
+-------------------------------------------------------------------------------+
```

---

## 2. Shared Intelligence Engine

All generative, embedding, and verification pipelines run through `apps/api/app/intelligence/`:

1. **Provider Factory (`provider_factory.py`):**
   - Routes `gemini` and alias `google` to `GeminiProvider`.
   - Strictly enforces `LLM_API_KEY` presence; raises `ValueError` on missing keys. Never silently degrades to mock in production.
   - Retains `MockAIProvider` exclusively for testing and local sandbox environments.
2. **Embeddings & pgvector:**
   - Generation model: `gemini-3.8-flash`.
   - Embedding model: `gemini-embedding-001` with `output_dimensionality=384`.
   - Task types: `RETRIEVAL_DOCUMENT` for chunk indexing, `RETRIEVAL_QUERY` for search.
   - L2 normalization: All 384-dimensional vectors are normalized to unit length ($\sum x_i^2 = 1.0$), ensuring accurate cosine similarity search in PostgreSQL.
3. **Grounding & Citation Verification (`grounding.py`):**
   - Untrusted document contexts are delimited by `<untrusted_document_context>`.
   - Returned citations are strictly matched against chunk ID and chunk index before being classified as `TIER_2_DOCUMENT` (`document_grounded`). Unmatched citations fall back to `TIER_3_SYNTHETIC` (`ai_generated_explanation`).

---

## 3. Four Core Modules

### 3.1 AccessAI
- **Ingestion Pipeline:** File upload -> size validation (15MB) -> MIME verification -> PDF text extraction via `pypdf` -> `StructureAwareChunker` -> Gemini 384d embeddings -> pgvector storage.
- **RAG Pipeline:** Question -> Gemini query embedding (`RETRIEVAL_QUERY`) -> pgvector cosine similarity search (`<=>`) scoped to `user_id` -> Context injection -> Grounded structured answer.
- **Accessibility:** Browser `window.speechSynthesis` for multilingual read-aloud (English, Telugu, Hindi).

### 3.2 EduBridge
- **Curriculum:** Real courses and lesson materials stored in `courses` and `course_materials`.
- **AI Tutor:** Socratic dialogue with course context injection.
- **Quiz Engine:** Structured question generation with server-side answer evaluation. Client-supplied scores are discarded; server validates option indices deterministically.

### 3.3 SchemeConnect
- **Directory:** Central and state government welfare schemes (PM-KISAN, Jagananna Vidya Deevena, AICTE Pragati, Post-Matric Minority Scholarships).
- **Rule Engine:** Deterministic evaluation of structured rules (`==`, `<=`, `>=`, `in`, `contains`) against citizen profile data. Never hallucinates eligibility.

### 3.4 OpportunityBridge
- **Directory:** Internships, hackathons, and entry-level engineering jobs.
- **Ranking Engine:** Multi-factor score combining hard eligibility gating, requirement coverage, preferred skills, and recency:
  $$S = w_1 E + w_2 R + w_3 P + w_4 F$$
- **Applications & Notifications:** Persistent application records and status notifications.

