from pathlib import Path

from app.core.config import Settings


def test_cors_origins_parse_exact_comma_separated_origins():
    settings = Settings(
        _env_file=None,
        ALLOWED_ORIGINS="https://contracts.example.com, https://admin.example.com",
    )

    assert settings.cors_origins == [
        "https://contracts.example.com",
        "https://admin.example.com",
    ]


def test_empty_cors_origins_disables_cross_origin_allowlist():
    settings = Settings(_env_file=None, ALLOWED_ORIGINS=" , ")

    assert settings.cors_origins == []


def test_production_compose_passes_optional_cors_origins():
    compose_file = Path(__file__).resolve().parents[2] / "docker-compose.prod.yml"

    assert 'ALLOWED_ORIGINS: "${ALLOWED_ORIGINS:-}"' in compose_file.read_text(
        encoding="utf-8"
    )
