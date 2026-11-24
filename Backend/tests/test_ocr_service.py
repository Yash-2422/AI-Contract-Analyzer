import base64

import pytest
from fastapi import HTTPException

from app.core.config import settings
from app.services import ocr_service as ocr_module
from app.services.ocr_service import OCRService


class FakePixmap:
    def tobytes(self, image_format):
        assert image_format == "png"
        return b"synthetic-page-image"


class FakePage:
    def get_pixmap(self, matrix):
        return FakePixmap()


class FakePdf:
    def __enter__(self):
        return self

    def __exit__(self, *_args):
        return False

    def __getitem__(self, page_index):
        assert page_index == 0
        return FakePage()


class FakeResponse:
    def __init__(self, status_code, body):
        self.status_code = status_code
        self._body = body

    def json(self):
        return self._body


def mock_pdf(monkeypatch):
    monkeypatch.setattr(ocr_module.fitz, "open", lambda _path: FakePdf())


def test_gemini_ocr_sends_rendered_page_and_returns_transcription(monkeypatch, tmp_path):
    monkeypatch.setattr(settings, "OCR_PROVIDER", "gemini")
    monkeypatch.setattr(settings, "GEMINI_API_KEY", "unit-test-key")
    monkeypatch.setattr(settings, "GEMINI_MODEL_NAME", "test-vision-model")
    monkeypatch.setattr(
        settings,
        "GEMINI_BASE_URL",
        "https://generativelanguage.googleapis.com/v1beta/openai",
    )
    mock_pdf(monkeypatch)
    calls = []

    def fake_post(url, **kwargs):
        calls.append((url, kwargs))
        return FakeResponse(
            200,
            {"choices": [{"message": {"content": "Payment is due in 30 days."}}]},
        )

    monkeypatch.setattr(ocr_module.httpx, "post", fake_post)

    result = OCRService().ocr_pdf_page(tmp_path / "synthetic.pdf", 1)

    assert result == "Payment is due in 30 days."
    assert calls[0][0].endswith("/openai/chat/completions")
    assert calls[0][1]["json"]["model"] == "test-vision-model"
    assert calls[0][1]["headers"]["Authorization"] == "Bearer unit-test-key"
    image_part = calls[0][1]["json"]["messages"][0]["content"][1]["image_url"]
    assert image_part["url"].startswith("data:image/png;base64,")
    assert base64.b64decode(image_part["url"].split(",", 1)[1]) == (
        b"synthetic-page-image"
    )


def test_local_provider_still_uses_paddleocr_path(monkeypatch, tmp_path):
    monkeypatch.setattr(settings, "OCR_PROVIDER", "local")
    mock_pdf(monkeypatch)

    class FakeEngine:
        def ocr(self, image_bytes, cls):
            assert image_bytes == b"synthetic-page-image"
            assert cls is True
            return [[(None, ("Local transcription", 0.99))]]

    service = OCRService()
    monkeypatch.setattr(service, "_get_engine", lambda: FakeEngine())

    assert service.ocr_pdf_page(tmp_path / "synthetic.pdf", 1) == "Local transcription"


def test_gemini_ocr_missing_key_fails_without_request(monkeypatch, tmp_path):
    monkeypatch.setattr(settings, "OCR_PROVIDER", "gemini")
    monkeypatch.setattr(settings, "GEMINI_API_KEY", "")
    mock_pdf(monkeypatch)

    with pytest.raises(HTTPException) as exc_info:
        OCRService().ocr_pdf_page(tmp_path / "synthetic.pdf", 1)

    assert exc_info.value.status_code == 503


def test_gemini_ocr_rate_limit_is_reported_as_429(monkeypatch, tmp_path):
    monkeypatch.setattr(settings, "OCR_PROVIDER", "gemini")
    monkeypatch.setattr(settings, "GEMINI_API_KEY", "unit-test-key")
    mock_pdf(monkeypatch)
    monkeypatch.setattr(
        ocr_module.httpx,
        "post",
        lambda *args, **kwargs: FakeResponse(429, {}),
    )

    with pytest.raises(HTTPException) as exc_info:
        OCRService().ocr_pdf_page(tmp_path / "synthetic.pdf", 1)

    assert exc_info.value.status_code == 429
