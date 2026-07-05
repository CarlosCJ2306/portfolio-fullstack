# -----------------------------------------------------------------------------
#                              LIBRERÍAS
# -----------------------------------------------------------------------------
"""
Módulo: app.models.user_model

Modelo ORM para usuarios administradores del portafolio.

Este modelo se usará más adelante para:
- Login del administrador.
- Protección del panel admin.
- Autenticación con JWT.

Autor: Carlos Andrés Jiménez Sarmiento (CJ)
Proyecto: Portfolio Full Stack
"""

from sqlalchemy import Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database.base import Base
from app.models.mixins import ActiveMixin, TimestampMixin


# -----------------------------------------------------------------------------
#                              MODELO
# -----------------------------------------------------------------------------

class User(Base, TimestampMixin, ActiveMixin):
    """
    Representa un usuario administrador del sistema.
    """

    __tablename__ = "users"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True
    )

    username: Mapped[str] = mapped_column(
        String(80),
        unique=True,
        nullable=False,
        index=True
    )

    email: Mapped[str] = mapped_column(
        String(150),
        unique=True,
        nullable=False,
        index=True
    )

    hashed_password: Mapped[str] = mapped_column(
        String(255),
        nullable=False
    )