"""Apna (apna.co) job scraper.

Fetches job listings from Apna's production API using the user authorization token
stored in the environment (APNA_TOKEN).
"""

import base64
import json
import os
import time
import logging
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
import requests
from dotenv import load_dotenv

# Try importing shared helpers; fallback if executed directly
try:
    from scrapers.common import clean_html, to_text
except ImportError:
    try:
        from ..common import clean_html, to_text
    except Exception:
        def clean_html(html: str | None) -> str:
            return html.strip() if html else ""

        def to_text(html: str | None) -> str:
            return html.strip() if html else ""

load_dotenv()

logger = logging.getLogger(__name__)

API_SEARCH_URL = "https://production.apna.co/user-profile-orchestrator/v1/jobs/"


@dataclass
class ApnaJob:
    """One listing, normalized to the fields `jobs.models.Job` stores."""

    source_job_id: str
    title: str
    company: str
    url: str
    apply_url: str = ""
    company_logo: str = ""
    company_id: str = ""
    company_link: str = ""
    location: str = ""
    industry: str = ""
    function: str = ""
    job_type: str = "Full Time"
    employment_type: str = "Full-time"
    min_experience: int | None = None
    max_experience: int | None = None
    min_salary: int | None = None
    max_salary: int | None = None
    currency: str = "INR"
    description: str = ""        # sanitized HTML, safe to render
    description_text: str = ""   # plain text, for previews and search
    skills: list[str] = field(default_factory=list)
    posted_at: datetime | None = None
    expires_at: datetime | None = None
    applicant_count: int | None = None
    is_active: bool = True
    is_remote: bool = False
    source: str = "apna"

    def as_dict(self) -> dict:
        """Keyword args for Job.objects.update_or_create()."""
        return self.__dict__.copy()


class ApnaScraper:
    """Scraper client for Apna job portal."""

    RESULTS_PER_PAGE = 25

    DOMAINS = [
        "Software Developer",
        "Python Developer",
        "Backend Developer",
        "Frontend Developer",
        "Data Engineer",
        "Full Stack Developer",
    ]

    def __init__(self, token: Optional[str] = None, delay: float = 1.0):
        self.delay = delay
        raw_token = (token or os.getenv("APNA_TOKEN") or "").strip().strip('"').strip("'")
        self.raw_token = raw_token
        if not raw_token:
            logger.warning("APNA_TOKEN is not set in environment or .env file.")
            self.token = ""
        else:
            # Ensure "Token " prefix
            self.token = raw_token if raw_token.startswith("Token ") else f"Token {raw_token}"

        self.session = requests.Session()
        self.session.headers.update({
            "accept": "application/json, text/plain, */*",
            "accept-language": "en-IN,en-GB;q=0.9,en-US;q=0.8,en;q=0.7",
            "authorization": self.token,
            "cache-control": "no-cache",
            "origin": "https://apna.co",
            "pragma": "no-cache",
            "referer": "https://apna.co/",
            "sec-ch-ua": '"Chromium";v="152", "Not?A_Brand";v="24", "Google Chrome";v="152"',
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": '"Windows"',
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-site",
            "user-agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/152.0.0.0 Safari/537.36"
            ),
        })

    # ------------------------------------------------------------------
    # Auth
    # ------------------------------------------------------------------

    def check_auth(self) -> bool:
        """Verify APNA_TOKEN's `exp` claim rather than discovering it is
        stale from a run of 401s. Apna tokens run out after ~30 days, far
        sooner than Foundit's MSSOAT (~1 year), so this also warns when
        the token is close to expiring rather than only when it's dead.
        """
        if not self.raw_token:
            print("[x] APNA_TOKEN missing from .env")
            print("    Copy the 'authorization' header value from DevTools > "
                  "Network > any apna.co API call (drop the 'Token ' prefix)")
            return False

        payload = self._decode_token(self.raw_token)
        if payload is None:
            print("[x] Could not decode APNA_TOKEN — re-copy it from DevTools")
            return False

        exp = payload.get("exp")
        if not exp:
            print(f"[ok] Authenticated as user {payload.get('id', '?')} "
                  "| token has no expiry claim")
            return True

        expires_at = datetime.fromtimestamp(exp, tz=timezone.utc)
        if expires_at < datetime.now(timezone.utc):
            print(f"[x] APNA_TOKEN expired on {expires_at.date()} — "
                  "re-capture it from DevTools")
            return False

        days_left = (expires_at - datetime.now(timezone.utc)).days
        print(f"[ok] Authenticated as user {payload.get('id', '?')} "
              f"| token valid until {expires_at.date()} ({days_left}d left)")
        if days_left <= 5:
            print(f"[!] APNA_TOKEN expires in {days_left} day(s) — refresh it "
                  "soon (tokens last ~30 days)")
        return True

    @staticmethod
    def _decode_token(token: str) -> dict | None:
        """Pull the payload out of the bearer JWT (header.payload.signature)."""
        try:
            part = token.split(".")[1]
            part += "=" * (-len(part) % 4)
            return json.loads(base64.urlsafe_b64decode(part))
        except Exception:
            return None

    def _parse_timestamp(self, ts_str: Optional[str]) -> Optional[datetime]:
        """Parse ISO formatted timestamp string into datetime."""
        if not ts_str:
            return None
        try:
            # e.g., '2026-09-01T11:30:17Z'
            clean_ts = ts_str.replace("Z", "+00:00")
            return datetime.fromisoformat(clean_ts)
        except Exception:
            return None

    def parse_job(self, item: Dict[str, Any], work_mode: Optional[str] = None) -> Optional[ApnaJob]:
        """Convert a single job item from Apna API into normalized ApnaJob."""
        job_id = str(item.get("id") or "").strip()
        if not job_id:
            return None

        title = (item.get("title") or "").strip()
        org = item.get("organization") or {}
        company = (org.get("name") or "").strip() or "Apna Employer"
        company_id = str(org.get("id") or "")
        company_logo = org.get("logo_url") or ""

        # Location parsing
        location_name = (item.get("location_name") or "").strip()
        address = item.get("address") or {}
        city_info = address.get("city") or {}
        city_name = city_info.get("name") or ""
        line_1 = address.get("line_1") or ""

        location = location_name or line_1 or city_name or "India"

        # Public URL
        url = item.get("public_url") or f"https://apna.co/job/{job_id}"
        apply_url = item.get("external_job_url") or ""

        # Experience
        min_exp = item.get("min_experience")
        max_exp = item.get("max_experience")

        # Salary (Apna gives monthly amounts; convert to annual for normalized storage)
        min_sal = item.get("min_salary") or item.get("fixed_min_salary")
        max_sal = item.get("max_salary") or item.get("fixed_max_salary")
        
        # Multiply monthly salary by 12 if present
        min_salary_annual = int(min_sal) * 12 if min_sal is not None else None
        max_salary_annual = int(max_sal) * 12 if max_sal is not None else None

        # Tags & Skills
        ui_tags = item.get("ui_tags") or []
        tag_texts = [t.get("text") for t in ui_tags if isinstance(t, dict) and t.get("text")]
        
        # Remote / WFH flag
        if work_mode == "wfh":
            is_remote = True
        elif work_mode == "wfo":
            is_remote = False
        else:
            is_remote = bool(item.get("is_wfh", False))
            if any("remote" in t.lower() or "work from home" in t.lower() for t in tag_texts):
                is_remote = True

        # Job type / Employment type
        employment_type = "Full-time"
        job_type = "Remote" if is_remote else "In-office"
        for t in tag_texts:
            t_lower = t.lower()
            if "part time" in t_lower:
                employment_type = "Part-time"
            elif "full time" in t_lower:
                employment_type = "Full-time"
            elif "internship" in t_lower:
                employment_type = "Internship"

        # Skills & requirements
        skills = []
        if item.get("education"):
            skills.append(f"Education: {item['education']}")
        if item.get("english"):
            skills.append(f"English: {item['english']}")
        skills.extend([t for t in tag_texts if t not in ["Full Time", "Part Time", "Work from Office", "Work from home"]])

        # Timestamps
        posted_at = self._parse_timestamp(item.get("last_updated") or item.get("created_on"))

        # Description
        desc_raw = item.get("description") or ""
        description = clean_html(desc_raw)
        description_text = to_text(desc_raw) if desc_raw else f"{title} at {company}. {location}. {', '.join(skills)}"

        return ApnaJob(
            source_job_id=job_id,
            title=title,
            company=company,
            url=url,
            apply_url=apply_url,
            company_logo=company_logo,
            company_id=company_id,
            location=location,
            min_experience=int(min_exp) if min_exp is not None else None,
            max_experience=int(max_exp) if max_exp is not None else None,
            min_salary=min_salary_annual,
            max_salary=max_salary_annual,
            currency="INR",
            description=description,
            description_text=description_text,
            skills=skills,
            job_type=job_type,
            employment_type=employment_type,
            is_remote=is_remote,
            posted_at=posted_at,
            applicant_count=item.get("no_of_openings"),
            is_active=True,
            source="apna",
        )

    def search(
        self,
        keyword: str,
        page: int = 1,
        page_size: int = RESULTS_PER_PAGE,
        work_mode: Optional[str] = None,
        location: Optional[str] = "Delhi-NCR",
        min_experience: Optional[int] = None,
        sort_by: str = "-last_updated",
    ) -> Optional[Dict[str, Any]]:
        """Fetch one page of job listings from Apna API."""
        if not self.token:
            print("[x] APNA_TOKEN is empty. Please set APNA_TOKEN in your .env file.")
            return None

        # Apna generates session_id like 'search_<millis>_<random>'
        session_id = f"search_{int(time.time() * 1000)}_web"

        params = {
            "search": "true",
            "session_id": session_id,
            "raw_text_correction": "true",
            # "true" tells Apna this is a fresh session's initial load, which
            # makes it ignore work_mode/location and answer with its generic
            # blended feed instead — that's why wfo/wfh passes came back
            # identical. "false" makes it actually respect the filters.
            "firstCall": "false",
            "text": keyword,
            "page": str(page),
            "page_size": str(page_size),
            "sort_by": sort_by,
        }

        # For office jobs, location is required by Apna's search algorithm
        if work_mode == "wfo" or location:
            params["location_id"] = "0"
            params["location_name"] = location or "Delhi-NCR"
            params["distance"] = "lt-50"

        if work_mode:
            params["work_mode"] = work_mode

        if min_experience is not None:
            params["min_experience"] = str(min_experience)

        try:
            resp = self.session.get(API_SEARCH_URL, params=params, timeout=25)
            if resp.status_code == 401:
                print(f"[x] Apna 401 Unauthorized for '{keyword}'. APNA_TOKEN may have expired.")
                return None
            if resp.status_code != 200:
                print(f"[x] Apna returned status {resp.status_code}: {resp.text[:200]}")
                return None

            data = resp.json()
            jobs_found = len(self._job_list(data))
            total = data.get("count")
            suffix = f" of {total} total" if total is not None else ""
            print(f"    [->] API returned status 200 | {jobs_found} jobs found{suffix} (page {page})")
            return data
        except requests.RequestException as e:
            print(f"[x] Apna request failed for '{keyword}' (mode={work_mode}, page={page}): {e}")
            return None
        except ValueError:
            print("[x] Apna returned non-JSON response.")
            return None

    @staticmethod
    def _job_list(data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Jobs arrive nested under `results.jobs`; fall back to a
        top-level `jobs` key in case the API ever answers unwrapped."""
        results = data.get("results")
        if isinstance(results, dict) and results.get("jobs"):
            return results["jobs"]
        return data.get("jobs") or []

    def fetch_jobs(
        self,
        keyword: str,
        pages: int = 1,
        work_mode: Optional[str] = None,
        location: Optional[str] = "Delhi-NCR",
        min_experience: Optional[int] = None,
    ) -> List[ApnaJob]:
        """Search `keyword` across `pages` and return normalized ApnaJob objects."""
        jobs: List[ApnaJob] = []
        seen_ids = set()

        for page in range(1, pages + 1):
            data = self.search(
                keyword,
                page=page,
                work_mode=work_mode,
                location=location,
                min_experience=min_experience,
            )
            if not data or not isinstance(data, dict):
                break

            job_list = self._job_list(data)
            if not job_list:
                break

            new_in_page = 0
            for item in job_list:
                job = self.parse_job(item, work_mode=work_mode)
                if job and job.source_job_id not in seen_ids:
                    seen_ids.add(job.source_job_id)
                    jobs.append(job)
                    new_in_page += 1

            # Sleep between pagination calls to avoid rate limits
            if page < pages:
                time.sleep(self.delay)

            # If no items in this page, stop early
            if new_in_page == 0:
                break

        return jobs

    def run(
        self,
        keywords=None,
        pages: int = 1,
        location: Optional[str] = "Delhi-NCR",
        min_experience: Optional[int] = None,
        **_ignored,
    ) -> dict[str, list[ApnaJob]]:
        """Scrape every keyword first for Work From Office (wfo) then Work From Home (wfh)."""
        if not self.check_auth():
            return {}

        if isinstance(keywords, str):
            keywords = [keywords]
        keywords = keywords or self.DOMAINS

        results: dict[str, list[ApnaJob]] = {}
        for kw in keywords:
            kw_jobs: list[ApnaJob] = []
            seen_ids = set()

            # 1. Work From Office (wfo)
            print(f"\n=== [Apna] {kw} (Work From Office / wfo) ===")
            wfo_jobs = self.fetch_jobs(kw, pages=pages, work_mode="wfo", location=location, min_experience=min_experience)
            for j in wfo_jobs:
                if j.source_job_id not in seen_ids:
                    seen_ids.add(j.source_job_id)
                    kw_jobs.append(j)
            for j in wfo_jobs[:3]:
                print(f"     [WFO] {j.title[:45]} | {j.company} | {j.location}")

            time.sleep(self.delay)

            # 2. Work From Home (wfh)
            print(f"\n=== [Apna] {kw} (Work From Home / wfh) ===")
            wfh_jobs = self.fetch_jobs(kw, pages=pages, work_mode="wfh", location=None, min_experience=min_experience)
            for j in wfh_jobs:
                if j.source_job_id not in seen_ids:
                    seen_ids.add(j.source_job_id)
                    kw_jobs.append(j)
            for j in wfh_jobs[:3]:
                print(f"     [WFH] {j.title[:45]} | {j.company} | {j.location}")

            results[kw] = kw_jobs
            time.sleep(self.delay)

        total = sum(len(v) for v in results.values())
        print(f"\n[ok] Apna: {total} jobs scraped across {len(results)} keywords (WFO + WFH)")
        return results


if __name__ == "__main__":
    scraper = ApnaScraper()
    print("Testing ApnaScraper with WFO then WFH passes...")
    scraper.run(keywords=["Software Developer"], pages=1)

