# Inventario seguro del contenido del portfolio

Fecha de auditoría: 2026-07-07. Fuente: SQLite abierta con `mode=ro&immutable=1`. No se consultaron ni reproducen Base64, SVG, PDFs, mensajes privados, credenciales ni nombres de archivos multimedia.

## Resumen por entidad

| Entidad | Total | Activos/publicables | Relaciones principales |
|---|---:|---:|---|
| Perfil | 1 | 1 | 1 avatar; sin URL de CV |
| Redes | 3 | 3 | Sin multimedia |
| Skills | 41 | 41 | 50 asociaciones con proyectos; sin iconos asociados actualmente |
| Proyectos | 7 | 6 | 1 portada y 5 asociaciones de galería pertenecen al proyecto inactivo |
| Experiencias | 2 | 1 | 12 bullets en total |
| Educación | 1 | 1 | Sin multimedia |
| Certificaciones | 2 | 0 | 1 documento asociado |
| Media assets | 13 | 13 | Avatar, documento, imágenes e iconos reutilizables |
| Mensajes | 1 | No aplica | Contenido privado no inspeccionado |

Integridad observada: `PRAGMA integrity_check=ok` y cero resultados en `PRAGMA foreign_key_check`.

## Perfil

| ID | Nombre público seguro | Estado | Dependencias | Clasificación | Recomendación |
|---:|---|---|---|---|---|
| 1 | Carlos Andrés Jiménez Sarmiento | Perfil principal | Avatar asociado; CV ausente | Actualizar | Cambiar la presentación académica a “Egresado de Ingeniería de Sistemas” o fórmula aprobada; conservar avatar; revisar título y resumen contra la hoja de vida. |

El título actual enfatiza desarrollo fullstack y automatización. Es compatible en términos generales, pero no expresa todavía la condición de egresado y debe evitar atribuir tecnologías a una empresa concreta cuando la hoja de vida no lo haga.

## Redes

| ID | Plataforma | Activa | Orden | Clasificación | Recomendación |
|---:|---|:---:|---:|---|---|
| 1 | GitHub | Sí | 0 | Conservar | Validar URL con el propietario antes de C3. |
| 2 | LinkedIn | Sí | 1 | Conservar | Validar URL con el propietario antes de C3. |
| 3 | Email | Sí | 2 | Conservar | Mantener alineado con el correo público aprobado. |

## Skills

Todas están activas, sin icono asociado, y usan niveles `Principal`, `Intermedio` o `Complementario`.

| IDs | Skills | Categoría | Clasificación | Recomendación |
|---|---|---|---|---|
| 1–3, 9–11 | Python, Flask, FastAPI, APIs REST, JSON, Webhooks | Backend e integraciones | Mixta | Python, Flask, APIs e integraciones tienen respaldo profesional. FastAPI debe presentarse como conocimiento/proyecto propio, no como tecnología usada en Fofimatic sin confirmación. |
| 4–5, 12–15 | JavaScript, React, HTML5, CSS3, Vite, Handsontable | Frontend | Mixta | HTML/CSS/JavaScript y tablas interactivas tienen respaldo profesional. React/Vite deben separarse como conocimiento o proyecto propio; Handsontable requiere confirmar el nombre concreto si se publicará. |
| 8, 16–20 | Power Automate, RPA Framework, Power Automate Desktop, Power Apps, Scripting, Automatización de procesos | Automatización y Power Platform | Correcta/incompleta | Respaldadas por la hoja de vida, salvo que el nivel preciso debe confirmarse. |
| 21–29 | Power BI, DAX, Power Query, Pandas, ETL, Excel, OpenPyXL, Transformación de datos, Modelado de información | Inteligencia de negocio y datos | Mixta | Power BI está respaldado por documentación previa; conservar DAX/Power Query solo con confirmación expresa de la hoja de vida completa. Pandas/OpenPyXL y niveles requieren validación. |
| 6–7, 30–33 | PostgreSQL, SQLite, SQL, SQL Server, Oracle, MySQL | Bases de datos | Mixta | SQL y PostgreSQL tienen respaldo profesional. Las demás deben mostrarse como conocimiento técnico o retirarse si no hay evidencia documental. PostgreSQL no debe degradarse a “en aprendizaje”. |
| 34–41 | SharePoint, ReportLab, WeasyPrint, Git, IIS, Logging, Validación de datos, Generación de reportes PDF | Documentos, colaboración e infraestructura | Requiere confirmación | Mantener solo las tecnologías verificadas por hoja de vida/proyectos documentados y separar herramientas profesionales de conocimientos complementarios. |

No hay duplicados por nombre entre las 41 skills activas. El campo string `category` agrupa correctamente el catálogo; una tabla de categorías no aporta beneficio suficiente para C1.

## Proyectos

| ID | Nombre público seguro | Activo | Orden | Portada | Galería | Skills | Clasificación | Recomendación |
|---:|---|:---:|---:|:---:|---:|---:|---|---|
| 1 | Título provisional no significativo | No | 1 | Sí | 5 | 0 | Ficticio/provisional | Mantener inactivo hasta que el propietario autorice archivado o retirada; revisar metadatos multimedia sin publicarlos. |
| 2 | CRM empresarial modular | Sí | 0 | No | 0 | 9 | Potencialmente público | Conservar como proyecto confidencial textual; validar alcance exacto y si debe quedar destacado. |
| 3 | Gestión de reintegros y asociación documental | Sí | 1 | No | 0 | 9 | Potencialmente público/confidencial | Actualizar a formulación segura “gestión de reintegros y DEX”; no identificar clientes. |
| 4 | Tracking de exportaciones | Sí | 2 | No | 0 | 8 | Potencialmente público/confidencial | Conservar con descripción funcional general y sin datos internos. |
| 5 | Automatización de flujo de caja y centros de costos | Sí | 3 | No | 0 | 8 | Potencialmente público/confidencial | Evaluar dividirlo en dos proyectos si la hoja de vida distingue ambos; requiere confirmación. |
| 6 | Inteligencia de negocio y reportes operativos | Sí | 4 | No | 0 | 7 | Potencialmente público/confidencial | Presentar como BI y reportería sin indicadores, métricas ni información interna. |
| 7 | Ecosistema de automatización e integración empresarial | Sí | 5 | No | 0 | 9 | Incompleto/solapado | Puede convertirse en “Automatización y reportería” o retirarse si duplica proyectos específicos. |

Los seis proyectos activos no tienen portada, galería, demo ni repositorio. El proyecto inactivo conserva relaciones multimedia históricas; no se recomienda borrar assets ni asociaciones en C0.

## Experiencias

| ID | Empresa pública segura | Cargo | Activa | Orden | Fechas | Actual | Bullets | Clasificación | Recomendación |
|---:|---|---|:---:|---:|---|:---:|---:|---|---|
| 1 | Entidad histórica reservada | Cargo histórico | No | 1 | Registro previo | Sí | 4 | Desactualizado/confidencial | No reactivar. Revisar y anonimizar referencias rastreadas si corresponde a un cliente protegido. |
| 2 | Fofimatic S.A.S. | Ingeniería de desarrollo y automatización | Sí | 0 | 2024-06-01 a 2026-03-31 | No | 8 | Correcto con discrepancia | Conservar fechas documentadas. La palabra “actualmente” requiere confirmación del propietario; no cambiar `is_current`. |

La experiencia Kodland documentada en la hoja de vida no está registrada en la base actual. Su incorporación sería una operación de C3, nunca de C0.

## Educación

| ID | Institución | Programa | Activa | Orden | Años | Clasificación | Recomendación |
|---:|---|---|:---:|---:|---|---|---|
| 1 | Universidad de Pamplona | Ingeniería de Sistemas | Sí | 0 | 2020–2026 | Desactualizada en presentación | Mantener institución y periodo; presentar “Egresado de Ingeniería de Sistemas” y aclarar ceremonia prevista para octubre de 2026. No afirmar titulación oficial todavía. |

## Certificaciones

| ID | Nombre público seguro | Activa | Orden | Fecha | URL | Documento | Clasificación | Recomendación |
|---:|---|:---:|---:|---|:---:|:---:|---|---|
| 1 | Infraestructura en Azure | No | 1 | Ausente | No | No | Requiere confirmación | Mantener inactiva hasta validar soporte documental, emisor y fecha. |
| 2 | Conceptualización del lenguaje de programación C++ | No | 1 | 2023-03-06 | No | Sí | Potencialmente pública | Confirmar vigencia editorial y documento con el propietario antes de activar. |

No existe `expiration_date`. `certificate_file_id` está implementado y validado exclusivamente para PDF (`document`, `application/pdf`).

## Media assets

| IDs | Tipo | Cantidad | Referencias actuales | Clasificación | Recomendación |
|---|---|---:|---|---|---|
| 1–3 | `icon` | 3 | Sin asociación actual | Revisar | No borrar; confirmar derechos y utilidad antes de reutilizar. |
| 4 | `avatar` | 1 | Perfil | Conservar | Mantener salvo decisión expresa del propietario. |
| 5 y 13 | `icon_svg` | 2 | Sin asociación actual | Revisar | Conservar; la política SVG segura ya existe. |
| 6, 8–12 | `image` | 6 | Una portada y cinco entradas de galería pertenecen al proyecto inactivo | Confidencial/revisar | No publicar ni reasignar hasta validar derechos, contenido, `alt_text` y ausencia de información interna. |
| 7 | `document` | 1 | Certificación inactiva | Conservar/revisar | No abrir, duplicar ni publicar hasta confirmación del propietario. |

Los 13 assets están activos. Todos tienen nombre y texto alternativo almacenados, pero esos valores no se reproducen aquí; deben auditarse manualmente por confidencialidad antes de publicación.

## Mensajes y usuarios

- Existe 1 mensaje. No se leyó ni se clasificó su contenido.
- La tabla `users` existe y está vacía; la autenticación admin vigente usa configuración HTTP Basic, no esta tabla.

## Rastros documentales o de seed

Se encontraron referencias históricas a una entidad reservada en un seed y documentación rastreada. También existen referencias legítimas a Fofimatic y Kodland en el material editorial/pruebas. C1/C3 deben anonimizar cualquier nombre de cliente protegido y decidir qué scripts históricos se conservan; este lote no modifica ni elimina nada.

