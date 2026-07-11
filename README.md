# Portfolio Full Stack

Portafolio personal construido con FastAPI en el backend y React + Vite en el frontend. Expone una API pública para mostrar perfil, skills, proyectos, experiencia, educación y certificaciones, además de un panel administrativo protegido para editar el contenido.

## Estado del proyecto

- Fases 1-6 cerradas.
- C0, C1, C2, C3 y C4 cerrados.
- Fase 7.1 cerrada técnicamente.
- Fase 7.2 cerrada técnicamente.
- Fase 7.3 cerrada técnicamente.
- Fase 7.4 cerrada técnicamente.
- Fase 7.5 cerrada técnicamente.
- Fase 7.6 es el siguiente lote.
- SQLite es el motor vigente.
- PostgreSQL está fuera del alcance activo.
- El despliegue continúa condicionado.
- Estado operativo: **Conditional Go** para preparación, no para despliegue inmediato.

## Stack real

- Backend: FastAPI + SQLAlchemy + SQLite local.
- Frontend: React + Vite.
- Estilos: CSS por página y por componente.
- Multimedia: metadata ligera en JSON y contenido bajo demanda con `content_url`; SVG seguro y PDFs asociados a certificaciones.
- Administración: HTTP Basic en memoria durante la sesión activa del navegador.
- Confidencialidad de proyectos: campos C1 vigentes para alias público, nota, badge y permiso de imágenes públicas.
- Contenido profesional: sincronizado en C3 con perfil, Fofimatic, Kodland, proyectos confidenciales, skills y educación vigente.

## Estructura principal

- `backend/app/`: backend funcional.
- `backend/app/scripts/`: scripts de verificación y migraciones SQLite históricas/controladas.
- `backend/docs/API_FRONTEND.md`: contrato actual entre backend y frontend.
- `frontend/src/`: frontend funcional.
- `frontend/public/`: logos, favicon y assets públicos.
- `docs/`: documentación vigente e histórica.
- `docs/archive/`: documentos históricos; no son planes vigentes.
- `CAMBIOS.md`: changelog resumido y estado actual.
- `PLAN_TRABAJO_PORTFOLIO.md`: único plan operativo vigente.

## Documentación vigente

- [PLAN_TRABAJO_PORTFOLIO.md](PLAN_TRABAJO_PORTFOLIO.md)
- [CAMBIOS.md](CAMBIOS.md)
- [docs/PLAN_ACTUALIZACION_CONTENIDO_PROFESIONAL.md](docs/PLAN_ACTUALIZACION_CONTENIDO_PROFESIONAL.md)
- [docs/CONTENIDO_PROFESIONAL_PORTAFOLIO.md](docs/CONTENIDO_PROFESIONAL_PORTAFOLIO.md)
- [docs/QA_CONTENIDO_PROFESIONAL.md](docs/QA_CONTENIDO_PROFESIONAL.md)
- [docs/PAYLOAD_FASE_7_1.md](docs/PAYLOAD_FASE_7_1.md)
- [docs/GIT_FASE_7_2.md](docs/GIT_FASE_7_2.md)
- [docs/CONFIG_FASE_7_3.md](docs/CONFIG_FASE_7_3.md)
- [docs/AZURE_STATIC_WEB_APPS_FASE_7_4.md](docs/AZURE_STATIC_WEB_APPS_FASE_7_4.md)
- [docs/AZURE_APP_SERVICE_FASE_7_5.md](docs/AZURE_APP_SERVICE_FASE_7_5.md)
- [docs/QA_FASE_6.md](docs/QA_FASE_6.md)
- [docs/REVISION_ARCHIVOS_DUDOSOS.md](docs/REVISION_ARCHIVOS_DUDOSOS.md)
- [docs/INVENTARIO_CONTENIDO_PORTFOLIO.md](docs/INVENTARIO_CONTENIDO_PORTFOLIO.md)
- [backend/docs/API_FRONTEND.md](backend/docs/API_FRONTEND.md)

`docs/archive/` conserva auditorías y planes históricos para trazabilidad. No debe usarse como fuente del plan vigente.

## Requisitos

- Python 3.11 o superior.
- Node.js 20 o superior.
- Dependencias del backend instaladas con `pip`.
- Dependencias del frontend instaladas con `npm`.

## Configuración local

### Backend

1. Copia `backend/.env.example` a `backend/.env`.
2. Ajusta las variables necesarias para tu entorno.
3. No subas `backend/.env`, `backend/portfolio.db`, backups `.db` ni logs al repositorio público.
4. `backend/venv` no se versiona; se recrea localmente con `python -m venv venv` e instalando `backend/requirements.txt`.

Variables principales del backend:

- `APP_ENV`: `development`, `test`, `staging` o `production`.
- `ADMIN_USERNAME` / `ADMIN_PASSWORD`: secretos runtime del backend.
- `CORS_ALLOWED_ORIGINS`: lista explicita de origenes permitidos.
- `TRUSTED_HOSTS`: hosts aceptados por FastAPI.
- `SQLITE_DATABASE_PATH`: ruta del archivo SQLite.
- `SQLITE_REQUIRE_EXISTING`: obliga a que la DB exista antes de iniciar.
- `SQLITE_BUSY_TIMEOUT_MS`: timeout de bloqueo SQLite.
- `LOG_LEVEL`: nivel de logs.
- `ENABLE_API_DOCS`: controla `/docs`, `/redoc` y `/openapi.json`.

### Frontend

1. Copia `frontend/.env.example` a `frontend/.env`.
2. Mantén `VITE_API_BASE_URL=http://127.0.0.1:8000` para desarrollo local.
3. Recuerda que toda variable `VITE_*` es publica en el bundle; no incluyas secretos.
4. No subas `frontend/.env`, `frontend/dist/` ni `frontend/node_modules/`.

Validacion productiva previa al build futuro:

```powershell
cd frontend
npm run validate:production-env
```

Build preparado para Azure Static Web Apps:

```powershell
cd frontend
$env:VITE_API_BASE_URL="https://api.example.invalid"
npm run build:azure
Remove-Item Env:VITE_API_BASE_URL
```

`npm run build:azure` valida `VITE_API_BASE_URL`, valida `frontend/public/staticwebapp.config.json`, ejecuta Vite y confirma que `staticwebapp.config.json` llegue a `frontend/dist/`.

El valor productivo real de `VITE_API_BASE_URL` se inyectará como variable pública de build cuando exista el backend en Azure App Service. No debe incluir secretos.

La plantilla de GitHub Actions para Azure Static Web Apps vive en `docs/deployment/azure-static-web-apps.workflow.yml.example`. Es intencionalmente inactiva y no despliega hasta moverla/configurarla en una fase posterior.

## Comandos del frontend

```powershell
cd frontend
npm install
npm run lint
npm run build
npm run validate:azure-static-config
npm run dev
```

## Health checks

```http
GET /health
GET /ready
```

`/health` no consulta datos y sera el endpoint recomendado para Azure App Service. `/ready` comprueba la conexion SQLite con una consulta segura `SELECT 1`.

## Comandos del backend

```powershell
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

## Preparación Azure App Service

El backend se desplegará posteriormente usando `backend/` como raíz del paquete. `backend/requirements.txt` debe quedar en la raíz desplegada para Oryx, y `backend/startup.sh` define el arranque Linux con un solo worker:

```bash
python -m uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8000}" --workers 1 --no-use-colors
```

Validación del paquete App Service:

```powershell
cd backend
venv\Scripts\python.exe -m app.scripts.validate_azure_app_service
```

La base SQLite no viaja con el código. En Azure se transferirá separadamente y debe vivir en almacenamiento persistente, con ruta configurable mediante:

```env
SQLITE_DATABASE_PATH=/home/data/portfolio.db
SQLITE_REQUIRE_EXISTING=true
```

La plantilla inactiva de workflow vive en `docs/deployment/azure-app-service.workflow.yml.example`; no despliega hasta moverla y configurarla con recursos reales.

## Verificación segura

```powershell
cd backend
venv\Scripts\python.exe -m app.scripts.check_db
```

## Notas de seguridad

- Las credenciales administrativas se mantienen solo en memoria durante la sesión activa.
- No expongas `.env`, `portfolio.db`, copias de respaldo ni logs en Git.
- `reset_db.py`, `update_db.py` y `seed_db.py` no forman parte del flujo normal ni de despliegue.
- SVG no confiable no debe insertarse como HTML crudo.
- SQLite en producción debe usar almacenamiento persistente; no usar filesystem efímero como solución productiva.

## Contrato resumido

- La portada usa `GET /api/public/home` y complementa con `GET /api/public/projects`.
- `GET /api/public/projects` devuelve proyectos activos con `image` como portada y `gallery_images` ordenadas como imágenes adicionales cuando `allow_public_images=true`.
- Si `allow_public_images=false`, la API pública devuelve `image=null` y `gallery_images=[]`, sin borrar relaciones ni assets.
- Los proyectos pueden exponer `is_confidential`, `client_display_name` y `confidentiality_note`.
- Las certificaciones pueden incluir `issue_date`, `expiration_date`, `credential_url` y `certificate_file`.
- El panel admin trabaja con `avatar_asset_id`, `image_asset_id`, `gallery_image_ids`, `icon_asset_id` y `certificate_file_id`.
- `MediaAsset` valida tipo, tamaño, MIME, base64 y SVG seguro antes de persistir.
