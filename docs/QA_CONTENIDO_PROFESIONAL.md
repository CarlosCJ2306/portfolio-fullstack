# QA contenido profesional

## C2 - Confidencialidad y vencimiento en admin y vista pública

Fecha: 2026-07-09  
Alcance: validación técnica de frontend, contratos C1 y documentación.  
Motor vigente: SQLite.  
Base real: sin CRUD real, sin migraciones y sin cambios de contenido.

C2 quedó aprobado técnicamente. La revisión responsive realizada en este lote fue estática y técnica sobre JSX, CSS, contratos, lint y build. No se realizó todavía un recorrido visual completo en navegador sobre todos los viewports. Esa validación se realizará durante C4 con el contenido profesional definitivo.

| Caso | Viewport | Resultado esperado | Resultado obtenido | Estado | Observaciones |
|---|---|---|---|---|---|
| Formulario nuevo de proyecto | 1440 x 900 | Defaults: `is_confidential=false`, alias/nota vacíos y `allow_public_images=true` | Estado inicial actualizado en React | Aprobado | Sin escritura real |
| Editar proyecto normal | 1440 x 900 | Campos C1 cargan sin perder portada, galería ni skills | Normalización de edición incluye los cuatro campos | Aprobado | Pendiente CRUD real en C3 si se autoriza |
| Activar confidencialidad | 390 x 844 | Se muestra aviso y se sugiere ocultar imágenes | `allow_public_images` pasa a false al activar confidencialidad si estaba true y se muestra notice | Aprobado | No borra relaciones |
| Proyecto confidencial con imágenes públicas | 390 x 844 | Exige confirmación explícita antes de guardar | Checkbox visible y `window.confirm` de seguridad antes del submit | Aprobado | Confirmación no se persiste |
| Guardar proyecto | 1440 x 900 | Payload incluye `is_confidential`, `client_display_name`, `confidentiality_note`, `allow_public_images` | Payload create/update actualizado | Aprobado | Validado por lint/build; sin POST real |
| Editar nuevamente | 1440 x 900 | No se pierden valores C1 | Estado de edición y respuesta local conservan campos | Aprobado | Depende de contrato C1 ya probado |
| Proyecto público sin imágenes | 320 x 568 | Card y modal funcionan sin contenedor vacío grande | Fallback neutral compacto y modal sin controles de carrusel si no hay imágenes | Aprobado por revisión técnica; pendiente de validación visual en navegador durante C4. | Responsive CSS actualizado |
| Proyecto confidencial sin imágenes | 375 x 667 | Badge, alias y nota visibles | Vista pública renderiza badge, alias y nota desde API | Aprobado por revisión técnica; pendiente de validación visual en navegador durante C4. | No inventa datos |
| Proyecto confidencial con imágenes permitidas | 768 x 1024 | Imágenes se muestran normalmente si backend las entrega | Frontend respeta `image`/`gallery_images` existentes; no bloquea por `is_confidential` | Aprobado por revisión técnica; pendiente de validación visual en navegador durante C4. | Requiere confirmación admin previa |
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

## Pendientes C2 resueltos en C3

- Se ejecutó actualización controlada de contenido con backup.
- Se incorporó Kodland.
- Se mantuvo Fofimatic junio 2024 a marzo 2026 con `is_current=false`.
- Se aplicaron alias, notas y permisos de imágenes según reglas C3.
- La validación visual/editorial final queda para C4.

## C3 - Actualización controlada y definitiva del contenido profesional

Fecha: 2026-07-10
Alcance: sincronización editorial real sobre SQLite, con backup, dry-run, apply, idempotencia, API de lectura e integridad.
Motor vigente: SQLite.
Base real: modificada únicamente por el sincronizador C3.

| Caso | Resultado esperado | Resultado obtenido | Estado | Observaciones |
|---|---|---|---|---|
| Backup C3 | Backup creado con SQLite Backup API y verificado | `portfolio_before_c3_content_20260710_011041.db` creado, íntegro, con conteos y hashes de assets equivalentes | Aprobado | Ignorado por Git |
| Dry-run inicial | Operaciones solo de C3 | 61 operaciones previstas | Aprobado | Sin escritura |
| Apply | Actualización transaccional con backup verificado | 61 operaciones aplicadas | Aprobado | Sin migración de esquema |
| Segundo dry-run | Cero operaciones | 0 operaciones | Aprobado | Idempotencia real confirmada |
| Perfil | Título y resumen C3 aplicados | Perfil actualizado y avatar/CV preservados | Aprobado | Teléfono no público |
| Experiencia | Fofimatic y Kodland visibles, ninguna actual | 2 experiencias públicas, ambas con `is_current=false` | Aprobado | Experiencia histórica quedó inactiva |
| Proyectos | 6 activos, confidenciales y sin imágenes públicas | 6 proyectos activos, `allow_public_images=false`, `image=null`, `gallery_images=[]` en público | Aprobado | Proyecto histórico inactivo conserva multimedia |
| Skills | 41 skills activas | 41 activas y 50 asociaciones `project_skills` | Aprobado | Sin iconos asociados |
| Educación | Egresado, sin afirmar título otorgado | Educación activa como egresado | Aprobado | Ceremonia prevista documentada |
| Certificaciones | Permanecen inactivas | 2 certificaciones inactivas | Aprobado | PDF y datos preservados |
| Assets y mensajes | No modificar contenido sensible | 13 assets y 1 mensaje preservados | Aprobado | No se leyó mensaje privado |
| API pública | Home/proyectos/experiencia/educación/certificaciones responden | Endpoints públicos 200, 6 proyectos, 3 destacados, 2 experiencias, 0 certificaciones públicas | Aprobado | Sin POST |
| API admin | Lecturas admin responden | Perfil, proyectos, experiencia, educación y certificaciones admin respondieron 200 | Aprobado | Sin CRUD |
| Referencias protegidas | Cero coincidencias en campos públicos y archivos rastreados | 0 coincidencias | Aprobado | Un seed fue saneado |
| Integridad SQLite | `foreign_keys=1`, `integrity_check=ok`, 0 violaciones | Confirmado por `check_db` | Aprobado | DB modificada solo por C3 |
| Pruebas backend | Suite completa aprobada | `34 passed, 1 warning` | Aprobado | SQLite temporal |
| Frontend | Lint/build aprobados | `npm run lint` y `npm run build` aprobados | Aprobado | Sin cambios funcionales frontend |

## Pendientes para C4

- Recorrido visual real en navegador con el contenido definitivo.
- Revisión responsive pública/admin.
- Revisión editorial final con el propietario.
- Revisión manual de assets antes de permitir imágenes públicas.
- Confirmar que no haya exposición de clientes, rutas, usuarios, reportes o documentos internos.
- Go/no-go editorial antes de Fase 7.
