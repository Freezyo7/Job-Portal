"""Foundit (ex-Monster India) job scraper.

Foundit's search endpoint returns richer cards than Naukri's: locations,
experience and salary arrive as nested objects rather than pre-formatted
labels, and skills are split across two arrays. Everything we store comes
off the search response, so no detail call is needed.

Field mapping is kept deliberately parallel to scrapers/naukri so both
feed `jobs.models.Job` through the same `as_dict()` contract.
"""

import base64
import json
import os
import time
from dataclasses import dataclass, field
from datetime import datetime, timezone

try:
    from curl_cffi import requests
    USE_CURL_CFFI = True
except ImportError:
    import requests
    USE_CURL_CFFI = False

from dotenv import load_dotenv

from scrapers.common import clean_html, to_text

load_dotenv()


@dataclass
class FounditJob:
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
    industry: str = ""
    function: str = ""
    job_type: str = ""
    employment_type: str = ""
    applicant_count: int | None = None
    posted_at: datetime | None = None
    expires_at: datetime | None = None
    is_active: bool = True
    source: str = "foundit"

    def as_dict(self) -> dict:
        """Keyword args for Job.objects.update_or_create()."""
        return self.__dict__.copy()


class FounditScraper:

    BASE_URL = "https://www.foundit.in"
    SEARCH_URL = "https://www.foundit.in/home/api/searchResultsPage"
    RESULTS_PER_PAGE = 20

    # Foundit's own city labels — these strings must match what the site
    # sends, so keep them lowercase and spelled as the UI does.
    CITIES = ["gurgaon / gurugram", "noida", "greater noida"]
    # Days since posting; 1 = last 24h. Set to None to drop the filter.
    FRESHNESS_DAYS = 1

    # Raw keywords — requests handles the URL encoding.
    DOMAIN = {"Software Developer": "software developer",
              "Graduate Engineer": "graduate engineer",
              "Cyber Security": "cyber security"}

    def __init__(self, delay: float = 1.0):
        self.delay = delay
        if USE_CURL_CFFI:
            self.session = requests.Session(impersonate="chrome124")
        else:
            self.session = requests.Session()
            self.session.headers.update({
                "User-Agent": ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                               "AppleWebKit/537.36 (KHTML, like Gecko) "
                               "Chrome/131.0.0.0 Safari/537.36"),
                "Accept": "*/*",
                "Accept-Language": "en-IN,en-GB;q=0.9,en-US;q=0.8,en;q=0.7",
            })
        self.session.headers.update({
            # Identifies the Foundit tenant; present on every API call.
            "x-source-site-context": "rexmonster",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-origin",
        })

        # The account signs in through Google, so there is no password to
        # replay. Instead we reuse the MSSOAT session cookie Foundit issues
        # after the Google exchange — it is valid for a year, so capture it
        # once from DevTools rather than automating the OAuth dance.
        self.mssoat = os.getenv("FOUNDIT_MSSOAT")
        if self.mssoat:
            self.session.cookies.set("MSSOAT", self.mssoat, domain=".foundit.in")
            client = os.getenv("FOUNDIT_MSSOCLIENT")
            if client:
                self.session.cookies.set("MSSOCLIENT", client, domain=".foundit.in")

    # ------------------------------------------------------------------
    # Auth
    # ------------------------------------------------------------------

    def check_auth(self) -> bool:
        """Verify the MSSOAT token rather than logging in.

        MSSOAT is base64 of `<jwt>::bearer::<expiry_ms>:`. We decode the
        outer layer, then read `exp` out of the JWT payload.
        """
        if not self.mssoat:
            print("[x] FOUNDIT_MSSOAT missing from .env")
            print("    Copy the MSSOAT cookie from DevTools > Application > Cookies")
            return False

        payload = self._decode_mssoat(self.mssoat)
        if payload is None:
            print("[x] Could not decode FOUNDIT_MSSOAT — re-copy it from DevTools")
            return False

        exp = payload.get("exp")
        if exp and exp < time.time():
            when = datetime.fromtimestamp(exp, tz=timezone.utc).date()
            print(f"[x] MSSOAT expired on {when} — re-capture it from DevTools")
            return False

        when = datetime.fromtimestamp(exp, tz=timezone.utc).date() if exp else "unknown"
        print(f"[ok] Authenticated as {payload.get('user_type', '?')} "
              f"| token valid until {when}")
        return True

    @staticmethod
    def _decode_mssoat(token: str) -> dict | None:
        """Pull the JWT payload out of the MSSOAT cookie."""
        try:
            # The cookie is stored without base64 padding — restore it, or
            # b64decode silently truncates the tail.
            padded = token + "=" * (-len(token) % 4)
            inner = base64.b64decode(padded).decode("utf-8", errors="replace")
            jwt = inner.split("::")[0]
            part = jwt.split(".")[1]
            part += "=" * (-len(part) % 4)
            return json.loads(base64.urlsafe_b64decode(part))
        except Exception:
            return None

    # ------------------------------------------------------------------
    # Parsing
    # ------------------------------------------------------------------

    def _parse(self, raw: dict) -> FounditJob | None:
        """Map one search-result card onto the fields we keep."""
        job_id = raw.get("id") or raw.get("jobId")
        jd_url = raw.get("jdUrl")
        if not job_id or not jd_url:
            return None

        # hideSalary is an int flag here (0/1), not a bool like Naukri's.
        hidden = bool(raw.get("hideSalary")) or bool(raw.get("jobSalaryConfidential"))

        company = raw.get("company") or {}
        min_sal = raw.get("minimumSalary") or {}
        max_sal = raw.get("maximumSalary") or {}
        url = f"{self.BASE_URL}{jd_url}"

        return FounditJob(
            source_job_id=str(job_id),
            title=(raw.get("title") or "").strip(),
            # The nested company object is canonical; companyName is a copy.
            company=(company.get("name") or raw.get("companyName") or "").strip(),
            url=url,
            # Aggregated posts ("jobSource": "SCRAPPING") apply off-site;
            # native ones are applied to on Foundit, so fall back to the
            # listing page — apply_url is always usable.
            apply_url=(raw.get("applyUrl")
                       or raw.get("redirectUrl") or "").strip() or url,
            # Roughly 1 in 5 listings ships without a logo.
            company_logo=(raw.get("companyLogoUrl") or company.get("logo") or "").strip(),
            company_id=str(company.get("companyId") or raw.get("companyId") or ""),
            location=self._location(raw),
            # 0 years is a real value here (fresher roles), so keep it.
            min_experience=self._to_int(
                (raw.get("minimumExperience") or {}).get("years"), keep_zero=True),
            max_experience=self._to_int(
                (raw.get("maximumExperience") or {}).get("years"), keep_zero=True),
            min_salary=None if hidden else self._to_int(min_sal.get("absoluteValue")),
            max_salary=None if hidden else self._to_int(max_sal.get("absoluteValue")),
            currency="" if hidden else (raw.get("currencyCode") or ""),
            description=clean_html(raw.get("description")),
            description_text=to_text(raw.get("description")),
            skills=self._skills(raw),
            # These arrive as lists but carry one meaningful value each.
            industry=self._first(raw.get("industries")),
            function=self._first(raw.get("functions")),
            job_type=self._first(raw.get("jobTypes")),
            employment_type=self._first(raw.get("employmentTypes")),
            applicant_count=self._to_int(raw.get("totalApplicants"), keep_zero=True),
            posted_at=self._to_datetime(raw.get("postedAt") or raw.get("createdAt")),
            expires_at=self._to_datetime(raw.get("closedAt")),
            is_active=bool(raw.get("isJobActive", raw.get("activeJob", True))),
        )

    @staticmethod
    def _first(values) -> str:
        """Take the first entry of a list-valued field."""
        for v in values or []:
            if v:
                return str(v).strip()
        return ""

    @staticmethod
    def _location(raw: dict) -> str:
        """Join the city names. Entries can be country-only (no city key),
        and the same place repeats under variant spellings — Foundit lists
        both "Gurugram" and "Gurgaon / Gurugram" on the same job."""
        out: list[str] = []
        seen: set[str] = set()
        for loc in raw.get("locations") or []:
            city = (loc.get("city") or "").strip()
            if not city:
                continue
            # Treat "Gurgaon / Gurugram" as covering plain "Gurugram".
            parts = {p.strip().lower() for p in city.split("/")}
            if parts & seen:
                continue
            seen |= parts
            out.append(city)
        return ", ".join(out)

    @staticmethod
    def _skills(raw: dict) -> list[str]:
        """Skills span two arrays: `itSkills` (tagged, with ids) and
        `skills` (free text). `skillsWithSynonyms` only repeats these with
        search synonyms attached, so it is ignored."""
        skills: list[str] = []
        seen: set[str] = set()
        for group in ("itSkills", "skills"):
            for item in raw.get(group) or []:
                text = (item.get("text") or "").strip()
                # The two arrays overlap, and casing differs between them.
                if text and text.lower() not in seen:
                    seen.add(text.lower())
                    skills.append(text)
        return skills

    @staticmethod
    def _to_int(value, keep_zero: bool = False) -> int | None:
        """Coerce to int. Foundit sends 0 for undisclosed salary, but 0 is
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
        """`postedAt` is epoch milliseconds, or 0/absent when unset."""
        millis = FounditScraper._to_int(value)
        if millis is None:
            return None
        return datetime.fromtimestamp(millis / 1000, tz=timezone.utc)

    # ------------------------------------------------------------------
    # Fetching
    # ------------------------------------------------------------------

    def fetch_jobs(self, keyword: str, pages: int = 1, cities=None,
                   freshness: int | None = None) -> list[FounditJob]:
        """Search `keyword` across `pages` pages and return parsed listings.

        `cities` and `freshness` default to the class constants when None.
        """
        jobs: list[FounditJob] = []
        seen: set[str] = set()

        for page_no in range(pages):
            data = self.search(keyword, start=page_no * self.RESULTS_PER_PAGE,
                               cities=cities, freshness=freshness)
            if not data:
                break

            cards = data.get("data") or []
            if not cards:
                break  # nothing left

            for raw in cards:
                job = self._parse(raw)
                # The same job can surface on more than one page.
                if job and job.source_job_id not in seen:
                    seen.add(job.source_job_id)
                    jobs.append(job)

            # The API reports the true match count; trust it over the page
            # size, since a page can come back short without being the last.
            total = ((data.get("meta") or {}).get("paging") or {}).get("total")
            fetched = (page_no + 1) * self.RESULTS_PER_PAGE
            suffix = f" of {total} total" if total is not None else ""
            print(f"[ok] page {page_no + 1}: {len(cards)} cards "
                  f"({len(jobs)} unique{suffix})")

            if total is not None and fetched >= total:
                break  # collected everything the search matched
            if page_no < pages - 1:
                time.sleep(self.delay)

        return jobs

    def search(self, keyword: str, start: int = 0, cities=None,
               freshness: int | None = None, country: str = "India") -> dict | None:
        """Hit the search endpoint. Returns the parsed JSON payload.

        `cities` are Foundit's own lowercase labels, e.g.
        "gurgaon / gurugram", "noida", "greater noida" — requests repeats
        the key for each one. `freshness` filters by days since posting.
        """
        cities = self.CITIES if cities is None else cities
        freshness = self.FRESHNESS_DAYS if freshness is None else freshness

        params = {
            "start": start,
            "limit": self.RESULTS_PER_PAGE,
            "query": keyword,
            "queryDerived": "true",
            "countries": country,
        }
        if freshness:
            params["jobFreshness"] = freshness
        if cities:
            params["jobCities"] = list(cities)

        seo_key = f"{keyword.replace(' ', '-')}-jobs"
        headers = {
            "referer": f"{self.BASE_URL}/search/{seo_key}",
        }

        try:
            resp = self.session.get(self.SEARCH_URL, params=params,
                                    headers=headers, timeout=20)
            status = getattr(resp, "status_code", 0)
            if status in (401, 403):
                print(f"[x] search rejected: {status} — MSSOAT may be stale, or "
                      "Akamai flagged the request")
                return None
            elif status >= 400:
                body = resp.text[:200] if hasattr(resp, "text") else ""
                print(f"[x] search failed: {status} {body}")
                return None
            return resp.json()
        except Exception as e:
            print(f"[x] search failed: {e}")
            return None

    def run(self, keywords=None, pages: int = 2, cities=None,
            freshness: int | None = None) -> dict[str, list[FounditJob]]:
        """Scrape every keyword and report what came back."""
        if not self.check_auth():
            return {}

        if isinstance(keywords, str):
            keywords = [keywords]
        keywords = keywords or list(self.DOMAIN.values())

        results: dict[str, list[FounditJob]] = {}
        for kw in keywords:
            print(f"\n=== {kw} ===")
            results[kw] = self.fetch_jobs(kw, pages=pages, cities=cities,
                                          freshness=freshness)
            for job in results[kw][:3]:
                print(f"     {job.title} | {job.company} | {job.location}")
            time.sleep(self.delay)

        total = sum(len(v) for v in results.values())
        print(f"\n[ok] {total} jobs across {len(results)} keywords")
        return results


if __name__ == "__main__":

    foundit = FounditScraper()
    foundit.run()
