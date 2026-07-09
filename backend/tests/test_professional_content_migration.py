"""Pruebas de la migración C1 sobre archivos SQLite desechables."""

from __future__ import annotations

import sqlite3
from pathlib import Path

import pytest

from app.scripts.migrate_professional_content_fields import (
    migrate_database,
)


def _create_legacy_database(path: Path) -> None:
    with sqlite3.connect(path) as connection:
        connection.executescript(
            """
            PRAGMA foreign_keys=ON;
            CREATE TABLE media_assets (
                id INTEGER PRIMARY KEY,
                asset_type VARCHAR(80) NOT NULL
            );
            CREATE TABLE projects (
                id INTEGER PRIMARY KEY,
                title VARCHAR(150) NOT NULL,
                slug VARCHAR(180) NOT NULL,
                image_asset_id INTEGER NULL REFERENCES media_assets(id)
            );
            CREATE TABLE certifications (
                id INTEGER PRIMARY KEY,
                name VARCHAR(180) NOT NULL,
                issue_date DATE NULL,
                certificate_file_id INTEGER NULL REFERENCES media_assets(id)
            );
            CREATE TABLE project_images (
                project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
                media_asset_id INTEGER NOT NULL REFERENCES media_assets(id) ON DELETE RESTRICT,
                display_order INTEGER NOT NULL DEFAULT 0,
                PRIMARY KEY (project_id, media_asset_id)
            );
            CREATE TABLE skills (id INTEGER PRIMARY KEY, name VARCHAR(100) NOT NULL);
            CREATE TABLE project_skills (
                project_id INTEGER NOT NULL REFERENCES projects(id),
                skill_id INTEGER NOT NULL REFERENCES skills(id),
                PRIMARY KEY (project_id, skill_id)
            );
            CREATE TABLE contact_messages (
                id INTEGER PRIMARY KEY,
                message TEXT NOT NULL
            );
            INSERT INTO media_assets VALUES (1, 'image');
            INSERT INTO projects VALUES (1, 'Legacy', 'legacy', 1);
            INSERT INTO certifications VALUES (1, 'Legacy', '2025-01-01', NULL);
            INSERT INTO project_images VALUES (1, 1, 0);
            INSERT INTO skills VALUES (1, 'Python');
            INSERT INTO project_skills VALUES (1, 1);
            INSERT INTO contact_messages VALUES (1, 'private');
            """
        )


def _backup(source: Path, target: Path) -> None:
    with sqlite3.connect(source) as source_connection, sqlite3.connect(target) as target_connection:
        source_connection.backup(target_connection)


def _columns(path: Path, table: str) -> dict[str, tuple]:
    with sqlite3.connect(path) as connection:
        return {
            row[1]: row
            for row in connection.execute(f'PRAGMA table_info("{table}")')
        }


def test_dry_run_detects_five_actions_without_modifying_file(tmp_path: Path) -> None:
    database = tmp_path / "legacy.sqlite3"
    _create_legacy_database(database)
    before = database.stat()

    report = migrate_database(database)

    after = database.stat()
    assert len(report.changes) == 5
    assert before.st_size == after.st_size
    assert before.st_mtime_ns == after.st_mtime_ns
    assert "is_confidential" not in _columns(database, "projects")


def test_apply_preserves_rows_relations_and_historical_defaults(tmp_path: Path) -> None:
    database = tmp_path / "legacy.sqlite3"
    backup = tmp_path / "legacy-backup.sqlite3"
    _create_legacy_database(database)
    _backup(database, backup)

    report = migrate_database(database, apply=True, backup_path=backup)

    assert len(report.changes) == 5
    with sqlite3.connect(database) as connection:
        project = connection.execute(
            "SELECT is_confidential, confidentiality_note, client_display_name, "
            "allow_public_images FROM projects WHERE id=1"
        ).fetchone()
        certification = connection.execute(
            "SELECT expiration_date FROM certifications WHERE id=1"
        ).fetchone()
        assert project == (0, None, None, 1)
        assert certification == (None,)
        assert connection.execute("SELECT count(*) FROM project_images").fetchone()[0] == 1
        assert connection.execute("SELECT count(*) FROM project_skills").fetchone()[0] == 1
        assert connection.execute("SELECT count(*) FROM media_assets").fetchone()[0] == 1
        assert connection.execute("SELECT count(*) FROM contact_messages").fetchone()[0] == 1
        assert connection.execute("PRAGMA integrity_check").fetchone()[0] == "ok"
        assert connection.execute("PRAGMA foreign_key_check").fetchall() == []

    second = migrate_database(database, apply=True, backup_path=backup)
    assert second.changes == []


def test_failure_rolls_back_all_added_columns(tmp_path: Path) -> None:
    database = tmp_path / "legacy.sqlite3"
    backup = tmp_path / "legacy-backup.sqlite3"
    _create_legacy_database(database)
    _backup(database, backup)

    def fail_after_second_column(index: int) -> None:
        if index == 2:
            raise RuntimeError("controlled migration failure")

    with pytest.raises(RuntimeError, match="controlled migration failure"):
        migrate_database(
            database,
            apply=True,
            backup_path=backup,
            failure_hook=fail_after_second_column,
        )

    assert "is_confidential" not in _columns(database, "projects")
    assert "confidentiality_note" not in _columns(database, "projects")
    assert "expiration_date" not in _columns(database, "certifications")


def test_partial_schema_adds_only_missing_columns(tmp_path: Path) -> None:
    database = tmp_path / "legacy.sqlite3"
    backup = tmp_path / "legacy-backup.sqlite3"
    _create_legacy_database(database)
    with sqlite3.connect(database) as connection:
        connection.execute(
            "ALTER TABLE projects ADD COLUMN is_confidential "
            "BOOLEAN NOT NULL DEFAULT 0"
        )
    _backup(database, backup)

    report = migrate_database(database, apply=True, backup_path=backup)

    assert len(report.changes) == 4
    assert all(item["status"] == "existing" for item in report.statuses)


def test_incompatible_column_aborts_without_rebuilding(tmp_path: Path) -> None:
    database = tmp_path / "legacy.sqlite3"
    _create_legacy_database(database)
    with sqlite3.connect(database) as connection:
        connection.execute("ALTER TABLE projects ADD COLUMN is_confidential TEXT")

    with pytest.raises(RuntimeError, match="columnas incompatibles"):
        migrate_database(database)

    assert _columns(database, "projects")["is_confidential"][2] == "TEXT"
    assert "confidentiality_note" not in _columns(database, "projects")


def test_test_helper_rejects_portfolio_database_name(tmp_path: Path) -> None:
    database = tmp_path / "portfolio.db"
    _create_legacy_database(database)

    with pytest.raises(RuntimeError, match="Protección C1"):
        migrate_database(database)
