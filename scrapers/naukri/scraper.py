import requests
import os
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

class NaukriScraper:
    BASE_URL = "https://www.naukri.com" 
    LOGIN_URL = "https://www.naukri.com/central-login-services/v1/login"
    DOMAIN = {"Software Developer": "software%20developer",
              "Graduate Engineer": "graduate%20engineer",
              "Cyber Security": "cyber%20security"}

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
        self._page = None
    

    def scrap_job(self,keyword="software developer", page_no=1):

        params = {
            "noOfResults": 20,
            "urlType": "search_by_keyword",
            "searchType": "adv",
            "keyword": keyword,
            "k": keyword,
            "pageNo": page_no,
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
        qs = "&".join(f"{k}={quote(str(v))}" for k, v in params.items())
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


    def run(self, keyword="software developer"):
        if not self.bootstrap(keyword):
            return None
        try:
            data = self.scrap_job(keyword)
            if data:
                jobs = data.get("jobDetails", [])
                print(f"[ok] {len(jobs)} jobs of {data.get('noOfJobs')} total")
                for j in jobs[:5]:
                    print(f"     {j.get('title')} | {j.get('companyName')}")
            return data
        finally:
            self._teardown()


if __name__ == "__main__":

    naukri = NaukriScraper()
    naukri.run()
