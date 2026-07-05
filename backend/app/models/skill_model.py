# -----------------------------------------------------------------------------
#                              LIBRERÍAS
# -----------------------------------------------------------------------------
"""
Módulo: app.models.skill_model

Modelo ORM para habilidades técnicas del portafolio.

Ejemplos:
- Python.
- FastAPI.
- React.
- PostgreSQL.
- Power Automate.

Autor: Carlos Andrés Jiménez Sarmiento (CJ)
Proyecto: Portfolio Full Stack
"""

from __future__ import annotations

from sqlalchemy import ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base
from app.models.mixins import ActiveMixin, DisplayOrderMixin, TimestampMixin


# -----------------------------------------------------------------------------
#                              MODELO
# -----------------------------------------------------------------------------

class Skill(Base, TimestampMixin, ActiveMixin, DisplayOrderMixin):
    """
    Representa una habilidad técnica o herramienta.
    """

    __tablename__ = "skills"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True
    )

    name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        unique=True,
        index=True
    )

    category: Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )

    level: Mapped[str] = mapped_column(
        String(50),
        nullable=False
    )

    icon_asset_id: Mapped[int | None] = mapped_column(
        ForeignKey("media_assets.id"),
        nullable=True
    )

    color: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True
    )

    icon = relationship(
        "MediaAsset",
        lazy="joined"
    )

    projects = relationship(
        "Project",
        secondary="project_skills",
        back_populates="skills"
    )