import unittest
import sys
import os
import time
import uuid
import jwt
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.primitives import serialization
from starlette.testclient import TestClient

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from app.main import app
from app.config import settings
from app.api.deps import set_orchestrator
from app.intelligence.providers.mock_provider import MockAIProvider
from app.intelligence.orchestrator.orchestrator import AIOrchestrator


class TestHTTPEndpointsIntegration(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # Generate an in-memory RSA keypair for authenticated requests
        cls.private_key = rsa.generate_private_key(
            public_exponent=65537,
            key_size=2048,
        )
        cls.public_key_pem = cls.private_key.public_key().public_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo,
        ).decode("utf-8")

        cls.orig_pem = settings.CLERK_PEM_PUBLIC_KEY
        cls.orig_env = settings.APP_ENV
        settings.CLERK_PEM_PUBLIC_KEY = cls.public_key_pem

        # Configure mock provider for fast deterministic tests
        set_orchestrator(AIOrchestrator(MockAIProvider()))
        cls.client = TestClient(app)

    @classmethod
    def tearDownClass(cls):
        settings.CLERK_PEM_PUBLIC_KEY = cls.orig_pem
        settings.APP_ENV = cls.orig_env

    def _get_auth_headers(self, user_id: str = "user_e2e_http_test_123") -> dict:
        payload = {
            "sub": user_id,
            "exp": time.time() + 3600,
            "iat": time.time(),
            "name": "Integration Test Citizen",
            "email": f"{user_id}@example.com",
        }
        if settings.CLERK_ISSUER:
            payload["iss"] = settings.CLERK_ISSUER
        private_bytes = self.private_key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.PKCS8,
            encryption_algorithm=serialization.NoEncryption(),
        )
        token = jwt.encode(payload, private_bytes, algorithm="RS256", headers={"alg": "RS256", "kid": "test-kid"})
        return {"Authorization": f"Bearer {token}"}

    def test_health_endpoints(self):
        res = self.client.get("/api/v1/health")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json().get("data", {}).get("status"), "healthy")

        res_db = self.client.get("/api/v1/health/db")
        self.assertEqual(res_db.status_code, 200)
        self.assertIn(res_db.json().get("data", {}).get("status"), ["healthy", "unhealthy"])

    def test_education_http_endpoints(self):
        headers = self._get_auth_headers("user_edu_test_01")

        # 1. List courses
        res = self.client.get("/api/v1/education/courses")
        self.assertEqual(res.status_code, 200)
        courses = res.json().get("data", [])
        self.assertGreater(len(courses), 0)
        course_id = courses[0]["id"]

        # 2. Tutor chat
        tutor_res = self.client.post(
            "/api/v1/education/tutor",
            headers=headers,
            json={"message": "What is an algorithm?", "course_id": course_id},
        )
        self.assertEqual(tutor_res.status_code, 200)
        data = tutor_res.json().get("data", {})
        self.assertIn("reply", data)

        # 3. Generate quiz
        quiz_res = self.client.post(
            "/api/v1/education/quiz/generate",
            json={"topic": "Data Structures", "num_questions": 2},
        )
        self.assertEqual(quiz_res.status_code, 200)
        quiz_data = quiz_res.json().get("data", {})
        self.assertIn("questions", quiz_data)

        # 4. Submit quiz with server-side validation
        submit_res = self.client.post(
            "/api/v1/education/quiz/submit",
            headers=headers,
            json={
                "course_id": course_id,
                "answers": [
                    {"question_id": "q1", "selected_option_index": 0, "correct_option_index": 0},
                    {"question_id": "q2", "selected_option_index": 1, "correct_option_index": 2},
                ],
            },
        )
        self.assertEqual(submit_res.status_code, 200)
        attempt = submit_res.json().get("data", {})
        self.assertEqual(attempt.get("score"), 50.0)

        # 5. Progress
        prog_res = self.client.get("/api/v1/education/progress", headers=headers)
        self.assertEqual(prog_res.status_code, 200)

    def test_schemes_http_endpoints(self):
        # 1. List schemes
        res = self.client.get("/api/v1/schemes")
        self.assertEqual(res.status_code, 200)
        schemes = res.json().get("data", [])
        self.assertGreater(len(schemes), 0)

        # 2. Match schemes deterministically
        match_res = self.client.post(
            "/api/v1/schemes/match",
            json={
                "profile": {
                    "state_code": "AP",
                    "education_level": "undergraduate",
                    "annual_family_income": 120000,
                    "category": "OBC",
                }
            },
        )
        self.assertEqual(match_res.status_code, 200)
        matches = match_res.json().get("data", {}).get("matches", [])
        self.assertGreater(len(matches), 0)

    def test_opportunities_http_endpoints(self):
        headers = self._get_auth_headers("user_opp_test_01")

        # 1. List opportunities
        res = self.client.get("/api/v1/opportunities")
        self.assertEqual(res.status_code, 200)
        opps = res.json().get("data", [])
        self.assertGreater(len(opps), 0)
        opp_id = opps[0]["id"]

        # 2. Match opportunities
        match_res = self.client.post(
            "/api/v1/opportunities/match",
            json={
                "profile": {
                    "skills": ["Python", "FastAPI", "React"],
                    "education_level": "undergraduate",
                }
            },
        )
        self.assertEqual(match_res.status_code, 200)
        scored = match_res.json().get("data", {}).get("matches", [])
        self.assertGreater(len(scored), 0)

        # 3. Analyze resume
        resume_res = self.client.post(
            "/api/v1/opportunities/resume/analyze",
            json={"resume_text": "Experienced Python and React developer with B.Tech degree."},
        )
        self.assertEqual(resume_res.status_code, 200)

        # 4. Apply to opportunity
        apply_res = self.client.post(
            f"/api/v1/opportunities/{opp_id}/apply",
            headers=headers,
            json={"notes": "E2E testing application"},
        )
        self.assertEqual(apply_res.status_code, 200)

        # 5. List applications
        my_apps = self.client.get("/api/v1/opportunities/applications/me", headers=headers)
        self.assertEqual(my_apps.status_code, 200)
        self.assertGreater(len(my_apps.json().get("data", [])), 0)

    def test_user_profile_and_dashboard_stats(self):
        headers = self._get_auth_headers("user_profile_test_01")

        # 1. Get profile
        prof_res = self.client.get("/api/v1/profile/me", headers=headers)
        self.assertEqual(prof_res.status_code, 200)

        # 2. Update profile
        update_res = self.client.put(
            "/api/v1/profile/me",
            headers=headers,
            json={"full_name": "Updated Citizen Name", "education_level": "postgraduate"},
        )
        self.assertEqual(update_res.status_code, 200)

        # 3. Dashboard stats
        stats_res = self.client.get("/api/v1/users/dashboard/stats", headers=headers)
        self.assertEqual(stats_res.status_code, 200)
        stats = stats_res.json().get("data", {}).get("stats", {})
        self.assertIn("matched_opportunities_count", stats)
        self.assertIn("matched_schemes_count", stats)

    def test_notifications_endpoints(self):
        headers = self._get_auth_headers("user_notif_test_01")
        res = self.client.get("/api/v1/notifications", headers=headers)
        self.assertEqual(res.status_code, 200)

    def test_accessai_http_endpoints(self):
        headers = self._get_auth_headers("user_access_http_01")

        # 1. Upload document
        file_payload = {"file": ("scheme_notice.txt", b"Official notification for welfare eligibility. Students need 75% attendance.", "text/plain")}
        upload_res = self.client.post("/api/v1/documents/upload", headers=headers, files=file_payload)
        self.assertEqual(upload_res.status_code, 200)
        doc_id = upload_res.json().get("data", {}).get("document_id")
        self.assertIsNotNone(doc_id)

        # 2. List documents
        list_res = self.client.get("/api/v1/documents", headers=headers)
        self.assertEqual(list_res.status_code, 200)
        docs = list_res.json().get("data", [])
        self.assertGreater(len(docs), 0)

        # 3. Ask document (grounded RAG)
        ask_res = self.client.post(
            "/api/v1/access/ask",
            headers=headers,
            json={"document_id": doc_id, "question": "What is the attendance requirement?", "language": "en"},
        )
        self.assertEqual(ask_res.status_code, 200)
        ask_data = ask_res.json().get("data", {})
        self.assertIn("answer", ask_data)

        # 4. Simplify text
        sim_res = self.client.post(
            "/api/v1/access/simplify",
            json={"text": "Complex statutory regulations regarding criteria.", "language": "en"},
        )
        self.assertEqual(sim_res.status_code, 200)

        # 5. Summarize text
        sum_res = self.client.post(
            "/api/v1/access/summarize",
            json={"text": "Detailed multi-paragraph legal documentation regarding government educational stipends.", "language": "en"},
        )
        self.assertEqual(sum_res.status_code, 200)
        self.assertIn("summary", sum_res.json().get("data", {}))

        # 6. Retry document processing
        retry_res = self.client.post(f"/api/v1/documents/{doc_id}/retry", headers=headers)
        self.assertEqual(retry_res.status_code, 200)

        # 7. Delete document
        del_res = self.client.delete(f"/api/v1/documents/{doc_id}", headers=headers)
        self.assertEqual(del_res.status_code, 200)


if __name__ == "__main__":
    unittest.main()
