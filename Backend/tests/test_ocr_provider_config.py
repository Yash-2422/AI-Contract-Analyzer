import pytest
from pydantic import ValidationError

from app.core.config import Settings


@pytest.mark.parametrize("provider", ["local", "gemini"])
def test_ocr_provider_accepts_supported_environment_values(monkeypatch, provider):
    monkeypatch.setenv("OCR_PROVIDER", provider)

    assert Settings(_env_file=None).OCR_PROVIDER == provider


def test_ocr_provider_defaults_to_local(monkeypatch):
    monkeypatch.delenv("OCR_PROVIDER", raising=False)

    assert Settings(_env_file=None).OCR_PROVIDER == "local"


@pytest.mark.parametrize("provider", ["paddleocr", "Gemini", ""])
def test_ocr_provider_rejects_unsupported_environment_values(monkeypatch, provider):
    monkeypatch.setenv("OCR_PROVIDER", provider)

    with pytest.raises(ValidationError, match="OCR_PROVIDER"):
        Settings(_env_file=None)
