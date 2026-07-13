# CAMBIOS.md

## Plan activo

- Plan: `PLAN-002`
- Estado: En progreso
- Changelog activo del plan vigente.

## Resumen del PLAN-001

- Se cerró el ciclo documental, técnico y editorial anterior.
- Se consolidó el contenido profesional definitivo y su QA.
- Se completó el despliegue inicial separado del frontend en Azure Static Web Apps y del backend en Azure App Service.
- SQLite quedó como motor vigente.
- El ciclo terminó con la corrección defensiva del ID en mensajes administrativos.

## Corrección breve registrada

- Validación defensiva del ID en mensajes administrativos.
- Commit real: `80d4847` (`[PLAN-001] Reforzar validación de ID en mensajes administrativos`).

## Avances del carrusel

- Carrusel público interactivo de skills implementado.
- Integración con Embla Carousel y Auto Scroll.
- Tres filas permanentes.
- Agrupación de tres skills por columna.
- Movimiento automático continuo.
- Drag con mouse y swipe táctil.
- Pausa manual y reanudación diferida.
- `prefers-reduced-motion`.
- Responsive fluido con `container queries` y `clamp()`.
- Mejora de legibilidad en móvil y tableta.
- `npm --prefix .\frontend run lint` aprobado.
- `npm --prefix .\frontend run build` aprobado.
- `git diff --check` aprobado.
- QA visual aprobada por el usuario.

## Vista previa PDF responsive

- Se conservó el iframe para escritorio.
- Se agregó fallback para teléfonos y tabletas.
- El fallback muestra título, explicación, Abrir PDF y Descargar PDF.
- Abrir utiliza la URL fuente directa cuando está disponible.
- Se eliminó el visor roto y el UUID visible.
- Se corrigió la altura excesiva del modal móvil.
- No se instalaron dependencias.
- No se modificó backend, SQLite ni contratos API.
- Lint, build y git diff --check aprobados.
- QA funcional aprobada por el usuario.

## Prioridad activa

- El orden automático administrativo y la navegación al formulario de edición pasan a ser la prioridad activa del PLAN-002.

## Avances del orden automático

- Pendiente de análisis técnico.
- Se documentó la navegación al formulario visible al pulsar `Editar`.

## Pruebas y verificaciones

- Lint, build y diff check aprobados para el carrusel y la vista previa PDF responsive.
- QA visual aprobada por el usuario para el carrusel.
- QA funcional aprobada por el usuario para la vista previa PDF responsive.
- Pendiente la validación final del flujo de edición con desplazamiento al formulario.

## Riesgos pendientes

- Mantener un solo plan activo.
- Evitar duplicar historial en raíz.
- Conservar enlaces válidos entre documentos activos e históricos.

## Referencias históricas

- [PLAN-001 histórico](docs/planes_historicos/PLAN-001-2026-07-12-consolidacion-y-despliegue-azure.md)
- [CAMBIOS-PLAN-001 histórico](docs/planes_historicos/CAMBIOS-PLAN-001-2026-07-12.md)
- [Anexo editorial histórico](docs/planes_historicos/ANEXO-PLAN-001-2026-07-12-actualizacion-contenido-profesional.md)
