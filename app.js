/* ==========================================================================
   GLOBAL STATE VARIABLES (Defined in PROJECT.md)
   ========================================================================== */
const state = {
  activeElement: null,
  focusRoot: null,       // Root elements focused inside Mock Page
  floatingWindow: null,  // Detached pop-out window object reference
  inspectionMode: false,
  drawingMode: false,
  recordingMode: false,
  stagedChanges: new Map() // Maps selector -> { element, originalStyles, currentStyles }
};

const isLocalServer = typeof window !== 'undefined' && window.location && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");


/* ==========================================================================
   DESIGN TOKENS MAPPING DICTIONARIES
   ========================================================================== */
const spacingTokens = {
  4: 'var(--spacing-xs)',
  8: 'var(--spacing-sm)',
  16: 'var(--spacing-md)',
  24: 'var(--spacing-lg)',
  32: 'var(--spacing-xl)'
};

const borderRadiusTokens = {
  4: 'var(--border-radius-sm)',
  8: 'var(--border-radius-md)',
  12: 'var(--border-radius-lg)'
};

/* ==========================================================================
   UTILITY FUNCTIONS
   ========================================================================== */

/**
 * Generates a unique CSS selector for a DOM element within #mock-page context
 */
function getUniqueSelector(el) {
  if (!(el instanceof Element)) return '';
  const path = [];
  let current = el;
  
  while (current && current.nodeType === Node.ELEMENT_NODE) {
    let selector = current.nodeName.toLowerCase();
    
    if (current.id) {
      selector += '#' + current.id;
      path.unshift(selector);
      break;
    } else {
      let sibling = current;
      let nth = 1;
      while (sibling = sibling.previousElementSibling) {
        if (sibling.nodeName.toLowerCase() === current.nodeName.toLowerCase()) {
          nth++;
        }
      }
      if (nth > 1) {
        selector += `:nth-of-type(${nth})`;
      }
    }
    path.unshift(selector);
    current = current.parentElement;
    if (current && current.id === 'mock-page') {
      path.unshift('#mock-page');
      break;
    }
  }
  return path.join(' > ');
}

/**
 * Classifies an element into the standardized UI Catalog types for rich semantics
 */
function classifyUIElement(el) {
  if (!(el instanceof Element)) return { category: 'Other', label: 'Generic Element', icon: '⚙️' };
  
  const tagName = el.tagName.toLowerCase();
  const classListStr = Array.from(el.classList).join(' ').toLowerCase();
  
  // 1. Layout & Navbar
  if (tagName === 'nav' || classListStr.includes('nav') || classListStr.includes('menu')) {
    return { category: 'Layout', label: 'Navbar / Navigation Bar', icon: '🧭' };
  }
  if (tagName === 'header' || classListStr.includes('hero') || classListStr.includes('banner')) {
    return { category: 'Layout', label: 'Hero / Header Section', icon: '🚀' };
  }
  if (tagName === 'footer' || classListStr.includes('footer')) {
    return { category: 'Layout', label: 'Footer Section', icon: '🏁' };
  }
  if (classListStr.includes('grid') || classListStr.includes('flex')) {
    return { category: 'Layout', label: 'Grid / Flex Container', icon: '🎛️' };
  }
  if (classListStr.includes('card')) {
    return { category: 'Layout', label: 'Container / Card Component', icon: '📦' };
  }
  
  // 2. Interactive & Forms
  if (tagName === 'button' || classListStr.includes('btn') || classListStr.includes('button')) {
    return { category: 'Interactive', label: 'Interactive Button', icon: '🔘' };
  }
  if (tagName === 'form' || classListStr.includes('form')) {
    return { category: 'Interactive', label: 'Form Container', icon: '📝' };
  }
  if (tagName === 'input' && el.type === 'search' || classListStr.includes('search')) {
    return { category: 'Interactive', label: 'Search Bar', icon: '🔍' };
  }
  if (tagName === 'input' || tagName === 'textarea') {
    return { category: 'Interactive', label: 'Form Input / Area', icon: '✏️' };
  }
  if (tagName === 'select' || classListStr.includes('dropdown')) {
    return { category: 'Interactive', label: 'Dropdown / Select', icon: '⌥' };
  }
  
  // 3. Media & Content
  if (tagName === 'img' || classListStr.includes('image') || classListStr.includes('img') || classListStr.includes('placeholder')) {
    return { category: 'Media', label: 'Image Placeholder', icon: '🖼️' };
  }
  if (classListStr.includes('carousel') || classListStr.includes('slider')) {
    return { category: 'Media', label: 'Carousel Slider', icon: '🎡' };
  }
  if (tagName === 'video' || classListStr.includes('video') || classListStr.includes('player')) {
    return { category: 'Media', label: 'Video Player', icon: '🎥' };
  }
  if (classListStr.includes('avatar') || classListStr.includes('profile')) {
    return { category: 'Media', label: 'User Avatar / Badge', icon: '👤' };
  }
  
  // 4. WebApp Advanced
  if (classListStr.includes('modal') || classListStr.includes('dialog')) {
    return { category: 'WebApp', label: 'Modal / Dialog Window', icon: '💬' };
  }
  if (classListStr.includes('tab')) {
    return { category: 'WebApp', label: 'Tabs Layout', icon: '📑' };
  }
  if (classListStr.includes('accordion') || classListStr.includes('faq')) {
    return { category: 'WebApp', label: 'Accordion / FAQ List', icon: '📂' };
  }
  if (classListStr.includes('chart') || classListStr.includes('graph') || classListStr.includes('analytics')) {
    return { category: 'WebApp', label: 'Analytics Chart Card', icon: '📊' };
  }
  if (tagName === 'table' || classListStr.includes('table') || classListStr.includes('grid-data')) {
    return { category: 'WebApp', label: 'Data Table Grid', icon: '📅' };
  }
  
  // 5. Basic Text Elements
  const textTypes = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
  if (textTypes.includes(tagName)) {
    return { category: 'Text', label: `Heading ${tagName.toUpperCase()}`, icon: '🏷️' };
  }
  if (tagName === 'p') {
    return { category: 'Text', label: 'Paragraph Block', icon: '📇' };
  }
  if (tagName === 'span' || tagName === 'em' || tagName === 'strong') {
    return { category: 'Text', label: 'Inline Text Element', icon: '🔤' };
  }
  if (tagName === 'a') {
    return { category: 'Text', label: 'Interactive Link', icon: '🔗' };
  }
  
  // Default Generic
  const isContainer = ['div', 'section', 'article', 'aside', 'main', 'body'].includes(tagName);
  return {
    category: isContainer ? 'Container' : 'Other',
    label: isContainer ? 'Generic Layout Container' : `Element <${tagName}>`,
    icon: isContainer ? '🗂️' : '⚙️'
  };
}

/**
 * Maps numeric style values to nearest Design Token variables if applicable
 */
function mapToToken(property, valueNum) {
  const rounded = Math.round(valueNum);
  if (property === 'padding' || property === 'margin') {
    for (const size of [4, 8, 16, 24, 32]) {
      if (Math.abs(rounded - size) <= 1.5) {
        return spacingTokens[size];
      }
    }
  }
  if (property === 'borderRadius') {
    for (const size of [4, 8, 12]) {
      if (Math.abs(rounded - size) <= 1.5) {
        return borderRadiusTokens[size];
      }
    }
  }
  return null;
}

/**
 * Parses RGB or RGBA string into separate numeric color channels
 */
function parseRgb(rgbStr) {
  if (!rgbStr || rgbStr === 'transparent') {
    return { r: 0, g: 0, b: 0, a: 0 };
  }
  const matches = rgbStr.match(/\d+(\.\d+)?/g);
  if (!matches) {
    return { r: 0, g: 0, b: 0, a: 1 };
  }
  return {
    r: parseInt(matches[0], 10),
    g: parseInt(matches[1], 10),
    b: parseInt(matches[2], 10),
    a: matches[3] !== undefined ? parseFloat(matches[3]) : 1
  };
}

/**
 * Converts RGB components to HSL values
 */
function rgbToHsl(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  let l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  };
}

/* ==========================================================================
   INSPECTOR ENGINE
   ========================================================================== */

/**
 * Initializes mouse event listeners inside mock page for style inspection
 */
function initInspector() {
  const mockPage = document.getElementById('mock-page');
  if (!mockPage) return;

  mockPage.addEventListener('mouseover', (e) => {
    if (!state.inspectionMode) return;
    e.stopPropagation();
    
    // Clean prior hover highlights
    const priorHovered = mockPage.querySelectorAll('.inspect-hovered');
    priorHovered.forEach(el => el.classList.remove('inspect-hovered'));
    
    // Do not highlight the root mock page itself
    if (e.target !== mockPage) {
      e.target.classList.add('inspect-hovered');
    }
  });

  mockPage.addEventListener('mouseout', (e) => {
    if (!state.inspectionMode) return;
    e.stopPropagation();
    if (e.target !== mockPage) {
      e.target.classList.remove('inspect-hovered');
    }
  });

  mockPage.addEventListener('click', (e) => {
    if (!state.inspectionMode) return;
    e.preventDefault();
    e.stopPropagation();
    
    if (e.target !== mockPage) {
      e.target.classList.remove('inspect-hovered');
      selectElement(e.target);
      // Keep inspection mode active so developer can continuously inspect
    }
  });
}

/**
 * Enables or disables the hover listener state in DOM mock container
 */
function toggleInspectionMode(forceState) {
  const targetState = forceState !== undefined ? forceState : !state.inspectionMode;
  state.inspectionMode = targetState;

  const btnInspect = document.getElementById('btn-inspect');
  const fab = document.getElementById('fab-trigger');

  if (targetState) {
    // If drawing mode is active, turn it off
    if (state.drawingMode) {
      toggleDrawingMode(false);
    }
    if (btnInspect) btnInspect.classList.add('active');
    if (fab) fab.classList.add('inspect-active');
  } else {
    if (btnInspect) btnInspect.classList.remove('active');
    if (fab) fab.classList.remove('inspect-active');
    
    // Cleanup any lingering hover outlines
    const mockPage = document.getElementById('mock-page');
    if (mockPage) {
      const priorHovered = mockPage.querySelectorAll('.inspect-hovered');
      priorHovered.forEach(el => el.classList.remove('inspect-hovered'));
    }
  }
}

/**
 * Filters visible Visual Sandbox slider controls based on the selected element's DOM type
 */
function filterSlidersByElementType(element) {
  if (!element) return;
  const tagName = element.tagName.toLowerCase();
  
  const textTypes = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'span', 'a', 'label', 'li', 'em', 'strong'];
  const containerTypes = ['div', 'section', 'header', 'footer', 'nav', 'article', 'aside', 'main', 'form', 'ul', 'ol', 'body'];
  const interactiveTypes = ['button', 'input', 'select', 'textarea'];
  const imageTypes = ['img', 'svg'];

  const getWrapper = (id, selector) => {
    const el = document.getElementById(id);
    if (!el) return null;
    if (typeof el.closest === 'function') {
      return el.closest(selector);
    }
    // Fallback safe representation for custom Node testing mocks
    return el.parentElement || el;
  };

  const sliderWrappers = {
    padding: getWrapper('slider-padding', '.control-group'),
    margin: getWrapper('slider-margin', '.control-group'),
    width: getWrapper('slider-width', '.control-group'),
    height: getWrapper('slider-height', '.control-group'),
    borderRadius: getWrapper('slider-borderRadius', '.control-group'),
    fontSize: getWrapper('slider-fontSize', '.control-group'),
    textContent: getWrapper('input-textContent', '.control-group'),
    background: getWrapper('bg-h', '.color-control-box'),
    text: getWrapper('text-h', '.color-control-box')
  };

  let activeProps = [];
  if (textTypes.includes(tagName)) {
    activeProps = ['margin', 'fontSize', 'text', 'textContent'];
  } else if (containerTypes.includes(tagName)) {
    activeProps = ['padding', 'margin', 'width', 'height', 'borderRadius', 'background', 'textContent'];
  } else if (interactiveTypes.includes(tagName)) {
    activeProps = ['padding', 'borderRadius', 'fontSize', 'background', 'text', 'width', 'height', 'textContent'];
  } else if (imageTypes.includes(tagName)) {
    activeProps = ['margin', 'width', 'height', 'borderRadius'];
  } else {
    activeProps = ['padding', 'margin', 'width', 'height', 'borderRadius', 'fontSize', 'background', 'text', 'textContent'];
  }

  for (const [prop, el] of Object.entries(sliderWrappers)) {
    if (el) {
      if (activeProps.includes(prop)) {
        el.classList.remove('hidden');
      } else {
        el.classList.add('hidden');
      }
    }
  }
}

/**
 * Renders a recursive expandable hierarchy tree of children elements within state.focusRoot
 */
function renderHierarchyTree(rootElement) {
  const container = document.getElementById('hierarchy-tree-container');
  if (!container) return;
  
  container.innerHTML = '';
  
  if (!rootElement) {
    return;
  }
  
  // Recursively traverse and build nodes programmatically for strict XSS mitigation
  function buildTreeNode(el, depth = 0) {
    if (!(el instanceof Element)) return;
    if (el.id === 'canvas-overlay' || el.classList.contains('voice-badge')) return;

    const nodeRow = document.createElement('div');
    nodeRow.className = 'tree-node';
    nodeRow.style.paddingLeft = `${depth * 12 + 8}px`;
    
    if (el === state.focusRoot) {
      nodeRow.classList.add('focus-root');
    }
    if (el === state.activeElement) {
      nodeRow.classList.add('active-leaf');
    }
    
    // Expand/collapse decorator icon representation
    const hasChildren = Array.from(el.children).filter(c => c.id !== 'canvas-overlay' && !c.classList.contains('voice-badge')).length > 0;
    const arrow = document.createElement('span');
    arrow.className = 'tree-arrow';
    arrow.textContent = hasChildren ? '▼' : '•';
    nodeRow.appendChild(arrow);
    
    // Tag and Classes
    const tagSpan = document.createElement('span');
    tagSpan.className = 'tree-tag';
    tagSpan.textContent = el.tagName.toLowerCase();
    nodeRow.appendChild(tagSpan);
    
    const classList = Array.from(el.classList)
      .filter(c => c !== 'inspect-selected' && c !== 'inspect-hovered' && c !== 'inspect-focus-root')
      .map(c => '.' + c)
      .join('');
    
    if (classList) {
      const classSpan = document.createElement('span');
      classSpan.className = 'tree-class';
      classSpan.textContent = classList.slice(0, 18) + (classList.length > 18 ? '...' : '');
      classSpan.title = classList;
      nodeRow.appendChild(classSpan);
    }
    
    // Badge indicator if child has modifications staged or audios
    const elSelector = getUniqueSelector(el);
    if (state.stagedChanges.has(elSelector)) {
      const entry = state.stagedChanges.get(elSelector);
      const hasStyleChanges = Object.keys(entry.currentStyles).some(p => entry.currentStyles[p] !== entry.originalStyles[p]);
      if (entry.voiceNote || hasStyleChanges) {
        const badge = document.createElement('span');
        badge.className = 'tree-badge';
        badge.textContent = entry.voiceNote ? '🎤 +' : '+';
        nodeRow.appendChild(badge);
      }
    }
    
    // Click selection handles dynamic overlays
    nodeRow.addEventListener('click', (e) => {
      e.stopPropagation();
      selectElement(el, true);
    });
    
    container.appendChild(nodeRow);
    
    // Process nested layers
    Array.from(el.children).forEach(child => {
      buildTreeNode(child, depth + 1);
    });
  }
  
  buildTreeNode(rootElement, 0);
}

/**
 * Handles docking/undocking pop-out window actions
 */
function toggleUndockPanel() {
  if (state.floatingWindow && !state.floatingWindow.closed) {
    dockPanel();
  } else {
    undockPanel();
  }
}

/**
 * Detaches the staging panel into a secondary window for multi-monitor setups
 */
function undockPanel() {
  if (state.floatingWindow && !state.floatingWindow.closed) {
    state.floatingWindow.focus();
    return;
  }

  const w = 465;
  const h = 850;
  const left = window.screenX + (window.innerWidth - w) / 2;
  const top = window.screenY + (window.innerHeight - h) / 2;
  
  state.floatingWindow = window.open('', 'vais_staging_panel', `width=${w},height=${h},left=${left},top=${top},resizable=yes,scrollbars=yes`);
  
  if (!state.floatingWindow) {
    alert("Popup blocked! Please allow popups to undock the staging panel.");
    return;
  }

  const doc = state.floatingWindow.document;
  doc.open();
  doc.write(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Visual AI Staging - Floating Panel</title>
      <link rel="stylesheet" href="styles.css">
      <style>
        body {
          padding: var(--spacing-sm);
          background: hsl(220, 15%, 10%);
          color: hsl(220, 10%, 95%);
          overflow-y: auto;
          height: auto;
        }
        .staging-panel {
          width: 100% !important;
          height: 100% !important;
          position: static !important;
          box-shadow: none !important;
          border: none !important;
          backdrop-filter: none !important;
          display: block !important;
        }
      </style>
    </head>
    <body>
      <div id="floating-panel-target"></div>
    </body>
    </html>
  `);
  doc.close();

  // Hide the panel in the original document and expand viewport
  const mainPanel = document.getElementById('main-staging-panel');
  const mockContainer = document.querySelector('.mock-page-container');
  const appLayout = document.querySelector('.app-layout');
  if (mainPanel) mainPanel.classList.add('docked-hidden');
  if (mockContainer) mockContainer.classList.add('full-width');
  if (appLayout) appLayout.classList.add('undocked');
  
  // Clone HTML structure to floating window target
  const panelContent = document.getElementById('main-staging-panel').innerHTML;
  const target = doc.getElementById('floating-panel-target');
  target.innerHTML = panelContent;

  // Toggle undock action label inside floating panel
  const undockBtn = doc.getElementById('btn-undock-panel');
  if (undockBtn) {
    undockBtn.innerHTML = '<span>📥</span> Acoplar';
    undockBtn.title = 'Acoplar panel de vuelta';
  }

  // Setup dynamic interactive event bindings inside popup context
  setupFloatingWindowListeners(doc);

  // Synchronize state attributes
  syncFloatingWindowDOM();

  // Floating window close synchronization
  state.floatingWindow.addEventListener('beforeunload', () => {
    if (state.floatingWindow && !state.floatingWindow.closed) {
      setTimeout(dockPanel, 50);
    }
  });
  
  // Update parent button state indicator
  const parentUndockBtn = document.getElementById('btn-undock-panel');
  if (parentUndockBtn) {
    parentUndockBtn.innerHTML = '<span>📥</span> Acoplado';
    parentUndockBtn.disabled = true;
  }
}

/**
 * Re-docks the staging panel cleanly to the main develop viewport
 */
function dockPanel() {
  if (state.floatingWindow) {
    if (!state.floatingWindow.closed) {
      state.floatingWindow.close();
    }
    state.floatingWindow = null;
  }

  // Restore parent layouts
  const mainPanel = document.getElementById('main-staging-panel');
  const mockContainer = document.querySelector('.mock-page-container');
  const appLayout = document.querySelector('.app-layout');
  if (mainPanel) mainPanel.classList.remove('docked-hidden');
  if (mockContainer) mockContainer.classList.remove('full-width');
  if (appLayout) appLayout.classList.remove('undocked');

  const parentUndockBtn = document.getElementById('btn-undock-panel');
  if (parentUndockBtn) {
    parentUndockBtn.innerHTML = '<span>↗️</span> Desacoplar';
    parentUndockBtn.disabled = false;
  }

  // Re-sync visual sandbox states
  if (state.activeElement) {
    selectElement(state.activeElement, state.activeElement !== state.focusRoot);
  } else {
    const emptyContainer = document.getElementById('meta-container');
    if (emptyContainer) emptyContainer.classList.remove('hidden');
    const details = document.getElementById('meta-details');
    if (details) details.classList.add('hidden');
  }
}

/**
 * Sets up slider and voice note event actions inside popup window
 */
function setupFloatingWindowListeners(doc) {
  const undockBtn = doc.getElementById('btn-undock-panel');
  if (undockBtn) {
    undockBtn.addEventListener('click', () => {
      dockPanel();
    });
  }

  // Visual Sandbox Sliders
  const sliders = [
    { id: 'slider-padding', property: 'padding' },
    { id: 'slider-margin', property: 'margin' },
    { id: 'slider-width', property: 'width' },
    { id: 'slider-height', property: 'height' },
    { id: 'slider-borderRadius', property: 'borderRadius' },
    { id: 'slider-fontSize', property: 'fontSize' }
  ];
  
  sliders.forEach(s => {
    const el = doc.getElementById(s.id);
    if (el) {
      el.addEventListener('input', (e) => {
        handleSliderChange(s.property, e.target.value);
      });
    }
  });

  // Text Content Input
  const textInput = doc.getElementById('input-textContent');
  if (textInput) {
    textInput.addEventListener('input', (e) => {
      updateElementTextContent(e.target.value);
    });
  }

  // Colors Background Sliders
  ['bg-h', 'bg-s', 'bg-l'].forEach(id => {
    const el = doc.getElementById(id);
    if (el) {
      el.addEventListener('input', () => {
        handleColorChange('background', doc);
      });
    }
  });

  // Colors Text Sliders
  ['text-h', 'text-s', 'text-l'].forEach(id => {
    const el = doc.getElementById(id);
    if (el) {
      el.addEventListener('input', () => {
        handleColorChange('text', doc);
      });
    }
  });

  // Voice Note actions
  const btnVoiceRecord = doc.getElementById('btn-voice-record');
  if (btnVoiceRecord) {
    btnVoiceRecord.addEventListener('click', () => {
      if (state.recordingMode) {
        stopAudioRecording();
      } else {
        startAudioRecording();
      }
    });
  }

  const btnVoiceDelete = doc.getElementById('btn-voice-delete');
  if (btnVoiceDelete) {
    btnVoiceDelete.addEventListener('click', () => {
      deleteVoiceNote();
    });
  }
}

/**
 * Synchronizes variable adjustments from parent context directly into popup document DOM
 */
function syncFloatingWindowDOM() {
  if (!state.floatingWindow || state.floatingWindow.closed) return;
  
  const fDoc = state.floatingWindow.document;

  // Sync element metadata details
  const metaContainer = fDoc.getElementById('meta-container');
  const details = fDoc.getElementById('meta-details');
  if (metaContainer && details) {
    if (!state.activeElement) {
      metaContainer.classList.remove('hidden');
      details.classList.add('hidden');
    } else {
      metaContainer.classList.add('hidden');
      details.classList.remove('hidden');
      
      const metaTag = fDoc.getElementById('meta-tag');
      const metaClasses = fDoc.getElementById('meta-classes');
      const metaSelector = fDoc.getElementById('meta-selector');
      const metaUiType = fDoc.getElementById('meta-ui-type');
      
      if (metaTag) metaTag.textContent = state.activeElement.tagName.toLowerCase();
      if (metaClasses) {
        const classList = Array.from(state.activeElement.classList)
          .filter(c => c !== 'inspect-selected' && c !== 'inspect-hovered' && c !== 'inspect-focus-root')
          .map(c => '.' + c)
          .join(' ');
        metaClasses.textContent = classList || '(none)';
      }
      if (metaSelector) metaSelector.textContent = getUniqueSelector(state.activeElement);
      
      if (metaUiType) {
        const classification = classifyUIElement(state.activeElement);
        metaUiType.textContent = `${classification.icon} ${classification.label}`;
      }
    }
  }

  // Sync numeric sliders and spacing tokens
  const sliders = ['padding', 'margin', 'width', 'height', 'borderRadius', 'fontSize'];
  sliders.forEach(prop => {
    const parentSlider = document.getElementById(`slider-${prop}`);
    const fSlider = fDoc.getElementById(`slider-${prop}`);
    const fVal = fDoc.getElementById(`val-${prop}`);
    const fToken = fDoc.getElementById(`token-${prop}`);
    
    if (parentSlider && fSlider) {
      fSlider.min = parentSlider.min;
      fSlider.max = parentSlider.max;
      fSlider.value = parentSlider.value;
    }
    if (fVal) {
      fVal.textContent = document.getElementById(`val-${prop}`).textContent;
    }
    if (fToken) {
      const parentToken = document.getElementById(`token-${prop}`);
      if (parentToken.classList.contains('hidden')) {
        fToken.classList.add('hidden');
      } else {
        fToken.classList.remove('hidden');
        fToken.textContent = parentToken.textContent;
      }
    }
  });

  // Sync text content input value
  const parentTextInput = document.getElementById('input-textContent');
  const fTextInput = fDoc.getElementById('input-textContent');
  if (parentTextInput && fTextInput) {
    fTextInput.value = parentTextInput.value;
  }

  // Sync color sliders and previews
  const syncColors = (type) => {
    ['h', 's', 'l'].forEach(chan => {
      const pInput = document.getElementById(`${type}-${chan}`);
      const fInput = fDoc.getElementById(`${type}-${chan}`);
      const fVal = fDoc.getElementById(`${type}-${chan}-val`);
      if (pInput && fInput) {
        fInput.value = pInput.value;
      }
      if (fVal) {
        fVal.textContent = document.getElementById(`${type}-${chan}-val`).textContent;
      }
    });
    const fPreview = fDoc.getElementById(`${type}-preview`);
    const fHslStr = fDoc.getElementById(`${type}-hsl-string`);
    if (fPreview) fPreview.style.backgroundColor = document.getElementById(`${type}-preview`).style.backgroundColor;
    if (fHslStr) fHslStr.textContent = document.getElementById(`${type}-hsl-string`).textContent;
  };
  
  syncColors('bg');
  syncColors('text');

  // Sync voice panel recorder state
  const btnVoiceRecord = fDoc.getElementById('btn-voice-record');
  const btnVoiceDelete = fDoc.getElementById('btn-voice-delete');
  const voiceStatusContainer = fDoc.getElementById('voice-status-container');
  const voiceAudioPlayerContainer = fDoc.getElementById('voice-audio-player-container');
  const voiceAudioPlayer = fDoc.getElementById('voice-audio-player');
  const recordBtnText = fDoc.getElementById('record-btn-text');

  if (btnVoiceRecord) {
    if (!state.activeElement) {
      btnVoiceRecord.disabled = true;
      btnVoiceRecord.classList.remove('recording');
      if (recordBtnText) recordBtnText.textContent = 'Record Voice Note';
      if (btnVoiceDelete) btnVoiceDelete.classList.add('hidden');
      if (voiceStatusContainer) voiceStatusContainer.classList.add('hidden');
      if (voiceAudioPlayerContainer) voiceAudioPlayerContainer.classList.add('hidden');
    } else {
      btnVoiceRecord.disabled = false;
      const selector = getUniqueSelector(state.activeElement);
      const entry = state.stagedChanges.get(selector);

      if (state.recordingMode) {
        btnVoiceRecord.classList.add('recording');
        if (recordBtnText) recordBtnText.textContent = 'Stop Recording';
        if (btnVoiceDelete) btnVoiceDelete.classList.add('hidden');
        if (voiceStatusContainer) {
          voiceStatusContainer.classList.remove('hidden');
          fDoc.getElementById('voice-timer').textContent = document.getElementById('voice-timer').textContent;
        }
        if (voiceAudioPlayerContainer) voiceAudioPlayerContainer.classList.add('hidden');
      } else if (entry && entry.voiceNote) {
        btnVoiceRecord.classList.remove('recording');
        if (recordBtnText) recordBtnText.textContent = 'Re-record Voice Note';
        if (btnVoiceDelete) btnVoiceDelete.classList.remove('hidden');
        if (voiceStatusContainer) voiceStatusContainer.classList.add('hidden');
        if (voiceAudioPlayerContainer) {
          voiceAudioPlayerContainer.classList.remove('hidden');
          if (voiceAudioPlayer && voiceAudioPlayer.src !== entry.voiceNote.url) {
            voiceAudioPlayer.src = entry.voiceNote.url;
          }
        }
      } else {
        btnVoiceRecord.classList.remove('recording');
        if (recordBtnText) recordBtnText.textContent = 'Record Voice Note';
        if (btnVoiceDelete) btnVoiceDelete.classList.add('hidden');
        if (voiceStatusContainer) voiceStatusContainer.classList.add('hidden');
        if (voiceAudioPlayerContainer) voiceAudioPlayerContainer.classList.add('hidden');
      }
    }
  }

  // Apply slider category filters in popup document
  if (state.activeElement) {
    const tagName = state.activeElement.tagName.toLowerCase();
    const textTypes = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'span', 'a', 'label', 'li', 'em', 'strong'];
    const containerTypes = ['div', 'section', 'header', 'footer', 'nav', 'article', 'aside', 'main', 'form', 'ul', 'ol', 'body'];
    const interactiveTypes = ['button', 'input', 'select', 'textarea'];
    const imageTypes = ['img', 'svg'];

    const fSliderWrappers = {
      padding: fDoc.getElementById('slider-padding').closest('.control-group'),
      margin: fDoc.getElementById('slider-margin').closest('.control-group'),
      width: fDoc.getElementById('slider-width').closest('.control-group'),
      height: fDoc.getElementById('slider-height').closest('.control-group'),
      borderRadius: fDoc.getElementById('slider-borderRadius').closest('.control-group'),
      fontSize: fDoc.getElementById('slider-fontSize').closest('.control-group'),
      textContent: fDoc.getElementById('input-textContent').closest('.control-group'),
      background: fDoc.getElementById('bg-h').closest('.color-control-box'),
      text: fDoc.getElementById('text-h').closest('.color-control-box')
    };

    let activeProps = [];
    if (textTypes.includes(tagName)) {
      activeProps = ['margin', 'fontSize', 'text', 'textContent'];
    } else if (containerTypes.includes(tagName)) {
      activeProps = ['padding', 'margin', 'width', 'height', 'borderRadius', 'background', 'textContent'];
    } else if (interactiveTypes.includes(tagName)) {
      activeProps = ['padding', 'borderRadius', 'fontSize', 'background', 'text', 'width', 'height', 'textContent'];
    } else if (imageTypes.includes(tagName)) {
      activeProps = ['margin', 'width', 'height', 'borderRadius'];
    } else {
      activeProps = ['padding', 'margin', 'width', 'height', 'borderRadius', 'fontSize', 'background', 'text', 'textContent'];
    }

    for (const [prop, el] of Object.entries(fSliderWrappers)) {
      if (el) {
        if (activeProps.includes(prop)) {
          el.classList.remove('hidden');
        } else {
          el.classList.add('hidden');
        }
      }
    }
  }

  // Copy changes list markup
  const fStagedList = fDoc.getElementById('staged-changes-list');
  if (fStagedList) {
    fStagedList.innerHTML = document.getElementById('staged-changes-list').innerHTML;
    // Re-bind revert click handlers inside popup document context
    fStagedList.querySelectorAll('.revert-btn').forEach(btn => {
      const item = btn.closest('.change-item');
      if (item) {
        const selectorSpan = item.querySelector('.change-selector');
        if (selectorSpan) {
          const title = selectorSpan.title;
          const label = selectorSpan.textContent;
          btn.addEventListener('click', () => {
            if (label.includes('[Insert:')) {
              const boxIdStr = label.match(/#(\d+)/)[1];
              deleteBoundingBox(parseInt(boxIdStr, 10));
            } else {
              revertAllChangesFor(title);
            }
            syncFloatingWindowDOM();
          });
        }
      }
    });
  }

  // Copy DOM hierarchy tree markup and bind select actions
  const fTreeContainer = fDoc.getElementById('hierarchy-tree-container');
  if (fTreeContainer) {
    fTreeContainer.innerHTML = document.getElementById('hierarchy-tree-container').innerHTML;
    fTreeContainer.querySelectorAll('.tree-node').forEach((node, idx) => {
      node.addEventListener('click', (e) => {
        e.stopPropagation();
        const parentNodes = document.querySelectorAll('#hierarchy-tree-container .tree-node');
        if (parentNodes[idx]) {
          parentNodes[idx].click();
        }
      });
    });
  }
}

/**
 * Sets slider visual state and initializes computed styles
 */
function setupSlider(property, value, min, max) {
  const slider = document.getElementById(`slider-${property}`);
  const display = document.getElementById(`val-${property}`);
  const tokenBadge = document.getElementById(`token-${property}`);
  
  if (slider) {
    slider.min = min;
    slider.max = max;
    slider.value = value;
  }
  
  if (display) {
    display.textContent = Math.round(value) + 'px';
  }
  
  const token = mapToToken(property, Math.round(value));
  if (token && tokenBadge) {
    tokenBadge.textContent = token.replace('var(', '').replace(')', '');
    tokenBadge.classList.remove('hidden');
  } else if (tokenBadge) {
    tokenBadge.classList.add('hidden');
  }
}

/**
 * Extracts and maps color elements into HSL inputs
 */
function setupColorSliders(type, colorRgb) {
  const parsed = parseRgb(colorRgb);
  const hsl = rgbToHsl(parsed.r, parsed.g, parsed.b);
  
  const idPrefix = type === 'background' ? 'bg' : type;
  
  const hInput = document.getElementById(`${idPrefix}-h`);
  const sInput = document.getElementById(`${idPrefix}-s`);
  const lInput = document.getElementById(`${idPrefix}-l`);
  
  if (hInput) hInput.value = hsl.h;
  if (sInput) sInput.value = hsl.s;
  if (lInput) lInput.value = hsl.l;
  
  const hVal = document.getElementById(`${idPrefix}-h-val`);
  const sVal = document.getElementById(`${idPrefix}-s-val`);
  const lVal = document.getElementById(`${idPrefix}-l-val`);
  
  if (hVal) hVal.textContent = hsl.h;
  if (sVal) sVal.textContent = hsl.s + '%';
  if (lVal) lVal.textContent = hsl.l + '%';
  
  const preview = document.getElementById(`${idPrefix}-preview`);
  const textStr = document.getElementById(`${idPrefix}-hsl-string`);
  const hslStr = `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
  
  if (preview) preview.style.backgroundColor = hslStr;
  if (textStr) textStr.textContent = hslStr;
}

/**
 * Executes getComputedStyle on clicked mock element and registers properties
 */
function selectElement(element, isChildSelection = false) {
  const mockPage = document.getElementById('mock-page');
  
  // Clear previous outlines
  if (state.activeElement) {
    state.activeElement.classList.remove('inspect-selected');
  }
  if (state.focusRoot) {
    state.focusRoot.classList.remove('inspect-focus-root');
  }
  
  if (!isChildSelection) {
    state.focusRoot = element;
  }
  
  state.activeElement = element;
  
  // Apply visual outline overlays
  if (state.focusRoot && state.activeElement && state.focusRoot !== state.activeElement) {
    state.focusRoot.classList.add('inspect-focus-root');
    state.activeElement.classList.add('inspect-selected');
  } else {
    element.classList.add('inspect-selected');
  }
  
  const computed = window.getComputedStyle(element);
  
  // Open details display
  const emptyContainer = document.getElementById('meta-container');
  if (emptyContainer) emptyContainer.classList.add('hidden');
  
  const details = document.getElementById('meta-details');
  if (details) details.classList.remove('hidden');
  
  const metaTag = document.getElementById('meta-tag');
  if (metaTag) metaTag.textContent = element.tagName.toLowerCase();
  
  // Gather class lists cleanly
  const classList = Array.from(element.classList)
    .filter(c => c !== 'inspect-selected' && c !== 'inspect-hovered' && c !== 'inspect-focus-root')
    .map(c => '.' + c)
    .join(' ');
  const metaClasses = document.getElementById('meta-classes');
  if (metaClasses) metaClasses.textContent = classList || '(none)';
  
  const selector = getUniqueSelector(element);
  const metaSelector = document.getElementById('meta-selector');
  if (metaSelector) metaSelector.textContent = selector;
  
  // Classify element semantically
  const classification = classifyUIElement(element);
  const metaUiType = document.getElementById('meta-ui-type');
  if (metaUiType) {
    metaUiType.textContent = `${classification.icon} ${classification.label}`;
  }
  
  // Register entry inside staged changes dictionary
  if (!state.stagedChanges.has(selector)) {
    state.stagedChanges.set(selector, {
      element: element,
      originalStyles: {},
      currentStyles: {}
    });
  }
  
  const getNumericValue = (styleVal) => {
    const val = parseFloat(styleVal);
    return isNaN(val) ? 0 : val;
  };
  
  // Populate sliders with baseline dimensions
  setupSlider('padding', getNumericValue(computed.paddingTop || computed.padding), 0, 100);
  setupSlider('margin', getNumericValue(computed.marginTop || computed.margin), 0, 100);
  setupSlider('width', getNumericValue(computed.width), 50, 1000);
  setupSlider('height', getNumericValue(computed.height), 10, 800);
  setupSlider('borderRadius', getNumericValue(computed.borderRadius), 0, 100);
  setupSlider('fontSize', getNumericValue(computed.fontSize), 8, 72);
  
  // Populate Color parameters
  setupColorSliders('background', computed.backgroundColor);
  setupColorSliders('text', computed.color);
  
  // Populate Text Content input
  const textInput = document.getElementById('input-textContent');
  if (textInput) {
    textInput.value = element.textContent.trim();
  }
  
  // Filter sliders by selected element type
  filterSlidersByElementType(element);
  
  // Render dynamic expandable DOM tree hierarchy
  renderHierarchyTree(state.focusRoot);
  
  // Update lateral panel voice controls
  updateVoicePanel();
  
  // Sync pop-out window state if undocked
  if (state.floatingWindow) {
    syncFloatingWindowDOM();
  }
}

/* ==========================================================================
   SANDBOX MUTATION CONTROLLER
   ========================================================================== */

/**
 * Performs inline overrides on dynamic selected element property
 */
function updateElementStyle(property, value) {
  if (!state.activeElement) return;
  
  const selector = getUniqueSelector(state.activeElement);
  const entry = state.stagedChanges.get(selector);
  
  // Cache original element state style before updates
  if (!(property in entry.originalStyles)) {
    entry.originalStyles[property] = state.activeElement.style[property] || window.getComputedStyle(state.activeElement)[property];
  }
  
  // Update current overrides
  entry.currentStyles[property] = value;
  
  // Write actual rule directly to target element style in hot memory
  state.activeElement.style[property] = value;
  
  // Update lateral staging changes list
  renderStagedChanges();
}

/**
 * Performs inline overrides on dynamic selected element textContent
 */
function updateElementTextContent(value) {
  if (!state.activeElement) return;
  
  const selector = getUniqueSelector(state.activeElement);
  const entry = state.stagedChanges.get(selector);
  
  // Cache original element text value before updates
  if (!('textContent' in entry.originalStyles)) {
    entry.originalStyles['textContent'] = entry.element.textContent;
  }
  
  // Update overrides
  entry.currentStyles['textContent'] = value;
  
  // Write directly to target element textContent in hot memory
  state.activeElement.textContent = value;
  
  // Update input text value in both documents
  const docs = [document];
  if (state.floatingWindow && !state.floatingWindow.closed) {
    docs.push(state.floatingWindow.document);
  }
  docs.forEach(doc => {
    const textInput = doc.getElementById('input-textContent');
    if (textInput && textInput.value !== value) {
      textInput.value = value;
    }
  });
  
  // Update lateral changes panel and floating pop-out window
  renderStagedChanges();
  if (state.floatingWindow) {
    syncFloatingWindowDOM();
  }
}

/**
 * Receives input updates from visual sliders and maps tokens
 */
function handleSliderChange(property, value) {
  const valueNum = parseFloat(value);
  let displayValue = value + 'px';
  let applyValue = displayValue;
  
  const token = mapToToken(property, valueNum);
  if (token) {
    applyValue = token;
  }
  
  // List of active documents to update in real-time
  const docs = [document];
  if (state.floatingWindow && !state.floatingWindow.closed) {
    docs.push(state.floatingWindow.document);
  }
  
  docs.forEach(doc => {
    const slider = doc.getElementById(`slider-${property}`);
    if (slider) {
      slider.value = value;
    }
    
    const tokenBadge = doc.getElementById(`token-${property}`);
    if (tokenBadge) {
      if (token) {
        tokenBadge.textContent = token.replace('var(', '').replace(')', '');
        tokenBadge.classList.remove('hidden');
      } else {
        tokenBadge.classList.add('hidden');
      }
    }
    
    const numDisplay = doc.getElementById(`val-${property}`);
    if (numDisplay) {
      numDisplay.textContent = displayValue;
    }
  });
  
  if (property === 'width' || property === 'height' || property === 'fontSize') {
    applyValue = value + 'px';
  }
  
  updateElementStyle(property, applyValue);
}

/**
 * Handles color sliders change events
 */
function handleColorChange(type, sourceDoc) {
  if (!state.activeElement) return;
  
  // Resolve source document to read from (default to active window if not specified)
  const readDoc = sourceDoc || ((state.floatingWindow && !state.floatingWindow.closed) ? state.floatingWindow.document : document);
  
  // Map 'background' to 'bg' to match index.html IDs
  const idPrefix = type === 'background' ? 'bg' : type;
  
  const hInput = readDoc.getElementById(`${idPrefix}-h`);
  const sInput = readDoc.getElementById(`${idPrefix}-s`);
  const lInput = readDoc.getElementById(`${idPrefix}-l`);
  
  if (!hInput || !sInput || !lInput) return;
  
  const h = hInput.value;
  const s = sInput.value;
  const l = lInput.value;
  
  const hslStr = `hsl(${h}, ${s}%, ${l}%)`;
  
  // List of active documents to update in real-time
  const docs = [document];
  if (state.floatingWindow && !state.floatingWindow.closed) {
    docs.push(state.floatingWindow.document);
  }
  
  docs.forEach(doc => {
    const hi = doc.getElementById(`${idPrefix}-h`);
    const si = doc.getElementById(`${idPrefix}-s`);
    const li = doc.getElementById(`${idPrefix}-l`);
    if (hi) hi.value = h;
    if (si) si.value = s;
    if (li) li.value = l;
    
    const hVal = doc.getElementById(`${idPrefix}-h-val`);
    const sVal = doc.getElementById(`${idPrefix}-s-val`);
    const lVal = doc.getElementById(`${idPrefix}-l-val`);
    if (hVal) hVal.textContent = h;
    if (sVal) sVal.textContent = s + '%';
    if (lVal) lVal.textContent = l + '%';
    
    const preview = doc.getElementById(`${idPrefix}-preview`);
    const textStr = doc.getElementById(`${idPrefix}-hsl-string`);
    if (preview) preview.style.backgroundColor = hslStr;
    if (textStr) textStr.textContent = hslStr;
  });
  
  const styleProp = type === 'background' ? 'backgroundColor' : 'color';
  updateElementStyle(styleProp, hslStr);
}

/* ==========================================================================
   LOCAL AUDIO RECORDER & MICROPHONE BADGES ENGINE (Milestone 4)
   ========================================================================== */

let mediaStream = null;
let mediaRecorder = null;
let audioChunks = [];
let recordingSeconds = 0;
let timerInterval = null;

/**
 * Updates the Lateral Staging Panel controls based on state
 */
function updateVoicePanel() {
  const btnVoiceRecord = document.getElementById('btn-voice-record');
  const btnVoiceDelete = document.getElementById('btn-voice-delete');
  const voiceStatusContainer = document.getElementById('voice-status-container');
  const voiceAudioPlayerContainer = document.getElementById('voice-audio-player-container');
  const voiceAudioPlayer = document.getElementById('voice-audio-player');
  const recordBtnText = document.getElementById('record-btn-text');

  if (!btnVoiceRecord) return;

  if (!state.activeElement) {
    btnVoiceRecord.disabled = true;
    btnVoiceRecord.classList.remove('recording');
    if (recordBtnText) recordBtnText.textContent = 'Record Voice Note';
    if (btnVoiceDelete) btnVoiceDelete.classList.add('hidden');
    if (voiceStatusContainer) voiceStatusContainer.classList.add('hidden');
    if (voiceAudioPlayerContainer) voiceAudioPlayerContainer.classList.add('hidden');
    if (voiceAudioPlayer) voiceAudioPlayer.src = '';
    return;
  }

  btnVoiceRecord.disabled = false;
  const selector = getUniqueSelector(state.activeElement);
  const entry = state.stagedChanges.get(selector);

  if (state.recordingMode) {
    btnVoiceRecord.classList.add('recording');
    if (recordBtnText) recordBtnText.textContent = 'Stop Recording';
    if (btnVoiceDelete) btnVoiceDelete.classList.add('hidden');
    if (voiceStatusContainer) voiceStatusContainer.classList.remove('hidden');
    if (voiceAudioPlayerContainer) voiceAudioPlayerContainer.classList.add('hidden');
  } else if (entry && entry.voiceNote) {
    btnVoiceRecord.classList.remove('recording');
    if (recordBtnText) recordBtnText.textContent = 'Re-record Voice Note';
    if (btnVoiceDelete) btnVoiceDelete.classList.remove('hidden');
    if (voiceStatusContainer) voiceStatusContainer.classList.add('hidden');
    if (voiceAudioPlayerContainer) {
      voiceAudioPlayerContainer.classList.remove('hidden');
      if (voiceAudioPlayer && voiceAudioPlayer.src !== entry.voiceNote.url) {
        voiceAudioPlayer.src = entry.voiceNote.url;
      }
    }
  } else {
    btnVoiceRecord.classList.remove('recording');
    if (recordBtnText) recordBtnText.textContent = 'Record Voice Note';
    if (btnVoiceDelete) btnVoiceDelete.classList.add('hidden');
    if (voiceStatusContainer) voiceStatusContainer.classList.add('hidden');
    if (voiceAudioPlayerContainer) voiceAudioPlayerContainer.classList.add('hidden');
    if (voiceAudioPlayer) voiceAudioPlayer.src = '';
  }
}

/**
 * Starts audio recording via navigator.mediaDevices.getUserMedia
 */
function startAudioRecording() {
  if (!state.activeElement || state.recordingMode) return;

  navigator.mediaDevices.getUserMedia({ audio: true })
    .then(stream => {
      mediaStream = stream;
      state.recordingMode = true;
      audioChunks = [];

      // Detect support and use appropriate format
      let options = { mimeType: 'audio/webm' };
      if (!MediaRecorder.isTypeSupported('audio/webm')) {
        options = { mimeType: 'audio/ogg' };
      }
      if (!MediaRecorder.isTypeSupported('audio/ogg')) {
        options = {}; // Fallback
      }

      mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const mime = mediaRecorder.mimeType || 'audio/wav';
        const blob = new Blob(audioChunks, { type: mime });
        saveVoiceNote(blob);
      };

      recordingSeconds = 0;
      const timerEl = document.getElementById('voice-timer');
      if (timerEl) timerEl.textContent = '00:00';

      timerInterval = setInterval(() => {
        recordingSeconds++;
        const mins = String(Math.floor(recordingSeconds / 60)).padStart(2, '0');
        const secs = String(recordingSeconds % 60).padStart(2, '0');
        if (timerEl) timerEl.textContent = `${mins}:${secs}`;
      }, 1000);

      mediaRecorder.start();
      updateVoicePanel();
    })
    .catch(err => {
      console.error('Microphone permissions or API error:', err);
      alert('Could not access microphone. Please verify site permissions.');
    });
}

/**
 * Stops ongoing voice recording session
 */
function stopAudioRecording() {
  if (!state.recordingMode || !mediaRecorder) return;

  state.recordingMode = false;
  mediaRecorder.stop();
  
  if (mediaStream) {
    mediaStream.getTracks().forEach(track => track.stop());
  }

  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }

  updateVoicePanel();
}

/**
 * Creates Object URL and local files references, registering them under target elements
 */
function saveVoiceNote(blob) {
  if (!state.activeElement) return;

  const selector = getUniqueSelector(state.activeElement);
  const entry = state.stagedChanges.get(selector);
  if (!entry) return;

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const timestamp = `${year}-${month}-${day}_${hours}${minutes}${seconds}`;
  const filename = `${timestamp}_feedback.wav`;

  // Local absolute save simulation path
  const absolutePath = `d:\\Github Repos\\Extensiones_Ideas\\visual_ai_staging\\.ai-staging\\audio\\${filename}`;
  const urlPath = `file:///d:/Github%20Repos/Extensiones_Ideas/visual_ai_staging/.ai-staging/audio/${filename}`;

  const audioUrl = URL.createObjectURL(blob);

  // Register voice note inside element state
  entry.voiceNote = {
    url: audioUrl,
    absolutePath: absolutePath,
    urlPath: urlPath,
    filename: filename
  };

  const fallbackDownload = () => {
    // User-downloadable workspace fallback saving via programmatic click
    const downloadAnchor = document.createElement('a');
    downloadAnchor.href = audioUrl;
    downloadAnchor.download = filename;
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  if (isLocalServer) {
    fetch(`/api/save-audio?filename=${encodeURIComponent(filename)}`, {
      method: 'POST',
      body: blob
    })
    .then(res => {
      if (!res.ok) {
        fallbackDownload();
      }
    })
    .catch(err => {
      fallbackDownload();
    });
  } else {
    fallbackDownload();
  }

  renderStagedChanges();
  updateVoicePanel();
}

/**
 * Deletes voice note for the active selector element
 */
function deleteVoiceNote() {
  if (!state.activeElement) return;

  const selector = getUniqueSelector(state.activeElement);
  const entry = state.stagedChanges.get(selector);
  if (!entry) return;

  if (entry.voiceNote) {
    URL.revokeObjectURL(entry.voiceNote.url);
    delete entry.voiceNote;
  }

  // If there are no other visual modifications, clean selector
  const hasStyleChanges = Object.keys(entry.currentStyles).some(
    prop => entry.currentStyles[prop] !== entry.originalStyles[prop]
  );
  if (!hasStyleChanges) {
    state.stagedChanges.delete(selector);
  }

  renderStagedChanges();
  updateVoicePanel();
}

/**
 * Reactively draws/erases microphone floating DOM badges above targeted elements
 */
function updateVoiceBadges() {
  // Clear all previous badges and restore static positioning if necessary
  const existingBadges = document.querySelectorAll('.voice-badge');
  existingBadges.forEach(badge => {
    const parent = badge.parentElement;
    if (parent) {
      if (parent.dataset.originalPosition === 'static') {
        parent.style.position = '';
        delete parent.dataset.originalPosition;
      }
      badge.remove();
    }
  });

  // Re-render voice badges on any active element with a staged voice note
  state.stagedChanges.forEach((changeData, selector) => {
    if (changeData.type !== 'insertion' && changeData.voiceNote && changeData.element) {
      const el = changeData.element;
      const computedStyle = window.getComputedStyle(el);
      
      if (computedStyle.position === 'static') {
        el.dataset.originalPosition = 'static';
        el.style.position = 'relative';
      }

      const badge = document.createElement('div');
      badge.className = 'voice-badge';
      badge.textContent = '🎤';
      badge.title = 'Voice note annotation staged';
      
      el.appendChild(badge);
    }
  });
}

/**
 * Renders staged variations live in the right Lateral Panel
 */
function renderStagedChanges() {
  const container = document.getElementById('staged-changes-list');
  if (!container) return;
  
  container.innerHTML = '';
  let count = 0;
  
  state.stagedChanges.forEach((changeData, selector) => {
    // If it's a Free-Zone Bounding Box Insertion
    if (changeData.type === 'insertion') {
      count++;
      const changeEl = document.createElement('div');
      changeEl.className = 'change-item change-item-insertion';
      
      const headerEl = document.createElement('div');
      headerEl.className = 'change-header';
      
      const selectorSpan = document.createElement('span');
      selectorSpan.className = 'change-selector';
      selectorSpan.textContent = `[Insert: ${changeData.template}]`;
      selectorSpan.title = `Inserted inside: ${changeData.parentSelector}`;
      
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'revert-btn';
      deleteBtn.textContent = 'Delete';
      deleteBtn.addEventListener('click', () => {
        deleteBoundingBox(changeData.boxId);
      });
      
      headerEl.appendChild(selectorSpan);
      headerEl.appendChild(deleteBtn);
      
      const bodyEl = document.createElement('div');
      bodyEl.className = 'change-body';
      
      // Parent Container
      const parentEl = document.createElement('div');
      parentEl.className = 'change-prop';
      
      const parentNameSpan = document.createElement('span');
      parentNameSpan.className = 'prop-name';
      parentNameSpan.textContent = 'Parent: ';
      
      const parentValSpan = document.createElement('span');
      parentValSpan.className = 'prop-val-new';
      parentValSpan.style.fontFamily = 'monospace';
      parentValSpan.style.fontSize = '11px';
      parentValSpan.textContent = changeData.parentSelector.split(' > ').pop();
      
      parentEl.appendChild(parentNameSpan);
      parentEl.appendChild(parentValSpan);
      bodyEl.appendChild(parentEl);
      
      // Size
      const dimsEl = document.createElement('div');
      dimsEl.className = 'change-prop';
      
      const dimsNameSpan = document.createElement('span');
      dimsNameSpan.className = 'prop-name';
      dimsNameSpan.textContent = 'Dimensions: ';
      
      const dimsValSpan = document.createElement('span');
      dimsValSpan.className = 'prop-val-new';
      dimsValSpan.style.color = 'var(--color-violet)';
      dimsValSpan.style.fontFamily = 'monospace';
      dimsValSpan.textContent = `${Math.round(changeData.width)}px × ${Math.round(changeData.height)}px`;
      
      dimsEl.appendChild(dimsNameSpan);
      dimsEl.appendChild(dimsValSpan);
      bodyEl.appendChild(dimsEl);
      
      // Notes
      if (changeData.notes) {
        const notesEl = document.createElement('div');
        notesEl.className = 'change-prop';
        notesEl.style.flexDirection = 'column';
        notesEl.style.alignItems = 'flex-start';
        
        const notesNameSpan = document.createElement('span');
        notesNameSpan.className = 'prop-name';
        notesNameSpan.textContent = 'Notes:';
        
        const notesValSpan = document.createElement('span');
        notesValSpan.className = 'prop-val-new';
        notesValSpan.style.color = 'var(--color-text-secondary)';
        notesValSpan.style.fontFamily = 'inherit';
        notesValSpan.style.fontWeight = 'normal';
        notesValSpan.style.marginTop = '2px';
        notesValSpan.textContent = changeData.notes;
        
        notesEl.appendChild(notesNameSpan);
        notesEl.appendChild(notesValSpan);
        bodyEl.appendChild(notesEl);
      }
      
      changeEl.appendChild(headerEl);
      changeEl.appendChild(bodyEl);
      container.appendChild(changeEl);
      return;
    }

    const changePropElements = [];
    let hasVisibleChanges = false;
    
    for (const [prop, val] of Object.entries(changeData.currentStyles)) {
      const origVal = changeData.originalStyles[prop];
      if (origVal === val) continue;
      
      hasVisibleChanges = true;
      
      const propEl = document.createElement('div');
      propEl.className = 'change-prop';
      
      const nameSpan = document.createElement('span');
      nameSpan.className = 'prop-name';
      nameSpan.textContent = `${prop}: `;
      
      const oldSpan = document.createElement('span');
      oldSpan.className = 'prop-val-old';
      oldSpan.textContent = origVal;
      
      const arrowSpan = document.createElement('span');
      arrowSpan.className = 'prop-arrow';
      arrowSpan.textContent = ' → ';
      
      const newSpan = document.createElement('span');
      newSpan.className = 'prop-val-new';
      newSpan.textContent = val;
      
      propEl.appendChild(nameSpan);
      propEl.appendChild(oldSpan);
      propEl.appendChild(arrowSpan);
      propEl.appendChild(newSpan);
      
      changePropElements.push(propEl);
    }
    
    // Add voice note indicator if present in lateral changes panel
    if (changeData.voiceNote) {
      hasVisibleChanges = true;
      
      const voicePropEl = document.createElement('div');
      voicePropEl.className = 'change-prop voice-note-indicator';
      
      const voiceIconSpan = document.createElement('span');
      voiceIconSpan.textContent = '🎤';
      
      const voiceTextSpan = document.createElement('span');
      voiceTextSpan.className = 'prop-val-new';
      voiceTextSpan.style.color = 'var(--color-accent)';
      voiceTextSpan.style.fontFamily = 'sans-serif';
      voiceTextSpan.style.fontSize = '12px';
      voiceTextSpan.textContent = 'Voice Note Staged';
      voiceTextSpan.title = changeData.voiceNote.filename;
      
      voicePropEl.appendChild(voiceIconSpan);
      voicePropEl.appendChild(voiceTextSpan);
      changePropElements.push(voicePropEl);
    }
    
    if (!hasVisibleChanges) return;
    count++;
    
    const changeEl = document.createElement('div');
    changeEl.className = 'change-item';
    
    const headerEl = document.createElement('div');
    headerEl.className = 'change-header';
    
    const selectorSpan = document.createElement('span');
    selectorSpan.className = 'change-selector';
    selectorSpan.title = selector;
    selectorSpan.textContent = selector.split(' > ').pop();
    
    const revertBtn = document.createElement('button');
    revertBtn.className = 'revert-btn';
    revertBtn.textContent = 'Revert';
    revertBtn.addEventListener('click', () => {
      revertAllChangesFor(selector);
    });
    
    headerEl.appendChild(selectorSpan);
    headerEl.appendChild(revertBtn);
    
    const bodyEl = document.createElement('div');
    bodyEl.className = 'change-body';
    
    changePropElements.forEach(propEl => {
      bodyEl.appendChild(propEl);
    });
    
    changeEl.appendChild(headerEl);
    changeEl.appendChild(bodyEl);
    
    container.appendChild(changeEl);
  });
  
  if (count === 0) {
    const noChangesEl = document.createElement('div');
    noChangesEl.className = 'no-changes';
    noChangesEl.textContent = 'No staged changes yet. Select an element and adjust properties.';
    container.appendChild(noChangesEl);
  }
  
  // Reactively sync floating microphone DOM badges
  updateVoiceBadges();
}

/**
 * Restores original style characteristics on target element
 */
function revertAllChangesFor(selector) {
  const changeData = state.stagedChanges.get(selector);
  if (!changeData) return;
  
  if (changeData.type === 'insertion') {
    deleteBoundingBox(changeData.boxId);
    return;
  }
  
  // Reapply cached rules directly
  for (const [prop, val] of Object.entries(changeData.originalStyles)) {
    changeData.element.style[prop] = val;
  }
  
  if (changeData.voiceNote) {
    URL.revokeObjectURL(changeData.voiceNote.url);
  }
  
  state.stagedChanges.delete(selector);
  renderStagedChanges();
  
  // If reverted element is the active one, reload sliders
  if (state.activeElement === changeData.element) {
    selectElement(changeData.element);
  }
}

/**
 * Resets the entire visual workspace session back to pristine base
 */
function clearAllStagedChanges() {
  state.stagedChanges.forEach((changeData) => {
    if (changeData.type !== 'insertion' && changeData.element) {
      for (const [prop, val] of Object.entries(changeData.originalStyles)) {
        changeData.element.style[prop] = val;
      }
    }
    if (changeData.voiceNote) {
      URL.revokeObjectURL(changeData.voiceNote.url);
    }
  });
  
  state.stagedChanges.clear();
  renderBoundingBoxes(); // Redraw overlay
  renderStagedChanges();
  
  if (state.activeElement) {
    state.activeElement.classList.remove('inspect-selected');
    state.activeElement = null;
  }
  
  updateVoicePanel();
  
  const emptyContainer = document.getElementById('meta-container');
  if (emptyContainer) emptyContainer.classList.remove('hidden');
  
  const details = document.getElementById('meta-details');
  if (details) details.classList.add('hidden');
}

/* ==========================================================================
   PROMPT COMPILER & EXPORT WORKFLOWS
   ========================================================================== */

/**
 * Builds structured recipe instructions text
 */
/**
 * Helper to format current date/time to YYYY-MM-DD_HHMMSS
 */
function getFormattedTimestamp() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day}_${hours}${minutes}${seconds}`;
}

/**
 * Triggers a programmatic browser download of the compiled Markdown recipe
 */
function triggerFeedbackDownload(recipe) {
  const timestamp = getFormattedTimestamp();
  const filename = `${timestamp}_feedback.md`;
  
  const fallbackDownload = () => {
    const blob = new Blob([recipe], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    
    // CSP/XSS: hide and append to body off-screen programmatically
    anchor.style.position = 'absolute';
    anchor.style.left = '-9999px';
    anchor.style.top = '-9999px';
    
    document.body.appendChild(anchor);
    anchor.click();
    
    // Clean up
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  };

  if (isLocalServer) {
    fetch('/api/save-feedback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ filename: filename, content: recipe })
    })
    .then(res => {
      if (!res.ok) {
        fallbackDownload();
      }
    })
    .catch(err => {
      fallbackDownload();
    });
  } else {
    fallbackDownload();
  }

  return filename;
}

/**
 * Displays a premium visual toast notification in the UI
 */
function showToastNotification(filename, isError = false) {
  // Check if a toast is already on screen and remove it
  const existingToast = document.querySelector('.toast-notification');
  if (existingToast) {
    existingToast.remove();
  }

  const toast = document.createElement('div');
  toast.className = 'toast-notification';

  const header = document.createElement('div');
  header.className = 'toast-header';
  
  const iconSpan = document.createElement('span');
  iconSpan.textContent = isError ? '❌' : '✨';
  header.appendChild(iconSpan);

  const titleSpan = document.createElement('span');
  titleSpan.textContent = isError 
    ? 'Clipboard Access Error' 
    : 'Recipe Prompt Exported!';
  header.appendChild(titleSpan);

  toast.appendChild(header);

  const body = document.createElement('div');
  body.className = 'toast-body';
  
  const p1 = document.createElement('p');
  p1.textContent = isError 
    ? 'Could not copy the prompt automatically to the clipboard, but the recipe file is ready.'
    : 'The compiled recipe prompt was successfully copied to your clipboard.';
  body.appendChild(p1);

  if (filename) {
    const p2 = document.createElement('div');
    p2.className = 'toast-meta';
    
    // We want the text to say it is auto-saved inside the workspace feedback folder
    p2.textContent = `Auto-saved feedback file: .ai-staging/feedback/${filename}`;
    body.appendChild(p2);
  } else {
    const p2 = document.createElement('div');
    p2.className = 'toast-meta';
    p2.textContent = 'Note: No staged changes to save to .ai-staging/feedback/';
    body.appendChild(p2);
  }

  toast.appendChild(body);
  document.body.appendChild(toast);

  // Auto-dim and remove toast after 5 seconds
  setTimeout(() => {
    toast.classList.add('hide');
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 5000);
}

/**
 * Builds structured recipe instructions text
 */
function generateMarkdownRecipe() {
  if (state.stagedChanges.size === 0) {
    return "No changes have been staged in the Visual AI Sandbox.";
  }

  const now = new Date();
  const timestamp = getFormattedTimestamp();
  const fileSavePath = `.ai-staging/feedback/${timestamp}_feedback.md`;

  let markdown = `# SYSTEM PRE-PROMPT (AI DEVELOPER INSTRUCTIONS)
You are an expert AI frontend engineering assistant (e.g., GitHub Copilot, ChatGPT, Gemini). You have been provided with a structured visual staging recipe generated by the Visual AI Staging Companion.
Your task is to implement the specified user interface changes and additions with absolute fidelity, following these precise rules:

1. **Interpret Element Visual Staging**:
   - For each CSS Selector, examine the target tag type and current text.
   - Apply the listed **Visual Styles Requeridos (Staged)**. Note that modified CSS properties have been automatically mapped to design tokens (e.g. \`var(--spacing-md)\`, \`var(--border-radius-lg)\`) where applicable. Do not revert these back to raw pixel values; implement them using the design system variables directly.
   - Pay special attention to the **Developer Notes** and any localized **Voice Note File References** (feedback WAV files). The voice notes contain spoken directives on UX behavior, animation requirements, and detail layout requirements that must be followed.

2. **Interpret Spatial Bounding Box Insertions**:
   - For each Bounding Box Insertion, you must inject/insert a new component or visual zone inside the specified **Resolved Nearest Parent Container**.
   - The **Ubicación Bounding Box (relativa al lienzo)** specifies the relative \`(x, y)\` coordinate offsets and the bounding box dimension guidelines (\`width\` and \`height\` in pixels). Use these to correctly position and scale the newly constructed component within the target layout, utilizing modern responsive layout structures (like CSS Flexbox or Grid) that reflect these dimensions.
   - Construct the layout based on the requested **Preset Type** (e.g., Carousel, Form, Grid, Custom Component) and read the **Developer Notes** for detailed design and functionality constraints.
   - Incorporate any associated voice notes or multimedia references to refine the component's interactive behaviors.

Please apply these updates cleanly, maintaining perfect thematic cohesion (Deep Space Dark glassmorphic design system) and ensuring no regressions are introduced in existing mock page behaviors.

---

# VISUAL AI STAGING RECIPE
- **Target Save Path**: \`${fileSavePath}\`
- **Generated Timestamp**: \`${now.toISOString()}\`

=========================================
DETALLE DE MODIFICACIONES REQUERIDAS (ELEMENT VISUAL STAGING)
=========================================
`;

  let modificationsCount = 0;
  let insertionsCount = 0;
  let insertionsText = `
=========================================
DETALLE DE COMPONENTES A INSERTAR (SPATIAL ANNOTATIONS)
=========================================
`;

  state.stagedChanges.forEach((changeData, selector) => {
    if (changeData.type === 'insertion') {
      insertionsCount++;
      const hasVoiceNote = !!changeData.voiceNote;
      
      insertionsText += `
### Inserción #${changeData.boxId}: ${changeData.template}
- **Preset Type**: ${changeData.template}
- **Resolved Nearest Parent Container Selector**: \`${changeData.parentSelector}\`
- **Ubicación Bounding Box (relativa al lienzo)**: x: ${Math.round(changeData.x)}px, y: ${Math.round(changeData.y)}px, ancho: ${Math.round(changeData.width)}px, alto: ${Math.round(changeData.height)}px
- **Developer Notes**: ${changeData.notes || 'Modificación espacial y zona de componente agregada mediante el Sandbox de Bounding Boxes.'}
`;
      if (hasVoiceNote) {
        insertionsText += `- **Voice Note File Reference**:
  - File: \`${changeData.voiceNote.absolutePath}\`
  - Filename: \`${changeData.voiceNote.filename}\`
  - URL: \`[${changeData.voiceNote.filename}](${changeData.voiceNote.urlPath})\`
`;
      } else {
        insertionsText += `- **Voice Note File Reference**: None\n`;
      }
      insertionsText += `-----------------------------------------\n`;
    } else {
      let propertiesText = '';
      let hasStyleChanges = false;
      
      for (const [prop, val] of Object.entries(changeData.currentStyles)) {
        const origVal = changeData.originalStyles[prop];
        if (origVal === val) continue;
        hasStyleChanges = true;
        propertiesText += `  - \`${prop}\`: "${val}" (original: "${origVal}")\n`;
      }
      
      const hasVoiceNote = !!changeData.voiceNote;
      if (!hasStyleChanges && !hasVoiceNote) return;
      
      modificationsCount++;
      const tagName = changeData.element.tagName.toLowerCase();
      const textVal = changeData.element.innerText || changeData.element.textContent || '';
      const textSnippet = textVal.trim().slice(0, 100) || '(sin texto)';
      
      markdown += `
### Selector: \`${selector}\`
- **Tag Type**: ${tagName}
- **Texto actual**: "${textSnippet}"`;

      if (hasStyleChanges) {
        markdown += `
- **Estilos Visuales Requeridos (Staged)**:
${propertiesText.trim()}`;
      }
      
      markdown += `
- **Developer Notes**: Modificación visual realizada en el Sandbox.`;
      
      if (hasVoiceNote) {
        markdown += `
- **Voice Note File Reference**:
  - **Archivo Local**: \`${changeData.voiceNote.absolutePath}\`
  - **URI de referencia**: [${changeData.voiceNote.filename}](${changeData.voiceNote.urlPath})`;
      } else {
        markdown += `
- **Voice Note File Reference**: None`;
      }
      
      markdown += `
-----------------------------------------
`;
    }
  });

  let finalMarkdown = '';
  if (modificationsCount === 0 && insertionsCount > 0) {
    finalMarkdown = markdown + "\n*(No element style changes staged)*\n" + insertionsText;
  } else if (insertionsCount > 0) {
    finalMarkdown = markdown + insertionsText;
  } else {
    finalMarkdown = markdown;
  }

  return finalMarkdown;
}

/**
 * Copies the compiled system pre-prompt recipe into Clipboard memory and triggers auto-save download
 */
function copyGeneratedPrompt() {
  const recipe = generateMarkdownRecipe();
  
  navigator.clipboard.writeText(recipe).then(() => {
    let filename = '';
    if (state.stagedChanges.size > 0) {
      filename = triggerFeedbackDownload(recipe);
    }
    showToastNotification(filename);
  }).catch((err) => {
    console.error("Clipboard copy error:", err);
    let filename = '';
    if (state.stagedChanges.size > 0) {
      filename = triggerFeedbackDownload(recipe);
    }
    showToastNotification(filename, true);
  });
}

/* ==========================================================================
   FAB & WORKSPACE HELPERS
   ========================================================================== */

/**
 * Toggles circular floating panel details visibility
 */
function toggleFabMenu() {
  const menu = document.getElementById('fab-menu');
  if (menu) {
    menu.classList.toggle('hidden');
  }
}

/**
 * Empty interface skeletons matching Milestones 3 & 4 layout contracts
 */
/* ==========================================================================
   BOUNDING BOX VECTOR OVERLAY & DRAWING SYSTEM
   ========================================================================== */

let isDrawing = false;
let startX = 0;
let startY = 0;
let tempRect = null;
let nextBoxId = 1;
let pendingBoxData = null;

/**
 * Toggles Free-Zone Drawing Mode
 */
function toggleDrawingMode(forceState) {
  const targetState = forceState !== undefined ? forceState : !state.drawingMode;
  state.drawingMode = targetState;
  
  const btnDrawing = document.getElementById('btn-drawing');
  const fab = document.getElementById('fab-trigger');
  const canvasOverlay = document.getElementById('canvas-overlay');
  
  if (targetState) {
    // Disable Inspection Mode if active
    if (state.inspectionMode) {
      toggleInspectionMode(false);
    }
    if (btnDrawing) btnDrawing.classList.add('active');
    if (fab) {
      fab.classList.add('drawing-active');
    }
    if (canvasOverlay) {
      canvasOverlay.classList.add('drawing-active');
    }
  } else {
    if (btnDrawing) btnDrawing.classList.remove('active');
    if (fab) {
      fab.classList.remove('drawing-active');
    }
    if (canvasOverlay) {
      canvasOverlay.classList.remove('drawing-active');
    }
    
    // Clean drawing state
    isDrawing = false;
    if (tempRect) {
      tempRect.remove();
      tempRect = null;
    }
  }
  
  // Render or clear boxes accordingly
  renderBoundingBoxes();
}

/**
 * Finds the nearest container element inside #mock-page sifting upward
 */
function findNearestParentContainer(element) {
  const mockPage = document.getElementById('mock-page');
  if (!mockPage) return null;
  
  let current = element;
  while (current && current !== document.documentElement) {
    if (current === mockPage) {
      return mockPage;
    }
    
    const isSectionOrHeader = ['section', 'header', 'nav', 'article', 'aside', 'footer'].includes(current.tagName.toLowerCase());
    const hasContainerClass = Array.from(current.classList).some(cls => 
      cls.includes('card') || 
      cls.includes('grid') || 
      cls.includes('hero') || 
      cls.includes('section') || 
      cls.includes('container')
    );
    
    if (isSectionOrHeader || hasContainerClass) {
      if (mockPage.contains(current)) {
        return current;
      }
    }
    
    current = current.parentElement;
  }
  return mockPage; // Fallback to mock-page itself
}

/**
 * Handles mouse release after drawing a bounding box
 */
function handleCompletedDraw(x, y, width, height, clientX, clientY) {
  const canvasOverlay = document.getElementById('canvas-overlay');
  if (!canvasOverlay) return;
  
  // Calculate center of drawn rectangle in viewport coordinates
  const rect = canvasOverlay.getBoundingClientRect();
  const centerX = rect.left + x + width / 2;
  const centerY = rect.top + y + height / 2;
  
  // Temporarily disable overlay pointer-events to query underneath
  const originalPointerEvents = canvasOverlay.style.pointerEvents;
  canvasOverlay.style.pointerEvents = 'none';
  
  const elementUnder = document.elementFromPoint(centerX, centerY);
  canvasOverlay.style.pointerEvents = originalPointerEvents;
  
  const parentContainer = findNearestParentContainer(elementUnder);
  const parentSelector = getUniqueSelector(parentContainer);
  
  openDrawingModal(x, y, width, height, parentSelector);
}

/**
 * Opens modal to configure bounding box details
 */
function openDrawingModal(x, y, width, height, parentSelector) {
  pendingBoxData = { x, y, width, height, parentSelector };
  
  const modal = document.getElementById('drawing-modal');
  const selectorDisplay = document.getElementById('modal-resolved-selector');
  const selectPreset = document.getElementById('modal-template-select');
  const notesTextarea = document.getElementById('modal-notes-textarea');
  
  if (selectorDisplay) {
    selectorDisplay.textContent = parentSelector;
  }
  if (selectPreset) {
    selectPreset.value = 'Carrusel de imágenes';
  }
  if (notesTextarea) {
    notesTextarea.value = '';
  }
  
  if (modal) {
    modal.classList.remove('hidden');
  }
}

/**
 * Closes modal and resets pending drawing data
 */
function closeDrawingModal() {
  const modal = document.getElementById('drawing-modal');
  if (modal) {
    modal.classList.add('hidden');
  }
  pendingBoxData = null;
}

/**
 * Confirms bounding box insertion details, saving it to stagedChanges
 */
function confirmDrawingInsertion() {
  if (!pendingBoxData) return;
  
  const selectPreset = document.getElementById('modal-template-select');
  const notesTextarea = document.getElementById('modal-notes-textarea');
  
  const template = selectPreset ? selectPreset.value : 'Carrusel de imágenes';
  const notes = notesTextarea ? notesTextarea.value : '';
  
  const boxId = nextBoxId++;
  const uniqueKey = `[Insertion #${boxId}] inside ${pendingBoxData.parentSelector}`;
  
  state.stagedChanges.set(uniqueKey, {
    type: 'insertion',
    boxId: boxId,
    parentSelector: pendingBoxData.parentSelector,
    template: template,
    notes: notes,
    x: pendingBoxData.x,
    y: pendingBoxData.y,
    width: pendingBoxData.width,
    height: pendingBoxData.height
  });
  
  closeDrawingModal();
  renderBoundingBoxes();
  renderStagedChanges();
}

/**
 * Cancels pending drawing insertion
 */
function cancelDrawingInsertion() {
  closeDrawingModal();
}

/**
 * Deletes a bounding box annotation from staged changes
 */
function deleteBoundingBox(boxId) {
  let targetKey = null;
  state.stagedChanges.forEach((changeData, key) => {
    if (changeData.type === 'insertion' && changeData.boxId === boxId) {
      targetKey = key;
    }
  });
  
  if (targetKey) {
    state.stagedChanges.delete(targetKey);
    renderBoundingBoxes();
    renderStagedChanges();
  }
}

/**
 * Renders all current completed bounding boxes as vector elements on the SVG overlay
 */
function renderBoundingBoxes() {
  const canvasOverlay = document.getElementById('canvas-overlay');
  if (!canvasOverlay) return;
  
  canvasOverlay.innerHTML = '';
  
  // Only display bounding boxes when Drawing Mode is active
  if (!state.drawingMode) return;
  
  state.stagedChanges.forEach((changeData) => {
    if (changeData.type !== 'insertion') return;
    
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('class', 'completed-box-group');
    g.setAttribute('data-box-id', changeData.boxId);
    
    // Bounding Box Rectangle
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('class', 'drawing-rect-completed');
    rect.setAttribute('x', changeData.x);
    rect.setAttribute('y', changeData.y);
    rect.setAttribute('width', changeData.width);
    rect.setAttribute('height', changeData.height);
    
    // Label text content
    const labelTextStr = `#${changeData.boxId}: ${changeData.template}`;
    
    // Label text
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('class', 'drawing-label-text');
    text.setAttribute('x', changeData.x + 8);
    text.setAttribute('y', changeData.y + 11);
    text.style.textAnchor = 'start';
    text.style.dominantBaseline = 'middle';
    text.textContent = labelTextStr;
    
    // Label Background (6.5px per character width approximation + margin)
    const labelWidth = labelTextStr.length * 6.5 + 12;
    const labelHeight = 18;
    const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    bg.setAttribute('class', 'drawing-label-bg');
    bg.setAttribute('x', changeData.x + 2);
    bg.setAttribute('y', changeData.y + 2);
    bg.setAttribute('width', labelWidth);
    bg.setAttribute('height', labelHeight);
    
    g.appendChild(rect);
    g.appendChild(bg);
    g.appendChild(text);
    canvasOverlay.appendChild(g);
  });
}

/* ==========================================================================
   INITIALIZATION
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
  initInspector();
  
  // Bind dynamic event listeners for CSP compliance
  
  // Header Buttons
  const btnInspect = document.getElementById('btn-inspect');
  if (btnInspect) {
    btnInspect.addEventListener('click', () => toggleInspectionMode());
  }
  const btnDrawing = document.getElementById('btn-drawing');
  if (btnDrawing) {
    btnDrawing.addEventListener('click', () => toggleDrawingMode());
  }
  
  // Bounding Box Drawing Interaction
  const canvasOverlay = document.getElementById('canvas-overlay');
  if (canvasOverlay) {
    canvasOverlay.addEventListener('mousedown', (e) => {
      if (!state.drawingMode) return;
      isDrawing = true;
      const rect = canvasOverlay.getBoundingClientRect();
      startX = e.clientX - rect.left;
      startY = e.clientY - rect.top;
      
      tempRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      tempRect.setAttribute('class', 'drawing-rect-temp');
      tempRect.setAttribute('x', startX);
      tempRect.setAttribute('y', startY);
      tempRect.setAttribute('width', 0);
      tempRect.setAttribute('height', 0);
      canvasOverlay.appendChild(tempRect);
    });

    canvasOverlay.addEventListener('mousemove', (e) => {
      if (!isDrawing || !tempRect) return;
      const rect = canvasOverlay.getBoundingClientRect();
      const currentX = e.clientX - rect.left;
      const currentY = e.clientY - rect.top;
      
      const x = Math.min(startX, currentX);
      const y = Math.min(startY, currentY);
      const width = Math.abs(startX - currentX);
      const height = Math.abs(startY - currentY);
      
      tempRect.setAttribute('x', x);
      tempRect.setAttribute('y', y);
      tempRect.setAttribute('width', width);
      tempRect.setAttribute('height', height);
    });

    canvasOverlay.addEventListener('mouseup', (e) => {
      if (!isDrawing) return;
      isDrawing = false;
      if (tempRect) {
        tempRect.remove();
        tempRect = null;
      }
      
      const rect = canvasOverlay.getBoundingClientRect();
      const currentX = e.clientX - rect.left;
      const currentY = e.clientY - rect.top;
      const x = Math.min(startX, currentX);
      const y = Math.min(startY, currentY);
      const width = Math.abs(startX - currentX);
      const height = Math.abs(startY - currentY);
      
      if (width < 10 || height < 10) return;
      
      handleCompletedDraw(x, y, width, height, e.clientX, e.clientY);
    });

    canvasOverlay.addEventListener('mouseleave', () => {
      if (isDrawing) {
        isDrawing = false;
        if (tempRect) {
          tempRect.remove();
          tempRect = null;
        }
      }
    });
  }

  // Modal actions binding
  const btnCloseModal = document.getElementById('btn-close-modal');
  if (btnCloseModal) {
    btnCloseModal.addEventListener('click', cancelDrawingInsertion);
  }
  const btnCancelModal = document.getElementById('btn-cancel-modal');
  if (btnCancelModal) {
    btnCancelModal.addEventListener('click', cancelDrawingInsertion);
  }
  const btnConfirmModal = document.getElementById('btn-confirm-modal');
  if (btnConfirmModal) {
    btnConfirmModal.addEventListener('click', confirmDrawingInsertion);
  }
  
  // Sliders
  const sliders = [
    { id: 'slider-padding', property: 'padding' },
    { id: 'slider-margin', property: 'margin' },
    { id: 'slider-width', property: 'width' },
    { id: 'slider-height', property: 'height' },
    { id: 'slider-borderRadius', property: 'borderRadius' },
    { id: 'slider-fontSize', property: 'fontSize' }
  ];
  sliders.forEach(s => {
    const el = document.getElementById(s.id);
    if (el) {
      el.addEventListener('input', (e) => {
        handleSliderChange(s.property, e.target.value);
      });
    }
  });
  
  // Color Sliders (Background)
  ['bg-h', 'bg-s', 'bg-l'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', () => handleColorChange('background', document));
    }
  });
  
  // Color Sliders (Text)
  ['text-h', 'text-s', 'text-l'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', () => handleColorChange('text', document));
    }
  });

  // Text Content Input
  const textInput = document.getElementById('input-textContent');
  if (textInput) {
    textInput.addEventListener('input', (e) => {
      updateElementTextContent(e.target.value);
    });
  }
  
  // FAB trigger and menu items
  const fabTrigger = document.getElementById('fab-trigger');
  if (fabTrigger) {
    fabTrigger.addEventListener('click', toggleFabMenu);
  }
  const fabInspect = document.getElementById('fab-btn-inspect');
  if (fabInspect) {
    fabInspect.addEventListener('click', () => {
      toggleInspectionMode();
      toggleFabMenu();
    });
  }
  const fabClear = document.getElementById('fab-btn-clear');
  if (fabClear) {
    fabClear.addEventListener('click', () => {
      clearAllStagedChanges();
      toggleFabMenu();
    });
  }
  const fabCopy = document.getElementById('fab-btn-copy');
  if (fabCopy) {
    fabCopy.addEventListener('click', () => {
      copyGeneratedPrompt();
      toggleFabMenu();
    });
  }
  
  // Voice recorder buttons binding
  const btnVoiceRecord = document.getElementById('btn-voice-record');
  if (btnVoiceRecord) {
    btnVoiceRecord.addEventListener('click', () => {
      if (state.recordingMode) {
        stopAudioRecording();
      } else {
        startAudioRecording();
      }
    });
  }

  const btnVoiceDelete = document.getElementById('btn-voice-delete');
  if (btnVoiceDelete) {
    btnVoiceDelete.addEventListener('click', deleteVoiceNote);
  }

  // Undock Panel Trigger Action
  const btnUndockPanel = document.getElementById('btn-undock-panel');
  if (btnUndockPanel) {
    btnUndockPanel.addEventListener('click', toggleUndockPanel);
  }

  // Sincronización al cerrar la pestaña principal (seguro para entorno de pruebas Node)
  if (typeof window.addEventListener === 'function') {
    window.addEventListener('beforeunload', () => {
      if (state.floatingWindow && !state.floatingWindow.closed) {
        state.floatingWindow.close();
      }
    });
  }
  
  // Mock page navigation links
  document.querySelectorAll('.mock-nav-links a, .mock-nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
    });
  });
  
  // Bind all necessary actions to window context for backward compatibility and test access
  window.state = state;
  window.selectElement = selectElement;
  window.getUniqueSelector = getUniqueSelector;
  window.toggleInspectionMode = toggleInspectionMode;
  window.toggleDrawingMode = toggleDrawingMode;
  window.handleSliderChange = handleSliderChange;
  window.handleColorChange = handleColorChange;
  window.revertAllChangesFor = revertAllChangesFor;
  window.clearAllStagedChanges = clearAllStagedChanges;
  window.copyGeneratedPrompt = copyGeneratedPrompt;
  window.generateMarkdownRecipe = generateMarkdownRecipe;
  window.triggerFeedbackDownload = triggerFeedbackDownload;
  window.showToastNotification = showToastNotification;
  window.toggleFabMenu = toggleFabMenu;
  window.confirmDrawingInsertion = confirmDrawingInsertion;
  window.cancelDrawingInsertion = cancelDrawingInsertion;
  window.deleteBoundingBox = deleteBoundingBox;
  window.renderBoundingBoxes = renderBoundingBoxes;
  window.startAudioRecording = startAudioRecording;
  window.stopAudioRecording = stopAudioRecording;
  window.deleteVoiceNote = deleteVoiceNote;
  window.updateVoicePanel = updateVoicePanel;
  window.updateVoiceBadges = updateVoiceBadges;
  window.filterSlidersByElementType = filterSlidersByElementType;
  window.renderHierarchyTree = renderHierarchyTree;
  window.toggleUndockPanel = toggleUndockPanel;
  window.undockPanel = undockPanel;
  window.dockPanel = dockPanel;
  window.syncFloatingWindowDOM = syncFloatingWindowDOM;
});
