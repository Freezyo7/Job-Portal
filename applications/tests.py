"""Tests for the apply flow, ownership, and the dashboard/calendar queries."""
import re
from datetime import timedelta
from unittest.mock import patch

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core import mail
from django.core.cache import cache
from django.db import IntegrityError, transaction
from django.test import TestCase, override_settings
from django.utils import timezone

from jobs.models import Job

from .models import Application
from .views import _streaks

User = get_user_model()

EMAIL = "user@example.com"
PASSWORD = "Str0ng!Passw0rd"

NO_THROTTLE = {
    **settings.REST_FRAMEWORK,
    "DEFAULT_THROTTLE_RATES": {
        "anon": "10000/hour",
        "user": "10000/hour",
        "login": "10000/hour",
        "register": "10000/hour",
        "verify": "10000/hour",
        "resend": "10000/hour",
        "resume": "10000/hour",
    },
}
MEMORY_MAIL = "django.core.mail.backends.locmem.EmailBackend"


def make_job(**overrides):
    defaults = {
        "source": "naukri",
        "source_job_id": str(make_job.counter),
        "title": "Backend Engineer",
        "company": "Acme",
        "url": "https://example.com/job",
    }
    make_job.counter += 1
    defaults.update(overrides)
    return Job.objects.create(**defaults)


make_job.counter = 1


@override_settings(REST_FRAMEWORK=NO_THROTTLE, EMAIL_BACKEND=MEMORY_MAIL)
class ApplicationsAPITestCase(TestCase):
    """Base with a sign-in helper, shared by every test class below."""

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

    def apply(self, job, client=None):
        client = client or self.client
        return client.post(
            "/api/applications/",
            {"job_id": job.id},
            content_type="application/json",
        )


class ApplyEndpointTests(ApplicationsAPITestCase):
    LIST = "/api/applications/"

    def test_requires_authentication(self):
        job = make_job()
        self.assertEqual(self.apply(job).status_code, 401)

    def test_first_apply_creates_the_row(self):
        self.sign_in()
        job = make_job()

        response = self.apply(job)

        self.assertEqual(response.status_code, 201)
        body = response.json()
        self.assertFalse(body["already_applied"])
        self.assertEqual(body["application"]["job"]["id"], job.id)
        self.assertTrue(
            Application.objects.filter(
                user__email=EMAIL, job=job
            ).exists()
        )

    def test_applying_again_returns_already_applied_and_creates_nothing(self):
        self.sign_in()
        job = make_job()
        self.apply(job)

        response = self.apply(job)

        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()["already_applied"])
        self.assertEqual(
            Application.objects.filter(user__email=EMAIL, job=job).count(), 1
        )

    def test_unknown_job_id_is_rejected(self):
        self.sign_in()
        response = self.client.post(
            self.LIST, {"job_id": 999999}, content_type="application/json"
        )
        self.assertEqual(response.status_code, 400)
        self.assertFalse(Application.objects.exists())

    def test_missing_job_id_is_rejected(self):
        self.sign_in()
        response = self.client.post(
            self.LIST, {}, content_type="application/json"
        )
        self.assertEqual(response.status_code, 400)

    def test_two_users_can_each_apply_to_the_same_job(self):
        job = make_job()
        first = self.sign_in(email="first@example.com", username="first")
        self.apply(job, first)

        second = self.sign_in(
            self.client_class(), email="second@example.com", username="second"
        )
        response = self.apply(job, second)

        self.assertEqual(response.status_code, 201)
        self.assertEqual(Application.objects.filter(job=job).count(), 2)

    def test_the_db_constraint_blocks_a_duplicate_even_if_get_or_create_is_bypassed(self):
        # get_or_create is what the view relies on day to day, but the real
        # guarantee against a race between two simultaneous requests is the
        # UniqueConstraint itself. Prove the DB enforces it independently.
        self.sign_in()
        job = make_job()
        user = User.objects.get(email=EMAIL)
        Application.objects.create(user=user, job=job)

        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                Application.objects.create(user=user, job=job)


class ApplicationListTests(ApplicationsAPITestCase):
    LIST = "/api/applications/"

    def test_requires_authentication(self):
        self.assertEqual(self.client.get(self.LIST).status_code, 401)

    def test_lists_only_the_callers_applications(self):
        job = make_job()
        first = self.sign_in(email="first@example.com", username="first")
        self.apply(job, first)

        second = self.sign_in(
            self.client_class(), email="second@example.com", username="second"
        )
        self.assertEqual(second.get(self.LIST).json(), [])

    def test_includes_nested_job_data(self):
        self.sign_in()
        job = make_job(title="Senior Backend Engineer", company="Acme", source="naukri")
        self.apply(job)

        body = self.client.get(self.LIST).json()

        self.assertEqual(body[0]["job"]["title"], "Senior Backend Engineer")
        self.assertEqual(body[0]["job"]["company"], "Acme")
        self.assertEqual(body[0]["job"]["source"], "naukri")
        self.assertEqual(body[0]["contact_email"], "")
        self.assertEqual(body[0]["contact_linkedin"], "")

    def test_most_recent_application_is_listed_first(self):
        self.sign_in()
        first_job = make_job()
        second_job = make_job()
        self.apply(first_job)
        self.apply(second_job)

        body = self.client.get(self.LIST).json()
        self.assertEqual(body[0]["job"]["id"], second_job.id)
        self.assertEqual(body[1]["job"]["id"], first_job.id)

    def test_list_does_not_grow_queries_per_row(self):
        # Guards the select_related("job") in the view: without it this
        # becomes one extra query per application.
        self.sign_in()
        for _ in range(5):
            self.apply(make_job())

        with self.assertNumQueries(2):
            # cookie auth (user lookup) + one application query carrying
            # its select_related("job") join. This must not scale with the
            # number of applications — that's the regression this guards.
            self.client.get(self.LIST)


class ApplicationDetailTests(ApplicationsAPITestCase):
    def test_requires_authentication(self):
        job = make_job()
        self.assertEqual(self.client.delete("/api/applications/1/").status_code, 401)
        self.assertEqual(self.client.patch("/api/applications/1/").status_code, 401)

    def test_owner_can_update_contact_details(self):
        self.sign_in()
        job = make_job()
        app_id = self.apply(job).json()["application"]["id"]

        response = self.client.patch(
            f"/api/applications/{app_id}/",
            {
                "contact_name": "Jane Recruiter",
                "contact_email": "jane@acme.com",
                "contact_linkedin": "https://linkedin.com/in/janerecruiter",
            },
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["contact_name"], "Jane Recruiter")
        self.assertEqual(data["contact_email"], "jane@acme.com")
        self.assertEqual(data["contact_linkedin"], "https://linkedin.com/in/janerecruiter")

        app = Application.objects.get(pk=app_id)
        self.assertEqual(app.contact_email, "jane@acme.com")

    def test_cannot_update_another_users_application(self):
        job = make_job()
        victim = self.sign_in(email="victim@example.com", username="victim")
        app_id = self.apply(job, victim).json()["application"]["id"]

        attacker = self.sign_in(
            self.client_class(), email="attacker@example.com", username="attacker"
        )
        response = attacker.patch(
            f"/api/applications/{app_id}/",
            {"contact_email": "evil@example.com"},
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 404)

    def test_owner_can_delete_their_application(self):
        self.sign_in()
        job = make_job()
        app_id = self.apply(job).json()["application"]["id"]

        response = self.client.delete(f"/api/applications/{app_id}/")

        self.assertEqual(response.status_code, 204)
        self.assertFalse(Application.objects.filter(pk=app_id).exists())

    def test_cannot_delete_another_users_application(self):
        job = make_job()
        victim = self.sign_in(email="victim@example.com", username="victim")
        app_id = self.apply(job, victim).json()["application"]["id"]

        attacker = self.sign_in(
            self.client_class(), email="attacker@example.com", username="attacker"
        )
        response = attacker.delete(f"/api/applications/{app_id}/")

        self.assertEqual(response.status_code, 404, "must not confirm the row exists")
        self.assertTrue(
            Application.objects.filter(pk=app_id).exists(),
            "Victim's application must survive an attacker's delete",
        )
        self.assertTrue(
            Application.objects.filter(pk=app_id).exists(),
            "another user's application must survive the attempt",
        )

    def test_deleting_a_missing_application_is_404(self):
        self.sign_in()
        self.assertEqual(self.client.delete("/api/applications/999/").status_code, 404)

    def test_reapplying_after_delete_creates_a_new_row(self):
        # The unique constraint is on (user, job); deleting must free it up.
        self.sign_in()
        job = make_job()
        first_id = self.apply(job).json()["application"]["id"]
        self.client.delete(f"/api/applications/{first_id}/")

        response = self.apply(job)

        self.assertEqual(response.status_code, 201)
        self.assertNotEqual(response.json()["application"]["id"], first_id)


class ActivityEndpointTests(ApplicationsAPITestCase):
    ACTIVITY = "/api/applications/activity/"

    def test_requires_authentication(self):
        self.assertEqual(self.client.get(self.ACTIVITY).status_code, 401)

    def test_empty_history_returns_an_empty_list(self):
        self.sign_in()
        self.assertEqual(self.client.get(self.ACTIVITY).json(), [])

    def test_applying_today_appears_under_todays_local_date(self):
        self.sign_in()
        self.apply(make_job())

        body = self.client.get(self.ACTIVITY).json()

        self.assertEqual(len(body), 1)
        self.assertEqual(body[0]["date"], timezone.localdate().isoformat())
        self.assertEqual(body[0]["count"], 1)

    def test_multiple_applications_on_one_day_are_counted_together(self):
        self.sign_in()
        for _ in range(3):
            self.apply(make_job())

        body = self.client.get(self.ACTIVITY).json()

        self.assertEqual(len(body), 1, "one day, so one row, not three")
        self.assertEqual(body[0]["count"], 3)

    def test_a_late_night_application_lands_on_the_ist_day_not_the_utc_day(self):
        # TIME_ZONE is Asia/Kolkata (UTC+5:30). 23:00 UTC on the 9th is
        # 04:30 IST on the 10th, so grouping in UTC would put this
        # application on the wrong calendar square.
        self.sign_in()
        job = make_job()
        user = User.objects.get(email=EMAIL)

        import datetime as dt

        late_utc = dt.datetime(2026, 3, 9, 23, 0, tzinfo=dt.timezone.utc)
        with patch("django.utils.timezone.now", return_value=late_utc):
            Application.objects.create(user=user, job=job)

        body = self.client.get(self.ACTIVITY + "?year=2026").json()

        self.assertEqual(len(body), 1)
        self.assertEqual(
            body[0]["date"], "2026-03-10", "must use the IST day, not the UTC day"
        )

    def test_year_filter_excludes_other_years(self):
        self.sign_in()
        job = make_job()
        user = User.objects.get(email=EMAIL)
        old = timezone.make_aware(timezone.datetime(2023, 6, 1, 10, 0))
        with patch("django.utils.timezone.now", return_value=old):
            Application.objects.create(user=user, job=job)

        self.apply(make_job())  # today, current year

        this_year = timezone.localdate().year
        body = self.client.get(f"{self.ACTIVITY}?year={this_year}").json()

        self.assertEqual(len(body), 1)
        self.assertEqual(body[0]["date"], timezone.localdate().isoformat())

    def test_non_numeric_year_is_a_400_not_a_500(self):
        self.sign_in()
        response = self.client.get(f"{self.ACTIVITY}?year=not-a-year")
        self.assertEqual(response.status_code, 400)

    def test_activity_of_one_user_does_not_leak_into_another(self):
        job = make_job()
        first = self.sign_in(email="first@example.com", username="first")
        self.apply(job, first)

        second = self.sign_in(
            self.client_class(), email="second@example.com", username="second"
        )
        self.assertEqual(second.get(self.ACTIVITY).json(), [])


class StatsEndpointTests(ApplicationsAPITestCase):
    STATS = "/api/applications/stats/"

    def test_requires_authentication(self):
        self.assertEqual(self.client.get(self.STATS).status_code, 401)

    def test_stats_with_no_applications(self):
        self.sign_in()
        body = self.client.get(self.STATS).json()

        self.assertEqual(
            body,
            {
                "total_applied": 0,
                "current_streak": 0,
                "longest_streak": 0,
                "applied_this_week": 0,
                "applied_this_month": 0,
            },
        )

    def test_total_applied_counts_every_application(self):
        self.sign_in()
        for _ in range(4):
            self.apply(make_job())

        self.assertEqual(self.client.get(self.STATS).json()["total_applied"], 4)

    def test_applying_today_counts_toward_week_and_month(self):
        self.sign_in()
        self.apply(make_job())

        body = self.client.get(self.STATS).json()
        self.assertEqual(body["applied_this_week"], 1)
        self.assertEqual(body["applied_this_month"], 1)

    def test_an_application_from_last_month_is_excluded_from_this_month(self):
        self.sign_in()
        job = make_job()
        user = User.objects.get(email=EMAIL)

        first_of_this_month = timezone.localdate().replace(day=1)
        last_month = first_of_this_month - timedelta(days=1)
        moment = timezone.make_aware(
            timezone.datetime(last_month.year, last_month.month, last_month.day, 12, 0)
        )
        with patch("django.utils.timezone.now", return_value=moment):
            Application.objects.create(user=user, job=job)

        self.assertEqual(self.client.get(self.STATS).json()["applied_this_month"], 0)

    def test_stats_of_one_user_do_not_leak_into_another(self):
        job = make_job()
        first = self.sign_in(email="first@example.com", username="first")
        self.apply(job, first)

        second = self.sign_in(
            self.client_class(), email="second@example.com", username="second"
        )
        self.assertEqual(second.get(self.STATS).json()["total_applied"], 0)


class StreakCalculationTests(TestCase):
    """_streaks in isolation — no HTTP, no DB, just the date-run logic."""

    def test_no_history_is_no_streak(self):
        self.assertEqual(_streaks([]), (0, 0))

    def test_a_single_day_is_a_streak_of_one_only_if_it_is_recent(self):
        today = timezone.localdate()
        self.assertEqual(_streaks([today]), (1, 1))

    def test_a_single_day_from_last_week_is_not_a_current_streak(self):
        stale = timezone.localdate() - timedelta(days=8)
        current, longest = _streaks([stale])
        self.assertEqual(current, 0, "too long ago to still be 'current'")
        self.assertEqual(longest, 1)

    def test_consecutive_days_ending_today_form_a_streak(self):
        today = timezone.localdate()
        days = [today - timedelta(days=i) for i in range(4, -1, -1)]
        self.assertEqual(_streaks(days), (5, 5))

    def test_a_streak_ending_yesterday_is_still_current(self):
        # The rule this project chose: not having applied yet today does
        # not break a streak, because today is not over.
        today = timezone.localdate()
        days = [today - timedelta(days=i) for i in range(3, 0, -1)]  # -3..-1
        current, longest = _streaks(days)
        self.assertEqual(current, 3)
        self.assertEqual(longest, 3)

    def test_a_streak_ending_two_days_ago_is_broken(self):
        today = timezone.localdate()
        days = [today - timedelta(days=i) for i in range(5, 1, -1)]  # -5..-2
        current, longest = _streaks(days)
        self.assertEqual(current, 0)
        self.assertEqual(longest, 4)

    def test_a_gap_resets_the_current_run_but_keeps_the_longest(self):
        today = timezone.localdate()
        days = [
            today - timedelta(days=10),
            today - timedelta(days=9),
            today - timedelta(days=8),
            today - timedelta(days=7),
            today,  # a lone recent day after the gap
        ]
        current, longest = _streaks(days)
        self.assertEqual(current, 1)
        self.assertEqual(longest, 4, "the earlier 4-day run is still the longest")

    def test_assumes_distinct_sorted_days_as_produced_by_applications_per_day(self):
        # _streaks is only ever called with the output of
        # _applications_per_day, which groups by day via .values("day") —
        # so the input is always distinct, ascending dates. A repeated date
        # is not a real input; this documents that assumption rather than
        # asserting behaviour for a case that can't occur.
        today = timezone.localdate()
        current, longest = _streaks([today, today])
        self.assertEqual(
            current,
            1,
            "a repeated date breaks the run (gap of zero, not one) — "
            "harmless only because _applications_per_day never repeats a day",
        )
