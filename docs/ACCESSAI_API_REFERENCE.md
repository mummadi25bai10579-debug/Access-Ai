# AccessAI — API Reference & Endpoint Specification

- **Base URL:** `/api/v1`
- **Authentication:** `Authorization: Bearer <clerk_jwt>` on all protected endpoints.
- **Content Types:** `application/json`, `multipart/form-data` for file uploads.

---

## 1. Authentication & Users (`/users`, `/profile`)

### `GET /users/me`
- **Auth:** Required
- **Description:** Returns the authenticated citizen's profile details.
- **Response:**
  ```json
  {
    "success": true,
    "data": {
      "id": "uuid",
      "clerk_user_id": "user_...",
      "full_name": "Citizen",
      "email": "user@example.com",
      "state_code": "AP",
      "annual_family_income": 180000,
      "education_level": "undergraduate",
      "skills": ["Python", "FastAPI"]
    }
  }
  ```

### `GET /users/dashboard/stats`
- **Auth:** Required
- **Description:** Returns aggregated counts for active schemes, opportunities, uploaded documents, course progress, and unread notifications.

### `PUT /users/profile`
- **Auth:** Required
- **Description:** Updates profile fields (full name, state code, income, education level, category).

---

## 2. Documents & Ingestion (`/documents`)

### `POST /documents/upload`
- **Auth:** Required
- **Content-Type:** `multipart/form-data`
- **Parameters:**
  - `file`: Binary file (`.pdf`, `.txt`, `.md`, `.json`, `.csv`, max 15MB)
  - `language`: `en` (default)
  - `processing_mode`: `full`
- **Description:** Validates file size, extracts text (via `pypdf` for PDF), chunks content, computes Gemini 384d embeddings (`RETRIEVAL_DOCUMENT`), and persists chunks to PostgreSQL pgvector.

### `GET /documents`
- **Auth:** Required
- **Description:** Lists all documents belonging to the authenticated user.

### `GET /documents/{document_id}`
- **Auth:** Required
- **Description:** Retrieves document metadata and extracted text.

### `DELETE /documents/{document_id}`
- **Auth:** Required
- **Description:** Deletes document and cascading vector chunks. Strict user ownership enforced.

---

## 3. AccessAI Intelligence (`/access`)

### `POST /access/ask`
- **Auth:** Required
- **Body:**
  ```json
  {
    "document_id": "uuid",
    "question": "What is the application deadline?",
    "language": "en"
  }
  ```
- **Description:** Computes query embedding (`RETRIEVAL_QUERY`), performs pgvector cosine similarity search (`<=>`), constructs grounded context, and generates answer with structured citations.

### `POST /access/simplify`
- **Auth:** Public / Optional
- **Body:** `{"text": "Complex government circular text...", "language": "en"}`
- **Description:** Rewrites input text to plain 6th-grade language.

### `POST /access/translate`
- **Auth:** Public / Optional
- **Body:** `{"text": "Text to translate", "target_language": "te"}`
- **Description:** Translates text to Indian regional languages.

### `POST /access/describe-image`
- **Auth:** Public / Optional
- **Body:** `{"image_base64": "..."}`
- **Description:** Multimodal OCR and accessibility captioning. Returns `BLOCKED` if Gemini Vision key is unconfigured.

---

## 4. EduBridge (`/education`)

### `GET /education/courses`
- **Auth:** Public
- **Description:** Lists all active courses.

### `POST /education/tutor`
- **Auth:** Required
- **Body:** `{"message": "Explain loops", "course_id": "uuid", "language": "en", "difficulty_level": "beginner"}`
- **Description:** Socratic AI tutor dialogue grounded in course curriculum.

### `POST /education/quiz/generate`
- **Auth:** Public / Optional
- **Body:** `{"topic": "Python Functions", "num_questions": 3, "difficulty_level": "beginner"}`
- **Description:** Generates structured multiple-choice quiz questions.

### `POST /education/quiz/submit`
- **Auth:** Required
- **Body:**
  ```json
  {
    "course_id": "uuid",
    "answers": [
      {
        "question_id": "q1",
        "selected_option_index": 1,
        "correct_option_index": 1,
        "explanation": "..."
      }
    ]
  }
  ```
- **Description:** Evaluates submitted answers on the server, calculates score deterministically, generates gap analysis, and records attempt.

### `GET /education/progress`
- **Auth:** Required
- **Description:** Retrieves user learning progress and mastery score.

---

## 5. SchemeConnect (`/schemes`)

### `GET /schemes`
- **Auth:** Public
- **Query Params:** `state_code` (`AP`, `CENTRAL`)
- **Description:** Lists active welfare schemes.

### `GET /schemes/{scheme_id}`
- **Auth:** Public
- **Description:** Returns scheme details, required documents, and eligibility rules.

### `POST /schemes/match`
- **Auth:** Public / Optional
- **Body:** `{"profile": {"state_code": "AP", "annual_family_income": 180000, "education_level": "undergraduate"}}`
- **Description:** Deterministically evaluates citizen profile against all active schemes.

### `POST /schemes/{scheme_id}/check-eligibility`
- **Auth:** Public / Optional
- **Body:** `{"profile": { ... }}`
- **Description:** Evaluates single scheme eligibility with rule breakdown.

---

## 6. OpportunityBridge (`/opportunities`)

### `GET /opportunities`
- **Auth:** Public
- **Query Params:** `opportunity_type` (`job`, `internship`, `hackathon`, `all`)
- **Description:** Lists active career opportunities.

### `GET /opportunities/{opportunity_id}`
- **Auth:** Public
- **Description:** Retrieves detailed opportunity record.

### `POST /opportunities/{opportunity_id}/apply`
- **Auth:** Required
- **Body:** `{"notes": "Application cover note"}`
- **Description:** Records user application in PostgreSQL.

### `POST /opportunities/match`
- **Auth:** Public / Optional
- **Body:** `{"profile": {"skills": ["Python", "React"], "education_level": "undergraduate"}}`
- **Description:** Ranks opportunities using formula $S = w_1E + w_2R + w_3P + w_4F$.

---

## 7. Notifications (`/notifications`)

### `GET /notifications`
- **Auth:** Required
- **Description:** Lists user notifications.

### `POST /notifications/{id}/read`
- **Auth:** Required
- **Description:** Marks notification as read.

