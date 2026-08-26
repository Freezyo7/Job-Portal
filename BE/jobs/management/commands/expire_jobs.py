"""Deactivate listings whose application deadline has passed.

Expiry is time-driven, not scrape-driven: a job scraped today may close
tomorrow whether or not the scrapers run again. So this lives in its own
command, meant to run on a schedule.
"""
from django.core.management.base import BaseCommand
from django.db.models import Count
from django.utils import timezone

from jobs.models import Job


class Command(BaseCommand):
    help = "Deactivate listings whose application deadline has passed."

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Report what would change without writing.",
        )

    def handle(self, *args, **options):
        stale = Job.objects.filter(is_active=True, expires_at__lt=timezone.now())

        by_source = list(
            stale.values("source").annotate(n=Count("id")).order_by("-n")
        )
        count = sum(row["n"] for row in by_source)

        if not count:
            self.stdout.write("Nothing to expire.")
            return

        for row in by_source:
            self.stdout.write(f"  {row['source']:<10} {row['n']:>4}")

        if options["dry_run"]:
            self.stdout.write(f"Would deactivate {count} expired job(s).")
            return

        # One UPDATE for the whole set rather than a save() per row.
        stale.update(is_active=False)
        self.stdout.write(
            self.style.SUCCESS(f"Deactivated {count} expired job(s).")
        )
