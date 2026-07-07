"""Pruebas del sincronizador editorial sobre la SQLite temporal de QA."""

from sqlalchemy import func, select

from app.database.connection import SessionLocal
from app.models.certification_model import Certification
from app.models.contact_message_model import ContactMessage
from app.models.experience_model import Experience
from app.models.media_asset_model import MediaAsset
from app.models.profile_model import Profile
from app.models.project_model import Project, ProjectImage
from app.models.skill_model import Skill
from app.scripts.sync_professional_portfolio import PROJECTS, synchronize


def _seed_provisional_content() -> tuple[int, int]:
    with SessionLocal.begin() as session:
        asset = MediaAsset(
            asset_type="image",
            file_name="provisional.png",
            mime_type="image/png",
            data_base64="aGVsbG8=",
            is_active=True,
        )
        message = ContactMessage(
            name="QA",
            email="qa@example.com",
            subject="No tocar",
            message="Mensaje preservado",
        )
        session.add_all((asset, message))
        session.flush()
        session.add_all(
            (
                Profile(
                    full_name="Perfil provisional",
                    professional_title="Temporal",
                    summary="Temporal",
                    avatar_asset_id=asset.id,
                ),
                Experience(
                    company="Kodland",
                    position="Tutor",
                    start_date=__import__("datetime").date(2023, 1, 1),
                    is_active=True,
                ),
                Certification(
                    name="Certificación provisional",
                    certificate_file_id=None,
                    is_active=True,
                ),
            )
        )
        old_project = Project(
            title="Proyecto provisional",
            slug="proyecto-provisional",
            short_description="Temporal",
            description="Temporal",
            image_asset_id=asset.id,
            is_active=True,
        )
        session.add(old_project)
        session.flush()
        session.add(ProjectImage(project_id=old_project.id, media_asset_id=asset.id, display_order=0))
        return asset.id, message.id


def test_sync_is_idempotent_and_preserves_sensitive_entities() -> None:
    asset_id, message_id = _seed_provisional_content()

    with SessionLocal() as session:
        first = synchronize(session, apply=True)
    with SessionLocal() as session:
        second = synchronize(session, apply=True)

    assert first.operations
    assert second.operations == []

    with SessionLocal() as session:
        assert session.get(MediaAsset, asset_id) is not None
        assert session.get(ContactMessage, message_id) is not None
        assert session.scalar(select(func.count()).select_from(MediaAsset)) == 1
        assert session.scalar(select(func.count()).select_from(ContactMessage)) == 1

        active_experiences = list(session.scalars(select(Experience).where(Experience.is_active.is_(True))))
        assert [item.company for item in active_experiences] == ["Fofimatic S.A.S."]
        assert not session.scalar(
            select(func.count()).select_from(Experience).where(
                Experience.is_active.is_(True),
                func.lower(Experience.company).contains("kodland"),
            )
        )

        projects = list(session.scalars(select(Project).where(Project.is_active.is_(True))))
        assert {item.slug for item in projects} == {item["slug"] for item in PROJECTS}
        assert all(item.image_asset_id is None for item in projects)
        assert all(item.gallery_items == [] for item in projects)
        assert all(item.repository_url is None and item.demo_url is None for item in projects)
        assert session.scalar(select(func.count()).select_from(Certification).where(Certification.is_active.is_(True))) == 0
        assert session.scalar(select(func.count()).select_from(Skill).where(Skill.is_active.is_(True))) == 41


def test_dry_run_rolls_back_every_change() -> None:
    asset_id, message_id = _seed_provisional_content()
    with SessionLocal() as session:
        report = synchronize(session, apply=False)
    assert report.operations

    with SessionLocal() as session:
        assert session.scalar(select(func.count()).select_from(Project).where(Project.slug.in_([item["slug"] for item in PROJECTS]))) == 0
        assert session.get(MediaAsset, asset_id) is not None
        assert session.get(ContactMessage, message_id) is not None
        assert session.scalar(select(func.count()).select_from(Experience).where(Experience.company == "Kodland", Experience.is_active.is_(True))) == 1


def test_failure_after_flush_rolls_back_complete_transaction() -> None:
    asset_id, message_id = _seed_provisional_content()

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
        assert session.get(MediaAsset, asset_id) is not None
        assert session.get(ContactMessage, message_id) is not None
        profile = session.scalar(select(Profile))
        assert profile is not None and profile.full_name == "Perfil provisional"
