"""Tests for authentication, email verification, and session handling.

Throttling is disabled for most tests via TEST_THROTTLES; the throttle
behaviour itself gets its own test class at the bottom.
"""
import io
import json
import re
import shutil
import tempfile
from unittest.mock import patch

import requests
from django.conf import settings
from django.contrib.auth import get_user_model
from django.core import mail
from django.core.cache import cache
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase, override_settings
from django.utils import timezone
from pypdf import PdfWriter

from .models import Education, EmailVerificationCode, Experience, Profile
from .resume_parsers import ResumeParseError, extract_text, parse_resume

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


@override_settings(REST_FRAMEWORK=NO_THROTTLE, EMAIL_BACKEND=MEMORY_MAIL)
class ProfileTests(TestCase):
    """Profile, experience, education, and skills endpoints.

    Every route is per-user: the profile is always the caller's own, and
    nothing accepts an id that would let one account reach another's rows.
    """

    # The routes as the frontend calls them, so a typo in urls.py fails here
    # rather than silently 404ing in the browser.
    PROFILE = "/api/auth/profile/"
    PERSONAL = "/api/auth/profile/personal/"
    EXPERIENCE = "/api/auth/profile/experience/"
    EDUCATION = "/api/auth/profile/education/"
    SKILLS = "/api/auth/profile/skills/"

    EXPERIENCE_PAYLOAD = {
        "title": "Backend Engineer",
        "company": "Acme",
        "employment_type": "Full-time",
        "start_date": "Jan 2020",
        "current": True,
    }
    EDUCATION_PAYLOAD = {
        "institution": "State University",
        "degree": "B.Tech",
        "field_of_study": "Computer Science",
        "start_date": "2016",
        "end_date": "2020",
    }

    def setUp(self):
        cache.clear()

    # --- helpers -------------------------------------------------------

    def sign_in(self, client=None, email=EMAIL, username="tester"):
        """Register and verify a user; leaves auth cookies on the client."""
        client = client or self.client
        client.post(
            "/api/auth/register/",
            {"username": username, "email": email, "password": PASSWORD},
            content_type="application/json",
        )
        code = re.search(r"\b(\d{6})\b", mail.outbox[-1].body).group(1)
        client.post(
            "/api/auth/verify/",
            {"email": email, "code": code},
            content_type="application/json",
        )
        return client

    def post_json(self, client, url, payload):
        return client.post(url, payload, content_type="application/json")

    def patch_json(self, client, url, payload):
        return client.patch(url, payload, content_type="application/json")

    # --- authentication ------------------------------------------------

    def test_every_profile_route_requires_authentication(self):
        routes = [
            ("get", self.PROFILE),
            ("patch", self.PERSONAL),
            ("post", self.EXPERIENCE),
            ("delete", f"{self.EXPERIENCE}1/"),
            ("post", self.EDUCATION),
            ("delete", f"{self.EDUCATION}1/"),
            ("patch", self.SKILLS),
        ]
        for method, url in routes:
            with self.subTest(method=method, url=url):
                response = getattr(self.client, method)(
                    url, content_type="application/json"
                )
                self.assertEqual(response.status_code, 401)

    # --- reading the profile -------------------------------------------

    def test_first_fetch_creates_the_profile_row(self):
        self.sign_in()
        self.assertFalse(Profile.objects.filter(user__email=EMAIL).exists())

        response = self.client.get(self.PROFILE)

        self.assertEqual(response.status_code, 200)
        self.assertTrue(Profile.objects.filter(user__email=EMAIL).exists())

    def test_new_profile_is_empty_but_carries_the_account_identity(self):
        self.sign_in()
        body = self.client.get(self.PROFILE).json()

        self.assertEqual(body["email"], EMAIL)
        self.assertEqual(body["username"], "tester")
        self.assertEqual(body["first_name"], "")
        self.assertEqual(body["skills"], [])
        self.assertEqual(body["experience"], [])
        self.assertEqual(body["education"], [])

    def test_fetching_twice_reuses_the_same_profile(self):
        self.sign_in()
        self.client.get(self.PROFILE)
        self.client.get(self.PROFILE)
        self.assertEqual(Profile.objects.filter(user__email=EMAIL).count(), 1)

    def test_profile_never_exposes_the_password(self):
        self.sign_in()
        self.assertNotIn("password", self.client.get(self.PROFILE).json())

    def test_each_user_sees_only_their_own_profile(self):
        first = self.sign_in(email="first@example.com", username="first")
        self.patch_json(first, self.PERSONAL, {"first_name": "First"})

        second = self.sign_in(
            self.client_class(), email="second@example.com", username="second"
        )
        body = second.get(self.PROFILE).json()

        self.assertEqual(body["email"], "second@example.com")
        self.assertEqual(body["first_name"], "")

    # --- personal info -------------------------------------------------

    def test_personal_info_is_saved_and_returned(self):
        self.sign_in()
        response = self.patch_json(
            self.client,
            self.PERSONAL,
            {"first_name": "Ada", "last_name": "Lovelace", "city": "London"},
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["first_name"], "Ada")
        self.assertEqual(self.client.get(self.PROFILE).json()["city"], "London")

    def test_personal_info_patch_leaves_untouched_fields_alone(self):
        self.sign_in()
        self.patch_json(
            self.client, self.PERSONAL, {"first_name": "Ada", "city": "London"}
        )
        self.patch_json(self.client, self.PERSONAL, {"city": "Paris"})

        body = self.client.get(self.PROFILE).json()
        self.assertEqual(body["city"], "Paris")
        self.assertEqual(body["first_name"], "Ada", "partial update must not clear fields")

    def test_personal_info_patch_creates_the_profile_if_absent(self):
        # The frontend can PATCH before ever issuing a GET.
        self.sign_in()
        response = self.patch_json(self.client, self.PERSONAL, {"first_name": "Ada"})

        self.assertEqual(response.status_code, 200)
        self.assertEqual(Profile.objects.get(user__email=EMAIL).first_name, "Ada")

    def test_personal_info_rejects_a_malformed_url(self):
        self.sign_in()
        response = self.patch_json(self.client, self.PERSONAL, {"linkedin": "not-a-url"})
        self.assertEqual(response.status_code, 400)

    def test_personal_info_cannot_overwrite_resume_metadata(self):
        # resume_file_name is read-only; the parser owns it.
        self.sign_in()
        self.patch_json(self.client, self.PERSONAL, {"resume_file_name": "fake.pdf"})
        self.assertEqual(Profile.objects.get(user__email=EMAIL).resume_file_name, "")

    # --- experience ----------------------------------------------------

    def test_experience_is_added_to_the_callers_profile(self):
        self.sign_in()
        response = self.post_json(self.client, self.EXPERIENCE, self.EXPERIENCE_PAYLOAD)

        self.assertEqual(response.status_code, 201)
        self.assertIn("id", response.json(), "the frontend keys deletes off this id")

        entries = self.client.get(self.PROFILE).json()["experience"]
        self.assertEqual(len(entries), 1)
        self.assertEqual(entries[0]["title"], "Backend Engineer")
        self.assertEqual(
            Experience.objects.get().profile.user.email,
            EMAIL,
            "the entry must attach to the caller, not to some other profile",
        )

    def test_experience_requires_a_title_and_company(self):
        self.sign_in()
        response = self.post_json(self.client, self.EXPERIENCE, {"company": "Acme"})

        self.assertEqual(response.status_code, 400)
        self.assertFalse(Experience.objects.exists())

    def test_experience_can_be_deleted_by_its_owner(self):
        self.sign_in()
        created = self.post_json(
            self.client, self.EXPERIENCE, self.EXPERIENCE_PAYLOAD
        ).json()

        response = self.client.delete(f"{self.EXPERIENCE}{created['id']}/")

        self.assertEqual(response.status_code, 204)
        self.assertFalse(Experience.objects.filter(pk=created["id"]).exists())

    def test_cannot_delete_another_users_experience(self):
        victim = self.sign_in(email="victim@example.com", username="victim")
        created = self.post_json(
            victim, self.EXPERIENCE, self.EXPERIENCE_PAYLOAD
        ).json()

        attacker = self.sign_in(
            self.client_class(), email="attacker@example.com", username="attacker"
        )
        response = attacker.delete(f"{self.EXPERIENCE}{created['id']}/")

        self.assertEqual(response.status_code, 404, "must not confirm the row exists")
        self.assertTrue(
            Experience.objects.filter(pk=created["id"]).exists(),
            "another user's experience must survive the attempt",
        )

    def test_deleting_a_missing_experience_is_404(self):
        self.sign_in()
        self.assertEqual(self.client.delete(f"{self.EXPERIENCE}999/").status_code, 404)

    # --- education -----------------------------------------------------

    def test_education_is_added_to_the_callers_profile(self):
        self.sign_in()
        response = self.post_json(self.client, self.EDUCATION, self.EDUCATION_PAYLOAD)

        self.assertEqual(response.status_code, 201)
        self.assertIn("id", response.json())

        entries = self.client.get(self.PROFILE).json()["education"]
        self.assertEqual(len(entries), 1)
        self.assertEqual(entries[0]["institution"], "State University")
        self.assertEqual(Education.objects.get().profile.user.email, EMAIL)

    def test_education_requires_an_institution_and_degree(self):
        self.sign_in()
        response = self.post_json(self.client, self.EDUCATION, {"grade": "A"})

        self.assertEqual(response.status_code, 400)
        self.assertFalse(Education.objects.exists())

    def test_education_can_be_deleted_by_its_owner(self):
        self.sign_in()
        created = self.post_json(
            self.client, self.EDUCATION, self.EDUCATION_PAYLOAD
        ).json()

        response = self.client.delete(f"{self.EDUCATION}{created['id']}/")

        self.assertEqual(response.status_code, 204)
        self.assertFalse(Education.objects.filter(pk=created["id"]).exists())

    def test_cannot_delete_another_users_education(self):
        victim = self.sign_in(email="victim@example.com", username="victim")
        created = self.post_json(victim, self.EDUCATION, self.EDUCATION_PAYLOAD).json()

        attacker = self.sign_in(
            self.client_class(), email="attacker@example.com", username="attacker"
        )
        response = attacker.delete(f"{self.EDUCATION}{created['id']}/")

        self.assertEqual(response.status_code, 404)
        self.assertTrue(Education.objects.filter(pk=created["id"]).exists())

    # --- skills --------------------------------------------------------

    def test_skills_are_saved(self):
        self.sign_in()
        response = self.patch_json(
            self.client, self.SKILLS, {"skills": ["Python", "Django"]}
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["skills"], ["Python", "Django"])
        self.assertEqual(self.client.get(self.PROFILE).json()["skills"], ["Python", "Django"])

    def test_skills_patch_replaces_rather_than_appends(self):
        # The frontend sends the whole list every time.
        self.sign_in()
        self.patch_json(self.client, self.SKILLS, {"skills": ["Python", "Django"]})
        response = self.patch_json(self.client, self.SKILLS, {"skills": ["Go"]})

        self.assertEqual(response.json()["skills"], ["Go"])

    def test_skills_are_trimmed_and_deduplicated_case_insensitively(self):
        self.sign_in()
        response = self.patch_json(
            self.client,
            self.SKILLS,
            {"skills": ["Python", " python ", "PYTHON", "Django"]},
        )

        self.assertEqual(
            response.json()["skills"],
            ["Python", "Django"],
            "the first spelling wins and duplicates are dropped",
        )

    def test_skills_can_be_cleared(self):
        self.sign_in()
        self.patch_json(self.client, self.SKILLS, {"skills": ["Python"]})
        response = self.patch_json(self.client, self.SKILLS, {"skills": []})

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["skills"], [])

    def test_skills_must_be_a_list_of_strings(self):
        self.sign_in()
        self.assertEqual(
            self.patch_json(self.client, self.SKILLS, {"skills": "Python"}).status_code,
            400,
        )
        self.assertEqual(
            self.patch_json(self.client, self.SKILLS, {"skills": [{"a": 1}]}).status_code,
            400,
        )

    def test_skills_of_one_user_do_not_leak_into_another(self):
        first = self.sign_in(email="first@example.com", username="first")
        self.patch_json(first, self.SKILLS, {"skills": ["Python"]})

        second = self.sign_in(
            self.client_class(), email="second@example.com", username="second"
        )
        self.assertEqual(second.get(self.PROFILE).json()["skills"], [])


def make_pdf(lines) -> bytes:
    """A minimal one-page PDF showing `lines`.

    Written by hand because pypdf can add pages but not draw text on them,
    and these tests need a file the extractor can actually read.
    """
    if isinstance(lines, str):
        lines = [lines]

    drawn = []
    for offset, line in enumerate(lines):
        escaped = line.replace("\\", r"\\").replace("(", r"\(").replace(")", r"\)")
        drawn.append(f"BT /F1 12 Tf 40 {750 - offset * 16} Td ({escaped}) Tj ET")
    stream = "\n".join(drawn).encode("latin-1")

    objects = [
        b"<< /Type /Catalog /Pages 2 0 R >>",
        b"<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
        b"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] "
        b"/Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>",
        b"<< /Length %d >>\nstream\n%s\nendstream" % (len(stream), stream),
        b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    ]

    out = bytearray(b"%PDF-1.4\n")
    offsets = []
    for number, body in enumerate(objects, start=1):
        offsets.append(len(out))
        out += b"%d 0 obj\n%s\nendobj\n" % (number, body)

    start_xref = len(out)
    out += b"xref\n0 %d\n" % (len(objects) + 1)
    out += b"0000000000 65535 f \n"
    for offset in offsets:
        out += b"%010d 00000 n \n" % offset
    out += b"trailer\n<< /Size %d /Root 1 0 R >>\nstartxref\n%d\n%%%%EOF\n" % (
        len(objects) + 1,
        start_xref,
    )
    return bytes(out)


# Enough text to clear MIN_TEXT_CHARS in the extractor.
RESUME_LINES = [
    "Priya Sharma - Senior Backend Engineer",
    "priya@example.com | Bengaluru, India",
    "Skills: Python, Django, PostgreSQL, Redis, Docker",
    "Zomato, Senior Backend Engineer, Mar 2022 - Present",
]

# What Groq returns for the resume above, in the shape RESUME_SCHEMA pins.
GROQ_PARSED = {
    "first_name": "Priya",
    "last_name": "Sharma",
    "designation": "Senior Backend Engineer",
    "phone": None,
    "contact_email": "priya@example.com",
    "country": "India",
    "city": "Bengaluru",
    "summary": None,
    "linkedin": "linkedin.com/in/priyasharma",
    "github": None,
    "portfolio": None,
    "skills": ["Python", "Django", "PostgreSQL"],
    "experience": [
        {
            "title": "Senior Backend Engineer",
            "company": "Zomato",
            "employment_type": "Full-time",
            "start_date": "Mar 2022",
            "end_date": "Present",
            "current": True,
        }
    ],
    "education": [
        {
            "institution": "RV College of Engineering",
            "degree": "B.E.",
            "field_of_study": None,
            "grade": None,
            "start_date": "2015",
            "end_date": "2019",
            "current": False,
        }
    ],
}


def groq_response(payload, status_code=200):
    """A stand-in for the requests.Response that _call_groq expects."""
    response = requests.Response()
    response.status_code = status_code
    response._content = json.dumps(
        {"choices": [{"message": {"content": json.dumps(payload)}}]}
    ).encode()
    return response


class ResumeExtractionTests(TestCase):
    """extract_text against real PDF bytes — no network involved."""

    def test_reads_text_from_a_pdf(self):
        text = extract_text(io.BytesIO(make_pdf(RESUME_LINES)))
        self.assertIn("Priya Sharma", text)
        self.assertIn("priya@example.com", text)

    def test_rejects_a_file_that_is_not_a_pdf(self):
        with self.assertRaises(ResumeParseError) as caught:
            extract_text(io.BytesIO(b"this is not a pdf"))
        self.assertIn("valid PDF", str(caught.exception))

    def test_rejects_a_pdf_with_no_selectable_text(self):
        # Stands in for a scan: a real PDF, but nothing to extract.
        writer = PdfWriter()
        writer.add_blank_page(width=612, height=792)
        buffer = io.BytesIO()
        writer.write(buffer)

        with self.assertRaises(ResumeParseError) as caught:
            extract_text(buffer)
        self.assertIn("No text", str(caught.exception))

    def test_long_text_is_truncated_before_it_reaches_groq(self):
        from .resume_parsers import MAX_TEXT_CHARS

        with patch("accounts.resume_parsers.PdfReader") as reader:
            reader.return_value.is_encrypted = False
            page = type("P", (), {"extract_text": lambda self: "x" * 200_000})()
            reader.return_value.pages = [page]

            self.assertEqual(
                len(extract_text(io.BytesIO(b"%PDF-1.4"))), MAX_TEXT_CHARS
            )

    # --- glyph-spaced PDFs ---------------------------------------------
    # Canva/Figma-style resumes place each glyph separately, so pypdf yields
    # "S U M M A R Y". Left alone, phone numbers and emails come back
    # unusable and the skills list comes back empty.

    def test_glyph_spaced_text_is_reassembled(self):
        spaced = [
            "P R O F E S S I O N A L  S U M M A R Y",
            "B a c k e n d  e n g i n e e r  b a s e d  i n  B e n g a l u r u",
            "9 5 9 9 8 4 1 6 8 0  |  p r i y a @ e x a m p l e . c o m",
            "S k i l l s :  P y t h o n ,  D j a n g o ,  P o s t g r e S Q L",
        ]
        text = extract_text(io.BytesIO(make_pdf(spaced)))

        self.assertIn("PROFESSIONAL SUMMARY", text)
        self.assertIn("9599841680", text, "a spaced-out phone number is unusable")
        self.assertIn("priya@example.com", text, "a spaced-out email fails EmailField")

    def test_ordinary_text_is_left_alone(self):
        text = extract_text(io.BytesIO(make_pdf(RESUME_LINES)))
        # The collapse must not run on normal resumes and glue words together.
        self.assertIn("Priya Sharma", text)
        self.assertNotIn("PriyaSharma", text)

    def test_a_single_spaced_banner_does_not_trigger_the_collapse(self):
        lines = ["N I S H A N T  S I N G H"] + RESUME_LINES
        text = extract_text(io.BytesIO(make_pdf(lines)))
        self.assertIn("Priya Sharma", text)
        self.assertNotIn("PriyaSharma", text)


@override_settings(GROQ_API_KEY="test-key")
class ResumeParserTests(TestCase):
    """parse_resume with the Groq HTTP call mocked."""

    def parse(self, response):
        with patch("accounts.resume_parsers.requests.post", return_value=response):
            return parse_resume(io.BytesIO(make_pdf(RESUME_LINES)))

    def test_nulls_become_empty_strings(self):
        result = self.parse(groq_response(GROQ_PARSED))
        # The profile serializers use blank, never null.
        self.assertEqual(result["phone"], "")
        self.assertEqual(result["summary"], "")
        self.assertEqual(result["first_name"], "Priya")

    def test_nested_nulls_become_blank_too(self):
        result = self.parse(groq_response(GROQ_PARSED))
        self.assertEqual(result["education"][0]["field_of_study"], "")
        self.assertEqual(result["education"][0]["grade"], "")

    def test_dates_are_left_exactly_as_written(self):
        entry = self.parse(groq_response(GROQ_PARSED))["experience"][0]
        self.assertEqual(entry["start_date"], "Mar 2022")
        self.assertEqual(entry["end_date"], "Present")
        self.assertIs(entry["current"], True)

    def test_entries_without_an_employer_are_dropped(self):
        payload = {
            **GROQ_PARSED,
            "experience": [
                {**GROQ_PARSED["experience"][0], "company": None},
                GROQ_PARSED["experience"][0],
            ],
        }
        result = self.parse(groq_response(payload))
        self.assertEqual(len(result["experience"]), 1, "the null-company row is noise")

    def test_entries_without_an_institution_are_dropped(self):
        payload = {
            **GROQ_PARSED,
            "education": [{**GROQ_PARSED["education"][0], "institution": "   "}],
        }
        self.assertEqual(self.parse(groq_response(payload))["education"], [])

    def test_blank_skills_are_stripped(self):
        payload = {**GROQ_PARSED, "skills": ["Python", "  ", "", " Django "]}
        self.assertEqual(
            self.parse(groq_response(payload))["skills"], ["Python", "Django"]
        )

    def test_missing_api_key_is_reported_not_crashed(self):
        with override_settings(GROQ_API_KEY=""):
            with self.assertRaises(ResumeParseError) as caught:
                parse_resume(io.BytesIO(make_pdf(RESUME_LINES)))
        self.assertIn("not configured", str(caught.exception))

    def test_rate_limit_gets_a_try_again_message(self):
        with self.assertRaises(ResumeParseError) as caught:
            self.parse(groq_response({}, status_code=429))
        self.assertIn("busy", str(caught.exception))

    def test_server_error_does_not_leak_the_groq_body(self):
        response = requests.Response()
        response.status_code = 500
        response._content = b'{"error":"internal detail with sk-secret"}'
        with patch("accounts.resume_parsers.requests.post", return_value=response):
            with self.assertRaises(ResumeParseError) as caught:
                parse_resume(io.BytesIO(make_pdf(RESUME_LINES)))
        self.assertNotIn("sk-secret", str(caught.exception))

    def test_timeout_is_reported_as_retryable(self):
        with patch(
            "accounts.resume_parsers.requests.post", side_effect=requests.Timeout
        ):
            with self.assertRaises(ResumeParseError) as caught:
                parse_resume(io.BytesIO(make_pdf(RESUME_LINES)))
        self.assertIn("too long", str(caught.exception))

    def test_unreachable_service_is_reported(self):
        with patch(
            "accounts.resume_parsers.requests.post",
            side_effect=requests.ConnectionError,
        ):
            with self.assertRaises(ResumeParseError) as caught:
                parse_resume(io.BytesIO(make_pdf(RESUME_LINES)))
        self.assertIn("Could not reach", str(caught.exception))

    def test_non_json_body_is_reported_not_crashed(self):
        response = requests.Response()
        response.status_code = 200
        response._content = b"<html>gateway error</html>"
        with patch("accounts.resume_parsers.requests.post", return_value=response):
            with self.assertRaises(ResumeParseError) as caught:
                parse_resume(io.BytesIO(make_pdf(RESUME_LINES)))
        self.assertIn("unexpected response", str(caught.exception))

    def test_the_request_sends_the_resume_text_and_pins_the_schema(self):
        with patch(
            "accounts.resume_parsers.requests.post",
            return_value=groq_response(GROQ_PARSED),
        ) as post:
            parse_resume(io.BytesIO(make_pdf(RESUME_LINES)))

        body = post.call_args.kwargs["json"]
        self.assertIn("Priya Sharma", body["messages"][1]["content"])
        self.assertEqual(body["temperature"], 0, "extraction must be repeatable")
        self.assertIs(
            body["response_format"]["json_schema"]["strict"],
            True,
            "strict mode is what guarantees the response shape",
        )


@override_settings(
    REST_FRAMEWORK=NO_THROTTLE,
    EMAIL_BACKEND=MEMORY_MAIL,
    GROQ_API_KEY="test-key",
    MEDIA_ROOT=tempfile.mkdtemp(prefix="resume-tests-"),
)
class ResumeUploadTests(TestCase):
    """The upload and download endpoints, with Groq mocked."""

    UPLOAD = "/api/auth/profile/resume/"
    DOWNLOAD = "/api/auth/profile/resume/download/"

    @classmethod
    def tearDownClass(cls):
        # Uploads land in a temp MEDIA_ROOT; don't leave them behind.
        shutil.rmtree(settings.MEDIA_ROOT, ignore_errors=True)
        super().tearDownClass()

    def setUp(self):
        cache.clear()

    def sign_in(self, client=None, email=EMAIL, username="tester"):
        client = client or self.client
        client.post(
            "/api/auth/register/",
            {"username": username, "email": email, "password": PASSWORD},
            content_type="application/json",
        )
        code = re.search(r"\b(\d{6})\b", mail.outbox[-1].body).group(1)
        client.post(
            "/api/auth/verify/",
            {"email": email, "code": code},
            content_type="application/json",
        )
        return client

    def pdf_upload(self, name="resume.pdf", content=None, content_type="application/pdf"):
        return SimpleUploadedFile(
            name,
            content if content is not None else make_pdf(RESUME_LINES),
            content_type=content_type,
        )

    def upload(self, client=None, response=None, **kwargs):
        client = client or self.client
        # `is None`, not `or`: a requests.Response for 4xx/5xx is falsy, so
        # `response or default` would quietly swap an error for a success.
        if response is None:
            response = groq_response(GROQ_PARSED)
        with patch("accounts.resume_parsers.requests.post", return_value=response):
            return client.post(self.UPLOAD, {"resume": self.pdf_upload(**kwargs)})

    # --- authentication ------------------------------------------------

    def test_upload_requires_authentication(self):
        self.assertEqual(
            self.client.post(self.UPLOAD, {"resume": self.pdf_upload()}).status_code,
            401,
        )

    def test_download_requires_authentication(self):
        self.assertEqual(self.client.get(self.DOWNLOAD).status_code, 401)

    # --- the happy path ------------------------------------------------

    def test_upload_returns_the_parsed_fields(self):
        self.sign_in()
        response = self.upload()

        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertEqual(body["resume_file_name"], "resume.pdf")
        self.assertEqual(body["parsed"]["first_name"], "Priya")
        self.assertEqual(body["parsed"]["skills"], ["Python", "Django", "PostgreSQL"])

    def test_upload_stores_the_file_and_stamps_the_time(self):
        self.sign_in()
        self.upload()

        profile = Profile.objects.get(user__email=EMAIL)
        self.assertTrue(profile.resume)
        self.assertIsNotNone(profile.resume_parsed_at)
        self.assertEqual(profile.resume_file_name, "resume.pdf")

    def test_parsed_data_is_not_written_to_the_profile(self):
        # It comes back for review; the user confirms via the other endpoints.
        self.sign_in()
        self.upload()

        profile = Profile.objects.get(user__email=EMAIL)
        self.assertEqual(profile.first_name, "")
        self.assertEqual(profile.skills, [])
        self.assertFalse(profile.experience.exists())

    def test_upload_does_not_overwrite_what_the_user_typed(self):
        self.sign_in()
        self.client.patch(
            "/api/auth/profile/personal/",
            {"first_name": "Manual"},
            content_type="application/json",
        )
        self.upload()

        self.assertEqual(Profile.objects.get(user__email=EMAIL).first_name, "Manual")

    def test_bare_profile_urls_get_a_scheme(self):
        # Groq returns "linkedin.com/in/x", but Profile.linkedin is a
        # URLField and would reject that on save.
        self.sign_in()
        parsed = self.upload().json()["parsed"]
        self.assertEqual(parsed["linkedin"], "https://linkedin.com/in/priyasharma")

    def test_parsed_values_are_accepted_by_the_personal_endpoint(self):
        # The whole point of parsing: the result must be saveable as-is.
        self.sign_in()
        parsed = self.upload().json()["parsed"]

        response = self.client.patch(
            "/api/auth/profile/personal/",
            {
                "first_name": parsed["first_name"],
                "linkedin": parsed["linkedin"],
                "city": parsed["city"],
            },
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)

    # --- validation ----------------------------------------------------

    def test_a_non_pdf_is_rejected(self):
        self.sign_in()
        response = self.client.post(
            self.UPLOAD,
            {
                "resume": self.pdf_upload(
                    name="notes.txt", content=b"hello", content_type="text/plain"
                )
            },
        )
        self.assertEqual(response.status_code, 400)

    def test_a_renamed_file_is_rejected_by_its_content(self):
        # Extension and content-type both say PDF; the bytes do not.
        self.sign_in()
        response = self.client.post(
            self.UPLOAD, {"resume": self.pdf_upload(content=b"MZ not a pdf at all")}
        )
        self.assertEqual(response.status_code, 400)

    def test_an_empty_file_is_rejected(self):
        self.sign_in()
        response = self.client.post(
            self.UPLOAD, {"resume": self.pdf_upload(content=b"")}
        )
        self.assertEqual(response.status_code, 400)

    def test_an_oversized_file_is_rejected(self):
        self.sign_in()
        oversized = b"%PDF-" + b"0" * settings.RESUME_MAX_BYTES
        response = self.client.post(
            self.UPLOAD, {"resume": self.pdf_upload(content=oversized)}
        )
        self.assertEqual(response.status_code, 400)

    def test_a_missing_file_is_rejected(self):
        self.sign_in()
        self.assertEqual(self.client.post(self.UPLOAD, {}).status_code, 400)

    def test_a_rejected_upload_never_reaches_groq(self):
        # Validation must happen before we spend a call.
        self.sign_in()
        with patch("accounts.resume_parsers.requests.post") as post:
            self.client.post(
                self.UPLOAD, {"resume": self.pdf_upload(content=b"not a pdf")}
            )
        post.assert_not_called()

    # --- failures ------------------------------------------------------

    def test_a_parse_failure_returns_a_readable_message(self):
        self.sign_in()
        response = self.upload(response=groq_response({}, status_code=429))

        self.assertEqual(response.status_code, 400)
        self.assertIn("busy", response.json()["message"])

    def test_a_failed_parse_stores_nothing(self):
        self.sign_in()
        self.upload(response=groq_response({}, status_code=500))

        profile = Profile.objects.filter(user__email=EMAIL).first()
        self.assertTrue(profile is None or not profile.resume)

    def test_a_failed_parse_leaves_the_previous_resume_in_place(self):
        self.sign_in()
        self.upload()
        original = Profile.objects.get(user__email=EMAIL).resume.name

        self.upload(response=groq_response({}, status_code=500), name="new.pdf")

        profile = Profile.objects.get(user__email=EMAIL)
        self.assertEqual(profile.resume.name, original)
        self.assertEqual(profile.resume_file_name, "resume.pdf")

    # --- replacing -----------------------------------------------------

    def test_reuploading_replaces_the_old_file(self):
        self.sign_in()
        self.upload()
        first = Profile.objects.get(user__email=EMAIL).resume

        self.upload(name="updated.pdf")
        profile = Profile.objects.get(user__email=EMAIL)

        self.assertEqual(profile.resume_file_name, "updated.pdf")
        self.assertNotEqual(profile.resume.name, first.name)
        self.assertFalse(
            first.storage.exists(first.name), "the replaced file must not linger"
        )

    def test_the_stored_filename_is_not_the_users(self):
        # resume_upload_path randomises it; a guessable path would matter if
        # MEDIA_ROOT were ever served directly.
        self.sign_in()
        self.upload(name="priya-resume.pdf")

        profile = Profile.objects.get(user__email=EMAIL)
        self.assertNotIn("priya-resume", profile.resume.name)
        self.assertTrue(profile.resume.name.endswith(".pdf"))

    # --- download ------------------------------------------------------

    def test_download_returns_the_stored_file(self):
        self.sign_in()
        self.upload()

        response = self.client.get(self.DOWNLOAD)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response["Content-Type"], "application/pdf")
        self.assertIn("resume.pdf", response["Content-Disposition"])
        self.assertTrue(b"".join(response.streaming_content).startswith(b"%PDF-"))

    def test_download_is_404_when_no_resume_was_uploaded(self):
        self.sign_in()
        self.client.get("/api/auth/profile/")  # creates the profile row
        self.assertEqual(self.client.get(self.DOWNLOAD).status_code, 404)

    def test_download_only_serves_the_callers_own_resume(self):
        owner = self.sign_in(email="owner@example.com", username="owner")
        self.upload(client=owner)

        other = self.sign_in(
            self.client_class(), email="other@example.com", username="other"
        )
        response = other.get(self.DOWNLOAD)

        self.assertEqual(
            response.status_code, 404, "must not serve another user's file"
        )


@override_settings(REST_FRAMEWORK=NO_THROTTLE, EMAIL_BACKEND=MEMORY_MAIL)
class SettingsFlowTests(TestCase):
    SETTINGS = "/api/auth/settings/"
    SETTINGS_PROFILE = "/api/auth/settings/profile/"
    SETTINGS_PASSWORD = "/api/auth/settings/password/"
    SETTINGS_ACCOUNT = "/api/auth/settings/account/"

    def setUp(self):
        cache.clear()

    def sign_in(self, client=None, email=EMAIL, username="tester", password=PASSWORD):
        client = client or self.client
        client.post(
            "/api/auth/register/",
            {"username": username, "email": email, "password": password},
            content_type="application/json",
        )
        code = re.search(r"\b(\d{6})\b", mail.outbox[-1].body).group(1)
        client.post(
            "/api/auth/verify/",
            {"email": email, "code": code},
            content_type="application/json",
        )
        return client

    def patch_json(self, client, url, payload):
        return client.patch(url, payload, content_type="application/json")

    def delete_json(self, client, url, payload):
        return client.delete(url, payload, content_type="application/json")

    # --- Authentication check ---

    def test_settings_routes_require_authentication(self):
        routes = [
            ("get", self.SETTINGS),
            ("patch", self.SETTINGS_PROFILE),
            ("patch", self.SETTINGS_PASSWORD),
            ("delete", self.SETTINGS_ACCOUNT),
        ]
        for method, url in routes:
            with self.subTest(method=method, url=url):
                response = getattr(self.client, method)(
                    url, content_type="application/json"
                )
                self.assertEqual(response.status_code, 401)

    # --- Overview ---

    def test_settings_overview_returns_user_details_and_zero_applied(self):
        self.sign_in()
        response = self.client.get(self.SETTINGS)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["username"], "tester")
        self.assertEqual(data["email"], EMAIL)
        self.assertEqual(data["total_applied"], 0)
        self.assertIn("date_joined", data)

    # --- Profile update (username & email) ---

    def test_update_username_succeeds(self):
        self.sign_in()
        response = self.patch_json(
            self.client, self.SETTINGS_PROFILE, {"username": "new_tester"}
        )
        self.assertEqual(response.status_code, 200)
        user = User.objects.get(email=EMAIL)
        self.assertEqual(user.username, "new_tester")

    def test_update_username_rejects_duplicate(self):
        self.sign_in(email="user1@example.com", username="user1")
        other = self.sign_in(
            self.client_class(), email="user2@example.com", username="user2"
        )
        response = self.patch_json(
            other, self.SETTINGS_PROFILE, {"username": "user1"}
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("already taken", response.json()["message"].lower())

    def test_update_email_deactivates_account_and_sends_verification_code(self):
        self.sign_in()
        mail.outbox.clear()

        new_email = "newemail@example.com"
        response = self.patch_json(
            self.client, self.SETTINGS_PROFILE, {"email": new_email}
        )
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json().get("email_changed"))

        user = User.objects.get(username="tester")
        self.assertEqual(user.email, new_email)
        self.assertFalse(user.is_active, "User must be deactivated until new email is verified")

        # Must have sent verification email to the new address
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].to, [new_email])

        # Session cookies must be cleared; subsequent request must be 401
        me_response = self.client.get("/api/auth/me/")
        self.assertEqual(me_response.status_code, 401)

    def test_update_email_rejects_existing_email(self):
        self.sign_in(email="user1@example.com", username="user1")
        other = self.sign_in(
            self.client_class(), email="user2@example.com", username="user2"
        )
        response = self.patch_json(
            other, self.SETTINGS_PROFILE, {"email": "user1@example.com"}
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("already registered", response.json()["message"].lower())

    # --- Change password ---

    def test_change_password_with_wrong_current_password_fails(self):
        self.sign_in()
        response = self.patch_json(
            self.client,
            self.SETTINGS_PASSWORD,
            {"current_password": "WrongPassword123", "new_password": "NewStr0ngPass!123"},
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("incorrect", response.json()["message"].lower())

    def test_change_password_with_same_password_fails(self):
        self.sign_in()
        response = self.patch_json(
            self.client,
            self.SETTINGS_PASSWORD,
            {"current_password": PASSWORD, "new_password": PASSWORD},
        )
        self.assertEqual(response.status_code, 400)

    def test_change_password_succeeds_and_allows_login_with_new_password(self):
        self.sign_in()
        new_password = "BrandNew!Passw0rd123"
        response = self.patch_json(
            self.client,
            self.SETTINGS_PASSWORD,
            {"current_password": PASSWORD, "new_password": new_password},
        )
        self.assertEqual(response.status_code, 200)

        # Login with old password fails
        old_login = self.client.post(
            "/api/auth/login/",
            {"email": EMAIL, "password": PASSWORD},
            content_type="application/json",
        )
        self.assertEqual(old_login.status_code, 401)

        # Login with new password succeeds
        new_login = self.client.post(
            "/api/auth/login/",
            {"email": EMAIL, "password": new_password},
            content_type="application/json",
        )
        self.assertEqual(new_login.status_code, 200)

    # --- Delete account ---

    def test_delete_account_fails_with_wrong_password_and_preserves_user(self):
        self.sign_in()
        response = self.delete_json(
            self.client, self.SETTINGS_ACCOUNT, {"password": "IncorrectPassword"}
        )
        self.assertEqual(response.status_code, 400)
        self.assertTrue(
            User.objects.filter(email=EMAIL).exists(),
            "User must not be deleted on wrong password",
        )

    def test_delete_account_succeeds_with_correct_password(self):
        self.sign_in()
        response = self.delete_json(
            self.client, self.SETTINGS_ACCOUNT, {"password": PASSWORD}
        )
        self.assertEqual(response.status_code, 200)
        self.assertFalse(User.objects.filter(email=EMAIL).exists())

        # Cannot log in after deletion
        login_response = self.client.post(
            "/api/auth/login/",
            {"email": EMAIL, "password": PASSWORD},
            content_type="application/json",
        )
        self.assertEqual(login_response.status_code, 401)


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
