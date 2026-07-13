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

## 4. Prioridades

- Completado: carrusel interactivo de skills.
- Completado: vista previa PDF responsive.
- Prioridad activa: orden automático administrativo y navegación al formulario de edición.

## 5. Objetivo general

Mejorar la experiencia del portfolio con un carrusel público infinito, interactivo y responsive para skills, luego corregir la vista previa incrustada de PDF en teléfonos y tabletas, y después sugerir automáticamente el siguiente orden al crear registros administrativos.

## 6. Problema o necesidad

- La sección pública de skills ya quedó implementada y aprobada visualmente.
- La incompatibilidad de la vista previa PDF en dispositivos móviles fue resuelta mediante un fallback responsive, conservando las acciones de abrir y descargar.
- El panel administrativo expone el orden, pero el alta manual requiere más fricción de la necesaria.
- El proyecto ya tiene una base estable; conviene crecer con componentes pequeños y sin duplicar lógica.

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

### 7.2 Orden automático administrativo

- Detectar entidades reales que ya usan `display_order`.
- Sugerir el siguiente valor cuando el usuario no lo modifique.
- Mantener el valor editable.
- El backend conserva la autoridad final.
- No reordenar registros existentes ni compactar al eliminar en esta primera mejora.
- Al pulsar `Editar`, desplazar el formulario visible y enfocar el primer campo útil.

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

## 14. Tarea 3: orden automático administrativo

- Localizar todas las entidades reales que usan `display_order`.
- Definir dónde se sugiere el siguiente orden.
- Mantener validación backend como autoridad final.
- Empezar por una entidad piloto y extender el patrón de forma proporcional.
- No reordenar registros existentes ni compactar al eliminar.
- Documentar la navegación al formulario de edición al pulsar `Editar`.

## 15. Fases de trabajo

1. Carrusel de skills — implementado y validado.
2. Vista previa PDF responsive — implementada y validada.
3. Orden automático administrativo y navegación al formulario de edición — prioridad activa.
4. Pruebas finales y cierre documental.

## 16. Pruebas previstas

- Lint y build frontend.
- Pytest backend.
- Revisión de integridad SQLite.
- Revisión responsive del carrusel.
- Revisión responsive del visor PDF.
- Revisión de altas administrativas con orden sugerido.
- Revisión de navegación al formulario al pulsar `Editar`.

## 17. Riesgos

- Sobrecargar el visor o el carrusel con animaciones o dependencias innecesarias.
- Introducir una convención de orden distinta a la existente.
- Crear una sugerencia automática que no coincida con la convención real de datos.
- Mezclar lógica visual con persistencia.

## 18. Criterios de aceptación

- El carrusel es usable, infinito y responsive.
- La vista previa PDF es clara en teléfono y tableta.
- La accesibilidad se mantiene.
- El orden sugerido coincide con la convención real.
- El backend sigue siendo la autoridad final.
- No se agregan campos ni migraciones.

## 19. Ideas futuras

1. Mejoras visuales de proyectos.
2. Mejoras visuales de otras secciones.
3. Gestión segura de imágenes.
4. Actualización de documentación de Azure.

## 20. Documentación relacionada

- `README.md`
- `CAMBIOS.md`
- `backend/docs/API_FRONTEND.md`
- `docs/CONTENIDO_PROFESIONAL_PORTAFOLIO.md`
- `docs/INVENTARIO_CONTENIDO_PORTFOLIO.md`
- `docs/HISTORIAL_CAMBIOS_DETALLADO.md`
- `docs/planes_historicos/PLAN-001-2026-07-12-consolidacion-y-despliegue-azure.md`

## 21. Estado inicial de Git y SQLite

- Git: árbol limpio al iniciar este plan.
- SQLite: intacta al iniciar este plan.

## 22. Resultados finales, inicialmente pendientes

- Implementación del orden automático administrativo.
- Pruebas y validaciones.
- Validaciones de SQLite.
- Documentación final del PLAN-002.

## 23. Mensaje de commit final, inicialmente pendiente

Pendiente de definir al cerrar PLAN-002.
