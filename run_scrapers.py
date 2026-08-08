from scrapers.indeed.scraper import IndeedScraper
from scrapers.naukri.naukri_scraper import NaukriScraper


if __name__ == "__main__":
    print("Running Naukri scraper...")
    naukri = NaukriScraper()
    for job in naukri.fetch_jobs("python developer")[:5]:
        print(job.title, "|", job.company, "|", job.location, "|", job.url)

    print("\nRunning Indeed scraper...")
    indeed = IndeedScraper(headless=True)
    for job in indeed.fetch_jobs("python developer")[:5]:
        print(job.title, "|", job.company, "|", job.location, "|", job.url)
