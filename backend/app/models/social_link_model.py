# -----------------------------------------------------------------------------
#                              LIBRERÍAS
# -----------------------------------------------------------------------------
"""
Módulo: app.models.social_link_model

Modelo ORM para enlaces sociales del portafolio.

Ejemplos:
- GitHub.
- LinkedIn.
- Email.
- WhatsApp.

Autor: Carlos Andrés Jiménez Sarmiento (CJ)
Proyecto: Portfolio Full Stack
"""

from sqlalchemy import Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database.base import Base
from app.models.mixins import ActiveMixin, DisplayOrderMixin, TimestampMixin


# -----------------------------------------------------------------------------
#                              MODELO
# -----------------------------------------------------------------------------

class SocialLink(Base, TimestampMixin, ActiveMixin, DisplayOrderMixin):
    """
    Representa un enlace social o canal de contacto.
    """

    __tablename__ = "social_links"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True
    )

    platform: Mapped[str] = mapped_column(
        String(80),
        nullable=False
    )

    url: Mapped[str] = mapped_column(
        String(255),
        nullable=False
    )

    icon_name: Mapped[str | None] = mapped_column(
        String(80),
        nullable=True
    )