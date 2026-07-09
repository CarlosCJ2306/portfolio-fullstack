# -----------------------------------------------------------------------------
#                              LIBRERÍAS
# -----------------------------------------------------------------------------
"""
Módulo: app.services.public_service

Servicio público del portafolio.

Esta capa coordina consultas del repositorio y prepara datos para los routers.
No debe conocer detalles HTTP como status codes o rutas.

Autor: Carlos Andrés Jiménez Sarmiento (CJ)
Proyecto: Portfolio Full Stack
"""

from sqlalchemy.orm import Session

from app.core.log import log_error, log_info, log_success
from app.repositories.public_repository import PublicRepository
from app.schemas.public_schema import ContactMessageCreate, ProjectRead


# -----------------------------------------------------------------------------
#                              SERVICE
# -----------------------------------------------------------------------------

class PublicService:
    """
    Servicio para obtener información pública del portafolio.
    """

    def __init__(self, db: Session) -> None:
        """
        Inicializa el servicio público.

        Args:
            db: Sesión activa de SQLAlchemy.
        """
        self.repository = PublicRepository(db)

    @staticmethod
    def _serialize_project(project) -> ProjectRead:
        """Aplica la política pública de imágenes sin alterar el ORM."""
        public_project = ProjectRead.model_validate(project)

        if not public_project.allow_public_images:
            return public_project.model_copy(
                update={
                    "image": None,
                    "gallery_images": [],
                }
            )

        return public_project

    def _serialize_projects(self, projects) -> list[ProjectRead]:
        return [self._serialize_project(project) for project in projects]

    def get_profile(self):
        """
        Obtiene el perfil principal.
        """
        log_info("Consultando perfil público.")

        profile = self.repository.get_profile()

        log_success(
            "Consulta de perfil público finalizada.",
            found=profile is not None
        )

        return profile

    def get_social_links(self):
        """
        Obtiene enlaces sociales.
        """
        log_info("Consultando enlaces sociales públicos.")

        social_links = self.repository.get_social_links()

        log_success(
            "Consulta de enlaces sociales finalizada.",
            total=len(social_links)
        )

        return social_links

    def get_skills(self):
        """
        Obtiene skills.
        """
        log_info("Consultando skills públicas.")

        skills = self.repository.get_skills()

        log_success(
            "Consulta de skills finalizada.",
            total=len(skills)
        )

        return skills

    def get_projects(self):
        """
        Obtiene todos los proyectos activos.
        """
        log_info("Consultando proyectos públicos.")

        projects = self.repository.get_projects()

        log_success(
            "Consulta de proyectos finalizada.",
            total=len(projects)
        )

        return self._serialize_projects(projects)

    def get_featured_projects(self):
        """
        Obtiene proyectos destacados.
        """
        log_info("Consultando proyectos destacados.")

        projects = self.repository.get_projects(
            only_featured=True
        )

        log_success(
            "Consulta de proyectos destacados finalizada.",
            total=len(projects)
        )

        return self._serialize_projects(projects)

    def get_experience(self):
        """
        Obtiene experiencia laboral.
        """
        log_info("Consultando experiencia pública.")

        experience = self.repository.get_experience()

        log_success(
            "Consulta de experiencia finalizada.",
            total=len(experience)
        )

        return experience

    def get_education(self):
        """
        Obtiene formación académica.
        """
        log_info("Consultando educación pública.")

        education = self.repository.get_education()

        log_success(
            "Consulta de educación finalizada.",
            total=len(education)
        )

        return education

    def get_certifications(self):
        """
        Obtiene certificaciones.
        """
        log_info("Consultando certificaciones públicas.")

        certifications = self.repository.get_certifications()

        log_success(
            "Consulta de certificaciones finalizada.",
            total=len(certifications)
        )

        return certifications

    def get_home_data(self) -> dict:
        """
        Obtiene los datos principales del portafolio en una sola respuesta.

        Returns:
            Diccionario con toda la información pública principal.
        """
        log_info("Consultando información principal del portafolio.")

        data = {
            "profile": self.repository.get_profile(),
            "social_links": self.repository.get_social_links(),
            "skills": self.repository.get_skills(),
            "featured_projects": self._serialize_projects(
                self.repository.get_projects(only_featured=True)
            ),
            "experience": self.repository.get_experience(),
            "education": self.repository.get_education(),
            "certifications": self.repository.get_certifications(),
        }

        log_success(
            "Información principal del portafolio consultada correctamente.",
            total_social_links=len(data["social_links"]),
            total_skills=len(data["skills"]),
            total_featured_projects=len(data["featured_projects"]),
            total_experience=len(data["experience"]),
            total_education=len(data["education"]),
            total_certifications=len(data["certifications"])
        )

        return data
    
    def create_contact_message(
        self,
        contact_payload: ContactMessageCreate
    ) -> dict:
        """
        Guarda un mensaje de contacto enviado desde el frontend.

        Args:
            contact_payload: Datos validados del formulario de contacto.

        Returns:
            Diccionario con estado de la operación e ID del mensaje creado.
        """
        log_info(
            "Solicitud de creación de mensaje de contacto recibida.",
            name=contact_payload.name,
            email=contact_payload.email,
            subject=contact_payload.subject,
            message_length=len(contact_payload.message)
        )

        try:
            contact_message = self.repository.create_contact_message(
                contact_payload.model_dump()
            )

            self.repository.db.commit()
            self.repository.db.refresh(contact_message)

            log_success(
                "Mensaje de contacto guardado correctamente.",
                contact_message_id=contact_message.id,
                email=contact_message.email
            )

            return {
                "success": True,
                "message": "Mensaje enviado correctamente.",
                "contact_message_id": contact_message.id
            }

        except Exception as error:
            self.repository.db.rollback()

            log_error(
                "Error guardando mensaje de contacto.",
                error=error,
                email=contact_payload.email
            )

            raise
