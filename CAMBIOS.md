# Cambios realizados

## 2026-07-05 - Tarea 1.5: limites de tamano y validacion de archivos en `MediaAsset`

Se agregaron validaciones preventivas para uploads administrativos de `MediaAsset` tanto en frontend como en backend. El admin ahora rechaza archivos sobredimensionados o con tipo no permitido antes de usar `FileReader`, y el backend valida nuevamente MIME, extension, Base64 y SVG antes de persistir.

Limites aplicados:

- `avatar`: maximo 2 MB.
- `image`: maximo 5 MB.
- `icon` y `icon_svg`: maximo 5 MB para conservar compatibilidad con iconos historicos basados en imagen.
- `document`: maximo 10 MB.

Validaciones agregadas:

- MIME permitido por `asset_type`.
- Extension permitida cuando el MIME viene vacio o dudoso.
- Base64 valido y tamano real aproximado antes del commit.
- `svg_content` no vacio y con contenido SVG reconocible.
- Rechazo temprano en seleccion manual y drag and drop del admin.

Archivos tocados:

- `backend/app/schemas/admin_schema.py`
- `frontend/src/components/admin/AdminImagePicker.jsx`
- `frontend/src/components/admin/AdminProjectGalleryPicker.jsx`
- `CAMBIOS.md`

## 2026-07-05 - Tarea 1.4: validacion de tipos de `MediaAsset` en asociaciones admin

Se formalizaron los tipos esperados de `MediaAsset` en backend y se validan antes de asociarlos desde el panel admin. El servicio ahora comprueba existencia y tipo para `avatar_asset_id`, `icon_asset_id`, `image_asset_id`, `gallery_image_ids` y `certificate_file_id`, con mensajes claros cuando el ID no existe o el tipo no corresponde. Tambien se mantuvo compatibilidad con iconos historicos `icon` e `icon_svg`.

Reglas aplicadas:

- `avatar` para avatar de perfil.
- `image` para portada y galeria de proyectos.
- `icon` o `icon_svg` para iconos de skills.
- `document` con `mime_type=application/pdf` para certificados PDF.

Compatibilidad conservada:

- Los iconos historicos `asset_type=icon` siguen siendo validos y ahora vuelven a aparecer en el picker admin junto con `icon_svg`.
- No se migraron datos ni se borraron assets existentes.
- La galeria de proyectos sigue usando solo `image`.

Archivos tocados:

- `backend/app/schemas/admin_schema.py`
- `backend/app/services/admin_service.py`
- `frontend/src/components/admin/AdminImagePicker.jsx`
- `CAMBIOS.md`

## 2026-07-05 - Tarea 1.3: proteccion de borrado de `MediaAsset`

Se protegio el endpoint administrativo de borrado de assets para impedir que un `MediaAsset` se elimine cuando sigue referenciado por avatar de perfil, iconos de skills, portada de proyecto, galeria de proyectos o archivo PDF de certificacion. El backend ahora revisa esas relaciones antes del `delete` y responde con `409 Conflict` y un detalle claro cuando el asset sigue en uso.

Archivos tocados:

- `backend/app/repositories/admin_repository.py`
- `backend/app/services/admin_service.py`
- `CAMBIOS.md`

Comportamiento conservado:

- Retirar una imagen de la galeria sigue eliminando solo la asociacion en `project_images`, no el `MediaAsset` global.
- Un asset sin referencias activas se sigue pudiendo eliminar por el flujo administrativo actual.

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
