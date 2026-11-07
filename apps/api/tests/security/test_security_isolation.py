import unittest
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from app.core.logging import redact_pii
from app.core.permissions import assert_resource_owner
from app.core.exceptions import ForbiddenError

class TestSecurityIsolation(unittest.TestCase):
    def test_pii_redaction_aadhaar_and_pan(self):
        sample = "Applicant Aadhaar is 1234 5678 9012 and PAN is ABCDE1234F"
        redacted = redact_pii(sample)
        self.assertNotIn("1234 5678 9012", redacted)
        self.assertNotIn("ABCDE1234F", redacted)
        self.assertIn("[REDACTED_AADHAAR]", redacted)
        self.assertIn("[REDACTED_PAN]", redacted)

    def test_pii_redaction_auth_token(self):
        sample = "Headers Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.t-ID"
        redacted = redact_pii(sample)
        self.assertNotIn("eyJhbGci", redacted)
        self.assertIn("[REDACTED_TOKEN]", redacted)

    def test_assert_resource_owner_match(self):
        user = {"id": "user-123", "sub": "user-123"}
        # Should not raise
        assert_resource_owner(user, "user-123")

    def test_assert_resource_owner_mismatch_raises_forbidden(self):
        user = {"id": "user-123", "sub": "user-123"}
        with self.assertRaises(ForbiddenError):
            assert_resource_owner(user, "user-999")

if __name__ == "__main__":
    unittest.main()
