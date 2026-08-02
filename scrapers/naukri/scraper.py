import requests
import os
from dataclasses import dataclass, field
from datetime import datetime, timezone
from dotenv import load_dotenv
from pathlib import Path
from urllib.parse import quote
import json, time

#load the env file
load_dotenv()

#directories
CRED_DIR = Path(__file__).resolve().parents[1] / "cred"   # -> scrapers/cred

CRED_DIR.mkdir(parents=True, exist_ok=True)

SESSION_FILE = CRED_DIR / "naukri_session.json"
SEARCH_PATH = "/jobapi/v3/search"


@dataclass
class NaukriJob:
    """One listing, normalized to the fields `jobs.models.Job` stores."""

    source_job_id: str
    title: str
    company: str
    url: str
    location: str = ""
    min_experience: int | None = None
    max_experience: int | None = None
    min_salary: int | None = None
    max_salary: int | None = None
    currency: str = ""
    description: str = ""
    skills: list[str] = field(default_factory=list)
    posted_at: datetime | None = None
    source: str = "naukri"

    def as_dict(self) -> dict:
        """Keyword args for Job.objects.update_or_create()."""
        return self.__dict__.copy()


class NaukriScraper:
    BASE_URL = "https://www.naukri.com"
    # Raw keywords — requests handles the URL encoding.
    DOMAIN = {"Software Developer": "software developer",
              "Graduate Engineer": "graduate engineer",
              "Cyber Security": "cyber security"}

    def __init__(self):
        # NB: don't use USERNAME/PASSWORD — Windows sets USERNAME itself and it wins over .env
        self.username = os.getenv('NAUKRI_USERNAME')
        self.password = os.getenv('NAUKRI_PASSWORD')
        self.session = requests.Session()
        self.session.headers.update({
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36",
            "Accept-Language": "en-US,en;q=0.9"
        })
        self.nkparam = None
        self.token = None
        self._page = None

    def login(self, page) -> bool:
        if not self.username or not self.password:
            print("[x] NAUKRI_USERNAME / NAUKRI_PASSWORD missing from .env")
            return False
        
        print("[->] Logging in via browser...")
        try:
            page.goto(f"{self.BASE_URL}/nlogin/login", 
                      wait_until="domcontentloaded", timeout=90000)
            page.fill("#usernameField", self.username)
            page.fill("#passwordField", self.password)
            page.click("button[type='submit']")
            page.wait_for_timeout(8000)

            if not self._is_logged_in(page):
                print("[x] Login did not take — check the window for a captcha")
                return False
            print("[ok] Logged in")
            return True
        except Exception as e:
            print(f"[x] Login failed: {e}")
            return False

    @staticmethod
    def _is_logged_in(page) -> bool:
        """Read the auth cookies rather than DOM selectors: the profile
        widget only renders on some pages, but the cookies are always there.
        """
        cookies = {c["name"]: c["value"] for c in page.context.cookies()}
        return cookies.get("is_login") == "1" and bool(cookies.get("nauk_at"))


    def bootstrap(self, keyword="software developer"):
        from playwright.sync_api import sync_playwright

        seo_key = f"{keyword.replace(' ', '-')}-jobs"
        search_url = f"{self.BASE_URL}/{seo_key}?k={quote(keyword)}"
        captured = {}

        def on_request(req):
            if SEARCH_PATH in req.url and "nkparam" in req.headers:
                captured.update(req.headers)

        #-----browser setup----#
        self._pw = sync_playwright().start()
        self._browser = self._pw.chromium.launch(headless=False)

        ctx_args = {
            "user_agent": self.session.headers["User-Agent"],
            "locale": "en-IN",
            "viewport": {"width": 1440, "height": 900},
        }

        if SESSION_FILE.exists():
            ctx_args["storage_state"] = str(SESSION_FILE)

        ctx = self._browser.new_context(**ctx_args)
        page = ctx.new_page()
        page.on("request", on_request)

        page.goto(search_url, wait_until="domcontentloaded", timeout=90000)
        page.wait_for_timeout(6000)

        # Only log in when the restored session isn't already authenticated.
        if not self._is_logged_in(page):
            if not self.login(page):
                self._teardown()
                return False
            # Back to search so nkparam is minted while authenticated;
            # drop anything captured while we were still logged out.
            captured.clear()
            page.goto(search_url, wait_until="domcontentloaded", timeout=90000)
            page.wait_for_timeout(6000)
        else:
            print("[ok] Already logged in (restored session)")

        if not captured:
            page.mouse.wheel(0,3000)
            page.wait_for_timeout(4000)

        if not captured.get("nkparam"):
            print("[x] Could not capture nkparam")
            self._teardown()
            return False
        
        self.nkparam = captured["nkparam"]
        for c in ctx.cookies():
            self.session.cookies.set(c["name"], c["value"], domain=c["domain"])

        self.token = self.session.cookies.get("nauk_at")
        if self.token:
            self.session.headers["authorization"] = f"Bearer {self.token}"

        ctx.storage_state(path=str(SESSION_FILE))
        self._page = page
        print(f"[ok] nkparam {len(self.nkparam)} chars | token {'yes' if self.token else 'no'}")
        return True

    def _teardown(self):
        try:
            if getattr(self, "_browser", None):
                self._browser.close()
            if getattr(self, "_pw", None):
                self._pw.stop()
        except Exception:
            pass
        # Clear the handles so a second bootstrap() doesn't leak this browser.
        self._browser = None
        self._pw = None
        self._page = None
    

    def scrap_job(self,keyword="software developer", page_no=1):

        params = {
            "noOfResults": 20,
            "urlType": "search_by_keyword",
            "searchType": "adv",
            "keyword": keyword,
            "k": keyword,
            "pageNo": page_no,
            "cityTypeGid": [220,350],
            "sort": "f",
            "src": "sortby",
            "seoKey": f"{keyword.replace(' ', '-')}-jobs",
        }

        # Without the app identity headers the API answers
        # 406 {"message": "recaptcha required"} even with a valid token.
        headers = {
            "accept": "application/json",
            "appid": "109",
            "systemid": "Naukri",
            "clientid": "d3skt0p",
            "gid": "LOCATION,INDUSTRY,EDUCATION,FAREA_ROLE",
            "referer": f"{self.BASE_URL}/{params['seoKey']}?k={quote(keyword)}",
        }

        if self.nkparam:
            headers["nkparam"] = self.nkparam

        try:
            resp = self.session.get(
                self.BASE_URL + SEARCH_PATH,
                params=params,
                headers=headers,
                timeout=15
            )
            resp.raise_for_status()
            return resp.json()
        
        except requests.HTTPError as e:          # MUST come before RequestException
            status = e.response.status_code if e.response is not None else "?"
            print(f"[x] requests got {status}")
            if status in (403, 406) and self._page:
                print("    -> retrying inside browser")
                return self._fetch_in_browser(params)
            return None
        except requests.RequestException as e:
            print(f"[x] failed: {e}")
            return None

    def _fetch_in_browser(self, params):
        # Expand list values into repeated keys the way requests does,
        # otherwise cityTypeGid arrives as the literal string "[220, 350]".
        parts = []
        for k, v in params.items():
            if isinstance(v, (list, tuple)):
                parts.extend(f"{k}={quote(str(i))}" for i in v)
            else:
                parts.append(f"{k}={quote(str(v))}")
        qs = "&".join(parts)
        result = self._page.evaluate(
            """async ({path, qs}) => {
                const r = await fetch(path + "?" + qs, {
                    headers: {"accept": "application/json", "appid": "109",
                            "systemid": "Naukri", "clientid": "d3skt0p",
                            "gid": "LOCATION,INDUSTRY,EDUCATION,FAREA_ROLE"}
                });
                return {status: r.status, body: await r.text()};
            }""",
            {"path": SEARCH_PATH, "qs": qs},
        )
        if result["status"] != 200:
            print(f"[x] in-page: {result['status']} {result['body'][:150]}")
            return None
        return json.loads(result["body"])


    # ------------------------------------------------------------------
    # Parsing
    # ------------------------------------------------------------------

    def _parse(self, raw: dict) -> NaukriJob | None:
        """Map one search-result card onto the fields we keep."""
        job_id = raw.get("jobId")
        jd_url = raw.get("jdURL")
        if not job_id or not jd_url:
            return None

        salary = raw.get("salaryDetail") or {}
        hidden = salary.get("hideSalary", False)

        return NaukriJob(
            source_job_id=job_id,
            title=(raw.get("title") or "").strip(),
            company=(raw.get("companyName") or "").strip(),
            url=f"{self.BASE_URL}{jd_url}",
            location=self._placeholder(raw, "location"),
            # 0 years is a real value here (fresher roles), so keep it.
            min_experience=self._to_int(raw.get("minimumExperience"), keep_zero=True),
            max_experience=self._to_int(raw.get("maximumExperience"), keep_zero=True),
            min_salary=None if hidden else self._to_int(salary.get("minimumSalary")),
            max_salary=None if hidden else self._to_int(salary.get("maximumSalary")),
            currency="" if hidden else (raw.get("currency") or ""),
            description=(raw.get("jobDescription") or "").strip(),
            skills=self._skills(raw),
            posted_at=self._to_datetime(raw.get("createdDate")),
        )

    @staticmethod
    def _placeholder(raw: dict, kind: str) -> str:
        """Pull a labelled value out of the card's `placeholders` list."""
        for item in raw.get("placeholders") or []:
            if item.get("type") == kind:
                return item.get("label", "")
        return ""

    @staticmethod
    def _skills(raw: dict) -> list[str]:
        """Skills arrive either as a comma-joined string or a keySkills object."""
        tags = raw.get("tagsAndSkills")
        if tags:
            return [s.strip() for s in tags.split(",") if s.strip()]

        key_skills = raw.get("keySkills") or {}
        skills: list[str] = []
        for group in ("nerSkills", "otherSkills"):
            skills.extend(key_skills.get(group) or [])
        return skills

    @staticmethod
    def _to_int(value, keep_zero: bool = False) -> int | None:
        """Coerce to int. Naukri sends 0 for "not specified" on salary and
        timestamps, but 0 is meaningful for experience — hence `keep_zero`.
        """
        try:
            number = int(value)
        except (TypeError, ValueError):
            return None
        if number == 0 and not keep_zero:
            return None
        return number

    @staticmethod
    def _to_datetime(value) -> datetime | None:
        """`createdDate` is epoch milliseconds, or 0 when unset."""
        millis = NaukriScraper._to_int(value)
        if millis is None:
            return None
        return datetime.fromtimestamp(millis / 1000, tz=timezone.utc)

    # ------------------------------------------------------------------

    def fetch_jobs(self, keyword: str, pages: int = 1) -> list[NaukriJob]:
        """Search `keyword` across `pages` pages and return parsed listings."""
        jobs: list[NaukriJob] = []
        seen: set[str] = set()

        for page_no in range(1, pages + 1):
            data = self.scrap_job(keyword, page_no)
            if not data:
                break

            cards = data.get("jobDetails") or []
            if not cards:
                break

            for raw in cards:
                job = self._parse(raw)
                # The same job can surface on more than one page.
                if job and job.source_job_id not in seen:
                    seen.add(job.source_job_id)
                    jobs.append(job)

            print(f"[ok] page {page_no}: {len(cards)} cards ({len(jobs)} unique)")

            if len(cards) < 20:
                break  # last page
            if page_no < pages:
                time.sleep(1)

        return jobs

    def run(self, keywords=None, pages: int = 2) -> dict[str, list[NaukriJob]]:
        """Bootstrap one browser session, then scrape every keyword."""
        if isinstance(keywords, str):
            keywords = [keywords]
        keywords = keywords or list(self.DOMAIN.values())

        # nkparam is per-session, not per-keyword: bootstrap once and reuse.
        if not self.bootstrap(keywords[0]):
            return {}

        results: dict[str, list[NaukriJob]] = {}
        try:
            for kw in keywords:
                print(f"\n=== {kw} ===")
                results[kw] = self.fetch_jobs(kw, pages=pages)
                for job in results[kw][:3]:
                    print(f"     {job.title} | {job.company} | {job.location}")
                time.sleep(1)
        finally:
            self._teardown()

        total = sum(len(v) for v in results.values())
        print(f"\n[ok] {total} jobs across {len(results)} keywords")
        return results


if __name__ == "__main__":

    naukri = NaukriScraper()
    naukri.run()
