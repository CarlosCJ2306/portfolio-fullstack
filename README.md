# Portfolio Full Stack

Portafolio personal construido con FastAPI en el backend y React + Vite en el frontend. El proyecto expone una API pública para mostrar perfil, skills, proyectos, experiencia, educación y certificaciones, además de un panel administrativo de uso personal para editar el contenido.

## Tecnologías

- Backend: FastAPI, SQLAlchemy, SQLite.
- Frontend: React, Vite.
- Estilos: CSS modular por componente y por página.
- Multimedia: assets en base64, SVG y archivos PDF asociados a certificaciones.

## Estructura principal

- `backend/app/`: código funcional del backend.
- `backend/app/scripts/`: scripts de verificación, migración y soporte.
- `backend/docs/API_FRONTEND.md`: contrato de API para el frontend.
- `frontend/src/`: código funcional del frontend.
- `frontend/public/`: assets públicos usados por la interfaz.
- `CAMBIOS.md`: historial de cambios relevantes.
- `PLAN_*.md`: documentos de proceso y planes históricos o de estabilización.

## Requisitos

- Python 3.11 o superior.
- Node.js 20 o superior.
- Dependencias del backend instaladas con `pip`.
- Dependencias del frontend instaladas con `npm`.

## Configuración

### Backend

1. Copia `backend/.env.example` a `backend/.env`.
2. Ajusta las variables necesarias para tu entorno local.
3. La base real `backend/portfolio.db` no debe subirse a GitHub.

### Frontend

1. Copia `frontend/.env.example` a `frontend/.env`.
2. Mantén `VITE_API_BASE_URL=http://127.0.0.1:8000` o ajústalo según tu backend local.
3. `frontend/.env` tampoco debe subirse al repositorio público.

## Cómo ejecutar el backend

```powershell
cd backend
.\venv\Scripts\python.exe -m uvicorn app.main:app --reload
```

## Cómo ejecutar el frontend

```powershell
cd frontend
npm install
npm run dev
```

## Verificación útil

```powershell
cd frontend
npm run lint
npm run build

cd ..\backend
.\venv\Scripts\python.exe -m app.scripts.check_db
```

## Notas importantes

- El panel administrativo es de uso personal.
- Las credenciales administrativas y la base de datos real deben mantenerse locales.
- No se deben subir `backend/.env`, `frontend/.env`, `backend/portfolio.db` ni backups `.db` al GitHub público.
- Los archivos generados como `frontend/dist/`, `frontend/node_modules/` y `backend/logs/` se ignoran mediante `.gitignore`.
