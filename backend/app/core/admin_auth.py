"""
Módulo: app.core.admin_auth

Autenticación básica para el panel administrativo del portafolio.
"""

from __future__ import annotations

import secrets

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBasic, HTTPBasicCredentials

from app.core.config import settings
from app.core.log import log_success, log_warning


security = HTTPBasic()


def ensure_admin_enabled() -> None:
    """
    Verifica si el módulo administrativo está habilitado.
    """
    if not settings.admin_enabled:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Módulo administrativo no disponible."
        )


def verify_admin_access(
    credentials: HTTPBasicCredentials = Depends(security)
) -> str:
    """
    Valida las credenciales del administrador.
    """
    ensure_admin_enabled()

    correct_username = secrets.compare_digest(
        credentials.username,
        settings.admin_username
    )

    correct_password = secrets.compare_digest(
        credentials.password,
        settings.admin_password
    )

    if not correct_username or not correct_password:
        log_warning(
            "Intento no autorizado de acceso al panel admin.",
            username="[redacted]"
        )

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales inválidas para el panel admin.",
            headers={"WWW-Authenticate": "Basic"},
        )

    log_success(
        "Acceso autorizado al panel admin.",
        username="[redacted]"
    )

    return credentials.username
