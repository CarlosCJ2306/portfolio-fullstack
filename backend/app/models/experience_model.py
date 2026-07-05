# -----------------------------------------------------------------------------
#                              LIBRERÍAS
# -----------------------------------------------------------------------------
"""
Módulo: app.models.experience_model

Modelos ORM para experiencia laboral y sus funciones o logros asociados.

Una experiencia puede tener varios bullets descriptivos.

Autor: Carlos Andrés Jiménez Sarmiento (CJ)
Proyecto: Portfolio Full Stack
"""

from __future__ import annotations

from datetime import date

from sqlalchemy import Boolean, Date, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base
from app.models.mixins import ActiveMixin, DisplayOrderMixin, TimestampMixin


# -----------------------------------------------------------------------------
#                              MODELOS
# -----------------------------------------------------------------------------

class Experience(Base, TimestampMixin, ActiveMixin, DisplayOrderMixin):
    """
    Representa una experiencia laboral.
    """

    __tablename__ = "experiences"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True
    )

    position: Mapped[str] = mapped_column(
        String(150),
        nullable=False
    )

    company: Mapped[str] = mapped_column(
        String(150),
        nullable=False
    )

    country: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True
    )

    city: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True
    )

    start_date: Mapped[date] = mapped_column(
        Date,
        nullable=False
    )

    end_date: Mapped[date | None] = mapped_column(
        Date,
        nullable=True
    )

    is_current: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )

    bullets = relationship(
        "ExperienceBullet",
        back_populates="experience",
        cascade="all, delete-orphan",
        lazy="selectin"
    )


class ExperienceBullet(Base, TimestampMixin, DisplayOrderMixin):
    """
    Representa una función, logro o responsabilidad de una experiencia laboral.
    """

    __tablename__ = "experience_bullets"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True
    )

    experience_id: Mapped[int] = mapped_column(
        ForeignKey("experiences.id"),
        nullable=False
    )

    description: Mapped[str] = mapped_column(
        Text,
        nullable=False
    )

    experience = relationship(
        "Experience",
        back_populates="bullets"
    )