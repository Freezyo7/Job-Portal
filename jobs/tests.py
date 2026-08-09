"""Tests for the job listing API."""
from datetime import timedelta

from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.test import TestCase
from django.utils import timezone

from .models import Job

User = get_user_model()


class JobAPITests(TestCase):
    """Job endpoints require login, so every test authenticates first."""

    @classmethod
    def setUpTestData(cls):
        now = timezone.now()
        cls.backend = Job.objects.create(
            source="naukri", source_job_id="t1",
            title="Backend Engineer", company="CloudNine",
            location="Bangalore, Karnataka", url="https://example.com/1",
            job_type="Permanent Job", employment_type="Full time",
            min_experience=2, max_experience=5,
            min_salary=1000000, max_salary=1800000, currency="INR",
            description="<p>Django work</p>", description_text="Django work",
            skills=["Python", "Django"], posted_at=now - timedelta(days=1),
        )
        cls.frontend = Job.objects.create(
            source="hirist", source_job_id="t2",
            title="Frontend Developer", company="TechNova",
            location="Remote", url="https://example.com/2",
            job_type="Permanent Job", employment_type="Full time",
            min_experience=5, max_experience=9,
            min_salary=2000000, max_salary=3000000, currency="INR",
            description="<p>React work</p>", description_text="React work",
            skills=["React"], posted_at=now - timedelta(days=3),
        )
        cls.closed = Job.objects.create(
            source="foundit", source_job_id="t3",
            title="Expired Role", company="Apex", location="Chennai",
            url="https://example.com/3", is_active=False,
            posted_at=now - timedelta(days=40),
        )

    def setUp(self):
        cache.clear()
        User.objects.create_user(
            username="viewer", email="viewer@example.com", password="Str0ng!Passw0rd"
        )
        self.client.post(
            "/api/auth/login/",
            {"email": "viewer@example.com", "password": "Str0ng!Passw0rd"},
            content_type="application/json",
        )

    def titles(self, response):
        return {row["title"] for row in response.json()["results"]}

    # --- access control ------------------------------------------------

    def test_job_list_requires_authentication(self):
        anonymous = self.client_class()
        self.assertEqual(anonymous.get("/api/jobs/").status_code, 401)

    def test_authenticated_user_can_list_jobs(self):
        self.assertEqual(self.client.get("/api/jobs/").status_code, 200)

    # --- list behaviour ------------------------------------------------

    def test_inactive_jobs_are_hidden(self):
        self.assertNotIn("Expired Role", self.titles(self.client.get("/api/jobs/")))

    def test_inactive_jobs_cannot_be_revealed_by_a_query_param(self):
        response = self.client.get("/api/jobs/?is_active=false")
        self.assertNotIn(
            "Expired Role",
            self.titles(response),
            "is_active is a business rule, not a user-controllable filter",
        )

    def test_list_is_paginated(self):
        body = self.client.get("/api/jobs/").json()
        for key in ("count", "results"):
            self.assertIn(key, body)

    def test_list_excludes_heavy_and_internal_fields(self):
        row = self.client.get("/api/jobs/").json()["results"][0]
        self.assertIn("description_text", row)
        for field in ("description", "source_job_id", "created_at", "updated_at", "is_active"):
            self.assertNotIn(field, row, f"{field} must not appear in list rows")

    # --- search --------------------------------------------------------

    def test_search_matches_title(self):
        self.assertEqual(
            self.titles(self.client.get("/api/jobs/?search=Backend")), {"Backend Engineer"}
        )

    def test_search_matches_company(self):
        self.assertEqual(
            self.titles(self.client.get("/api/jobs/?search=TechNova")),
            {"Frontend Developer"},
        )

    def test_search_matches_skills(self):
        # Guards the `skills` field name in search_fields.
        self.assertEqual(
            self.titles(self.client.get("/api/jobs/?search=Django")), {"Backend Engineer"}
        )

    # --- filters -------------------------------------------------------

    def test_filter_by_source_is_exact(self):
        self.assertEqual(
            self.titles(self.client.get("/api/jobs/?source=naukri")), {"Backend Engineer"}
        )

    def test_filter_by_location_matches_partially(self):
        # "bangalore" must match "Bangalore, Karnataka"
        self.assertEqual(
            self.titles(self.client.get("/api/jobs/?location=bangalore")),
            {"Backend Engineer"},
        )

    def test_experience_filter_shows_jobs_the_user_qualifies_for(self):
        # A candidate with 3 years meets the 2-5 role, not the 5-9 one.
        self.assertEqual(
            self.titles(self.client.get("/api/jobs/?experience=3")), {"Backend Engineer"}
        )

    def test_min_salary_filter_compares_against_the_job_ceiling(self):
        # Wanting 2,000,000+ keeps the job paying up to 3,000,000.
        self.assertEqual(
            self.titles(self.client.get("/api/jobs/?min_salary=2000000")),
            {"Frontend Developer"},
        )

    def test_ordering_by_salary(self):
        results = self.client.get("/api/jobs/?ordering=-max_salary").json()["results"]
        self.assertEqual(results[0]["title"], "Frontend Developer")

    # --- detail --------------------------------------------------------

    def test_detail_returns_full_description(self):
        body = self.client.get(f"/api/jobs/{self.backend.id}/").json()
        self.assertEqual(body["title"], "Backend Engineer")
        self.assertIn("description", body)

    def test_detail_404s_for_inactive_job(self):
        self.assertEqual(self.client.get(f"/api/jobs/{self.closed.id}/").status_code, 404)

    def test_detail_404s_for_missing_job(self):
        self.assertEqual(self.client.get("/api/jobs/999999/").status_code, 404)

    # --- logo proxy ----------------------------------------------------

    def test_logo_proxy_requires_a_url(self):
        self.assertEqual(self.client.get("/api/jobs/logo/").status_code, 400)

    def test_logo_proxy_rejects_non_http_schemes(self):
        # Without this check the endpoint could be used to read local files.
        response = self.client.get("/api/jobs/logo/?url=file:///etc/passwd")
        self.assertEqual(response.status_code, 400)

    def test_logo_proxy_rejects_malformed_urls(self):
        self.assertEqual(self.client.get("/api/jobs/logo/?url=notaurl").status_code, 400)
