"""
Shared pytest fixtures.

Tests run against a REAL Postgres database with the pgvector extension -
not SQLite - because several models (DocumentChunk.embedding, enum columns
using values_callable) behave differently or don't work at all on SQLite.
Point TEST_DATABASE_URL at a real Postgres instance with pgvector enabled;
see README "Running tests" for setup.

The embedding model and LLM's text generation are the only things faked
(via monkeypatch) - everything else (routing, validation, DB writes,
pgvector queries, ownership checks) runs against real code paths.
"""

import hashlib
import os
import uuid

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

os.environ.setdefault(
    "DATABASE_URL",
    os.environ.get(
        "TEST_DATABASE_URL",
        "postgresql+psycopg2://postgres:postgres@localhost:5432/contract_analyzer_test",
    ),
)
os.environ.setdefault("UPLOAD_DIR", "/tmp/aca-test-storage")

import app.models  # noqa: E402  (populates Base.metadata; import after env vars set)
from app.core.database import Base, engine
from app.main import app as fastapi_app
from app.services import embedding_service as es_module
from app.services import llm_service as llm_module


@pytest.fixture(scope="session", autouse=True)
def _create_schema():
    """Creates every table once per test session, drops them at the end.
    Uses Base.metadata directly rather than running Alembic migrations -
    faster for tests, and Alembic itself is exercised separately (see
    README's manual migration verification notes)."""
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture(autouse=True)
def _clean_tables():
    """Truncates every table between tests so they don't leak state into
    each other, without paying the cost of recreating the schema each time."""
    yield
    with engine.begin() as conn:
        table_names = ", ".join(f'"{t.name}"' for t in reversed(Base.metadata.sorted_tables))
        conn.exec_driver_sql(f"TRUNCATE {table_names} RESTART IDENTITY CASCADE")


@pytest.fixture(autouse=True)
def _fake_ai_models(monkeypatch):
    """
    Fakes only the two things that need internet access to real model
    registries (Hugging Face for embeddings, Ollama for the LLM) - every
    other code path (retrieval's pgvector query, prompt construction,
    parsing, ownership checks) runs for real against the fake outputs.
    """

    def fake_embed(self, texts):
        def vec(t):
            h = hashlib.sha256(t.encode()).digest()
            return [(b / 255.0) for b in (h * 12)[:384]]

        return [vec(t) for t in texts]

    monkeypatch.setattr(es_module.EmbeddingService, "embed", fake_embed)

    def fake_generate(self, system_prompt, messages):
        return f"[test-generated response] {messages[-1]['content'][:100]}"

    monkeypatch.setattr(llm_module.LLMService, "generate", fake_generate)


@pytest.fixture
def client():
    return TestClient(fastapi_app)


@pytest.fixture
def db_session():
    SessionLocal = sessionmaker(bind=engine)
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


def _unique_email() -> str:
    return f"test-{uuid.uuid4().hex[:12]}@example.com"


@pytest.fixture
def registered_user(client):
    """Registers and logs in a fresh user, returns (headers, user_json)."""
    email = _unique_email()
    password = "supersecret123"
    client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": password, "full_name": "Test User"},
    )
    response = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    tokens = response.json()
    headers = {"Authorization": f"Bearer {tokens['access_token']}"}
    me = client.get("/api/v1/auth/me", headers=headers).json()
    return headers, me


@pytest.fixture
def auth_headers(registered_user):
    headers, _ = registered_user
    return headers