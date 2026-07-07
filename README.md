# Portfolio Full Stack

Portafolio personal construido con FastAPI en el backend y React + Vite en el frontend. Expone una API publica para mostrar perfil, skills, proyectos, experiencia, educacion y certificaciones, ademas de un panel administrativo protegido para editar el contenido.

## Stack real

- Backend: FastAPI + SQLAlchemy + SQLite local.
- Frontend: React + Vite.
- Estilos: CSS por pagina y por componente.
- Multimedia: assets en base64, SVG seguro y PDFs asociados a certificaciones.
- Administracion: HTTP Basic en memoria durante la sesion activa del navegador.

## Estructura principal

- `backend/app/`: backend funcional.
- `backend/app/scripts/`: scripts de verificacion y migracion seguros.
- `backend/docs/API_FRONTEND.md`: contrato actual entre backend y frontend.
- `frontend/src/`: frontend funcional.
- `frontend/public/`: logos, favicon y assets publicos.
- `CAMBIOS.md`: historial resumido de cambios.
- `PLAN_*.md`: planes y cierres documentales del proyecto.

## Requisitos

- Python 3.11 o superior.
- Node.js 20 o superior.
- Dependencias del backend instaladas con `pip`.
- Dependencias del frontend instaladas con `npm`.

## Configuracion local

### Backend

1. Copia `backend/.env.example` a `backend/.env`.
2. Ajusta las variables necesarias para tu entorno.
3. No subas `backend/.env`, `backend/portfolio.db`, backups `.db` ni logs al repositorio publico.

### Frontend

1. Copia `frontend/.env.example` a `frontend/.env`.
2. Mantiene `VITE_API_BASE_URL=http://127.0.0.1:8000` para desarrollo local.
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

## Verificacion segura

```powershell
cd backend
venv\Scripts\python.exe -m app.scripts.check_db
```

## Notas de seguridad

- Las credenciales administrativas se mantienen solo en memoria durante la sesion activa.
- No expongas `.env`, `portfolio.db`, copias de respaldo ni logs en Git.
- `reset_db.py` no forma parte del flujo normal de trabajo ni de despliegue.
- SVG no confiable no debe insertarse como HTML crudo.

## Contrato resumido

- La portada usa `GET /api/public/home` y complementa con `GET /api/public/projects`.
- `GET /api/public/projects` devuelve la lista completa de proyectos activos con `image` como portada y `gallery_images` ordenadas como imagenes adicionales.
- Las certificaciones pueden incluir `credential_url` y `certificate_file` al mismo tiempo.
- El panel admin trabaja con `avatar_asset_id`, `image_asset_id`, `gallery_image_ids`, `icon_asset_id` y `certificate_file_id`.
- `MediaAsset` valida tipo, tamaño, MIME, base64 y SVG seguro antes de persistir.

