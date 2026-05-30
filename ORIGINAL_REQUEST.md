# Original User Request

## Initial Request — 2026-05-29T21:32:33-04:00

Desarrollar un prototipo web funcional y premium del **Visual AI Staging Companion (Fase 1: Motor Web y Sandbox)** en el directorio del proyecto. El desarrollo integrará un flujo de trabajo riguroso de co-programación entre agentes de implementación y un **Agente Auditor de Código** independiente que garantizará la seguridad, buenas prácticas de desarrollo y el orden en el código fuente final.

Working directory: `d:\Github Repos\Extensiones_Ideas\visual_ai_staging`
Integrity mode: `development`

---

## 1. Agentes del Sistema de Trabajo en Equipo

El sistema multi-agente operará bajo la siguiente estructura:
1. **Agente Frontend (Implementador):** Responsable de escribir la estructura, estilos y lógica del prototipo (HTML, Vanilla CSS con variables HSL, JavaScript).
2. **Agente Auditor (Seguridad y Calidad):** Responsable de auditar cada componente y script entregado por el Agente Frontend. El auditor guardará sus revisiones en `.ai-staging/audit_reports/` e indicará correcciones necesarias. Ningún componente será considerado definitivo hasta contar con un reporte del Auditor con el estado `[APROBADO - SIN OBSERVACIONES]`. El Agente Frontend deberá refactorizar y corregir el código según el feedback antes del cierre de tareas.

---

## 2. Requisitos de Producto (Requirements)

### R1. Sandbox Visual Interactiva (Modo de Inspección)
*   **Inspección del DOM**: Un contenedor o iframe de pruebas (Mock Page) que simule una web en desarrollo. Al activar el modo inspección, el desarrollador puede pasar el cursor para resaltar componentes en caliente con contornos semi-transparentes de color azul.
*   **Panel Lateral de Staging**: Al hacer clic en un elemento inspectado, se cargará un panel de control lateral con sliders y paletas de color con variables HSL. El panel permitirá editar dimensiones (padding, margin, width, height), colores de fondo/texto y bordes.
*   **Renderizado y Mapeador de Estilos**: Los ajustes de los sliders inyectarán estilos dinámicos temporales en el elemento inspectado en caliente. Si el proyecto cuenta con tokens de diseño, el Sandbox aproximará el valor del slider al token más cercano, mostrando el mapeo resultante.

### R2. Lienzo de Bounding Box Vectorial (Zonas Libres)
*   **Canvas Overlay**: Una capa SVG/Canvas transparente superpuesta sobre el iframe/contenedor de pruebas al activar el "Modo Zona Libre".
*   **Dibujo de Selección**: El desarrollador puede hacer clic y arrastrar para dibujar un área rectangular (Bounding Box) con guías vectoriales en color violeta.
*   **Anclaje DOM**: El sistema detectará las coordenadas del rectángulo y localizará semánticamente el contenedor padre más cercano del DOM real de pruebas, informando dónde insertar un nuevo elemento.

### R3. Grabador de Audio Localizado y DOM Badges
*   **Control del Micrófono**: Un botón de grabación con un micro-diseño premium y estados visuales (espera, grabando con animación de pulso, y archivo grabado) en el panel lateral de staging del elemento seleccionado.
*   **Simulador de Guardado Local**: Graba o simula la captura de audio y guarda localmente el archivo binario (ej. `.wav` o `.webm`) dentro de la estructura de carpetas de desarrollo local `.ai-staging/audio/`.
*   **DOM Badges de Audio**: Al finalizar la grabación, el sistema anclará un pequeño distintivo visual (badge flotante de micrófono) de color HSL semi-transparente directamente encima del elemento afectado en el canvas de la pantalla del navegador.

### R4. Compilador de Prompts en Markdown y Copiado
*   **Receta Markdown**: Unifica todas las anotaciones de la sesión (estilos en caliente editados, selectores CSS, coordenadas de zonas libres y enlaces absolutos locales a los audios grabados en formato `file:///...`) en una receta en Markdown estructurada con un pre-prompt de sistema para modelos de IA.
*   **Exportación Híbrida**: Proporciona un botón visual para copiar el Markdown estructurado en un solo clic al portapapeles y guarda la receta localmente en `.ai-staging/feedback/YYYY-MM-DD_HHMMSS_feedback.md`.

---

## 3. Criterios de Aceptación (Acceptance Criteria)

### Calidad de Código y Arquitectura
- [ ] Todo el código debe ser escrito en archivos separados estructurados de forma modular (ej. `index.html`, `app.js`, `styles.css`).
- [ ] No debe haber dependencias externas complejas ni librerías pesadas para garantizar la máxima ligereza de la aplicación.
- [ ] No debe existir código de producción no utilizado, console.logs de depuración sucios o comentarios vacíos.

### Funcionalidad Visual y Feedback
- [ ] El Sandbox permite modificar al menos 5 propiedades visuales básicas y actualiza el preview de forma instantánea y sin parpadeos.
- [ ] El Bounding Box permite dibujar múltiples zonas consecutivas y limpia correctamente el lienzo al salir del modo de zona libre.
- [ ] Al grabar audio en un componente, se crea y ancla un badge de audio sobre el elemento en el navegador y se registra su archivo local en `.ai-staging/audio/`.
- [ ] El Markdown generado contiene la lista exacta de cambios visuales ordenados por selector CSS y los enlaces correctos a los archivos de audio locales generados.

### Flujo de Auditoría Integrado
- [ ] Cada archivo y script del proyecto cuenta con un reporte de auditoría correspondiente firmado por el Agente Auditor en `.ai-staging/audit_reports/`.
- [ ] El reporte del Auditor analiza y documenta específicamente: Seguridad (ej. prevención de inyección XSS en manipulación del DOM), Estilo de código (ej. variables consistentes y modularidad) y Orden.
- [ ] Cada reporte del Auditor tiene la etiqueta explita de `[APROBADO - SIN OBSERVACIONES]` para confirmar la entrega final conforme al estándar.

## Follow-up — 2026-05-30T02:27:48Z

Desarrollar un prototipo web funcional y premium del **Visual AI Staging Companion (Fase 1: Motor Web y Sandbox)** en el directorio del proyecto. El desarrollo integrará un flujo de trabajo riguroso de co-programación entre agentes de implementación y un **Agente Auditor de Código** independiente que garantizará la seguridad, buenas prácticas de desarrollo y el orden en el código fuente final.

Working directory: `d:\Github Repos\Extensiones_Ideas\visual_ai_staging`
Integrity mode: `development`

---

## 1. Agentes del Sistema de Trabajo en Equipo

El sistema multi-agente operará bajo la siguiente estructura:
1. **Agente Frontend (Implementador):** Responsable de escribir la estructura, estilos y lógica del prototipo (HTML, Vanilla CSS con variables HSL, JavaScript).
2. **Agente Auditor (Seguridad y Calidad):** Responsable de auditar cada componente y script entregado por el Agente Frontend. El auditor guardará sus revisiones en `.ai-staging/audit_reports/` e indicará correcciones necesarias. Ningún componente será considerado definitivo hasta contar con un reporte del Auditor con el estado `[APROBADO - SIN OBSERVACIONES]`. El Agente Frontend deberá refactorizar y corregir el código según el feedback antes del cierre de tareas.

---

## 2. Requisitos de Producto (Requirements)

### R1. Sandbox Visual Interactiva (Modo de Inspección)
*   **Inspección del DOM**: Un contenedor o iframe de pruebas (Mock Page) que simule una web en desarrollo. Al activar el modo inspección, el desarrollador puede pasar el cursor para resaltar componentes en caliente con contornos semi-transparentes de color azul.
*   **Panel Lateral de Staging**: Al hacer clic en un elemento inspectado, se cargará un panel de control lateral con sliders y paletas de color con variables HSL. El panel permitirá editar dimensiones (padding, margin, width, height), colores de fondo/texto y bordes.
*   **Renderizado y Mapeador de Estilos**: Los ajustes de los sliders inyectarán estilos dinámicos temporales en el elemento inspectado en caliente. Si el proyecto cuenta con tokens de diseño, el Sandbox aproximará el valor del slider al token más cercano, mostrando el mapeo resultante.
*   **Seguridad CSP y XSS**: Queda estrictamente prohibido el uso de manejadores de eventos inline (`onclick`, `onchange`, etc.) en la maquetación HTML; todos los eventos deben registrarse en JS usando `addEventListener`. Para renderizar los elementos en caliente en listas o resúmenes, se prohíbe el uso de `innerHTML` sobre entradas del desarrollador, debiendo utilizar APIs seguras de creación de nodos (`document.createElement`) y `.textContent`.

### R2. Lienzo de Bounding Box Vectorial (Zonas Libres)
*   **Canvas Overlay**: Una capa SVG/Canvas transparente superpuesta sobre el iframe/contenedor de pruebas al activar el "Modo Zona Libre".
*   **Dibujo de Selección**: El desarrollador puede hacer clic y arrastrar para dibujar un área rectangular (Bounding Box) con guías vectoriales en color violeta.
*   **Anclaje DOM**: El sistema detectará las coordenadas del rectángulo y localizará semánticamente el contenedor padre más cercano del DOM real de pruebas, informando dónde insertar un nuevo elemento.

### R3. Grabador de Audio Localizado y DOM Badges
*   **Control del Micrófono**: Un botón de grabación con un micro-diseño premium y estados visuales (espera, grabando con animación de pulso, y archivo grabado) en el panel lateral de staging del elemento seleccionado.
*   **Simulador de Guardado Local**: Graba o simula la captura de audio y guarda localmente el archivo binario (ej. `.wav` o `.webm`) dentro de la estructura de carpetas de desarrollo local `.ai-staging/audio/`.
*   **DOM Badges de Audio**: Al finalizar la grabación, el sistema anclará un pequeño distintivo visual (badge flotante de micrófono) de color HSL semi-transparente directamente encima del elemento afectado en el canvas de la pantalla del navegador.
*   **Guardrails de Sistema y Selección de Audio**:
    *   La interfaz proporcionará un modal para alternar entre "Referencia de Audio" (default) o realizar una "Transcripción" (configurando entre API local de accesibilidad del SO, Whisper local o servicio externo).
    *   Si hay múltiples terminales CLI corriendo `vais dev` en paralelo, la extensión consultará el archivo de registro centralizado `~/.vais/active_sessions.json` para mostrar un menú selector que asocie el prompt y los audios al repositorio correcto, autodetectando la sesión por coincidencia del puerto dev de la tab.

### R4. Compilador de Prompts en Markdown y Copiado
*   **Receta Markdown**: Unifica todas las anotaciones de la sesión (estilos en caliente editados, selectores CSS, coordenadas de zonas libres y enlaces absolutos locales a los audios grabados en formato `file:///...`) en una receta en Markdown estructurada con un pre-prompt de sistema para modelos de IA.
*   **Guardrail de Seguridad en el Prompt**: El Markdown autogenerado incluirá un pre-prompt inyectado que instruye al LLM a detenerse y solicitar de manera explitamente que se adjunten los archivos de audio si no se encuentran cargados en la sesión de chat activa.
*   **Exportación Híbrida**: Proporciona un botón visual para copiar el Markdown estructurado en un solo clic al portapapeles y guarda la receta localmente en `.ai-staging/feedback/YYYY-MM-DD_HHMMSS_feedback.md`.

---

## 3. Criterios de Aceptación (Acceptance Criteria)

### Calidad de Código, Seguridad y Arquitectura
- [ ] Todo el código debe ser escrito en archivos separados estructurados de forma modular (ej. `index.html`, `app.js`, `styles.css`).
- [ ] Todo el código cumple estrictamente las directivas CSP (sin scripts inline, sin controladores de eventos inline en HTML) y previene XSS al evitar `innerHTML` para renderizado dinámico de cadenas controladas por usuario.
- [ ] No debe haber dependencias externas complejas ni librerías pesadas para garantizar la máxima ligereza de la aplicación.
- [ ] No debe existir código de producción no utilizado, console.logs de depuración sucios o comentarios vacíos.

### Funcionalidad Visual y Feedback
- [ ] El Sandbox permite modificar al menos 5 propiedades visuales básicas y actualiza el preview de forma instantánea y sin parpadeos.
- [ ] El Bounding Box permite dibujar múltiples zonas consecutivas y limpia correctamente el lienzo al salir del modo de zona libre.
- [ ] Al grabar audio en un componente, se crea y ancla un badge de audio sobre el elemento en el navegador y se registra su archivo local en `.ai-staging/audio/`.
- [ ] El Markdown generado contiene la lista exacta de cambios visuales ordenados por selector CSS y los enlaces correctos a los archivos de audio locales generados.
- [ ] El Markdown incluye la salvaguarda (guardrail) inyectada que previene el análisis del LLM si el usuario ha olvidado adjuntar el archivo físico de audio.

### Flujo de Auditoría Integrado
- [ ] Cada archivo y script del proyecto cuenta con un reporte de auditoría correspondiente firmado por el Agente Auditor en `.ai-staging/audit_reports/`.
- [ ] El reporte del Auditor analiza y documenta específicamente: Seguridad (ej. prevención de inyección XSS en manipulación del DOM), Estilo de código (ej. variables consistentes y modularidad) y Orden.
- [ ] Cada reporte del Auditor tiene la etiqueta explícita de `[APROBADO - SIN OBSERVACIONES]` para confirmar la entrega final conforme al estándar.

