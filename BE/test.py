"""Can curl_cffi's TLS impersonation get past Naukri's 406?

Naukri answers `406 {"message": "recaptcha required"}` to plain `requests`
even with a valid bearer token and a browser-minted nkparam. Two possible
causes:

  (a) the nkparam is bound to the exact request that minted it, or
  (b) Akamai is fingerprinting the TLS/HTTP2 handshake, which `requests`
      cannot fake but curl_cffi can.

If (b), impersonating Chrome should make both the search and the detail
endpoint work from plain HTTP — no browser needed per request.

Run:  py test.py
"""

import json
import sys

from curl_cffi import requests as cffi

sys.path.insert(0, r"c:\Users\gis28\Downloads\Me\jobs")
from scrapers.naukri import NaukriScraper  # noqa: E402

SEARCH = "https://www.naukri.com/jobapi/v3/search"
DETAIL = "https://www.naukri.com/jobapi/v4/job/{jid}"

# Chrome builds curl_cffi knows how to impersonate.
PROFILES = ["chrome124", "chrome123", "chrome120", "chrome116", "chrome110"]


def search_headers(scraper, keyword):
    seo = f"{keyword.replace(' ', '-')}-jobs"
    return {
        "accept": "application/json",
        "appid": "109",
        "systemid": "Naukri",
        "clientid": "d3skt0p",
        "gid": "LOCATION,INDUSTRY,EDUCATION,FAREA_ROLE",
        "nkparam": scraper.nkparam or "",
        "authorization": scraper.session.headers.get("authorization", ""),
        "referer": f"https://www.naukri.com/{seo}?k={keyword.replace(' ', '%20')}",
    }


def detail_headers(scraper, jd_url):
    return {
        "accept": "application/json",
        "appid": "121",
        "systemid": "121",
        "clientid": "d3skt0p",
        "nkparam": scraper.nkparam or "",
        "authorization": scraper.session.headers.get("authorization", ""),
        "referer": "https://www.naukri.com" + jd_url,
    }


def cold_start(keyword="data engineering"):
    """Can curl_cffi work with NO browser at all?

    If impersonation alone is enough, Playwright can be dropped from the
    Naukri scraper entirely. Tests three levels of prep:
      1. nothing  — straight to the API
      2. warm     — GET the search page first, to pick up Akamai cookies
      3. no auth  — warm, but without a bearer token
    """
    seo = f"{keyword.replace(' ', '-')}-jobs"
    params = {
        "noOfResults": 20, "urlType": "search_by_keyword", "searchType": "adv",
        "keyword": keyword, "k": keyword, "pageNo": 1,
        "seoKey": seo, "src": "jobsearchDesk",
    }
    headers = {
        "accept": "application/json",
        "appid": "109",
        "systemid": "Naukri",
        "clientid": "d3skt0p",
        "gid": "LOCATION,INDUSTRY,EDUCATION,FAREA_ROLE",
        "referer": f"https://www.naukri.com/{seo}?k={keyword.replace(' ', '%20')}",
    }

    print("=" * 64)
    print("COLD START — no browser, no nkparam, no cookies")
    print("=" * 64)

    for label, warm in (("straight to API", False), ("warm page first", True)):
        for prof in ("chrome124", "chrome116"):
            try:
                sess = cffi.Session(impersonate=prof)
                if warm:
                    w = sess.get(f"https://www.naukri.com/{seo}", timeout=25)
                    got = len(sess.cookies)
                    label2 = f"{label} (page {w.status_code}, {got} cookies)"
                else:
                    label2 = label
                r = sess.get(SEARCH, params=params, headers=headers, timeout=25)
                note = ""
                if r.status_code == 200:
                    body = r.json()
                    note = (f"{len(body.get('jobDetails') or [])} jobs "
                            f"of {body.get('noOfJobs')}")
                print(f"  {prof:11} {label2:44} -> {r.status_code} {note or r.text[:50]}")
            except Exception as e:
                print(f"  {prof:11} {label:44} -> ERROR {type(e).__name__}")


def main():
    keyword = "data engineering"
    scraper = NaukriScraper()

    # Borrow a live session: cookies + a fresh nkparam from the browser.
    print("Bootstrapping a browser session for cookies + nkparam...")
    if not scraper.bootstrap(keyword):
        print("[x] bootstrap failed")
        return

    try:
        cookies = {c.name: c.value for c in scraper.session.cookies}
        print(f"[ok] {len(cookies)} cookies, nkparam {len(scraper.nkparam or '')} chars\n")

        # A known-good jobId to test the detail endpoint against.
        data = scraper.scrap_job(keyword, 1)
        cards = (data or {}).get("jobDetails") or []
        if not cards:
            print("[x] no cards from search; cannot test detail")
            return
        jid = cards[0]["jobId"]
        jd_url = cards[0]["jdURL"]
        print(f"test job: {cards[0].get('title')} ({jid})\n")

        params = {
            "noOfResults": 20, "urlType": "search_by_keyword", "searchType": "adv",
            "keyword": keyword, "k": keyword, "pageNo": 1,
            "seoKey": f"{keyword.replace(' ', '-')}-jobs", "src": "jobsearchDesk",
        }

        print("=" * 64)
        print("SEARCH endpoint (/jobapi/v3/search)")
        print("=" * 64)
        for prof in PROFILES:
            try:
                r = cffi.get(SEARCH, params=params, headers=search_headers(scraper, keyword),
                             cookies=cookies, impersonate=prof, timeout=25)
                note = ""
                if r.status_code == 200:
                    try:
                        note = f"{len(r.json().get('jobDetails') or [])} jobs"
                    except Exception:
                        note = "unparseable"
                print(f"  {prof:12} {r.status_code} {note} {r.text[:70]}")
            except Exception as e:
                print(f"  {prof:12} ERROR {type(e).__name__}: {e}")

        print()
        print("=" * 64)
        print("DETAIL endpoint (/jobapi/v4/job/{id}) — the one requests can't reach")
        print("=" * 64)
        for prof in PROFILES:
            try:
                r = cffi.get(DETAIL.format(jid=jid),
                             params={"microsite": "y", "brandedConsultantJd": "true"},
                             headers=detail_headers(scraper, jd_url),
                             cookies=cookies, impersonate=prof, timeout=25)
                note = ""
                if r.status_code == 200:
                    j = r.json().get("jobDetails") or {}
                    note = (f"industry={j.get('industry')!r} "
                            f"employmentType={j.get('employmentType')!r} "
                            f"applyCount={j.get('applyCount')!r}")
                print(f"  {prof:12} {r.status_code} {note or r.text[:70]}")
            except Exception as e:
                print(f"  {prof:12} ERROR {type(e).__name__}: {e}")

        # Control: plain requests, same cookies and nkparam.
        print()
        print("=" * 64)
        print("CONTROL — plain requests (expected 406 on both)")
        print("=" * 64)
        import requests as plain
        r = plain.get(SEARCH, params=params, headers=search_headers(scraper, keyword),
                      cookies=cookies, timeout=25)
        print(f"  search  {r.status_code} {r.text[:70]}")
        r = plain.get(DETAIL.format(jid=jid),
                      params={"microsite": "y", "brandedConsultantJd": "true"},
                      headers=detail_headers(scraper, jd_url), cookies=cookies, timeout=25)
        print(f"  detail  {r.status_code} {r.text[:70]}")

    finally:
        scraper._teardown()


if __name__ == "__main__":
    main()
