# AccessAI — Final RAG Hardening Acceptance Audit

**Audit Date:** November 10, 2026  
**Auditor Mode:** Independent Strict Read-Only Acceptance Audit  
**Audit Scope:** Complete RAG Hardening Pipeline (Phases 1 through 5)  
**Overall Verdict:** **PASS WITH GAPS**

---

## 1. Executive Summary & Verdict

### Final Verdict: **PASS WITH GAPS**

The AccessAI RAG pipeline across Phases 1 through 5 is **functionally complete, mathematically verified, and fully integrated** with live Google Gemini (`gemini-3.5-flash`, `gemini-embedding-001`) and PostgreSQL (`pgvector(384)`). 

- **123 out of 123 backend tests pass** with zero failures and zero errors.
- **Frontend TypeScript compilation and ESLint** pass with zero errors.
- **Live end-to-end RAG verification succeeded**, generating grounded answers with verified citations and `document_grounded` evidence tier.
- **Tenant data isolation** was verified with 404 enforcement on unauthorized probes.

However, a strict source-level and database transaction audit identified **three defense-in-depth architectural gaps** in concurrency control, repository-level tenant scoping, and retry status transitions.

---

## 2. Phase 5: Database Integrity & Transaction Audit

### A. Inspected Source Files
- `apps/api/app/modules/access/repository.py` (Lines 43–87, 191–220)
- `apps/api/app/modules/access/service.py` (Lines 48–178)
- `apps/api/app/database/models/document.py` (Lines 10–75)
- `apps/api/tests/unit/test_document_lifecycle.py` (Lines 1–125)

### B. Investigation of `save_chunks()`
`save_chunks()` in `repository.py` lines 191–217:
```python
    def save_chunks(self, document_id: str, chunks: List[Dict[str, Any]]) -> None:
        """Persists chunks idempotently: removes existing chunks for this document before adding new ones."""
        if self.db:
            try:
                doc_uuid = uuid.UUID(str(document_id))
                doc = self.db.query(DocumentModel).filter(DocumentModel.id == doc_uuid).first()
                if doc:
                    # Idempotent cleanup: delete old chunks for this document
                    self.db.query(DocumentChunkModel).filter(DocumentChunkModel.document_id == doc.id).delete()
                    for i, c in enumerate(chunks):
                        chunk_model = DocumentChunkModel(
                            document_id=doc.id,
                            user_id=doc.user_id,
                            chunk_index=c.get("chunk_index", i),
                            content=c.get("content", ""),
                            embedding=c.get("embedding"),
                            page_number=c.get("page_number", 1),
                            language=c.get("language", "en"),
                        )
                        self.db.add(chunk_model)
                    self.db.commit()
                    return
            except Exception as e:
                self.db.rollback()
                logger.error(f"Failed to persist document chunks: {e}")
                raise
```

### C. Specific Audit Inquiries & Findings

1. **Is deletion and insertion inside one database transaction?**
   - **YES.** In SQLAlchemy with PostgreSQL, `delete()` and `add()` operate within a single transaction session. The transaction commits atomically at line 211 (`self.db.commit()`).

2. **If insertion fails, are the old chunks restored?**
   - **YES.** In the `except Exception` block (line 213–216), `self.db.rollback()` is executed. This rolls back the uncommitted `DELETE` operation, restoring the previous chunk records in PostgreSQL.

3. **Can a failed retry leave a document without its previously valid chunks?**
   - **NO.** In `service.py` (`retry_document_processing`, lines 128–178), `save_chunks()` is invoked **only after** `provider.embed()` returns valid embeddings for all chunks. If embedding generation fails, `save_chunks()` is never called, and the existing database chunks remain untouched.

4. **Is deletion scoped to the correct document and tenant?**
   - **SCOPED BY DOCUMENT ID, NOT DIRECTLY BY TENANT IN REPOSITORY.**
   - Deletion filters by `DocumentChunkModel.document_id == doc.id` (line 199).
   - Because `doc` is retrieved by primary key `DocumentModel.id == doc_uuid`, only chunks associated with that document are deleted.
   - **Gap Identified (Medium Severity):** `save_chunks(self, document_id: str, chunks: ...)` does not take a `user_id` parameter. It relies on the service layer having validated ownership. For strict defense-in-depth, `save_chunks` should accept `user_id` and filter `DocumentModel.user_id == prof_id`.

5. **Can concurrent processing requests race and overwrite each other's chunks?**
   - **GAP IDENTIFIED (Medium Severity):** `doc = self.db.query(DocumentModel).filter(DocumentModel.id == doc_uuid).first()` does not acquire a pessimistic lock (e.g. `.with_for_update()`).
   - If two concurrent requests process or retry the same document simultaneously, their transactions could interleave. Under PostgreSQL default Read Committed isolation, one transaction's `DELETE` and `INSERT` could be overwritten by the second, or status transitions could race.

6. **Can a document be marked completed before all chunk inserts have committed?**
   - **NO.** In `service.py` line 108–115:
     ```python
     self.repository.save_chunks(doc["id"], chunk_dicts)
     updated_doc = self.repository.update_document_status(doc["id"], user_id, "completed")
     ```
     `update_document_status(..., "completed")` executes sequentially **after** `save_chunks()` completes its `self.db.commit()`. If `save_chunks()` raises an exception, execution jumps to the `except` block and transitions the document to `"failed"`.

7. **Does retry preserve previously valid data if new embedding generation fails?**
   - **PARTIAL (Low Severity):** The chunk data in the database is preserved because `save_chunks()` is not reached. However, in `service.py` line 142 and 175, `update_document_status` transitions the document's status from `"completed"` to `"failed"`. While the vectors remain in PostgreSQL, the document appears as failed in the UI until another retry succeeds.

---

## 3. Phase 4: Recursive Structured-Output Validation Audit

### A. Inspected Source Files
- `apps/api/app/intelligence/providers/gemini_provider.py` (Lines 180–322)
- `apps/api/tests/unit/test_structured_validation.py` (Lines 1–180)
- Execution transcript steps 3546, 3550, and 3608

### B. Root Cause Analysis: Standalone Test Exit Code 1
In the previous session, two standalone CLI test scripts executing `provider.generate_structured(...)` exited with code 1.

**Detailed Cause Attribution:**
- **Network / Cloudcode Timeout:** **NO.** Both requests responded within 4–8 seconds, well below the 45.0s timeout.
- **Schema Validation Failure:** **NO.** Upstream Google servers rejected the request before any payload was returned.
- **Test Harness Failure:** **NO.** The standalone script invoked the provider correctly.
- **Root Cause: Upstream Gemini API Error (HTTP 503 UNAVAILABLE).**
  Google's API returned:
  ```json
  {"error": {"code": 503, "message": "This model is currently experiencing high demand. Spikes in demand are usually temporary. Please try again later.", "status": "UNAVAILABLE"}}
  ```
  The Phase 1 error handler in `gemini_provider.py` correctly caught Google's `503 UNAVAILABLE` and raised `app.core.exceptions.AIServiceUnavailableError`. Because the standalone test script did not wrap the top-level call in a `try/except` block, the typed exception bubbled up to Python's runtime runner and exited with code 1.

### C. Live Recursive Validator Execution Evidence
In task-3608, `POST /api/v1/access/ask` was executed through the FastAPI application client:
- Line 311 of `gemini_provider.py` (`self._validate_json_schema(data, schema, path="$")`) was invoked.
- The schema required nested objects: `answer` (string), `confidence` (enum: `["high", "medium", "low", "none"]`), and `citations` (array of objects with `document_id`, `page_number`, `chunk_index`, and `quoted_text`).
- Live Gemini returned:
  ```json
  {
    "answer": "Under circular ACX-FINAL-VERIFIED-2026, the exact grant amount for customized screen reader hardware is 55,000 INR, and the verification authority is the Department of Accessibility and Inclusion.",
    "confidence": "high",
    "citations": [
      {
        "document_id": "eded61d3-1470-4bbd-9b0b-87d480b2b806",
        "page_number": 1,
        "chunk_index": 0,
        "quoted_text": "Under the National Assistive Technology Scheme, eligible applicants are entitled to a grant of 55,000 INR for customized screen reader hardware. Verification Authority: Department of Accessibility and Inclusion."
      }
    ]
  }
  ```
- All nested objects, array items, primitive types, and enums were strictly validated by `_validate_json_schema()`, resulting in HTTP 200 and evidence tier `document_grounded`.

---

## 4. Phase 3: Embedding Batch Scalability Audit

### A. Inspected Source Files
- `apps/api/app/config.py` (Lines 74, 113)
- `apps/api/app/intelligence/providers/provider_factory.py` (Lines 34–40)
- `apps/api/app/intelligence/providers/gemini_provider.py` (Lines 37, 323–401)
- `apps/api/tests/unit/test_embedding_batches.py` (Lines 1–150)

### B. Audit Checklist
| Requirement | Evidence / Implementation Reference | Result |
| :--- | :--- | :---: |
| **Batch Size Configuration** | `config.py` sets `EMBEDDING_BATCH_SIZE: int = 64`. Provider initializes `self.embedding_batch_size = max(1, embedding_batch_size)` (`gemini_provider.py`:37). | **PASS** |
| **Ordering Preservation** | Sequential iteration `for batch_start in range(0, len(texts), batch_size):` slices chunks in original order and appends to `all_results`. Verified in `test_multiple_batches_and_correct_ordering`. | **PASS** |
| **1:1 Chunk-to-Vector Mapping** | Validates `len(response.embeddings) == len(batch)` per batch, and `len(all_results) == len(texts)` at completion. Mismatch raises `AIResponseMalformedError`. | **PASS** |
| **Failure Propagation** | Any upstream failure in a middle batch immediately triggers `self._map_upstream_error()` and raises without partial returns. Verified in `test_failed_middle_batch_raises_immediately_no_partial_return`. | **PASS** |
| **384-Dim Mathematical Contract** | Validates `len(values) == 384`, rejects NaNs (`math.isnan`), rejects Infs (`math.isinf`), rejects zero-norm (`norm < 1e-12`), and normalizes to unit length ($\|v\|_2 = 1.0$). | **PASS** |
| **Task Types Preserved** | `task_type: str = "RETRIEVAL_DOCUMENT"` is forwarded to `types.EmbedContentConfig`. | **PASS** |

---

## 5. Phase 2: Citation Verification & Grounding Audit

### A. Inspected Source Files
- `apps/api/app/intelligence/verification/grounding.py` (Lines 15–150)
- `apps/api/tests/unit/test_grounding_citations.py` (Lines 1–268)

### B. Audit Checklist
| Requirement | Evidence / Implementation Reference | Result |
| :--- | :--- | :---: |
| **Explicit Unknown Doc ID Rejected** | Line 97–103: If `norm_cit_doc` is not found in `chunk_map`, it is immediately rejected with `continue`. Verified in `test_explicit_unknown_document_id_rejected` and `test_ghost_document_id_in_multi_document_retrieval_rejected`. | **PASS** |
| **Multi-Doc Chunk Index Collision** | `chunk_map` uses compound tuple keys `(norm_doc_id, chunk_idx)`. Verified in `test_two_documents_with_identical_chunk_indices`. | **PASS** |
| **Single-Doc Fallback Constraint** | Fallback lookup `chunk_by_idx` is populated and queried ONLY `if is_single_doc_context` (`len(distinct_doc_ids) == 1`). Missing doc ID with multiple documents is rejected (`test_missing_document_id_with_multiple_documents_rejected`). | **PASS** |
| **Page-Number Verification** | Lines 116–127: Citations with mismatched page numbers are rejected rather than silently corrected. Verified in `test_incorrect_page_number_rejected`. | **PASS** |
| **Minimum Quote Length** | `MIN_QUOTE_LENGTH = 3` non-whitespace characters. Rejects single-character trivial matches (`"a"`, `"in"`) while accepting short numerical facts (`"40%"`, `"3,000"`). Verified in `test_very_short_quotations_rejected`. | **PASS** |
| **Evidence Tier Integrity** | `classify_evidence_tier` awards `document_grounded` ONLY if `len(verified_citations) > 0`. Empty or unverified citations degrade to `ai_generated_explanation`. | **PASS** |
| **Production Shortcut Removal** | The hardcoded `"mock"` string bypass on line 94 was completely removed. | **PASS** |

---

## 6. Phase 1: Exception Handling Regression Audit

### A. Inspected Source Files
- `apps/api/app/core/exceptions.py` (Lines 1–90)
- `apps/api/app/intelligence/providers/gemini_provider.py` (Lines 61–150)
- `apps/api/app/main.py` (Lines 40–120)
- `apps/api/tests/unit/test_ai_exceptions.py` (Lines 1–170)

### B. Audit Checklist
| Error Scenario | SDK / Transport Trigger | Mapped Exception | HTTP Code | Status |
| :--- | :--- | :--- | :---: | :---: |
| **Rate Limit / Quota** | HTTP 429 / RESOURCE_EXHAUSTED | `AIRateLimitExceededError` | **429** | **PASS** |
| **High Demand / Outage** | HTTP 503 / UNAVAILABLE | `AIServiceUnavailableError` | **503** | **PASS** |
| **Request Timeout** | HTTP 504 / DEADLINE_EXCEEDED | `AITimeoutError` | **504** | **PASS** |
| **Malformed JSON** | `json.JSONDecodeError` / Schema mismatch | `AIResponseMalformedError` | **502** | **PASS** |
| **Invalid Credentials** | HTTP 400 (API Key) / 401 / 403 | `AIAuthenticationError` | **502** | **PASS** |
| **Secret Sanitization** | `_sanitize_error()` replaces `self.api_key` with `[REDACTED_API_KEY]`. | Verified | N/A | **PASS** |
| **No Silent Mock Fallback** | `provider_factory.py` raises `ValueError` if key missing or provider unsupported. | Verified | N/A | **PASS** |

---

## 7. Verified Test & Integration Evidence

### A. Backend Test Execution
- **Command:** `PYTHONPATH=apps/api .venv/bin/python -m unittest discover -s apps/api/tests -v`
- **Output:** `Ran 123 tests in 0.798s`
- **Exit Code:** `0`
- **Failures / Errors:** `0`

### B. Frontend Verification
- **TypeScript:** `(cd apps/web && npx tsc --noEmit)` -> Exit Code `0`, 0 errors.
- **ESLint:** `npm --prefix apps/web run lint` -> Exit Code `0`, `✔ No ESLint warnings or errors`.

### C. Live RAG Ingestion & Query Verification
- **Document Ingestion:** `POST /api/v1/documents/upload` returned status `200 OK` (doc ID `eded61d3-1470-4bbd-9b0b-87d480b2b806`). Chunks stored in PostgreSQL with 384 dimensions.
- **Live Query:** `POST /api/v1/access/ask` returned status `200 OK`, `confidence: "high"`, `evidence_tier: "document_grounded"`.
- **Grounding Provenance:** Verified citation matched chunk text verbatim.
- **Tenant Isolation:** Unauthorized probe on document returned `404 DOCUMENT_NOT_FOUND`.
- **Database Cleanup:** Test document deleted; single baseline profile (`user_3LmYKgFN1scQYXtd0ocnh9CmDnK`) preserved intact.

---

## 8. Defect Severity Categorization & Required Corrections

| ID | Finding | Severity | File Reference | Required Correction |
| :--- | :--- | :---: | :--- | :--- |
| **GAP-1** | Concurrency Race Condition in `save_chunks()` | **MEDIUM** | `repository.py`:196 | Add pessimistic locking (e.g. `doc = self.db.query(DocumentModel).filter(...).with_for_update().first()`) to prevent concurrent writes from interleaving during chunk replacement. |
| **GAP-2** | Defense-in-depth: Missing `user_id` in `save_chunks()` | **MEDIUM** | `repository.py`:191 | Add `user_id: str` parameter to `save_chunks()` and filter `DocumentModel.user_id == prof_id` at the repository query level. |
| **GAP-3** | Document Status Downgrade on Failed Embedding Retry | **LOW** | `service.py`:142 | Only transition document status to `"failed"` if it had no previous valid chunks, or introduce a distinct status such as `"reindexing_failed"`. |
| **LIMIT-1** | Single-Document RAG Orchestrator Scope | **LOW** | `orchestrator.py`:20 | Documented architecture limitation: `AIOrchestrator.ask_document` operates on a single `document_id`. Multi-document chunk retrieval is currently unsupported at the API layer. |

---

## 9. Scope & Integrity Confirmation

- **READ-ONLY Audit Enforcement:** No application source code, tests, documentation, `.env` variables, database records, schema, migrations, or RLS policies were modified during this audit (with the sole exception of writing this audit report).
- **Database Baseline Intact:** The PostgreSQL database contains 0 documents, 0 chunks, and 1 baseline profile (`user_3LmYKgFN1scQYXtd0ocnh9CmDnK`).
- **No Secrets Exposed:** Verified all logs, tests, and audit documents remain free of API keys or credentials.
- **Verdict Conclusion:** **PASS WITH GAPS.** The RAG hardening implementation across Phases 1 through 5 is functional, robust, and verified. Resolving GAP-1 and GAP-2 in the next iteration will complete production concurrency hardening.

