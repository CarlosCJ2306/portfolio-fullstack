# -----------------------------------------------------------------------------
#                              LIBRERÍAS
# -----------------------------------------------------------------------------
"""
Módulo: app.models.certification_model

Modelo ORM para certificaciones, cursos o credenciales.

Autor: Carlos Andrés Jiménez Sarmiento (CJ)
Proyecto: Portfolio Full Stack
"""

from datetime import date

from sqlalchemy import Date, Integer, String, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base
from app.models.mixins import ActiveMixin, DisplayOrderMixin, TimestampMixin


# -----------------------------------------------------------------------------
#                              MODELO
# -----------------------------------------------------------------------------

class Certification(Base, TimestampMixin, ActiveMixin, DisplayOrderMixin):
    """
    Representa una certificación o curso.
    """

    __tablename__ = "certifications"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True
    )

    name: Mapped[str] = mapped_column(
        String(180),
        nullable=False
    )

    issuer: Mapped[str | None] = mapped_column(
        String(180),
        nullable=True
    )

    issue_date: Mapped[date | None] = mapped_column(
        Date,
        nullable=True
    )

    expiration_date: Mapped[date | None] = mapped_column(
        Date,
        nullable=True
    )

    credential_url: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )

    certificate_file_id: Mapped[int | None] = mapped_column(
        Integer,
        ForeignKey("media_assets.id", ondelete="SET NULL"),
        nullable=True
    )

    certificate_file: Mapped["MediaAsset | None"] = relationship(
        "MediaAsset",
        foreign_keys=[certificate_file_id],
        lazy="joined"
    )
