# QA Fase 6

## Fase 6.1 - Línea base técnica y Git

Fecha de ejecución: 2026-07-06.

| Comando o revisión | Resultado esperado | Resultado obtenido | Estado | Observaciones |
|---|---|---|---|---|
| `python -m app.scripts.check_db` con Python global | Ejecutar el chequeo seguro de SQLite | Falló antes de conectarse: `ModuleNotFoundError: No module named 'sqlalchemy'` | Advertencia | El Python global no contiene las dependencias del backend. No fue un fallo de la base de datos. |
| `.\venv\Scripts\python.exe -m app.scripts.check_db` desde `backend` | `foreign_keys = 1`, `integrity_check = ok` y sin violaciones | `foreign_keys = 1`, `integrity_check = ok`, `foreign_key_check = []`, conexión correcta | Aprobado | Código de salida 0. El script solo realizó comprobaciones de conexión e integridad. |
| `npm run lint` desde `frontend` | ESLint sin errores | Finalizó sin errores | Aprobado | Código de salida 0. |
| `npm run build` desde `frontend` | Build de producción correcto | Vite transformó 68 módulos y generó `dist` correctamente | Aprobado | Código de salida 0. `frontend/dist/` está ignorado por Git. |
| `git status` antes de documentar este lote | Estado del árbol identificado | Árbol limpio; rama `main` adelantada 5 commits respecto de `origin/main` | Aprobado con observación | Los cinco commits locales aún no están publicados. |
| `git diff --stat` y `git diff --name-only` antes de documentar | Identificar cambios sin commit | Sin diferencias | Aprobado | La documentación de este lote se agregó después de establecer esta línea base. |
| Revisión de archivos sensibles | `.env`, bases, backups y logs fuera del índice | `backend/.env`, `backend/portfolio.db`, su backup y `backend/logs/` están ignorados y no rastreados | Aprobado | Se revisó únicamente presencia, ruta y estado Git; no se abrió contenido sensible. |
| Revisión de artefactos recreables | `node_modules`, `dist`, cachés y entornos virtuales fuera del índice | `frontend/node_modules/` y `frontend/dist/` están ignorados; `backend/venv/` contiene 1.475 archivos rastreados | Riesgo pendiente | No se retiró `backend/venv/` del índice, conforme al alcance. Debe resolverse antes de publicar el repositorio. |
| Revisión de scripts peligrosos | No ejecutar scripts destructivos o de migración | No se ejecutaron `reset_db.py`, `update_db.py`, `seed_db.py` ni migraciones | Aprobado | No hubo CRUD ni acciones de escritura intencional sobre SQLite. |

## Archivos sensibles y recreables

- Ignorados y no rastreados: `backend/.env`, `backend/portfolio.db`, `backend/portfolio_backup_antes_galeria_real.db`, `backend/logs/`, `frontend/node_modules/` y `frontend/dist/`.
- Rastreado y recreable: `backend/venv/` (1.475 archivos). Es el principal riesgo pendiente de higiene del repositorio.
- No se detectaron otros archivos rastreados coincidentes con los patrones revisados para `.env`, `.db`, `.bak`, `.log`, `node_modules`, `dist` o `__pycache__`.

## Riesgos pendientes

1. Retirar `backend/venv/` del índice de Git en una tarea autorizada posterior, conservando el entorno local y verificando `requirements.txt`.
2. Revisar los cinco commits locales antes de publicar o desplegar.
3. Ejecutar en la Fase 6.2 las pruebas técnicas y smoke tests definidos, sin usar la base real para operaciones destructivas.
4. Completar posteriormente la matriz manual responsive y de accesibilidad.

## Límites de esta ejecución

- No se modificó deliberadamente `portfolio.db` ni ningún backup.
- No se ejecutaron scripts destructivos, semillas ni migraciones.
- No se creó ni modificó lógica funcional del backend o frontend.
- No se realizaron CRUD, smoke tests ni pruebas automatizadas en este lote.
