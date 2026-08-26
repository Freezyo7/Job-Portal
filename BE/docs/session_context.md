# Session Context — Job Portal Backend

Orientation document for LLM assistants working on this codebase. Written
2026-08-16. Verify anything time-sensitive (test counts, phase status,
uncommitted work) before relying on it — this file records a snapshot, and
the repo moves.

---

## What this project is

A Django REST backend replacing an Express/Mongo backend (`FE/server`) for a
job portal. Jobs are scraped from Indian job boards (Naukri, Foundit,
Hirist, Unstop) into Postgres; users register, browse, apply, and track
applications. The migration runs in phases — see
[MIGRATION_GUIDE.md](../MIGRATION_GUIDE.md) for the original plan.

**Stack:** Django 6.0.7, DRF 3.18, Postgres, `uv` for dependency management,
SimpleJWT with httpOnly cookies, Groq for LLM calls.

**Run anything with `uv run`** — bare `python` lacks the dependencies:
```bash
uv run python manage.py test accounts applications
uv run python manage.py check
```

---

## Working style established in this session

These are conventions the user has asked for. Following them matters more
than moving fast.

- **The user writes most backend code themselves.** They are learning
  Django. The established pattern is: assistant gives a short goal
  ("implement X, it must satisfy Y and Z, here's why") *before* any code,
  user writes it, assistant reviews and writes tests. Ask which split they
  want rather than assuming.
- **A one-line goal before code, not a lecture.** The user explicitly asked
  for a brief "this is what this code is for" preamble, not heavy
  explanation.
- **Verify, don't assert.** Claims about behaviour get checked by running
  something. Security-relevant checks get mutation-tested: break the check
  deliberately, confirm a test fails, restore. This has caught real bugs.
- **Tests never hit the network.** Groq is mocked throughout; uploads use a
  temp `MEDIA_ROOT`.

---

## Architecture

### Apps

| App | Responsibility |
|---|---|
| `accounts` | Identity: `User`, email verification, JWT cookie auth, `Profile`, resume upload/parsing, settings |
| `applications` | The user↔job relationship: apply, list, dashboard stats, contribution calendar |
| `jobs` | `Job` model, list/detail endpoints, logo proxy |
| `scrapers` | Scraping code for the job boards (predates this migration) |
| `config` | Settings and root urlconf |

**App boundary rule established here:** `accounts` is identity — who the
user is. `Profile` lives there legitimately because it is *about the user*.
`Application` is about a job, so it got its own app. When adding a feature,
ask which domain it belongs to rather than defaulting to `accounts`.

Authentication is request-level and global — `DEFAULT_AUTHENTICATION_CLASSES`
and `DEFAULT_PERMISSION_CLASSES` in settings apply to every DRF view in every
app. `IsAuthenticated` works in a new app with zero extra wiring. Settings
**fail closed**: a view requires login unless it explicitly sets
`permission_classes = [AllowAny]`.

### Auth model

JWT in **httpOnly cookies**, not `Authorization` headers.
`accounts/authentication.py` (`CookieJWTAuthentication`) reads the token from
the cookie named by `settings.AUTH_COOKIE`. Refresh tokens rotate and the old
one is blacklisted (`ROTATE_REFRESH_TOKENS` + `BLACKLIST_AFTER_ROTATION`), so
a stolen refresh token stops working after one use.

Registration creates an **inactive** user and emails a 6-digit code. Codes
are SHA-256 hashed (never stored raw), expire in 15 minutes, and allow 5
attempts. `EmailVerificationCode.issue()` invalidates outstanding codes
before creating a new one.

---

## Phase status

| Phase | Status | Notes |
|---|---|---|
| 0 — Hygiene | Done | `django-environ`, `.env` (gitignored, never committed), custom `User` |
| 1 — Jobs API | Done | `jobs` app, list/detail/logo-proxy |
| 2 — Auth | Done | Register/verify/login/logout/refresh/me, throttled |
| 3 — Profile | Done | Profile + Experience + Education + skills |
| 3b — Resume | Done | Upload, store, parse via Groq, return for review |
| 4 — Settings | **Done** | GET/PATCH account info, PATCH password, DELETE account |
| 5 — Applications | Done | Apply, list, delete, stats, activity calendar; contact fields added |
| 6 — Interview AI | Not started | |
| 7 — Cutover | Not started | |

Phases 4 and 5 were done out of order because Phase 4's `total_applied`
needs Phase 5's `Application` model.

**Test suite: 177 passing** across `accounts` (113) and `applications` (57) and `jobs` (7).

> Running `manage.py test` with no app argument surfaces 6 pre-existing
> `ModuleNotFoundError: bleach` errors from `scrapers`. `bleach` is in
> `requirements.txt` but was never added via `uv add`, so it is absent from
> `pyproject.toml`/`uv.lock`. Unrelated to the migration work; not yet fixed.
> Run `uv run python manage.py test accounts applications jobs` to avoid it.

---

## API surface

All auth-related routes are under `/api/auth/` (including profile and
settings — the guide said `/api/settings/`, but the user chose to keep them
under `auth` rather than split the urlconf).

### `accounts` — `/api/auth/`

```
POST   register/                   create inactive user, email a code
POST   verify/                     exchange code for verified session
POST   resend/                     new code (silent on unknown email)
POST   login/                      credentials → auth cookies
POST   logout/                     blacklist refresh, clear cookies
POST   refresh/                    rotate tokens
GET    me/                         current user

GET    profile/                    full profile (get-or-creates the row)
PATCH  profile/personal/           name, contact, location, links, summary
POST   profile/experience/         add one entry
DELETE profile/experience/<pk>/    remove (own only)
POST   profile/education/          add one entry
DELETE profile/education/<pk>/     remove (own only)
PATCH  profile/skills/             replace the whole list
POST   profile/resume/             upload + parse, returns parsed for review
GET    profile/resume/download/    stream own resume

GET    settings/                   username, email, date_joined, total_applied
PATCH  settings/profile/           username / email (email → re-verification,
                                   deactivates account & clears cookies)
PATCH  settings/password/          verify current, set new, rotate session
DELETE settings/account/           verify password, cascade delete
```

### `applications` — `/api/applications/`

```
GET    ""                 caller's applications, job data nested (includes source, contact fields)
POST   ""                 body {"job_id": N} → confirm an application
PATCH  <pk>/              update contact info (contact_name, contact_email, contact_linkedin)
DELETE <pk>/              undo a mis-confirmation (own only)
GET    activity/?year=    [{"date": "2026-08-16", "count": 3}, ...]
GET    stats/             total_applied, streaks, week/month counts
```

### `jobs` — `/api/jobs/`

```
GET    ""            list (paginated, filterable)
GET    <pk>/         detail
GET    logo/         logo proxy
```

---

## Key models

### `accounts.User(AbstractUser)`
No extra fields. `AUTH_USER_MODEL = "accounts.User"`. Always reach it via
`get_user_model()` or `settings.AUTH_USER_MODEL` (string form in FKs), never
a direct import — consistency with third-party apps and lazy resolution.

### `accounts.Profile`
`OneToOneField` to user. Display name lives here, not on `User`. Dates
(`dob`, experience/education `start_date`/`end_date`) are **`CharField`, not
`DateField`** — they hold free text like `"Jan 2020"` to match the frontend's
month/year inputs. Do not assume they are comparable or orderable.
`skills` is a `JSONField` list, matching `Job.skills` so skill matching is a
straight comparison later.

### `accounts.Experience` / `accounts.Education`
FK to `Profile`, `related_name="experience"` / `"education"`.

**Known gap:** `current` and `end_date` have no cross-field validation — a
row can be `current=True` *and* carry an `end_date`. Worth a serializer
`validate()` if touched.

### `applications.Application`
```python
user             FK → AUTH_USER_MODEL, related_name="applications"
job              FK → "jobs.Job",      related_name="applications"
contact_name     CharField(blank=True, default="")   # recruiter / referral name
contact_email    EmailField(blank=True, default="")  # nullable recruiter email
contact_linkedin URLField(blank=True, default="")    # nullable LinkedIn URL
applied_at       DateTimeField(auto_now_add=True)
```
- `UniqueConstraint(("user", "job"))` — DB-level, because a view-side
  `exists()` check loses a race between two simultaneous requests.
- `Index(("user", "applied_at"))` — column order matters; the calendar
  filters by user then ranges over dates.
- **No status field.** A row means "the user confirmed they applied." The
  flow is: click apply → redirect to the job → return → "did you apply?" →
  Yes creates the row, No records nothing.
- **Contact fields** are optional (blank by default). The user can add a
  recruiter name, email, or LinkedIn URL via `PATCH /api/applications/<pk>/`
  after the application is confirmed.
- Consequence of the unique constraint: the calendar shows *"jobs first
  applied to on this day"*, not *"confirmations on this day."* Re-confirming
  an old job does not add to today's count.

---

## Things that will bite you

### Timezone
`TIME_ZONE = "Asia/Kolkata"`, `USE_TZ = True`. Storage is UTC; `TruncDate`
groups in IST. This is deliberate — with `TIME_ZONE = "UTC"` a 2am IST
application landed on the previous calendar day. There is a test
(`test_a_late_night_application_lands_on_the_ist_day_not_the_utc_day`)
pinning this. When writing timezone tests, note that
`timezone.get_default_timezone()` returns **Asia/Kolkata**, not UTC — use
`datetime.timezone.utc` explicitly to construct a UTC moment.

### Streak semantics
`_streaks()` in `applications/views.py`: a streak ending **yesterday is
still current**, because today is not over (GitHub/LeetCode behaviour). The
line that encodes this is
`days[-1] in (today, today - timedelta(days=1))`. `applied_this_week` is a
**calendar week, Monday–Sunday**, not a rolling 7 days.

### Resume parsing (`accounts/resume_parsers.py`)
- Model is **`openai/gpt-oss-120b`** — one of only two Groq models
  supporting strict `json_schema`, so the response shape is *guaranteed*
  rather than hopefully parsed. `llama-3.3-70b-versatile` only offers
  `json_object` (valid JSON, arbitrary keys), which is not enough.
- Schema fields are all **required *and* nullable**. Required forces the
  model to address each field; nullable lets it say "absent" instead of
  inventing a plausible value.
- **Glyph-spacing fix:** PDFs laid out glyph-by-glyph (Canva, Figma, most
  resume builders) extract as `"S U M M A R Y"`. Testing against a real
  resume showed 100% of lines affected, producing an unusable phone number,
  a broken email, and **zero skills**. `_is_glyph_spaced()` /
  `_collapse_glyph_spacing()` detect and repair this. Thresholds (0.5, 0.6)
  are tuned on one resume and are deliberately conservative — normal PDFs
  pass through untouched.
- Parsed URLs come back bare (`"linkedin.com/in/x"`), which `Profile.linkedin`
  (a `URLField`) rejects. `_with_schema()` in `profile_views.py` prepends
  `https://`.
- Parse happens **before** storing, so a failed parse leaves the previous
  resume in place and costs no disk.
- Resume text is untrusted input going into a prompt — the system prompt
  tells the model to treat it purely as data to extract from.

### Known gaps (not bugs introduced, but real)
- `user.delete()` cascades DB rows but **not** files on disk. Deleted
  accounts leave orphans in `media/resumes/`.
- `linkedin`/`github` often parse empty because they are hyperlink
  *annotations* — the visible text is just "Linkedin", so there is no URL in
  the text layer. Would need `pypdf` annotation reading.
- `SkillsSerializer.validate_skills` has an unreachable blank-skill branch:
  `allow_blank=False` rejects `[""]` at field level first.

---

## Config worth knowing

`.env` is gitignored and has never been committed. Keys used:
`SECRET_KEY`, `POSTGRES_PASSWORD`, `DEBUG`, `GROQ_API_KEY`, scraper
credentials.

**django-environ rejects `KEY = "value"`** — no spaces around `=`, no
quotes. A malformed line is silently skipped with an "Invalid line" warning.

Throttle scopes (`config/settings.py`): `login` 10/h, `register` 5/h,
`verify` 20/h, `resend` 3/h, `resume` 10/h (protects the Groq bill),
`anon` 60/h, `user` 1000/h. **Any new throttle scope must be added to the
`NO_THROTTLE` dict in test files** or tests will start tripping limits.

Media: `MEDIA_ROOT` is **never served directly**. Resumes are streamed by
`ResumeDownloadView`, which checks ownership first. Filenames on disk are
randomised (`resume_upload_path`) so they are not guessable.

---

## Testing conventions

- `accounts/tests.py` — auth, profile, resume (100 tests). Module docstring
  says `ThrottleTests` stays **last**; insert new classes above it.
- `applications/tests.py` — apply flow, ownership, stats, streaks (39).
- Shared fixtures: `NO_THROTTLE` (all rates raised), `MEMORY_MAIL`
  (locmem backend), a `sign_in()` helper that registers + verifies and
  leaves cookies on the client.
- `make_pdf()` in `accounts/tests.py` builds a minimal PDF **by hand** —
  `pypdf` can add pages but cannot draw text, and the extractor needs real
  readable bytes.
- Groq is mocked via `patch("accounts.resume_parsers.requests.post")`.
  Note: a `requests.Response` for 4xx/5xx is **falsy**, so
  `response or default` silently swaps an error for a success — use
  `if response is None`.
- Every ownership check has a test proving another user gets 404 *and* the
  row survives. These have been mutation-tested.

---

## Remaining work

### Phase 6 — Interview AI (skipped for now)

Guide says Gemini, but **this project already uses Groq** for resume
parsing — worth asking the user whether to reuse Groq rather than adding a
second LLM provider and key. Prompts port from
`FE/server/controllers/interview.controller.js`.

- `InterviewSession` model: `job_title`, `company_name`, `location`,
  `transcript` (JSONField), `summary`, `started_at`, `ended_at`.
- `POST /api/interview/chat`, `/summary`, `/questions`, `/cover-letter`.
- Cover letter must pull `Profile` **server-side** from the authenticated
  user — the Express version trusted a client-supplied `userProfile` body.
- Keep JSON-array extraction (strip markdown fences); LLMs wrap output in
  ` ```json ` fences.
- Match 429/quota error handling so the existing frontend error UI works.
- This belongs in its own app, not `accounts` — same boundary reasoning as
  `applications`.

### Phase 7 — Cutover (not started)

- Point the frontend's API base URL at Django (`http://localhost:8000` dev).
- Grep `FE/client/src` for Mongo `_id` assumptions (24-char hex) — Postgres
  PKs are integers.
- Decommission `FE/server` only after browser verification, not just curl.
- Cut over route-by-route rather than all at once.

### Frontend UI updates needed

The FE dashboard needs updating to consume the new Django API surface:

- **Applications table**: Show `job.source` as a platform badge (Naukri, LinkedIn etc.),
  and the new `contact_name` / `contact_email` / `contact_linkedin` columns
  (with a "+ Add Contact" button when empty, opening a modal that calls
  `PATCH /api/applications/<pk>/`).
- **Activity heatmap**: Wire up `GET /api/applications/activity/?year=` for
  a GitHub/LeetCode-style contribution calendar.
- **Stats bar**: Wire `GET /api/applications/stats/` for total, streaks,
  and weekly/monthly counts.
- **Settings page**: Wire the four `/api/auth/settings/` routes (overview,
  update profile, change password, delete account).

---

## Current working tree

All Phase 4 and Phase 5 work is committed and clean (`git status` clean as of
2026-08-23). Files added or significantly modified since the original
`b9bc78e` baseline:

```
accounts/settings_serializers.py   — SettingsSerializer, UpdateAccountSerializer,
                                     ChangePasswordSerializer, DeleteAccountSerializer
accounts/settings_views.py         — SettingsOverviewView, UpdateAccountView,
                                     ChangePasswordView, DeleteAccountView
accounts/urls.py                   — wired settings/ routes
accounts/tests.py                  — SettingsFlowTests (13 tests)
applications/models.py             — contact_name, contact_email, contact_linkedin fields
applications/migrations/0003_*     — migration for contact fields
applications/serializers.py        — source in job serializer, contact fields, UpdateApplicationSerializer
applications/views.py              — PATCH on ApplicationDetailView
applications/tests.py              — ApplicationDetailTests (contact + ownership tests)
docs/session_context.md            — this file
```
