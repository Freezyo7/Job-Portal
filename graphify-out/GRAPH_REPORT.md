# Graph Report - BE  (2026-08-25)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 751 nodes · 1394 edges · 59 communities (35 shown, 24 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 69 edges (avg confidence: 0.95)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `3a5c12a5`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- .sign_in
- profile_views.py
- Job
- ResumeParserTests
- .sign_in
- Application
- NaukriScraper
- AuthFlowTests
- FounditScraper
- JobAPITests
- IndeedScraper
- UnstopScraper
- settings_views.py
- clean_html
- UnstopOpenStatusTests
- linkedin_scraper.py
- accounts/views.py
- HiristScraper
- SettingsSerializer
- APIView
- ._parse
- RegisterSerializer
- unstop_scraper.py
- CookieJWTAuthentication
- AccountsConfig
- ApplicationsConfig
- JobsConfig
- main
- ScrapersConfig
- accounts/migrations/0001_initial.py
- 0002_emailverificationcode.py
- 0003_profile_experience_education.py
- 0004_profile_portfolio_alter_profile_first_name_and_more.py
- applications/migrations/0001_initial.py
- 0002_alter_application_job_alter_application_user.py
- 0003_application_contact_email_and_more.py
- asgi.py
- settings.py
- config/urls.py
- wsgi.py
- jobs/migrations/0001_initial.py
- 0002_job_apply_url_job_is_active_alter_job_source.py
- 0003_job_applicant_count_job_company_id_job_company_logo_and_more.py
- 0004_job_description_text.py
- 0005_alter_job_source.py
- 0006_job_is_remote.py
- jobs

## God Nodes (most connected - your core abstractions)
1. `AuthFlowTests` - 39 edges
2. `ProfileTests` - 37 edges
3. `ResumeUploadTests` - 32 edges
4. `JobAPITests` - 32 edges
5. `make_job()` - 25 edges
6. `Job` - 21 edges
7. `NaukriScraper` - 21 edges
8. `ResumeParserTests` - 19 edges
9. `SettingsFlowTests` - 18 edges
10. `Profile` - 17 edges

## Surprising Connections (you probably didn't know these)
- `ProfileTests` --uses--> `Education`  [INFERRED]
  accounts/tests.py → accounts/models.py
- `ProfileTests` --uses--> `Experience`  [INFERRED]
  accounts/tests.py → accounts/models.py
- `ProfileTests` --uses--> `Profile`  [INFERRED]
  accounts/tests.py → accounts/models.py
- `ResumeUploadTests` --uses--> `Profile`  [INFERRED]
  accounts/tests.py → accounts/models.py
- `EducationInline` --uses--> `Education`  [INFERRED]
  accounts/admin.py → accounts/models.py

## Import Cycles
- None detected.

## Communities (59 total, 24 thin omitted)

### Community 0 - ".sign_in"
Cohesion: 0.06
Nodes (6): ProfileTests, Profile, experience, education, and skills endpoints. Every route is per-user:…, Register and verify a user; leaves auth cookies on the client., The upload and download endpoints, with Groq mocked., ResumeUploadTests, SettingsFlowTests

### Community 1 - "profile_views.py"
Cohesion: 0.06
Nodes (47): AbstractUser, EducationInline, EmailVerificationCodeAdmin, ExperienceInline, ProfileAdmin, register, UserAdmin, send_verification_code() (+39 more)

### Community 2 - "Job"
Cohesion: 0.05
Nodes (41): action, BaseCommand, JobAdmin, register, JobFilter, Meta, Lookup SQL meaning Use case (none) = exact match source=naukri — must match a…, Command (+33 more)

### Community 3 - "ResumeParserTests"
Cohesion: 0.07
Nodes (26): _call_groq(), _clean_entries(), _collapse_glyph_spacing(), extract_text(), _is_glyph_spaced(), parse_resume(), Read the text out of an uploaded PDF. `file` is any Django UploadedFile. Raises…, Send resume text to Groq and return the parsed JSON object. (+18 more)

### Community 4 - ".sign_in"
Cohesion: 0.11
Nodes (10): ActivityEndpointTests, ApplicationDetailTests, ApplicationListTests, ApplicationsAPITestCase, ApplyEndpointTests, make_job(), override_settings, Tests for the apply flow, ownership, and the dashboard/calendar queries. (+2 more)

### Community 5 - "Application"
Cohesion: 0.09
Nodes (21): Application, Meta, A job the user confirmed they applied to. Rows are only created once the user…, ApplicationJobSerializer, ApplicationSerializer, ApplySerializer, Meta, UpdateApplicationSerializer (+13 more)

### Community 6 - "NaukriScraper"
Cohesion: 0.08
Nodes (20): NaukriJob, NaukriScraper, datetime, Read the auth cookies rather than DOM selectors: the profile widget only…, One listing, normalized to the fields `jobs.models.Job` stores., Map one search-result card onto the fields we keep., Translate city names to Naukri's numeric gids. Accepts names or raw gids. An…, Pull a labelled value out of the card's `placeholders` list. (+12 more)

### Community 8 - "FounditScraper"
Cohesion: 0.10
Nodes (17): FounditJob, FounditScraper, datetime, Foundit (ex-Monster India) job scraper. Foundit's search endpoint returns…, Verify the MSSOAT token rather than logging in. MSSOAT is base64 of…, Pull the JWT payload out of the MSSOAT cookie., Map one search-result card onto the fields we keep., Take the first entry of a list-valued field. (+9 more)

### Community 9 - "JobAPITests"
Cohesion: 0.09
Nodes (3): JobAPITests, TestCase, Job endpoints require login, so every test authenticates first.

### Community 10 - "IndeedScraper"
Cohesion: 0.12
Nodes (13): IndeedJob, IndeedScraper, One listing, normalized to the fields `jobs.models.Job` stores., Keyword args for Job.objects.update_or_create()., Restore the saved session, or prompt for one manual login. Indeed is Google-…, `CTK` is set even for anonymous visitors, so it's a false positive for "logged…, Load one search-results page and open every card's detail pane. Mirrors…, Click one card's title and read the detail pane it opens. Falls back to a… (+5 more)

### Community 11 - "UnstopScraper"
Cohesion: 0.14
Nodes (9): datetime, Search `keyword` across `pages` pages and return parsed listings., Map one search-result card onto the fields we keep., Normalise pay to an annual figure — some posts quote monthly., Prefer the structured address list; roughly half of listings only populate the…, Dates arrive ISO-8601 with an offset, or as "2026-08-05 19:17:56 GMT+0530"., Scrape every keyword and report what came back., One page of results. `page` is 1-based. (+1 more)

### Community 12 - "settings_views.py"
Cohesion: 0.17
Nodes (8): ChangePasswordSerializer, DeleteAccountSerializer, Requires password confirmation prior to deleting the account., ChangePasswordView, DeleteAccountView, DELETE /api/auth/settings/account/ — verify password and cascade delete account., first_error(), Flatten DRF's {field: [msgs]} into the single string the React app reads from…

### Community 13 - "clean_html"
Cohesion: 0.17
Nodes (11): clean_html(), Helpers shared by every scraper., Sanitize an employer-supplied description for safe rendering. Descriptions are…, Plain-text rendering, for card previews and search indexing., to_text(), HiristJob, Hirist (hirist.tech) job scraper. The simplest of the three sources: both…, Merge the detail response into an already-parsed job. (+3 more)

### Community 14 - "UnstopOpenStatusTests"
Cohesion: 0.20
Nodes (5): ExpireJobsCommandTests, TestCase, Unstop reports status=LIVE on listings that closed months ago, so the end_date…, UnstopOpenStatusTests, Whether applications are actually still accepted. Unstop reports status="LIVE"…

### Community 15 - "linkedin_scraper.py"
Cohesion: 0.23
Nodes (15): check_pagination_available(), click_job_card(), extract_job_info(), get_page_url(), get_total_job_count(), human_wait(), login_with_credentials(), main() (+7 more)

### Community 16 - "accounts/views.py"
Cohesion: 0.24
Nodes (10): LoginSerializer, Input for re-sending a verification email., ResendVerificationSerializer, UserSerializer, LoginView, MeView, POST /api/auth/resend/ — email a fresh code., POST /api/auth/login/ — exchange credentials for auth cookies. (+2 more)

### Community 17 - "HiristScraper"
Cohesion: 0.20
Nodes (7): HiristScraper, Accept a category name or a raw id; reject unknown names loudly., One page of results. `page` is 0-based. Pass `category` to browse a category,…, Per-job enrichment. Adds the description, which search omits., Scrape `pages` pages of a category or keyword, enriching each job., Fill in the fields only the detail endpoint carries., Scrape by keyword, by category, or both. `keywords` uses Hirist's free-text…

### Community 18 - "SettingsSerializer"
Cohesion: 0.24
Nodes (6): Meta, SettingsSerializer, UpdateAccountSerializer, APIView, SettingsOverviewView, UpdateAccountView

### Community 19 - "APIView"
Cohesion: 0.18
Nodes (9): LogoutView, APIView, POST /api/auth/logout/ — clear the auth cookies., POST /api/auth/refresh/ — mint a new access token from the refresh cookie., Attach access + refresh JWTs as httpOnly cookies., POST /api/auth/verify/ — exchange a code for a verified, logged-in session., RefreshView, set_auth_cookies() (+1 more)

### Community 20 - "._parse"
Cohesion: 0.20
Nodes (6): datetime, Map one search-result card onto the fields we keep., Join the location names, deduped, order preserved., Tags, mandatory ones first — they matter more for matching., Coerce to int. Hirist sends 0 for undisclosed salary, but 0 is meaningful for…, `createdTimeMs` is epoch milliseconds.

### Community 21 - "RegisterSerializer"
Cohesion: 0.29
Nodes (4): Meta, RegisterSerializer, POST /api/auth/register/ — create an unverified account., RegisterView

### Community 22 - "unstop_scraper.py"
Cohesion: 0.33
Nodes (4): Unstop (unstop.com) job scraper. A single open endpoint does everything:…, One listing, normalized to the fields `jobs.models.Job` stores., Keyword args for Job.objects.update_or_create()., UnstopJob

### Community 23 - "CookieJWTAuthentication"
Cohesion: 0.33
Nodes (3): CookieJWTAuthentication, Reads the JWT from an httpOnly cookie instead of the Authorization header. The…, JWTAuthentication

## Knowledge Gaps
- **19 isolated node(s):** `Migration`, `Meta`, `Meta`, `Source`, `Migration` (+14 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **24 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Job` connect `Job` to `JobAPITests`, `.sign_in`, `Application`?**
  _High betweenness centrality (0.099) - this node is a cross-community bridge._
- **Why does `NaukriScraper` connect `NaukriScraper` to `Job`?**
  _High betweenness centrality (0.051) - this node is a cross-community bridge._
- **Why does `JobAPITests` connect `JobAPITests` to `Job`?**
  _High betweenness centrality (0.037) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `ProfileTests` (e.g. with `Education` and `Experience`) actually correct?**
  _`ProfileTests` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Migration`, `Meta`, `Meta` to the rest of the system?**
  _19 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `.sign_in` be split into smaller, more focused modules?**
  _Cohesion score 0.05960705960705961 - nodes in this community are weakly interconnected._
- **Should `profile_views.py` be split into smaller, more focused modules?**
  _Cohesion score 0.05555555555555555 - nodes in this community are weakly interconnected._