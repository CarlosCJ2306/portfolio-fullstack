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
