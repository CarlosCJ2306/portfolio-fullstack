# -----------------------------------------------------------------------------
#                              LIBRERÍAS
# -----------------------------------------------------------------------------
"""
Módulo: app.repositories.public_repository

Repositorio de consultas públicas del portafolio.

Esta capa contiene consultas directas a la base de datos.
No debe manejar lógica HTTP ni depender de FastAPI.

Autor: Carlos Andrés Jiménez Sarmiento (CJ)
Proyecto: Portfolio Full Stack
"""

from sqlalchemy.orm import Session, joinedload, selectinload

from app.models.certification_model import Certification
from app.models.education_model import Education
from app.models.experience_model import Experience
from app.models.profile_model import Profile
from app.models.project_model import Project, ProjectImage
from app.models.skill_model import Skill
from app.models.social_link_model import SocialLink
from app.models.contact_message_model import ContactMessage


# -----------------------------------------------------------------------------
#                              REPOSITORY
# -----------------------------------------------------------------------------

class PublicRepository:
    """
    Repositorio para obtener datos públicos del portafolio.
    """

    def __init__(self, db: Session) -> None:
        """
        Inicializa el repositorio con una sesión de base de datos.

        Args:
            db: Sesión activa de SQLAlchemy.
        """
        self.db = db

    def get_profile(self) -> Profile | None:
        """
        Obtiene el perfil principal.

        Returns:
            Perfil encontrado o None.
        """
        return (
            self.db.query(Profile)
            .options(joinedload(Profile.avatar))
            .first()
        )

    def get_social_links(self) -> list[SocialLink]:
        """
        Obtiene enlaces sociales activos.

        Returns:
            Lista de enlaces sociales.
        """
        return (
            self.db.query(SocialLink)
            .filter(SocialLink.is_active.is_(True))
            .order_by(SocialLink.display_order.asc())
            .all()
        )

    def get_skills(self) -> list[Skill]:
        """
        Obtiene habilidades activas.

        Returns:
            Lista de skills.
        """
        return (
            self.db.query(Skill)
            .options(joinedload(Skill.icon))
            .filter(Skill.is_active.is_(True))
            .order_by(Skill.display_order.asc())
            .all()
        )

    def get_projects(
        self,
        only_featured: bool = False
    ) -> list[Project]:
        """
        Obtiene proyectos activos.

        Args:
            only_featured: Si es True, retorna solo proyectos destacados.

        Returns:
            Lista de proyectos.
        """
        query = (
            self.db.query(Project)
            .options(
                joinedload(Project.image),
                selectinload(Project.gallery_items).joinedload(ProjectImage.image),
                selectinload(Project.skills).joinedload(Skill.icon)
            )
            .filter(Project.is_active.is_(True))
        )

        if only_featured:
            query = query.filter(Project.is_featured.is_(True))

        return (
            query
            .order_by(Project.display_order.asc())
            .all()
        )

    def get_experience(self) -> list[Experience]:
        """
        Obtiene experiencia laboral activa.

        Returns:
            Lista de experiencias.
        """
        return (
            self.db.query(Experience)
            .options(selectinload(Experience.bullets))
            .filter(Experience.is_active.is_(True))
            .order_by(Experience.display_order.asc())
            .all()
        )

    def get_education(self) -> list[Education]:
        """
        Obtiene formación académica activa.

        Returns:
            Lista de educación.
        """
        return (
            self.db.query(Education)
            .filter(Education.is_active.is_(True))
            .order_by(Education.display_order.asc())
            .all()
        )

    def get_certifications(self) -> list[Certification]:
        """
        Obtiene certificaciones activas.

        Returns:
            Lista de certificaciones.
        """
        return (
            self.db.query(Certification)
            .filter(Certification.is_active.is_(True))
            .order_by(Certification.display_order.asc())
            .all()
        )
        
    def create_contact_message(
        self,
        contact_data: dict
    ) -> ContactMessage:
        """
        Crea un mensaje de contacto en la base de datos.

        Args:
            contact_data: Datos validados del mensaje.

        Returns:
            Mensaje de contacto creado.
        """
        contact_message = ContactMessage(
            name=contact_data["name"],
            email=contact_data["email"],
            subject=contact_data.get("subject"),
            message=contact_data["message"],
            is_read=False
        )

        self.db.add(contact_message)
        self.db.flush()

        return contact_message
