# AccessAI — Database Reference & Schema Specification

**Database Engine:** PostgreSQL 16+ with `pgvector` Extension  
**ORM / Data Layer:** SQLAlchemy 2.0 (Async/Sync pooling) with declarative models in `apps/api/app/database/models/`  
**Authentication Authority:** Clerk Identity (mapped to `profiles.clerk_user_id`)  
**Access Control:** Row-Level Security (RLS) on all user-owned tables + Explicit repository-level tenant scoping

---

## 1. Relational Entity Overview

The AccessAI database architecture consists of 20 tables organized into 5 functional domains:

```
+-----------------------------------------------------------------------------------+
|                                  IDENTITY & TENANCY                               |
|  [profiles] <----+ 1:N +--- [user_preferences]                                    |
|                  +----+ 1:N +--- [user_skills]                                     |
|                  +----+ 1:N +--- [notifications]                                   |
|                  +----+ 1:N +--- [audit_events]                                    |
+-----------------------------------------------------------------------------------+
                                   |
                                   | 1:N (owner / actor)
                                   v
+-----------------------------------------------------------------------------------+
|                        MODULE 01: ACCESSAI INTELLIGENCE                           |
|  [data_sources] ---> [documents] <--- 1:N ---> [document_chunks] (pgvector 384d)   |
|                            |                                                      |
|                            +--- 1:N ---> [processing_jobs]                        |
|                                                                                   |
|  [conversations] <--- 1:N ---> [messages]                                         |
+-----------------------------------------------------------------------------------+
                                   |
                                   v
+-----------------------------------------------------------------------------------+
|                          MODULE 02: EDUBRIDGE                                     |
|  [courses] <--- 1:N ---> [course_materials]                                       |
|      |                                                                            |
|      +--- 1:N ---> [learning_progress] (user_id -> profiles)                       |
|      +--- 1:N ---> [quiz_attempts] (user_id -> profiles)                          |
+-----------------------------------------------------------------------------------+
                                   |
                                   v
+-----------------------------------------------------------------------------------+
|                         MODULE 03: SCHEMECONNECT                                  |
|  [schemes] <--- 1:N ---> [scheme_eligibility_rules] (deterministic criteria)      |
+-----------------------------------------------------------------------------------+
                                   |
                                   v
+-----------------------------------------------------------------------------------+
|                        MODULE 04: OPPORTUNITYBRIDGE                               |
|  [opportunities] <--- 1:N ---> [applications] (user_id -> profiles)               |
|         |                                                                         |
|         +--- 1:N ---> [recommendations] (user_id -> profiles)                     |
+-----------------------------------------------------------------------------------+
```

---

## 2. Table Specifications

### 2.1 Identity & Platform Management

#### `profiles`
Primary identity bridge linking Clerk authenticated subjects to internal database records.
- `id` (UUID, PK, default `gen_random_uuid()`)
- `clerk_user_id` (VARCHAR(128), UNIQUE, NOT NULL, indexed)
- `email` (VARCHAR(255), NULLABLE)
- `full_name` (VARCHAR(255), DEFAULT 'Citizen')
- `state_code` (VARCHAR(10), DEFAULT 'AP')
- `annual_family_income` (NUMERIC(12, 2), DEFAULT 0.0)
- `education_level` (VARCHAR(50), DEFAULT 'undergraduate')
- `category` (VARCHAR(50), DEFAULT 'General')
- `skills` (JSONB, DEFAULT `[]`)
- `accessibility_preferences` (JSONB, DEFAULT `{}`)
- `created_at` (TIMESTAMPTZ, DEFAULT `now()`)
- `updated_at` (TIMESTAMPTZ, DEFAULT `now()`)

#### `user_preferences`
Persistent user accessibility and interface preferences.
- `id` (UUID, PK)
- `user_id` (UUID, FK -> `profiles.id` ON DELETE CASCADE, UNIQUE)
- `voice_enabled` (BOOLEAN, DEFAULT FALSE)
- `simplified_language` (BOOLEAN, DEFAULT FALSE)
- `high_contrast` (BOOLEAN, DEFAULT FALSE)
- `font_scale` (NUMERIC(3, 2), DEFAULT 1.0)
- `preferred_language` (VARCHAR(10), DEFAULT 'en')
- `preferred_output` (VARCHAR(20), DEFAULT 'text')

#### `notifications`
In-app citizen alerts for scheme deadlines, application status updates, and quiz feedback.
- `id` (UUID, PK)
- `user_id` (UUID, FK -> `profiles.id` ON DELETE CASCADE, index)
- `title` (VARCHAR(255), NOT NULL)
- `message` (TEXT, NOT NULL)
- `notification_type` (VARCHAR(50), DEFAULT 'system')
- `read_at` (TIMESTAMPTZ, NULLABLE)
- `created_at` (TIMESTAMPTZ, DEFAULT `now()`)

#### `audit_events`
Immutable security and audit logging trail.
- `id` (UUID, PK)
- `user_id` (UUID, FK -> `profiles.id`, NULLABLE)
- `action` (VARCHAR(100), NOT NULL)
- `resource_type` (VARCHAR(50), NOT NULL)
- `resource_id` (VARCHAR(100), NULLABLE)
- `details` (JSONB, DEFAULT `{}`)
- `ip_address` (VARCHAR(45), NULLABLE)
- `created_at` (TIMESTAMPTZ, DEFAULT `now()`)

---

### 2.2 AccessAI Document Intelligence & RAG

#### `data_sources`
Tracks trusted source organizations, authorities, and crawlers.
- `id` (UUID, PK)
- `name` (VARCHAR(255), NOT NULL)
- `source_type` (VARCHAR(50), NOT NULL)
- `base_url` (VARCHAR(500), NULLABLE)
- `metadata` (JSONB, DEFAULT `{}`)
- `created_at` (TIMESTAMPTZ, DEFAULT `now()`)

#### `documents`
Uploaded and ingested documents.
- `id` (UUID, PK)
- `user_id` (UUID, FK -> `profiles.id` ON DELETE CASCADE, index)
- `filename` (VARCHAR(255), NOT NULL)
- `storage_path` (VARCHAR(500), NOT NULL)
- `mime_type` (VARCHAR(100), NOT NULL)
- `extracted_text` (TEXT, NULLABLE)
- `page_count` (INTEGER, DEFAULT 1)
- `status` (VARCHAR(50), DEFAULT 'uploaded') — (`uploaded` -> `processing` -> `completed` / `failed`)
- `error_message` (TEXT, NULLABLE)
- `metadata` (JSONB, DEFAULT `{}`)
- `created_at` (TIMESTAMPTZ, DEFAULT `now()`)
- `updated_at` (TIMESTAMPTZ, DEFAULT `now()`)

#### `document_chunks`
Vector-indexed semantic text segments for pgvector retrieval.
- `id` (UUID, PK)
- `document_id` (UUID, FK -> `documents.id` ON DELETE CASCADE, index)
- `user_id` (UUID, FK -> `profiles.id` ON DELETE CASCADE, index)
- `chunk_index` (INTEGER, NOT NULL)
- `content` (TEXT, NOT NULL)
- `embedding` (VECTOR(384), NULLABLE)
- `page_number` (INTEGER, DEFAULT 1)
- `language` (VARCHAR(10), DEFAULT 'en')
- `created_at` (TIMESTAMPTZ, DEFAULT `now()`)

*Vector Index:* HNSW or IVFFlat index on `embedding vector_cosine_ops`.

#### `processing_jobs`
Asynchronous job tracking for extraction and OCR pipelines.
- `id` (UUID, PK)
- `document_id` (UUID, FK -> `documents.id` ON DELETE CASCADE)
- `job_type` (VARCHAR(50), NOT NULL)
- `status` (VARCHAR(50), DEFAULT 'pending')
- `progress` (INTEGER, DEFAULT 0)
- `created_at` (TIMESTAMPTZ, DEFAULT `now()`)

#### `conversations` & `messages`
Persistent multi-turn chat dialogues for Document RAG and EduBridge Tutor.
- `conversations`: `id` (UUID, PK), `user_id` (UUID, FK), `title` (VARCHAR(255)), `module` (VARCHAR(50)), `created_at`.
- `messages`: `id` (UUID, PK), `conversation_id` (UUID, FK), `role` (VARCHAR(20)), `content` (TEXT), `citations` (JSONB), `created_at`.

---

### 2.3 EduBridge Learning Engine

#### `courses`
Curriculum courses and textbooks.
- `id` (UUID, PK)
- `title` (VARCHAR(255), NOT NULL)
- `description` (TEXT, NULLABLE)
- `language` (VARCHAR(10), DEFAULT 'en')
- `difficulty_level` (VARCHAR(50), DEFAULT 'beginner')
- `metadata` (JSONB, DEFAULT `{"topics": [...]}`)
- `created_at` (TIMESTAMPTZ, DEFAULT `now()`)

#### `course_materials`
Structured chapters, lesson modules, and transcripts.
- `id` (UUID, PK)
- `course_id` (UUID, FK -> `courses.id` ON DELETE CASCADE, index)
- `title` (VARCHAR(255), NOT NULL)
- `content` (TEXT, NOT NULL)
- `order_index` (INTEGER, DEFAULT 0)
- `created_at` (TIMESTAMPTZ, DEFAULT `now()`)

#### `learning_progress`
Individual student mastery tracking.
- `id` (UUID, PK)
- `user_id` (UUID, FK -> `profiles.id` ON DELETE CASCADE, index)
- `course_id` (UUID, FK -> `courses.id` ON DELETE CASCADE, index)
- `progress` (NUMERIC(5, 2), DEFAULT 0.0)
- `mastery_score` (NUMERIC(5, 2), DEFAULT 0.0)
- `current_topic` (VARCHAR(255), DEFAULT 'Not Started')
- `updated_at` (TIMESTAMPTZ, DEFAULT `now()`)

#### `quiz_attempts`
Formative comprehension assessments evaluated on the server.
- `id` (UUID, PK)
- `user_id` (UUID, FK -> `profiles.id` ON DELETE CASCADE, index)
- `course_id` (UUID, FK -> `courses.id`, NULLABLE, index)
- `score` (NUMERIC(5, 2), NOT NULL)
- `total_questions` (INTEGER, NOT NULL)
- `gap_analysis` (JSONB, DEFAULT `[]`)
- `created_at` (TIMESTAMPTZ, DEFAULT `now()`)

---

### 2.4 SchemeConnect Welfare Intelligence

#### `schemes`
Central and state welfare programs.
- `id` (UUID, PK)
- `name` (VARCHAR(255), NOT NULL)
- `description` (TEXT, NOT NULL)
- `official_url` (VARCHAR(500), NOT NULL)
- `state_code` (VARCHAR(10), NULLABLE) — `NULL` denotes Central Government Scheme.
- `required_documents` (JSONB, DEFAULT `[]`)
- `status` (VARCHAR(50), DEFAULT 'active')
- `created_at` (TIMESTAMPTZ, DEFAULT `now()`)

#### `scheme_eligibility_rules`
Deterministic Boolean and relational rules evaluated by `RuleEvaluator`.
- `id` (UUID, PK)
- `scheme_id` (UUID, FK -> `schemes.id` ON DELETE CASCADE, index)
- `rule_key` (VARCHAR(100), NOT NULL) — e.g. `annual_family_income`, `education_level`, `state_code`.
- `operator` (VARCHAR(10), NOT NULL) — (`==`, `!=`, `<=`, `>=`, `<`, `>`, `in`, `contains`).
- `expected_value` (VARCHAR(255), NOT NULL)
- `is_mandatory` (BOOLEAN, DEFAULT TRUE)
- `description` (TEXT, NOT NULL)

---

### 2.5 OpportunityBridge Career Matching

#### `opportunities`
Jobs, internships, scholarships, and hackathons.
- `id` (UUID, PK)
- `title` (VARCHAR(255), NOT NULL)
- `organization` (VARCHAR(255), NOT NULL)
- `opportunity_type` (VARCHAR(50), NOT NULL) — (`job`, `internship`, `hackathon`, `scholarship`).
- `location` (VARCHAR(255), NOT NULL)
- `official_url` (VARCHAR(500), NOT NULL)
- `required_skills` (JSONB, DEFAULT `[]`)
- `eligibility` (JSONB, DEFAULT `{}`)
- `deadline` (TIMESTAMPTZ, NULLABLE)
- `status` (VARCHAR(50), DEFAULT 'active')
- `created_at` (TIMESTAMPTZ, DEFAULT `now()`)

#### `applications`
Citizen application tracking workflow.
- `id` (UUID, PK)
- `user_id` (UUID, FK -> `profiles.id` ON DELETE CASCADE, index)
- `opportunity_id` (UUID, FK -> `opportunities.id` ON DELETE CASCADE, index)
- `application_status` (VARCHAR(50), DEFAULT 'applied') — (`interested`, `applied`, `interviewing`, `offered`, `rejected`).
- `notes` (TEXT, DEFAULT '')
- `created_at` (TIMESTAMPTZ, DEFAULT `now()`)
- `updated_at` (TIMESTAMPTZ, DEFAULT `now()`)

#### `recommendations`
Precomputed or cached multi-factor recommendation scores ($S = w_1E + w_2R + w_3P + w_4F$).
- `id` (UUID, PK)
- `user_id` (UUID, FK -> `profiles.id` ON DELETE CASCADE, index)
- `item_type` (VARCHAR(50), NOT NULL)
- `item_id` (UUID, NOT NULL)
- `score` (NUMERIC(5, 2), NOT NULL)
- `reasons` (JSONB, DEFAULT `[]`)
- `created_at` (TIMESTAMPTZ, DEFAULT `now()`)

---

## 3. Row-Level Security (RLS) Policy Architecture

All user-owned tables enforce PostgreSQL RLS policies ensuring strict multi-tenant boundary isolation:

```sql
-- User Documents Isolation
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access their own documents"
ON documents FOR ALL
USING (auth.uid() = user_id);

-- Document Chunks Isolation
ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access their own document chunks"
ON document_chunks FOR ALL
USING (auth.uid() = user_id);

-- Learning Progress Isolation
ALTER TABLE learning_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access their own learning progress"
ON learning_progress FOR ALL
USING (auth.uid() = user_id);

-- Opportunity Applications Isolation
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access their own applications"
ON applications FOR ALL
USING (auth.uid() = user_id);
```

In the application repository layer (`repository.py`), queries additionally apply explicit `.filter(Model.user_id == resolved_profile_id)` and `.with_for_update()` locking to protect against concurrent race conditions and cross-tenant leakage.

