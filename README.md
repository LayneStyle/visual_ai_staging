# Visual AI Staging Companion (Phase 1: Web Engine & Sandbox)
## Quick Testing Guide & User Manual

This repository contains the functional, production-ready prototype of **Phase 1 and Phase 2 of the Visual AI Staging Companion**. The system is built utilizing modern web standards (Vanilla HTML5, CSS3, and ES6+ JavaScript), guaranteeing zero external dependencies in production, XSS mitigation, and full compliance with strict Content Security Policies (CSP) without any inline scripts or styles.

---

## 1. How to Test the Application Instantly

Since the frontend is built entirely on native web APIs, **no compilation, bundlers, or complex configurations are required to get started.**

### Step 1: Run the Interactive Web Interface
1. Open your web browser (Google Chrome or any Chromium-based browser is recommended).
2. Double-click the `index.html` file in the project directory, or drag and drop it into an empty browser tab:
   * File path: `d:\Github Repos\Extensiones_Ideas\visual_ai_staging\index.html`

### Step 2: Run the Local Native Server (CLI)
You can launch the native development server to test physical file writing and API communication:
1. Open your terminal in the project directory:
   ```bash
   cd "d:\Github Repos\Extensiones_Ideas\visual_ai_staging"
   ```
2. Initialize the server using Node.js:
   ```bash
   node cli.js dev
   ```
3. Open your browser and navigate to `http://localhost:3000/`. The client will now communicate in real-time with the local backend to write feedback and audio files directly to your hard drive.

### Step 3: Run the Programmatic Regression Test Suites
To verify that the state machine, badge anchors, and prompt compiler are running correctly:
1. Open your terminal in the project directory and run the verification suites:
   ```bash
   node verify_r3.js
   node verify_r4.js
   ```
Both test suites will report a **100% [PASS]** in your console.

---

## 2. Step-by-Step Feature Walkthrough

Once the interface is loaded in your browser, follow this step-by-step user manual to test the features:

### A. DOM Inspection & Visual Sandbox
1. **Activate Inspector:** In the top header bar, click **"🔍 Inspection Mode"** (or open the floating action button menu in the bottom-right corner `⚡` and select *"Toggle Inspector Mode"*). Your mouse cursor will change to indicate selection mode.
2. **Hover Elements:** Move your cursor over the left panel (**DOM Mock Page**). You will see buttons, titles, cards, and sections highlighted with dashed HSL blue outlines.
3. **Select an Element:** Click any element (e.g., the primary blue button *"Launch Sandbox"*).
4. **Modify Styles in Hot Memory:**
   * Look at the right sidebar. It now displays precise metadata (Tag Name, Classes, unique CSS Selector, and Semantic Component Type).
   * Drag the **Padding, Margin, Width, Height, Border Radius, and Font Size** sliders. The target element on the left will resize smoothly in real-time.
   * Edit the text inside **"Text Content"** to change the node's text.
   * Modify **Background and Text Colors** by dragging the H (Hue), S (Saturation), and L (Lightness) color sliders.
5. **Smart Design Token Mapping:** Move the Padding or Border Radius sliders. When reaching common sizes (like `8px` or `16px`), a token badge (e.g., `--spacing-sm` or `--border-radius-md`) will pop up automatically. This shows that the engine maps raw pixels to standard project design tokens.
6. **Review Staged Changes:** Check the **"Staged Changes"** list in the bottom-right sidebar. You will see a list of CSS rules detailing modified elements, their selectors, and the original vs. modified values.
7. **Revert Style Overrides:** Click the red **"Revert"** button on any staged change card to restore the element's original styles instantly.

### B. Spatial Annotations & Bounding Boxes (Free-Zone Drawing)
1. **Activate Drawing Mode:** Click **"📐 Free-Zone Drawing"** in the top header.
2. **Draw a Zone:** Click and drag your mouse over any empty area or component on the Mock Page. A rectangular box with dotted purple vector guides will appear.
3. **Resolve Parent DOM Container:** Upon releasing the mouse, a glassmorphic configuration modal opens. It displays the absolute coordinates of the area and **automatically resolves the nearest structural parent container** (e.g. `section.mock-hero` or `div.feature-grid`) using a semantic scale search algorithm.
4. **Configure Component Insertion:** Select a component template (e.g., *Carousel Slider*), write design specifications (e.g., *"Insert a customer logo grid here"*), and click **"Confirm Insertion"**.
5. **Review Staged Inserts:** The drawing layer will clear, and a purple insertion card will be logged in the sidebar list showing the resolved parent selector and your custom notes.

### C. Voice Notes & Floating DOM Badges
1. **Select an Element:** Use the inspection mode to select any element.
2. **Start Recording:** Locate the microphone area in the sidebar and click **"Record Voice Note"** (allow microphone permissions in the browser if prompted).
3. **Speak Your Feedback:** A red pulsing wave animation and a timer will appear. Record a short directive (e.g., *"Make this button stand out with a soft glassmorphic gradient and increase padding"*).
4. **Stop Recording:** Click **"Stop Recording"**.
   * A native audio player will appear in the sidebar allowing you to play back your message.
   * A small microphone floating badge (`🎤`) will be anchored **directly above** the affected element on the left viewport.
   * **Relative Position Guardrail:** If the target element has a `static` CSS positioning, the engine temporarily injects `position: relative` to ensure the badge anchors perfectly without breaking layouts.

### D. Prompt Compiling & Local Hot-Persistence
1. **Open Quick Action Menu:** Click the bottom-right floating action button (`⚡`).
2. **Copy AI Recipe Prompt:** Click **"Copy AI Recipe Prompt"** to copy the compiled Markdown to your clipboard (a toast notification will verify the copy).
3. **Verify the Prompt Structure:** Paste the clipboard into a text editor. You will see a robust System Pre-prompt followed by a structured list of exact selector modifications, design tokens, bounding box insertions, and absolute filesystem paths to the voice recordings.
4. **Automated Disk Writing (Hot-Persistence):** 
   * When connected to the local CLI server (`node cli.js dev`), saving a voice note or exporting the prompt recipe will automatically write the binary `.wav` files to `.ai-staging/audio/` and the compiled markdown reports to `.ai-staging/feedback/` silently without browser download dialogs.
   * If the local server is disconnected, the system falls back to standard browser downloads.

---

## 3. Codebase Structure

The project has a modular, lightweight structure:
*   `index.html` — Staging interface layout and DOM Mock Page.
*   `styles.css` — Global dark-themed glassmorphic tokens, sandbox styling, and animation guides.
*   `app.js` — Core state machine, DOM inspector, SVG drawing algorithms, voice recorder, and prompt compiler.
*   `cli.js` — Native Node.js CLI binary executable and secure development HTTP/WebSocket local server.
*   `.npmignore` — Rigid NPM packaging exclusions to prevent publishing agent metadata or test logs.
*   `.github/workflows/publish.yml` — GitHub Actions automated CI/CD pipeline with unit-test checkpoints.
*   `documentacion/` — Folder containing architecture specs and guides (ignored by Git for privacy).
