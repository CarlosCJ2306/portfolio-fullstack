# Azure App Service - Fase 7.5

## Objetivo

Preparar el backend FastAPI para un despliegue futuro en Azure App Service Linux/Python con SQLite persistente, sin crear recursos Azure, sin desplegar, sin transferir la base y sin modificar datos.

## Alcance

- Definir `backend/` como raiz futura del paquete.
- Agregar `startup.sh` para Linux.
- Validar que el paquete no incluya SQLite local, backups, `.env` ni `venv`.
- Documentar variables futuras de App Service.
- Crear plantillas inactivas de settings y GitHub Actions.
- Documentar transferencia separada de `portfolio.db`.
- Probar health/readiness y reglas de paquete.

Fuera de alcance:

- Crear App Service, Resource Group, Storage Account o Static Web Apps.
- Ejecutar Azure CLI o Azure PowerShell.
- Desplegar ZIP.
- Transferir `portfolio.db`.
- Ejecutar migraciones, seeds o CRUD real.
- Activar workflows en `.github/workflows`.

## Arquitectura futura

```text
Azure Static Web Apps -> Azure App Service Linux/Python -> /home/data/portfolio.db
```

El frontend queda separado del backend. Azure Static Web Apps servira React/Vite y consumira el backend mediante `VITE_API_BASE_URL`.

## Matriz App Service

| Ajuste App Service | Valor futuro |
|---|---|
| Sistema operativo | Linux |
| Runtime | Python compatible validado |
| Startup Command | startup.sh |
| Workers | 1 |
| SQLite | /home/data/portfolio.db |
| Health Check | /ready |
| HTTPS Only | habilitado en staging |
| Build automation | SCM_DO_BUILD_DURING_DEPLOYMENT=true |
| Package root | backend |
| Scale out | deshabilitado |

## Paquete backend

La unidad futura de despliegue es el contenido de `backend/`, no la raiz completa del monorepo.

Estructura conceptual remota:

```text
app/
app/main.py
requirements.txt
startup.sh
scripts/
docs/
```

Esto permite que Oryx detecte `requirements.txt` en la raiz del paquete y que `app.main:app` se importe desde esa misma raiz.

## Oryx y requirements.txt

`backend/requirements.txt` permanece en la raiz del paquete desplegado y contiene dependencias runtime como FastAPI, SQLAlchemy y Uvicorn.

No se depende de `backend/venv`, rutas locales, archivos privados ni `pip freeze`.

## startup.sh

Archivo:

```text
backend/startup.sh
```

Comando efectivo:

```bash
exec python -m uvicorn app.main:app \
  --host 0.0.0.0 \
  --port "${PORT:-8000}" \
  --workers 1 \
  --no-use-colors
```

Restricciones:

- un solo worker;
- sin `--reload`;
- sin migraciones;
- sin seeds;
- sin `pip install` en runtime;
- sin copia automatica de SQLite;
- sin `create_all`;
- logs por stdout/stderr.

## SQLite persistente

Ruta futura recomendada:

```text
/home/data/portfolio.db
```

Debe seguir siendo configurable mediante:

```text
SQLITE_DATABASE_PATH=/home/data/portfolio.db
```

En staging/production:

- `SQLITE_DATABASE_PATH` debe ser absoluta;
- `SQLITE_REQUIRE_EXISTING=true`;
- el archivo debe existir antes de iniciar;
- no se crea una base vacia;
- no se ejecuta `create_all`;
- no se ejecutan seeds;
- no se habilita WAL;
- se mantiene `foreign_keys=ON`;
- se mantiene `SQLITE_BUSY_TIMEOUT_MS`.

Separacion:

- codigo desplegado: directorio administrado por App Service/Oryx;
- datos persistentes: `/home/data/portfolio.db`.

La DB no debe ir en Git, ZIP, workflow artifact, frontend, `site/wwwroot` como estrategia operativa ni directorios temporales.

## Variables App Service

Plantilla:

```text
docs/deployment/azure-app-service.settings.env.example
```

Variables principales:

- `APP_ENV=production`
- `APP_DEBUG=false`
- `ADMIN_USERNAME=<SET_IN_AZURE>`
- `ADMIN_PASSWORD=<SET_IN_AZURE>`
- `CORS_ALLOWED_ORIGINS=<AZURE_STATIC_WEB_APPS_HTTPS_ORIGIN>`
- `TRUSTED_HOSTS=<APP_SERVICE_HOSTNAME>`
- `SQLITE_DATABASE_PATH=/home/data/portfolio.db`
- `SQLITE_REQUIRE_EXISTING=true`
- `SQLITE_BUSY_TIMEOUT_MS=5000`
- `LOG_LEVEL=INFO`
- `ENABLE_API_DOCS=false`
- `SCM_DO_BUILD_DURING_DEPLOYMENT=true`

Azure provee `WEBSITE_HOSTNAME`; la aplicacion puede incorporarlo a Trusted Hosts mediante la logica existente.

## Secretos

Los secretos administrativos se configuran en App Service, nunca en frontend ni en Git.

No se guardan:

- usuario real;
- password real;
- publish profile;
- service principal;
- tokens;
- connection strings;
- subscription IDs reales;
- tenant IDs reales.

## CORS, HTTPS y hosts

Pendiente para staging:

- `CORS_ALLOWED_ORIGINS` debe contener solo el origen HTTPS real de Azure Static Web Apps.
- `TRUSTED_HOSTS` debe contener el hostname real de App Service.
- `HTTPS Only` debe habilitarse en Azure.
- TLS minimo se definira desde App Service.

No se usa wildcard, no se incluye localhost en production y no se inventan dominios.

No se agrego `RedirectHTTPSMiddleware`; la configuracion HTTPS se cerrara en Azure.

## Health y readiness

Rutas existentes:

- `/health`: liveness minima del proceso.
- `/ready`: disponibilidad de SQLite mediante una comprobacion segura equivalente a `SELECT 1`.

Recomendacion para App Service:

- Health Check: `/ready`.
- `/health` se mantiene para confirmar que el proceso responde.

Ambas rutas son publicas y no devuelven rutas, secretos, versiones ni contenido profesional.

## Logging

La aplicacion registra en stdout/stderr para que Azure Log Stream pueda capturar la salida.

`startup.sh` no redirige logs a archivos, no imprime variables de entorno y no expone credenciales.

Application Insights queda reservado para una fase posterior si se decide usarlo.

## Transferencia inicial de SQLite

No se ejecuta en 7.5. Procedimiento futuro:

1. Mantener el backend remoto detenido o no iniciado.
2. Crear `/home/data` mediante SSH/Kudu cuando exista el recurso.
3. Producir un backup local verificado de `portfolio.db`.
4. Registrar tamano, SHA-256, conteos seguros, `integrity_check` y `foreign_key_check`.
5. Transferir una copia a una ruta temporal bajo `/home`.
6. Verificar el hash remoto.
7. Mover la copia de forma controlada a `/home/data/portfolio.db`.
8. Configurar `SQLITE_DATABASE_PATH=/home/data/portfolio.db`.
9. Configurar `SQLITE_REQUIRE_EXISTING=true`.
10. Iniciar o reiniciar App Service.
11. Consultar `/health`.
12. Consultar `/ready`.
13. Verificar endpoints publicos.
14. Reiniciar de nuevo.
15. Confirmar persistencia.
16. Conservar backup y procedimiento de rollback.

No se debe agregar `portfolio.db` temporalmente a Git.

## Una instancia y un worker

Restricciones operativas iniciales:

- una instancia de App Service;
- un worker Uvicorn;
- sin scale-out;
- sin autoscale horizontal;
- sin deployment slots escribiendo simultaneamente;
- sin dos apps compartiendo la misma DB;
- sin procesos de migracion paralelos;
- sin WAL;
- baja concurrencia de escritura;
- operaciones administrativas controladas;
- backup antes de escrituras remotas importantes.

SQLite sobre almacenamiento persistente compartido no esta libre de riesgo. El riesgo queda aceptado temporalmente para baja concurrencia y sera validado en staging.

## GitHub Actions futura

Plantilla inactiva:

```text
docs/deployment/azure-app-service.workflow.yml.example
```

La plantilla permanece fuera de `.github/workflows` y usa autenticacion futura con OIDC:

- `azure/login@v2`;
- `azure/webapps-deploy@v3`;
- `secrets.AZURE_CLIENT_ID`;
- `secrets.AZURE_TENANT_ID`;
- `secrets.AZURE_SUBSCRIPTION_ID`;
- `vars.AZURE_WEBAPP_NAME`;
- `package: backend`.

No despliega frontend, no incluye SQLite, no ejecuta migraciones y no ejecuta seeds.

## Validador

Comando:

```powershell
cd backend
.\venv\Scripts\python.exe -m app.scripts.validate_azure_app_service
```

El validador comprueba:

- `requirements.txt`;
- `app/main.py`;
- `startup.sh`;
- dependencias runtime principales;
- exclusion Git de DB, backups, `.env` y `venv`;
- plantilla App Service inactiva;
- settings futuros;
- ausencia de workflow activo.

## Pruebas

Se agregaron pruebas para:

- comando de startup;
- un worker;
- ausencia de reload, migraciones, seeds e instalaciones runtime;
- production con SQLite persistente existente fuera del codigo;
- rechazo de DB inexistente ya cubierto por pruebas 7.3;
- incorporacion segura de `WEBSITE_HOSTNAME`;
- `/health` sin exponer ruta;
- `/ready` sin exponer ruta;
- plantilla App Service inactiva;
- paquete sin DB ni artefactos locales rastreados.

## Integridad SQLite

Referencia de `portfolio.db`:

- tamano: 11026432 bytes;
- LastWriteTimeUtc: 2026-07-10T06:11:02.8025327Z;
- SHA-256: 43CD430783BE1BCD6305C0D96AE5D33DE2006CD5B05819AE13ED6AC8BB8B6470.

`portfolio.db` no se modifica durante esta fase.

## Riesgos pendientes

- Crear recurso Azure App Service real.
- Definir hostname real.
- Configurar `CORS_ALLOWED_ORIGINS` con el origen real de Static Web Apps.
- Transferir SQLite de forma separada y verificada.
- Probar persistencia tras reinicios.
- Validar concurrencia, bloqueo y comportamiento de baja escritura en staging.
- Definir rollback remoto.

## Tareas reservadas para 7.6

- Crear staging remoto en Azure.
- Configurar settings reales sin exponer secretos.
- Transferir DB con backup/hash.
- Probar `/health` y `/ready`.
- Validar endpoints publicos y admin en remoto.
- Probar reinicio y persistencia.

## Siguiente lote

Fase 7.6 - staging remoto en Azure.
