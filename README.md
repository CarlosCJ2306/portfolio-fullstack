# Portfolio Full Stack

Portafolio personal construido con FastAPI en el backend y React + Vite en el frontend. Expone una API pública para mostrar perfil, skills, proyectos, experiencia, educación y certificaciones, además de un panel administrativo protegido para editar el contenido.

## Estado del proyecto

- Fases 1-6 cerradas.
- C0, C1, C2, C3 y C4 cerrados.
- Fase 7.1 cerrada técnicamente.
- Fase 7.2 cerrada técnicamente.
- Fase 7.3 es el siguiente lote.
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

### Frontend

1. Copia `frontend/.env.example` a `frontend/.env`.
2. Mantén `VITE_API_BASE_URL=http://127.0.0.1:8000` para desarrollo local.
3. No subas `frontend/.env`, `frontend/dist/` ni `frontend/node_modules/`.

## Comandos del frontend

```powershell
cd frontend
npm install
npm run lint
npm run build
npm run dev
```

## Comandos del backend

```powershell
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

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
