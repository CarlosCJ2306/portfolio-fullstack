"""
Módulo: app.services.admin_service

Servicio de administración para el portafolio.
"""

from __future__ import annotations

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.core.log import log_error, log_info, log_success
from app.repositories.admin_repository import AdminRepository
from app.schemas.admin_schema import (
    AdminDashboardRead,
    CertificationCreate,
    CertificationUpdate,
    ContactMessageRead,
    EducationCreate,
    EducationUpdate,
    ExperienceCreate,
    ExperienceUpdate,
    MediaAssetCreate,
    ProfileUpdate,
    ProjectCreate,
    ProjectUpdate,
    SocialLinkCreate,
    SocialLinkUpdate,
    SkillCreate,
    SkillUpdate,
)


class AdminService:
    def __init__(self, db: Session) -> None:
        self.repository = AdminRepository(db)

    def _commit(self, context_message: str, user_message: str):
        try:
            self.repository.db.commit()
        except IntegrityError as error:
            self.repository.db.rollback()

            log_error(context_message, error=error)

            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=user_message
            ) from error

        return None

    def _validate_project_gallery_image_ids(
        self,
        gallery_image_ids: list[int] | None
    ) -> None:
        if gallery_image_ids is None:
            return

        if len(gallery_image_ids) != len(set(gallery_image_ids)):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No se permiten IDs duplicados en la galeria del proyecto."
            )

        if not gallery_image_ids:
            return

        assets = self.repository.get_media_assets_by_ids(gallery_image_ids)
        assets_by_id = {asset.id: asset for asset in assets}

        missing_ids = [
            asset_id
            for asset_id in gallery_image_ids
            if asset_id not in assets_by_id
        ]

        if missing_ids:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Una o mas imagenes de galeria no existen."
            )

        invalid_asset_ids = [
            asset.id
            for asset in assets
            if asset.asset_type != "image"
        ]

        if invalid_asset_ids:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Uno o mas assets de la galeria no corresponden a imagenes."
            )

    def get_dashboard(self) -> AdminDashboardRead:
        log_info("Consultando dashboard administrativo.")

        dashboard = AdminDashboardRead(**self.repository.get_dashboard_counts())

        log_success("Dashboard administrativo consultado.")

        return dashboard

    def get_profile(self):
        profile = self.repository.get_profile()

        if profile is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Perfil no encontrado."
            )

        return profile

    def update_profile(self, payload: ProfileUpdate):
        profile = self.repository.upsert_profile(payload.model_dump(exclude_unset=True))
        self._commit(
            "Error actualizando perfil.",
            "No se pudo actualizar el perfil."
        )
        self.repository.db.refresh(profile)
        return profile

    def list_social_links(self):
        return self.repository.list_social_links()

    def create_social_link(self, payload: SocialLinkCreate):
        social_link = self.repository.create_social_link(payload.model_dump())
        self._commit("Error creando enlace social.", "No se pudo crear el enlace social.")
        self.repository.db.refresh(social_link)
        return social_link

    def get_social_link(self, social_link_id: int):
        social_link = self.repository.get_social_link(social_link_id)

        if social_link is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Enlace social no encontrado.")

        return social_link

    def update_social_link(self, social_link_id: int, payload: SocialLinkUpdate):
        social_link = self.get_social_link(social_link_id)
        update_data = payload.model_dump(exclude_unset=True)

        for key, value in update_data.items():
            setattr(social_link, key, value)

        self._commit("Error actualizando enlace social.", "No se pudo actualizar el enlace social.")
        self.repository.db.refresh(social_link)
        return social_link

    def delete_social_link(self, social_link_id: int) -> None:
        social_link = self.get_social_link(social_link_id)
        self.repository.delete_social_link(social_link)
        self._commit("Error eliminando enlace social.", "No se pudo eliminar el enlace social.")

    def list_skills(self):
        return self.repository.list_skills()

    def create_skill(self, payload: SkillCreate):
        skill = self.repository.create_skill(payload.model_dump())
        self._commit("Error creando skill.", "No se pudo crear la skill.")
        self.repository.db.refresh(skill)
        return skill

    def get_skill(self, skill_id: int):
        skill = self.repository.get_skill(skill_id)

        if skill is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Skill no encontrada.")

        return skill

    def update_skill(self, skill_id: int, payload: SkillUpdate):
        skill = self.get_skill(skill_id)
        for key, value in payload.model_dump(exclude_unset=True).items():
            setattr(skill, key, value)

        self._commit("Error actualizando skill.", "No se pudo actualizar la skill.")
        self.repository.db.refresh(skill)
        return skill

    def delete_skill(self, skill_id: int) -> None:
        skill = self.get_skill(skill_id)
        self.repository.delete_skill(skill)
        self._commit("Error eliminando skill.", "No se pudo eliminar la skill.")

    def list_projects(self):
        return self.repository.list_projects()

    def create_project(self, payload: ProjectCreate):
        project_data = payload.model_dump(exclude_unset=True)
        skill_ids = project_data.get("skill_ids", [])
        gallery_image_ids = project_data.get("gallery_image_ids", [])
        if skill_ids:
            skills = self.repository.get_skills_by_ids(skill_ids)
            if len(skills) != len(set(skill_ids)):
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Una o más skills no existen.")

        self._validate_project_gallery_image_ids(gallery_image_ids)
        project = self.repository.create_project(project_data)
        self._commit("Error creando proyecto.", "No se pudo crear el proyecto.")
        self.repository.db.refresh(project)
        return project

    def get_project(self, project_id: int):
        project = self.repository.get_project(project_id)

        if project is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Proyecto no encontrado.")

        return project

    def update_project(self, project_id: int, payload: ProjectUpdate):
        project = self.get_project(project_id)
        project_data = payload.model_dump(exclude_unset=True)
        skill_ids = project_data.get("skill_ids")
        gallery_image_ids = project_data.get("gallery_image_ids")

        if skill_ids is not None:
            skills = self.repository.get_skills_by_ids(skill_ids)
            if len(skills) != len(set(skill_ids)):
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Una o más skills no existen.")

        self._validate_project_gallery_image_ids(gallery_image_ids)
        self.repository.update_project(project, project_data)
        self._commit("Error actualizando proyecto.", "No se pudo actualizar el proyecto.")
        self.repository.db.refresh(project)
        return project

    def delete_project(self, project_id: int) -> None:
        project = self.get_project(project_id)
        self.repository.delete_project(project)
        self._commit("Error eliminando proyecto.", "No se pudo eliminar el proyecto.")

    def list_experience(self):
        return self.repository.list_experience()

    def create_experience(self, payload: ExperienceCreate):
        experience = self.repository.create_experience(payload.model_dump(exclude_unset=True))
        self._commit("Error creando experiencia.", "No se pudo crear la experiencia.")
        self.repository.db.refresh(experience)
        return experience

    def get_experience(self, experience_id: int):
        experience = self.repository.get_experience(experience_id)

        if experience is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Experiencia no encontrada.")

        return experience

    def update_experience(self, experience_id: int, payload: ExperienceUpdate):
        experience = self.get_experience(experience_id)
        self.repository.update_experience(experience, payload.model_dump(exclude_unset=True))
        self._commit("Error actualizando experiencia.", "No se pudo actualizar la experiencia.")
        self.repository.db.refresh(experience)
        return experience

    def delete_experience(self, experience_id: int) -> None:
        experience = self.get_experience(experience_id)
        self.repository.delete_experience(experience)
        self._commit("Error eliminando experiencia.", "No se pudo eliminar la experiencia.")

    def list_education(self):
        return self.repository.list_education()

    def create_education(self, payload: EducationCreate):
        education = self.repository.create_education(payload.model_dump())
        self._commit("Error creando educación.", "No se pudo crear la educación.")
        self.repository.db.refresh(education)
        return education

    def get_education(self, education_id: int):
        education = self.repository.get_education(education_id)

        if education is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Educación no encontrada.")

        return education

    def update_education(self, education_id: int, payload: EducationUpdate):
        education = self.get_education(education_id)
        for key, value in payload.model_dump(exclude_unset=True).items():
            setattr(education, key, value)

        self._commit("Error actualizando educación.", "No se pudo actualizar la educación.")
        self.repository.db.refresh(education)
        return education

    def delete_education(self, education_id: int) -> None:
        education = self.get_education(education_id)
        self.repository.delete_education(education)
        self._commit("Error eliminando educación.", "No se pudo eliminar la educación.")

    def list_certifications(self):
        return self.repository.list_certifications()

    def create_certification(self, payload: CertificationCreate):
        certification = self.repository.create_certification(payload.model_dump())
        self._commit("Error creando certificación.", "No se pudo crear la certificación.")
        self.repository.db.refresh(certification)
        return certification

    def get_certification(self, certification_id: int):
        certification = self.repository.get_certification(certification_id)

        if certification is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Certificación no encontrada.")

        return certification

    def update_certification(self, certification_id: int, payload: CertificationUpdate):
        certification = self.get_certification(certification_id)
        for key, value in payload.model_dump(exclude_unset=True).items():
            setattr(certification, key, value)

        self._commit("Error actualizando certificación.", "No se pudo actualizar la certificación.")
        self.repository.db.refresh(certification)
        return certification

    def delete_certification(self, certification_id: int) -> None:
        certification = self.get_certification(certification_id)
        self.repository.delete_certification(certification)
        self._commit("Error eliminando certificación.", "No se pudo eliminar la certificación.")

    def list_contact_messages(self):
        return self.repository.list_contact_messages()

    def get_contact_message(self, contact_message_id: int):
        contact_message = self.repository.get_contact_message(contact_message_id)

        if contact_message is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Mensaje de contacto no encontrado.")

        return contact_message

    def mark_contact_message_as_read(self, contact_message_id: int):
        contact_message = self.get_contact_message(contact_message_id)
        self.repository.mark_contact_message_as_read(contact_message)
        self._commit("Error marcando mensaje como leído.", "No se pudo actualizar el mensaje de contacto.")
        self.repository.db.refresh(contact_message)
        return contact_message

    def delete_contact_message(self, contact_message_id: int) -> None:
        contact_message = self.get_contact_message(contact_message_id)
        self.repository.delete_contact_message(contact_message)
        self._commit("Error eliminando mensaje de contacto.", "No se pudo eliminar el mensaje de contacto.")

    # -------------------------------------------------------------------------
    #                           MEDIA ASSETS
    # -------------------------------------------------------------------------

    def list_media_assets(self, asset_type: str | None = None):
        log_info("Listando media assets.", asset_type=asset_type)
        return self.repository.list_media_assets(asset_type)

    def get_media_asset(self, asset_id: int):
        asset = self.repository.get_media_asset(asset_id)

        if asset is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Media asset no encontrado."
            )

        return asset

    def upload_media_asset(self, payload: MediaAssetCreate):
        asset = self.repository.create_media_asset(payload.model_dump())
        self._commit(
            "Error creando media asset.",
            "No se pudo guardar el asset multimedia."
        )
        self.repository.db.refresh(asset)
        log_success("Media asset creado.", asset_id=asset.id, asset_type=asset.asset_type)
        return asset

    def _build_media_asset_in_use_message(
        self,
        asset_id: int,
        usages: list[dict[str, object]]
    ) -> str:
        usage_parts = []

        for usage in usages:
            record_ids = usage["record_ids"]
            usage_parts.append(
                f'{usage["label"]} ({usage["relation"]}, IDs: {record_ids})'
            )

        usage_summary = "; ".join(usage_parts)

        return (
            f"No se puede eliminar el asset multimedia {asset_id} porque esta en uso en: "
            f"{usage_summary}."
        )

    def delete_media_asset(self, asset_id: int) -> None:
        asset = self.get_media_asset(asset_id)
        usages = self.repository.get_media_asset_usage(asset_id)

        if usages:
            detail = self._build_media_asset_in_use_message(asset_id, usages)
            log_info(
                "Eliminacion de media asset bloqueada por referencias activas.",
                asset_id=asset_id,
                usages=usages
            )
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=detail
            )

        self.repository.delete_media_asset(asset)
        self._commit(
            "Error eliminando media asset.",
            "No se pudo eliminar el asset multimedia."
        )
        log_success("Media asset eliminado.", asset_id=asset_id)
