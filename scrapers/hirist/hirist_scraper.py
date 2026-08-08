"""Hirist (hirist.tech) job scraper.

The simplest of the three sources: both endpoints are open — no login, no
bearer token, no anti-bot header. Plain `requests` is enough.

Two calls per job:

  1. /job/category/  — paginated search. Carries title, company, logo,
     skills, experience and location, but *no description*.
  2. /job/detail     — per job. Adds the description, apply URL, canonical
     job URL, applicant count and functional area.

Unlike Naukri, whose detail endpoint needs a per-request browser-minted
token, Hirist's detail call is ordinary HTTP — so enrichment is cheap and
worth doing. It is also required: without it there is no description.
"""

import time
from dataclasses import dataclass, field
from datetime import datetime, timezone

import requests

from scrapers.common import clean_html, to_text

SEARCH_URL = "https://gladiator.hirist.tech/job/category/"
DETAIL_URL = "https://gladiator.hirist.tech/job/detail"

# Every location id the site's own "all locations" filter sends. Hirist
# jobs are nationwide and we don't filter by city, so this stays fixed.
ALL_LOCATIONS = (
    "87,1,36,41,40,37,38,2,5,3,7,4,6,54,78,53,45,34,79,65,19,14,64,70,84,86,"
    "58,55,13,39,8,77,12,57,16,71,72,11,46,43,63,20,52,31,17,60,48,83,9,10,"
    "73,66,67,68,18,50,47,61,85,15,74,33,80,62,49,44,32,35,69,75,51,21,59,56,"
    "81,76,82,127,123,121,130,124,125,122,128,126,129,131,133,134,135,136,"
    "137,138,139,140,141,142,143,144,145,146,147,148,149,150,151,152,153,158,163"
)


@dataclass
class HiristJob:
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
    applicant_count: int | None = None
    posted_at: datetime | None = None
    is_active: bool = True
    source: str = "hirist"

    def as_dict(self) -> dict:
        """Keyword args for Job.objects.update_or_create()."""
        return self.__dict__.copy()


class HiristScraper:

    BASE_URL = "https://www.hirist.tech"
    RESULTS_PER_PAGE = 20

    # Hirist segments by category, not free-text keyword. Names inferred
    # from the job titles each id returns.
    CATEGORIES = {
        "backend": 1,
        "frontend": 2,
        "infrastructure": 3,
        "hardware": 4,
        "mobile": 5,
        "erp / crm": 6,
        "analytics": 7,
        "devops / cloud": 8,
        "blockchain / iot": 9,
        "design / ux": 10,
        "qa / testing": 11,
        "product management": 12,
        "business analysis": 13,
        "ai / ml": 14,
        "data engineering": 15,
        "full stack": 16,
        "it operations": 17,
    }
    # Which categories to scrape by default.
    DEFAULT_CATEGORIES = ["ai / ml", "data engineering", "backend", "full stack"]

    # Experience window, in years, applied server-side.
    MIN_EXPERIENCE = 0
    MAX_EXPERIENCE = 1
    # Days since posting.
    FRESHNESS_DAYS = 3

    def __init__(self, delay: float = 0.5):
        self.delay = delay
        self.session = requests.Session()
        self.session.headers.update({
            "accept": "application/json, text/plain, */*",
            "accept-language": "en-IN,en-GB;q=0.9,en-US;q=0.8,en;q=0.7",
            # The API is on a different host than the site; both are required.
            "origin": self.BASE_URL,
            "referer": f"{self.BASE_URL}/",
            "user-agent": ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                           "AppleWebKit/537.36 (KHTML, like Gecko) "
                           "Chrome/151.0.0.0 Safari/537.36"),
        })

    # ------------------------------------------------------------------
    # Fetching
    # ------------------------------------------------------------------

    def _category_id(self, category) -> int:
        """Accept a category name or a raw id; reject unknown names loudly."""
        if isinstance(category, int):
            return category
        cid = self.CATEGORIES.get(str(category).strip().lower())
        if cid is None:
            known = ", ".join(sorted(self.CATEGORIES))
            raise ValueError(f"Unknown Hirist category {category!r}. Known: {known}")
        return cid

    def search(self, category=None, page: int = 0, min_exp: int | None = None,
               max_exp: int | None = None, freshness: int | None = None,
               keyword: str | None = None) -> dict | None:
        """One page of results. `page` is 0-based.

        Pass `category` to browse a category, `keyword` for free-text
        search, or both to search within a category. The endpoint rejects
        a request with neither.
        """
        if category is None and not keyword:
            raise ValueError("search() needs a category or a keyword")

        params = {
            "minexp": self.MIN_EXPERIENCE if min_exp is None else min_exp,
            "maxexp": self.MAX_EXPERIENCE if max_exp is None else max_exp,
            "page": page,
            "loc": ALL_LOCATIONS,
            "industry": "",
            "posting": self.FRESHNESS_DAYS if freshness is None else freshness,
            "size": self.RESULTS_PER_PAGE,
        }
        if category is not None:
            params["categoryId"] = self._category_id(category)
        if keyword:
            params["query"] = keyword
        try:
            resp = self.session.get(SEARCH_URL, params=params, timeout=25)
            resp.raise_for_status()
            return resp.json()
        except requests.RequestException as e:
            print(f"[x] search failed: {e}")
            return None
        except ValueError:
            print("[x] search returned a non-JSON body")
            return None

    def detail(self, job_id, ref: str = "cl") -> dict | None:
        """Per-job enrichment. Adds the description, which search omits."""
        try:
            resp = self.session.get(
                DETAIL_URL,
                params={"jobcode": job_id, "ref": ref, "referenceText": ref},
                timeout=25,
            )
            resp.raise_for_status()
            return (resp.json() or {}).get("data")
        except requests.RequestException as e:
            print(f"[x] detail {job_id} failed: {e}")
            return None
        except ValueError:
            print(f"[x] detail {job_id} returned a non-JSON body")
            return None

    def fetch_jobs(self, category=None, pages: int = 1, enrich: bool = True,
                   keyword: str | None = None, **filters) -> list[HiristJob]:
        """Scrape `pages` pages of a category or keyword, enriching each job."""
        jobs: list[HiristJob] = []
        seen: set[str] = set()
        label = keyword or category

        for page in range(pages):
            data = self.search(category, page=page, keyword=keyword, **filters)
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

            total = data.get("totalJobs")
            print(f"[ok] {label} page {page + 1}: {len(cards)} cards "
                  f"({len(jobs)} unique of {total} total)")

            # The API states outright whether more pages exist.
            if not data.get("hasMore"):
                break
            if page < pages - 1:
                time.sleep(self.delay)

        if enrich and jobs:
            self._enrich(jobs)
        return jobs

    def _enrich(self, jobs: list[HiristJob]) -> None:
        """Fill in the fields only the detail endpoint carries."""
        print(f"[..] enriching {len(jobs)} jobs...")
        filled = 0
        for i, job in enumerate(jobs):
            detail = self.detail(job.source_job_id)
            if detail:
                self._apply_detail(job, detail)
                filled += 1
            if i < len(jobs) - 1:
                time.sleep(self.delay)
        print(f"[ok] enriched {filled}/{len(jobs)}")

    # ------------------------------------------------------------------
    # Parsing
    # ------------------------------------------------------------------

    def _parse(self, raw: dict) -> HiristJob | None:
        """Map one search-result card onto the fields we keep."""
        job_id = raw.get("id") or raw.get("refJobId")
        if not job_id:
            return None

        company = raw.get("companyData") or {}
        hidden = bool(raw.get("hideSal"))

        return HiristJob(
            source_job_id=str(job_id),
            title=(raw.get("title") or "").strip(),
            company=(company.get("companyName") or "").strip(),
            # Search has no URL; the detail call supplies the canonical one.
            url=f"{self.BASE_URL}/j/{job_id}",
            company_logo=(company.get("companyLogoFilePath") or "").strip(),
            company_id=str(company.get("companyId") or ""),
            location=self._location(raw),
            # 0 years is a real value here (fresher roles), so keep it.
            min_experience=self._to_int(raw.get("min"), keep_zero=True),
            max_experience=self._to_int(raw.get("max"), keep_zero=True),
            min_salary=None if hidden else self._to_int(raw.get("minSal")),
            max_salary=None if hidden else self._to_int(raw.get("maxSal")),
            currency="" if hidden else "INR",
            skills=self._skills(raw),
            posted_at=self._to_datetime(raw.get("createdTimeMs")
                                        or raw.get("createdTime")),
            is_active=raw.get("status", 1) == 1,
        )

    def _apply_detail(self, job: HiristJob, d: dict) -> None:
        """Merge the detail response into an already-parsed job."""
        intro = d.get("introText")
        if intro:
            job.description = clean_html(intro)
            job.description_text = to_text(intro)

        # The canonical URL, rather than the one we synthesised.
        if d.get("jobDetailUrl"):
            job.url = d["jobDetailUrl"]
        # applyUrl is often empty — you apply on Hirist itself.
        job.apply_url = (d.get("applyUrl") or "").strip() or job.url

        job.applicant_count = self._to_int(
            d.get("applyCount") or d.get("applicationCount"), keep_zero=True)
        # functionalArea is a numeric id, not a label.
        if d.get("functionalArea"):
            job.function = str(d["functionalArea"])
        if d.get("hasExpired") or d.get("permanentlyRemoved"):
            job.is_active = False

        detail_company = d.get("companyData") or {}
        if not job.company_logo:
            job.company_logo = (detail_company.get("logoPath")
                                or detail_company.get("logo") or "").strip()
        # Detail tags supersede search tags when present.
        if d.get("tags"):
            job.skills = self._skills(d)

    @staticmethod
    def _location(raw: dict) -> str:
        """Join the location names, deduped, order preserved."""
        names = [(loc.get("name") or "").strip()
                 for loc in (raw.get("locations") or raw.get("location") or [])]
        return ", ".join(dict.fromkeys(n for n in names if n))

    @staticmethod
    def _skills(raw: dict) -> list[str]:
        """Tags, mandatory ones first — they matter more for matching."""
        tags = raw.get("tags") or []
        mandatory = [(t.get("name") or "").strip() for t in tags if t.get("isMandatory")]
        optional = [(t.get("name") or "").strip() for t in tags if not t.get("isMandatory")]
        return [s for s in dict.fromkeys(mandatory + optional) if s]

    @staticmethod
    def _to_int(value, keep_zero: bool = False) -> int | None:
        """Coerce to int. Hirist sends 0 for undisclosed salary, but 0 is
        meaningful for experience — hence `keep_zero`."""
        try:
            number = int(value)
        except (TypeError, ValueError):
            return None
        if number == 0 and not keep_zero:
            return None
        return number

    @staticmethod
    def _to_datetime(value) -> datetime | None:
        """`createdTimeMs` is epoch milliseconds."""
        millis = HiristScraper._to_int(value)
        if millis is None:
            return None
        return datetime.fromtimestamp(millis / 1000, tz=timezone.utc)

    # ------------------------------------------------------------------

    def run(self, categories=None, keywords=None, pages: int = 3,
            enrich: bool = True, **filters) -> dict[str, list[HiristJob]]:
        """Scrape by keyword, by category, or both.

        `keywords` uses Hirist's free-text search; `categories` browses its
        fixed sections. Passing neither falls back to DEFAULT_CATEGORIES.
        """
        if isinstance(keywords, str):
            keywords = [keywords]
        if isinstance(categories, (str, int)):
            categories = [categories]
        if not keywords and not categories:
            categories = self.DEFAULT_CATEGORIES

        # Fail fast on a bad category name, before any requests go out.
        for c in categories or []:
            self._category_id(c)

        results: dict[str, list[HiristJob]] = {}

        for kw in keywords or []:
            print(f"\n=== {kw} (keyword) ===")
            results[kw] = self.fetch_jobs(keyword=kw, pages=pages,
                                          enrich=enrich, **filters)
            self._preview(results[kw])
            time.sleep(self.delay)

        for cat in categories or []:
            print(f"\n=== {cat} (category) ===")
            results[str(cat)] = self.fetch_jobs(cat, pages=pages,
                                                enrich=enrich, **filters)
            self._preview(results[str(cat)])
            time.sleep(self.delay)

        total = sum(len(v) for v in results.values())
        print(f"\n[ok] {total} jobs across {len(results)} searches")
        return results

    @staticmethod
    def _preview(jobs, limit: int = 3) -> None:
        for job in jobs[:limit]:
            print(f"     {job.title[:50]} | {job.company} | {job.location}")


if __name__ == "__main__":

    hirist = HiristScraper()
    hirist.run()
