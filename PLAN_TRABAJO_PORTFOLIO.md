# Plan de trabajo del portfolio

Fecha: 2026-07-05  
Fuentes: `AUDITORIA_GENERAL.md`, `BACKEND_AUDITORIA.md`, `FRONTEND_PUBLICO_AUDITORIA.md` y `FRONTEND_ADMIN_AUDITORIA.md`.  
Estado actual: documento vivo; Fases 1 a 6 cerradas y preparacion de produccion activa bajo Conditional Go. La elaboracion inicial de este plan no modifico codigo.

## 1. Objetivo y reglas de ejecución

El objetivo es estabilizar la integración FastAPI/React, resolver riesgos de seguridad e integridad, mejorar las interfaces existentes y preparar un despliegue verificable sin reemplazar la arquitectura actual ni rehacer funcionalidades que ya funcionan.

Reglas para todas las fases:

- Conservar `projects.image_asset_id` como portada y `project_images` como galería adicional.
- Conservar `credential_url` y `certificate_file_id` como capacidades separadas.
- No ejecutar `reset_db.py` sobre la base real.
- Crear un backup comprobable antes de cualquier cambio de esquema o integridad.
- No eliminar assets, scripts, tablas o componentes dudosos sin comprobar referencias.
- Implementar una fase por vez y verificar sus criterios antes de continuar.
- Actualizar `CAMBIOS.md` y la documentación contractual al cerrar cada fase.

### Escala de prioridad

- **Crítica**: seguridad, pérdida de datos o ruptura directa de integración.
- **Alta**: fallo funcional importante, validación o resiliencia.
- **Media**: experiencia de usuario, accesibilidad, mantenimiento o consistencia.
- **Baja**: acabado, documentación o deuda sin impacto inmediato.

## 2. Fase 1: correcciones críticas de integración

Objetivo: eliminar riesgos de pérdida de referencias, cerrar incompatibilidades de contrato y establecer una frontera segura para archivos y administración.

| ID | Archivo probable | Descripción | Prioridad | Riesgo | Dependencias | Criterio de aceptación |
|---|---|---|---|---|---|---|
| 1.1 | `backend/app/schemas/admin_schema.py`, `backend/app/routers/admin_router.py`, `frontend/src/pages/AdminPage.jsx` | Corregir el contrato del perfil administrativo para conservar `avatar_asset_id`. Preferir una respuesta admin que incluya el ID y mantener en React un fallback a `avatar.id`. | Crítica | Bajo: cambio aditivo de respuesta; riesgo de limpiar avatar si queda incompleto. | Ninguna. | Abrir un perfil con avatar, editar solo texto y guardar dos veces conserva el mismo avatar y el selector sigue mostrando su ID/preview. |
| 1.2 | `backend/app/database/connection.py`, `backend/app/scripts/check_db.py` | Activar `PRAGMA foreign_keys=ON` en todas las conexiones SQLite mediante un evento del engine y ampliar el chequeo para confirmar foreign keys e integridad. | Crítica | Alto: restricciones antes inactivas pueden revelar datos inconsistentes; requiere backup y chequeo previo. | Backup de `backend/portfolio.db`; verificación actual sin violaciones. | Cada conexión informa `PRAGMA foreign_keys=1`, `integrity_check=ok` y `foreign_key_check` vacío; CRUD y galería siguen funcionando. |
| 1.3 | `backend/app/repositories/admin_repository.py`, `backend/app/services/admin_service.py`, `backend/app/routers/admin_router.py` | Proteger el borrado de `MediaAsset`: detectar usos en avatar, iconos, portadas, galería y certificados antes de eliminar. | Crítica | Medio: bloquear borrados antes permitidos; no debe borrar asociaciones automáticamente. | 1.2. | Un asset referenciado devuelve error claro y no cambia la base; un asset sin referencias puede eliminarse; retirar de galería no elimina el asset. |
| 1.4 | `backend/app/schemas/admin_schema.py`, `backend/app/services/admin_service.py`, `frontend/src/components/admin/AdminImagePicker.jsx`, `frontend/src/components/admin/AdminProjectGalleryPicker.jsx` | Definir tipos de asset y validar existencia/tipo para `avatar_asset_id`, `icon_asset_id`, `image_asset_id`, `gallery_image_ids` y `certificate_file_id`. Formalizar `document` y compatibilidad temporal con `icon`. | Crítica | Medio: datos históricos usan `icon` e `icon_svg`; una política rígida puede ocultarlos. | Inventario de tipos existentes; 1.2. | No se puede asociar PDF como portada ni imagen como certificado; IDs inexistentes reciben mensajes claros; assets históricos válidos siguen seleccionables. |
| 1.5 | `backend/app/schemas/admin_schema.py`, `backend/app/services/admin_service.py`, pickers administrativos | Añadir límites de tamaño, MIME/extensiones permitidas y validación básica de base64 antes de persistir. Validar también drag and drop antes de `FileReader`. | Crítica | Alto: límites mal elegidos pueden rechazar archivos actuales; base64 aumenta aproximadamente 33% el tamaño. | 1.4; definir límites por avatar, imagen y PDF. | Archivos válidos dentro del límite suben; archivos sobredimensionados, MIME no permitido o base64 inválido se rechazan antes del commit con mensaje comprensible. |
| 1.6 | `backend/app/services/admin_service.py`, `frontend/src/components/sections/SkillsSection.jsx`, `frontend/src/components/admin/AdminImagePicker.jsx`, `AdminProjectGalleryPicker.jsx`, `AdminSkillsPanel.jsx` | Eliminar el vector XSS de SVG: sanitizar con política estricta o dejar de inyectar `svg_content` mediante `dangerouslySetInnerHTML`. | Crítica | Alto: un sanitizador incompleto crea falsa seguridad; cambiar representación puede afectar iconos existentes. | 1.4; decisión documentada sobre soporte SVG. | SVG con scripts, eventos o referencias peligrosas no ejecuta código; iconos SVG seguros siguen visibles; no quedan inyecciones directas de SVG no confiable. |
| 1.7 | `frontend/src/services/adminApi.js`, `frontend/src/pages/AdminPage.jsx` y, si se cambia el mecanismo, `backend/app/core/admin_auth.py` / routers | Retirar usuario/contraseña de `localStorage`. Como corrección mínima, mantener HTTP Basic solo en memoria y requerir nuevo login tras recarga; evaluar autenticación por sesión/token para despliegue. | Crítica | Alto: cambia restauración automática de sesión y puede requerir coordinación backend si se adopta token. | 1.6 para cerrar primero el XSS; decisión de autenticación de despliegue. | `localStorage` y otros almacenamientos persistentes no contienen contraseña; logout limpia estado; todas las rutas admin siguen protegidas y una recarga exige autenticarse según la política elegida. |

### Cierre de Fase 1

- No existe pérdida de avatar al editar perfil.
- Foreign keys están activas y verificadas.
- Los assets referenciados no pueden borrarse accidentalmente.
- Uploads y asociaciones tienen política de tipo/tamaño.
- SVG no puede ejecutar contenido activo.
- La contraseña no permanece en almacenamiento persistente.

## 3. Fase 2: correcciones de frontend público

Objetivo: hacer que la portada se degrade correctamente ante fallos parciales y represente con precisión los datos del backend.

| ID | Archivo probable | Descripción | Prioridad | Riesgo | Dependencias | Criterio de aceptación |
|---|---|---|---|---|---|---|
| 2.1 | `frontend/src/pages/HomePage.jsx`, `frontend/src/services/publicApi.js` | Desacoplar `/api/public/home` y `/api/public/projects`: conservar home si falla proyectos y mostrar estado específico en la sección afectada. Añadir reintento. | Alta | Medio: cambios en estados pueden duplicar cargas si no se controlan efectos. | Fase 1 cerrada; contratos sin cambios pendientes. | Fallar `/projects` no oculta perfil/skills/resto; fallar `/home` muestra error útil; reintentar no recarga toda la aplicación. |
| 2.2 | `frontend/src/services/publicApi.js`, `frontend/src/services/adminApi.js` | No enviar `Content-Type: application/json` en GET/DELETE sin body; añadir cancelación con `AbortController` donde corresponda y mensajes por status. | Media | Bajo: revisar que POST/PUT/PATCH conserven headers. | 2.1 y 3.1 pueden compartir helper/patrón sin refactor general. | GET local funciona sin preflight innecesario; requests con JSON conservan header; desmontar no produce actualizaciones tardías. |
| 2.3 | `frontend/src/components/sections/HeroSection.jsx`, `ContactSection.jsx`, `Footer.jsx`, `HomePage.jsx` | Eliminar fallbacks que aparentan ser datos reales (`correo@example.com`, perfil personal inventado). Mostrar ausencia explícita u ocultar el dato. | Alta | Medio: la página puede verse más vacía cuando no existe perfil. | 2.1. | Sin perfil no se muestra correo falso ni identidad inventada; con perfil todos los datos reales se visualizan. |
| 2.4 | `frontend/src/components/sections/ExperienceSection.jsx`, `EducationSection.jsx`, `CertificationsSection.jsx` | Usar correctamente `is_current`, `country`, fechas y años; localizar presentación de fechas sin cambiar el contrato. | Media | Bajo: zonas horarias pueden desplazar fechas si se construyen como `Date` UTC. | Ninguna. | “Actualidad” solo aparece cuando corresponde; ciudad/país se combinan; fechas se muestran consistentemente en español. |
| 2.5 | `frontend/src/components/sections/ProjectsSection.jsx` | Alinear representación de SVG con la política de Fase 1: soportar solo formatos seguros acordados o mostrar fallback claro. Mantener portada + galería y `object-fit: contain`. | Alta | Medio: no reintroducir `dangerouslySetInnerHTML`. | 1.4 y 1.6. | Toda imagen permitida por backend se muestra o presenta fallback explícito; portada, orden, miniaturas, zoom y deduplicación siguen funcionando. |
| 2.6 | `frontend/src/components/sections/CertificationsSection.jsx`, `.css` | Añadir error visible y fallback “Abrir/descargar” cuando el navegador no previsualice PDF; centralizar revocación de Blob URL. | Media | Medio: soporte de PDF varía por navegador; URLs deben revocarse en el momento correcto. | Política de PDF de 1.4/1.5. | PDF válido abre en modal; existe alternativa usable; base64 inválido muestra error; cada Blob URL se revoca una sola vez al cerrar/desmontar. |
| 2.7 | `frontend/src/components/sections/ContactSection.jsx`, `publicApi.js` | Mostrar errores reales de validación/red sin culpar siempre al backend y conservar el formulario cuando falla. | Media | Bajo: evitar exponer detalles técnicos sensibles. | Helper de errores de 2.2. | 422 muestra campos/mensaje útil, error de red se diferencia, éxito limpia formulario y fallo conserva lo escrito. |
| 2.8 | `frontend/src/components/sections/ProjectsSection.jsx`, `CertificationsSection.jsx` | Completar accesibilidad funcional de modales: foco inicial, focus trap, retorno de foco, bloqueo de scroll, estado de miniatura y teclas de navegación. | Media | Medio: una gestión incorrecta de foco puede atrapar al usuario. | 2.5 y 2.6. | Solo se tabula dentro del modal, Escape cierra, foco vuelve al disparador, fondo no desplaza y carrusel anuncia imagen activa. |

### Cierre de Fase 2

- La vista pública conserva contenido ante errores parciales.
- No presenta información personal ficticia.
- Experiencia, fechas, galería y PDF representan correctamente el contrato.
- Modales son utilizables con teclado y navegadores sin visor PDF embebido.

## 4. Fase 3: correcciones de frontend administrativo

Objetivo: reforzar formularios, errores, uploads y estado local sin rediseñar el panel.

| ID | Archivo probable | Descripción | Prioridad | Riesgo | Dependencias | Criterio de aceptación |
|---|---|---|---|---|---|---|
| 3.1 | `frontend/src/pages/AdminPage.jsx`, `frontend/src/services/adminApi.js` | Cargar módulos de forma independiente y borrar credenciales solo ante 401/403, no por cualquier fallo de red o módulo. Añadir reintento por carga. | Alta | Medio: el dashboard puede quedar parcialmente cargado; hay que identificar estados por módulo. | 1.7; helper HTTP de 2.2. | Un fallo de media assets no cierra sesión ni oculta proyectos; 401 sí solicita login; reintento recupera el módulo fallido. |
| 3.2 | `frontend/src/services/adminApi.js`, `frontend/src/pages/AdminPage.jsx`, paneles de formularios | Convertir `detail` 422 de FastAPI en mensajes legibles por campo; mantener toast para resumen y error junto al formulario/campo. | Alta | Medio: múltiples formatos de error requieren fallback. | 3.1. | Un proyecto vacío muestra “title/slug...” y no `[object Object]`; mensajes extensos permanecen visibles hasta corregir o cerrar. |
| 3.3 | `AdminAuthCard.jsx`, `AdminProfilePanel.jsx`, `AdminSocialLinksPanel.jsx`, `AdminSkillsPanel.jsx`, `AdminProjectsPanel.jsx`, `AdminExperiencePanel.jsx`, `AdminEducationPanel.jsx`, `AdminCertificationsPanel.jsx` | Añadir validación cliente coherente con Pydantic: requeridos, longitudes, URL, color, slug, cronología y rangos de años. | Alta | Medio: reglas frontend y backend pueden divergir. | 3.2; documentar reglas desde schemas. | Datos inválidos no se envían; cada mensaje identifica el campo; datos válidos actuales siguen guardando. |
| 3.4 | `frontend/src/components/admin/AdminImagePicker.jsx`, `AdminProjectGalleryPicker.jsx` | Mejorar estado de upload: progreso por archivo, validación antes de lectura, impedir cierre accidental o avisar que continúa, permitir cancelar cuando sea viable. | Alta | Medio: cancelación requiere `AbortController` y coordinación con requests ya enviadas. | 1.5 y helper 2.2. | En 3 archivos se ve progreso individual; un fallo no elimina éxitos; archivo inválido no se lee/sube; el usuario entiende qué ocurrió al cerrar. |
| 3.5 | `frontend/src/components/admin/AdminCertificationsPanel.jsx`, `AdminImagePicker.jsx` | Adaptar labels al tipo documento, mostrar nombre/MIME/tamaño disponible y preview/acción de apertura PDF. | Media | Bajo: no duplicar el visor público innecesariamente. | 2.6 y 3.4. | Para PDF se lee “documento/PDF”, se identifica el archivo asociado y se puede previsualizar o abrir sin confundirlo con una imagen. |
| 3.6 | `frontend/src/pages/AdminPage.jsx`, paneles CRUD | Añadir estados de eliminación por ID, evitar doble envío, reordenar listas por `display_order` después de crear/editar y refrescar conteos cuando sea necesario. | Media | Medio: orden local debe coincidir con desempate backend. | 3.1. | Solo el elemento en proceso se deshabilita; no hay DELETE duplicado; orden y contadores coinciden después de guardar sin recargar. |
| 3.7 | `frontend/src/components/admin/AdminImagePicker.jsx`, `AdminSkillsPanel.jsx`, datos existentes | Hacer compatible el selector de iconos con `icon` e `icon_svg` según la política definida, sin duplicar assets. | Media | Medio: cambiar tipos históricos puede romper relaciones si se migra mal. | 1.4 y backup si se normaliza DB. | Iconos históricos y nuevos se muestran/seleccionan; no se crean asociaciones inválidas. |
| 3.8 | `frontend/src/pages/AdminPage.jsx`, `AdminImagePicker.jsx`, `AdminProjectGalleryPicker.jsx`, posible servicio/reporte backend | Definir ciclo de vida de assets subidos antes de guardar. No borrar automáticamente: identificar huérfanos y ofrecer mantenimiento seguro basado en referencias. | Media | Alto: una limpieza incorrecta puede borrar portada, PDF o galería activa. | 1.3; 3.4. | Cancelar formulario no provoca borrado de assets usados; existe inventario verificable de huérfanos antes de cualquier eliminación. |
| 3.9 | `frontend/src/components/admin/AdminMessagesPanel.jsx`, `adminApi.js` | Decidir y, si se autoriza, exponer eliminación de mensajes existente en backend y refresco manual. | Baja | Medio: eliminación es irreversible. | Política del propietario; 3.6. | Si se implementa, requiere confirmación y actualiza contador/lista; si no, queda documentado como fuera de alcance. |

### Cierre de Fase 3

- El panel no pierde sesión por fallos no autenticativos.
- Los formularios bloquean datos inválidos y muestran errores útiles.
- Uploads informan progreso y respetan las reglas de backend.
- CRUD, orden, conteos, iconos y PDF quedan sincronizados.

## 5. Fase 4: responsividad móvil, tablet y escritorio

Objetivo: corregir layout y modales en los viewports reales sin rediseño general.

| ID | Archivo probable | Descripción | Prioridad | Riesgo | Dependencias | Criterio de aceptación |
|---|---|---|---|---|---|---|
| 4.1 | `frontend/src/styles/global.css`, `frontend/src/pages/HomePage.jsx`, CSS de secciones | Eliminar el doble padding entre `.page` y las secciones. Separar estilos de página normal de los estados de carga/error. | Alta | Medio: cambia el ancho/fondo de todas las secciones. | Fase 2 cerrada. | Fondos llegan a los bordes, no hay overflow horizontal y un viewport de 320 px conserva padding útil sin estrechar cards en exceso. |
| 4.2 | `frontend/src/components/layout/Header.jsx`, `.css` | Añadir padding seguro, navegación móvil compacta y `scroll-margin-top` para anclas bajo header sticky. | Alta | Medio: menú colapsable implica estado/accesibilidad. | 4.1. | En 320/375 px el header no ocupa varias pantallas, es navegable por teclado y ningún título queda oculto tras saltar a una sección. |
| 4.3 | `ProjectsSection.css/.jsx`, `CertificationsSection.css/.jsx` | Validar y ajustar altura del visor, controles móviles, miniaturas, zoom y PDF en orientación vertical/horizontal. | Alta | Medio: reducir controles puede afectar funciones ya verificadas. | 2.5, 2.6 y 2.8. | Imágenes verticales, horizontales, pequeñas y grandes se ven completas; controles no reducen indebidamente el stage; PDF conserva botón de cierre. |
| 4.4 | `frontend/src/styles/AdminLayout.css`, CSS de stats/paneles/topbar | Afinar transiciones 5→2→1 y 3→2→1, tamaños de cards, acciones y formularios en tablet/escritorio. | Media | Bajo: cambios CSS aislados. | Fase 3 cerrada. | Panel usable sin overflow a 768/1024/1180/1440 px; columnas aprovechan espacio sin campos estrechos. |
| 4.5 | `AdminImagePicker.css`, `AdminProjectGalleryPicker.css`, JSX de pickers | Apilar preview/controles en pantallas estrechas y revisar modales, dropzones, grids y acciones. | Media | Bajo. | 3.4 y 3.5. | A 320/375 px todos los botones son visibles, nombres truncan correctamente y modal no desborda. |
| 4.6 | CSS global/público/admin | Añadir `overflow-wrap`, `:focus-visible` y `prefers-reduced-motion`; comprobar targets táctiles. | Media | Bajo: puede alterar animaciones y saltos de texto. | 2.8 y cierre visual de 4.1–4.5. | Cadenas largas no rompen cards; foco siempre visible; movimiento reducido desactiva animaciones no esenciales; controles táctiles son cómodos. |

### Matriz mínima de viewports

- Móvil pequeño: 320 × 568.
- Móvil común: 375 × 667 y 390 × 844.
- Tablet vertical/horizontal: 768 × 1024 y 1024 × 768.
- Escritorio: 1180, 1440 y 1920 px de ancho.

## 6. Fase 5: limpieza de código, textos y componentes innecesarios

Objetivo: retirar contradicciones y duplicación confirmada sin borrar código dudoso.

| ID | Archivo probable | Descripción | Prioridad | Riesgo | Dependencias | Criterio de aceptación |
|---|---|---|---|---|---|---|
| 5.1 | `HomePage.jsx`, `EducationSection.jsx`, `ProjectsSection.jsx`, `AdminProjectGalleryPicker.jsx`, `AdminProjectsPanel.jsx` y documentación afectada | Corregir mojibake confirmado, tildes y separador `Â·`; revisar UTF-8 sin conversiones masivas ciegas. | Alta | Medio: una recodificación global puede corromper texto ya correcto. | Fases 2–4 para no generar conflictos. | No quedan literales visibles `Ã`, `Â`, `â` o `ðŸ`; “Galería”, “imágenes”, “posición”, “práctico” y “descripción” están correctos. |
| 5.2 | `frontend/src/components/admin/AdminNotice.jsx`, `.css`, `AdminPage.jsx` | Retirar o actualizar el aviso obsoleto que presenta CRUD ya implementados como “siguiente fase”. | Media | Bajo. | Fase 3 cerrada. | El panel no contradice sus capacidades; si se elimina, no queda import/CSS huérfano. |
| 5.3 | `frontend/src/components/admin/AdminSkillsPanel.css`, `AdminProjectsPanel.css` | Eliminar bloques CSS duplicados y acotar `.entity-card__content` para evitar colisiones entre paneles. | Media | Medio: la cascada actual puede ocultar dependencias visuales. | Capturas/baseline de Fase 4. | No hay reglas duplicadas; proyectos y skills conservan layout en todos los breakpoints. |
| 5.4 | `frontend/src/services/publicApi.js`, `adminApi.js` | Revisar wrappers exportados no usados y estados redundantes. Eliminar solo tras `rg`, lint y comprobación de consumidores. | Baja | Medio: pueden ser API pública interna prevista. | Fases 2 y 3. | Cada export tiene consumidor o justificación documental; lint/build siguen pasando. |
| 5.5 | `frontend/index.html`, `Footer.jsx`, textos de encabezados | Corregir `lang="es"`, título, metadatos básicos y consistencia de términos español/inglés; alinear “Proyectos destacados” con la lista real. | Media | Bajo: impacto SEO/textual. | Fase 2. | Idioma y título son correctos; heading describe todos los proyectos; no se muestran placeholders editoriales falsos. |
| 5.6 | `README.md`, `backend/docs/API_FRONTEND.md`, `CAMBIOS.md`, auditorías/plan | Actualizar documentación para reflejar contratos y archivos existentes; no afirmar que archivos actuales son “futuros”. | Media | Bajo. | Fases 1–5 concluidas. | README, contrato API y plan no se contradicen; comandos y variables coinciden con el código. |
| 5.7 | `backend/update_db.py`, `backend/app/scripts/test_log.py`, `reset_db.py`, modelo `User`, backups/artefactos | Revisión manual de archivos dudosos. No eliminar backups, DB, migración de galería ni scripts destructivos sin decisión explícita. | Baja | Alto si se elimina algo útil o un backup. | Git inicializado con historial recuperable; decisión del propietario. | Cada candidato queda clasificado como conservar, archivar o eliminar con motivo y restauración; ninguna eliminación dudosa. |

### Cierre de Fase 5

- Texto visible y documentación usan UTF-8 correcto.
- No quedan componentes que anuncien estados falsos.
- CSS duplicado confirmado está eliminado y selectores están acotados.
- Todo archivo retirado tiene justificación y recuperación desde Git.

## 7. Fase 6: pruebas manuales y técnicas

Objetivo: demostrar los criterios anteriores sobre una copia segura de datos y evitar regresiones.

**Estado vigente: CERRADA en su alcance de QA.**

La tabla original de esta seccion se conserva como backlog conceptual historico. La numeracion operativa realmente ejecutada y usada por `docs/QA_FASE_6.md` y `CAMBIOS.md` es la siguiente:

| Lote operativo | Alcance ejecutado | Estado |
|---|---|---|
| 6.1 | Linea base tecnica, check_db, lint/build y revision Git | Cerrado |
| 6.2 | 20 pruebas backend con SQLite temporal | Cerrado |
| 6.3 | Checklist tecnico frontend | Cerrado |
| 6.4 | Smoke tests de integracion frontend/backend | Cerrado |
| 6.5 | Checklist manual funcional completo | Cerrado con escrituras reales fuera de alcance |
| 6.6 | Matriz responsive y accesibilidad | Cerrado |
| 6.7 | Payload y rendimiento base | Cerrado con bloqueos de produccion identificados |
| 6.8 | Cierre formal y decision de despliegue | Cerrado |

### Backlog conceptual original de Fase 6

| ID | Archivo probable | Descripción | Prioridad | Riesgo | Dependencias | Criterio de aceptación |
|---|---|---|---|---|---|---|
| 6.1 | Nueva carpeta `backend/tests/`, `backend/requirements.txt` si falta runner | Crear pruebas de contrato para rutas públicas/admin, perfil con avatar, relaciones multimedia, galería ordenada, PDF y errores de validación. Usar DB temporal, nunca `portfolio.db`. | Alta | Medio: fixtures mal configuradas podrían apuntar a la DB real. | Fases 1–3. | Tests crean/usan una SQLite temporal; comprueban status y campos; la base real no cambia. |
| 6.2 | Posible configuración de pruebas frontend o checklist documentado | Probar helpers y componentes críticos: parseo 422, carga parcial, construcción de galería, validación de formulario y Blob PDF. Evitar instalar framework si el valor no justifica el alcance. | Media | Bajo/medio por nuevas dependencias. | Fases 2–3. | Los flujos críticos tienen prueba automática o caso manual reproducible; fallos generan salida clara. |
| 6.3 | `backend/app/scripts/check_db.py`, script de galería existente | Ejecutar verificación técnica: conexión, `foreign_keys=1`, integridad, foreign key check y estructura `project_images`. | Crítica | Bajo si es lectura; cualquier corrección requiere backup aparte. | 1.2 y backup. | Todos los checks retornan OK y cero violaciones antes y después de pruebas CRUD. |
| 6.4 | Frontend existente | Ejecutar `npm run lint` y `npm run build`; revisar que build use `.env` esperada y no incluya secretos. | Alta | Bajo; `dist` se regenera. | Fases 1–5. | Ambos comandos terminan con código 0; no aparecen credenciales/base real en `dist`. |
| 6.5 | Backend existente | Iniciar FastAPI y ejecutar smoke tests sobre `/`, públicos, login y CRUD controlado en entorno de prueba. | Alta | Medio: no usar DB real para operaciones destructivas. | 6.1 y entorno de prueba. | Rutas responden según contrato; CORS local funciona; CRUD completo pasa sin tocar datos reales. |
| 6.6 | Checklist manual dentro del plan o documento de QA | Probar perfil, skills, proyectos, portada, galería 0/1/N, reordenar, retirar, PDF, credential URL, contacto, mensajes, logout y errores. | Alta | Bajo. | 6.3–6.5. | Cada caso tiene resultado esperado, resultado real y evidencia; no quedan bloqueos abiertos. |
| 6.7 | Navegadores/dispositivos | Ejecutar matriz responsiva y accesible con teclado en Chrome/Edge/Firefox y al menos un navegador móvil. | Alta | Bajo. | Fase 4 y 6.4. | No hay overflow; modales y formularios funcionan por teclado/táctil; PDF tiene fallback donde iframe no funciona. |
| 6.8 | Herramientas del navegador | Medir payload y memoria de `/home`, `/projects`, `/media-assets` y PDF; establecer umbrales antes de despliegue. | Media | Bajo. | Datos representativos y Fases 2–3. | Se documentan tamaños/tiempos; ningún endpoint supera el umbral acordado o existe tarea de mitigación bloqueante. |

### Checklist manual mínimo

1. Cargar portada con backend disponible, no disponible y `/projects` fallando por separado.
2. Ver estados vacíos de cada sección.
3. Crear proyecto sin imagen, con portada, con una adicional y con varias.
4. Editar proyecto sin cambiar portada; reordenar y vaciar galería.
5. Confirmar que retirar de galería no elimina el asset global.
6. Navegar carrusel, miniaturas y zoom con mouse, teclado y táctil.
7. Crear certificación con URL, con PDF y con ambos; abrir modal y fallback.
8. Editar perfil dos veces sin perder avatar.
9. Probar validaciones 422 y archivos inválidos/sobredimensionados.
10. Verificar login, expiración/error, logout y ausencia de contraseña persistida.

### Cierre operativo de Fase 6

- QA tecnico: aprobado.
- QA funcional: aprobado sin operaciones CRUD sobre datos reales.
- Integracion local, responsive y accesibilidad: aprobadas.
- Integridad SQLite: aprobada.
- Rendimiento/payload: bloqueante para despliegue inmediato.
- Decision: **CONDITIONAL GO para preparacion de produccion, NO-GO para despliegue inmediato.**
- Evidencia consolidada: `docs/QA_FASE_6.md`, seccion Fase 6.8.

## 8. Fase 7: preparación para despliegue

Objetivo: convertir la configuración local en una operación reproducible y segura.

Esta fase original queda refinada por la seccion **Preparacion de produccion: Vercel + Render + PostgreSQL**. Sus tareas siguen siendo referencia, pero no autorizan un despliegue directo ni consideran SQLite local como persistencia definitiva para Render.

| ID | Archivo probable | Descripción | Prioridad | Riesgo | Dependencias | Criterio de aceptación |
|---|---|---|---|---|---|---|
| 7.1 | `backend/app/core/config.py`, `backend/app/main.py`, `backend/.env.example` | Externalizar CORS por variable de entorno y separar valores development/production. No permitir wildcard con credenciales. | Crítica | Alto: CORS incorrecto puede bloquear frontend o abrir orígenes no deseados. | Dominio final definido; Fase 6 completa. | Solo los orígenes configurados acceden; local y producción tienen ejemplos válidos; preflight admin funciona. |
| 7.2 | `frontend/.env.example`, configuración del proveedor/build | Configurar `VITE_API_BASE_URL` de producción y documentar que se incorpora en build. | Crítica | Medio: una URL incorrecta deja la SPA sin API. | URL pública backend y 7.1. | Build de producción llama exclusivamente al backend esperado por HTTPS. |
| 7.3 | Configuración de hosting (Nginx, proveedor estático o equivalente) | Configurar fallback SPA para que `/admin` y rutas directas devuelvan `index.html`, manteniendo archivos estáticos. | Alta | Medio: fallback mal ordenado puede interceptar assets. | Proveedor elegido; build 6.4. | Abrir/refrescar `/admin` directamente carga login; favicon, logo y assets responden correctamente. |
| 7.4 | Secretos del entorno, `backend/app/core/config.py`, `.env.example` | Eliminar fallbacks inseguros en producción, usar credenciales fuertes y separar acceso admin/documentación. | Crítica | Alto: una mala gestión puede filtrar secretos o bloquear acceso. | 1.7; gestor de secretos elegido. | Ningún secreto está en Git/dist/logs; producción falla de forma segura si faltan secretos; credenciales por defecto no funcionan. |
| 7.5 | Infraestructura HTTPS/proxy, comandos de ejecución | Definir HTTPS, proxy confiable, proceso Uvicorn y política de reinicio/logs. | Crítica | Alto: HTTP expone Basic auth; proxy incorrecto afecta URLs/origen. | 7.1, 7.2 y 7.4. | Todo tráfico externo usa HTTPS; health check y logs funcionan; reinicio no pierde datos. |
| 7.6 | `backend/portfolio.db`, scripts de migración/check y procedimiento operacional | Documentar backup, restauración, permisos, migraciones idempotentes y rollback. No desplegar backups dentro del directorio público. | Crítica | Alto: SQLite requiere disciplina de copia/escritura concurrente. | 1.2, 6.3 y destino persistente definido. | Backup restaurado en ensayo; migración/check pasan; reinicio conserva DB; `reset_db.py` no forma parte del deploy. |
| 7.7 | Arquitectura de media/API, posible storage externo | Decidir si base64/SQLite soporta el volumen medido. Si no, planificar URLs/streaming, miniaturas y almacenamiento externo sin cambiar contratos de golpe. | Alta | Alto: migrar archivos puede romper referencias y aumentar alcance. | Métricas 6.8. | Decisión documentada con umbral; si se mantiene base64, payload cumple objetivo; si se migra, existe plan con compatibilidad y rollback. |
| 7.8 | Headers del proxy/app e `index.html` | Añadir headers de seguridad y SEO mínimos compatibles: CSP diseñada para Blob PDF, `X-Content-Type-Options`, referrer policy, título/descripción. | Alta | Medio: CSP puede bloquear Blob, iframe o imágenes data URL. | 1.6, 2.6, 5.5 y dominio final. | CSP bloquea inline peligroso sin romper imágenes/PDF; auditoría del navegador no reporta recursos esenciales bloqueados. |
| 7.9 | `.gitignore`, repositorio, pipeline | Verificar que `.env`, DB, backups, logs, `venv`, `node_modules` y `dist` no se publiquen accidentalmente; crear pipeline de lint/build/tests. | Crítica | Alto: el repositorio actual aparece completamente no rastreado y el primer commit puede incluir datos sensibles. | Git/historial revisado; Fase 6. | `git status` previo al commit no incluye secretos ni DB; CI ejecuta pruebas/lint/build; artefactos se generan en pipeline. |
| 7.10 | Entorno desplegado | Ejecutar smoke test post-deploy y procedimiento de rollback. | Crítica | Medio: pruebas de escritura deben usar registros controlados. | 7.1–7.9. | Portada, admin, CRUD controlado, galería, PDF, contacto, CORS, HTTPS y persistencia pasan; rollback ensayado/documentado. |

### Cierre de Fase 7

- Frontend y backend usan URLs/orígenes de producción correctos.
- Administración y documentación no dependen de credenciales por defecto.
- HTTPS es obligatorio.
- Base de datos, backups y migraciones tienen procedimiento probado.
- El primer commit y el artefacto desplegado no contienen secretos.
- Existe evidencia de smoke test y ruta de rollback.

## Preparación de producción: Vercel + Render + PostgreSQL

Estado: **siguiente etapa autorizada bajo Conditional Go**. No equivale a autorizacion de despliegue inmediato.

Arquitectura objetivo:

- React/Vite en Vercel.
- FastAPI en Render.
- PostgreSQL persistente, con proveedor por decidir entre alternativas como Neon o Supabase.
- El frontend consume exclusivamente FastAPI; nunca se conecta directamente a PostgreSQL.
- FastAPI obtiene la conexion mediante `DATABASE_URL` y secretos del entorno.

| Lote | Objetivo | Dependencia | Criterio de salida |
|---|---|---|---|
| Produccion 1 | Optimizar payload multimedia publico/admin y eliminar transporte duplicado de portada | Metricas Fase 6.7 | `/projects`, `/media-assets` y carga inicial se remiden y dejan de estar en riesgo alto o existe mitigacion aprobada |
| Produccion 2 | Compatibilidad PostgreSQL y migracion controlada desde SQLite | Produccion 1; backup verificado | Esquema/datos migran en ensayo, integridad pasa y rollback esta documentado |
| Produccion 3 | Limpieza Git y retirada reversible de `backend/venv` | Working tree revisado | `venv`, DB, backups, logs, `.env`, `dist` y dependencias no aparecen en el indice/publicacion |
| Produccion 4 | Configuracion Vercel | URL staging del backend | Build usa API HTTPS correcta; fallback SPA permite abrir/recargar `/admin` |
| Produccion 5 | Configuracion Render | PostgreSQL staging y secretos definidos | Backend inicia con comando productivo, health funciona, CORS permite solo origenes configurados |
| Produccion 6 | Despliegue de prueba/staging | Produccion 1-5 | Frontend, backend y DB persisten/reinician sin perdida y no exponen secretos |
| Produccion 7 | Smoke tests remotos | Staging disponible | Publico, admin, CORS, HTTPS, galeria, PDF y persistencia pasan en remoto |
| Produccion 8 | Produccion final y rollback | Staging aprobado | Despliegue final controlado, monitorizado y con rollback ensayado |

El primer lote siguiente es **Produccion 1: optimizacion de payload multimedia**. No iniciar Vercel, Render ni PostgreSQL de produccion antes de cerrar los bloqueos correspondientes.

## 9. Orden de ejecución resumido

```text
Fase 1  Integridad, contratos, uploads y seguridad
   ↓
Fase 2  Frontend público resiliente
   ↓
Fase 3  Administración validada y sincronizada
   ↓
Fase 4  Responsividad y accesibilidad visual
   ↓
Fase 5  Limpieza y documentación
   ↓
Fase 6  Pruebas y métricas
   ↓
Fase 7  Configuración y despliegue seguro
```

No debe iniciarse la Fase 7 con pendientes críticos de Fase 1 o fallos de aceptación de Fase 6.

## 10. Comandos de verificación previstos

Estos comandos se documentan para las fases de implementación; no se ejecutaron al crear este plan.

### Frontend — CMD

```cmd
cd /d C:\Users\USER\Documents\Proyectos_CJ\portfolio-fullstack\frontend
npm run lint
npm run build
```

### Backend — CMD

```cmd
cd /d C:\Users\USER\Documents\Proyectos_CJ\portfolio-fullstack\backend
venv\Scripts\python.exe -m app.scripts.check_db
venv\Scripts\python.exe -m app.scripts.migrate_project_gallery
venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

La migración de galería debe usarse solo como verificación idempotente sobre una base respaldada; nunca sustituirla por `reset_db.py`.

### Estado Git — CMD

```cmd
cd /d C:\Users\USER\Documents\Proyectos_CJ\portfolio-fullstack
git status --short
git check-ignore -v backend\.env frontend\.env backend\portfolio.db backend\portfolio_backup_antes_galeria_real.db frontend\node_modules frontend\dist
```

## 11. Definición global de terminado

El portfolio estará listo para despliegue cuando:

- todos los criterios de aceptación críticos y altos estén cerrados;
- lint, build, pruebas backend, integridad SQLite y smoke tests pasen;
- portada, CRUD, galería y PDF funcionen en la matriz de viewports/navegadores;
- no se persistan credenciales administrativas en el navegador;
- no exista ejecución de SVG no confiable;
- no haya foreign keys huérfanas ni borrado inseguro de assets;
- CORS, HTTPS, SPA fallback, secretos, backups y rollback estén probados;
- Git y artefactos no incluyan `.env`, DB, backups, logs o dependencias locales.
## 12. Estado real actual

Este bloque resume el estado vigente del proyecto sin borrar el historial del plan:

- Fase 1: cerrada.
- Fase 2: cerrada.
- Fase 3: cerrada.
- Fase 4: cerrada.
- Fase 5: lote 1 cerrado, lote 2 cerrado, lote 3 cerrado con esta actualizacion documental.
- Fase 5: lote 4 cerrado con la revisión segura de archivos dudosos; Fase 5 cerrada.
- Fase 6: cerrada en su alcance de QA; decision formal registrada en Fase 6.8.
- Preparacion de produccion: siguiente etapa activa bajo Conditional Go.
- Despliegue inmediato: No-Go hasta resolver persistencia, payload, Git y configuracion productiva.
- Fase 7 original: refinada en los lotes Produccion 1 a Produccion 8; no se considera completada.

Notas operativas:

- `backend/venv/` aparece actualmente versionado segun la revision y debe resolverse antes de publicar o subir el repositorio, si aplica.
- `portfolio.db`, backups, logs y `.env` no deben subirse a Git.

La documentacion contractual, el README y `CAMBIOS.md` deben leerse junto con este estado actualizado para evitar contradicciones.

