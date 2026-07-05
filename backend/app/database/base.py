# -----------------------------------------------------------------------------
#                              LIBRERÍAS
# -----------------------------------------------------------------------------
"""
Módulo: app.database.base

Define la clase base declarativa de SQLAlchemy.

Esta clase será heredada por todos los modelos de base de datos del proyecto.
Cada modelo que herede de `Base` podrá convertirse en una tabla dentro de
SQLite mediante SQLAlchemy.

Ejemplo:
    class Skill(Base):
        __tablename__ = "skills"

Autor: Carlos Andrés Jiménez Sarmiento (CJ)
Proyecto: Portfolio Full Stack
"""

from sqlalchemy.orm import DeclarativeBase


# -----------------------------------------------------------------------------
#                              BASE ORM
# -----------------------------------------------------------------------------

class Base(DeclarativeBase):
    """
    Clase base para todos los modelos ORM del proyecto.

    SQLAlchemy usa esta clase para registrar metadata de las tablas,
    columnas, relaciones y restricciones.
    """

    pass