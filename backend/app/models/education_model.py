# -----------------------------------------------------------------------------
#                              LIBRERÍAS
# -----------------------------------------------------------------------------
"""
Módulo: app.models.education_model

Modelo ORM para formación académica del portafolio.

Autor: Carlos Andrés Jiménez Sarmiento (CJ)
Proyecto: Portfolio Full Stack
"""

from sqlalchemy import Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.database.base import Base
from app.models.mixins import ActiveMixin, DisplayOrderMixin, TimestampMixin


# -----------------------------------------------------------------------------
#                              MODELO
# -----------------------------------------------------------------------------

class Education(Base, TimestampMixin, ActiveMixin, DisplayOrderMixin):
    """
    Representa un registro de formación académica.
    """

    __tablename__ = "education"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True
    )

    institution: Mapped[str] = mapped_column(
        String(180),
        nullable=False
    )

    degree: Mapped[str] = mapped_column(
        String(180),
        nullable=False
    )

    field_of_study: Mapped[str | None] = mapped_column(
        String(180),
        nullable=True
    )

    start_year: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True
    )

    end_year: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )