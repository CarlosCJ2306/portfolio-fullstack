# Contrato API para Frontend React

Proyecto: Portfolio Full Stack  
Backend: FastAPI + SQLite + SQLAlchemy  
Frontend previsto: React + Vite  

---

## URL base del backend

En desarrollo local:

```txt
http://127.0.0.1:8000
```

En React se usará esta variable de entorno:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

La aplicacion actual del frontend consume esta URL base desde `frontend/.env` y la documenta en `frontend/.env.example`.

Ademas de `GET /api/public/home`, la portada publica carga `GET /api/public/projects` para mostrar todos los proyectos activos.

---

## Endpoints públicos disponibles

Estos endpoints serán consumidos por el frontend React.

---

## 1. Health check público

### Endpoint

```http
GET /api/public/health
```

### Uso

Verifica que el módulo público del backend está funcionando.

### Respuesta esperada

```json
{
  "status": "ok",
  "module": "public",
  "message": "Public API is running"
}
```

---

## 2. Información principal del portafolio

### Endpoint recomendado para cargar la página principal

```http
GET /api/public/home
```

### Uso

Este endpoint carga en una sola petición la mayoría de información necesaria para la página principal del portafolio.

Alimenta estas secciones:

```txt
Hero
Sobre mí
Redes sociales
Skills
Proyectos destacados
Experiencia
Educación
Certificaciones
```

### Estructura general de respuesta

```json
{
  "profile": {
    "id": 1,
    "full_name": "Carlos Andrés Jiménez Sarmiento",
    "professional_title": "Desarrollador de Software",
    "summary": "Texto descriptivo del perfil profesional.",
    "location": "Colombia",
    "email": "correo@example.com",
    "phone": null,
    "cv_url": null,
    "avatar": null
  },
  "social_links": [],
  "skills": [],
  "featured_projects": [],
  "experience": [],
  "education": [],
  "certifications": []
}
```

---

## 3. Perfil principal

### Endpoint

```http
GET /api/public/profile
```

### Uso

Carga solamente la información principal del perfil profesional.

### Campos importantes

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

---

## 4. Enlaces sociales

### Endpoint

```http
GET /api/public/social-links
```

### Uso

Carga enlaces como GitHub, LinkedIn, correo u otros canales.

### Ejemplo de respuesta

```json
[
  {
    "id": 1,
    "platform": "GitHub",
    "url": "https://github.com/",
    "icon_name": "github",
    "display_order": 1
  }
]
```

---

## 5. Skills

### Endpoint

```http
GET /api/public/skills
```

### Uso

Carga las habilidades técnicas del portafolio.

### Campos importantes

```txt
name
category
level
color
display_order
icon
```

---

## 6. Proyectos

### Endpoint

```http
GET /api/public/projects
```

### Uso

Carga todos los proyectos activos del portafolio.

### Campos importantes

```txt
title
slug
short_description
description
repository_url
demo_url
is_featured
image
gallery_images
skills
```

### Notas del contrato actual

- `image` sigue siendo la portada principal del card.
- `gallery_images` contiene las imagenes adicionales ordenadas.
- Cada item de `gallery_images` expone el `media_asset_id`, el orden y el objeto `image`.
- El detalle publico de proyectos abre un modal/carrusel con estas imagenes adicionales.

---

## 7. Proyectos destacados

### Endpoint

```http
GET /api/public/projects/featured
```

### Uso

Carga únicamente los proyectos marcados como destacados.

---

## 8. Experiencia laboral

### Endpoint

```http
GET /api/public/experience
```

### Uso

Carga la experiencia laboral activa.

### Campos importantes

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
```

---

## 9. Educación

### Endpoint

```http
GET /api/public/education
```

### Uso

Carga la formación académica.

---

## 10. Certificaciones

### Endpoint

```http
GET /api/public/certifications
```

### Uso

Carga cursos, certificaciones o credenciales.

### Notas del contrato actual

- `credential_url` se mantiene como enlace externo separado.
- `certificate_file` puede incluir un PDF en base64 con `mime_type` `application/pdf`.
- El frontend abre ese PDF en un modal simple cuando el contenido corresponde a un documento valido.

---

## 11. Formulario de contacto

### Endpoint

```http
POST /api/public/contact
```

### Uso

Guarda en la base de datos un mensaje enviado desde el formulario de contacto del frontend.

### Body esperado

```json
{
  "name": "Cliente de prueba",
  "email": "cliente@test.com",
  "subject": "Consulta desde el portafolio",
  "message": "Hola Carlos, estoy interesado en contactarte para un proyecto."
}
```

### Validaciones

```txt
name:
- mínimo 2 caracteres
- máximo 150 caracteres

email:
- mínimo 5 caracteres
- máximo 150 caracteres
- debe contener @ y punto

subject:
- opcional
- máximo 180 caracteres

message:
- mínimo 10 caracteres
- máximo 3000 caracteres
```

### Respuesta exitosa

```json
{
  "success": true,
  "message": "Mensaje enviado correctamente.",
  "contact_message_id": 1
}
```

---

## Rutas de documentación del backend

Estas rutas son solo para desarrollo o revisión técnica.

```http
GET /docs
GET /redoc
GET /openapi.json
```

Actualmente están protegidas con usuario y contraseña.

El frontend React no debe consumir estas rutas.

---

## Ruta interna de desarrollo

### Endpoint

```http
GET /api/routes
```

### Uso

Lista las rutas registradas actualmente en FastAPI.

Sirve para verificar el mapeo de endpoints.

---

## Estrategia recomendada para React

Para cargar la página principal del portafolio, React debería usar principalmente:

```http
GET /api/public/home
```

Para enviar mensajes del formulario de contacto:

```http
POST /api/public/contact
```

---

## Variable necesaria en el frontend

Archivo actual:

```txt
frontend/.env.example
```

Contenido:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

---

## Servicio frontend sugerido

Archivo futuro:

```txt
frontend/src/services/publicApi.js
```

Funciones recomendadas:

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

---

## Estado actual del backend

Backend público listo para frontend:

```txt
GET  /api/public/health
GET  /api/public/home
GET  /api/public/profile
GET  /api/public/social-links
GET  /api/public/skills
GET  /api/public/projects
GET  /api/public/projects/featured
GET  /api/public/experience
GET  /api/public/education
GET  /api/public/certifications
POST /api/public/contact
```

## Contrato vigente resumido

- La portada actual usa `/api/public/home` para perfil, skills, experiencia, educación, certificaciones y proyectos destacados.
- La lista completa de proyectos se obtiene con `/api/public/projects`.
- Las certificaciones pueden incluir `certificate_file` y `credential_url` al mismo tiempo.
- Los proyectos mantienen una sola portada mediante `image` y una galeria adicional en `gallery_images`.