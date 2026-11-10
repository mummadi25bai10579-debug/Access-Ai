# REST API Engineering Specification — AccessAI

**Base URL:** `/api/v1`  
**OpenAPI Specification:** 3.1.0 (`packages/contracts/openapi/openapi.json`)  
**Shared TypeScript Types:** `@accessai/contracts` (`packages/contracts/types/index.ts`)  
**Authentication:** Bearer token via Supabase JWT in `Authorization: Bearer <TOKEN>` header.  

---

## 1. Global Request & Response Envelopes

Every API response emitted by AccessAI strictly follows a predictable envelope structure.

### 1.1 Success Envelope
```json
{
  "success": true,
  "data": { ... },
  "request_id": "8f3b14e2-6d2a-4318-b210-449e7b3a98e1",
  "timestamp": "2026-11-07T08:44:00Z"
}
```

### 1.2 Error Envelope
```json
{
  "success": false,
  "error": {
    "code": "DOCUMENT_NOT_FOUND",
    "message": "The requested document was not found or access was denied.",
    "details": {
      "document_id": "d1000000-0000-0000-0000-000000000099"
    }
  },
  "request_id": "8f3b14e2-6d2a-4318-b210-449e7b3a98e1",
  "timestamp": "2026-11-07T08:44:00Z"
}
```

### 1.3 Standard HTTP Response Headers
- `X-Request-ID`: Correlation identifier injected into request context for end-to-end tracing.
- `X-Response-Time-Ms`: Execution duration of the backend pipeline in milliseconds.
- `X-Content-Type-Options: nosniff`: Prevents MIME type sniffing.
- `X-Frame-Options: DENY`: Prevents clickjacking attacks.

---

## 2. API Endpoint Catalogue

### 2.1 System & Operational Health

#### `GET /api/v1/health`
- **Auth:** Public
- **Description:** Returns live operational status, active environment, database connection, and configured AI provider.
- **Response:**
  ```json
  {
    "success": true,
    "data": {
      "status": "healthy",
      "version": "1.0.0",
      "app_env": "development",
      "database": "connected",
      "ai_provider": "mock",
      "architecture": "modular_monolith"
    },
    "request_id": "req-101"
  }
  ```

---

### 2.2 Users & Accessibility Preferences

#### `GET /api/v1/users/me`
- **Auth:** Bearer Token
- **Description:** Retrieves the authenticated citizen's profile attributes.
- **Response:**
  ```json
  {
    "success": true,
    "data": {
      "id": "00000000-0000-0000-0000-000000000001",
      "full_name": "Lakshmi Narayana",
      "education_level": "undergraduate",
      "preferred_language": "te",
      "country_code": "IN",
      "state_code": "AP",
      "annual_family_income": 180000,
      "category": "BC-A",
      "skills": ["Python", "HTML", "CSS", "Problem Solving"]
    },
    "request_id": "req-102"
  }
  ```

#### `PATCH /api/v1/users/me`
- **Auth:** Bearer Token
- **Description:** Updates citizen background for scheme eligibility and career matching.
- **Request Body:**
  ```json
  {
    "annual_family_income": 200000,
    "state_code": "AP",
    "skills": ["Python", "FastAPI", "React"]
  }
  ```

#### `PATCH /api/v1/users/preferences`
- **Auth:** Bearer Token
- **Description:** Persists accessibility settings (font scaling, high contrast, voice narration).
- **Request Body:**
  ```json
  {
    "font_scale": 1.2,
    "high_contrast": true,
    "voice_enabled": true,
    "preferred_output": "text"
  }
  ```

---

### 2.3 Documents & Ingestion (AccessAI)

#### `POST /api/v1/documents/upload`
- **Auth:** Bearer Token
- **Content-Type:** `multipart/form-data`
- **Parameters:**
  - `file`: Binary file (PDF, PNG, JPG, TXT)
  - `language`: Expected language (e.g., `en`, `te`, `hi`)
  - `processing_mode`: `full` | `ocr_only` | `text_only`
- **Response:**
  ```json
  {
    "success": true,
    "data": {
      "document_id": "d1000000-0000-0000-0000-000000000001",
      "filename": "vidya_deevena_circular.pdf",
      "status": "completed",
      "page_count": 3,
      "message": "Document uploaded and indexed successfully."
    },
    "request_id": "req-103"
  }
  ```

#### `GET /api/v1/documents`
- **Auth:** Bearer Token
- **Description:** Lists all documents belonging to the authenticated citizen.

#### `GET /api/v1/documents/{document_id}`
- **Auth:** Bearer Token
- **Description:** Retrieves document metadata and extracted text.

#### `DELETE /api/v1/documents/{document_id}`
- **Auth:** Bearer Token
- **Description:** Deletes a document and cascade deletes its associated vector chunks.

---

### 2.4 Module 01: AccessAI Intelligence

#### `POST /api/v1/access/ask`
- **Auth:** Bearer Token
- **Description:** Executes grounded document Q&A returning verified citations and evidence tier.
- **Request Body:**
  ```json
  {
    "document_id": "d1000000-0000-0000-0000-000000000001",
    "question": "ఈ స్కాలర్‌షిప్ పొందడానికి ఆదాయ పరిమితి ఎంత?",
    "language": "te"
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "data": {
      "answer": "ఈ పథకం ప్రకారం దరఖాస్తుదారుడి కుటుంబ వార్షిక ఆదాయం ₹2,50,000 మించరాదు.",
      "language": "te",
      "confidence": "high",
      "citations": [
        {
          "document_id": "d1000000-0000-0000-0000-000000000001",
          "page_number": 1,
          "chunk_index": 0,
          "quoted_text": "Applicant family annual income to be under ₹2,50,000."
        }
      ],
      "evidence_tier": "document_grounded"
    },
    "request_id": "req-104"
  }
  ```

#### `POST /api/v1/access/simplify`
- **Auth:** Public / Bearer
- **Description:** Transforms legal or bureaucratic text into 6th-grade plain language.
- **Request Body:**
  ```json
  {
    "text": "The statutory entitlement hereby stipulates mandatory remittance prior to fiscal closure.",
    "language": "en"
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "data": {
      "simplified_text": "You must pay your fees before the end of the year to get this benefit.",
      "language": "en"
    },
    "request_id": "req-105"
  }
  ```

---

### 2.5 Module 02: EduBridge

#### `POST /api/v1/education/tutor`
- **Auth:** Bearer Token
- **Description:** Conversational tutoring grounded in course materials and textbooks.
- **Request Body:**
  ```json
  {
    "message": "Explain how for loops work in Python with a real-world example.",
    "course_id": "c1000000-0000-0000-0000-000000000001",
    "difficulty_level": "beginner",
    "language": "en"
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "data": {
      "reply": "Think of a for loop like a teacher taking attendance across a line of students...",
      "concept_tags": ["Loops", "Iteration", "Sequences"],
      "recommended_review_topics": ["List indexing", "Range function"]
    },
    "request_id": "req-106"
  }
  ```

#### `POST /api/v1/education/quiz/generate`
- **Auth:** Bearer Token
- **Description:** Generates structured multiple-choice quiz questions for formative assessment.
- **Request Body:**
  ```json
  {
    "topic": "Python Conditionals",
    "num_questions": 3,
    "difficulty_level": "beginner"
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "data": {
      "topic": "Python Conditionals",
      "questions": [
        {
          "question_id": "q1",
          "question_text": "Which keyword is used for conditional branching in Python?",
          "options": ["if", "condition", "switch", "check"],
          "correct_option_index": 0,
          "explanation": "In Python, 'if' statements evaluate Boolean expressions."
        }
      ]
    },
    "request_id": "req-107"
  }
  ```

---

### 2.6 Module 03: SchemeConnect

#### `GET /api/v1/schemes`
- **Auth:** Public
- **Query Parameters:** `state_code` (optional, e.g., `AP`)
- **Description:** Retrieves authoritative government schemes filtered by jurisdiction.

#### `POST /api/v1/schemes/match`
- **Auth:** Bearer Token
- **Description:** Runs deterministic rule evaluations for all active schemes against user profile.
- **Request Body:**
  ```json
  {
    "profile": {
      "state_code": "AP",
      "annual_family_income": 180000,
      "education_level": "undergraduate"
    },
    "language": "en"
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "data": {
      "matches": [
        {
          "scheme_id": "s1000000-0000-0000-0000-000000000002",
          "scheme_name": "Jagananna Vidya Deevena (RTF)",
          "eligibility_status": "eligible",
          "matched_criteria": [
            "Satisfied: Resident of Andhra Pradesh (User value: AP)",
            "Satisfied: Family income not exceeding ₹2,50,000 (User value: 180000)",
            "Satisfied: Enrolled in higher education (User value: undergraduate)"
          ],
          "unmatched_criteria": [],
          "unknown_criteria": [],
          "official_source": "https://jnanabhumi.ap.gov.in"
        }
      ]
    },
    "request_id": "req-108"
  }
  ```

---

### 2.7 Module 04: OpportunityBridge

#### `POST /api/v1/opportunities/resume/analyze`
- **Auth:** Bearer Token
- **Description:** Parses raw resume text to extract verified skills and education level.
- **Request Body:**
  ```json
  {
    "resume_text": "B.Tech Computer Science student proficient in Python, FastAPI, React, and PostgreSQL."
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "data": {
      "skills": ["Python", "FastAPI", "React", "PostgreSQL"],
      "education_level": "undergraduate",
      "summary": "Detected 4 technical skills with undergraduate background."
    },
    "request_id": "req-109"
  }
  ```

#### `POST /api/v1/opportunities/match`
- **Auth:** Bearer Token
- **Description:** Scores and ranks opportunities using formula $S = w_1E + w_2R + w_3P + w_4F$.
- **Request Body:**
  ```json
  {
    "profile": {
      "skills": ["Python", "FastAPI", "React"],
      "education_level": "undergraduate",
      "state_code": "AP"
    }
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "data": {
      "matches": [
        {
          "opportunity_id": "o1000000-0000-0000-0000-000000000001",
          "title": "AI & Full-Stack Engineering Internship",
          "organization": "AssistiveTech Labs India",
          "match_score": 88.0,
          "matching_skills": ["Python", "FastAPI", "React"],
          "missing_skills": ["TypeScript", "Tailwind CSS"],
          "eligibility_status": "eligible",
          "official_url": "https://example.com/careers/ai-intern",
          "explanation": "Matches 3 of 5 required skills (60% fit)."
        }
      ]
    },
    "request_id": "req-110"
  }
  ```

---

### 2.8 Voice & Speech Services

#### `POST /api/v1/voice/synthesize`
- **Auth:** Public / Bearer
- **Description:** Synthesizes audio narration for generated explanations or summaries.
- **Request Body:**
  ```json
  {
    "text": "మీరు జగనన్న విద్యా దీవెన పథకానికి దరఖాస్తు చేసుకోవడానికి అర్హులు.",
    "language": "te",
    "gender": "female"
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "data": {
      "audio_url": "https://api.accessai.local/audio/synthesized_te_102.mp3",
      "language": "te",
      "text": "మీరు జగనన్న విద్యా దీవెన పథకానికి దరఖాస్తు చేసుకోవడానికి అర్హులు."
    },
    "request_id": "req-111"
  }
  ```

---

## 3. Error Catalogue & HTTP Status Codes

| HTTP Status | Error Code | Description | Mitigation Action |
|---|---|---|---|
| `400 Bad Request` | `VALIDATION_ERROR` | Request payload failed Pydantic schema validation. | Inspect `details` object for invalid field constraints. |
| `401 Unauthorized` | `UNAUTHORIZED` | Supabase JWT token missing or expired. | Refresh authentication session via Supabase Auth. |
| `403 Forbidden` | `FORBIDDEN` | Authenticated user is not the owner of the resource. | Enforces tenant isolation; access denied. |
| `404 Not Found` | `DOCUMENT_NOT_FOUND` | Specified document ID does not exist or was deleted. | Check document identifier or list user documents. |
| `404 Not Found` | `SCHEME_NOT_FOUND` | Scheme ID does not exist in authoritative catalog. | Verify scheme catalog query parameters. |
| `422 Unprocessable`| `INVALID_RULE_SYNTAX` | Rule evaluation criteria contains an unsupported operator. | Use supported operators: `==`, `!=`, `<=`, `>=`, `in`, `contains`. |
| `500 Server Error` | `INTERNAL_SERVER_ERROR`| Unhandled server exception. | Captured with correlation `request_id` in logs. |

