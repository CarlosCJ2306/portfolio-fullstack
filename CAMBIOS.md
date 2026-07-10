# Cambios realizados

## Estado actual

- Fases 1-6 cerradas.
- C0, C1, C2 y C3 cerrados técnicamente.
- C4 cerrado con decisión editorial GO.
- Fase 7.1 cerrada técnicamente.
- Fase 7.2 es el siguiente lote.
- SQLite es el motor vigente.
- PostgreSQL queda fuera del alcance activo.
- Estado: **Conditional Go** para preparación; sin despliegue inmediato.
- Historial extenso: [docs/HISTORIAL_CAMBIOS_DETALLADO.md](docs/HISTORIAL_CAMBIOS_DETALLADO.md).

## 2026-07-10 - Fase 7.1: optimización segura del payload multimedia

Se separó la metadata de multimedia del contenido pesado para evitar transportar Base64, SVG y PDF dentro de respuestas JSON generales, sin modificar `portfolio.db`, sin CRUD real, sin migraciones, sin despliegue y sin commit.

- Schemas públicos y administrativos de `MediaAsset` ahora entregan metadata ligera y `content_url`.
- Nuevos endpoints de contenido bajo demanda:
  - `GET /api/public/media-assets/{asset_id}/content`;
  - `GET /api/admin/media-assets/{asset_id}/content`.
- La ruta pública solo permite descargar assets activos referenciados por contenido público autorizado.
- `allow_public_images=false` mantiene ocultas portada/galería en JSON público y también bloquea su contenido por endpoint público.
- La ruta admin requiere Basic Auth y permite obtener el contenido de los assets para su gestión.
- Frontend público actualizado para usar `content_url` en avatar, skills, proyectos y PDF/certificaciones cuando exista.
- Frontend admin actualizado para usar fetch autenticado y Blob URLs en previews, galería, iconos y PDF.
- Las respuestas generales ya no incluyen `data_base64` ni `svg_content`.

Mediciones:

- `/api/public/home`: 379.794 B -> 16.386 B.
- `/api/public/profile`: 364.532 B -> 1.124 B.
- `/api/admin/media-assets`: 10.858.065 B -> 3.203 B.
- `/api/admin/projects`: 10.245.867 B -> 13.992 B.
- `/api/admin/certifications`: 121.420 B -> 837 B.
- Preview de build: 8 requests, 1.005.446 B, cero fallos y cero errores relevantes de consola.

Verificaciones:

- Backend `pytest -q`: 37 pruebas aprobadas.
- `check_db`: `foreign_keys=1`, `integrity_check=ok` y cero violaciones.
- Frontend `npm run lint`: aprobado.
- Frontend `npm run build`: aprobado.
- `git diff --check`: aprobado.
- `portfolio.db` conservó tamaño y fecha; hash final registrado sin abrir ni modificar datos.

Documentación:

- Se creó `docs/PAYLOAD_FASE_7_1.md`.
- Se actualizó `backend/docs/API_FRONTEND.md`.
- Se actualizó README y plan vigente.

Siguiente lote: **Fase 7.2 — limpieza Git y retirada de `backend/venv` del índice**.

## 2026-07-10 - C3: actualización definitiva del contenido profesional

Se aplicó la sincronización editorial C3 sobre SQLite real, con backup verificado, dry-run previo, ejecución transaccional e idempotencia posterior.

- Perfil actualizado como “Egresado de Ingeniería de Sistemas | Desarrollador Python y Full Stack”.
- Fofimatic quedó activo/publicable, finalizado en marzo de 2026 y con `is_current=false`.
- Kodland quedó incorporado como experiencia activa/publicable, finalizada en febrero de 2026 y con `is_current=false`.
- Seis proyectos profesionales quedaron activos, confidenciales, sin imágenes públicas, sin demo y sin repositorio.
- Tres proyectos quedaron destacados: CRM empresarial modular, automatización de flujo de caja y centros de costos, e inteligencia de negocio y reportería empresarial.
- 41 skills quedaron activas con niveles Principal, Intermedio y Complementario.
- Educación quedó como “Egresado de Ingeniería de Sistemas”, sin afirmar título otorgado.
- Las dos certificaciones existentes permanecieron inactivas y preservaron sus datos/documentos.
- Assets, mensajes, PDFs, SVG y Base64 fueron preservados.
- Se saneó una referencia protegida en un seed rastreado sin ejecutar el script.

Ejecución:

- Backup C3: `backend/backups/portfolio_before_c3_content_20260710_011041.db`, ignorado por Git.
- Dry-run inicial: 61 operaciones C3 previstas.
- Apply: 61 operaciones aplicadas.
- Segundo dry-run: 0 operaciones.
- Conteos finales: 1 perfil, 3 redes, 41 skills, 7 proyectos, 3 experiencias, 17 bullets, 1 educación, 2 certificaciones, 13 assets, 1 mensaje, 5 `project_images` y 50 `project_skills`.

Verificaciones:

- Backend `pytest -q`: aprobado.
- `check_db`: `foreign_keys=1`, `integrity_check=ok` y cero violaciones.
- API pública/admin de lectura: aprobada sin operaciones CRUD.
- Búsqueda de referencias protegidas en archivos rastreados y campos públicos: cero coincidencias.
- Frontend `npm run lint`: aprobado.
- Frontend `npm run build`: aprobado.
- `git diff --check`: aprobado.

No se ejecutaron `reset_db.py`, `update_db.py`, `seed_db.py`, migraciones de esquema, PostgreSQL ni despliegues. No se hizo commit.

Siguiente lote: **C4 — QA visual, editorial, responsive y confidencialidad final**.

## 2026-07-10 - C4: QA visual, editorial, responsive y confidencialidad final

Se realizó el recorrido visual real del contenido profesional definitivo aplicado en C3, sin CRUD real, sin migraciones, sin despliegue y sin modificar datos de `portfolio.db`.

- Navegador/método: Chrome local controlado por DevTools Protocol, con backend FastAPI local y frontend Vite local.
- Ocho viewports recorridos: 320 x 568, 375 x 667, 390 x 844, 430 x 932, 768 x 1024, 1024 x 768, 1180 x 800 y 1440 x 900.
- Perfil y contenido público correctos, con teléfono no público.
- 41 skills visibles en el contenido definitivo.
- Fofimatic y Kodland finalizadas, sin mostrar “Actualidad” en público.
- Seis proyectos confidenciales, con tres destacados.
- Cero imágenes públicas y cero certificaciones públicas.
- Admin validado solo en lectura, sin guardar ni borrar datos.
- Confidencialidad aprobada y sin exposición de clientes protegidos.
- Accesibilidad funcional validada en modales, navegación y foco.
- Cero errores relevantes de consola y cero respuestas 500.
- Payload de referencia medido post-C3 para `/api/public/home` y `/api/public/projects`.
- `pytest`, `check_db`, `lint` y `build` aprobados.
- `portfolio.db` intacta.
- GO editorial para iniciar Fase 7.1, sin despliegue inmediato.
- Sin despliegue.
- Sin cambios de datos.

## 2026-07-09 - C2: confidencialidad y vencimiento en admin y vista pública

Se incorporaron en el frontend administrativo y público los campos agregados en C1, sin cambiar esquema, datos reales ni contratos backend.

- Proyectos admin: nueva sección “Confidencialidad y publicación”.
- Controles agregados: `is_confidential`, `client_display_name`, `confidentiality_note` y `allow_public_images`.
- Al activar confidencialidad se sugiere ocultar imágenes públicas sin borrar portada, galería ni assets.
- Si un proyecto confidencial mantiene imágenes públicas, el admin exige confirmación explícita antes de guardar.
- La confirmación se reinicia al activar confidencialidad, activar imágenes públicas, cambiar portada o cambiar galería.
- Cards admin muestran badge “Confidencial”, alias público, nota compacta y estado “Imágenes públicas/ocultas”.
- Vista pública de proyectos muestra badge, alias y nota de confidencialidad cuando el backend los entrega.
- Proyectos sin imagen o con `allow_public_images=false` usan una composición neutral y modal sin carrusel/controles innecesarios.
- Certificaciones admin: se agregó `expiration_date` como fecha opcional de vencimiento.
- Certificaciones públicas: muestran “Vence: …” solo cuando existe fecha almacenada.
- `credential_url` y `certificate_file`/PDF permanecen separados.
- No se actualizó contenido profesional definitivo, no se incorporó Kodland y no se alteraron fechas de Fofimatic.
- No se ejecutaron migraciones, despliegues ni operaciones CRUD sobre `portfolio.db`.

Verificaciones:

- Backend `pytest -q`: 32 pruebas aprobadas.
- `check_db`: `foreign_keys=1`, `integrity_check=ok` y cero violaciones.
- Frontend `npm run lint`: aprobado.
- Frontend `npm run build`: aprobado.
- `portfolio.db` conservó tamaño, fecha y hash SHA-256 iniciales del lote.

La validación técnica de C2 quedó aprobada. La comprobación visual completa en navegador, utilizando el contenido profesional definitivo, se realizará durante C4.

Siguiente lote: **C3 — actualización controlada de contenido profesional**.

## 2026-07-09 - 7.0: limpieza documental y continuidad con SQLite

Se realizó una limpieza documental y realineación del plan activo del portfolio.

- Se registró la decisión de conservar SQLite como motor vigente.
- PostgreSQL quedó fuera del alcance activo por decisión del propietario.
- No se revirtieron los cambios C1: `is_confidential`, `confidentiality_note`, `client_display_name`, `allow_public_images` y `expiration_date` siguen vigentes.
- Se eliminó el plan duplicado `docs/PLAN_MIGRACION_SQLITE_POSTGRESQL.md`.
- Se archivaron las auditorías de 2026-07-05 en `docs/archive/auditorias-2026-07-05/`.
- Se archivó el plan PostgreSQL en `docs/archive/postgresql/`.
- `PLAN_TRABAJO_PORTFOLIO.md` quedó como único plan operativo vigente.
- `docs/PLAN_ACTUALIZACION_CONTENIDO_PROFESIONAL.md` consolidó la política de confidencialidad y dejó C2 como siguiente lote.
- `README.md` quedó alineado con el estado actual y los documentos vigentes.
- `docs/REVISION_ARCHIVOS_DUDOSOS.md` registró la decisión documental 7.0.
- No se modificaron backend funcional, frontend funcional, modelos, schemas, rutas, contratos, autenticación, assets, mensajes ni datos.
- No se ejecutaron `reset_db.py`, `update_db.py`, `seed_db.py`, migraciones, sincronizadores, despliegues ni operaciones POST/PUT/PATCH/DELETE.

Siguiente lote: **C2 — panel administrativo y vista pública para los campos de confidencialidad, política de imágenes y expiración de certificaciones**.

## 2026-07-07 - C1: modelo y contratos de contenido profesional

Se incorporaron de forma aditiva y compatible los campos requeridos para confidencialidad de proyectos y vencimiento opcional de certificaciones.

- Project: `is_confidential`, `confidentiality_note`, `client_display_name` y `allow_public_images`.
- Certification: `expiration_date` opcional y separado de `issue_date`, `credential_url` y `certificate_file_id`.
- Los contratos create/update/read públicos y administrativos incluyen los campos nuevos.
- `allow_public_images=false` devuelve `image=null` y `gallery_images=[]` únicamente en rutas públicas; no altera portada, galería ni assets y el admin conserva acceso completo.
- La fecha de vencimiento puede ser nula o igual/posterior a la emisión; la validación también combina valores existentes en actualizaciones parciales.
- Se creó `app.scripts.migrate_professional_content_fields`, con dry-run predeterminado, backup obligatorio para `--apply`, detección de columnas incompatibles, transacción e idempotencia.

Ejecución SQLite real:

- backup C1 verificado: `backend/backups/portfolio_before_c1_schema_20260707_124019.db`;
- dry-run inicial: 5 columnas faltantes;
- aplicación: 5 columnas agregadas;
- segundo dry-run: 0 cambios;
- defaults históricos: `is_confidential=false`, notas/cliente nulos, `allow_public_images=true` y `expiration_date=null`;
- 13 assets, 1 mensaje, 5 asociaciones `project_images` y 50 asociaciones `project_skills` coinciden exactamente con el backup;
- conteos de todas las tablas permanecieron iguales;
- `foreign_keys=1`, `integrity_check=ok` y cero violaciones.

Pruebas y alcance:

- 32 pruebas backend aprobadas;
- frontend lint/build aprobados al cierre del lote;
- no se actualizaron contenidos editoriales, experiencias, proyectos, certificaciones, assets, mensajes ni relaciones;
- Fofimatic está confirmado como finalizado en marzo de 2026; C3 debe conservar `is_current=false` y no describirlo como empleo actual;
- Kodland permanece reservado para C3;
- no se ejecutaron `reset_db.py`, `update_db.py`, `seed_db.py`, PostgreSQL ni despliegues.

## 2026-07-07 - C0: auditoría y planificación de actualización profesional

Se inició una nueva revisión editorial basada en la hoja de vida actualizada y en reglas estrictas de confidencialidad. Este lote fue exclusivamente documental y de solo lectura.

- Se inventarió el contenido vigente de perfil, redes, skills, proyectos, experiencias, educación, certificaciones, assets y relaciones sin reproducir Base64, SVG, PDFs ni mensajes privados.
- Se contrastaron modelos, schemas, repositorios, servicios, routers, scripts, API, frontend público, panel admin y documentación existente.
- Se documentó la incorporación futura de Fofimatic y Kodland, sin insertar ni modificar registros.
- Se propuso presentar la formación como “Egresado de Ingeniería de Sistemas” hasta la ceremonia prevista para octubre de 2026.
- Se identificaron como candidatos aditivos `Project.is_confidential`, `confidentiality_note`, `client_display_name`, `allow_public_images` y `Certification.expiration_date`.
- Se confirmó que `certificate_file_id` ya sirve para PDF y que la categoría string de skills es suficiente.
- Se crearon `docs/PLAN_ACTUALIZACION_CONTENIDO_PROFESIONAL.md`, `docs/INVENTARIO_CONTENIDO_PORTFOLIO.md` y un plan PostgreSQL histórico, ahora archivado.
- No se ejecutaron POST, PUT, PATCH, DELETE, migraciones, seeds, resets ni scripts de actualización.
- No se modificaron código funcional, contratos, autenticación, multimedia ni la base de datos.

## 2026-07-06 - Cierre de Fase 6: pruebas técnicas, funcionales y decisión de despliegue

Se consolidaron formalmente los lotes 6.1 a 6.8 y se cerró la Fase 6 dentro de su alcance de QA.

- Backend: pruebas aprobadas.
- SQLite: `foreign_keys=1`, `integrity_check=ok` y cero violaciones.
- Frontend: `npm run lint` y `npm run build` aprobados.
- QA funcional, responsive, accesibilidad e integración local aprobadas en el alcance definido.
- Payload multimedia quedó identificado como bloqueo para despliegue inmediato.
- `backend/venv` sigue pendiente de limpieza Git.

Decisión formal:

**Conditional Go para preparación, No-Go para despliegue inmediato.**

Confirmaciones:

- no se desplegó en Vercel, Render ni PostgreSQL;
- no se hicieron CRUD ni modificaciones de datos durante el cierre;
- no se ejecutaron `reset_db.py`, `update_db.py`, `seed_db.py` ni migraciones;
- solo se actualizaron documentos de cierre.

## Resumen histórico

El historial detallado de Fases 1-5, galería de proyectos, visor PDF, responsividad, UX admin, limpieza documental, pruebas y decisiones previas se conserva en [docs/HISTORIAL_CAMBIOS_DETALLADO.md](docs/HISTORIAL_CAMBIOS_DETALLADO.md).
