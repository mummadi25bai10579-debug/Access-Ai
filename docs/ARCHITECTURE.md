# System Architecture — AccessAI

AccessAI is engineered as a **Modular Monolith** with a single FastAPI backend and a Next.js 15 frontend, maintaining strict domain boundaries while sharing a high-performance intelligence layer.

---

## 1. Six-Tier Architectural Diagram

```
+-----------------------------------------------------------------------------------------+
|                                1. PRESENTATION LAYER                                    |
|   Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS · Accessible UI Shell  |
|   - Universal Dashboard   - Voice Transcriber / TTS   - Accessibility Controls Toolbar  |
|   - High Contrast Engine  - Screen-Reader ARIA Live   - Font Scaling (1.0x - 2.0x)      |
+-----------------------------------------------------------------------------------------+
                                          |
                                   HTTPS / REST API
                                          |
+-----------------------------------------------------------------------------------------+
|                               2. API & SECURITY GATEWAY                                 |
|   FastAPI · Supabase JWT Authentication · RBAC · Rate Limiting · Request ID Correlation |
|   - Middleware: RequestID, SecurityHeaders, ErrorHandler, LoggingMiddleware             |
|   - Dependency Injection: CurrentUser, DatabaseSession, Orchestrator, StorageService     |
+-----------------------------------------------------------------------------------------+
                                          |
+-----------------------------------------------------------------------------------------+
|                             3. SHARED INTELLIGENCE LAYER                                |
|   Reusable Platform AI Services                                                         |
|   +-----------------------+ +------------------------+ +------------------------------+ |
|   | AI Orchestrator       | | RAG & Vector Retrieval | | Multilingual Translation     | |
|   | (Intent & Routing)    | | (pgvector 384-dim)     | | (11 Indic Languages)         | |
|   +-----------------------+ +------------------------+ +------------------------------+ |
|   +-----------------------+ +------------------------+ +------------------------------+ |
|   | Vision & OCR Engine   | | Speech (STT / TTS)     | | Recommendation Math Engine   | |
|   | (PaddleOCR / PyMuPDF) | | (Bhashini / WebSpeech) | | (Multi-Factor Scoring)       | |
|   +-----------------------+ +------------------------+ +------------------------------+ |
|   +-----------------------------------------------------------------------------------+ |
|   | Trust & Grounding Engine (Source Attributions, Citation Validation, Anti-Hallucin)| |
+-----------------------------------------------------------------------------------------+
                                          |
       +--------------------+-------------+---------------+--------------------+
       |                    |                             |                    |
+--------------+   +-------------------+         +-----------------+   +------------------+
| 4A. AccessAI |   | 4B. EduBridge     |         | 4C. SchemeCon   |   | 4D. OppBridge    |
| Universal    |   | Contextual Tutor  |         | Deterministic   |   | Resume Parser    |
| Document Q&A |   | Concept Extractor |         | Eligibility     |   | Skill Gap Match  |
| Translation  |   | Quiz Generator    |         | Scheme Rules    |   | Ranking Engine   |
| Audio Summary|   | Learning Pathways |         | Official Docs   |   | Opportunity Feed |
+--------------+   +-------------------+         +-----------------+   +------------------+
       |                    |                             |                    |
+-----------------------------------------------------------------------------------------+
|                            5. DATA ACCESS & REPOSITORIES                                |
|   SQLAlchemy 2.0 Repositories · Abstract Repository Interfaces · Unit of Work           |
|   - DocumentRepo · ConversationRepo · SchemeRepo · OpportunityRepo · UserRepo           |
+-----------------------------------------------------------------------------------------+
                                          |
+-----------------------------------------------------------------------------------------+
|                            6. PERSISTENCE & INTEGRATIONS                                |
|   - PostgreSQL 16 + pgvector (Supabase Managed / Local Container)                       |
|   - Supabase Storage (Private Encrypted Buckets with Signed URLs)                       |
|   - External Authoritative Feeds (National Scholarship Portal, myScheme, Official APIs) |
+-----------------------------------------------------------------------------------------+
```

---

## 2. Domain Separation Rules

To prevent spaghetti dependencies inside the monolith:

1. **`apps/api/app/modules/` owns domain business rules:**
   - `access/`: Manages document lifecycle, OCR extraction jobs, document QA logic.
   - `education/`: Manages study progress, tutor dialogues, quiz state, and learning path graphs.
   - `schemes/`: Implements deterministic rules (`evaluate_criteria()`), scheme matching, and state portals.
   - `opportunities/`: Implements resume parsing, skill matching vectors, and vacancy ranking.

2. **`apps/api/app/intelligence/` owns shared AI machinery:**
   - Modules call the intelligence layer through explicit interfaces (e.g., `ai_orchestrator.ask_document(...)` or `recommendation_engine.rank(...)`).
   - Intelligence services do not directly query module-specific database tables; repositories provide the data context.

3. **`apps/api/app/api/` handles only HTTP serialization:**
   - Parameter extraction, schema validation via Pydantic, HTTP status codes, and error formatting.
   - Zero business logic is written in route handler functions.

---

## 3. Trust & Grounding Architecture

Every answer produced by AccessAI carries a **Verification Tier**:

| Level | Evidence Source | UI Presentation | Guarantee |
|---|---|---|---|
| **Tier 1: Verified Official** | Official `.gov.in` source or accredited scholarship provider | Green Verified Badge + Official Link | 100% Grounded in Rule Criteria |
| **Tier 2: Document Grounded** | User-uploaded PDF / Image with chunk match | Blue Document Badge + Page & Chunk Quotation | Explicit quote from user's file |
| **Tier 3: AI Synthetic** | General educational explanation or summary | Amber Notice "AI Generated Explanation" | Conceptual guidance; verify before submission |
| **Tier 4: Unavailable** | Information missing from knowledge base | Neutral Card "Information Unavailable" | Strict refusal to guess or hallucinate |
