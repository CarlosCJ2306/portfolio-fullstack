# Contrato API para el frontend

Proyecto: Portfolio Full Stack
Backend: FastAPI + SQLite + SQLAlchemy
Frontend: React + Vite

## URL base

En desarrollo local:

```txt
http://127.0.0.1:8000
```

En el frontend se usa:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

El frontend consume esta variable desde `frontend/.env` y la documenta en `frontend/.env.example`.

`VITE_API_BASE_URL` es publica en el bundle. No debe contener credenciales, tokens, API keys ni secretos.

En staging/production debe ser una URL absoluta `https://` sin credenciales embebidas, sin `localhost` y sin path/query/fragment. La validacion previa al build se ejecuta con:

```bash
npm run validate:production-env
```

## Estado actual del contrato

- La portada publica usa `GET /api/public/home` como carga principal.
- La lista completa de proyectos usa `GET /api/public/projects`.
- El panel admin usa rutas separadas para dashboard, CRUD, mensajes y media assets.
- Las respuestas generales entregan metadata ligera de multimedia y `content_url`; el contenido pesado se descarga bajo demanda.

## Endpoints publicos

### Health

```http
GET /health
```

Respuesta esperada:

```json
{
  "status": "ok"
}
```

Endpoint publico minimo para health checks de plataforma. No requiere Basic Auth y no devuelve configuracion, rutas, versiones ni contenido profesional.

### Readiness

```http
GET /ready
```

Respuesta esperada con SQLite disponible:

```json
{
  "status": "ready"
}
```

Si SQLite no esta disponible, responde 503:

```json
{
  "status": "unavailable"
}
```

`/ready` solo ejecuta una comprobacion equivalente a `SELECT 1`; no modifica datos ni devuelve rutas internas.

### Home publica

```http
GET /api/public/home
```

Carga en una sola respuesta:

```json
{
  "profile": {},
  "social_links": [],
  "skills": [],
  "featured_projects": [],
  "experience": [],
  "education": [],
  "certifications": []
}
```

Notas:

- `profile.avatar` contiene metadata ligera del asset de avatar cuando existe.
- `profile.avatar.content_url` permite descargar la imagen bajo demanda.
- `profile.avatar` no incluye `data_base64` ni `svg_content`.
- Si el home falla, el frontend puede seguir mostrando otras secciones si la carga de proyectos responde.

### Perfil publico

```http
GET /api/public/profile
```

Campos clave:

```txt
full_name
professional_title
summary
location
email
phone
cv_url
avatar
```

### Redes sociales publicas

```http
GET /api/public/social-links
```

### Skills publicas

```http
GET /api/public/skills
```

### Proyectos publicos

```http
GET /api/public/projects
GET /api/public/projects/featured
```

Campos relevantes:

```txt
title
slug
short_description
description
is_confidential
confidentiality_note
client_display_name
allow_public_images
repository_url
demo_url
is_featured
is_active
image
gallery_images
skills
display_order
```

Notas del contrato:

- `image` sigue siendo la portada principal del card.
- `gallery_images` contiene las imagenes adicionales ordenadas.
- `is_confidential` informa que el contenido corresponde a información reservada; no oculta imágenes por sí solo.
- `client_display_name` y `confidentiality_note` contienen únicamente texto público/genérico.
- Cuando `allow_public_images=false`, la API pública devuelve `image=null` y `gallery_images=[]`. No elimina ni desasocia los assets almacenados.
- El detalle publico de proyectos abre un modal/carrusel con la portada y la galeria.
- Cuando existen imágenes públicas autorizadas, `image` y `gallery_images[].image` entregan metadata ligera con `content_url`, no Base64.

### Media assets publicos

```http
GET /api/public/media-assets/{asset_id}/content
```

Devuelve el contenido binario del asset público autorizado.

Política de autorización:

- El asset debe estar activo.
- Debe estar referenciado por contenido público activo: avatar, skill, portada de proyecto, galería de proyecto o certificación.
- Para proyectos, `allow_public_images=true` es obligatorio para exponer portada o galería.
- Los assets huérfanos, inactivos, administrativos o asociados a proyectos con `allow_public_images=false` responden 404.

Headers relevantes:

```txt
Content-Type
Content-Length
Content-Disposition
Cache-Control
ETag
X-Content-Type-Options: nosniff
```

### Experiencia publica

```http
GET /api/public/experience
```

Campos clave:

```txt
position
company
country
city
start_date
end_date
is_current
description
bullets
display_order
```

### Educacion publica

```http
GET /api/public/education
```

Campos clave:

```txt
institution
degree
field_of_study
start_year
end_year
description
display_order
```

### Certificaciones publicas

```http
GET /api/public/certifications
```

Campos clave:

```txt
name
issuer
issue_date
expiration_date
credential_url
certificate_file
display_order
```

Notas:

- `credential_url` es un enlace externo independiente.
- `expiration_date` es opcional y, cuando existe junto a `issue_date`, no puede ser anterior.
- `certificate_file` entrega metadata ligera y `content_url` cuando existe.
- `certificate_file` no incluye `data_base64` ni `svg_content` en respuestas generales.
- El frontend puede abrir el PDF en un modal simple o usar un fallback de abrir/descargar.

### Contacto publico

```http
POST /api/public/contact
```

Body esperado:

```json
{
  "name": "Cliente de prueba",
  "email": "cliente@test.com",
  "subject": "Consulta",
  "message": "Hola, estoy interesado en un proyecto."
}
```

Validaciones principales:

- `name`: obligatorio, longitud razonable.
- `email`: obligatorio, formato valido.
- `subject`: opcional.
- `message`: obligatorio, longitud minima y maxima.

## Endpoints admin

Todos estos endpoints requieren autenticacion HTTP Basic en memoria desde el frontend.

### Login

```http
POST /api/admin/auth/login
```

### Dashboard

```http
GET /api/admin/dashboard
```

Devuelve conteos generales y estado resumido del panel.

### Perfil admin

```http
GET /api/admin/profile
PUT /api/admin/profile
```

Contrato relevante:

- el perfil admin conserva `avatar_asset_id`;
- el frontend mantiene respaldo con `avatar.id` si hace falta.

### Mensajes

```http
GET /api/admin/contact-messages
POST /api/admin/contact-messages/{id}/read
DELETE /api/admin/contact-messages/{id}
```

### Skills

```http
GET /api/admin/skills
POST /api/admin/skills
PUT /api/admin/skills/{id}
DELETE /api/admin/skills/{id}
```

### Proyectos

```http
GET /api/admin/projects
POST /api/admin/projects
PUT /api/admin/projects/{id}
DELETE /api/admin/projects/{id}
```

Contrato relevante:

- `image_asset_id` sigue siendo la portada.
- `gallery_image_ids` representa imagenes adicionales ordenadas.
- `is_confidential` usa `false` por defecto.
- `confidentiality_note` acepta texto público opcional de hasta 500 caracteres.
- `client_display_name` acepta un alias público opcional de hasta 180 caracteres.
- `allow_public_images` usa `true` por defecto para compatibilidad histórica.
- El admin siempre recibe `image` y `gallery_images` asociados, incluso cuando `allow_public_images=false`.

### Experiencia

```http
GET /api/admin/experience
POST /api/admin/experience
PUT /api/admin/experience/{id}
DELETE /api/admin/experience/{id}
```

### Educacion

```http
GET /api/admin/education
POST /api/admin/education
PUT /api/admin/education/{id}
DELETE /api/admin/education/{id}
```

### Certificaciones

```http
GET /api/admin/certifications
POST /api/admin/certifications
PUT /api/admin/certifications/{id}
DELETE /api/admin/certifications/{id}
```

Contrato relevante:

- `credential_url` y `certificate_file_id` son capacidades separadas.
- `expiration_date` es `date | null`; no se calcula automáticamente.
- Si `issue_date` y `expiration_date` existen, el vencimiento debe ser igual o posterior a la emisión. La regla también se aplica a actualizaciones parciales.

### Redes sociales

```http
GET /api/admin/social-links
POST /api/admin/social-links
PUT /api/admin/social-links/{id}
DELETE /api/admin/social-links/{id}
```

### Media assets

```http
GET /api/admin/media-assets
GET /api/admin/media-assets/{id}/content
POST /api/admin/media-assets
DELETE /api/admin/media-assets/{id}
```

Contrato de listado:

- `GET /api/admin/media-assets` devuelve metadata ligera y `content_url`.
- No devuelve `data_base64` ni `svg_content`.
- El panel administrativo debe usar `GET /api/admin/media-assets/{id}/content` para previews, PDFs o descargas bajo demanda.
- La ruta de contenido admin requiere HTTP Basic y no debe colocarse directamente en `<img>` sin fetch autenticado.

Reglas de assets:

- `avatar` para avatar de perfil.
- `image` para portada y galeria de proyectos.
- `icon` e `icon_svg` para iconos historicos o actuales de skills.
- `document` para certificados PDF.

Validaciones principales:

- MIME permitido segun tipo de asset.
- tamano maximo segun tipo.
- Base64 valido antes de persistir.
- SVG seguro antes de persistir y antes de renderizar.
- PDF solo cuando `mime_type` es `application/pdf`.

## Servicio frontend sugerido

El frontend usa wrappers como:

```txt
getHomeData()
getProfile()
getSocialLinks()
getSkills()
getProjects()
getFeaturedProjects()
getExperience()
getEducation()
getCertifications()
sendContactMessage(data)
```

Y para admin:

```txt
loginAdmin()
getAdminDashboard()
getAdminProfile()
updateAdminProfile()
getAdminContactMessages()
markAdminContactMessageAsRead()
deleteAdminContactMessage()
getAdminSkills()
createAdminSkill()
updateAdminSkill()
deleteAdminSkill()
getAdminProjects()
createAdminProject()
updateAdminProject()
deleteAdminProject()
getAdminExperience()
createAdminExperience()
updateAdminExperience()
deleteAdminExperience()
getAdminEducation()
createAdminEducation()
updateAdminEducation()
deleteAdminEducation()
getAdminCertifications()
createAdminCertification()
updateAdminCertification()
deleteAdminCertification()
getAdminSocialLinks()
createAdminSocialLink()
updateAdminSocialLink()
deleteAdminSocialLink()
listMediaAssets()
fetchAdminMediaBlob()
uploadMediaAsset()
deleteMediaAsset()
```

## Rutas de documentacion

```http
GET /docs
GET /redoc
GET /openapi.json
```

Estas rutas estan protegidas con usuario y contrasena de documentacion. `ENABLE_API_DOCS` las mantiene configurables y quedan deshabilitadas por defecto en production.

## Configuracion runtime

Variables backend canonicas:

```txt
APP_ENV
APP_DEBUG
ADMIN_USERNAME
ADMIN_PASSWORD
CORS_ALLOWED_ORIGINS
TRUSTED_HOSTS
SQLITE_DATABASE_PATH
SQLITE_REQUIRE_EXISTING
SQLITE_BUSY_TIMEOUT_MS
LOG_LEVEL
ENABLE_API_DOCS
```

Reglas relevantes:

- `ADMIN_USERNAME` y `ADMIN_PASSWORD` nunca deben exponerse al frontend.
- CORS usa una lista explicita de origenes; `*` se rechaza en staging/production.
- `Authorization`, `Content-Type`, `Accept` e `If-None-Match` son headers permitidos.
- `ETag` y `Content-Disposition` se exponen para descargas bajo demanda.
- `TRUSTED_HOSTS` controla hosts aceptados por FastAPI.
- En staging/production, SQLite exige ruta absoluta, archivo existente y `SQLITE_REQUIRE_EXISTING=true`.
- No se crea una base vacia automaticamente.
- No se habilita WAL ni se cambia `journal_mode`.
- La operacion futura con SQLite en Azure requiere una instancia, un worker y almacenamiento persistente.

## Resumen vigente

- `GET /api/public/home` sigue siendo la carga principal de la portada.
- `GET /api/public/projects` entrega la lista completa con portada y galeria ordenada.
- Las certificaciones pueden usar `credential_url` y `certificate_file` al mismo tiempo.
- El admin trabaja con `avatar_asset_id`, `image_asset_id`, `gallery_image_ids`, `icon_asset_id` y `certificate_file_id`.
- `MediaAsset` se valida por tipo, MIME, tamano, Base64 y SVG seguro antes de persistir.
- Las respuestas generales de `MediaAsset` son ligeras: usan `content_url` y no transportan Base64/SVG/PDF.
- El contenido pesado se descarga bajo demanda desde endpoints públicos autorizados o endpoints admin autenticados.
