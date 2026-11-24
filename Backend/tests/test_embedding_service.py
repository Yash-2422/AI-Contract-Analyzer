import pytest
from fastapi import HTTPException

from app.core.config import settings
from app.services import embedding_service as embedding_module
from app.services.embedding_service import EmbeddingService


class FakeResponse:
    def __init__(self, status_code, body):
        self.status_code = status_code
        self._body = body

    def json(self):
        return self._body


def test_gemini_uses_matching_query_and_document_prefixes(monkeypatch):
    monkeypatch.setattr(settings, "EMBEDDING_PROVIDER", "gemini")
    monkeypatch.setattr(settings, "GEMINI_API_KEY", "unit-test-key")
    calls = []

    def fake_post(url, **kwargs):
        calls.append((url, kwargs))
        requests = kwargs["json"]["requests"]
        return FakeResponse(
            200,
            {"embeddings": [{"values": [0.0] * 384} for _ in requests]},
        )

    monkeypatch.setattr(embedding_module.httpx, "post", fake_post)
    service = EmbeddingService()

    document_vectors = service.embed(["Payment is due within 30 days."])
    query_vector = service.embed_one("When is payment due?")

    assert len(document_vectors) == 1
    assert len(document_vectors[0]) == 384
    assert len(query_vector) == 384
    assert calls[0][1]["json"]["requests"][0]["content"]["parts"][0]["text"] == (
        "title: none | text: Payment is due within 30 days."
    )
    assert calls[1][1]["json"]["requests"][0]["content"]["parts"][0]["text"] == (
        "task: search result | query: When is payment due?"
    )
    assert calls[0][1]["json"]["requests"][0]["embedContentConfig"] == {
        "outputDimensionality": 384
    }


def test_local_provider_still_uses_bge_path(monkeypatch):
    monkeypatch.setattr(settings, "EMBEDDING_PROVIDER", "local")

    class FakeModel:
        def encode(self, texts, normalize_embeddings):
            assert texts == ["local text"]
            assert normalize_embeddings is True
            return [FakeVector()]

    class FakeVector:
        def tolist(self):
            return [0.25] * 384

    service = EmbeddingService()
    monkeypatch.setattr(service, "_get_model", lambda: FakeModel())

    assert service.embed_one("local text") == [0.25] * 384


def test_gemini_missing_key_fails_without_request(monkeypatch):
    monkeypatch.setattr(settings, "GEMINI_API_KEY", "")

    with pytest.raises(HTTPException) as exc_info:
        EmbeddingService()._gemini_embed(["synthetic text"])

    assert exc_info.value.status_code == 503


def test_gemini_rate_limit_is_reported_as_429(monkeypatch):
    monkeypatch.setattr(settings, "GEMINI_API_KEY", "unit-test-key")
    monkeypatch.setattr(
        embedding_module.httpx,
        "post",
        lambda *args, **kwargs: FakeResponse(429, {}),
    )

    with pytest.raises(HTTPException) as exc_info:
        EmbeddingService()._gemini_embed(["synthetic text"])

    assert exc_info.value.status_code == 429


def test_gemini_rejects_wrong_vector_dimensions(monkeypatch):
    monkeypatch.setattr(settings, "GEMINI_API_KEY", "unit-test-key")
    monkeypatch.setattr(
        embedding_module.httpx,
        "post",
        lambda *args, **kwargs: FakeResponse(
            200, {"embeddings": [{"values": [0.0] * 383}]}
        ),
    )

    with pytest.raises(HTTPException) as exc_info:
        EmbeddingService()._gemini_embed(["synthetic text"])

    assert exc_info.value.status_code == 502
