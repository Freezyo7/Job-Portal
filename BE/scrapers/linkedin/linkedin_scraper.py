from playwright.sync_api import sync_playwright
import csv
import time
import random
import json
import re
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from urllib.parse import urlparse, parse_qs, urlencode, urlunparse, unquote, quote
import os

from dotenv import load_dotenv
from scrapers.common import dump_debug_snapshot, to_text

load_dotenv()

LINKEDIN_USERNAME = os.getenv("LINKEDIN_USERNAME")
LINKEDIN_PASSWORD = os.getenv("LINKEDIN_PASSWORD")


# ── Search URL ────────────────────────────────────────────────────────────────
# Base URL template — {keywords} is replaced with the URL-encoded keyword.
SEARCH_URL_TEMP = (
    "https://www.linkedin.com/jobs/search/"
    "?keywords={keywords}"
    "&origin=JOB_SEARCH_PAGE_JOB_FILTER"
    "&f_TPR=r86400"   # past 24 hours
)

# Appended to SEARCH_URL_TEMP to activate LinkedIn's remote-only filter.
REMOTE_FILTER = "&f_WT=2"

# ── Location filter ────────────────────────────────────────────────────────────
# LinkedIn geo IDs — common examples:
#   India          : 102713980
#   Delhi (NCR)    : 102713980  (city-level geoId)
#   Noida          : 104869687
#   Bengaluru      : 105214831
#   Hyderabad      : 105556813
#   Mumbai         : 103586894
# Set GEO_ID = None to search globally (no location filter).
GEO_ID   = 104869687   # India
DISTANCE = 90          # km radius — None omits the &distance param

# ── Experience level filter ────────────────────────────────────────────────────
# LinkedIn f_E values (comma-separate multiple):
#   1 = Internship   2 = Entry level   3 = Associate
#   4 = Mid-Senior   5 = Director      6 = Executive
# Set EXPERIENCE_LEVELS = None to skip the filter.
EXPERIENCE_LEVELS = "2,3,4"   # Entry / Associate / Mid-Senior

# Each tuple: (domain_label, url_encoded_keyword)
# For every entry, the scraper will run:
#   1. Normal search   (is_remote=False)
#   2. Remote search   (is_remote=True, REMOTE_FILTER appended)
DOMAINS = [
    ("Software Engineer",     "software%20engineer"),
    # ("Data Analyst",          "data%20analyst"),
    # ("Cloud & Data Engineer", "cloud%20data%20engineer"),
    # ("Cyber Security",        "cyber%20security"),
    # ("Data Scientist",        "data%20scientist"),
    # ("AI & Machine Learning", "ai%20ml"),
]

STATE_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "linkedin_cred.json")
OUTPUT_CSV = "linkedin_jobs2.csv"
MAX_PAGES = 1   # pages scraped per URL (normal + remote = 2 runs per keyword)


# ── Helpers ───────────────────────────────────────────────────────────────────

def _parse_source_job_id(job_link: str) -> str:
    """Extract the numeric job ID from a LinkedIn job URL.

    Handles both canonical forms:
      https://www.linkedin.com/jobs/view/4457441946/...
      https://www.linkedin.com/jobs/view/4457441946/?...
    Returns an empty string when no ID is found.
    """
    m = re.search(r"/jobs/view/(\d+)", job_link or "")
    return m.group(1) if m else ""


def _parse_applicant_count(text: str) -> int | None:
    """Parse applicant strings like 'Over 100 applicants', '23 applicants'."""
    if not text:
        return None
    m = re.search(r"([\d,]+)", text.replace(",", ""))
    return int(m.group(1)) if m else None


def _parse_posted_at(text: str) -> datetime | None:
    """Convert relative strings like '7 hours ago', '2 days ago' to datetime.

    Returns None when the string cannot be parsed (e.g. empty or unknown).
    """
    if not text:
        return None
    now = datetime.now(tz=timezone.utc)
    low = text.lower()
    m = re.search(r"(\d+)", low)
    n = int(m.group(1)) if m else 1
    if "minute" in low:
        return now - timedelta(minutes=n)
    if "hour" in low:
        return now - timedelta(hours=n)
    if "day" in low:
        return now - timedelta(days=n)
    if "week" in low:
        return now - timedelta(weeks=n)
    if "month" in low:
        return now - timedelta(days=n * 30)
    return None


def _row_to_linkedin_job(row: dict) -> "LinkedInJob":
    """Convert a raw scraper row dict into a LinkedInJob dataclass."""
    job_link = (row.get("job_link") or "").strip()
    return LinkedInJob(
        source_job_id=_parse_source_job_id(job_link),
        title=row.get("job_title", "").strip(),
        company=row.get("company_name", "").strip(),
        location=row.get("job_location", "").strip(),
        url=job_link,
        apply_url=(row.get("apply_url") or "").strip(),
        company_logo=(row.get("company_logo") or "").strip(),
        company_link=(row.get("company_page_link") or "").strip(),
        industry=(row.get("company_sector") or "").strip(),
        # job_type on LinkedIn is the on-site/hybrid/remote work model;
        # employment_type is the contract type (Full-time, Part-time, …).
        job_type=(row.get("job_working_des") or "").strip(),
        employment_type=(row.get("job_type") or "").strip(),
        is_remote=bool(row.get("is_remote", False)),
        description_text=to_text(row.get("jd") or ""),
        description=(row.get("jd") or ""),
        applicant_count=_parse_applicant_count(row.get("applicants") or ""),
        posted_at=_parse_posted_at(row.get("posted_date") or ""),
        domain=(row.get("domain") or ""),
    )


# ── Data class ────────────────────────────────────────────────────────────────

@dataclass
class LinkedInJob:
    """One LinkedIn listing, normalized to the fields `jobs.models.Job` stores."""

    source_job_id: str
    title: str
    company: str
    url: str
    apply_url: str = ""
    company_logo: str = ""
    company_link: str = ""          # maps to Job.company_link
    location: str = ""
    industry: str = ""              # maps to Job.industry
    job_type: str = ""              # On-site / Hybrid / Remote (work model)
    employment_type: str = ""       # Full-time / Part-time / Contract
    is_remote: bool = False
    description: str = ""           # raw/sanitized HTML
    description_text: str = ""      # plain text for card previews
    skills: list[str] = field(default_factory=list)
    applicant_count: int | None = None
    posted_at: datetime | None = None
    is_active: bool = True
    source: str = "linkedin"
    domain: str = ""                # search keyword label (not stored in Job)

    def as_dict(self) -> dict:
        """Keyword args for Job.objects.update_or_create().

        Strips fields that have no counterpart in jobs.models.Job so that
        Django's update_or_create() doesn't see unknown keyword arguments.
        """
        d = self.__dict__.copy()
        d.pop("domain", None)   # search label, not a Job field
        return d


# ── Scraper class ─────────────────────────────────────────────────────────────

class LinkedInScraper:
    """Playwright-based LinkedIn job scraper.

    Follows the same interface as NaukriScraper / FounditScraper so that
    main.py can drive it through the generic run_scraper() helper.

    Usage (from main.py)::

        scraper = LinkedInScraper()
        results = scraper.run(
            keywords=[("Software Engineer", "software%20engineer"), ...],
            pages=1,
        )
        # results: {domain_label: [LinkedInJob, ...]}
    """

    def run(
        self,
        keywords=None,          # list of (domain_label, url_encoded_keyword)
        pages: int = MAX_PAGES,
        **_ignored,             # absorb cities / freshness passed by run_scraper()
    ) -> dict[str, list[LinkedInJob]]:
        """Scrape LinkedIn and return results keyed by domain label.

        `keywords` is a list of *(label, url_key)* tuples matching the
        shape of the module-level DOMAINS list.  If omitted, DOMAINS is used.
        """
        domains = keywords or DOMAINS
        results: dict[str, list[LinkedInJob]] = {}

        is_headless = os.getenv("HEADLESS", "false").lower() in ("true", "1", "yes")
        with sync_playwright() as p:
            browser = p.chromium.launch(
                headless=is_headless,
                args=["--disable-blink-features=AutomationControlled"],
            )

            # Reuse saved session if available, else log in fresh.
            if os.path.exists(STATE_FILE):
                print("✅ Found saved login state, loading...")
                context = browser.new_context(storage_state=STATE_FILE)
            else:
                context = browser.new_context(
                    user_agent=(
                        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                        "AppleWebKit/537.36 (KHTML, like Gecko) "
                        "Chrome/120.0.0.0 Safari/537.36"
                    ),
                    viewport={"width": 1200, "height": 850},
                    java_script_enabled=True,
                    ignore_https_errors=True,
                    bypass_csp=True,
                )
                page = context.new_page()
                login_with_credentials(page)
                context.storage_state(path=STATE_FILE)
                page.close()

            context.add_init_script("Object.defineProperty(navigator, 'webdriver', { get: () => undefined });")
            page = context.new_page()

            try:
                for domain_name, url_key in domains:
                    all_rows: list[dict] = []

                    base_url = SEARCH_URL_TEMP.format(keywords=url_key)
                    if GEO_ID is not None:
                        base_url += f"&geoId={GEO_ID}"
                        if DISTANCE is not None:
                            base_url += f"&distance={DISTANCE}"
                    if EXPERIENCE_LEVELS is not None:
                        base_url += f"&f_E={EXPERIENCE_LEVELS}"

                    scrape_runs = [
                        (False, base_url),
                        (True,  base_url + REMOTE_FILTER),
                    ]

                    for is_remote_run, search_url in scrape_runs:
                        run_label = "remote" if is_remote_run else "non-remote"
                        print(f"\n{'='*60}")
                        print(f"🚀 [{domain_name}] {run_label} — scraping {pages} page(s)")
                        print(f"   🔗 {search_url}")
                        print(f"{'='*60}")

                        current_page = 1
                        while current_page <= pages:
                            page_url = get_page_url(search_url, current_page)
                            print(f"\n📄 Navigating to page {current_page}...")
                            try:
                                page.goto(page_url, timeout=60000, wait_until="domcontentloaded")
                            except Exception as e:
                                print(f"   ❌ Navigation failed: {e}")
                                break

                            try:
                                page.wait_for_selector(
                                    "li.scaffold-layout__list-item, div.jobs-search-no-results-banner",
                                    timeout=15000,
                                )
                                if page.query_selector("div.jobs-search-no-results-banner"):
                                    print(f"   ℹ️ No jobs for [{domain_name}] {run_label} (page {current_page})")
                                    break
                            except Exception:
                                print(f"   ⚠️ Page {current_page} failed to load")
                                break

                            before = len(all_rows)
                            jobs_processed = process_single_page(page, current_page, all_rows, domain_name)

                            if is_remote_run:
                                for row in all_rows[before:]:
                                    row["is_remote"] = True

                            if jobs_processed == 0:
                                break

                            if current_page < pages:
                                if not check_pagination_available(page):
                                    break

                            current_page += 1
                            human_wait(1, 2)

                        human_wait(2, 4)

                    # De-duplicate by source_job_id; remote-tagged rows win.
                    seen: dict[str, LinkedInJob] = {}
                    for row in all_rows:
                        job = _row_to_linkedin_job(row)
                        if not job.source_job_id:
                            continue
                        existing = seen.get(job.source_job_id)
                        if existing is None or job.is_remote:
                            seen[job.source_job_id] = job

                    results[domain_name] = list(seen.values())
                    print(f"\n[linkedin/{domain_name}] {len(results[domain_name])} unique jobs collected")

            except Exception:
                dump_debug_snapshot(page, "linkedin", "run_exception")
                raise
            finally:
                context.close()
                browser.close()

        return results


def human_wait(min_s=1.0, max_s=3.0):
    time.sleep(random.uniform(min_s, max_s))

def click_job_card(page, card_index):
    """Click on a specific job card to load its details"""
    try:
        # Find the job card link and click it
        job_cards = page.query_selector_all("li.scaffold-layout__list-item div.job-card-container")
        if card_index < len(job_cards):
            card = job_cards[card_index]
            job_link = card.query_selector("div.artdeco-entity-lockup__title a.job-card-container__link")
            if job_link:
                job_link.click()
                return True
        return False
    except Exception as e:
        print(f"   ❌ Error clicking job card {card_index}: {e}")
        return False
    
def get_page_url(base_url, page_number):
    """Generate URL for specific page number (LinkedIn uses 'start' parameter)"""
    parsed = urlparse(base_url)
    query_params = parse_qs(parsed.query)
    
    # LinkedIn uses 'start' parameter where start = (page_number - 1) * 25
    # Page 1: start=0, Page 2: start=25, Page 3: start=50, etc.
    start_value = (page_number - 1) * 25
    query_params['start'] = [str(start_value)]
    
    # Remove currentJobId to avoid issues with pagination
    if 'currentJobId' in query_params:
        del query_params['currentJobId']
    
    new_query = urlencode(query_params, doseq=True)
    new_url = urlunparse((parsed.scheme, parsed.netloc, parsed.path, parsed.params, new_query, parsed.fragment))
    
    return new_url

def scroll_page(page, pause=1.5, max_scroll=15):
    # ✅ Use locator for the job list container
    job_list = page.locator("div.scaffold-layout__list")

    prev_count = 0
    no_change_count = 0
    
    print("Starting optimized scroll to load all job cards...")
    
    for i in range(max_scroll):
        # Count current jobs
        cards = page.locator("li.scaffold-layout__list-item div.job-card-container")
        current_count = cards.count()
        
        print(f"[{i+1}] Current jobs: {current_count}", end="")
        
        # Smart scrolling strategy based on current state
        if current_count == 0:
            # Initial load - just scroll a bit
            job_list.evaluate("el => el.scrollBy(0, 600)")
        elif no_change_count == 0:
            # Normal scrolling - try to scroll to trigger more loading
            try:
                # Scroll to 2nd-to-last job to trigger loading
                if current_count > 2:
                    target_index = current_count - 2
                    target_card = job_list.locator("li.scaffold-layout__list-item").nth(target_index)
                    target_card.scroll_into_view_if_needed()
                else:
                    job_list.evaluate("el => el.scrollBy(0, 800)")
            except:
                job_list.evaluate("el => el.scrollBy(0, 800)")
        else:
            # Aggressive mode - scroll to last card immediately
            try:
                last_card = job_list.locator("li.scaffold-layout__list-item").last
                last_card.scroll_into_view_if_needed()
            except:
                job_list.evaluate("el => el.scrollTop = el.scrollHeight")
        
        # Wait for content to load (shorter wait)
        time.sleep(pause)
        
        # Count jobs after scrolling
        cards = page.locator("li.scaffold-layout__list-item div.job-card-container")
        count = cards.count()
        change = count - current_count
        
        print(f" → {count} (+{change})")

        # Update counters
        if count > prev_count:
            no_change_count = 0
            prev_count = count
        else:
            no_change_count += 1
            
        # Quick exit if no changes for 2 attempts
        if no_change_count >= 2:
            # One final aggressive attempt
            print("   🚀 Final attempt - scrolling to absolute bottom...")
            try:
                job_list.evaluate("el => el.scrollTop = el.scrollHeight")
                time.sleep(pause * 1.5)  # Slightly longer wait for final attempt
                
                final_cards = page.locator("li.scaffold-layout__list-item div.job-card-container")
                final_count = final_cards.count()
                
                if final_count > count:
                    print(f"   ✨ Final scroll loaded {final_count - count} more jobs!")
                    prev_count = final_count
                else:
                    print(f"✅ Scrolling complete. Total jobs: {prev_count}")
                    break
            except:
                print(f"✅ Scrolling complete. Total jobs: {prev_count}")
                break

    return prev_count

def check_pagination_available(page):
    """Check if there are more pages available"""
    try:
        # Method 1: Check for "Next" button
        next_button = page.query_selector("button[aria-label='View next page']")
        if next_button and not next_button.is_disabled():
            return True
        
        # Method 2: Check pagination numbers
        pagination = page.query_selector("div.artdeco-pagination")
        if pagination:
            # Look for page numbers higher than current
            page_buttons = pagination.query_selector_all("button[aria-label*='Page']")
            if len(page_buttons) > 1:  # More than just current page
                return True
        
        # Method 3: Check if we have reached the end by looking at results
        no_results = page.query_selector("div.jobs-search-no-results-banner")
        if no_results:
            return False
            
        return False
    except Exception as e:
        print(f"   ⚠️ Error checking pagination: {e}")
        return False

def get_total_job_count(page):

    try:
        # LinkedIn shows "X jobs" or "X,XXX jobs" in the header
        results_text = page.query_selector("div.jobs-search-results-list__title-heading")
        if results_text:
            text = results_text.text_content().strip()

            match = re.search(r'([\d,]+)', text)
            if match:
                count_str = match.group(1).replace(',', '')
                return int(count_str)
        return None
    except:
        return None

def extract_job_info(page):
    human_wait(2,4)
    job_info = {}

    try:
        page.wait_for_selector("div.jobs-search__job-details--container", timeout=10000)
    except:
        print("   ❌ Job details panel not loaded")
        return job_info
    try:
        company_name_class = page.query_selector("div.job-details-jobs-unified-top-card__company-name a")
        if company_name_class:
            company_name = company_name_class.text_content().strip()
            company_page_link = company_name_class.get_attribute("href")
        else:
            company_name = ""
            company_page_link = ""
        
        job_info["company_name"] = company_name
        job_info["company_page_link"] = company_page_link
    except:
        job_info["company_name"] = ""
        job_info["company_page_link"] = ""
    
    try:
        company_logo_class = page.query_selector('a[aria-label$="logo"] img[alt$="logo"]')
        if company_logo_class:
            company_logo = company_logo_class.get_attribute("src")
        else:
            company_logo = ""
        job_info["company_logo"] = company_logo
    except:
        job_info["company_logo"] = ""
    
    try:
        job_title_class = page.query_selector("div.job-details-jobs-unified-top-card__job-title a")
        if job_title_class:
            job_title = job_title_class.text_content().strip()
            job_link = job_title_class.get_attribute("href")
            if job_link and job_link.startswith("/"):
                job_link = "https://www.linkedin.com" + job_link
        else:
            job_title = ""
            job_link = ""
        
        job_info["job_title"] = job_title
        job_info["job_link"] = job_link
    except:
        job_info["job_title"] = ""
        job_info["job_link"] = ""
    
    try:
        container = page.query_selector("div.job-details-jobs-unified-top-card__primary-description-container")
        
        job_info["job_location"] = ""
        job_info["posted_date"] = ""
        job_info["applicants"] = ""
        job_info["job_priority"] = "Low"
        job_info["application_status"] = ""

        if container:
            spans = container.query_selector_all("span.tvm__text")
            
            if len(spans) == 0:
                raw_text = container.text_content().strip()
            
            for i, span in enumerate(spans, 1):
                text = span.text_content().strip()
                
                # Skip empty or separator text
                if not text or text == "·":
                    print(f"[{i}] Skipped: '{text}' (separator or empty)")
                    continue
                low = text.lower()
                
                # Applicants (check first as it's most specific)
                if not job_info["applicants"] and ("applicant" in low or "clicked apply" in low):
                    # Remove "Promoted" if in same text
                    if "promoted" in low:
                        job_info["applicants"] = text.split("Promoted")[0].strip()
                        job_info["job_priority"] = "High"
                    else:
                        job_info["applicants"] = text
                    continue
                
                # Promotion (standalone)
                if "promoted" in low and job_info["job_priority"] == "Low":
                    job_info["job_priority"] = "High"
                    continue
                
                # Application status
                if not job_info["application_status"]:
                    if ("response" in low or "reviewing" in low or "company review" in low):
                        job_info["application_status"] = text
                        continue

                # Generic fallback: catch any green positive text
                if not job_info["application_status"]:
                    span_class = span.get_attribute("class") or ""
                    if "tvm__text--text-positive" in span_class:
                        job_info["application_status"] = text
                        continue
                
                # Posted date
                if not job_info["posted_date"] and any(w in low for w in ["ago", "minute", "hour", "day", "week", "month"]):
                    job_info["posted_date"] = text
                    continue
                
                # Location (fallback - whatever is left)
                if not job_info["job_location"]:
                    job_info["job_location"] = text
                else:
                    print(f"    ⚠️ Unmatched text: '{text}'")
            
            # Extract company review time (green text - separate element)
            review_container = page.query_selector("span.job-details-jobs-unified-top-card__company-review-text")
            if review_container:
                review_text = review_container.text_content().strip()
                if review_text:
                    job_info["application_status"] = review_text
            
        else:
            print("❌ ERROR: Container not found!")

    except Exception as e:
        print(f"\n❌ EXCEPTION CAUGHT: {e}")
        import traceback
        traceback.print_exc()
        
        job_info["job_location"] = ""
        job_info["posted_date"] = ""
        job_info["applicants"] = ""
        job_info["job_priority"] = "Low"
        job_info["application_status"] = ""

    try:
        job_detail_class = page.query_selector_all("div.job-details-fit-level-preferences strong")

        job_info["salary"] = ""
        job_info["job_working_des"] = ""
        job_info["job_type"] = ""

        value = []
        if job_detail_class:
            for element in job_detail_class:
                raw_text = element.text_content()
                if raw_text:
                    cleaned = raw_text.strip()
                    if cleaned:
                        value.append(cleaned)
            if len(value) == 1:
                job_info["job_type"] = value[0]
            
            elif len(value) == 3 :
                job_info["salary"] = value[0]
                job_info["job_type"] = value[1]
                job_info["job_working_des"] = value[2]
            else:
                job_info["job_working_des"] = value[0]
                job_info["job_type"] = value[1]
        else:
            job_info["salary"] = ""
            job_info["job_type"] = ""
            job_info["job_working_des"] = ""
    except Exception as e:
        print(f"⚠️ Error extracting job details: {e}")
        job_info["salary"] = ""
        job_info["job_working_des"] = ""
        job_info["job_type"] = ""


    try:
        company_official_detail_class = page.query_selector("div.t-14.mt5")
        if company_official_detail_class:
            company_sector = company_official_detail_class.text_content().strip()
        else:
            company_sector = ""

        job_info["company_sector"] = company_sector
    except:
        job_info["company_sector"] = ""
    

    try:
        company_employee_detail = page.query_selector_all("div.t-14.mt5 span")
        if len(company_employee_detail) == 1:
            # Only total employees available
            company_total_employee_text = company_employee_detail[0].text_content().strip()

            if not company_total_employee_text:
                pseudo_data = page.evaluate("""
                    () => {
                        const span = document.querySelector('div.t-14.mt5 span');
                        return span ? window.getComputedStyle(span, '::before').content.replace(/['"]/g, '') : '';
                    }
                """)
                company_total_employee = pseudo_data
            else:
                company_total_employee = company_total_employee_text

            job_info["company_total_employee"] = company_total_employee
            job_info["company_employee_on_linkedin"] = ""
            
            print(f"   👥 Total employees: '{company_total_employee}' (LinkedIn count not shown)")
            
        elif len(company_employee_detail) == 2:
            # Both total employees and LinkedIn employees available
            company_total_employee = company_employee_detail[0].text_content().strip()
            company_employee_on_linkedin = company_employee_detail[1].text_content().strip()
            if not company_total_employee:
                company_total_employee = page.evaluate("""
                    () => {
                        const span = document.querySelector('div.t-14.mt5 span');
                        return span ? window.getComputedStyle(span, '::before').content.replace(/['"]/g, '') : '';
                    }
                """)
                
            job_info["company_total_employee"] = company_total_employee
            job_info["company_employee_on_linkedin"] = company_employee_on_linkedin
            
            print(f"   👥 Total employees: '{company_total_employee}'")
            print(f"   📊 On LinkedIn: '{company_employee_on_linkedin}'")
            
        else:
            print("   ❌ No employee data spans found")
            job_info["company_total_employee"] = ""
            job_info["company_employee_on_linkedin"] = ""

    except Exception as e:
        print(f"   ❌ Error extracting employee data: {e}")
        job_info["company_total_employee"] = ""
        job_info["company_employee_on_linkedin"] = ""

    try:
        jd_class = page.query_selector("div.jobs-box__html-content#job-details")
        if jd_class:
            # Get inner HTML to preserve structure
            jd_html = jd_class.inner_html()
            # Or get clean text content
            jd = jd_class.text_content().strip()
            
            # Remove extra whitespace and clean up
            import re
            jd = re.sub(r'\s+', ' ', jd)  # Replace multiple spaces/newlines with single space
            jd = re.sub(r'\n\s*\n', '\n', jd)  # Remove multiple blank lines
            jd = jd.strip()
        else:
            jd = ""
        
        job_info["jd"] = jd
        print(f"✓ Job Description: {len(jd)} characters extracted")
        print(f"Preview: {jd[:200]}...")  # Show first 200 chars
        
    except Exception as e:
        print(f"✗ Error extracting job description: {e}")
        job_info["jd"] = ""

    # Apply URL — handles both Easy Apply and external company apply links.
    job_info["apply_url"] = extract_apply_url(page)

    return job_info


def extract_apply_url(page) -> str:
    """Return the best apply URL available on the current job detail panel.

    LinkedIn exposes two flavours of apply button:
    • Easy Apply  — the href already points to the LinkedIn apply flow, so
                    we use it as-is.
    • External    — the href is LinkedIn's safety redirect:
                    https://www.linkedin.com/safety/go/?url=<encoded-url>&…
                    We extract and URL-decode the `url` query parameter to
                    give the actual company careers page.

    Returns an empty string when neither button is found.
    """
    try:
        # ── 1. Easy Apply ──────────────────────────────────────────────────
        # aria-label is the most stable selector across LinkedIn redesigns.
        easy_apply_btn = page.query_selector("a[aria-label='Easy Apply to this job']")
        if easy_apply_btn:
            href = easy_apply_btn.get_attribute("href") or ""
            if href:
                # Make absolute if LinkedIn returns a relative path.
                if href.startswith("/"):
                    href = "https://www.linkedin.com" + href
                print(f"   🔗 Easy Apply URL found")
                return href

        # ── 2. External / company website apply ────────────────────────────
        external_apply_btn = page.query_selector("a[aria-label='Apply on company website']")
        if external_apply_btn:
            href = external_apply_btn.get_attribute("href") or ""
            if href:
                # LinkedIn wraps the real URL in a safety redirect:
                # https://www.linkedin.com/safety/go/?url=<percent-encoded>&…
                # Parse the `url` query param and decode it.
                parsed = urlparse(href)
                qs = parse_qs(parsed.query)
                if "url" in qs:
                    decoded = unquote(qs["url"][0])
                    print(f"   🔗 External apply URL decoded: {decoded[:80]}…")
                    return decoded
                # Fallback: the href itself is already a direct URL.
                print(f"   🔗 External apply URL (raw): {href[:80]}…")
                return href

        print("   ⚠️ No apply button found")
        return ""

    except Exception as e:
        print(f"   ❌ Error extracting apply URL: {e}")
        return ""

def process_single_page(page, page_num, all_rows, domain_name):
    """Process all jobs on a single page"""
    print(f"\n🔍 Processing Page {page_num}...")
    
    # Wait for page to load
    time.sleep(0.5)
    
    # Check if we have reached a page with no jobs
    try:
        page.wait_for_selector("li.scaffold-layout__list-item", timeout=15000)
    except:
        print(f"   ❌ No jobs found on page {page_num}")
        return 0
    
    # Get total job count (only on first page)
    if page_num == 1:
        total_jobs = get_total_job_count(page)
        if total_jobs:
            print(f"   📊 Total jobs available: {total_jobs:,}")
    
    # Scroll to load all jobs on this page
    jobs_on_page = scroll_page(page, pause=2, max_scroll=15)
    
    if jobs_on_page == 0:
        print(f"   ⚠️ No jobs loaded on page {page_num}")
        return 0
    
    # Get all job cards
    cards = page.query_selector_all("li.scaffold-layout__list-item div.job-card-container")
    print(f"   📋 Found {len(cards)} job cards on page {page_num}")
    
    page_jobs_processed = 0
    
    # Process each job on this page
    for i, card in enumerate(cards):
        job_number = len(all_rows) + 1
        print(f"\n   📋 Processing job {job_number} (Page {page_num}, Card {i+1}/{len(cards)})...")

        if click_job_card(page, i):
            print(f"      ✅ Clicked job card {i+1}")
            human_wait(1,2)
            job_data = extract_job_info(page)
            
            if job_data.get('job_title'):  # Only add if we got valid data
                job_data['domain'] = domain_name
                job_data['scrapped_at'] = time.strftime("%Y-%m-%d")
                all_rows.append(job_data)
                page_jobs_processed += 1
                print(f"      📊 ✅ Job data extracted successfully")
            else:
                print(f"      ❌ Failed to extract job data")
        else:
            print(f"      ❌ Failed to click job card {i+1}")
            continue
    
    print(f"   ✅ Page {page_num} complete: {page_jobs_processed}/{len(cards)} jobs processed")
    return page_jobs_processed

def login_with_credentials(page):
    """Fill LinkedIn's login form from LINKEDIN_USERNAME/LINKEDIN_PASSWORD
    and submit, then wait for the post-login redirect (feed/checkpoint).

    Selectors: dumping every `<input>` on the live page (with this
    project's actual UA/viewport) showed LinkedIn renders *two* stacked
    copies of the login form — one `display:none`/hidden (React
    `useId()` ids, e.g. id="«Refvtkejj...»") and one visible (different
    `useId()` ids, e.g. id="«Refvukejj...»") — both matching
    `input[type='email']`/`input[type='password']`. Neither pair has a
    verbatim-stable id (they're regenerated per render), and plain
    `.first` was grabbing the hidden copy, which is what made every prior
    attempt time out waiting for visibility. Filtering on Playwright's
    `:visible` pseudo-class picks whichever copy is actually shown,
    regardless of which one LinkedIn puts first in the DOM.
    """
    if not LINKEDIN_USERNAME or not LINKEDIN_PASSWORD:
        raise RuntimeError(
            "LINKEDIN_USERNAME / LINKEDIN_PASSWORD not set in the environment (.env)"
        )

    page.goto("https://www.linkedin.com/login", wait_until="domcontentloaded", timeout=30000)

    email_input = page.locator("input[type='email']:visible").first
    password_input = page.locator("input[type='password']:visible").first
    email_input.wait_for(state="visible", timeout=30000)

    email_input.click()
    email_input.fill(LINKEDIN_USERNAME)
    human_wait(0.5, 1.2)

    password_input.click()
    password_input.fill(LINKEDIN_PASSWORD)
    human_wait(0.5, 1.2)

    # exact=False here would also match "Sign in with Microsoft/Apple" and
    # a blank role="button" SSO widget (Google one-tap) that all precede
    # the real submit button in DOM order — .first grabbed that empty one
    # and silently no-opped instead of submitting the form. exact=True
    # isolates the actual "Sign in" button.
    page.get_by_role("button", name="Sign in", exact=True).click()

    try:
        page.wait_for_url(lambda url: "checkpoint" in url or "/feed" in url, timeout=20000)
    except Exception:
        pass

    if "checkpoint" in page.url:
        # LinkedIn puts fresh/automated logins through a security checkpoint
        # (CAPTCHA, "verify it's you", 2FA) far more readily from datacenter
        # IPs like CI runners than from a residential IP. There's no form
        # fill that gets past this — surface it clearly instead of silently
        # scraping the checkpoint page and returning nothing.
        dump_debug_snapshot(page, "linkedin", "login_checkpoint")
        raise RuntimeError(
            f"LinkedIn showed a login checkpoint instead of the feed ({page.url}). "
            "This is usually LinkedIn challenging the login as suspicious "
            "(new IP, automation, etc.) and can't be scripted past."
        )

    if "checkpoint" in page.url:
        input("🔐 LinkedIn is asking for extra verification — complete it in the "
              "browser window, then press Enter here...")

    if "/login" in page.url:
        raise RuntimeError("LinkedIn login failed — check LINKEDIN_USERNAME/LINKEDIN_PASSWORD")

    print("✅ Logged in with credentials")


def main():

    # OUTPUT_DIRECTORY = r"C:\Users\gis28\.webscrap\dags\output"
    OUTPUT_DIRECTORY = r"C:\Users\gis28\Downloads\Me\Job Portal\BE\scrapers\linkedin\data"

    os.makedirs(OUTPUT_DIRECTORY, exist_ok=True)

    state_file_path = STATE_FILE
    output_csv_path = os.path.join(OUTPUT_DIRECTORY, OUTPUT_CSV)

    print(f"📂 Output directory: {OUTPUT_DIRECTORY}")
    print(f"💾 State file: {state_file_path}")
    print(f"📄 CSV output: {output_csv_path}")

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False, args=[
        '--disable-blink-features=AutomationControlled'
        ]
    )
        if os.path.exists(state_file_path): 
            print("✅ Found saved login state, loading...")
            context = browser.new_context(storage_state=state_file_path)
            page = context.new_page()
        else:
            context = browser.new_context(
                user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                viewport={"width": 1200, "height": 850},
                java_script_enabled=True,
                ignore_https_errors=True,
                bypass_csp=True,
                )
            page = context.new_page()
            login_with_credentials(page)
            context.storage_state(path=state_file_path)  # Save cookies + local storage

        # page = context.new_page()

        all_rows = []

        # For each keyword, run normal search then remote-filtered search (1 page each).
        for domain_name, url_key in DOMAINS:
            base_url = SEARCH_URL_TEMP.format(keywords=url_key)

            # ── Append optional location filter ───────────────────────────
            if GEO_ID is not None:
                base_url += f"&geoId={GEO_ID}"
                if DISTANCE is not None:
                    base_url += f"&distance={DISTANCE}"

            # ── Append optional experience-level filter ───────────────────
            if EXPERIENCE_LEVELS is not None:
                base_url += f"&f_E={EXPERIENCE_LEVELS}"

            scrape_runs = [
                (False, base_url),                       # Normal jobs
                (True,  base_url + REMOTE_FILTER),       # Remote jobs only
            ]

            for is_remote_run, search_url in scrape_runs:
                run_label = "remote" if is_remote_run else "non-remote"
                print(f"\n{'='*60}")
                print(f"🚀 [{domain_name}] {run_label} — scraping {MAX_PAGES} page(s)")
                print(f"   🔗 {search_url}")
                print(f"{'='*60}")

                current_page = 1
                while current_page <= MAX_PAGES:
                    page_url = get_page_url(search_url, current_page)
                    print(f"\n📄 Navigating to page {current_page}...")
                    print(f"   🔗 URL: {page_url}")

                    try:
                        page.goto(page_url, timeout=60000, wait_until="domcontentloaded")
                    except Exception as e:
                        print(f"   ❌ Navigation to page {current_page} failed: {e}")
                        break

                    try:
                        page.wait_for_selector(
                            "li.scaffold-layout__list-item, div.jobs-search-no-results-banner",
                            timeout=15000,
                        )
                        no_results = page.query_selector("div.jobs-search-no-results-banner")
                        if no_results:
                            print(f"   ℹ️ No jobs available for [{domain_name}] {run_label} (page {current_page})")
                            break
                    except Exception:
                        print(f"   ⚠️ Page {current_page} failed to load properly")
                        break

                    before_count = len(all_rows)
                    jobs_processed = process_single_page(page, current_page, all_rows, domain_name)

                    # Mark is_remote on newly added rows:
                    #   - DOM detection (detect_is_remote) already ran per-job inside extract_job_info.
                    #   - URL flag acts as fallback guarantee for the remote batch.
                    if is_remote_run:
                        for row in all_rows[before_count:]:
                            row["is_remote"] = True

                    if jobs_processed == 0:
                        print(f"   ⚠️ No jobs processed on page {current_page}, stopping...")
                        break

                    if current_page < MAX_PAGES:
                        if not check_pagination_available(page):
                            print(f"   ℹ️ No more pages after page {current_page}")
                            break

                    current_page += 1
                    human_wait(1, 2)

                human_wait(2, 4)  # pause between normal→remote switch

        # Save all collected data
        if all_rows:
            fieldnames = [
                "company_name", "company_page_link", "company_logo", "job_title", "job_link",
                "apply_url",
                "job_location", "posted_date", "applicants", "job_priority", "application_status",
                "salary", "job_type", "job_working_des", "company_sector", "company_total_employee",
                "company_employee_on_linkedin", "jd", "is_remote", "scrapped_at", "domain",
            ]

            with open(output_csv_path, "w", newline="", encoding="utf-8") as f:
                writer = csv.DictWriter(f, fieldnames=fieldnames, extrasaction="ignore")
                writer.writeheader()
                writer.writerows(all_rows)

            print(f"\n🎉 Scraping completed!")
            print(f"   📊 Total jobs scraped: {len(all_rows)}")
            print(f"   💾 Data saved to: {output_csv_path}")
        else:
            print("\n⚠️ No jobs were scraped!")

        context.close()
        browser.close()

if __name__ == "__main__":  
    main()



