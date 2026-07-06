# Cambios realizados

## 2026-07-06 - Tareas 2.5 y 2.6: SVG seguro en proyectos y fallback usable para PDF

Se alineo la visualizacion publica de proyectos con la politica segura de SVG definida en la Fase 1. `ProjectsSection` ahora reutiliza `frontend/src/utils/svgSecurity.js` para mostrar SVG solo cuando pueden convertirse en una data URL segura; no se usa `dangerouslySetInnerHTML` y un asset SVG que no pase la politica queda oculto con un fallback visual claro en lugar de renderizarse de forma insegura.

Tambien se reforzo el visor PDF de certificaciones:

- la creacion y revocacion del Blob URL ahora se concentra en un solo ciclo de vida del estado del modal;
- si el PDF base64 no puede convertirse, se muestra un error visible en la seccion;
- el modal mantiene la vista previa embebida y agrega acciones alternativas de `Abrir en nueva pestana` y `Descargar PDF`;
- `credential_url` sigue funcionando como enlace externo independiente.

Archivos tocados:

- `frontend/src/components/sections/ProjectsSection.jsx`
- `frontend/src/components/sections/ProjectsSection.css`
- `frontend/src/components/sections/CertificationsSection.jsx`
- `frontend/src/components/sections/CertificationsSection.css`
- `CAMBIOS.md`

## 2026-07-06 - Tareas 2.3 y 2.4: datos publicos honestos y fechas legibles

Se retiraron fallbacks que aparentaban ser datos reales cuando el perfil no está disponible o cuando faltan campos de contacto. El hero, el footer y la sección de contacto ahora muestran información real si existe en el backend y, si no, usan textos honestos o simplemente ocultan el dato en lugar de inventarlo.

También se corrigió la presentación de fechas y periodos en las secciones públicas:

- `is_current` decide cuando una experiencia muestra `Actualidad`.
- `country` y `city` se combinan cuando existen.
- `start_date` y `end_date` de experiencia se muestran en formato legible en español sin depender del parseo UTC del navegador.
- `start_year` y `end_year` de educación se presentan de forma clara.
- `issue_date` de certificaciones se formatea en español de forma legible.

Archivos tocados:

- `frontend/src/components/sections/HeroSection.jsx`
- `frontend/src/components/layout/Footer.jsx`
- `frontend/src/components/sections/ContactSection.jsx`
- `frontend/src/components/sections/ExperienceSection.jsx`
- `frontend/src/components/sections/EducationSection.jsx`
- `frontend/src/components/sections/CertificationsSection.jsx`
- `frontend/src/pages/HomePage.jsx`
- `CAMBIOS.md`

## 2026-07-06 - Tareas 2.1, 2.2 y 2.7: resiliencia del frontend publico y formulario de contacto

Se desacoplo la carga de `/api/public/home` y `/api/public/projects` para que la vista publica no dependa de una sola solicitud. La pagina principal ahora conserva perfil, skills, experiencia, educacion y certificaciones si falla la carga de proyectos, y la seccion de proyectos muestra su propio estado de error con reintento independiente.

Tambien se ajustaron los helpers HTTP del frontend:

- `GET` y `DELETE` sin body ya no envian `Content-Type: application/json`.
- `POST`, `PUT` y `PATCH` con JSON conservan el header correspondiente.
- Se agrego soporte de `AbortController` para evitar actualizaciones de estado despues de desmontar o reintentar cargas.
- Los errores HTTP ahora se interpretan por status con mensajes mas utiles, incluyendo validaciones `422` y fallos de red.

En el formulario publico de contacto:

- se muestran mensajes reales de validacion cuando el backend responde `422`;
- se diferencia un fallo de red de un fallo del servidor;
- el formulario conserva lo escrito cuando el envio falla;
- el formulario solo se limpia cuando el envio termina correctamente.

Archivos tocados:

- `frontend/src/pages/HomePage.jsx`
- `frontend/src/components/sections/ProjectsSection.jsx`
- `frontend/src/components/sections/ProjectsSection.css`
- `frontend/src/components/sections/ContactSection.jsx`
- `frontend/src/services/publicApi.js`
- `frontend/src/services/adminApi.js`
- `CAMBIOS.md`

## 2026-07-06 - Tarea 1.7: credenciales administrativas solo en memoria

Se retiro la persistencia del usuario y la contrasena administrativa en `localStorage`. HTTP Basic se mantiene sin cambios en las rutas admin, pero las credenciales ahora viven unicamente en memoria dentro del modulo de API mientras la pagina permanece abierta.

Comportamiento aplicado:

- Una recarga de `/admin` descarta la sesion en memoria y vuelve a mostrar el login.
- Al cargar la aplicacion se elimina la antigua clave `portfolio-admin-auth` tanto de `localStorage` como de `sessionStorage`.
- Logout limpia credenciales, datos y formularios administrativos mantenidos en memoria.
- Una respuesta `401 Unauthorized` o `403 Forbidden` limpia la sesion y devuelve al login.
- Errores de red y respuestas no autenticativas no eliminan las credenciales en memoria.

Archivos tocados:

- `frontend/src/services/adminApi.js`
- `frontend/src/pages/AdminPage.jsx`
- `CAMBIOS.md`

## 2026-07-05 - Tarea 1.6: eliminacion del vector XSS en SVG

Se elimino la insercion de `svg_content` como HTML crudo en la vista publica y el panel administrativo. Los SVG seguros ahora se muestran como imagen mediante una data URL codificada; si un asset historico no supera la politica de seguridad, se usa el fallback visual existente y nunca se inserta su contenido en el DOM como HTML.

La carga de nuevos SVG aplica defensa en profundidad:

- El frontend rechaza el archivo antes de enviarlo si contiene contenido activo.
- El schema del backend valida XML bien formado y rechaza scripts, eventos `on*`, `foreignObject`, estilos inline, animaciones, elementos embebidos, esquemas `javascript:`, `vbscript:` o `data:`, referencias externas, `DOCTYPE`, entidades e instrucciones de procesamiento.
- El servicio administrativo vuelve a validar el SVG inmediatamente antes de persistirlo.
- Los SVG seguros existentes, incluidos los iconos iniciales de Python, FastAPI y React, conservan su visualizacion.

Archivos tocados:

- `backend/app/schemas/admin_schema.py`
- `backend/app/services/admin_service.py`
- `frontend/src/utils/svgSecurity.js`
- `frontend/src/components/sections/SkillsSection.jsx`
- `frontend/src/components/admin/AdminImagePicker.jsx`
- `frontend/src/components/admin/AdminProjectGalleryPicker.jsx`
- `frontend/src/components/admin/AdminSkillsPanel.jsx`
- `CAMBIOS.md`

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

## Cierre de Fase 1

La Fase 1 quedo cerrada con las correcciones base de integridad, contrato administrativo, proteccion de assets y endurecimiento de uploads y SVG. Se redujeron estos riesgos principales:

- perdida accidental de `avatar_asset_id` al editar el perfil admin;
- borrado de assets aun referenciados;
- asociaciones invalidas entre assets y entidades;
- uploads fuera de limite o con MIME/base64 dudoso;
- inyeccion XSS por SVG no confiable;
- persistencia de credenciales administrativas en almacenamiento del navegador.

Verificaciones realizadas o pendientes:

- `check_db` paso con `foreign_keys = 1`, `integrity_check = ok` y `foreign_key_check` sin violaciones.
- Se mantuvo la compatibilidad con los flujos existentes de admin y galeria.
- No se ejecuto `reset_db.py`.

Pendientes para fases posteriores:

- ajustes de integracion visual y funcional del frontend publico;
- mejoras de responsividad;
- limpieza final de componentes y documentacion operacional;
- preparacion de despliegue y verificaciones manuales completas.

## Cambios recientes

- Se implemento el visor PDF modal simple para certificaciones publicas.
- Se implemento la galeria de imagenes por proyecto en backend, admin y vista publica.
- Se habilito la subida multiple de imagenes en la galeria administrativa de proyectos.
- Se ajusto el carrusel publico de proyectos para mostrar la imagen completa dentro de un contenedor fijo.
- Se corrigieron el favicon con `LogoCJ.ico` y el logo visible del header con la ruta publica correcta.
- Se dejo documentado el estado real del proyecto en los planes y auditorias recientes.

## Historial detallado

El historial extenso de cambios, limpieza y fases previas quedo archivado en [docs/HISTORIAL_CAMBIOS_DETALLADO.md](docs/HISTORIAL_CAMBIOS_DETALLADO.md).
