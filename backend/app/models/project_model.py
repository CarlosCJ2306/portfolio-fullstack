# -----------------------------------------------------------------------------
#                              LIBRERÍAS
# -----------------------------------------------------------------------------
"""
Módulo: app.models.project_model

Modelo ORM para proyectos del portafolio.

Incluye una relación muchos a muchos entre proyectos y skills mediante
la tabla intermedia `project_skills`.

Autor: Carlos Andrés Jiménez Sarmiento (CJ)
Proyecto: Portfolio Full Stack
"""

from __future__ import annotations

from sqlalchemy import Boolean, Column, ForeignKey, Index, Integer, String, Table, Text, false, true
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base
from app.models.mixins import ActiveMixin, DisplayOrderMixin, TimestampMixin


# -----------------------------------------------------------------------------
#                              TABLA INTERMEDIA
# -----------------------------------------------------------------------------

project_skills = Table(
    "project_skills",
    Base.metadata,
    Column(
        "project_id",
        ForeignKey("projects.id"),
        primary_key=True
    ),
    Column(
        "skill_id",
        ForeignKey("skills.id"),
        primary_key=True
    )
)


# -----------------------------------------------------------------------------
#                              MODELO
# -----------------------------------------------------------------------------

class ProjectImage(Base):
    """
    Asociacion ordenada entre proyectos y sus imagenes adicionales.
    """

    __tablename__ = "project_images"
    __table_args__ = (
        Index(
            "ix_project_images_project_order",
            "project_id",
            "display_order",
            "media_asset_id"
        ),
    )

    project_id: Mapped[int] = mapped_column(
        ForeignKey("projects.id", ondelete="CASCADE"),
        primary_key=True
    )

    media_asset_id: Mapped[int] = mapped_column(
        ForeignKey("media_assets.id", ondelete="RESTRICT"),
        primary_key=True
    )

    display_order: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0
    )

    project: Mapped["Project"] = relationship(
        "Project",
        back_populates="gallery_items"
    )

    image: Mapped["MediaAsset"] = relationship(
        "MediaAsset",
        lazy="joined"
    )


class Project(Base, TimestampMixin, ActiveMixin, DisplayOrderMixin):
    """
    Representa un proyecto mostrado en el portafolio.
    """

    __tablename__ = "projects"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True
    )

    title: Mapped[str] = mapped_column(
        String(150),
        nullable=False
    )

    slug: Mapped[str] = mapped_column(
        String(180),
        unique=True,
        nullable=False,
        index=True
    )

    short_description: Mapped[str] = mapped_column(
        String(255),
        nullable=False
    )

    description: Mapped[str] = mapped_column(
        Text,
        nullable=False
    )

    is_confidential: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        server_default=false(),
        nullable=False
    )

    confidentiality_note: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )

    client_display_name: Mapped[str | None] = mapped_column(
        String(180),
        nullable=True
    )

    allow_public_images: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        server_default=true(),
        nullable=False
    )

    image_asset_id: Mapped[int | None] = mapped_column(
        ForeignKey("media_assets.id"),
        nullable=True
    )

    repository_url: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True
    )

    demo_url: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True
    )

    is_featured: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False
    )

    image: Mapped["MediaAsset | None"] = relationship(
        "MediaAsset",
        lazy="joined"
    )

    gallery_items: Mapped[list["ProjectImage"]] = relationship(
        "ProjectImage",
        back_populates="project",
        cascade="all, delete-orphan",
        lazy="selectin",
        order_by=lambda: (
            ProjectImage.display_order.asc(),
            ProjectImage.media_asset_id.asc()
        )
    )

    skills: Mapped[list["Skill"]] = relationship(
        "Skill",
        secondary="project_skills",
        back_populates="projects",
        lazy="selectin"
    )

    @property
    def gallery_images(self) -> list["ProjectImage"]:
        return self.gallery_items
