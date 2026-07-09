# Auditoría general del portfolio full stack

Fecha de revisión: 2026-07-05  
Alcance: auditoría estática del backend, frontend, contratos HTTP, configuración y estructura del repositorio.  
Único archivo creado durante la auditoría: `AUDITORIA_GENERAL.md`.

## 1. Resumen del sistema

El proyecto es un portfolio monorepositorio con dos aplicaciones:

- Backend: FastAPI + SQLAlchemy + SQLite, con entrada real en `backend/app/main.py` y ejecución prevista desde `backend/` mediante `uvicorn app.main:app`.
- Frontend: React 19 + Vite, con entrada HTML en `frontend/index.html`, entrada JavaScript en `frontend/src/main.jsx` y raíz visual en `frontend/src/App.jsx`.
- Persistencia: `backend/portfolio.db` configurada mediante `DATABASE_URL`.
- API pública: perfil, enlaces sociales, skills, proyectos, experiencia, educación, certificaciones y contacto.
- API administrativa: autenticación HTTP Basic, dashboard y CRUD del contenido principal y de media assets.
- Multimedia: imágenes, SVG y PDF almacenados en `media_assets`, principalmente como base64 dentro de SQLite y de las respuestas JSON.
- Proyectos: una portada en `projects.image_asset_id` y una galería ordenada en `project_images`.
- Certificaciones: enlace externo en `credential_url` y PDF opcional relacionado por `certificate_file_id`.

La conexión funcional principal está alineada: todas las rutas que actualmente invoca React existen en FastAPI y los nombres de campos esenciales coinciden. La galería conserva la portada separada y entrega las imágenes adicionales en orden. El mayor riesgo no es una ruta ausente, sino la seguridad de administración, el peso de los recursos base64, la falta de una estrategia general de migraciones y la codificación de textos.

## 2. Mapa del backend

### 2.1 Capas y archivos principales

| Capa | Archivo o carpeta | Responsabilidad |
|---|---|---|
| Entrada | `backend/app/main.py` | Crea FastAPI, CORS, documentación protegida, middleware y routers. |
| Configuración | `backend/app/core/config.py` | Lee `backend/.env` y expone `settings`. |
| Autenticación | `backend/app/core/admin_auth.py` | Valida administración mediante HTTP Basic y variables de entorno. |
| Logs | `backend/app/core/log.py` | Logging de aplicación, HTTP, scripts y base de datos. |
| Base de datos | `backend/app/database/connection.py` | Construye la URL, engine, sesiones y dependencia `get_db`. |
| Modelos | `backend/app/models/` | Entidades SQLAlchemy y relaciones. |
| Esquemas | `backend/app/schemas/` | Contratos Pydantic públicos y administrativos. |
| Repositorios | `backend/app/repositories/` | Consultas y operaciones ORM. |
| Servicios | `backend/app/services/` | Reglas de negocio, validaciones y commits. |
| Routers | `backend/app/routers/` | Rutas públicas, administrativas y login. |
| Scripts | `backend/app/scripts/` | Creación, seed, inspección, chequeo, reset y migración de galería. |
| Contrato | `backend/docs/API_FRONTEND.md` | Documentación del consumo público desde React. |

El flujo habitual es `router -> service -> repository -> SQLAlchemy/SQLite`. La separación está aplicada de forma consistente en los módulos públicos y administrativos.

### 2.2 Entidades y tablas esperadas

| Tabla o entidad | Función y relaciones principales |
|---|---|
| `media_assets` / `MediaAsset` | Guarda tipo, nombre, MIME, base64, SVG y texto alternativo. Es reutilizada por perfil, skills, proyectos, galería y certificaciones. |
| `profile` / `Profile` | Perfil único esperado; avatar opcional mediante `avatar_asset_id`. |
| `social_links` / `SocialLink` | Enlaces sociales ordenados y activables. |
| `skills` / `Skill` | Skills ordenadas, activables e icono opcional mediante `icon_asset_id`. |
| `projects` / `Project` | Proyecto, slug único, portada mediante `image_asset_id`, orden, estado destacado y activo. |
| `project_skills` | Relación muchos a muchos entre proyectos y skills. |
| `project_images` / `ProjectImage` | Galería adicional; clave compuesta `project_id + media_asset_id` y `display_order`. |
| `experiences` / `Experience` | Experiencia laboral ordenada y activable. |
| `experience_bullets` / `ExperienceBullet` | Detalles ordenados pertenecientes a una experiencia. |
| `education` / `Education` | Institución, grado, área, años, descripción, orden y estado activo. |
| `certifications` / `Certification` | Certificación, emisor, fecha, URL, descripción y PDF opcional mediante `certificate_file_id`. |
| `contact_messages` / `ContactMessage` | Mensajes públicos con estado leído/no leído. |
| `users` / `User` | Modelo previsto para usuarios; actualmente no participa en la autenticación real. |

Relaciones confirmadas:

- `Project.image` es la portada del proyecto.
- `Project.gallery_items` se ordena por `display_order` y luego `media_asset_id`.
- `Project.skills` usa `project_skills`.
- `Experience.bullets` elimina huérfanos con la relación ORM.
- `Certification.certificate_file`, `Profile.avatar` y `Skill.icon` relacionan `MediaAsset`.

### 2.3 Rutas generales y de documentación

| Método | Ruta | Uso |
|---|---|---|
| GET | `/` | Estado general del backend. |
| GET | `/api/routes` | Lista las rutas registradas; utilidad de desarrollo. |
| GET | `/docs` | Swagger protegido con HTTP Basic. |
| GET | `/redoc` | ReDoc protegido con HTTP Basic. |
| GET | `/openapi.json` | OpenAPI protegido con HTTP Basic. |

### 2.4 Rutas públicas

Prefijo: `/api/public`.

| Método | Ruta | Respuesta o función |
|---|---|---|
| GET | `/health` | Estado del módulo público. |
| GET | `/profile` | Perfil con avatar. |
| GET | `/social-links` | Enlaces activos ordenados. |
| GET | `/skills` | Skills activas ordenadas. |
| GET | `/projects` | Todos los proyectos activos, portada, galería y skills. |
| GET | `/projects/featured` | Proyectos activos y destacados. |
| GET | `/experience` | Experiencias activas y bullets. |
| GET | `/education` | Educación activa. |
| GET | `/certifications` | Certificaciones activas y PDF relacionado. |
| GET | `/home` | Perfil, redes, skills, proyectos destacados, experiencia, educación y certificaciones. |
| POST | `/contact` | Valida y crea un mensaje de contacto. |

### 2.5 Rutas administrativas

La ruta de login es `POST /api/admin/auth/login`. El resto usa el prefijo `/api/admin` y exige HTTP Basic en cada petición.

| Recurso | Operaciones disponibles |
|---|---|
| Salud | `GET /health` |
| Dashboard | `GET /dashboard` |
| Perfil | `GET /profile`, `PUT /profile` |
| Redes | `GET/POST /social-links`, `PUT/DELETE /social-links/{id}` |
| Skills | `GET/POST /skills`, `PUT/DELETE /skills/{id}` |
| Proyectos | `GET/POST /projects`, `PUT/DELETE /projects/{id}` |
| Experiencia | `GET/POST /experience`, `PUT/DELETE /experience/{id}` |
| Educación | `GET/POST /education`, `PUT/DELETE /education/{id}` |
| Certificaciones | `GET/POST /certifications`, `PUT/DELETE /certifications/{id}` |
| Mensajes | `GET /contact-messages`, `GET/DELETE /contact-messages/{id}`, `PATCH /contact-messages/{id}/read` |
| Multimedia | `GET/POST /media-assets`, `GET/DELETE /media-assets/{id}` |

## 3. Mapa del frontend

### 3.1 Entrada y navegación

- `frontend/index.html` carga `/src/main.jsx` y usa `/LogoCJ.ico` como favicon.
- `frontend/src/main.jsx` monta React en `#root`.
- `frontend/src/App.jsx` no usa React Router: decide entre `AdminPage` y `HomePage` comprobando si `window.location.pathname` empieza por `/admin`.
- `frontend/src/components/layout/Header.jsx` usa `/LogoCJ.png` y navegación por anclas; enlaza el panel con `/admin`.

### 3.2 Vista pública

`HomePage.jsx` solicita en paralelo:

- `GET /api/public/home` para perfil, redes, skills, experiencia, educación, certificaciones y destacados.
- `GET /api/public/projects` para sustituir los destacados por la lista completa de proyectos.

Después distribuye los datos en:

- `HeroSection.jsx`: perfil, avatar y enlaces sociales.
- `SkillsSection.jsx`: skills e iconos.
- `ProjectsSection.jsx`: portada en cards y detalle modal con portada más `gallery_images`.
- `ExperienceSection.jsx`: experiencia y bullets.
- `EducationSection.jsx`: `field_of_study`, `start_year`, `end_year` y descripción.
- `CertificationsSection.jsx`: `credential_url` y PDF base64 convertido a Blob URL dentro de un `iframe` modal.
- `ContactSection.jsx`: envía el formulario a `POST /api/public/contact`.

El card público de proyectos usa exclusivamente `project.image` como portada. El modal construye el carrusel con la portada seguida por `gallery_images`, evita mostrar dos veces el mismo asset y soporta cierre por botón, Escape o fondo.

### 3.3 Panel administrativo

`AdminPage.jsx` concentra estado, autenticación, carga inicial y operaciones CRUD. Delega formularios en componentes de `frontend/src/components/admin/`.

- Perfil: edición y selección/subida de avatar.
- Redes sociales: CRUD.
- Skills: CRUD y selección/subida de icono.
- Proyectos: CRUD, portada individual y galería adicional ordenada.
- Galería: selección múltiple, subida de varios archivos mediante peticiones individuales, retiro de asociaciones y reordenamiento visual.
- Experiencia: CRUD y bullets.
- Educación: CRUD.
- Certificaciones: CRUD, URL externa y selección/subida de PDF.
- Mensajes: listado y marcado como leído.
- Dashboard: contadores globales.

`AdminImagePicker.jsx` se reutiliza para un asset individual. `AdminProjectGalleryPicker.jsx` maneja la selección múltiple específica de proyectos.

## 4. Mapa de APIs frontend/backend

### 4.1 Endpoints efectivamente invocados por la vista pública

| Función frontend | Método y ruta | Consumidor | Estado |
|---|---|---|---|
| `getHomeData` | GET `/api/public/home` | `HomePage.jsx` | Compatible. |
| `getProjects` | GET `/api/public/projects` | `HomePage.jsx` | Compatible. |
| `sendContactMessage` | POST `/api/public/contact` | `ContactSection.jsx` | Compatible. |

`publicApi.js` también expone wrappers compatibles para perfil, redes, skills, destacados, experiencia, educación y certificaciones, pero actualmente la interfaz no los llama de forma independiente.

### 4.2 Endpoints efectivamente invocados por administración

| Área | Rutas consumidas | Estado |
|---|---|---|
| Login | POST `/api/admin/auth/login` | Compatible. |
| Dashboard | GET `/api/admin/dashboard` | Compatible. |
| Perfil | GET/PUT `/api/admin/profile` | Compatible. |
| Redes | GET/POST y PUT/DELETE por ID | Compatible. |
| Skills | GET/POST y PUT/DELETE por ID | Compatible. |
| Proyectos | GET/POST y PUT/DELETE por ID | Compatible, incluye `gallery_image_ids`. |
| Experiencia | GET/POST y PUT/DELETE por ID | Compatible. |
| Educación | GET/POST y PUT/DELETE por ID | Compatible. |
| Certificaciones | GET/POST y PUT/DELETE por ID | Compatible, incluye `certificate_file_id`. |
| Mensajes | GET lista y PATCH leído | Compatible; la UI no usa GET individual ni DELETE. |
| Multimedia | GET lista, POST y DELETE por ID | Compatible; `deleteMediaAsset` existe en el servicio pero no se usa en la UI actual. |

### 4.3 Contratos relevantes confirmados

- Proyecto público: `image` sigue siendo portada y `gallery_images` contiene objetos ordenados con `media_asset_id`, `display_order` e `image`.
- Proyecto administrativo: create/update aceptan `image_asset_id`, `skill_ids` y `gallery_image_ids`.
- Certificación pública: entrega `credential_url` y `certificate_file` por separado.
- Certificación administrativa: create/update aceptan `certificate_file_id`; lectura devuelve también ese ID.
- Educación: backend y frontend coinciden en `field_of_study`, `start_year` y `end_year`.
- La variable `VITE_API_BASE_URL` existe tanto en `frontend/.env` como en `frontend/.env.example`.
- Las claves de configuración declaradas en `backend/.env` y `backend/.env.example` coinciden con las leídas por `config.py`.
- La URL local `http://127.0.0.1:8000` coincide con el puerto del backend y su origen Vite `http://127.0.0.1:5173` está permitido por CORS. También se admite `localhost:5173`.

## 5. Riesgos y hallazgos

### Prioridad alta

1. **Credenciales administrativas en `localStorage`.** `adminApi.js` guarda usuario y contraseña en texto recuperable por JavaScript y los reenvía mediante HTTP Basic en cada petición. Esto solo es razonable para uso local y exige HTTPS, credenciales fuertes y acceso restringido si se publica.

2. **SQLite no activa foreign keys para todas las conexiones.** `connection.py` configura `check_same_thread`, pero no registra `PRAGMA foreign_keys=ON` en el engine. El script de galería lo activa solo para su propia conexión. En operación normal, `ON DELETE CASCADE`, `SET NULL` y `RESTRICT` pueden no aplicarse, permitiendo referencias huérfanas.

3. **El borrado de media assets no comprueba referencias.** `DELETE /api/admin/media-assets/{id}` elimina directamente el asset. Combinado con foreign keys potencialmente desactivadas, puede dejar portada, avatar, icono, PDF o galería apuntando a un ID inexistente.

4. **Multimedia base64 sin límites de tamaño.** `MediaAssetCreate` exige contenido, pero no limita longitud, valida base64, restringe MIME ni enumera realmente `asset_type`. Imágenes y PDF viajan completos en JSON y permanecen en memoria del navegador. La base activa observada ocupa aproximadamente 10,5 MB y crecerá con cada galería.

5. **Codificación dañada extendida.** Se encontraron cadenas visibles y comentarios con `Ã`, `Â`, `â` y `ðŸ`, incluso dobles como `ÃƒÂ`, en backend, frontend y documentación. Está confirmado en `HomePage.jsx`, `EducationSection.jsx`, `CertificationsSection.jsx`, `HeroSection.jsx`, `AdminNotice.jsx`, servicios y README. Esto ya puede mostrarse al usuario.

6. **No hay suite automatizada de integración.** No existe una carpeta de pruebas funcionales para validar contratos, CRUD, autenticación, galería o PDF. La integración depende de pruebas manuales.

### Prioridad media

1. **Carga pública duplicada y acoplada.** `HomePage.jsx` descarga `/home` y `/projects` con `Promise.all`. `/home` ya contiene destacados, por lo que puede repetir imágenes base64; además, si falla cualquiera de las dos peticiones, toda la portada muestra error.

2. **CORS está codificado en `main.py`.** Funciona en local para puertos 5173 y 3000, pero un dominio o puerto de despliegue requerirá cambio de código.

3. **Ruta `/admin` depende del fallback del servidor web.** Como no hay router de cliente y la selección usa `window.location.pathname`, abrir `/admin` directamente en producción exige que el hosting devuelva `index.html` para esa ruta.

4. **Falta un sistema general de migraciones.** La galería tiene un script idempotente específico y `update_db.py` altera certificaciones de forma histórica, pero no existe Alembic ni un registro estructurado de versión del esquema.

5. **Validación desigual de relaciones multimedia.** La galería valida existencia, duplicados y `asset_type=image`; portada, avatar, icono y PDF no tienen validaciones equivalentes de existencia y tipo antes del commit.

6. **Valores de seguridad por defecto débiles.** `config.py` usa `admin/admin123` como fallback tanto para documentación como para administración si faltan variables.

7. **El modelo `User` no autentica el panel.** La tabla y el comentario sugieren usuarios/JWT futuros, pero la autenticación real depende exclusivamente de `.env`. No es un error de conexión, pero sí una diferencia arquitectónica que debe quedar explícita.

### Prioridad baja o documental

1. `AdminNotice.jsx` se renderiza, pero su texto dice que experiencia, educación y certificaciones son la “siguiente fase”; esos CRUD ya están implementados. No es código muerto, sino contenido obsoleto.
2. `backend/docs/API_FRONTEND.md` llama “archivo futuro” a `frontend/src/services/publicApi.js`, aunque el archivo ya existe y está activo.
3. `README.md` afirma que existen documentos `PLAN_*.md`, pero actualmente no hay ninguno en la raíz.
4. `frontend/index.html` conserva `<title>frontend</title>`, un nombre técnico de scaffold y no el título final del portfolio.
5. La documentación y muchos comentarios conservan mojibake, dificultando mantenimiento aunque no siempre afecten la ejecución.

## 6. Archivos importantes, generados, dudosos o sin uso directo

### Importantes y activos

- Todo `backend/app/`, salvo que un análisis posterior demuestre lo contrario.
- Todo `frontend/src/` importado desde `main.jsx`, incluido el árbol administrativo.
- `backend/app/scripts/migrate_project_gallery.py`: documenta y valida una migración real; debe conservarse.
- `backend/portfolio.db`: base activa; no debe borrarse.
- `backend/portfolio_backup_antes_galeria_real.db`: backup; no debe borrarse sin autorización.
- `frontend/public/LogoCJ.ico` y `frontend/public/LogoCJ.png`: ambos están referenciados.
- `.env.example`, archivos de dependencias y configuraciones de Vite/ESLint.

### Generados o locales, no código fuente

- `backend/venv/`: entorno virtual recreable desde `requirements.txt`; ya está ignorado.
- `frontend/node_modules/`: dependencias recreables desde `package-lock.json`; ya está ignorado.
- `frontend/dist/`: artefacto de `npm run build`; actualmente no se observó como fuente necesaria y está ignorado.
- `backend/logs/`: salida de ejecución; está ignorada.
- `backend/.env`, `frontend/.env`, bases `.db` y backups: estado local sensible; están ignorados por `.gitignore`.

### Candidatos a revisión manual, no a eliminación automática

- `backend/update_db.py`: script histórico de una sola alteración para `certificate_file_id`; se superpone con el esquema actual, modifica la base directamente y no debe ejecutarse sin backup. Candidato principal a archivar o retirar después de confirmar su valor histórico.
- `backend/app/scripts/test_log.py`: diagnóstico manual del sistema de logs; no participa en runtime.
- `backend/app/scripts/reset_db.py`: mantenimiento destructivo intencional; no está muerto, pero debe mantenerse claramente separado del flujo normal.
- `backend/app/scripts/create_db.py`, `seed_db.py` e `inspect_db.py`: herramientas de desarrollo, no runtime; conservar mientras sean parte del arranque o diagnóstico local.
- `frontend/src/components/admin/AdminNotice.jsx` y su CSS: componente activo con mensaje obsoleto; requiere actualizar contenido o retirar su render, no borrarlo a ciegas.
- Wrappers públicos individuales no usados y `deleteMediaAsset` en los servicios frontend: utilidades disponibles pero sin consumidor actual; no son duplicados confirmados.
- `User` y tabla `users`: infraestructura futura no conectada; requiere decisión de arquitectura antes de considerarla innecesaria.

No se confirmó ningún duplicado de código funcional que pueda eliminarse con seguridad durante esta auditoría.

## 7. Pendientes reales

1. Normalizar a UTF-8 los archivos con texto dañado, verificando primero qué cadenas llegan ya corruptas desde la base de datos.
2. Activar y verificar foreign keys de SQLite en cada conexión de aplicación; auditar referencias existentes antes de endurecerlas.
3. Proteger el borrado de media assets usados por otras entidades.
4. Definir límites de tamaño, tipos permitidos y validación real de base64/MIME en uploads.
5. Definir configuración de CORS y URL pública por ambiente de despliegue.
6. Definir seguridad administrativa para producción; como mínimo HTTPS y no persistir contraseña en `localStorage`.
7. Crear pruebas de contrato/API y flujos mínimos de CRUD, galería, PDF y contacto.
8. Consolidar la estrategia de migraciones sin ejecutar `reset_db.py` sobre datos reales.
9. Corregir contradicciones en README, contrato API y `AdminNotice`.
10. Verificar política de despliegue SPA para acceso directo a `/admin`.

## 8. Recomendaciones por prioridad

### P0 — Antes de publicar administración en Internet

- Restringir el panel, exigir HTTPS y sustituir el almacenamiento persistente de contraseña.
- Activar foreign keys para toda conexión SQLite y respaldar/verificar la base antes.
- Impedir eliminación de assets referenciados.
- Limitar y validar uploads multimedia.

### P1 — Estabilidad funcional

- Reparar la codificación UTF-8 del texto visible y revisar registros ya guardados.
- Añadir pruebas de API para rutas públicas y CRUD administrativo.
- Añadir pruebas del contrato de proyectos (`image` + `gallery_images`) y certificaciones (`credential_url` + PDF).
- Evitar que una falla en la petición de proyectos inutilice toda la vista pública y revisar la duplicación de payload base64.

### P2 — Operación y despliegue

- Externalizar CORS por ambiente.
- Documentar fallback SPA para `/admin`.
- Adoptar un mecanismo de migraciones versionadas o, como mínimo, scripts idempotentes con registro de versión y backup obligatorio.
- Definir una estrategia de almacenamiento de archivos fuera de JSON/SQLite si el catálogo multimedia crece.

### P3 — Higiene documental

- Actualizar el texto de `AdminNotice.jsx`.
- Corregir README y `API_FRONTEND.md` para describir solo archivos existentes.
- Revisar manualmente `update_db.py`, `test_log.py` y el modelo `User`.
- Cambiar el título HTML genérico por el nombre final del portfolio.

## 9. Verificación realizada y límites

- Se revisaron estáticamente entrypoints, routers, modelos, schemas, repositorios, servicios, páginas, componentes, servicios API, `.env.example`, claves de `.env` y `.gitignore`.
- Se confirmó que las claves declaradas en cada `.env` y `.env.example` son equivalentes sin exponer sus valores sensibles.
- Se ejecutó `npm run lint`: finalizó correctamente, sin errores.
- No se ejecutó `npm run build` porque regeneraría `frontend/dist` y el alcance pidió no modificar archivos.
- No se arrancó FastAPI ni se ejecutó `check_db.py`, porque el sistema de logging puede escribir en `backend/logs`.
- No se ejecutaron `reset_db.py`, `seed_db.py`, `create_db.py`, `update_db.py` ni la migración.
- La base y sus backups no fueron modificados.
- El estado de Git muestra todos los elementos como no rastreados (`??`); antes de publicar debe verificarse cuidadosamente qué se añade al primer commit, aunque `.gitignore` ya cubre secretos, bases y artefactos principales.
> Estado: documento histórico.
> No representa el diagnóstico o plan vigente.
> Se conserva únicamente para trazabilidad.

