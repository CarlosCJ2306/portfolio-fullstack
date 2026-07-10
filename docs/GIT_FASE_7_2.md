# Git Fase 7.2

## Objetivo

Retirar artefactos recreables del seguimiento de Git, principalmente `backend/venv`, sin eliminar la copia local ni modificar codigo funcional, datos, SQLite, dependencias o configuracion productiva.

## Estado inicial

| Item | Resultado |
|---|---|
| Rama | `main` |
| HEAD inicial | `b4af613` |
| Fase 7.1 en cadena actual | Confirmada en `ca1db79` |
| Arbol inicial | Limpio |
| Archivos rastreados totales | 1616 |
| Archivos rastreados en `backend/venv` | 1475 |
| Tamano local aproximado de `backend/venv` | 64.56 MiB |
| Archivos locales en `backend/venv` | 3766 |
| `backend/venv/Scripts/python.exe` | Existe |
| `backend/requirements.txt` | Existe y esta rastreado |
| `frontend/package.json` | Existe y esta rastreado |
| `.gitignore` | Existe |
| `git count-objects -vH` | `count=4166`, `size=43.02 MiB`, sin packs |

Retirar `backend/venv` del indice reduce el snapshot actual, pero no reduce inmediatamente los blobs presentes en commits anteriores. No se reescribio el historial.

## Auditoria de artefactos rastreados

| Patron | Cantidad rastreada antes | Clasificacion | Accion |
|---|---:|---|---|
| `backend/venv` | 1475 | retirar del indice | retirado con `git rm -r --cached -- backend/venv` |
| `*.pem` | 1 | retirar del indice | cubierto por el retiro de `backend/venv` |
| `frontend/node_modules` | 0 | correctamente ignorado | sin accion |
| `frontend/dist` | 0 | correctamente ignorado | sin accion |
| `backend/portfolio.db` | 0 | correctamente ignorado | sin accion |
| `backend/backups` | 0 | correctamente ignorado | sin accion |
| `.env` | 0 | correctamente ignorado | sin accion |
| `logs` / `*.log` | 0 | correctamente ignorado | sin accion |
| `__pycache__` / `*.pyc` | 0 | correctamente ignorado | sin accion |
| `.pytest_cache` / `.mypy_cache` / `.ruff_cache` | 0 | correctamente ignorado | sin accion |

Despues del retiro no quedan coincidencias rastreadas para los patrones sensibles o recreables revisados.

## Archivos grandes rastreados

Antes del retiro, el unico archivo rastreado mayor a 1 MiB detectado fue:

| Ruta | Tamano | Tipo | Accion |
|---|---:|---|---|
| `backend/venv/Lib/site-packages/pydantic_core/_pydantic_core.cp312-win_amd64.pyd` | 5.01 MiB | dependencia binaria recreable | retirado con `backend/venv` |

Despues del retiro no quedan archivos rastreados mayores o iguales a 1 MiB.

## `.gitignore`

Se reforzo `.gitignore` de forma minima para cubrir reglas faltantes:

- `backend/backups/`;
- `*.sqlite-journal`;
- `*.sqlite-wal`;
- `*.sqlite-shm`;
- `*.py[cod]`;
- `.pytest_cache/`;
- `.mypy_cache/`;
- `.ruff_cache/`.

Ya existian reglas para `.env`, `backend/venv/`, `backend/portfolio.db`, logs, `frontend/node_modules/` y `frontend/dist/`.

## Retiro del indice

Comando usado:

```powershell
git rm -r --cached -- backend/venv
```

Resultado:

| Item | Resultado |
|---|---:|
| Archivos retirados del indice | 1475 |
| Archivos locales retirados fisicamente | 0 |
| `backend/venv` en disco | Conservado |
| `backend/venv/Scripts/python.exe` | Conservado |
| `git ls-files backend/venv` | 0 |
| Reduccion estimada del snapshot actual | 29.41 MiB |

`git check-ignore -v backend/venv/pyvenv.cfg` confirma la regla `backend/venv/`.

## Auditoria de archivos sensibles

No estan rastreados:

- `backend/.env`;
- `frontend/.env`;
- `backend/portfolio.db`;
- backups `.db`;
- logs;
- `frontend/dist`;
- `frontend/node_modules`;
- claves privadas o certificados privados fuera del entorno virtual.

No se abrio contenido sensible.

## Verificaciones

| Comando | Resultado |
|---|---|
| `backend/venv/Scripts/python.exe --version` | Python 3.12.0 |
| `python -m pytest -q` | 39 pruebas aprobadas, 1 warning externo de Starlette/httpx |
| `python -m app.scripts.check_db` | `foreign_keys=1`, `integrity_check=ok`, 0 violaciones |
| `npm run lint` | Aprobado |
| `npm run build` | Aprobado |

## SQLite

Estado inicial registrado:

- Tamano: `11026432` bytes.
- `LastWriteTimeUtc`: `2026-07-10T06:11:02.8025327Z`.
- SHA-256: `43CD430783BE1BCD6305C0D96AE5D33DE2006CD5B05819AE13ED6AC8BB8B6470`.

No se modifico `portfolio.db` y no se creo backup porque no hubo cambios de datos.

## Limitaciones

- Los blobs historicos de `backend/venv` siguen existiendo en commits anteriores.
- No se ejecuto reescritura de historial.
- No se hizo `git clean`, `git reset`, `git rebase`, `git gc` agresivo ni `git prune`.

## Riesgos pendientes

- El repositorio remoto seguira reflejando historial previo hasta que el propietario decida si quiere una limpieza historica en un lote aparte.
- Fase 7.3 debe definir CORS productivo, secretos y variables para Azure sin inventar recursos.

## Siguiente lote

Fase 7.3: configuracion productiva, CORS, secretos y variables.
