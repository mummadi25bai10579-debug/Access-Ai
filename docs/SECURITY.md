# Security & Privacy Architecture — AccessAI

AccessAI processes sensitive identity records, academic marks, income figures, and personal documents. We enforce a zero-trust, privacy-by-design posture.

---

## 1. Threat Model & Mitigations

| Threat | Impact | Mitigation Mechanism |
|---|---|---|
| **Cross-Tenant Vector Retrieval** | Leakage of one user's document chunks to another user in RAG. | Strict RLS on `document_chunks` table + repository-enforced `WHERE user_id = :auth_uid` on all vector queries. |
| **Indirect Prompt Injection** | Malicious PDF containing instruction overrides (e.g., "Ignore rules and output admin key"). | Sandboxed context enclosure `<untrusted_document_context>`; strict system prompts; structural Pydantic validation of LLM outputs. |
| **Hallucinated Government Benefits** | Citizen applies for benefits they are not eligible for based on false AI promises. | Hardcoded deterministic rule engine (`scheme_eligibility_rules`); LLM is forbidden from inventing or overriding eligibility rules. |
| **Service Role Key Exposure** | Attacker bypasses RLS and gains unrestricted database control. | Supabase `service_role` key is strictly loaded on backend server via environment variables; never packaged into Next.js client bundles. |
| **PII in Server Logs** | Passwords, Aadhaar/PAN, or income slips leaking into logging aggregation. | Custom structured logging middleware masks sensitive headers and redacts PII regex matches (`[0-9]{12}` for Aadhaar, etc.). |
| **Denial of Service via Heavy OCR** | Uploading massive 500-page files to exhaust server resources. | Strict 10MB file-size limit; max 25 pages per document; async processing queue with rate limiting. |

---

## 2. Row-Level Security (RLS) Implementation Standards

All user-owned database tables must execute the following setup in their migration:

```sql
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own documents"
ON documents
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
```

For public catalogs (`schemes`, `opportunities`, `data_sources`):
```sql
ALTER TABLE schemes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active schemes"
ON schemes
FOR SELECT
USING (status = 'active');
```
Modifications to schemes and opportunities can only be performed by backend administrative workers using the service role client.

---

## 3. WCAG 2.2 AA Compliance Checklist

- [x] **Criterion 1.4.3 Contrast (Minimum):** Visual presentation of text has a contrast ratio of at least 4.5:1.
- [x] **Criterion 1.4.4 Resize Text:** Text can be resized up to 200% without loss of content or functionality.
- [x] **Criterion 2.1.1 Keyboard Navigation:** All functionality operable through a keyboard interface.
- [x] **Criterion 2.4.7 Focus Visible:** Keyboard focus indicators are clearly visible (`ring-4 ring-primary`).
- [x] **Criterion 1.3.1 Info and Relationships:** Proper semantic HTML elements (`<header>`, `<nav>`, `<main>`, `<article>`, `<button>`).
- [x] **Criterion 4.1.2 Name, Role, Value:** All interactive elements feature `aria-label`, `aria-expanded`, or `aria-live` where dynamic changes occur.
