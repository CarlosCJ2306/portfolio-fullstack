# -----------------------------------------------------------------------------
#                              LIBRERÍAS
# -----------------------------------------------------------------------------
"""
Módulo: app.routers.public_router

Router público de la API del portafolio.

Define endpoints que podrá consumir el frontend React para mostrar información
del portafolio sin autenticación.

Autor: Carlos Andrés Jiménez Sarmiento (CJ)
Proyecto: Portfolio Full Stack
"""

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.core.log import log_info, log_warning
from app.database.connection import get_db
from app.schemas.public_schema import (
    CertificationRead,
    EducationRead,
    ExperienceRead,
    ProfileRead,
    ProjectRead,
    PublicHomeRead,
    SkillRead,
    SocialLinkRead,
    ContactMessageCreate,
    ContactMessageCreatedRead,
)
from app.services.public_service import PublicService
from app.services.media_content_service import (
    MediaContentService,
    build_content_response,
)


# -----------------------------------------------------------------------------
#                              ROUTER
# -----------------------------------------------------------------------------

router = APIRouter(
    prefix="/api/public",
    tags=["Public"]
)


# -----------------------------------------------------------------------------
#                              ENDPOINTS
# -----------------------------------------------------------------------------

@router.get("/health")
def public_health_check() -> dict:
    """
    Verifica que el router público esté activo.

    Returns:
        Estado del router.
    """
    log_info("Health check público ejecutado.")

    return {
        "status": "ok",
        "module": "public",
        "message": "Public API is running"
    }


@router.get("/profile", response_model=ProfileRead)
def get_profile(
    db: Session = Depends(get_db)
):
    """
    Obtiene el perfil principal del portafolio.
    """
    service = PublicService(db)

    profile = service.get_profile()

    if profile is None:
        log_warning("Perfil público no encontrado.")

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Perfil no encontrado."
        )

    return profile


@router.get("/social-links", response_model=list[SocialLinkRead])
def get_social_links(
    db: Session = Depends(get_db)
):
    """
    Obtiene los enlaces sociales activos.
    """
    service = PublicService(db)

    return service.get_social_links()


@router.get("/skills", response_model=list[SkillRead])
def get_skills(
    db: Session = Depends(get_db)
):
    """
    Obtiene las habilidades técnicas activas.
    """
    service = PublicService(db)

    return service.get_skills()


@router.get("/projects", response_model=list[ProjectRead])
def get_projects(
    db: Session = Depends(get_db)
):
    """
    Obtiene todos los proyectos activos.
    """
    service = PublicService(db)

    return service.get_projects()


@router.get("/projects/featured", response_model=list[ProjectRead])
def get_featured_projects(
    db: Session = Depends(get_db)
):
    """
    Obtiene proyectos destacados.
    """
    service = PublicService(db)

    return service.get_featured_projects()


@router.get("/experience", response_model=list[ExperienceRead])
def get_experience(
    db: Session = Depends(get_db)
):
    """
    Obtiene experiencia laboral activa.
    """
    service = PublicService(db)

    return service.get_experience()


@router.get("/education", response_model=list[EducationRead])
def get_education(
    db: Session = Depends(get_db)
):
    """
    Obtiene formación académica activa.
    """
    service = PublicService(db)

    return service.get_education()


@router.get("/certifications", response_model=list[CertificationRead])
def get_certifications(
    db: Session = Depends(get_db)
):
    """
    Obtiene certificaciones activas.
    """
    service = PublicService(db)

    return service.get_certifications()


@router.get("/home", response_model=PublicHomeRead)
def get_home_data(
    db: Session = Depends(get_db)
):
    """
    Obtiene toda la información principal del portafolio en una sola petición.

    Este endpoint es útil para cargar la página principal del frontend.
    """
    service = PublicService(db)

    return service.get_home_data()


@router.get("/media-assets/{asset_id}/content")
def get_public_media_asset_content(
    asset_id: int,
    request: Request,
    db: Session = Depends(get_db),
):
    media_content = MediaContentService(db).get_public_content(asset_id)
    return build_content_response(media_content, request)

@router.post(
    "/contact",
    response_model=ContactMessageCreatedRead,
    status_code=status.HTTP_201_CREATED,
    summary="Enviar mensaje de contacto",
    description=(
        "Recibe un mensaje desde el formulario público del portafolio, "
        "valida los datos y los guarda en la base de datos."
    )
)
def create_contact_message(
    contact_payload: ContactMessageCreate,
    db: Session = Depends(get_db)
):
    """
    Guarda un mensaje de contacto enviado desde el frontend.

    Args:
        contact_payload: Datos enviados desde el formulario.
        db: Sesión activa de base de datos.

    Returns:
        Confirmación de creación del mensaje.
    """
    service = PublicService(db)

    return service.create_contact_message(
        contact_payload=contact_payload
    )
