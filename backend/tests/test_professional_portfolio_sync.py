"""Pruebas del sincronizador editorial sobre la SQLite temporal de QA."""

from datetime import date
from hashlib import sha256

from sqlalchemy import func, select

from app.database.connection import DATABASE_URL, SessionLocal
from app.models.certification_model import Certification
from app.models.contact_message_model import ContactMessage
from app.models.education_model import Education
from app.models.experience_model import Experience
from app.models.media_asset_model import MediaAsset
from app.models.profile_model import Profile
from app.models.project_model import Project, ProjectImage, project_skills
from app.models.skill_model import Skill
from app.scripts.sync_professional_portfolio import (
    FEATURED_PROJECT_SLUGS,
    PROJECTS,
    PROTECTED_PATTERNS,
    synchronize,
)


def _protected_token() -> str:
    return PROTECTED_PATTERNS[0]


def _media_hashes() -> dict[int, str]:
    with SessionLocal() as session:
        rows = session.scalars(select(MediaAsset).order_by(MediaAsset.id))
        result = {}
        for row in rows:
            digest = sha256()
            digest.update((row.asset_type or "").encode())
            digest.update((row.mime_type or "").encode())
            digest.update((row.data_base64 or "").encode())
            digest.update((row.svg_content or "").encode())
            result[row.id] = digest.hexdigest()
        return result


def _seed_provisional_content() -> dict[str, int]:
    protected = _protected_token()
    with SessionLocal.begin() as session:
        image_asset = MediaAsset(
            asset_type="image",
            file_name=f"{protected}-provisional.png",
            mime_type="image/png",
            data_base64="aGVsbG8=",
            alt_text=f"Logo {protected}",
            is_active=True,
        )
        document_asset = MediaAsset(
            asset_type="document",
            file_name="certificado.pdf",
            mime_type="application/pdf",
            data_base64="JVBERi0xLjQKJSVFT0YK",
            alt_text="Certificado",
            is_active=True,
        )
        message = ContactMessage(
            name="QA",
            email="qa@example.com",
            subject="No tocar",
            message="Mensaje preservado",
        )
        session.add_all((image_asset, document_asset, message))
        session.flush()
        session.add(
            Profile(
                full_name="Perfil provisional",
                professional_title="Temporal",
                summary="Temporal",
                avatar_asset_id=image_asset.id,
                cv_url="https://example.com/cv.pdf",
            )
        )
        historical_experience = Experience(
            company=protected,
            position="Cargo reservado",
            start_date=date(2020, 1, 1),
            is_current=True,
            is_active=True,
            display_order=5,
            description=f"Experiencia con {protected}",
        )
        fofimatic = Experience(
            company="Fofimatic S.A.S.",
            position="Cargo anterior",
            start_date=date(2024, 6, 1),
            is_current=True,
            is_active=True,
        )
        session.add_all((historical_experience, fofimatic))
        session.add(
            Certification(
                name="Certificación provisional",
                issuer="Emisor",
                issue_date=date(2023, 3, 6),
                credential_url="https://example.com/credential",
                certificate_file_id=document_asset.id,
                is_active=True,
            )
        )
        old_project = Project(
            title=f"Proyecto {protected}",
            slug="proyecto-provisional",
            short_description=f"Temporal {protected}",
            description=f"Temporal {protected}",
            image_asset_id=image_asset.id,
            is_active=True,
        )
        session.add(old_project)
        session.flush()
        session.add(ProjectImage(project_id=old_project.id, media_asset_id=image_asset.id, display_order=0))
        return {
            "image_asset_id": image_asset.id,
            "document_asset_id": document_asset.id,
            "message_id": message.id,
            "historical_project_id": old_project.id,
        }


def test_sync_uses_temporary_sqlite() -> None:
    assert "portfolio.db" not in DATABASE_URL.replace("\\", "/").lower()


def test_sync_is_idempotent_and_preserves_sensitive_entities() -> None:
    ids = _seed_provisional_content()
    media_hashes = _media_hashes()

    with SessionLocal() as session:
        first = synchronize(session, apply=True)
    with SessionLocal() as session:
        second = synchronize(session, apply=True)

    assert first.operations
    assert second.operations == []

    with SessionLocal() as session:
        assert session.get(MediaAsset, ids["image_asset_id"]) is not None
        assert session.get(MediaAsset, ids["document_asset_id"]) is not None
        assert session.get(ContactMessage, ids["message_id"]) is not None
        assert _media_hashes() == media_hashes
        assert session.scalar(select(func.count()).select_from(MediaAsset)) == 2
        assert session.scalar(select(func.count()).select_from(ContactMessage)) == 1

        profile = session.scalar(select(Profile))
        assert profile is not None
        assert "Egresado de Ingeniería de Sistemas" in profile.professional_title
        assert profile.avatar_asset_id == ids["image_asset_id"]
        assert profile.cv_url == "https://example.com/cv.pdf"

        active_experiences = list(session.scalars(select(Experience).where(Experience.is_active.is_(True)).order_by(Experience.display_order)))
        assert [(item.company, item.end_date, item.is_current) for item in active_experiences] == [
            ("Fofimatic S.A.S.", date(2026, 3, 31), False),
            ("Kodland", date(2026, 2, 28), False),
        ]
        assert len(active_experiences[0].bullets) == 8
        assert len(active_experiences[1].bullets) == 5

        historical_experiences = list(session.scalars(select(Experience).where(Experience.is_active.is_(False))))
        assert historical_experiences
        assert all(_protected_token().casefold() not in item.company.casefold() for item in historical_experiences)

        projects = list(session.scalars(select(Project).where(Project.is_active.is_(True)).order_by(Project.display_order)))
        assert [item.slug for item in projects] == [item["slug"] for item in PROJECTS]
        assert all(item.is_confidential for item in projects)
        assert all(not item.allow_public_images for item in projects)
        assert all(item.image_asset_id is None for item in projects)
        assert all(item.gallery_items == [] for item in projects)
        assert all(item.repository_url is None and item.demo_url is None for item in projects)
        assert {item.slug for item in projects if item.is_featured} == FEATURED_PROJECT_SLUGS
        assert session.scalar(select(func.count()).select_from(project_skills)) == 50

        historical_project = session.get(Project, ids["historical_project_id"])
        assert historical_project is not None
        assert historical_project.is_active is False
        assert historical_project.image_asset_id == ids["image_asset_id"]
        assert len(historical_project.gallery_items) == 1

        education = session.scalar(select(Education).where(Education.is_active.is_(True)))
        assert education is not None
        assert education.degree == "Egresado de Ingeniería de Sistemas"
        assert "título obtenido" not in (education.description or "").casefold()
        assert "graduado" not in (education.description or "").casefold()

        certifications = list(session.scalars(select(Certification)))
        assert certifications and all(not item.is_active for item in certifications)
        assert certifications[0].certificate_file_id == ids["document_asset_id"]
        assert certifications[0].credential_url == "https://example.com/credential"

        assert session.scalar(select(func.count()).select_from(Skill).where(Skill.is_active.is_(True))) == 41
        assert {item.level for item in session.scalars(select(Skill).where(Skill.is_active.is_(True)))} == {
            "Principal",
            "Intermedio",
            "Complementario",
        }


def test_dry_run_rolls_back_every_change() -> None:
    ids = _seed_provisional_content()
    with SessionLocal() as session:
        report = synchronize(session, apply=False)
    assert report.operations

    with SessionLocal() as session:
        assert session.scalar(select(func.count()).select_from(Project).where(Project.slug.in_([item["slug"] for item in PROJECTS]))) == 0
        assert session.get(MediaAsset, ids["image_asset_id"]) is not None
        assert session.get(ContactMessage, ids["message_id"]) is not None
        assert session.scalar(select(func.count()).select_from(Experience).where(Experience.company == "Kodland", Experience.is_active.is_(True))) == 0
        profile = session.scalar(select(Profile))
        assert profile is not None and profile.full_name == "Perfil provisional"


def test_failure_after_flush_rolls_back_complete_transaction() -> None:
    ids = _seed_provisional_content()

    def fail() -> None:
        raise RuntimeError("fallo controlado de QA")

    with SessionLocal() as session:
        try:
            synchronize(session, apply=True, failure_hook=fail)
        except RuntimeError as error:
            assert str(error) == "fallo controlado de QA"
        else:
            raise AssertionError("La prueba debía provocar rollback")

    with SessionLocal() as session:
        assert session.scalar(select(func.count()).select_from(Project).where(Project.slug.in_([item["slug"] for item in PROJECTS]))) == 0
        assert session.get(MediaAsset, ids["image_asset_id"]) is not None
        assert session.get(ContactMessage, ids["message_id"]) is not None
        profile = session.scalar(select(Profile))
        assert profile is not None and profile.full_name == "Perfil provisional"


def test_public_fields_do_not_keep_protected_references() -> None:
    _seed_provisional_content()
    with SessionLocal() as session:
        synchronize(session, apply=True)

    protected = _protected_token().casefold()
    with SessionLocal() as session:
        values: list[str] = []
        values.extend(item.company for item in session.scalars(select(Experience)))
        values.extend(item.position for item in session.scalars(select(Experience)))
        values.extend(item.title for item in session.scalars(select(Project)))
        values.extend(item.short_description for item in session.scalars(select(Project)))
        values.extend(item.description for item in session.scalars(select(Project)))
        values.extend(item.file_name or "" for item in session.scalars(select(MediaAsset)))
        values.extend(item.alt_text or "" for item in session.scalars(select(MediaAsset)))

    assert all(protected not in value.casefold() for value in values if value)
