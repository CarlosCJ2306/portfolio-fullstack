# Auditoría del frontend público

Fecha: 2026-07-05  
Alcance: interfaz pública React, consumo de API, renderizado dinámico, estados, galería, PDF, CSS responsivo, accesibilidad y textos.  
Método: revisión estática de JSX, servicios y CSS. No se modificó código ni se ejecutó build.

## 1. Resumen ejecutivo

El frontend público está funcionalmente completo para el MVP. Implementa perfil, redes sociales, habilidades, proyectos, experiencia, educación, certificaciones, contacto, encabezado y pie de página. Consume datos reales de FastAPI y no depende de colecciones mock para las secciones principales.

Los flujos más importantes existen:

- carga global y error de conexión;
- estados vacíos por sección;
- listado completo de proyectos;
- portada y galería adicional en modal;
- zoom, miniaturas y navegación de imágenes;
- PDF de certificación mediante Blob URL e `iframe` modal;
- formulario de contacto con validación y estados de envío.

Los problemas principales no son ausencia de secciones, sino:

- SVG del backend insertado como HTML sin sanitización;
- textos visibles con codificación dañada;
- carga pública completamente bloqueada si falla una de dos peticiones;
- padding global duplicado que reduce demasiado el espacio útil, especialmente en móvil;
- fallbacks personales que pueden mostrar información falsa cuando falta el perfil;
- modales sin gestión completa de foco ni bloqueo de scroll;
- navegación móvil del header demasiado extensa.

## 2. Entrada y composición pública

| Archivo | Función |
|---|---|
| `frontend/index.html` | Documento base, favicon y montaje de Vite. |
| `frontend/src/main.jsx` | Monta React con `StrictMode`. |
| `frontend/src/App.jsx` | Muestra `HomePage` salvo que la ruta comience por `/admin`. |
| `frontend/src/pages/HomePage.jsx` | Carga datos y compone todas las secciones públicas. |
| `frontend/src/services/publicApi.js` | Centraliza `fetch` y manejo básico de errores HTTP. |
| `frontend/src/styles/global.css` | Reset, contenedor, página, tipografía y clases compartidas. |

No se usa React Router. Para la página pública esto no genera una incompatibilidad actual: cualquier ruta distinta de `/admin` termina mostrando `HomePage`.

## 3. Secciones públicas implementadas

| Sección | Componente | Datos principales | Estado |
|---|---|---|---|
| Header | `Header.jsx` | Logo estático y navegación por anclas | Implementado. |
| Hero/perfil | `HeroSection.jsx` | Perfil, avatar y redes | Implementado con fallbacks hardcodeados. |
| Skills | `SkillsSection.jsx` | Nombre, categoría, nivel e icono | Implementado. |
| Proyectos | `ProjectsSection.jsx` | Portada, descripción, skills, enlaces y galería | Implementado. |
| Experiencia | `ExperienceSection.jsx` | Cargo, empresa, fechas, ubicación, descripción y bullets | Implementado con uso parcial de campos. |
| Educación | `EducationSection.jsx` | Institución, grado, área, años y descripción | Implementado. |
| Certificaciones | `CertificationsSection.jsx` | Certificación, emisor, fecha, URL y PDF | Implementado. |
| Contacto | `ContactSection.jsx` | Perfil y formulario conectado al backend | Implementado. |
| Footer | `Footer.jsx` | Año dinámico y nombre estático | Implementado. |

No se encontró una sección pública independiente de “Sobre mí”; el resumen del perfil forma parte del Hero.

## 4. Consumo real de APIs

### Endpoints invocados en la interfaz actual

| Función | Endpoint | Consumidor | Uso real |
|---|---|---|---|
| `getHomeData()` | GET `/api/public/home` | `HomePage.jsx` | Perfil, redes, skills, experiencia, educación, certificaciones y destacados. |
| `getProjects()` | GET `/api/public/projects` | `HomePage.jsx` | Sustituye los destacados por todos los proyectos activos. |
| `sendContactMessage()` | POST `/api/public/contact` | `ContactSection.jsx` | Envía el formulario de contacto. |

`publicApi.js` también exporta funciones individuales para perfil, redes, skills, destacados, experiencia, educación y certificaciones, pero ningún componente público las llama actualmente.

### Flujo de carga

`HomePage.jsx` ejecuta:

```js
Promise.all([getHomeData(), getProjects()])
```

Luego agrega la lista completa como `homeData.projects`. El contrato coincide con FastAPI, pero el acoplamiento es frágil: si una petición falla, se descarta también la respuesta válida de la otra y toda la página pasa al estado de error.

### Configuración HTTP

- La URL procede de `VITE_API_BASE_URL`.
- Si la variable falta, se muestra un error.
- Se intenta interpretar errores JSON o texto.
- No hay timeout, cancelación, retry ni caché.
- Se envía `Content-Type: application/json` incluso en GET. Esto puede provocar preflight CORS innecesario en llamadas de solo lectura.
- En desarrollo, `StrictMode` puede repetir el efecto de carga y las peticiones para detectar efectos secundarios; no hay `AbortController`.

## 5. Renderizado dinámico

### Datos correctamente dinámicos

- Perfil: nombre, título, resumen, ubicación y avatar.
- Redes sociales: plataforma y URL.
- Skills: nombre, categoría, nivel e icono.
- Proyectos: título, descripciones, destacado, portada, skills, enlaces y galería.
- Experiencia: cargo, empresa, fechas, ciudad, descripción y bullets.
- Educación: institución, grado, área, años y descripción.
- Certificaciones: nombre, emisor, fecha, descripción, URL y PDF.
- Contacto: correo, ubicación y CV del perfil.
- Año del footer.

### Datos recibidos pero ignorados o parcialmente usados

| Dato | Situación |
|---|---|
| `skill.color` | El backend lo entrega, pero la tarjeta no lo aplica. |
| `social_link.icon_name` | El Hero muestra texto de plataforma; no usa el icono. |
| `experience.country` | Solo se consulta `location` —que el backend no entrega— o `city`; el país no se muestra. |
| `experience.is_current` | No controla el texto “Actualidad”. Si falta `end_date`, se muestra “Actualidad” aunque el registro no esté marcado como actual. |
| `profile.phone` | Se recibe, pero no aparece en la página pública. |
| `project.slug` | Se recibe, pero no se usa para enlaces o rutas. |
| `education.status` | El componente lo contempla, pero el backend actual no entrega ese campo. Es una tolerancia opcional, no un error contractual. |

### Fallbacks y contenido hardcodeado

| Contenido | Evaluación |
|---|---|
| Nombre, título, resumen y “Colombia” en `HeroSection` | Fallbacks personales. Pueden ocultar que el perfil no existe y mostrar datos no provenientes del backend. |
| `correo@example.com` en contacto | Placeholder visible potencialmente falso; no debería mostrarse como correo real. |
| Nombre del propietario en `Footer` | Hardcodeado; puede quedar desalineado si el perfil cambia. |
| “FastAPI + React” y tarjetas técnicas del Hero | Contenido editorial estático razonable, aunque no proviene del backend. |
| Icono fijo de certificación | Placeholder visual fijo; no existe soporte de icono en el contrato actual. |
| Inicial de una skill sin icono | Fallback visual válido. |
| Textos descriptivos de cada sección | Contenido editorial normal, no se considera mock de datos. |

## 6. Estados de carga, error y vacío

| Estado | Implementación | Evaluación |
|---|---|---|
| Carga global | Header, texto “Cargando portafolio...” y Footer | Existe; es simple y no reserva la geometría final. |
| Error global | Mensaje de conexión | Existe, pero no ofrece “Reintentar” ni recuperación parcial. |
| Perfil vacío | Fallbacks personales | No hay estado vacío explícito; puede mostrar información ficticia. |
| Redes vacías | Bloque oculto | Correcto. |
| Skills vacías | Mensaje propio | Correcto. |
| Proyectos vacíos | Mensaje propio | Correcto, con faltas ortográficas. |
| Experiencia vacía | Mensaje propio | Correcto. |
| Educación vacía | Mensaje propio | Correcto, con texto dañado. |
| Certificaciones vacías | Mensaje propio | Correcto. |
| Contacto enviando | Inputs deshabilitados y botón “Enviando...” | Correcto. |
| Contacto exitoso | Mensaje del backend y formulario limpio | Correcto. |
| Contacto fallido | Mensaje genérico | Existe, pero descarta el detalle real y culpa siempre al backend. |
| PDF inválido | No abre | No existe feedback al usuario si falla `atob` o la creación del Blob. |
| Imagen inválida | Se omite | El modal puede mostrar “Sin imagen disponible”; comportamiento tolerante. |

## 7. Galería pública de proyectos

### Comportamiento confirmado

- El card usa `project.image` como portada.
- La portada del card usa un marco fijo de 180 px y `object-fit: cover`.
- El modal combina portada y `gallery_images` en el orden recibido.
- Se evita repetir un asset si aparece como portada y en galería.
- Soporta proyectos sin imagen, solo portada, solo galería o varias imágenes.
- El visor tiene altura controlada con `clamp()`.
- La imagen principal usa `width: 100%`, `height: 100%` y `object-fit: contain`.
- Las imágenes no expanden el modal.
- Hay miniaturas, anterior, siguiente, zoom y ajustar.
- Cierra con botón, Escape y clic en el fondo.
- La descripción, skills y enlaces están debajo del visor.

### Problemas detectados

1. `getAssetSrc` solo acepta `data_base64`; una imagen SVG almacenada en `svg_content` se descarta aunque el backend la entregue.
2. El modo zoom usa `transform: scale(1.8)` dentro de un área con scroll. No aumenta el modal, pero el desplazamiento/paneo puede resultar poco intuitivo.
3. En móvil, los botones anterior/siguiente pasan de posición absoluta a elementos normales dentro de un grid de altura fija. Esto puede restar altura al área de imagen.
4. El modal no bloquea el scroll del documento de fondo.
5. No mueve el foco al abrir, no lo contiene dentro del diálogo y no lo devuelve al botón al cerrar.
6. No ofrece navegación por flechas izquierda/derecha.
7. La miniatura activa solo se comunica visualmente; falta `aria-current` o `aria-pressed`.
8. Clic sobre la imagen activa zoom, pero la imagen no es control accesible por teclado. Existe un botón de Zoom separado, lo que evita bloquear la función por completo.

## 8. PDF de certificaciones

### Soporte existente

- Comprueba `mime_type === "application/pdf"` y `data_base64`.
- Admite base64 puro o data URL.
- Convierte base64 a bytes y luego a `Blob`.
- Crea una URL temporal con `URL.createObjectURL`.
- Renderiza un `iframe` dentro de un modal.
- Cierra con botón, Escape y clic en el fondo.
- Mantiene `credential_url` como enlace externo separado.
- Revoca la Blob URL al cerrar/cambiar/desmontar.

### Problemas detectados

- No hay enlace alternativo “Abrir en pestaña” o “Descargar” si el navegador móvil no previsualiza PDF en `iframe`.
- Si la conversión base64 falla, la acción no muestra mensaje.
- El modal tampoco gestiona foco ni bloqueo del scroll de fondo.
- La URL puede revocarse dos veces durante el cierre por la combinación del callback y el cleanup; normalmente es inocuo, pero la responsabilidad está duplicada.
- El PDF completo ya llegó en `/home`, aumentando memoria y tiempo inicial aunque el visitante nunca lo abra.
- La fecha se muestra en formato ISO sin presentación localizada.

## 9. Responsividad y revisión visual estática

### Cobertura de breakpoints

| Área | Escritorio | Tablet | Móvil |
|---|---|---|---|
| Hero | 2 columnas | 1 columna bajo 900 px | Hereda una columna; no tiene ajuste específico bajo 600 px. |
| Skills | 4 columnas | 3 y luego 2 | 1 columna bajo 520 px. |
| Proyectos | 2 columnas | 1 columna bajo 900 px | Visor y miniaturas ajustados bajo 600 px. |
| Experiencia | Timeline | Conserva timeline | Tarjeta simple bajo 760 px. |
| Educación | 2 columnas | 1 columna bajo 900 px | Tarjeta vertical bajo 600 px. |
| Certificaciones | 3 columnas | 2 bajo 1024 px | 1 bajo 640 px. |
| Contacto | 2 columnas | 1 bajo 900 px | Formulario con menor padding bajo 600 px. |
| Header | Fila | Cambia bajo 768 px | Columna con enlaces envueltos. |

La estructura tiene breakpoints razonables para las tres familias de viewport, pero no se realizó una prueba visual en navegador durante esta auditoría.

### Problemas de layout y espaciado

1. `HomePage` envuelve todas las secciones en `<main className="page">`, y `.page` añade `padding: 48px 20px`. Cada sección añade además entre 72 y 104 px verticales y 20 px horizontales. Consecuencias:
   - doble padding horizontal;
   - solo unos 240 px útiles en un móvil de 320 px;
   - fondos de sección que no llegan a los bordes del viewport;
   - Hero más alto que el viewport por sumar el `min-height` y el padding de `.page`.
2. El header no tiene padding horizontal propio. En móvil, `.navbar` usa `padding: 18px 0`, dejando logo y enlaces pegados a los bordes.
3. Ocho enlaces visibles en un header sticky forman varias filas en móvil y pueden ocupar una parte considerable de la pantalla.
4. Las anclas no tienen `scroll-margin-top`; el header sticky puede cubrir el título de la sección destino.
5. Cards con y sin portada no reservan la misma zona visual, lo que puede producir ritmos distintos entre filas.
6. No hay reglas generales `overflow-wrap` para títulos o datos excepcionalmente largos.
7. No hay bloqueo global de overflow mientras un modal está abierto.

### Aspectos visuales correctos

- Escala tipográfica con `clamp()` en títulos.
- Contraste consistente sobre fondos oscuros.
- Cards con radios, bordes, sombras y espaciado coherentes.
- Grids reducen columnas de forma progresiva.
- Visor de proyectos controla tamaño y preserva relación de aspecto.
- Formularios ocupan el ancho disponible y tienen estados focus visibles.

## 10. Textos, labels y mensajes

### Codificación dañada confirmada

Hay cadenas visibles con mojibake confirmado en:

- `HomePage.jsx`: “información”, “Aquí” y “conexión” dentro de los estados de carga/error.
- `EducationSection.jsx`: acentos, icono de graduación y separador de fechas.
- `ProjectsSection.jsx`: el separador entre etiqueta y contador del carrusel aparece como `Â·`.

Se verificó por separado que los emoji y acentos visibles de Hero, experiencia, certificaciones, contacto y Footer sí están guardados correctamente como Unicode. Algunos comentarios de otros archivos todavía pueden verse dañados, pero no afectan la interfaz renderizada.

El problema está en los literales del frontend, no en el renderizado de React. Debe corregirse guardando los archivos realmente como UTF-8 y evitando conversiones repetidas.

### Ortografía y consistencia

- “Aun” debería ser “Aún”.
- “practico” debería ser “práctico”.
- “construccion” debería ser “construcción”.
- “Galeria” debería ser “Galería”.
- “descripcion” debería ser “descripción”.
- La sección dice “Proyectos destacados”, pero muestra todos los proyectos activos.
- La interfaz mezcla “Skills”, “Portfolio”, “Backend”, “Frontend” y “Full Stack” con labels en español. No es un fallo funcional, pero conviene definir una guía consistente.
- El botón “X” del modal tiene buen `aria-label`, aunque visualmente “Cerrar” sería más claro y consistente con el modal PDF.
- El error de contacto siempre dice “Verifica que el backend esté funcionando”, incluso si el error es validación, red, CORS o servidor.

## 11. Accesibilidad y experiencia de teclado

- `index.html` declara `lang="en"` aunque la página está en español.
- Los modales tienen `role="dialog"`, `aria-modal` y nombres accesibles.
- Escape y botones de cierre funcionan.
- Falta administración de foco en ambos modales.
- Falta un focus trap para impedir tabular hacia el contenido de fondo.
- No se restaura el foco al control que abrió el modal.
- No hay `:focus-visible` consistente en enlaces y botones; el formulario sí estiliza focus.
- No se anuncia dinámicamente carga, error, éxito del formulario o cambio de imagen con `aria-live`.
- El estado de miniatura activa no se expone a tecnologías asistivas.
- No se respeta `prefers-reduced-motion` para transiciones y desplazamiento suave.
- El SVG de skills se inserta con `dangerouslySetInnerHTML` sin sanitización frontend.

## 12. Problemas por prioridad

### Crítico

1. **Posible XSS almacenado mediante SVG.** `SkillsSection.jsx` inserta `skill.icon.svg_content` con `dangerouslySetInnerHTML`. El contenido procede del backend y no se sanitiza en ninguna de las dos capas. Un SVG con atributos/eventos maliciosos podría ejecutar código en la página pública. Recomendación: sanitizar en backend y/o frontend con una política estricta, o servir SVG como archivo/imagen sin inyectarlo como markup.

### Alto

1. **Mojibake visible en múltiples secciones.** Recomendación: corregir literales y confirmar codificación UTF-8 archivo por archivo; revisar también textos ya almacenados en SQLite.
2. **Carga all-or-nothing con `Promise.all`.** Recomendación: manejar `/home` y `/projects` de forma independiente o usar `Promise.allSettled`, conservando las secciones disponibles.
3. **Padding global duplicado.** Recomendación: reservar `.page` sin padding para la portada normal y aplicar una clase específica a carga/error, o retirar el padding exterior de las secciones.
4. **Información ficticia si falta perfil.** `correo@example.com` y datos personales hardcodeados pueden mostrarse como reales. Recomendación: ocultar el dato ausente o mostrar un estado explícito, sin inventar contacto.
5. **Payload inicial pesado.** `/home` y `/projects` descargan recursos base64, y `/home` incluye PDF aunque no se abra. Recomendación: medir peso real y, en una fase coordinada con backend, entregar URLs de assets o carga diferida.

### Medio

1. El header móvil muestra todos los enlaces en varias filas y carece de padding horizontal.
2. Los modales no gestionan foco, scroll de fondo ni retorno al disparador.
3. El PDF no ofrece fallback de apertura/descarga ni mensaje si el Blob falla.
4. Una imagen SVG de proyecto no se renderiza porque `getAssetSrc` ignora `svg_content`.
5. “Actualidad” puede mostrarse incorrectamente al ignorar `is_current`.
6. Experiencia ignora `country`; skills ignoran `color`; redes ignoran `icon_name`.
7. Las fechas de experiencia y certificación se muestran sin formato localizado.
8. El error global no permite reintentar y no hay recuperación parcial.
9. `Content-Type: application/json` en GET puede producir preflight CORS innecesario.
10. `lang="en"` no coincide con el contenido en español.
11. El header sticky puede cubrir destinos de anclas.
12. El zoom móvil y los controles dentro del grid fijo necesitan prueba visual específica.

### Bajo

1. El título HTML sigue siendo `frontend` y no el nombre del portfolio.
2. El footer contiene el nombre hardcodeado en vez de reutilizar el perfil.
3. “Proyectos destacados” contradice que se muestran todos los proyectos.
4. Mezcla de labels en inglés y español.
5. Icono fijo de certificación sin correspondencia con datos.
6. Falta `aria-live` en mensajes y estado del carrusel.
7. Falta soporte para `prefers-reduced-motion`.
8. No hay estilos `focus-visible` uniformes para controles no pertenecientes al formulario.
9. Faltan metadatos básicos de descripción/SEO en `index.html`.

## 13. Recomendaciones concretas, sin implementar

### Primera prioridad: seguridad y texto

1. Eliminar la inyección directa de SVG no confiable o sanitizarla estrictamente.
2. Normalizar los literales dañados a UTF-8 y verificar visualmente cada sección.
3. Retirar fallbacks falsos de correo y datos personales.

### Segunda prioridad: resiliencia de datos

1. Separar el estado de `/home` del estado de `/projects`.
2. Añadir acción de reintento y mensajes de error contextualizados.
3. Usar `is_current`, `country` y formatos de fecha coherentes.
4. Mostrar un error específico cuando el PDF no pueda convertirse o renderizarse.

### Tercera prioridad: layout y móvil

1. Resolver el doble padding de `.page` y secciones.
2. Probar anchos 320, 375, 768, 1024 y 1440 px.
3. Compactar la navegación móvil y añadir padding seguro al header.
4. Añadir `scroll-margin-top` a las secciones.
5. Probar el modal con textos largos, imagen vertical, panorámica, pequeña y galería de cinco o más elementos.

### Cuarta prioridad: modales y accesibilidad

1. Mover foco al abrir, atraparlo dentro y restaurarlo al cerrar.
2. Bloquear scroll del body mientras el modal esté activo.
3. Añadir estado accesible a miniaturas y anuncios de cambio de imagen.
4. Añadir fallback de PDF en enlace externo temporal.
5. Corregir `lang`, focus visible y preferencias de movimiento reducido.

### Quinta prioridad: rendimiento

1. Medir peso y tiempo de `/home` y `/projects` con datos reales.
2. Evitar descargar PDF e imágenes grandes dentro del JSON inicial en una futura mejora coordinada con backend.
3. Considerar URLs de recursos, miniaturas y carga bajo demanda antes de que crezca la galería.

## 14. Límites de esta auditoría

- No se modificaron JSX, CSS, configuración ni assets.
- No se ejecutó `npm run build` porque genera `frontend/dist`.
- La responsividad se evaluó a partir de breakpoints y reglas CSS; requiere confirmación visual manual en navegador/dispositivos.
- No se evaluaron datos privados ni se alteró SQLite.
- Los problemas se clasificaron por impacto potencial en seguridad, disponibilidad, visualización pública y accesibilidad.
> Estado: documento histórico.
> No representa el diagnóstico o plan vigente.
> Se conserva únicamente para trazabilidad.
