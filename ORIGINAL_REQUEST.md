# Original User Request

## Initial Request — 2026-05-30T04:06:06Z

Desarrollar y consolidar la estructura de distribución de producción de **Visual AI Staging** en el espacio de trabajo local. Esto incluye preparar la configuración de empaquetado para NPM, la creación de la interfaz de línea de comandos (CLI) ejecutable y la estructuración del pipeline de automatización de despliegue continuo (CI/CD) a través de GitHub Actions.

Working directory: `d:\Github Repos\Extensiones_Ideas\visual_ai_staging`
Integrity mode: `development`

---

## 1. Agentes del Sistema de Trabajo en Equipo

El sistema multi-agente operará bajo la siguiente estructura:
1.  **Agente de Infraestructura & DevOps (Implementador):** Responsable de estructurar el `package.json` de producción, el archivo de exclusiones `.npmignore`, el script ejecutable de la CLI (`cli.js`) y el archivo de workflow de GitHub Actions (`.github/workflows/publish.yml`).
2.  **Agente Auditor (Seguridad y Calidad):** Responsable de auditar cada script, manifiesto y configuración de automatización. Guardará sus revisiones en `.ai-staging/audit_reports/` e indicará correcciones necesarias. Ninguna configuración se considerará definitiva hasta contar con un reporte del Auditor con el estado `[APROBADO - SIN OBSERVACIONES]`.

---

## 2. Requisitos de Producto (Requirements)

### R1. Estructura de Distribución de Producción en NPM
*   **Identidad en package.json:** Configurar los metadatos de producción del proyecto:
    *   `name`: `visual-ai-staging`
    *   `version`: `1.0.0`
    *   `description`: "Visual AI Staging Companion — Bridge the gap between UI design staging and AI coding assistants."
    *   `license`: `MIT`
    *   `main`: `app.js`
    *   `bin`: `{ "vais": "./cli.js" }` (asociar el comando ejecutable global `vais` a la CLI).
*   **Script Ejecutable CLI (`cli.js`):** Crear un punto de entrada binario ligero en la raíz del proyecto:
    *   Debe incluir la directiva superior `#!/usr/bin/env node`.
    *   Debe parsear argumentos de consola básicos y admitir los comandos:
        *   `vais --version` o `vais -v` (retorna el valor exacto del archivo `package.json`).
        *   `vais --help` o `vais -h` (muestra un manual de uso rápido en consola).
        *   `vais dev` (levanta el servidor de desarrollo local).
*   **Control de Archivos en Distribución (`.npmignore`):**
    *   Asegurar que el empaquetado final de NPM contenga exclusivamente el código de ejecución (`index.html`, `styles.css`, `app.js`, `cli.js`, `LICENSE` y `README.md`).
    *   Ignorar de manera explícita carpetas de desarrollo interno (`documentacion/`, `.agents/`), reportes locales (`.ai-staging/audit_reports/`), base de datos de sesiones temporales (`.ai-staging/active_sessions.json`), recetas en Markdown de sesiones de feedback anteriores (`.ai-staging/feedback/*.md`) y audios grabados de prueba (`.ai-staging/audio/*.wav`).

### R2. Servidor Local y Persistencia en Caliente (`vais dev`)
*   **Servidor Node.js Nativo:** El comando `vais dev` ejecutará un script en Node que levante un servidor local en localhost sin dependencias de paquetes de terceros (usando las APIs nativas `http` o `fs` de Node.js).
*   **Persistencia Física:** Servir de puente local para guardar las notas de voz en `.ai-staging/audio/` y las recetas Markdown de las sesiones en `.ai-staging/feedback/` de forma silenciosa sobre el disco físico del desarrollador.

### R3. Pipeline de Automatización de Publicación (GitHub Actions)
*   **Workflow de CI/CD (`.github/workflows/publish.yml`):**
    *   Crear el workflow de GitHub Actions automatizado.
    *   **Disparador (Trigger):** Se ejecuta automáticamente cuando se hace un `push` de un tag que coincida con el patrón de versiones (ej. `v*`, como `v1.0.0`) o cuando se crea una "Release" en la rama principal.
    *   **Fase de Verificación (CI):** Instala Node.js, descarga el código y ejecuta las pruebas de validación automatizadas (`verify_r3.js` y `verify_r4.js`). Si alguna prueba falla, el pipeline se detiene de inmediato de forma segura.
    *   **Fase de Publicación (CD):** Si las pruebas pasan exitosamente, empaqueta y publica el paquete en el registro global de NPM de forma automática, utilizando un token de autenticación cifrado almacenado en las variables secretas del repositorio de GitHub bajo el nombre `NPM_TOKEN`.

---

## 3. Criterios de Aceptación (Acceptance Criteria)

### Calidad del Paquete y CLI
- [ ] El archivo `package.json` tiene los campos `bin`, `name`, `version` y `license` configurados de forma correcta y válida para producción.
- [ ] El script `cli.js` incluye la directiva ejecutable `#!/usr/bin/env node` al inicio y maneja correctamente los comandos `vais --version`, `vais --help` y `vais dev` de forma síncrona.
- [ ] Al simular el empaquetado (ej. mediante análisis estático de exclusiones), se comprueba que los directorios `documentacion/` y `.agents/` y los archivos binarios temporales de audio o reportes de la carpeta `.ai-staging/` están excluidos del paquete de distribución final de NPM.

### Pipeline de Automatización
- [ ] El archivo `.github/workflows/publish.yml` cuenta con una sintaxis YAML válida y cumple con los estándares oficiales de GitHub Actions para flujos de trabajo de publicación en NPM.
- [ ] El pipeline declara de forma explícita el uso del secreto `${{ secrets.NPM_TOKEN }}` para autenticarse contra el registro de NPM durante la fase de despliegue.
- [ ] El pipeline ejecuta y valida la suite completa de unit tests (`node verify_r3.js` y `node verify_r4.js`) en el runner antes del paso de publicación, bloqueando el deploy ante cualquier fallo de pruebas.

### Flujo de Auditoría Integrado
- [ ] Cada nueva configuración, script de CLI y archivo YAML del workflow cuenta con un reporte de auditoría correspondiente firmado por el Agente Auditor en `.ai-staging/audit_reports/` con el estado `[APROBADO - SIN OBSERVACIONES]`.

## Follow-up — 2026-05-30T04:10:14Z

Hola Orquestador. El usuario ha realizado modificaciones clave en el frontend de `app.js` en el repositorio físico para integrarse de forma caliente con el servidor de desarrollo local (`isLocalServer` detectado por hostname).

Los cambios realizados son:
1. Declaró `isLocalServer` (compara hostname con localhost o 127.0.0.1).
2. Modificó la grabación de voz: si está en local, realiza un `POST /api/save-audio?filename={filename}` enviando el blob binario. Si falla o no está en local, recurre al fallback de descarga normal.
3. Modificó la exportación de feedback: si está en local, realiza un `POST /api/save-feedback` enviando un JSON `{ filename, content }`. Si falla, recurre al fallback de descarga.

Por favor, asegúrate de que el equipo de desarrollo diseñe el servidor local de Node.js nativo en `cli.js` / backend de `vais dev` para dar soporte inmediato a estos dos endpoints exactos:
- `POST /api/save-audio`: Capturar los chunks binarios de audio entrantes y guardarlos físicamente en `.ai-staging/audio/{filename}`.
- `POST /api/save-feedback`: Capturar el JSON con el contenido y escribir físicamente el archivo en `.ai-staging/feedback/{filename}`.

Esto permitirá una integración física en caliente limpia y totalmente alineada entre cliente y servidor. ¡Adelante con el desarrollo del Hito 2 y Hito 3!

