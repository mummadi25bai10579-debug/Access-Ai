import unittest
import sys
import os
import time
import jwt
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.primitives import serialization

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from app.core.security import verify_jwt_token
from app.core.exceptions import UnauthorizedError
from app.database.repositories.profile_repository import ProfileRepository
from app.config import settings

class TestClerkAuthAndIsolation(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # Generate an in-memory RSA keypair for testing valid and forged tokens
        cls.private_key = rsa.generate_private_key(
            public_exponent=65537,
            key_size=2048,
        )
        cls.public_key_pem = cls.private_key.public_key().public_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo,
        ).decode("utf-8")

        # Configure settings to use direct public key for test
        cls.orig_pem = settings.CLERK_PEM_PUBLIC_KEY
        cls.orig_env = settings.APP_ENV
        settings.CLERK_PEM_PUBLIC_KEY = cls.public_key_pem

    @classmethod
    def tearDownClass(cls):
        settings.CLERK_PEM_PUBLIC_KEY = cls.orig_pem
        settings.APP_ENV = cls.orig_env

    def _create_token(self, payload, headers=None, key=None):
        headers = headers or {"alg": "RS256", "kid": "test-key-id"}
        if settings.CLERK_ISSUER and "iss" not in payload:
            payload["iss"] = settings.CLERK_ISSUER
        private_bytes = (key or self.private_key).private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.PKCS8,
            encryption_algorithm=serialization.NoEncryption(),
        )
        return jwt.encode(payload, private_bytes, algorithm="RS256", headers=headers)

    def test_missing_or_empty_token_raises_unauthorized(self):
        with self.assertRaises(UnauthorizedError):
            verify_jwt_token("")
        with self.assertRaises(UnauthorizedError):
            verify_jwt_token("Bearer   ")

    def test_valid_clerk_rsa_jwt(self):
        token = self._create_token({
            "sub": "user_2test_clerk_12345",
            "exp": time.time() + 3600,
            "iat": time.time(),
        })
        payload = verify_jwt_token(f"Bearer {token}")
        self.assertEqual(payload["sub"], "user_2test_clerk_12345")
        self.assertEqual(payload["clerk_user_id"], "user_2test_clerk_12345")

    def test_expired_jwt_raises_unauthorized(self):
        token = self._create_token({
            "sub": "user_2expired",
            "exp": time.time() - 100, # Expired in past
            "iat": time.time() - 500,
        })
        with self.assertRaises(UnauthorizedError) as ctx:
            verify_jwt_token(f"Bearer {token}")
        self.assertIn("expired", str(ctx.exception).lower())

    def test_algorithm_confusion_forgery_rejected(self):
        # Attempting HS256 symmetric forgery when server expects RS256
        forged_hs256 = jwt.encode({"sub": "attacker"}, "secret", algorithm="HS256", headers={"alg": "HS256", "kid": "fake"})
        with self.assertRaises(UnauthorizedError) as ctx:
            verify_jwt_token(forged_hs256)
        self.assertIn("unsupported signing algorithm", str(ctx.exception).lower())

    def test_missing_kid_rejected(self):
        token_without_kid = jwt.encode(
            {"sub": "user_1"},
            self.private_key.private_bytes(
                encoding=serialization.Encoding.PEM,
                format=serialization.PrivateFormat.PKCS8,
                encryption_algorithm=serialization.NoEncryption(),
            ),
            algorithm="RS256",
            headers={"alg": "RS256"} # Missing kid
        )
        with self.assertRaises(UnauthorizedError) as ctx:
            verify_jwt_token(token_without_kid)
        self.assertIn("missing key identifier", str(ctx.exception).lower())

    def test_user_data_isolation_cross_tenant_access_prevented(self):
        repo = ProfileRepository()
        user_a = "user_clerk_alice_101"
        user_b = "user_clerk_bob_202"

        # Alice creates her profile
        repo.create_or_update(
            clerk_user_id=user_a,
            full_name="Alice Smith",
            annual_family_income=120000.0,
            skills=["Python", "FastAPI"],
        )

        # Bob creates his profile
        repo.create_or_update(
            clerk_user_id=user_b,
            full_name="Bob Jones",
            annual_family_income=300000.0,
            skills=["Design", "Figma"],
        )

        # Alice's query only returns Alice's data
        alice_data = repo.get_by_clerk_id(user_a)
        self.assertEqual(alice_data["full_name"], "Alice Smith")
        self.assertEqual(alice_data["annual_family_income"], 120000.0)

        # Bob's query only returns Bob's data
        bob_data = repo.get_by_clerk_id(user_b)
        self.assertEqual(bob_data["full_name"], "Bob Jones")
        self.assertEqual(bob_data["annual_family_income"], 300000.0)

        # Bob cannot modify Alice's record through his session
        repo.create_or_update(
            clerk_user_id=user_b,
            full_name="Bob Hacked Alice",
            annual_family_income=999999.0,
        )

        # Verify Alice's record was untouched
        alice_check = repo.get_by_clerk_id(user_a)
        self.assertEqual(alice_check["full_name"], "Alice Smith")
        self.assertEqual(alice_check["annual_family_income"], 120000.0)

if __name__ == "__main__":
    unittest.main()

