# -----------------------------------------------------------------------------
#                              LIBRERÍAS
# -----------------------------------------------------------------------------
"""
Módulo: app.scripts.check_db

Script de solo lectura para verificar la conexión e integridad de SQLite.

Este script confirma:
- Que SQLAlchemy puede conectarse a SQLite.
- Que `PRAGMA foreign_keys` está activo en la conexión.
- Que `PRAGMA integrity_check` devuelve `ok`.
- Que `PRAGMA foreign_key_check` no encuentra violaciones.

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
    Verifica la conexión y los PRAGMA de integridad sin modificar datos.

    Raises:
        RuntimeError: Si foreign keys está desactivado o la base presenta
            errores de integridad o relaciones inválidas.
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

            foreign_keys = connection.execute(
                text("PRAGMA foreign_keys")
            ).scalar_one()

            integrity_results = connection.execute(
                text("PRAGMA integrity_check")
            ).scalars().all()

            foreign_key_violations = connection.execute(
                text("PRAGMA foreign_key_check")
            ).mappings().all()

            log_success(
                "Conexión a base de datos verificada correctamente.",
                result=result
            )

            log_info(
                "Resultado de PRAGMA foreign_keys.",
                foreign_keys=foreign_keys
            )
            log_info(
                "Resultado de PRAGMA integrity_check.",
                integrity_check=integrity_results
            )
            log_info(
                "Resultado de PRAGMA foreign_key_check.",
                violations=[dict(row) for row in foreign_key_violations]
            )

            errors = []

            if foreign_keys != 1:
                errors.append(
                    f"PRAGMA foreign_keys devolvió {foreign_keys}; se esperaba 1."
                )

            if integrity_results != ["ok"]:
                errors.append(
                    "PRAGMA integrity_check reportó: "
                    f"{integrity_results}."
                )

            if foreign_key_violations:
                errors.append(
                    "PRAGMA foreign_key_check encontró violaciones: "
                    f"{[dict(row) for row in foreign_key_violations]}."
                )

            if errors:
                raise RuntimeError(" ".join(errors))

            log_success(
                "Integridad SQLite verificada correctamente.",
                foreign_keys=foreign_keys,
                integrity_check="ok",
                foreign_key_violations=0
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
