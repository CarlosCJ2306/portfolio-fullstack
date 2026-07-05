# -----------------------------------------------------------------------------
#                              LIBRERÍAS
# -----------------------------------------------------------------------------
"""
Módulo: app.core.config

Configuración centralizada del backend del portafolio.

Este módulo se encarga de leer las variables definidas en el archivo `.env`
y exponerlas mediante un objeto `settings`, para que el resto del proyecto
pueda acceder a la configuración desde un solo lugar.

Ejemplo de uso:
    from app.core.config import settings

    print(settings.database_url)
    print(settings.log_file_path)

Autor: Carlos Andrés Jiménez Sarmiento (CJ)
Proyecto: Portfolio Full Stack
"""

from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path

from dotenv import load_dotenv


# -----------------------------------------------------------------------------
#                         RUTA BASE DEL BACKEND
# -----------------------------------------------------------------------------
# Este archivo está ubicado en:
# backend/app/core/config.py
#
# parents[0] => core
# parents[1] => app
# parents[2] => backend

BACKEND_ROOT = Path(__file__).resolve().parents[2]

ENV_FILE_PATH = BACKEND_ROOT / ".env"

load_dotenv(ENV_FILE_PATH)


# -----------------------------------------------------------------------------
#                         FUNCIONES AUXILIARES
# -----------------------------------------------------------------------------

def get_bool_env(key: str, default: bool = False) -> bool:
    """
    Convierte una variable de entorno a booleano.

    Valores considerados verdaderos:
        true, 1, yes, y, si, sí

    Args:
        key: Nombre de la variable de entorno.
        default: Valor por defecto si la variable no existe.

    Returns:
        Valor booleano interpretado desde el .env.
    """
    value = os.getenv(key)

    if value is None:
        return default

    return value.strip().lower() in {"true", "1", "yes", "y", "si", "sí"}


def get_int_env(key: str, default: int) -> int:
    """
    Convierte una variable de entorno a entero de manera segura.

    Args:
        key: Nombre de la variable de entorno.
        default: Valor por defecto si no existe o no es válido.

    Returns:
        Valor entero.
    """
    value = os.getenv(key)

    if value is None:
        return default

    try:
        return int(value)
    except ValueError:
        return default


def get_path_env(key: str, default: Path) -> Path:
    """
    Obtiene una ruta desde una variable de entorno.

    Si la ruta es relativa, se interpreta desde la raíz del backend.

    Args:
        key: Nombre de la variable de entorno.
        default: Ruta por defecto.

    Returns:
        Ruta absoluta.
    """
    value = os.getenv(key)

    if not value:
        return default

    path = Path(value)

    if path.is_absolute():
        return path

    return BACKEND_ROOT / path


# -----------------------------------------------------------------------------
#                         CLASE DE CONFIGURACIÓN
# -----------------------------------------------------------------------------

@dataclass(frozen=True)
class Settings:
    """
    Configuración global del backend.

    Esta clase centraliza los valores importantes del proyecto para evitar
    usar `os.getenv()` directamente en muchos archivos.
    """

    app_name: str
    app_env: str
    app_debug: bool

    backend_root: Path

    database_url: str

    log_dir: Path
    log_file: str
    log_level: str
    log_console: bool
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
        """
        Ruta completa del archivo de logs.

        Returns:
            Ruta absoluta del archivo .log.
        """
        return self.log_dir / self.log_file


settings = Settings(
    app_name=os.getenv("APP_NAME", "Portfolio Backend"),
    app_env=os.getenv("APP_ENV", "development"),
    app_debug=get_bool_env("APP_DEBUG", True),

    backend_root=BACKEND_ROOT,

    database_url=os.getenv("DATABASE_URL", "sqlite:///./portfolio.db"),

    log_dir=get_path_env("LOG_DIR", BACKEND_ROOT / "logs"),
    log_file=os.getenv("LOG_FILE", "portfolio_backend.log"),
    log_level=os.getenv("LOG_LEVEL", "DEBUG").upper(),
    log_console=get_bool_env("LOG_CONSOLE", True),
    log_max_bytes=get_int_env("LOG_MAX_BYTES", 5_242_880),
    log_backup_count=get_int_env("LOG_BACKUP_COUNT", 5),
    
    api_docs_enabled=get_bool_env("API_DOCS_ENABLED", True),
    api_docs_username=os.getenv("API_DOCS_USERNAME", "admin"),
    api_docs_password=os.getenv("API_DOCS_PASSWORD", "admin123"),

    admin_enabled=get_bool_env("ADMIN_ENABLED", True),
    admin_username=os.getenv("ADMIN_USERNAME", "admin"),
    admin_password=os.getenv("ADMIN_PASSWORD", "admin123"),
)