# -----------------------------------------------------------------------------
#                              LIBRERÍAS
# -----------------------------------------------------------------------------
"""
Módulo: app.schemas.public_schema

Schemas públicos de respuesta para la API del portafolio.

Estos schemas transforman los modelos ORM de SQLAlchemy en respuestas JSON
seguras y ordenadas para ser consumidas por el frontend React.

Autor: Carlos Andrés Jiménez Sarmiento (CJ)
Proyecto: Portfolio Full Stack
"""

from datetime import date
from pydantic import BaseModel, ConfigDict, Field, field_validator


# -----------------------------------------------------------------------------
#                              MEDIA ASSETS
# -----------------------------------------------------------------------------

class MediaAssetRead(BaseModel):
    """
    Schema de lectura para recursos multimedia.
    """

    model_config = ConfigDict(from_attributes=True)

    id: int
    asset_type: str
    file_name: str | None = None
    mime_type: str | None = None
    data_base64: str | None = None
    svg_content: str | None = None
    alt_text: str | None = None


# -----------------------------------------------------------------------------
#                              PROFILE
# -----------------------------------------------------------------------------

class ProfileRead(BaseModel):
    """
    Schema de lectura para el perfil principal.
    """

    model_config = ConfigDict(from_attributes=True)

    id: int
    full_name: str
    professional_title: str
    summary: str
    location: str | None = None
    email: str | None = None
    phone: str | None = None
    cv_url: str | None = None
    avatar: MediaAssetRead | None = None


# -----------------------------------------------------------------------------
#                              SOCIAL LINKS
# -----------------------------------------------------------------------------

class SocialLinkRead(BaseModel):
    """
    Schema de lectura para enlaces sociales.
    """

    model_config = ConfigDict(from_attributes=True)

    id: int
    platform: str
    url: str
    icon_name: str | None = None
    display_order: int


# -----------------------------------------------------------------------------
#                              SKILLS
# -----------------------------------------------------------------------------

class SkillRead(BaseModel):
    """
    Schema de lectura para habilidades técnicas.
    """

    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    category: str
    level: str
    color: str | None = None
    display_order: int
    icon: MediaAssetRead | None = None


# -----------------------------------------------------------------------------
#                              PROJECTS
# -----------------------------------------------------------------------------

class ProjectRead(BaseModel):
    """
    Schema de lectura para proyectos.
    """

    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    slug: str
    short_description: str
    description: str
    repository_url: str | None = None
    demo_url: str | None = None
    is_featured: bool
    display_order: int
    image: MediaAssetRead | None = None
    gallery_images: list["ProjectGalleryImageRead"] = Field(default_factory=list)
    skills: list[SkillRead] = []


class ProjectGalleryImageRead(BaseModel):
    """
    Schema de lectura para una imagen adicional de la galeria del proyecto.
    """

    model_config = ConfigDict(from_attributes=True)

    media_asset_id: int
    display_order: int
    image: MediaAssetRead | None = None


# -----------------------------------------------------------------------------
#                              EXPERIENCE
# -----------------------------------------------------------------------------

class ExperienceBulletRead(BaseModel):
    """
    Schema de lectura para bullets de experiencia.
    """

    model_config = ConfigDict(from_attributes=True)

    id: int
    description: str
    display_order: int


class ExperienceRead(BaseModel):
    """
    Schema de lectura para experiencia laboral.
    """

    model_config = ConfigDict(from_attributes=True)

    id: int
    position: str
    company: str
    country: str | None = None
    city: str | None = None
    start_date: date
    end_date: date | None = None
    is_current: bool
    description: str | None = None
    display_order: int
    bullets: list[ExperienceBulletRead] = []


# -----------------------------------------------------------------------------
#                              EDUCATION
# -----------------------------------------------------------------------------

class EducationRead(BaseModel):
    """
    Schema de lectura para formación académica.
    """

    model_config = ConfigDict(from_attributes=True)

    id: int
    institution: str
    degree: str
    field_of_study: str | None = None
    start_year: int | None = None
    end_year: int | None = None
    description: str | None = None
    display_order: int


# -----------------------------------------------------------------------------
#                              CERTIFICATIONS
# -----------------------------------------------------------------------------

class CertificationRead(BaseModel):
    """
    Schema de lectura para certificaciones.
    """

    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    issuer: str | None = None
    issue_date: date | None = None
    credential_url: str | None = None
    description: str | None = None
    display_order: int
    certificate_file: MediaAssetRead | None = None


# -----------------------------------------------------------------------------
#                              HOME RESPONSE
# -----------------------------------------------------------------------------

class PublicHomeRead(BaseModel):
    """
    Schema general para cargar la información principal del portafolio
    en una sola petición.
    """

    profile: ProfileRead | None
    social_links: list[SocialLinkRead]
    skills: list[SkillRead]
    featured_projects: list[ProjectRead]
    experience: list[ExperienceRead]
    education: list[EducationRead]
    certifications: list[CertificationRead]
    
# -----------------------------------------------------------------------------
#                              CONTACT
# -----------------------------------------------------------------------------

class ContactMessageCreate(BaseModel):
    """
    Schema de entrada para crear mensajes de contacto desde el frontend.

    Este schema valida los datos enviados desde el formulario público
    del portafolio antes de guardarlos en la base de datos.
    """

    name: str = Field(
        ...,
        min_length=2,
        max_length=150,
        description="Nombre de la persona que envía el mensaje."
    )

    email: str = Field(
        ...,
        min_length=5,
        max_length=150,
        description="Correo electrónico de contacto."
    )

    subject: str | None = Field(
        default=None,
        max_length=180,
        description="Asunto opcional del mensaje."
    )

    message: str = Field(
        ...,
        min_length=10,
        max_length=3000,
        description="Contenido del mensaje enviado desde el formulario."
    )

    @field_validator("name", "email", "subject", "message", mode="before")
    @classmethod
    def clean_text_fields(cls, value):
        """
        Limpia espacios innecesarios en campos de texto.

        Args:
            value: Valor recibido.

        Returns:
            Valor limpio.
        """
        if isinstance(value, str):
            return value.strip()

        return value

    @field_validator("email")
    @classmethod
    def validate_email_format(cls, value: str) -> str:
        """
        Valida de forma básica el formato del correo electrónico.

        Args:
            value: Correo electrónico recibido.

        Returns:
            Correo electrónico validado.

        Raises:
            ValueError: Si el correo no tiene un formato mínimo válido.
        """
        if "@" not in value or "." not in value:
            raise ValueError("El correo electrónico no tiene un formato válido.")

        return value.lower()


class ContactMessageCreatedRead(BaseModel):
    """
    Schema de respuesta cuando un mensaje de contacto se guarda correctamente.
    """

    success: bool
    message: str
    contact_message_id: int
