"""Centralized runtime configuration for the portfolio backend."""

from __future__ import annotations

import json
import os
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path
from tempfile import gettempdir
from urllib.parse import urlparse

from dotenv import load_dotenv


BACKEND_ROOT = Path(__file__).resolve().parents[2]
ENV_FILE_PATH = BACKEND_ROOT / ".env"

ALLOWED_APP_ENVS = {"development", "test", "staging", "production"}
ALLOWED_LOG_LEVELS = {"DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"}
PRODUCTION_ENVS = {"staging", "production"}
PLACEHOLDER_SECRETS = {
    "",
    "admin",
    "admin123",
    "change_me",
    "changeme",
    "password",
    "<SET_LOCALLY>",
    "set_locally",
}

LOCAL_CORS_ORIGINS = (
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:4173",
    "http://127.0.0.1:4173",
    "http://192.168.80.10:5173",
)
LOCAL_TRUSTED_HOSTS = ("localhost", "127.0.0.1", "testserver")


class SettingsError(RuntimeError):
    """Raised when runtime configuration is invalid."""


def _should_load_local_env() -> bool:
    return os.getenv("APP_ENV", "development").strip().lower() not in PRODUCTION_ENVS


if _should_load_local_env():
    load_dotenv(ENV_FILE_PATH)


def _get_raw(key: str, default: str | None = None) -> str | None:
    value = os.getenv(key)
    return default if value is None else value


def _get_bool(key: str, default: bool = False) -> bool:
    value = _get_raw(key)

    if value is None:
        return default

    normalized = value.strip().lower()

    if normalized in {"true", "1", "yes", "y", "si", "sí", "on"}:
        return True

    if normalized in {"false", "0", "no", "n", "off"}:
        return False

    raise SettingsError(f"{key} debe ser booleano.")


def _get_int(key: str, default: int) -> int:
    value = _get_raw(key)

    if value is None or value.strip() == "":
        return default

    try:
        parsed = int(value)
    except ValueError as exc:
        raise SettingsError(f"{key} debe ser un entero.") from exc

    if parsed <= 0:
        raise SettingsError(f"{key} debe ser mayor que cero.")

    return parsed


def _parse_csv_or_json_list(key: str, default: tuple[str, ...] = ()) -> tuple[str, ...]:
    raw_value = _get_raw(key)

    if raw_value is None or raw_value.strip() == "":
        return default

    value = raw_value.strip()

    if value.startswith("["):
        try:
            parsed = json.loads(value)
        except json.JSONDecodeError as exc:
            raise SettingsError(f"{key} debe ser una lista JSON valida o CSV.") from exc

        if not isinstance(parsed, list):
            raise SettingsError(f"{key} debe ser una lista.")

        items = [str(item).strip() for item in parsed]
    else:
        items = [item.strip() for item in value.split(",")]

    return tuple(item for item in items if item)


def _validate_origin(origin: str, *, app_env: str) -> str:
    if origin == "*":
        raise SettingsError("CORS_ALLOWED_ORIGINS no puede contener '*'.")

    parsed = urlparse(origin)

    if parsed.scheme not in {"http", "https"} or not parsed.netloc:
        raise SettingsError("CORS_ALLOWED_ORIGINS requiere origenes http(s) validos.")

    if parsed.path not in {"", "/"} or parsed.query or parsed.fragment:
        raise SettingsError("CORS_ALLOWED_ORIGINS no debe incluir rutas, query ni fragmentos.")

    hostname = parsed.hostname or ""

    if app_env in PRODUCTION_ENVS:
        if hostname in {"localhost", "127.0.0.1", "::1"}:
            raise SettingsError("CORS_ALLOWED_ORIGINS no debe usar localhost en staging/production.")

    return f"{parsed.scheme}://{parsed.netloc}".rstrip("/")


def _parse_cors_origins(app_env: str) -> tuple[str, ...]:
    default = LOCAL_CORS_ORIGINS if app_env == "development" else ()
    origins = _parse_csv_or_json_list("CORS_ALLOWED_ORIGINS", default)

    if app_env in PRODUCTION_ENVS and not origins:
        raise SettingsError("CORS_ALLOWED_ORIGINS es obligatorio en staging/production.")

    return tuple(dict.fromkeys(_validate_origin(origin, app_env=app_env) for origin in origins))


def _validate_trusted_host(host: str) -> str:
    if host == "*":
        raise SettingsError("TRUSTED_HOSTS no debe usar '*' por defecto.")

    if "://" in host or "/" in host or "?" in host or "#" in host:
        raise SettingsError("TRUSTED_HOSTS debe contener hosts, sin esquema ni ruta.")

    return host.strip()


def _parse_trusted_hosts(app_env: str) -> tuple[str, ...]:
    default = LOCAL_TRUSTED_HOSTS if app_env in {"development", "test"} else ()
    hosts = list(_parse_csv_or_json_list("TRUSTED_HOSTS", default))
    website_hostname = (_get_raw("WEBSITE_HOSTNAME") or "").strip()

    if website_hostname:
        hosts.append(website_hostname)

    if app_env in PRODUCTION_ENVS and not hosts:
        raise SettingsError("TRUSTED_HOSTS o WEBSITE_HOSTNAME es obligatorio en staging/production.")

    return tuple(dict.fromkeys(_validate_trusted_host(host) for host in hosts if host))


def _sqlite_path_from_database_url(database_url: str) -> Path | None:
    if not database_url.startswith("sqlite:///"):
        return None

    raw_path = database_url.removeprefix("sqlite:///")

    if raw_path == ":memory:":
        return Path(":memory:")

    path = Path(raw_path)

    if path.is_absolute():
        return path

    return BACKEND_ROOT / path


def _resolve_sqlite_database_path() -> Path:
    explicit_path = _get_raw("SQLITE_DATABASE_PATH")

    if explicit_path:
        path = Path(explicit_path.strip())
        return path if path.is_absolute() else BACKEND_ROOT / path

    legacy_database_url = _get_raw("DATABASE_URL")

    if legacy_database_url:
        legacy_path = _sqlite_path_from_database_url(legacy_database_url.strip())

        if legacy_path is None:
            raise SettingsError("DATABASE_URL debe usar SQLite durante esta fase.")

        return legacy_path

    return BACKEND_ROOT / "portfolio.db"


def _resolve_backend_path(value: str | None, default: Path) -> Path:
    if not value:
        return default

    path = Path(value)
    return path if path.is_absolute() else BACKEND_ROOT / path


def _validate_sqlite_path(path: Path, *, app_env: str, require_existing: bool) -> Path:
    if str(path) == ":memory:":
        raise SettingsError("SQLITE_DATABASE_PATH no puede usar :memory:.")

    resolved = path.resolve()

    if app_env in PRODUCTION_ENVS:
        raw_value = _get_raw("SQLITE_DATABASE_PATH")

        if not raw_value or not Path(raw_value).is_absolute():
            raise SettingsError("SQLITE_DATABASE_PATH debe ser absoluta en staging/production.")

        temp_root = Path(gettempdir()).resolve()

        if resolved == temp_root or temp_root in resolved.parents:
            raise SettingsError("SQLITE_DATABASE_PATH no debe apuntar a un directorio temporal.")

        if resolved == BACKEND_ROOT or BACKEND_ROOT in resolved.parents:
            raise SettingsError("SQLITE_DATABASE_PATH no debe apuntar al directorio del codigo desplegado.")

        if not require_existing:
            raise SettingsError("SQLITE_REQUIRE_EXISTING debe ser true en staging/production.")

    if require_existing and not resolved.exists():
        raise SettingsError("SQLITE_DATABASE_PATH requerido no existe.")

    if require_existing and not resolved.is_file():
        raise SettingsError("SQLITE_DATABASE_PATH debe apuntar a un archivo SQLite.")

    if not resolved.parent.exists():
        raise SettingsError("El directorio de SQLITE_DATABASE_PATH no existe.")

    return resolved


def _get_secret(key: str, *, app_env: str) -> str:
    value = (_get_raw(key) or "").strip()

    if app_env in PRODUCTION_ENVS and value in PLACEHOLDER_SECRETS:
        raise SettingsError(f"{key} debe configurarse con un secreto real.")

    return value


def _resolve_docs_enabled(app_env: str) -> bool:
    default = app_env != "production"

    if _get_raw("ENABLE_API_DOCS") is not None:
        return _get_bool("ENABLE_API_DOCS", default)

    return _get_bool("API_DOCS_ENABLED", default)


@dataclass(frozen=True)
class Settings:
    app_name: str
    app_env: str
    app_debug: bool
    backend_root: Path
    database_url: str
    sqlite_database_path: Path
    sqlite_require_existing: bool
    sqlite_busy_timeout_ms: int
    cors_allowed_origins: tuple[str, ...]
    trusted_hosts: tuple[str, ...]
    log_level: str
    log_console: bool
    log_to_file: bool
    log_dir: Path
    log_file: str
    log_max_bytes: int
    log_backup_count: int
    api_docs_enabled: bool
    api_docs_username: str
    api_docs_password: str
    admin_enabled: bool
    admin_username: str
    admin_password: str

    @property
    def log_file_path(self) -> Path:
        return self.log_dir / self.log_file


def _build_settings() -> Settings:
    app_env = (_get_raw("APP_ENV", "development") or "development").strip().lower()

    if app_env not in ALLOWED_APP_ENVS:
        raise SettingsError("APP_ENV debe ser development, test, staging o production.")

    app_debug = _get_bool("APP_DEBUG", app_env == "development")

    if app_env in PRODUCTION_ENVS and app_debug:
        raise SettingsError("APP_DEBUG no puede estar activo en staging/production.")

    log_level = (_get_raw("LOG_LEVEL", "INFO") or "INFO").strip().upper()

    if log_level not in ALLOWED_LOG_LEVELS:
        raise SettingsError("LOG_LEVEL debe ser DEBUG, INFO, WARNING, ERROR o CRITICAL.")

    sqlite_require_existing = _get_bool(
        "SQLITE_REQUIRE_EXISTING",
        app_env in PRODUCTION_ENVS,
    )
    sqlite_path = _validate_sqlite_path(
        _resolve_sqlite_database_path(),
        app_env=app_env,
        require_existing=sqlite_require_existing,
    )
    admin_username = _get_secret("ADMIN_USERNAME", app_env=app_env)
    admin_password = _get_secret("ADMIN_PASSWORD", app_env=app_env)

    if app_env in PRODUCTION_ENVS and (not admin_username or not admin_password):
        raise SettingsError("ADMIN_USERNAME y ADMIN_PASSWORD son obligatorios.")

    docs_username = (
        (_get_raw("API_DOCS_USERNAME") or admin_username or "docs").strip()
    )
    docs_password = (
        (_get_raw("API_DOCS_PASSWORD") or admin_password or "").strip()
    )

    if app_env in PRODUCTION_ENVS and _resolve_docs_enabled(app_env):
        if docs_username in PLACEHOLDER_SECRETS or docs_password in PLACEHOLDER_SECRETS:
            raise SettingsError("API_DOCS_USERNAME/API_DOCS_PASSWORD requieren secretos reales.")

    return Settings(
        app_name=_get_raw("APP_NAME", "Portfolio Backend") or "Portfolio Backend",
        app_env=app_env,
        app_debug=app_debug,
        backend_root=BACKEND_ROOT,
        database_url=f"sqlite:///{sqlite_path.as_posix()}",
        sqlite_database_path=sqlite_path,
        sqlite_require_existing=sqlite_require_existing,
        sqlite_busy_timeout_ms=_get_int("SQLITE_BUSY_TIMEOUT_MS", 5000),
        cors_allowed_origins=_parse_cors_origins(app_env),
        trusted_hosts=_parse_trusted_hosts(app_env),
        log_level=log_level,
        log_console=_get_bool("LOG_CONSOLE", True),
        log_to_file=_get_bool("LOG_TO_FILE", app_env not in PRODUCTION_ENVS),
        log_dir=_resolve_backend_path(_get_raw("LOG_DIR"), BACKEND_ROOT / "logs"),
        log_file=_get_raw("LOG_FILE", "portfolio_backend.log") or "portfolio_backend.log",
        log_max_bytes=_get_int("LOG_MAX_BYTES", 5_242_880),
        log_backup_count=_get_int("LOG_BACKUP_COUNT", 5),
        api_docs_enabled=_resolve_docs_enabled(app_env),
        api_docs_username=docs_username,
        api_docs_password=docs_password,
        admin_enabled=_get_bool("ADMIN_ENABLED", True),
        admin_username=admin_username,
        admin_password=admin_password,
    )


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return _build_settings()


def clear_settings_cache() -> None:
    get_settings.cache_clear()


settings = get_settings()
