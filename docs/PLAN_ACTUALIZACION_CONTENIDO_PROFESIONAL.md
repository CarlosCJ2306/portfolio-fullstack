# Plan de actualización del contenido profesional

Estado: **C0, C1, C2 y C3 completados; C4 es el siguiente lote**.
Motor vigente: **SQLite**.
PostgreSQL: **fuera del alcance activo por decisión del propietario**.

Este documento rige la actualización editorial y de confidencialidad del portfolio antes de producción.

## Objetivo

Actualizar el portfolio para reflejar con precisión la hoja de vida vigente, incorporar Fofimatic y Kodland con fechas confirmadas, presentar correctamente la condición académica y proteger información de clientes confidenciales.

## Fuentes y jerarquía

1. Hoja de vida actualizada suministrada por el propietario.
2. Instrucciones expresas de confidencialidad.
3. Código, contratos y SQLite consultada de forma segura.
4. Documentación y proyectos previamente suministrados.
5. Vacíos sin fuente: quedan pendientes; no se completan por inferencia.

## Decisiones resueltas

- Fofimatic finalizó en marzo de 2026.
- Fofimatic quedó con `is_current=false`.
- Kodland quedó incorporado con periodo mayo de 2024 a febrero de 2026.
- El perfil usa “Egresado de Ingeniería de Sistemas” y no afirma titulación otorgada.
- La educación indica finalización académica y ceremonia prevista para octubre de 2026.
- SQLite es el motor vigente.
- PostgreSQL no forma parte de la ruta activa.

## Reglas de confidencialidad

- No publicar nombres de clientes protegidos.
- No publicar logotipos, capturas, documentos, reportes, rutas, usuarios, datos reales ni nombres de archivos sensibles.
- No copiar Base64, SVG, PDFs, mensajes privados ni credenciales en documentación o salidas.
- Usar alias genéricos como “Empresa privada cliente de Fofimatic”.
- Las descripciones explican función y tecnología en términos generales.
- Los seis proyectos profesionales activos quedan con `allow_public_images=false`.

## Campos de modelo vigentes desde C1

### Project

- `is_confidential: bool`
- `confidentiality_note: str | None`
- `client_display_name: str | None`
- `allow_public_images: bool`

### Certification

- `expiration_date: date | None`

## Estado actual post-C3

- Perfil profesional actualizado.
- Tres redes activas: GitHub, LinkedIn y Email.
- Dos experiencias activas/publicables: Fofimatic y Kodland.
- Ninguna experiencia activa está marcada como actual.
- Seis proyectos profesionales activos, confidenciales, sin imágenes públicas, sin demo y sin repositorio.
- Tres proyectos destacados.
- 41 skills activas.
- Una educación activa como egresado.
- Dos certificaciones existentes inactivas y preservadas.
- 13 assets preservados.
- 1 mensaje preservado.
- 5 relaciones `project_images` preservadas en el proyecto histórico inactivo.
- 50 relaciones `project_skills` activas para los seis proyectos profesionales.

El contenido vigente está en [CONTENIDO_PROFESIONAL_PORTAFOLIO.md](CONTENIDO_PROFESIONAL_PORTAFOLIO.md).
El inventario seguro post-C3 está en [INVENTARIO_CONTENIDO_PORTFOLIO.md](INVENTARIO_CONTENIDO_PORTFOLIO.md).

## Estrategia de datos

1. C0: inventario y planificación, sin escrituras. **Completado.**
2. C1: modelo, contratos y migración SQLite aditiva. **Completado.**
3. C2: controles admin y representación pública de confidencialidad/expiración. **Completado técnicamente.**
4. C3: backup, dry-run, actualización idempotente del contenido profesional. **Completado técnicamente.**
5. C4: QA editorial, API, navegador, responsive, contratos y confidencialidad. **Siguiente lote.**

## C3 completado

- Backup C3 creado y verificado con SQLite Backup API.
- Dry-run inicial revisado.
- Apply ejecutado con `--apply` y backup verificado.
- Segundo dry-run con cero operaciones.
- `check_db` aprobado.
- Pruebas backend aprobadas.
- Lint y build frontend aprobados.
- Búsqueda de referencias protegidas en archivos rastreados y campos públicos: cero coincidencias.
- No se modificaron mensajes, assets binarios, PDFs, SVG ni Base64.
- No se ejecutaron `reset_db.py`, `update_db.py`, `seed_db.py`, migraciones de esquema, PostgreSQL ni despliegues.

## C4 — QA y confidencialidad — siguiente lote

Alcance:

- Revisión visual en navegador con el contenido profesional definitivo.
- Validación responsive pública/admin.
- Revisión editorial completa.
- Revisión de confidencialidad en textos, alias, notas, imágenes y metadatos.
- Verificación de contratos backend/frontend.
- Búsqueda final de referencias protegidas.
- Go/no-go editorial del propietario.

## Pendientes

- Aprobación visual y editorial final del propietario.
- Decidir si se activará alguna certificación desde admin.
- Revisar manualmente assets antes de cualquier publicación de imágenes.
- Resolver payload multimedia antes de despliegue.
- Limpieza Git de artefactos recreables pendiente para Fase 7.

## Criterios de aceptación antes de producción

- Ningún cliente protegido aparece en contenido público, documentación nueva, seeds activos ni metadatos visibles.
- Perfil no afirma titulación antes de la ceremonia.
- Fofimatic y Kodland usan periodos/cargos confirmados.
- Proyectos no contienen métricas ni información interna.
- Assets y mensajes se preservan.
- C4 aprueba contratos, integridad, frontend y confidencialidad antes de Fase 7.
