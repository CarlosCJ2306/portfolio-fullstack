# PLAN-002 — Carrusel de skills, vista previa PDF responsive y orden automático administrativo

## 1. Identificación del plan

- Número: `PLAN-002`
- Estado: En progreso
- Fecha: 2026-07-12
- Rama activa: `dev-cj`

## 2. Estado real del proyecto

- Frontend y backend se mantienen separados.
- El frontend está desplegado en Azure Static Web Apps.
- El backend está desplegado en Azure App Service.
- El despliegue del backend continúa siendo manual.
- SQLite continúa siendo el motor vigente.
- El ciclo anterior quedó archivado como `PLAN-001`.
- El árbol parte limpio para este nuevo ciclo.

## 3. Último plan cerrado

- `PLAN-001 — Consolidación y despliegue Azure`
- Archivo histórico: `docs/planes_historicos/PLAN-001-2026-07-12-consolidacion-y-despliegue-azure.md`
- Changelog histórico: `docs/planes_historicos/CAMBIOS-PLAN-001-2026-07-12.md`

## 4. Estado de las prioridades

- Completado: carrusel interactivo de skills.
- Completado: vista previa PDF responsive.
- Completado: orden automático administrativo.
- Completado: navegación al formulario al editar.
- Pendiente: revisión final, commit del lote y cierre documental del PLAN-002.

## 5. Objetivo general

Mejorar la experiencia del portfolio con un carrusel público infinito, interactivo y responsive para skills, luego corregir la vista previa incrustada de PDF en teléfonos y tabletas, y después sugerir automáticamente el siguiente orden al crear registros administrativos.

## 6. Problema o necesidad

- La grilla de skills fue reemplazada por un carrusel responsive e interactivo.
- La incompatibilidad del visor PDF móvil fue resuelta mediante un fallback responsive.
- La fricción de ingresar manualmente el orden fue resuelta con sugerencia frontend y autoridad backend.
- La edición administrativa ahora lleva directamente al formulario correspondiente y enfoca el primer campo útil.

## 7. Alcance

### 7.0 Carrusel interactivo de skills

- Implementado con Embla Carousel y Auto Scroll.
- Agrupación de hasta tres skills por columna.
- Tres filas permanentes.
- Movimiento infinito.
- Drag con mouse y swipe táctil.
- Pausa manual y durante la interacción.
- Reanudación diferida.
- `prefers-reduced-motion`.
- Diseño responsive fluido con `container queries` y `clamp()`.
- Mejoras de legibilidad en móvil y tableta.
- Orden defensivo mediante `display_order`.
- Archivos involucrados:
  - `frontend/package.json`
  - `frontend/package-lock.json`
  - `frontend/src/components/sections/SkillsSection.jsx`
  - `frontend/src/components/sections/SkillsSection.css`
  - `frontend/src/components/sections/skills/SkillsCarousel.jsx`
  - `frontend/src/components/sections/skills/SkillCard.jsx`
- Verificaciones aprobadas:
  - `npm --prefix .\frontend run lint`
  - `npm --prefix .\frontend run build`
  - `git diff --check`
  - QA visual en escritorio
  - QA visual en tableta
  - QA visual en teléfono

### 7.1 Vista previa PDF responsive — implementada

- Implementada con iframe conservado en escritorio y fallback responsive en teléfonos y tabletas.
- Detección mediante media query y capacidades del dispositivo.
- Apertura mediante URL fuente directa.
- Descarga conservada.
- Título legible.
- Eliminación del UUID visible.
- Modal compacto sin reservar la altura del iframe.
- Fallback ante error de vista previa.
- Sin dependencias nuevas.
- Sin cambios backend.
- Sin cambios en SQLite.
- Archivos involucrados:
  - `frontend/src/components/sections/CertificationsSection.jsx`
  - `frontend/src/components/sections/CertificationsSection.css`
- Verificaciones aprobadas:
  - `npm --prefix .\frontend run lint`
  - `npm --prefix .\frontend run build`
  - `git diff --check`
  - QA funcional en teléfono
  - Abrir PDF
  - Descargar PDF
  - modal compacto
  - visor incrustado conservado en escritorio

### 7.2 Orden automático administrativo — implementado

- Aplicado a `social_links`, `skills`, `projects`, `experiences`, `education` y `certifications`.
- En creación, el campo `display_order` comienza vacío.
- El frontend muestra una sugerencia calculada desde el máximo administrativo actual.
- Si el campo queda vacío, el frontend omite `display_order` del payload.
- El backend calcula `MAX(display_order) + 1`.
- En una tabla vacía, el primer orden automático es `0`.
- Un valor manual explícito se respeta.
- El valor manual `0` se respeta.
- Los registros activos e inactivos participan en el cálculo.
- Los huecos no se rellenan.
- Eliminar no compacta los órdenes.
- Activar o desactivar no altera el orden.
- Editar no aplica autoorden y conserva el valor existente.
- `experience_bullets` y `project_images` quedaron fuera porque no tienen un flujo administrativo independiente con `display_order` editable.
- No se agregaron columnas ni migraciones.
- SQLite permaneció intacta.

## 8. Fuera de alcance

- Migraciones de esquema.
- Nuevas columnas.
- Cambios de seguridad, Azure o despliegue.
- PostgreSQL.
- Cambios de contenido profesional.
- Cambios de contratos API no necesarios.

## 9. Restricciones permanentes

- No modificar SQLite real.
- No ejecutar scripts destructivos.
- No instalar dependencias sin justificación.
- No crear capas o abstracciones prematuras.
- No romper responsive, accesibilidad ni manejo seguro de iconos e imágenes.

## 10. Principios de arquitectura escalable

### Frontend

- Componentes pequeños y reutilizables.
- Una responsabilidad principal por componente.
- Separar presentación, estado, interacción y servicios cuando aporte claridad.
- Evitar componentes monolíticos.
- Mantener componentes específicos cerca de su módulo.
- Extraer elementos compartidos solo cuando exista reutilización real.
- Diseñar con responsive y accesibilidad desde el inicio.

### Backend

- Routers delgados.
- Lógica reutilizable en servicios o repositorios cuando exista necesidad real.
- Validaciones consistentes entre schemas y negocio.
- No duplicar consultas o reglas.
- Mantener SQLite y contratos compatibles salvo autorización expresa.

### Documentación

- Un solo plan activo.
- Un solo changelog activo.
- Históricos separados y numerados.
- Documentación técnica solo cuando tenga utilidad permanente.
- No repetir el mismo estado en varios archivos.

## 11. Estrategia de componentes reutilizables

- Compartir únicamente lo que ya tenga uso real.
- Evitar dependencias nuevas sin justificación; usar librerías mantenidas cuando reduzcan complejidad y riesgo, como Embla Carousel en el carrusel de skills.
- Mantener el carrusel como componente aislado y la lógica de orden como helper de backend con apoyo en frontend.

## 12. Tarea 1: carrusel interactivo de skills — implementada

- Embla Carousel y Auto Scroll.
- Agrupación de hasta tres skills por columna.
- Orden mediante `display_order`.
- Tres filas.
- Loop y movimiento automático.
- Drag y swipe.
- Pausa manual y durante drag/swipe.
- Reanudación diferida.
- `prefers-reduced-motion`.
- `container queries` y `clamp()`.
- Mejoras de legibilidad.
- `lint`, `build` y `git diff --check` aprobados.
- QA visual aprobada por el usuario.

## 13. Tarea 2: vista previa PDF responsive — implementada

- Se conservó el iframe para la vista previa en escritorio.
- Se agregó un fallback responsive para teléfonos y tabletas.
- La detección se realiza mediante media query y capacidades del dispositivo.
- La apertura utiliza la URL fuente directa cuando está disponible.
- La descarga conserva un nombre de archivo legible.
- Se eliminó el visor roto y el UUID visible.
- Se corrigió la altura excesiva del modal móvil.
- Se añadió fallback ante errores de vista previa.
- No se instalaron dependencias nuevas.
- No se modificaron backend, contratos API ni SQLite.
- Lint, build y git diff --check fueron aprobados.
- La QA funcional fue aprobada por el usuario.

## 14. Tarea 3: orden automático administrativo — implementada

- Se hizo opcional `display_order` en los schemas de creación de las seis entidades principales.
- Se agregó un helper reutilizable para calcular el siguiente orden.
- Los servicios de creación calculan el orden únicamente cuando el campo llega omitido o como `None`.
- El frontend diferencia correctamente entre campo vacío y `0` explícito.
- Se agregaron sugerencias editables en los seis paneles.
- Se añadieron pruebas contractuales parametrizadas.
- No se modificaron los schemas de actualización para aplicar autoorden.
- No se compactan órdenes ni se rellenan huecos.

## 15. Tarea 4: navegación al formulario de edición — implementada

- Se centralizó el flujo de scroll y foco en `AdminPage.jsx`.
- Se conectaron referencias de formulario y primer campo útil en los seis paneles.
- Se utilizó `scrollIntoView`.
- Se respeta `prefers-reduced-motion`.
- Se agregó el ajuste CSS necesario en `AdminLayout.css`.
- La QA manual fue aprobada por el usuario en escritorio y móvil.

## 16. Fases de trabajo

1. Carrusel de skills — implementado y validado.
2. Vista previa PDF responsive — implementada y validada.
3. Orden automático administrativo — implementado y validado.
4. Navegación al formulario de edición — implementada y validada.
5. Revisión final, commit y cierre documental — pendiente.

## 17. Pruebas y validaciones ejecutadas

- Backend: `100 passed, 1 warning`.
- Warning conocido de Starlette/httpx.
- Frontend lint aprobado.
- Frontend build aprobado.
- `git diff --check` aprobado.
- `check_db` aprobado:
  - `foreign_keys=1`
  - `integrity_check=ok`
  - `foreign_key_violations=0`
- SQLite mantuvo:
  - tamaño: `15179776` bytes
  - SHA-256: `DDEB44C6878390B32E5AC6406735CFE882BDE6251471A11274E63E756B556D69`
- QA manual del orden automático aprobada.
- QA manual del scroll al formulario aprobada.
- QA manual del foco aprobada.
- QA móvil aprobada.

## 18. Riesgos

- Sobrecargar el visor o el carrusel con animaciones o dependencias innecesarias.
- Introducir una convención de orden distinta a la existente.
- Crear una sugerencia automática que no coincida con la convención real de datos.
- Mezclar lógica visual con persistencia.

## 19. Criterios de aceptación

- El carrusel es usable, infinito y responsive.
- La vista previa PDF es clara en teléfono y tableta.
- El orden automático es correcto y editable.
- La navegación al formulario funciona.
- El backend sigue siendo la autoridad final.
- La accesibilidad se mantiene.
- No se agregan campos ni migraciones.
- SQLite intacta.

## 20. Ideas futuras

1. Mejoras visuales de proyectos.
2. Mejoras visuales de otras secciones.
3. Gestión segura de imágenes.
4. Actualización de documentación de Azure.

## 21. Documentación relacionada

- `README.md`
- `CAMBIOS.md`
- `backend/docs/API_FRONTEND.md`
- `docs/CONTENIDO_PROFESIONAL_PORTAFOLIO.md`
- `docs/INVENTARIO_CONTENIDO_PORTFOLIO.md`
- `docs/HISTORIAL_CAMBIOS_DETALLADO.md`
- `docs/planes_historicos/PLAN-001-2026-07-12-consolidacion-y-despliegue-azure.md`

## 22. Estado inicial de Git y SQLite

- Git: árbol limpio al iniciar este plan.
- SQLite: intacta al iniciar este plan.

## 23. Resultados pendientes para cerrar PLAN-002

- Revisar el diff final completo.
- Realizar el commit del lote.
- Verificar el historial de `dev-cj`.
- Actualizar el estado del PLAN-002 a cerrado en una tarea documental posterior.
- Decidir posteriormente push, merge y despliegue.

## 24. Mensaje de commit final, inicialmente pendiente

Pendiente de definir al cerrar PLAN-002.
