# PLAN-002 — Carrusel interactivo de skills y orden automático administrativo

## 1. Identificación del plan

- Número: `PLAN-002`
- Estado: En análisis
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

## 4. Prioridad principal

1. Carrusel interactivo de skills.
2. Orden automático administrativo.

## 5. Objetivo general

Mejorar la experiencia del portfolio con un carrusel público infinito, interactivo y responsive para skills, y con sugerencia automática del siguiente orden al crear registros administrativos.

## 6. Problema o necesidad

- La sección pública de skills hoy se comporta como una grilla estática.
- El panel administrativo expone el orden, pero el alta manual requiere más fricción de la necesaria.
- El proyecto ya tiene una base estable; conviene crecer con componentes pequeños y sin duplicar lógica.

## 7. Alcance

### 7.1 Carrusel interactivo de skills

- Respetar el orden de visualización actual del backend (`display_order` en el código real).
- Usar tres filas visuales sin agregar columnas ni campos nuevos.
- Movimiento infinito, autoplay, arrastre con mouse y swipe táctil.
- Pausa durante interacción y reanudación automática desde la posición actual.
- Responsive en móvil, tableta y escritorio.
- Accesibilidad y `prefers-reduced-motion`.
- Reutilización de componentes/utilidades solo si aporta valor real.

### 7.2 Orden automático administrativo

- Detectar entidades reales que ya usan `display_order`.
- Sugerir el siguiente valor cuando el usuario no lo modifique.
- Mantener el valor editable.
- El backend conserva la autoridad final.
- No reordenar registros existentes ni compactar al eliminar en esta primera mejora.

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
- No romper responsive, accesibilidad ni manejo seguro de iconos/imágenes.

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
- Evitar librerías nuevas si React, CSS y utilidades locales bastan.
- Mantener el carrusel como componente aislado y la lógica de orden como helper de backend con apoyo en frontend.

## 12. Tarea 1: carrusel interactivo de skills

- Analizar la implementación actual de `SkillsSection`.
- Diseñar la distribución de 3 filas con la secuencia global intacta.
- Decidir si la solución será propia o apoyada por una dependencia mínima ya justificada.
- Preparar soporte para autoplay, drag, swipe y pausa/reanudación.

## 13. Tarea 2: orden automático administrativo

- Localizar todas las entidades reales que usan `display_order`.
- Definir dónde se sugiere el siguiente orden.
- Mantener validación backend como autoridad final.
- Empezar por la entidad piloto más simple y reutilizable.

## 14. Fases de trabajo

1. Análisis técnico y selección de enfoque.
2. Implementación del carrusel de skills.
3. Implementación del orden automático en la entidad piloto.
4. Extensión al resto de entidades con `display_order`.
5. Pruebas, accesibilidad y documentación.

## 15. Pruebas previstas

- Lint y build frontend.
- Pytest backend.
- Revisión de integridad SQLite.
- Revisión responsive del carrusel.
- Revisión de altas administrativas con orden sugerido.

## 16. Riesgos

- Sobrecargar el carrusel con animaciones o dependencias innecesarias.
- Introducir una convención de orden distinta a la existente.
- Crear una sugerencia automática que no coincida con la convención real de datos.
- Mezclar lógica visual con persistencia.

## 17. Criterios de aceptación

- El carrusel es usable, infinito y responsive.
- La accesibilidad se mantiene.
- El orden sugerido coincide con la convención real.
- El backend sigue siendo la autoridad final.
- No se agregan campos ni migraciones.

## 18. Ideas futuras

1. Mejoras visuales de proyectos.
2. Mejoras visuales de otras secciones.
3. Gestión segura de imágenes.
4. Actualización de documentación de Azure.

## 19. Documentación relacionada

- `README.md`
- `CAMBIOS.md`
- `backend/docs/API_FRONTEND.md`
- `docs/CONTENIDO_PROFESIONAL_PORTAFOLIO.md`
- `docs/INVENTARIO_CONTENIDO_PORTFOLIO.md`
- `docs/HISTORIAL_CAMBIOS_DETALLADO.md`
- `docs/planes_historicos/PLAN-001-2026-07-12-consolidacion-y-despliegue-azure.md`

## 20. Estado inicial de Git y SQLite

- Git: árbol limpio al iniciar este plan.
- SQLite: intacta al iniciar este plan.

## 21. Resultados finales, inicialmente pendientes

- Implementación del carrusel.
- Implementación del orden automático.
- Pruebas y validaciones.
- Documentación final del plan.

## 22. Mensaje de commit final, inicialmente pendiente

Pendiente de definir al cerrar PLAN-002.
