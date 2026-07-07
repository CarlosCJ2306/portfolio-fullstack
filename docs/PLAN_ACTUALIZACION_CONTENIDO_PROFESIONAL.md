# Plan de actualización del contenido profesional

## Objetivo

Actualizar el portfolio para reflejar con precisión la hoja de vida vigente, incorporando las experiencias documentadas de Fofimatic S.A.S. y Kodland, presentando correctamente la condición académica y protegiendo la identidad e información de clientes confidenciales. C0 es exclusivamente auditoría y documentación; no cambia datos ni contratos.

## Fuentes y jerarquía

1. Hoja de vida actualizada suministrada por el propietario.
2. Instrucciones expresas de confidencialidad.
3. Código, contratos y SQLite actual consultada en modo de solo lectura.
4. Documentación y proyectos previamente suministrados.
5. Vacíos sin fuente: quedan pendientes; no se completan por inferencia.

## Reglas de confidencialidad

- No publicar nombres de clientes protegidos, usuarios, reportes, documentos, URLs internas, repositorios privados, métricas ni capturas.
- Usar fórmulas como “Cliente confidencial del sector industrial”, “Empresa privada cliente de Fofimatic” u “Organización cliente cuyo nombre se reserva por confidencialidad”.
- Las descripciones deben explicar problema, función y tecnología en términos generales.
- Antes de activar una imagen, revisar visualmente que no contenga marcas, datos, dashboards, nombres, rutas o documentos internos.
- No copiar Base64, SVG, PDF, nombres de archivos sensibles ni mensajes a documentación o logs.

## Estado actual resumido

- Perfil principal dinámico con avatar y sin CV asociado.
- Tres redes activas.
- 41 skills activas, organizadas por strings de categoría y nivel; no tienen iconos asociados.
- Seis proyectos activos, textuales, sin imágenes ni URLs; un proyecto provisional permanece inactivo con multimedia histórica.
- Una experiencia activa de Fofimatic con fechas junio de 2024 a marzo de 2026; una experiencia histórica inactiva de entidad reservada.
- Kodland no existe todavía en SQLite.
- Una educación activa que aún usa el nombre formal del programa como `degree`.
- Dos certificaciones inactivas, una con PDF; ninguna incluye expiración.
- 13 assets y 1 mensaje, fuera del alcance de modificación de C0.

El detalle sanitizado está en [INVENTARIO_CONTENIDO_PORTFOLIO.md](INVENTARIO_CONTENIDO_PORTFOLIO.md).

## Discrepancias y decisiones pendientes

| Tema | Fuente vigente | Estado actual | Decisión |
|---|---|---|---|
| Fofimatic “actualmente” | Instrucción verbal usa “actualmente”; CV termina en marzo de 2026 | `end_date=2026-03-31`, `is_current=false` | **Requiere confirmación del propietario.** No cambiar fecha ni estado por suposición. |
| Kodland | Mayo de 2024 a febrero de 2026, tutor remoto | No existe en DB | Incorporar en C3 solo tras aprobar cargo, redacción y orden. |
| Situación académica | Programa terminado; ceremonia prevista octubre de 2026 | Se muestra “Ingeniería de Sistemas” | Proponer “Egresado de Ingeniería de Sistemas”; no afirmar título oficial. |
| Proyectos | CV menciona CRM, reintegros, DEX, centros de costos, flujo de caja y tracking | Hay seis proyectos que agrupan parte del alcance | Confirmar si centros de costos y flujo de caja deben separarse y si BI es proyecto independiente. |
| Tecnologías | CV respalda Python, Flask, web, Power Platform/RPA, APIs, SQL/PostgreSQL | Catálogo incluye tecnologías adicionales | Clasificar adicionales como conocimiento/proyecto propio o retirarlas si falta evidencia. |
| Certificaciones | Solo se deben publicar con respaldo | Dos inactivas, una documentada | Confirmar cada credencial, emisor, fecha, expiración, URL y permiso de publicación. |

### Consistencia documental

- `README.md` y `backend/docs/API_FRONTEND.md` describen correctamente la arquitectura y los contratos vigentes.
- `docs/CONTENIDO_PROFESIONAL_PORTAFOLIO.md` documenta la actualización anterior, enfocada solo en Fofimatic; quedó marcado como histórico porque la hoja de vida ampliada incorpora Kodland.
- `docs/QA_FASE_6.md` conserva evidencia válida de la QA realizada, pero sus conteos y observaciones del dataset son históricos y no deben interpretarse como inventario actual.
- Las auditorías generales anteriores describen problemas que ya fueron corregidos en Fases 1–6 (FK, tipos de assets, avatar y SVG). Deben usarse como historial, no como diagnóstico vigente.
- El seed inicial contiene contenido provisional y una referencia empresarial histórica que requiere anonimización o archivo en una fase autorizada; no debe ejecutarse para reconstruir contenido profesional.

## Matriz de capacidades

| Requisito | Soporte actual | Modelo/campo | Público | Admin | Cambio requerido | ¿Migración? | Riesgo | Recomendación |
|---|---|---|---|---|---|:---:|---|---|
| Título y resumen | Completo | `Profile.professional_title`, `summary` | Hero | Edición existente | Solo contenido | No | Bajo | Redacción aprobada y sin afirmación de titulación. |
| Ubicación/contacto | Completo | `location`, `email`, `phone` | Hero/contacto | Edición existente | Solo contenido | No | Medio | Publicar únicamente datos autorizados. |
| Avatar | Completo | `avatar_asset_id` | Imagen Base64 segura | Picker `avatar` | Revisión visual | No | Medio | Conservar el actual si el propietario lo reconoce. |
| CV | Parcial | `cv_url` | Hero puede enlazarlo | Campo URL | Definir URL pública segura | No | Medio | No almacenar ruta privada; confirmar si se publica. |
| Experiencia básica | Completo | Empresa, cargo, país, ciudad, fechas, `is_current`, descripción | Lista ordenada | CRUD completo | Agregar Kodland y revisar Fofimatic | No | Alto | Mantener fechas documentadas; resolver conflicto “actualmente”. |
| Bullets | Completo | `ExperienceBullet` | Sí | Texto multilínea | Solo contenido | No | Medio | Redacción verificable, sin clientes ni métricas. |
| Publicación/orden experiencia | Completo | `is_active`, `display_order` | Filtra activos | Controles existentes | Solo datos | No | Bajo | Fofimatic y Kodland activas tras aprobación. |
| Proyecto sin imagen | Completo | `image_asset_id=null`, galería vacía | Fallback | Permitido | Ninguno | No | Bajo | Predeterminado para proyectos confidenciales. |
| Portada/galería/orden | Completo | `image_asset_id`, `ProjectImage.display_order` | Card/modal | Pickers y reordenamiento | Política de publicación | No | Alto | Bloquear visualmente su uso cuando el proyecto sea confidencial. |
| Tecnologías de proyecto | Completo | `project_skills` | Chips | Selector múltiple | Revisar asociaciones | No | Medio | Asociar solo tecnologías respaldadas. |
| Destacado/publicación/orden | Completo | `is_featured`, `is_active`, `display_order` | Público filtra/ordena | Controles existentes | Solo datos | No | Bajo | Definir 2–3 destacados tras aprobar estructura. |
| Confidencialidad proyecto | No existe | — | No muestra nota | Sin controles | Agregar campos y política | Sí | Alto | Campos aditivos mínimos en C1. |
| Cliente público genérico | No existe | — | No se muestra | Sin campo | Agregar `client_display_name` opcional | Sí | Alto | Nunca guardar nombre protegido en este campo. |
| Restricción de imágenes | No existe | — | Depende de relaciones | Admin permite imágenes siempre | Agregar `allow_public_images` y aplicar validación/UX | Sí | Alto | `false` por defecto para contenido confidencial. |
| Categoría skill | Completo | `Skill.category` string | Se muestra | Campo editable | Estandarizar valores | No | Bajo | No crear tabla de categorías. |
| Nivel/color/icono | Completo | `level`, `color`, `icon_asset_id` | Nivel/icono; color uso limitado | CRUD/picker | Revisar niveles y uso | No | Medio | No inventar dominio porcentual; iconos solo autorizados. |
| Educación | Completo | Institución, degree, field, años, descripción | Sí | CRUD | Solo redacción | No | Alto | Usar “Egresado…” hasta ceremonia. |
| Certificación básica | Completo | Nombre, emisor, `issue_date`, URL, descripción, activo/orden | Sí | CRUD | Solo contenido | No | Medio | Publicar solo verificada. |
| Expiración | No existe | — | No se muestra | Sin campo | Añadir `expiration_date` opcional | Sí | Medio | Cambio aditivo en C1, sin inferir fechas. |
| PDF certificado | Completo | `certificate_file_id` → `MediaAsset` | Modal Blob/fallback | Picker de documento | Ninguno | No | Medio | Mantener relación para PDF. |
| Imagen de certificado | No soportada por contrato actual | `certificate_file_id` exige `document` + PDF | Visor asume PDF | Picker habla de PDF | Solo si el propietario la requiere | Potencial | Medio | Preferir `preview_image_asset_id` opcional; no reutilizar ambiguamente `certificate_file_id`. |

## Campos potenciales de modelo

### Project

Propuesta aditiva para C1:

- `is_confidential: bool`, no nulo, valor inicial prudente definido en migración.
- `confidentiality_note: str | None`, texto público genérico aprobado.
- `client_display_name: str | None`, solo alias genérico; nunca nombre protegido.
- `allow_public_images: bool`, no nulo; si es falso, la API pública no debe serializar portada/galería aunque existan asociaciones administrativas.

Alternativa sin esquema: insertar la nota dentro de `description` y dejar proyectos sin assets. Es más rápida, pero no impone una política y permite publicar imágenes por error. Se recomienda el cambio aditivo por seguridad.

### Certification

- `expiration_date: date | None` como cambio aditivo.
- Conservar `certificate_file_id` para PDF. Su nombre, validación backend y visor actual ya son coherentes.
- Si se confirma la necesidad real de imagen/insignia, agregar `preview_image_asset_id` opcional con `asset_type=image`; no renombrar la relación PDF ni duplicar contenido.

### Skill

El string `category` es suficiente: el catálogo es pequeño, el admin ya lo edita y el público lo consume. Una tabla adicional introduciría CRUD, FK y migración sin beneficio claro. C1 debe limitarse a catálogo/validación de valores si se considera necesario.

## Propuesta de estructura pública

1. Hero: “Egresado de Ingeniería de Sistemas | Desarrollo Fullstack y Automatización de Soluciones Empresariales”, sujeto a aprobación editorial.
2. Resumen: experiencia en desarrollo, automatización e integración, sin atribuir FastAPI a Fofimatic.
3. Experiencia: Fofimatic y Kodland, ambas con fechas documentadas y sin usar “Actualidad” hasta confirmar.
4. Proyectos: casos funcionales confidenciales, preferentemente sin imágenes, agrupados por problema y tecnología.
5. Skills: separar experiencia profesional, conocimientos/proyectos propios y tecnologías en proceso de implementación.
6. Educación: “Egresado de Ingeniería de Sistemas” y ceremonia prevista para octubre de 2026.
7. Certificaciones: solo credenciales verificadas y autorizadas.

## Propuesta del panel administrativo

- Perfil: ayuda textual para diferenciar condición académica de título profesional; no requiere nuevo campo.
- Experiencia: mostrar advertencia cuando `end_date` existe pero el texto editorial dice “actualmente”.
- Proyectos: controles de confidencialidad, alias genérico y permiso de imágenes; al desactivar imágenes públicas no borrar asociaciones.
- Skills: selector o sugerencias de categorías normalizadas sin tabla nueva; etiqueta de nivel clara.
- Educación: ayuda “No presentar titulación hasta confirmación de ceremonia”.
- Certificaciones: campo de expiración; conservar URL y PDF separados; imagen de preview solo si se aprueba el nuevo campo.

## Propuesta editorial de experiencias

### Fofimatic S.A.S.

- Periodo respaldado: junio de 2024 a marzo de 2026.
- Enfoque: desarrollo y automatización de soluciones empresariales.
- Tecnologías confirmadas: Python, Flask, HTML, CSS, JavaScript, Power Automate, Power Automate Desktop, Power Apps, RPA, APIs, SQL y PostgreSQL.
- Responsabilidades respaldadas: análisis de requerimientos, desarrollo, integración, soporte y documentación.
- Pendiente: confirmar cargo público exacto y si el propietario desea describir la relación como actual pese a la fecha final del CV.

### Kodland

- Periodo respaldado: mayo de 2024 a febrero de 2026.
- Cargo propuesto: Tutor de programación remoto, sujeto a la denominación exacta de la hoja de vida.
- Contenido seguro: enseñanza de Python básico y lógica computacional mediante clases teórico-prácticas; seguimiento académico y comunicación con estudiantes, familias y equipos internos.
- No atribuir frameworks, métricas de estudiantes ni resultados no documentados.

## Propuesta editorial de proyectos

| Proyecto público propuesto | Fuente | Descripción segura | Funcionalidades respaldadas | Tecnologías respaldadas | Responsabilidad respaldada | Confidencialidad | Certeza | Pendientes |
|---|---|---|---|---|---|---|---|---|
| Gestión de reintegros y DEX | CV + contenido actual | Solución para organizar y relacionar información de reintegros y documentación de exportación. | Registro, consulta, asociación documental y trazabilidad general | Python, Flask, JavaScript, SQL, PostgreSQL | Análisis, desarrollo, integración, soporte y documentación | Cliente reservado; sin datos ni documentos | Alta | Confirmar significado público de “DEX” y alcance exacto. |
| Gestión de centros de costos | CV | Automatización para organizar información asociada a centros de costos. | Captura, validación, transformación y reporte general | Power Automate/RPA, Python, Excel y SQL solo donde la CV completa lo confirme | Automatización e integración | Sin cliente, cifras ni formatos internos | Media | Confirmar si fue módulo independiente y tecnologías exactas. |
| Automatización de flujo de caja | CV | Automatización de tareas de consolidación y seguimiento de flujo de caja. | Recolección, validación, consolidación y reportería general | Herramientas de automatización y datos confirmadas por CV | Desarrollo y soporte | Sin montos, métricas ni pantallas | Media | Confirmar separación respecto a centros de costos. |
| Tracking de exportaciones | CV + contenido actual | Seguimiento general de estados, fechas y documentos de procesos de exportación. | Consulta de estados, trazabilidad y centralización | Python, Flask, JavaScript, APIs, SQL | Desarrollo e integración | Sin cliente, documentos ni datos operativos | Alta | Confirmar tecnologías exactas y terminología pública. |
| CRM empresarial | CV + contenido actual | Gestión modular de información comercial y operativa. | Formularios, validaciones, consultas y módulos administrativos | Python, Flask, JavaScript, HTML, CSS, SQL/PostgreSQL | Análisis funcional y desarrollo | Sin cliente ni repositorio | Alta | Confirmar entidades funcionales que pueden nombrarse. |
| Automatización y reportería | CV | Conjunto de automatizaciones y reportes para procesos empresariales. | Integración, transformación y generación de reportes | Power Platform/RPA, Python, SQL; BI solo si se confirma por caso | Automatización, documentación y soporte | Debe evitar informes y datos reales | Media | Decidir si es proyecto o resumen transversal. |
| Business Intelligence | Documentación previa; requiere contraste con CV completa | Modelos y visualizaciones para análisis operativo sin publicar indicadores reales. | Transformación, modelado y visualización | Power BI; DAX/Power Query solo con confirmación | Desarrollo de reportería | Sin métricas, dashboards ni capturas | Media | Confirmar experiencia concreta, herramientas y si merece proyecto separado. |

No se proponen resultados cuantitativos.

## Perfil y habilidades propuestas

### Encabezado

“Egresado de Ingeniería de Sistemas | Desarrollador Fullstack y Automatización de Soluciones Empresariales”. Debe aprobarse antes de C3 y puede simplificarse para legibilidad.

### Resumen

Redactar en primera persona o tercera persona de forma consistente, destacando desarrollo con Python/Flask, frontend web, automatización Power Platform/RPA, APIs y SQL/PostgreSQL. Mencionar docencia de programación como experiencia diferenciada. No decir “Ingeniero de Sistemas” como título obtenido antes de la ceremonia.

### Clasificación técnica

- Experiencia profesional confirmada: Python, Flask, HTML, CSS, JavaScript, Power Automate, Power Automate Desktop, Power Apps, RPA, APIs, SQL y PostgreSQL.
- Experiencia docente confirmada: Python básico y lógica computacional.
- Conocimiento/proyectos propios: FastAPI, React, Vite y otras tecnologías solo cuando el repositorio o documentación propia lo respalden.
- En validación: Power BI, DAX, Power Query, Pandas, OpenPyXL, servidores, motores adicionales y librerías documentales según el detalle de la hoja de vida.
- Omitir: cualquier tecnología sin evidencia suficiente o cuyo nivel no pueda justificarse.

PostgreSQL tiene evidencia profesional y no debe etiquetarse como “en aprendizaje”. FastAPI no debe atribuirse a Fofimatic.

## Estrategia de datos

1. C0: inventario y decisiones, sin escrituras.
2. C1: migraciones aditivas y contratos con pruebas sobre SQLite temporal.
3. C2: controles admin y representación pública; política de imágenes confidenciales.
4. C3: backup, dry-run sanitizado, actualización transaccional/idempotente y verificación de conteos.
5. C4: QA editorial, API, navegador, confidencialidad, responsive y regresión.

La actualización C3 debe desactivar antes que borrar, preservar `MediaAsset` y mensajes, no imprimir datos sensibles y exigir backup válido.

## Fases C1 a C4

### C1 — Modelo y contratos

- Confirmar primero los cuatro campos de Project y `expiration_date`.
- Crear migración versionada/idempotente respaldada; no usar reset.
- Actualizar ORM, schemas públicos/admin, repositorios, servicios y tests.
- Aplicar `allow_public_images` en serialización/servicio público sin borrar relaciones.
- Mantener `certificate_file_id` como PDF; agregar preview solo si el propietario lo aprueba.

### C2 — Admin y frontend público

- Añadir controles y ayudas de confidencialidad.
- Ocultar imágenes públicas cuando no estén permitidas.
- Mostrar nota de confidencialidad y alias genérico.
- Añadir expiración en certificaciones.
- Mantener proyectos sin imagen y certificados sin archivo compatibles.

### C3 — Actualización controlada

- Confirmar decisiones editoriales pendientes.
- Crear backup verificado.
- Ejecutar dry-run sin secretos.
- Actualizar perfil, dos experiencias, proyectos, skills, educación y certificaciones aprobadas.
- Anonimizar referencias rastreadas a clientes protegidos.
- Verificar idempotencia, integridad y conservación de assets/mensajes.

### C4 — QA y confidencialidad

- Tests backend temporales y contratos frontend.
- Revisión pública/admin en navegador.
- Búsqueda de nombres protegidos en DB pública, seeds, docs y frontend.
- Inspección manual autorizada de imágenes/alt text/PDF antes de activar.
- Verificación responsive, accesible y de payload.
- Go/no-go editorial firmado por el propietario.

## Pruebas previstas

- Migraciones sobre copia temporal y rollback.
- Schemas aceptan/rechazan los nuevos campos correctamente.
- Proyecto confidencial no expone imágenes cuando `allow_public_images=false`.
- Galería administrativa y asociaciones permanecen intactas.
- Experiencias respetan fechas e `is_current` aprobados.
- Certificación conserva URL/PDF y maneja expiración nula.
- Sin nombres protegidos en respuestas públicas ni documentación nueva.
- `pytest`, `check_db`, `npm run lint`, `npm run build`, smoke tests y QA manual.

## Riesgos

- Publicar un cliente o detalle interno por texto, imagen, alt text o nombre de archivo.
- Convertir “programa finalizado” en una titulación todavía no otorgada.
- Marcar Fofimatic como actual contradiciendo la fecha del CV.
- Atribuir tecnologías profesionales basadas solo en conocimiento personal.
- Duplicar proyectos muy solapados o inflar el catálogo de skills.
- Añadir campos sin migración versionada en un proyecto que todavía no usa Alembic.
- Mantener Base64 en respuestas grandes; sigue siendo bloqueo de Producción 1.

## Decisiones que requiere el propietario

1. ¿Fofimatic terminó el 31 de marzo de 2026 o debe marcarse como experiencia actual? Si continúa, indicar la fecha/corrección documental exacta.
2. Cargo público exacto para Fofimatic.
3. Cargo público exacto para Kodland y autorización para mostrar ambas experiencias.
4. Encabezado preferido con “Egresado de Ingeniería de Sistemas”.
5. ¿Centros de costos y flujo de caja son proyectos separados?
6. ¿Business Intelligence es un proyecto verificable independiente? Confirmar Power BI, DAX y Power Query.
7. Tecnologías adicionales que deben quedar como conocimiento, aprendizaje u omitirse.
8. Qué certificaciones tienen respaldo y pueden publicarse; si alguna expira.
9. Si se necesita imagen/insignia separada del PDF de certificado.
10. Si los proyectos confidenciales pueden tener alguna imagen pública revisada o deben quedar siempre textuales.
11. Texto genérico de confidencialidad y alias de cliente aprobados.
12. Si el CV tendrá URL pública y cuál será el recurso autorizado.

## Criterios de aceptación

- Las decisiones anteriores están resueltas por fuente explícita.
- Ningún cliente protegido aparece en contenido público, docs nuevas, seeds activos ni metadatos visibles.
- Perfil no afirma titulación antes de octubre de 2026.
- Fofimatic y Kodland usan periodos/cargos confirmados.
- Proyectos no contienen métricas ni información interna.
- Skills distinguen experiencia profesional de conocimiento/proyectos propios.
- Cambios de esquema son aditivos, migrados y probados.
- Assets y mensajes se preservan.
- C4 aprueba contratos, integridad, frontend y confidencialidad antes de Producción 1.
