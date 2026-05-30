# Documento de Requisitos de Producto (PRD)
## Proyecto: Visual AI Staging Companion (Inspector Visual para Desarrollo Asistido por IA)

---

## 1. Resumen Ejecutivo
El **Visual AI Staging Companion** es una herramienta de desarrollo diseñada para cerrar la brecha de comunicación entre el desarrollador y los asistentes de codificación basados en inteligencia artificial (IA). 

Esta herramienta permite al desarrollador interactuar directamente con su interfaz en desarrollo, experimentar cambios en tiempo real en una "capa de staging" visual, y exportar automáticamente una **receta de modificación exacta (Prompt estructurado con un pre-prompt de sistema)** con selectores CSS y parámetros precisos para que la IA aplique los cambios directamente en el código fuente de forma local o externa.

---

## 2. Visión General de la Arquitectura Híbrida
Para garantizar la máxima precisión, ligereza y facilidad de adopción (cero desconfianza en ejecutables nativos), el producto se diseña bajo una arquitectura híbrida basada en herramientas estándar del ecosistema de desarrollo (NPM y extensiones web), integrada por dos componentes clave:

```
+-------------------------------------------------------------------+
| COMPAÑERO DE LÍNEA DE COMANDOS (vais CLI - Node.js Package)       |
|  - Inicializa el entorno local del proyecto (npx vais init).      |
|  - Levanta el WebSocket local y servidor MCP en Node (vais dev).   |
|  - Escribe directamente audios y recetas en el disco local.       |
|  - Integra la carpeta local .ai-staging/ de forma transparente.   |
+---------------------------------+---------------------------------+
                                  |
                    (Canal WebSocket Local Cifrado)
                                  |
                                  v
+-------------------------------------------------------------------+
| EXTENSIÓN WEB DE NAVEGADOR (Chrome Extension - Manifest V3)        |
|  - Inyecta el Inspector DOM y la Capa de Staging CSS.             |
|  - Mapea elementos web y calcula estilos computados exactos.       |
|  - Soporta modo desarrollo local e inspiración en sitios externos.|
+-------------------------------------------------------------------+
```

---

## 3. Especificaciones de Características Clave

### 3.1. Modo de Inspección y Staging de Parámetros (Visual Sandbox)
Permite al usuario seleccionar cualquier elemento de la interfaz y experimentar cambios físicos en tiempo real antes de enviar la instrucción a la IA.

*   **Detección de Propiedades**: Al seleccionar un elemento, la herramienta ejecuta `window.getComputedStyle` y extrae sus propiedades físicas (ancho, alto, padding, color, fuentes, márgenes).
*   **Panel de Staging Lateral**: Muestra controles deslizantes (sliders) para dimensiones, selectores de color e inputs de texto correspondientes a las propiedades del elemento seleccionado.
*   **Renderizado Temporal**: Los cambios aplicados por el usuario se inyectan en caliente en el atributo `style` del DOM en la página activa. Esto permite ver los resultados en tiempo real sin modificar los archivos físicos del proyecto todavía.
*   **Mapeo Contextual de Parámetros**:
    *   *Botones/Inputs*: Expone padding, border-radius, background-color, font-size y texto.
    *   *Contenedores (Cards/Layouts)*: Expone margin, padding, flex-direction, gap y sombras.
    *   *Imágenes*: Expone border-radius, object-fit y dimensiones.

### 3.2. Selección de Zona Libre (Bounding Box & Spatial Annotations)
Permite realizar anotaciones en espacios vacíos de la pantalla o agrupar múltiples componentes mediante un lienzo de dibujo libre.

*   **Lienzo SVG/Canvas Superpuesto (Overlay)**: Al activar el modo de zona, se despliega una capa transparente. El usuario hace clic y arrastra el cursor para dibujar un rectángulo de área.
*   **Algoritmo de Anclaje Estructural (DOM Anchoring)**:
    *   La herramienta calcula las coordenadas `(X1, Y1)` a `(X2, Y2)` de la zona dibujada.
    *   Utiliza `document.elementFromPoint` para buscar el contenedor padre más cercano (`Nearest Parent Container`) en el DOM.
    *   *Si la zona está vacía*: Indica a la IA dónde inyectar el nuevo código de forma relativa (ej. *"Inyectar dentro de `section.hero` como último hijo"*).
    *   *Si la zona contiene elementos*: Identifica los nodos hijos que colisionan con el área para sugerir agrupaciones o reemplazos (ej. *"Agrupar `button#b1` y `button#b2` en un contenedor flexbox"*).
*   **Plantillas de Inserción (Quick Templates)**: Al finalizar el dibujo de la zona, el usuario puede seleccionar componentes predefinidos para insertar (ej. "Insertar Carrusel de Imágenes", "Insertar Formulario", "Insertar Grid").

### 3.3. Anotaciones Multimodales
*   **Entrada de Texto**: Notas escritas directamente asociadas al elemento o zona.
*   **Grabación de Audio (Voz) en Panel Lateral**: Opción de grabar una nota de voz corta en el elemento seleccionado a través de un control de micrófono dedicado en el panel lateral de staging de la extensión.
*   **Indicador Visual Flotante en Pantalla (DOM Badge)**: Una vez grabado el audio, la extensión ancla un pequeño icono visual de audio (badge) sobre el elemento afectado en el navegador, permitiendo al desarrollador identificar fácilmente qué componentes tienen notas de voz asociadas.
*   **Referencia de Audio en el Prompt**: El prompt y el archivo Markdown generados no realizan transcripción obligatoria, sino que incluyen una referencia o enlace a la ruta absoluta del archivo de audio local (ej. `[Escuchar audio](file:///ruta/al/proyecto/.ai-staging/audio/timestamp.wav)`) almacenado localmente en `.ai-staging/audio/`. Esto permite que agentes locales de desarrollo (con acceso al sistema de archivos) o interfaces de IA multimodales analicen directamente el archivo de audio.
*   **Configuración de Salida de Audio (Referencia vs Transcripción) [Planificado]**: La extensión ofrecerá un selector al crear la receta donde el usuario decide si prefiere mantener el enlace de audio local (multimodal) o realizar una transcripción literal. Si elige transcribir, podrá seleccionar entre:
    1. *Transcripción Literal por SO*: Utilizando APIs locales de accesibilidad nativas del sistema operativo (baja latencia).
    2. *Transcripción Formal por Agente Local*: Integrando un modelo Whisper a través de la infraestructura local del agente de IA.
    3. *API Externa*: Mediante servicios en la nube de transcripción (ej. OpenAI Whisper API).

### 3.4. Generación de la Receta de Código (AI Prompt Output)
Unifica todas las modificaciones hechas por el usuario (los estilos del staging visual, las inserciones en zonas libres y las notas escritas/transcritas) en un reporte formateado en **Markdown** que incluye un **Pre-Prompt de Sistema Estructurado con Guardrail de Audio** para optimizar el comportamiento de la IA.

#### Salvaguarda de Contexto Multimodal (Guardrail):
Si el prompt Markdown hace referencia a archivos de audio en `.ai-staging/audio/` y el desarrollador está utilizando una interfaz web externa (como Claude.ai o ChatGPT Web), el pre-prompt inyecta obligatoriamente la siguiente instrucción de seguridad en el sistema:
*   *"Instrucción Crítica: Si esta especificación hace referencia a un archivo de audio local (.wav o .webm) y el desarrollador no ha adjuntado el archivo físico a esta sesión de chat, detente inmediatamente. Antes de 'pensar' o proponer modificaciones de código, indica de forma clara al desarrollador que debe arrastrar e insertar el archivo de audio al chat, proporcionándole la ruta exacta que figura en la receta."*

#### Estructura del Documento Generado:
```markdown
Por favor, aplica las siguientes modificaciones y adiciones de interfaz en nuestro código base. Los cambios requeridos están clasificados por elementos y zonas de la pantalla, incluyendo los valores exactos definidos en nuestra capa de staging visual y notas explicativas:

=========================================
DETALLE DE MODIFICACIONES REQUERIDAS
=========================================

### [ID / Selector del Elemento]
- **Tipo**: [Botón / Contenedor / Imagen / etc.]
- **Texto original / actual**: "[Texto previo]"
- **Texto requerido**: "[Texto nuevo]"
- **Estilos Visuales Requeridos (Staged)**:
  - `padding`: "12px 24px" (original: "8px 16px")
  - `background-color`: "#475569" (original: "#3b82f6")
- **Nota del desarrollador**: "[Texto o referencia al archivo de audio local]"

-----------------------------------------

### [Zona Libre - Nueva Inserción]
- **Contenedor Padre Asociado**: `div.main-content > section.hero`
- **Ubicación**: Zona vacía central superior.
- **Acción**: Inserción de nuevo componente.
- **Plantilla seleccionada**: Carrusel de imágenes.
- **Nota del desarrollador / Especificación**: "[Texto o referencia al archivo de audio local]"
```

### 3.5. Puente de Estados y Datos Reactivos (State & Props Binding)
Mapea el árbol virtual de componentes de frameworks modernos en etapas de desarrollo (con pleno acceso al código fuente y a herramientas de desarrollo locales) para evitar la ruptura de la reactividad al modificar elementos enlazados dinámicamente.

*   **Inspección del Entorno de Desarrollo (Local Dev Mode)**: El script inyectado en el navegador se ejecuta con acceso a las herramientas globales de desarrollo y source maps. Sube a través del árbol de componentes virtuales (como React Fiber o Vue Context) para identificar si las propiedades visuales provienen de un estado dinámico local (`state`) o una propiedad del componente (`prop`).
*   **Extracción de Metadatos de Enlace en Desarrollo**: Captura los nombres de las variables y del componente original valiéndose de los mapeos de compilación activa en modo de desarrollo.
*   **Mapeador Inteligente de Estilos a Tokens (Design Tokens Mapper)**: La herramienta lee las hojas de estilo o la configuración del proyecto (ej. `tailwind.config.js` o variables CSS). Al interactuar con los sliders en el Sandbox, aproxima el valor físico (ej. `15.8px`) al token de espaciado o color más cercano de la paleta del proyecto (ej. mapeándolo a `p-4` o `var(--spacing-md)`), evitando que la IA genere estilos inline estáticos en el código fuente.
*   **Traducción del Prompt**: Indica a la IA la ubicación exacta del archivo fuente, el componente/variable reactiva a modificar y el token de estilo correspondiente, en lugar de sugerir cambios en el código HTML estático o usar valores planos hardcodeados.

### 3.6. Inspector de Raycasting para Motores de Juegos y Canvas (WebGL/3D Scene Inspector)
Permite realizar anotaciones y modificaciones de forma precisa en aplicaciones y videojuegos durante la fase de desarrollo local, donde el desarrollador tiene acceso completo a los scripts del motor y a las variables del entorno de pruebas.

*   **Adaptadores de Motor Web (Engine Hooking)**: Se expone un script de integración de desarrollo ligero (ej. un package npm o plugin local de Unity) que expone la escena del motor al objeto global de desarrollo (ej. `window.__DEV_3D_SCENE__`) de forma exclusiva en el entorno de pruebas local del desarrollador.
*   **Colisiones Espaciales 3D (Raycasting)**: Cuando el usuario activa la inspección en un Canvas WebGL local, la herramienta proyecta un rayo tridimensional aprovechando el contexto expuesto por el motor de desarrollo activo.
*   **Extracción del Scene Graph**: Obtiene las coordenadas de impacto, el identificador único del objeto 3D afectado, su nodo padre en la jerarquía y los valores de transformación local (posición, escala, rotación).
*   **Traducción del Prompt**: Genera instrucciones precisas orientadas al árbol de objetos del juego (ej. scripts C# de Unity o código JS de Three.js) detallando qué objeto modificar y cuáles deben ser sus nuevos valores de posición o escala en el código fuente local.

### 3.7. Grabador de Flujos de Interacción y Estados Dinámicos (Event Flow Recorder)
Simplifica la descripción de comportamientos dinámicos interactivos complejos mediante la captura automatizada de secuencias de eventos del DOM.

*   **Captura de Transición de Estados**: Al activar el modo "Grabar Flujo de Interacción", la herramienta registra los eventos de entrada del desarrollador (clics, desplazamientos, focos) y monitoriza las variaciones resultantes en el DOM (adición/eliminación de clases de estilo, transiciones de visibilidad, animaciones).
*   **Lógica de Flujo Secuencial**: Compila la secuencia y la ordena en un flujo de estados lógicos (ej. *Estado 1: Botón presionado -> Estado 2: Contenedor `.sidebar` activo con clase `.open` -> Estado 3: Clic fuera -> Estado 4: Remoción de clase `.open`*).
*   **Traducción del Prompt**: Entrega un flujo lógico a la IA detallando exactamente qué disparadores de eventos (`event listeners`) y conmutaciones de clases (`class toggling`) se deben implementar en el componente de destino.

### 3.8. Validación de Regresión Visual por Capas (Visual Overlay Difference Verification)
Garantiza el control de calidad visual de las modificaciones de código generadas por la IA mediante la comparación por capas superpuestas vectoriales y análisis numérico.

*   **Instantánea de Staging (Visual Snapshot)**: Al completar una sesión de staging y exportar la receta, la herramienta toma y almacena una captura gráfica del componente modificado y sus estilos ideales computados.
*   **Superposición de Contornos Vectoriales (DOMRect Outlines)**: En lugar de depender de capturas estáticas pesadas que fallan ante cambios de scroll o resolución, la extensión proyecta las cajas de límites ideales (`DOMRect`) de la sesión de staging sobre el DOM renderizado real mediante guías vectoriales semitransparentes.
*   **Reporte de Desviación Estilo/Pixel (Estilos Computados)**: Realiza una comparación técnica matemática entre los estilos computados del elemento modificado en el navegador actualizado y los valores staging ideales. Genera un reporte de diferencias preciso en texto (ej. *"Desviación de Padding: +4px | Margen actual: 12px | Ideal: 16px"*) que alimenta directamente a la IA correctora en un flujo de refinamiento iterativo cerrado.

### 3.9. Modo Inspiración y Captura de Referencia Externa
Permite a los desarrolladores navegar por sitios web públicos de terceros (donde no se posee acceso al código fuente, ej. `stripe.com`) para capturar componentes inspiradores y delegar su recreación adaptada al agente de IA.

*   **Detección Automática de Origen**: La extensión analiza la URL de la pestaña activa en el navegador. Si la URL no coincide con dominios de desarrollo local (`localhost`, `127.0.0.1`, etc.) o servidores de staging registrados del proyecto, la extensión conmuta automáticamente a **"Modo Inspiración"** (tiñéndose visualmente de color violeta).
*   **Extracción de Estilos e HTML de Inspiración**: El inspector captura el HTML del elemento inspectado y sus estilos computados exactos (`getComputedStyle`), aislándolos como una estructura de referencia de diseño.
*   **Canalización a la CLI Local**: Estando en el sitio web de terceros, la extensión transmite la receta de inspiración y las notas de voz asociadas vía WebSocket a la CLI local `vais dev` que se está ejecutando en el proyecto activo del desarrollador en su terminal.
*   **Traducción del Prompt (Recreación de Componente)**: La CLI guarda el audio y genera la receta en la carpeta local, formateando el prompt específicamente para una **"Recreación de Componente de Inspiración"**. El prompt instruye a la IA a codificar desde cero el componente en los archivos del proyecto local tomando el diseño exterior como referencia técnica exacta, adaptándolo a la paleta de tokens del repositorio.

### 3.10. Descubrimiento Activo de Proyectos (Múltiples Sesiones CLI)
Cuando el desarrollador ejecuta múltiples terminales con `vais dev` en diferentes directorios del sistema para distintos repositorios, el sistema de direccionamiento dinámico resuelve la sesión de la siguiente manera:
*   **Registro Centralizado de Sesiones**: Cada vez que se ejecuta `vais dev`, el servidor local de Node.js escribe sus metadatos de sesión (incluyendo PID del proceso, ruta absoluta del repositorio, puerto WebSocket asignado —usando un rango del `5515` al `5520`— y puerto de desarrollo frontend detectado —por ejemplo, `localhost:5173` para Vite—) en un registro temporal local de usuario (ej. `~/.vais/active_sessions.json`).
*   **Ruteo Inteligente en la Extensión**:
    *   La extensión web del navegador consulta activamente dicho archivo de registro (o escanea los puertos locales configurados) para identificar las sesiones CLI vivas.
    *   **Auto-Selección**: Si la URL activa del navegador coincide con el puerto de desarrollo de alguna sesión del registro, la extensión asocia automáticamente la sesión de staging a ese proyecto específico.
    *   **Selector de Workspace**: En caso de no haber coincidencia automática (como en el "Modo Inspiración" en un dominio público externo), el panel lateral de la extensión muestra un menú desplegable interactivo para que el desarrollador seleccione explícitamente a qué proyecto o repositorio local activo desea transmitir la receta y los audios de la sesión de staging.

### 3.11. Auditoría de Seguridad, CSP y Buenas Prácticas
Para cumplir con los estándares rigurosos requeridos por los entornos corporativos y de producción:
*   **Cumplimiento Estricto de Content Security Policy (CSP)**: Todas las operaciones de manipulación del DOM y registro de eventos en la extensión y el script inyectado omiten el uso de manejadores de eventos inline (`onclick`, `onchange`, etc.) o la ejecución de scripts evaluados dinámicamente (`eval`). Todos los listeners se asocian de manera exclusiva mediante la API de programación `addEventListener` de JavaScript.
*   **Mitigación de Vulnerabilidades XSS**: Para la representación de cambios en el Sandbox y el historial del widget FAB, el sistema prohíbe el uso de `innerHTML` sobre datos controlados o proveídos por el usuario. Toda la renderización de texto se realiza mediante APIs seguras de creación de nodos (`document.createElement`) y la asignación directa de propiedades de texto plano (`textContent`).
*   **Informes de Auditoría de Código**: La base de código del prototipo se valida mediante suites de pruebas automatizadas y es visada por un rol de "Auditor de Código", generando reportes de calidad y cumplimiento técnico almacenados directamente en `.ai-staging/audit_reports/` para garantizar la robustez del software.



## 4. Requisitos de Control de Ventana, Sesión y Almacenamiento

### 4.1. Direccionamiento y Aislamiento de Pestañas (Tab Isolation)
*   **Regla**: El alcance de la inspección y de las modificaciones visuales de la extensión debe limitarse estrictamente a la **pestaña y ventana específica** que el usuario ha seleccionado mediante el Selector de Ventanas.
*   **Implementación**: 
    *   La extensión utiliza el identificador único de pestaña (`tabId` provisto por las APIs de Chrome Extensions).
    *   El script de inspección y staging inyectado se aísla en su propio contexto de ejecución de contenido (`isolated world`), asegurando que las variables globales del inspector no se filtren a otras pestañas activas del navegador, previniendo contaminación de datos.

### 4.2. Escalado Dinámico y Sincronización de Eventos (Event Sync)
*   **Regla**: El lienzo de superposición (`Canvas Overlay`) utilizado para el resaltado y dibujo de zonas libres debe actuar como un "hijo" lógico del viewport de la aplicación activa, adaptándose en tiempo real a cualquier cambio de estado de la ventana.
*   **Implementación**:
    *   **Resize**: Un event listener al evento global `window.resize` recalcula inmediatamente la posición del Canvas Overlay y los elementos marcados para evitar que los rectángulos queden desalineados si la ventana se maximiza o redimensiona.
    *   **Minimizar/Maximizar**: En el modo de aplicación de escritorio, la ventana de superposición transparente utiliza listeners a eventos de foco del sistema operativo (`blur`/`focus` y cambios de dimensiones del proceso objetivo) para ocultarse o reubicarse de manera sincronizada con la aplicación base.

### 4.3. Widget Flotante del Sistema (Floating Overlay Widget)
*   **Regla**: Debe existir un widget o botón flotante de control de acción rápido (Floating Action Button - FAB) visible en la UI mientras el modo de feedback esté activo, garantizando que el usuario tenga control total y no olvide cerrar la sesión.
*   **Diseño Visual**: Un elemento circular o píldora con diseño premium (fondo glassmorphic blur, borde semi-transparente y micro-animación de pulso que indique que el modo "grabación/feedback" está activo).
*   **Funcionalidades del Widget**:
    *   **Indicador de Estado**: Pulso animado de color que cambia si está en modo *Inspección* (Azul) o modo *Zona Libre* (Violeta).
    *   **Contador de Cambios**: Muestra una pequeña insignia (badge) con el número de anotaciones acumuladas en la sesión actual.
    *   **Acceso a la Lista**: Al hacer clic, despliega un mini-historial flotante con opción de borrar anotaciones individuales.
    *   **Botón de Exportación Rápida**: Genera y copia el prompt en un clic.
    *   **Botón de Cierre (Salir/Terminar)**: Remueve por completo la inyección del DOM, limpia los estilos de staging temporales y restaura el estado limpio original de la página.

### 4.4. Destinos de Exportación Flexibles (Clipboard, Path & MCP Integration)
Para apoyar flujos de trabajo tanto con interfaces de chat de IA basadas en web externos (como Claude, ChatGPT o Gemini Web UI) como con editores y agentes integrados en local, el sistema ofrece tres vías de transferencia de contexto:

*   **Copiar Contenido Completo (Portapapeles - Copy Text)**: Copia el texto Markdown completo del prompt estructurado (incluyendo el Pre-Prompt y las rutas locales de audio) directamente al portapapeles en un clic para pegarlo en interfaces web de IA.
*   **Copiar Ruta del Archivo (Copy File Path)**: Copia la ruta absoluta local del archivo `.md` generado por la aplicación en `.ai-staging/feedback/`. Ideal para pasárselo a agentes locales que tienen acceso directo de lectura al disco.
*   **Servidor MCP Integrado en vais CLI (Model Context Protocol)**: La herramienta CLI de línea de comandos expone un servidor MCP local de forma transparente. Editores avanzados de código y herramientas CLI de IA locales (como Cursor, Claude Code, Cline o Windsurf) pueden comunicarse nativamente con el servidor de staging en segundo plano para leer la última receta de cambios y el contexto sin que el usuario tenga que copiar y pegar nada.

### 4.5. Configuración Dinámica de Rutas por Proyecto
Para evitar un almacenamiento centralizado y desorganizado, la herramienta estructura y guarda la información de manera local y aislada dentro de cada repositorio del desarrollador:

*   **Estructura del Proyecto (`.ai-staging/`)**: En lugar de usar una ruta del sistema fija, la CLI crea un directorio oculto llamado `.ai-staging/` en la raíz del proyecto activo en el que se ejecuta el comando de inicio.
*   **Subcarpetas del Proyecto**:
    *   `.ai-staging/feedback/`: Para almacenar las recetas en Markdown de las sesiones con nombres en formato `YYYY-MM-DD_HHMMSS_feedback.md`.
    *   `.ai-staging/audio/`: Para almacenar los archivos locales de grabación de voz en formatos ligeros de audio.
*   **Mapeo de Rutas Dinámicas**: Todas las recetas en Markdown de una sesión de feedback se guardarán exclusivamente dentro de la carpeta `.ai-staging/` local. Esto asegura que los archivos de diseño formen parte del repositorio del proyecto y puedan ser rastreados por Git.
*   **Instalador de Workspace (CLI Initializer)**: Un comando rápido CLI ejecutado por el desarrollador en su terminal (ej. `npx vais init`) escanea el directorio activo, genera la estructura `.ai-staging/` local e inicia el proceso para que la extensión de Chrome se vincule con el repositorio de forma segura.
*   **Gestión de Exclusiones de Git (`.gitignore` automático)**: Al inicializar el entorno mediante `npx vais init`, la CLI añadirá automáticamente la subcarpeta de audios (`.ai-staging/audio/`) al archivo `.gitignore` del proyecto. Esto previene que archivos binarios de audio pesados contaminen el control de versiones, mientras mantiene la carpeta `.ai-staging/feedback/` disponible para su rastreo, permitiendo sincronizar y versionar las recetas del historial de prompts del equipo de desarrollo.
*   **Transcodificación Automática de Audio a .wav**: Dado que los navegadores modernos registran el audio primariamente en formato `.webm`, el servidor CLI de Node.js intercepta la recepción de estos datos y realiza una conversión automática a formato `.wav` estándar (PCM 16-bit, 16kHz mono) utilizando transcodificadores ligeros en JavaScript/WASM en el lado del servidor, garantizando compatibilidad cruzada e inmediata con cualquier modelo multimodal o agente local.

---

## 5. Estrategia de Implementación y Roadmap

Para garantizar un desarrollo progresivo y usable desde fases tempranas, se divide el proyecto en dos fases clave, enfocándonos inicialmente en el ecosistema web:

### Fase 1: Extensión Web y Staging de Pestañas (Enfoque Inicial)
1.  **Desarrollo del Script de Inyección (Staging Engine)**: Motor encargado de leer `getComputedStyle`, desplegar el panel de control lateral y aplicar estilos dinámicos al DOM de la pestaña seleccionada.
2.  **Lienzo de Dibujo de Zonas**: Implementación de la superposición SVG para capturar áreas libres y el algoritmo de anclaje para buscar el contenedor padre en el DOM.
3.  **Widget de Control Flotante**: Diseño e interactividad del widget FAB para gestionar las anotaciones, el historial temporal y el copiado de la receta en Markdown.
4.  **Aislamiento y Sincronización**: Garantizar la respuesta al `window.resize` y el aislamiento total por `tabId`.

### Fase 2: Compañero de Línea de Comandos (CLI) y Conectividad Híbrida
1.  **vais CLI Package**: Creación de la herramienta de línea de comandos en Node.js distribuible a través de npm (`vais`).
2.  **Servidor WebSocket & MCP Local**: Implementación del puente de comunicación bidireccional sobre WebSockets locales para persistir audios en `.ai-staging/audio/` y recetas Markdown en `.ai-staging/feedback/`.
3.  **Integración de Protocolo MCP**: Servidor local de herramientas de contexto del modelo para inyectar automáticamente las recetas y metadatos en Cursor, Claude Code y extensiones de VS Code.

---

## 6. Pila Tecnológica Recomendada
*   **Extensión Web (Fase 1)**: TypeScript, HTML5 (Canvas/SVG), CSS puro (Vanilla CSS con HSL y variables dinámicas para diseño premium con soporte para modo oscuro/claro).
*   **Compañero de Escritorio / Servidor (Fase 2)**: Node.js (vais CLI), Express/WS para WebSocket local, y SDK oficial de MCP (Model Context Protocol) para Node.js.
*   **Transmisión de Datos**: Protocolo de comunicación JSON estructurado sobre WebSockets locales.
