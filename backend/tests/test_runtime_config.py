from __future__ import annotations

from pathlib import Path

import pytest

from app.core import config
from app.core.config import SettingsError


CONFIG_KEYS = (
    "APP_ENV",
    "APP_DEBUG",
    "ADMIN_USERNAME",
    "ADMIN_PASSWORD",
    "CORS_ALLOWED_ORIGINS",
    "TRUSTED_HOSTS",
    "WEBSITE_HOSTNAME",
    "SQLITE_DATABASE_PATH",
    "SQLITE_REQUIRE_EXISTING",
    "SQLITE_BUSY_TIMEOUT_MS",
    "LOG_LEVEL",
    "ENABLE_API_DOCS",
    "DATABASE_URL",
    "API_DOCS_ENABLED",
    "API_DOCS_USERNAME",
    "API_DOCS_PASSWORD",
)


@pytest.fixture
def clean_config_env(monkeypatch: pytest.MonkeyPatch):
    for key in CONFIG_KEYS:
        monkeypatch.delenv(key, raising=False)

    config.clear_settings_cache()

    yield monkeypatch

    config.clear_settings_cache()


@pytest.fixture
def persistent_sqlite_path():
    path = (config.BACKEND_ROOT.parent / ".qa_config_runtime.sqlite3").resolve()
    path.write_text("", encoding="utf-8")

    try:
        yield path
    finally:
        path.unlink(missing_ok=True)


def set_base_production_env(monkeypatch: pytest.MonkeyPatch, sqlite_path: Path) -> None:
    monkeypatch.setenv("APP_ENV", "production")
    monkeypatch.setenv("APP_DEBUG", "false")
    monkeypatch.setenv("ADMIN_USERNAME", "qa_admin_user")
    monkeypatch.setenv("ADMIN_PASSWORD", "qa_admin_password_secret")
    monkeypatch.setenv("CORS_ALLOWED_ORIGINS", "https://frontend.example.invalid")
    monkeypatch.setenv("TRUSTED_HOSTS", "api.example.invalid")
    monkeypatch.setenv("SQLITE_DATABASE_PATH", str(sqlite_path))
    monkeypatch.setenv("SQLITE_REQUIRE_EXISTING", "true")
    monkeypatch.setenv("LOG_LEVEL", "INFO")


def test_development_settings_keep_local_defaults(clean_config_env):
    clean_config_env.setenv("APP_ENV", "development")
    clean_config_env.setenv("ADMIN_USERNAME", "local_admin")
    clean_config_env.setenv("ADMIN_PASSWORD", "local_password")

    settings = config.get_settings()

    assert settings.app_env == "development"
    assert "http://localhost:5173" in settings.cors_allowed_origins
    assert "testserver" in settings.trusted_hosts
    assert settings.api_docs_enabled is True
    assert settings.sqlite_database_path.name == "portfolio.db"


def test_invalid_app_env_is_rejected(clean_config_env):
    clean_config_env.setenv("APP_ENV", "invalid")

    with pytest.raises(SettingsError, match="APP_ENV"):
        config.get_settings()


def test_production_rejects_missing_credentials(clean_config_env, persistent_sqlite_path):
    set_base_production_env(clean_config_env, persistent_sqlite_path)
    clean_config_env.delenv("ADMIN_PASSWORD")

    with pytest.raises(SettingsError, match="ADMIN_PASSWORD"):
        config.get_settings()


def test_staging_rejects_debug_enabled(clean_config_env, persistent_sqlite_path):
    set_base_production_env(clean_config_env, persistent_sqlite_path)
    clean_config_env.setenv("APP_ENV", "staging")
    clean_config_env.setenv("APP_DEBUG", "true")

    with pytest.raises(SettingsError, match="APP_DEBUG"):
        config.get_settings()


def test_production_rejects_placeholder_credentials(clean_config_env, persistent_sqlite_path):
    set_base_production_env(clean_config_env, persistent_sqlite_path)
    clean_config_env.setenv("ADMIN_PASSWORD", "change_me")

    with pytest.raises(SettingsError, match="ADMIN_PASSWORD"):
        config.get_settings()


def test_production_rejects_empty_cors(clean_config_env, persistent_sqlite_path):
    set_base_production_env(clean_config_env, persistent_sqlite_path)
    clean_config_env.delenv("CORS_ALLOWED_ORIGINS")

    with pytest.raises(SettingsError, match="CORS_ALLOWED_ORIGINS"):
        config.get_settings()


def test_production_rejects_wildcard_cors(clean_config_env, persistent_sqlite_path):
    set_base_production_env(clean_config_env, persistent_sqlite_path)
    clean_config_env.setenv("CORS_ALLOWED_ORIGINS", "*")

    with pytest.raises(SettingsError, match="CORS_ALLOWED_ORIGINS"):
        config.get_settings()


def test_cors_origins_are_normalized(clean_config_env, persistent_sqlite_path):
    set_base_production_env(clean_config_env, persistent_sqlite_path)
    clean_config_env.setenv(
        "CORS_ALLOWED_ORIGINS",
        "https://frontend.example.invalid/,https://admin.example.invalid",
    )

    settings = config.get_settings()

    assert settings.cors_allowed_origins == (
        "https://frontend.example.invalid",
        "https://admin.example.invalid",
    )


def test_production_rejects_relative_sqlite_path(clean_config_env):
    clean_config_env.setenv("APP_ENV", "production")
    clean_config_env.setenv("APP_DEBUG", "false")
    clean_config_env.setenv("ADMIN_USERNAME", "qa_admin_user")
    clean_config_env.setenv("ADMIN_PASSWORD", "qa_admin_password_secret")
    clean_config_env.setenv("CORS_ALLOWED_ORIGINS", "https://frontend.example.invalid")
    clean_config_env.setenv("TRUSTED_HOSTS", "api.example.invalid")
    clean_config_env.setenv("SQLITE_DATABASE_PATH", "./portfolio.db")
    clean_config_env.setenv("SQLITE_REQUIRE_EXISTING", "true")

    with pytest.raises(SettingsError, match="SQLITE_DATABASE_PATH"):
        config.get_settings()


def test_sqlite_memory_is_rejected(clean_config_env):
    clean_config_env.setenv("APP_ENV", "development")
    clean_config_env.setenv("DATABASE_URL", "sqlite:///:memory:")

    with pytest.raises(SettingsError, match="memory"):
        config.get_settings()


def test_production_rejects_tmp_sqlite_path(clean_config_env, tmp_path):
    clean_config_env.setenv("APP_ENV", "production")
    clean_config_env.setenv("APP_DEBUG", "false")
    clean_config_env.setenv("ADMIN_USERNAME", "qa_admin_user")
    clean_config_env.setenv("ADMIN_PASSWORD", "qa_admin_password_secret")
    clean_config_env.setenv("CORS_ALLOWED_ORIGINS", "https://frontend.example.invalid")
    clean_config_env.setenv("TRUSTED_HOSTS", "api.example.invalid")
    clean_config_env.setenv("SQLITE_DATABASE_PATH", str(tmp_path / "portfolio.db"))
    clean_config_env.setenv("SQLITE_REQUIRE_EXISTING", "true")

    with pytest.raises(SettingsError, match="temporal"):
        config.get_settings()


def test_missing_required_database_is_rejected(clean_config_env, persistent_sqlite_path):
    missing_path = persistent_sqlite_path.with_name("missing_runtime.sqlite3")
    set_base_production_env(clean_config_env, missing_path)

    with pytest.raises(SettingsError, match="no existe"):
        config.get_settings()


def test_invalid_log_level_is_rejected(clean_config_env):
    clean_config_env.setenv("APP_ENV", "development")
    clean_config_env.setenv("LOG_LEVEL", "VERBOSE")

    with pytest.raises(SettingsError, match="LOG_LEVEL"):
        config.get_settings()


def test_environment_does_not_require_real_dotenv(clean_config_env, tmp_path):
    clean_config_env.setenv("APP_ENV", "test")
    clean_config_env.setenv("DATABASE_URL", f"sqlite:///{(tmp_path / 'qa.sqlite3').as_posix()}")
    clean_config_env.setenv("ADMIN_USERNAME", "qa_user")
    clean_config_env.setenv("ADMIN_PASSWORD", "qa_password")

    settings = config.get_settings()

    assert settings.app_env == "test"
    assert settings.admin_username == "qa_user"
