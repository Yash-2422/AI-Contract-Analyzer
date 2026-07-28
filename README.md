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

## What's next (Phase 2)

Authentication: register, login, JWT + refresh tokens, password hashing,
protected routes, and the `User` model/repository/service — built on top of
this exact skeleton without changing anything above.