# QA Fase 6

## Fase 6.1 - Linea base tecnica y Git

Fecha de ejecucion: 2026-07-06.

| Comando o revision | Resultado esperado | Resultado obtenido | Estado | Observaciones |
|---|---|---|---|---|
| `python -m app.scripts.check_db` con Python global | Ejecutar el chequeo seguro de SQLite | Fallo antes de conectarse: `ModuleNotFoundError: No module named 'sqlalchemy'` | Advertencia | El Python global no tenia las dependencias del backend. No fue un fallo de la base de datos. |
| `.\venv\Scripts\python.exe -m app.scripts.check_db` desde `backend` | `foreign_keys = 1`, `integrity_check = ok` y sin violaciones | `foreign_keys = 1`, `integrity_check = ok`, `foreign_key_check = []`, conexion correcta | Aprobado | Codigo de salida 0. El script solo realizo comprobaciones de integridad. |
| `npm run lint` desde `frontend` | ESLint sin errores | Finalizo sin errores | Aprobado | Codigo de salida 0. |
| `npm run build` desde `frontend` | Build de produccion correcto | Vite transformo 68 modulos y genero `dist` correctamente | Aprobado | Codigo de salida 0. |
| `git status` antes de documentar el lote | Estado del arbol identificado | Arbol limpio; rama `main` adelantada 5 commits respecto de `origin/main` | Aprobado con observacion | Los cinco commits locales aun no estaban publicados. |
| `git diff --stat` y `git diff --name-only` antes de documentar | Identificar cambios sin commit | Sin diferencias | Aprobado | La documentacion de este lote se agrego despues de establecer esa linea base. |
| Revision de archivos sensibles | `.env`, bases, backups y logs fuera del indice | `backend/.env`, `backend/portfolio.db`, su backup y `backend/logs/` estaban ignorados y no rastreados | Aprobado | Se reviso solo presencia y estado Git; no se abrio contenido sensible. |
| Revision de artefactos recreables | `node_modules`, `dist`, caches y entornos virtuales fuera del indice | `frontend/node_modules/` y `frontend/dist/` estaban ignorados; `backend/venv/` seguia versionado | Riesgo pendiente | Debe resolverse antes de publicar el repositorio. |
| Revision de scripts peligrosos | No ejecutar scripts destructivos o de migracion | No se ejecutaron `reset_db.py`, `update_db.py`, `seed_db.py` ni migraciones | Aprobado | No hubo CRUD ni escrituras intencionales sobre SQLite. |

## Fase 6.2 - Pruebas backend con SQLite temporal

Fecha de ejecucion: 2026-07-06.

### Estrategia de aislamiento

- `backend/tests/conftest.py` crea un directorio temporal de sesion y configura `DATABASE_URL` antes de importar la app.
- La base usada se llama `qa_backend.sqlite3`; se crea con los modelos reales mediante `Base.metadata` y se recrea para cada prueba.
- Existe una proteccion explicita que aborta la coleccion si la URL contiene `portfolio.db`, si no es SQLite o si la ruta queda fuera del directorio temporal.
- `PRAGMA foreign_keys=ON` se comprueba antes de cada prueba.
- Las credenciales admin se generan aleatoriamente en memoria y no se guardan en archivos.
- El engine, los handlers de log y el directorio temporal se cierran y eliminan al terminar.

### Resultados

| Comando o revision | Resultado esperado | Resultado obtenido | Estado | Observaciones |
|---|---|---|---|---|
| `.\venv\Scripts\python.exe -m pip install pytest==8.4.2 httpx==0.28.1` | Instalar dependencias minimas de test | Dependencias instaladas en el entorno virtual local | Aprobado | Las versiones se agregaron a `backend/requirements.txt`. |
| Primera ejecucion de `.\venv\Scripts\python.exe -m pytest` | Suite completa y limpieza temporal | 17 pruebas funcionales pasaron; el teardown fallo porque Windows mantenia abierto el log temporal | Corregido | Se cerro logging con `logging.shutdown()` al finalizar la sesion. |
| Ejecucion final de `.\venv\Scripts\python.exe -m pytest` | Todas las pruebas aprobadas | 20 pruebas aprobadas en 2.87 s | Aprobado | Codigo 0. Queda una advertencia externa de deprecacion de `TestClient` respecto a `httpx`. |
| Proteccion contra la DB real | Ninguna prueba puede apuntar a `portfolio.db` | URL temporal verificada antes de importar la app y antes de cada prueba | Aprobado | La suite no abrio ni escribio `backend/portfolio.db`. |
| SQLite temporal | Tablas reales, claves foraneas activas y limpieza final | Esquema real creado por prueba; `foreign_keys = 1`; archivo temporal eliminado | Aprobado | No se ejecutaron migraciones, seeds ni resets. |

### Contratos cubiertos

- Publico: `/api/public/home` vacio sin identidad ficticia, proyectos sin galeria y con portada/galeria ordenada, certificaciones con `credential_url` separado del PDF y contacto valido/invalido.
- Admin: HTTP Basic, conservacion de `avatar_asset_id`, errores 422 de proyecto y bloqueo 409 al eliminar assets usados como avatar, icono, portada, galeria o PDF.
- Asociaciones: avatar, portada, galeria, `icon`/`icon_svg` y documento PDF; se rechazan tipos incompatibles.
- Media: imagen y PDF validos, MIME incompatible, Base64 invalido, imagen superior a 5 MB y SVG con contenido activo inseguro.

### Archivos de prueba

- `backend/tests/conftest.py`
- `backend/tests/test_public_contracts.py`
- `backend/tests/test_admin_contracts.py`
- `backend/tests/test_media_contracts.py`

### Riesgos pendientes

1. FastAPI expone una advertencia de deprecacion de `TestClient` con `httpx`; conviene revisar la migracion recomendada por Starlette cuando el ecosistema estabilice la ruta compatible.
2. La validacion backend de URLs se limita hoy a las reglas reales del schema; la suite no impone un contrato mas estricto que produccion.
3. Quedaron fuera de este lote los smoke tests, las pruebas frontend, rendimiento y la matriz responsive/accesible.
4. No se repitio `check_db` contra la base real: Fase 6.1 ya lo aprobo y esta suite impide explicitamente apuntar a `portfolio.db`.

## Fase 6.3 - Pruebas/checklist tecnico frontend

Fecha de ejecucion: 2026-07-06.

### Decision tomada

- No se agregaron pruebas frontend automatizadas en este lote.
- `frontend/package.json` no expone script `test` ni dependencias de testing como Vitest, Jest o Testing Library.
- Para este alcance, instalar una pila nueva tendria mas costo y riesgo de integracion que beneficio inmediato.
- Se dejo un checklist tecnico reproducible basado en revision de codigo dirigida y verificacion tecnica con `npm run lint` y `npm run build`.

### Resultados

| Caso | Archivo/flujo | Resultado esperado | Metodo de validacion | Resultado obtenido | Estado | Observaciones |
|---|---|---|---|---|---|---|
| Infraestructura de pruebas | `frontend/package.json` | Confirmar si existe runner de tests reutilizable | Revision de codigo | Solo existen `dev`, `build`, `lint` y `preview` | Aprobado | Se justifica checklist en lugar de agregar framework nuevo. |
| Helpers HTTP sin `Content-Type` innecesario | `frontend/src/services/publicApi.js`, `frontend/src/services/adminApi.js` | `GET` y `DELETE` sin body no deben enviar JSON; `POST/PUT/PATCH` con body si | Revision de codigo | `buildHeaders()` usa `shouldSetJsonContentType(body)` y solo agrega el header cuando corresponde | Aprobado | Se mantiene el contrato HTTP actual. |
| Errores de red vs HTTP | `publicApi.js`, `adminApi.js` | Distinguir red, abort y respuesta HTTP | Revision de codigo | Ambos servicios crean errores tipados con `isNetworkError`, `isAbortError`, `status` y `userMessage` | Aprobado | Base correcta para UI publica y admin. |
| Errores 422 legibles | `frontend/src/services/adminApi.js` | Convertir `detail` de FastAPI a mensajes legibles y evitar `[object Object]` | Revision de codigo | `formatValidationDetails()` y `formatObjectEntries()` cubren listas, objetos y strings | Aprobado con observacion | La logica esta bien, pero persisten labels con mojibake en `FIELD_LABELS`. |
| Carga parcial de home | `frontend/src/pages/HomePage.jsx` | Si falla `/projects`, home principal sigue visible; si falla `/home`, mostrar error util | Revision de codigo | Hay `useEffect` y estados separados para `homeData` y `projects`, con reintentos independientes | Aprobado | Cumple el desacople buscado en Fase 2. |
| Datos personales no ficticios | `HomePage.jsx`, `ContactSection.jsx`, `Footer.jsx` | No inventar identidad o correo cuando faltan datos | Revision de codigo | `profile` se consume desde API y los fallbacks del contacto son honestos | Aprobado | No se detecta identidad mock activa en estos flujos revisados. |
| Formulario de contacto | `frontend/src/components/sections/ContactSection.jsx` | Exito limpia formulario; 422 muestra validacion; red conserva lo escrito | Revision de codigo | `handleSubmit()` limpia solo tras respuesta correcta; errores 422/red/5xx usan mensajes distintos | Aprobado | El `AbortController` se limpia al desmontar. |
| Proyectos sin imagen y con galeria | `frontend/src/components/sections/ProjectsSection.jsx` | No romper sin imagen; deduplicar portada y galeria 0/1/N | Revision de codigo | `buildProjectImages()` usa portada si existe, deduplica por `id` y soporta lista vacia | Aprobado | La portada sigue saliendo de `project.image`. |
| Zoom, miniaturas y fallback de proyectos | `ProjectsSection.jsx` | Modal estable con datos faltantes y fallback seguro para SVG/imagenes | Revision de codigo | `getAssetDisplayInfo()` usa `getSafeSvgDataUrl()`, fallback por seguridad y estado sin imagen | Aprobado | No se usa `dangerouslySetInnerHTML`. |
| Certificaciones y PDF | `frontend/src/components/sections/CertificationsSection.jsx` | Mantener `credential_url` separado del PDF y mostrar fallback usable | Revision de codigo | `credential_url` sigue aparte; el PDF genera Blob URL, modal y acciones `Abrir`/`Descargar` | Aprobado | Revocacion de Blob URL ligada al ciclo de vida del modal. |
| Revocacion de Blob URL | `CertificationsSection.jsx` | Revocar al cerrar/cambiar/desmontar | Revision de codigo | `useEffect` revoca `selectedPdf.url` al cambiar o desmontar | Aprobado | Validacion por lectura; no hubo prueba DOM automatizada. |
| SVG seguro | `frontend/src/utils/svgSecurity.js`, `ProjectsSection.jsx`, `SkillsSection.jsx`, pickers admin | No renderizar SVG activo ni usar `dangerouslySetInnerHTML` | Busqueda `rg` + revision de codigo | No se encontraron usos de `dangerouslySetInnerHTML`; los SVG pasan por `getSafeSvgDataUrl()` | Aprobado | La politica segura sigue aplicada en publico y admin. |
| Validaciones admin | `frontend/src/pages/AdminPage.jsx` | Proyecto/URL/color/fechas/anos invalidos no deben enviarse y los errores deben limpiarse al editar | Revision de codigo | Existen validadores por formulario y `clearValidationField()`/`clearValidationErrors()` | Aprobado | Alineado con Pydantic segun la implementacion actual. |
| Uploads frontend | `AdminImagePicker.jsx`, `AdminProjectGalleryPicker.jsx` | Rechazo previo a FileReader, fallos parciales seguros y cancelacion clara | Revision de codigo | Se valida tamano/MIME/ext antes de leer; hay estados por archivo, abort y preservacion de exitos | Aprobado | La galeria mantiene exitos parciales y no elimina seleccion previa. |
| `npm run lint` | `frontend` | Codigo 0 | Ejecucion real | Finalizo sin errores | Aprobado | Sin cambios funcionales necesarios para este lote. |
| `npm run build` | `frontend` | Codigo 0 y build valido | Ejecucion real | Vite compilo 68 modulos y genero `dist` | Aprobado | Build estable al cierre del lote. |

### Riesgos pendientes

1. No hay runner de pruebas frontend automatizadas configurado; Fase 6.4 deberia decidir si conviene introducir Vitest para helpers puros y componentes criticos.
2. La validacion de este lote es tecnica y reproducible, pero mayormente por lectura de codigo; todavia faltan smoke tests integrados y pruebas manuales de flujo.
3. Persisten textos con mojibake en varios archivos frontend revisados, incluyendo `HomePage.jsx`, `ContactSection.jsx`, `ProjectsSection.jsx`, `CertificationsSection.jsx`, `AdminImagePicker.jsx`, `AdminProjectGalleryPicker.jsx`, `AdminProjectsPanel.jsx`, `AdminCertificationsPanel.jsx` y partes de `adminApi.js`.
4. La revocacion de Blob URL, el focus management y los aborts estan bien implementados por inspeccion, pero no se comprobaron en un entorno de navegador automatizado en este lote.

### Limites de esta ejecucion

- No se modifico backend ni base de datos.
- No se ejecutaron `reset_db.py`, `update_db.py` ni `seed_db.py`.
- No se cambiaron rutas, contratos HTTP, autenticacion ni logica CRUD.
- No se instalaron dependencias nuevas de testing para frontend.

## Fase 6.4 - Smoke tests de integracion frontend/backend

Fecha de ejecucion: 2026-07-06.

### Entorno y metodo

- Se reutilizaron las instancias locales que ya estaban activas: backend en `http://127.0.0.1:8000` y Vite en `http://localhost:5173`.
- Se confirmo por proceso y linea de comando que ambas instancias pertenecian a este proyecto.
- Vite estaba enlazado a `::1`; por ello respondio en `localhost:5173`, no en `127.0.0.1:5173`. El backend permite ambos origenes locales.
- Las pruebas se realizaron con solicitudes HTTP controladas desde PowerShell. No se uso automatizacion de navegador ni se inspecciono una consola grafica.
- Las credenciales admin se leyeron en memoria desde el entorno, sin imprimirlas ni persistirlas.
- El contacto se probo solo con un payload vacio invalido para obtener 422 sin crear un mensaje.

### Resultados

| Area | Prueba | Comando/metodo | Resultado esperado | Resultado obtenido | Estado | Observaciones |
|---|---|---|---|---|---|---|
| Backend | Inicio y proceso local | Revision de puerto, proceso y `GET /` | Servicio activo sin traceback y status 200 | Python `-m app.main` activo en `127.0.0.1:8000`; `GET /` devolvio 200 | Aprobado | Se reutilizo la instancia existente. No se inicio otro proceso. |
| Backend | Log reciente | Busqueda de `Traceback`, `ERROR` y `CRITICAL` en las ultimas 250 lineas | Sin errores inesperados | 0 coincidencias | Aprobado | Las solicitudes HTTP generaron logs normales de ejecucion. |
| Frontend | Inicio y modulos Vite | `GET /`, `/src/main.jsx` y `/src/services/publicApi.js` | Recursos 200 y API local configurada | Los tres recursos devolvieron 200; el modulo usa `http://127.0.0.1:8000` | Aprobado | Vite escucha en `localhost` mediante `::1`. |
| Publico | Health | `GET /api/public/health` | Status 200 | Status 200 | Aprobado | Router publico operativo. |
| Publico | Home | `GET /api/public/home` con `Origin: http://localhost:5173` | Status 200 y estructura JSON completa | Status 200; presentes `profile`, `social_links`, `skills`, `featured_projects`, `experience`, `education` y `certifications` | Aprobado | El perfil real estaba presente; no se evaluo visualmente el DOM. |
| Publico | Proyectos | `GET /api/public/projects` | Portada y galeria sin romper contrato | 1 proyecto; campos `image` y `gallery_images`; 5 imagenes adicionales ordenadas `0..4` | Aprobado | La portada permanece separada de la galeria. |
| Publico | Certificaciones/PDF | `GET /api/public/certifications` | `credential_url` y `certificate_file` como capacidades separadas | 2 certificaciones; ambos campos presentes; 1 PDF con contrato valido | Aprobado | Los datos actuales no incluyen una `credential_url` no vacia. No se abrio el PDF en navegador. |
| Publico | Contacto invalido | `POST /api/public/contact` con `{}` | Status 422 sin escritura | Status 422 | Aprobado | No se envio payload valido ni se creo un mensaje real. |
| Admin | Proteccion sin credenciales | `GET /api/admin/profile` sin Authorization | Status 401 o 403 | Status 401 | Aprobado | HTTP Basic protege la ruta. |
| Admin | Autenticacion | `POST /api/admin/auth/login` con credenciales del entorno | Status 200 | Status 200 | Aprobado | Las credenciales no se mostraron en salida. |
| Admin | Perfil | `GET /api/admin/profile` autenticado | Status 200 de solo lectura | Status 200; 1 perfil | Aprobado | Sin PUT ni cambios de datos. |
| Admin | Proyectos | `GET /api/admin/projects` autenticado | Status 200 de solo lectura | Status 200; 1 proyecto | Aprobado | Sin CRUD. |
| Admin | Media assets | `GET /api/admin/media-assets` autenticado | Status 200 de solo lectura | Status 200; 13 assets | Aprobado | Sin uploads ni DELETE. |
| Admin | Certificaciones | `GET /api/admin/certifications` autenticado | Status 200 de solo lectura | Status 200; 2 certificaciones | Aprobado | Sin edicion. |
| Admin | Mensajes | `GET /api/admin/contact-messages` autenticado | Status 200 de solo lectura | Status 200; 1 mensaje | Aprobado | No se marco como leido ni se elimino. |
| CORS | Preflight local | `OPTIONS /api/public/home` desde `http://localhost:5173` | Status 200 y origen permitido | Status 200; `Access-Control-Allow-Origin: http://localhost:5173` | Aprobado | Los metodos solicitados fueron aceptados. |
| CORS | GET con origen local | `GET /api/public/health` con encabezado Origin | Encabezado CORS correcto | `Access-Control-Allow-Origin: http://localhost:5173` | Aprobado | Confirma el intercambio HTTP esperado por el frontend local. |
| Integridad de datos | Base real sin cambios | Comparacion de tamano y `LastWriteTimeUtc` antes/despues | Sin modificaciones | 11.018.240 bytes y `2026-07-06T08:22:06.8784562Z` antes y despues | Aprobado | El archivo estaba bloqueado por la instancia activa, por lo que no se calculo SHA-256. |
| Frontend | Lint | `npm run lint` | Codigo 0 | Codigo 0, sin errores | Aprobado | ESLint estable. |
| Frontend | Build | `npm run build` | Codigo 0 | Codigo 0; Vite transformo 68 modulos | Aprobado | Build generado correctamente. |

### Resultado general

- Las 16 comprobaciones HTTP resumidas finalizaron aprobadas.
- No hubo respuestas 500 inesperadas.
- Se observaron los errores esperados: 401 sin autenticacion admin y 422 para contacto invalido.
- No se realizaron operaciones CRUD, uploads, DELETE, migraciones ni escrituras intencionales sobre la base real.
- No se ejecutaron `reset_db.py`, `update_db.py` ni `seed_db.py`.

### Riesgos y pendientes

1. La integracion se valido a nivel HTTP y de modulos servidos por Vite; falta una prueba manual en navegador que confirme renderizado, consola sin errores, modales y navegacion real.
2. Vite esta enlazado solo a `::1` en la instancia revisada. Es correcto para `localhost`, pero `http://127.0.0.1:5173` no responde con el comando actual sin `--host`.
3. No se abrio el visor PDF ni la galeria en un navegador; esos flujos quedan para el checklist manual de Fase 6.5.
4. No se hicieron escrituras admin ni contacto valido para proteger los datos reales; los contratos de escritura permanecen cubiertos por las 20 pruebas con SQLite temporal de Fase 6.2.

## Fase 6.5 - Checklist manual funcional completo

Fecha de ejecucion: 2026-07-07. Entrada de cambios registrada con la fecha solicitada `2026-07-06`.

### Metodo y limites

- Se levantaron backend y frontend con los comandos reales del proyecto.
- Se uso Chrome 149 headless mediante Chrome DevTools Protocol, sin instalar dependencias de testing.
- Se validaron DOM real, interacciones de mouse/teclado, solicitudes de red, validaciones nativas y estados React.
- No se autorizaron escrituras sobre datos reales. Por ello no se creo backup, no se crearon registros `QA_F6_*` y no se probaron PUT/PATCH/DELETE reales.
- Las capturas se guardaron solo en el directorio temporal del sistema, fuera del repositorio.

### Resultados

| Area | Caso | Datos usados | Resultado esperado | Resultado obtenido | Estado | Evidencia/observacion | Accion pendiente |
|---|---|---|---|---|---|---|---|
| Publico | Home y secciones | Datos reales de lectura | Hero, skills, proyectos, experiencia, educacion, certificaciones y contacto visibles | Las 7 secciones existen; 0 errores visibles, 0 imagenes rotas y 0 patrones de mojibake visibles | Aprobado | No aparecio `correo@example.com` ni identidad ficticia | Corregir en una fase futura la tilde ausente en `formacion` del titulo de certificaciones |
| Publico | Header y navegacion | Enlaces reales del header | Anclas existentes y no ocultas por header sticky | Inicio, Skills, Proyectos, Experiencia, Educacion, Certificaciones y Contacto navegaron a destinos validos | Aprobado | Posicion de destino igual o inferior al alto del header | Matriz responsive queda para Fase 6.6 |
| Publico | Proyecto con portada y galeria | Proyecto real existente | Modal estable, portada sin duplicacion y galeria navegable | Modal abierto con imagen; 5 miniaturas, una activa; Siguiente cambio imagen; Zoom/Ajustar funciono | Aprobado | Cierre confirmado con Escape, boton y fondo | Ninguna |
| Publico | Proyecto sin imagen | Dataset actual | Mostrar fallback sin romper | No existe un proyecto publico sin imagen en los datos actuales | No aplica | El contrato y pruebas temporales ya cubren el caso | Agregar dato temporal solo con autorizacion de escritura |
| Publico | Certificacion PDF | PDF real existente | Blob valido, iframe y acciones alternativas | Blob `application/pdf` de 90.492 bytes; modal, Abrir, Descargar y Escape disponibles | Aprobado | No se descargo fisicamente el archivo; se valido Blob y atributos de las acciones | Probar descarga manual visible si se requiere evidencia de sistema operativo |
| Publico | Credential URL | Dataset actual | Enlace separado cuando exista | El contrato esta presente, pero ninguna certificacion publica tiene URL no vacia | No aplica | PDF y URL permanecen capacidades separadas | Crear certificacion QA solo con autorizacion |
| Publico | Contacto vacio | Formulario sin datos | Error local visible y sin escritura | Mostro `El nombre es obligatorio.` | Aprobado | No hubo POST valido | Ninguna |
| Publico | Email invalido | `correo-invalido` | Bloqueo y mensaje claro | Chrome marco `typeMismatch=true` y pidio incluir `@` | Aprobado | Validacion nativa impidio el submit | Ninguna |
| Publico | Contacto valido | Ninguno | Crear mensaje y verlo en admin | No ejecutado para no escribir en la DB real | Pendiente autorizado | No se creo `QA_F6_Mensaje` | Requiere autorizacion y backup previo |
| Admin | Login incorrecto | Credenciales QA invalidas | 401 y mensaje legible | Mostro `Credenciales invalidas para el panel admin.` y mantuvo el login | Aprobado | El 401 esperado fue la unica entrada de error de consola | Ninguna |
| Admin | Login correcto y dashboard | Credenciales del entorno, solo en memoria | Cargar panel y modulos | Dashboard cargado, 10 stats, 8 opciones y sin errores visibles | Aprobado | Credenciales no impresas ni persistidas | Ninguna |
| Admin | Selector de modulos | Viewport 390 x 844 | Mostrar un modulo a la vez | Perfil, Redes, Skills, Proyectos, Experiencia, Educacion, Certificaciones y Mensajes mostraron exactamente un panel | Aprobado | Validacion funcional puntual; no sustituye matriz responsive | Completar matriz en Fase 6.6 |
| Admin | Listados | Datos reales de solo lectura | Modulos cargados independientemente | Redes, skills, proyectos, certificaciones y mensajes mostraron registros; todos los modulos alternaron sin error | Aprobado | No se editaron ni eliminaron registros | Ninguna |
| Admin | Perfil y avatar | Perfil real en lectura | Perfil cargado y avatar conservado al guardar | El perfil y `Asset ID` asociado cargaron; no se detecto preview de imagen y no se ejecuto PUT | Pendiente autorizado | La conservacion contractual esta cubierta por Fase 6.2, no por escritura manual en DB real | Revisar preview y ejecutar doble guardado solo con autorizacion y backup |
| Admin | Validacion de proyecto | Formulario vacio | Errores legibles y sin POST | Mostro errores para titulo, slug y descripciones; no aparecio `[object Object]` | Aprobado | No se creo `QA_F6_Proyecto` | CRUD completo requiere autorizacion |
| Admin | Validacion de skill/color | Nombre QA local, categoria QA y color `rojo` | Bloquear color invalido | Mostro error hexadecimal y campo nivel obligatorio; no hubo POST | Aprobado | No se creo `QA_F6_Skill` | CRUD/icono real requiere autorizacion |
| Admin | Validacion de certificacion | Nombre QA local y `url-invalida` | Bloquear URL invalida | Mostro error exigiendo `http://` o `https://`; no hubo POST | Aprobado | No se creo `QA_F6_Certificacion` ni se asocio PDF | CRUD completo requiere autorizacion |
| Admin | Upload invalido | `README.md` local | Rechazo antes de upload | Mostro que `text/markdown` no es valido para avatar | Aprobado | No se creo MediaAsset | Cancelacion y limites con archivos QA requieren lote autorizado |
| Admin | Mensajes y refresco | Mensajes reales en lectura | Refresco correcto; error de red no debe cerrar sesion | Refresco GET aprobado; bloqueo de red simulado mostro error claro y mantuvo sesion | Aprobado | No se marco leido ni se elimino mensaje real | Flujo mutante requiere mensaje QA autorizado |
| Admin | Logout | Sesion admin en memoria | Volver al login | El boton Cerrar sesion limpio el panel y mostro login | Aprobado | Sin storage persistente | Ninguna |
| Admin | Recarga de `/admin` | Login valido previo | Exigir login nuevamente | Tras recargar, el login reaparecio y el panel no permanecio autenticado | Aprobado | Confirma credenciales solo en memoria | Ninguna |
| Admin | Error no autenticativo | GET de mensajes bloqueado desde CDP | Mensaje claro sin logout | La UI mostro error de conexion y conservo el selector del panel | Aprobado | No se detuvo el backend real | Ninguna |
| Seguridad | Ausencia de escrituras | Trafico capturado por navegador | Sin mutaciones de datos | No hubo POST/PUT/PATCH/DELETE exitoso fuera de `/api/admin/auth/login` | Aprobado | La DB conservo tamano y fecha de modificacion | Ninguna |

### Resultado general

- Los flujos publicos de lectura, navegacion, proyecto/galeria, PDF y validacion de contacto quedaron aprobados.
- Los flujos admin de login, carga modular, validaciones locales, upload invalido, refresco, error de red, logout y recarga quedaron aprobados.
- No se crearon ni eliminaron datos QA y no se tocaron registros reales.
- El resultado global es **aprobado con pendientes autorizados** para las operaciones que requieren escritura real.

### Hallazgos y riesgos pendientes

1. El titulo publico `Certificaciones y formacion complementaria` aparece sin tilde en `formacion`; no rompe el flujo.
2. El perfil admin muestra referencia de Asset ID, pero no se detecto preview visual de avatar en este recorrido. Debe verificarse antes de una prueba de guardado real.
3. El dataset no ofrece proyecto sin imagen ni certificacion con `credential_url`, por lo que esos casos no pudieron probarse visualmente.
4. CRUD completo, doble guardado de perfil, reordenamiento persistente, retiro de galeria, marcar/eliminar mensajes y contacto valido requieren autorizacion de escritura y backup previo.
5. La matriz completa responsive/accesible queda fuera de este lote y corresponde a Fase 6.6.

### Confirmaciones de seguridad

- No se ejecutaron `reset_db.py`, `update_db.py`, `seed_db.py` ni migraciones.
- No se modifico `portfolio.db`; no fue necesario ejecutar `check_db`.
- No se subieron archivos, no se descargaron documentos y no se hicieron operaciones destructivas.
- No se cambio codigo funcional, rutas, contratos, autenticacion, uploads, SVG ni PDF.

## Fase 6.6 - Matriz responsive y accesibilidad

Fecha de ejecucion: 2026-07-07. Entrada de cambios registrada con la fecha solicitada `2026-07-06`.

### Metodo

- Chrome 149 headless controlado mediante Chrome DevTools Protocol.
- Backend local en `http://127.0.0.1:8000` y frontend Vite en `http://localhost:5173`.
- Medicion de viewport, `scrollWidth`, rectangulos, elementos desbordados, foco, estados ARIA, consola y media query `prefers-reduced-motion`.
- Inspeccion visual de capturas temporales en 320 x 568 para proyecto, PDF y admin.
- Sin contacto valido, CRUD, uploads, DELETE ni otras escrituras sobre datos reales.

### Matriz

| Area | Viewport | Caso | Resultado esperado | Resultado obtenido | Estado | Observaciones | Accion pendiente |
|---|---:|---|---|---|---|---|---|
| Publico | 320 x 568 | Layout, header y secciones | Sin overflow ni texto vertical; menu compacto | `scrollWidth=320`, 0 elementos desbordados, 0 textos estrechos, header 59 px y menu movil visible | Aprobado | Contacto y footer terminan dentro del viewport | Ninguna |
| Publico | 375 x 667 | Layout general | Sin overflow horizontal | `scrollWidth=375`, sin desbordes ni imagenes rotas | Aprobado | Header movil de 59 px | Ninguna |
| Publico | 390 x 844 | Layout general | Cards y textos legibles | Sin overflow, texto vertical ni imagenes rotas | Aprobado | Menu movil disponible | Ninguna |
| Publico | 430 x 932 | Layout general | Secciones dentro del viewport | Sin overflow y ancho correcto en contacto/footer | Aprobado | Menu movil disponible | Ninguna |
| Publico | 768 x 1024 | Tablet vertical | Aprovechar ancho sin romper navegacion | Sin elementos desbordados; menu compacto activo | Aprobado | El ancho util descuenta scrollbar vertical | Ninguna |
| Publico | 1024 x 768 | Tablet horizontal | Navegacion amplia y modales contenidos | Sin overflow; header 73 px y navegacion desktop | Aprobado | Sin texto partido | Ninguna |
| Publico | 1180 x 800 | Escritorio | Layout amplio estable | Sin overflow ni imagenes rotas | Aprobado | Proyecto usa dialogo de 1144 x 736 | Ninguna |
| Publico | 1440 x 900 | Escritorio amplio | Respetar limites maximos | Sin overflow; modal proyecto limitado a 1240 px y PDF a 960 px | Aprobado | No se estira contenido indefinidamente | Ninguna |
| Proyecto | 320 x 568 | Modal, imagen y miniaturas | Modal visible; imagen completa; tira compacta | Dialogo 304 x 434, imagen contenida, 5 miniaturas desplazables y foco inicial dentro | Aprobado | Anterior/Siguiente/Zoom miden 32 px de alto para preservar area visual | Considerar 36-44 px en una futura revision tactil sin reducir demasiado el visor |
| Proyecto | 375-430 px | Modal movil | Sin overflow y controles usables | Dialogos entre 359 y 414 px de ancho; imagen contenida y miniaturas con scroll interno | Aprobado | Escape cerro correctamente | Ninguna |
| Proyecto | 768-1440 px | Modal tablet/escritorio | Dialogo dentro del viewport | Todos los rectangulos quedaron contenidos y la imagen mantuvo `contain` | Aprobado | Zoom no aumento el modal | Ninguna |
| Proyecto | 320 x 568 | Texto dinamico largo | No crear scroll horizontal interno | Tras microajuste, contenido y descripcion tienen `clientWidth=scrollWidth` | Aprobado corregido | Antes aparecia scrollbar por una cadena sin espacios | Ninguna |
| PDF | 320 x 568 | Modal y visor | Acciones visibles e iframe util | Dialogo 304 x 545; iframe 302 x 377; Cerrar, Abrir y Descargar visibles | Aprobado | Acciones compactas de 34 px de alto | Considerar objetivo tactil mayor en fase futura |
| PDF | 375-430 px | Modal movil | Mantener area util | Iframe entre 451 y 586 px de alto, sin overflow del dialogo | Aprobado | Fallback Abrir/Descargar conservado | Ninguna |
| PDF | 768-1440 px | Modal tablet/escritorio | Visor amplio y limitado | Dialogo contenido; iframe entre 567 y 721 px o mas segun altura | Aprobado | Ancho maximo 960 px | Ninguna |
| Admin login | Todos | Login responsive | Card, inputs y boton dentro del viewport | 0 desbordes en los 8 viewports; controles de 42-45 px | Aprobado | Ancho completo en movil y maximo controlado en desktop | Ninguna |
| Admin | 320-430 px | Topbar, stats y modulo visible | Un modulo, sin texto vertical | `scrollWidth` igual al viewport, 10 stats, 1 panel visible y 0 textos estrechos | Aprobado | Topbar dentro del viewport | Ninguna |
| Admin | 768 x 1024 | Tablet | Layout de un modulo sin compresion | 1 panel visible, 0 overflow y stats legibles | Aprobado | Comportamiento intermedio consistente | Ninguna |
| Admin | 1024-1440 px | Escritorio | Mostrar contenido amplio | 8 paneles disponibles, topbar y stats sin overflow | Aprobado | Selector permanece disponible | Ninguna |
| Admin | 320 x 568 | Stat Perfil | `Configurado` legible | Tras microajuste: 17 px, una sola linea y 117 px de ancho | Aprobado corregido | Antes partia `Configura/do` | Ninguna |
| Admin picker | 320 x 568 | Avatar y selector | Preview y modal dentro del viewport | Preview real de Asset #4; modal 281 x 523 dentro del viewport, con scroll interno | Aprobado corregido | Se confirmo que el preview si existe | Ninguna |
| Admin galeria | 320 x 568 | Selector de imagenes adicionales | No desplazar modal con el formulario largo | Modal 281 x 523 fijado al viewport, sin overflow de pagina | Aprobado corregido | `backdrop-filter` del card creaba un bloque contenedor para `position: fixed` | Ninguna |
| Admin mensajes | 320 x 568 | Lectura/refresco | Card y accion usables | Card contenida; boton Refrescar 95 x 42 | Aprobado | Sin escrituras | Ninguna |
| Accesibilidad | 320 x 568 | Tab y foco publico | Foco visible y orden razonable | Tab recorrio logo y menu; ambos mostraron outline solido de 2 px | Aprobado | La prueba uso eventos de teclado nativos CDP | Ninguna |
| Accesibilidad | 320 x 568 | Menu movil | Enter/Espacio y Escape operables | Enter abrio y Espacio alterno el boton; Escape dejo el menu cerrado | Aprobado | `aria-expanded` reflejo el estado | Ninguna |
| Accesibilidad | 320 x 568 | Modal proyecto | Foco inicial, trap, flechas y retorno | Foco dentro al abrir; Tab contenido; ArrowRight cambio imagen; miniatura activa con ARIA; foco retorno al disparador | Aprobado | Escape cerro el dialogo | Ninguna |
| Accesibilidad | 320 x 568 | Modal PDF | Foco, trap, Escape y retorno | Foco inicial en Cerrar; Tab permanecio dentro; Escape cerro y devolvio foco a Abrir PDF | Aprobado | Iframe permanece accesible por Tab | Ninguna |
| Accesibilidad | Admin movil | Foco y selector | Indicador visible y label existente | Ver sitio mostro halo cyan; select tiene label `Modulo visible` y foco visible | Aprobado | Details/summary siguen navegables nativamente | Ninguna |
| Accesibilidad | Publico/Admin | Reduced motion | Desactivar movimiento no esencial | `matchMedia` activo y 0 elementos visibles conservaron duraciones relevantes | Aprobado | Regla aplicada sin cambiar layout | Ninguna |
| Visual | Publico/Admin | Contraste razonable | Texto, badges, botones y errores distinguibles | Capturas revisadas sin contraste evidentemente insuficiente | Aprobado con observacion | No sustituye auditoria automatizada WCAG de contraste | Ejecutar medicion formal si se exige conformidad normativa |
| Consola | Todos | Sin errores inesperados | Consola limpia durante matriz | 0 errores/warnings relevantes en publico y admin | Aprobado | Rutas API respondieron 200 | Ninguna |

### Microajustes aplicados

1. `CertificationsSection.jsx`: se corrigieron dos literales de `formacion` a `formación`.
2. `ProjectsSection.css`: la descripcion dinamica usa quiebre seguro y el area desplazable oculta overflow horizontal interno.
3. `AdminStatsGrid.css`: el valor textual `Configurado` usa tamano responsive y una linea en movil.
4. `AdminLayout.css`: se retiro `backdrop-filter` solo de los paneles que alojan pickers. Esto evita que sus overlays `position: fixed` queden anclados al card largo en vez del viewport.

### Resultado general

- Publico y admin aprobaron los ocho viewports sin overflow horizontal critico ni texto letra por letra.
- Los modales de proyecto y PDF quedaron contenidos y funcionales en movil, tablet y escritorio.
- Los pickers admin quedaron corregidos y fijados al viewport en 320 x 568.
- Foco, traps, retorno, teclado, estados ARIA y reduced motion quedaron validados.
- No se realizaron CRUD ni operaciones destructivas.

### Pendientes para Fase 6.7

1. Medicion de payload y rendimiento.
2. Auditoria formal de contraste si se necesita conformidad WCAG cuantificada.
3. Evaluar controles compactos de 32-34 px frente a una meta tactil de 44 px, equilibrando el area util de los modales pequenos.
4. Mantener fuera de esta fase los CRUD reales pendientes de Fase 6.5.

## Fase 6.7 - Payload y rendimiento base

Fecha de ejecucion: 2026-07-07. Entrada de cambios registrada con la fecha solicitada `2026-07-06`.

### Metodo y alcance

- Mediciones locales y secuenciales, no prueba de carga ni SLA.
- Cada endpoint recibio 1 solicitud de calentamiento y 5 solicitudes medidas.
- Los bytes HTTP se obtuvieron del cuerpo real sin depender de `Content-Length` y sin descompresion automatica.
- Las credenciales admin se leyeron solo en memoria y no se imprimieron.
- El inventario multimedia uso longitudes Base64 y la formula `floor(longitud * 3 / 4) - padding`; no mostro ni copio contenido.
- Chrome 149/CDP realizo 3 cargas limpias de `http://localhost:5173` con cache desactivada.

### Endpoints

| Endpoint | Status | Tamano | Tiempo minimo | Tiempo mediano | Tiempo maximo | Estado | Observaciones |
|---|---:|---:|---:|---:|---:|---|---|
| `GET /api/public/health` | 200 | 67 B | 1,89 ms | 2,31 ms | 2,68 ms | Objetivo | Referencia pequena, JSON |
| `GET /api/public/home` | 200 | 530.621 B | 9,81 ms | 12,63 ms | 22,29 ms | Objetivo por tamano | 526.060 B corresponden a multimedia embebida |
| `GET /api/public/projects` | 200 | 10.233.920 B | 56,60 ms | 60,44 ms | 70,88 ms | Riesgo alto | Casi todo el cuerpo es Base64 de portada/galeria |
| `GET /api/public/certifications` | 200 | 121.287 B | 3,76 ms | 4,10 ms | 5,19 ms | Objetivo | Incluye un PDF Base64 de 120.656 caracteres |
| `GET /api/admin/media-assets` | 200 | 10.858.065 B | 62,61 ms | 63,62 ms | 89,15 ms | Riesgo alto | Endpoint mas pesado y lento; devuelve los 13 assets con contenido completo |
| `GET /api/admin/projects` | 200 | 10.233.956 B | 60,00 ms | 60,68 ms | 64,23 ms | Riesgo alto | Replica el peso multimedia del proyecto publico |
| `GET /api/admin/certifications` | 200 | 121.372 B | 3,99 ms | 4,65 ms | 5,15 ms | Objetivo | PDF incluido dentro del JSON |

Todos respondieron `application/json`. Los tiempos reflejan loopback local con SQLite y no predicen latencia de red o infraestructura de produccion.

### Multimedia

| Tipo | Cantidad | Tamano Base64 | Tamano decodificado estimado | Mayor asset | Riesgo |
|---|---:|---:|---:|---|---|
| `avatar` | 1 | 363.440 caracteres | 272.578 B | Asset #4, JPEG, 272.578 B | Bajo |
| `image` | 6 | 10.328.420 caracteres | 7.746.310 B | Asset #10, `Acta_CJ_Trabajo de grado.jpeg`, 3.028.736 B | Alto |
| `icon` | 3 | 0 Base64 + 1.013 B SVG | 1.013 B SVG | Asset #1, SVG, 493 B | Bajo |
| `icon_svg` | 2 | 41.444 caracteres | 31.082 B | Asset #13, PNG, 20.637 B | Bajo |
| `document` | 1 | 120.656 caracteres | 90.492 B | Asset #7, PDF, 90.492 B | Bajo |
| **Total** | **13** | **10.853.960 caracteres** | **8.140.462 B Base64 + 1.013 B SVG** | Asset #10, 3.028.736 B | Alto por acumulacion |

Datos estadisticos adicionales:

- Imagen: promedio 1.291.052 B, mediana 991.144 B.
- Icono SVG: promedio 338 B, mediana 337 B.
- El PDF aporta 120.656 B al JSON para transportar 90.492 B de archivo, aproximadamente 33 % de sobrecarga Base64.

### Proyecto y galeria

- Payload actual: 10.233.920 B para 1 proyecto.
- Metadata y texto aproximados: 1.602 B.
- Portada: 267.336 caracteres Base64.
- Galeria: 5 asociaciones, 5 IDs unicos y 9.964.980 caracteres Base64.
- La galeria actual incluye tambien el asset de portada. El backend transporta esa imagen dos veces; el frontend la deduplica visualmente.
- Contenido unico aproximado de las 5 imagenes: 7,47 MB decodificados; el JSON completo supera 10,23 MB por Base64 y duplicacion.

`/api/public/home` no duplica proyectos en el dataset actual porque `featured_projects` esta vacio. Sin embargo, el contrato usa `ProjectRead`; si un proyecto se marca destacado, HomePage pediria `/home` y `/projects`, por lo que ese proyecto y su multimedia podrian viajar en ambas respuestas.

### Build

| Archivo/recurso | Tamano | Estado | Observaciones |
|---|---:|---|---|
| `frontend/dist` total | 1.024.275 B | Objetivo | 5 archivos |
| JavaScript principal | 357.043 B | Advertencia | 96,83 kB gzip informado por Vite |
| CSS principal | 75.057 B | Objetivo | 11,59 kB gzip informado por Vite |
| `LogoCJ.png` | 321.169 B | Advertencia | Segundo recurso estatico mas grande |
| `LogoCJ.ico` | 270.398 B | Advertencia | Grande para un favicon |
| `index.html` | 608 B | Objetivo | Entrada minima |
| Source maps | 0 | Objetivo | No se generaron `.map` |

Revision de `dist`:

- No aparecen `ADMIN_PASSWORD`, `ADMIN_USERNAME`, `API_DOCS_PASSWORD`, `DATABASE_URL`, `portfolio.db` ni valores de contrasena del entorno.
- `VITE_API_BASE_URL=http://127.0.0.1:8000` si aparece; no es secreto y coincide con el entorno local medido.
- No se detectaron archivos inesperados aparte de JS, CSS, HTML, logo y favicon.

### Navegador

| Metrica | Ejecucion 1 | Ejecucion 2 | Ejecucion 3 | Mediana | Observaciones |
|---|---:|---:|---:|---:|---|
| Requests completados | 68 | 68 | 68 | 68 | Vite desarrollo sirve modulos separados |
| Bytes transferidos CDP | 15.987.057 | 15.987.057 | 15.987.057 | 15.987.057 | Incluye frontend dev y API; cache desactivada |
| `performance.resource` transferidos | 5.221.548 | 5.221.548 | 5.221.548 | 5.221.548 | No contabiliza de forma util los cuerpos API cross-origin sin Timing-Allow-Origin |
| Recursos decodificados del navegador | 5.202.048 | 5.202.048 | 5.202.048 | 5.202.048 | Principalmente modulos frontend dev |
| DOMContentLoaded | 160 ms | 162 ms | 150 ms | 160 ms | Ocurre antes de terminar los fetch pesados |
| Load event | 161 ms | 163 ms | 151 ms | 161 ms | No representa portfolio completamente hidratado con proyectos |
| Endpoint mas pesado | 10.234.157 B | 10.234.157 B | 10.234.157 B | 10.234.157 B | `/api/public/projects` |
| Recurso frontend mas pesado | 2.819.616 B | 2.819.616 B | 2.819.616 B | 2.819.616 B | `react-dom_client.js` sin bundle, propio del servidor Vite dev |

No hubo errores de consola. Chrome registro cancelaciones `net::ERR_ABORTED` de la primera pareja `/home` y `/projects`; son aborts esperados por el montaje/limpieza de efectos bajo React StrictMode en desarrollo. Las solicitudes siguientes finalizaron con status 200.

### Umbrales propuestos

| Metrica | Objetivo | Advertencia | Riesgo alto | Estado actual |
|---|---:|---:|---:|---|
| JSON publico individual | <= 1 MB | > 1 MB hasta 5 MB | > 5 MB | Home/certificaciones objetivo; proyectos 10,23 MB, alto |
| Admin media completo | <= 5 MB | > 5 MB hasta 10 MB | > 10 MB | 10,86 MB, alto |
| PDF individual | <= 2 MB | > 2 MB hasta 5 MB | > 5 MB | 90,5 kB, objetivo |
| Imagen individual decodificada | <= 500 kB | > 500 kB hasta 2 MB | > 2 MB | Mayor 3,03 MB, alto |
| JS principal sin comprimir | <= 300 kB | > 300 kB hasta 500 kB | > 500 kB | 357 kB, advertencia; gzip 96,83 kB |
| Carga inicial total sin cache | <= 3 MB | > 3 MB hasta 8 MB | > 8 MB | 15,99 MB en Vite local, alto |

Son umbrales internos previos al despliegue, no SLA.

### Escalabilidad y recomendaciones no implementadas

1. Con el peso actual, 10 proyectos equivalentes con 5 imagenes cada uno rondarian 102 MB de JSON publico. Cerca del limite maximo actual de 5 MB por imagen, el peor caso podria superar ampliamente 300 MB Base64.
2. `media-assets` devuelve todos los assets y su contenido en una sola respuesta; su costo crece linealmente y afectara memoria del navegador/admin.
3. Multiples PDF pequenos son tolerables, pero documentos cercanos al limite de 10 MB crecerian aproximadamente a 13,3 MB Base64 cada uno.
4. Separar metadata del contenido binario y ofrecer endpoints de archivo evitaria cargar assets no visibles.
5. Considerar paginacion del catalogo admin, lazy loading, thumbnails, redimensionado/compresion y almacenamiento externo.
6. Evitar que la portada vuelva a asociarse en `gallery_image_ids` o excluirla al serializar para no transportarla dos veces.
7. Optimizar logo/favicons y evaluar code splitting solo despues de medir un preview/build de produccion.

### Integridad

- `portfolio.db` mantuvo 11.018.240 B y `LastWriteTimeUtc=2026-07-06T08:22:06.8784562Z` antes y despues.
- No hubo CRUD, contacto valido, migraciones ni scripts destructivos.
- No se cambio arquitectura, Base64, SQLite, contratos, autenticacion, uploads, SVG ni PDF.

## Fase 6.8 - Cierre formal y decision de despliegue

Fecha de ejecucion: 2026-07-07. Entrada de cambios registrada con la fecha solicitada `2026-07-06`.

### Resumen de lotes

| Lote | Alcance | Resultado | Evidencia | Estado |
|---|---|---|---|---|
| 6.1 | Linea base tecnica, integridad y Git | check_db, lint y build aprobados; riesgos Git inventariados | `foreign_keys=1`, `integrity_check=ok`, cero violaciones | Cerrado |
| 6.2 | Pruebas backend aisladas | 20 contratos aprobados con SQLite temporal | Proteccion explicita contra `portfolio.db` | Cerrado |
| 6.3 | Checklist tecnico frontend | Helpers HTTP, 422, carga parcial, PDF, SVG, validaciones y uploads revisados | lint/build aprobados | Cerrado |
| 6.4 | Smoke tests integrados | 16 comprobaciones HTTP aprobadas | Publico, admin, CORS y frontend/backend local | Cerrado |
| 6.5 | QA funcional en navegador | Publico/admin, login/logout, galeria, PDF, validaciones y errores aprobados | Chrome/CDP sin CRUD real | Cerrado con pendientes autorizados de escritura |
| 6.6 | Responsive y accesibilidad | 8 viewports, teclado, foco, modales, ARIA y reduced motion aprobados | Matriz 320-1440 px | Cerrado |
| 6.7 | Payload y rendimiento base | Metricas completas; payload multimedia excede umbrales | `/projects` 10,23 MB; `/media-assets` 10,86 MB | Cerrado con bloqueos para produccion |

### Verificaciones finales

| Comando | Resultado esperado | Resultado obtenido | Estado | Observaciones |
|---|---|---|---|---|
| `.\venv\Scripts\python.exe -m pytest -q` | Suite backend completa aprobada | 20 passed en 3,08 s | Aprobado | Una advertencia externa de deprecacion Starlette/TestClient |
| `.\venv\Scripts\python.exe -m app.scripts.check_db` | FK activas, integridad OK, cero violaciones | `foreign_keys=1`, `integrity_check=ok`, `violations=[]` | Aprobado | Script de solo lectura |
| `npm run lint` | Codigo 0 | Codigo 0, sin errores | Aprobado | ESLint estable |
| `npm run build` | Build Vite correcto | 68 modulos; JS 357,04 kB y CSS 75,05 kB | Aprobado | Codigo 0 |
| `git status` previo a documentar | Estado conocido y sin sensibles nuevos | Working tree limpio; 0 staged, 0 untracked; rama 1 commit adelante | Aprobado con observacion | `backend/venv` conserva 1.475 archivos rastreados |
| Integridad de `portfolio.db` | Tamano y fecha sin cambios | 11.018.240 B y `2026-07-06T08:22:06.8784562Z` antes/despues | Aprobado | No hubo escritura inesperada |

Revision de archivos locales:

- `backend/.env`, `frontend/.env`, `backend/portfolio.db`, logs, `frontend/dist` y `frontend/node_modules` existen y estan ignorados/no rastreados.
- `backend/venv` existe, no esta ignorado efectivamente para el indice actual y mantiene 1.475 archivos rastreados.
- No se mostro contenido de secretos, DB, backups ni logs.

### Clasificacion de riesgos

| Riesgo | Categoria | Impacto | Probabilidad | Accion requerida | Bloquea despliegue |
|---|---|---|---|---|---|
| Persistencia para Render y PostgreSQL | A - Bloqueante | Perdida de datos o backend no durable | Alta | Definir PostgreSQL persistente y estrategia de conexion/rollback | Si |
| Migracion segura SQLite -> PostgreSQL | A - Bloqueante | Perdida o inconsistencia de datos | Alta | Diseñar, ensayar y validar migracion con backup | Si |
| `/api/public/projects` supera 10 MB | A - Bloqueante | Carga inicial lenta y alto consumo movil | Alta | Reducir payload multimedia y remedir | Si |
| `/api/admin/media-assets` entrega todo Base64 | A - Bloqueante | Memoria/admin degradados al crecer | Alta | Separar metadata/contenido o limitar respuesta | Si |
| Portada duplicada en transporte de galeria | A - Bloqueante | Bytes redundantes en cada proyecto | Alta | Excluir duplicacion y conservar contrato compatible | Si |
| `backend/venv` con 1.475 archivos rastreados | A - Bloqueante | Repositorio pesado/no portable | Cierta | Retirar del indice con procedimiento reversible y verificar Git | Si |
| CORS solo local | A - Bloqueante | Vercel no podra consumir Render o quedara apertura insegura | Cierta | Externalizar origenes de produccion sin wildcard con credenciales | Si |
| Fallback SPA de Vercel no definido | A - Bloqueante | Recarga directa de `/admin` puede fallar | Cierta | Configurar rewrite/fallback y verificar assets | Si |
| Variables/comandos de produccion incompletos | A - Bloqueante | Build o proceso Render incorrectos | Cierta | Documentar Vercel/Render, HTTPS, health y secretos | Si |
| Storage externo de imagenes/PDF | B - Importante | Escalabilidad y costo de DB | Media | Evaluar tras reducir payload; plan compatible | No por si solo |
| Thumbnails y lazy loading | B - Importante | Experiencia movil y memoria | Alta | Incorporar por fases y remedir | No por si solo |
| Paginacion del catalogo media | B - Importante | Crecimiento del admin | Alta | Agregar tras separar metadata/contenido | No por si solo |
| Rate limiting admin/contacto | B - Importante | Abuso y disponibilidad | Media | Definir en backend/proxy antes o inmediatamente despues del primer staging | No para staging controlado |
| Exposicion de docs FastAPI | B - Importante | Superficie de informacion | Media | Revisar politica y credenciales de produccion | No para staging controlado |
| Contraste cuantitativo WCAG | B - Importante | Conformidad accesible | Media | Ejecutar auditoria formal | No para staging controlado |
| Runner automatizado frontend | B - Importante | Riesgo de regresion | Media | Incorporar pruebas ligeras/CI | No para staging controlado |
| Migrar Basic Auth a sesiones/tokens | C - Deuda futura | Seguridad/escalabilidad del admin | Media al crecer | Planificar si aumenta alcance o usuarios | No ahora |
| Multiples administradores | C - Deuda futura | Operacion y auditoria | Baja actual | Diseñar roles/usuarios cuando exista necesidad | No |
| Escalado horizontal | C - Deuda futura | Capacidad futura | Baja actual | Evaluar tras observar trafico real | No |
| Observabilidad avanzada | C - Deuda futura | Diagnostico operacional | Media futura | Agregar metricas/tracing gradualmente | No |
| Backups automatizados | C - Deuda futura | Recuperacion operacional | Alta en produccion | Incluir antes de produccion final aunque no bloquee staging | No staging; si produccion final |

### Decision

- QA tecnico: **aprobado**.
- QA funcional: **aprobado**, con CRUD real pendiente de un lote separado y respaldado.
- Responsive/accesibilidad: **aprobado** para la matriz ejecutada.
- Integridad de datos: **aprobada**.
- Rendimiento/payload: **bloqueante para despliegue inmediato**.
- Preparacion de produccion: **CONDITIONAL GO**.
- Despliegue inmediato: **NO-GO**.

Decision formal: **CONDITIONAL GO para preparacion de produccion, NO-GO para despliegue inmediato.**

Esta decision permite iniciar trabajo de remediacion y configuracion, no publicar todavia en Vercel/Render ni tratar SQLite local como persistencia definitiva.

### Siguiente etapa

1. Produccion 1: optimizacion de payload multimedia.
2. Produccion 2: compatibilidad PostgreSQL y migracion controlada.
3. Produccion 3: limpieza Git y retirada de `backend/venv`.
4. Produccion 4: configuracion Vercel.
5. Produccion 5: configuracion Render.
6. Produccion 6: despliegue de prueba/staging.
7. Produccion 7: smoke tests remotos.
8. Produccion 8: produccion final y rollback.

El siguiente lote exacto es **Produccion 1: optimizacion de payload multimedia**. Debe remedir `/api/public/projects`, `/api/admin/media-assets` y la carga inicial antes de avanzar a infraestructura.
