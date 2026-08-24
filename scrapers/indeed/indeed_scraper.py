"""Indeed (in.indeed.com) job scraper.

The account signs in through Google only, so there is no password to
automate — Indeed's login also sits behind Cloudflare, which makes a bare
`requests` login attempt unreliable even if we replay a captured OAuth POST
(those tokens are single-use and short-lived anyway).

Instead, following the same idea as `scrapers/foundit`: a human logs in once
in a real, visible browser (Playwright), and we persist that authenticated
context's `storage_state` (cookies + local storage, including the long-lived
`CTK`/`rememberMe` cookies Indeed issues after the Google exchange) to disk.
Every later run restores that state silently — no browser UI, no repeated
login — until it eventually expires and a human has to log in again.

Indeed's search page is a split view: the left column lists cards, and
clicking a card's title loads that job's full detail into a pane on the
right of the *same* page — no navigation needed. That's faster than
visiting a separate `/viewjob?jk=...` page per listing (which also works,
and is used as a fallback when a card fails to open in-pane), so
`fetch_jobs` clicks through each card on the results page and reads the
detail pane after each click. Selectors below were taken from a captured
page (see `indeed.txt`), not guessed:

  - card title / open trigger : a.jcs-JobTitle[data-jk]
  - company name              : [data-testid="company-name"]
  - location                  : [data-testid="text-location"]
  - salary                    : #salaryInfoAndJobType span
  - job type tags             : [data-testid$="-tile"] under the
                                 "Job type" insights block
  - description                : #jobDescriptionText
  - apply widget (has job id)  : [data-indeed-apply-jk],
                                  [data-indeed-apply-joburl] (fallback url)
  - company link                : #companyLink (href to /cmp/...)
  - company logo (company page) : img[itemprop="image"]
  - company rating              : text "<n> out of 5 stars"
  - industry                    : [data-testid="companyInfo-industry"]

Indeed doesn't expose `posted_at` anywhere reliable on this view, so it is
intentionally left unset — `created_at`/`updated_at` (scrape time) stand in
for it, same as any other field the source doesn't provide.

For speed, the browser stays headless and the same page is reused across
every search call instead of relaunching, and image/font/media requests are
aborted via `page.route()` since we only need text.
"""

import re
import time
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path
from urllib.parse import quote

from scrapers.common import clean_html, to_text

CRED_DIR = Path(__file__).resolve().parents[1] / "cred"   # -> scrapers/cred
CRED_DIR.mkdir(parents=True, exist_ok=True)

SESSION_FILE = CRED_DIR / "indeed_session.json"

# The generic /account/login redirects here anyway; going straight to it
# skips a hop, and `continue=` is where Indeed sends you back after auth
# completes — pointed at a real search so the post-login page already has
# jobs on it (Indeed's own links always carry a `continue=`, never land on
# secure.indeed.com bare).
LOGIN_URL = "https://secure.indeed.com/auth?hl=en_IN&co=IN&continue={continue_}"

# Aborting these keeps every page load text-only and much faster; we never
# read images, fonts, media or (non-essential) stylesheets off the DOM.
_BLOCKED_RESOURCE_TYPES = {"image", "font", "media", "stylesheet"}

# Removes the most common Chromium automation tell: with this flag Chrome
# stops setting `navigator.webdriver` itself, so the init script below is
# patching a clean slate instead of fighting the browser's own flag.
# --start-maximized (paired with no_viewport below) avoids the fixed small
# viewport that headless/automated browsers are typically launched with,
# which is itself a signal some bot checks key on.
_STEALTH_LAUNCH_ARGS = [
    "--disable-blink-features=AutomationControlled",
    "--start-maximized",
]

# Patches the handful of JS-visible fingerprints Cloudflare/Indeed's bot
# checks commonly read, closing what the launch flag above doesn't cover.
# Runs before any page script via add_init_script, on every new document.
_STEALTH_INIT_SCRIPT = """
Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
Object.defineProperty(navigator, 'languages', { get: () => ['en-IN', 'en-US', 'en'] });
window.chrome = { runtime: {} };
const originalQuery = window.navigator.permissions.query;
window.navigator.permissions.query = (parameters) => (
    parameters.name === 'notifications'
        ? Promise.resolve({ state: Notification.permission })
        : originalQuery(parameters)
);
"""


@dataclass
class IndeedJob:
    """One listing, normalized to the fields `jobs.models.Job` stores."""

    source_job_id: str
    title: str
    company: str
    url: str
    apply_url: str = ""
    company_logo: str = ""
    company_id: str = ""
    location: str = ""
    min_salary: int | None = None
    max_salary: int | None = None
    currency: str = ""
    description: str = ""        # sanitized HTML, safe to render
    description_text: str = ""   # plain text, for previews and search
    skills: list[str] = field(default_factory=list)
    job_type: str = ""
    industry: str = ""
    posted_at: datetime | None = None
    is_active: bool = True
    is_remote: bool = False
    source: str = "indeed"

    def as_dict(self) -> dict:
        """Keyword args for Job.objects.update_or_create()."""
        return self.__dict__.copy()


class IndeedScraper:
    BASE_URL = "https://in.indeed.com"
    SEARCH_PATH = "/jobs"
    RESULTS_PER_PAGE = 15  # Indeed's fixed page size

    # Indeed encodes "Remote" as this opaque filter token, captured off the
    # site's own "Remote" checkbox — not documented, just how the URL reads.
    REMOTE_FILTER = "0kf:attr(DSQF7);"

    # fromage in days; 1 = posted in the last 24h. None drops the filter.
    FRESHNESS_DAYS = 1

    # Indeed takes plain city names in `l=`, one search per city.
    CITIES = ["Delhi", "Noida", "Greater Noida", "Gurugram"]

    # Raw keywords, matching the other scrapers' DOMAIN dict.
    DOMAIN = {
        "Software Developer": "software developer",
        "Graduate Engineer": "graduate engineer",
        "Cyber Security": "cyber security",
        "Python": "python",
        "Backend": "backend",
    }

    def __init__(self, fetch_company_details: bool = False):
        # Company page (logo/rating/industry) is a second navigation per
        # unique employer — off by default since it roughly doubles page
        # loads; turn on when that data is actually needed.
        self.fetch_company_details = fetch_company_details
        self._pw = None
        self._browser = None
        self._page = None
        self._company_cache: dict[str, dict] = {}

    # ------------------------------------------------------------------
    # Auth
    # ------------------------------------------------------------------

    def bootstrap(self) -> bool:
        """Restore the saved session, or prompt for one manual login.

        Indeed is Google-only for this account, and Google's own sign-in
        flow is quick to refuse completion inside a CDP-driven browser
        ("This browser or app may not be secure") since Google can detect
        the automation protocol itself, not just JS-readable fingerprints.
        Launching with `channel="chrome"` (a real, installed Chrome instead
        of Playwright's bundled Chromium) plus no UA/viewport spoofing on
        top of it — see `_STEALTH_LAUNCH_ARGS`/`_STEALTH_INIT_SCRIPT` and
        `bootstrap`'s ctx_args — removes most of the automation tells and
        the UA/engine mismatches that made things worse. It is still not
        guaranteed against Google's server-side checks, so, matching
        `scrapers/linkedin`: rather than racing a cookie-polling loop
        against Google's flow, the browser opens visibly, always headed,
        and the script just blocks on `input()` — you log in by hand, at
        your own pace (including any extra verification Google throws up),
        then press Enter here once you're actually through. Only then is
        `storage_state` captured. Every later run restores it headlessly
        with no login step at all, until it goes stale and this prompt
        happens again.
        """
        from playwright.sync_api import sync_playwright

        self._pw = sync_playwright().start()

        have_session = SESSION_FILE.exists()
        self._browser = self._pw.chromium.launch(
            headless=have_session,
            channel="chrome",
            args=_STEALTH_LAUNCH_ARGS,
        )

        # No user_agent override and no_viewport=True: a real, installed
        # Chrome (channel="chrome") already sends a consistent, genuine UA
        # and — with --start-maximized above — a real window size. Spoofing
        # either on top of a real browser makes the fingerprint *more*
        # suspicious (UA/engine mismatches), not less; that mismatch is
        # exactly what both Cloudflare and Google's login flow key on.
        ctx_args = {
            "locale": "en-IN",
            "no_viewport": True,
            "extra_http_headers": {"Accept-Language": "en-IN,en-US;q=0.9,en;q=0.8"},
        }
        if have_session:
            ctx_args["storage_state"] = str(SESSION_FILE)

        ctx = self._browser.new_context(**ctx_args)
        ctx.add_init_script(_STEALTH_INIT_SCRIPT)
        page = ctx.new_page()
        page.goto(f"{self.BASE_URL}/jobs?q=software+developer",
                  wait_until="domcontentloaded", timeout=90000)
        page.wait_for_timeout(4000)

        if not self._is_logged_in(page):
            if have_session:
                print("[x] Saved session expired — need a fresh manual login")
            # Re-open visibly (headless=have_session may have started
            # headless if a — now stale — session file existed). Close just
            # the browser, not the whole driver, so self._pw stays usable.
            if have_session:
                self._browser.close()
                self._browser = self._pw.chromium.launch(
                    headless=False, channel="chrome", args=_STEALTH_LAUNCH_ARGS,
                )
                ctx = self._browser.new_context(**{k: v for k, v in ctx_args.items()
                                                   if k != "storage_state"})
                ctx.add_init_script(_STEALTH_INIT_SCRIPT)
                page = ctx.new_page()

            continue_url = f"{self.BASE_URL}/jobs?q=software+developer&l=&fromage=1&from=searchOnDesktopSerp"
            login_url = LOGIN_URL.format(continue_=quote(continue_url, safe=""))
            page.goto(login_url, wait_until="domcontentloaded", timeout=90000)
            input("[->] Log in manually in the browser window (Google sign-in), "
                  "then press Enter here...")

            if not self._is_logged_in(page):
                print("[x] Still not logged in — aborting")
                self._teardown()
                return False

        ctx.storage_state(path=str(SESSION_FILE))

        # Block heavy asset types on this context so every later page load
        # stays text-only and fast.
        ctx.route(
            "**/*",
            lambda route: route.abort()
            if route.request.resource_type in _BLOCKED_RESOURCE_TYPES
            else route.continue_(),
        )

        self._page = page
        print("[ok] Indeed session ready")
        return True

    @staticmethod
    def _is_logged_in(page) -> bool:
        """`CTK` is set even for anonymous visitors, so it's a false positive
        for "logged in". The PassportAuthProxy bearer token only exists
        post-authentication, so check that instead.
        """
        cookies = {c["name"]: c["value"] for c in page.context.cookies()}
        return bool(cookies.get("__Secure-PassportAuthProxy-BearerToken"))

    def _teardown(self):
        try:
            if self._browser:
                self._browser.close()
            if self._pw:
                self._pw.stop()
        except Exception:
            pass
        self._browser = None
        self._pw = None
        self._page = None

    # ------------------------------------------------------------------
    # Fetching
    # ------------------------------------------------------------------

    def search(self, keyword: str, city: str = "", start: int = 0,
               remote: bool = False, freshness: int | None = None) -> list[IndeedJob]:
        """Load one search-results page and open every card's detail pane.

        Mirrors Indeed's own URLs: `l=<city>` for a location search (empty
        for nationwide/remote), `fromage=<days>` for freshness, and the
        `sc=` filter token for "Remote" — captured straight off the site's
        own search bar, not reverse-engineered.

        For each card, clicks the job title (opens the right-hand detail
        pane in place) and reads title/company/location/salary/type/
        description/apply info off that pane — one page load covers the
        whole results page instead of one navigation per job.
        """
        params = f"q={quote(keyword)}&l={quote(city)}&start={start}"
        freshness = self.FRESHNESS_DAYS if freshness is None else freshness
        if freshness:
            params += f"&fromage={freshness}"
        if remote:
            params += f"&sc={quote(self.REMOTE_FILTER)}"
        params += "&from=searchOnDesktopSerp"

        url = f"{self.BASE_URL}{self.SEARCH_PATH}?{params}"
        try:
            self._page.goto(url, wait_until="domcontentloaded", timeout=60000)
            self._page.wait_for_selector("a.jcs-JobTitle", timeout=15000)
        except Exception as e:
            print(f"[x] page load failed: {e}")
            return []

        job_keys = self._page.locator("a.jcs-JobTitle").evaluate_all(
            "els => els.map(e => e.getAttribute('data-jk'))"
        )

        jobs: list[IndeedJob] = []
        for job_key in job_keys:
            if not job_key:
                continue
            job = self._open_card(job_key)
            if job:
                jobs.append(job)
            time.sleep(0.3)
        return jobs

    def _open_card(self, job_key: str) -> IndeedJob | None:
        """Click one card's title and read the detail pane it opens.

        Falls back to a direct `/viewjob?jk=` navigation if the in-page
        click doesn't produce a description in time (occasionally a card
        needs a second interaction, or the pane layout differs).
        """
        title_link = self._page.locator(f'a.jcs-JobTitle[data-jk="{job_key}"]').first
        try:
            if title_link.count():
                title_link.click(timeout=10000)
                self._page.wait_for_selector("#jobDescriptionText", timeout=10000)
            else:
                raise ValueError("card not found on page")
        except Exception:
            try:
                self._page.goto(f"{self.BASE_URL}/viewjob?jk={job_key}",
                                wait_until="domcontentloaded", timeout=30000)
                self._page.wait_for_selector("#jobDescriptionText", timeout=15000)
            except Exception as e:
                print(f"[x] could not open job {job_key}: {e}")
                return None

        return self._parse_detail(job_key)

    # ------------------------------------------------------------------
    # Parsing
    # ------------------------------------------------------------------

    def _parse_detail(self, job_key: str) -> IndeedJob | None:
        """Read the fields we keep off the currently-open detail pane."""
        page = self._page

        def text(selector: str) -> str:
            loc = page.locator(selector).first
            return loc.inner_text().strip() if loc.count() else ""

        title = text('[data-testid="jobsearch-JobInfoHeader-title"] span') or text("h1")
        company = text('[data-testid="company-name"]')
        location = text('[data-testid="text-location"]')
        salary_text = text("#salaryInfoAndJobType span")
        job_type = ", ".join(sorted(set(
            page.locator('[data-testid$="-tile"] span').all_inner_texts()
        )))

        desc_loc = page.locator("#jobDescriptionText").first
        description_html = desc_loc.inner_html() if desc_loc.count() else ""

        apply_widget = page.locator("[data-indeed-apply-jk]").first
        apply_key = (apply_widget.get_attribute("data-indeed-apply-jk")
                     if apply_widget.count() else None) or job_key
        apply_url = (apply_widget.get_attribute("data-indeed-apply-joburl")
                     if apply_widget.count() else None)

        url = f"{self.BASE_URL}/viewjob?jk={job_key}"
        if not apply_url:
            apply_url = url  # no apply widget on this listing — fall back to the job url

        min_salary, max_salary, currency = self._parse_salary(salary_text)

        job = IndeedJob(
            source_job_id=apply_key or job_key,
            title=title,
            company=company,
            url=url,
            apply_url=apply_url,
            location=location,
            min_salary=min_salary,
            max_salary=max_salary,
            currency=currency,
            description=clean_html(description_html),
            description_text=to_text(description_html),
            job_type=job_type,
        )

        if not job.title:
            return None

        if self.fetch_company_details:
            self._apply_company_details(job)

        return job

    def _apply_company_details(self, job: "IndeedJob") -> None:
        """Follow #companyLink to the company page for logo/rating/industry.

        Cached per company URL within a run — many listings share an
        employer, and this is a second full page load per company.
        """
        link = self._page.locator("#companyLink").first
        if not link.count():
            return
        company_url = link.get_attribute("href")
        if not company_url:
            return

        if company_url in self._company_cache:
            details = self._company_cache[company_url]
        else:
            details = self._read_company_page(company_url)
            self._company_cache[company_url] = details

        job.company_logo = details.get("logo", "")
        job.industry = details.get("industry", "")
        job.company_id = details.get("company_id", "")

    def _read_company_page(self, company_url: str) -> dict:
        page = self._page
        try:
            page.goto(company_url, wait_until="domcontentloaded", timeout=30000)
            page.wait_for_timeout(1500)
        except Exception as e:
            print(f"[x] company page load failed: {e}")
            return {}

        logo = page.locator('img[itemprop="image"]').first
        logo_src = logo.get_attribute("src") if logo.count() else ""
        if logo_src and logo_src.startswith("/"):
            logo_src = self.BASE_URL + logo_src

        industry_loc = page.locator('[data-testid="companyInfo-industry"] div').last
        industry = industry_loc.inner_text().strip() if industry_loc.count() else ""

        match = re.search(r"/cmp/([^/?#]+)", company_url)
        company_id = match.group(1) if match else ""

        return {"logo": logo_src or "", "industry": industry, "company_id": company_id}

    @staticmethod
    def _parse_salary(text: str) -> tuple[int | None, int | None, str]:
        """Salary shows as free text, e.g. "₹4,00,000 - ₹8,00,000 a year"
        or "₹50 - ₹100 an hour". Not every listing has one, and format
        varies — best-effort parse, None/"" when it doesn't match.
        """
        if not text or "₹" not in text:
            return None, None, ""
        numbers = [int(n.replace(",", "")) for n in re.findall(r"₹\s*([\d,]+)", text)]
        if not numbers:
            return None, None, ""
        if len(numbers) == 1:
            return numbers[0], numbers[0], "INR"
        return min(numbers), max(numbers), "INR"

    # ------------------------------------------------------------------

    def fetch_jobs(self, keyword: str, pages: int = 1, city: str = "",
                   remote: bool = False, freshness: int | None = None) -> list[IndeedJob]:
        """Search `keyword` across `pages` pages and return parsed listings."""
        jobs: list[IndeedJob] = []
        seen: set[str] = set()

        for page_no in range(pages):
            found = self.search(keyword, city=city, start=page_no * self.RESULTS_PER_PAGE,
                                remote=remote, freshness=freshness)
            if not found:
                break  # nothing left

            new = 0
            for job in found:
                if job.source_job_id not in seen:
                    seen.add(job.source_job_id)
                    jobs.append(job)
                    new += 1

            print(f"[ok] page {page_no + 1}: {len(found)} cards ({len(jobs)} unique)")

            if len(found) < self.RESULTS_PER_PAGE:
                break  # short page — nothing left to paginate
            if page_no < pages - 1:
                time.sleep(1)

        return jobs

    def run(self, keywords=None, cities=None, freshness: int | None = None) -> dict[str, list[IndeedJob]]:
        """Bootstrap one browser session, then for each keyword: one remote
        search (no city, "Remote" filter on), then one single-page search
        per city with that filter dropped. Results are merged and de-duped
        per keyword, remote-tagged copies winning on overlap.
        """
        if isinstance(keywords, str):
            keywords = [keywords]
        keywords = keywords or list(self.DOMAIN.values())
        cities = self.CITIES if cities is None else cities

        if not self.bootstrap():
            return {}

        results: dict[str, list[IndeedJob]] = {}
        try:
            for kw in keywords:
                print(f"\n=== {kw} (remote) ===")
                remote_jobs = self.fetch_jobs(kw, pages=1, remote=True, freshness=freshness)
                for job in remote_jobs:
                    job.is_remote = True
                time.sleep(1)

                city_jobs: list[IndeedJob] = []
                for city in cities:
                    print(f"\n=== {kw} ({city}) ===")
                    city_jobs += self.fetch_jobs(kw, pages=1, city=city, freshness=freshness)
                    time.sleep(1)

                merged: dict[str, IndeedJob] = {j.source_job_id: j for j in city_jobs}
                merged.update({j.source_job_id: j for j in remote_jobs})
                results[kw] = list(merged.values())

                for job in results[kw][:3]:
                    print(f"     {job.title} | {job.company} | {job.location}")
        finally:
            self._teardown()

        total = sum(len(v) for v in results.values())
        print(f"\n[ok] {total} jobs across {len(results)} keywords")
        return results


if __name__ == "__main__":

    indeed = IndeedScraper()
    indeed.run()
