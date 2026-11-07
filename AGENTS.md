# Agent Operating Guidelines — AccessAI

This document defines the architectural laws and behavioral constraints for any autonomous agent or human developer contributing to AccessAI.

---

## 🏛️ Non-Negotiable Architectural Laws

1. **Modular Monolith, Not Microservices**
   - All modules (`access`, `education`, `schemes`, `opportunities`) reside within `apps/api/app/modules/`.
   - Domain modules communicate via explicit Python service interfaces, never by reaching directly into another module's database tables or internal repositories.

2. **AccessAI is the Shared Intelligence Engine**
   - AccessAI provides the shared OCR, multimodal parsing, multilingual translation, speech synthesis, and RAG retrieval services located in `apps/api/app/intelligence/`.
   - The other three modules (`EduBridge`, `SchemeConnect`, `OpportunityBridge`) consume these services; they do not reinvent their own LLM prompt pipelines.

3. **Deterministic Rules Over Generative Hallucination**
   - In `SchemeConnect`: Eligibility must be evaluated against structured criteria tables (`scheme_eligibility_rules`). Never allow an LLM to guess, invent eligibility rules, or promise benefits to a citizen.
   - In `OpportunityBridge`: Hard filters (education level, location, deadline) precede semantic similarity scoring. Recommendations must combine formula factors ($S = w_1E + w_2R + w_3P + w_4F$) and include explicit human-readable reasons.

4. **Multi-Tenancy & Data Isolation**
   - Supabase Row-Level Security (RLS) is enabled on every user-owned table.
   - User identity is validated using Supabase JWTs (`auth.uid()`).
   - Document chunk searches (`document_chunks`) must include a strict `WHERE user_id = :current_user_id` constraint to prevent cross-tenant vector leakage.

5. **WCAG 2.2 AA Accessibility Baseline**
   - UI elements must provide semantic HTML, high contrast mode, ARIA labels, full keyboard navigation (focus indicators), and font scaling up to 200%.
   - Screen reader announcements and text-to-speech must be first-class citizens throughout every workflow.

---

## 🛠️ Module Directory Structure Rules

```
apps/api/app/
├── api/             # HTTP routing, validation, parameter extraction (NO business logic)
├── core/            # Security, middleware, logging, global error handling
├── modules/         # Domain-specific business logic & repository access
├── intelligence/    # Shared AI, providers, prompt templates, RAG chunking & vectors
├── services/        # Reusable infrastructure (OCR, storage, speech, translation)
└── database/        # Database models, migrations, DB connection pool
```

Whenever adding a new capability, place code according to this exact separation.
