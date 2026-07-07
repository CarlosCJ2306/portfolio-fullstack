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

## Estado actual del contrato

- La portada publica usa `GET /api/public/home` como carga principal.
- La lista completa de proyectos usa `GET /api/public/projects`.
- El panel admin usa rutas separadas para dashboard, CRUD, mensajes y media assets.

## Endpoints publicos

### Salud

```http
GET /api/public/health
```

Respuesta esperada:

```json
{
  "status": "ok",
  "module": "public",
  "message": "Public API is running"
}
```

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

- `profile.avatar` contiene el asset de avatar cuando existe.
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
- El detalle publico de proyectos abre un modal/carrusel con la portada y la galeria.

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
credential_url
certificate_file
display_order
```

Notas:

- `credential_url` es un enlace externo independiente.
- `certificate_file` puede incluir `mime_type`, `data_base64` y, si aplica, PDF en `application/pdf`.
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
POST /api/admin/media-assets
DELETE /api/admin/media-assets/{id}
```

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
uploadMediaAsset()
deleteMediaAsset()
```

## Rutas de documentacion

```http
GET /docs
GET /redoc
GET /openapi.json
```

Estas rutas estan protegidas con usuario y contrasena de documentacion.

## Resumen vigente

- `GET /api/public/home` sigue siendo la carga principal de la portada.
- `GET /api/public/projects` entrega la lista completa con portada y galeria ordenada.
- Las certificaciones pueden usar `credential_url` y `certificate_file` al mismo tiempo.
- El admin trabaja con `avatar_asset_id`, `image_asset_id`, `gallery_image_ids`, `icon_asset_id` y `certificate_file_id`.
- `MediaAsset` se valida por tipo, MIME, tamano, Base64 y SVG seguro antes de persistir.

