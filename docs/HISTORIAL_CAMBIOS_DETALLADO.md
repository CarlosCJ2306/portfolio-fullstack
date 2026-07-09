# Historial de cambios detallado

Este archivo conserva el historial largo retirado de `CAMBIOS.md`. El resumen operativo vigente vive en [../CAMBIOS.md](../CAMBIOS.md).

Estado 7.0:

- `CAMBIOS.md` conserva el estado actual, 7.0, C1, C0 y cierre de Fase 6.
- Este archivo conserva la trazabilidad de fases anteriores, decisiones históricas, responsive, UX, pruebas y limpieza.
- Las auditorías y el plan PostgreSQL quedaron archivados en `docs/archive/`.

## Resumen de Fases 1–6

| Fase | Alcance histórico | Resultado |
|---|---|---|
| Fase 1 | Integración crítica, integridad SQLite, assets, uploads, SVG seguro y credenciales admin solo en memoria | Cerrada |
| Fase 2 | Frontend público resiliente, datos reales, fechas, PDF, galería y modales accesibles | Cerrada |
| Fase 3 | Panel administrativo: carga independiente, errores 422, validaciones, uploads, PDF, iconos, CRUD, mensajes y ciclo de vida de assets | Cerrada |
| Fase 4 | Responsividad pública y administrativa en móvil, tablet y escritorio | Cerrada |
| Fase 5 | Limpieza de textos, documentación, CSS, archivos dudosos y `.gitignore` | Cerrada |
| Fase 6 | QA técnica, backend temporal, checklist frontend, smoke tests, QA manual, responsive/accesibilidad, payload y cierre | Cerrada |

## Fase 1 — Integridad, seguridad y contratos base

- Se corrigió el contrato del perfil admin para conservar `avatar_asset_id`.
- Se activó `PRAGMA foreign_keys=ON` en conexiones SQLite.
- `check_db.py` pasó a reportar `foreign_keys`, `integrity_check` y `foreign_key_check`.
- Se protegió el borrado de `MediaAsset` referenciado por avatar, iconos, portada, galería o PDF.
- Se validaron tipos de assets en asociaciones admin:
  - `avatar` para avatar;
  - `image` para portada/galería;
  - `icon`/`icon_svg` para skills;
  - `document` PDF para certificaciones.
- Se agregaron límites de tamaño, MIME, extensión, Base64 y validación SVG básica.
- Se eliminó el vector XSS por SVG no confiable, evitando `dangerouslySetInnerHTML`.
- Las credenciales admin dejaron de persistirse en `localStorage`/`sessionStorage`; HTTP Basic quedó solo en memoria.
- No se ejecutó `reset_db.py`.

## Fase 2 — Frontend público

- Se desacoplaron `/api/public/home` y `/api/public/projects`.
- Los helpers HTTP dejaron de enviar `Content-Type` innecesario en GET/DELETE sin body.
- El formulario de contacto muestra errores reales y conserva datos ante fallos.
- Se retiraron fallbacks que aparentaban datos personales reales.
- Se corrigieron fechas, `is_current`, ciudad/país, años y certificaciones.
- `ProjectsSection` quedó alineado con la política SVG segura.
- El visor PDF público incorporó error visible, abrir/descargar y revocación controlada de Blob URL.
- Los modales públicos recibieron foco inicial, focus trap, retorno de foco, bloqueo de scroll, Escape y navegación por teclado.

## Fase 3 — Frontend administrativo

- Los módulos admin cargan de forma independiente.
- Solo 401/403 limpian la sesión en memoria.
- Errores 422 de FastAPI se muestran como mensajes legibles, no como `[object Object]`.
- Formularios admin incorporaron validaciones cliente alineadas con Pydantic.
- Pickers de imagen/galería muestran estado por archivo, validación previa, cancelación y fallos parciales.
- Certificaciones admin distinguen `credential_url` de documento PDF.
- Selector de iconos conserva compatibilidad con `icon` e `icon_svg` sin inyectar SVG crudo.
- CRUD admin agregó estados por ID, prevención de doble envío, orden local y actualización de conteos.
- Se documentó un ciclo de vida seguro para assets subidos antes de guardar: no hay borrado automático.
- Mensajes admin recibieron refresco manual y eliminación confirmada si el endpoint existe.

## Fase 4 — Responsividad y UX/UI

### Público

- Se corrigió doble padding entre página y secciones.
- Header público recibió navegación móvil compacta y `scroll-margin-top`.
- Modales de proyectos y certificaciones/PDF se ajustaron para 320px y viewports móviles.
- Se corrigieron reglas CSS que partían títulos letra por letra.
- Carrusel público usa área controlada, `object-fit: contain`, miniaturas compactas y zoom opcional.

### Admin

- Se corrigieron textos partidos letra por letra.
- Se agregó selector “Módulo visible” para móvil.
- En móvil se muestra un módulo admin a la vez.
- Stats/conteos quedaron compactos.
- Formularios, cards y acciones se reorganizaron visualmente sin cambiar lógica.
- Pickers, galería, documentos PDF y estados de upload se compactaron.
- Se revisó foco visible, targets táctiles, overflow y `prefers-reduced-motion`.

## Fase 5 — Limpieza, documentación y archivos dudosos

- Se corrigieron textos visibles con mojibake, tildes, separadores y metadatos básicos.
- `AdminNotice` fue retirado/ajustado cuando dejó de representar el estado real.
- Se revisaron duplicaciones CSS, selectores compartidos y wrappers/exports no usados.
- `README.md`, `backend/docs/API_FRONTEND.md`, planes y documentación contractual fueron alineados.
- Se creó/actualizó `docs/REVISION_ARCHIVOS_DUDOSOS.md`.
- Se reforzó `.gitignore`.
- Se documentó que `backend/venv` seguía pendiente para una limpieza Git futura.
- No se borraron archivos dudosos sin confirmación.

## Fase 6 — QA y cierre técnico

### 6.1 Línea base técnica y Git

- `check_db`, lint, build y estado de Git fueron revisados.
- Se documentaron riesgos de archivos sensibles/recreables.

### 6.2 Pruebas backend con SQLite temporal

- Se creó infraestructura de pruebas backend sobre SQLite temporal.
- Se protegió explícitamente contra uso de `portfolio.db`.
- Se validaron contratos públicos/admin, multimedia, galería, PDF, validaciones y assets.

### 6.3 Checklist técnico frontend

- Se validaron helpers HTTP, errores 422, carga parcial, galería, PDF, SVG seguro, validaciones admin y uploads.
- No se agregó una pila de testing frontend porque no existía infraestructura previa.

### 6.4 Smoke tests integración

- Se verificó backend local, frontend local, rutas públicas, rutas admin protegidas, CORS local y lecturas admin.
- No se realizaron CRUD reales.

### 6.5 QA manual funcional

- Se validaron home público, navegación, proyectos, galería, PDF, contacto inválido, login/logout, módulos admin, validaciones y errores.
- No se crearon ni eliminaron registros reales.

### 6.6 Responsive y accesibilidad

- Se revisaron viewports móviles, tablet y escritorio.
- Se validaron focus trap, Escape, foco visible, anclas, modales, admin móvil y ausencia de overflow crítico.

### 6.7 Payload y rendimiento

- Se midió el peso de endpoints públicos/admin y build.
- Se detectó payload multimedia pesado como bloqueo para despliegue inmediato.

### 6.8 Cierre de Fase 6

- Resultado: **Conditional Go para preparación, No-Go para despliegue inmediato**.
- Bloqueos: payload multimedia, limpieza Git, configuración productiva, persistencia SQLite en entorno no efímero y QA remoto.

## MVP, PDF, galería y marca

- Se completó el MVP de integración backend/frontend.
- Se implementó visor PDF modal simple para certificaciones públicas.
- Se corrigieron textos dañados en certificaciones.
- Se creó la galería de imágenes por proyecto:
  - backend con `ProjectImage`;
  - migración `project_images`;
  - admin con selección, subida múltiple, orden y retiro;
  - público con modal/carrusel.
- La portada principal siguió siendo `image_asset_id`.
- Se ajustó el carrusel para mostrar imágenes completas dentro de un contenedor controlado.
- Se actualizó favicon con `LogoCJ.ico`.
- Se corrigió logo visible del header.

## Actualización profesional previa a C0/C1

- Se aplicó una actualización profesional enfocada en Fofimatic usando un sincronizador idempotente y backup.
- Se mantuvieron assets y mensajes.
- Certificaciones provisionales quedaron inactivas sin borrar registros.
- Se creó `docs/CONTENIDO_PROFESIONAL_PORTAFOLIO.md`.
- Ese documento queda como histórico hasta que C3 actualice contenido con la hoja de vida completa.

## C0 y C1

C0 y C1 completos se conservan resumidos en [../CAMBIOS.md](../CAMBIOS.md):

- C0: auditoría y planificación de contenido profesional.
- C1: modelo, contratos, migración SQLite aditiva, pruebas y documentación.

## Archivos históricos archivados en 7.0

- Auditorías 2026-07-05: `docs/archive/auditorias-2026-07-05/`.
- Plan PostgreSQL histórico: `docs/archive/postgresql/PLAN_MIGRACION_POSTGRESQL.md`.
- Plan duplicado SQLite→PostgreSQL: eliminado del índice; recuperable desde Git.

## Restauración histórica

Si se necesita recuperar texto exacto de una entrada antigua, usar el historial de Git sobre:

- `CAMBIOS.md`
- `PLAN_TRABAJO_PORTFOLIO.md`
- documentos archivados en `docs/archive/`
