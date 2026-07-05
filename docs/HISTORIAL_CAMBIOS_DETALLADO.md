# Historial de cambios detallado

Este archivo conserva el historial largo que antes estaba en `CAMBIOS.md`. Se deja como respaldo documental para no perder trazabilidad, pero el resumen operativo vive ahora en [../CAMBIOS.md](../CAMBIOS.md).

## Hitos principales

### Documentacion y planes

- Se crearon y actualizaron varios planes de trabajo y auditorias para ordenar el MVP, la galeria de proyectos, el post-MVP y la limpieza del repositorio.
- Se mantuvieron como referencia archivos como `AUDITORIA_GENERAL.md`, `BACKEND_AUDITORIA.md`, `FRONTEND_PUBLICO_AUDITORIA.md`, `FRONTEND_ADMIN_AUDITORIA.md` y `PLAN_TRABAJO_PORTFOLIO.md`.

### MVP de integracion

- Se ajusto el backend para exponer `certificate_file_id` en certificaciones admin y se crearon variables de entorno de ejemplo reales.
- Se corrigio el frontend para consumir correctamente los proyectos, educacion, certificaciones PDF y variables de entorno.
- Se verifico la integracion completa backend/frontend con pruebas manuales y de lint/build.

### Certificaciones

- Se implemento un visor PDF modal simple para certificaciones publicas.
- Se mantuvo `credential_url` como enlace externo separado.
- Se corrigieron textos danados en la seccion publica de certificaciones.

### Galeria de proyectos

- Se agrego el modelo `ProjectImage` y la tabla `project_images`.
- Se mantuvo `image_asset_id` como portada principal.
- Se agrego la galeria ordenada de imagenes adicionales en backend y frontend.
- Se implemento la administracion de galeria con subida multiple y reordenamiento.
- Se ajusto el modal publico para mostrar la galeria y luego el detalle del proyecto.
- Se afinio el visor para que la imagen se vea completa dentro de un contenedor controlado.

### Logo y favicon

- Se corrigio la ruta del logo visible del header para usar la ruta publica correcta.
- Se fijo el favicon real de la aplicacion con `LogoCJ.ico`.

### Limpieza de repositorio

- Se documentaron y eliminaron varios archivos claramente obsoletos o vacios.
- Se dejo `backend/portfolio.db` fuera de cualquier limpieza destructiva.
- Se conservaron scripts y assets utiles o referenciados.

## Resumen de entradas antiguas

Las entradas largas y repetitivas de limpieza, planes intermedios, verificaciones y ajustes puntuales quedaron resumidas arriba para mantener este archivo util y legible. Si hace falta recuperar el texto exacto de una version anterior, se puede consultar el historial de git sobre `CAMBIOS.md`.
