# QA contenido profesional

## C2 - Confidencialidad y vencimiento en admin y vista pública

Fecha: 2026-07-09  
Alcance: validación técnica de frontend, contratos C1 y documentación.  
Motor vigente: SQLite.  
Base real: sin CRUD real, sin migraciones y sin cambios de contenido.

| Caso | Viewport | Resultado esperado | Resultado obtenido | Estado | Observaciones |
|---|---|---|---|---|---|
| Formulario nuevo de proyecto | 1440 x 900 | Defaults: `is_confidential=false`, alias/nota vacíos y `allow_public_images=true` | Estado inicial actualizado en React | Aprobado | Sin escritura real |
| Editar proyecto normal | 1440 x 900 | Campos C1 cargan sin perder portada, galería ni skills | Normalización de edición incluye los cuatro campos | Aprobado | Pendiente CRUD real en C3 si se autoriza |
| Activar confidencialidad | 390 x 844 | Se muestra aviso y se sugiere ocultar imágenes | `allow_public_images` pasa a false al activar confidencialidad si estaba true y se muestra notice | Aprobado | No borra relaciones |
| Proyecto confidencial con imágenes públicas | 390 x 844 | Exige confirmación explícita antes de guardar | Checkbox visible y `window.confirm` de seguridad antes del submit | Aprobado | Confirmación no se persiste |
| Guardar proyecto | 1440 x 900 | Payload incluye `is_confidential`, `client_display_name`, `confidentiality_note`, `allow_public_images` | Payload create/update actualizado | Aprobado | Validado por lint/build; sin POST real |
| Editar nuevamente | 1440 x 900 | No se pierden valores C1 | Estado de edición y respuesta local conservan campos | Aprobado | Depende de contrato C1 ya probado |
| Proyecto público sin imágenes | 320 x 568 | Card y modal funcionan sin contenedor vacío grande | Fallback neutral compacto y modal sin controles de carrusel si no hay imágenes | Aprobado | Responsive CSS actualizado |
| Proyecto confidencial sin imágenes | 375 x 667 | Badge, alias y nota visibles | Vista pública renderiza badge, alias y nota desde API | Aprobado | No inventa datos |
| Proyecto confidencial con imágenes permitidas | 768 x 1024 | Imágenes se muestran normalmente si backend las entrega | Frontend respeta `image`/`gallery_images` existentes; no bloquea por `is_confidential` | Aprobado | Requiere confirmación admin previa |
| Certificación sin `expiration_date` | 390 x 844 | Guarda/renderiza sin vencimiento obligatorio | Form admin permite vacío; público no muestra vencimiento | Aprobado | Sin CRUD real |
| Certificación con `expiration_date` válida | 1440 x 900 | Guarda/renderiza fecha de vencimiento | Payload incluye `expiration_date`; público muestra “Vence: …” | Aprobado | Contrato backend probado en C1 |
| Fecha anterior a `issue_date` | 1440 x 900 | Error cliente y no se envía | Validación frontend bloquea `expiration_date < issue_date` | Aprobado | Backend mantiene 422 como respaldo |
| PDF y `credential_url` | 430 x 932 | Siguen separados | No se modificó visor PDF ni enlace de credencial | Aprobado | Modal y Blob URL intactos |
| Consola/compilación | N/A | Sin errores relevantes | `npm run lint` y `npm run build` aprobados | Aprobado | Sin runner frontend |
| Backend/regresión C1 | N/A | Pruebas C1 siguen pasando | `pytest -q` aprobó 32 pruebas | Aprobado | SQLite temporal en tests |
| Integridad DB real | N/A | DB intacta | `check_db` OK; tamaño/fecha/hash sin cambios | Aprobado | No se ejecutaron migraciones |

## Viewports revisados por criterio de diseño

- 320 x 568
- 375 x 667
- 390 x 844
- 430 x 932
- 768 x 1024
- 1024 x 768
- 1440 x 900

La revisión fue estática/técnica sobre CSS/JS y build. No se hicieron operaciones de escritura en `portfolio.db`.

## Pendientes para C3

- Ejecutar actualización controlada de contenido con backup.
- Incorporar Kodland.
- Mantener Fofimatic junio 2024 a marzo 2026 con `is_current=false`.
- Validar manualmente texto final, alias, notas y permisos de imágenes con el propietario.
- Repetir QA editorial y confidencialidad con datos reales aprobados.
