# AccessAI — Universal Access & Opportunity Intelligence Platform

A unified ecosystem for education, public services, career opportunities, and accessible information, engineered specifically for students and underserved communities across India.

[![Architecture: Modular Monolith](https://img.shields.io/badge/Architecture-Modular%20Monolith-blue.svg)](docs/ARCHITECTURE.md)
[![Compliance: WCAG 2.2 AA](https://img.shields.io/badge/Accessibility-WCAG%202.2%20AA-green.svg)](docs/SECURITY.md)
[![Database: Supabase + pgvector](https://img.shields.io/badge/Database-PostgreSQL%20%2B%20pgvector-336791.svg)](docs/DATABASE.md)
[![Backend: FastAPI](https://img.shields.io/badge/Backend-FastAPI%20%7C%20Python%203.12%2B-009688.svg)](docs/API.md)
[![Frontend: Next.js](https://img.shields.io/badge/Frontend-Next.js%2015%20%7C%20TypeScript-black.svg)](apps/web)

---

## 🌟 The AccessAI Ecosystem

AccessAI consists of **4 Domain Modules** powered by a single **Shared Intelligence Layer**:

```
+-----------------------------------------------------------------------------------+
|                            Presentation Layer (Next.js)                           |
|       Universal Dashboard · Voice Interface · High Contrast · Multi-Language     |
+-----------------------------------------------------------------------------------+
|                        API & Security Gateway (FastAPI)                           |
|         Supabase Auth · JWT Verification · Role-Based Access · Rate Limiter       |
+-----------------------------------------------------------------------------------+
|                            Shared Intelligence Layer                              |
|   Multilingual Engine · RAG & Retrieval · Vision/OCR · Recommendation Formulas    |
+-----------------------------------------------------------------------------------+
|  [01] AccessAI        |  [02] EduBridge     | [03] SchemeConnect | [04] OppBridge |
|  Central Document Q&A |  Contextual Tutoring| Verified Schemes   | Skill Matching |
|  Simplification & TTS |  Quizzes & Pathways | Deterministic Rules| Gap Analysis   |
+-----------------------------------------------------------------------------------+
|                           Data & Persistence Layer                                |
|         PostgreSQL · pgvector (384-dim) · Row Level Security · Supabase           |
+-----------------------------------------------------------------------------------+
```

### Module Breakdown
1. **AccessAI (Central Intelligence)**: Multimodal document parser (PDF, scanned images, text), multilingual translation across 11 Indian languages, simplification, and document-grounded question answering with precise page citations.
2. **EduBridge (Educational Access)**: Contextual tutoring grounded in uploaded textbooks/notes, automatic concept extraction, personalized learning paths, and knowledge gap quizzes.
3. **SchemeConnect (Public Services)**: Deterministic eligibility matching for verified Central and State government schemes (PM-KISAN, NSP, Vidya Deevena) using authoritative rules—strictly avoiding LLM hallucinations.
4. **OpportunityBridge (Career & Opportunity)**: Structured resume parser, skill extraction, deterministic qualification filtering, and multi-factor ranking formula:
   $$S = w_1E + w_2R + w_3P + w_4F$$

---

## 📁 Repository Structure

```
accessai/
├── apps/
│   ├── web/                     # Next.js 15 + TypeScript accessible frontend
│   └── api/                     # FastAPI modular monolith backend
├── packages/
│   └── contracts/               # OpenAPI 3.1 definitions & TypeScript types
├── supabase/
│   ├── migrations/              # Version-controlled SQL schema + RLS policies
│   ├── seed.sql                 # Authoritative scheme and opportunity seed data
│   └── config.toml              # Supabase CLI config
├── docs/                        # Formal engineering blueprints & specifications
│   ├── PRD.md                   # Product requirements document
│   ├── ARCHITECTURE.md          # System architecture & module boundaries
│   ├── DATABASE.md              # Relational model, pgvector & RLS policies
│   ├── API.md                   # Complete REST endpoint catalogue & contracts
│   ├── AI_PIPELINE.md           # RAG, multilingual translation & recommendation math
│   ├── SECURITY.md              # RLS isolation, prompt injection defense, WCAG 2.2 AA
│   ├── EVALUATION.md            # Benchmark metrics (Recall@K, MRR, Precision@K)
│   ├── ROADMAP.md               # 10-phase sequential execution roadmap
│   └── CHANGELOG.md             # Version history
├── scripts/                     # Developer setup and test automation scripts
├── docker-compose.yml           # Local full-stack runtime with PostgreSQL + pgvector
├── .env.example                 # Environment configuration template
└── README.md
```

---

## 🚀 Quickstart

### Prerequisites
- Python 3.12+ (or 3.14)
- Node.js 20+ & pnpm
- Docker & Docker Compose (optional for local pgvector)

### 1. Setup Environment
```bash
cp .env.example .env
```

### 2. Run API Backend
```bash
cd apps/api
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
Visit API Documentation: `http://localhost:8000/docs`
Check Health: `http://localhost:8000/api/v1/health`

### 3. Run Web Application
```bash
cd apps/web
pnpm install
pnpm dev
```
Open `http://localhost:3000`

---

## 🔒 Security & Privacy Guarantees
- **Row-Level Security (RLS)**: Mandatory `auth.uid() = user_id` isolation across all user tables and document chunks.
- **Untrusted Input Sandboxing**: Uploaded PDFs and external web sources are treated as untrusted text with strict prompt boundary separators (`<untrusted_document_context>`).
- **Verified Sources Only**: Government scheme eligibility is executed deterministically via structured criteria engines, never by allowing an LLM to invent rules or claim benefits.
