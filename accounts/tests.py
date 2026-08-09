"""Tests for authentication, email verification, and session handling.

Throttling is disabled for most tests via TEST_THROTTLES; the throttle
behaviour itself gets its own test class at the bottom.
"""
import re

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core import mail
from django.core.cache import cache
from django.test import TestCase, override_settings
from django.utils import timezone

from .models import EmailVerificationCode

User = get_user_model()

EMAIL = "user@example.com"
PASSWORD = "Str0ng!Passw0rd"

# Rates high enough that ordinary tests never trip them.
NO_THROTTLE = {
    **settings.REST_FRAMEWORK,
    "DEFAULT_THROTTLE_RATES": {
        "anon": "10000/hour",
        "user": "10000/hour",
        "login": "10000/hour",
        "register": "10000/hour",
        "verify": "10000/hour",
        "resend": "10000/hour",
    },
}

MEMORY_MAIL = "django.core.mail.backends.locmem.EmailBackend"


@override_settings(REST_FRAMEWORK=NO_THROTTLE, EMAIL_BACKEND=MEMORY_MAIL)
class AuthFlowTests(TestCase):
    def setUp(self):
        cache.clear()

    # --- helpers -------------------------------------------------------

    def register(self, email=EMAIL, username="tester", password=PASSWORD):
        return self.client.post(
            "/api/auth/register/",
            {"username": username, "email": email, "password": password},
            content_type="application/json",
        )

    def code_from_last_email(self):
        return re.search(r"\b(\d{6})\b", mail.outbox[-1].body).group(1)

    def register_and_verify(self):
        self.register()
        code = self.code_from_last_email()
        return self.client.post(
            "/api/auth/verify/",
            {"email": EMAIL, "code": code},
            content_type="application/json",
        )

    def login(self, email=EMAIL, password=PASSWORD):
        return self.client.post(
            "/api/auth/login/",
            {"email": email, "password": password},
            content_type="application/json",
        )

    # --- registration --------------------------------------------------

    def test_register_creates_inactive_user_and_sends_code(self):
        response = self.register()
        self.assertEqual(response.status_code, 201)
        self.assertIn("message", response.json())

        user = User.objects.get(email=EMAIL)
        self.assertFalse(user.is_active, "new users must stay inactive until verified")
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn(self.code_from_last_email(), mail.outbox[0].body)

    def test_register_hashes_the_password(self):
        self.register()
        user = User.objects.get(email=EMAIL)
        self.assertNotEqual(user.password, PASSWORD)
        self.assertTrue(user.check_password(PASSWORD))

    def test_register_never_echoes_the_password(self):
        self.assertNotIn("password", self.register().json())

    def test_duplicate_email_is_rejected_case_insensitively(self):
        self.register()
        response = self.register(email=EMAIL.upper(), username="other")
        self.assertEqual(response.status_code, 400)
        self.assertEqual(User.objects.filter(email__iexact=EMAIL).count(), 1)

    def test_weak_password_is_rejected(self):
        response = self.register(password="password")
        self.assertEqual(response.status_code, 400)
        self.assertFalse(User.objects.filter(email=EMAIL).exists())

    def test_short_password_is_rejected(self):
        self.assertEqual(self.register(password="ab1!").status_code, 400)

    def test_error_response_has_message_key_for_the_frontend(self):
        # Login.jsx / Signup.jsx read err.response.data.message
        self.assertIn("message", self.register(password="password").json())

    # --- verification --------------------------------------------------

    def test_verify_with_correct_code_activates_and_logs_in(self):
        response = self.register_and_verify()
        self.assertEqual(response.status_code, 200)
        self.assertTrue(User.objects.get(email=EMAIL).is_active)
        self.assertIn(settings.AUTH_COOKIE, response.cookies)
        self.assertIn(settings.AUTH_COOKIE_REFRESH, response.cookies)

    def test_auth_cookies_are_httponly(self):
        response = self.register_and_verify()
        for name in (settings.AUTH_COOKIE, settings.AUTH_COOKIE_REFRESH):
            self.assertTrue(response.cookies[name]["httponly"], f"{name} must be httpOnly")

    def test_verify_with_wrong_code_fails_and_counts_the_attempt(self):
        self.register()
        code = self.code_from_last_email()
        wrong = "000000" if code != "000000" else "111111"

        response = self.client.post(
            "/api/auth/verify/",
            {"email": EMAIL, "code": wrong},
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertFalse(User.objects.get(email=EMAIL).is_active)
        self.assertEqual(EmailVerificationCode.objects.get(user__email=EMAIL).attempts, 1)

    def test_code_cannot_be_reused(self):
        self.register_and_verify()
        replay = self.client.post(
            "/api/auth/verify/",
            {"email": EMAIL, "code": self.code_from_last_email()},
            content_type="application/json",
        )
        self.assertEqual(replay.status_code, 400)

    def test_code_stops_working_after_max_attempts(self):
        self.register()
        code = self.code_from_last_email()
        record = EmailVerificationCode.objects.get(user__email=EMAIL)
        record.attempts = EmailVerificationCode.MAX_ATTEMPTS
        record.save(update_fields=["attempts"])

        response = self.client.post(
            "/api/auth/verify/",
            {"email": EMAIL, "code": code},
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertFalse(User.objects.get(email=EMAIL).is_active)

    def test_expired_code_is_rejected(self):
        self.register()
        code = self.code_from_last_email()
        record = EmailVerificationCode.objects.get(user__email=EMAIL)
        record.expires_at = timezone.now() - EmailVerificationCode.LIFETIME
        record.save(update_fields=["expires_at"])

        response = self.client.post(
            "/api/auth/verify/",
            {"email": EMAIL, "code": code},
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 400)

    def test_raw_code_is_never_stored(self):
        self.register()
        code = self.code_from_last_email()
        record = EmailVerificationCode.objects.get(user__email=EMAIL)
        self.assertNotEqual(record.code_hash, code)
        self.assertEqual(record.code_hash, EmailVerificationCode.hash_code(code))

    def test_resend_invalidates_the_previous_code(self):
        self.register()
        first_code = self.code_from_last_email()
        self.client.post(
            "/api/auth/resend/", {"email": EMAIL}, content_type="application/json"
        )

        response = self.client.post(
            "/api/auth/verify/",
            {"email": EMAIL, "code": first_code},
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 400, "superseded code must not work")

        newest = self.client.post(
            "/api/auth/verify/",
            {"email": EMAIL, "code": self.code_from_last_email()},
            content_type="application/json",
        )
        self.assertEqual(newest.status_code, 200)

    def test_resend_does_not_reveal_whether_an_account_exists(self):
        self.register()
        known = self.client.post(
            "/api/auth/resend/", {"email": EMAIL}, content_type="application/json"
        )
        unknown = self.client.post(
            "/api/auth/resend/",
            {"email": "ghost@example.com"},
            content_type="application/json",
        )
        self.assertEqual(known.status_code, unknown.status_code)
        self.assertEqual(known.json(), unknown.json())

    # --- login ---------------------------------------------------------

    def test_login_blocked_until_verified(self):
        self.register()
        response = self.login()
        self.assertEqual(response.status_code, 401)
        self.assertIn("verify", response.json()["message"].lower())

    def test_login_succeeds_after_verification(self):
        self.register_and_verify()
        self.client.post("/api/auth/logout/")

        response = self.login()
        self.assertEqual(response.status_code, 200)
        self.assertIn(settings.AUTH_COOKIE, response.cookies)
        self.assertEqual(response.json()["user"]["email"], EMAIL)

    def test_wrong_password_and_unknown_email_are_indistinguishable(self):
        self.register_and_verify()
        wrong_password = self.login(password="not-the-password")
        unknown_email = self.login(email="ghost@example.com", password="whatever")

        self.assertEqual(wrong_password.status_code, 401)
        self.assertEqual(unknown_email.status_code, 401)
        self.assertEqual(
            wrong_password.json()["message"],
            unknown_email.json()["message"],
            "differing messages would let an attacker enumerate accounts",
        )

    # --- session -------------------------------------------------------

    def test_me_requires_authentication(self):
        self.assertEqual(self.client.get("/api/auth/me/").status_code, 401)

    def test_me_returns_the_current_user_without_the_password(self):
        self.register_and_verify()
        body = self.client.get("/api/auth/me/").json()
        self.assertEqual(body["email"], EMAIL)
        self.assertNotIn("password", body)

    def test_logout_ends_the_session(self):
        self.register_and_verify()
        self.assertEqual(self.client.get("/api/auth/me/").status_code, 200)

        self.assertEqual(self.client.post("/api/auth/logout/").status_code, 200)
        self.assertEqual(self.client.get("/api/auth/me/").status_code, 401)

    def test_refresh_issues_a_new_access_token(self):
        self.register_and_verify()
        old_access = self.client.cookies[settings.AUTH_COOKIE].value
        old_refresh = self.client.cookies[settings.AUTH_COOKIE_REFRESH].value

        response = self.client.post("/api/auth/refresh/")
        self.assertEqual(response.status_code, 200)
        self.assertNotEqual(self.client.cookies[settings.AUTH_COOKIE].value, old_access)
        self.assertNotEqual(
            self.client.cookies[settings.AUTH_COOKIE_REFRESH].value,
            old_refresh,
            "refresh tokens must rotate",
        )
        self.assertEqual(self.client.get("/api/auth/me/").status_code, 200)

    def test_rotated_refresh_token_cannot_be_replayed(self):
        self.register_and_verify()
        stolen = self.client.cookies[settings.AUTH_COOKIE_REFRESH].value
        self.client.post("/api/auth/refresh/")

        attacker = self.client_class()
        attacker.cookies[settings.AUTH_COOKIE_REFRESH] = stolen
        self.assertEqual(attacker.post("/api/auth/refresh/").status_code, 401)

    def test_refresh_fails_after_logout(self):
        self.register_and_verify()
        refresh = self.client.cookies[settings.AUTH_COOKIE_REFRESH].value
        self.client.post("/api/auth/logout/")

        replay = self.client_class()
        replay.cookies[settings.AUTH_COOKIE_REFRESH] = refresh
        self.assertEqual(replay.post("/api/auth/refresh/").status_code, 401)

    def test_refresh_without_a_cookie_is_401(self):
        self.assertEqual(self.client.post("/api/auth/refresh/").status_code, 401)

    def test_deactivated_user_loses_access(self):
        self.register_and_verify()
        User.objects.filter(email=EMAIL).update(is_active=False)
        self.assertEqual(self.client.get("/api/auth/me/").status_code, 401)

    def test_can_log_in_again_after_logging_out(self):
        # Regression: delete_cookie() leaves an empty-string cookie, and an
        # empty token used to 401 the login request itself.
        self.register_and_verify()
        self.client.post("/api/auth/logout/")
        self.assertEqual(self.login().status_code, 200)

    def test_empty_auth_cookie_is_treated_as_logged_out(self):
        self.client.cookies[settings.AUTH_COOKIE] = ""
        self.assertEqual(self.client.get("/api/auth/me/").status_code, 401)

    def test_tampered_token_is_rejected(self):
        self.register_and_verify()
        token = self.client.cookies[settings.AUTH_COOKIE].value
        self.client.cookies[settings.AUTH_COOKIE] = token[:-4] + "AAAA"
        self.assertEqual(self.client.get("/api/auth/me/").status_code, 401)


@override_settings(EMAIL_BACKEND=MEMORY_MAIL)
class ThrottleTests(TestCase):
    """Rate limits use the real configured rates, so these run separately."""

    def setUp(self):
        cache.clear()

    def tearDown(self):
        cache.clear()

    def test_resend_is_rate_limited(self):
        statuses = [
            self.client.post(
                "/api/auth/resend/",
                {"email": "nobody@example.com"},
                content_type="application/json",
            ).status_code
            for _ in range(5)
        ]
        self.assertIn(429, statuses, "resend must be throttled to protect inboxes")
        self.assertEqual(statuses.count(200), 3, "configured rate is 3/hour")

    def test_register_is_rate_limited(self):
        statuses = [
            self.client.post(
                "/api/auth/register/",
                {
                    "username": f"user{i}",
                    "email": f"user{i}@example.com",
                    "password": PASSWORD,
                },
                content_type="application/json",
            ).status_code
            for i in range(7)
        ]
        self.assertIn(429, statuses, "register must be throttled")
