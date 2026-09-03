import os
import csv
import time
import json
import logging
from dataclasses import dataclass, field, asdict
from datetime import datetime, timezone
from pathlib import Path
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
        import bleach
        from bs4 import BeautifulSoup

        ALLOWED_TAGS = ["p", "br", "strong", "b", "em", "i", "u", "ul", "ol", "li"]

        def clean_html(html: str | None) -> str:
            if not html:
                return ""
            pre = BeautifulSoup(html, "html.parser")
            for tag in pre.find_all(["script", "style", "noscript", "template"]):
                tag.decompose()
            clean = bleach.clean(str(pre), tags=ALLOWED_TAGS, attributes={}, strip=True, strip_comments=True)
            return clean.strip()

        def to_text(html: str | None) -> str:
            if not html:
                return ""
            soup = BeautifulSoup(html, "html.parser")
            for tag in soup.find_all(["br", "p", "li", "div", "h1", "h2", "h3", "h4"]):
                tag.insert_before("\n")
            text = soup.get_text(separator=" ")
            lines = [" ".join(line.split()) for line in text.splitlines()]
            return "\n".join(line for line in lines if line).strip()

# Load .env
load_dotenv()

logger = logging.getLogger(__name__)

# Credential directory & session storage
CRED_DIR = Path(__file__).resolve().parents[1] / "cred"
CRED_DIR.mkdir(parents=True, exist_ok=True)
SESSION_FILE = CRED_DIR / "instahyre_session.json"
DEFAULT_CSV_PATH = Path(__file__).resolve().parent / "instahyre_jobs.csv"


@dataclass
class InstahyreJob:
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
    currency: str = ""
    description: str = ""        # sanitized HTML, safe to render
    description_text: str = ""   # plain text, for previews and search
    skills: list[str] = field(default_factory=list)
    posted_at: datetime | None = None
    expires_at: datetime | None = None
    applicant_count: int | None = None
    is_active: bool = True
    is_remote: bool = False
    source: str = "instahyre"

    def as_dict(self) -> dict:
        """Keyword args for Job.objects.update_or_create()."""
        return self.__dict__.copy()


class InstahyreScraper:
    BASE_URL = "https://www.instahyre.com"
    LOGIN_URL = "https://www.instahyre.com/api/v1/users/user_login"
    SEARCH_URL = "https://www.instahyre.com/api/v1/job_search"
    EMPLOYER_PROFILE_URL = "https://www.instahyre.com/api/v1/employer_misc/employer_profile/anon_employer"

    DEFAULT_LOCAL_CITIES = [
        "Noida",
        "Greater Noida",
    ]

    REMOTE_CITIES = [
        "Work From Home",
    ]

    DOMAINS = [
        "backend developer",
        "frontend developer",
        "full stack developer",
        "software engineer",
        "python developer",
        "data engineer",
        "devops engineer",
    ]

    def __init__(self, email: Optional[str] = None, password: Optional[str] = None):
        self.email = email or os.getenv("INSTAHYRE_EMAIL") or os.getenv("INSTAHYRE_USERNAME")
        self.password = password or os.getenv("INSTAHYRE_PASSWORD")
        self.session = requests.Session()
        self.session.headers.update({
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/152.0.0.0 Safari/537.36"
            ),
            "Accept": "application/json, text/plain, */*",
            "Accept-Language": "en-IN,en-GB;q=0.9,en-US;q=0.8,en;q=0.7",
            "Origin": "https://www.instahyre.com",
            "Referer": "https://www.instahyre.com/candidate/opportunities/",
        })
        self._load_session()

    def _load_session(self) -> bool:
        """Load cached cookies from JSON if exists."""
        if SESSION_FILE.exists():
            try:
                with open(SESSION_FILE, "r", encoding="utf-8") as f:
                    cookies_dict = json.load(f)
                    for k, v in cookies_dict.items():
                        self.session.cookies.set(k, v)
                return True
            except Exception as e:
                logger.warning("Failed to load cached session: %s", e)
        return False

    def _save_session(self):
        """Save current cookies to session file."""
        try:
            cookies_dict = requests.utils.dict_from_cookiejar(self.session.cookies)
            with open(SESSION_FILE, "w", encoding="utf-8") as f:
                json.dump(cookies_dict, f, indent=2)
        except Exception as e:
            logger.warning("Failed to save session: %s", e)

    def _get_cookie_val(self, name: str) -> Optional[str]:
        """Safely fetch cookie value by name to prevent CookieConflictError."""
        for c in self.session.cookies:
            if c.name == name:
                return c.value
        return None

    def _fetch_csrf_token(self) -> Optional[str]:
        """Fetch initial CSRF token cookie from login page."""
        try:
            resp = self.session.get(f"{self.BASE_URL}/login/", timeout=15)
            for c in resp.cookies:
                if c.name == "csrftoken":
                    return c.value
            return self._get_cookie_val("csrftoken")
        except Exception as e:
            logger.warning("Failed to fetch CSRF token: %s", e)
            return None

    def login(self) -> bool:
        """Authenticate with Instahyre if credentials are provided."""
        if not self.email or not self.password:
            logger.info("No Instahyre credentials provided. Proceeding with anonymous search.")
            return False

        csrf = self._fetch_csrf_token()
        headers = {
            "Content-Type": "application/json",
            "Referer": f"{self.BASE_URL}/login/",
        }
        if csrf:
            headers["x-csrftoken"] = csrf
            headers["X-CSRFToken"] = csrf

        payload = {
            "email": self.email,
            "password": self.password,
        }

        try:
            resp = self.session.post(self.LOGIN_URL, json=payload, headers=headers, timeout=15)
            if resp.status_code in (200, 201):
                logger.info("[ok] Instahyre login successful")
                new_csrf = self._get_cookie_val("csrftoken") or csrf
                if new_csrf:
                    self.session.headers["x-csrftoken"] = new_csrf
                self._save_session()
                return True
            else:
                logger.warning("[x] Instahyre login returned status %s: %s", resp.status_code, resp.text[:200])
                return False
        except Exception as e:
            logger.error("Error during Instahyre login: %s", e)
            return False

    def search_jobs(
        self,
        skills: str = "backend developer",
        locations: Optional[List[str]] = None,
        years: int = 2,
        limit: int = 35,
        offset: int = 0,
    ) -> Dict[str, Any]:
        """Query the /api/v1/job_search endpoint."""
        target_locations = locations if locations is not None else self.DEFAULT_LOCAL_CITIES
        params: List[tuple] = [
            ("company_size", "0"),
            ("job_type", "0"),
            ("skills", skills),
            ("status", "0"),
            ("years", str(years)),
            ("limit", str(limit)),
            ("offset", str(offset)),
        ]
        for loc in target_locations:
            params.append(("jobLocations", loc))

        try:
            resp = self.session.get(self.SEARCH_URL, params=params, timeout=20)
            if resp.status_code == 200:
                return resp.json()
            else:
                logger.warning("Search API returned %s: %s", resp.status_code, resp.text[:200])
                return {}
        except Exception as e:
            logger.error("Exception during job search: %s", e)
            return {}

    def fetch_employer_details(self, employer_id: int | str, job_id: int | str) -> Dict[str, Any]:
        """Fetch enriched employer profile and job description."""
        url = f"{self.EMPLOYER_PROFILE_URL}/{employer_id}"
        params = {"jobId": str(job_id)}
        try:
            resp = self.session.get(url, params=params, timeout=15)
            if resp.status_code == 200:
                return resp.json()
            return {}
        except Exception as e:
            logger.debug("Failed to enrich job %s with employer %s: %s", job_id, employer_id, e)
            return {}

    def _normalize_job(self, search_obj: Dict[str, Any], enrich: bool = True, force_remote: bool = False) -> Optional[InstahyreJob]:
        """Transform search object and optional enrichment into an InstahyreJob."""
        job_id = search_obj.get("id")
        if not job_id:
            return None

        source_job_id = str(job_id)
        title = search_obj.get("title") or search_obj.get("candidate_title") or "Software Engineer"
        employer = search_obj.get("employer") or {}
        company = employer.get("company_name") or ""
        company_id = str(employer.get("id")) if employer.get("id") else ""
        company_logo = employer.get("profile_image_src") or ""

        # Location parsing
        raw_loc = search_obj.get("locations")
        if isinstance(raw_loc, list):
            location = ", ".join(str(l) for l in raw_loc if l)
        else:
            location = str(raw_loc) if raw_loc else ""

        public_url = search_obj.get("public_url") or ""
        if not public_url.startswith("http"):
            public_url = f"{self.BASE_URL}{public_url}" if public_url else f"{self.BASE_URL}/job-{source_job_id}"

        skills = list(search_obj.get("keywords") or [])

        # Default values before enrichment
        description_raw = employer.get("instahyre_note") or ""
        min_experience = None
        max_experience = None
        industry = ""
        function = ""
        company_link = ""
        is_active = True
        apply_url = public_url

        # Fetch detailed description & metadata from enrichment API
        if enrich and company_id:
            time.sleep(0.3)  # Polite pacing
            enrich_data = self.fetch_employer_details(company_id, job_id)
            if enrich_data:
                industry = enrich_data.get("industries") or ""
                if not industry and enrich_data.get("industry_types"):
                    industry = enrich_data["industry_types"][0].get("name", "")

                social = enrich_data.get("social_accounts") or {}
                company_link = social.get("linkedin") or social.get("website") or ""

                # Look for matching job entry in enrichment jobs array
                for ejob in enrich_data.get("jobs", []):
                    if str(ejob.get("id")) == source_job_id:
                        if ejob.get("description"):
                            description_raw = ejob.get("description")
                        min_experience = ejob.get("workex_min")
                        max_experience = ejob.get("workex_max")
                        if ejob.get("agency_function_names"):
                            function = ", ".join(ejob["agency_function_names"])
                        elif ejob.get("job_category"):
                            function = ejob.get("job_category")

                        if ejob.get("locations"):
                            enriched_loc = ejob["locations"]
                            if isinstance(enriched_loc, list):
                                location = ", ".join(str(l) for l in enriched_loc if l)
                            else:
                                location = str(enriched_loc)

                        if ejob.get("opportunity_url"):
                            opp_url = ejob["opportunity_url"]
                            apply_url = f"{self.BASE_URL}{opp_url}" if opp_url.startswith("/") else opp_url

                        if ejob.get("keywords"):
                            skills = list(set(skills + list(ejob["keywords"])))

                        is_active = ejob.get("is_active", True)
                        break

        # Re-evaluate is_remote
        is_remote = (
            force_remote
            or any(term in location.lower() for term in ["work from home", "remote", "wfh", "anywhere"])
            or "-work-from-home" in public_url.lower()
            or "-work-from-home" in apply_url.lower()
        )

        # Sanitize HTML description and plain text preview
        description = clean_html(description_raw)
        description_text = to_text(description_raw)

        return InstahyreJob(
            source_job_id=source_job_id,
            title=title,
            company=company,
            url=public_url,
            apply_url=apply_url,
            company_logo=company_logo,
            company_id=company_id,
            company_link=company_link,
            location=location,
            industry=industry,
            function=function,
            job_type="Full Time",
            employment_type="Full-time",
            min_experience=min_experience,
            max_experience=max_experience,
            min_salary=None,
            max_salary=None,
            currency="",
            description=description,
            description_text=description_text,
            skills=skills,
            is_active=is_active,
            is_remote=is_remote,
            source="instahyre",
        )

    def fetch_jobs(
        self,
        skills: str = "backend developer",
        locations: Optional[List[str]] = None,
        years: int = 2,
        max_jobs: int = 35,
        enrich: bool = True,
        remote: bool = False,
    ) -> List[InstahyreJob]:
        """Fetch and normalize jobs for a given query and location filter."""
        results: List[InstahyreJob] = []
        offset = 0
        limit = min(35, max_jobs)
        target_locations = locations if locations is not None else (self.REMOTE_CITIES if remote else self.DEFAULT_LOCAL_CITIES)

        loc_label = "Remote (Work From Home)" if remote else ", ".join(target_locations)
        print(f"[->] Searching Instahyre for '{skills}' | Locations: [{loc_label}] | Remote={remote}")

        while len(results) < max_jobs:
            data = self.search_jobs(
                skills=skills,
                locations=target_locations,
                years=years,
                limit=limit,
                offset=offset,
            )
            raw_objects = data.get("objects") or []
            if not raw_objects:
                break

            for obj in raw_objects:
                job = self._normalize_job(obj, enrich=enrich, force_remote=remote)
                if job:
                    results.append(job)
                    print(f"  + [{job.source_job_id}] {job.title} @ {job.company} ({job.location}) [remote={job.is_remote}]")
                if len(results) >= max_jobs:
                    break

            meta = data.get("meta") or {}
            if not meta.get("next") or len(raw_objects) < limit:
                break
            offset += limit
            time.sleep(1)

        print(f"[ok] Total fetched {len(results)} jobs for '{skills}' [{loc_label}].")
        return results

    @staticmethod
    def save_to_csv(jobs: List[InstahyreJob], filepath: str | Path = DEFAULT_CSV_PATH) -> str:
        """Save a list of InstahyreJob objects directly into a CSV file."""
        if not jobs:
            print("[!] No jobs to save to CSV.")
            return ""

        path = Path(filepath)
        path.parent.mkdir(parents=True, exist_ok=True)

        fieldnames = [
            "source",
            "source_job_id",
            "title",
            "company",
            "location",
            "is_remote",
            "url",
            "apply_url",
            "company_logo",
            "company_id",
            "company_link",
            "industry",
            "function",
            "job_type",
            "employment_type",
            "min_experience",
            "max_experience",
            "min_salary",
            "max_salary",
            "currency",
            "skills",
            "description_text",
            "description",
            "is_active",
            "posted_at",
            "expires_at",
            "applicant_count",
        ]

        with open(path, "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            for job in jobs:
                row = job.as_dict()
                if isinstance(row.get("skills"), list):
                    row["skills"] = ", ".join(row["skills"])
                filtered_row = {k: row.get(k, "") for k in fieldnames}
                writer.writerow(filtered_row)

        print(f"[ok] Successfully saved {len(jobs)} jobs to CSV: {path}")
        return str(path)

    def run(
        self,
        domains: Optional[List[str]] = None,
        max_jobs_per_pass: int = 15,
        enrich: bool = True,
        save_csv: bool = True,
        csv_path: str | Path = DEFAULT_CSV_PATH,
    ) -> Dict[str, List[InstahyreJob]]:
        """
        Execute the 2-pass workflow:
        Pass 1: Local search (Noida, Greater Noida)
        Pass 2: Remote search (Work From Home)
        Merge and deduplicate per domain, then export to CSV.
        """
        target_domains = domains or ["backend developer", "python developer", "software engineer"]
        all_results: Dict[str, List[InstahyreJob]] = {}
        all_unique_jobs: Dict[str, InstahyreJob] = {}

        # Attempt login if configured, otherwise use anonymous session
        self.login()

        for domain in target_domains:
            print(f"\n==========================================")
            print(f"  Scraping Instahyre: {domain}")
            print(f"==========================================")

            # --- Pass 1: Local (Noida, Greater Noida) ---
            print(f"\n--- Pass 1: Local (Noida, Greater Noida) ---")
            local_jobs = self.fetch_jobs(
                skills=domain,
                locations=self.DEFAULT_LOCAL_CITIES,
                max_jobs=max_jobs_per_pass,
                enrich=enrich,
                remote=False,
            )

            time.sleep(1)

            # --- Pass 2: Remote (Work From Home) ---
            print(f"\n--- Pass 2: Remote (Work From Home) ---")
            remote_jobs = self.fetch_jobs(
                skills=domain,
                locations=self.REMOTE_CITIES,
                max_jobs=max_jobs_per_pass,
                enrich=enrich,
                remote=True,
            )

            # Merge per keyword (remote-tagged instances win)
            merged: Dict[str, InstahyreJob] = {j.source_job_id: j for j in local_jobs}
            merged.update({j.source_job_id: j for j in remote_jobs})
            all_results[domain] = list(merged.values())

            # Add to overall deduplicated map
            all_unique_jobs.update(merged)

            time.sleep(1)

        unique_jobs_list = list(all_unique_jobs.values())

        if save_csv and unique_jobs_list:
            self.save_to_csv(unique_jobs_list, filepath=csv_path)

        print(f"\n[DONE] Successfully scraped {len(unique_jobs_list)} unique jobs across {len(target_domains)} domains.")
        return all_results


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    scraper = InstahyreScraper()
    
    # Run the 2-pass workflow (Noida & Greater Noida first, then Remote Work From Home)
    scraper.run(domains=["backend developer"], max_jobs_per_pass=10, enrich=True, save_csv=True)

