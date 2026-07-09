# Auditoría del frontend administrativo

Fecha: 2026-07-05  
Alcance: panel React administrativo, formularios, validaciones, consumo de API, multimedia, proyectos, galería, PDF, mensajes, errores y responsividad.  
Método: revisión estática del frontend y contraste con routers/schemas FastAPI. No se modificó código ni información persistida.

## 1. Resumen ejecutivo

El panel administrativo implementa los flujos principales del portfolio:

- login y cierre de sesión;
- dashboard de conteos;
- edición de perfil;
- CRUD de redes, skills, proyectos, experiencia, educación y certificaciones;
- listado y marcado de mensajes como leídos;
- subida y selección de media assets;
- portada independiente por proyecto;
- galería adicional múltiple, ordenada y editable;
- selección y subida de documentos PDF para certificaciones.

Los payloads enviados coinciden, en general, con los schemas de FastAPI. La galería envía `gallery_image_ids` en el orden visual y la certificación envía `certificate_file_id`, tal como espera el backend.

Los problemas más importantes son:

1. usuario y contraseña se guardan sin cifrado en `localStorage`;
2. SVG se inserta con `dangerouslySetInnerHTML` sin sanitización y puede acceder a esas credenciales;
3. el backend no devuelve `avatar_asset_id` en el perfil administrativo, pero React lo espera, por lo que el avatar puede desaparecer al guardar;
4. los formularios prácticamente no tienen validación cliente;
5. uploads no validan tamaño, MIME o extensión real, especialmente mediante drag and drop;
6. un fallo en cualquiera de las diez peticiones iniciales invalida toda la carga y cierra la sesión local;
7. errores Pydantic 422 pueden terminar mostrados como `[object Object]`;
8. assets subidos quedan persistidos aunque luego se cancele el formulario.

## 2. Organización del panel

`frontend/src/pages/AdminPage.jsx` concentra:

- estado de autenticación;
- credenciales almacenadas;
- carga inicial de todos los módulos;
- estado de cada formulario;
- normalización de datos al editar;
- construcción de payloads;
- llamadas CRUD;
- actualización local de listas y contadores;
- toast global.

Los componentes de `frontend/src/components/admin/` son principalmente presentacionales y reciben estado/callbacks desde `AdminPage`.

### Vistas administrativas implementadas

| Vista | Operaciones disponibles |
|---|---|
| Login | Validar credenciales y restaurar sesión guardada. |
| Dashboard | Mostrar diez conteos. |
| Perfil | Editar texto, contacto, CV y avatar. |
| Redes | Crear, editar y eliminar. |
| Skills | Crear, editar, eliminar y gestionar icono. |
| Proyectos | Crear, editar, eliminar, portada, skills y galería. |
| Experiencia | Crear, editar, eliminar y administrar bullets. |
| Educación | Crear, editar y eliminar. |
| Certificaciones | Crear, editar, eliminar, URL y PDF. |
| Mensajes | Listar y marcar como leído. |
| Media assets | Listar y subir desde pickers; no existe vista general de mantenimiento. |

## 3. Tabla de vistas, funciones y endpoints

| Vista | Función | Endpoint usado | Estado | Problema | Solución propuesta |
|---|---|---|---|---|---|
| Login | Validar credenciales | POST `/api/admin/auth/login` | Funcional con riesgo crítico | Guarda usuario y contraseña completos en `localStorage`. | Mantener credenciales solo en memoria/sesión o adoptar una sesión/token seguro; exigir HTTPS. |
| Carga inicial | Cargar dashboard y módulos | Diez GET bajo `/api/admin` | Funcional pero frágil | Tres grupos de `Promise.all`; una sola falla descarta todo y borra credenciales. | Cargar por módulos o usar `Promise.allSettled`; cerrar sesión solo ante 401/403. |
| Dashboard | Mostrar conteos | GET `/api/admin/dashboard` | Funcional | Los conteos posteriores se ajustan manualmente y pueden quedar desincronizados. | Recargar dashboard tras operaciones sensibles o centralizar actualizaciones. |
| Perfil | Cargar perfil | GET `/api/admin/profile` | Incompatibilidad confirmada | React espera `avatar_asset_id`, pero la respuesta `ProfileRead` no lo contiene. | Derivarlo desde `avatar.id` o usar un schema admin que devuelva el ID. |
| Perfil | Guardar perfil | PUT `/api/admin/profile` | Riesgo alto | Tras guardar, la respuesta vuelve sin `avatar_asset_id`; el formulario pierde la selección y un guardado posterior puede enviar `null`. | Conservar el ID enviado o normalizar desde `updatedProfile.avatar?.id`. |
| Redes | Listar/crear | GET/POST `/api/admin/social-links` | Compatible | Sin validación cliente de URL o mínimos. | Añadir `required`, `type=url`, límites y validación previa. |
| Redes | Editar/eliminar | PUT/DELETE `/api/admin/social-links/{id}` | Compatible | Eliminación sin undo; orden local no se reordena tras editar. | Confirmación más informativa y reordenar por `display_order`. |
| Skills | Listar/crear | GET/POST `/api/admin/skills` | Compatible con riesgo | Selector filtra `icon_svg`; assets históricos `asset_type=icon` quedan invisibles. | Normalizar tipos o admitir ambos tipos en el selector. |
| Skills | Editar/eliminar | PUT/DELETE `/api/admin/skills/{id}` | Compatible | Color no se valida como hexadecimal; SVG se inyecta sin sanitizar. | Validar color y eliminar/sanitizar HTML SVG. |
| Proyectos | Listar/crear | GET/POST `/api/admin/projects` | Compatible | Payload coincide; faltan validaciones cliente y ordenamiento local posterior. | Validar campos y ordenar la lista por `display_order`. |
| Proyectos | Editar | PUT `/api/admin/projects/{id}` | Compatible | Conserva portada, skills y galería; los assets nuevos ya quedaron persistidos aunque se cancele. | Informar persistencia inmediata y ofrecer limpieza controlada de assets huérfanos. |
| Proyectos | Eliminar | DELETE `/api/admin/projects/{id}` | Compatible | No elimina assets —correcto—, pero tampoco informa que quedan globales; botón sigue activo mientras elimina. | Estado `deletingProjectId`, explicación y mantenimiento separado de assets. |
| Galería | Subir assets | POST `/api/admin/media-assets` por archivo | Funcional | Subida secuencial y parcial funciona; sin tamaño/MIME real, cancelación ni progreso por archivo. | Validar antes de leer base64 y mostrar progreso/resultado individual. |
| Galería | Persistir orden | POST/PUT `/api/admin/projects` | Compatible | Envía `gallery_image_ids` correctamente en orden visual. | Mantener contrato; añadir prueba automática de orden. |
| Experiencia | Listar/crear/editar/eliminar | GET/POST/PUT/DELETE `/api/admin/experience` | Compatible | No valida cronología; inicio vacío llega como cadena inválida; bullets solo tienen validación backend. | Validar requeridos y `end_date >= start_date`. |
| Educación | Listar/crear/editar/eliminar | GET/POST/PUT/DELETE `/api/admin/education` | Compatible | No valida rango de años ni que fin sea posterior al inicio. | Añadir límites razonables y validación cruzada. |
| Certificaciones | Listar/crear/editar/eliminar | GET/POST/PUT/DELETE `/api/admin/certifications` | Compatible con riesgo | `certificate_file_id` coincide, pero no se previsualiza/abre el PDF en admin. | Mostrar nombre/MIME y acción de previsualización; conservar enlace externo separado. |
| PDF | Subir documento | POST `/api/admin/media-assets` | Funciona por permisividad backend | Usa `asset_type=document`, no descrito en el texto del schema; drag and drop acepta cualquier archivo. | Formalizar `document` y validar PDF por MIME, extensión y firma. |
| Mensajes | Listar | GET `/api/admin/contact-messages` | Compatible | Sin paginación, refresco o búsqueda. | Añadir paginación/recarga solo cuando el volumen lo justifique. |
| Mensajes | Marcar leído | PATCH `/api/admin/contact-messages/{id}/read` | Compatible | Un estado global deshabilita todos los mensajes; no puede volver a “pendiente”. | Usar ID en proceso y definir si se necesita reversión. |
| Mensajes | Eliminar | No consumido | Funcionalidad ausente en UI | El backend tiene DELETE, pero el panel no lo expone. | Añadirlo solo si la operación forma parte del alcance administrativo deseado. |
| Assets | Listar biblioteca | GET `/api/admin/media-assets` | Compatible con riesgo | Descarga todos los base64 y carece de paginación/filtros iniciales. | Carga por tipo o metadatos/miniaturas si crece el catálogo. |
| Assets | Eliminar | Wrapper disponible, no usado | No expuesto | Assets huérfanos se acumulan, pero borrarlos sin revisar referencias sería peligroso. | Crear mantenimiento protegido con información de uso antes de permitir borrar. |

## 4. Formularios y validaciones

### Validaciones presentes

- `type="email"` en correo del perfil.
- `type="date"` en fechas.
- `type="number"` en orden y años.
- Deshabilitado de formularios durante su operación de guardado.
- Conversión de campos opcionales vacíos a `null`.
- Conversión de IDs y números antes de enviar.
- Bullets: una línea se convierte en `{ description }`.
- Fin de experiencia se envía `null` cuando `is_current` está activo.
- El backend realiza la validación final mediante Pydantic.

### Validaciones ausentes

No se encontró ningún atributo `required` en los formularios administrativos. Tampoco se usan `minLength`, `maxLength`, `pattern`, límites numéricos ni `type="url"`.

Consecuencias por formulario:

| Formulario | Riesgo de validación |
|---|---|
| Login | Permite enviar usuario o contraseña vacíos. |
| Perfil | Permite vaciar nombre, título y resumen; el backend `ProfileUpdate` también acepta cadenas vacías. |
| Redes | Plataforma/URL vacías llegan al backend; URL no valida protocolo. |
| Skills | Nombre, categoría y nivel vacíos; color acepta cualquier texto. |
| Proyectos | Título, slug y descripciones vacíos; URL no validada; no hay ayuda para slug único. |
| Experiencia | Inicio vacío produce 422; no valida fechas ni longitud de bullets. |
| Educación | No limita años ni compara inicio/fin. |
| Certificaciones | Nombre vacío produce 422; URL no se valida; archivo no se valida como PDF real. |

El patrón actual depende de esperar el error del backend. Esto es válido como última defensa, pero la experiencia de usuario es débil porque el error no se asocia al campo concreto.

## 5. Datos enviados frente a schemas FastAPI

| Módulo | Payload enviado | Schema esperado | Resultado |
|---|---|---|---|
| Perfil | nombre, título, resumen, ubicación, email, teléfono, CV, `avatar_asset_id` | `ProfileUpdate` | Coincide. El problema está en la respuesta, no en el envío. |
| Red social | plataforma, URL, icono, orden, activo | `SocialLinkCreate/Update` | Coincide. |
| Skill | nombre, categoría, nivel, color, `icon_asset_id`, orden, activo | `SkillCreate/Update` | Coincide. |
| Proyecto | textos, URLs, `image_asset_id`, orden, destacado, activo, `skill_ids`, `gallery_image_ids` | `ProjectCreate/Update` | Coincide. IDs de galería se convierten a número y conservan orden. |
| Experiencia | campos, fechas, actual, descripción, orden, activo, `bullets` | `ExperienceCreate/Update` | Coincide. |
| Educación | institución, grado, área, años, descripción, orden, activo | `EducationCreate/Update` | Coincide. |
| Certificación | nombre, emisor, fecha, URL, descripción, orden, activo, `certificate_file_id` | `CertificationCreate/Update` | Coincide. |
| Media asset | tipo, nombre, MIME, base64 o SVG, alt | `MediaAssetCreate` | Coincide estructuralmente; backend acepta tipos libres. |

No se detectaron campos extra que violen `extra="forbid"`.

### Discrepancias concretas

1. `normalizeProfileForm()` busca `profile.avatar_asset_id`, ausente en `ProfileRead`.
2. El picker de iconos filtra `asset_type === "icon_svg"`, mientras la base contiene también `icon`.
3. El frontend usa `asset_type="document"` para PDF; funciona porque backend acepta texto libre, pero la descripción del schema solo enumera imagen, icono y avatar.
4. La UI de certificación llama “imagen” a varias acciones internas del picker genérico aunque gestione documentos.

## 6. Subida y selección de imágenes

### Flujo actual

`AdminImagePicker`:

- selecciona un asset existente por tipo;
- admite clic y drag and drop;
- convierte imagen a base64 o SVG a texto;
- crea el asset con `POST /api/admin/media-assets`;
- lo agrega al catálogo local;
- selecciona automáticamente el ID nuevo.

Se usa para:

- avatar;
- icono de skill;
- portada de proyecto;
- PDF de certificación.

### Problemas

1. `accept` solo afecta al explorador; los archivos soltados por drag and drop no se validan.
2. No existe límite de tamaño antes de cargar todo el archivo en memoria/base64.
3. No se verifica MIME real, extensión, firma ni dimensiones.
4. La detección `.svg` y `.pdf` en `AdminImagePicker` es sensible a mayúsculas cuando `file.type` viene vacío.
5. Un archivo no SVG/PDF sin MIME se declara `image/png`, aunque no sea PNG.
6. SVG se renderiza con `dangerouslySetInnerHTML` en picker, lista de skills y galería.
7. No hay compresión, redimensionado ni miniatura separada.
8. El modal no cierra con Escape, no bloquea scroll y no administra foco.
9. La zona de subida individual responde a Enter, pero no a Espacio; la galería múltiple sí contempla ambos.
10. “Cambiar imagen”, “Seleccionar imagen” y “Subiendo imagen” se muestran también para PDF.

## 7. Documentos y certificaciones PDF

### Capacidades existentes

- Selector separado mediante `assetType="document"`.
- Explorador limitado visualmente a `application/pdf`.
- Conversión a base64 y subida por la API existente.
- Selección de documentos previamente subidos.
- Opción de quitar la asociación.
- Envío correcto de `certificate_file_id`.
- `credential_url` permanece como campo independiente.

### Pendientes

- Drag and drop puede aceptar un archivo no PDF.
- No hay previsualización dentro del panel; solo icono genérico.
- La tarjeta de certificación no indica claramente si tiene archivo PDF asociado.
- No se muestra tamaño, MIME ni nombre del documento salvo dentro del selector.
- Subir y luego cancelar la certificación deja el documento global almacenado.
- El backend tampoco exige que el ID sea un PDF, por lo que la validación debe existir en ambas capas.

## 8. Proyectos, edición y eliminación

### Aspectos correctos

- Crear y actualizar usan endpoints separados correctamente.
- El formulario incluye todos los campos del schema.
- `openProjectEditor` recupera portada mediante `image_asset_id`.
- Recupera skills desde `project.skills[].id`.
- Recupera galería desde `project.gallery_images[].media_asset_id`.
- Reordenar modifica el array visual.
- Guardar envía ese array en el mismo orden.
- Retirar una imagen solo quita el ID del formulario; no elimina el asset global.
- Eliminar proyecto usa confirmación y actualiza lista/conteos después de respuesta exitosa.
- El estado destacado ajusta el contador al editar/eliminar.

### Riesgos

- No existe estado específico de eliminación; un doble clic puede repetir la solicitud.
- No hay undo ni descripción del efecto de eliminación.
- Crear/editar antepone o reemplaza localmente sin volver a ordenar por `display_order`.
- La confirmación nativa no muestra portada, título detallado ni consecuencias.
- Un upload ocurre antes de guardar el proyecto; cancelar no revierte el asset creado.
- La portada no se valida en frontend como imagen real.

## 9. Relación proyecto → varias imágenes

La implementación respeta la estructura actual:

```text
image_asset_id       → portada única
gallery_image_ids[]  → imágenes adicionales ordenadas
```

### Comportamientos confirmados

- Selección múltiple de assets existentes.
- Subida de varios archivos con una petición por archivo.
- Éxitos parciales conservados si falla otro archivo.
- Nuevos assets añadidos al catálogo y al final del orden seleccionado.
- Duplicados por ID evitados.
- Botones Subir/Bajar para reordenar.
- Retirar sin borrar asset.
- Lista vacía para vaciar galería.
- El backend valida IDs, duplicados y tipo `image`.

### Observaciones

- El estado “Subiendo N imágenes” muestra el total inicial, no progreso restante.
- El modal puede cerrarse mientras siguen las peticiones; el proceso continúa y modifica el formulario en segundo plano.
- Seleccionar dos veces el mismo archivo crea dos `MediaAsset` distintos; la deduplicación solo opera por ID.
- SVG subido a galería se guarda como `svg_content`; la vista pública de proyectos no lo renderiza actualmente.
- Los SVG de la biblioteca se inyectan como markup sin sanitizar.

## 10. Manejo de errores y mensajes

### Aspectos correctos

- Todas las operaciones principales usan `try/catch/finally`.
- Los formularios se deshabilitan mientras guardan.
- Las listas se actualizan solo después de respuesta exitosa.
- El toast usa `role="status"` y `aria-live="polite"`.
- Upload individual y múltiple muestran errores dentro del modal.
- La subida múltiple identifica el nombre de cada archivo fallido y conserva éxitos.
- DELETE maneja 204 correctamente en `adminApi.js`.

### Problemas

1. FastAPI devuelve errores 422 con `detail` como array. `adminApi.js` entrega ese array a `new Error`, por lo que puede mostrarse como `[object Object]`.
2. Los errores no se asignan a campos concretos.
3. En el dashboard autenticado, `errorMessage` y `successMessage` no se renderizan; solo queda el toast de 3,2 segundos.
4. Un error transitorio durante la carga inicial borra credenciales igual que un 401.
5. No existe diferenciación por status HTTP para reautenticar o conservar sesión.
6. No hay botón de reintento/recarga por módulo.
7. El toast se anima fuera antes de desmontarse y puede ser breve para mensajes extensos.
8. El estado de marcado de mensajes es global, no por mensaje.

## 11. Autenticación y seguridad frontend

### Crítico: credenciales persistentes

`adminApi.js` guarda este objeto completo:

```json
{
  "username": "...",
  "password": "..."
}
```

en `localStorage` bajo `portfolio-admin-auth`. Base64 HTTP Basic no cifra la contraseña. Cualquier JavaScript ejecutado en el origen puede leerla.

### Crítico: SVG sin sanitización

SVG procedente de la base se inserta mediante `dangerouslySetInnerHTML` en:

- `AdminImagePicker`;
- `AdminProjectGalleryPicker`;
- `AdminSkillsPanel`;
- vista pública de skills.

Un SVG malicioso podría ejecutar handlers, leer las credenciales persistidas y comprometer el panel. El upload permite enviar SVG en texto sin sanitización.

### Otras observaciones

- Todas las peticiones envían `Authorization: Basic ...`.
- Debe usarse HTTPS fuera de local.
- `btoa` puede fallar con credenciales que contengan caracteres fuera de Latin-1.
- No hay timeout, cancelación ni tratamiento automático de sesión expirada.
- `Content-Type: application/json` también se envía en GET/DELETE y puede causar preflight innecesario.

## 12. Responsividad y revisión visual estática

### Cobertura existente

- Dashboard: 5 estadísticas; baja a 2 columnas bajo 1180 px y 1 bajo 768 px.
- Paneles principales: 2 columnas; bajan a 1 bajo 1180 px.
- Contenido: 3 columnas; baja directamente a 1 bajo 1180 px.
- Filas de formulario: 2 columnas; bajan a 1 bajo 768 px.
- Topbar: pasa a columna bajo 768 px.
- Cards de listas: acciones y contenido se reorganizan en móvil.
- Galería: items pasan a columna y preview ocupa ancho completo bajo 768 px.
- Modales: ancho máximo, altura máxima 88vh y scroll interno.
- Toast: ocupa ancho disponible en móvil.

### Problemas visuales o de CSS

1. `AdminSkillsPanel.css` repite bloques completos de `.entity-list`, `.entity-card`, metadatos y acciones.
2. `.entity-card__content` se declara globalmente tanto en CSS de proyectos como de skills; el orden de imports puede alterar alineación/gap de la otra vista.
3. `AdminImagePicker` no apila explícitamente preview y controles en móviles muy estrechos.
4. Los modales no bloquean el scroll de fondo ni gestionan foco/Escape.
5. Mensajes o emails con una cadena muy larga no tienen `overflow-wrap` explícito.
6. La grilla de contenido pasa de 3 a 1 sin estado intermedio de 2 columnas; es funcional, pero desaprovecha algunas tablets/portátiles.
7. No hay `prefers-reduced-motion` para cards, modales y toast.
8. No hay estilos `focus-visible` uniformes en botones/chips.

La base responsiva es razonable, pero requiere validación manual al menos en 320, 375, 768, 1024, 1180 y 1440 px.

## 13. Textos y contenido administrativo

- En galería faltan tildes: “Galeria”, “imagenes”, “Posicion”, “todavia”.
- `AdminImagePicker` usa lenguaje de imagen incluso al gestionar PDF.
- `AdminNotice.jsx` está obsoleto: afirma que experiencia, educación y certificaciones son la siguiente fase, aunque esos CRUD ya existen y se renderizan justo antes.
- La interfaz mezcla “skills”, “assets”, “PDF”, “CRUD” y términos en español; conviene un vocabulario consistente.
- Los iconos y acentos principales del resto del admin están almacenados correctamente; algunas herramientas de consola pueden mostrarlos mal por codificación, pero no se confirmó mojibake general en la UI administrativa.

## 14. Problemas por prioridad

### Crítico

1. Credenciales administrativas completas en `localStorage`.
2. SVG no sanitizado insertado como HTML, combinado con credenciales accesibles desde JavaScript.

### Alto

1. Pérdida potencial de avatar por ausencia de `avatar_asset_id` en la respuesta.
2. Uploads sin validación de tamaño, MIME, extensión/firma y drag and drop sin filtro real.
3. Carga inicial all-or-nothing que cierra sesión ante cualquier error.
4. Formularios sin validación cliente mínima.
5. Errores 422 poco legibles y no asociados a campos.
6. Descarga completa de todos los assets base64 al abrir el panel.

### Medio

1. Assets huérfanos al cancelar formularios y ausencia de mantenimiento seguro.
2. Assets tipo `icon` invisibles para el picker `icon_svg`.
3. PDF sin preview administrativa ni validación efectiva al soltar archivos.
4. Listas locales no reordenadas después de crear/editar.
5. Eliminaciones sin estado por elemento ni undo.
6. Modales sin Escape, focus trap, retorno de foco ni bloqueo de scroll.
7. `AdminNotice` desactualizado.
8. Cierre de modal durante upload múltiple sin cancelar el proceso.
9. Endpoint de borrado de mensajes no disponible en la interfaz.

### Bajo

1. Tildes faltantes en textos de galería.
2. Labels de “imagen” aplicados a documentos PDF.
3. CSS repetido en skills y selectores globales compartidos.
4. Falta de estados intermedios de grilla y `overflow-wrap`.
5. Sin preferencias de movimiento reducido.
6. Estados globales `errorMessage/successMessage` redundantes tras autenticar.

## 15. Recomendaciones concretas, sin implementar

### Seguridad

1. Dejar de persistir la contraseña en `localStorage`.
2. Sanitizar SVG en el backend antes de almacenarlo y evitar inyectarlo directamente en React.
3. Exigir HTTPS en cualquier entorno no local.

### Contratos y datos

1. Resolver `avatar_asset_id` usando `avatar.id` o ajustando el schema admin.
2. Formalizar tipos de asset (`image`, `avatar`, `icon_svg`, `document`) y compatibilidad con `icon` histórico.
3. Mantener `gallery_image_ids` como contrato ordenado; ya está correctamente implementado.

### Formularios

1. Añadir restricciones HTML coherentes con Pydantic.
2. Validar fechas/años cruzados, URLs, color y slug antes de enviar.
3. Convertir errores 422 en mensajes por campo.
4. Mantener el botón deshabilitado cuando faltan campos obligatorios o hay una operación activa.

### Multimedia

1. Validar tamaño y tipo antes de ejecutar `FileReader`.
2. Validar también drag and drop.
3. Mostrar progreso por archivo y permitir cancelar.
4. Añadir preview PDF y metadatos básicos.
5. Diseñar limpieza de assets huérfanos basada en referencias, nunca borrado ciego.

### Experiencia y responsividad

1. Cargar módulos de forma independiente y conservar sesión ante errores no relacionados con autenticación.
2. Añadir estados de eliminación por ID.
3. Reordenar listas locales según `display_order` después de guardar.
4. Corregir textos de galería y retirar `AdminNotice` obsoleto.
5. Mejorar accesibilidad de modales, focus visible y scroll de fondo.
6. Probar panel y pickers en los viewports indicados.

## 16. Límites de esta auditoría

- No se modificaron componentes, servicios, CSS, backend ni base de datos.
- No se ejecutaron operaciones CRUD ni uploads reales.
- La responsividad se evaluó desde reglas CSS, no mediante capturas en dispositivos.
- Los contratos se contrastaron con `admin_router.py`, `admin_schema.py` y los servicios existentes.
- No se ejecutó `reset_db.py` ni ningún script de escritura.
> Estado: documento histórico.
> No representa el diagnóstico o plan vigente.
> Se conserva únicamente para trazabilidad.

