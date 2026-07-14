# Portfolio Full Stack

Portafolio personal construido con FastAPI en el backend y React + Vite en el frontend. El frontend y el backend se despliegan por separado y SQLite sigue siendo el motor vigente.

## Estado del proyecto

- Plan activo: `PLAN_TRABAJO_PORTFOLIO.md` (PLAN-002).
- Changelog activo: `CAMBIOS.md`.
- Históricos cerrados en `docs/planes_historicos/`.
- Auditorías y referencias antiguas no vigentes en `docs/archive/`.
- Estado técnico estable con documentación separada para contrato, contenido, QA y despliegue.

## Stack real

- Backend: FastAPI + SQLAlchemy + SQLite.
- Frontend: React + Vite.
- Estilos: CSS por componente y por página.
- Multimedia: metadata ligera, `content_url` y contenido bajo demanda.
- Autenticación administrativa: HTTP Basic en memoria durante la sesión del navegador.

## Organización documental

- `PLAN_TRABAJO_PORTFOLIO.md`: único plan activo.
- `CAMBIOS.md`: único changelog activo.
- `docs/planes_historicos/`: planes y anexos cerrados.
- `docs/archive/`: auditorías y material histórico no operativo.
- `backend/docs/API_FRONTEND.md`: contrato técnico backend/frontend.
- `docs/CONTENIDO_PROFESIONAL_PORTAFOLIO.md`: contenido profesional vigente.
- `docs/INVENTARIO_CONTENIDO_PORTFOLIO.md`: inventario seguro del contenido vigente.
- `docs/QA_FASE_6.md` y `docs/QA_CONTENIDO_PROFESIONAL.md`: evidencia histórica de QA.
- `docs/PAYLOAD_FASE_7_1.md`, `docs/GIT_FASE_7_2.md`, `docs/CONFIG_FASE_7_3.md`, `docs/AZURE_STATIC_WEB_APPS_FASE_7_4.md`, `docs/AZURE_APP_SERVICE_FASE_7_5.md` y `docs/REVISION_ARCHIVOS_DUDOSOS.md`: referencias técnicas permanentes.

## Principios de arquitectura

- Componentes pequeños y reutilizables.
- Una responsabilidad principal por componente.
- Routers delgados y lógica reutilizable solo cuando aporta valor real.
- Evitar abstracciones prematuras.
- Mantener accesibilidad, responsive y `prefers-reduced-motion` desde el inicio.

## Configuración local

Backend:

```powershell
cd backend
.\venv\Scripts\python.exe -m app.scripts.check_db
```

Frontend:

```powershell
cd frontend
npm install
npm run lint
npm run build
```

## Referencias históricas

- [PLAN-001 histórico](docs/planes_historicos/PLAN-001-2026-07-12-consolidacion-y-despliegue-azure.md)
- [CAMBIOS PLAN-001 histórico](docs/planes_historicos/CAMBIOS-PLAN-001-2026-07-12.md)
- [Anexo editorial histórico](docs/planes_historicos/ANEXO-PLAN-001-2026-07-12-actualizacion-contenido-profesional.md)

`docs/archive/` conserva material histórico retirado del flujo operativo. No contiene planes vigentes.
