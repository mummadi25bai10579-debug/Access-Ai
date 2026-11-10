# Technology Stack & Tooling Architecture — AccessAI

**Document Version:** 1.0.0  
**Status:** Approved Architecture  

---

## 1. Core Technology Matrix

| Layer | Technology | Version | Architectural Purpose & Rationale |
|---|---|---|---|
| **Frontend Framework** | Next.js (App Router) | 15.0.3 | Server-side rendering (SSR), static optimization, layout streaming, and fast routing. |
| **UI Library** | React | 19.0.0-rc | Declarative component architecture with concurrent rendering and modern transition primitives. |
| **Programming Language (FE)** | TypeScript | 5.6.3 | Strict static type safety, synchronized with OpenAPI 3.1 backend schemas via `@accessai/contracts`. |
| **Styling & Design System** | Tailwind CSS | 3.4.15 | Utility-first CSS supporting dynamic CSS variables for font scaling (`--font-scale`) and high-contrast theming. |
| **State Management** | Zustand | 5.0.1 | Lightweight, boilerplate-free client state for accessibility toggles (font scale, contrast, audio, language). |
| **Iconography** | Lucide React | 0.454.0 | Accessible SVG iconography for clear visual affordances without relying on color alone. |
| **Voice & Speech** | Web Speech API + Bhashini | Native / REST | Inline client-side Text-to-Speech (TTS) via `SpeechSynthesisUtterance`; cloud fallback for Indic languages. |
| **Backend Framework** | FastAPI | 0.115.0+ | High-throughput asynchronous Python web framework with native Pydantic schema validation and OpenAPI auto-generation. |
| **ASGI Server** | Uvicorn | 0.32.0+ | Lightweight, lightning-fast ASGI server for production Python async execution. |
| **Data Validation** | Pydantic | 2.9.0+ | Strict type validation, serialization, and JSON Schema generation for LLM structured outputs. |
| **Programming Language (BE)** | Python | 3.12 (Docker) / 3.14 (Host) | Standard modern Python runtime; Dockerized to 3.12-slim for maximum dependency stability. |
| **Database Engine** | PostgreSQL | 16.0 | High-reliability ACID relational database with robust transactional guarantees. |
| **Vector Extension** | pgvector | 0.3.5+ / pg16 | In-database dense vector similarity search supporting `VECTOR(384)` and cosine distance indexing (`IVFFlat`). |
| **Database Security** | Row-Level Security (RLS) | Native Postgres | Engine-level multi-tenancy enforcement restricting data access to `auth.uid() = user_id`. |
| **Authentication** | Supabase Auth (JWT) | HS256 / RS256 | Cryptographic token-based identity verification passed via standard HTTP Bearer headers. |
| **Object Storage** | Supabase Storage | S3-compatible | Encrypted private bucket storage for user-uploaded PDFs, certificates, and resumes. |
| **Document Parsing** | PyMuPDF (fitz) | 1.24.11+ | High-speed native PDF parsing extracting text blocks, page bounds, and font hierarchies. |
| **OCR Engine** | PaddleOCR / Tesseract | Latest | Optical character recognition for scanned physical certificates, circulars, and notices. |
| **Dense Embeddings** | Sentence-Transformers | 384 dimensions | `paraphrase-multilingual-MiniLM-L12-v2` supporting cross-lingual semantic search across 50+ languages. |
| **Shared Contracts** | OpenAPI 3.1 + TypeScript | Custom Package | Single source of truth in `packages/contracts` preventing API drift between frontend and backend. |
| **Containerization** | Docker & Docker Compose | 3.8 Spec | Reproducible local runtime orchestrating Postgres (with pgvector), FastAPI, and Next.js. |

---

## 2. Technology Selection Rationale

### Why Next.js 15 for Frontend?
1. **Accessibility Performance:** Fast server rendering minimizes layout shift (CLS), crucial for users relying on screen magnifiers and keyboard navigation.
2. **App Router Modularity:** Distinct sub-routes (`/access`, `/education`, `/schemes`, `/opportunities`) mirror domain monolith boundaries cleanly.
3. **Optimized Client Hydration:** Lightweight React 19 primitives ensure that accessibility toggles (such as font scaling) apply instantly without page reloads.

### Why FastAPI for Backend?
1. **Async AI Orchestration:** Document chunking, embedding generation, LLM streaming, and database queries are I/O bound; Python async/await provides high concurrency.
2. **Deterministic Typing with Pydantic v2:** Pydantic models automatically validate incoming requests and define JSON schemas enforced on AI provider structured outputs.
3. **Modular Monolith Architecture:** FastAPI routers (`APIRouter`) allow clean separation of domain modules while retaining a unified application runtime.

### Why Supabase PostgreSQL + pgvector?
1. **Unified Relational & Vector Store:** Avoids the operational overhead of running a separate vector database (e.g. Pinecone or Qdrant). Relational profile records, scheme rules, and vector chunks live in the same transactional database.
2. **Hard Multi-Tenant Isolation:** Supabase RLS enforces security at the SQL execution layer. Even if an application bug omitted a `user_id` filter, PostgreSQL rejects cross-tenant retrieval.
3. **Deterministic Seedability:** All tables, indexes, and seed datasets are managed via version-controlled SQL files in `supabase/migrations/`.

### Why Pluggable AI Provider Architecture?
1. **Zero External Dependency in CI/Test:** The built-in `MockAIProvider` generates deterministic text completions, quizzes, and 384-dimensional unit vectors derived from text hashes, allowing the full test suite to pass in sandboxed environments without requiring paid API keys.
2. **Zero Vendor Lock-In:** The abstract `AIProvider` class enables instant switching between OpenAI (GPT-4o-mini), Anthropic, local vLLM models (e.g., Llama 3 / Mistral), or Google Gemini.

---

## 3. Dependency Manifest Specifications

### Backend (`apps/api/requirements.txt`)
```text
# Web Framework & Server
fastapi>=0.115.0
uvicorn[standard]>=0.32.0
pydantic>=2.9.0
pydantic-settings>=2.5.0
python-multipart>=0.0.12

# Database & Storage
sqlalchemy>=2.0.35
alembic>=1.13.3
psycopg[binary]>=3.2.3
pgvector>=0.3.5
supabase>=2.9.0

# Security & Auth
pyjwt[crypto]>=2.9.0
passlib[bcrypt]>=1.7.4
httpx>=0.27.2

# AI & Document Processing
pypdf>=5.0.0
pymupdf>=1.24.11

# Testing & Quality
pytest>=8.3.3
pytest-asyncio>=0.24.0
pytest-cov>=5.0.0
ruff>=0.7.0
```

### Frontend (`apps/web/package.json`)
```json
{
  "name": "@accessai/web",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.45.6",
    "clsx": "^2.1.1",
    "lucide-react": "^0.454.0",
    "next": "15.0.3",
    "react": "^19.0.0-rc",
    "react-dom": "^19.0.0-rc",
    "tailwind-merge": "^2.5.4",
    "zustand": "^5.0.1"
  },
  "devDependencies": {
    "@types/node": "^22.9.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "postcss": "^8.4.49",
    "tailwindcss": "^3.4.15",
    "typescript": "^5.6.3"
  }
}
```

---

## 4. Host Environment Compatibility Notes

- **Python Version:** Host machine runs Python 3.14.4. Production containers are pinned to `python:3.12-slim` in `apps/api/Dockerfile` for compatibility with binary C-extensions (`psycopg`, `pymupdf`).
- **Node.js Environment:** Host currently lacks `node`/`npm` in global PATH. The application relies on `docker-compose.yml` for containerized frontend building or local developer installation of Node 20 LTS.

