from __future__ import annotations

from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.core import config
from app.scripts import validate_azure_app_service as validator


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
    "DATABASE_URL",
)


@pytest.fixture
def clean_config_env(monkeypatch: pytest.MonkeyPatch):
    for key in CONFIG_KEYS:
        monkeypatch.delenv(key, raising=False)

    config.clear_settings_cache()

    yield monkeypatch

    config.clear_settings_cache()


@pytest.fixture
def azure_persistent_sqlite_path():
    persistent_root = config.BACKEND_ROOT.parent / ".qa_azure_app_service" / "home" / "data"
    sqlite_path = persistent_root / "portfolio.db"
    persistent_root.mkdir(parents=True, exist_ok=True)
    sqlite_path.write_text("", encoding="utf-8")

    try:
        yield sqlite_path.resolve()
    finally:
        sqlite_path.unlink(missing_ok=True)
        for parent in [persistent_root, persistent_root.parent, persistent_root.parent.parent]:
            try:
                parent.rmdir()
            except OSError:
                pass


def test_startup_script_uses_single_worker_without_mutating_commands():
    startup_text = validator.STARTUP_PATH.read_text(encoding="utf-8")

    assert "exec python -m uvicorn app.main:app" in startup_text
    assert "--workers 1" in startup_text
    assert "--reload" not in startup_text
    assert "reset_db" not in startup_text
    assert "seed_db" not in startup_text
    assert "update_db" not in startup_text
    assert "migrate_professional_content_fields" not in startup_text
    assert "sync_professional_portfolio" not in startup_text
    assert "pip install" not in startup_text
    assert "create_all" not in startup_text


def test_production_accepts_existing_persistent_sqlite_outside_code_root(
    clean_config_env,
    azure_persistent_sqlite_path,
):
    clean_config_env.setenv("APP_ENV", "production")
    clean_config_env.setenv("APP_DEBUG", "false")
    clean_config_env.setenv("ADMIN_USERNAME", "qa_admin_user")
    clean_config_env.setenv("ADMIN_PASSWORD", "qa_admin_password_secret")
    clean_config_env.setenv("CORS_ALLOWED_ORIGINS", "https://frontend.example.invalid")
    clean_config_env.setenv("TRUSTED_HOSTS", "api.example.invalid")
    clean_config_env.setenv("SQLITE_DATABASE_PATH", str(azure_persistent_sqlite_path))
    clean_config_env.setenv("SQLITE_REQUIRE_EXISTING", "true")

    settings = config.get_settings()

    assert settings.sqlite_database_path == azure_persistent_sqlite_path
    assert settings.sqlite_require_existing is True


def test_website_hostname_is_added_to_trusted_hosts(
    clean_config_env,
    azure_persistent_sqlite_path,
):
    clean_config_env.setenv("APP_ENV", "production")
    clean_config_env.setenv("APP_DEBUG", "false")
    clean_config_env.setenv("ADMIN_USERNAME", "qa_admin_user")
    clean_config_env.setenv("ADMIN_PASSWORD", "qa_admin_password_secret")
    clean_config_env.setenv("CORS_ALLOWED_ORIGINS", "https://frontend.example.invalid")
    clean_config_env.setenv("TRUSTED_HOSTS", "api.example.invalid")
    clean_config_env.setenv("WEBSITE_HOSTNAME", "runtime-host.example.invalid")
    clean_config_env.setenv("SQLITE_DATABASE_PATH", str(azure_persistent_sqlite_path))
    clean_config_env.setenv("SQLITE_REQUIRE_EXISTING", "true")

    settings = config.get_settings()

    assert "api.example.invalid" in settings.trusted_hosts
    assert "runtime-host.example.invalid" in settings.trusted_hosts


def test_health_response_does_not_expose_database_path(client: TestClient):
    response = client.get("/health")

    assert response.status_code == 200
    assert "portfolio.db" not in response.text
    assert str(config.BACKEND_ROOT) not in response.text


def test_ready_response_does_not_expose_database_path(client: TestClient):
    response = client.get("/ready")

    assert response.status_code == 200
    assert "portfolio.db" not in response.text
    assert str(config.BACKEND_ROOT) not in response.text


def test_app_service_workflow_template_is_inactive_and_uses_oidc():
    workflow_path = validator.WORKFLOW_TEMPLATE_PATH
    workflow_text = workflow_path.read_text(encoding="utf-8")

    assert ".github" not in workflow_path.parts
    assert workflow_path.name.endswith(".example")
    assert "permissions:" in workflow_text
    assert "id-token: write" in workflow_text
    assert "azure/login@v2" in workflow_text
    assert "azure/webapps-deploy@v3" in workflow_text
    assert "package: backend" in workflow_text
    assert "vars.AZURE_WEBAPP_NAME" in workflow_text
    assert "secrets.AZURE_CLIENT_ID" in workflow_text
    assert "portfolio.db" not in workflow_text
    assert "seed_db" not in workflow_text
    assert "reset_db" not in workflow_text


def test_app_service_settings_template_points_sqlite_to_persistent_home_data():
    settings_text = validator.SETTINGS_TEMPLATE_PATH.read_text(encoding="utf-8")

    assert "SQLITE_DATABASE_PATH=/home/data/portfolio.db" in settings_text
    assert "SQLITE_REQUIRE_EXISTING=true" in settings_text
    assert "SCM_DO_BUILD_DURING_DEPLOYMENT=true" in settings_text
    assert "<SET_IN_AZURE>" in settings_text
    assert "azurewebsites.net" not in settings_text
    assert "staticapps.net" not in settings_text


def test_backend_package_validator_passes():
    assert validator.main() == 0


def test_backend_package_does_not_track_database_or_local_artifacts():
    tracked_files = set(validator._run_git(["ls-files"]))

    assert "backend/portfolio.db" not in tracked_files
    assert not any(path.startswith("backend/venv/") for path in tracked_files)
    assert not any(path.startswith("backend/backups/") for path in tracked_files)
    assert not any(Path(path).name == ".env" for path in tracked_files)
