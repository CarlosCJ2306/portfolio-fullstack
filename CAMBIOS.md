# Cambios realizados

## 2026-07-05 - Tarea 1.2: integridad y foreign keys de SQLite

Se activo `PRAGMA foreign_keys=ON` mediante un evento `connect` del engine de SQLAlchemy para que se aplique a cada conexion SQLite del backend. El script seguro de chequeo ahora reporta `PRAGMA foreign_keys`, `PRAGMA integrity_check` y `PRAGMA foreign_key_check`, y detiene la verificacion con un error claro si encuentra inconsistencias, sin intentar corregir datos.

Archivos tocados:

- `backend/app/database/connection.py`
- `backend/app/scripts/check_db.py`
- `CAMBIOS.md`

Verificacion previa:

- Se confirmo la existencia de `backend/portfolio_backup_antes_galeria_real.db` antes de ejecutar pruebas contra la base real.
- No se ejecuto `reset_db.py` ni ningun script destructivo.

## 2026-07-05 - Tarea 1.1: conservacion de `avatar_asset_id` en perfil admin

Se corrigio el contrato minimo del perfil administrativo para evitar que el avatar desaparezca al editar y guardar solo texto. El backend ahora expone `avatar_asset_id` en el perfil admin y el frontend conserva ese valor, con `avatar.id` como respaldo si el campo no viene en la respuesta.

Archivos tocados:

- `backend/app/schemas/admin_schema.py`
- `backend/app/routers/admin_router.py`
- `frontend/src/pages/AdminPage.jsx`

Riesgo pendiente:

- Si el backend devolviera `avatar` y `avatar_asset_id` desincronizados, React seguira priorizando `avatar_asset_id` y usando `avatar.id` solo como fallback.

## Cambios recientes

- Se implemento el visor PDF modal simple para certificaciones publicas.
- Se implemento la galeria de imagenes por proyecto en backend, admin y vista publica.
- Se habilito la subida multiple de imagenes en la galeria administrativa de proyectos.
- Se ajusto el carrusel publico de proyectos para mostrar la imagen completa dentro de un contenedor fijo.
- Se corrigieron el favicon con `LogoCJ.ico` y el logo visible del header con la ruta publica correcta.
- Se dejo documentado el estado real del proyecto en los planes y auditorias recientes.

## Historial detallado

El historial extenso de cambios, limpieza y fases previas quedo archivado en [docs/HISTORIAL_CAMBIOS_DETALLADO.md](docs/HISTORIAL_CAMBIOS_DETALLADO.md).
