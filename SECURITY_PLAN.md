# Security, Privacy & Accessibility Architecture — AccessAI

**Document Version:** 1.0.0  
**Security Posture:** Zero-Trust / Privacy-by-Design  
**Accessibility Baseline:** WCAG 2.2 AA Compliance  
**Data Protection Target:** Indian Digital Personal Data Protection (DPDP) Act  

---

## 1. Threat Modeling & Defense Matrix

| Threat Scenario | Risk Level | Target Asset | Defense & Mitigation Architecture |
|---|---|---|---|
| **Cross-Tenant Vector Retrieval** | Critical | User Documents & Embeddings | Supabase Row-Level Security (RLS) on `document_chunks` table + repository query enforcement `WHERE user_id = :auth_uid`. Cross-tenant retrieval is blocked at the database engine level. |
| **Indirect Prompt Injection** | High | LLM Pipeline | All user-supplied document text is encapsulated within strict XML boundaries: `<untrusted_document_context>`. LLM system prompt forbids executing instructions inside context blocks. Output is validated against strict Pydantic JSON schemas. |
| **Hallucinated Public Benefits** | High | Citizen Trust & Scheme Eligibility | LLM is strictly prohibited from computing scheme eligibility. SchemeConnect executes deterministic Boolean rules (`RuleEvaluator`). Outputs without official grounding are assigned Tier 4 (Unavailable). |
| **Exposure of Backend Secrets** | Critical | Service Role Key & LLM Keys | `SUPABASE_SERVICE_ROLE_KEY` and `LLM_API_KEY` are only loaded in backend server environments (`apps/api/app/config.py`). Frontend only has access to public `NEXT_PUBLIC_*` variables. |
| **PII Leakage in Logging** | High | Aadhaar / PAN / Auth Tokens | `apps/api/app/core/logging.py` executes regex redaction on all log messages, converting Aadhaar numbers to `[REDACTED_AADHAAR]`, PAN cards to `[REDACTED_PAN]`, and Bearer tokens to `[REDACTED_TOKEN]`. |
| **Insecure Direct Object Reference (IDOR)** | High | Documents, Resumes, Progress | `apps/api/app/core/permissions.py` enforces `assert_resource_owner(current_user, target_user_id)`. Any mismatch immediately aborts with `403 Forbidden`. |
| **Resource Exhaustion via Heavy OCR** | Medium | Compute & Memory | File uploads are capped at 10MB and 25 pages maximum. OCR processing is executed asynchronously with timeout guards. |

---

## 2. Row-Level Security (RLS) Architecture

Row-Level Security is enabled across all 16 database tables in `supabase/migrations/20261107000002_row_level_security.sql`.

### 2.1 User-Partitioned Tables (Private)
Tables owned by citizens (`profiles`, `user_preferences`, `documents`, `document_chunks`, `conversations`, `messages`, `learning_progress`, `quiz_attempts`, `applications`):
```sql
ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own document chunks"
ON document_chunks
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
```

### 2.2 Public Catalogs (Read-Only to Authenticated/Public)
Authoritative tables (`schemes`, `scheme_eligibility_rules`, `opportunities`, `data_sources`):
```sql
ALTER TABLE schemes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active schemes"
ON schemes
FOR SELECT
USING (status = 'active');

-- Write/Update/Delete operations are restricted to backend service role
```

---

## 3. Grounding & Anti-Hallucination Guardrails

To prevent misleading students or underserved citizens, AccessAI implements a **4-Tier Evidence Verification Standard**:

```
+---------------------------------------------------------------------------------+
| TIER 1: VERIFIED OFFICIAL                                                       |
| Source: Official .gov.in portal or verified scheme eligibility rule criteria.  |
| UI Display: Green Shield Badge + Direct .gov.in Source Link                     |
| Guarantee: 100% Deterministic Rule Match                                        |
+---------------------------------------------------------------------------------+
| TIER 2: DOCUMENT GROUNDED                                                       |
| Source: Uploaded PDF/Image with verified chunk match.                            |
| UI Display: Blue Document Badge + Page & Chunk Quotation                        |
| Guarantee: Verbatim citation validated against retrieved context                |
+---------------------------------------------------------------------------------+
| TIER 3: AI SYNTHETIC                                                            |
| Source: Conceptual explanation or general educational guidance.                 |
| UI Display: Amber Notice "AI Generated Explanation — Verify before submission"  |
| Guarantee: Pedagogical assistance only; not a formal eligibility confirmation   |
+---------------------------------------------------------------------------------+
| TIER 4: INFORMATION UNAVAILABLE                                                 |
| Source: Information requested is missing from knowledge base.                   |
| UI Display: Neutral Notice "Information Unavailable in Official Records"        |
| Guarantee: Zero hallucination; system refuses to guess                          |
+---------------------------------------------------------------------------------+
```

---

## 4. Privacy & PII Redaction Implementation

Indian identity documents (Aadhaar cards, PAN cards, Income certificates) require statutory privacy safeguards.

```python
# apps/api/app/core/logging.py
import re

AADHAAR_REGEX = re.compile(r'\b\d{4}\s\d{4}\s\d{4}\b|\b\d{12}\b')
PAN_REGEX = re.compile(r'\b[A-Z]{5}[0-9]{4}[A-Z]{1}\b')
TOKEN_REGEX = re.compile(r'(Bearer\s+)[A-Za-z0-9\-_\.]+')

def redact_pii(text: str) -> str:
    text = AADHAAR_REGEX.sub("[REDACTED_AADHAAR]", text)
    text = PAN_REGEX.sub("[REDACTED_PAN]", text)
    text = TOKEN_REGEX.sub(r'\1[REDACTED_TOKEN]', text)
    return text
```

*Automated Test Verification:* Verified by `apps/api/tests/security/test_security_isolation.py`.

---

## 5. WCAG 2.2 AA Accessibility Compliance Specification

AccessAI is built from the ground up for full compliance with the **Web Content Accessibility Guidelines (WCAG) 2.2 Level AA**.

```
+-----------------------------------------------------------------------------------+
| WCAG 2.2 AA PRINCIPLE          | IMPLEMENTATION SPECIFICATION                     |
+--------------------------------+--------------------------------------------------+
| 1.4.3 Contrast (Minimum)       | All text meets minimum contrast ratio of 4.5:1.  |
|                                | High-contrast mode exceeds 7:1 ratio.            |
+--------------------------------+--------------------------------------------------+
| 1.4.4 Resize Text              | Root font scaling from 0.8x to 2.0x (80% - 200%) |
|                                | via CSS custom property `--font-scale`.          |
|                                | Layouts remain fluid without horizontal scroll.  |
+--------------------------------+--------------------------------------------------+
| 2.1.1 Keyboard Navigation      | All actions operable via Tab, Shift+Tab, Enter,   |
|                                | Space, and Escape. Zero keyboard traps.          |
+--------------------------------+--------------------------------------------------+
| 2.4.7 Focus Visible            | Unmistakable focus ring indicators:              |
|                                | `focus-visible:ring-4 focus-visible:ring-primary`|
+--------------------------------+--------------------------------------------------+
| 1.3.1 Info & Relationships     | Semantic HTML5 (`header`, `nav`, `main`, etc.)   |
|                                | with correct heading hierarchies (h1 -> h2).     |
+--------------------------------+--------------------------------------------------+
| 4.1.2 Name, Role, Value        | Dynamic UI state updates announced to screen     |
|                                | readers via `aria-live="polite"`.                |
+--------------------------------+--------------------------------------------------+
| Multi-Sensory Affordance       | Statuses (Eligible, Not Eligible, Pending) are   |
|                                | indicated by distinct icons, text, and badges—   |
|                                | never color alone.                               |
+--------------------------------+--------------------------------------------------+
| Speech Synthesis (TTS)         | Native audio readout button on every explanation |
|                                | and document summary using Web Speech API.       |
+--------------------------------+--------------------------------------------------+
```

