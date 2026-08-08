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

import requests
from dotenv import load_dotenv

load_dotenv()


@dataclass
class FounditJob:
    """One listing, normalized to the fields `jobs.models.Job` stores."""

    source_job_id: str
    title: str
    company: str
    url: str
    apply_url: str = ""
    location: str = ""
    min_experience: int | None = None
    max_experience: int | None = None
    min_salary: int | None = None
    max_salary: int | None = None
    currency: str = ""
    description: str = ""
    skills: list[str] = field(default_factory=list)
    posted_at: datetime | None = None
    is_active: bool = True
    source: str = "foundit"

    def as_dict(self) -> dict:
        """Keyword args for Job.objects.update_or_create()."""
        return self.__dict__.copy()


class FounditScraper:

    BASE_URL = "https://www.foundit.in"
    SEARCH_URL = "https://www.foundit.in/middleware/jobsearch"
    RESULTS_PER_PAGE = 15

    # Raw keywords — requests handles the URL encoding.
    DOMAIN = {"Software Developer": "software developer",
              "Graduate Engineer": "graduate engineer",
              "Cyber Security": "cyber security"}

    def __init__(self, delay: float = 1.0):
        self.delay = delay
        self.session = requests.Session()
        self.session.headers.update({
            "User-Agent": ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                           "AppleWebKit/537.36 (KHTML, like Gecko) "
                           "Chrome/151.0.0.0 Safari/537.36"),
            "Accept": "application/json",
            "Accept-Language": "en-IN,en-GB;q=0.9,en-US;q=0.8,en;q=0.7",
            # Foundit rejects API calls without these app identifiers.
            "x-language-code": "EN",
            "x-source-site-context": "rexmonster",
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

        return FounditJob(
            source_job_id=str(job_id),
            title=(raw.get("title") or "").strip(),
            # The nested company object is canonical; companyName is a copy.
            company=(company.get("name") or raw.get("companyName") or "").strip(),
            url=f"{self.BASE_URL}{jd_url}",
            # Aggregated posts ("jobSource": "SCRAPPING") apply off-site.
            apply_url=(raw.get("applyUrl") or raw.get("redirectUrl") or "").strip(),
            location=self._location(raw),
            # 0 years is a real value here (fresher roles), so keep it.
            min_experience=self._to_int(
                (raw.get("minimumExperience") or {}).get("years"), keep_zero=True),
            max_experience=self._to_int(
                (raw.get("maximumExperience") or {}).get("years"), keep_zero=True),
            min_salary=None if hidden else self._to_int(min_sal.get("absoluteValue")),
            max_salary=None if hidden else self._to_int(max_sal.get("absoluteValue")),
            currency="" if hidden else (raw.get("currencyCode") or ""),
            description=(raw.get("description") or "").strip(),
            skills=self._skills(raw),
            posted_at=self._to_datetime(raw.get("postedAt") or raw.get("createdAt")),
            is_active=bool(raw.get("isJobActive", raw.get("activeJob", True))),
        )

    @staticmethod
    def _location(raw: dict) -> str:
        """Join the city names. Entries can be country-only (no city key),
        and the same city can repeat across entries."""
        cities = [
            (loc.get("city") or "").strip()
            for loc in raw.get("locations") or []
        ]
        # dict.fromkeys dedupes while preserving order
        return ", ".join(dict.fromkeys(c for c in cities if c))

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

    def fetch_jobs(self, keyword: str, pages: int = 1) -> list[FounditJob]:
        """Search `keyword` across `pages` pages and return parsed listings."""
        jobs: list[FounditJob] = []
        seen: set[str] = set()

        for page_no in range(pages):
            data = self.search(keyword, start=page_no * self.RESULTS_PER_PAGE)
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

            print(f"[ok] page {page_no + 1}: {len(cards)} cards ({len(jobs)} unique)")

            if len(cards) < self.RESULTS_PER_PAGE:
                break  # last page
            if page_no < pages - 1:
                time.sleep(self.delay)

        return jobs

    def search(self, keyword: str, start: int = 0) -> dict | None:
        """Hit the search endpoint. Returns the parsed JSON payload."""
        params = {
            "query": keyword,
            "locations": "",
            "start": start,
            "limit": self.RESULTS_PER_PAGE,
            "sort": "1",          # 1 = most recent
        }
        headers = {
            "referer": f"{self.BASE_URL}/srp/results?query={keyword.replace(' ', '%20')}",
        }

        try:
            resp = self.session.get(self.SEARCH_URL, params=params,
                                    headers=headers, timeout=20)
            resp.raise_for_status()
            return resp.json()
        except requests.HTTPError as e:
            status = e.response.status_code if e.response is not None else "?"
            body = e.response.text[:200] if e.response is not None else ""
            if status in (401, 403):
                print(f"[x] search rejected: {status} — MSSOAT may be stale, or "
                      "Akamai flagged the request")
            else:
                print(f"[x] search failed: {status} {body}")
            return None
        except requests.RequestException as e:
            print(f"[x] search failed: {e}")
            return None
        except ValueError:
            print("[x] search returned a non-JSON body")
            return None

    def run(self, keywords=None, pages: int = 2) -> dict[str, list[FounditJob]]:
        """Scrape every keyword and report what came back."""
        if not self.check_auth():
            return {}

        if isinstance(keywords, str):
            keywords = [keywords]
        keywords = keywords or list(self.DOMAIN.values())

        results: dict[str, list[FounditJob]] = {}
        for kw in keywords:
            print(f"\n=== {kw} ===")
            results[kw] = self.fetch_jobs(kw, pages=pages)
            for job in results[kw][:3]:
                print(f"     {job.title} | {job.company} | {job.location}")
            time.sleep(self.delay)

        total = sum(len(v) for v in results.values())
        print(f"\n[ok] {total} jobs across {len(results)} keywords")
        return results


if __name__ == "__main__":

    foundit = FounditScraper()
    foundit.run()
