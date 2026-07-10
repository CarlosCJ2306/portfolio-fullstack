"""Sincroniza el contenido profesional aprobado sin cambiar el esquema.

El modo predeterminado es ``--dry-run``. ``--apply`` exige un backup SQLite
valido y ejecuta toda la actualizacion en una unica transaccion.
"""

from __future__ import annotations

import argparse
import hashlib
import re
import sqlite3
import unicodedata
from collections import Counter
from collections.abc import Callable, Iterable
from dataclasses import dataclass, field
from datetime import date
from pathlib import Path

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.database.connection import DATABASE_URL, SessionLocal
from app.models.certification_model import Certification
from app.models.contact_message_model import ContactMessage
from app.models.education_model import Education
from app.models.experience_model import Experience, ExperienceBullet
from app.models.media_asset_model import MediaAsset
from app.models.profile_model import Profile
from app.models.project_model import Project, ProjectImage, project_skills
from app.models.skill_model import Skill
from app.models.social_link_model import SocialLink


PROFILE = {
    "full_name": "Carlos Andrés Jiménez Sarmiento",
    "professional_title": "Egresado de Ingeniería de Sistemas | Desarrollador Python y Full Stack",
    "summary": (
        "Egresado de Ingeniería de Sistemas con experiencia práctica en desarrollo "
        "de aplicaciones web, automatización de procesos, integración de sistemas "
        "y análisis de datos. He trabajado con Python, Flask, JavaScript, HTML, "
        "CSS, APIs REST, bases de datos SQL, Power Platform y Power BI para "
        "construir y mantener soluciones empresariales internas. También cuento "
        "con experiencia en levantamiento de requerimientos, documentación "
        "técnica, soporte de aplicaciones y acompañamiento formativo. Mi perfil "
        "está orientado a oportunidades de desarrollo Python, backend, full stack "
        "junior, automatización y datos."
    ),
    "location": "Pamplona, Norte de Santander, Colombia",
    "email": "carloscjdev@gmail.com",
    "phone": None,
}

SOCIALS = (
    ("GitHub", "https://github.com/CarlosCJ2306", "github"),
    ("LinkedIn", "https://www.linkedin.com/in/carlos-cj/", "linkedin"),
    ("Email", "mailto:carloscjdev@gmail.com", "email"),
)

EXPERIENCES = (
    {
        "company": "Fofimatic S.A.S.",
        "position": "Ingeniero de Desarrollo y Automatización de Soluciones Empresariales",
        "country": "Colombia",
        "city": "Pamplona",
        "start_date": date(2024, 6, 1),
        "end_date": date(2026, 3, 31),
        "is_current": False,
        "is_active": True,
        "display_order": 0,
        "description": (
            "Participé en el análisis, diseño, desarrollo, integración y "
            "mantenimiento de soluciones tecnológicas para procesos "
            "administrativos, financieros, comerciales y operativos. Mi trabajo "
            "incluyó desarrollo backend con Python y Flask, interfaces web "
            "internas, automatización de procesos, integración de datos, "
            "reportería empresarial, documentación técnica y soporte de "
            "aplicaciones."
        ),
        "bullets": (
            "Desarrollé módulos backend con Python y Flask, incorporando lógica de negocio, validaciones, consultas e integración con bases de datos.",
            "Construí interfaces internas con HTML, CSS y JavaScript para formularios, consultas, módulos administrativos y herramientas empresariales.",
            "Implementé automatizaciones con RPA Framework, Power Automate y Power Automate Desktop.",
            "Participé en la creación y adaptación de soluciones mediante Power Apps y otras herramientas de Power Platform.",
            "Desarrollé reportes y tableros mediante Power BI, Power Query y DAX, sin publicar información o indicadores internos.",
            "Integré soluciones con APIs REST, JSON, Excel, SharePoint y bases de datos SQL.",
            "Apoyé el levantamiento de requerimientos, diseño funcional, elaboración de mockups, pruebas y documentación técnica.",
            "Realicé soporte, mantenimiento y mejora continua sobre aplicaciones y procesos empresariales.",
        ),
    },
    {
        "company": "Kodland",
        "position": "Tutor de Programación Remoto",
        "country": None,
        "city": "Remoto",
        "start_date": date(2024, 5, 1),
        "end_date": date(2026, 2, 28),
        "is_current": False,
        "is_active": True,
        "display_order": 1,
        "description": (
            "Orienté a estudiantes en fundamentos de programación y lógica "
            "computacional mediante clases remotas de Python básico. Preparé y "
            "adapté actividades teórico-prácticas, realicé seguimiento individual "
            "y mantuve comunicación con estudiantes, familias y equipos internos."
        ),
        "bullets": (
            "Orienté a estudiantes en fundamentos de programación, lógica computacional y resolución de problemas mediante Python básico.",
            "Preparé clases teórico-prácticas utilizando el material académico definido por la organización.",
            "Adapté explicaciones y actividades a diferentes ritmos y niveles de aprendizaje.",
            "Realicé seguimiento individual del progreso técnico y académico de los estudiantes.",
            "Mantuve comunicación con estudiantes, padres de familia, coordinadores y equipos internos, sin publicar información personal.",
        ),
    },
)

CONFIDENTIALITY_NOTE = (
    "Proyecto desarrollado mediante Fofimatic para una empresa cliente. La "
    "identidad de la organización y sus recursos internos se reservan por "
    "confidencialidad."
)

FEATURED_PROJECT_SLUGS = {
    "crm-empresarial-modular",
    "automatizacion-flujo-caja-centros-costos",
    "inteligencia-negocio-reportes-operativos",
}

PROJECTS = (
    {
        "title": "CRM empresarial modular",
        "slug": "crm-empresarial-modular",
        "short_description": "Solución modular para organizar información comercial y operativa mediante formularios, validaciones, consultas y módulos administrativos.",
        "description": "Participación en el análisis funcional, modelado de datos y desarrollo de módulos para gestionar información de proveedores, productos y clientes dentro de una solución empresarial interna.",
        "skills": ("Python", "Flask", "JavaScript", "HTML5", "CSS3", "SQL", "PostgreSQL", "APIs REST", "JSON"),
    },
    {
        "title": "Gestión de reintegros y documentación DEX",
        "slug": "gestion-reintegros-asociacion-documental",
        "short_description": "Solución para organizar, consultar y relacionar información de reintegros con documentación asociada a procesos de exportación.",
        "description": "Desarrollo de funcionalidades de registro, consulta, validación, asociación documental y trazabilidad general, sin publicar datos financieros, documentos o información interna.",
        "skills": ("Python", "Flask", "JavaScript", "SQL", "PostgreSQL", "Excel", "SharePoint", "ETL", "APIs REST"),
    },
    {
        "title": "Tracking de exportaciones",
        "slug": "tracking-exportaciones",
        "short_description": "Módulo de seguimiento general de estados, fechas y documentación relacionada con procesos de exportación.",
        "description": "Desarrollo de una solución interna para centralizar información operativa, facilitar consultas y mantener trazabilidad sobre diferentes etapas del proceso.",
        "skills": ("Python", "Flask", "JavaScript", "SQL", "APIs REST", "JSON", "Excel", "Automatización de procesos"),
    },
    {
        "title": "Automatización de flujo de caja y centros de costos",
        "slug": "automatizacion-flujo-caja-centros-costos",
        "short_description": "Automatización de tareas de recolección, validación, transformación y consolidación de información financiera y operativa.",
        "description": "Implementación de flujos para procesar información procedente de formularios, archivos y fuentes empresariales, reduciendo trabajo manual sin publicar montos, formatos internos o métricas no verificadas.",
        "skills": ("Python", "RPA Framework", "Power Automate", "Power Automate Desktop", "Excel", "OpenPyXL", "SQL", "ETL"),
    },
    {
        "title": "Inteligencia de negocio y reportería empresarial",
        "slug": "inteligencia-negocio-reportes-operativos",
        "short_description": "Creación de modelos, transformaciones, indicadores y visualizaciones para el análisis de información empresarial.",
        "description": "Desarrollo de reportes y tableros orientados al seguimiento de procesos administrativos, financieros y operativos, manteniendo reservados los datos, indicadores y diseños internos.",
        "skills": ("Power BI", "DAX", "Power Query", "Excel", "SQL", "Transformación de datos", "Modelado de información"),
    },
    {
        "title": "Ecosistema de automatización e integración empresarial",
        "slug": "ecosistema-automatizacion-integracion",
        "short_description": "Integración de aplicaciones, automatizaciones, formularios y fuentes de datos dentro de un ecosistema empresarial.",
        "description": "Participación en la centralización de accesos y soluciones mediante Power Platform, aplicaciones Python, APIs y fuentes corporativas, facilitando la interoperabilidad entre procesos.",
        "skills": ("Power Apps", "Power Automate", "Python", "Flask", "RPA Framework", "SharePoint", "APIs REST", "JSON", "SQL"),
    },
)

SKILL_GROUPS = {
    "Lenguajes": ("Python", "JavaScript", "SQL", "HTML5", "CSS3"),
    "Backend e integraciones": ("Flask", "FastAPI", "APIs REST", "JSON", "Webhooks"),
    "Frontend": ("React", "Vite", "Handsontable"),
    "Automatización y Power Platform": (
        "RPA Framework",
        "Power Automate",
        "Power Automate Desktop",
        "Power Apps",
        "Scripting",
        "Automatización de procesos",
    ),
    "Inteligencia de negocio y datos": (
        "Power BI",
        "DAX",
        "Power Query",
        "Pandas",
        "ETL",
        "Excel",
        "OpenPyXL",
        "Transformación de datos",
        "Modelado de información",
    ),
    "Bases de datos": ("PostgreSQL", "SQL Server", "Oracle", "MySQL", "SQLite"),
    "Herramientas e infraestructura": (
        "Git",
        "SharePoint",
        "IIS",
        "Logging",
        "Validación de datos",
        "Generación de reportes PDF",
        "ReportLab",
        "WeasyPrint",
    ),
}

PRINCIPAL = {
    "Python",
    "Flask",
    "JavaScript",
    "HTML5",
    "CSS3",
    "SQL",
    "APIs REST",
    "Power Automate",
    "Excel",
    "Automatización de procesos",
}

INTERMEDIATE = {
    "JSON",
    "Webhooks",
    "RPA Framework",
    "Power Automate Desktop",
    "Power Apps",
    "Scripting",
    "Power BI",
    "Power Query",
    "ETL",
    "PostgreSQL",
    "SQL Server",
    "SharePoint",
    "Git",
    "IIS",
    "OpenPyXL",
    "Transformación de datos",
}

EDUCATION = {
    "institution": "Universidad de Pamplona",
    "degree": "Egresado de Ingeniería de Sistemas",
    "field_of_study": "Desarrollo de software y sistemas de información",
    "start_year": 2020,
    "end_year": 2026,
    "description": (
        "Programa de Ingeniería de Sistemas finalizado académicamente. Formación "
        "en desarrollo de software, bases de datos, automatización, sistemas de "
        "información, redes e integración tecnológica. Ceremonia de grado prevista "
        "para octubre de 2026."
    ),
}

PROTECTED_PATTERNS = tuple(bytes.fromhex(value).decode("utf-8") for value in ("436970726f6261", "53756c666f"))
GENERIC_CLIENT = "Empresa privada cliente de Fofimatic"


def normalized(value: str | None) -> str:
    """Normaliza una clave editorial sin alterar el valor almacenado."""

    if not value:
        return ""
    return " ".join(
        "".join(
            character for character in unicodedata.normalize("NFKD", value.casefold())
            if not unicodedata.combining(character)
        ).split()
    )


def _replace_protected(value: str | None, replacement: str = "empresa cliente") -> tuple[str | None, bool]:
    if value is None:
        return None, False
    updated = value
    for pattern in PROTECTED_PATTERNS:
        updated = re.sub(re.escape(pattern), replacement, updated, flags=re.IGNORECASE)
    return updated, updated != value


@dataclass
class SyncReport:
    mode: str
    operations: list[dict[str, object]] = field(default_factory=list)
    before: dict[str, int] = field(default_factory=dict)
    after: dict[str, int] = field(default_factory=dict)

    def add(self, action: str, entity: str, identifier: object, key: str) -> None:
        self.operations.append({"action": action, "entity": entity, "id": identifier, "key": key})

    @property
    def counts(self) -> Counter:
        return Counter(f"{item['action']}:{item['entity']}" for item in self.operations)


def _set(report: SyncReport, entity: object, values: dict[str, object], label: str) -> None:
    changed = False
    for attribute, value in values.items():
        if getattr(entity, attribute) != value:
            setattr(entity, attribute, value)
            changed = True
    if changed:
        report.add("update", type(entity).__name__, getattr(entity, "id", "new"), label)


def _counts(session: Session) -> dict[str, int]:
    models = (
        Profile,
        SocialLink,
        Experience,
        ExperienceBullet,
        Skill,
        Project,
        Education,
        Certification,
        MediaAsset,
        ContactMessage,
        ProjectImage,
    )
    counts = {model.__tablename__: session.scalar(select(func.count()).select_from(model)) or 0 for model in models}
    counts["project_skills"] = session.scalar(select(func.count()).select_from(project_skills)) or 0
    return counts


def _media_hashes(session: Session) -> dict[int, str]:
    rows = session.scalars(select(MediaAsset).order_by(MediaAsset.id))
    result: dict[int, str] = {}
    for row in rows:
        digest = hashlib.sha256()
        digest.update((row.asset_type or "").encode())
        digest.update((row.mime_type or "").encode())
        digest.update((row.data_base64 or "").encode())
        digest.update((row.svg_content or "").encode())
        result[row.id] = digest.hexdigest()
    return result


def _upsert_profile(session: Session, report: SyncReport) -> None:
    profiles = list(session.scalars(select(Profile).order_by(Profile.id)))
    if not profiles:
        profile = Profile(**PROFILE)
        session.add(profile)
        report.add("create", "Profile", "new", PROFILE["full_name"])
        return
    _set(report, profiles[0], PROFILE, PROFILE["full_name"])
    if len(profiles) > 1:
        report.add("conflict", "Profile", "multiple", "perfiles adicionales conservados")


def _sync_socials(session: Session, report: SyncReport) -> None:
    rows = list(session.scalars(select(SocialLink).order_by(SocialLink.id)))
    used_ids: set[int] = set()
    used_rows: list[SocialLink] = []
    for order, (platform, url, icon_name) in enumerate(SOCIALS):
        candidates = [
            row for row in rows
            if row not in used_rows and (row.id is None or row.id not in used_ids) and normalized(row.platform) == normalized(platform)
        ]
        row = candidates[0] if candidates else SocialLink(platform=platform, url=url)
        if row.id is None:
            session.add(row)
            rows.append(row)
            report.add("create", "SocialLink", "new", platform)
        else:
            used_ids.add(row.id)
        used_rows.append(row)
        _set(report, row, {"platform": platform, "url": url, "icon_name": icon_name, "display_order": order, "is_active": True}, platform)
    target_platforms = {normalized(item[0]) for item in SOCIALS}
    for row in rows:
        if row not in used_rows and normalized(row.platform) in target_platforms:
            _set(report, row, {"is_active": False}, row.platform)
        elif normalized(row.platform) not in target_platforms:
            _set(report, row, {"is_active": False}, row.platform)


def _experience_identity(spec: dict[str, object]) -> str:
    return f"{spec['company']} / {spec['position']}"


def _sync_bullets(target: Experience, bullets: Iterable[str], report: SyncReport) -> None:
    existing = sorted(target.bullets, key=lambda item: (item.display_order, item.id or 0))
    desired = list(bullets)
    if len(existing) > len(desired):
        raise RuntimeError("La experiencia objetivo tiene bullets adicionales sin campo is_active; se requiere revision manual.")
    for order, description in enumerate(desired):
        if order < len(existing):
            _set(report, existing[order], {"description": description, "display_order": order}, f"bullet {order + 1}")
        else:
            target.bullets.append(ExperienceBullet(description=description, display_order=order))
            report.add("create", "ExperienceBullet", "new", f"bullet {order + 1}")


def _sync_experiences(session: Session, report: SyncReport) -> None:
    rows = list(session.scalars(select(Experience).order_by(Experience.id)))
    target_keys = {normalized(spec["company"]) for spec in EXPERIENCES}
    for spec in EXPERIENCES:
        target = next((row for row in rows if normalized(row.company) == normalized(spec["company"])), None)
        if target is None:
            values = {key: spec[key] for key in ("company", "position", "country", "city", "start_date", "end_date", "is_current", "description")}
            target = Experience(**values, display_order=spec["display_order"], is_active=True)
            session.add(target)
            rows.append(target)
            report.add("create", "Experience", "new", _experience_identity(spec))
        values = {key: spec[key] for key in ("company", "position", "country", "city", "start_date", "end_date", "is_current", "description", "display_order", "is_active")}
        _set(report, target, values, _experience_identity(spec))
        _sync_bullets(target, spec["bullets"], report)
    for row in rows:
        if normalized(row.company) not in target_keys:
            company, company_changed = _replace_protected(row.company, "entidad reservada")
            position, position_changed = _replace_protected(row.position, "cargo historico")
            description, description_changed = _replace_protected(row.description, "organización cliente")
            values: dict[str, object] = {"is_active": False}
            if company_changed:
                values["company"] = company
            if position_changed:
                values["position"] = position
            if description_changed:
                values["description"] = description
            _set(report, row, values, f"experiencia historica {row.id}")


def _skill_specs() -> list[tuple[str, str, str, int]]:
    result = []
    order = 0
    for category, names in SKILL_GROUPS.items():
        for name in names:
            if name in PRINCIPAL:
                level = "Principal"
            elif name in INTERMEDIATE:
                level = "Intermedio"
            else:
                level = "Complementario"
            result.append((name, category, level, order))
            order += 1
    return result


def _sync_skills(session: Session, report: SyncReport) -> dict[str, Skill]:
    rows = list(session.scalars(select(Skill).order_by(Skill.id)))
    by_key = {normalized(row.name): row for row in rows}
    target: dict[str, Skill] = {}
    for name, category, level, order in _skill_specs():
        key = normalized(name)
        row = by_key.get(key)
        if row is None:
            row = Skill(name=name, category=category, level=level, display_order=order, is_active=True)
            session.add(row)
            rows.append(row)
            by_key[key] = row
            report.add("create", "Skill", "new", name)
        _set(report, row, {"name": name, "category": category, "level": level, "display_order": order, "is_active": True, "icon_asset_id": None, "color": None}, name)
        target[name] = row
    target_keys = {normalized(name) for name in target}
    for row in rows:
        if normalized(row.name) not in target_keys:
            name, name_changed = _replace_protected(row.name, "skill reservada")
            values: dict[str, object] = {"is_active": False}
            if name_changed:
                values["name"] = name
            _set(report, row, values, row.name)
    return target


def _sync_projects(session: Session, report: SyncReport, skills: dict[str, Skill]) -> None:
    rows = list(session.scalars(select(Project).order_by(Project.id)))
    by_slug = {row.slug: row for row in rows}
    target_slugs = {item["slug"] for item in PROJECTS}
    for order, spec in enumerate(PROJECTS):
        row = by_slug.get(spec["slug"])
        if row is None:
            row = Project(title=spec["title"], slug=spec["slug"], short_description=spec["short_description"], description=spec["description"])
            session.add(row)
            rows.append(row)
            report.add("create", "Project", "new", spec["slug"])
        values = {key: spec[key] for key in ("title", "slug", "short_description", "description")}
        values.update(
            {
                "display_order": order,
                "is_active": True,
                "is_featured": spec["slug"] in FEATURED_PROJECT_SLUGS,
                "is_confidential": True,
                "confidentiality_note": CONFIDENTIALITY_NOTE,
                "client_display_name": GENERIC_CLIENT,
                "allow_public_images": False,
                "image_asset_id": None,
                "repository_url": None,
                "demo_url": None,
            }
        )
        _set(report, row, values, spec["slug"])
        if row.gallery_items:
            report.add("detach", "ProjectImage", row.id or "new", spec["slug"])
            row.gallery_items.clear()
        desired = [skills[name] for name in spec["skills"]]
        if {normalized(item.name) for item in row.skills} != {normalized(item.name) for item in desired}:
            row.skills = desired
            report.add("associate", "ProjectSkill", row.id or "new", spec["slug"])
    for row in rows:
        if row.slug not in target_slugs:
            title, title_changed = _replace_protected(row.title, "Proyecto historico reservado")
            short_description, short_changed = _replace_protected(row.short_description, "Proyecto historico inactivo")
            description, description_changed = _replace_protected(row.description, "Proyecto historico inactivo")
            values = {"is_active": False}
            if title_changed:
                values["title"] = title
            if short_changed:
                values["short_description"] = short_description
            if description_changed:
                values["description"] = description
            _set(report, row, values, row.slug)


def _sync_education(session: Session, report: SyncReport) -> None:
    rows = list(session.scalars(select(Education).order_by(Education.id)))
    target = rows[0] if rows else None
    if target is None:
        target = Education(**EDUCATION, display_order=0, is_active=True)
        session.add(target)
        rows.append(target)
        report.add("create", "Education", "new", EDUCATION["institution"])
    _set(report, target, {**EDUCATION, "display_order": 0, "is_active": True}, EDUCATION["institution"])
    for row in rows:
        if row is not target:
            _set(report, row, {"is_active": False}, f"{row.institution} / {row.degree}")


def _sync_certifications(session: Session, report: SyncReport) -> None:
    for certification in session.scalars(select(Certification).order_by(Certification.id)):
        _set(report, certification, {"is_active": False}, f"certificacion {certification.id}")


def _sanitize_media_metadata(session: Session, report: SyncReport) -> None:
    for asset in session.scalars(select(MediaAsset).order_by(MediaAsset.id)):
        file_name, file_changed = _replace_protected(asset.file_name, f"asset-reservado-{asset.id}")
        alt_text, alt_changed = _replace_protected(asset.alt_text, "Recurso reservado")
        values: dict[str, object] = {}
        if file_changed:
            values["file_name"] = file_name
        if alt_changed:
            values["alt_text"] = alt_text
        if values:
            _set(report, asset, values, f"media asset {asset.id}")


def _public_text_values(session: Session) -> list[str]:
    values: list[str] = []
    for profile in session.scalars(select(Profile)):
        values.extend([profile.full_name, profile.professional_title, profile.summary, profile.location, profile.email, profile.phone, profile.cv_url])
    for social in session.scalars(select(SocialLink)):
        values.extend([social.platform, social.url, social.icon_name])
    for skill in session.scalars(select(Skill)):
        values.extend([skill.name, skill.category, skill.level, skill.color])
    for project in session.scalars(select(Project)):
        values.extend([project.title, project.slug, project.short_description, project.description, project.confidentiality_note, project.client_display_name, project.repository_url, project.demo_url])
    for experience in session.scalars(select(Experience)):
        values.extend([experience.company, experience.position, experience.country, experience.city, experience.description])
        values.extend(bullet.description for bullet in experience.bullets)
    for education in session.scalars(select(Education)):
        values.extend([education.institution, education.degree, education.field_of_study, education.description])
    for certification in session.scalars(select(Certification)):
        values.extend([certification.name, certification.issuer, certification.credential_url, certification.description])
    for asset in session.scalars(select(MediaAsset)):
        values.extend([asset.file_name, asset.alt_text])
    return [value for value in values if value]


def _validate(session: Session, before: dict[str, int], before_media_hashes: dict[int, str]) -> None:
    active_experiences = list(session.scalars(select(Experience).where(Experience.is_active.is_(True)).order_by(Experience.display_order)))
    active_projects = list(session.scalars(select(Project).where(Project.is_active.is_(True)).order_by(Project.display_order)))
    active_education = list(session.scalars(select(Education).where(Education.is_active.is_(True))))
    active_skills = list(session.scalars(select(Skill).where(Skill.is_active.is_(True))))
    expected_experiences = [(spec["company"], spec["end_date"]) for spec in EXPERIENCES]
    if [(item.company, item.end_date) for item in active_experiences] != expected_experiences:
        raise RuntimeError("La validacion exige Fofimatic y Kodland activos con fechas C3.")
    if any(item.is_current for item in active_experiences):
        raise RuntimeError("Ninguna experiencia debe quedar marcada como actual.")
    if len(active_projects) != 6 or {item.slug for item in active_projects} != {item["slug"] for item in PROJECTS}:
        raise RuntimeError("La validacion exige exactamente los seis proyectos profesionales activos.")
    if any(not item.is_confidential or item.allow_public_images for item in active_projects):
        raise RuntimeError("Los seis proyectos profesionales deben ser confidenciales y sin imagenes publicas.")
    if any(item.image_asset_id or item.gallery_items or item.repository_url or item.demo_url for item in active_projects):
        raise RuntimeError("Los proyectos profesionales deben quedar sin imagenes, URLs o repositorios.")
    if {item.slug for item in active_projects if item.is_featured} != FEATURED_PROJECT_SLUGS:
        raise RuntimeError("Deben quedar exactamente tres proyectos destacados.")
    if len(active_education) != 1 or active_education[0].degree != EDUCATION["degree"]:
        raise RuntimeError("La validacion exige una unica educacion activa como egresado.")
    if "título obtenido" in normalized(active_education[0].description) or "graduado" in normalized(active_education[0].description):
        raise RuntimeError("La educacion no debe afirmar titulacion otorgada.")
    if len(active_skills) != 41:
        raise RuntimeError("Deben quedar exactamente 41 skills activas.")
    if session.scalar(select(func.count()).select_from(project_skills)) != 50:
        raise RuntimeError("Deben quedar exactamente 50 asociaciones project_skills.")
    if session.scalar(select(func.count()).select_from(Certification).where(Certification.is_active.is_(True))):
        raise RuntimeError("No deben quedar certificaciones activas.")
    if (session.scalar(select(func.count()).select_from(MediaAsset)) or 0) != before["media_assets"]:
        raise RuntimeError("El conteo de MediaAsset cambio durante la sincronizacion.")
    if _media_hashes(session) != before_media_hashes:
        raise RuntimeError("El contenido de MediaAsset cambio durante la sincronizacion.")
    if (session.scalar(select(func.count()).select_from(ContactMessage)) or 0) != before["contact_messages"]:
        raise RuntimeError("El conteo de mensajes cambio durante la sincronizacion.")
    for value in _public_text_values(session):
        if any(pattern.casefold() in value.casefold() for pattern in PROTECTED_PATTERNS):
            raise RuntimeError("La validacion detecto una referencia protegida en contenido publico.")


def synchronize(session: Session, *, apply: bool = False, failure_hook: Callable[[], None] | None = None) -> SyncReport:
    """Sincroniza una sesion; en dry-run siempre revierte los cambios."""

    report = SyncReport(mode="apply" if apply else "dry-run")
    try:
        with session.no_autoflush:
            report.before = _counts(session)
            before_media_hashes = _media_hashes(session)
            _upsert_profile(session, report)
            _sync_socials(session, report)
            _sync_experiences(session, report)
            skills = _sync_skills(session, report)
            _sync_projects(session, report, skills)
            _sync_education(session, report)
            _sync_certifications(session, report)
            _sanitize_media_metadata(session, report)
        session.flush()
        _validate(session, report.before, before_media_hashes)
        report.after = _counts(session)
        if failure_hook:
            failure_hook()
        if apply:
            session.commit()
        else:
            session.rollback()
        return report
    except Exception:
        session.rollback()
        raise


def _sqlite_counts(path: Path) -> dict[str, int]:
    tables = (
        "profile",
        "social_links",
        "experiences",
        "experience_bullets",
        "skills",
        "projects",
        "education",
        "certifications",
        "media_assets",
        "contact_messages",
        "project_images",
        "project_skills",
    )
    uri = f"file:{path.resolve().as_posix()}?mode=ro"
    with sqlite3.connect(uri, uri=True) as connection:
        return {table: connection.execute(f"SELECT COUNT(*) FROM {table}").fetchone()[0] for table in tables}


def _current_database_path() -> Path:
    if not DATABASE_URL.startswith("sqlite:///"):
        raise RuntimeError("Este lote solo esta autorizado para SQLite.")
    return Path(DATABASE_URL.removeprefix("sqlite:///")).resolve()


def validate_backup(path: Path) -> None:
    """Verifica que el backup sea SQLite legible, integro y compatible."""

    if not path.is_file() or path.stat().st_size == 0:
        raise RuntimeError(f"Backup inexistente o vacio: {path}")
    current_path = _current_database_path()
    if not current_path.is_file():
        raise RuntimeError("No se encontro la base SQLite actual.")
    uri = f"file:{path.resolve().as_posix()}?mode=ro"
    with sqlite3.connect(uri, uri=True) as connection:
        integrity = [row[0] for row in connection.execute("PRAGMA integrity_check")]
        foreign_keys = list(connection.execute("PRAGMA foreign_key_check"))
    if integrity != ["ok"] or foreign_keys:
        raise RuntimeError(f"Backup no valido: integrity={integrity}, foreign_key_violations={len(foreign_keys)}")
    if path.stat().st_size != current_path.stat().st_size:
        raise RuntimeError("El backup no coincide en tamano con la SQLite actual.")
    if _sqlite_counts(path) != _sqlite_counts(current_path):
        raise RuntimeError("El backup no coincide en conteos con la SQLite actual.")


def _default_backup() -> Path | None:
    backup_dir = settings.backend_root / "backups"
    candidates = sorted(backup_dir.glob("portfolio_before_c3_content_*.db"), key=lambda item: item.stat().st_mtime, reverse=True)
    return candidates[0] if candidates else None


def _print_report(report: SyncReport) -> None:
    print(f"Modo: {report.mode}")
    print(f"Operaciones: {len(report.operations)} ({dict(report.counts)})")
    for operation in report.operations:
        print(f"- {operation['action']} {operation['entity']} id={operation['id']} key={operation['key']}")
    print(f"Conteos antes: {report.before}")
    print(f"Conteos despues: {report.after}")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument("--dry-run", action="store_true", help="Simula y revierte (predeterminado).")
    mode.add_argument("--apply", action="store_true", help="Aplica la sincronizacion en una transaccion.")
    parser.add_argument("--backup-path", type=Path, help="Backup SQLite requerido para --apply.")
    args = parser.parse_args()

    if not DATABASE_URL.startswith("sqlite"):
        raise RuntimeError("Este lote solo esta autorizado para la SQLite local.")
    if args.apply:
        backup = args.backup_path or _default_backup()
        if backup is None:
            raise RuntimeError("--apply requiere un backup portfolio_before_c3_content_*.db valido.")
        if not backup.is_absolute():
            backup = settings.backend_root / backup
        validate_backup(backup)
        print(f"Backup verificado: {backup.resolve()}")

    with SessionLocal() as session:
        report = synchronize(session, apply=args.apply)
    _print_report(report)


if __name__ == "__main__":
    main()
