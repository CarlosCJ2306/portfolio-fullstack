"""Migra de forma aditiva los campos profesionales C1 en SQLite.

El modo predeterminado es dry-run. ``--apply`` requiere un backup válido y
solo agrega columnas faltantes; nunca reconstruye tablas ni modifica contenido
editorial.
"""

from __future__ import annotations

import argparse
import sqlite3
from collections.abc import Callable
from dataclasses import dataclass
from pathlib import Path

from app.core.config import settings


@dataclass(frozen=True)
class ColumnSpec:
    table: str
    name: str
    declaration: str
    expected_type: str
    not_null: bool
    default: str | None


COLUMN_SPECS = (
    ColumnSpec(
        "projects",
        "is_confidential",
        "BOOLEAN NOT NULL DEFAULT 0",
        "BOOLEAN",
        True,
        "0",
    ),
    ColumnSpec(
        "projects",
        "confidentiality_note",
        "TEXT NULL",
        "TEXT",
        False,
        None,
    ),
    ColumnSpec(
        "projects",
        "client_display_name",
        "VARCHAR(180) NULL",
        "VARCHAR(180)",
        False,
        None,
    ),
    ColumnSpec(
        "projects",
        "allow_public_images",
        "BOOLEAN NOT NULL DEFAULT 1",
        "BOOLEAN",
        True,
        "1",
    ),
    ColumnSpec(
        "certifications",
        "expiration_date",
        "DATE NULL",
        "DATE",
        False,
        None,
    ),
)


@dataclass
class MigrationReport:
    mode: str
    statuses: list[dict[str, str]]
    changes: list[str]


def resolve_configured_database_path() -> Path:
    """Resuelve la SQLite configurada sin crear conexiones SQLAlchemy."""
    database_url = settings.database_url
    prefix = "sqlite:///"

    if not database_url.startswith(prefix):
        raise RuntimeError("C1 solo puede ejecutarse sobre una base SQLite.")

    raw_path = database_url.removeprefix(prefix)
    database_path = Path(raw_path)

    if not database_path.is_absolute():
        database_path = settings.backend_root / database_path

    return database_path.resolve()


def _normalize_default(value: object) -> str | None:
    if value is None:
        return None

    normalized = str(value).strip()

    while normalized.startswith("(") and normalized.endswith(")"):
        normalized = normalized[1:-1].strip()

    return normalized.strip("'\"")


def _table_info(connection: sqlite3.Connection, table: str) -> dict[str, dict]:
    rows = connection.execute(f'PRAGMA table_info("{table}")').fetchall()

    if not rows:
        raise RuntimeError(f"La tabla requerida '{table}' no existe.")

    return {
        row[1]: {
            "type": (row[2] or "").upper(),
            "not_null": bool(row[3]),
            "default": _normalize_default(row[4]),
        }
        for row in rows
    }


def inspect_columns(connection: sqlite3.Connection) -> list[dict[str, str]]:
    """Clasifica cada columna como existente, faltante o incompatible."""
    info_by_table = {
        table: _table_info(connection, table)
        for table in {spec.table for spec in COLUMN_SPECS}
    }
    statuses: list[dict[str, str]] = []

    for spec in COLUMN_SPECS:
        existing = info_by_table[spec.table].get(spec.name)
        status = "missing"

        if existing is not None:
            compatible = (
                existing["type"] == spec.expected_type
                and existing["not_null"] == spec.not_null
                and existing["default"] == spec.default
            )
            status = "existing" if compatible else "incompatible"

        statuses.append(
            {
                "table": spec.table,
                "column": spec.name,
                "status": status,
                "action": "none" if status == "existing" else "add" if status == "missing" else "stop",
            }
        )

    return statuses


def _schema_counts(connection: sqlite3.Connection) -> dict[str, int]:
    tables = [
        row[0]
        for row in connection.execute(
            "SELECT name FROM sqlite_master "
            "WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
        )
    ]
    return {
        table: connection.execute(f'SELECT count(*) FROM "{table}"').fetchone()[0]
        for table in tables
    }


def _relation_counts(connection: sqlite3.Connection) -> dict[str, int]:
    return {
        "project_images": connection.execute(
            "SELECT count(*) FROM project_images"
        ).fetchone()[0],
        "project_skills": connection.execute(
            "SELECT count(*) FROM project_skills"
        ).fetchone()[0],
    }


def _check_integrity(connection: sqlite3.Connection) -> None:
    integrity = [row[0] for row in connection.execute("PRAGMA integrity_check")]
    violations = connection.execute("PRAGMA foreign_key_check").fetchall()

    if integrity != ["ok"]:
        raise RuntimeError(f"PRAGMA integrity_check reportó: {integrity}.")

    if violations:
        raise RuntimeError(
            "PRAGMA foreign_key_check encontró "
            f"{len(violations)} violación(es)."
        )


def validate_backup(backup_path: Path, source_path: Path) -> None:
    """Valida apertura read-only, integridad y conteos del backup."""
    backup_path = backup_path.resolve()
    source_path = source_path.resolve()

    if not backup_path.is_file() or backup_path.stat().st_size == 0:
        raise RuntimeError(f"Backup inexistente o vacío: {backup_path}")

    with sqlite3.connect(
        f"file:{source_path.as_posix()}?mode=ro",
        uri=True,
    ) as source, sqlite3.connect(
        f"file:{backup_path.as_posix()}?mode=ro",
        uri=True,
    ) as backup:
        _check_integrity(source)
        _check_integrity(backup)

        if _schema_counts(source) != _schema_counts(backup):
            raise RuntimeError("El backup no conserva los conteos de la base origen.")


def _validate_real_path(database_path: Path) -> None:
    expected_path = resolve_configured_database_path()

    if database_path.resolve() != expected_path:
        raise RuntimeError(
            "La ruta no coincide con la SQLite configurada; aplicación rechazada."
        )

    if expected_path.parent != settings.backend_root.resolve():
        raise RuntimeError("La SQLite configurada está fuera de la raíz backend.")


def migrate_database(
    database_path: Path,
    *,
    apply: bool = False,
    backup_path: Path | None = None,
    allow_real_database: bool = False,
    failure_hook: Callable[[int], None] | None = None,
) -> MigrationReport:
    """Inspecciona o migra una SQLite; útil también para pruebas temporales."""
    database_path = database_path.resolve()

    if not database_path.is_file():
        raise RuntimeError(f"La base SQLite no existe: {database_path}")

    if database_path.name.lower() == "portfolio.db" and not allow_real_database:
        raise RuntimeError(
            "Protección C1: portfolio.db solo puede usarse desde el CLI validado."
        )

    if allow_real_database:
        _validate_real_path(database_path)

    if apply:
        if backup_path is None:
            raise RuntimeError("--apply requiere un backup C1 válido.")
        validate_backup(backup_path, database_path)

    uri = f"file:{database_path.as_posix()}?mode={'rw' if apply else 'ro'}"
    with sqlite3.connect(uri, uri=True, isolation_level=None) as connection:
        connection.execute("PRAGMA foreign_keys=ON")
        _check_integrity(connection)
        statuses = inspect_columns(connection)
        incompatible = [item for item in statuses if item["status"] == "incompatible"]

        if incompatible:
            fields = ", ".join(
                f"{item['table']}.{item['column']}" for item in incompatible
            )
            raise RuntimeError(
                "Se detectaron columnas incompatibles; no se reconstruirán tablas: "
                f"{fields}."
            )

        missing_names = {
            (item["table"], item["column"])
            for item in statuses
            if item["status"] == "missing"
        }
        missing_specs = [
            spec for spec in COLUMN_SPECS
            if (spec.table, spec.name) in missing_names
        ]

        if not apply:
            return MigrationReport(
                mode="dry-run",
                statuses=statuses,
                changes=[f"{spec.table}.{spec.name}" for spec in missing_specs],
            )

        counts_before = _schema_counts(connection)
        relations_before = _relation_counts(connection)
        connection.execute("BEGIN IMMEDIATE")

        try:
            for index, spec in enumerate(missing_specs, start=1):
                connection.execute(
                    f'ALTER TABLE "{spec.table}" '
                    f'ADD COLUMN "{spec.name}" {spec.declaration}'
                )

                if failure_hook is not None:
                    failure_hook(index)

            final_statuses = inspect_columns(connection)

            if any(item["status"] != "existing" for item in final_statuses):
                raise RuntimeError("La verificación de columnas C1 no fue satisfactoria.")

            if "is_confidential" in {spec.name for spec in missing_specs}:
                invalid = connection.execute(
                    "SELECT count(*) FROM projects "
                    "WHERE is_confidential IS NULL OR is_confidential != 0"
                ).fetchone()[0]
                if invalid:
                    raise RuntimeError("El default histórico de is_confidential no se aplicó.")

            if "allow_public_images" in {spec.name for spec in missing_specs}:
                invalid = connection.execute(
                    "SELECT count(*) FROM projects "
                    "WHERE allow_public_images IS NULL OR allow_public_images != 1"
                ).fetchone()[0]
                if invalid:
                    raise RuntimeError("El default histórico de allow_public_images no se aplicó.")

            if "expiration_date" in {spec.name for spec in missing_specs}:
                invalid = connection.execute(
                    "SELECT count(*) FROM certifications "
                    "WHERE expiration_date IS NOT NULL"
                ).fetchone()[0]
                if invalid:
                    raise RuntimeError("expiration_date debía iniciar en null.")

            if _schema_counts(connection) != counts_before:
                raise RuntimeError("Los conteos cambiaron durante la migración C1.")

            if _relation_counts(connection) != relations_before:
                raise RuntimeError("Las relaciones cambiaron durante la migración C1.")

            _check_integrity(connection)
            connection.execute("COMMIT")
        except Exception:
            connection.execute("ROLLBACK")
            raise

        _check_integrity(connection)
        return MigrationReport(
            mode="apply",
            statuses=inspect_columns(connection),
            changes=[f"{spec.table}.{spec.name}" for spec in missing_specs],
        )


def _latest_c1_backup() -> Path | None:
    backup_dir = settings.backend_root / "backups"
    candidates = sorted(
        backup_dir.glob("portfolio_before_c1_schema_*.db"),
        key=lambda item: item.stat().st_mtime,
        reverse=True,
    )
    return candidates[0] if candidates else None


def _print_report(report: MigrationReport) -> None:
    print(f"Modo: {report.mode}")
    for item in report.statuses:
        print(
            f"- tabla={item['table']} columna={item['column']} "
            f"estado={item['status']} acción={item['action']}"
        )
    print(f"Cambios: {len(report.changes)}")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--apply", action="store_true", help="Aplica columnas faltantes.")
    parser.add_argument("--backup-path", type=Path, help="Backup C1 requerido para aplicar.")
    args = parser.parse_args()

    database_path = resolve_configured_database_path()
    backup_path = args.backup_path

    if args.apply:
        backup_path = backup_path or _latest_c1_backup()
        if backup_path is None:
            raise RuntimeError("No se encontró un backup C1 válido.")
        if not backup_path.is_absolute():
            backup_path = settings.backend_root / backup_path
        validate_backup(backup_path, database_path)
        print(f"Backup verificado: {backup_path.resolve()}")

    report = migrate_database(
        database_path,
        apply=args.apply,
        backup_path=backup_path,
        allow_real_database=True,
    )
    _print_report(report)


if __name__ == "__main__":
    main()
