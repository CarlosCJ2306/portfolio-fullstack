"""
Módulo: app.routers.admin_router

Router protegido para administrar el portafolio.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.core.admin_auth import verify_admin_access
from app.core.log import log_info, log_success
from app.database.connection import get_db
from app.schemas.admin_schema import (
    AdminDashboardRead,
    AdminProfileRead,
    CertificationCreate,
    CertificationUpdate,
    CertificationAdminRead,
    ContactMessageRead,
    EducationCreate,
    EducationUpdate,
    EducationAdminRead,
    ExperienceCreate,
    ExperienceUpdate,
    ExperienceAdminRead,
    MediaAssetCreate,
    MediaAssetAdminRead,
    ProfileUpdate,
    ProjectCreate,
    ProjectUpdate,
    ProjectAdminRead,
    SocialLinkCreate,
    SocialLinkUpdate,
    SocialLinkAdminRead,
    SkillCreate,
    SkillUpdate,
    SkillAdminRead,
)
from app.services.admin_service import AdminService
from app.services.media_content_service import (
    MediaContentService,
    build_content_response,
)


router = APIRouter(
    prefix="/api/admin",
    tags=["Admin"],
    dependencies=[Depends(verify_admin_access)]
)


@router.get("/health")
def admin_health() -> dict:
    log_info("Health check admin ejecutado.")

    return {
        "status": "ok",
        "module": "admin",
        "message": "Admin API is running",
    }


@router.get("/dashboard", response_model=AdminDashboardRead)
def get_dashboard(db: Session = Depends(get_db)):
    return AdminService(db).get_dashboard()


@router.get("/profile", response_model=AdminProfileRead)
def get_profile(db: Session = Depends(get_db)):
    return AdminService(db).get_profile()


@router.put("/profile", response_model=AdminProfileRead)
def update_profile(
    payload: ProfileUpdate,
    db: Session = Depends(get_db)
):
    return AdminService(db).update_profile(payload)


@router.get("/social-links", response_model=list[SocialLinkAdminRead])
def list_social_links(db: Session = Depends(get_db)):
    return AdminService(db).list_social_links()


@router.post("/social-links", response_model=SocialLinkAdminRead, status_code=status.HTTP_201_CREATED)
def create_social_link(payload: SocialLinkCreate, db: Session = Depends(get_db)):
    return AdminService(db).create_social_link(payload)


@router.put("/social-links/{social_link_id}", response_model=SocialLinkAdminRead)
def update_social_link(
    social_link_id: int,
    payload: SocialLinkUpdate,
    db: Session = Depends(get_db)
):
    return AdminService(db).update_social_link(social_link_id, payload)


@router.delete("/social-links/{social_link_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_social_link(social_link_id: int, db: Session = Depends(get_db)):
    AdminService(db).delete_social_link(social_link_id)


@router.get("/skills", response_model=list[SkillAdminRead])
def list_skills(db: Session = Depends(get_db)):
    return AdminService(db).list_skills()


@router.post("/skills", response_model=SkillAdminRead, status_code=status.HTTP_201_CREATED)
def create_skill(payload: SkillCreate, db: Session = Depends(get_db)):
    return AdminService(db).create_skill(payload)


@router.put("/skills/{skill_id}", response_model=SkillAdminRead)
def update_skill(skill_id: int, payload: SkillUpdate, db: Session = Depends(get_db)):
    return AdminService(db).update_skill(skill_id, payload)


@router.delete("/skills/{skill_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_skill(skill_id: int, db: Session = Depends(get_db)):
    AdminService(db).delete_skill(skill_id)


@router.get("/projects", response_model=list[ProjectAdminRead])
def list_projects(db: Session = Depends(get_db)):
    return AdminService(db).list_projects()


@router.post("/projects", response_model=ProjectAdminRead, status_code=status.HTTP_201_CREATED)
def create_project(payload: ProjectCreate, db: Session = Depends(get_db)):
    return AdminService(db).create_project(payload)


@router.put("/projects/{project_id}", response_model=ProjectAdminRead)
def update_project(project_id: int, payload: ProjectUpdate, db: Session = Depends(get_db)):
    return AdminService(db).update_project(project_id, payload)


@router.delete("/projects/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(project_id: int, db: Session = Depends(get_db)):
    AdminService(db).delete_project(project_id)


@router.get("/experience", response_model=list[ExperienceAdminRead])
def list_experience(db: Session = Depends(get_db)):
    return AdminService(db).list_experience()


@router.post("/experience", response_model=ExperienceAdminRead, status_code=status.HTTP_201_CREATED)
def create_experience(payload: ExperienceCreate, db: Session = Depends(get_db)):
    return AdminService(db).create_experience(payload)


@router.put("/experience/{experience_id}", response_model=ExperienceAdminRead)
def update_experience(experience_id: int, payload: ExperienceUpdate, db: Session = Depends(get_db)):
    return AdminService(db).update_experience(experience_id, payload)


@router.delete("/experience/{experience_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_experience(experience_id: int, db: Session = Depends(get_db)):
    AdminService(db).delete_experience(experience_id)


@router.get("/education", response_model=list[EducationAdminRead])
def list_education(db: Session = Depends(get_db)):
    return AdminService(db).list_education()


@router.post("/education", response_model=EducationAdminRead, status_code=status.HTTP_201_CREATED)
def create_education(payload: EducationCreate, db: Session = Depends(get_db)):
    return AdminService(db).create_education(payload)


@router.put("/education/{education_id}", response_model=EducationAdminRead)
def update_education(education_id: int, payload: EducationUpdate, db: Session = Depends(get_db)):
    return AdminService(db).update_education(education_id, payload)


@router.delete("/education/{education_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_education(education_id: int, db: Session = Depends(get_db)):
    AdminService(db).delete_education(education_id)


@router.get("/certifications", response_model=list[CertificationAdminRead])
def list_certifications(db: Session = Depends(get_db)):
    return AdminService(db).list_certifications()


@router.post("/certifications", response_model=CertificationAdminRead, status_code=status.HTTP_201_CREATED)
def create_certification(payload: CertificationCreate, db: Session = Depends(get_db)):
    return AdminService(db).create_certification(payload)


@router.put("/certifications/{certification_id}", response_model=CertificationAdminRead)
def update_certification(certification_id: int, payload: CertificationUpdate, db: Session = Depends(get_db)):
    return AdminService(db).update_certification(certification_id, payload)


@router.delete("/certifications/{certification_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_certification(certification_id: int, db: Session = Depends(get_db)):
    AdminService(db).delete_certification(certification_id)


@router.get("/contact-messages", response_model=list[ContactMessageRead])
def list_contact_messages(db: Session = Depends(get_db)):
    return AdminService(db).list_contact_messages()


@router.get("/contact-messages/{contact_message_id}", response_model=ContactMessageRead)
def get_contact_message(contact_message_id: int, db: Session = Depends(get_db)):
    return AdminService(db).get_contact_message(contact_message_id)


@router.patch("/contact-messages/{contact_message_id}/read", response_model=ContactMessageRead)
def mark_contact_message_as_read(contact_message_id: int, db: Session = Depends(get_db)):
    return AdminService(db).mark_contact_message_as_read(contact_message_id)


@router.delete("/contact-messages/{contact_message_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_contact_message(contact_message_id: int, db: Session = Depends(get_db)):
    AdminService(db).delete_contact_message(contact_message_id)


# -----------------------------------------------------------------------------
#                              MEDIA ASSETS
# -----------------------------------------------------------------------------

@router.get(
    "/media-assets",
    response_model=list[MediaAssetAdminRead],
    summary="Listar media assets",
    description=(
        "Retorna todos los assets multimedia almacenados. "
        "Se puede filtrar por tipo con el parámetro 'asset_type' "
        "(valores: 'image', 'icon_svg', 'avatar')."
    )
)
def list_media_assets(
    asset_type: str | None = None,
    db: Session = Depends(get_db)
):
    log_info("Listando media assets.", asset_type=asset_type)
    return AdminService(db).list_media_assets(asset_type)


@router.get(
    "/media-assets/{asset_id}",
    response_model=MediaAssetAdminRead,
    summary="Obtener un media asset",
)
def get_media_asset(asset_id: int, db: Session = Depends(get_db)):
    return AdminService(db).get_media_asset(asset_id)


@router.get(
    "/media-assets/{asset_id}/content",
    summary="Obtener contenido binario de un media asset",
)
def get_media_asset_content(
    asset_id: int,
    request: Request,
    db: Session = Depends(get_db),
):
    media_content = MediaContentService(db).get_admin_content(asset_id)
    return build_content_response(media_content, request)


@router.post(
    "/media-assets",
    response_model=MediaAssetAdminRead,
    status_code=status.HTTP_201_CREATED,
    summary="Subir un media asset",
    description=(
        "Crea un nuevo asset multimedia. Envía 'data_base64' para imágenes "
        "(PNG/JPG/WebP) o 'svg_content' para íconos SVG. "
        "Al menos uno de los dos es obligatorio."
    )
)
def upload_media_asset(
    payload: MediaAssetCreate,
    db: Session = Depends(get_db)
):
    log_info("Subiendo media asset.", asset_type=payload.asset_type)
    return AdminService(db).upload_media_asset(payload)


@router.delete(
    "/media-assets/{asset_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Eliminar un media asset",
)
def delete_media_asset(asset_id: int, db: Session = Depends(get_db)):
    AdminService(db).delete_media_asset(asset_id)
