# -----------------------------------------------------------------------------
#                              LIBRERÍAS
# -----------------------------------------------------------------------------
"""
Módulo: app.models.media_asset_model

Modelo ORM para almacenar recursos multimedia del portafolio.

Esta tabla permite guardar:
- Íconos SVG.
- Imágenes Base64.
- Avatares.
- Imágenes de proyectos.

Autor: Carlos Andrés Jiménez Sarmiento (CJ)
Proyecto: Portfolio Full Stack
"""

from sqlalchemy import Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.database.base import Base
from app.models.mixins import ActiveMixin, TimestampMixin


# -----------------------------------------------------------------------------
#                              MODELO
# -----------------------------------------------------------------------------

class MediaAsset(Base, TimestampMixin, ActiveMixin):
    """
    Representa un recurso multimedia almacenado en la base de datos.
    """

    __tablename__ = "media_assets"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True
    )

    asset_type: Mapped[str] = mapped_column(
        String(80),
        nullable=False
    )

    file_name: Mapped[str | None] = mapped_column(
        String(180),
        nullable=True
    )

    mime_type: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True
    )

    data_base64: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )

    svg_content: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )

    alt_text: Mapped[str | None] = mapped_column(
        String(180),
        nullable=True
    )