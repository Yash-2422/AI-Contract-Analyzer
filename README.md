# AI Contract Analyzer

Understand Contracts in Minutes with AI.

## Phase 1 — Project Scaffolding (current)

This phase sets up the skeleton only: config, database connection, logging,
global error handling, and a health-check endpoint. No auth or business
features yet — those come in later phases.

### Folder structure

```
ai-contract-analyzer/
├── backend/
│   ├── app/
│   │   ├── main.py                # FastAPI entrypoint
│   │   ├── core/
│   │   │   ├── config.py          # typed settings from .env
│   │   │   ├── database.py        # SQLAlchemy engine/session
│   │   │   └── logging_config.py
│   │   ├── models/
│   │   │   └── base.py            # shared id/created_at/updated_at mixin
│   │   ├── api/v1/
│   │   │   └── router.py          # aggregates all endpoint routers
│   │   ├── middlewares/
│   │   │   └── error_handler.py   # global exception -> JSON responses
│   │   ├── services/               # business logic (empty until Phase 2)
│   │   ├── repositories/           # DB access layer (empty until Phase 2)
│   │   ├── schemas/                 # Pydantic request/response models
│   │   └── utils/
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
├── docker-compose.yml
└── README.md
```

## How to run

1. Copy the env file:
   ```bash
   cp backend/.env.example backend/.env
   ```
2. Start everything:
   ```bash
   docker compose up --build
   ```
3. Visit:
   - API root: http://localhost:8000/
   - Swagger docs: http://localhost:8000/api/docs
   - Health check: http://localhost:8000/api/v1/health

### Running without Docker (local Python)

```bash
cd backend
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env           # then edit DATABASE_URL to point at a local Postgres
uvicorn app.main:app --reload
```

## How to test this phase

```bash
curl http://localhost:8000/api/v1/health
# Expect: {"status": "ok"}

curl http://localhost:8000/
# Expect: {"service": "AI Contract Analyzer", "version": "0.1.0", "docs": "/api/docs"}
```

Also open http://localhost:8000/api/docs — you should see a working Swagger
UI with the `/health` endpoint listed, confirming FastAPI, CORS, and the
error-handler middleware are all wired correctly.

## Phase 2 — Authentication (current)

Adds: `User` + `RefreshToken` models, password hashing, JWT access/refresh
tokens (with rotation), protected routes, and profile management.

New endpoints under `/api/v1/auth`:

| Method | Path | Auth required | Purpose |
|---|---|---|---|
| POST | `/auth/register` | no | Create an account |
| POST | `/auth/login` | no | Get access + refresh tokens |
| POST | `/auth/refresh` | no (needs refresh token) | Rotate to a new token pair |
| POST | `/auth/logout` | no (needs refresh token) | Revoke a refresh token |
| GET | `/auth/me` | yes | Get current user profile |
| PATCH | `/auth/me` | yes | Update profile (full name) |
| POST | `/auth/me/change-password` | yes | Change password (revokes all sessions) |
| DELETE | `/auth/me` | yes | Delete account |

### Run migrations

```bash
cd backend
alembic upgrade head
```

This creates the `users` and `refresh_tokens` tables (migration
`0001_create_users_and_refresh_tokens.py`).

### How to test this phase

```bash
# Register
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","password":"supersecret123","full_name":"Your Name"}'

# Login
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","password":"supersecret123"}'
# -> copy the access_token from the response

# Get profile (protected route)
curl http://localhost:8000/api/v1/auth/me \
  -H "Authorization: Bearer <access_token>"
```

You can also exercise all of this from the Swagger UI at `/api/docs` — click
"Authorize" and paste in `Bearer <access_token>` after logging in.

A full automated test (register → login → refresh rotation → bad-token
rejection → profile update → logout → post-logout rejection) was run
against these exact files before delivery — 13/13 checks passed.

**Note on `bcrypt`:** `requirements.txt` pins `bcrypt==4.0.1`. Newer bcrypt
releases changed an internal API that `passlib` 1.7.4 relies on, which
causes every password hash to fail with a misleading "password cannot be
longer than 72 bytes" error even for short passwords. Keep this pin until
you upgrade passlib.

## Phase 3 — Document Management (current)

Adds: `Contract` model, local filesystem storage, upload/list/search/rename/delete
endpoints under `/api/v1/contracts` — all scoped to the authenticated user.

| Method | Path | Purpose |
|---|---|---|
| POST | `/contracts` | Upload a PDF/DOCX (multipart form, field name `file`) |
| GET | `/contracts?search=&page=&page_size=` | List/search your contracts, paginated |
| GET | `/contracts/{id}` | Get one contract's metadata |
| PATCH | `/contracts/{id}` | Rename (`{"display_name": "..."}`) |
| DELETE | `/contracts/{id}` | Delete (removes DB row **and** the file on disk) |

Validation enforced server-side: only `.pdf`/`.docx` extensions (checked
against both filename and MIME type), non-empty files, and a size cap
(`MAX_UPLOAD_SIZE_MB`, default 25MB, from Phase 1's config).

Ownership isolation: every query filters by `user_id` at the database level
— a contract belonging to another user returns 404, not 403, so its
existence isn't leaked either.

### Run migrations

```bash
cd backend
alembic upgrade head
```

Creates the `contracts` table (migration `0002_create_contracts_table.py`).

### How to test this phase

```bash
# Upload (replace <access_token> with one from /auth/login)
curl -X POST http://localhost:8000/api/v1/contracts \
  -H "Authorization: Bearer <access_token>" \
  -F "file=@/path/to/your/contract.pdf"

# List
curl http://localhost:8000/api/v1/contracts \
  -H "Authorization: Bearer <access_token>"

# Search
curl "http://localhost:8000/api/v1/contracts?search=lease" \
  -H "Authorization: Bearer <access_token>"
```

A full automated test was run before delivery — upload validation (good
file, no auth, wrong extension, empty file), list, search, get-by-id,
rename, cross-user ownership isolation, delete, and post-delete 404 — **12/12
checks passed**, including confirming the file is actually removed from
disk on delete, not just the DB row.

## Phase 4 — Document Processing (current)

Adds: text extraction (PDF via PyMuPDF, DOCX via python-docx), scanned-page
detection + OCR (PaddleOCR), chunking, embeddings (`BAAI/bge-small-en-v1.5`),
and storage in Postgres via `pgvector`.

| Method | Path | Purpose |
|---|---|---|
| POST | `/contracts/{id}/process` | Run the full pipeline synchronously, returns updated contract |
| GET | `/contracts/{id}/chunks` | List the chunks + metadata created for a contract |

Pipeline: `uploaded` → `processing` → extract text → OCR any scanned pages
→ chunk (1000 chars, 150 overlap, paragraph-aware) → embed → store →
`processed` (or `failed`, with the error logged, if anything throws).

### Run migrations

```bash
cd backend
alembic upgrade head
```

Creates `document_chunks` (with a `vector(384)` column and an `ivfflat`
cosine-distance index) and enables the `vector` extension.

### What I actually verified vs. what needs your machine

I don't have internet access to Hugging Face or PaddleOCR's model servers
in my sandbox, so here's exactly what was tested and how:

- **Installed a real Postgres 16 + pgvector locally** and ran all three
  migrations against it for real (not SQLite) — confirmed the `vector(384)`
  column and `ivfflat` index are created correctly.
- **Extraction & chunking**: ran for real against actual generated PDF/DOCX
  files — confirmed native-text extraction, scanned-page detection (a blank
  PDF page correctly flagged `needs_ocr=True`), and DOCX table-cell
  extraction all work.
- **Full pipeline wiring**: ran upload → process → chunk-storage end to end
  through the real API against real Postgres, with only the embedding
  *model weights* swapped for a deterministic stand-in (since downloading
  bge-small-en-v1.5 needs Hugging Face access this sandbox doesn't have).
  This caught and fixed a real bug: SQLAlchemy sends a Python enum's
  *name* by default, but Postgres enum types store the *value* — contract
  status updates were failing against real Postgres despite working fine
  against SQLite. Fixed with `values_callable` in `models/contract.py`.
- **Confirmed pgvector similarity search itself works** — ran a real
  `<=>` cosine-distance query against stored vectors directly in Postgres.
- **Not tested here**: PaddleOCR's actual OCR output, and the real
  bge-small-en-v1.5 embedding model — both require downloading model
  weights from the internet on first run. The scanned-PDF test confirms
  the pipeline *fails gracefully* (status → `failed`, error logged, no
  crash) when those models aren't available, which is the behavior you'd
  see on a machine that hasn't downloaded them yet either.

On your machine (with internet access), the first call to `/process` will
download the embedding model (~130MB) and PaddleOCR's models (~10MB) once;
subsequent calls reuse the cached models.

### How to test this phase

```bash
curl -X POST http://localhost:8000/api/v1/contracts/<contract_id>/process \
  -H "Authorization: Bearer <access_token>"

curl http://localhost:8000/api/v1/contracts/<contract_id>/chunks \
  -H "Authorization: Bearer <access_token>"
```

Check `status` in the response — `processed` means chunks were created
successfully; `failed` means something in the pipeline threw (check the
backend logs for the traceback).

## Phase 5 — AI Core: Ollama + LangChain, Summaries, RAG Chat (current)

Adds: LLM integration via `ChatOllama`, contract summary generation, and
RAG-based chat with per-contract chat sessions and message history.

| Method | Path | Purpose |
|---|---|---|
| POST | `/contracts/{id}/summary` | Generate and store a new summary |
| GET | `/contracts/{id}/summary` | Get the latest stored summary |
| POST | `/contracts/{id}/chat/sessions` | Start a new chat session |
| GET | `/contracts/{id}/chat/sessions` | List your chat sessions for a contract |
| POST | `/chat/sessions/{id}/messages` | Send a message, get the AI's grounded reply |
| GET | `/chat/sessions/{id}/messages` | Full message history for a session |

**How chat stays grounded (doesn't hallucinate):** every question first goes
through `RetrievalService`, which embeds the question and runs a real
pgvector cosine-distance query scoped to that one contract's chunks. Only
those retrieved chunks are handed to the LLM as context, with an explicit
system-prompt instruction to say "the contract doesn't address that" rather
than guess. The assistant's reply is stored with `cited_chunk_ids` — exactly
which chunks it was grounded in — so the frontend (Phase 9) can show "from
page 3" style citations.

### Setting up Ollama (needed for this phase to actually generate text)

```bash
# On your host machine (not in Docker, unless you add an ollama service to docker-compose.yml):
ollama pull qwen2.5:7b-instruct
ollama serve
```

Make sure `OLLAMA_BASE_URL` in `backend/.env` points to wherever Ollama is
running (`http://localhost:11434` if it's on your host and the backend runs
via `uvicorn` directly; if the backend runs in Docker, use
`http://host.docker.internal:11434` on Mac/Windows or add Ollama as its own
`docker-compose.yml` service on Linux).

### Run migrations

```bash
cd backend
alembic upgrade head
```

Creates `contract_summaries`, `chat_sessions`, `chat_messages`.

### What I actually verified vs. what needs your machine

Same honesty note as Phase 4 — this sandbox has no route to Ollama's model
registry, so:

- **Verified for real**: all routing, ownership checks (a second user gets
  404 on every summary/chat endpoint for a contract or session that isn't
  theirs), chat history persistence (user + assistant messages stored in
  order), and — most importantly — **retrieval actually running a real
  pgvector `<=>` query** against the chunks Phase 4 created, confirmed by
  inspecting the SQL that ran.
- **Stood in for the real model**: the LLM call itself (`LLMService.generate`)
  was swapped for a function that echoes back what context it received,
  so I could verify the *right* chunks were retrieved and passed to it —
  without needing Ollama's actual weights downloaded.
- **On your machine**: once Ollama is running with the model pulled, no
  code changes are needed — `LLMService` connects to whatever
  `OLLAMA_BASE_URL` points to on first use.

### How to test this phase

```bash
# Generate a summary (contract must be processed first - see Phase 4)
curl -X POST http://localhost:8000/api/v1/contracts/<contract_id>/summary \
  -H "Authorization: Bearer <access_token>"

# Start a chat session
curl -X POST http://localhost:8000/api/v1/contracts/<contract_id>/chat/sessions \
  -H "Authorization: Bearer <access_token>" -H "Content-Type: application/json" -d '{}'

# Ask a question (use the session id from above)
curl -X POST http://localhost:8000/api/v1/chat/sessions/<session_id>/messages \
  -H "Authorization: Bearer <access_token>" -H "Content-Type: application/json" \
  -d '{"content": "What is the payment schedule?"}'
```

## Phase 6 — Risk Detection, Contract Comparison, Semantic Search (current)

| Method | Path | Purpose |
|---|---|---|
| POST | `/contracts/{id}/risk-analysis` | Analyze the contract, replace stored findings |
| GET | `/contracts/{id}/risk-analysis` | Get the current findings + overall score |
| POST | `/contracts/compare` | Compare two of your contracts (`{"contract_a_id", "contract_b_id"}`) |
| GET | `/comparisons/{id}` | Get a past comparison result |
| GET | `/search?query=...&top_k=10` | Semantic search across **all** your contracts |

**Risk detection**: the LLM is asked to return a JSON array of findings
(category, severity, explanation, suggestion, page number) — never prose —
so each finding becomes a real, filterable/sortable row rather than a
paragraph you'd have to re-parse. Re-running analysis replaces the previous
findings (it reflects the document's current state, not a history).
`overall_risk_score` (0-100) is weighted so one `critical` finding moves the
score far more than several `low` ones.

**Comparison**: sends both contracts' full text to the LLM with a structured
prompt (added/removed/modified clauses, payment/notice-period/obligation
changes) and stores the markdown result. Comparing a contract with itself
is rejected with a 400.

**Cross-contract search**: `RetrievalService.retrieve_across_user_contracts`
is Phase 5's per-contract retrieval with the contract filter swapped for a
`JOIN contracts WHERE contracts.user_id = ...` — ownership is enforced in
the query itself, the same pattern used everywhere else in this project.

### Run migrations

```bash
cd backend
alembic upgrade head
```

Creates `risk_findings` and `contract_comparisons`.

### What I actually verified

Same sandbox limits as Phases 4-5 (no route to Ollama's model registry
here), but everything **around** the LLM call was verified for real against
Postgres: uploaded and processed two real contracts, ran risk analysis
(confirmed the JSON parsing, category/severity validation, and score
calculation all work, and that re-running **replaces** findings rather than
duplicating — 2 findings before and after a second run), ran a real
comparison and fetched it back, and ran cross-contract search that
genuinely found chunks from **both** contracts via a real pgvector join
query. Ownership isolation was re-verified on every new endpoint (a second
user gets 404 everywhere, and their search returns zero results). **18/18
checks passed.** Only the LLM's actual text generation was stood in for a
function returning realistic sample output, for the same reason as before.

### How to test this phase

```bash
curl -X POST http://localhost:8000/api/v1/contracts/<id>/risk-analysis \
  -H "Authorization: Bearer <access_token>"

curl -X POST http://localhost:8000/api/v1/contracts/compare \
  -H "Authorization: Bearer <access_token>" -H "Content-Type: application/json" \
  -d '{"contract_a_id": "<id_a>", "contract_b_id": "<id_b>"}'

curl "http://localhost:8000/api/v1/search?query=termination%20notice" \
  -H "Authorization: Bearer <access_token>"
```

## Phase 7 — Dashboard & Reports (current)

| Method | Path | Purpose |
|---|---|---|
| GET | `/dashboard` | Aggregated stats: recent contracts, storage used, risk distribution, chat/summary/comparison/report counts |
| GET | `/contracts/{id}/reports/summary` | Download a summary report (PDF) |
| GET | `/contracts/{id}/reports/risk` | Download a risk report (PDF) |
| GET | `/contracts/{id}/reports/clauses` | Download a clause report, grouped by category (PDF) |
| GET | `/comparisons/{id}/reports/comparison` | Download a comparison report (PDF) |

**Reports are generated on the fly, not stored on disk** — each request
builds the PDF in memory (via `reportlab`'s Platypus API, matching
Anthropic's own PDF-creation guidance: pure Python, no system dependencies
like WeasyPrint/wkhtmltopdf need, which keeps the Docker image simple) and
streams it straight back. A `generated_reports` table logs each generation
(type + reference id) purely so the dashboard can show a real "Reports
Generated" count — there's no report file storage or cleanup to manage.

**Dashboard aggregation** reuses every repository built in Phases 2-6 rather
than introducing new tracking tables — `risk_distribution` groups
`risk_findings` by severity across all your contracts, `storage_used_bytes`
sums `Contract.size_bytes`, and so on. All of it is scoped to the
authenticated user via the same ownership-in-the-query pattern used
everywhere else in this project.

### Run migrations

```bash
cd backend
alembic upgrade head
```

Creates `generated_reports`.

### What I actually verified

Ran a full scenario against real Postgres: uploaded and processed two
contracts, generated a summary, ran risk analysis, ran a comparison, and
had a chat exchange — then fetched `/dashboard` and confirmed every number
was exactly right (2 contracts, correct storage bytes, risk distribution
matching the actual findings' severities, 1 chat session/2 messages, 1
summary, 1 comparison, 0 reports before any were downloaded). Then
downloaded all four report types and **actually opened the resulting PDF
with PyMuPDF to extract and read back its text** — confirmed the risk
report's title, finding count, severity, category, explanation, and
suggestion all rendered correctly, not just that the bytes started with
the PDF magic number. Confirmed `reports_generated_count` incremented to 4
afterward, and that a second user's dashboard shows all zeros and gets 404
on every report download for contracts/comparisons that aren't theirs.
**20/20 checks passed.** Unlike Phases 4-6, this phase has no LLM-dependent
step of its own (it only reads already-stored summaries/findings/results),
so everything here was verified against real logic, not a stand-in.

### How to test this phase

```bash
curl http://localhost:8000/api/v1/dashboard \
  -H "Authorization: Bearer <access_token>"

curl http://localhost:8000/api/v1/contracts/<id>/reports/risk \
  -H "Authorization: Bearer <access_token>" \
  -o risk-report.pdf
```

## Phase 8 — Frontend Foundation: React + Vite + Tailwind + ShadCN (current)

Adds the `frontend/` app: Vite + React 19 + TypeScript, Tailwind, routing,
and the full auth flow (login/register/protected routes) wired to the
Phase 2 backend.

### Design system

Steered deliberately away from generic AI-SaaS defaults toward something
that reads as an actual contract-review tool:

- **Colors**: ink navy (`#1B2430`) text, warm paper (`#FAF8F3`) background,
  deep emerald (`#1F5D4C`) as the primary action color, and a precise
  vermillion (`#C1440E`) reserved *only* for risk indicators.
- **Type**: `Newsreader` (serif) for headings, `Inter` for UI text,
  `IBM Plex Mono` for metadata/clause numbers — loaded via Google Fonts in
  `index.html`.
- **Signature element**: the auth page's left panel shows an animated,
  redlined contract clause with a risk annotation — the product's actual
  core feature (Phase 6's risk detection) rendered as the hero visual
  instead of a generic gradient.

### Structure

```
frontend/
├── src/
│   ├── lib/
│   │   ├── api-client.ts       # axios + auto token-refresh on 401
│   │   └── utils.ts            # cn() - shadcn's class-merge helper
│   ├── store/auth-store.ts     # Zustand, persisted to localStorage
│   ├── types/api.ts            # mirrors backend Pydantic schemas
│   ├── components/
│   │   ├── ui/                 # button, input, label, card (shadcn convention)
│   │   └── layout/              # auth-layout, protected-route
│   ├── features/auth/          # login-page, register-page, clause-showcase
│   └── pages/dashboard-placeholder.tsx  # confirms auth flow; full dashboard in Phase 9
```

**Token refresh**: `api-client.ts`'s response interceptor catches any 401,
transparently calls `/auth/refresh`, retries the original request, and
only redirects to `/login` if the refresh itself fails. Concurrent 401s
share a single in-flight refresh call (important because Phase 2's refresh
tokens rotate — two simultaneous refresh calls would have the second one
fail).

**Known trade-off**: tokens are persisted to `localStorage`, matching the
backend's bearer-token design from Phase 2. This is readable by any JS on
the page, so an XSS bug elsewhere would be able to exfiltrate them. Moving
to httpOnly cookies is a backend change (issuing `Set-Cookie` on
login/refresh), not just a frontend swap — worth doing before a real
production launch, noted here so it isn't forgotten.

### Run it

```bash
cd frontend
cp .env.example .env    # leave VITE_API_URL blank to use the dev proxy to :8000
npm install
npm run dev
```

Visit `http://localhost:5173`. Make sure the Phase 1-7 backend is running
on `:8000` (`docker compose up` from the repo root) so login/register
actually work.

### What I actually verified

Unlike the AI-dependent phases, everything here was fully testable in this
sandbox with no stand-ins:

- **`npx tsc -b`** — zero type errors
- **`npm run build`** — real production build succeeds
- **`npm run lint`** — zero ESLint errors (caught and fixed a real gap:
  browser globals weren't configured, which made every DOM type look
  "undefined" to the linter)
- **A real headless-Chromium smoke test** (Playwright) against the running
  dev server: confirmed the `/` → `/dashboard` → `/login` redirect chain
  works for a logged-out visitor, the login form renders with working
  email/password fields, empty-form submission shows validation errors
  without crashing, navigating to `/register` works, the register form
  renders correctly, and — most importantly — **zero uncaught JavaScript
  exceptions** across the whole flow. Screenshots confirmed the split-panel
  layout and redlined clause showcase render as designed.
- **A real npm audit finding** on `react-router-dom` (RSC-mode CSRF
  bypass) — confirmed via research that it only affects React Router's
  unstable RSC APIs, which this plain client-side SPA doesn't use, so it's
  not exploitable here; noted rather than forcing a disruptive v8 upgrade.

The only things that *didn't* work in-sandbox were Google Fonts loading
(this environment blocks that CDN) — cosmetic only, falls back to system
fonts, and will load normally in any real deployment.

## Phase 9 — Dashboard & AI Feature Screens (current)

Adds the screens that consume every backend endpoint from Phases 3-7:

| Page | Route | What it does |
|---|---|---|
| Dashboard | `/dashboard` | Stat cards, risk distribution bar, recent contracts, AI activity — Phase 7's `/dashboard` endpoint |
| Contracts | `/contracts` | List, search, paginate, drag-and-drop upload |
| Contract detail | `/contracts/:id` | Process button, then tabs: **Summary**, **Risk**, **Chat**, **Reports** |
| Compare | `/compare` | Pick two processed contracts, run a comparison, read the result |
| Search | `/search` | Semantic search across every contract you've uploaded |

### New structure

```
frontend/src/
├── hooks/                        # one React Query hook file per domain
│   ├── use-contracts.ts          # list, upload, process, rename, delete
│   ├── use-dashboard.ts
│   ├── use-summary.ts
│   ├── use-risk.ts
│   ├── use-chat.ts
│   ├── use-comparison.ts
│   ├── use-search.ts
│   └── use-reports.ts            # blob download w/ auth header (plain <a> can't carry it)
├── lib/
│   ├── query-keys.ts             # centralized cache-key factory
│   ├── format.ts, errors.ts, clause-labels.ts
├── components/
│   ├── ui/ (+ badge, tabs, textarea - new this phase)
│   ├── layout/app-layout.tsx     # sidebar nav shell for all authenticated pages
│   ├── contracts/ (status-badge, upload-dropzone)
│   ├── risk/severity-badge.tsx
│   └── contract-detail/          # summary-tab, risk-tab, chat-tab, reports-tab
└── pages/                        # dashboard, contracts, contract-detail, compare, search
```

Notable details:
- **Contract detail polling**: `useContract` polls every 2s while `status === "processing"`, so the UI moves from "uploaded" → "processing" → "processed" without a manual refresh.
- **Report downloads**: Phase 7's report endpoints require the `Authorization` header, which a plain `<a href>` can't send — `use-reports.ts` fetches the PDF as a blob through the authenticated axios client and triggers the download via a throwaway object URL instead.
- **Chat citations**: each assistant message shows "Grounded in N clauses from this contract" whenever `cited_chunk_ids` is non-empty, surfacing Phase 5's RAG grounding directly in the UI.

### What I actually verified

This is the most rigorously tested phase in the project so far. Rather than
static checks alone, I ran **the real backend against real Postgres, the
real React app, driven by real headless Chromium** — with only the
embedding model's weights and the LLM's text generation swapped for
deterministic stand-ins (same reason as every AI-dependent phase: this
sandbox has no route to Hugging Face or Ollama's registries). Every route,
DB write, ownership check, and pgvector query ran for real.

One continuous Playwright run exercised the entire user journey:
register → land on an empty dashboard → upload a real PDF → see it appear
in the contracts list → open it → process it (real PyMuPDF extraction) →
generate a summary → run risk analysis → send a chat message and see the
citation-grounding note → download a PDF report → return to the dashboard
and see every stat reflect that activity → cross-contract search find the
uploaded contract → sign out.

**14/14 checks passed, with zero uncaught JavaScript exceptions** across
the whole flow. `tsc -b`, `npm run build`, and `npm run lint` are all clean.

### How to try it yourself

```bash
docker compose up --build   # backend + Postgres from repo root
cd frontend && npm run dev  # in a separate terminal
```

Register a real account, upload a real contract, and click through
Summary → Risk → Chat → Reports. You'll need Ollama running (Phase 5) for
summary/risk/chat/comparison to generate real content.

## Phase 10 — DevOps, Tests, and Documentation (final phase)

This closes out the roadmap: a real pytest suite, a Vitest suite, production
Docker configs, CI, and this documentation.

### Backend tests

```
backend/tests/
├── conftest.py              # fixtures: real Postgres+pgvector, fake AI models, auth helpers
├── test_auth.py             # register/login/refresh rotation/logout
├── test_contracts.py        # upload/list/rename/delete, ownership isolation, full process→summary flow
├── test_risk_analysis.py    # JSON parsing, scoring, replace-not-accumulate, malformed-response handling
├── test_chat_and_search.py  # RAG chat with citations, cross-contract search
└── test_dashboard.py        # aggregation correctness, per-user isolation
```

**Run them:**
```bash
cd backend
createdb contract_analyzer_test
psql -d contract_analyzer_test -c "CREATE EXTENSION vector;"
TEST_DATABASE_URL="postgresql+psycopg2://postgres:postgres@localhost:5432/contract_analyzer_test" pytest tests/ -v
```

Tests run against **real Postgres with pgvector** (not SQLite) — several
things in this codebase (the `Vector` column type, enum `values_callable`
handling) behave differently or don't work at all on SQLite, and Phase 4
already surfaced a real bug that only appeared against real Postgres. Only
the embedding model's weights and the LLM's text generation are faked (same
reason as every AI-dependent phase — no sandbox route to Hugging Face or
Ollama); everything else runs for real, including actual PyMuPDF PDF
generation/extraction in the process→summary test.

**32/32 tests pass.**

### Frontend tests

```
frontend/src/
├── test/setup.ts                          # jest-dom matchers, cleanup
├── lib/format.test.ts, utils.test.ts       # pure function tests
├── lib/api-client.test.ts                  # token attach, 401→refresh→retry, rotation, refresh-failure handling
├── store/auth-store.test.ts                # session state + localStorage persistence
└── features/auth/login-page.test.tsx       # real component render + user-event interaction
```

**Run them:**
```bash
cd frontend
npm install
npm run test        # single run
npm run test:watch  # watch mode
```

**23/23 tests pass.** Writing these caught a real, subtle bug: `err
instanceof AxiosError` silently returns `false` whenever there's more than
one copy of the `axios` package in `node_modules` (easy to hit — any
dependency that bundles its own axios, like `axios-mock-adapter`, causes
this) because the class reference differs between copies. Every error
message in the app was falling through to a generic "Something went wrong"
instead of showing the real server message. Fixed by switching to
`axios.isAxiosError()` (duck-typed, works regardless of which axios
instance created the error) everywhere: `lib/errors.ts`, `login-page.tsx`,
`register-page.tsx`, `use-summary.ts`, `summary-tab.tsx`.

### Production Docker setup

```
frontend/
├── Dockerfile          # multi-stage: node build → nginx serving static assets
└── nginx.conf          # SPA fallback routing + /api/ proxy to the backend container
docker-compose.prod.yml  # overrides: no source bind-mounts, multi-worker uvicorn, restart:always, DB/Redis not internet-facing
```

**Deploy:**
```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

The frontend's `VITE_API_URL` is baked in at build time (Vite convention —
env vars aren't readable once static files are served by nginx). Pass it
as a build arg if the API doesn't live at `/api` on the same origin.

**Honest limitation**: this sandbox has no Docker daemon, so I couldn't
actually run `docker build`/`docker compose up` here the way I ran real
tests for everything else. I did verify every file the Dockerfiles
reference exists at the correct path, and the compose service wiring
(healthcheck-gated `depends_on`, network names matching nginx's
`proxy_pass http://backend:8000`) is consistent with what's actually in
`docker-compose.yml`. Test this step for real on your machine before
relying on it.

### CI

`.github/workflows/ci.yml` runs on every push/PR to `main`:
- **backend job**: spins up a `pgvector/pgvector:pg16` service container,
  installs deps, enables the extension, runs the exact same pytest suite
  described above
- **frontend job**: `npm ci` → typecheck → lint → test → build

I mirrored the CI backend job's exact steps locally (fresh test DB,
`TEST_DATABASE_URL` env var, same pytest invocation) and confirmed it
passes — the workflow isn't just written, it's been dry-run.

## Project status: roadmap complete

All 10 phases are done: scaffolding, auth, document management, extraction/
OCR/embeddings, RAG chat + summaries, risk detection/comparison/search,
dashboard + reports, and now a full frontend, tested end-to-end, with CI
and production deploy configs.

**What to do before a real production launch** (not covered by this
build, since they're operational decisions specific to your deployment,
not code):
- Move tokens from `localStorage` to httpOnly cookies (noted in Phase 8) —
  requires a backend change to issue `Set-Cookie` on login/refresh
- Rotate `JWT_SECRET_KEY` and every default password in `.env` before
  deploying anywhere real
- Set up log aggregation/monitoring/alerting for the backend
- Decide on a real object storage backend (S3/GCS) if you expect to
  outgrow local disk for `UPLOAD_DIR`
- Load-test the Ollama-backed endpoints (summary/risk/chat/comparison) —
  LLM inference latency scales very differently from the rest of this API
- Add rate limiting (mentioned in the original spec's security section,
  not yet implemented) in front of the auth and AI endpoints specifically