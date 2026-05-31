# Visual AI Staging (vais) 🚀

**Visual AI Staging** is a lightweight, secure, and production-ready development companion designed to bridge the gap between visual UI design staging and AI coding assistants (such as Cursor, Claude Code, ChatGPT, or custom LLM developers).

It provides frontend developers with an interactive visual staging toolbar in their browser, coupled with a local CLI daemon. You can visually tweak styles, draw component guides, and record voice feedback on **any active website or local dev server**, compiling all staging sessions into **high-context structured Markdown prompt recipes** optimized for AI generation.

---

## Key Capabilities

*   **🔌 Universal Chrome Extension Companion:** Seamlessly injects the staging toolbar onto any target local host (e.g., your Next.js, Vite, or Astro dev server running at `http://localhost:3000`) or any live public website.
*   **🔍 Interactive Visual Sandbox:** Inspect active DOM elements, alter dimensions (padding, margins, width, height, border radius, font-size), edit text contents, and experiment with HSL background and text colors in hot memory.
*   **📐 Vector Bounding Boxes (Free-Zone Drawing):** Draw spatial annotation rectangles directly on top of your page. The engine automatically resolves the nearest structural parent container and logs your component templates.
*   **🎙️ Multimodal Localized Audio:** Record voice notes attached to specific components. The engine automatically anchors floating interactive microphone badges (`🎤`) above selected elements with relative position layout compensation.
*   **⚡ Smart Design Token Mapping:** Sliders automatically approximate manual pixel values to standard design tokens (e.g., `--spacing-md`, `--border-radius-lg`) to prevent the generation of static inline styling.
*   **💾 Secure Hot-Persistence CLI Server:** A lightweight, pure Node.js local development server that intercepts cross-origin AJAX requests to silently persist recording `.wav` assets and Markdown recipe `.md` files directly into your local workspace disk.
*   **📂 Multi-Session Workspace Redirection:** Auto-detects target hosts. Local dev server sessions save directly to your active repository workspace (`.ai-staging/`), while external websites (for layout inspiration) write to a dedicated sub-folder (`.ai-staging/external/`).

---

## Installation & Setup

Visual AI Staging consists of two components: the **Global CLI** and the **Companion Chrome Extension**.

### 1. Install the CLI
Install the command-line interface globally using NPM:

```bash
npm install -g visual-ai-staging
```

*(Note: The global `-g` flag is required to register the `vais` executable in your system path).*

### 2. Set Up the Companion Chrome Extension

*   **Official Chrome Web Store (Coming Soon):** The extension will be uploaded to the official Chrome Web Store soon upon completion of current tests.
*   **Manual Installation (Developer Mode / Testing):**
    If you want to run tests or use it before the store release, you can load the extension directly from the source code in this repository:
    1. Clone this GitHub repository to your local machine (or download the source zip).
    2. Open Google Chrome and navigate to `chrome://extensions/` (or click Chrome Menu -> Settings -> Extensions).
    3. Toggle the **"Developer mode"** switch in the top-right corner of the page.
    4. Click the **"Load unpacked"** button in the top-left corner.
    5. Navigate to the cloned repository folder and select the `vais-extension` directory.
    6. The **Visual AI Staging Companion** is now active in your browser! Pin the extension to your toolbar for quick access.

---

## Quick Start Workflow

Follow these steps to stage visual layouts and feed them to your AI coding assistant:

### Step 1: Initialize your Workspace
Navigate to your project root folder (e.g., `d:/Github Repos/BailacDB/dashboard`) in your terminal and initialize the staging environment:

```bash
vais init
```

*This creates the `.ai-staging` directories inside your project root to hold your future audio recordings and prompt recipes.*

### Step 2: Start the CLI Daemon
Launch the native local HTTP staging server:

```bash
vais dev
```

*The CLI daemon will start running on port `3000` (or automatically fall back to the next available port like `3001` if occupied), ready to receive feedback payloads.*

### Step 3: Run Staging in Chrome
1. Open your web browser and open your active application (e.g., `http://localhost:3000`) or any target website.
2. Click the **Visual AI Staging Companion** extension icon in your Chrome toolbar to inject the staging sidebar.
3. Use the toolbar tools:
    *   **Inspect Mode (`🔍`):** Select any DOM element to adjust margins, paddings, HSL colors, or text contents.
    *   **Free-Zone Mode (`📐`):** Draw violet rectangular bounding boxes to indicate where to insert new components.
    *   **Voice Recorder (`🎙️`):** Record a voice note attached to a specific component. An interactive microphone badge (`🎤`) will be anchored over the element.
4. Open the action menu and click **"Copy AI Recipe Prompt"** or check your local folder.
5. Paste the compiled Markdown recipe directly into your AI coding assistant (like Cursor or Claude Code). The prompt will instruct the AI to apply exact-fidelity visual and structural modifications to your codebase.

---

## CLI Command Guide

```bash
Usage: vais [options] [command]

Options:
  -v, --version  Output the version number
  -h, --help     Output usage information

Commands:
  init           Initialize Visual AI Staging workspace (.ai-staging/ directories)
  dev            Start the Visual AI Staging native development server
  update         Update the tool globally to the latest version
```

### Detailed Command Explanations

#### `vais init`
Prepares your active project folder by creating the local directories needed for persistence:
*   `.ai-staging/audio/` — Stores voice notes attached to local workspace staging.
*   `.ai-staging/feedback/` — Stores exported Markdown recipes (`.md` files) for local staging.
*   `.ai-staging/external/audio/` — Stores voice notes recorded on external/public inspiration websites.
*   `.ai-staging/external/feedback/` — Stores exported Markdown recipes for external websites.

#### `vais dev`
Starts the native local Node.js server. It auto-resolves workspace directories dynamically, handles CORS preflight checks securely, and acts as the filesystem bridge for the Chrome extension companion.

#### `vais update`
Upgrades Visual AI Staging to the latest version globally using NPM. Run this whenever a new version is pushed to NPM:
```bash
vais update
```
*(On macOS or Linux systems, depending on your node installation permissions, you might need to run `sudo vais update` or `sudo npm install -g visual-ai-staging@latest`).*

---

## Workspace Directory Architecture

When running `vais dev` in your project folder, the local CLI persists all assets dynamically relative to the terminal's working directory:

```
your-project-root/
├── .ai-staging/                       # Visual AI Staging local storage (Git-ignored)
│   ├── audio/                         # Staged .wav files for local dev server apps
│   ├── feedback/                      # Saved YYYY-MM-DD_HHMMSS_feedback.md recipes
│   └── external/                      # Data captured while browsing external websites
│       ├── audio/                     # Voice notes recorded on third-party sites
│       └── feedback/                  # Markdown recipes recorded on third-party sites
├── vais-extension/                    # Companion Chrome Extension source code
│   ├── manifest.json                  # Manifest V3 configuration
│   ├── content.js                     # Injected visual script and event coordinator
│   ├── shadow.css                     # Isolated shadow DOM styling
│   └── background.js                  # Extension service worker
├── cli.js                             # Native Node.js CLI server binary
├── app.js                             # Staging layout sandbox core
├── styles.css                         # Staging toolbar stylesheet
└── package.json                       # Distribution manifest
```

---

## Safety & Security Guardrails

*   **Zero Production Dependencies:** The CLI dev server is built entirely using Node.js native standard libraries (`http`, `fs`, `path`, `url`, `child_process`), eliminating supply-chain security risks.
*   **Path Traversal Prevention:** The HTTP dev server implements strict `path.resolve` checks to ensure no requests can access, read, or write files outside the workspace root directory (returns `403 Forbidden` on traversal attempts).
*   **Filename Sanitization:** The REST backend sanitizes names using `path.basename` extraction and regex assertions (`^[a-zA-Z0-9_\-\.]+\.(wav|md)$`) to block command injection.
*   **CSP & XSS Compliance:** The web engine uses event listeners (`addEventListener`) and programmatic node creations (`document.createElement` / `.textContent`) to strictly prevent DOM-based XSS vulnerabilities.

---

## License

This project is licensed under the permissive **MIT License** — feel free to use, modify, and distribute it for both commercial and personal use.
