"""Validate the backend package shape expected by Azure App Service."""

from __future__ import annotations

import re
import subprocess
import sys
from pathlib import Path


BACKEND_ROOT = Path(__file__).resolve().parents[2]
REPO_ROOT = BACKEND_ROOT.parent
STARTUP_PATH = BACKEND_ROOT / "startup.sh"
REQUIREMENTS_PATH = BACKEND_ROOT / "requirements.txt"
APP_MAIN_PATH = BACKEND_ROOT / "app" / "main.py"
WORKFLOW_TEMPLATE_PATH = (
    REPO_ROOT / "docs" / "deployment" / "azure-app-service.workflow.yml.example"
)
SETTINGS_TEMPLATE_PATH = (
    REPO_ROOT / "docs" / "deployment" / "azure-app-service.settings.env.example"
)
ACTIVE_WORKFLOWS_DIR = REPO_ROOT / ".github" / "workflows"

FORBIDDEN_TRACKED_PREFIXES = (
    "backend/venv/",
    "backend/backups/",
)
FORBIDDEN_TRACKED_FILES = {
    "backend/portfolio.db",
    "backend/.env",
    ".env",
}
FORBIDDEN_TEMPLATE_PATTERNS = (
    re.compile(r"azurewebsites\.net", re.IGNORECASE),
    re.compile(r"staticapps\.net", re.IGNORECASE),
    re.compile(r"publish[_-]?profile", re.IGNORECASE),
    re.compile(r"Authorization:\s*Basic\s+[A-Za-z0-9+/=]+", re.IGNORECASE),
    re.compile(r"Basic\s+[A-Za-z0-9+/=]{12,}", re.IGNORECASE),
    re.compile(r"client[_-]?secret\s*[:=]", re.IGNORECASE),
    re.compile(r"connection\s*string\s*[:=]", re.IGNORECASE),
)


class ValidationError(RuntimeError):
    """Raised when the Azure App Service package contract is invalid."""


def _run_git(args: list[str]) -> list[str]:
    result = subprocess.run(
        ["git", *args],
        cwd=REPO_ROOT,
        check=True,
        capture_output=True,
        text=True,
    )
    return [line.strip() for line in result.stdout.splitlines() if line.strip()]


def _read_text(path: Path) -> str:
    if not path.exists():
        raise ValidationError(f"Missing required file: {path.relative_to(REPO_ROOT)}")

    return path.read_text(encoding="utf-8")


def validate_backend_package_files() -> None:
    if not REQUIREMENTS_PATH.exists():
        raise ValidationError("backend/requirements.txt is required.")

    if not APP_MAIN_PATH.exists():
        raise ValidationError("backend/app/main.py is required.")

    startup_text = _read_text(STARTUP_PATH)

    required_startup_snippets = (
        "#!/usr/bin/env bash",
        "set -Eeuo pipefail",
        "exec python -m uvicorn app.main:app",
        "--host 0.0.0.0",
        '--port "${PORT:-8000}"',
        "--workers 1",
        "--no-use-colors",
    )

    for snippet in required_startup_snippets:
        if snippet not in startup_text:
            raise ValidationError(f"startup.sh must contain: {snippet}")

    forbidden_startup_terms = (
        "--reload",
        "reset_db",
        "seed_db",
        "update_db",
        "sync_professional_portfolio",
        "migrate_professional_content_fields",
        "pip install",
        "create_all",
        "portfolio.db",
    )

    for term in forbidden_startup_terms:
        if term in startup_text:
            raise ValidationError(f"startup.sh must not contain: {term}")


def validate_requirements() -> None:
    requirements = _read_text(REQUIREMENTS_PATH)

    for dependency in ("fastapi", "SQLAlchemy", "uvicorn"):
        if not re.search(rf"^{re.escape(dependency)}==", requirements, re.MULTILINE):
            raise ValidationError(f"Missing runtime dependency in requirements.txt: {dependency}")

    if re.search(r"C:\\|file:|\\.whl|\\.tar\\.gz", requirements, re.IGNORECASE):
        raise ValidationError("requirements.txt must not reference local files.")


def validate_git_exclusions() -> None:
    tracked_files = set(_run_git(["ls-files"]))

    for tracked_file in tracked_files:
        if tracked_file in FORBIDDEN_TRACKED_FILES:
            raise ValidationError(f"Forbidden tracked file: {tracked_file}")

        if tracked_file.startswith(FORBIDDEN_TRACKED_PREFIXES):
            raise ValidationError(f"Forbidden tracked path: {tracked_file}")


def validate_workflow_template() -> None:
    workflow_text = _read_text(WORKFLOW_TEMPLATE_PATH)

    required_snippets = (
        "azure/login@v2",
        "azure/webapps-deploy@v3",
        "package: backend",
        "app-name: ${{ vars.AZURE_WEBAPP_NAME }}",
        "client-id: ${{ secrets.AZURE_CLIENT_ID }}",
        "tenant-id: ${{ secrets.AZURE_TENANT_ID }}",
        "subscription-id: ${{ secrets.AZURE_SUBSCRIPTION_ID }}",
        "python -m app.scripts.validate_azure_app_service",
    )

    for snippet in required_snippets:
        if snippet not in workflow_text:
            raise ValidationError(f"Workflow template must contain: {snippet}")

    forbidden_terms = (
        "portfolio.db",
        "backend/venv",
        "backend/backups",
        "reset_db.py",
        "seed_db.py",
        "update_db.py",
        "migrate_professional_content_fields",
        "sync_professional_portfolio",
    )

    for term in forbidden_terms:
        if term in workflow_text:
            raise ValidationError(f"Workflow template must not contain: {term}")

    for pattern in FORBIDDEN_TEMPLATE_PATTERNS:
        if pattern.search(workflow_text):
            raise ValidationError("Workflow template contains a forbidden deployment value.")

    if ACTIVE_WORKFLOWS_DIR.exists():
        for path in ACTIVE_WORKFLOWS_DIR.glob("*.y*ml"):
            text = path.read_text(encoding="utf-8")
            if "azure/webapps-deploy@v3" in text:
                raise ValidationError("Active App Service workflow is not allowed yet.")


def validate_settings_template() -> None:
    settings_text = _read_text(SETTINGS_TEMPLATE_PATH)

    required_snippets = (
        "APP_ENV=production",
        "APP_DEBUG=false",
        "SQLITE_DATABASE_PATH=/home/data/portfolio.db",
        "SQLITE_REQUIRE_EXISTING=true",
        "SCM_DO_BUILD_DURING_DEPLOYMENT=true",
        "ADMIN_USERNAME=<SET_IN_AZURE>",
        "ADMIN_PASSWORD=<SET_IN_AZURE>",
    )

    for snippet in required_snippets:
        if snippet not in settings_text:
            raise ValidationError(f"Settings template must contain: {snippet}")

    for pattern in FORBIDDEN_TEMPLATE_PATTERNS:
        if pattern.search(settings_text):
            raise ValidationError("Settings template contains a forbidden deployment value.")


def validate_no_frontend_package() -> None:
    workflow_text = _read_text(WORKFLOW_TEMPLATE_PATH)

    if "package: frontend" in workflow_text or "frontend/dist" in workflow_text:
        raise ValidationError("App Service workflow must not deploy the frontend.")


def main() -> int:
    checks = (
        validate_backend_package_files,
        validate_requirements,
        validate_git_exclusions,
        validate_workflow_template,
        validate_settings_template,
        validate_no_frontend_package,
    )

    for check in checks:
        check()

    print("validate_azure_app_service: ok")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except ValidationError as exc:
        print(f"validate_azure_app_service: {exc}", file=sys.stderr)
        raise SystemExit(1) from exc
