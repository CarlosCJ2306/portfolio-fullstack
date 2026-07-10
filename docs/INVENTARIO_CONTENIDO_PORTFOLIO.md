# Inventario seguro del contenido del portfolio

Estado: snapshot seguro posterior a C3.
Fecha: 2026-07-10.
Fuente: SQLite real verificada después del sincronizador C3.

No se reproducen Base64, SVG, PDFs, mensajes privados, credenciales ni nombres de archivos multimedia.

## Resumen por entidad

| Entidad | Total | Activos/publicables | Relaciones principales |
|---|---:|---:|---|
| Perfil | 1 | 1 | Avatar existente conservado; CV sin URL pública |
| Redes | 3 | 3 | GitHub, LinkedIn y Email |
| Skills | 41 | 41 | 50 asociaciones con proyectos; sin iconos asociados |
| Proyectos | 7 | 6 | 6 proyectos profesionales activos; 1 proyecto histórico inactivo conserva multimedia |
| Experiencias | 3 | 2 | 17 bullets en total |
| Educación | 1 | 1 | Sin multimedia |
| Certificaciones | 2 | 0 | 1 documento asociado preservado |
| Media assets | 13 | 13 | Avatar, documento, imágenes e iconos preservados |
| Mensajes | 1 | No aplica | Contenido privado no inspeccionado |
| Project images | 5 | No aplica | Todas pertenecen al proyecto histórico inactivo |
| Project skills | 50 | No aplica | Asociaciones de los seis proyectos profesionales |

Integridad observada: `foreign_keys=1`, `PRAGMA integrity_check=ok` y cero resultados en `PRAGMA foreign_key_check`.

## Perfil

| ID | Nombre público | Título público | Estado | Dependencias | Clasificación |
|---:|---|---|---|---|---|
| 1 | Carlos Andrés Jiménez Sarmiento | Egresado de Ingeniería de Sistemas | Vigente | Avatar asset ID 4; CV nulo | Correcto |

## Redes

| ID | Plataforma | Activa | Orden | Clasificación |
|---:|---|:---:|---:|---|
| 1 | GitHub | Sí | 0 | Correcta |
| 2 | LinkedIn | Sí | 1 | Correcta |
| 3 | Email | Sí | 2 | Correcta |

## Experiencias

| ID | Empresa pública segura | Cargo | Activa | Orden | Fechas | Actual | Bullets | Clasificación |
|---:|---|---|:---:|---:|---|:---:|---:|---|
| 2 | Fofimatic S.A.S. | Ingeniero de Desarrollo y Automatización de Soluciones Empresariales | Sí | 0 | 2024-06-01 a 2026-03-31 | No | 8 | Vigente |
| 3 | Kodland | Tutor de Programación Remoto | Sí | 1 | 2024-05-01 a 2026-02-28 | No | 5 | Vigente |
| 1 | Entidad reservada | Cargo histórico | No | 1 | Registro histórico | Sí en dato histórico inactivo | 4 | Histórico inactivo |

Nota: “Activa” significa visible/publicable, no empleo actual. Ninguna experiencia activa quedó con `is_current=true`.

## Proyectos

| ID | Proyecto | Slug | Activo | Orden | Destacado | Confidencial | Imágenes públicas | Portada | Galería | Skills |
|---:|---|---|:---:|---:|:---:|:---:|:---:|:---:|---:|---:|
| 2 | CRM empresarial modular | `crm-empresarial-modular` | Sí | 0 | Sí | Sí | No | No | 0 | 9 |
| 3 | Gestión de reintegros y documentación DEX | `gestion-reintegros-asociacion-documental` | Sí | 1 | No | Sí | No | No | 0 | 9 |
| 4 | Tracking de exportaciones | `tracking-exportaciones` | Sí | 2 | No | Sí | No | No | 0 | 8 |
| 5 | Automatización de flujo de caja y centros de costos | `automatizacion-flujo-caja-centros-costos` | Sí | 3 | Sí | Sí | No | No | 0 | 8 |
| 6 | Inteligencia de negocio y reportería empresarial | `inteligencia-negocio-reportes-operativos` | Sí | 4 | Sí | Sí | No | No | 0 | 7 |
| 7 | Ecosistema de automatización e integración empresarial | `ecosistema-automatizacion-integracion` | Sí | 5 | No | Sí | No | No | 0 | 9 |
| 1 | Proyecto histórico inactivo | `rjyuwru` | No | 1 | No | No | Sí | Sí | 5 | 0 |

Los seis proyectos activos usan alias público genérico y nota pública de confidencialidad. El proyecto histórico inactivo conserva su portada y sus 5 imágenes asociadas.

## Skills

| Categoría | Activas |
|---|---:|
| Lenguajes | 5 |
| Backend e integraciones | 5 |
| Frontend | 3 |
| Automatización y Power Platform | 6 |
| Inteligencia de negocio y datos | 9 |
| Bases de datos | 5 |
| Herramientas e infraestructura | 8 |

Niveles presentes: Principal, Intermedio y Complementario. No hay iconos asociados.

## Educación

| ID | Institución | Grado público | Activa | Orden | Años | Clasificación |
|---:|---|---|:---:|---:|---|---|
| 1 | Universidad de Pamplona | Egresado de Ingeniería de Sistemas | Sí | 0 | 2020-2026 | Vigente |

La descripción indica finalización académica y ceremonia prevista para octubre de 2026; no afirma título obtenido ni graduación oficial.

## Certificaciones

| ID | Nombre público seguro | Activa | Orden | Expedición | Vencimiento | URL | Documento | Clasificación |
|---:|---|:---:|---:|---|---|:---:|:---:|---|
| 1 | Infraestructura en Azure | No | 1 | Ausente | Ausente | No | No | Pendiente de aprobación |
| 2 | Conceptualización del lenguaje de programación C++ | No | 1 | 2023-03-06 | Ausente | No | Sí | Pendiente de aprobación |

No se activaron certificaciones ni se crearon fechas de vencimiento en C3.

## Media assets

| Total | Activos | Cambios C3 | Clasificación |
|---:|---:|---|---|
| 13 | 13 | Contenido binario preservado | Revisar manualmente antes de publicar recursos nuevos |

C3 preservó IDs, tipo, MIME, Base64, SVG y PDF. Solo el sincronizador contempla saneamiento de `file_name` y `alt_text` si aparecieran referencias protegidas.

## Mensajes

| Total | Cambios C3 |
|---:|---|
| 1 | Sin lectura ni modificación de contenido |

## Resultado de confidencialidad

- Coincidencias protegidas en campos públicos auditados: 0.
- Coincidencias protegidas en archivos rastreados auditados: 0.
- No se reescribió historial Git.
- No se modificaron PDFs, SVG ni Base64.
