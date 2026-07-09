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
- C2: cerrado.
- C3: siguiente lote.
- C4: pendiente.
- Fase 7: pendiente.
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

| C2 | Cerrado | Admin/vista pública C1 y QA C2 |

## Ruta activa antes de despliegue

### C2 — Admin y frontend público — cerrado

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

### C3 — Actualización controlada de contenido — siguiente lote

Actualizar datos profesionales con backup, dry-run, ejecución idempotente y QA de integridad.

Alcance:

- incorporar Kodland;
- conservar Fofimatic de junio de 2024 a marzo de 2026;
- mantener Fofimatic con `is_current=false`;
- actualizar perfil;
- actualizar skills;
- actualizar educación;
- actualizar proyectos;
- actualizar certificaciones autorizadas.

Criterio de salida:

- No se publican clientes protegidos ni información interna.
- Los datos editoriales quedan respaldados por fuentes del propietario.
- Assets, mensajes, IDs y relaciones no autorizadas permanecen intactos.
- `check_db` confirma integridad.

### C4 — QA editorial, confidencialidad y contratos

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

## Fase 7 — Preparación para despliegue con SQLite

La futura Fase 7 debe desplegar con SQLite en almacenamiento persistente. SQLite en un filesystem efímero no es una solución productiva aceptable.

### 7.1 Optimización del payload multimedia

Reducir y remedir el peso de respuestas públicas/admin, especialmente proyectos, galerías y media assets.

### 7.2 Limpieza Git y retirada de `backend/venv` del índice

Retirar artefactos recreables del índice de forma reversible, sin borrar copias locales. Confirmar que DB, backups, logs y secretos no entren al repositorio.

### 7.3 Configuración productiva, CORS, secretos y variables

Separar entornos local/staging/producción. Configurar CORS explícito, secretos seguros y variables sin valores sensibles en Git.

### 7.4 Configuración Vercel

Configurar build de React/Vite, `VITE_API_BASE_URL` productivo y fallback SPA para rutas como `/admin`.

### 7.5 Configuración Render con SQLite persistente

Configurar FastAPI en Render usando un volumen persistente para SQLite. No usar filesystem efímero para `portfolio.db`.

### 7.6 Staging

Levantar entorno de prueba remoto con datos controlados, backups verificados y configuración de origen cruzado real.

### 7.7 Smoke tests remotos

Validar público, admin, CORS, HTTPS, galería, PDF, contacto, persistencia y reinicio.

### 7.8 Despliegue, backup y rollback

Despliegue final solo con backup, procedimiento de restauración y rollback ensayado.

## Documentación vigente

- `CAMBIOS.md`: changelog resumido y estado actual.
- `docs/HISTORIAL_CAMBIOS_DETALLADO.md`: historial largo.
- `docs/PLAN_ACTUALIZACION_CONTENIDO_PROFESIONAL.md`: reglas editoriales y confidencialidad para C2–C4.
- `docs/INVENTARIO_CONTENIDO_PORTFOLIO.md`: snapshot seguro del contenido previo a C3.
- `docs/QA_FASE_6.md`: evidencia histórica de QA.
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
- `backend/venv` sigue pendiente para 7.2.
- No iniciar Vercel, Render ni producción antes de cerrar C3 y C4.
