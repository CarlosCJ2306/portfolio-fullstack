"""
Modulo: app.scripts.migrate_project_gallery

Migracion idempotente para crear la tabla `project_images` en SQLite.

Uso:
    python -m app.scripts.migrate_project_gallery
"""

from __future__ import annotations

from pathlib import Path

from sqlalchemy import inspect, text

from app.core.log import get_log_file_path, log_info, log_step, log_success
from app.database.connection import DATABASE_URL, engine
from app.models.project_model import ProjectImage

# Importante:
# Registra los modelos en Base.metadata.
import app.models  # noqa: F401


EXPECTED_COLUMNS = {
    "project_id",
    "media_asset_id",
    "display_order",
}
EXPECTED_PRIMARY_KEY = {
    "project_id",
    "media_asset_id",
}
EXPECTED_FOREIGN_KEYS = {
    ("project_id", "projects", "id"),
    ("media_asset_id", "media_assets", "id"),
}


def _get_sqlite_db_path() -> Path:
    prefix = "sqlite:///"

    if not DATABASE_URL.startswith(prefix):
        raise RuntimeError("La migracion de galeria solo soporta SQLite.")

    return Path(DATABASE_URL.replace(prefix, "", 1))


def _validate_project_images_table(connection) -> None:
    inspector = inspect(connection)
    columns = inspector.get_columns("project_images")
    column_names = {column["name"] for column in columns}

    if column_names != EXPECTED_COLUMNS:
        raise RuntimeError(
            "La estructura de 'project_images' no coincide con la esperada. "
            f"Columnas detectadas: {sorted(column_names)}."
        )

    primary_key = set(
        inspector.get_pk_constraint("project_images").get("constrained_columns") or []
    )

    if primary_key != EXPECTED_PRIMARY_KEY:
        raise RuntimeError(
            "La clave primaria de 'project_images' no coincide con la esperada. "
            f"Clave detectada: {sorted(primary_key)}."
        )

    foreign_keys = {
        (
            foreign_key["constrained_columns"][0],
            foreign_key["referred_table"],
            foreign_key["referred_columns"][0],
        )
        for foreign_key in inspector.get_foreign_keys("project_images")
    }

    if foreign_keys != EXPECTED_FOREIGN_KEYS:
        raise RuntimeError(
            "Las llaves foraneas de 'project_images' no coinciden con las esperadas. "
            f"Foreign keys detectadas: {sorted(foreign_keys)}."
        )


def _run_integrity_checks(connection) -> None:
    integrity_result = connection.execute(
        text("PRAGMA integrity_check")
    ).scalar_one()

    if str(integrity_result).lower() != "ok":
        raise RuntimeError(
            "PRAGMA integrity_check no devolvio 'ok'. "
            f"Resultado: {integrity_result}"
        )

    foreign_key_rows = connection.execute(
        text("PRAGMA foreign_key_check")
    ).fetchall()

    if foreign_key_rows:
        raise RuntimeError(
            "PRAGMA foreign_key_check detecto inconsistencias. "
            f"Resultado: {foreign_key_rows}"
        )


def migrate_project_gallery() -> None:
    db_path = _get_sqlite_db_path()

    if not db_path.exists():
        raise FileNotFoundError(
            f"No se encontro la base de datos SQLite esperada: {db_path}"
        )

    log_info(
        "Iniciando migracion de galeria de proyectos.",
        database_url=DATABASE_URL,
        db_path=str(db_path)
    )

    with log_step("Crear o validar tabla project_images"):
        with engine.begin() as connection:
            connection.execute(text("PRAGMA foreign_keys=ON"))

            inspector = inspect(connection)

            if inspector.has_table("project_images"):
                log_info("La tabla project_images ya existe. Se validara su estructura.")
            else:
                ProjectImage.__table__.create(bind=connection)
                log_success("Tabla project_images creada correctamente.")

            _validate_project_images_table(connection)
            _run_integrity_checks(connection)

    log_success(
        "Migracion de galeria finalizada correctamente.",
        tabla="project_images",
        archivo_log=get_log_file_path()
    )


def main() -> None:
    migrate_project_gallery()


if __name__ == "__main__":
    main()
