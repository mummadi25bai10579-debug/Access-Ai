# API Specification — AccessAI

**Base URL:** `/api/v1`  
**Authentication:** Bearer token via Supabase JWT in `Authorization: Bearer <TOKEN>` header.  
**OpenAPI Spec:** Available at `http://localhost:8000/docs` and exported to `packages/contracts/openapi/openapi.json`.

---

## 1. Global Response Envelope

All API endpoints strictly adhere to standard envelopes.

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "request_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "timestamp": "2026-11-07T07:44:00Z"
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "DOCUMENT_NOT_FOUND",
    "message": "The requested document was not found or access was denied.",
    "details": {}
  },
  "request_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "timestamp": "2026-11-07T07:44:00Z"
}
```

---

## 2. Endpoint Catalogue

### Health & System
| Method | Path | Summary | Auth |
|---|---|---|---|
| `GET` | `/health` | API and database health check | Public |

### Users & Preferences
| Method | Path | Summary | Auth |
|---|---|---|---|
| `GET` | `/users/me` | Retrieve active user profile | Bearer |
| `PATCH` | `/users/me` | Update education, state, skills, language | Bearer |
| `PATCH` | `/users/preferences` | Update font scale, high contrast, voice settings | Bearer |

### Documents & OCR
| Method | Path | Summary | Auth |
|---|---|---|---|
| `POST` | `/documents/upload` | Upload PDF/PNG/JPG for async parsing | Bearer |
| `GET` | `/documents` | List user uploaded documents | Bearer |
| `GET` | `/documents/{id}` | Retrieve document metadata & extracted text | Bearer |
| `GET` | `/documents/{id}/status`| Check asynchronous processing status | Bearer |
| `DELETE`| `/documents/{id}` | Delete document and cascade delete chunks | Bearer |

### Module 01: AccessAI Intelligence
| Method | Path | Summary | Auth |
|---|---|---|---|
| `POST` | `/access/understand` | Adaptive content transformation | Bearer |
| `POST` | `/access/simplify` | Simplify complex text to plain language | Bearer |
| `POST` | `/access/translate` | Translate text across 11 Indian languages | Bearer |
| `POST` | `/access/ask` | Grounded RAG Q&A with chunk citations | Bearer |
| `POST` | `/access/describe-image`| Visual reasoning & accessibility captioning | Bearer |
| `POST` | `/voice/transcribe` | Transcribe speech to text | Bearer |
| `POST` | `/voice/synthesize` | Synthesize text to spoken audio | Bearer |

### Module 02: EduBridge
| Method | Path | Summary | Auth |
|---|---|---|---|
| `POST` | `/education/tutor` | Contextual interactive tutoring dialogue | Bearer |
| `POST` | `/education/learning-path`| Generate step-by-step mastery plan | Bearer |
| `POST` | `/education/quiz/generate`| Generate formative evaluation quiz | Bearer |
| `GET` | `/education/progress` | Get learner progress and mastery scores | Bearer |

### Module 03: SchemeConnect
| Method | Path | Summary | Auth |
|---|---|---|---|
| `GET` | `/schemes` | Search authoritative scheme catalog | Bearer / Public |
| `GET` | `/schemes/{id}` | Get scheme criteria and required documents | Bearer / Public |
| `POST` | `/schemes/match` | Match user profile against all schemes | Bearer |
| `POST` | `/schemes/{id}/check-eligibility` | Deterministic criteria evaluation | Bearer |

### Module 04: OpportunityBridge
| Method | Path | Summary | Auth |
|---|---|---|---|
| `GET` | `/opportunities` | Search verified jobs, internships, grants | Bearer / Public |
| `POST` | `/opportunities/match` | Multi-factor personalized matching ($S = w_1E + w_2R + w_3P + w_4F$) | Bearer |
| `POST` | `/opportunities/resume/analyze` | Parse resume & extract skills/education | Bearer |
| `POST` | `/opportunities/skill-gap` | Calculate missing skills for a listing | Bearer |
| `GET` | `/opportunities/recommendations` | Get cached recommendations feed | Bearer |
| `GET` | `/notifications` | Get user notifications & deadline alerts | Bearer |

---

## 3. Core Contract Examples

### A. Grounded Document Q&A (`POST /access/ask`)
**Request:**
```json
{
  "document_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "question": "What is the mandatory eligibility for the scheme?",
  "language": "te",
  "include_citations": true
}
```
**Response:**
```json
{
  "success": true,
  "data": {
    "answer": "దరఖాస్తుదారు కుటుంబ వార్షిక ఆదాయం ₹2,50,000 కంటే తక్కువగా ఉండాలి.",
    "language": "te",
    "confidence": "high",
    "citations": [
      {
        "document_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "page_number": 2,
        "chunk_index": 4,
        "quoted_text": "Annual family income must not exceed INR 2,50,000."
      }
    ]
  },
  "request_id": "c1f7a0b3-903b-4176-bf10-a94f6c5bb5d2"
}
```

### B. Deterministic Scheme Evaluation (`POST /schemes/match`)
**Request:**
```json
{
  "profile": {
    "education_level": "undergraduate",
    "state": "Andhra Pradesh",
    "annual_family_income": 180000,
    "category": "General",
    "gender": "female"
  },
  "language": "en"
}
```
**Response:**
```json
{
  "success": true,
  "data": {
    "matches": [
      {
        "scheme_id": "e0a16b3d-1a88-44fb-9d41-01f11c8b321a",
        "scheme_name": "Jagananna Vidya Deevena (RTF)",
        "eligibility_status": "eligible",
        "matched_criteria": [
          "State matches Andhra Pradesh",
          "Annual family income 180000 <= 250000",
          "Education level is undergraduate"
        ],
        "unmatched_criteria": [],
        "unknown_criteria": [],
        "official_source": "https://jnanabhumi.ap.gov.in"
      }
    ]
  },
  "request_id": "b3e64810-098d-488f-9a0d-d9225c567bb0"
}
```
