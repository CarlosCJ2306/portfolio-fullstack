# Cambios realizados

## 2026-07-05 - Tarea 1.1: conservacion de `avatar_asset_id` en perfil admin

### Alcance aplicado

Se corrigio el contrato minimo del perfil administrativo para evitar que el avatar desaparezca al editar y guardar solo texto. No se tocaron autenticacion, foreign keys, uploads, SVG, `localStorage` ni rutas publicas.

### Cambios realizados

1. `backend/app/schemas/admin_schema.py`
   - Se agrego `AdminProfileRead` como schema administrativo del perfil.
   - Este schema mantiene el contrato actual de `ProfileRead` y agrega `avatar_asset_id`.

2. `backend/app/routers/admin_router.py`
   - Los endpoints `GET /api/admin/profile` y `PUT /api/admin/profile` ahora responden con `AdminProfileRead`.
   - Motivo: el backend ya trabaja con el modelo `Profile`, que tiene `avatar_asset_id`, pero el response model anterior no lo exponia al frontend admin.

3. `frontend/src/pages/AdminPage.jsx`
   - `normalizeProfileForm()` ahora usa `profile.avatar_asset_id` y, si no viene, hace fallback a `profile.avatar.id`.
   - Motivo: mantener compatibilidad con el contrato actual y evitar que React convierta un avatar existente en `null` al guardar sin volver a seleccionarlo.

### Riesgos pendientes

- Si en algun flujo futuro el backend devuelve un `avatar` desincronizado respecto a `avatar_asset_id`, el frontend seguira priorizando `avatar_asset_id` y solo usara `avatar.id` como respaldo.
- No se modifico la logica de carga/subida de avatars en esta tarea.

## 2026-07-05 - Limpieza real y controlada del repositorio

### Alcance aplicado

Se realizó una limpieza real del repositorio para dejarlo más apto para GitHub público sin tocar el backend funcional, el frontend funcional ni la base de datos real. La limpieza se centró en documentación histórica, artefactos generados y configuración de exclusión.

### Archivos eliminados

1. Documentación histórica y de proceso:
   - `PLAN_EJECUCION_MVP.md`
   - `PLAN_GALERIA_PROYECTOS.md`
   - `PLAN_TRABAJO.md`
   - `PLAN_POST_MVP_ACTUALIZADO.md`
   - `DIAGNOSTICO_POST_MVP_PROYECTO.md`
   - `PLAN_ESTABILIZACION_POST_MVP.md`
   - `PLAN_LIMPIEZA_REPOSITORIO_PORTAFOLIO.md`
   - `frontend/README.md`

2. Artefactos generados locales:
   - `frontend/dist/index.html`
   - el árbol `frontend/dist/` quedó eliminado al vaciarse por completo

### Archivos conservados

- `README.md` principal del repositorio.
- `CAMBIOS.md` como historial útil.
- `backend/docs/API_FRONTEND.md` como contrato vigente de la API.
- `backend/app/` y `frontend/src/` como código funcional.
- `backend/app/scripts/migrate_project_gallery.py`, `check_db.py`, `inspect_db.py`, `create_db.py` y `seed_db.py` como scripts útiles o de soporte.
- `frontend/public/LogoCJ.ico` y `frontend/public/LogoCJ.png` como assets referenciados.

### Archivos ignorados

Se agregó `.gitignore` en la raíz para ignorar:

- `backend/.env`
- `frontend/.env`
- `backend/*.db`
- `backend/*.log`
- `backend/logs/`
- `frontend/dist/`
- `frontend/node_modules/`
- `__pycache__/`
- `*.pyc`
- `*.local`
- `*.bak`
- `*.tmp`
- `*.old`
- `*.swp`

### Archivos que requieren revisión manual

1. `backend/update_db.py`
   - Script histórico y potencialmente peligroso por modificar SQLite directamente.
   - Se conserva por ahora; el dueño del proyecto debe decidir si sigue siendo útil.

2. `backend/portfolio.db`
   - Base real del proyecto.
   - No se elimina ni se sube a GitHub; queda ignorada.

3. `backend/portfolio_backup_antes_galeria_real.db`
   - Backup real de la base.
   - Se conserva localmente y no debe subirse.

4. `frontend/node_modules/`
   - No se pudo vaciar por completo por bloqueo de un binario nativo en uso.
   - Queda ignorado por `.gitignore`, pero su eliminación física puede revisarse manualmente si se desea.

5. `backend/logs/portfolio_backend.log`
   - No se pudo eliminar porque el archivo estaba en uso por un proceso activo.
   - Queda ignorado por `.gitignore`, pero su borrado físico queda pendiente de revisión manual.

### Estado final

- El repositorio quedó más limpio y apto para GitHub público a nivel documental y de exclusiones.
- Aún queda revisión manual para los artefactos locales bloqueados durante la limpieza física.

### Observación

- El repositorio no debe considerarse completamente cerrado hasta decidir qué hacer con `backend/update_db.py`, con el log activo del backend y con la eliminación física de `frontend/node_modules/` si se desea vaciarlo por completo.

## 2026-07-05 - Creación del plan de limpieza del repositorio

### Alcance aplicado

Se creó el archivo `PLAN_LIMPIEZA_REPOSITORIO_PORTAFOLIO.md` como plan documental para ordenar la limpieza futura del repositorio sin borrar nada todavía. No se modificó código funcional, base de datos ni configuración operativa.

### Cambios realizados

1. `PLAN_LIMPIEZA_REPOSITORIO_PORTAFOLIO.md`
   - Se añadió un plan con criterios de limpieza, clasificación documental, archivos generados, archivos sensibles, scripts dudosos, assets públicos, backups, reglas de `.gitignore` y fases de limpieza.

### Observación

- El plan deja preparada la siguiente etapa documental antes de cualquier limpieza real del repositorio.

## 2026-07-05 - Creación del plan de estabilización post-MVP

### Alcance aplicado

Se creó el archivo `PLAN_ESTABILIZACION_POST_MVP.md` como plan operativo para la etapa de estabilización, verificación y orden documental posterior al MVP. No se modificó código funcional ni se tocó backend, frontend o base de datos.

### Cambios realizados

1. `PLAN_ESTABILIZACION_POST_MVP.md`
   - Se añadió el nuevo plan con fases de verificación pública, verificación administrativa, normalización documental, revisión de archivos candidatos a limpieza, revisión de rendimiento por base64, revisión de despliegue y criterios de cierre.

### Observación

- Este plan nace como siguiente paso lógico después del diagnóstico post-MVP y no introduce ninguna funcionalidad nueva.

## 2026-07-05 - Limpieza documental post-MVP y archivos claramente obsoletos

### Alcance aplicado

Se actualizo la documentacion para reflejar el estado real posterior al MVP y se elimino un conjunto pequeno de archivos vacios claramente sobrantes. No se toco codigo funcional, configuracion necesaria, `portfolio.db`, backups de base de datos ni recursos referenciados en `frontend/public`.

### Documentacion actualizada

1. `PLAN_POST_MVP_ACTUALIZADO.md`
   - Se creo como plan vigente posterior al MVP.
   - Resume el estado completado, los pendientes reales, las prioridades futuras, los riesgos y la verificacion recomendada.

2. `PLAN_EJECUCION_MVP.md`
   - Se corrigio la seccion de mejoras futuras para que no contradiga las funciones que ya se implementaron despues del MVP.

3. `PLAN_GALERIA_PROYECTOS.md`
   - Se conservo como documento de trazabilidad y se ajusto su lectura para que quede claro que la galeria ya esta implementada.

4. `PLAN_TRABAJO.md`
   - Se marco como documento historico previo al MVP y al post-MVP.

5. `backend/docs/API_FRONTEND.md`
   - Se actualizo para reflejar el contrato real actual: proyectos con galeria, certificaciones con `certificate_file` y variable base del frontend ya documentada.

### Archivos eliminados

1. `backend/int`
   - Motivo: archivo vacio con nombre accidental, sin referencia en el codigo ni en la documentacion.
   - Riesgo: minimo; no contenia datos.
   - Restauracion: `git restore --source=HEAD -- backend/int`

2. `backend/logging.Formatter`
   - Motivo: archivo vacio con nombre accidental, sin referencia en el codigo ni en la documentacion.
   - Riesgo: minimo; no contenia datos.
   - Restauracion: `git restore --source=HEAD -- backend/logging.Formatter`

3. `backend/logging.Logger`
   - Motivo: archivo vacio con nombre accidental, sin referencia en el codigo ni en la documentacion.
   - Riesgo: minimo; no contenia datos.
   - Restauracion: `git restore --source=HEAD -- backend/logging.Logger`

4. `backend/None`
   - Motivo: archivo vacio con nombre accidental, sin referencia en el codigo ni en la documentacion.
   - Riesgo: minimo; no contenia datos.
   - Restauracion: `git restore --source=HEAD -- backend/None`

5. `backend/str`
   - Motivo: archivo vacio con nombre accidental, sin referencia en el codigo ni en la documentacion.
   - Riesgo: minimo; no contenia datos.
   - Restauracion: `git restore --source=HEAD -- backend/str`

6. `frontend/public/favicon.svg`
   - Motivo: recurso de plantilla sin referencia activa en el proyecto; el favicon real usa `LogoCJ.ico`.
   - Riesgo: bajo; no estaba enlazado por la aplicacion.
   - Restauracion: `git restore --source=HEAD -- frontend/public/favicon.svg`

7. `frontend/public/icons.svg`
   - Motivo: recurso de plantilla sin referencia activa en el proyecto.
   - Riesgo: bajo; no estaba enlazado por la aplicacion.
   - Restauracion: `git restore --source=HEAD -- frontend/public/icons.svg`

### Archivos que requieren revision manual

- `backend/portfolio_backup_antes_galeria_real.db`.
  - Se conserva por precaucion porque es un backup de base de datos y no se debe borrar sin confirmacion explicita.
- Cualquier otro archivo de backup, generacion o artefacto que aparezca en revisiones posteriores.

### Nota de restauracion general

Si se necesita recuperar cualquiera de los archivos eliminados, puede usarse el mismo patron:

```powershell
git restore --source=HEAD -- <ruta-del-archivo>
```


## 2026-07-05 - Correccion de ruta del logo visible

### Alcance aplicado

Se corrigio unicamente la ruta del logo visible en el `Header` para que cargue correctamente desde `frontend/public`. No se tocaron backend, galeria, certificaciones, autenticacion ni el resto del layout.

### Cambios realizados

1. `frontend/src/components/layout/Header.jsx`
   - Se reemplazo la ruta incorrecta `frontend\\public\\LogoCJ.png` por la ruta publica correcta `/LogoCJ.png`.

## 2026-07-05 - Ajuste puntual de favicon

### Alcance aplicado

Se cambio unicamente el favicon de la pestana del navegador para usar `LogoCJ.ico` desde `frontend/public`. No se tocaron backend, base de datos, galeria, certificaciones, autenticacion ni logos visibles dentro de la pagina.

### Cambios realizados

1. `frontend/index.html`
   - El favicon ahora usa exactamente `<link rel="icon" type="image/x-icon" href="/LogoCJ.ico" />`.

### Observacion

- En esta revision se confirmo que `frontend/public/LogoCJ.ico` ya existe, por lo que no fue necesario copiarlo desde `frontend/dist`.

## 2026-07-05 - Cambio de logo y favicon

### Alcance aplicado

Se ajusto unicamente la referencia del favicon y de la marca visible del header para usar `/logo.png`. No se tocaron backend, base de datos, autenticacion, galeria de proyectos ni certificaciones.

### Cambios realizados

1. `frontend/index.html`
   - El favicon ahora apunta a `/logo.png`.

2. `frontend/src/components/layout/Header.jsx`
   - La marca visible del header dejo de usar el texto `CJ.` y ahora carga `/logo.png`.

3. `frontend/src/components/layout/Header.css`
   - Se agrego el estilo minimo para renderizar el logo visible en el header sin cambiar el diseño general.

### Observacion

- En el workspace actual no aparece fisicamente `frontend/public/logo.png`. La aplicacion ya quedo apuntando a ese archivo, pero para verlo cargado debes asegurarte de que exista en esa ruta.

## 2026-07-05 - Integracion y verificacion final de galeria de proyectos (Fase 5)

### Alcance aplicado

Se ejecuto unicamente la verificacion final de integracion para la galeria de proyectos, sin agregar funcionalidades nuevas. Se validaron backend, administracion, vista publica, certificaciones y autenticacion con pruebas reales y limpieza de datos temporales al finalizar.

### Verificaciones realizadas

1. Base de datos
   - `PRAGMA integrity_check` devolvio `ok`.
   - `PRAGMA foreign_key_check` no devolvio inconsistencias.
   - `project_images` existe y tenia datos validos durante la verificacion.

2. Flujo CRUD de proyectos con galeria
   - Se crearon assets temporales de imagen.
   - Se creo un proyecto temporal con portada principal en `image_asset_id` y galeria adicional en `gallery_image_ids`.
   - Se creo un proyecto temporal sin portada y sin galeria.
   - Se creo un proyecto temporal sin portada y con una imagen adicional.
   - Se actualizo el proyecto principal para reordenar la galeria y luego para retirar una imagen.
   - Se confirmo que el orden persistio y que retirar una imagen de la galeria no elimino el asset global.

3. Vista publica
   - Se confirmo por API que `project.image` sigue siendo la portada principal.
   - Se confirmo por API que `gallery_images` llega ordenado y persiste despues de editar.
   - Se confirmo por contrato que existen respuestas validas para proyecto sin portada, sin galeria, con una imagen adicional y con varias.

4. Certificaciones y autenticacion
   - `POST /api/admin/auth/login` respondio correctamente con credenciales validas.
   - El mismo login respondio `401` con credenciales invalidas.
   - Las certificaciones publicas y administrativas siguieron disponibles.
   - Se confirmo que al menos una certificacion publica mantiene `certificate_file` con `mime_type` `application/pdf`.

5. Calidad frontend
   - `npm run lint` paso correctamente.
   - `npm run build` paso correctamente.

### Observacion importante

- El payload actual de `GET /api/public/projects` pesa aproximadamente `10,233,920` bytes con un solo proyecto existente, por incluir base64 en la respuesta. No se cambio esta arquitectura en esta fase, pero queda confirmada como mejora posterior documentar o implementar un endpoint de detalle o una estrategia de entrega mas liviana.

## 2026-07-05 - Ajuste visual del carrusel publico para imagen completa

### Alcance aplicado

Se ajusto unicamente el visor principal del modal publico de proyectos para priorizar que cada imagen se vea completa dentro del contenedor definido, manteniendo proporcion y sin recorte. Tambien se amplio un poco el popup para mejorar el espacio de visualizacion. El zoom sigue disponible solo como opcion adicional.

### Cambios realizados

1. `frontend/src/components/sections/ProjectsSection.css`
   - Se aumento el ancho maximo del modal publico de proyectos.
   - Se amplio el alto controlado del visor principal tanto en escritorio como en movil.
   - Se reforzo el centrado del area visual de la imagen.
   - La vista principal mantiene `object-fit: contain` y `object-position: center` para mostrar la imagen completa dentro del espacio asignado.
   - El zoom sigue funcionando como opcion secundaria sin alterar el comportamiento ajustado de la vista principal.

## 2026-07-05 - Ajuste fino del visor publico de proyectos

### Alcance aplicado

Se ajusto unicamente el comportamiento visual del visor de imagenes dentro del modal publico de proyectos para que la imagen se adapte al espacio disponible sin agrandar el modal. No se tocaron backend, admin, autenticacion, certificaciones ni el card del proyecto.

### Cambios realizados

1. `frontend/src/components/sections/ProjectsSection.css`
   - Se fijo una altura controlada para el visor principal del modal usando `clamp(...)`.
   - El area de imagen ahora ocupa siempre un espacio definido dentro del modal y no lo expande segun el tamano original del archivo.
   - El contenedor interno del visor usa `overflow: hidden` en modo normal.
   - La imagen activa se mantiene con `width: 100%`, `height: 100%`, `max-width`, `max-height` y `object-fit: contain`.
   - El modo zoom sigue siendo opcional y ahora usa overflow interno del visor sin hacer crecer el modal completo.
   - Se mantuvo el layout con informacion debajo del carrusel, miniaturas, navegacion y cierre del modal.

## 2026-07-05 - Ajuste visual modal publico de proyectos

### Alcance aplicado

Se ajusto unicamente el diseno del modal/carrusel publico de proyectos. El card sigue usando `project.image` como portada y no se tocaron backend, admin, autenticacion ni certificaciones.

### Cambios realizados

1. `frontend/src/components/sections/ProjectsSection.jsx`
   - Se agrego estado simple de zoom para la imagen activa.
   - El zoom puede activarse con boton `Zoom` o clic sobre la imagen y volver a `Ajustar`.
   - El zoom se reinicia al cambiar de imagen o cerrar el modal.

2. `frontend/src/components/sections/ProjectsSection.css`
   - El layout del modal ahora muestra primero el visor/carrusel y debajo la informacion del proyecto.
   - El visor principal usa altura fija/controlada para evitar que imagenes grandes expandan el modal.
   - La imagen activa ahora usa `object-fit: contain`.
   - Se agrego una zona interna con overflow controlado para el zoom.
   - Se mantuvieron miniaturas, cierre del modal y navegacion `Anterior` / `Siguiente`.

## 2026-07-05 - Frontend publico galeria de proyectos (Fase 4)

### Alcance aplicado

Se implemento unicamente la Fase 4 publica para proyectos. Los cards siguen usando `project.image` como portada principal y el detalle del proyecto ahora se muestra en un modal con la galeria ordenada desde `gallery_images`. No se toco backend, admin, certificaciones ni autenticacion.

### Cambios realizados

1. `frontend/src/components/sections/ProjectsSection.jsx`
   - Se agrego un modal de detalle por proyecto.
   - El card mantiene `project.image` como portada.
   - El modal muestra titulo, descripcion completa, skills y enlaces `repository_url` y `demo_url`.
   - Se construyo una lista de imagenes compatible con proyectos sin portada, sin galeria, con una imagen adicional o con varias.
   - La galeria usa `gallery_images` en orden y evita duplicar la portada si coincide con un asset adicional.
   - Se agrego imagen activa, miniaturas y navegacion simple `Anterior` / `Siguiente`.
   - El modal se cierra con boton, `Escape` y clic en el fondo.

2. `frontend/src/components/sections/ProjectsSection.css`
   - Se agregaron estilos del modal, visor principal, miniaturas y controles.
   - Se mantuvo el diseño general de la seccion y de los cards.
   - Se agrego adaptacion responsive para el detalle del proyecto en pantallas pequenas.

## 2026-07-05 - Ajuste admin galeria de proyectos: subida multiple

### Alcance aplicado

Se ajusto unicamente `AdminProjectGalleryPicker` para permitir seleccionar y subir varias imagenes a la vez desde el explorador, manteniendo el mismo flujo actual de `media-assets`. No se toco backend, base de datos, autenticacion, certificaciones, galeria publica ni el selector de portada principal.

### Cambios realizados

1. `frontend/src/components/admin/AdminProjectGalleryPicker.jsx`
   - El input de archivos ahora usa `multiple`.
   - La carga ahora procesa `Array.from(event.target.files)` y tambien multiples archivos desde drag and drop.
   - Cada imagen se sube con una peticion separada usando el endpoint existente de `media-assets`.
   - Cada asset subido se agrega al catalogo local mediante `onAssetUploaded`.
   - Cada asset subido se agrega a `gallery_image_ids` respetando el orden de seleccion.
   - Se evitan duplicados si un asset ya estaba asociado en la galeria.
   - Se agrego estado visual de carga para lotes con conteo de imagenes.
   - Si una o mas imagenes fallan, las que si subieron se conservan y el error se muestra por archivo.
   - El input se limpia al final para permitir volver a seleccionar los mismos archivos si hace falta.

## 2026-07-05 - Frontend admin galeria de proyectos (Fase 3)

### Alcance aplicado

Se implemento unicamente la fase de administracion frontend para la galeria de imagenes de proyectos. La portada principal sigue usando `image_asset_id` y el selector unico existente no se modifico en su comportamiento base. No se tocaron backend, certificaciones, autenticacion ni la galeria publica.

### Cambios realizados

1. `frontend/src/pages/AdminPage.jsx`
   - `projectForm` ahora incluye `gallery_image_ids`.
   - Al editar un proyecto existente, se cargan los `media_asset_id` desde `gallery_images` en el orden recibido.
   - El payload de crear/editar proyecto ahora envia `gallery_image_ids` en el orden visual actual.
   - Se agrego `handleProjectGalleryChange()` para mantener el estado ordenado de la galeria.

2. `frontend/src/components/admin/AdminProjectGalleryPicker.jsx`
   - Se creo un componente especifico para la galeria de proyectos, separado de `AdminImagePicker`.
   - Permite seleccionar varias imagenes existentes.
   - Permite subir una imagen con el flujo actual de `media-assets`.
   - La imagen subida se agrega al catalogo global y tambien a la galeria actual.
   - Permite retirar imagenes de la galeria sin borrar el asset global.
   - Permite reordenar con botones `Subir` y `Bajar`.

3. `frontend/src/components/admin/AdminProjectGalleryPicker.css`
   - Se agregaron estilos minimos para la seccion de galeria, el listado ordenado y el modal de seleccion multiple.

4. `frontend/src/components/admin/AdminProjectsPanel.jsx`
   - Se mantuvo el selector actual de imagen principal.
   - Se agrego una seccion separada `Galeria del proyecto`.
   - Se muestra la cantidad de imagenes adicionales en cada tarjeta del listado administrativo.

5. `frontend/src/components/admin/AdminProjectsPanel.css`
   - Se agrego un ajuste menor para mostrar el metadato secundario de la galeria sin alterar el diseño general.

## 2026-07-05 - Backend galeria de proyectos (Fase 1 y Fase 2)

### Alcance aplicado

Se implemento unicamente la parte backend de la galeria de imagenes por proyecto definida en `PLAN_GALERIA_PROYECTOS.md`. No se toco frontend, autenticacion, certificaciones, `reset_db.py` ni se reemplazo `image_asset_id` como portada principal.

### Cambios realizados

1. `backend/app/models/project_model.py`
   - Se agrego el modelo asociativo `ProjectImage` para la nueva tabla `project_images`.
   - Se mantuvo `Project.image_asset_id` y `Project.image` como portada principal.
   - Se agrego `Project.gallery_items` como relacion ordenada y con borrado solo de asociaciones al editar o eliminar el proyecto.

2. `backend/app/models/__init__.py`
   - Se registro `ProjectImage` en `Base.metadata`.

3. `backend/app/schemas/public_schema.py`
   - Se agrego `ProjectGalleryImageRead`.
   - `ProjectRead` ahora mantiene `image` como portada y devuelve `gallery_images` ordenadas.

4. `backend/app/schemas/admin_schema.py`
   - `ProjectCreate` ahora acepta `gallery_image_ids`.
   - `ProjectUpdate` ahora acepta `gallery_image_ids`, permitiendo omitir la galeria o vaciarla con `[]`.
   - `ProjectAdminRead` devuelve `gallery_images`.
   - Se agrego validacion minima de duplicados en `gallery_image_ids`.

5. `backend/app/repositories/public_repository.py`
   - Se cargo la galeria con `selectinload` y su `MediaAsset` asociado para evitar N+1 en rutas publicas.

6. `backend/app/repositories/admin_repository.py`
   - Se cargo la galeria en listado y detalle administrativo de proyectos.
   - Se agrego `replace_project_gallery()` para crear, editar, vaciar y reordenar asociaciones sin borrar `MediaAsset`.
   - Se agrego `get_media_assets_by_ids()` para validar assets en bloque.

7. `backend/app/services/admin_service.py`
   - Se agrego validacion de `gallery_image_ids` para rechazar IDs duplicados, inexistentes o assets que no sean de tipo `image`.
   - Se conecto esa validacion al create/update actual de proyectos.

8. `backend/app/scripts/migrate_project_gallery.py`
   - Se creo un script idempotente para crear unicamente `project_images` si no existe.
   - La conexion de migracion activa `PRAGMA foreign_keys=ON`.
   - El script valida estructura esperada de la tabla.
   - El script ejecuta `PRAGMA integrity_check` y `PRAGMA foreign_key_check`.

### Verificacion ejecutada

- Se realizaron verificaciones de lectura e importacion del backend para confirmar coherencia de modelos, schemas, repositorios y servicios.
- No se ejecuto la migracion sobre `portfolio.db` en esta fase.
- No se ejecutaron cambios de datos.

## 2026-07-05 - Ajuste puntual post-MVP en certificaciones

### Alcance aplicado

Se implemento unicamente la correccion del visor PDF en la seccion publica de certificaciones y la limpieza de textos danados en ese componente. No se tocaron backend, base de datos, autenticacion, CRUD administrativo ni el flujo de iconos/logos.

### Cambios realizados

1. `frontend/src/components/sections/CertificationsSection.jsx`
   - Se reemplazo la apertura directa con `data:` y `target="_blank"` por un flujo local con `Blob`.
   - Cuando `certificate_file` llega con `mime_type` `application/pdf` y `data_base64`, ahora se decodifica el base64, se crea un `Blob`, se genera una `Blob URL` temporal y se muestra dentro de un modal con `iframe`.
   - Se agrego cierre por boton, tecla `Escape` y clic sobre el fondo.
   - Se libera la `Blob URL` al cerrar el modal o al desmontar el componente para evitar fugas de memoria.
   - `credential_url` se mantiene como enlace externo separado.
   - Se corrigieron los textos danados del componente y el simbolo visual de la tarjeta.

2. `frontend/src/components/sections/CertificationsSection.css`
   - Se agregaron estilos minimos para las acciones de certificacion y para el modal PDF, manteniendo la estetica actual de la seccion.

### Verificacion esperada

- Una certificacion con `credential_url` sigue mostrando su enlace externo.
- Una certificacion con `certificate_file` PDF muestra el boton `Abrir PDF`.
- Al abrirlo, el documento aparece dentro del modal.
- El modal puede cerrarse con el boton, `Escape` o clic en el fondo.
- Una certificacion sin PDF no muestra el boton de PDF.

## 2026-07-04 - Fase 1 MVP backend

### Alcance aplicado

Se implementó únicamente la Fase 1 de `PLAN_EJECUCION_MVP.md`, sin tocar frontend, sin crear migraciones y sin cambiar modelos, autenticación, CORS, repositorios ni servicios.

### Cambios realizados

1. `backend/app/schemas/admin_schema.py`
   - Se agregó `certificate_file_id: int | None = None` a `CertificationAdminRead`.
   - Motivo: el backend ya acepta y persiste ese campo, pero la lectura administrativa no lo devolvía, lo que impedía que el frontend admin conservara correctamente la asociación del PDF al editar una certificación.

2. `backend/.env.example`
   - Se creó con todas las variables reales consumidas por `backend/app/core/config.py`.
   - Incluye:
     - `APP_NAME`
     - `APP_ENV`
     - `APP_DEBUG`
     - `DATABASE_URL`
     - `LOG_DIR`
     - `LOG_FILE`
     - `LOG_LEVEL`
     - `LOG_CONSOLE`
     - `LOG_MAX_BYTES`
     - `LOG_BACKUP_COUNT`
     - `API_DOCS_ENABLED`
     - `API_DOCS_USERNAME`
     - `API_DOCS_PASSWORD`
     - `ADMIN_ENABLED`
     - `ADMIN_USERNAME`
     - `ADMIN_PASSWORD`

3. `backend/.env`
   - Se eliminó la duplicación de `DATABASE_URL`.
   - Se retiró `VITE_API_BASE_URL` porque no es una variable leída por el backend.
   - Se agregaron `ADMIN_ENABLED`, `ADMIN_USERNAME` y `ADMIN_PASSWORD` para no depender implícitamente de defaults de `config.py`.

4. `PLAN_EJECUCION_MVP.md`
   - Se marcó el estado de avance de la Fase 1 y qué criterio queda pendiente de validación funcional en integración.

### Cambios no realizados a propósito

- No se modificó frontend.
- No se crearon migraciones.
- No se cambió la lógica de una imagen por proyecto.
- No se cambió CORS.
- No se cambió autenticación HTTP Basic.
- No se rediseñaron repositorios ni servicios.

## 2026-07-04 - Fase 2 MVP frontend

### Alcance aplicado

Se implementó únicamente la Fase 2 de `PLAN_EJECUCION_MVP.md`, manteniendo el diseño actual y sin introducir galería múltiple, visor PDF modal, React Router ni refactors amplios.

### Cambios realizados

1. `frontend/src/pages/HomePage.jsx`
   - Ahora carga `getHomeData()` y `getProjects()` en paralelo.
   - Se usa la lista de `projects` para mostrar todos los proyectos activos, sin depender solo de `featured_projects`.

2. `frontend/src/components/sections/EducationSection.jsx`
   - Se corrigió la lectura de campos reales del backend: `field_of_study`, `start_year` y `end_year`.
   - Se conservaron alias existentes como fallback para no alterar innecesariamente el componente.

3. `frontend/src/components/sections/CertificationsSection.jsx`
   - Se eliminó `selectedPdf`, que no se usaba.
   - Se agregó manejo mínimo de `certificate_file` cuando llega con `mime_type` `application/pdf` y `data_base64`.
   - Se construye una data URL y se muestra un enlace separado `Abrir PDF`.
   - `credential_url` se mantiene como enlace independiente.

4. `frontend/src/services/publicApi.js`
   - Se corrigió el bloque `catch` que hacía `errorMessage = errorMessage`, eliminando el error de lint `no-self-assign`.

5. `frontend/src/services/adminApi.js`
   - Se corrigió el mismo patrón `no-self-assign` en el manejo de errores del cliente administrativo.

6. `frontend/src/pages/AdminPage.jsx`
   - Se ajustó `loadAdminData()` para aceptar `showLoading`.
   - La carga automática inicial usa `showLoading: false`, evitando el patrón que disparaba `react-hooks/set-state-in-effect` al montar.
   - Se mantuvo el flujo actual de autenticación y la carga posterior al login.

7. `frontend/.env.example`
   - Se documentó `VITE_API_BASE_URL=http://127.0.0.1:8000`.

8. `PLAN_EJECUCION_MVP.md`
   - Se marcó el avance de la Fase 2 y qué validaciones quedan para integración.

### Verificación ejecutada

- `cd frontend && npm run lint`
  - Resultado: ejecución correcta, sin errores.
- `cd frontend && npm run build`
  - Resultado: compilación correcta de producción con salida en `frontend/dist`.

## 2026-07-04 - Fase 3 MVP integracion y verificacion

### Alcance aplicado

Se ejecutó únicamente la verificación de integración backend/frontend del MVP, sin ampliar alcance, sin ejecutar `reset_db.py` y sin introducir mejoras de la fase posterior.

### Verificaciones realizadas

1. Contrato de rutas
   - `frontend/src/services/publicApi.js` coincide con `backend/app/routers/public_router.py`.
   - `frontend/src/services/adminApi.js` coincide con `backend/app/routers/admin_router.py` y `backend/app/routers/admin_auth_router.py`.

2. Contrato de datos
   - Se revisaron los campos JSON públicos y administrativos consumidos por React frente a los schemas del backend.
   - No se confirmó una discrepancia nueva que exigiera cambios adicionales de código en esta fase.

3. Variables y entorno local
   - `frontend/.env` y `frontend/.env.example` usan `VITE_API_BASE_URL=http://127.0.0.1:8000`.
   - `backend/.env` y `backend/.env.example` quedaron alineados con `backend/app/core/config.py`.
   - CORS local respondió correctamente para `http://localhost:5173` y `http://127.0.0.1:5173`.

4. Autenticación administrativa
   - Login válido: `POST /api/admin/auth/login` respondió correctamente.
   - Login inválido: respondió `401`.

5. Prueba controlada de integración real
   - Se creó por API un `media_asset` temporal de imagen.
   - Se creó por API un proyecto temporal con una sola imagen y una skill asociada.
   - Se actualizó el proyecto y luego se verificó en `GET /api/public/projects` que:
     - aparecía públicamente,
     - exponía una sola imagen,
     - conservaba `repository_url`, `demo_url` y skills.
   - Se creó por API un `media_asset` temporal PDF.
   - Se creó por API una certificación temporal con `credential_url` y `certificate_file_id`.
   - Se actualizó la certificación y luego se verificó en `GET /api/public/certifications` que:
     - aparecía públicamente,
     - conservaba `credential_url`,
     - exponía `certificate_file` con `mime_type` `application/pdf`.
   - Al terminar, se eliminaron el proyecto, la certificación y ambos assets temporales.

### Resultado

- No se confirmó una incompatibilidad nueva entre backend y frontend que requiriera cambiar código en esta fase.
- Queda pendiente la validación visual/manual completa en navegador del recorrido público y del panel administrativo.

### Cambios no realizados a propósito

- No se cambió backend en esta fase.
- No se implementó galería de múltiples imágenes por proyecto.
- No se agregó visor PDF modal ni librería PDF.
- No se cambió React Router ni el sistema manual de rutas actual.
- No se rediseñó la interfaz ni se cambiaron los CRUD existentes.
