# Configuración Fase 7.3

## Objetivo

Preparar el contrato de configuración para separar development, test, staging y production antes de configurar Azure.

No se crearon recursos Azure, no se desplegó, no se modificó `portfolio.db` y no se ejecutaron migraciones ni scripts de datos.

## Arquitectura futura

- Frontend: Azure Static Web Apps.
- Backend: Azure App Service para Linux/Python.
- Base de datos: SQLite en almacenamiento persistente compatible con Azure.
- Motor vigente: SQLite.
- PostgreSQL: fuera del alcance activo.

## Inventario de configuración previa

| Elemento | Implementación actual antes de 7.3 | Riesgo | Acción 7.3 |
|---|---|---|---|
| Settings backend | `app.core.config` con lectura directa de `.env` y defaults locales | Defaults inseguros si se usan en producción | Se centralizó validación por entorno y aliases compatibles |
| CORS | Lista hardcodeada en `app.main` | Orígenes dispersos y wildcard potencial al crecer | `CORS_ALLOWED_ORIGINS` explícito desde settings |
| Basic Auth admin | Variables `ADMIN_USERNAME` y `ADMIN_PASSWORD` con defaults | Credenciales placeholder en entornos remotos | Secrets obligatorios y placeholders rechazados en staging/production |
| SQLite | `DATABASE_URL=sqlite:///./portfolio.db` | Ruta relativa o DB ausente en despliegue | `SQLITE_DATABASE_PATH`, `SQLITE_REQUIRE_EXISTING`, `SQLITE_BUSY_TIMEOUT_MS` |
| Logging | Consola y archivo local rotado | Archivos locales en producción | stdout/stderr y `LOG_TO_FILE=false` por defecto en staging/production |
| OpenAPI | Rutas protegidas, controladas por variable previa | Docs activas por error en producción | `ENABLE_API_DOCS`, false por defecto en producción |
| Frontend API | `VITE_API_BASE_URL` leída en servicios | Concatenaciones dispersas | Utilidad central `apiConfig` y validación productiva |

## Variables backend

| Variable | Entorno | Secreta | Build/runtime | Obligatoria |
|---|---|---|---|---|
| `APP_ENV` | Todos | No | Runtime | Sí |
| `APP_DEBUG` | Todos | No | Runtime | No |
| `ADMIN_USERNAME` | Todos | Sí | Runtime | Sí en staging/production |
| `ADMIN_PASSWORD` | Todos | Sí | Runtime | Sí en staging/production |
| `CORS_ALLOWED_ORIGINS` | Todos | No | Runtime | Sí en staging/production |
| `TRUSTED_HOSTS` | Todos | No | Runtime | Sí en staging/production |
| `SQLITE_DATABASE_PATH` | Todos | No | Runtime | Sí en staging/production |
| `SQLITE_REQUIRE_EXISTING` | Todos | No | Runtime | Sí en staging/production |
| `SQLITE_BUSY_TIMEOUT_MS` | Todos | No | Runtime | No |
| `LOG_LEVEL` | Todos | No | Runtime | No |
| `ENABLE_API_DOCS` | Todos | No | Runtime | No |

Aliases compatibles:

- `DATABASE_URL` sigue soportado para desarrollo/test, pero el nombre canónico es `SQLITE_DATABASE_PATH`.
- `API_DOCS_ENABLED` sigue soportado, pero el nombre canónico es `ENABLE_API_DOCS`.

## Variable frontend

| Variable | Entorno | Secreta | Build/runtime | Obligatoria |
|---|---|---|---|---|
| `VITE_API_BASE_URL` | Frontend | No | Build-time | Sí |

`VITE_*` es público en el bundle. No debe contener usuario admin, password, tokens, API keys ni secretos.

## Reglas por entorno

Development:

- Permite backend local en `127.0.0.1:8000`.
- Permite Vite en `localhost:5173` y preview en `localhost:4173`.
- Permite SQLite local existente.
- OpenAPI puede estar habilitada.

Test:

- Usa SQLite temporal.
- Usa credenciales efímeras.
- No depende de `.env` real.
- Aborta si intenta usar `portfolio.db`.

Staging/production:

- Requieren credenciales admin reales.
- Rechazan placeholders conocidos.
- Requieren CORS explícito sin `*`.
- Rechazan SQLite `:memory:`, rutas relativas, `/tmp` y rutas dentro del código desplegado.
- Requieren `SQLITE_REQUIRE_EXISTING=true`.
- Fallan si el archivo SQLite requerido no existe.
- Production rechaza `APP_DEBUG=true`.

## CORS

Development permite por defecto:

- `http://localhost:5173`
- `http://127.0.0.1:5173`
- `http://localhost:4173`
- `http://127.0.0.1:4173`

Staging/production cargan exclusivamente `CORS_ALLOWED_ORIGINS`.

Reglas:

- Sin wildcard.
- Sin rutas, query ni fragments.
- `allow_credentials=true`.
- Métodos permitidos: `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `OPTIONS`.
- Headers permitidos: `Authorization`, `Content-Type`, `Accept`, `If-None-Match`.
- Headers expuestos: `ETag`, `Content-Disposition`.

## Basic Auth

HTTP Basic se mantiene durante esta fase.

- `ADMIN_USERNAME` y `ADMIN_PASSWORD` vienen de settings.
- No hay defaults productivos.
- La comparación usa `secrets.compare_digest`.
- Las respuestas 401 mantienen `WWW-Authenticate: Basic`.
- Las credenciales siguen solo en memoria en el frontend.
- No se usan query strings ni variables `VITE_*` para secretos.

## Trusted Hosts

Development/test permiten `localhost`, `127.0.0.1` y `testserver`.

Staging/production usan `TRUSTED_HOSTS` y agregan `WEBSITE_HOSTNAME` si Azure lo define.

No se inventaron dominios Azure.

## OpenAPI

- Development: habilitable con `ENABLE_API_DOCS=true`.
- Production: deshabilitada por defecto.
- `/docs`, `/redoc` y `/openapi.json` siguen protegidas con Basic Auth de documentación.

## Logging

- Salida por stdout/stderr.
- `LOG_LEVEL` valida `DEBUG`, `INFO`, `WARNING`, `ERROR`, `CRITICAL`.
- En staging/production no se escribe archivo local por defecto.
- No se registra `Authorization`, password, Base64, PDF ni bodies completos de uploads.

## Health y readiness

- `GET /health`: público, responde `{"status":"ok"}` y no consulta datos.
- `GET /ready`: ejecuta `SELECT 1` y responde 200 si SQLite está disponible o 503 si no lo está.
- El Health Check futuro de Azure App Service usará `/health`.

## SQLite persistente

SQLite permanece como motor vigente.

Para staging/production:

- Configurar una ruta absoluta mediante `SQLITE_DATABASE_PATH`.
- Usar almacenamiento persistente independiente del código, por ejemplo una ruta aprobada como `/home/data/portfolio.db`.
- No crear automáticamente una base vacía.
- No ejecutar `create_all`, seeds, migraciones ni copias al arrancar.
- No habilitar WAL ni cambiar `journal_mode`.

Restricción operativa aceptada temporalmente:

- Una sola instancia de Azure App Service.
- Un solo worker ASGI.
- Sin autoscale horizontal.
- Sin deployment slots escribiendo simultáneamente sobre la misma DB.
- Baja concurrencia de escritura.
- Backup antes de cualquier cambio remoto.
- Pruebas de bloqueo, reinicio y persistencia obligatorias en staging.

SQLite sobre almacenamiento de red conserva riesgo operativo. La decisión queda aceptada temporalmente por el propietario.

## Tareas reservadas

Fase 7.4:

- Configurar Azure Static Web Apps.
- Inyectar `VITE_API_BASE_URL` durante build.
- Integrar `npm run validate:production-env`.
- Definir fallback SPA.

Fase 7.5:

- Configurar Azure App Service Linux/Python.
- Definir ruta persistente real para SQLite.
- Configurar secretos runtime.
- Definir comando de inicio, proxy y health check remoto.

## Pruebas

- Backend `pytest -q`: 63 pruebas aprobadas.
- Se registró un warning externo de `StarletteDeprecationWarning` por `httpx`/`starlette.testclient`.
- `check_db`: `foreign_keys=1`, `integrity_check=ok`, cero violaciones.
- Frontend `npm run lint`: aprobado.
- Frontend `npm run build`: aprobado.
- `npm run validate:production-env`: falla controlada sin variable.
- `VITE_API_BASE_URL=https://api.example.invalid npm run validate:production-env`: aprobado.

## Integridad SQLite

`portfolio.db` quedó intacta:

- Tamaño: 11026432 bytes.
- LastWriteTimeUtc: 2026-07-10T06:11:02.8025327Z.
- SHA-256: 43CD430783BE1BCD6305C0D96AE5D33DE2006CD5B05819AE13ED6AC8BB8B6470.

## Riesgos pendientes

- Definir dominio real de Azure Static Web Apps.
- Definir URL real del backend.
- Definir ruta persistente final de SQLite en App Service.
- Probar persistencia, reinicio y bloqueo en staging.
- Configurar secretos reales en Azure sin registrarlos en Git.

## Siguiente lote

Fase 7.4 - configuración de Azure Static Web Apps.
