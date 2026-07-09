# Plan de actualización del contenido profesional

Estado: **C0, C1 y C2 completados; C3 es el siguiente lote**.
Motor vigente: **SQLite**.
PostgreSQL: **fuera del alcance activo por decisión del propietario**.

Este documento rige la actualización editorial y de confidencialidad del portfolio antes de producción. C1 ya incorporó campos de modelo/contrato, pero no actualizó el contenido editorial definitivo.

## Objetivo

Actualizar el portfolio para reflejar con precisión la hoja de vida vigente, incorporar Fofimatic y Kodland con fechas confirmadas, presentar correctamente la condición académica y proteger información de clientes confidenciales.

## Fuentes y jerarquía

1. Hoja de vida actualizada suministrada por el propietario.
2. Instrucciones expresas de confidencialidad.
3. Código, contratos y SQLite actual consultada de forma segura.
4. Documentación y proyectos previamente suministrados.
5. Vacíos sin fuente: quedan pendientes; no se completan por inferencia.

## Decisiones ya resueltas

- Fofimatic finalizó en marzo de 2026.
- Fofimatic debe conservar `is_current=false`.
- No se debe describir Fofimatic como empleo actual.
- Kodland se incorporará posteriormente en C3.
- El propietario finalizó académicamente Ingeniería de Sistemas, con ceremonia prevista para octubre de 2026.
- No se debe presentar todavía como titulado oficialmente; usar “Egresado de Ingeniería de Sistemas” o fórmula equivalente aprobada.
- SQLite es el motor vigente del proyecto.
- PostgreSQL no forma parte de la ruta activa.

## Reglas de confidencialidad

- No publicar nombres de clientes protegidos.
- No publicar logotipos, capturas, documentos, reportes, rutas, usuarios, datos reales ni nombres de archivos sensibles.
- No copiar Base64, SVG, PDFs, mensajes privados ni credenciales en documentación o salidas.
- Usar alias genéricos como “Empresa privada cliente de Fofimatic” u “Organización cliente cuyo nombre se reserva por confidencialidad”.
- Las descripciones deben explicar problema, función y tecnología en términos generales.
- Los proyectos sin imágenes deben usar tarjetas textuales, íconos o recursos genéricos; no usar capturas ficticias que aparenten ser reales.

### Política C1 de confidencialidad

1. `is_confidential`
   - Muestra una señal o badge público.
   - No oculta automáticamente el proyecto.

2. `client_display_name`
   - Solo admite alias genéricos.
   - Nunca debe contener nombres legales protegidos.

3. `confidentiality_note`
   - Es texto público general.
   - No puede contener datos internos, nombres, rutas, reportes o información operativa sensible.

4. `allow_public_images`
   - `false` oculta portada y galería en la API pública.
   - No elimina relaciones ni assets.
   - El admin conserva acceso completo.
   - Al marcar un proyecto como confidencial, C2 debe sugerir `false`.
   - Permitir `true` solo con confirmación explícita.

5. Certificaciones
   - `expiration_date` es opcional.
   - No reemplaza `issue_date`.
   - No mezcla `credential_url` con `certificate_file_id`.

## Estado actual resumido

- Perfil principal dinámico con avatar y sin CV asociado.
- Tres redes activas.
- 41 skills activas, organizadas por strings de categoría y nivel.
- Seis proyectos activos, textuales, sin imágenes ni URLs; un proyecto provisional permanece inactivo con multimedia histórica.
- Fofimatic existe con fechas junio de 2024 a marzo de 2026 e `is_current=false`.
- Kodland no existe todavía en SQLite.
- Una educación activa requiere redacción como egresado.
- Dos certificaciones inactivas; una tiene PDF; `expiration_date` existe desde C1 y permanece nula.
- 13 assets y 1 mensaje permanecen fuera del alcance de edición hasta C3/C4.

El detalle sanitizado está en [INVENTARIO_CONTENIDO_PORTFOLIO.md](INVENTARIO_CONTENIDO_PORTFOLIO.md).

## Propuesta de estructura pública

1. Hero: “Egresado de Ingeniería de Sistemas | Desarrollo Fullstack y Automatización de Soluciones Empresariales”, sujeto a aprobación editorial.
2. Resumen: desarrollo con Python/Flask, frontend web, automatización Power Platform/RPA, APIs y SQL/PostgreSQL, sin atribuir FastAPI a Fofimatic.
3. Experiencia: Fofimatic y Kodland, ambas con fechas documentadas.
4. Proyectos: casos funcionales confidenciales, preferentemente textuales o con recursos genéricos.
5. Skills: separar experiencia profesional, conocimiento/proyectos propios y tecnologías en validación.
6. Educación: “Egresado de Ingeniería de Sistemas” y ceremonia prevista para octubre de 2026.
7. Certificaciones: solo credenciales verificadas y autorizadas.

## Propuesta del panel administrativo

- Perfil: ayuda textual para diferenciar egresado de título otorgado.
- Experiencia: evitar textos como “actualmente” cuando existe `end_date`.
- Proyectos: controles de confidencialidad, alias genérico, nota pública y permiso de imágenes.
- Skills: sugerencias de categorías normalizadas sin crear tabla adicional.
- Educación: ayuda para no afirmar titulación antes de la ceremonia.
- Certificaciones: campo de expiración y mantenimiento de URL/PDF separados.

## Campos de modelo vigentes desde C1

### Project

- `is_confidential: bool`
- `confidentiality_note: str | None`
- `client_display_name: str | None`
- `allow_public_images: bool`

Defaults históricos tras C1:

- `is_confidential=false`
- `confidentiality_note=null`
- `client_display_name=null`
- `allow_public_images=true`

### Certification

- `expiration_date: date | None`

Default histórico tras C1:

- `expiration_date=null`

## Propuesta editorial de experiencias

### Fofimatic S.A.S.

- Periodo respaldado: junio de 2024 a marzo de 2026.
- Estado: experiencia finalizada.
- `is_current=false`.
- Enfoque: desarrollo y automatización de soluciones empresariales.
- Tecnologías confirmadas: Python, Flask, HTML, CSS, JavaScript, Power Automate, Power Automate Desktop, Power Apps, RPA, APIs, SQL y PostgreSQL.
- No atribuir FastAPI a Fofimatic sin evidencia.
- Pendiente C3: cargo público exacto y redacción final.

### Kodland

- Periodo respaldado: mayo de 2024 a febrero de 2026.
- Cargo propuesto: tutor de programación remoto, sujeto a denominación exacta.
- Contenido seguro: enseñanza de Python básico y lógica computacional, clases teórico-prácticas, seguimiento académico y comunicación con estudiantes, familias y equipos internos.
- Pendiente C3: aprobación de redacción, orden y estado público.

## Propuesta editorial de proyectos candidatos

| Proyecto público propuesto | Fuente | Descripción segura | Tecnologías respaldadas | Confidencialidad | Certeza | Pendientes |
|---|---|---|---|---|---|---|
| Gestión de reintegros y DEX | CV + contenido actual | Solución para organizar información de reintegros y documentación de exportación. | Python, Flask, JavaScript, SQL/PostgreSQL | Cliente reservado; sin documentos ni datos | Alta | Confirmar alcance público de “DEX”. |
| Gestión de centros de costos | CV | Automatización para organizar información asociada a centros de costos. | Power Platform/RPA, Python, SQL según confirmación | Sin cliente ni formatos internos | Media | Confirmar si fue módulo independiente. |
| Automatización de flujo de caja | CV | Automatización de tareas de consolidación y seguimiento de flujo de caja. | Automatización y datos confirmados por CV | Sin montos ni pantallas | Media | Confirmar separación respecto a centros de costos. |
| Tracking de exportaciones | CV + contenido actual | Seguimiento general de estados, fechas y documentos de procesos de exportación. | Python, Flask, JavaScript, APIs, SQL | Sin documentos ni datos operativos | Alta | Confirmar terminología pública. |
| CRM empresarial | CV + contenido actual | Gestión modular de información comercial y operativa. | Python, Flask, JavaScript, HTML, CSS, SQL/PostgreSQL | Sin cliente ni repositorio | Alta | Confirmar entidades funcionales nombrables. |
| Automatización y reportería | CV | Automatizaciones y reportes para procesos empresariales. | Power Platform/RPA, Python, SQL | Sin informes ni datos reales | Media | Decidir si es proyecto o resumen transversal. |
| Business Intelligence | Documentación previa; requiere contraste | Modelos y visualizaciones para análisis operativo sin publicar indicadores reales. | Power BI/DAX/Power Query si se confirma | Sin dashboards ni métricas | Media | Confirmar experiencia concreta. |

No se proponen métricas ni resultados cuantitativos.

## Estrategia de datos

1. C0: inventario y planificación, sin escrituras. **Completado.**
2. C1: modelo, contratos y migración SQLite aditiva. **Completado.**
3. C2: controles admin y representación pública de confidencialidad/expiración. **Completado.**
4. C3: backup, dry-run, actualización idempotente del contenido profesional.
5. C4: QA editorial, API, navegador, responsive, contratos y confidencialidad.

La actualización C3 debe desactivar antes que borrar, preservar `MediaAsset` y mensajes, no imprimir datos sensibles y exigir backup válido.

## Fases pendientes

### C2 — Admin y frontend público — completado

- Se añadieron controles y ayudas de confidencialidad en proyectos admin.
- La vista pública muestra badge, alias y nota pública cuando el backend los entrega.
- Al activar confidencialidad, el admin sugiere ocultar imágenes públicas.
- Si un proyecto confidencial permite imágenes públicas, se exige confirmación explícita antes de guardar.
- La confirmación se reinicia al activar confidencialidad, permitir imágenes, cambiar portada o cambiar galería.
- `allow_public_images=false` sigue ocultando multimedia pública desde el backend sin borrar relaciones.
- Se añadió administración y visualización pública de `expiration_date` en certificaciones.
- Proyectos sin imagen y certificados sin archivo siguen siendo compatibles.

### C3 — Actualización controlada — siguiente lote

- Mantener Fofimatic finalizado en marzo de 2026.
- Incorporar Kodland con contenido confirmado.
- Actualizar perfil, experiencias, proyectos, skills, educación y certificaciones aprobadas.
- Anonimizar referencias rastreadas a clientes protegidos.
- Verificar idempotencia, integridad y preservación de assets/mensajes.

### C4 — QA y confidencialidad

- Tests y contratos.
- Revisión pública/admin en navegador.
- Búsqueda de nombres protegidos.
- Inspección manual autorizada de imágenes, alt text y PDF.
- Verificación responsive, accesible y de payload.
- Go/no-go editorial del propietario.

## Riesgos

- Publicar un cliente o detalle interno por texto, imagen, alt text, PDF o nombre de archivo.
- Presentar como titulación oficial algo que todavía debe esperar ceremonia.
- Marcar Fofimatic como actual pese a su fecha final.
- Atribuir tecnologías profesionales basadas solo en conocimiento personal.
- Duplicar proyectos o inflar el catálogo de skills.
- Mantener payload multimedia pesado antes de despliegue.

## Decisiones pendientes del propietario

1. Cargo público exacto para Fofimatic.
2. Cargo público exacto para Kodland y autorización para mostrar ambas experiencias.
3. Encabezado definitivo con “Egresado de Ingeniería de Sistemas”.
4. Si centros de costos y flujo de caja serán proyectos separados.
5. Si Business Intelligence será proyecto independiente y qué herramientas puede mencionar.
6. Tecnologías adicionales que deben quedar como conocimiento, aprendizaje u omitirse.
7. Certificaciones publicables, emisores, fechas, expiración y URLs.
8. Si alguna certificación necesita imagen/insignia separada del PDF.
9. Qué proyectos confidenciales pueden mostrar imágenes públicas revisadas.
10. Texto genérico de confidencialidad y alias de cliente aprobados.
11. Si el CV tendrá URL pública y cuál será el recurso autorizado.

## Criterios de aceptación antes de producción

- Ningún cliente protegido aparece en contenido público, documentación nueva, seeds activos ni metadatos visibles.
- Perfil no afirma titulación antes de la ceremonia.
- Fofimatic y Kodland usan periodos/cargos confirmados.
- Proyectos no contienen métricas ni información interna.
- Skills distinguen experiencia profesional de conocimiento/proyectos propios.
- Assets y mensajes se preservan.
- C4 aprueba contratos, integridad, frontend y confidencialidad antes de Fase 7.
