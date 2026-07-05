# -----------------------------------------------------------------------------
#                              LIBRERÍAS
# -----------------------------------------------------------------------------
"""
Módulo: app.scripts.reset_db

Script para reiniciar la base de datos en entorno de desarrollo.

Este script:
- Solicita confirmación explícita.
- Elimina todas las tablas registradas.
- Crea nuevamente todas las tablas.
- Registra todo el proceso en logs.

Uso:
    python -m app.scripts.reset_db

Advertencia:
    Este script elimina datos. Debe usarse solo en desarrollo.

Autor: Carlos Andrés Jiménez Sarmiento (CJ)
Proyecto: Portfolio Full Stack
"""

from sqlalchemy import inspect

from app.core.config import settings
from app.core.log import (
    get_log_file_path,
    log_critical,
    log_info,
    log_step,
    log_success,
    log_warning,
)
from app.database.base import Base
from app.database.connection import DATABASE_URL, engine

# Importante:
# Este import registra los modelos en Base.metadata.
import app.models  # noqa: F401


# -----------------------------------------------------------------------------
#                              FUNCIONES
# -----------------------------------------------------------------------------

def get_database_tables() -> list[str]:
    """
    Obtiene las tablas existentes en la base de datos.

    Returns:
        Lista de nombres de tablas.
    """
    inspector = inspect(engine)

    return inspector.get_table_names()


def reset_database() -> None:
    """
    Elimina y vuelve a crear todas las tablas de la base de datos.
    """
    log_warning(
        "Solicitud de reinicio de base de datos recibida.",
        app_env=settings.app_env,
        database_url=DATABASE_URL
    )

    if settings.app_env.lower() == "production":
        log_critical(
            "Intento bloqueado de reiniciar la base de datos en producción.",
            app_env=settings.app_env
        )

        print("No se puede reiniciar la base de datos en producción.")
        return

    confirmation = input(
        "Esto eliminará todas las tablas y datos. Escribe RESET para continuar: "
    )

    if confirmation != "RESET":
        log_warning(
            "Reinicio de base de datos cancelado por el usuario.",
            confirmation=confirmation
        )

        print("Operación cancelada.")
        return

    with log_step(
        "Eliminar tablas existentes",
        database_url=DATABASE_URL
    ):
        Base.metadata.drop_all(
            bind=engine
        )

    with log_step(
        "Crear tablas nuevamente",
        database_url=DATABASE_URL
    ):
        Base.metadata.create_all(
            bind=engine
        )

    database_tables = get_database_tables()

    log_success(
        "Base de datos reiniciada correctamente.",
        database_tables=database_tables,
        total_tables=len(database_tables)
    )


def main() -> None:
    """
    Punto de entrada del script.
    """
    log_info(
        "Iniciando script reset_db.",
        database_url=DATABASE_URL
    )

    reset_database()

    log_success(
        "Script reset_db finalizado.",
        archivo_log=get_log_file_path()
    )


if __name__ == "__main__":
    main()