import httpx
import pytest
from fastapi import HTTPException

from app.core.config import settings
from app.services import llm_service as llm_module
from app.services import ocr_service as ocr_module
from app.services import gemini_retry
from app.services.llm_service import LLMService
from app.services.ocr_service import OCRService


def response(status_code, body=None, headers=None):
    return httpx.Response(
        status_code,
        json=body or {"choices": [{"message": {"content": "A change to contract terms."}}]},
        headers=headers,
        request=httpx.Request("POST", "https://example.test/chat/completions"),
    )


def configure_gemini(monkeypatch):
    monkeypatch.setattr(settings, "LLM_PROVIDER", "gemini")
    monkeypatch.setattr(settings, "OCR_PROVIDER", "gemini")
    monkeypatch.setattr(settings, "GEMINI_API_KEY", "test-secret")
    monkeypatch.setattr(settings, "GEMINI_MODEL_NAME", "test-model")
    monkeypatch.setattr(settings, "GEMINI_BASE_URL", "https://example.test/v1beta/openai")
    monkeypatch.setattr(gemini_retry.time, "sleep", lambda _delay: None)


def test_llm_retries_transient_http_status_then_succeeds(monkeypatch):
    configure_gemini(monkeypatch)
    replies = iter([response(503), response(200)])
    calls = []

    def fake_post(*args, **kwargs):
        calls.append((args, kwargs))
        return next(replies)

    monkeypatch.setattr(llm_module.httpx, "post", fake_post)
    result = LLMService()._gemini_generate("system", [{"role": "user", "content": "synthetic"}])

    assert result == "A change to contract terms."
    assert len(calls) == 2
    assert calls[0][1]["json"]["model"] == "test-model"


def test_llm_stream_retries_before_emitting_content(monkeypatch):
    configure_gemini(monkeypatch)

    class StreamResponse:
        def __init__(self, status_code):
            self.status_code = status_code
            self.headers = httpx.Headers()

        def __enter__(self):
            return self

        def __exit__(self, *_args):
            return False

        def read(self):
            return b""

        def iter_lines(self):
            return iter([
                'data: {"choices":[{"delta":{"content":"Recovered response."}}]}',
                "data: [DONE]",
            ])

    calls = []
    replies = iter([StreamResponse(503), StreamResponse(200)])
    monkeypatch.setattr(llm_module.httpx, "stream", lambda *a, **k: calls.append(1) or next(replies))

    result = list(LLMService()._gemini_stream("system", [{"role": "user", "content": "synthetic"}]))

    assert result == ["Recovered response."]
    assert len(calls) == 2


def test_llm_exhausted_retries_preserve_sanitized_error(monkeypatch, caplog):
    configure_gemini(monkeypatch)
    calls = []
    monkeypatch.setattr(llm_module.httpx, "post", lambda *a, **k: calls.append(1) or response(503))

    with pytest.raises(HTTPException) as exc_info:
        LLMService()._gemini_generate("system", [{"role": "user", "content": "synthetic"}])

    assert exc_info.value.status_code == 502
    assert exc_info.value.detail == "The AI service returned an error. Please try again."
    assert len(calls) == 3
    assert "test-secret" not in caplog.text
    assert "synthetic" not in caplog.text


@pytest.mark.parametrize("error", [httpx.ReadTimeout("timeout"), httpx.ConnectError("connection")])
def test_llm_retries_timeout_and_connection_errors(monkeypatch, error):
    configure_gemini(monkeypatch)
    calls = []

    def fake_post(*args, **kwargs):
        calls.append(1)
        if len(calls) == 1:
            raise error
        return response(200)

    monkeypatch.setattr(llm_module.httpx, "post", fake_post)
    assert LLMService()._gemini_generate("system", [{"role": "user", "content": "synthetic"}])
    assert len(calls) == 2


def test_ocr_retries_transient_failures_and_sanitizes_exhaustion(monkeypatch):
    configure_gemini(monkeypatch)
    replies = iter([response(502), response(504), response(503)])
    calls = []
    monkeypatch.setattr(ocr_module.httpx, "post", lambda *a, **k: calls.append(1) or next(replies))

    with pytest.raises(HTTPException) as exc_info:
        OCRService()._gemini_ocr(b"synthetic image")

    assert exc_info.value.status_code == 502
    assert exc_info.value.detail == "Gemini OCR request failed."
    assert len(calls) == 3


def test_ocr_timeout_exhaustion_keeps_sanitized_error_and_cause(monkeypatch, caplog):
    configure_gemini(monkeypatch)
    calls = []

    def timeout(*_args, **_kwargs):
        calls.append(1)
        raise httpx.ReadTimeout("synthetic transport detail")

    monkeypatch.setattr(ocr_module.httpx, "post", timeout)
    with pytest.raises(HTTPException) as exc_info:
        OCRService()._gemini_ocr(b"synthetic image data")

    assert exc_info.value.status_code == 502
    assert exc_info.value.detail == "Gemini OCR service could not be reached."
    assert isinstance(exc_info.value.__cause__, httpx.ReadTimeout)
    assert len(calls) == 3
    assert "synthetic transport detail" not in caplog.text
    assert "synthetic image data" not in caplog.text


@pytest.mark.parametrize("status_code", [400, 401, 403, 429])
def test_non_transient_statuses_are_not_retried(monkeypatch, status_code):
    configure_gemini(monkeypatch)
    calls = []
    monkeypatch.setattr(llm_module.httpx, "post", lambda *a, **k: calls.append(1) or response(status_code))

    with pytest.raises(HTTPException) as exc_info:
        LLMService()._gemini_generate("system", [{"role": "user", "content": "synthetic"}])

    assert len(calls) == 1
    assert exc_info.value.status_code == (429 if status_code == 429 else 502)


def test_retry_after_is_respected_and_capped(monkeypatch):
    delays = []
    monkeypatch.setattr(gemini_retry.time, "sleep", delays.append)
    replies = iter([response(503, headers={"Retry-After": "30"}), response(200)])

    result = gemini_retry.request_with_retries("test", lambda: next(replies))

    assert result.status_code == 200
    assert delays == [gemini_retry.MAX_RETRY_DELAY_SECONDS]
