# -----------------------------------------------------------------------------
#                              LIBRERÍAS
# -----------------------------------------------------------------------------
"""
Módulo: app.database.connection

Configuración de conexión a la base de datos del backend.

Este módulo define:
- La URL real de conexión a la base de datos.
- El engine de SQLAlchemy.
- La fábrica de sesiones `SessionLocal`.
- La función `get_db()` para usar sesiones en FastAPI.

La configuración se toma desde `app.core.config.settings`, que a su vez
lee las variables del archivo `.env`.

Autor: Carlos Andrés Jiménez Sarmiento (CJ)
Proyecto: Portfolio Full Stack
"""

from __future__ import annotations

from collections.abc import Generator

from sqlalchemy import create_engine, event
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import settings
from app.core.log import log_debug, log_documentation
from app.database.base import Base


# -----------------------------------------------------------------------------
#                       CONSTRUCCIÓN DE DATABASE URL
# -----------------------------------------------------------------------------

def _build_database_url() -> str:
    """
    Construye la URL final de conexión a la base de datos.

    Si la base de datos es SQLite y la ruta viene como:
        sqlite:///./portfolio.db

    Se convierte a una ruta absoluta dentro de la raíz del backend.

    Esto evita que el archivo `.db` se cree accidentalmente en otra carpeta
    cuando se ejecutan scripts desde CMD.

    Returns:
        URL final de conexión compatible con SQLAlchemy.
    """
    database_url = settings.database_url

    sqlite_relative_prefix = "sqlite:///./"

    if database_url.startswith(sqlite_relative_prefix):
        db_file_name = database_url.replace(
            sqlite_relative_prefix,
            "",
            1
        )

        db_path = settings.backend_root / db_file_name

        return f"sqlite:///{db_path.as_posix()}"

    return database_url


def _build_connect_args(database_url: str) -> dict:
    """
    Construye argumentos extra para la conexión.

    SQLite necesita `check_same_thread=False` cuando se usa con aplicaciones web,
    porque FastAPI puede atender peticiones en distintos hilos.

    Args:
        database_url: URL de conexión a la base de datos.

    Returns:
        Diccionario de argumentos para SQLAlchemy.
    """
    if database_url.startswith("sqlite"):
        return {
            "check_same_thread": False
        }

    return {}


def _mask_database_url(database_url: str) -> str:
    """
    Oculta información sensible de una URL de base de datos.

    En SQLite no hay credenciales, pero esta función queda preparada para
    cuando el proyecto migre a PostgreSQL u otro motor.

    Args:
        database_url: URL original de conexión.

    Returns:
        URL segura para mostrar en logs.
    """
    if "@" not in database_url:
        return database_url

    try:
        protocol, rest = database_url.split("://", 1)
        _, host_part = rest.split("@", 1)

        return f"{protocol}://***:***@{host_part}"

    except ValueError:
        return "***"


# -----------------------------------------------------------------------------
#                       ENGINE Y SESIONES
# -----------------------------------------------------------------------------

DATABASE_URL = _build_database_url()

engine: Engine = create_engine(
    DATABASE_URL,
    connect_args=_build_connect_args(DATABASE_URL)
)


if DATABASE_URL.startswith("sqlite"):
    @event.listens_for(engine, "connect")
    def _enable_sqlite_foreign_keys(
        dbapi_connection,
        _connection_record
    ) -> None:
        """Activa las restricciones foreign key en cada conexión SQLite."""
        cursor = dbapi_connection.cursor()

        try:
            cursor.execute("PRAGMA foreign_keys=ON")
        finally:
            cursor.close()

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)


log_documentation(
    "Configuración de base de datos cargada.",
    database_url=_mask_database_url(DATABASE_URL),
    backend_root=str(settings.backend_root)
)


# -----------------------------------------------------------------------------
#                       DEPENDENCIA DE BASE DE DATOS
# -----------------------------------------------------------------------------

def get_db() -> Generator[Session, None, None]:
    """
    Crea una sesión de base de datos y la cierra correctamente al finalizar.

    Esta función será usada más adelante por FastAPI mediante `Depends`.

    Ejemplo futuro:
        def listar_skills(db: Session = Depends(get_db)):
            ...

    Yields:
        Sesión activa de SQLAlchemy.
    """
    db = SessionLocal()

    try:
        log_debug("Sesión de base de datos abierta.")
        yield db

    finally:
        db.close()
        log_debug("Sesión de base de datos cerrada.")
