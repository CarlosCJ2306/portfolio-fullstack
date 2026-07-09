# Revisión segura de archivos dudosos

## Alcance

Esta revisión corresponde a la Fase 5, Lote 4. Se inspeccionaron nombres, contenido, referencias en el repositorio y estado de seguimiento en Git sin ejecutar scripts, abrir bases SQLite ni modificar datos.

No se borró, movió ni renombró ningún archivo. Las recomendaciones de eliminación o archivo son decisiones futuras que requieren autorización explícita del propietario.

## Inventario y decisión recomendada

| Archivo/Ruta | Tipo | Referencias encontradas | Riesgo | Recomendación | Motivo | Acción futura sugerida |
|---|---|---|---|---|---|---|
| `backend/update_db.py` | Script histórico de alteración SQLite | Solo documentación y el propio archivo; no participa en runtime | Alto: ejecuta `ALTER TABLE` directamente sobre `portfolio.db` y no gestiona versiones de esquema | Candidato a archivar; **NO EJECUTAR** sobre la base real | La columna `certificate_file_id` ya forma parte del esquema actual y el script representa una migración puntual antigua | Confirmar con el propietario si se conserva como evidencia; después archivarlo fuera del flujo operativo o retirarlo en una fase autorizada |
| `backend/app/scripts/reset_db.py` | Script destructivo de desarrollo | Documentación, ejemplos del sistema de logs y el propio módulo; no se importa en runtime | Crítico: usa `Base.metadata.drop_all()` y elimina todos los datos tras confirmación | Conservar solo como herramienta local peligrosa; **NO EJECUTAR**; excluir del despliegue | Tiene bloqueo para producción y confirmación, pero sigue siendo destructivo para cualquier entorno no marcado como producción | En una fase futura, añadir señalización aún más visible o archivarlo fuera del flujo normal con autorización explícita |
| `backend/app/scripts/test_log.py` | Diagnóstico manual | Solo autorreferencias; no participa en runtime | Bajo para datos; genera logs y errores controlados intencionales | Archivar o mover a pruebas en una fase futura | Es útil para diagnosticar logging, pero no es código de aplicación | Decidir si se integra en una suite de pruebas o se conserva como herramienta manual documentada |
| `backend/app/models/user_model.py` | Modelo ORM previsto para autenticación futura | Importado y exportado por `backend/app/models/__init__.py`; no tiene repositorios, servicios, schemas ni rutas consumidoras | Medio: al estar registrado en `Base.metadata`, afecta creación/reinicio de esquema aunque la autenticación actual no lo use | Revisar manualmente con el propietario; no eliminar ahora | El comentario habla de JWT futuro, mientras la aplicación usa HTTP Basic; no es runtime de autenticación, pero sí forma parte del metadata ORM | Definir en una fase futura si habrá usuarios persistidos; solo entonces conservarlo o retirar modelo, import y tabla mediante estrategia de migración |
| `backend/app/scripts/migrate_project_gallery.py` | Migración idempotente de esquema | Referenciada por el plan y por su propio uso; importa `ProjectImage` | Medio: modifica esquema, aunque valida estructura e integridad | Conservar en repo; no ejecutar sin backup y procedimiento | Documenta una migración real necesaria para `project_images` y permite reproducir/verificar el cambio | Mantener como migración histórica; ejecutar únicamente de forma controlada sobre una copia o base respaldada |
| `backend/app/scripts/check_db.py` | Chequeo de integridad | Referenciado por README, plan y documentación operativa | Bajo: las consultas SQLite son de lectura; el sistema de logging puede escribir un log | Conservar en repo | Es la verificación segura oficial de `foreign_keys`, `integrity_check` y `foreign_key_check` | Mantener como comando de diagnóstico previo/posterior a cambios |
| `backend/app/scripts/create_db.py` | Inicialización de esquema | Solo documentación interna y el propio módulo | Medio: `create_all()` puede crear tablas faltantes en la DB configurada | Conservar como herramienta local; no ejecutar contra producción sin procedimiento | Es útil para una base nueva, pero no reemplaza migraciones versionadas | Documentar entorno permitido antes de incorporarlo a despliegue o pruebas automatizadas |
| `backend/app/scripts/seed_db.py` | Carga de datos iniciales | Solo documentación interna y el propio módulo | Alto: crea assets, perfil, redes, skills, proyecto, experiencia, educación y certificación; hace `commit` | Conservar como herramienta de desarrollo; **NO EJECUTAR** sobre la base real | Cancela si encuentra un perfil, pero sigue siendo un script de escritura pensado para inicialización | Usarlo únicamente con una SQLite temporal o nueva; evaluar fixtures de prueba en Fase 6 |
| `backend/app/scripts/inspect_db.py` | Inspección de tablas y conteos | Solo documentación interna y el propio módulo | Bajo: consulta tablas; puede escribir logs | Conservar en repo | Proporciona diagnóstico útil sin ser parte del runtime | Mantener como herramienta manual de solo lectura, aclarando el efecto secundario del log |
| `backend/portfolio.db` | Base SQLite activa | Configurada mediante `DATABASE_URL`; ignorada por Git | Crítico: contiene datos reales y puede incluir información personal | Conservar fuera de Git; **NO SUBIR A GIT** | Es la persistencia local activa y no es un artefacto descartable | Mantener backups verificados y permisos adecuados; nunca publicarla ni incluirla en imágenes públicas de despliegue |
| `backend/portfolio_backup_antes_galeria_real.db` | Backup de recuperación | Citado en auditorías/CAMBIOS; ignorado por Git | Crítico por datos y confidencialidad; alto valor de recuperación | Conservar fuera del repo o archivar en almacenamiento seguro; **NO SUBIR A GIT** | Es un respaldo previo a la migración de galería y no debe borrarse sin validar una política de retención | Copiarlo a almacenamiento cifrado/seguro, verificar restauración y definir fecha de retención con el propietario |
| `backend/logs/portfolio_backend.log` | Log generado | Producido por el sistema de logging; ignorado por Git | Alto si contiene rutas, errores o datos sensibles; crece con el uso | Conservar solo según política de diagnóstico; **NO SUBIR A GIT** | Es un artefacto generado, no código fuente | Definir rotación/retención y eliminación segura fuera de este lote |
| `backend/venv/` | Entorno virtual generado | No es consumido como código fuente; se recrea desde `requirements.txt`; **1.475 archivos están actualmente versionados** | Alto para mantenimiento y tamaño del repo; puede incluir binarios y rutas locales | Candidato prioritario a retirar del índice de Git en fase futura | Es un artefacto local recreable, no una dependencia que deba versionarse | Con autorización y tras verificar `requirements.txt`, retirar `backend/venv` del índice de Git sin borrar la copia local; no se realizó en este lote |
| `frontend/node_modules/` | Dependencias generadas | Recreable desde `package-lock.json`; ignorado por Git y no versionado | Bajo si permanece local; alto si se publica por tamaño | Conservar fuera de Git | Es generado por `npm install` | Mantener ignorado y regenerar desde lockfile |
| `frontend/dist/` | Artefacto generado de build | Generado por Vite; ignorado por Git y no versionado | Bajo; puede quedar obsoleto respecto al código fuente | Conservar fuera de Git salvo estrategia de despliegue explícita | No es fuente; contiene el build y copias de los logos procedentes de `public` | Regenerar con `npm run build`; publicar desde CI o destino de despliegue, no como fuente |
| `frontend/public/LogoCJ.ico` y `frontend/public/LogoCJ.png` | Assets fuente referenciados | `index.html` usa el ICO y `Header.jsx` usa el PNG | Alto si se eliminan: rompe favicon/logo | Conservar en repo | Son las fuentes reales que Vite copia a `dist` | Cambiar estos archivos, no las copias de `dist`, cuando se actualice la marca |
| `__pycache__/`, `*.pyc` | Caché Python generada | Sin referencias funcionales; ignorada por Git | Bajo | Candidato a limpieza local futura, nunca versionar | Se regenera automáticamente | Eliminar solo como limpieza local explícita; no requiere respaldo |
| Auditorías Markdown de raíz | Documentación histórica de diagnóstico | Referenciadas por el plan de trabajo y útiles como evidencia | Bajo | Archivar/conservar en repo | Algunas observaciones describen estados anteriores, pero preservan contexto de decisiones | En una fase documental futura, mover a `docs/auditorias/` solo con actualización de enlaces |
| `docs/HISTORIAL_CAMBIOS_DETALLADO.md` | Historial documental | Conserva el detalle retirado del changelog principal | Bajo | Conservar en repo | Mantiene trazabilidad sin sobrecargar `CAMBIOS.md` | Mantener y revisar enlaces si la documentación se reorganiza |

## Clasificación resumida

### Conservar en repo

- `check_db.py`, `inspect_db.py` y la migración histórica `migrate_project_gallery.py`.
- Herramientas de inicialización claramente fuera del flujo normal: `create_db.py` y `seed_db.py`.
- Assets fuente de marca en `frontend/public/`.
- Auditorías e historial documental.

### Conservar fuera del repo

- `backend/portfolio.db`.
- `backend/portfolio_backup_antes_galeria_real.db`, preferiblemente en almacenamiento seguro.
- Logs retenidos por diagnóstico.
- Entornos y dependencias recreables (`backend/venv`, `frontend/node_modules`) solo como copias locales.

### Archivar o decidir con el propietario

- `backend/update_db.py` por ser una alteración puntual ya aplicada.
- `backend/app/scripts/test_log.py` como diagnóstico manual.
- Modelo `User`, cuya decisión depende de la futura estrategia de autenticación y migración.
- Auditorías históricas, únicamente si se reorganiza la documentación y se actualizan enlaces.

### No ejecutar

- `backend/app/scripts/reset_db.py`: destructivo.
- `backend/update_db.py`: alteración directa histórica sobre la DB activa.
- `backend/app/scripts/seed_db.py`: escritura de datos iniciales, no destinada a la DB real existente.
- Migraciones sobre la base real sin backup, verificación y autorización explícita.

## Revisión de `.gitignore`

La configuración ya ignoraba las rutas locales actuales de `.env`, las DB y backups de `backend`, logs, caché Python, `frontend/node_modules` y `frontend/dist`.

Se reforzó la protección con patrones generales y seguros para:

- `.env` y variantes, conservando los archivos `.env.example`;
- SQLite (`*.db`, `*.sqlite`, `*.sqlite3` y archivos auxiliares WAL/SHM/journal);
- backups (`*.backup`, `backup/`, `backups/` y el `*.bak` ya existente);
- entornos virtuales Python;
- `node_modules`, `dist` y `build` generados.

También se añadió la excepción explícita de `frontend/.env.example` en el `.gitignore` del frontend para que la plantilla de configuración siga siendo visible y versionable sin exponer archivos `.env` reales.

Importante: `.gitignore` no deja de rastrear archivos ya versionados. `backend/venv/` contiene 1.475 archivos seguidos por Git; retirarlos del índice requiere una acción futura explícita del propietario. No se realizó en este lote.

## Decisiones pendientes del propietario

1. Autorizar o rechazar la retirada futura de `backend/venv/` del índice de Git.
2. Definir si `update_db.py` y `test_log.py` se archivan o se eliminan tras preservar su contexto.
3. Decidir si la autenticación futura utilizará el modelo `User`; cualquier retiro exige revisar metadata y esquema.
4. Definir almacenamiento, cifrado, prueba de restauración y retención de backups SQLite.
5. Definir rotación y retención de logs.

## Decisión documental 7.0

Esta decisión reorganiza documentación histórica y no modifica código funcional, base de datos, assets, mensajes ni contratos API.

| Archivo/Ruta | Decisión | Motivo | Acción futura sugerida |
|---|---|---|---|
| `docs/PLAN_MIGRACION_SQLITE_POSTGRESQL.md` | Eliminado del árbol de trabajo | Duplicaba planes de migración y PostgreSQL salió del alcance activo | Recuperar desde Git solo si se necesita trazabilidad exacta |
| `PLAN_MIGRACION_POSTGRESQL.md` | Archivado en `docs/archive/postgresql/PLAN_MIGRACION_POSTGRESQL.md` | Documento histórico; PostgreSQL no es ruta activa | Conservar como referencia histórica, no como plan operativo |
| Auditorías 2026-07-05 | Archivadas en `docs/archive/auditorias-2026-07-05/` | Diagnósticos históricos de estados ya corregidos | Consultar solo para trazabilidad |
| `docs/QA_FASE_6.md` | Conservado | Evidencia de QA cerrada | No reescribir resultados; actualizar solo con notas históricas si aplica |
| Scripts SQLite actuales | Conservados | Son verificaciones/migraciones históricas o herramientas de diagnóstico | Ejecutar solo en lotes autorizados y con backup cuando escriban |
| `backend/app/scripts/migrate_professional_content_fields.py` | Conservado | Migración histórica C1, idempotente y documentada | No ejecutar sobre DB real sin lote explícito y backup |
| `backend/app/scripts/sync_professional_portfolio.py` | Conservado hasta C3 | Puede ser útil para la actualización controlada de contenido | Revisar tras C3 si sigue siendo necesario |
| `backend/app/scripts/check_db.py` | Conservado | Herramienta segura de integridad | Mantener como verificación estándar |
| `backend/app/scripts/reset_db.py` | Conservar marcado como peligroso; **NO EJECUTAR** | Script destructivo, excluido de despliegue | Considerar archivado futuro con autorización |
| `backend/venv` | Pendiente para 7.2 | Artefacto recreable que aparece versionado según revisión previa | Retirar del índice de forma reversible antes de publicar |

Confirmaciones 7.0:

- SQLite permanece como motor vigente.
- PostgreSQL queda fuera del alcance activo.
- No se ejecutaron migraciones ni scripts de datos.
- No se eliminaron datos, DB, backups, logs ni assets.

## Confirmaciones de seguridad del lote

- No se ejecutó `reset_db.py`.
- No se ejecutaron `update_db.py`, `seed_db.py`, `create_db.py` ni migraciones.
- No se abrió ni modificó la base de datos real.
- No se eliminó, movió ni renombró ningún archivo.
- No se modificó backend o frontend funcional.
