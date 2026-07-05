# -----------------------------------------------------------------------------
#                              LIBRERÍAS
# -----------------------------------------------------------------------------
"""
Módulo: app.models.mixins

Mixins reutilizables para modelos SQLAlchemy.

Un mixin permite compartir columnas comunes entre varios modelos sin repetir
el mismo código en cada tabla.

Autor: Carlos Andrés Jiménez Sarmiento (CJ)
Proyecto: Portfolio Full Stack
"""

from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, Integer
from sqlalchemy.orm import Mapped, mapped_column


# -----------------------------------------------------------------------------
#                              FUNCIONES
# -----------------------------------------------------------------------------

def utc_now() -> datetime:
    """
    Retorna la fecha y hora actual en UTC.

    Returns:
        Fecha y hora actual con zona horaria UTC.
    """
    return datetime.now(timezone.utc)


# -----------------------------------------------------------------------------
#                              MIXINS
# -----------------------------------------------------------------------------

class TimestampMixin:
    """
    Agrega columnas de auditoría temporal a una tabla.

    Columnas:
    - created_at: fecha de creación del registro.
    - updated_at: fecha de última actualización del registro.
    """

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utc_now,
        nullable=False
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utc_now,
        onupdate=utc_now,
        nullable=False
    )


class ActiveMixin:
    """
    Agrega columna para activar o desactivar registros sin eliminarlos.

    Esto sirve para ocultar datos del portafolio sin borrarlos físicamente.
    """

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False
    )


class DisplayOrderMixin:
    """
    Agrega columna para controlar el orden visual de los registros.

    Usamos `display_order` en lugar de `order`, porque ORDER es una palabra
    reservada en SQL.
    """

    display_order: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False
    )