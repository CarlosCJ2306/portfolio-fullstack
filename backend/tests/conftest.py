from __future__ import annotations

import os
import logging
import secrets
import tempfile
from collections.abc import Callable, Generator
from pathlib import Path

import pytest


_TEMP_DIRECTORY = tempfile.TemporaryDirectory(prefix="portfolio_backend_tests_")
_TEMP_ROOT = Path(_TEMP_DIRECTORY.name).resolve()
_TEST_DATABASE_PATH = (_TEMP_ROOT / "qa_backend.sqlite3").resolve()
_TEST_DATABASE_URL = f"sqlite:///{_TEST_DATABASE_PATH.as_posix()}"


def _assert_safe_database_url(database_url: str) -> None:
    normalized_url = database_url.replace("\\", "/").lower()

    if "portfolio.db" in normalized_url:
        raise RuntimeError(
            "Protección de pruebas activada: DATABASE_URL no puede usar portfolio.db."
        )

    if not normalized_url.startswith("sqlite:///"):
        raise RuntimeError(
            "Protección de pruebas activada: la suite requiere una SQLite temporal."
        )

    database_path = Path(database_url.removeprefix("sqlite:///")).resolve()

    if database_path.parent != _TEMP_ROOT:
        raise RuntimeError(
            "Protección de pruebas activada: SQLite debe vivir en el directorio temporal."
        )


_assert_safe_database_url(_TEST_DATABASE_URL)

# Deben definirse antes de importar la configuración y la app. load_dotenv no
# sobrescribe estas variables, por lo que la suite nunca adopta la DB o las
# credenciales del entorno local.
os.environ["APP_ENV"] = "test"
os.environ["DATABASE_URL"] = _TEST_DATABASE_URL
os.environ["CORS_ALLOWED_ORIGINS"] = (
    "http://localhost:5173,http://127.0.0.1:5173,"
    "http://localhost:4173,http://127.0.0.1:4173"
)
os.environ["TRUSTED_HOSTS"] = "testserver,localhost,127.0.0.1"
os.environ["LOG_DIR"] = str(_TEMP_ROOT / "logs")
os.environ["LOG_CONSOLE"] = "false"
os.environ["ADMIN_ENABLED"] = "true"
os.environ["ADMIN_USERNAME"] = f"qa_{secrets.token_hex(6)}"
os.environ["ADMIN_PASSWORD"] = secrets.token_urlsafe(24)
os.environ["API_DOCS_USERNAME"] = os.environ["ADMIN_USERNAME"]
os.environ["API_DOCS_PASSWORD"] = os.environ["ADMIN_PASSWORD"]

from fastapi.testclient import TestClient
from sqlalchemy import text

import app.models  # noqa: F401  # Registra todos los modelos en Base.metadata.
from app.core.config import settings
from app.database.base import Base
from app.database.connection import DATABASE_URL, engine
from app.main import app


_PNG_BASE64 = (
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk"
    "/x8AAusB9Y9Z4iQAAAAASUVORK5CYII="
)
_PDF_BASE64 = "JVBERi0xLjQKJSVFT0YK"


@pytest.fixture(autouse=True)
def isolated_database() -> Generator[None, None, None]:
    """Recrea el esquema real en una SQLite temporal para cada prueba."""

    _assert_safe_database_url(DATABASE_URL)
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    with engine.connect() as connection:
        assert connection.execute(text("PRAGMA foreign_keys")).scalar_one() == 1

    yield

    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def client(isolated_database: None) -> Generator[TestClient, None, None]:
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture
def admin_auth() -> tuple[str, str]:
    """Expone credenciales efímeras generadas solo en memoria."""

    return settings.admin_username, settings.admin_password


@pytest.fixture
def upload_asset(
    client: TestClient,
    admin_auth: tuple[str, str],
) -> Callable[..., dict]:
    def _upload_asset(
        asset_type: str,
        *,
        file_name: str | None = None,
        mime_type: str | None = None,
        data_base64: str | None = None,
        svg_content: str | None = None,
    ) -> dict:
        default_file_names = {
            "avatar": "avatar.png",
            "image": "project.png",
            "icon": "skill.png",
            "icon_svg": "skill.svg",
            "document": "certificate.pdf",
        }
        default_mime_types = {
            "avatar": "image/png",
            "image": "image/png",
            "icon": "image/png",
            "icon_svg": "image/svg+xml",
            "document": "application/pdf",
        }
        payload = {
            "asset_type": asset_type,
            "file_name": file_name or default_file_names[asset_type],
            "mime_type": mime_type or default_mime_types[asset_type],
            "alt_text": f"Asset temporal {asset_type}",
        }

        if svg_content is not None:
            payload["svg_content"] = svg_content
        else:
            payload["data_base64"] = data_base64 or (
                _PDF_BASE64 if asset_type == "document" else _PNG_BASE64
            )

        response = client.post(
            "/api/admin/media-assets",
            json=payload,
            auth=admin_auth,
        )
        assert response.status_code == 201, response.text
        return response.json()

    return _upload_asset


@pytest.fixture(scope="session", autouse=True)
def cleanup_temporary_directory() -> Generator[None, None, None]:
    yield
    engine.dispose()
    logging.shutdown()
    _TEMP_DIRECTORY.cleanup()
