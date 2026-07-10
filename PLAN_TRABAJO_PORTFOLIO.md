# Plan operativo vigente del portfolio

Fecha de realineación: 2026-07-09
Estado: **Conditional Go** para continuar preparación; **sin despliegue inmediato**.
Motor vigente: **SQLite**.
PostgreSQL: **fuera del alcance activo por decisión del propietario**.

Este es el único plan operativo vigente del proyecto. Las auditorías y planes antiguos se conservan en `docs/archive/` únicamente para trazabilidad histórica.

## Estado actual

- Fases 1 a 6: cerradas.
- C0: cerrado.
- C1: cerrado.
- C2: cerrado técnicamente.
- C3: cerrado técnicamente.
- C4: cerrado.
- Fase 7.1: cerrada técnicamente.
- Fase 7.2: cerrada técnicamente.
- Fase 7.3: cerrada técnicamente.
- Fase 7.4: siguiente lote.
- SQLite permanece como motor vigente.
- PostgreSQL queda fuera del alcance activo.
- No se deben revertir los cambios C1.

Campos C1 vigentes:

- `Project.is_confidential`
- `Project.confidentiality_note`
- `Project.client_display_name`
- `Project.allow_public_images`
- `Certification.expiration_date`

## Evidencia de fases cerradas

| Fase | Estado | Evidencia |
|---|---|---|
| 1 | Cerrada | `CAMBIOS.md` / Git |
| 2 | Cerrada | `CAMBIOS.md` / Git |
| 3 | Cerrada | `CAMBIOS.md` / Git |
| 4 | Cerrada | `CAMBIOS.md` / Git |
| 5 | Cerrada | `CAMBIOS.md` / Git |
| 6 | Cerrada | `docs/QA_FASE_6.md` |
| C0 | Cerrado | Documentación e inventario |
| C1 | Cerrado | Migración SQLite y 32 pruebas |
| C2 | Cerrado técnicamente | Admin, vista pública y QA técnica C2 |
| C3 | Cerrado técnicamente | Sincronización editorial, backup, idempotencia y QA técnica C3 |
| C4 | Cerrado | QA visual/editorial real, confidencialidad, responsive, accesibilidad e integridad SQLite |
| 7.1 | Cerrada técnicamente | Optimización segura de payload multimedia, `content_url`, endpoints de contenido y mediciones antes/después |
| 7.2 | Cerrada técnicamente | `backend/venv` retirado del índice, conservado localmente, `.gitignore` reforzado y auditoría Git documentada |
| 7.3 | Cerrada técnicamente | Configuración centralizada por entorno, CORS explícito, health/readiness, validación de secretos y contrato Azure documentado |

## Ruta activa antes de despliegue

### C2 — Admin y frontend público — cerrado técnicamente

Se implementó interfaz administrativa y representación pública para los campos incorporados en C1:

- `is_confidential`
- `confidentiality_note`
- `client_display_name`
- `allow_public_images`
- `expiration_date`

Criterio de salida:

- Admin permite gestionar confidencialidad, alias público, nota pública, permiso de imágenes y vencimiento de certificaciones.
- La vista pública muestra badge, alias y nota sin revelar datos protegidos.
- `allow_public_images=false` mantiene ocultas portada y galería en público, sin borrar relaciones.
- Proyecto confidencial con imágenes públicas exige confirmación explícita.
- Pytest, check_db, lint y build quedaron aprobados.
- La implementación y la verificación técnica quedaron cerradas. La validación visual completa en navegador se realizará durante C4.

### C3 — Actualización controlada de contenido — cerrado técnicamente

Actualizar datos profesionales con backup, dry-run, ejecución idempotente y QA de integridad.

Alcance:

- incorporó Kodland;
- conservó Fofimatic de junio de 2024 a marzo de 2026;
- mantuvo Fofimatic con `is_current=false`;
- actualizó perfil;
- actualizó skills;
- actualizó educación;
- actualizó proyectos;
- mantuvo certificaciones existentes inactivas.

Criterio de salida:

- No se publican clientes protegidos ni información interna.
- Los datos editoriales quedan respaldados por fuentes del propietario.
- Assets, mensajes, IDs y relaciones no autorizadas permanecen intactos.
- `check_db` confirma integridad.
- La sincronización quedó idempotente con segundo dry-run en cero operaciones.

### C4 — QA editorial, confidencialidad y contratos — cerrado

Validar el contenido actualizado antes de producción.

Alcance:

- QA editorial;
- revisión de confidencialidad;
- responsive público/admin;
- contratos backend/frontend;
- pruebas técnicas;
- búsqueda de nombres protegidos;
- revisión de multimedia autorizada.

Criterio de salida:

- Cero exposición de clientes, documentos, rutas, usuarios, reportes o archivos sensibles.
- Vista pública y admin funcionan con el contenido definitivo.
- El propietario aprueba go/no-go editorial.

Resultado C4:

- Recorrido real en navegador Chrome sobre 8 viewports.
- Vista pública validada con 6 proyectos activos confidenciales, sin multimedia pública y 0 certificaciones públicas.
- Panel administrativo validado en lectura, sin escrituras ni CRUD real.
- Confidencialidad, accesibilidad funcional, consola/red, payload de referencia e integridad SQLite documentados en `docs/QA_CONTENIDO_PROFESIONAL.md`.
- Decisión editorial: **GO** para iniciar Fase 7.1, sin despliegue inmediato.

## Fase 7 — Preparación para despliegue con SQLite

La Fase 7 debe preparar el despliegue con SQLite en almacenamiento persistente. SQLite en un filesystem efímero no es una solución productiva aceptable.

### 7.1 Optimización del payload multimedia — cerrada técnicamente

Reducir y remedir el peso de respuestas públicas/admin, especialmente proyectos, galerías y media assets.

Resultado:

- Las respuestas JSON generales ya no transportan `data_base64` ni `svg_content`.
- Se incorporaron endpoints públicos/admin de contenido bajo demanda.
- La vista pública y el admin usan `content_url` y Blob URLs cuando corresponde.
- `/api/public/home` bajó de 379.794 B a 16.386 B.
- `/api/admin/media-assets` bajó de 10.858.065 B a 3.203 B.
- Pytest, check_db, lint, build y mediciones quedaron documentados en `docs/PAYLOAD_FASE_7_1.md`.
- No se modificó `portfolio.db`, no se ejecutaron migraciones y no hubo CRUD real.

### 7.2 Limpieza Git y retirada de `backend/venv` del índice — cerrada técnicamente

Retirar artefactos recreables del índice de forma reversible, sin borrar copias locales. Confirmar que DB, backups, logs y secretos no entren al repositorio.

Resultado:

- `backend/venv` fue retirado del índice y conservado físicamente.
- `.gitignore` quedó reforzado para entornos virtuales, caches, logs, SQLite local, backups, builds y dependencias locales.
- No se reescribió el historial Git.
- `portfolio.db` permaneció intacta.
- Pytest, check_db, lint y build quedaron aprobados.
- Evidencia documentada en `docs/GIT_FASE_7_2.md`.

### 7.3 Configuración productiva, CORS, secretos y variables — cerrada técnicamente

Separar entornos local/staging/producción. Configurar CORS explícito, secretos seguros y variables sin valores sensibles en Git.

Resultado:

- Configuración backend centralizada en `app.core.config`.
- CORS, Trusted Hosts, OpenAPI, Basic Auth, logging y SQLite quedan validados por entorno.
- Se agregaron `/health` y `/ready`.
- Frontend centraliza `VITE_API_BASE_URL` y agrega `npm run validate:production-env`.
- SQLite para Azure queda restringido a una instancia, un worker, sin WAL y con almacenamiento persistente.
- No se crearon recursos Azure, no se desplegó y no se modificó `portfolio.db`.
- Evidencia documentada en `docs/CONFIG_FASE_7_3.md`.

### 7.4 Azure Static Web Apps — siguiente lote
Configurar el frontend en Azure Static Web Apps con build de React/Vite, `VITE_API_BASE_URL` productivo y fallback SPA para rutas como `/admin`.

### 7.5 Azure App Service con SQLite persistente
Configurar el backend en Azure App Service para Linux/Python usando SQLite en almacenamiento persistente compatible con Azure. No usar filesystem efímero para `portfolio.db`.

### 7.6 Staging

Levantar entorno de prueba remoto con datos controlados, backups verificados y configuración de origen cruzado real.

### 7.7 Smoke tests remotos

Validar público, admin, CORS, HTTPS, galería, PDF, contacto, persistencia y reinicio.

### 7.8 Despliegue, backup y rollback

Despliegue final solo con backup, procedimiento de restauración y rollback ensayado.

## Documentación vigente

- `CAMBIOS.md`: changelog resumido y estado actual.
- `docs/HISTORIAL_CAMBIOS_DETALLADO.md`: historial largo.
- `docs/PLAN_ACTUALIZACION_CONTENIDO_PROFESIONAL.md`: reglas editoriales y de confidencialidad aplicadas durante C0-C4.
- `docs/CONTENIDO_PROFESIONAL_PORTAFOLIO.md`: fuente editorial vigente post-C3.
- `docs/PAYLOAD_FASE_7_1.md`: optimización multimedia, endpoints de contenido y mediciones antes/después.
- `docs/GIT_FASE_7_2.md`: limpieza segura del índice Git, retiro local-preservado de `backend/venv` y auditoría de sensibles.
- `docs/CONFIG_FASE_7_3.md`: contrato de configuración, CORS, secretos, SQLite persistente, health/readiness y preparación Azure.
- `docs/INVENTARIO_CONTENIDO_PORTFOLIO.md`: snapshot seguro del contenido post-C3.
- `docs/QA_FASE_6.md`: evidencia histórica de QA.
- `docs/QA_CONTENIDO_PROFESIONAL.md`: evidencia técnica, editorial y visual de C2-C4.
- `docs/REVISION_ARCHIVOS_DUDOSOS.md`: inventario de archivos dudosos y decisión documental.
- `backend/docs/API_FRONTEND.md`: contrato API vigente.

## Documentación histórica archivada

- `docs/archive/auditorias-2026-07-05/`
- `docs/archive/postgresql/`

Los documentos archivados no son planes vigentes.

## Notas operativas

- No ejecutar `reset_db.py`, `update_db.py`, `seed_db.py` ni migraciones sin lote explícito, backup y autorización.
- No ejecutar `sync_professional_portfolio` ni `migrate_professional_content_fields` como parte de 7.0.
- `portfolio.db`, backups, logs y `.env` no deben subirse a Git.
- `backend/venv` fue retirado del índice en 7.2 y se conserva solo como entorno local ignorado.
- No iniciar despliegues productivos antes de completar la preparación técnica, staging, pruebas remotas y rollback de la Fase 7.
