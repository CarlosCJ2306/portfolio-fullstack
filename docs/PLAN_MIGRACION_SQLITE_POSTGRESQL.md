# Plan de migración SQLite → PostgreSQL

Documento de planificación. No autoriza ni ejecuta una migración.

## 1. Objetivo y alcance

Migrar en una fase futura el esquema y los datos validados del portfolio desde SQLite a PostgreSQL, con ensayo en staging, preservación de IDs y rollback verificable.

## 2. Estado actual de SQLite

La fuente actual es `backend/portfolio.db`, con foreign keys activas por conexión y comprobaciones mediante `python -m app.scripts.check_db`. No debe publicarse ni eliminarse.

## 3. Inventario de tablas y relaciones

Inventariar `profile`, `social_links`, `skills`, `projects`, `project_skills`, `project_images`, `experiences`, `experience_bullets`, `education`, `certifications`, `contact_messages`, `media_assets` y `users`. Registrar PK, FK, nulabilidad, índices y restricciones únicas desde `Base.metadata` y la base real.

## 4. Inventario de MediaAsset y Base64

Medir cantidad, tipo, MIME y tamaño decodificado por asset sin imprimir contenido. Separar avatar, image, icon/icon_svg y document. La decisión sobre storage externo pertenece a Producción 1/arquitectura, no a este plan.

## 5. Dependencias específicas de SQLite

Revisar URLs `sqlite:///`, `PRAGMA`, `check_same_thread`, scripts SQLite, tipos fecha/booleanos y cualquier SQL literal. `PRAGMA` debe quedar condicionado al dialecto.

## 6. Compatibilidad PostgreSQL

Probar todos los modelos contra PostgreSQL temporal. Ajustar únicamente diferencias confirmadas de tipos, autoincrementos, índices, constraints y transacciones. No mantener ramas SQLite ocultas en reglas de negocio.

## 7. Driver recomendado

Usar `psycopg` 3 con extras binarios para desarrollo/CI o la variante apropiada del proveedor. Fijar versión en dependencias y usar una URL SQLAlchemy compatible, sin credenciales en Git.

## 8. Alembic o esquema versionado

Introducir Alembic antes del cutover. Crear una revisión base revisada manualmente desde los modelos actuales y validar upgrade/downgrade en una base vacía. Los scripts históricos no sustituyen migraciones versionadas.

## 9. PostgreSQL de staging

Crear una instancia aislada con TLS, usuario de mínimos privilegios, backups y región definida. Nunca ensayar primero sobre producción.

## 10. Exportación desde SQLite

Realizar exportación reproducible y de solo lectura después de `integrity_check`. Preferir un ETL Python transaccional por tablas, con manifiesto de conteos y hashes de Base64, sin volcar secretos a logs.

## 11. Importación conservando IDs

Insertar en orden de dependencias y conservar PK para mantener todas las FK. Usar transacción por ensayo completo o lotes reiniciables con tabla/manifiesto de control.

## 12. Restauración de secuencias

Después de importar, ejecutar `setval` para cada secuencia al máximo ID correspondiente y comprobar que una inserción controlada obtiene un ID nuevo sin colisión.

## 13. Validación de foreign keys

Crear constraints desde el esquema, importar respetando dependencias y ejecutar consultas anti-join por cada FK. Cero huérfanos es requisito de salida.

## 14. Comparación de conteos

Comparar por tabla SQLite vs PostgreSQL, totales y activos. Toda diferencia debe estar explicada y aprobada antes del corte.

## 15. Validación de relaciones

Comprobar específicamente perfil/avatar, skills/iconos, proyecto/portada, `project_images` ordenadas, certificados/PDF y mensajes. Validar también `project_skills` y bullets de experiencia.

## 16. Validación de Base64

Comparar longitud y hash criptográfico por asset, decodificar muestras de cada MIME y confirmar firma básica de imagen/PDF. Nunca registrar el Base64 completo.

## 17. Smoke tests sobre PostgreSQL

Ejecutar tests backend, lecturas públicas/admin y CRUD controlado con registros QA. Confirmar protección de assets, tipos, uploads, galería, PDFs y errores 422.

## 18. QA frontend/backend

Apuntar un build de staging exclusivamente al backend PostgreSQL de staging y recorrer home, admin, proyectos, galería, certificaciones, contacto y mensajes.

## 19. Congelamiento de escrituras

Definir una ventana breve de mantenimiento. Bloquear o anunciar escrituras antes del backup/export final para evitar divergencia entre SQLite y PostgreSQL.

## 20. Backup final

Crear backup SQLite consistente, verificar `integrity_check`, `foreign_key_check`, tamaño y apertura de solo lectura. Guardarlo cifrado fuera del repositorio.

## 21. Cambio de DATABASE_URL

Configurar el secreto en el proveedor, nunca en archivos versionados. Confirmar pool, SSL y enmascarado de URL en logs. Mantener variable independiente por ambiente.

## 22. Despliegue de staging

Desplegar backend con migraciones explícitas como paso controlado, health check y logs. No ejecutar seed/reset durante el arranque.

## 23. Cutover a producción

Congelar escrituras, generar backup final, importar, validar, cambiar `DATABASE_URL`, desplegar y ejecutar smoke tests. Registrar responsables, tiempos y evidencias.

## 24. Rollback a SQLite

Si falla un criterio, detener escrituras PostgreSQL, restaurar la configuración previa y redeployar apuntando a la SQLite preservada. Si hubo escrituras nuevas, aplicar un plan explícito de reconciliación; nunca sobrescribir ciegamente.

## 25. Criterios de aceptación

- Esquema versionado reproducible.
- Conteos y relaciones equivalentes.
- Cero FK huérfanas.
- Base64 íntegro.
- Tests, smoke tests, lint y build aprobados.
- Persistencia tras reinicio y backups/restore ensayados.
- Sin secretos, DB ni backups en Git.

## 26. Evidencias requeridas

Conservar manifiestos de conteos, hashes, salida sanitizada de migraciones, resultados de tests, smoke tests, capturas QA, versión de esquema, backup verificado y acta de go/no-go.

## 27. Conservación de SQLite

Está prohibido eliminar `portfolio.db` o sus backups hasta que producción PostgreSQL haya sido validada, monitorizada y cuente con restauración ensayada. La retirada futura requiere autorización explícita del propietario.

