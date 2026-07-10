# -----------------------------------------------------------------------------
#                              LIBRERÍAS
# -----------------------------------------------------------------------------
"""
Módulo: app.main

Punto de entrada principal del backend FastAPI.

Este archivo:
- Crea la instancia principal de FastAPI.
- Configura CORS para permitir conexión con React.
- Registra routers.
- Registra logs de arranque, cierre y peticiones HTTP.
- Controla el acceso a Swagger, ReDoc y OpenAPI JSON.
- Permite listar las rutas registradas en la aplicación.

Autor: Carlos Andrés Jiménez Sarmiento (CJ)
Proyecto: Portfolio Full Stack
"""

from __future__ import annotations

import secrets
import time
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.openapi.docs import get_redoc_html, get_swagger_ui_html
from fastapi.openapi.utils import get_openapi
from fastapi.responses import JSONResponse
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from sqlalchemy import text

from app.core.config import settings
from app.core.log import log_error, log_info, log_success, log_warning
from app.database.connection import engine
from app.routers.admin_auth_router import router as admin_auth_router
from app.routers.admin_router import router as admin_router
from app.routers.public_router import router as public_router


# -----------------------------------------------------------------------------
#                              SEGURIDAD DOCS
# -----------------------------------------------------------------------------

security = HTTPBasic()


def ensure_docs_enabled() -> None:
    """
    Verifica si la documentación de la API está habilitada.

    Raises:
        HTTPException: Si la documentación está deshabilitada.
    """
    if not settings.api_docs_enabled:
        log_warning(
            "Intento de acceso a documentación API deshabilitada.",
            app_env=settings.app_env
        )

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Documentación no disponible."
        )


def verify_docs_access(
    credentials: HTTPBasicCredentials = Depends(security)
) -> str:
    """
    Verifica acceso a la documentación de la API mediante HTTP Basic Auth.

    Args:
        credentials: Credenciales ingresadas por el usuario.

    Returns:
        Nombre de usuario autenticado.

    Raises:
        HTTPException: Si las credenciales son inválidas.
    """
    correct_username = secrets.compare_digest(
        credentials.username,
        settings.api_docs_username
    )

    correct_password = secrets.compare_digest(
        credentials.password,
        settings.api_docs_password
    )

    if not correct_username or not correct_password:
        log_warning(
            "Intento no autorizado de acceso a documentación API.",
            username="[redacted]"
        )

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales inválidas para acceder a la documentación.",
            headers={"WWW-Authenticate": "Basic"},
        )

    log_success(
        "Acceso autorizado a documentación API.",
        username="[redacted]"
    )

    return credentials.username


# -----------------------------------------------------------------------------
#                              LIFESPAN
# -----------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app_instance: FastAPI):
    """
    Maneja eventos de inicio y cierre de la aplicación.

    Args:
        app_instance: Instancia de FastAPI.
    """
    log_success(
        "Aplicación FastAPI iniciada correctamente.",
        app_name=settings.app_name,
        app_env=settings.app_env,
        app_debug=settings.app_debug,
        docs_enabled=settings.api_docs_enabled
    )

    yield

    log_info(
        "Aplicación FastAPI finalizada.",
        app_name=settings.app_name,
        app_env=settings.app_env
    )


# -----------------------------------------------------------------------------
#                              METADATA OPENAPI
# -----------------------------------------------------------------------------

tags_metadata = [
    {
        "name": "Root",
        "description": (
            "Endpoints generales del backend, usados para verificar "
            "el estado básico de la API."
        ),
    },
    {
        "name": "Public",
        "description": (
            "Endpoints públicos consumidos por el frontend React para mostrar "
            "información del portafolio: perfil, skills, proyectos, experiencia, "
            "educación y certificaciones."
        ),
    },
    {
        "name": "Admin",
        "description": (
            "Endpoints protegidos para administrar el contenido del portafolio: "
            "perfil, enlaces sociales, skills, proyectos, experiencia, "
            "educación, certificaciones y mensajes de contacto."
        ),
    },
    {
        "name": "Admin Auth",
        "description": (
            "Validación básica de credenciales para acceder al panel admin."
        ),
    },
]


# -----------------------------------------------------------------------------
#                              APP
# -----------------------------------------------------------------------------

app = FastAPI(
    title=settings.app_name,
    description=(
        "Backend API para portafolio full stack construido con FastAPI, "
        "SQLite, SQLAlchemy y React. Esta API expone información pública "
        "del portafolio y también un módulo administrativo protegido."
    ),
    version="0.1.0",
    contact={
        "name": "Carlos Andrés Jiménez Sarmiento",
        "email": "correo@example.com",
    },
    license_info={
        "name": "Uso privado / académico",
    },
    openapi_tags=tags_metadata,

    # Se desactiva la documentación automática para controlarla manualmente.
    docs_url=None,
    redoc_url=None,
    openapi_url=None,

    lifespan=lifespan
)


# -----------------------------------------------------------------------------
#                              CORS
# -----------------------------------------------------------------------------

app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=list(settings.trusted_hosts),
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=list(settings.cors_allowed_origins),
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept", "If-None-Match"],
    expose_headers=["ETag", "Content-Disposition"],
)


# -----------------------------------------------------------------------------
#                              MIDDLEWARE DE LOGS HTTP
# -----------------------------------------------------------------------------

@app.middleware("http")
async def log_http_requests(
    request: Request,
    call_next
):
    """
    Registra cada petición HTTP que llega al backend.

    Args:
        request: Petición entrante.
        call_next: Siguiente proceso del pipeline de FastAPI.

    Returns:
        Respuesta HTTP.
    """
    start_time = time.perf_counter()

    try:
        response = await call_next(request)

        duration_ms = round(
            (time.perf_counter() - start_time) * 1000,
            2
        )

        log_info(
            "Petición HTTP procesada.",
            method=request.method,
            path=request.url.path,
            status_code=response.status_code,
            duration_ms=duration_ms
        )

        return response

    except Exception as error:
        duration_ms = round(
            (time.perf_counter() - start_time) * 1000,
            2
        )

        log_error(
            "Error procesando petición HTTP.",
            error=error,
            method=request.method,
            path=request.url.path,
            duration_ms=duration_ms
        )

        raise


# -----------------------------------------------------------------------------
#                              DOCUMENTACIÓN API PROTEGIDA
# -----------------------------------------------------------------------------

@app.get(
    "/docs",
    include_in_schema=False
)
def custom_swagger_ui(
    username: str = Depends(verify_docs_access)
):
    """
    Muestra Swagger UI solo si la documentación está habilitada
    y el usuario está autenticado.

    Args:
        username: Usuario autenticado.

    Returns:
        HTML de Swagger UI.
    """
    ensure_docs_enabled()

    log_info(
        "Swagger UI consultado.",
        username="[redacted]"
    )

    return get_swagger_ui_html(
        openapi_url="/openapi.json",
        title=f"{settings.app_name} - Swagger UI"
    )


@app.get(
    "/redoc",
    include_in_schema=False
)
def custom_redoc(
    username: str = Depends(verify_docs_access)
):
    """
    Muestra ReDoc solo si la documentación está habilitada
    y el usuario está autenticado.

    Args:
        username: Usuario autenticado.

    Returns:
        HTML de ReDoc.
    """
    ensure_docs_enabled()

    log_info(
        "ReDoc consultado.",
        username="[redacted]"
    )

    return get_redoc_html(
        openapi_url="/openapi.json",
        title=f"{settings.app_name} - ReDoc"
    )


@app.get(
    "/openapi.json",
    include_in_schema=False
)
def custom_openapi(
    username: str = Depends(verify_docs_access)
):
    """
    Devuelve el esquema OpenAPI solo si la documentación está habilitada
    y el usuario está autenticado.

    Args:
        username: Usuario autenticado.

    Returns:
        JSON con el esquema OpenAPI.
    """
    ensure_docs_enabled()

    log_info(
        "OpenAPI JSON consultado.",
        username="[redacted]"
    )

    if app.openapi_schema:
        return JSONResponse(
            app.openapi_schema
        )

    openapi_schema = get_openapi(
        title=settings.app_name,
        version="0.1.0",
        description=(
            "Documentación OpenAPI del backend del portafolio full stack."
        ),
        routes=app.routes,
        tags=tags_metadata
    )

    app.openapi_schema = openapi_schema

    return JSONResponse(
        openapi_schema
    )


# -----------------------------------------------------------------------------
#                              ROUTERS
# -----------------------------------------------------------------------------

app.include_router(public_router)
app.include_router(admin_auth_router)
app.include_router(admin_router)


# -----------------------------------------------------------------------------
#                              ROOT
# -----------------------------------------------------------------------------

@app.get(
    "/",
    tags=["Root"],
    summary="Verificar estado general del backend",
    description=(
        "Retorna información básica para confirmar que la API principal "
        "está activa y respondiendo correctamente."
    )
)
def root() -> dict:
    """
    Endpoint raíz del backend.

    Returns:
        Información básica de estado.
    """
    log_info("Endpoint raíz consultado.")

    return {
        "status": "ok",
        "app": settings.app_name,
        "environment": settings.app_env,
        "message": "Portfolio Backend API is running"
    }


@app.get(
    "/health",
    tags=["Root"],
    summary="Health check minimo",
)
def health() -> dict:
    """
    Endpoint publico minimo para health checks de plataforma.

    Returns:
        Estado basico sin exponer configuracion ni datos internos.
    """
    return {"status": "ok"}


@app.get(
    "/ready",
    tags=["Root"],
    summary="Readiness check de SQLite",
)
def ready() -> JSONResponse:
    """
    Comprueba disponibilidad de SQLite sin leer contenido profesional.

    Returns:
        200 si la conexion responde, 503 si no esta disponible.
    """
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
    except Exception as error:
        log_error("Readiness check fallo.", error_type=type(error).__name__)
        return JSONResponse({"status": "unavailable"}, status_code=503)

    return JSONResponse({"status": "ready"})


@app.get(
    "/api/routes",
    tags=["Root"],
    summary="Listar rutas registradas",
    description=(
        "Retorna el listado de rutas registradas actualmente en FastAPI. "
        "Este endpoint es útil durante desarrollo para verificar el mapeo "
        "de rutas disponibles."
    )
)
def list_routes() -> list[dict]:
    """
    Lista las rutas registradas en la aplicación.

    Returns:
        Lista de rutas con path, name y methods.
    """
    routes = []

    for route in app.routes:
        methods = getattr(route, "methods", None)

        if methods:
            routes.append(
                {
                    "path": route.path,
                    "name": route.name,
                    "methods": sorted(methods),
                    "include_in_schema": getattr(route, "include_in_schema", None),
                }
            )

    log_info(
        "Listado de rutas consultado.",
        total_routes=len(routes)
    )

    return routes

# -----------------------------------------------------------------------------
#                              EJECUCIÓN DIRECTA
# -----------------------------------------------------------------------------

if __name__ == "__main__":
    """
    Permite ejecutar la aplicación directamente con:

        python -m app.main

    Nota:
        Para desarrollo se recomienda usar reload=True.
    """
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host="127.0.0.1",
        port=8000,
        reload=True
    )
