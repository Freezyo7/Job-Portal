import requests
import os
from dotenv import load_dotenv

#load the env file
load_dotenv()


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
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36",
            "Accept-Language": "en-US,en;q=0.9"
        })

    def get_homepage(self):
        try:
            resp = self.session.get(
                self.BASE_URL,
                timeout=10
            )
            resp.raise_for_status()
            print(f"[✓] Homepage fetched | Status: {resp.status_code}")
            print(f"    Cookies: {dict(self.session.cookies)}")
            return True

        except requests.RequestException as e:
            print(f"[✗] Homepage request failed: {e}")
            return False

    def login(self):
        if not self.username or not self.password:
            raise ValueError("USERNAME and PASSWORD must be set in environment variables")

        headers = {
            "Content-Type": "application/json",
            "Clientid": "d3skt0p",
            "Origin": self.BASE_URL,
            "Referer": f"{self.BASE_URL}/",
            "Appid": "103",
            "Systemid": "jobseeker"
        }

        payload = {
            "username": self.username,
            "password": self.password,
        }

        try:
            resp = self.session.post(
                self.LOGIN_URL,
                json=payload,
                headers=headers,
                timeout=10
            )
            print(f"\n[→] Login attempt | Status: {resp.status_code}")

            if resp.status_code == 200:
                data = resp.json()
                print("[✓] Login successful!")
                print(f"    Response keys: {list(data.keys())}")
                print(f"    Auth cookie set: {'nauk_at' in self.session.cookies}")
                return data
            else:
                print(f"[✗] Login failed | Response: {resp.text[:300]}")
                return False

        except requests.RequestException as e:
            print(f"[✗] Login request failed: {e}")
            return False

    def _extract_token(self, data):
        """Pull the bearer token out of the login response.

        Naukri returns it as the `nauk_at` cookie; the frontend copies that
        same value into the Authorization header. Falls back to the session
        jar, which requests populated from Set-Cookie.
        """
        for c in data.get("cookies", []):
            if c.get("name") == "nauk_at":
                return c.get("value")
        return self.session.cookies.get("nauk_at")

    def scrap_job(self, token):

        params = {
            "noOfResults": 20,
            "urlType": "search_by_keyword",
            "searchType": "adv",
            "keyword": "software developer",
            "pageNo": 1,
        }

        # Without the app identity headers the API answers
        # 406 {"message": "recaptcha required"} even with a valid token.
        headers = {
            "authorization": f"Bearer {token}",
            "accept": "application/json",
            "appid": "109",
            "systemid": "Naukri",
            "clientid": "d3skt0p",
            "gid": "LOCATION,INDUSTRY,EDUCATION,FAREA_ROLE",
            "referer": f"{self.BASE_URL}/software-developer-jobs?k=software%20developer",
        }

        try:
            resp = self.session.get(
                f"{self.BASE_URL}/jobapi/v3/search",
                params=params,
                headers=headers,
                timeout=15
            )
            resp.raise_for_status()
            data = resp.json()
            jobs = data.get("jobDetails", [])
            print(f"[ok] Fetched {len(jobs)} jobs (of {data.get('noOfJobs')} total)")
            for job in jobs[:5]:
                print(f"     {job.get('title')} | {job.get('companyName')}")
            return data
        except requests.RequestException as e:
            print(f"[x] Job fetch failed: {e}")
            if e.response is not None:
                print(f"    {e.response.text[:200]}")
            return None

    def run(self) -> None:
        """Run all steps in order."""
        if not self.get_homepage():
            return

        data = self.login()
        if not data:
            return

        token = self._extract_token(data)
        if not token:
            print("[x] Logged in but no nauk_at token found")
            return
        print(f"[ok] Token captured ({len(token)} chars)")

        self.scrap_job(token)


if __name__ == "__main__":

    naukri = NaukriScraper()
    naukri.run()
