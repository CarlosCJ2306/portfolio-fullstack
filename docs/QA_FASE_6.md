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
