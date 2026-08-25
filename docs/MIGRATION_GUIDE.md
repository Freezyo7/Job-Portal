# Node → Django migration guide

Goal: replace `FE/server` (Express + MongoDB + Supabase) with this Django project (`BE`) as the sole backend for `FE/client`. Postgres already holds scraped `Job` rows via the `jobs` app.

Work through the phases in order. Each phase produces something you can test against the real frontend before moving on — don't jump ahead.

---

## Phase 0 — Project hygiene (do this before writing any API code)

- [ ] Install `django-environ` (or `python-decouple`) and load `.env` into `settings.py`. Move `SECRET_KEY` and the hardcoded Postgres password out of `settings.py` into `.env` (they're currently committed in plaintext — rotate the DB password after moving it).
- [ ] Set `DEBUG` from env, default `False`.
- [ ] Add `django-cors-headers`. Configure `CORS_ALLOWED_ORIGINS` = `http://localhost:5173` (+ your deployed FE URL later). Set `CORS_ALLOW_CREDENTIALS = True` — you'll be using cookies like Express did.
- [ ] Install `djangorestframework`, add to `INSTALLED_APPS`, set default pagination (`PageNumberPagination`, `PAGE_SIZE = 20`) and default permission (`IsAuthenticatedOrReadOnly` as a placeholder, tighten later per-view).
- [ ] Decide now: **custom user model**. Create an `accounts` app with a `User(AbstractUser)` subclass and set `AUTH_USER_MODEL = "accounts.User"` before your first migration. Swapping this later is painful — do it even though you don't need extra fields on `User` itself yet (profile fields go on a related model, see Phase 2).

Test: `python manage.py migrate` runs clean, `python manage.py runserver` boots, DRF browsable API loads at `/api/`.

---

## Phase 1 — Jobs API (read-only, no auth needed)

This replaces `jobs.controller.js` (`GET /api/jobs`, `GET /api/jobs/logo`). Your Django `Job` model ([jobs/models.py](jobs/models.py)) is already richer than the Mongo `SavedJob` shape the frontend currently reads (`job_title`, `company_name`, `job_link`, etc. — snake_case Supabase-style keys). You have two options:

- **A (recommended):** Update the FE to consume your model's field names (`title`, `company`, `url`, …) via a DRF serializer. Cleaner long-term, and you already know the FE source since it's local.
- **B:** Add serializer `source` fields / `to_representation` aliases so the JSON output matches the old `job_title`/`company_name`/`job_link` shape exactly, so FE components need zero changes.

Pick B first if you want the frontend working unmodified today, then refactor to A once things are stable.

Build:
- [ ] `jobs/serializers.py` — `JobSerializer(ModelSerializer)`.
- [ ] `jobs/views.py` — `JobListAPIView` (`GET /api/jobs/`) with `django-filter` (`source`, `location`, `job_type`, min/max experience) + search (`title`, `company`, `skills`) + ordering (`-posted_at`).
- [ ] `JobDetailAPIView` (`GET /api/jobs/<id>/`).
- [ ] Logo proxy view — port `proxyJobLogo` almost directly: validate `url` query param, `requests.get` with the same headers, stream back `content-type`/`cache-control`. This is the one endpoint that's basically a straight port.
- [ ] `jobs/urls.py`, wire into `config/urls.py` under `/api/jobs/`.
- [ ] Drop the `demoJobs` fallback — you have real scraped data, no need to fake it.

Test: `GET /api/jobs/` returns real scraped listings; point FE's job-list fetch at `http://localhost:8000/api/jobs/` and confirm the job cards render.

---

## Phase 2 — Auth

Replaces `auth.controller.js`, `auth.middleware.js`, `User.js`'s auth portion.

- [ ] `accounts` app (if not already made in Phase 0): `User(AbstractUser)` — keep `username`, `email` (make `email` unique), `password` (Django's built-in hashing replaces `bcryptjs` — don't hand-roll this).
- [ ] Install `djangorestframework-simplejwt`.
- [ ] Match the Express flow (JWT in an **httpOnly cookie**, not `Authorization` header) so the FE's existing `credentials: "include"` fetch calls need no rework:
  - [ ] `POST /api/auth/register` — create user, issue JWT, `Set-Cookie: token=...; HttpOnly; SameSite=...`.
  - [ ] `POST /api/auth/login` — verify credentials, issue cookie.
  - [ ] `POST /api/auth/logout` — clear cookie.
  - [ ] `GET /api/auth/me` — return `{id, username, email}` from the cookie's JWT.
  - You'll need a small custom authentication class (`CookieJWTAuthentication`) since simplejwt reads `Authorization` by default — pull the token out of `request.COOKIES["token"]` instead, mirroring [middleware/auth.middleware.js](../FE/server/middleware/auth.middleware.js).
- [ ] Response body shapes should match what FE already expects: `{message, user: {id, username, email}}` on register/login.

Test: register/login/logout via FE's actual login form works, cookie shows up in browser devtools, `/api/auth/me` returns the user after login.

---

## Phase 3 — Profile

Replaces `profile.controller.js` + the `profile` sub-schema in `User.js` (designation, phone, skills, experience, education, resume).

- [ ] `accounts` models: `Profile(OneToOneField(User))` with the flat fields (designation, phone, contactEmail, country, city, fullAddress, dob, age, gender, summary, linkedin, github, portfolio, skills=`JSONField(list)`).
- [ ] `Experience(ForeignKey(Profile))` and `Education(ForeignKey(Profile))` — these were embedded subdocuments in Mongo; in Postgres they become real child tables (better for querying anyway).
- [ ] Endpoints, all under `IsAuthenticated`:
  - [ ] `GET /api/profile/` 
  - [ ] `PATCH /api/profile/personal`
  - [ ] `POST /api/profile/experience`, `DELETE /api/profile/experience/<id>`
  - [ ] `POST /api/profile/education`, `DELETE /api/profile/education/<id>`
  - [ ] `PATCH /api/profile/skills`
  - [ ] `POST /api/profile/resume` — file upload (DRF `MultiPartParser`) + text extraction + parsing. Port [utils/resume-parser.js](../FE/server/utils/resume-parser.js) logic — check what library it uses (likely `pdf-parse` + an LLM call) before picking the Python equivalent (`pypdf`/`pdfplumber` + same or different LLM).

Test: fill profile form in FE, add/delete an experience and education entry, upload a resume, confirm parsed fields populate.

---

## Phase 4 — Settings

Replaces `settings.controller.js`.

- [ ] `GET /api/settings/` — username, email, role, created_at, `total_applied` (count from Phase 5's applications table).
- [ ] `PATCH /api/settings/profile` — update username/email with uniqueness check on email.
- [ ] `PATCH /api/settings/password` — verify current password (`user.check_password`), set new (`user.set_password`), min-length validation.
- [ ] `DELETE /api/settings/account` — verify password, delete user (cascade profile/applications), clear cookie.

Test: change password and re-login with new password; delete account and confirm cookie is cleared and login fails after.

---

## Phase 5 — Applications (apply / track)

Replaces `apply.controller.js`, `SavedJob.js`, and the `appliedJobs` array on `User.js`.

Since jobs already live in Postgres via your own `Job` model (Phase 1), you don't need a separate `SavedJob` upsert table like Express did (that existed because Mongo had no source-of-truth jobs table). Instead:

- [ ] `Application` model: `user (FK)`, `job (FK to jobs.Job)`, `status` (choices: Applied/Under Review/Shortlisted/Rejected/Offer Received, default Applied), `applied_at`, unique_together (`user`, `job`).
- [ ] `POST /api/apply/` — body `{job_id}` (not the whole job payload like Express did, since the job already exists in your DB) — get-or-create an `Application`, return `already_applied` flag if it exists.
- [ ] `GET /api/apply/my-applications` — list current user's applications with nested job data.
- [ ] `PATCH /api/apply/<job_id>/status` — update status, validate against the choices.

Test: apply to a job from FE, see it appear in "My Applications", change its status.

---

## Phase 6 — Interview (AI features)

Replaces `interview.controller.js` (Gemini-backed chat/summary/questions/cover-letter).

- [ ] Pick a Python Gemini client (`google-generativeai`) — same model, same API key, so prompts can be ported near-verbatim.
- [ ] `InterviewSession` model: `job_title`, `company_name`, `location`, `transcript (JSONField)`, `summary`, `started_at`, `ended_at`.
- [ ] `POST /api/interview/chat` — port the system prompt and history-passing logic directly from [interview.controller.js](../FE/server/controllers/interview.controller.js) lines 9-33.
- [ ] `POST /api/interview/summary` — same prompt, persist `InterviewSession` on completion.
- [ ] `POST /api/interview/questions` — same prompt; keep the JSON-array-extraction logic (strip markdown fences) since Gemini sometimes wraps output in ```json.
- [ ] `POST /api/interview/cover-letter` — same prompt, pull `userProfile` from Phase 3's `Profile` model instead of trusting client-supplied `userProfile` (Express trusted the request body here — tighten this by fetching the authenticated user's actual profile server-side instead).
- [ ] Match the 429/quota error handling (`is429`, `quotaError`) so FE's existing error UI keeps working.

Test: run a full mock interview flow through FE — chat, end session for summary, generate practice questions, generate a cover letter.

---

## Phase 7 — Cutover

- [ ] Update FE's API base URL / `.env` to point at Django (`http://localhost:8000` in dev).
- [ ] Grep FE `client/src` for any Mongo `_id`-shaped assumptions (24-char hex strings) — Postgres primary keys are integers by default, so anything doing string manipulation on IDs may break.
- [ ] Grep FE for `job_link`/`job_title`/etc. field names if you went with option A in Phase 1 (renamed fields) — update those call sites.
- [ ] Decommission `FE/server` once every route above has a working Django equivalent and FE is fully cut over. Keep it around (don't delete) until you've verified in the browser, not just via curl/Postman.

---

## Suggested pace

Phases 0–1 are a good first working session — they get you a real, testable improvement (live scraped jobs in the FE) with no auth complexity. Phase 2 (auth) is the next most valuable since Phases 3–5 all depend on `IsAuthenticated`. Phase 6 (AI interview) is self-contained and can slot in anytime after Phase 3. Do Phase 7 last, incrementally — you can cut over route-by-route (e.g. point only `/api/jobs` at Django while auth still runs on Express) rather than all at once, if you want lower risk.
