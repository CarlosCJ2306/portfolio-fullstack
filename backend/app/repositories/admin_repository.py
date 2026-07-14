"""
Módulo: app.repositories.admin_repository

Repositorio de administración para el portafolio.
"""

from __future__ import annotations

from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload, selectinload

from app.models.certification_model import Certification
from app.models.contact_message_model import ContactMessage
from app.models.education_model import Education
from app.models.experience_model import Experience, ExperienceBullet
from app.models.media_asset_model import MediaAsset
from app.models.profile_model import Profile
from app.models.project_model import Project, ProjectImage
from app.models.skill_model import Skill
from app.models.social_link_model import SocialLink


def get_next_display_order(
    db: Session,
    model,
    *,
    base: int = 0,
    filters: tuple = (),
) -> int:
    query = db.query(func.max(model.display_order))

    for filter_clause in filters:
        query = query.filter(filter_clause)

    max_display_order = query.scalar()

    if max_display_order is None:
        return base

    return int(max_display_order) + 1


class AdminRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_dashboard_counts(self) -> dict:
        return {
            "profile_exists": self.db.query(Profile).first() is not None,
            "total_social_links": self.db.query(SocialLink).count(),
            "total_skills": self.db.query(Skill).count(),
            "total_projects": self.db.query(Project).count(),
            "featured_projects": self.db.query(Project).filter(Project.is_featured.is_(True)).count(),
            "total_experience": self.db.query(Experience).count(),
            "total_education": self.db.query(Education).count(),
            "total_certifications": self.db.query(Certification).count(),
            "total_contact_messages": self.db.query(ContactMessage).count(),
            "unread_contact_messages": self.db.query(ContactMessage).filter(ContactMessage.is_read.is_(False)).count(),
        }

    def get_profile(self) -> Profile | None:
        return self.db.query(Profile).options(joinedload(Profile.avatar)).first()

    def upsert_profile(self, profile_data: dict) -> Profile:
        profile = self.get_profile()

        if profile is None:
            profile = Profile(**profile_data)
            self.db.add(profile)
            self.db.flush()
            return profile

        for key, value in profile_data.items():
            setattr(profile, key, value)

        self.db.flush()

        return profile

    def list_social_links(self) -> list[SocialLink]:
        return (
            self.db.query(SocialLink)
            .order_by(SocialLink.display_order.asc(), SocialLink.id.asc())
            .all()
        )

    def get_social_link(self, link_id: int) -> SocialLink | None:
        return self.db.query(SocialLink).filter(SocialLink.id == link_id).first()

    def create_social_link(self, social_link_data: dict) -> SocialLink:
        social_link = SocialLink(**social_link_data)
        self.db.add(social_link)
        self.db.flush()
        return social_link

    def get_next_entity_display_order(
        self,
        model,
        *,
        base: int = 0,
        filters: tuple = (),
    ) -> int:
        return get_next_display_order(
            self.db,
            model,
            base=base,
            filters=filters,
        )

    def delete_social_link(self, social_link: SocialLink) -> None:
        self.db.delete(social_link)

    def list_skills(self) -> list[Skill]:
        return (
            self.db.query(Skill)
            .options(joinedload(Skill.icon))
            .order_by(Skill.display_order.asc(), Skill.id.asc())
            .all()
        )

    def get_skill(self, skill_id: int) -> Skill | None:
        return self.db.query(Skill).filter(Skill.id == skill_id).first()

    def get_skills_by_ids(self, skill_ids: list[int]) -> list[Skill]:
        if not skill_ids:
            return []

        return (
            self.db.query(Skill)
            .filter(Skill.id.in_(skill_ids))
            .all()
        )

    def create_skill(self, skill_data: dict) -> Skill:
        skill = Skill(**skill_data)
        self.db.add(skill)
        self.db.flush()
        return skill

    def delete_skill(self, skill: Skill) -> None:
        self.db.delete(skill)

    def list_projects(self) -> list[Project]:
        return (
            self.db.query(Project)
            .options(
                joinedload(Project.image),
                selectinload(Project.gallery_items).joinedload(ProjectImage.image),
                selectinload(Project.skills).joinedload(Skill.icon)
            )
            .order_by(Project.display_order.asc(), Project.id.asc())
            .all()
        )

    def get_project(self, project_id: int) -> Project | None:
        return (
            self.db.query(Project)
            .options(
                joinedload(Project.image),
                selectinload(Project.gallery_items).joinedload(ProjectImage.image),
                selectinload(Project.skills).joinedload(Skill.icon)
            )
            .filter(Project.id == project_id)
            .first()
        )

    def create_project(self, project_data: dict) -> Project:
        skill_ids = project_data.pop("skill_ids", [])
        gallery_image_ids = project_data.pop("gallery_image_ids", [])
        project = Project(**project_data)

        self.db.add(project)
        project.skills = self.get_skills_by_ids(skill_ids)
        self.replace_project_gallery(project, gallery_image_ids)

        self.db.flush()

        return project

    def update_project(self, project: Project, project_data: dict) -> Project:
        skill_ids = project_data.pop("skill_ids", None)
        gallery_image_ids = project_data.pop("gallery_image_ids", None)

        for key, value in project_data.items():
            setattr(project, key, value)

        if skill_ids is not None:
            project.skills = self.get_skills_by_ids(skill_ids)

        if gallery_image_ids is not None:
            self.replace_project_gallery(project, gallery_image_ids)

        self.db.flush()

        return project

    def replace_project_gallery(
        self,
        project: Project,
        gallery_image_ids: list[int]
    ) -> None:
        project.gallery_items.clear()
        self.db.flush()

        for display_order, asset_id in enumerate(gallery_image_ids):
            project.gallery_items.append(
                ProjectImage(
                    media_asset_id=asset_id,
                    display_order=display_order
                )
            )

    def delete_project(self, project: Project) -> None:
        self.db.delete(project)

    def list_experience(self) -> list[Experience]:
        return (
            self.db.query(Experience)
            .options(selectinload(Experience.bullets))
            .order_by(Experience.display_order.asc(), Experience.id.asc())
            .all()
        )

    def get_experience(self, experience_id: int) -> Experience | None:
        return (
            self.db.query(Experience)
            .options(selectinload(Experience.bullets))
            .filter(Experience.id == experience_id)
            .first()
        )

    def create_experience(self, experience_data: dict) -> Experience:
        bullets = experience_data.pop("bullets", [])
        experience = Experience(**experience_data)
        self.db.add(experience)
        self.db.flush()
        self.replace_experience_bullets(experience, bullets)
        self.db.flush()
        return experience

    def update_experience(self, experience: Experience, experience_data: dict) -> Experience:
        bullets = experience_data.pop("bullets", None)

        for key, value in experience_data.items():
            setattr(experience, key, value)

        if bullets is not None:
            self.replace_experience_bullets(experience, bullets)

        self.db.flush()

        return experience

    def replace_experience_bullets(
        self,
        experience: Experience,
        bullets: list[dict]
    ) -> None:
        experience.bullets.clear()

        for index, bullet in enumerate(bullets, start=1):
            description = bullet["description"] if isinstance(bullet, dict) else str(bullet)

            experience.bullets.append(
                ExperienceBullet(
                    description=description,
                    display_order=index
                )
            )

    def delete_experience(self, experience: Experience) -> None:
        self.db.delete(experience)

    def list_education(self) -> list[Education]:
        return (
            self.db.query(Education)
            .order_by(Education.display_order.asc(), Education.id.asc())
            .all()
        )

    def get_education(self, education_id: int) -> Education | None:
        return self.db.query(Education).filter(Education.id == education_id).first()

    def create_education(self, education_data: dict) -> Education:
        education = Education(**education_data)
        self.db.add(education)
        self.db.flush()
        return education

    def delete_education(self, education: Education) -> None:
        self.db.delete(education)

    def list_certifications(self) -> list[Certification]:
        return (
            self.db.query(Certification)
            .order_by(Certification.display_order.asc(), Certification.id.asc())
            .all()
        )

    def get_certification(self, certification_id: int) -> Certification | None:
        return self.db.query(Certification).filter(Certification.id == certification_id).first()

    def create_certification(self, certification_data: dict) -> Certification:
        certification = Certification(**certification_data)
        self.db.add(certification)
        self.db.flush()
        return certification

    def delete_certification(self, certification: Certification) -> None:
        self.db.delete(certification)

    def list_contact_messages(self) -> list[ContactMessage]:
        return (
            self.db.query(ContactMessage)
            .order_by(ContactMessage.created_at.desc(), ContactMessage.id.desc())
            .all()
        )

    def get_contact_message(self, contact_message_id: int) -> ContactMessage | None:
        return (
            self.db.query(ContactMessage)
            .filter(ContactMessage.id == contact_message_id)
            .first()
        )

    def mark_contact_message_as_read(self, contact_message: ContactMessage) -> ContactMessage:
        contact_message.is_read = True
        self.db.flush()
        return contact_message

    def delete_contact_message(self, contact_message: ContactMessage) -> None:
        self.db.delete(contact_message)

    # -------------------------------------------------------------------------
    #                           MEDIA ASSETS
    # -------------------------------------------------------------------------

    def list_media_assets(self, asset_type: str | None = None) -> list[MediaAsset]:
        query = self.db.query(MediaAsset)
        if asset_type:
            query = query.filter(MediaAsset.asset_type == asset_type)
        return query.order_by(MediaAsset.id.desc()).all()

    def get_media_asset(self, asset_id: int) -> MediaAsset | None:
        return (
            self.db.query(MediaAsset)
            .filter(MediaAsset.id == asset_id)
            .first()
        )

    def get_media_assets_by_ids(self, asset_ids: list[int]) -> list[MediaAsset]:
        if not asset_ids:
            return []

        return (
            self.db.query(MediaAsset)
            .filter(MediaAsset.id.in_(asset_ids))
            .all()
        )

    def create_media_asset(self, data: dict) -> MediaAsset:
        asset = MediaAsset(**data)
        self.db.add(asset)
        self.db.flush()
        return asset

    def get_media_asset_usage(self, asset_id: int) -> list[dict[str, object]]:
        usages: list[dict[str, object]] = []

        profile_ids = [
            profile_id
            for profile_id, in (
                self.db.query(Profile.id)
                .filter(Profile.avatar_asset_id == asset_id)
                .all()
            )
        ]
        if profile_ids:
            usages.append(
                {
                    "relation": "profile.avatar_asset_id",
                    "label": "avatar del perfil",
                    "record_ids": profile_ids,
                }
            )

        skill_ids = [
            skill_id
            for skill_id, in (
                self.db.query(Skill.id)
                .filter(Skill.icon_asset_id == asset_id)
                .order_by(Skill.id.asc())
                .all()
            )
        ]
        if skill_ids:
            usages.append(
                {
                    "relation": "skills.icon_asset_id",
                    "label": "icono de skill",
                    "record_ids": skill_ids,
                }
            )

        project_cover_ids = [
            project_id
            for project_id, in (
                self.db.query(Project.id)
                .filter(Project.image_asset_id == asset_id)
                .order_by(Project.id.asc())
                .all()
            )
        ]
        if project_cover_ids:
            usages.append(
                {
                    "relation": "projects.image_asset_id",
                    "label": "portada de proyecto",
                    "record_ids": project_cover_ids,
                }
            )

        project_gallery_ids = [
            project_id
            for project_id, in (
                self.db.query(ProjectImage.project_id)
                .filter(ProjectImage.media_asset_id == asset_id)
                .order_by(ProjectImage.project_id.asc())
                .all()
            )
        ]
        if project_gallery_ids:
            usages.append(
                {
                    "relation": "project_images.media_asset_id",
                    "label": "galeria de proyecto",
                    "record_ids": project_gallery_ids,
                }
            )

        certification_ids = [
            certification_id
            for certification_id, in (
                self.db.query(Certification.id)
                .filter(Certification.certificate_file_id == asset_id)
                .order_by(Certification.id.asc())
                .all()
            )
        ]
        if certification_ids:
            usages.append(
                {
                    "relation": "certifications.certificate_file_id",
                    "label": "archivo de certificacion",
                    "record_ids": certification_ids,
                }
            )

        return usages

    def delete_media_asset(self, asset: MediaAsset) -> None:
        self.db.delete(asset)
