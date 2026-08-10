"""Tests for scraper parsing rules and the expiry sweep."""
from datetime import timedelta

from django.core.management import call_command
from django.test import TestCase
from django.utils import timezone

from jobs.models import Job
from scrapers.unstop.unstop_scraper import UnstopScraper


class UnstopOpenStatusTests(TestCase):
    """Unstop reports status=LIVE on listings that closed months ago, so the
    end_date has to be what decides.
    """

    def card(self, **overrides):
        return {"status": "LIVE", "regn_open": 1, **overrides}

    def test_open_when_deadline_is_in_the_future(self):
        self.assertTrue(
            UnstopScraper._is_open(self.card(end_date="2099-01-01T00:00:00"))
        )

    def test_closed_when_deadline_has_passed(self):
        self.assertFalse(
            UnstopScraper._is_open(self.card(end_date="2020-01-01T00:00:00")),
            "a past end_date must win over status=LIVE",
        )

    def test_open_when_no_deadline_given(self):
        # Nothing to judge on, so don't guess it closed.
        self.assertTrue(UnstopScraper._is_open(self.card()))

    def test_closed_when_status_is_not_live(self):
        self.assertFalse(
            UnstopScraper._is_open(
                self.card(status="CLOSED", end_date="2099-01-01T00:00:00")
            )
        )

    def test_closed_when_registration_is_shut(self):
        self.assertFalse(
            UnstopScraper._is_open(
                self.card(regn_open=0, end_date="2099-01-01T00:00:00")
            )
        )

    def test_handles_the_gmt_offset_date_format(self):
        self.assertTrue(
            UnstopScraper._is_open(
                self.card(end_date="2099-08-05 19:17:56 GMT+0530")
            )
        )

    def test_parsed_dates_are_timezone_aware(self):
        # Naive datetimes raise on comparison against aware ones under USE_TZ.
        for value in ("2099-01-01T00:00:00", "2099-08-05 19:17:56 GMT+0530"):
            self.assertIsNotNone(UnstopScraper._to_datetime(value).tzinfo, value)


class ExpireJobsCommandTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        now = timezone.now()
        common = dict(title="Role", company="Co", url="https://example.com/x")
        cls.expired = Job.objects.create(
            source="unstop", source_job_id="e1",
            expires_at=now - timedelta(days=1), is_active=True, **common,
        )
        cls.open_job = Job.objects.create(
            source="unstop", source_job_id="e2",
            expires_at=now + timedelta(days=7), is_active=True, **common,
        )
        cls.undated = Job.objects.create(
            source="foundit", source_job_id="e3",
            expires_at=None, is_active=True, **common,
        )

    def test_deactivates_only_past_deadlines(self):
        call_command("expire_jobs")

        self.expired.refresh_from_db()
        self.open_job.refresh_from_db()
        self.undated.refresh_from_db()

        self.assertFalse(self.expired.is_active)
        self.assertTrue(self.open_job.is_active)
        self.assertTrue(self.undated.is_active, "no deadline means don't guess")

    def test_dry_run_changes_nothing(self):
        call_command("expire_jobs", "--dry-run")
        self.expired.refresh_from_db()
        self.assertTrue(self.expired.is_active)

    def test_expired_jobs_disappear_from_the_api(self):
        call_command("expire_jobs")
        self.assertFalse(Job.objects.filter(is_active=True, pk=self.expired.pk).exists())
