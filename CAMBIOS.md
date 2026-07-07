# Cambios realizados

## 2026-07-07 - C0: auditoría y planificación de actualización profesional

Se inició una nueva revisión editorial basada en la hoja de vida actualizada y en reglas estrictas de confidencialidad. Este lote fue exclusivamente documental y de solo lectura.

- Se inventarió el contenido vigente de perfil, redes, skills, proyectos, experiencias, educación, certificaciones, assets y relaciones sin reproducir Base64, SVG, PDFs ni mensajes privados.
- Se contrastaron modelos, schemas, repositorios, servicios, routers, scripts, API, frontend público, panel admin y documentación existente.
- Se documentó la incorporación futura de Fofimatic y Kodland, sin insertar ni modificar registros.
- Se registró el conflicto entre la fecha final de Fofimatic (marzo de 2026) y la expresión “actualmente”; requiere confirmación del propietario.
- Se propuso presentar la formación como “Egresado de Ingeniería de Sistemas” hasta la ceremonia prevista para octubre de 2026.
- Se identificaron como candidatos aditivos `Project.is_confidential`, `confidentiality_note`, `client_display_name`, `allow_public_images` y `Certification.expiration_date`.
- Se confirmó que `certificate_file_id` ya sirve para PDF y que la categoría string de skills es suficiente.
- Se crearon `docs/PLAN_ACTUALIZACION_CONTENIDO_PROFESIONAL.md`, `docs/INVENTARIO_CONTENIDO_PORTFOLIO.md` y `PLAN_MIGRACION_POSTGRESQL.md`.
- Se actualizaron el plan general y referencias documentales que exponían una entidad histórica, usando una denominación reservada.
- `portfolio.db` conservó exactamente 11.026.432 bytes y `LastWriteTimeUtc=2026-07-07T07:18:23.6300185Z` antes y después; la comprobación read-only mantuvo `integrity_check=ok` y cero violaciones de FK.
- No se ejecutaron POST, PUT, PATCH, DELETE, migraciones, seeds, resets ni scripts de actualización.
- No se modificaron código funcional, contratos, autenticación, multimedia ni la base de datos.

Decisiones pendientes: vigencia y cargo de Fofimatic, cargo y publicación de Kodland, encabezado como egresado, estructura final de proyectos, tecnologías y niveles verificables, certificaciones publicables, imágenes permitidas y texto de confidencialidad.

## 2026-07-07 - Actualización del contenido profesional

Se sustituyó el contenido provisional por una línea profesional enfocada exclusivamente en Carlos Andrés Jiménez Sarmiento y su experiencia en Fofimatic S.A.S.

Contenido aplicado:

- perfil, ubicación, correo y resumen profesional actualizados; teléfono retirado de la publicación y avatar/CV existentes conservados;
- GitHub, LinkedIn y correo como únicas redes activas;
- una única experiencia activa: Fofimatic S.A.S.; una entidad anterior quedó histórica/inactiva y Kodland no se incorporó;
- seis proyectos empresariales confidenciales y textuales, sin portada, galería, demo, repositorio, cliente ni métricas inventadas;
- 41 skills activas organizadas por categoría y nivel prudente, incluyendo Power BI, DAX y Power Query;
- una única educación activa en la Universidad de Pamplona;
- certificaciones provisionales desactivadas; no se crearon credenciales sin respaldo ni se retiraron PDFs.

Estrategia de seguridad:

- backup SQLite verificado: `backend/backups/portfolio_before_content_20260707_021131.db` (ignorado por Git);
- sincronizador idempotente `app.scripts.sync_professional_portfolio`, con dry-run predeterminado, `--apply` explícito, validación de backup, una transacción y rollback;
- dry-run previo: 77 operaciones previstas, sin cambiar tamaño ni fecha de la base;
- aplicación: 77 operaciones; dry-run posterior: 0 operaciones;
- `MediaAsset` permaneció en 13 registros y mensajes en 1; no se eliminó ni modificó su contenido;
- no se ejecutaron `reset_db.py`, `update_db.py`, `seed_db.py` ni migraciones.

Verificaciones:

- backend: 23 pruebas aprobadas; existe cobertura de SQLite temporal, idempotencia, rollback, preservación de assets/mensajes, proyectos sin imágenes y experiencia activa única;
- SQLite: `foreign_keys=1`, `integrity_check=ok` y cero violaciones;
- integración local: home, seis proyectos, CORS, protección admin, lecturas admin y contacto inválido 422 aprobados;
- frontend: `npm run lint` y `npm run build` con código 0;
- QA visual básica: escritorio público y login admin móvil cargaron; la captura pública a 390 px mostró un posible recorte del título del hero que debe reconfirmarse en la siguiente revisión responsive y no se corrigió fuera de alcance.

Documentación:

- se creó `docs/CONTENIDO_PROFESIONAL_PORTAFOLIO.md`;
- se creó `docs/PLAN_MIGRACION_SQLITE_POSTGRESQL.md` como plan únicamente documental;
- no se conectó a PostgreSQL, no se migró y no se desplegó.

## 2026-07-06 - Cierre de Fase 6: pruebas tecnicas, funcionales y decision de despliegue

Se consolidaron formalmente los lotes 6.1 a 6.7 y se cerro la Fase 6 dentro de su alcance de QA.

Verificaciones finales:

- backend: 20 pruebas aprobadas en 3,08 s;
- SQLite: `foreign_keys=1`, `integrity_check=ok` y cero violaciones;
- frontend: `npm run lint` y `npm run build` con codigo 0;
- Git previo a documentar: limpio, sin staged ni untracked, rama local un commit adelante;
- `backend/venv` sigue rastreado con 1.475 archivos;
- `portfolio.db` mantuvo 11.018.240 B y la misma fecha de modificacion.

Resultados consolidados:

- QA tecnico y contratos backend: aprobados;
- QA funcional en navegador: aprobado sin CRUD real;
- responsive/accesibilidad en 8 viewports: aprobado;
- integracion/CORS local: aprobada;
- payload: `/api/public/projects` 10.233.920 B y `/api/admin/media-assets` 10.858.065 B;
- carga local inicial: aproximadamente 15.987.057 B;
- multimedia decodificada estimada: 8.140.462 B.

Decision formal:

**CONDITIONAL GO para preparacion de produccion, NO-GO para despliegue inmediato.**

Bloqueos principales:

- persistencia PostgreSQL y migracion controlada desde SQLite;
- reduccion/remedicion del payload publico y admin;
- eliminar duplicacion de portada en el transporte de galeria;
- retirar `backend/venv` del indice de Git de forma reversible;
- configurar CORS productivo, SPA Vercel, variables, secretos y comandos Render.

Confirmaciones:

- no se desplego en Vercel, Render ni PostgreSQL;
- no se implementaron optimizaciones ni cambios de arquitectura;
- no se hicieron CRUD ni modificaciones de datos;
- no se ejecutaron `reset_db.py`, `update_db.py`, `seed_db.py` ni migraciones;
- solo se actualizaron documentos de cierre.

Siguiente etapa recomendada:

- Produccion 1: optimizacion de payload multimedia;
- despues: PostgreSQL/migracion, limpieza Git, Vercel, Render, staging, smoke remoto y produccion/rollback.

## 2026-07-06 - Fase 6.7: payload y rendimiento base

Se establecio una linea base local de payload y rendimiento sin cambiar arquitectura, contratos, datos ni logica funcional.

Mediciones:

- 7 endpoints medidos con 1 calentamiento y 5 repeticiones;
- endpoint mas pesado y lento: `GET /api/admin/media-assets`, 10.858.065 B y mediana 63,62 ms;
- `GET /api/public/projects`: 10.233.920 B y mediana 60,44 ms;
- multimedia: 13 assets, 10.853.960 caracteres Base64 y 8.140.462 B decodificados estimados, mas 1.013 B SVG;
- asset mayor: imagen #10, 3.028.736 B decodificados;
- PDF: 120.656 caracteres Base64 y 90.492 B decodificados;
- build `dist`: 1.024.275 B en 5 archivos; JS principal 357.043 B y CSS 75.057 B;
- no hay source maps ni indicios de secretos en `dist`.

Carga limpia de navegador, 3 ejecuciones:

- 68 requests por ejecucion;
- 15.987.057 B transferidos segun CDP;
- DOMContentLoaded mediano 160 ms y load event mediano 161 ms;
- recurso API mas pesado: `/api/public/projects`, 10.234.157 B transferidos;
- sin errores de consola; los aborts iniciales observados corresponden a React StrictMode en desarrollo.

Riesgos identificados:

- `/projects` y `/admin/media-assets` superan el umbral interno de 10 MB;
- la galeria actual incluye la portada y el JSON la transporta dos veces, aunque React la deduplica visualmente;
- `media-assets` entrega todos los Base64 en una sola respuesta;
- 10 proyectos equivalentes podrian rondar 102 MB de JSON;
- la imagen mayor supera 3 MB y el favicon ICO pesa 270.398 B.

Confirmaciones:

- no se implementaron optimizaciones, paginacion, endpoints de archivo ni almacenamiento externo;
- `portfolio.db` conservo tamano y fecha de modificacion;
- no se hicieron CRUD ni operaciones destructivas;
- no se ejecutaron `reset_db.py`, `update_db.py`, `seed_db.py` ni migraciones;
- `npm run build` finalizo con codigo 0; lint/build finales quedan registrados al cierre del lote.

Pendientes para cierre de Fase 6:

- ejecutar verificaciones finales y consolidar resultados de Fases 6.1 a 6.7;
- decidir que riesgos de payload bloquean despliegue y cuales quedan como deuda priorizada;
- mantener las recomendaciones de optimizacion fuera de este lote.

## 2026-07-06 - Fase 6.6: matriz responsive y accesibilidad

Se completo la matriz responsive y de accesibilidad funcional con Chrome 149 y CDP en:

- 320 x 568;
- 375 x 667;
- 390 x 844;
- 430 x 932;
- 768 x 1024;
- 1024 x 768;
- 1180 x 800;
- 1440 x 900.

Resultado publico/admin:

- no se detecto overflow horizontal critico, texto letra por letra ni imagenes rotas;
- header, menu movil, anclas, cards, formularios, stats y selector admin se mantuvieron usables;
- en movil se mostro un modulo admin a la vez y en escritorio se conservaron los ocho paneles;
- proyecto, galeria, zoom, miniaturas, PDF y acciones alternativas quedaron contenidos en los viewports;
- Tab, foco visible, traps, Escape, retorno de foco, estados ARIA y `prefers-reduced-motion` quedaron aprobados;
- consola publica y admin sin errores o warnings relevantes.

Microajustes realizados:

- se corrigio `formacion` a `formación` en los dos estados visibles de certificaciones;
- se elimino el overflow horizontal interno causado por descripciones de proyecto con cadenas sin espacios;
- `Configurado` permanece en una sola linea en el stat Perfil de 320 px;
- los overlays de `AdminImagePicker` y `AdminProjectGalleryPicker` vuelven a fijarse al viewport: se retiro `backdrop-filter` solo de los paneles que alojan esos pickers.

Verificaciones:

- `npm run lint`: codigo 0;
- `npm run build`: codigo 0, 68 modulos transformados;
- `portfolio.db` conservo tamano y fecha de modificacion;
- no se realizaron CRUD, uploads, DELETE ni operaciones destructivas;
- no se ejecutaron `reset_db.py`, `update_db.py`, `seed_db.py` ni migraciones;
- no se modificaron backend, rutas, contratos, autenticacion, validaciones, SVG ni PDF.

Pendientes para Fase 6.7:

- medicion de payload y rendimiento;
- auditoria cuantitativa de contraste si se requiere conformidad formal;
- decidir si los controles compactos de 32-34 px deben crecer hacia 44 px sin reducir en exceso los visores moviles;
- mantener los CRUD reales pendientes para un lote separado con backup y autorizacion.

## 2026-07-06 - Fase 6.5: checklist manual funcional completo

Se ejecuto QA funcional con Chrome 149 headless y Chrome DevTools Protocol sobre las instancias locales reales, sin instalar dependencias ni cambiar codigo funcional.

Flujos probados:

- home publico, siete secciones, header y navegacion por anclas;
- proyecto con portada, 5 miniaturas, anterior/siguiente, zoom y cierres por Escape, boton y fondo;
- certificacion con PDF Blob valido, iframe y acciones Abrir/Descargar;
- contacto vacio y correo invalido sin envio real;
- login incorrecto y correcto, dashboard, stats y ocho modulos admin;
- selector movil mostrando un modulo a la vez;
- validaciones locales de proyecto, skill/color y certificacion/URL;
- rechazo de `README.md` como avatar antes del upload;
- refresco de mensajes y error de red simulado sin cierre de sesion;
- logout y exigencia de nuevo login al recargar `/admin`.

Datos QA y seguridad:

- no se crearon registros `QA_F6_*`;
- no se eliminaron datos QA ni registros reales;
- no se envio contacto valido, no se marco ni elimino ningun mensaje y no se modifico perfil/avatar;
- no se creo backup porque no hubo escrituras sobre `portfolio.db`;
- no se ejecutaron `reset_db.py`, `update_db.py`, `seed_db.py` ni migraciones;
- no se tocaron backend/frontend funcional, rutas, contratos, autenticacion, uploads, SVG ni PDF.

Resultado general:

- flujos publicos y administrativos de lectura/interaccion: aprobados;
- validaciones y errores no autenticativos: aprobados;
- resultado global: aprobado con pendientes autorizados para CRUD real, doble guardado del avatar y operaciones sobre mensajes;
- hallazgo menor: el titulo publico de certificaciones muestra `formacion` sin tilde;
- riesgo a revisar: el perfil admin mostro Asset ID asociado, pero no se detecto preview visual del avatar durante el recorrido.

Pendientes para Fase 6.6:

- matriz responsive completa en los viewports definidos;
- pruebas de accesibilidad con teclado, foco, lectores/semantica y contraste;
- repetir casos sin cobertura de datos: proyecto sin imagen y certificacion con `credential_url`;
- decidir si se autoriza un lote con backup y registros QA temporales para CRUD completo.

## 2026-07-06 - Fase 6.4: smoke tests de integracion frontend/backend

Se valido la integracion local mediante solicitudes HTTP controladas, reutilizando el backend activo en `http://127.0.0.1:8000` y Vite en `http://localhost:5173`.

Metodos y rutas revisados:

- estado del backend con `GET /` y `GET /api/public/health`;
- contratos publicos de `GET /api/public/home`, `GET /api/public/projects` y `GET /api/public/certifications`;
- validacion segura de contacto con `POST /api/public/contact` y payload vacio, que devolvio 422 sin crear datos;
- proteccion admin sin credenciales, que devolvio 401;
- autenticacion Basic con credenciales del entorno sin mostrarlas;
- lecturas autenticadas de perfil, proyectos, media assets, certificaciones y mensajes;
- preflight y respuesta CORS desde `http://localhost:5173`;
- disponibilidad del HTML, entrada React y modulo `publicApi.js` servidos por Vite, con URL local del backend configurada.

Resultado:

- las 16 comprobaciones HTTP resumidas fueron aprobadas;
- el backend respondio sin errores 500 ni trazas recientes;
- el proyecto publico devolvio portada y 5 imagenes de galeria ordenadas;
- el contrato publico devolvio 2 certificaciones y 1 PDF valido;
- las rutas admin de lectura respondieron 200 con autenticacion;
- CORS permitio correctamente el origen local del frontend;
- `npm run lint` finalizo con codigo 0;
- `npm run build` finalizo con codigo 0 y 68 modulos transformados.

Confirmaciones de seguridad:

- no se realizaron operaciones CRUD reales, uploads ni DELETE;
- no se envio un contacto valido ni se creo un mensaje;
- `portfolio.db` conservo el mismo tamano y `LastWriteTimeUtc` antes y despues;
- no se ejecutaron `reset_db.py`, `update_db.py`, `seed_db.py` ni migraciones;
- no se modificaron backend funcional, frontend funcional, rutas, contratos ni autenticacion.

Pendientes para Fase 6.5:

- checklist manual en navegador de los flujos publico y administrativo;
- verificar consola del navegador, galeria, zoom, modal PDF y retorno de foco;
- completar matriz responsive y de accesibilidad en los viewports definidos;
- revisar el enlace IPv6 de Vite: la instancia actual responde en `localhost:5173`, pero no en `127.0.0.1:5173`.

## 2026-07-06 - Fase 6.3: pruebas/checklist tecnico frontend

Se cerro la validacion tecnica del frontend sin tocar backend, base de datos, contratos HTTP ni logica funcional.

Decision tomada:

- no se agregaron pruebas frontend automatizadas;
- `frontend/package.json` no incluye infraestructura previa de testing (`test`, Vitest, Jest o Testing Library);
- para este lote se priorizo un checklist tecnico reproducible con revision de codigo dirigida y validacion tecnica por comandos.

Casos cubiertos:

- helpers HTTP de `publicApi.js` y `adminApi.js` para confirmar que `GET`/`DELETE` sin body no envian `Content-Type` JSON y que `POST`/`PUT`/`PATCH` con body si lo conservan;
- diferenciacion entre errores de red, abort y errores HTTP;
- parseo legible de errores 422 en `adminApi.js`, evitando `[object Object]`;
- carga parcial de `HomePage.jsx` con reintentos separados para `/api/public/home` y `/api/public/projects`;
- formulario de contacto con exito, validacion 422, error de red y conservacion del formulario en fallo;
- construccion de portada y galeria de proyectos sin duplicar la portada;
- flujo de certificaciones/PDF con `credential_url` separado del archivo PDF, creacion de Blob URL y revocacion al cerrar/cambiar;
- politica SVG segura sin `dangerouslySetInnerHTML`;
- validaciones admin y limpieza de errores locales en `AdminPage.jsx`;
- validacion temprana y estados criticos de uploads en `AdminImagePicker.jsx` y `AdminProjectGalleryPicker.jsx`.

Comandos ejecutados:

- `npm run lint` desde `frontend`: codigo 0.
- `npm run build` desde `frontend`: codigo 0; Vite compilo 68 modulos y genero `dist` correctamente.

Resultado y observaciones:

- se actualizo `docs/QA_FASE_6.md` con la seccion `Fase 6.3 - Pruebas/checklist tecnico frontend`;
- no se tocaron backend ni base de datos;
- no se ejecutaron `reset_db.py`, `update_db.py` ni `seed_db.py`;
- no se instalaron dependencias nuevas;
- quedaron documentados riesgos pendientes: ausencia de runner de pruebas frontend y persistencia de mojibake en varios textos del codigo fuente revisado.

Pendientes para Fase 6.4:

- smoke tests de integracion frontend/backend;
- pruebas manuales completas de flujos publicos y administrativos;
- matriz responsive/accesibilidad;
- decidir si conviene incorporar pruebas frontend automatizadas ligeras.

## 2026-07-06 - Fase 6.2: pruebas backend con SQLite temporal

Se creó la estructura inicial de pruebas backend para validar contratos del API sin usar la base real.

Archivos y dependencias:

- se agregaron `backend/tests/conftest.py`, `test_public_contracts.py`, `test_admin_contracts.py`, `test_media_contracts.py` y el inicializador del paquete;
- se añadieron `pytest==8.4.2` y `httpx==0.28.1` a `backend/requirements.txt`;
- `conftest.py` configura una SQLite desechable antes de importar la app, crea tablas desde los modelos reales, activa y comprueba foreign keys y elimina el entorno temporal al terminar;
- existe una protección explícita que aborta si la URL contiene `portfolio.db`, no es SQLite o queda fuera del directorio temporal;
- las credenciales de test se generan aleatoriamente y permanecen solo en memoria.

Contratos cubiertos:

- home público vacío sin datos ficticios, proyectos con/sin portada y galería ordenada, certificaciones con credencial y PDF separados, y contacto válido/inválido;
- perfil admin conservando `avatar_asset_id`, autenticación Basic, validaciones 422 y protección 409 de assets referenciados;
- tipos válidos e inválidos para avatar, portada, galería, iconos `icon`/`icon_svg` y documentos PDF;
- uploads válidos, MIME incompatible, Base64 inválido, límite de imagen de 5 MB y SVG inseguro.

Ejecución:

- comando final: `.\venv\Scripts\python.exe -m pytest` desde `backend`;
- resultado final: **20 pruebas aprobadas**, código 0, en 2,87 s;
- queda una advertencia externa de deprecación de `TestClient` con `httpx`, documentada en `docs/QA_FASE_6.md`;
- una primera ejecución aprobó las 17 pruebas entonces existentes, pero falló al limpiar un log temporal abierto en Windows; se corrigió únicamente el teardown cerrando handlers y se repitió toda la suite.

Confirmaciones:

- no se usó, abrió ni modificó `backend/portfolio.db` durante las pruebas;
- no se ejecutaron `reset_db.py`, `update_db.py`, `seed_db.py` ni migraciones;
- no se cambió lógica funcional, contratos, autenticación real, uploads, SVG ni PDF;
- no se hicieron smoke tests ni pruebas frontend.

Pendientes para Fase 6.3:

- definir y ejecutar smoke tests seguros del flujo integrado;
- completar pruebas manuales y matriz responsive/accesible en lotes posteriores;
- vigilar la transición de Starlette/FastAPI desde `httpx` hacia `httpx2` sin cambiar dependencias hasta contar con una ruta estable.

## 2026-07-06 - Fase 6.1: línea base técnica y revisión de Git

Se estableció la línea base técnica posterior al cierre de las Fases 1 a 5, sin modificar lógica funcional ni datos.

Comandos ejecutados:

- `python -m app.scripts.check_db` desde `backend`: el Python global no tenía SQLAlchemy y terminó con `ModuleNotFoundError`; no llegó a comprobar ni modificar la base;
- `.\venv\Scripts\python.exe -m app.scripts.check_db` desde `backend`: código 0, `foreign_keys = 1`, `integrity_check = ok` y `foreign_key_check` sin violaciones;
- `npm run lint` desde `frontend`: código 0;
- `npm run build` desde `frontend`: código 0, build Vite generado correctamente;
- `git status`, `git diff --stat` y `git diff --name-only` desde la raíz: antes de documentar el lote, el árbol estaba limpio y `main` estaba 5 commits por delante de `origin/main`.

Riesgos y archivos revisados:

- `backend/.env`, `backend/portfolio.db`, el backup de SQLite, `backend/logs/`, `frontend/node_modules/` y `frontend/dist/` están ignorados y no rastreados;
- `backend/venv/` sigue versionado con 1.475 archivos recreables; no se retiró del índice y queda como riesgo pendiente antes de publicar el repositorio;
- no se detectaron otros archivos rastreados bajo los patrones revisados de secretos, bases, backups, logs o builds generados;
- el detalle de resultados quedó registrado en `docs/QA_FASE_6.md`.

Confirmaciones:

- no se ejecutaron `reset_db.py`, `update_db.py`, `seed_db.py` ni migraciones;
- no se modificó deliberadamente `portfolio.db` ni sus backups;
- no se hicieron CRUD, smoke tests ni pruebas automatizadas;
- no se cambió backend funcional, frontend funcional, rutas, autenticación, validaciones, uploads, SVG ni PDF.

Pendientes para Fase 6.2:

- crear y ejecutar las pruebas técnicas o smoke tests autorizados;
- usar un entorno y datos seguros para cualquier prueba que implique escritura;
- ampliar la matriz manual responsive y de accesibilidad;
- revisar los cinco commits locales y resolver `backend/venv/` antes de publicación o despliegue.

## Cierre de Fase 5

La Fase 5 quedo cerrada con la limpieza documental, la revision segura de archivos dudosos y la actualizacion de la documentacion contractual, sin tocar backend funcional, frontend funcional ni base de datos.

Resumen de lo completado:

- se corrigieron textos visibles, mojibake y metadatos basicos del frontend y la documentacion ligera;
- se retiro `AdminNotice` al quedar obsoleto frente al estado real del panel admin;
- se revisaron y acotaron estilos compartidos y wrappers para reducir colisiones visuales;
- se actualizo la documentacion contractual (`README.md`, `backend/docs/API_FRONTEND.md`, `PLAN_TRABAJO_PORTFOLIO.md`) para reflejar el estado real del proyecto;
- se realizo la revision manual segura de archivos dudosos y se documento el inventario en `docs/REVISION_ARCHIVOS_DUDOSOS.md`;
- se refuerzo `.gitignore` para proteger `.env`, SQLite, backups, logs, entornos virtuales y artefactos generados.

Confirmaciones:

- no se toco backend funcional ni frontend funcional;
- no se modifico la base de datos;
- no se ejecuto `reset_db.py`;
- no se borraron ni movieron archivos;
- no se ejecutaron `npm run lint` ni `npm run build` en el cierre documental, porque esta etapa solo ajusto documentacion y reglas de ignorados.

Pendientes inmediatos de Fase 6:

- pruebas tecnicas y smoke tests;
- pruebas manuales sobre DB segura;
- `check_db`;
- `npm run lint` y `npm run build`;
- matriz responsive y accesibilidad;
- revision final de `git status` antes de despliegue.

## 2026-07-06 - Fase 5 - Lote 4: revisión manual de archivos dudosos

Se realizó una revisión documental y segura de scripts antiguos, modelos sin consumidores funcionales, bases de datos, backups, logs, migraciones y artefactos generados.

Cambios aplicados:

- se creó `docs/REVISION_ARCHIVOS_DUDOSOS.md` con inventario, referencias, riesgo, recomendación, motivo y acción futura para cada candidato;
- se clasificaron como **NO EJECUTAR** sobre la base real `reset_db.py`, `update_db.py` y `seed_db.py`, además de cualquier migración sin backup y autorización;
- se documentó que `portfolio.db`, su backup y los logs deben permanecer fuera de Git;
- se confirmó que `backend/venv/` es recreable y contiene 1.475 archivos actualmente versionados; no se retiró del índice y la decisión quedó pendiente del propietario;
- se conservó la migración idempotente de galería por su valor operativo e histórico;
- se reforzó `.gitignore` para cubrir entornos virtuales, variantes de `.env`, SQLite y auxiliares, backups y artefactos generados de Node/Vite.

Verificaciones y límites:

- no se eliminó, movió ni renombró ningún archivo;
- no se ejecutó `reset_db.py` ni otro script destructivo o de migración;
- no se abrió ni modificó la base de datos real;
- no se tocó backend ni frontend funcional;
- no se ejecutaron `npm run lint` ni `npm run build`, porque solo cambiaron documentación y `.gitignore`.

Archivos tocados:

- `.gitignore`
- `frontend/.gitignore`
- `docs/REVISION_ARCHIVOS_DUDOSOS.md`
- `PLAN_TRABAJO_PORTFOLIO.md`
- `CAMBIOS.md`

## 2026-07-06 - Fase 5 - Lote 3: actualizacion documental y consistencia contractual

Se actualizo la documentacion para reflejar el estado real del proyecto sin tocar codigo funcional, backend, base de datos ni contratos operativos.

Cambios aplicados:

- se reescribio `README.md` con el stack real, comandos de desarrollo y notas de seguridad actuales;
- se actualizo `backend/docs/API_FRONTEND.md` para alinear los endpoints publicos y administrativos con los contratos que hoy consume el frontend;
- se agrego en `PLAN_TRABAJO_PORTFOLIO.md` un bloque de estado real actual que marca las Fases 1 a 5 como cerradas en sus partes ya completadas y deja visibles los lotes y fases pendientes;
- se mantuvo el historial anterior de `CAMBIOS.md` sin borrar entradas utiles.

Verificaciones:

- no se ejecuto `reset_db.py`;
- no se tocaron backend funcional, frontend funcional, base de datos, autenticacion, uploads, SVG ni PDF;
- no se ejecutaron `npm run lint` ni `npm run build` porque este lote fue documental.

Archivos tocados:

- `README.md`
- `backend/docs/API_FRONTEND.md`
- `PLAN_TRABAJO_PORTFOLIO.md`
- `CAMBIOS.md`

## 2026-07-06 - Fase 5 · Lote 2: limpieza de CSS compartido y revision de wrappers sin uso

Se realizo una limpieza puntual de deuda tecnica del frontend sin cambiar contratos HTTP, autenticacion, validaciones ni logica funcional.

Cambios aplicados:

- se revisaron `AdminSkillsPanel.css`, `AdminProjectsPanel.css` y `AdminLayout.css` para confirmar duplicaciones reales antes de tocar estilos;
- no se detectaron bloques duplicados activos en `AdminSkillsPanel.css` ni en `AdminProjectsPanel.css`, por lo que no se hizo una eliminacion ciega;
- se acotaron selectores compartidos del admin en `AdminLayout.css` para evitar colisiones globales con la parte publica, especialmente en `.badge`, `.section-header` y `.entity-actions`;
- se acoto `AdminTopbar.css` para que `.admin-actions` quede ligado al topbar administrativo y no como selector generico global;
- se revisaron exports de `publicApi.js` y `adminApi.js`;
- no se eliminaron wrappers/exportaciones del servicio porque los no consumidos hoy siguen formando parte de la superficie documentada del frontend (`backend/docs/API_FRONTEND.md`) o de capacidades administrativas previstas, asi que se dejaron como pendiente segura en lugar de borrarlos por suposicion.

Verificaciones:

- `npm run lint` paso correctamente.
- `npm run build` paso correctamente.
- no se ejecuto `reset_db.py`.
- no se tocaron backend, base de datos, autenticacion, uploads, SVG ni PDF.

Archivos tocados:

- `frontend/src/styles/AdminLayout.css`
- `frontend/src/components/admin/AdminTopbar.css`
- `CAMBIOS.md`

## 2026-07-06 - Fase 5 · Lote 1: limpieza de textos visibles, mojibake y metadatos básicos

Se realizo una limpieza puntual de textos visibles y metadatos del frontend sin tocar backend, base de datos, autenticacion ni logica funcional.

Cambios aplicados:

- se corrigieron literales visibles con mojibake y faltantes de tildes en header, footer, educacion, proyectos, galeria administrativa y labels visibles del admin;
- se alinearon terminos visibles como `Educación`, `Galería`, `Módulo visible`, `Descripción`, `Documento PDF` e `imágenes`;
- se retiró `AdminNotice` porque seguía comunicando capacidades como futuras aunque ya están implementadas;
- se eliminaron su import y render en `AdminPage.jsx`, y tambien su CSS para evitar referencias huerfanas;
- se ajustó `frontend/index.html` con `lang="es"` ya consistente, un `title` mas claro y una descripcion basica del portfolio;
- se corrigieron labels base de `adminApi.js` que terminan apareciendo en mensajes legibles del panel administrativo.

Verificaciones:

- `npm run lint` paso correctamente.
- `npm run build` paso correctamente.
- no se ejecuto `reset_db.py`.
- no se tocaron backend, base de datos, autenticacion, validaciones, uploads, SVG ni PDF.

Archivos tocados:

- `frontend/index.html`
- `frontend/src/components/layout/Header.jsx`
- `frontend/src/components/layout/Footer.jsx`
- `frontend/src/components/sections/EducationSection.jsx`
- `frontend/src/components/sections/ProjectsSection.jsx`
- `frontend/src/components/admin/AdminProjectGalleryPicker.jsx`
- `frontend/src/components/admin/AdminProjectsPanel.jsx`
- `frontend/src/pages/AdminPage.jsx`
- `frontend/src/services/adminApi.js`
- `CAMBIOS.md`

Archivos retirados:

- `frontend/src/components/admin/AdminNotice.jsx`
- `frontend/src/components/admin/AdminNotice.css`

## 2026-07-06 - Cierre de Fase 4: responsividad publica y administrativa

Se realizo el cierre de Fase 4 con una revision final de QA responsive, accesibilidad visual y consistencia UX/UI del frontend publico y del panel administrativo. Solo se aplicaron microajustes de bajo riesgo; no se toco backend, base de datos, autenticacion ni logica funcional.

Resumen de Fase 4 completada:

- parte publica:
  - se ajustaron layout global, header sticky y anclas;
  - se corrigieron quiebres de texto y padding excesivo;
  - se dejo operativa la galeria/modal de proyectos en movil, tablet y desktop;
  - se dejo operativo el modal PDF de certificaciones con acciones visibles y fallback usable.
- parte administrativa:
  - se agrego selector de modulo visible para movil y modulo unico por pantalla estrecha;
  - se compactaron stats, formularios, cards y acciones;
  - se reorganizaron pickers, galeria, PDF/documentos y estados de upload;
  - se hizo una pasada final para prevenir overflow horizontal y mejorar textos visibles del selector movil.

Problemas corregidos en la fase:

- textos partidos letra por letra por combinacion de grids estrechos, `letter-spacing` y reglas de quiebre;
- saturacion del admin en movil por mostrar demasiado contenido a la vez;
- modales publicos con distribucion y altura poco eficientes en pantallas estrechas;
- pickers administrativos pesados o desbordados en movil;
- riesgo residual de overflow horizontal en contenedores admin compuestos;
- textos visibles del selector movil del admin normalizados con acentos.

Viewports revisados por breakpoints y QA de cierre:

- 320 x 568
- 375 x 667
- 390 x 844
- 430 x 932
- 480 x 1040
- 768 x 1024
- 820 x 1180
- 1024 x 768
- 1180px o superior
- 1440px o superior

Verificaciones:

- `npm run lint` paso correctamente.
- `npm run build` paso correctamente.
- no se ejecuto `reset_db.py`.
- no se tocaron backend, base de datos ni autenticacion.

Pendientes para Fase 5:

- limpieza documental y de textos no visibles heredados;
- revision de componentes o estilos redundantes que ya no aporten valor;
- refinamiento final para despliegue y verificacion manual completa con capturas/dispositivos reales.

## 2026-07-06 - Lote 3 de reforma UX/UI responsive del panel administrativo

Se mejoro la experiencia responsive de los pickers administrativos para imagenes, iconos, documentos PDF y galeria de proyectos sin tocar backend, autenticacion, validaciones ni logica de uploads.

Cambios aplicados:

- `AdminImagePicker` se reorganizo como una tarjeta compacta con preview, resumen del asset seleccionado, acciones principales y metadatos tecnicos colapsables;
- se diferencio mejor el comportamiento visual por tipo de asset: avatar/icono compacto, imagen amplia y documento PDF en formato de tarjeta documental;
- la accion `Abrir PDF` queda visible cuando existe un documento PDF usable, sin mezclarlo con otros metadatos ni con `credential_url`;
- los estados de upload se compactaron con chips de estado, progreso claro y nombres de archivo controlados con clases seguras;
- `AdminProjectGalleryPicker` se transformo en una experiencia mas clara para movil: resumen de seleccion, tira/lista compacta de imagenes, acciones por tarjeta y modal de biblioteca mas ordenado;
- en movil la galeria seleccionada ahora puede desplazarse horizontalmente sin empujar en exceso el resto del formulario;
- se mejoraron dropzones, acciones y metadatos para evitar saturacion visual y quiebres agresivos de nombres largos;
- se reforzaron estilos de foco visible para dropzones, items seleccionables y controles del modal.

Verificaciones:

- `npm run lint` paso correctamente.
- `npm run build` paso correctamente.
- no se ejecuto `reset_db.py`.

Archivos tocados:

- `frontend/src/components/admin/AdminImagePicker.jsx`
- `frontend/src/components/admin/AdminImagePicker.css`
- `frontend/src/components/admin/AdminProjectGalleryPicker.jsx`
- `frontend/src/components/admin/AdminProjectGalleryPicker.css`
- `CAMBIOS.md`

## 2026-07-06 - Lote 2 de reforma UX/UI responsive del panel administrativo

Se mejoro la experiencia visual y responsive de formularios, cards y acciones del panel administrativo sin tocar backend, autenticacion ni logica CRUD.

Cambios aplicados:

- los formularios largos de redes, skills, proyectos, experiencia, educacion y certificaciones ahora usan bloques colapsables para reducir saturacion en movil;
- el formulario de proyectos se dividio visualmente en secciones: informacion basica, descripcion, enlaces, imagen y galeria, skills asociadas y estado;
- el formulario de perfil se reorganizo en bloques claros: identidad publica, contacto, avatar/CV y guardado;
- las cards de redes, skills, proyectos, experiencia, educacion, certificaciones y mensajes ahora tienen mejor jerarquia visual con titulo, metadata compacta, badges de estado y acciones mas ordenadas;
- los botones Editar, Eliminar, Guardar, Crear, Refrescar y Marcar leido quedaron mas compactos y consistentes en movil, tablet y desktop;
- la bandeja de mensajes se presenta con comportamiento de inbox y muestra primero los pendientes;
- se mantuvieron intactos los estados CRUD por ID, validaciones cliente, uploads, autenticacion y actualizacion local existente.

Verificaciones:

- `npm run lint` paso correctamente.
- `npm run build` paso correctamente.
- no se ejecuto `reset_db.py`.

Archivos tocados:

- `frontend/src/styles/AdminLayout.css`
- `frontend/src/components/admin/AdminProfilePanel.jsx`
- `frontend/src/components/admin/AdminProfilePanel.css`
- `frontend/src/components/admin/AdminSocialLinksPanel.jsx`
- `frontend/src/components/admin/AdminSocialLinksPanel.css`
- `frontend/src/components/admin/AdminSkillsPanel.jsx`
- `frontend/src/components/admin/AdminSkillsPanel.css`
- `frontend/src/components/admin/AdminProjectsPanel.jsx`
- `frontend/src/components/admin/AdminProjectsPanel.css`
- `frontend/src/components/admin/AdminExperiencePanel.jsx`
- `frontend/src/components/admin/AdminExperiencePanel.css`
- `frontend/src/components/admin/AdminEducationPanel.jsx`
- `frontend/src/components/admin/AdminEducationPanel.css`
- `frontend/src/components/admin/AdminCertificationsPanel.jsx`
- `frontend/src/components/admin/AdminCertificationsPanel.css`
- `frontend/src/components/admin/AdminMessagesPanel.jsx`
- `frontend/src/components/admin/AdminMessagesPanel.css`
- `CAMBIOS.md`

## 2026-07-06 - Lote 1 de reforma UX/UI responsive del panel administrativo

Se reorganizo la experiencia movil base del panel admin sin tocar backend ni logica funcional.

Causa raiz confirmada:

- varios textos del admin seguian usando combinaciones de grid estrecho, `letter-spacing` alto y reglas de quiebre poco adecuadas para labels, badges, stats y botones;
- el bloque de cambio de modulo existia, pero no tenia jerarquia visual ni estado claro del modulo activo;
- los stats seguian sintiendose como cards comprimidas en movil;
- en movil el panel necesitaba hacer mas evidente que solo se trabaja con un modulo visible a la vez.

Cambios aplicados:

- se ajustaron las reglas base del admin para que headings, badges, labels, stats y botones usen quiebre normal y no se partan letra por letra;
- se mantuvieron las utilidades de quiebre fuerte solo para valores dinamicos tecnicos y no para titulos o controles;
- el bloque `Modulo visible` se convirtio en una tarjeta integrada al tema oscuro, con titulo, ayuda breve, label clara y estado actual del modulo con conteo/resumen;
- el `select` del modulo ahora tiene estilo oscuro, foco visible y un indicador visual consistente con el dashboard;
- los stats del admin se compactaron en movil como grid de 2 columnas con labels y valores mas controlados;
- se mantuvo la regla de mostrar solo el modulo seleccionado en movil, sin romper tablet y desktop.

Verificaciones:

- `npm run lint` paso correctamente.
- `npm run build` paso correctamente.
- no se ejecuto `reset_db.py`.

Archivos tocados:

- `frontend/src/pages/AdminPage.jsx`
- `frontend/src/styles/AdminLayout.css`
- `frontend/src/components/admin/AdminStatsGrid.css`
- `CAMBIOS.md`

## 2026-07-06 - Tareas 4.4, 4.5 y 4.6: responsividad del panel administrativo

Se corrigio la experiencia responsive del panel administrativo en movil, tablet y escritorio sin tocar backend, autenticacion ni contratos.

Causa raiz confirmada:

- el admin no tenia navegacion compacta por modulo, por lo que en movil se convertia en una lista muy larga de paneles;
- varios contenedores flex/grid del admin se estrechaban demasiado en pantallas pequenas;
- botones, labels, stats y textos dinamicos no tenian una estrategia consistente de ancho minimo, quiebre y apilado;
- pickers y galerias mantenian controles en linea cuando en movil necesitaban pasar a una disposicion vertical;
- el admin no tenia una capa base clara para `focus-visible`, targets tactiles y `prefers-reduced-motion`.

Cambios aplicados:

- se agrego navegacion compacta por modulo en movil mediante un selector visible solo en pantallas estrechas;
- en movil se muestra solo el modulo seleccionado, manteniendo el estado del panel sin desmontar la logica principal;
- se ajustaron topbar, stats, paneles, botones y formularios para evitar texto letra por letra y mejorar targets tactiles;
- se reforzaron `min-width`, `minmax(0, 1fr)` y quiebres seguros por palabra en cards, headings, labels y contenido dinamico;
- se compactaron los stats en movil como grid de 2 columnas;
- se apilaron mejor preview, controles, modal y dropzones de `AdminImagePicker` y `AdminProjectGalleryPicker`;
- los toasts del admin en movil ahora aparecen arriba para no tapar formularios largos;
- se agregaron reglas de `prefers-reduced-motion` y foco visible para componentes del admin.

Verificaciones:

- `npm run lint` paso correctamente.
- `npm run build` paso correctamente.
- no se ejecuto `reset_db.py`.

Archivos tocados:

- `frontend/src/pages/AdminPage.jsx`
- `frontend/src/styles/AdminLayout.css`
- `frontend/src/components/admin/AdminTopbar.css`
- `frontend/src/components/admin/AdminStatsGrid.css`
- `frontend/src/components/admin/AdminSocialLinksPanel.css`
- `frontend/src/components/admin/AdminSkillsPanel.css`
- `frontend/src/components/admin/AdminProjectsPanel.css`
- `frontend/src/components/admin/AdminExperiencePanel.css`
- `frontend/src/components/admin/AdminEducationPanel.css`
- `frontend/src/components/admin/AdminCertificationsPanel.css`
- `frontend/src/components/admin/AdminMessagesPanel.css`
- `frontend/src/components/admin/AdminImagePicker.css`
- `frontend/src/components/admin/AdminProjectGalleryPicker.css`
- `frontend/src/components/admin/AdminToast.css`
- `CAMBIOS.md`

## 2026-07-06 - Ajuste posterior al lote 4.1, 4.2 y 4.3: correccion de quiebres de texto y afinacion movil

Se corrigieron problemas introducidos o no resueltos tras el lote de responsividad de Fase 4, con foco en textos que se partian letra por letra y en el ajuste fino de los modales publicos en `320 x 568`.

Causa raiz confirmada:

- algunos textos dinamicos y no dinamicos estaban usando quiebres demasiado agresivos;
- `overflow-wrap:anywhere` sobre titulos, labels y textos de cards/modales permitia partir palabras normales letra por letra cuando un contenedor flex o grid se estrechaba;
- varios contenedores de cards y columnas necesitaban `min-width: 0` o `minmax(0, 1fr)` para evitar compresiones innecesarias;
- faltaban ajustes tipograficos finos en movil pequeno para evitar que encabezados y cards se vieran apretados.

Cambios aplicados:

- se retiro el uso agresivo de `overflow-wrap:anywhere` en headings, labels y textos donde no correspondia;
- se limitaron los quiebres a reglas seguras por palabra (`word-break: normal` y `overflow-wrap: break-word`);
- se agrego la utilidad `.text-break-safe` solo para valores dinamicos que realmente pueden llegar largos;
- se reforzaron grids con `minmax(0, 1fr)` y se agrego `min-width: 0` en contenedores de cards donde hacia falta;
- se ajustaron tipografias y paddings en `skills`, `experience`, `education`, `contact`, `projects` y `certifications` para mejorar legibilidad en movil;
- se afino nuevamente el modal de proyectos para mantener imagen visible con controles compactos y sin empujar la galeria;
- se afino el modal PDF para conservar botones visibles y mas altura util del `iframe` en pantallas muy pequenas.

Verificaciones:

- `npm run lint` paso correctamente.
- `npm run build` paso correctamente.
- no se ejecuto `reset_db.py`.

Archivos tocados:

- `frontend/src/styles/global.css`
- `frontend/src/components/sections/SkillsSection.css`
- `frontend/src/components/sections/ProjectsSection.css`
- `frontend/src/components/sections/ExperienceSection.css`
- `frontend/src/components/sections/EducationSection.css`
- `frontend/src/components/sections/CertificationsSection.css`
- `frontend/src/components/sections/ContactSection.jsx`
- `frontend/src/components/sections/ContactSection.css`
- `CAMBIOS.md`

## 2026-07-06 - Tareas 4.1, 4.2 y 4.3: responsividad critica en movil y modales publicos

Se reviso y corrigio la responsividad base del frontend publico con prioridad en `320 x 568`, sin tocar backend, rutas ni servicios.

Diagnostico confirmado:

- la vista normal estaba heredando padding global de `.page` ademas del padding propio de cada seccion;
- el header movil seguia ocupando demasiado alto en pantallas pequenas;
- el modal de proyectos perdia altura util por encabezado, controles y miniaturas demasiado grandes;
- en movil, las miniaturas de proyectos empujaban la imagen principal hacia abajo;
- el modal PDF de certificaciones dejaba poca area real para el `iframe`;
- varios textos y enlaces largos podian forzar cortes u overflow horizontal por falta de `overflow-wrap` y `min-width: 0`.

Cambios aplicados:

- se mantuvo la separacion entre pagina normal y estados de carga/error, evitando doble padding horizontal;
- se reforzo el offset de anclas con `scroll-padding-top` y `scroll-margin-top`;
- se agregaron protecciones globales contra overflow horizontal para `img`, `svg`, `iframe`, contenedores y pagina publica;
- el header movil quedo mas compacto, con logo menor, boton `Menu` mas corto y enlaces con menor altura;
- el modal de proyectos se reorganizo para usar mejor la altura disponible: controles compactos en una sola fila, visor mas eficiente, miniaturas horizontales en movil y contenido textual desplazable cuando hace falta;
- el modal de certificaciones/PDF se compacto para dar mas altura util al `iframe`, con header y acciones mas bajos en movil;
- se ajustaron tipografias, paddings y gaps en breakpoints pequenos para mantener legibilidad sin agrandar demasiado los modales.

Verificaciones:

- `npm run lint` paso correctamente.
- `npm run build` paso correctamente.
- no se ejecuto `reset_db.py`.

Archivos tocados:

- `frontend/src/styles/global.css`
- `frontend/src/pages/HomePage.jsx`
- `frontend/src/components/layout/Header.jsx`
- `frontend/src/components/layout/Header.css`
- `frontend/src/components/sections/ProjectsSection.jsx`
- `frontend/src/components/sections/ProjectsSection.css`
- `frontend/src/components/sections/CertificationsSection.jsx`
- `frontend/src/components/sections/CertificationsSection.css`
- `CAMBIOS.md`

## 2026-07-06 - Tareas 4.1 y 4.2: base responsive del frontend publico

Se ajusto la base responsive del portfolio publico sin tocar backend, rutas ni servicios.

Cambios aplicados:

- se elimino el padding global de `.page` para que la vista normal no sume espacio horizontal extra encima del padding propio de cada seccion;
- se separaron los estados de carga y error de `HomePage` usando una variante `page--state`, evitando que compartan el mismo layout de la pagina publica normal;
- se agrego `scroll-padding-top` y `scroll-margin-top` para que las anclas no queden ocultas bajo el header sticky;
- se redujo el padding horizontal en pantallas pequenas para mantener mejor ancho util en 320px;
- el header paso a un modo compacto en movil con boton `Menu`, cierre por `Escape`, cierre al tocar un enlace y foco visible;
- se reforzo el padding interno del header para evitar desbordes y mantener navegacion usable en movil, tablet y escritorio.

Verificaciones:

- `npm run lint` paso correctamente.
- `npm run build` paso correctamente.
- no se ejecuto `reset_db.py`.

Archivos tocados:

- `frontend/src/styles/global.css`
- `frontend/src/pages/HomePage.jsx`
- `frontend/src/components/layout/Header.jsx`
- `frontend/src/components/layout/Header.css`
- `CAMBIOS.md`

## Cierre de Fase 3

La Fase 3 del panel administrativo quedo completada con mejoras de resiliencia, validacion y experiencia de uso, sin tocar backend, base de datos ni autenticacion.

Resumen:

- los modulos admin cargan de forma independiente y un fallo puntual ya no derriba el panel completo;
- los errores 422 de FastAPI se muestran de forma legible por campo;
- los formularios admin validan de manera coherente con los schemas del backend antes de enviar;
- las subidas muestran estado por archivo, permiten cancelacion y conservan los exitos parciales;
- certificaciones, PDF y documentos quedaron mejor alineados en la interfaz administrativa;
- proyectos, skills e iconos mantienen compatibilidad segura con la politica definida para assets;
- el ciclo de vida de assets subidos antes de guardar se documenta sin eliminacion automatica;
- los mensajes de contacto quedaron con refresco manual y borrado confirmado cuando el backend lo permite.

Riesgos corregidos:

- doble envio en formularios y eliminaciones;
- perdida de estado local al fallar un modulo aislado;
- errores poco legibles en validacion;
- confusion entre imagen, documento, PDF e icono;
- posible eliminacion automatica de assets subidos antes de asociarlos.

Verificaciones:

- `npm run lint` paso correctamente.
- `npm run build` paso correctamente.
- no se ejecuto `reset_db.py`.
- no se implemento limpieza automatica de assets.

Pendientes para Fase 4:

- responsividad movil, tablet y escritorio;
- ajustes finos de layout en pantallas pequenas;
- revisiones visuales puntuales donde la informacion se comprima demasiado.

## 2026-07-06 - Tarea 3.9: refresco manual y borrado de mensajes de contacto

Se mejoro el panel administrativo de mensajes de contacto sin tocar backend, base de datos ni autenticacion.

Cambios aplicados:

- se agrego un boton de refresco manual para volver a consultar solo el modulo de mensajes;
- el refresco reutiliza la carga independiente ya existente y muestra estado visual mientras actualiza;
- se expuso en la interfaz la eliminacion de mensajes que ya existia en el backend, con confirmacion explicita e irreversible;
- cada mensaje tiene estado por ID para evitar doble marca como leido o doble eliminacion;
- al eliminar un mensaje, se actualiza la lista local y los contadores del dashboard sin recargar todo el panel;
- el boton de reintento sigue funcionando cuando hay error del modulo.

Decision tomada:

- como el endpoint de eliminacion ya existia, se reutilizo y se expuso en la UI;
- no se creo ningun endpoint nuevo;
- no se modifico el contrato de autenticacion ni se agrego almacenamiento de credenciales.

Verificaciones:

- `npm run lint` paso correctamente.
- `npm run build` paso correctamente.

Archivos tocados:

- `frontend/src/pages/AdminPage.jsx`
- `frontend/src/components/admin/AdminMessagesPanel.jsx`
- `frontend/src/components/admin/AdminMessagesPanel.css`
- `frontend/src/services/adminApi.js`
- `CAMBIOS.md`

## 2026-07-06 - Tarea 3.8: ciclo de vida seguro de assets previos al guardado

Se definio un ciclo de vida informativo para los assets subidos desde formularios administrativos. No se agrego ninguna eliminacion automatica ni se modifico backend o base de datos.

Mejoras aplicadas:

- el panel registra en memoria, por formulario, los assets subidos durante la edicion actual;
- el inventario temporal se deduplica por ID y se muestra junto a los selectores de avatar, icono, portada, galeria y PDF;
- el estado de upload aclara que el asset ya quedo en la biblioteca, pero su asociacion al registro solo se confirma al guardar el formulario;
- al cancelar una edicion con subidas nuevas, se informa por nombre que los assets se conservaron en la biblioteca;
- despues de guardar, se comparan las subidas de la sesion con los IDs realmente enviados por el formulario y se avisa si alguna no quedo asociada en ese guardado;
- los assets subidos siguen disponibles para reutilizarlos y las listas locales evitan IDs duplicados;
- se agrego un estado visual de aviso al toast administrativo para distinguir estos mensajes de un error o un guardado normal.

Decision de seguridad:

- no se borra ningun `MediaAsset`, archivo, documento o Base64 automaticamente;
- una subida no asociada en un formulario es solo una candidata a revision, no se declara huerfana global sin comprobar todas sus referencias;
- cualquier mantenimiento o limpieza futura queda fuera de alcance y debera validar referencias reales, pedir confirmacion explicita y respetar la proteccion de borrado de la Fase 1.3.

Verificaciones:

- `npm run lint` paso correctamente.
- `npm run build` paso correctamente.
- no se ejecuto `reset_db.py` ni se modificaron datos.

Archivos tocados:

- `frontend/src/pages/AdminPage.jsx`
- `frontend/src/components/admin/AdminProfilePanel.jsx`
- `frontend/src/components/admin/AdminSkillsPanel.jsx`
- `frontend/src/components/admin/AdminProjectsPanel.jsx`
- `frontend/src/components/admin/AdminCertificationsPanel.jsx`
- `frontend/src/components/admin/AdminImagePicker.jsx`
- `frontend/src/components/admin/AdminImagePicker.css`
- `frontend/src/components/admin/AdminProjectGalleryPicker.jsx`
- `frontend/src/components/admin/AdminProjectGalleryPicker.css`
- `frontend/src/components/admin/AdminToast.jsx`
- `frontend/src/components/admin/AdminToast.css`
- `CAMBIOS.md`

## 2026-07-06 - Tarea 3.6: estados por elemento, orden local y conteos en panel admin

Se reforzo el comportamiento del panel administrativo sin tocar backend, rutas ni contratos. El objetivo fue que cada modulo reaccione mejor a operaciones individuales de crear, editar y eliminar, sin bloquear innecesariamente el resto del panel.

Mejoras aplicadas:

- se agregaron estados de eliminacion por ID para redes, skills, proyectos, experiencia, educacion y certificaciones;
- cada tarjeta deshabilita solo sus propias acciones mientras se elimina, en lugar de congelar todo el modulo;
- los formularios principales ya no permiten doble envio accidental en crear o editar;
- marcar mensajes como leidos ahora usa estado por mensaje para evitar acciones duplicadas;
- despues de crear o editar, las listas locales quedan reordenadas por `display_order`;
- el orden mantiene desempate estable usando el orden previo cuando dos elementos comparten el mismo `display_order`;
- los conteos del dashboard se siguen actualizando localmente cuando cambian redes, skills, proyectos, experiencia, educacion, certificaciones o mensajes.

Verificaciones:

- `npm run lint` paso correctamente.
- `npm run build` paso correctamente.

Archivos tocados:

- `frontend/src/pages/AdminPage.jsx`
- `frontend/src/components/admin/AdminSocialLinksPanel.jsx`
- `frontend/src/components/admin/AdminSkillsPanel.jsx`
- `frontend/src/components/admin/AdminProjectsPanel.jsx`
- `frontend/src/components/admin/AdminExperiencePanel.jsx`
- `frontend/src/components/admin/AdminEducationPanel.jsx`
- `frontend/src/components/admin/AdminCertificationsPanel.jsx`
- `frontend/src/components/admin/AdminMessagesPanel.jsx`
- `CAMBIOS.md`

## 2026-07-06 - Tareas 3.5 y 3.7: mejor UX para documentos PDF y compatibilidad icon/icon_svg

Se ajusto `AdminImagePicker` para que cuando se use con `assetType="document"` hable de documento/PDF en lugar de imagen. El picker ahora muestra informacion util del asset asociado sin mezclarlo con `credential_url`:

- nombre del archivo;
- tipo de asset;
- MIME;
- tamano aproximado derivado del Base64 cuando esta disponible;
- accion `Abrir PDF` cuando el documento asociado puede prepararse correctamente.

Si no hay PDF utilizable, el picker muestra un estado honesto en lugar de insinuar una previsualizacion inexistente. La accion de apertura usa una Blob URL temporal bajo demanda, sin duplicar el visor publico completo.

Tambien se reforzo la compatibilidad historica del selector de iconos:

- el picker muestra assets `icon` e `icon_svg` cuando se usa para skills;
- la lista se deduplica por `id` para evitar entradas repetidas;
- los SVG siguen renderizandose solo mediante `getSafeSvgDataUrl`, sin `dangerouslySetInnerHTML`;
- si un SVG no pasa la politica segura, se mantiene el fallback visual existente;
- skills existentes con iconos historicos siguen pudiendo editarse sin perder la relacion.

Verificaciones:

- `npm run lint` paso correctamente.
- `npm run build` paso correctamente.

Archivos tocados:

- `frontend/src/components/admin/AdminImagePicker.jsx`
- `frontend/src/components/admin/AdminImagePicker.css`
- `frontend/src/services/adminApi.js`
- `CAMBIOS.md`

## 2026-07-06 - Tarea 3.4: estado de upload administrativo mas claro y resistente

Se mejoro el flujo de subida en `AdminImagePicker` y `AdminProjectGalleryPicker` sin tocar backend. Ambos componentes ahora muestran estado por archivo y mantienen la validacion previa de tamano, MIME, extension y SVG seguro antes de leer cualquier archivo.

Mejoras aplicadas:

- estados por archivo: `pendiente`, `leyendo`, `subiendo`, `completado`, `fallido` y `cancelado`;
- barra de progreso visual por archivo basada en las etapas reales del flujo;
- validacion previa a `FileReader`, de modo que un archivo invalido falla sin leerse ni enviarse;
- cancelacion viable de cargas activas con `AbortController` para la peticion y `FileReader.abort()` para la lectura local;
- aviso claro cuando el usuario intenta cerrar el modal con uploads en curso;
- bloqueo de acciones que podrian generar cambios confusos mientras hay una subida activa;
- prevencion de doble envio accidental mientras un upload sigue en progreso.

Comportamiento conservado:

- un fallo parcial ya no elimina archivos que si terminaron bien;
- en galeria, las imagenes ya asociadas no se pierden si otra subida falla;
- drag and drop respeta las mismas reglas que la seleccion manual;
- `uploadMediaAsset` ahora acepta `signal` opcional, sin cambiar el contrato de backend.

Verificaciones:

- `npm run lint` paso correctamente.
- `npm run build` paso correctamente.

Archivos tocados:

- `frontend/src/components/admin/AdminImagePicker.jsx`
- `frontend/src/components/admin/AdminImagePicker.css`
- `frontend/src/components/admin/AdminProjectGalleryPicker.jsx`
- `frontend/src/components/admin/AdminProjectGalleryPicker.css`
- `frontend/src/services/adminApi.js`
- `CAMBIOS.md`

## 2026-07-06 - Tarea 3.3: validacion cliente alineada con schemas admin

Se agrego validacion cliente en los formularios administrativos tomando como referencia las reglas principales de `backend/app/schemas/admin_schema.py`, sin tocar backend, rutas ni contratos. La validacion se ejecuta antes de enviar y evita peticiones innecesarias cuando el dato ya es invalido desde el navegador.

Cobertura aplicada:

- login admin: usuario y contrasena obligatorios;
- perfil: maximos de longitud y validacion de `cv_url` si se informa;
- redes: `platform` requerida, `url` valida, `icon_name` y `display_order`;
- skills: `name`, `category`, `level`, `color` hexadecimal y `display_order`;
- proyectos: `title`, `slug`, `short_description`, `description`, URLs opcionales, `display_order` y duplicados en `gallery_image_ids`;
- experiencia: `position`, `company`, `start_date`, cronologia `start_date/end_date`, `display_order` y bullets minimos;
- educacion: `institution`, `degree`, anos razonables y orden cronologico;
- certificaciones: `name`, `credential_url` opcional valida y `display_order`.

Comportamiento aplicado:

- si el formulario es invalido, no se envia al backend;
- cada formulario muestra un resumen legible de errores dentro del propio panel;
- al editar un campo, su error local se limpia sin depender del backend;
- se mantiene el fallback de errores `422` del backend implementado en la tarea 3.2 por si algo no fue detectado en frontend.

Verificaciones:

- `npm run lint` paso correctamente.
- `npm run build` paso correctamente.

Archivos tocados:

- `frontend/src/pages/AdminPage.jsx`
- `frontend/src/components/admin/AdminAuthCard.jsx`
- `frontend/src/components/admin/AdminProfilePanel.jsx`
- `frontend/src/components/admin/AdminSocialLinksPanel.jsx`
- `frontend/src/components/admin/AdminSkillsPanel.jsx`
- `frontend/src/components/admin/AdminProjectsPanel.jsx`
- `frontend/src/components/admin/AdminExperiencePanel.jsx`
- `frontend/src/components/admin/AdminEducationPanel.jsx`
- `frontend/src/components/admin/AdminCertificationsPanel.jsx`
- `CAMBIOS.md`

## 2026-07-06 - Tareas 3.1 y 3.2: resiliencia del panel admin y errores 422 legibles

Se mejoro la resiliencia del panel administrativo para que los modulos carguen de forma independiente. La carga inicial ya no depende de una sola `Promise.all`: si falla proyectos, media assets, skills, mensajes u otro modulo, el resto del dashboard sigue disponible y cada panel muestra su propio error con opcion de reintento.

Tambien se mantuvo el comportamiento seguro de autenticacion:

- solo una respuesta `401` o `403` invalida la sesion en memoria y devuelve al login;
- errores de red, `422` u otros fallos de modulo ya no cierran sesion;
- el loader completo solo se usa antes de entrar al panel; una vez autenticado, los modulos pueden recargarse sin bloquear todo el dashboard.

Ademas, los errores `422` de FastAPI ahora se convierten en mensajes legibles por campo dentro de `adminApi`, evitando respuestas como `[object Object]`. El parser cubre listas de validacion, `detail` como objeto, mensajes simples y formatos inesperados con fallback seguro.

En los paneles admin se agrego una capa minima de feedback:

- mensaje de error propio por modulo;
- estado visual de actualizacion del modulo;
- boton `Reintentar` por panel cuando aplica.

Verificaciones:

- `npm run lint` paso correctamente.
- `npm run build` paso correctamente.
- No se tocaron backend, base de datos ni autenticacion fuera del manejo de sesion en memoria ya existente.

Archivos tocados:

- `frontend/src/pages/AdminPage.jsx`
- `frontend/src/services/adminApi.js`
- `frontend/src/components/admin/AdminProfilePanel.jsx`
- `frontend/src/components/admin/AdminSocialLinksPanel.jsx`
- `frontend/src/components/admin/AdminSkillsPanel.jsx`
- `frontend/src/components/admin/AdminProjectsPanel.jsx`
- `frontend/src/components/admin/AdminExperiencePanel.jsx`
- `frontend/src/components/admin/AdminEducationPanel.jsx`
- `frontend/src/components/admin/AdminCertificationsPanel.jsx`
- `frontend/src/components/admin/AdminMessagesPanel.jsx`
- `CAMBIOS.md`

## Cierre de Fase 2

La Fase 2 quedo cerrada con la resiliencia de la vista publica, la correccion de datos visibles y la alineacion de proyectos, PDF y modales con una experiencia mas segura y utilizable. La carga de `home` y `projects` ahora es independiente, el formulario de contacto muestra errores reales y la portada deja de inventar informacion cuando faltan datos.

Riesgos corregidos:

- fallos parciales de API que antes ocultaban contenido completo;
- fallbacks publicos que aparentaban datos reales;
- fechas, pais, ciudad y anos mostrados de forma inconsistente;
- SVG y PDF sin fallback claro o sin comportamiento accesible;
- modales publicos sin soporte funcional completo de teclado.

Verificaciones realizadas o pendientes:

- `npm run lint` paso correctamente.
- `npm run build` paso correctamente.
- La vista publica conserva contenido aun si falla solo una parte de la carga.
- No se presentaron datos personales falsos en los componentes publicos tocados.
- Galeria, PDF y modales quedaron alineados con seguridad y accesibilidad.
- No se ejecuto `reset_db.py`.

Pendientes para Fase 3:

- refinamientos del panel administrativo;
- validaciones y estados de formulario del admin;
- mejoras de carga, errores y sincronizacion interna del dashboard;
- ajustes adicionales de CRUD y uploads cuando correspondan.

## 2026-07-06 - Tarea 2.8: accesibilidad funcional en modales publicos

Se completo la accesibilidad funcional de los modales publicos de proyectos y certificaciones sin cambiar su flujo principal. Ambos dialogos ahora:

- mueven el foco inicial a un elemento seguro al abrirse;
- bloquean el scroll del documento de fondo mientras estan abiertos;
- encierran la tabulacion dentro del modal con focus trap;
- cierran con `Escape`, boton y clic sobre el fondo;
- devuelven el foco al elemento que abrio el modal cuando se cierran.

En `ProjectsSection` se agrego tambien:

- navegacion del carrusel con `ArrowLeft` y `ArrowRight`;
- estado accesible para miniaturas activas mediante `aria-pressed` y `aria-current`;
- labels mas claros para anterior/siguiente y foco visible en controles del modal.

En `CertificationsSection` se mantuvo el ciclo de revocacion del Blob URL y el modal PDF ahora conserva accesibles las acciones de cerrar, abrir en nueva pestana y descargar.

Archivos tocados:

- `frontend/src/components/sections/ProjectsSection.jsx`
- `frontend/src/components/sections/ProjectsSection.css`
- `frontend/src/components/sections/CertificationsSection.jsx`
- `frontend/src/components/sections/CertificationsSection.css`
- `CAMBIOS.md`

## 2026-07-06 - Tareas 2.5 y 2.6: SVG seguro en proyectos y fallback usable para PDF

Se alineo la visualizacion publica de proyectos con la politica segura de SVG definida en la Fase 1. `ProjectsSection` ahora reutiliza `frontend/src/utils/svgSecurity.js` para mostrar SVG solo cuando pueden convertirse en una data URL segura; no se usa `dangerouslySetInnerHTML` y un asset SVG que no pase la politica queda oculto con un fallback visual claro en lugar de renderizarse de forma insegura.

Tambien se reforzo el visor PDF de certificaciones:

- la creacion y revocacion del Blob URL ahora se concentra en un solo ciclo de vida del estado del modal;
- si el PDF base64 no puede convertirse, se muestra un error visible en la seccion;
- el modal mantiene la vista previa embebida y agrega acciones alternativas de `Abrir en nueva pestana` y `Descargar PDF`;
- `credential_url` sigue funcionando como enlace externo independiente.

Archivos tocados:

- `frontend/src/components/sections/ProjectsSection.jsx`
- `frontend/src/components/sections/ProjectsSection.css`
- `frontend/src/components/sections/CertificationsSection.jsx`
- `frontend/src/components/sections/CertificationsSection.css`
- `CAMBIOS.md`

## 2026-07-06 - Tareas 2.3 y 2.4: datos publicos honestos y fechas legibles

Se retiraron fallbacks que aparentaban ser datos reales cuando el perfil no está disponible o cuando faltan campos de contacto. El hero, el footer y la sección de contacto ahora muestran información real si existe en el backend y, si no, usan textos honestos o simplemente ocultan el dato en lugar de inventarlo.

También se corrigió la presentación de fechas y periodos en las secciones públicas:

- `is_current` decide cuando una experiencia muestra `Actualidad`.
- `country` y `city` se combinan cuando existen.
- `start_date` y `end_date` de experiencia se muestran en formato legible en español sin depender del parseo UTC del navegador.
- `start_year` y `end_year` de educación se presentan de forma clara.
- `issue_date` de certificaciones se formatea en español de forma legible.

Archivos tocados:

- `frontend/src/components/sections/HeroSection.jsx`
- `frontend/src/components/layout/Footer.jsx`
- `frontend/src/components/sections/ContactSection.jsx`
- `frontend/src/components/sections/ExperienceSection.jsx`
- `frontend/src/components/sections/EducationSection.jsx`
- `frontend/src/components/sections/CertificationsSection.jsx`
- `frontend/src/pages/HomePage.jsx`
- `CAMBIOS.md`

## 2026-07-06 - Tareas 2.1, 2.2 y 2.7: resiliencia del frontend publico y formulario de contacto

Se desacoplo la carga de `/api/public/home` y `/api/public/projects` para que la vista publica no dependa de una sola solicitud. La pagina principal ahora conserva perfil, skills, experiencia, educacion y certificaciones si falla la carga de proyectos, y la seccion de proyectos muestra su propio estado de error con reintento independiente.

Tambien se ajustaron los helpers HTTP del frontend:

- `GET` y `DELETE` sin body ya no envian `Content-Type: application/json`.
- `POST`, `PUT` y `PATCH` con JSON conservan el header correspondiente.
- Se agrego soporte de `AbortController` para evitar actualizaciones de estado despues de desmontar o reintentar cargas.
- Los errores HTTP ahora se interpretan por status con mensajes mas utiles, incluyendo validaciones `422` y fallos de red.

En el formulario publico de contacto:

- se muestran mensajes reales de validacion cuando el backend responde `422`;
- se diferencia un fallo de red de un fallo del servidor;
- el formulario conserva lo escrito cuando el envio falla;
- el formulario solo se limpia cuando el envio termina correctamente.

Archivos tocados:

- `frontend/src/pages/HomePage.jsx`
- `frontend/src/components/sections/ProjectsSection.jsx`
- `frontend/src/components/sections/ProjectsSection.css`
- `frontend/src/components/sections/ContactSection.jsx`
- `frontend/src/services/publicApi.js`
- `frontend/src/services/adminApi.js`
- `CAMBIOS.md`

## 2026-07-06 - Tarea 1.7: credenciales administrativas solo en memoria

Se retiro la persistencia del usuario y la contrasena administrativa en `localStorage`. HTTP Basic se mantiene sin cambios en las rutas admin, pero las credenciales ahora viven unicamente en memoria dentro del modulo de API mientras la pagina permanece abierta.

Comportamiento aplicado:

- Una recarga de `/admin` descarta la sesion en memoria y vuelve a mostrar el login.
- Al cargar la aplicacion se elimina la antigua clave `portfolio-admin-auth` tanto de `localStorage` como de `sessionStorage`.
- Logout limpia credenciales, datos y formularios administrativos mantenidos en memoria.
- Una respuesta `401 Unauthorized` o `403 Forbidden` limpia la sesion y devuelve al login.
- Errores de red y respuestas no autenticativas no eliminan las credenciales en memoria.

Archivos tocados:

- `frontend/src/services/adminApi.js`
- `frontend/src/pages/AdminPage.jsx`
- `CAMBIOS.md`

## 2026-07-05 - Tarea 1.6: eliminacion del vector XSS en SVG

Se elimino la insercion de `svg_content` como HTML crudo en la vista publica y el panel administrativo. Los SVG seguros ahora se muestran como imagen mediante una data URL codificada; si un asset historico no supera la politica de seguridad, se usa el fallback visual existente y nunca se inserta su contenido en el DOM como HTML.

La carga de nuevos SVG aplica defensa en profundidad:

- El frontend rechaza el archivo antes de enviarlo si contiene contenido activo.
- El schema del backend valida XML bien formado y rechaza scripts, eventos `on*`, `foreignObject`, estilos inline, animaciones, elementos embebidos, esquemas `javascript:`, `vbscript:` o `data:`, referencias externas, `DOCTYPE`, entidades e instrucciones de procesamiento.
- El servicio administrativo vuelve a validar el SVG inmediatamente antes de persistirlo.
- Los SVG seguros existentes, incluidos los iconos iniciales de Python, FastAPI y React, conservan su visualizacion.

Archivos tocados:

- `backend/app/schemas/admin_schema.py`
- `backend/app/services/admin_service.py`
- `frontend/src/utils/svgSecurity.js`
- `frontend/src/components/sections/SkillsSection.jsx`
- `frontend/src/components/admin/AdminImagePicker.jsx`
- `frontend/src/components/admin/AdminProjectGalleryPicker.jsx`
- `frontend/src/components/admin/AdminSkillsPanel.jsx`
- `CAMBIOS.md`

## 2026-07-05 - Tarea 1.5: limites de tamano y validacion de archivos en `MediaAsset`

Se agregaron validaciones preventivas para uploads administrativos de `MediaAsset` tanto en frontend como en backend. El admin ahora rechaza archivos sobredimensionados o con tipo no permitido antes de usar `FileReader`, y el backend valida nuevamente MIME, extension, Base64 y SVG antes de persistir.

Limites aplicados:

- `avatar`: maximo 2 MB.
- `image`: maximo 5 MB.
- `icon` y `icon_svg`: maximo 5 MB para conservar compatibilidad con iconos historicos basados en imagen.
- `document`: maximo 10 MB.

Validaciones agregadas:

- MIME permitido por `asset_type`.
- Extension permitida cuando el MIME viene vacio o dudoso.
- Base64 valido y tamano real aproximado antes del commit.
- `svg_content` no vacio y con contenido SVG reconocible.
- Rechazo temprano en seleccion manual y drag and drop del admin.

Archivos tocados:

- `backend/app/schemas/admin_schema.py`
- `frontend/src/components/admin/AdminImagePicker.jsx`
- `frontend/src/components/admin/AdminProjectGalleryPicker.jsx`
- `CAMBIOS.md`

## 2026-07-05 - Tarea 1.4: validacion de tipos de `MediaAsset` en asociaciones admin

Se formalizaron los tipos esperados de `MediaAsset` en backend y se validan antes de asociarlos desde el panel admin. El servicio ahora comprueba existencia y tipo para `avatar_asset_id`, `icon_asset_id`, `image_asset_id`, `gallery_image_ids` y `certificate_file_id`, con mensajes claros cuando el ID no existe o el tipo no corresponde. Tambien se mantuvo compatibilidad con iconos historicos `icon` e `icon_svg`.

Reglas aplicadas:

- `avatar` para avatar de perfil.
- `image` para portada y galeria de proyectos.
- `icon` o `icon_svg` para iconos de skills.
- `document` con `mime_type=application/pdf` para certificados PDF.

Compatibilidad conservada:

- Los iconos historicos `asset_type=icon` siguen siendo validos y ahora vuelven a aparecer en el picker admin junto con `icon_svg`.
- No se migraron datos ni se borraron assets existentes.
- La galeria de proyectos sigue usando solo `image`.

Archivos tocados:

- `backend/app/schemas/admin_schema.py`
- `backend/app/services/admin_service.py`
- `frontend/src/components/admin/AdminImagePicker.jsx`
- `CAMBIOS.md`

## 2026-07-05 - Tarea 1.3: proteccion de borrado de `MediaAsset`

Se protegio el endpoint administrativo de borrado de assets para impedir que un `MediaAsset` se elimine cuando sigue referenciado por avatar de perfil, iconos de skills, portada de proyecto, galeria de proyectos o archivo PDF de certificacion. El backend ahora revisa esas relaciones antes del `delete` y responde con `409 Conflict` y un detalle claro cuando el asset sigue en uso.

Archivos tocados:

- `backend/app/repositories/admin_repository.py`
- `backend/app/services/admin_service.py`
- `CAMBIOS.md`

Comportamiento conservado:

- Retirar una imagen de la galeria sigue eliminando solo la asociacion en `project_images`, no el `MediaAsset` global.
- Un asset sin referencias activas se sigue pudiendo eliminar por el flujo administrativo actual.

## 2026-07-05 - Tarea 1.2: integridad y foreign keys de SQLite

Se activo `PRAGMA foreign_keys=ON` mediante un evento `connect` del engine de SQLAlchemy para que se aplique a cada conexion SQLite del backend. El script seguro de chequeo ahora reporta `PRAGMA foreign_keys`, `PRAGMA integrity_check` y `PRAGMA foreign_key_check`, y detiene la verificacion con un error claro si encuentra inconsistencias, sin intentar corregir datos.

Archivos tocados:

- `backend/app/database/connection.py`
- `backend/app/scripts/check_db.py`
- `CAMBIOS.md`

Verificacion previa:

- Se confirmo la existencia de `backend/portfolio_backup_antes_galeria_real.db` antes de ejecutar pruebas contra la base real.
- No se ejecuto `reset_db.py` ni ningun script destructivo.

## 2026-07-05 - Tarea 1.1: conservacion de `avatar_asset_id` en perfil admin

Se corrigio el contrato minimo del perfil administrativo para evitar que el avatar desaparezca al editar y guardar solo texto. El backend ahora expone `avatar_asset_id` en el perfil admin y el frontend conserva ese valor, con `avatar.id` como respaldo si el campo no viene en la respuesta.

Archivos tocados:

- `backend/app/schemas/admin_schema.py`
- `backend/app/routers/admin_router.py`
- `frontend/src/pages/AdminPage.jsx`

Riesgo pendiente:

- Si el backend devolviera `avatar` y `avatar_asset_id` desincronizados, React seguira priorizando `avatar_asset_id` y usando `avatar.id` solo como fallback.

## Cierre de Fase 1

La Fase 1 quedo cerrada con las correcciones base de integridad, contrato administrativo, proteccion de assets y endurecimiento de uploads y SVG. Se redujeron estos riesgos principales:

- perdida accidental de `avatar_asset_id` al editar el perfil admin;
- borrado de assets aun referenciados;
- asociaciones invalidas entre assets y entidades;
- uploads fuera de limite o con MIME/base64 dudoso;
- inyeccion XSS por SVG no confiable;
- persistencia de credenciales administrativas en almacenamiento del navegador.

Verificaciones realizadas o pendientes:

- `check_db` paso con `foreign_keys = 1`, `integrity_check = ok` y `foreign_key_check` sin violaciones.
- Se mantuvo la compatibilidad con los flujos existentes de admin y galeria.
- No se ejecuto `reset_db.py`.

Pendientes para fases posteriores:

- ajustes de integracion visual y funcional del frontend publico;
- mejoras de responsividad;
- limpieza final de componentes y documentacion operacional;
- preparacion de despliegue y verificaciones manuales completas.

## Cambios recientes

- Se implemento el visor PDF modal simple para certificaciones publicas.
- Se implemento la galeria de imagenes por proyecto en backend, admin y vista publica.
- Se habilito la subida multiple de imagenes en la galeria administrativa de proyectos.
- Se ajusto el carrusel publico de proyectos para mostrar la imagen completa dentro de un contenedor fijo.
- Se corrigieron el favicon con `LogoCJ.ico` y el logo visible del header con la ruta publica correcta.
- Se dejo documentado el estado real del proyecto en los planes y auditorias recientes.

## Historial detallado

El historial extenso de cambios, limpieza y fases previas quedo archivado en [docs/HISTORIAL_CAMBIOS_DETALLADO.md](docs/HISTORIAL_CAMBIOS_DETALLADO.md).

