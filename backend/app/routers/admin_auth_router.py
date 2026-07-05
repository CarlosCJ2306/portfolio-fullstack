"""
Módulo: app.routers.admin_auth_router

Router de autenticación para el panel administrativo.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends
from fastapi.security import HTTPBasicCredentials

from app.core.admin_auth import security, verify_admin_access
from app.core.log import log_info


router = APIRouter(
    prefix="/api/admin/auth",
    tags=["Admin Auth"]
)


@router.post("/login")
def admin_login(
    credentials: HTTPBasicCredentials = Depends(security)
) -> dict:
    username = verify_admin_access(credentials)

    log_info("Login admin validado.", username=username)

    return {
        "success": True,
        "message": "Acceso administrativo autorizado.",
        "username": username,
    }