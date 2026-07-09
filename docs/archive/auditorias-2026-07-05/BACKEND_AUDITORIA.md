# Auditoría del backend

Fecha: 2026-07-05  
Alcance: backend FastAPI, persistencia SQLite y contraste de sus contratos con el frontend actual.  
Método: revisión estática del código y consultas SQLite en modo de solo lectura. No se arrancó la aplicación ni se modificó la base de datos.

## 1. Resumen ejecutivo

El backend está organizado en capas `router -> service -> repository -> SQLAlchemy/SQLite`. Su entrada real es `backend/app/main.py`; carga configuración desde `backend/.env`, registra los routers público y administrativo, aplica CORS y protege administración con HTTP Basic.

Los contratos principales están conectados correctamente:

- La portada pública usa perfil, redes, skills, experiencia, educación y certificaciones desde `GET /api/public/home`.
- Todos los proyectos activos se obtienen con `GET /api/public/projects`.
- `Project.image` sigue representando la portada.
- `Project.gallery_images` representa la galería adicional ordenada.
- Las certificaciones entregan por separado `credential_url` y `certificate_file`.
- El CRUD administrativo principal tiene rutas y schemas compatibles con React.

La incompatibilidad confirmada más importante es el perfil administrativo: React espera `avatar_asset_id`, pero `GET/PUT /api/admin/profile` usan `ProfileRead`, que no devuelve ese campo. Al editar y guardar el perfil sin volver a seleccionar el avatar, el frontend actual puede enviar `avatar_asset_id: null` y retirar el avatar existente.

También están confirmados estos riesgos del backend:

- SQLite no activa `PRAGMA foreign_keys=ON` para las conexiones normales.
- El borrado de media assets no valida si el asset está referenciado.
- Portada, avatar, icono y PDF no validan existencia ni tipo de asset como sí lo hace la galería.
- Los archivos base64 no tienen límite de tamaño ni validación real de MIME/contenido.
- CORS solo contempla orígenes locales codificados en `main.py`.

## 2. Estructura del backend

| Área | Ubicación | Responsabilidad |
|---|---|---|
| Entrada | `backend/app/main.py` | FastAPI, CORS, middleware, documentación y registro de routers. |
| Configuración | `backend/app/core/config.py` | Variables de entorno y rutas del backend. |
| Autenticación | `backend/app/core/admin_auth.py` | HTTP Basic para el panel administrativo. |
| Base de datos | `backend/app/database/connection.py` | Engine, sesiones y dependencia `get_db`. |
| Modelos | `backend/app/models/` | Tablas y relaciones SQLAlchemy. |
| Schemas | `backend/app/schemas/` | Entradas y respuestas Pydantic. |
| Repositorios | `backend/app/repositories/` | Consultas y mutaciones ORM. |
| Servicios | `backend/app/services/` | Validaciones, coordinación y commits. |
| Rutas | `backend/app/routers/` | API pública, login y API administrativa. |
| Scripts | `backend/app/scripts/` | Creación, seed, inspección, chequeo y migración. |

## 3. Modelos y entidades disponibles

La base real contiene las 13 tablas esperadas y coincide con los modelos registrados en `backend/app/models/__init__.py`.

| Tabla | Modelo | Campos principales | Relaciones y uso |
|---|---|---|---|
| `profile` | `Profile` | `full_name`, `professional_title`, `summary`, `location`, `email`, `phone`, `cv_url`, `avatar_asset_id` | Avatar opcional hacia `media_assets`. |
| `social_links` | `SocialLink` | `platform`, `url`, `icon_name`, `display_order`, `is_active` | Sección pública de redes. |
| `skills` | `Skill` | `name`, `category`, `level`, `icon_asset_id`, `color`, orden/activo | Icono opcional y relación muchos a muchos con proyectos. |
| `projects` | `Project` | `title`, `slug`, descripciones, `image_asset_id`, URLs, destacado, orden/activo | Portada, skills y galería. |
| `project_skills` | Tabla asociativa | `project_id`, `skill_id` | Proyectos ↔ skills. |
| `project_images` | `ProjectImage` | `project_id`, `media_asset_id`, `display_order` | Imágenes adicionales ordenadas. |
| `experiences` | `Experience` | cargo, empresa, ubicación, fechas, descripción, orden/activo | Tiene bullets. |
| `experience_bullets` | `ExperienceBullet` | `experience_id`, `description`, `display_order` | Pertenece a experiencia. |
| `education` | `Education` | institución, grado, área, años, descripción, orden/activo | Sección pública de educación. |
| `certifications` | `Certification` | nombre, emisor, fecha, URL, descripción, `certificate_file_id`, orden/activo | Documento opcional hacia `media_assets`. |
| `media_assets` | `MediaAsset` | tipo, nombre, MIME, base64, SVG, alt, activo | Almacén compartido de imágenes, iconos, avatar y PDF. |
| `contact_messages` | `ContactMessage` | remitente, correo, asunto, mensaje, leído, timestamps | Formulario público y bandeja admin. |
| `users` | `User` | usuario, correo, hash, activo, timestamps | No participa en la autenticación real. |

Los mixins añaden `created_at`, `updated_at`, `is_active` y/o `display_order` según la entidad.

### Estado de SQLite observado

- `PRAGMA integrity_check`: `ok`.
- `PRAGMA foreign_key_check`: cero violaciones actuales.
- `PRAGMA foreign_keys` en una conexión SQLite nueva: `0`.
- Registros actuales observados: 1 proyecto, 5 asociaciones de galería y 1 certificación con archivo.
- Tipos de asset presentes: `avatar`, `document`, `icon`, `icon_svg` e `image`.
- MIME presentes: PDF, JPEG, PNG y SVG.

La base está íntegra actualmente, pero la ausencia de foreign keys activas durante el runtime sigue siendo un riesgo para operaciones futuras.

## 4. Relación entre proyectos e imágenes

### Portada

`projects.image_asset_id` apunta a `media_assets.id` y `Project.image` expone el asset completo. El frontend usa exclusivamente `project.image` como portada del card.

### Galería

`project_images` es una entidad asociativa con:

- `project_id`.
- `media_asset_id`.
- `display_order`.
- clave primaria compuesta por proyecto y asset, que impide repetir el mismo asset en una galería.
- índice por proyecto, orden y asset.

`Project.gallery_items` tiene `cascade="all, delete-orphan"` y se ordena por `display_order`, luego por `media_asset_id`. La propiedad `Project.gallery_images` expone esa relación al schema público.

En create/update, `gallery_image_ids`:

- conserva el orden recibido;
- rechaza duplicados;
- valida IDs inexistentes;
- exige `asset_type == "image"`;
- reemplaza asociaciones al editar;
- permite vaciar la galería con una lista vacía;
- no elimina el `MediaAsset` al retirar una asociación.

Riesgos:

- `image_asset_id` no recibe la misma validación de existencia y tipo que la galería.
- La misma imagen puede ser portada y galería; el backend lo permite y el frontend público la deduplica visualmente.
- Una imagen SVG subida como `asset_type=image` puede guardarse solo en `svg_content`; los visores de proyectos esperan principalmente `data_base64`, por lo que puede no renderizarse.
- Un asset inactivo puede seguir apareciendo anidado porque las relaciones no filtran `MediaAsset.is_active`.

## 5. Certificados PDF y documentos

El soporte real existe, pero no usa un endpoint de streaming:

1. El PDF se guarda en `media_assets.data_base64` con `mime_type=application/pdf` y normalmente `asset_type=document`.
2. `certifications.certificate_file_id` referencia ese asset.
3. `Certification.certificate_file` usa carga `joined`.
4. `CertificationRead` devuelve el objeto `certificate_file` completo.
5. React convierte el base64 a `Blob`, crea una URL temporal y lo muestra en un `iframe` modal.
6. `credential_url` permanece como enlace externo independiente.

Riesgos confirmados:

- El backend no comprueba que `certificate_file_id` exista antes del commit.
- No exige `asset_type=document` ni `mime_type=application/pdf`.
- `MediaAssetCreate` no valida que `data_base64` sea base64 válido o corresponda al MIME declarado.
- No hay límite de tamaño; el PDF completo se devuelve dentro de `/home` y `/certifications`.
- Al borrar el media asset no se comprueba primero si está relacionado con una certificación.

## 6. Endpoints y uso real

Estados usados en la tabla:

- **Compatible**: ruta, método y contrato coinciden con el consumo actual.
- **Compatible con riesgo**: funciona, pero tiene una debilidad confirmada.
- **Parcial**: existe una discrepancia de contrato.
- **No usado**: existe, pero el frontend actual no lo invoca.

### Rutas generales y públicas

| Endpoint | Método | Qué devuelve | Quién lo usa | Estado | Riesgo |
|---|---|---|---|---|---|
| `/` | GET | Estado, nombre y entorno de la app | Verificación manual | Compatible | Bajo: expone nombre de entorno. |
| `/api/routes` | GET | Todas las rutas registradas | Nadie en React | No usado | Medio: revela superficie administrativa sin autenticación. |
| `/docs` | GET | Swagger protegido | Desarrollo | Compatible con riesgo | Credenciales Basic y valores fallback débiles. |
| `/redoc` | GET | ReDoc protegido | Desarrollo | Compatible con riesgo | Igual que `/docs`. |
| `/openapi.json` | GET | Esquema OpenAPI protegido | Swagger/ReDoc | Compatible | Depende de credenciales de documentación. |
| `/api/public/health` | GET | Estado del módulo público | Nadie en React | No usado | Sin riesgo funcional. |
| `/api/public/profile` | GET | `ProfileRead` con avatar | Wrapper `getProfile`, sin llamada actual | Compatible | Devuelve base64 del avatar. |
| `/api/public/social-links` | GET | Enlaces activos ordenados | Wrapper sin llamada actual | Compatible | Sin discrepancia. |
| `/api/public/skills` | GET | Skills activas con iconos | Wrapper sin llamada actual | Compatible | Puede incluir base64/SVG; SVG se inserta como HTML en React. |
| `/api/public/projects` | GET | Proyectos activos, portada, galería y skills | `HomePage.jsx` | Compatible con riesgo | Payload base64 potencialmente grande. |
| `/api/public/projects/featured` | GET | Proyectos activos destacados | Wrapper sin llamada actual | Compatible | `/home` ya incluye estos datos. |
| `/api/public/experience` | GET | Experiencia activa y bullets | Wrapper sin llamada actual | Compatible | Sin discrepancia contractual. |
| `/api/public/education` | GET | Educación activa | Wrapper sin llamada actual | Compatible | Sin discrepancia contractual. |
| `/api/public/certifications` | GET | Certificaciones con URL y archivo | Wrapper sin llamada actual | Compatible con riesgo | PDF completo en JSON/base64. |
| `/api/public/home` | GET | Perfil, redes, skills, destacados, experiencia, educación y certificaciones | `HomePage.jsx` | Compatible con riesgo | Incluye multimedia pesada y repite destacados frente a `/projects`. |
| `/api/public/contact` | POST | Confirmación e ID del mensaje | `ContactSection.jsx` | Compatible | Validación de email es básica; no hay rate limit/antispam. |

### Autenticación y administración

| Endpoint | Método | Qué devuelve | Quién lo usa | Estado | Riesgo |
|---|---|---|---|---|---|
| `/api/admin/auth/login` | POST | Éxito y nombre de usuario | `AdminPage.jsx` / `loginAdmin` | Compatible con riesgo | HTTP Basic, sin rate limit; contraseña persistida por el frontend. |
| `/api/admin/health` | GET | Estado del módulo admin | Nadie en React | No usado | Exige autenticación; bajo. |
| `/api/admin/dashboard` | GET | Contadores administrativos | `AdminPage.jsx` | Compatible | Sin discrepancia. |
| `/api/admin/profile` | GET | `ProfileRead` | `AdminPage.jsx` | **Parcial** | No devuelve `avatar_asset_id`; puede perderse el avatar al guardar. |
| `/api/admin/profile` | PUT | Perfil actualizado como `ProfileRead` | `AdminProfilePanel` | **Parcial** | Acepta el ID, pero no lo devuelve; tampoco valida tipo/existencia. |
| `/api/admin/social-links` | GET | Todos los enlaces, incluido `is_active` | `AdminPage.jsx` | Compatible | Sin discrepancia. |
| `/api/admin/social-links` | POST | Enlace creado | `AdminSocialLinksPanel` | Compatible | URL solo tiene validación de longitud. |
| `/api/admin/social-links/{id}` | PUT | Enlace actualizado | `AdminSocialLinksPanel` | Compatible | URL no valida protocolo. |
| `/api/admin/social-links/{id}` | DELETE | 204 sin contenido | `AdminSocialLinksPanel` | Compatible | Eliminación física. |
| `/api/admin/skills` | GET | Skills con `icon_asset_id`, icono y estado | `AdminPage.jsx` | Compatible | Puede incluir multimedia completa. |
| `/api/admin/skills` | POST | Skill creada | `AdminSkillsPanel` | Compatible con riesgo | No valida existencia/tipo de `icon_asset_id`. |
| `/api/admin/skills/{id}` | PUT | Skill actualizada | `AdminSkillsPanel` | Compatible con riesgo | Mismo riesgo del icono. |
| `/api/admin/skills/{id}` | DELETE | 204 sin contenido | `AdminSkillsPanel` | Compatible con riesgo | Relaciones con proyectos dependen de ORM/FK. |
| `/api/admin/projects` | GET | Proyectos con portada, galería, skills y estado | `AdminPage.jsx` | Compatible | Contrato completo para edición. |
| `/api/admin/projects` | POST | Proyecto creado | `AdminProjectsPanel` | Compatible con riesgo | Galería validada; portada no validada. |
| `/api/admin/projects/{id}` | PUT | Proyecto actualizado | `AdminProjectsPanel` | Compatible con riesgo | Reemplaza galería; portada sigue sin validación equivalente. |
| `/api/admin/projects/{id}` | DELETE | 204 sin contenido | `AdminProjectsPanel` | Compatible con riesgo | Foreign keys SQLite no están activas globalmente. |
| `/api/admin/experience` | GET | Experiencias y bullets, incluido estado | `AdminPage.jsx` | Compatible | Sin discrepancia. |
| `/api/admin/experience` | POST | Experiencia creada | `AdminExperiencePanel` | Compatible | Fechas no validan coherencia entre inicio y fin. |
| `/api/admin/experience/{id}` | PUT | Experiencia actualizada | `AdminExperiencePanel` | Compatible | Reemplazo total de bullets cuando se envían. |
| `/api/admin/experience/{id}` | DELETE | 204 sin contenido | `AdminExperiencePanel` | Compatible con riesgo | Cascade ORM funciona; FK de SQLite no está garantizada. |
| `/api/admin/education` | GET | Registros con estado | `AdminPage.jsx` | Compatible | Sin discrepancia. |
| `/api/admin/education` | POST | Educación creada | `AdminEducationPanel` | Compatible | No valida que `end_year >= start_year`. |
| `/api/admin/education/{id}` | PUT | Educación actualizada | `AdminEducationPanel` | Compatible | Mismo riesgo de años. |
| `/api/admin/education/{id}` | DELETE | 204 sin contenido | `AdminEducationPanel` | Compatible | Eliminación física. |
| `/api/admin/certifications` | GET | Certificaciones con archivo, ID y estado | `AdminPage.jsx` | Compatible con riesgo | PDF base64 completo en cada listado. |
| `/api/admin/certifications` | POST | Certificación creada | `AdminCertificationsPanel` | Compatible con riesgo | No valida que el asset sea PDF/documento. |
| `/api/admin/certifications/{id}` | PUT | Certificación actualizada | `AdminCertificationsPanel` | Compatible con riesgo | Igual que POST. |
| `/api/admin/certifications/{id}` | DELETE | 204 sin contenido | `AdminCertificationsPanel` | Compatible | No elimina el asset asociado. |
| `/api/admin/contact-messages` | GET | Mensajes con timestamps | `AdminMessagesPanel` | Compatible | Puede crecer sin paginación. |
| `/api/admin/contact-messages/{id}` | GET | Un mensaje | Nadie en React | No usado | Sin riesgo funcional. |
| `/api/admin/contact-messages/{id}/read` | PATCH | Mensaje marcado leído | `AdminMessagesPanel` | Compatible | Solo permite marcar; no revertir. |
| `/api/admin/contact-messages/{id}` | DELETE | 204 sin contenido | Nadie en React | No usado | Eliminación física. |
| `/api/admin/media-assets` | GET | Catálogo completo o filtrado | `AdminPage.jsx` / pickers | Compatible con riesgo | Devuelve todos los base64; no pagina. |
| `/api/admin/media-assets/{id}` | GET | Un asset completo | Nadie en React | No usado | Puede devolver objetos grandes. |
| `/api/admin/media-assets` | POST | Asset creado | `AdminImagePicker` y `AdminProjectGalleryPicker` | Compatible con riesgo | Sin límite, MIME estricto ni validación base64. |
| `/api/admin/media-assets/{id}` | DELETE | 204 sin contenido | Existe wrapper, no se invoca en UI | No usado / riesgoso | No comprueba referencias; puede dejar IDs huérfanos. |

## 7. Respuestas JSON esperadas por React

### Perfil

```json
{
  "id": 1,
  "full_name": "...",
  "professional_title": "...",
  "summary": "...",
  "location": "...",
  "email": "...",
  "phone": null,
  "cv_url": null,
  "avatar": {
    "id": 1,
    "asset_type": "avatar",
    "mime_type": "image/png",
    "data_base64": "..."
  }
}
```

Para administración falta `avatar_asset_id` en esta respuesta, aunque el campo sí existe en la tabla y se acepta en `ProfileUpdate`.

### Proyecto

```json
{
  "id": 1,
  "title": "...",
  "slug": "...",
  "short_description": "...",
  "description": "...",
  "repository_url": null,
  "demo_url": null,
  "is_featured": true,
  "display_order": 0,
  "image": { "id": 10, "mime_type": "image/jpeg", "data_base64": "..." },
  "gallery_images": [
    {
      "media_asset_id": 11,
      "display_order": 0,
      "image": { "id": 11, "mime_type": "image/jpeg", "data_base64": "..." }
    }
  ],
  "skills": []
}
```

La respuesta administrativa añade `image_asset_id` e `is_active`. No devuelve `gallery_image_ids` como lista plana; React los deriva correctamente desde `gallery_images[].media_asset_id`.

### Certificación

```json
{
  "id": 1,
  "name": "...",
  "issuer": "...",
  "issue_date": "2026-01-01",
  "credential_url": "https://...",
  "description": "...",
  "display_order": 0,
  "certificate_file": {
    "id": 20,
    "asset_type": "document",
    "mime_type": "application/pdf",
    "data_base64": "..."
  }
}
```

La respuesta administrativa añade `certificate_file_id` e `is_active`.

### Home público

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

`/home` no incluye todos los proyectos bajo `projects`; entrega únicamente `featured_projects`. Esto no rompe el frontend actual porque `HomePage.jsx` solicita `/api/public/projects` por separado y agrega `projects` localmente.

## 8. Campos existentes pero no usados o parcialmente usados

| Campo o entidad | Estado real |
|---|---|
| Tabla/modelo `users` completo | No se usa para login; la autenticación lee usuario y contraseña desde `.env`. |
| `created_at` / `updated_at` de la mayoría de entidades | Persistidos, pero omitidos en respuestas públicas y casi todas las respuestas admin. Se usan principalmente en mensajes y `created_at` de assets. |
| `media_assets.updated_at` | No se entrega ni se usa en la UI. |
| `media_assets.is_active` | Se devuelve al admin, pero no existe update de assets ni filtro público de relaciones; uso práctico incompleto. |
| `projects.slug` | Se devuelve y administra, pero React no lo usa para navegación o URLs de detalle. |
| `skills.color` | Se devuelve y administra; la vista pública actual no aplica el color. |
| `social_links.icon_name` | Se administra y devuelve; el Hero público muestra texto de plataforma, no ese icono. |
| `experiences.country` | Se entrega; la vista pública actual prioriza `location` inexistente o `city`, por lo que `country` no se muestra. |
| `experiences.is_current` | Se administra y entrega; la vista pública no lo consulta directamente. |
| `profile.phone` | Se entrega, pero la vista pública actual no lo muestra. |
| `profile.avatar_asset_id` | Sí se usa para relación y escritura, pero falta en la respuesta administrativa. |
| `project_images.project_id` | No se repite en cada objeto JSON anidado; el contexto del proyecto lo hace innecesario. |
| `display_order` | Aunque varias vistas no lo muestran, sí determina el orden de consulta y no es un campo muerto. |

## 9. Campos esperados por frontend que backend no entrega

### Incompatibilidad confirmada

| Consumidor | Campo esperado | Backend actual | Consecuencia |
|---|---|---|---|
| `normalizeProfileForm` en `AdminPage.jsx` | `avatar_asset_id` | `ProfileRead` solo entrega `avatar` | El formulario carga el ID vacío y un guardado posterior puede desvincular el avatar. |

### Fallbacks que no son incompatibilidades

Los componentes públicos aceptan alias como `name`, `title`, `headline`, `status`, `location`, `github_url` o `live_url`. Son tolerancias del frontend; los nombres oficiales entregados por FastAPI (`full_name`, `professional_title`, `position`, `repository_url`, etc.) sí están contemplados. No se confirma otro campo obligatorio ausente.

Las certificaciones muestran un icono fijo en React; el frontend no solicita un campo de icono y el modelo backend tampoco lo contempla. Por tanto, no es una incompatibilidad actual, sino una funcionalidad inexistente en ambos contratos.

## 10. Riesgos de CORS, rutas, imágenes y archivos

### CORS y URLs

- Permitidos: `localhost` y `127.0.0.1` en puertos 5173 y 3000.
- La configuración local `VITE_API_BASE_URL=http://127.0.0.1:8000` es compatible.
- Cualquier dominio, IP o puerto distinto fallará por CORS hasta actualizar código.
- Los orígenes no se leen desde `.env`.
- `allow_credentials=True` con lista explícita de orígenes es válido; no se usa wildcard de origen.

### Rutas

- Las rutas que invoca React existen con los métodos correctos.
- No hay rutas públicas por ID para proyectos, certificaciones o skills; el frontend actual no las necesita porque el detalle usa el objeto ya cargado.
- `/api/routes` es público y revela métodos/rutas de administración.
- La documentación protegida usa credenciales separadas de las administrativas, pero ambas tienen fallbacks débiles en configuración.

### Imágenes y archivos

- Todo el contenido viaja embebido en JSON; no hay streaming, `FileResponse`, rangos HTTP ni caché de archivos.
- Las respuestas `/home`, `/projects`, `/certifications` y `/media-assets` pueden crecer rápidamente.
- No hay límites de tamaño ni paginación para assets.
- No se valida base64 real, firma del archivo ni coherencia MIME/extensión.
- `asset_type` es texto libre. La documentación menciona algunos valores, pero la base ya contiene tanto `icon` como `icon_svg`.
- SVG se devuelve como texto y el frontend lo inserta con `dangerouslySetInnerHTML`; el backend no sanitiza el SVG.
- Assets inactivos pueden seguir apareciendo a través de relaciones.

### Integridad referencial

- `connection.py` no habilita foreign keys para cada conexión SQLite.
- La migración de galería las activa solo en su conexión.
- El estado actual no presenta violaciones, pero futuras eliminaciones pueden producir referencias huérfanas.
- `delete_media_asset` es el punto de mayor riesgo porque no revisa usos previos.

## 11. Prioridades recomendadas para una fase posterior

Sin implementar cambios en esta auditoría, el orden sugerido es:

1. Corregir el contrato administrativo del perfil para conservar `avatar_asset_id`.
2. Habilitar foreign keys en todas las conexiones y volver a ejecutar chequeos de integridad antes y después.
3. Bloquear o controlar la eliminación de assets referenciados.
4. Aplicar validación de existencia/tipo a avatar, icono, portada y certificado.
5. Limitar tamaño y validar MIME/base64/SVG en uploads.
6. Extraer CORS a configuración por ambiente.
7. Reducir payloads multimedia mediante endpoints de archivo o almacenamiento externo si el portfolio crece.
8. Añadir pruebas automatizadas de contratos públicos, CRUD, galería y PDF.

## 12. Límites de esta auditoría

- No se modificó código, configuración ni datos.
- No se ejecutaron `reset_db.py`, `seed_db.py`, `create_db.py`, `update_db.py` ni migraciones.
- SQLite se abrió con `mode=ro` exclusivamente para inventario e integridad.
- No se arrancó FastAPI para evitar escrituras del sistema de logs.
- Los estados de endpoint se basan en routers, schemas, servicios, repositorios y consumo real del frontend.
> Estado: documento histórico.
> No representa el diagnóstico o plan vigente.
> Se conserva únicamente para trazabilidad.

