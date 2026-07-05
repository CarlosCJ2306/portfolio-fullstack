# -----------------------------------------------------------------------------
#                              LIBRERÍAS
# -----------------------------------------------------------------------------
"""
Módulo: app.scripts.inspect_db

Script para inspeccionar el estado actual de la base de datos.

Este script permite verificar:
- Tablas existentes en SQLite.
- Cantidad de registros por tabla.
- Estado general después de ejecutar create_db.py y seed_db.py.

Uso:
    python -m app.scripts.inspect_db

Autor: Carlos Andrés Jiménez Sarmiento (CJ)
Proyecto: Portfolio Full Stack
"""

from sqlalchemy import inspect, text
from sqlalchemy.orm import Session

from app.core.log import get_log_file_path, log_info, log_step, log_success
from app.database.connection import DATABASE_URL, SessionLocal, engine

# Importante:
# Registra los modelos en SQLAlchemy.
import app.models  # noqa: F401


# -----------------------------------------------------------------------------
#                              FUNCIONES
# -----------------------------------------------------------------------------

def get_database_tables() -> list[str]:
    """
    Obtiene las tablas existentes físicamente en la base de datos.

    Returns:
        Lista ordenada de nombres de tablas.
    """
    inspector = inspect(engine)

    return sorted(inspector.get_table_names())


def count_table_records(
    db: Session,
    table_name: str
) -> int:
    """
    Cuenta la cantidad de registros de una tabla.

    Args:
        db: Sesión activa de SQLAlchemy.
        table_name: Nombre de la tabla.

    Returns:
        Cantidad total de registros.
    """
    query = text(
        f'SELECT COUNT(*) FROM "{table_name}"'
    )

    return db.execute(query).scalar_one()


def inspect_database() -> None:
    """
    Inspecciona las tablas y registros actuales de la base de datos.
    """
    db = SessionLocal()

    try:
        log_info(
            "Iniciando inspección de base de datos.",
            database_url=DATABASE_URL
        )

        with log_step("Inspeccionar estructura y datos de la base de datos"):
            tables = get_database_tables()

            log_success(
                "Tablas detectadas en la base de datos.",
                total_tables=len(tables),
                tables=tables
            )

            print("\n========================================")
            print(" INSPECCIÓN DE BASE DE DATOS")
            print("========================================")
            print(f"Database URL: {DATABASE_URL}")
            print(f"Total de tablas: {len(tables)}")
            print("----------------------------------------")

            if not tables:
                print("No hay tablas creadas en la base de datos.")

                log_info(
                    "No se encontraron tablas en la base de datos."
                )

                return

            table_counts = {}

            for table_name in tables:
                total_records = count_table_records(
                    db=db,
                    table_name=table_name
                )

                table_counts[table_name] = total_records

                print(f"{table_name:<25} {total_records:>5} registros")

            print("----------------------------------------")
            print("Inspección finalizada.")
            print("========================================\n")

            log_success(
                "Conteo de registros por tabla finalizado.",
                table_counts=table_counts
            )

    finally:
        db.close()

        log_success(
            "Sesión de base de datos cerrada después de inspección."
        )


def main() -> None:
    """
    Punto de entrada del script.
    """
    inspect_database()

    log_success(
        "Script inspect_db finalizado correctamente.",
        archivo_log=get_log_file_path()
    )


if __name__ == "__main__":
    main()