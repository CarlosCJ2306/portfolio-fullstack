# -----------------------------------------------------------------------------
#                              LIBRERÍAS
# -----------------------------------------------------------------------------
"""
Módulo: app.scripts.seed_db

Script para insertar datos iniciales en la base de datos del portafolio.

Este script:
- Inserta perfil profesional.
- Inserta enlaces sociales.
- Inserta recursos multimedia SVG.
- Inserta habilidades técnicas.
- Inserta proyectos.
- Inserta experiencia laboral.
- Inserta formación académica.
- Inserta certificaciones.

Uso:
    python -m app.scripts.seed_db

Autor: Carlos Andrés Jiménez Sarmiento (CJ)
Proyecto: Portfolio Full Stack
"""

from __future__ import annotations

from datetime import date

from sqlalchemy.orm import Session

from app.core.log import (
    get_log_file_path,
    log_documentation,
    log_info,
    log_step,
    log_success,
    log_warning,
)
from app.database.connection import SessionLocal
from app.models.certification_model import Certification
from app.models.education_model import Education
from app.models.experience_model import Experience, ExperienceBullet
from app.models.media_asset_model import MediaAsset
from app.models.profile_model import Profile
from app.models.project_model import Project
from app.models.skill_model import Skill
from app.models.social_link_model import SocialLink


# -----------------------------------------------------------------------------
#                              SVG INICIALES
# -----------------------------------------------------------------------------

PYTHON_SVG = """
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 255">
  <path fill="#3776AB" d="M126 0c-11 0-22 1-31 3-27 5-32 16-32 36v26h64v9H39C20 74 4 85 1 106c-4 24-4 39 0 64 3 19 17 32 36 32h23v-31c0-22 19-42 42-42h64c18 0 32-15 32-32V39c0-17-15-30-32-33-11-2-26-6-40-6z"/>
  <path fill="#FFD43B" d="M129 255c11 0 22-1 31-3 27-5 32-16 32-36v-26h-64v-9h88c19 0 35-11 38-32 4-24 4-39 0-64-3-19-17-32-36-32h-23v31c0 22-19 42-42 42H89c-18 0-32 15-32 32v58c0 17 15 30 32 33 11 2 26 6 40 6z"/>
</svg>
"""

FASTAPI_SVG = """
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 154 154">
  <circle cx="77" cy="77" r="77" fill="#009688"/>
  <path d="M81 18 38 86h35l-8 50 51-72H82l-1-46z" fill="#fff"/>
</svg>
"""

REACT_SVG = """
<svg xmlns="http://www.w3.org/2000/svg" viewBox="-11.5 -10.23174 23 20.46348">
  <circle cx="0" cy="0" r="2.05" fill="#61DAFB"/>
  <g stroke="#61DAFB" stroke-width="1" fill="none">
    <ellipse rx="11" ry="4.2"/>
    <ellipse rx="11" ry="4.2" transform="rotate(60)"/>
    <ellipse rx="11" ry="4.2" transform="rotate(120)"/>
  </g>
</svg>
"""


# -----------------------------------------------------------------------------
#                              FUNCIONES AUXILIARES
# -----------------------------------------------------------------------------

def database_has_initial_data(db: Session) -> bool:
    """
    Verifica si la base de datos ya tiene datos iniciales.

    Para evitar duplicados, tomamos como referencia la existencia de un perfil.

    Args:
        db: Sesión activa de SQLAlchemy.

    Returns:
        True si ya existe un perfil, False si la base está lista para poblarse.
    """
    existing_profile = db.query(Profile).first()

    return existing_profile is not None


def create_svg_asset(
    db: Session,
    file_name: str,
    svg_content: str,
    alt_text: str
) -> MediaAsset:
    """
    Crea un recurso multimedia de tipo SVG.

    Args:
        db: Sesión activa de SQLAlchemy.
        file_name: Nombre del archivo SVG.
        svg_content: Contenido SVG en texto plano.
        alt_text: Texto alternativo para accesibilidad.

    Returns:
        Instancia creada de MediaAsset.
    """
    asset = MediaAsset(
        asset_type="icon",
        file_name=file_name,
        mime_type="image/svg+xml",
        data_base64=None,
        svg_content=svg_content.strip(),
        alt_text=alt_text,
        is_active=True
    )

    db.add(asset)
    db.flush()

    log_success(
        "Recurso SVG creado.",
        file_name=file_name,
        asset_id=asset.id
    )

    return asset


def create_profile(db: Session) -> Profile:
    """
    Crea el perfil principal del portafolio.

    Args:
        db: Sesión activa de SQLAlchemy.

    Returns:
        Perfil creado.
    """
    profile = Profile(
        full_name="Carlos Andrés Jiménez Sarmiento",
        professional_title="Desarrollador de Software",
        summary=(
            "Desarrollador con experiencia en Python, Flask, automatización, "
            "bases de datos y construcción de soluciones empresariales. "
            "Me enfoco en crear soluciones backend, integrar procesos y "
            "desarrollar aplicaciones web funcionales y mantenibles."
        ),
        location="Colombia",
        email="correo@example.com",
        phone=None,
        cv_url=None,
        avatar_asset_id=None
    )

    db.add(profile)
    db.flush()

    log_success(
        "Perfil inicial creado.",
        profile_id=profile.id,
        full_name=profile.full_name
    )

    return profile


def create_social_links(db: Session) -> list[SocialLink]:
    """
    Crea enlaces sociales iniciales.

    Args:
        db: Sesión activa de SQLAlchemy.

    Returns:
        Lista de enlaces creados.
    """
    social_links = [
        SocialLink(
            platform="GitHub",
            url="https://github.com/",
            icon_name="github",
            is_active=True,
            display_order=1
        ),
        SocialLink(
            platform="LinkedIn",
            url="https://www.linkedin.com/",
            icon_name="linkedin",
            is_active=True,
            display_order=2
        ),
        SocialLink(
            platform="Email",
            url="mailto:correo@example.com",
            icon_name="mail",
            is_active=True,
            display_order=3
        )
    ]

    db.add_all(social_links)
    db.flush()

    log_success(
        "Enlaces sociales iniciales creados.",
        total_social_links=len(social_links)
    )

    return social_links


def create_skills(
    db: Session,
    python_icon: MediaAsset,
    fastapi_icon: MediaAsset,
    react_icon: MediaAsset
) -> list[Skill]:
    """
    Crea habilidades técnicas iniciales.

    Args:
        db: Sesión activa de SQLAlchemy.
        python_icon: Icono SVG de Python.
        fastapi_icon: Icono SVG de FastAPI.
        react_icon: Icono SVG de React.

    Returns:
        Lista de skills creadas.
    """
    skills = [
        Skill(
            name="Python",
            category="Backend",
            level="Avanzado",
            icon_asset_id=python_icon.id,
            color="#3776AB",
            is_active=True,
            display_order=1
        ),
        Skill(
            name="Flask",
            category="Backend",
            level="Intermedio",
            icon_asset_id=None,
            color="#000000",
            is_active=True,
            display_order=2
        ),
        Skill(
            name="FastAPI",
            category="Backend",
            level="Aprendiendo",
            icon_asset_id=fastapi_icon.id,
            color="#009688",
            is_active=True,
            display_order=3
        ),
        Skill(
            name="JavaScript",
            category="Frontend",
            level="Intermedio",
            icon_asset_id=None,
            color="#F7DF1E",
            is_active=True,
            display_order=4
        ),
        Skill(
            name="React",
            category="Frontend",
            level="Aprendiendo",
            icon_asset_id=react_icon.id,
            color="#61DAFB",
            is_active=True,
            display_order=5
        ),
        Skill(
            name="PostgreSQL",
            category="Database",
            level="Intermedio",
            icon_asset_id=None,
            color="#336791",
            is_active=True,
            display_order=6
        ),
        Skill(
            name="SQLite",
            category="Database",
            level="Intermedio",
            icon_asset_id=None,
            color="#003B57",
            is_active=True,
            display_order=7
        ),
        Skill(
            name="Power Automate",
            category="Automation",
            level="Intermedio",
            icon_asset_id=None,
            color="#0066FF",
            is_active=True,
            display_order=8
        )
    ]

    db.add_all(skills)
    db.flush()

    log_success(
        "Skills iniciales creadas.",
        total_skills=len(skills),
        skills=[skill.name for skill in skills]
    )

    return skills


def create_project(
    db: Session,
    skills: list[Skill]
) -> Project:
    """
    Crea un proyecto inicial y le asocia skills.

    Args:
        db: Sesión activa de SQLAlchemy.
        skills: Lista de skills disponibles.

    Returns:
        Proyecto creado.
    """
    project = Project(
        title="Sistema de Reintegros",
        slug="sistema-reintegros",
        short_description="Módulo web para gestión y cálculo financiero de reintegros.",
        description=(
            "Sistema desarrollado para gestionar reportes de reintegro, calcular "
            "valores con TRM, administrar información financiera y facilitar el "
            "seguimiento de procesos empresariales."
        ),
        image_asset_id=None,
        repository_url=None,
        demo_url=None,
        is_featured=True,
        is_active=True,
        display_order=1
    )

    project.skills = [
        skill for skill in skills
        if skill.name in {"Python", "Flask", "JavaScript", "PostgreSQL"}
    ]

    db.add(project)
    db.flush()

    log_success(
        "Proyecto inicial creado.",
        project_id=project.id,
        title=project.title,
        skills=[skill.name for skill in project.skills]
    )

    return project


def create_experience(db: Session) -> Experience:
    """
    Crea experiencia laboral inicial con bullets descriptivos.

    Args:
        db: Sesión activa de SQLAlchemy.

    Returns:
        Experiencia creada.
    """
    experience = Experience(
        position="Desarrollador de Soluciones Empresariales",
        company="Entidad reservada",
        country="Colombia",
        city="Pamplona",
        start_date=date(2024, 1, 1),
        end_date=None,
        is_current=True,
        description=(
            "Participación en análisis, diseño, desarrollo e implementación "
            "de soluciones tecnológicas para procesos administrativos, "
            "financieros, comerciales y operativos."
        ),
        is_active=True,
        display_order=1
    )

    db.add(experience)
    db.flush()

    bullets = [
        ExperienceBullet(
            experience_id=experience.id,
            description="Desarrollé soluciones backend en Python con Flask.",
            display_order=1
        ),
        ExperienceBullet(
            experience_id=experience.id,
            description="Construí interfaces y módulos internos con HTML, CSS y JavaScript.",
            display_order=2
        ),
        ExperienceBullet(
            experience_id=experience.id,
            description="Implementé automatizaciones con RPA Framework integradas con Power Automate.",
            display_order=3
        ),
        ExperienceBullet(
            experience_id=experience.id,
            description="Trabajé con PostgreSQL para modelado, consultas e integración de datos.",
            display_order=4
        )
    ]

    db.add_all(bullets)
    db.flush()

    log_success(
        "Experiencia inicial creada.",
        experience_id=experience.id,
        position=experience.position,
        company=experience.company,
        total_bullets=len(bullets)
    )

    return experience


def create_education(db: Session) -> Education:
    """
    Crea formación académica inicial.

    Args:
        db: Sesión activa de SQLAlchemy.

    Returns:
        Educación creada.
    """
    education = Education(
        institution="Universidad de Pamplona",
        degree="Ingeniería de Sistemas",
        field_of_study="Desarrollo de software y sistemas de información",
        start_year=None,
        end_year=2026,
        description=(
            "Formación en desarrollo de software, bases de datos, redes, "
            "sistemas de información y soluciones tecnológicas. "
            "Finalización académica completada; ceremonia de grado prevista "
            "para octubre de 2026."
        ),
        is_active=True,
        display_order=1
    )

    db.add(education)
    db.flush()

    log_success(
        "Formación académica inicial creada.",
        education_id=education.id,
        institution=education.institution,
        degree=education.degree
    )

    return education


def create_certification(db: Session) -> Certification:
    """
    Crea una certificación inicial.

    Args:
        db: Sesión activa de SQLAlchemy.

    Returns:
        Certificación creada.
    """
    certification = Certification(
        name="Infraestructura en Azure",
        issuer=None,
        issue_date=None,
        credential_url=None,
        description="Curso relacionado con infraestructura y servicios en la nube.",
        is_active=True,
        display_order=1
    )

    db.add(certification)
    db.flush()

    log_success(
        "Certificación inicial creada.",
        certification_id=certification.id,
        name=certification.name
    )

    return certification


# -----------------------------------------------------------------------------
#                              PROCESO PRINCIPAL
# -----------------------------------------------------------------------------

def seed_database() -> None:
    """
    Ejecuta el proceso completo de inserción de datos iniciales.
    """
    db = SessionLocal()

    try:
        log_info("Iniciando proceso de seed de base de datos.")

        if database_has_initial_data(db):
            log_warning(
                "La base de datos ya contiene datos iniciales. Seed cancelado."
            )
            return

        with log_step("Insertar datos iniciales en la base de datos"):
            log_documentation(
                "Creando recursos SVG iniciales para skills."
            )

            python_icon = create_svg_asset(
                db=db,
                file_name="python.svg",
                svg_content=PYTHON_SVG,
                alt_text="Icono de Python"
            )

            fastapi_icon = create_svg_asset(
                db=db,
                file_name="fastapi.svg",
                svg_content=FASTAPI_SVG,
                alt_text="Icono de FastAPI"
            )

            react_icon = create_svg_asset(
                db=db,
                file_name="react.svg",
                svg_content=REACT_SVG,
                alt_text="Icono de React"
            )

            create_profile(db)
            create_social_links(db)

            skills = create_skills(
                db=db,
                python_icon=python_icon,
                fastapi_icon=fastapi_icon,
                react_icon=react_icon
            )

            create_project(
                db=db,
                skills=skills
            )

            create_experience(db)
            create_education(db)
            create_certification(db)

            db.commit()

            log_success(
                "Commit de datos iniciales ejecutado correctamente."
            )

    except Exception as error:
        db.rollback()

        log_warning(
            "Rollback ejecutado por error durante seed.",
            error_type=type(error).__name__,
            error_message=str(error)
        )

        raise

    finally:
        db.close()

        log_success(
            "Sesión de base de datos cerrada después del seed."
        )


def main() -> None:
    """
    Punto de entrada del script.
    """
    seed_database()

    log_success(
        "Script seed_db finalizado correctamente.",
        archivo_log=get_log_file_path()
    )


if __name__ == "__main__":
    main()
