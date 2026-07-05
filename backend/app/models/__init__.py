"""
Módulo: app.models

Registro centralizado de modelos ORM.

Este archivo importa todos los modelos para que SQLAlchemy los registre
en `Base.metadata` y puedan ser creados mediante `create_db.py`.
"""

from app.models.media_asset_model import MediaAsset
from app.models.user_model import User
from app.models.profile_model import Profile
from app.models.social_link_model import SocialLink
from app.models.skill_model import Skill
from app.models.project_model import Project, ProjectImage, project_skills
from app.models.experience_model import Experience, ExperienceBullet
from app.models.education_model import Education
from app.models.certification_model import Certification
from app.models.contact_message_model import ContactMessage


__all__ = [
    "MediaAsset",
    "User",
    "Profile",
    "SocialLink",
    "Skill",
    "Project",
    "ProjectImage",
    "project_skills",
    "Experience",
    "ExperienceBullet",
    "Education",
    "Certification",
    "ContactMessage",
]
