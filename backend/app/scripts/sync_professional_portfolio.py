"""Sincroniza el contenido profesional aprobado sin cambiar el esquema.

El modo predeterminado es ``--dry-run``. ``--apply`` exige un backup SQLite
válido y ejecuta toda la actualización en una única transacción.
"""

from __future__ import annotations

import argparse
import sqlite3
import unicodedata
from collections import Counter
from collections.abc import Callable
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
from app.models.project_model import Project
from app.models.skill_model import Skill
from app.models.social_link_model import SocialLink


PROFILE = {
    "full_name": "Carlos Andrés Jiménez Sarmiento",
    "professional_title": "Desarrollador Fullstack y Automatización de Soluciones Empresariales",
    "summary": (
        "Desarrollador de software con experiencia en el análisis, diseño e "
        "implementación de soluciones empresariales para procesos administrativos, "
        "financieros, comerciales y operativos. Trabajo con Python, Flask, "
        "automatización RPA, Power Platform, Power BI, bases de datos SQL e "
        "integraciones mediante APIs. Me enfoco en transformar necesidades del "
        "negocio en módulos funcionales, mantenibles y escalables, participando desde "
        "el levantamiento de requerimientos y diseño de la solución hasta su "
        "desarrollo, validación, documentación y soporte."
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

EXPERIENCE = {
    "company": "Fofimatic S.A.S.",
    "position": "Ingeniero de Desarrollo y Automatización de Soluciones Empresariales",
    "country": "Colombia",
    "city": "Pamplona",
    "start_date": date(2024, 6, 1),
    "end_date": date(2026, 3, 31),
    "is_current": False,
    "description": (
        "Participación en el análisis, diseño, desarrollo, integración y mejora de "
        "soluciones tecnológicas orientadas a optimizar procesos administrativos, "
        "financieros, comerciales y operativos. Desarrollo de módulos backend con "
        "Python y Flask, interfaces internas con HTML, CSS y JavaScript, "
        "automatizaciones con RPA Framework y Power Automate, soluciones con Power "
        "Apps, reportes en Power BI e integraciones con bases de datos y servicios "
        "empresariales."
    ),
}

EXPERIENCE_BULLETS = (
    "Desarrollo de soluciones backend con Python y Flask, incorporando lógica de negocio, validaciones, consultas, reportes y trazabilidad.",
    "Construcción de interfaces y módulos administrativos con HTML, CSS, JavaScript y componentes de tablas interactivas.",
    "Implementación de automatizaciones con RPA Framework, Power Automate y Power Automate Desktop.",
    "Creación y adaptación de soluciones dentro del ecosistema Power Platform, incluyendo Power Apps.",
    "Desarrollo de reportes y análisis con Power BI, Power Query y medidas DAX.",
    "Integración con PostgreSQL, SQL Server, Oracle, MySQL, SQLite, APIs REST, JSON, webhooks, Excel y SharePoint.",
    "Levantamiento de requerimientos, creación de mockups, diseño funcional, pruebas, documentación técnica y soporte.",
    "Implementación de procesos ETL, transformación de datos, generación documental y automatización de reportes.",
)

PROJECTS = (
    {
        "title": "CRM empresarial modular",
        "slug": "crm-empresarial-modular",
        "short_description": "Solución modular para centralizar la gestión de proveedores, productos y clientes.",
        "description": "Participación en el análisis funcional, modelado de datos y construcción de módulos para administrar información comercial y operativa. La solución integró formularios, validaciones, consultas y flujos administrativos dentro de una arquitectura mantenible.",
        "skills": ("Python", "Flask", "JavaScript", "HTML5", "CSS3", "SQL", "PostgreSQL", "APIs REST", "JSON"),
    },
    {
        "title": "Gestión de reintegros y asociación documental",
        "slug": "gestion-reintegros-asociacion-documental",
        "short_description": "Solución para centralizar, procesar y relacionar información financiera y documental.",
        "description": "Desarrollo de funcionalidades para gestionar reintegros, asociar documentos de exportación con facturas, consultar tasas, realizar cálculos automáticos y mantener trazabilidad sobre los registros procesados.",
        "skills": ("Python", "Flask", "JavaScript", "SQL", "PostgreSQL", "Excel", "SharePoint", "ETL", "APIs REST"),
    },
    {
        "title": "Tracking de exportaciones",
        "slug": "tracking-exportaciones",
        "short_description": "Módulo para el seguimiento documental y operativo de procesos de exportación.",
        "description": "Construcción de una solución para centralizar estados, documentos, fechas y datos relacionados con operaciones de exportación, facilitando la consulta y trazabilidad de información entre diferentes procesos internos.",
        "skills": ("Python", "Flask", "JavaScript", "SQL", "APIs REST", "JSON", "Excel", "Automatización de procesos"),
    },
    {
        "title": "Automatización de flujo de caja y centros de costos",
        "slug": "automatizacion-flujo-caja-centros-costos",
        "short_description": "Automatización de procesos financieros y consolidación de información operativa.",
        "description": "Implementación de flujos para recolectar, validar, transformar y consolidar datos financieros. Se integraron formularios, archivos de Excel, procesos automatizados y reportes para reducir tareas manuales y mejorar la trazabilidad.",
        "skills": ("Python", "RPA Framework", "Power Automate", "Power Automate Desktop", "Excel", "OpenPyXL", "SQL", "ETL"),
    },
    {
        "title": "Inteligencia de negocio y reportes operativos",
        "slug": "inteligencia-negocio-reportes-operativos",
        "short_description": "Reportes para el análisis de indicadores administrativos, logísticos y financieros.",
        "description": "Desarrollo de modelos, transformaciones y medidas para analizar estados de procesos, cantidades, distribución por categorías, comportamiento acumulado, indicadores de facturación y diagramas de Pareto.",
        "skills": ("Power BI", "DAX", "Power Query", "Excel", "SQL", "Transformación de datos", "Modelado de información"),
    },
    {
        "title": "Ecosistema de automatización e integración empresarial",
        "slug": "ecosistema-automatizacion-integracion",
        "short_description": "Centralización de soluciones, automatizaciones y accesos dentro de un ecosistema corporativo.",
        "description": "Participación en la integración de módulos empresariales, automatizaciones, formularios y fuentes de datos. Se utilizaron herramientas de Power Platform junto con aplicaciones Python para conectar procesos y facilitar el acceso a distintas soluciones internas.",
        "skills": ("Power Apps", "Power Automate", "Python", "Flask", "RPA Framework", "SharePoint", "APIs REST", "JSON", "SQL"),
    },
)

SKILL_GROUPS = {
    "Backend e integraciones": ("Python", "Flask", "FastAPI", "APIs REST", "JSON", "Webhooks"),
    "Frontend": ("HTML5", "CSS3", "JavaScript", "React", "Vite", "Handsontable"),
    "Automatización y Power Platform": ("RPA Framework", "Power Automate", "Power Automate Desktop", "Power Apps", "Scripting", "Automatización de procesos"),
    "Inteligencia de negocio y datos": ("Power BI", "DAX", "Power Query", "Pandas", "ETL", "Excel", "OpenPyXL", "Transformación de datos", "Modelado de información"),
    "Bases de datos": ("SQL", "PostgreSQL", "SQL Server", "Oracle", "MySQL", "SQLite"),
    "Documentos, colaboración e infraestructura": ("SharePoint", "ReportLab", "WeasyPrint", "Git", "IIS", "Logging", "Validación de datos", "Generación de reportes PDF"),
}

PRINCIPAL = {"Python", "Flask", "SQL", "Power Automate", "Power BI"}
INTERMEDIATE = {"PostgreSQL", "JavaScript", "Power Apps", "DAX", "Power Query", "RPA Framework", "Pandas", "APIs REST", "Excel", "HTML5", "CSS3"}

EDUCATION = {
    "institution": "Universidad de Pamplona",
    "degree": "Ingeniería de Sistemas",
    "field_of_study": "Desarrollo de software y sistemas de información",
    "start_year": 2020,
    "end_year": 2026,
    "description": "Formación académica finalizada en Ingeniería de Sistemas, con énfasis en desarrollo de software, bases de datos, automatización, sistemas de información, redes e integración tecnológica. Ceremonia de grado prevista para octubre de 2026.",
}


def normalized(value: str) -> str:
    """Normaliza una clave editorial sin alterar el valor almacenado."""
    return " ".join(
        "".join(
            character for character in unicodedata.normalize("NFKD", value.casefold())
            if not unicodedata.combining(character)
        ).split()
    )


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
        return Counter(item["action"] for item in self.operations)


def _set(report: SyncReport, entity: object, values: dict[str, object], label: str) -> None:
    changed = False
    for attribute, value in values.items():
        if getattr(entity, attribute) != value:
            setattr(entity, attribute, value)
            changed = True
    if changed:
        report.add("update", type(entity).__name__, getattr(entity, "id", "new"), label)


def _counts(session: Session) -> dict[str, int]:
    models = (Profile, SocialLink, Experience, ExperienceBullet, Skill, Project, Education, Certification, MediaAsset, ContactMessage)
    return {model.__tablename__: session.scalar(select(func.count()).select_from(model)) or 0 for model in models}


def _upsert_profile(session: Session, report: SyncReport) -> None:
    profiles = list(session.scalars(select(Profile).order_by(Profile.id)))
    if not profiles:
        profile = Profile(**PROFILE)
        session.add(profile)
        report.add("create", "Profile", "new", PROFILE["full_name"])
    else:
        _set(report, profiles[0], PROFILE, PROFILE["full_name"])
        if len(profiles) > 1:
            report.add("conflict", "Profile", "multiple", "perfiles adicionales conservados")


def _sync_socials(session: Session, report: SyncReport) -> None:
    rows = list(session.scalars(select(SocialLink).order_by(SocialLink.id)))
    selected: set[int] = set()
    for order, (platform, url, icon_name) in enumerate(SOCIALS):
        candidates = [row for row in rows if normalized(row.platform) == normalized(platform) and row.id not in selected]
        row = candidates[0] if candidates else SocialLink(platform=platform, url=url)
        if not candidates:
            session.add(row)
            rows.append(row)
            report.add("create", "SocialLink", "new", platform)
        else:
            selected.add(row.id)
        _set(report, row, {"platform": platform, "url": url, "icon_name": icon_name, "display_order": order, "is_active": True}, platform)
    targets = {normalized(item[0]) for item in SOCIALS}
    for row in rows:
        if normalized(row.platform) not in targets or (row.id and row.id not in selected and any(normalized(row.platform) == target for target in targets)):
            _set(report, row, {"is_active": False}, row.platform)


def _sync_experience(session: Session, report: SyncReport) -> None:
    rows = list(session.scalars(select(Experience).order_by(Experience.id)))
    target = next((row for row in rows if normalized(row.company) == normalized(EXPERIENCE["company"]) and normalized(row.position) == normalized(EXPERIENCE["position"])), None)
    if target is None:
        target = Experience(**EXPERIENCE, display_order=0, is_active=True)
        session.add(target)
        rows.append(target)
        report.add("create", "Experience", "new", EXPERIENCE["company"])
    _set(report, target, {**EXPERIENCE, "display_order": 0, "is_active": True}, EXPERIENCE["company"])
    for row in rows:
        if row is not target:
            _set(report, row, {"is_active": False}, f"{row.company} / {row.position}")
    bullets = sorted(target.bullets, key=lambda item: (item.display_order, item.id or 0))
    if len(bullets) > len(EXPERIENCE_BULLETS):
        raise RuntimeError("La experiencia objetivo tiene bullets adicionales sin campo is_active; se requiere revisión manual.")
    for order, description in enumerate(EXPERIENCE_BULLETS):
        if order < len(bullets):
            _set(report, bullets[order], {"description": description, "display_order": order}, f"bullet {order + 1}")
        else:
            target.bullets.append(ExperienceBullet(description=description, display_order=order))
            report.add("create", "ExperienceBullet", "new", f"bullet {order + 1}")


def _skill_specs() -> list[tuple[str, str, str, int]]:
    result = []
    order = 0
    for category, names in SKILL_GROUPS.items():
        for name in names:
            level = "Principal" if name in PRINCIPAL else "Intermedio" if name in INTERMEDIATE else "Complementario"
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
            _set(report, row, {"is_active": False}, row.name)
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
        values.update({"display_order": order, "is_active": True, "is_featured": False, "image_asset_id": None, "repository_url": None, "demo_url": None})
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
            _set(report, row, {"is_active": False}, row.slug)


def _sync_education(session: Session, report: SyncReport) -> None:
    rows = list(session.scalars(select(Education).order_by(Education.id)))
    target = next((row for row in rows if normalized(row.institution) == normalized(EDUCATION["institution"]) and normalized(row.degree) == normalized(EDUCATION["degree"])), None)
    if target is None:
        target = Education(**EDUCATION, display_order=0, is_active=True)
        session.add(target)
        rows.append(target)
        report.add("create", "Education", "new", EDUCATION["institution"])
    _set(report, target, {**EDUCATION, "display_order": 0, "is_active": True}, EDUCATION["institution"])
    for row in rows:
        if row is not target:
            _set(report, row, {"is_active": False}, f"{row.institution} / {row.degree}")


def _validate(session: Session, before: dict[str, int]) -> None:
    active_experiences = list(session.scalars(select(Experience).where(Experience.is_active.is_(True))))
    active_projects = list(session.scalars(select(Project).where(Project.is_active.is_(True))))
    active_education = list(session.scalars(select(Education).where(Education.is_active.is_(True))))
    if len(active_experiences) != 1 or active_experiences[0].company != EXPERIENCE["company"]:
        raise RuntimeError("La validación exige una única experiencia activa de Fofimatic S.A.S.")
    if any("kodland" in normalized(f"{item.company} {item.position}") and item.is_active for item in active_experiences):
        raise RuntimeError("Kodland no puede permanecer activo.")
    if len(active_projects) != 6 or {item.slug for item in active_projects} != {item["slug"] for item in PROJECTS}:
        raise RuntimeError("La validación exige exactamente los seis proyectos profesionales activos.")
    if any(item.image_asset_id or item.gallery_items or item.repository_url or item.demo_url for item in active_projects):
        raise RuntimeError("Los proyectos profesionales deben quedar sin imágenes, URLs o repositorios.")
    if len(active_education) != 1 or active_education[0].institution != EDUCATION["institution"]:
        raise RuntimeError("La validación exige una única educación activa de la Universidad de Pamplona.")
    if session.scalar(select(func.count()).select_from(Certification).where(Certification.is_active.is_(True))):
        raise RuntimeError("No deben quedar certificaciones provisionales activas.")
    if (session.scalar(select(func.count()).select_from(MediaAsset)) or 0) != before["media_assets"]:
        raise RuntimeError("El conteo de MediaAsset cambió durante la sincronización.")
    if (session.scalar(select(func.count()).select_from(ContactMessage)) or 0) != before["contact_messages"]:
        raise RuntimeError("El conteo de mensajes cambió durante la sincronización.")


def synchronize(session: Session, *, apply: bool = False, failure_hook: Callable[[], None] | None = None) -> SyncReport:
    """Sincroniza una sesión; en dry-run siempre revierte los cambios."""
    report = SyncReport(mode="apply" if apply else "dry-run")
    try:
        with session.no_autoflush:
            report.before = _counts(session)
            _upsert_profile(session, report)
            _sync_socials(session, report)
            _sync_experience(session, report)
            skills = _sync_skills(session, report)
            _sync_projects(session, report, skills)
            _sync_education(session, report)
            for certification in session.scalars(select(Certification).order_by(Certification.id)):
                _set(report, certification, {"is_active": False}, certification.name)
        session.flush()
        _validate(session, report.before)
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


def validate_backup(path: Path) -> None:
    """Verifica que el backup sea SQLite legible e íntegro."""
    if not path.is_file() or path.stat().st_size == 0:
        raise RuntimeError(f"Backup inexistente o vacío: {path}")
    uri = f"file:{path.resolve().as_posix()}?mode=ro"
    with sqlite3.connect(uri, uri=True) as connection:
        integrity = [row[0] for row in connection.execute("PRAGMA integrity_check")]
        foreign_keys = list(connection.execute("PRAGMA foreign_key_check"))
    if integrity != ["ok"] or foreign_keys:
        raise RuntimeError(f"Backup no válido: integrity={integrity}, foreign_key_violations={len(foreign_keys)}")


def _default_backup() -> Path | None:
    backup_dir = settings.backend_root / "backups"
    candidates = sorted(backup_dir.glob("portfolio_before_content_*.db"), key=lambda item: item.stat().st_mtime, reverse=True)
    return candidates[0] if candidates else None


def _print_report(report: SyncReport) -> None:
    print(f"Modo: {report.mode}")
    print(f"Operaciones: {len(report.operations)} ({dict(report.counts)})")
    for operation in report.operations:
        print(f"- {operation['action']} {operation['entity']} id={operation['id']} key={operation['key']}")
    print(f"Conteos antes: {report.before}")
    print(f"Conteos después: {report.after}")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument("--dry-run", action="store_true", help="Simula y revierte (predeterminado).")
    mode.add_argument("--apply", action="store_true", help="Aplica la sincronización en una transacción.")
    parser.add_argument("--backup-path", type=Path, help="Backup SQLite requerido para --apply.")
    args = parser.parse_args()

    if not DATABASE_URL.startswith("sqlite"):
        raise RuntimeError("Este lote solo está autorizado para la SQLite local.")
    if args.apply:
        backup = args.backup_path or _default_backup()
        if backup is None:
            raise RuntimeError("--apply requiere un backup portfolio_before_content_*.db válido.")
        if not backup.is_absolute():
            backup = settings.backend_root / backup
        validate_backup(backup)
        print(f"Backup verificado: {backup.resolve()}")

    with SessionLocal() as session:
        report = synchronize(session, apply=args.apply)
    _print_report(report)


if __name__ == "__main__":
    main()
