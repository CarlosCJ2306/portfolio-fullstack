# -----------------------------------------------------------------------------
#                              LIBRERÍAS
# -----------------------------------------------------------------------------
"""
Módulo: app.models.profile_model

Modelo ORM para la información principal del perfil profesional.

Esta tabla alimentará secciones como:
- Hero.
- Sobre mí.
- Datos de contacto.
- Avatar.
- CV.

Autor: Carlos Andrés Jiménez Sarmiento (CJ)
Proyecto: Portfolio Full Stack
"""

from sqlalchemy import ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base
from app.models.mixins import TimestampMixin


# -----------------------------------------------------------------------------
#                              MODELO
# -----------------------------------------------------------------------------

class Profile(Base, TimestampMixin):
    """
    Representa la información principal del propietario del portafolio.
    """

    __tablename__ = "profile"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True
    )

    full_name: Mapped[str] = mapped_column(
        String(150),
        nullable=False
    )

    professional_title: Mapped[str] = mapped_column(
        String(150),
        nullable=False
    )

    summary: Mapped[str] = mapped_column(
        Text,
        nullable=False
    )

    location: Mapped[str | None] = mapped_column(
        String(150),
        nullable=True
    )

    email: Mapped[str | None] = mapped_column(
        String(150),
        nullable=True
    )

    phone: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True
    )

    cv_url: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True
    )

    avatar_asset_id: Mapped[int | None] = mapped_column(
        ForeignKey("media_assets.id"),
        nullable=True
    )

    avatar = relationship(
        "MediaAsset",
        lazy="joined"
    )