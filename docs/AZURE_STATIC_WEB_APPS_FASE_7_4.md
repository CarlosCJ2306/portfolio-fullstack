# Azure Static Web Apps - Fase 7.4

## Objetivo

Preparar el frontend React/Vite para un despliegue futuro en Azure Static Web Apps, sin crear recursos Azure, sin desplegar y sin modificar backend funcional, SQLite ni contenido profesional.

## Alcance

- Configuración de `staticwebapp.config.json` para SPA.
- Validación automática de la configuración de Azure Static Web Apps.
- Script de build futuro para Azure.
- Plantilla inactiva de GitHub Actions.
- Documentación de seguridad, caché, fallback y variables.

Fuera de alcance:

- Crear recursos Azure.
- Activar workflows reales.
- Configurar Azure App Service.
- Definir dominios reales.
- Configurar CSP definitiva.
- Desplegar.

## Inventario del frontend

| Elemento | Estado actual | Acción 7.4 |
|---|---|---|
| `frontend/package.json` | React/Vite con scripts `dev`, `build`, `lint`, `preview` y `validate:production-env` | Se agregaron `validate:azure-static-config` y `build:azure` |
| `frontend/vite.config.js` | Configuración Vite estándar con React | Sin cambios |
| `frontend/src/utils/apiConfig.js` | Centraliza `VITE_API_BASE_URL` y normaliza la URL del backend | Sin cambios |
| `frontend/.env.example` | Documenta `VITE_API_BASE_URL` local y advierte que `VITE_*` es público | Sin cambios |
| `frontend/scripts/validate-production-env.mjs` | Valida URL productiva del backend | Reutilizado por `build:azure` |
| `frontend/public/` | Contiene favicon/logo públicos | Se agregó `staticwebapp.config.json` |
| `/admin` | Ruta cliente de React | Cubierta por `navigationFallback` |
| API integrada SWA | No existe API dentro del frontend | Se mantiene `api_location` vacío |
| GitHub Actions | No existía workflow activo de despliegue | Se agregó plantilla inactiva en `docs/deployment/` |
| `frontend/dist/` | Salida generada por Vite e ignorada por Git | Verificada con build normal y build Azure |

## Arquitectura futura

El frontend se publicará en Azure Static Web Apps y consumirá un backend separado en Azure App Service para Linux/Python.

| Elemento | Valor futuro |
|---|---|
| app_location | frontend |
| api_location | vacío |
| output_location | dist |
| app_build_command | npm run build:azure |
| VITE_API_BASE_URL | variable pública de build |
| Deployment token | GitHub Secret |
| Backend | Azure App Service separado |

No se usará API integrada de Azure Static Web Apps. SQLite pertenece exclusivamente al backend.

## Build y variable pública

`VITE_API_BASE_URL` es una variable pública de build. Debe contener la URL HTTPS del backend cuando exista el App Service real.

No debe contener:

- credenciales;
- tokens;
- API keys privadas;
- cadenas Basic Auth;
- usuarios o contraseñas administrativas.

Para validaciones locales de esta fase se usó únicamente el ejemplo reservado `https://api.example.invalid`.

## staticwebapp.config.json

El archivo fuente vive en:

```text
frontend/public/staticwebapp.config.json
```

Vite lo copia a la raíz de `frontend/dist/` durante el build.

La configuración incluye:

- fallback SPA hacia `/index.html`;
- exclusión de `/assets/*` y extensiones estáticas;
- headers mínimos de seguridad;
- caché larga únicamente para assets versionados bajo `/assets/*`.

No incluye:

- CORS;
- `apiRuntime`;
- autenticación integrada de Static Web Apps;
- `allowedRoles` para `/admin`;
- dominios Azure inventados;
- CSP definitiva.

## navigationFallback

`/admin` y otras rutas cliente se resuelven mediante `/index.html`. Esto evita un 404 conceptual al recargar rutas de React.

Los assets estáticos quedan excluidos del fallback para que un archivo inexistente no responda como HTML de la aplicación.

## Comportamiento de /admin

`/admin` es una ruta cliente de React. El HTML y el JavaScript del frontend pueden descargarse públicamente, pero no son la frontera de seguridad.

La autorización real permanece en el backend:

- el frontend no contiene credenciales;
- las credenciales administrativas se mantienen solo en memoria;
- las rutas admin del backend exigen HTTP Basic;
- el fallback SPA no reemplaza ni evita la autenticación del backend.

## Headers

Headers configurados en Static Web Apps:

- `X-Content-Type-Options: nosniff`;
- `Referrer-Policy: strict-origin-when-cross-origin`;
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`;
- `X-Frame-Options: DENY`.

CORS no se configura en el frontend. Pertenece al backend App Service.

## Caché

Los archivos bajo `/assets/*` usan:

```http
Cache-Control: public, max-age=31536000, immutable
```

No se aplica caché immutable global a `index.html`.

## CSP pendiente

No se agregó una Content-Security-Policy definitiva porque aún no existen:

- URL real del backend;
- dominios finales;
- configuración remota completa;
- servicios externos definitivos.

La CSP debe cerrarse durante staging, cuando existan los dominios reales.

## Workflow de ejemplo

Se creó la plantilla inactiva:

```text
docs/deployment/azure-static-web-apps.workflow.yml.example
```

La plantilla muestra el despliegue futuro con:

- `Azure/static-web-apps-deploy@v1`;
- `app_location: "frontend"`;
- `api_location: ""`;
- `output_location: "dist"`;
- `app_build_command: "npm run build:azure"`;
- `secrets.AZURE_STATIC_WEB_APPS_API_TOKEN`;
- `vars.VITE_API_BASE_URL`;
- `secrets.GITHUB_TOKEN`.

No está dentro de `.github/workflows`, por lo tanto no se ejecuta automáticamente.

## Secretos y variables futuras de GitHub

Pendientes para la activación real:

- `secrets.AZURE_STATIC_WEB_APPS_API_TOKEN`;
- `vars.VITE_API_BASE_URL`.

No se guardaron tokens reales, dominios reales ni nombres de recursos Azure.

## Contenido esperado de dist

Después de `npm run build:azure`, `frontend/dist/` debe contener:

- `index.html`;
- `staticwebapp.config.json`;
- carpeta `assets/`;
- favicon y assets públicos copiados por Vite.

No debe contener:

- `.env`;
- backend;
- SQLite;
- secretos;
- credenciales;
- rutas personales.

`frontend/dist/` permanece ignorado por Git.

## Validaciones agregadas

Scripts nuevos o actualizados:

```powershell
npm run validate:azure-static-config
npm run build:azure
```

`build:azure` ejecuta:

1. validación de `VITE_API_BASE_URL`;
2. validación de `staticwebapp.config.json`;
3. build de Vite;
4. verificación de `staticwebapp.config.json` en `dist`.

## Pruebas ejecutadas

- `npm run lint`;
- `npm run build`;
- `npm run validate:azure-static-config`;
- `npm run validate:production-env` sin variable, con fallo controlado;
- `npm run validate:production-env` con `https://api.example.invalid`;
- `npm run build:azure` con `https://api.example.invalid`;
- `python -m pytest -q`;
- `python -m app.scripts.check_db`;
- `git diff --check`.

## Integridad SQLite

`portfolio.db` no fue modificado durante esta fase.

Referencia esperada:

- tamaño: 11026432 bytes;
- LastWriteTimeUtc: 2026-07-10T06:11:02.8025327Z;
- SHA-256: 43CD430783BE1BCD6305C0D96AE5D33DE2006CD5B05819AE13ED6AC8BB8B6470.

## Pasos reservados para activación

La plantilla se activará solo cuando:

- exista el recurso Azure Static Web Apps;
- exista el deployment token;
- exista la URL HTTPS real del App Service;
- `VITE_API_BASE_URL` esté configurada como variable del repositorio o entorno;
- se haya validado staging remoto.

## Riesgos pendientes

- Falta URL real del backend.
- Falta recurso Azure Static Web Apps.
- Falta token de despliegue.
- Falta CSP definitiva.
- Falta validación remota en Azure.

## Siguiente lote

Fase 7.5 - configuración de Azure App Service con SQLite persistente.
