# Visual AI Staging (vais) 🚀

**Visual AI Staging** is a lightweight, secure, and production-ready development companion designed to bridge the gap between visual UI design staging and AI coding assistants (such as Cursor, Claude Code, ChatGPT, or custom LLM developers). 

It provides frontend developers with an interactive visual sandbox to tweak styles, draw components, and record voice feedback, compiling all sessions into **high-context structured Markdown prompt recipes** optimized for AI generation.

---

## Key Capabilities

*   **🔍 Interactive Visual Sandbox:** Inspect active DOM elements, alter dimensions (padding, margins, width, height, border radius, font-size), edit text contents, and experiment with HSL background and text colors in hot memory.
*   **📐 Vector Bounding Boxes (Free-Zone Drawing):** Draw spatial annotation rectangles directly on top of your page. The engine automatically resolves the nearest structural parent container and logs your component templates.
*   **🎙️ Multimodal Localized Audio:** Record voice notes attached to specific components. The engine automatically anchors floating interactive microphone badges (`🎤`) above selected elements with relative position layout compensation.
*   **⚡ Smart Design Token Mapping:** Sliders automatically approximate manual pixel values to standard design tokens (e.g., `--spacing-md`, `--border-radius-lg`) to prevent the generation of static inline styling.
*   **💾 Secure Hot-Persistence CLI Server:** A lightweight, pure Node.js local development server that intercepts AJAX requests to silently persist recording `.wav` assets and Markdown recipe `.md` files directly into your workspace disk.
*   **📦 Safe Distribution Filters:** Strict packaging excludes configured via `.npmignore` to prevent uploading development, testing, and system metadata files.
*   **🤖 Production AI-Pipeline Guardrails:** Exported prompts include pre-prompts that instruct receiving LLMs to halt execution if referred local voice recording files are not attached to the chat session, ensuring absolute context alignment.

---

## Installation

Install **Visual AI Staging** globally in your system using NPM:

```bash
npm install -g visual-ai-staging
```

*(Note: The global `-g` flag is required to register the CLI command globally in your terminal variables).*

---

## Quick Start

### 1. Initialize the Staging Environment
Navigate to your project root folder and initialize the workspace to create the local staging directories:

```bash
# Prepare the Visual AI Staging local workspace
vais init
```

*Console Output:*
```bash
Successfully initialized Visual AI Staging workspace!
Created directories:
  - .ai-staging/audio/
  - .ai-staging/feedback/
```

### 2. Start the Development Server
Launch the native local HTTP staging server:

```bash
# Start the local staging daemon
vais dev
```

*Console Output:*
```bash
Visual AI Staging Dev Server running at http://localhost:3000/
```

### 3. Run Visual Staging
1. Open your web browser and navigate to `http://localhost:3000/`.
2. Activate **Inspection Mode** or **Free-Zone Drawing** on the toolbar.
3. Select elements, alter visual parameters, record voice notes, and staging your layout options.
4. Open the floating action button menu (`⚡`) and click **"Copy AI Recipe Prompt"** to copy the compiled Markdown recipe to your clipboard.
5. Paste the recipe directly into your AI coding assistant to apply perfect-fidelity visual and structural modifications to your codebase.

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
```

---

## Folder Architecture

When running `vais dev` in your workspace, the local daemon writes data locally under the `.ai-staging/` directory:

```
your-project-root/
├── .ai-staging/                 # Local feedback data directory (Git-ignored)
│   ├── audio/                   # Staged .wav voice annotation files
│   └── feedback/                # Exported markdown prompt recipes (.md)
├── index.html                   # Entry page of your sandbox
├── app.js                       # Staging controller, drawing layers, and audio recorder
├── cli.js                       # Native Node.js CLI server binary
└── package.json                 # Distribution manifest
```

---

## Safety & Security Guardrails

*   **Zero Production Dependencies:** The CLI dev server is built entirely using Node.js native standard libraries (`http`, `fs`, `path`, `url`), eliminating third-party package security risks.
*   **Path Traversal Prevention:** The HTTP dev server implements strict `path.resolve` checks to ensure no requests can access, read, or write files outside the workspace root directory (returns `403 Forbidden` on traversal attempts).
*   **Filename Sanitization:** The REST backend sanitizes names using `path.basename` extraction and regex assertions (`^[a-zA-Z0-9_\-\.]+\.(wav|md)$`) to block command injection.
*   **CSP & XSS Compliance:** The web engine uses event listeners (`addEventListener`) and programmatic node creations (`document.createElement` / `.textContent`) to strictly prevent DOM-based XSS vulnerabilities.

---

## License

This project is licensed under the permissive **MIT License** — feel free to use, modify, and distribute it for both commercial and personal use.
