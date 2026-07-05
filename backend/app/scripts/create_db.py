# -----------------------------------------------------------------------------
#                              LIBRERÍAS
# -----------------------------------------------------------------------------
"""
Módulo: app.scripts.create_db

Script para crear las tablas de la base de datos.

Este script:
- Importa todos los modelos registrados.
- Ejecuta `Base.metadata.create_all()`.
- Registra el proceso completo en logs.
- Muestra las tablas creadas o detectadas.

Uso:
    python -m app.scripts.create_db

Autor: Carlos Andrés Jiménez Sarmiento (CJ)
Proyecto: Portfolio Full Stack
"""

from sqlalchemy import inspect

from app.core.log import (
    get_log_file_path,
    log_documentation,
    log_info,
    log_step,
    log_success,
)
from app.database.base import Base
from app.database.connection import DATABASE_URL, engine

# Importante:
# Este import registra los modelos en Base.metadata.
# Aunque parezca que no se usa, sí es necesario.
import app.models  # noqa: F401


# -----------------------------------------------------------------------------
#                              FUNCIONES
# -----------------------------------------------------------------------------

def get_registered_tables() -> list[str]:
    """
    Obtiene los nombres de las tablas registradas en SQLAlchemy antes de crearlas.

    Returns:
        Lista de nombres de tablas registradas en Base.metadata.
    """
    return list(Base.metadata.tables.keys())


def get_database_tables() -> list[str]:
    """
    Consulta las tablas existentes físicamente en la base de datos.

    Returns:
        Lista de nombres de tablas existentes.
    """
    inspector = inspect(engine)

    return inspector.get_table_names()


def create_database_tables() -> None:
    """
    Crea todas las tablas registradas en Base.metadata.
    """
    registered_tables = get_registered_tables()

    log_documentation(
        "Tablas registradas en metadata antes de crear la base de datos.",
        registered_tables=registered_tables
    )

    with log_step(
        "Crear tablas de base de datos",
        database_url=DATABASE_URL
    ):
        Base.metadata.create_all(
            bind=engine
        )

    database_tables = get_database_tables()

    log_success(
        "Tablas disponibles en la base de datos.",
        database_tables=database_tables,
        total_tables=len(database_tables)
    )


def main() -> None:
    """
    Punto de entrada del script.
    """
    log_info(
        "Iniciando script de creación de base de datos.",
        database_url=DATABASE_URL
    )

    create_database_tables()

    log_success(
        "Script create_db finalizado correctamente.",
        archivo_log=get_log_file_path()
    )


if __name__ == "__main__":
    main()