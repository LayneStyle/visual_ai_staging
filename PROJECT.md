# PROJECT — Visual AI Staging Companion (Phase 1: Motor Web y Sandbox)

This is the primary specification and design documentation for Phase 1 of the Visual AI Staging Companion. It outlines the application architecture, defines design tokens, details project milestones, and specifies the programming interfaces to be implemented.

---

## 1. Product Name & Core Mission
**Product Name**: Visual AI Staging Companion (Phase 1: Motor Web y Sandbox)

**Core Mission**: Bridge the communication gap between human frontend developers and AI coding assistants by providing a visual staging ground where changes can be previewed locally and exported into structured, high-context AI prompts.

---

## 2. Architecture & Code Layout

### 2.1. Code Layout Overview
The project is organized in a lightweight, single-page application structure optimized for early prototyping, visual validation, and extension mapping:

```
visual_ai_staging/
├── index.html                   # Core application layout and DOM Mock Page
├── styles.css                   # Global stylesheet containing custom variables and styling
├── app.js                       # Staging controller, drawing logic, and audio recorder
├── PROJECT.md                   # Global specification and architecture blueprint (this file)
├── prd_visual_ai_staging.md     # Initial Product Requirements Document
├── README.md                    # User manual and quick testing guide
├── verify_r3.js                 # Programmatic audio verification suite
├── verify_r4.js                 # Programmatic prompt compilation verification suite
├── .ai-staging/                 # Local data staging directory
│   ├── audio/                   # Staged .wav/.webm voice annotation files
│   ├── feedback/                # Exported markdown recipes (.md)
│   └── audit_reports/           # Structural verification and QC reports
└── .agents/                     # AI agents workspace and metadata
```

### 2.2. Component Architecture Diagram
The architecture integrates a DOM Mock Page (simulating a target application), an interactive overlay canvas for drawing vector bounding boxes, an inspector that captures actual and dynamic styles, an audio manager, and a prompt compiler.

```
+------------------------------------------------------------------------------------------+
|                                    BROWSER VIEWPORT                                      |
+----------------------------------------+-------------------------------------------------+
|                                        |                                                 |
|  [DOM MOCK PAGE / EXTERNAL SITE]       |  [LATERAL STAGING PANEL]                        |
|  - Visual elements to inspect/modify   |  - Active Element Selector & Details            |
|  - Live-updated inline style overrides  |  - Property Sliders & Colors (Dynamic Sandbox)  |
|  - Captures computed CSS & SVG bounds  |  - Voice Recorder (Microphone Actions)          |
|                                        |  - Prompt Compiler Section                      |
|  [BOUNDING BOX CANVAS OVERLAY]         |                                                 |
|  - Transparent Vector overlay          |  [FLOATING ACTION BUTTON (FAB)]                 |
|  - Captures coordinates (X1, Y1)       |  - Mode Indicator (Inspection vs. Canvas Box)   |
|  - Renders temporary bounding boxes   |  - Interactive Counter & Quick Export Actions   |
|  - Resolves Nearest Parent Element     |                                                 |
|                                        |                                                 |
+----------------------------------------+-------------------------------------------------+
                                      |
                                      v
                        [PROJECT-LEVEL EXPORT STAGE]
                       (Via Local WebSocket / MCP Server)
                                      |
                                      v
                             [ vais CLI (Node) ]
                                      |
                                      v
                .ai-staging/audio/    <-- (Audio WAV files)
                .ai-staging/feedback/ <-- (Generated Markdown Recipes)
```

---

## 3. Design Tokens

The staging interface utilizes premium visual styles, a modern dark-themed scheme with glassmorphic elements, and a clean spacing structure. The following CSS variables define the design tokens:

### 3.1. Spacing Tokens
```css
:root {
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;
}
```

### 3.2. Color Tokens (HSL Variables)
```css
:root {
  --color-bg-primary: hsl(220, 15%, 10%);     /* Deep space dark background */
  --color-bg-secondary: hsl(220, 15%, 16%);   /* Panel card dark background */
  --color-text-primary: hsl(220, 10%, 95%);   /* Crisp off-white text */
  --color-text-secondary: hsl(220, 10%, 70%); /* Muted slate text for labels */
  --color-accent: hsl(210, 100%, 50%);        /* Electric blue accent for inspection */
  --color-violet: hsl(270, 80%, 60%);         /* Deep violet accent for canvas bounding boxes */
}
```

### 3.3. Border & Border Radius Tokens
```css
:root {
  --border-radius-sm: 4px;
  --border-radius-md: 8px;
  --border-radius-lg: 12px;
}
```

---

## 4. Milestones & Roadmap

The development of **Visual AI Staging** is structured in three major phases. The schedule and current status of each milestone are detailed below:

### Phase 1: Web Engine & Sandbox (100% DONE)
All core web elements and visual sandbox features have been successfully developed, integrated, and verified:

| Milestone ID | Title | Status | Description |
| :--- | :--- | :--- | :--- |
| **Milestone 1** | Setup & Initialization | **DONE** | Directories created; PROJECT.md structured; design system declared. |
| **Milestone 2** | R1 Sandbox Visual Interactiva | **DONE** | DOM Mock Page, lateral panel sliders, styles staging, and real-time DOM overrides. |
| **Milestone 3** | R2 Lienzo de Bounding Box Vectorial | **DONE** | SVG/Canvas drawing overlay, spatial calculations, and nearest parent anchoring. |
| **Milestone 4** | R3 Grabador de Audio y Badges | **DONE** | Micro-recording system, file references in `.ai-staging/audio`, and DOM indicator badges. |
| **Milestone 5** | R4 Compilador de Prompts y Copiado | **DONE** | Generating structured Markdown recipes, system pre-prompt compiler, and copy utilities. |
| **Milestone 6** | Final Review & Quality Integration | **DONE** | End-to-end flow checks, floating FAB integration, and quality assurance audit reports. |

---

### Phase 2: Local CLI Companion & Voice Transcription (PLANNED)
*Goal: Bridge the Sandbox UI with the physical filesystem and enable real-time audio transcription.*

| Milestone ID | Title | Status | Target Timeline / Stage | Description |
| :--- | :--- | :--- | :--- | :--- |
| **Milestone 7** | CLI Daemon setup (`vais dev`) | *PLANNED* | Phase 2 - Stage 1 | Implement Node.js CLI to run local daemon and open a hot WebSocket communication channel. |
| **Milestone 8** | Hot File Persistence | *PLANNED* | Phase 2 - Stage 2 | Replace browser manual downloads with automated physical writes to local `.ai-staging/audio/` and `.ai-staging/feedback/`. |
| **Milestone 9** | Whisper Voice Transcription | *PLANNED* | Phase 2 - Stage 3 | Integrate local Whisper API or OS native dictation APIs to convert speech recording to plain text inside prompt recipes. |
| **Milestone 10** | Active Sessions Register | *PLANNED* | Phase 2 - Stage 4 | Write to central `~/.vais/active_sessions.json` to allow multi-repo resolution based on browser port matching. |

---

### Phase 3: WebExtension Packaging & AST Patching (PLANNED)
*Goal: Turn the sandbox into a real browser extension and automate source code modifications.*

| Milestone ID | Title | Status | Target Timeline / Stage | Description |
| :--- | :--- | :--- | :--- | :--- |
| **Milestone 11** | Manifest V3 Packaging | *PLANNED* | Phase 3 - Stage 1 | Create WebExtension structures (manifest.json, background workers) to load the Staging Panel on any local/remote tab. |
| **Milestone 12** | AST Parser & Zero-LLM Direct Path | *PLANNED* | Phase 3 - Stage 2 | Build local AST parser and Zero-LLM Direct Path to let developers apply visual slider changes instantly to physical files without IA. |
| **Milestone 13** | AI-Assisted AST Mod (Diffs) | *PLANNED* | Phase 3 - Stage 3 | Inject complex design modifications and raw component drawings through AI-generated Git diff proposals. |
| **Milestone 14** | Visual Regression Overlay | *PLANNED* | Phase 3 - Stage 4 | Overlay original staging outlines on the post-patched actual DOM to visually verify design pixel alignment. |

---

## 5. Interface Contracts & API Design (app.js)

The application logic inside `app.js` will export and interact through the following Javascript methods and state variables:

### 5.1. Global State Variables
*   `activeElement`: The DOM element currently selected by the user for style staging.
*   `inspectionMode`: Boolean flag (`true` if hovering/selecting elements in DOM Inspector mode).
*   `drawingMode`: Boolean flag (`true` if drawing bounding boxes on the vector canvas overlay).
*   `recordingMode`: Boolean flag (`true` if recording voice annotations via the Audio Recorder).
*   `stagedChanges`: Map of selectors to lists of staged properties (e.g., `padding`, `background-color`, audio file references, and text notes).

### 5.2. Functional Interfaces

#### `initInspector()`
Initializes Event Listeners on the Mock Page, sets up canvas bounds, and hooks the lateral staging sliders.

#### `toggleInspectionMode(forceState)`
Activates or deactivates the DOM inspection mouse-listeners. Updates the floating action button (FAB) state indicator color (e.g. `var(--color-accent)`).

#### `selectElement(element)`
Triggered when an element on the Mock Page is clicked during inspector mode.
*   Runs `window.getComputedStyle(element)`.
*   Fills the Lateral Staging Panel with current values (padding, margins, color, size, text).
*   Updates `activeElement` reference.

#### `updateElementStyle(property, value)`
Updates a style attribute directly in the inline styles of the `activeElement`.
*   Maps raw pixels (e.g. `15.8px`) to the nearest Design Token variable (e.g. `var(--spacing-md)`) if applicable.
*   Stores the original vs modified value in `stagedChanges`.

#### `startDrawing(event)`
Initiates a bounding box capture when clicking and dragging on the canvas overlay.
*   Saves the initial mouse coordinates `(X1, Y1)`.

#### `stopDrawing(event)`
Concludes the bounding box draw.
*   Calculates bounding box boundaries.
*   Runs `document.elementFromPoint` to find the nearest structural container (parent).
*   Registers a new spatial annotation in `stagedChanges` with options for quick templates (e.g., "Insert Form").

#### `startAudioRecording()`
Requests microphone access via `navigator.mediaDevices.getUserMedia` and records voice feedback.

#### `saveAudio(audioBlob)`
Saves the recorded audio chunk locally in `.ai-staging/audio/` (mocked in browser via ObjectURL, downloadable, or linked to local storage) and appends a file path reference to the active element. Creates a DOM badge visual indicator.

#### `generateMarkdownRecipe()`
Compiles all staged changes, text notes, spatial annotations, and audio references into a unified Markdown prompt matching the structured pre-prompt template. Writes the markdown to the clipboard or saves it under `.ai-staging/feedback/`.
