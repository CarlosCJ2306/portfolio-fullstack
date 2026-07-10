# Payload Fase 7.1

## Objetivo

Reducir de forma segura el peso de las respuestas JSON públicas y administrativas separando la metadata de multimedia del contenido binario/Base64. El contenido se entrega ahora bajo demanda mediante `content_url`, sin modificar `portfolio.db`, sin CRUD real, sin migraciones y sin despliegue.

## Línea base previa

### Endpoints públicos

| Endpoint | Antes | Observación |
|---|---:|---|
| `/api/public/home` | 379.794 B | Incluía el avatar como Base64 dentro del JSON. |
| `/api/public/profile` | 364.532 B | Incluía el avatar como Base64. |
| `/api/public/projects` | 11.571 B | Ya no exponía imágenes por confidencialidad C3/C4. |
| `/api/public/projects/featured` | 5.737 B | Sin Base64 público. |
| `/api/public/certifications` | 2 B | Sin certificaciones públicas activas. |

### Endpoints administrativos

| Endpoint | Antes | Observación |
|---|---:|---|
| `/api/admin/media-assets` | 10.858.065 B | Descargaba los 13 assets completos. |
| `/api/admin/projects` | 10.245.867 B | Incluía multimedia completa del proyecto histórico. |
| `/api/admin/certifications` | 121.420 B | Incluía documento asociado. |
| `/api/admin/profile` | 364.552 B | Incluía avatar completo. |

## Cambios implementados

- Los schemas públicos y administrativos de `MediaAsset` entregan metadata ligera:
  - `id`;
  - `asset_type`;
  - `file_name`;
  - `mime_type`;
  - `alt_text`;
  - `is_active`;
  - `content_url`.
- Las respuestas generales dejaron de transportar `data_base64` y `svg_content`.
- Se agregaron endpoints de contenido bajo demanda:
  - `GET /api/public/media-assets/{asset_id}/content`;
  - `GET /api/admin/media-assets/{asset_id}/content`.
- El endpoint público solo autoriza assets activos referenciados públicamente.
- El endpoint admin exige Basic Auth y permite obtener cualquier asset existente para su gestión.
- `allow_public_images=false` mantiene ocultas portada/galería en JSON público y también impide recuperar esa multimedia por endpoint público.
- El frontend público consume `content_url` directamente cuando existe.
- El frontend admin usa fetch autenticado y Blob URLs para previews, PDF y bibliotecas internas.
- Las Blob URLs administrativas se revocan al cerrar/cambiar/desmontar o cuando dejan de estar referenciadas.

## Política de autorización pública

Un asset público puede descargarse solo si está activo y está referenciado por alguna relación pública válida:

- avatar del perfil;
- icono de skill activa;
- portada de proyecto activo con `allow_public_images=true`;
- imagen de galería de proyecto activo con `allow_public_images=true`;
- documento de certificación activa.

Los assets huérfanos, inactivos, administrativos o asociados a proyectos con imágenes públicas deshabilitadas responden 404 en la ruta pública.

## Política administrativa

La ruta administrativa de contenido:

- requiere autenticación HTTP Basic;
- no guarda credenciales en URL ni storage;
- devuelve `Content-Type`, `Content-Length`, `Content-Disposition`, `ETag`, `Cache-Control: private, no-store` y `X-Content-Type-Options: nosniff`;
- mantiene separadas metadata y contenido.

## Línea posterior

### Endpoints públicos

| Endpoint | Después | Reducción |
|---|---:|---:|
| `/api/public/home` | 16.386 B | -95,7 % |
| `/api/public/profile` | 1.124 B | -99,7 % |
| `/api/public/skills` | 5.451 B | 0 % |
| `/api/public/projects` | 11.571 B | 0 % |
| `/api/public/projects/featured` | 5.737 B | 0 % |
| `/api/public/certifications` | 2 B | 0 % |

`/api/public/home` ya no contiene `data_base64` ni `svg_content`; solo incluye `content_url` para el avatar. El avatar se descarga bajo demanda desde `/api/public/media-assets/4/content` con 272.578 B.

### Endpoints administrativos

| Endpoint | Después | Reducción |
|---|---:|---:|
| `/api/admin/media-assets` | 3.203 B | -99,97 % |
| `/api/admin/profile` | 1.185 B | -99,7 % |
| `/api/admin/projects` | 13.992 B | -99,86 % |
| `/api/admin/certifications` | 837 B | -99,3 % |

Los endpoints generales administrativos ya no contienen `data_base64` ni `svg_content`. La biblioteca mantiene `content_url` por asset para cargar contenido solo cuando la UI lo necesita.

## Línea de carga frontend

### Desarrollo Vite

| Métrica | Resultado |
|---|---:|
| Requests locales observados | 73 |
| Transferencia observada | 5.587.245 B |
| Fallos | 2 aborts esperados por AbortController/StrictMode |
| Consola | Mensajes informativos de Vite/React DevTools |

La transferencia de desarrollo sigue dominada por módulos no optimizados de Vite (`react-dom_client`, `@vite/client`, React Refresh). Los aborts corresponden a cancelaciones controladas de `/api/public/home` y `/api/public/projects` durante desarrollo.

### Preview de build

| Métrica | Resultado |
|---|---:|
| Requests locales observados | 8 |
| Transferencia observada | 1.005.446 B |
| Fallos | 0 |
| Consola | 0 errores relevantes |

Principales transferencias en preview:

- `LogoCJ.png`: 321.438 B;
- avatar público bajo demanda: 272.929 B transferidos;
- `LogoCJ.ico`: 270.670 B;
- bundle JS: 98.703 B;
- `/api/public/home`: 16.620 B transferidos;
- `/api/public/projects`: 11.805 B transferidos.

## Pruebas y verificaciones

| Verificación | Resultado |
|---|---|
| `python -m pytest -q` | 37 pruebas aprobadas, 1 warning externo de Starlette/httpx. |
| `python -m app.scripts.check_db` | `foreign_keys=1`, `integrity_check=ok`, sin violaciones. |
| `npm run lint` | Aprobado. |
| `npm run build` | Aprobado. |
| `git diff --check` | Aprobado. |
| SQLite | Tamaño y timestamp sin cambios; hash final registrado: `43CD430783BE1BCD6305C0D96AE5D33DE2006CD5B05819AE13ED6AC8BB8B6470`. |

## Resultado

Fase 7.1 queda cerrada técnicamente. La optimización elimina Base64/SVG/PDF de respuestas JSON generales y conserva compatibilidad visual mediante carga bajo demanda.

## Riesgos y pendientes

- Fase 7.2 debe limpiar artefactos recreables del índice, especialmente `backend/venv`, sin borrar copias locales.
- Fase 7.3 debe revisar CORS productivo, secretos y variables por entorno.
- El payload inicial de preview sigue dominado por logos públicos; una optimización de imágenes estáticas puede evaluarse después si el propietario lo autoriza.
- No se implementó paginación de media assets porque el lote se centró en separar metadata y contenido.
