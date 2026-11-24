import pytest
from pydantic import ValidationError

from app.core.config import Settings


def test_default_providers_remain_local(monkeypatch):
    for name in (
        "LLM_PROVIDER",
        "OCR_PROVIDER",
        "EMBEDDING_PROVIDER",
        "GEMINI_MODEL_NAME",
    ):
        monkeypatch.delenv(name, raising=False)
    settings = Settings(_env_file=None)

    assert settings.LLM_PROVIDER == "ollama"
    assert settings.OCR_PROVIDER == "local"
    assert settings.EMBEDDING_PROVIDER == "local"
    assert settings.GEMINI_MODEL_NAME == "gemini-3.1-flash-lite"


def test_hosted_providers_are_valid():
    settings = Settings(
        _env_file=None,
        LLM_PROVIDER="gemini",
        OCR_PROVIDER="gemini",
        EMBEDDING_PROVIDER="gemini",
    )

    assert settings.LLM_PROVIDER == "gemini"
    assert settings.OCR_PROVIDER == "gemini"
    assert settings.EMBEDDING_PROVIDER == "gemini"


@pytest.mark.parametrize(
    ("field", "value"),
    [
        ("LLM_PROVIDER", "unknown"),
        ("OCR_PROVIDER", "paddle"),
        ("EMBEDDING_PROVIDER", "bge-cloud"),
    ],
)
def test_unknown_provider_values_fail_configuration(field, value):
    with pytest.raises(ValidationError, match=field):
        Settings(_env_file=None, **{field: value})
