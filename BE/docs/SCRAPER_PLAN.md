# Scraper Plan

## Goal
Build 3 scrapers for 3 different job websites, each extracting the same core job fields into one shared model.

## Shared model
Use one Django model for all websites with the same columns:
- title
- company
- location
- url
- source
- created_at

This keeps data consistent and makes reporting easier.

## Suggested folder structure
```text
jobs/
  models.py
  admin.py
  views.py
  management/
    commands/
      run_all_scrapers.py
      run_naukri_scraper.py
      run_indeed_scraper.py
      run_site3_scraper.py

scrapers/
  __init__.py
  common.py
  naukri/
    __init__.py
    scraper.py
  indeed/
    __init__.py
    scraper.py
  site3/
    __init__.py
    scraper.py
```

## Scraper strategy
### 1) Naukri scraper
- Use requests + BeautifulSoup
- Good for simple HTML parsing
- Best for static or lightly dynamic pages

### 2) Indeed scraper
- Use Playwright
- Good for JavaScript-rendered pages
- Use browser automation to wait for job cards to appear

### 3) Third website scraper
- Use Playwright or requests + BeautifulSoup depending on site behavior
- If the page is dynamic, use Playwright
- If the page is mostly static, use requests + BeautifulSoup

## Recommended workflow
1. Create one shared job model in Django.
2. Create one scraper class per website.
3. Each scraper returns a list of normalized job dictionaries.
4. A single save function inserts them into the database.
5. Run all scrapers from one management command or run each separately.

## Daily execution plan
### Option A: One command to run all
Use one command that calls all scrapers sequentially.

Example:
```bash
python manage.py run_all_scrapers
```

### Option B: Separate commands for each scraper
Use separate commands:
```bash
python manage.py run_naukri_scraper
python manage.py run_indeed_scraper
python manage.py run_site3_scraper
```

## Best approach for automation
For daily runs, I recommend:
- one command to run all scrapers together for convenience
- separate commands if you want more control and easier debugging

A good production setup is:
- daily cron/job that runs the combined command
- individual commands available for manual testing

## Suggested command design
- Combined command:
  - run_all_scrapers.py
- Individual commands:
  - run_naukri_scraper.py
  - run_indeed_scraper.py
  - run_site3_scraper.py

## Notes
- Keep all scrapers outputting the same fields.
- Use one save function so the database logic stays consistent.
- Add retry logic and logging later.
- Use a delay between requests to avoid getting blocked.
