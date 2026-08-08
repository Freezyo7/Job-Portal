"""Unstop (unstop.com) job scraper.

A single open endpoint does everything: `/api/public/opportunity/search-result`
needs no login, no token and no anti-bot header, and the search response
already carries the full description — so unlike Hirist there is no second
enrichment call.

Pagination is standard Laravel: `current_page` / `last_page` / `total`.
"""

import time
from dataclasses import dataclass, field
from datetime import datetime, timezone

import requests

from scrapers.common import clean_html, to_text

SEARCH_URL = "https://unstop.com/api/public/opportunity/search-result"


@dataclass
class UnstopJob:
    """One listing, normalized to the fields `jobs.models.Job` stores."""

    source_job_id: str
    title: str
    company: str
    url: str
    apply_url: str = ""
    company_logo: str = ""
    company_id: str = ""
    location: str = ""
    min_experience: int | None = None
    max_experience: int | None = None
    min_salary: int | None = None
    max_salary: int | None = None
    currency: str = ""
    description: str = ""        # sanitized HTML, safe to render
    description_text: str = ""   # plain text, for previews and search
    skills: list[str] = field(default_factory=list)
    function: str = ""
    job_type: str = ""           # in_office / remote / hybrid
    employment_type: str = ""    # full_time / internship / ...
    applicant_count: int | None = None
    posted_at: datetime | None = None
    expires_at: datetime | None = None
    is_active: bool = True
    source: str = "unstop"

    def as_dict(self) -> dict:
        """Keyword args for Job.objects.update_or_create()."""
        return self.__dict__.copy()


class UnstopScraper:

    BASE_URL = "https://unstop.com"
    RESULTS_PER_PAGE = 18

    # Unstop uses free-text search, like Naukri and Foundit.
    DOMAIN = {"Software Developer": "software developer",
              "Data Engineer": "data engineer",
              "Cyber Security": "cyber security"}

    # `currency` arrives as a Font Awesome icon name, not a currency code.
    CURRENCY_ICONS = {
        "fa-rupee": "INR",
        "fa-dollar": "USD",
        "fa-euro": "EUR",
        "fa-pound": "GBP",
    }
    # Salary can be quoted per month; the model stores annual figures.
    PAY_PERIOD_MULTIPLIER = {"annually": 1, "monthly": 12, "weekly": 52}

    def __init__(self, delay: float = 1.0):
        self.delay = delay
        self.session = requests.Session()
        self.session.headers.update({
            "accept": "application/json, text/plain, */*",
            "accept-language": "en-IN,en-US;q=0.9,en;q=0.8",
            "referer": f"{self.BASE_URL}/job",
            "user-agent": ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                           "AppleWebKit/537.36 (KHTML, like Gecko) "
                           "Chrome/151.0.0.0 Safari/537.36"),
        })

    # ------------------------------------------------------------------
    # Fetching
    # ------------------------------------------------------------------

    def search(self, keyword: str, page: int = 1) -> dict | None:
        """One page of results. `page` is 1-based."""
        params = {
            "opportunity": "jobs",
            "page": page,
            "per_page": self.RESULTS_PER_PAGE,
            "searchTerm": keyword,
            "sortBy": "",
            "orderBy": "",
            "filter_condition": "",
        }
        try:
            resp = self.session.get(SEARCH_URL, params=params, timeout=25)
            resp.raise_for_status()
            return (resp.json() or {}).get("data")
        except requests.RequestException as e:
            print(f"[x] search failed: {e}")
            return None
        except ValueError:
            print("[x] search returned a non-JSON body")
            return None

    def fetch_jobs(self, keyword: str, pages: int = 1) -> list[UnstopJob]:
        """Search `keyword` across `pages` pages and return parsed listings."""
        jobs: list[UnstopJob] = []
        seen: set[str] = set()

        for page in range(1, pages + 1):
            data = self.search(keyword, page=page)
            if not data:
                break

            cards = data.get("data") or []
            if not cards:
                break

            for raw in cards:
                job = self._parse(raw)
                # The same job can surface on more than one page.
                if job and job.source_job_id not in seen:
                    seen.add(job.source_job_id)
                    jobs.append(job)

            last = data.get("last_page")
            print(f"[ok] page {page}: {len(cards)} cards "
                  f"({len(jobs)} unique of {data.get('total')} total)")

            # The API states outright how many pages exist.
            if last is not None and page >= last:
                break
            if page < pages:
                time.sleep(self.delay)

        return jobs

    # ------------------------------------------------------------------
    # Parsing
    # ------------------------------------------------------------------

    def _parse(self, raw: dict) -> UnstopJob | None:
        """Map one search-result card onto the fields we keep."""
        job_id = raw.get("id")
        if not job_id:
            return None

        org = raw.get("organisation") or {}
        detail = raw.get("jobDetail") or {}
        details_html = raw.get("details")

        url = raw.get("seo_url") or f"{self.BASE_URL}/{raw.get('public_url', '')}"
        # Salary is hidden either by the flag or by omitting the numbers.
        hidden = bool(detail.get("not_disclosed")) or not detail.get("show_salary", 1)

        return UnstopJob(
            source_job_id=str(job_id),
            title=(raw.get("title") or "").strip(),
            company=(org.get("name") or "").strip(),
            url=url,
            # Applications happen on Unstop itself; keep apply_url usable.
            apply_url=url,
            # logoUrl2 on the job outranks the org's, which is often blank.
            company_logo=(raw.get("logoUrl2") or org.get("logoUrl2")
                          or org.get("logoUrl") or "").strip(),
            company_id=str(raw.get("organization_id") or org.get("id") or ""),
            location=self._location(raw),
            min_experience=self._to_int(detail.get("min_experience"), keep_zero=True),
            max_experience=self._to_int(detail.get("max_experience"), keep_zero=True),
            min_salary=None if hidden else self._salary(detail, "min_salary"),
            max_salary=None if hidden else self._salary(detail, "max_salary"),
            currency="" if hidden else self.CURRENCY_ICONS.get(
                detail.get("currency"), ""),
            description=clean_html(details_html),
            description_text=to_text(details_html),
            skills=self._skills(raw),
            function=self._first_name(raw.get("workfunction")),
            job_type=(detail.get("type") or "").strip(),
            employment_type=(detail.get("timing") or "").strip(),
            # Unstop reports registrations, which is the applicant count.
            applicant_count=self._to_int(raw.get("registerCount"), keep_zero=True),
            posted_at=self._to_datetime(raw.get("approved_date")
                                        or raw.get("updated_at")),
            expires_at=self._to_datetime(raw.get("end_date")),
            is_active=(raw.get("status") == "LIVE") and bool(raw.get("regn_open", 1)),
        )

    def _salary(self, detail: dict, key: str) -> int | None:
        """Normalise pay to an annual figure — some posts quote monthly."""
        amount = self._to_int(detail.get(key))
        if amount is None:
            return None
        multiplier = self.PAY_PERIOD_MULTIPLIER.get(detail.get("pay_in"), 1)
        return amount * multiplier

    @staticmethod
    def _location(raw: dict) -> str:
        """Prefer the structured address list; roughly half of listings only
        populate the flat one on jobDetail."""
        cities = [(loc.get("city") or "").strip()
                  for loc in raw.get("locations") or []]
        cities = [c for c in cities if c]
        if not cities:
            cities = [str(c).strip()
                      for c in (raw.get("jobDetail") or {}).get("locations") or []
                      if str(c).strip()]
        if not cities and (raw.get("region") or "").lower() == "online":
            return "Remote"
        return ", ".join(dict.fromkeys(cities))

    @staticmethod
    def _skills(raw: dict) -> list[str]:
        out, seen = [], set()
        for s in raw.get("required_skills") or []:
            name = (s.get("skill_name") or s.get("skill") or "").strip()
            if name and name.lower() not in seen:
                seen.add(name.lower())
                out.append(name)
        return out

    @staticmethod
    def _first_name(values) -> str:
        for v in values or []:
            name = (v.get("name") or "").strip()
            if name:
                return name
        return ""

    @staticmethod
    def _to_int(value, keep_zero: bool = False) -> int | None:
        try:
            number = int(value)
        except (TypeError, ValueError):
            return None
        if number == 0 and not keep_zero:
            return None
        return number

    @staticmethod
    def _to_datetime(value) -> datetime | None:
        """Dates arrive ISO-8601 with an offset, or as
        "2026-08-05 19:17:56 GMT+0530"."""
        if not value:
            return None
        text = str(value).strip()
        try:
            return datetime.fromisoformat(text)
        except ValueError:
            pass
        cleaned = text.replace("GMT", "").strip()
        for fmt in ("%Y-%m-%d %H:%M:%S %z", "%Y-%m-%d %H:%M:%S"):
            try:
                parsed = datetime.strptime(cleaned, fmt)
                if parsed.tzinfo is None:
                    parsed = parsed.replace(tzinfo=timezone.utc)
                return parsed
            except ValueError:
                continue
        return None

    # ------------------------------------------------------------------

    def run(self, keywords=None, pages: int = 3, **_ignored) -> dict[str, list[UnstopJob]]:
        """Scrape every keyword and report what came back."""
        if isinstance(keywords, str):
            keywords = [keywords]
        keywords = keywords or list(self.DOMAIN.values())

        results: dict[str, list[UnstopJob]] = {}
        for kw in keywords:
            print(f"\n=== {kw} ===")
            results[kw] = self.fetch_jobs(kw, pages=pages)
            for job in results[kw][:3]:
                print(f"     {job.title[:50]} | {job.company} | {job.location}")
            time.sleep(self.delay)

        total = sum(len(v) for v in results.values())
        print(f"\n[ok] {total} jobs across {len(results)} keywords")
        return results


if __name__ == "__main__":

    unstop = UnstopScraper()
    unstop.run()
