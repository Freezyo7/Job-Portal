"""Entry point for running the job scrapers and saving to Postgres.

Usage:
    py main.py                          # test keyword, every source
    py main.py "data engineering"       # one keyword
    py main.py --all                    # every keyword in DOMAINS
    py main.py --source foundit         # limit to one source
    py main.py --all --source naukri
"""

import os
import sys

import django

# Django has to be configured before any model import.
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from django.db.models import Count  # noqa: E402  (must follow django.setup())

from jobs.models import Job  # noqa: E402
from scrapers.foundit import FounditScraper  # noqa: E402
from scrapers.hirist import HiristScraper  # noqa: E402
from scrapers.naukri import NaukriScraper  # noqa: E402
from scrapers.unstop import UnstopScraper  # noqa: E402

# Every keyword we search for, across all sources.
DOMAINS = [
    "data engineering",
    "software developer",
    "graduate engineer",
    "cyber security",
    "python developer",
    "full stack developer",
]

# Keep the test run small until the pipeline is proven end to end.
TEST_DOMAINS = ["data engineering"]

# Each site names its own cities: Foundit takes its display labels,
# Naukri takes names this scraper maps to numeric gids.
FOUNDIT_CITIES = ["gurgaon / gurugram", "noida", "greater noida"]
NAUKRI_CITIES = ["noida", "greater noida", "delhi / ncr"]

# Hirist searches DOMAINS by keyword like the others, and is nationwide so
# it takes no city list. These categories are browsed *in addition* to the
# keyword searches — set to [] to search by keyword only.
HIRIST_CATEGORIES = []

FRESHNESS_DAYS = 1
# Upper bound only — the scrapers stop early once they have every match.
PAGES = 3


def save_jobs(jobs) -> tuple[int, int]:
    """Upsert scraped jobs into Postgres.

    Returns (created, updated). Uniqueness is source + source_job_id, so
    re-running a scrape refreshes rows instead of duplicating them.
    """
    created = updated = 0
    for job in jobs:
        data = job.as_dict()
        source = data.pop("source")
        source_job_id = data.pop("source_job_id")
        _, was_created = Job.objects.update_or_create(
            source=source,
            source_job_id=source_job_id,
            defaults=data,
        )
        if was_created:
            created += 1
        else:
            updated += 1
    return created, updated


def run_scraper(name, scraper, label, **run_kwargs) -> tuple[int, int]:
    """Scrape one source and persist whatever it returns.

    Sources don't share a signature — Naukri and Foundit take keywords and
    cities, Hirist takes categories — so callers pass the kwargs directly.
    """
    print(f"\n{'=' * 60}")
    print(f"{name.upper()} | {label}")
    print(f"{'=' * 60}")

    try:
        results = scraper.run(**run_kwargs)
    except Exception as e:
        # One source failing shouldn't abandon the others.
        print(f"[x] {name} failed: {type(e).__name__}: {e}")
        return 0, 0

    if not results:
        print(f"[x] {name}: nothing scraped — see the output above.")
        return 0, 0

    created = updated = 0
    print()
    for keyword, jobs in results.items():
        c, u = save_jobs(jobs)
        created += c
        updated += u
        print(f"[db] {name}/{keyword}: {c} new, {u} updated ({len(jobs)} scraped)")
    return created, updated


def _keyword_source(cls, cities):
    """Build the run() kwargs for a keyword+city source."""
    def build(keywords):
        return cls, ", ".join(keywords), {
            "keywords": keywords,
            "pages": PAGES,
            "cities": cities,
            "freshness": FRESHNESS_DAYS,
        }
    return build


def _hirist_source(keywords):
    """Hirist supports free-text search and is nationwide, so it takes the
    shared keyword list but no city filter. Set HIRIST_CATEGORIES to also
    browse its fixed sections."""
    return HiristScraper, ", ".join(keywords), {
        "keywords": keywords,
        "categories": HIRIST_CATEGORIES,
        "pages": PAGES,
    }


def _unstop_source(keywords):
    """Unstop is keyword-driven and nationwide — no city or freshness
    filter is exposed by its API."""
    return UnstopScraper, ", ".join(keywords), {
        "keywords": keywords,
        "pages": PAGES,
    }


SOURCES = {
    "foundit": _keyword_source(FounditScraper, FOUNDIT_CITIES),
    "naukri": _keyword_source(NaukriScraper, NAUKRI_CITIES),
    "hirist": _hirist_source,
    "unstop": _unstop_source,
}


def main() -> None:
    argv = sys.argv[1:]

    # --source foundit  (repeatable); defaults to every source
    wanted = []
    for i, a in enumerate(argv):
        if a == "--source" and i + 1 < len(argv):
            wanted.append(argv[i + 1].lower())
    names = wanted or list(SOURCES)

    unknown = [n for n in names if n not in SOURCES]
    if unknown:
        print(f"[x] Unknown source(s): {', '.join(unknown)}")
        print(f"    Available: {', '.join(SOURCES)}")
        return

    # Bare words are keywords; skip flags and their values.
    skip = set()
    for i, a in enumerate(argv):
        if a.startswith("-"):
            skip.add(i)
            if a == "--source":
                skip.add(i + 1)
    args = [a for i, a in enumerate(argv) if i not in skip]

    if "--all" in argv:
        keywords = DOMAINS
    elif args:
        keywords = args
    else:
        keywords = TEST_DOMAINS

    print(f"Keywords : {', '.join(keywords)}")
    print(f"Sources  : {', '.join(names)}")
    print(f"Freshness: last {FRESHNESS_DAYS} day(s) | up to {PAGES} page(s)")

    total_created = total_updated = 0
    for name in names:
        scraper_cls, label, run_kwargs = SOURCES[name](keywords)
        c, u = run_scraper(name, scraper_cls(), label, **run_kwargs)
        total_created += c
        total_updated += u

    print(f"\n{'=' * 60}")
    print(f"[db] Total: {total_created} new, {total_updated} updated")
    print(f"[db] Job table now holds {Job.objects.count()} rows")
    for row in Job.objects.values("source").annotate(n=Count("id")).order_by("source"):
        print(f"       {row['source']}: {row['n']}")


if __name__ == "__main__":
    main()
