# Product Requirements Document (PRD) — AccessAI

**Product Name:** AccessAI — Universal Access & Opportunity Intelligence Platform  
**Target Audience:** Students, job seekers, and underserved/rural communities across India  
**Architecture:** Modular Monolith (FastAPI + Next.js + Supabase PostgreSQL with pgvector)  
**Accessibility Target:** WCAG 2.2 AA Compliance  
**Supported Languages:** English, Telugu, Hindi, Tamil, Kannada, Malayalam, Bengali, Marathi, Gujarati, Punjabi, Odia  

---

## 1. Executive Summary & Vision

Millions of citizens in India face systemic barriers when accessing government schemes, educational resources, and career opportunities due to complex bureaucratic language, English-only interfaces, inaccessible digital formats, and fragmented systems.

**AccessAI** unifies these disparate services into an AI-native, accessibility-first platform. It operates as a modular monolith where a central intelligence engine (**AccessAI**) powers three specialized domain applications:
1. **EduBridge:** Contextual tutoring, textbook understanding, and knowledge gap learning pathways.
2. **SchemeConnect:** Deterministic eligibility verification and application guidance for official government schemes.
3. **OpportunityBridge:** Structured resume parsing, skill matching, and tailored career/scholarship recommendations.

---

## 2. User Personas

### Persona A: Lakshmi (First-Generation College Student)
- **Background:** Rural Andhra Pradesh, native Telugu speaker, studying computer science.
- **Pain Points:** Struggling with technical English textbooks; misses out on state welfare schemes (like Jagananna Vidya Deevena) due to confusing requirements.
- **AccessAI Solution:** Uploads PDF syllabus/textbook to EduBridge for bilingual explanations; SchemeConnect verifies her family income criteria and generates a clear Telugu document checklist.

### Persona B: Rajesh (Visually Impaired Job Seeker)
- **Background:** Graduate seeking data analysis or developer roles, relies on screen readers.
- **Pain Points:** Most job portals have poor contrast, lack keyboard focus trapping, and scanned PDF forms are unreadable.
- **AccessAI Solution:** Accessible UI with keyboard shortcuts, high-contrast modes, text-to-speech narration, and OpportunityBridge resume skill-gap analysis.

### Persona C: Suresh (Smallholder Farmer / Rural Artisan)
- **Background:** Hindi-speaking, low digital literacy, smartphone user.
- **Pain Points:** Unaware of subsidies (PM-KISAN, artisan loans) and application deadlines.
- **AccessAI Solution:** Voice-based conversational discovery in Hindi; straightforward eligibility checks without legal jargon.

---

## 3. Four Core Product Modules

### Module 01: AccessAI (Central Intelligence Layer)
- **Multimodal Document Parser:** Ingests PDFs, images (JPG/PNG), and plain text.
- **OCR Engine:** Optical Character Recognition for scanned physical notices and certificates.
- **Adaptive Content Transformation:** Generates 5 simultaneous representations from any single document:
  1. Plain language summary (6th-grade reading level).
  2. Native language translation (Telugu, Hindi, Tamil, etc.).
  3. Audio narration (TTS).
  4. Structured key facts & deadlines table.
  5. Actionable document submission checklist.
- **Grounded Q&A (RAG):** Interactive QA grounded strictly in document chunks, returning verified page numbers and quotations.

### Module 02: EduBridge (Educational Access)
- **Contextual Tutor:** Interactive dialogue referencing specific lecture notes and textbooks.
- **Concept Extraction & Difficulty Adaptation:** Explains concepts in "Beginner", "High School", or "Advanced" difficulty.
- **Knowledge-Gap Analyzer:** Identifies missing foundational knowledge from student queries.
- **Automated Quiz & Flashcard Generation:** Tests comprehension with formative feedback.

### Module 03: SchemeConnect (Government Public Services)
- **Authoritative Scheme Repository:** Pre-seeded with verified schemes (e.g., PM-KISAN, NSP scholarships, AP Vidya Deevena).
- **Deterministic Rule Engine:** Evaluates user profile against Boolean and inequality rules:
  - `annual_income <= expected_value`
  - `state == expected_value`
  - `category IN expected_values`
  - `education_level IN expected_values`
- **Zero Hallucination Guarantee:** The system categorizes eligibility strictly into:
  `eligible`, `potentially_eligible`, `not_eligible`, or `insufficient_information`.
- **Application Roadmap:** Step-by-step guidance citing official `.gov.in` portals.

### Module 04: OpportunityBridge (Career & Opportunity)
- **Structured Resume Parser:** Extracts education, skills, projects, and work history.
- **Multi-Factor Recommendation Formula:**
  $$S = w_1E + w_2R + w_3P + w_4F$$
  - $E$: Mandatory eligibility compliance (hard gate).
  - $R$: Semantic similarity between profile and listing requirements.
  - $P$: User location and preference alignment.
  - $F$: Freshness and listing verification score.
- **Skill-Gap Analysis:** Computes missing skills and directly links to EduBridge learning modules to bridge the gap.

---

## 4. Accessibility & Inclusive Design (WCAG 2.2 AA)

1. **Keyboard Accessibility:** Complete keyboard navigation (`Tab`, `Shift+Tab`, `Enter`, `Escape`) with visible focus outlines (`focus-visible:ring-4`).
2. **Dynamic Font Scaling:** Real-time scaling from 100% up to 200% without breaking layouts.
3. **High Contrast Mode:** High contrast toggle meeting minimum contrast ratio 4.5:1 (text) and 3:1 (UI controls).
4. **Multi-sensory Feedback:** Every visual status (Eligible, Pending, Not Eligible) is accompanied by explicit text and icon badges—never color alone.
5. **Speech Synthesis:** Inline audio playback for all explanations and document summaries.

---

## 5. Non-Functional Requirements

- **API Latency:** Health checks < 20ms; RAG retrieval < 800ms; Full generation < 3s.
- **Data Privacy:** User-uploaded documents and profile records are strictly partitioned using PostgreSQL Row-Level Security (`auth.uid() = user_id`).
- **Resilience:** Graceful offline/degraded fallbacks; structured JSON error codes for all API failures.
