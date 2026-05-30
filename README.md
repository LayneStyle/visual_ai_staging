# Visual AI Staging Companion (Fase 1: Motor Web y Sandbox)
## Guía de Pruebas Rápidas y Manual de Usuario

Este repositorio contiene el prototipo funcional y de alta fidelidad de la **Fase 1 del Visual AI Staging Companion**. El sistema ha sido desarrollado bajo un flujo de trabajo riguroso de co-programación y auditoría forense de código, garantizando la ligereza (cero dependencias externas), seguridad contra XSS y total cumplimiento con políticas CSP estrictas (sin scripts ni eventos inline).

---

## 1. ¿Cómo Probar la Aplicación de Forma Inmediata?

Dado que el prototipo está construido enteramente sobre un stack web estándar (Vanilla HTML5, CSS3 y ES6+ JavaScript), **no requiere ningún proceso de compilación, instalación de paquetes npm ni servidores locales complejos.**

### Paso 1: Ejecutar la Interfaz Web
1. Abre tu navegador web (preferiblemente Google Chrome o navegadores basados en Chromium).
2. Abre el explorador de archivos y haz doble clic en el archivo `index.html` ubicado en la carpeta del proyecto:
   * Ruta física: `d:\Github Repos\Extensiones_Ideas\visual_ai_staging\index.html`
   * O arrastra y suelta el archivo `index.html` directamente dentro de una pestaña en blanco del navegador.

### Paso 2: Ejecutar las Pruebas Automatizadas (Unit Tests en Node.js)
Si deseas verificar programáticamente los estados de grabación, anclajes de badges y compilación del prompt:
1. Abre tu terminal de comandos en el directorio del proyecto:
   ```powershell
   cd "d:\Github Repos\Extensiones_Ideas\visual_ai_staging"
   ```
2. Ejecuta los scripts de verificación unitaria con Node.js:
   ```powershell
   node verify_r3.js
   node verify_r4.js
   ```
Ambas pruebas simularán el entorno completo del navegador e informarán un estado de éxito del `100% [PASS]` en la consola.

---

## 2. Manual de Pruebas de Características (Paso a Paso)

Una vez abierta la interfaz en el navegador, sigue este manual de usuario para experimentar la potencia del prototipo:

### A. Inspección del DOM y Sandbox Visual (Hito 2)
1. **Activar Inspección:** En la barra superior, haz clic en **"🔍 Inspection Mode"** (o abre el menú del botón flotante inferior derecho `⚡` y selecciona *"Toggle Inspector Mode"*). El cursor cambiará e indicará el modo de selección.
2. **Explorar Elementos:** Pasa el cursor por encima del área izquierda del lienzo simulado (**DOM Mock Page**). Verás cómo los botones, tarjetas de características, textos y contenedores se resaltan con contornos discontinuos en color azul.
3. **Seleccionar un Elemento:** Haz clic en cualquier elemento (ej. el botón azul *"Launch Sandbox"* o el título *"Engineered for the Autonomous Web"*).
4. **Modificar Estilos en Caliente:** 
   * Observa el panel de staging de la derecha. Ahora muestra los metadatos exactos (Tag, Clases y Selector CSS único).
   * Mueve los controles deslizantes (sliders) de **Padding, Margin, Width, Height, Border Radius y Font Size**. Verás cómo el elemento del DOM en la izquierda se deforma y actualiza en tiempo real de forma suave.
   * Modifica los colores de **Fondo y de Texto** usando los sliders H (Tono), S (Saturación) y L (Luminosidad) en el panel de color. El swatch de color y el elemento inspectado se actualizarán al instante.
5. **Mapeador Inteligente de Tokens:** Al mover los sliders de Padding o Border Radius a valores comunes (ej. `8px` o `16px`), verás cómo se activa automáticamente un distintivo de token (ej. `--spacing-sm` o `--border-radius-md`), demostrando que la herramienta aproxima tus ajustes visuales a los estándares de diseño del proyecto.
6. **Ver Cambios Acumulados:** Observa la sección inferior derecha **"Staged Changes"**. Verás una tarjeta que resume el selector CSS del elemento y el listado de propiedades modificadas con sus valores originales frente a los nuevos.
7. **Revertir Cambios:** Haz clic en el botón rojo **"Revert"** de la tarjeta del elemento modificado en la lista lateral para restaurar sus estilos originales de forma limpia.

### B. Spatial Annotations y Bounding Boxes (Hito 3)
1. **Activar Modo Zona:** En la barra de herramientas superior, haz clic en el botón **"📐 Free-Zone Drawing"**.
2. **Dibujar una Zona:** Haz clic y arrastra con el ratón sobre cualquier área vacía o encima de componentes en el DOM Mock Page de la izquierda. Verás cómo se dibuja una caja con guías vectoriales en color violeta.
3. **Configurar la Inserción:** Al soltar el ratón, se desplegará de forma automática un modal glassmorphic premium con desenfoque de fondo. El modal ya contiene:
   * El selector CSS del contenedor padre más cercano resuelto automáticamente por el algoritmo de escalado semántico.
   * Los límites espaciales del área trazada en píxeles.
4. **Guardar Nota e Inserción:** Elige una plantilla predefinida (ej. *Carrusel de imágenes*), escribe una nota explicativa en el campo de texto (ej. *"Inyectar un slider de logos de clientes aquí"*) y haz clic en **"Confirm Staging Area"**.
5. **Revisar Registro:** En el listado lateral, verás la tarjeta de inserción en color violeta, detallando la ubicación del rectángulo vectorizado y tu nota técnica. Al salir de este modo, el lienzo SVG se limpia automáticamente.

### C. Notas de Voz y DOM Badges Flotantes (Hito 4)
1. **Seleccionar Elemento:** Selecciona un elemento del Mock Page mediante el modo inspección.
2. **Iniciar Grabación:** En el panel lateral, localiza el control del micrófono y haz clic en el botón circular **"Record Voice Note"**. (Concede permiso de micrófono en tu navegador si te lo solicita).
3. **Grabar Audio:** Verás una animación de onda interactiva palpitando y un contador de tiempo. Habla a tu micrófono de forma natural para describir el cambio de diseño (ej. *"IA, haz que esta tarjeta tenga un degradado suave y separa el texto del borde"*).
4. **Finalizar Grabación:** Haz clic en **"Stop Recording"**. Verás cómo:
   * El botón cambia a *"Re-record Voice Note"* y aparece un botón de reproducción de audio nativo en el panel lateral para escuchar tu mensaje.
   * Se crea automáticamente un archivo de audio simulado persistido en el subdirectorio local del proyecto.
   * **DOM Badge Reactivo:** Aparece un pequeño icono flotante de micrófono (`🎤`) pulsando visualmente **directamente encima** del elemento inspectado en la pantalla de la izquierda.
5. **Borrar Nota:** Haz clic en el botón de borrar en el panel lateral. Verás cómo el audio se destruye limpiamente de la memoria y el badge `🎤` del DOM se elimina, restaurando los offsets de diseño originales.

### D. Exportar Receta e Integración Local (Hito 5)
1. **Abrir Menú de Acción Rápida (FAB):** Haz clic en el botón circular flotante con el icono de rayo (`⚡`) ubicado en la esquina inferior derecha.
2. **Copiar Receta de Prompt:** Haz clic en **"Copy AI Recipe Prompt"**.
3. **Notificación Visual:** Verás emerger en pantalla una elegante notificación Toast glassmorphic en la esquina superior derecha informando del copiado exitoso.
4. **Revisar Receta Copiada:** Pega el portapapeles en un editor de texto (o en el chat de tu IA). Verás el pre-prompt de sistema estructurado, seguido de los selectores, cambios exactos en tokens y la referencia física absoluta a los audios grabados en tu disco (ej. `[Escuchar audio](file:///d:/Github%20Repos/Extensiones_Ideas/visual_ai_staging/.ai-staging/audio/...)`).
5. **Autoguardado en Carpeta Local:** Ve al explorador de archivos y entra en la carpeta oculta del proyecto:
   `visual_ai_staging/.ai-staging/feedback/`
   Verás un archivo Markdown autogenerado de forma silenciosa con el nombre en formato `YYYY-MM-DD_HHMMSS_feedback.md`, consolidando tu historial de diseño listo para que Git lo rastree.

---

## 3. Estructura del Código del Prototipo

El código está limpio, documentado con estándares JSDoc y estructurado para facilitar la lectura:
* **Estructura e Interfaces Visuales:** `visual_ai_staging/index.html`
* **Estilos del Tema Oscuro Premium y Sandbox CSS:** `visual_ai_staging/styles.css`
* **Controlador Principal y Estados en Hot Memory:** `visual_ai_staging/app.js`
* **Reportes de Auditoría Firmados:** `visual_ai_staging/.ai-staging/audit_reports/`
* **Suites de Pruebas Node.js:** `visual_ai_staging/verify_r3.js` y `verify_r4.js`
