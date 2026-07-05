# -----------------------------------------------------------------------------
#                              LIBRERÍAS
# -----------------------------------------------------------------------------
"""
Módulo: app.scripts.check_db

Script para verificar la conexión con la base de datos.

Este script ejecuta una consulta simple `SELECT 1` para confirmar que:
- La configuración fue leída correctamente.
- SQLAlchemy puede conectarse a SQLite.
- El sistema de logs está funcionando durante operaciones de base de datos.

Uso:
    python -m app.scripts.check_db

Autor: Carlos Andrés Jiménez Sarmiento (CJ)
Proyecto: Portfolio Full Stack
"""

from sqlalchemy import text

from app.core.log import get_log_file_path, log_info, log_step, log_success
from app.database.connection import DATABASE_URL, engine


# -----------------------------------------------------------------------------
#                              FUNCIÓN PRINCIPAL
# -----------------------------------------------------------------------------

def check_database_connection() -> None:
    """
    Verifica la conexión a la base de datos ejecutando una consulta básica.
    """
    log_info(
        "Preparando verificación de conexión a base de datos.",
        database_url=DATABASE_URL
    )

    with log_step("Verificar conexión con la base de datos"):
        with engine.connect() as connection:
            result = connection.execute(
                text("SELECT 1")
            ).scalar_one()

            log_success(
                "Conexión a base de datos verificada correctamente.",
                result=result
            )


def main() -> None:
    """
    Punto de entrada del script.
    """
    check_database_connection()

    log_success(
        "Script check_db finalizado correctamente.",
        archivo_log=get_log_file_path()
    )


if __name__ == "__main__":
    main()