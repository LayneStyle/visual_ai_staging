/* ==========================================================================
   GLOBAL STATE VARIABLES
   ========================================================================== */
const state = {
  activeElement: null,
  focusRoot: null,       
  inspectionMode: false,
  drawingMode: false,
  recordingMode: false,
  activeDevServerPort: 3000, // Dynamic port matching active dev session
  stagedChanges: new Map() // Maps selector -> { element, originalStyles, currentStyles }
};

let shadowRootRef = null;
let companionRoot = null;

// Design token mapping
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
    if (current && current.tagName.toLowerCase() === 'body') {
      path.unshift('body');
      break;
    }
  }
  return path.join(' > ');
}

function classifyUIElement(el) {
  if (!(el instanceof Element)) return { category: 'Other', label: 'Generic Element', icon: '⚙️' };
  const tagName = el.tagName.toLowerCase();
  const classListStr = Array.from(el.classList).join(' ').toLowerCase();
  
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
  
  const isContainer = ['div', 'section', 'article', 'aside', 'main', 'body'].includes(tagName);
  return {
    category: isContainer ? 'Container' : 'Other',
    label: isContainer ? 'Generic Layout Container' : `Element <${tagName}>`,
    icon: isContainer ? '🗂️' : '⚙️'
  };
}

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

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

/* ==========================================================================
   INSPECTION ENGINE
   ========================================================================== */
function handleMouseOver(e) {
  if (!state.inspectionMode) return;
  if (e.target.closest('#vais-companion-root') || e.target.id === 'canvas-overlay') return;
  e.stopPropagation();
  
  // Clean prior hover highlights
  const priorHovered = document.querySelectorAll('.inspect-hovered');
  priorHovered.forEach(el => el.classList.remove('inspect-hovered'));
  
  e.target.classList.add('inspect-hovered');
}

function handleMouseOut(e) {
  if (!state.inspectionMode) return;
  if (e.target.closest('#vais-companion-root') || e.target.id === 'canvas-overlay') return;
  e.stopPropagation();
  e.target.classList.remove('inspect-hovered');
}

function handleInspectClick(e) {
  if (!state.inspectionMode) return;
  if (e.target.closest('#vais-companion-root') || e.target.id === 'canvas-overlay') return;
  
  e.preventDefault();
  e.stopPropagation();
  
  const target = e.target;
  target.classList.remove('inspect-hovered');
  selectElement(target);
}

function toggleInspectionMode(forceState) {
  const targetState = forceState !== undefined ? forceState : !state.inspectionMode;
  state.inspectionMode = targetState;

  const btnInspect = shadowRootRef.getElementById('btn-inspect');

  if (targetState) {
    if (state.drawingMode) {
      toggleDrawingMode(false);
    }
    if (btnInspect) btnInspect.classList.add('active');
    
    // Bind listeners
    document.addEventListener('mouseover', handleMouseOver);
    document.addEventListener('mouseout', handleMouseOut);
    document.addEventListener('click', handleInspectClick, true);
  } else {
    if (btnInspect) btnInspect.classList.remove('active');
    
    // Unbind listeners
    document.removeEventListener('mouseover', handleMouseOver);
    document.removeEventListener('mouseout', handleMouseOut);
    document.removeEventListener('click', handleInspectClick, true);
    
    // Cleanup any lingering hover outlines
    const priorHovered = document.querySelectorAll('.inspect-hovered');
    priorHovered.forEach(el => el.classList.remove('inspect-hovered'));
  }
}

/* ==========================================================================
   SANDBOX UI CONTROLLERS
   ========================================================================== */
function filterSlidersByElementType(element) {
  if (!element) return;
  const tagName = element.tagName.toLowerCase();
  
  const textTypes = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'span', 'a', 'label', 'li', 'em', 'strong'];
  const containerTypes = ['div', 'section', 'header', 'footer', 'nav', 'article', 'aside', 'main', 'form', 'ul', 'ol', 'body'];
  const interactiveTypes = ['button', 'input', 'select', 'textarea'];
  const imageTypes = ['img', 'svg'];

  const getWrapper = (id, selector) => {
    const el = shadowRootRef.getElementById(id);
    if (!el) return null;
    return el.closest(selector) || el.parentElement || el;
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

function renderHierarchyTree(rootElement) {
  const container = shadowRootRef.getElementById('hierarchy-tree-container');
  if (!container) return;
  container.innerHTML = '';
  if (!rootElement) return;
  
  function buildTreeNode(el, depth = 0) {
    if (!(el instanceof Element)) return;
    if (el.id === 'canvas-overlay' || el.id === 'vais-companion-root' || el.classList.contains('voice-badge')) return;

    const nodeRow = document.createElement('div');
    nodeRow.className = 'tree-node';
    nodeRow.style.paddingLeft = `${depth * 12 + 8}px`;
    
    if (el === state.focusRoot) {
      nodeRow.classList.add('focus-root');
    }
    if (el === state.activeElement) {
      nodeRow.classList.add('active-leaf');
    }
    
    const hasChildren = Array.from(el.children).filter(c => c.id !== 'canvas-overlay' && c.id !== 'vais-companion-root' && !c.classList.contains('voice-badge')).length > 0;
    const arrow = document.createElement('span');
    arrow.className = 'tree-arrow';
    arrow.textContent = hasChildren ? '▼' : '•';
    nodeRow.appendChild(arrow);
    
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
    
    nodeRow.addEventListener('click', (e) => {
      e.stopPropagation();
      selectElement(el, true);
    });
    
    container.appendChild(nodeRow);
    
    Array.from(el.children).forEach(child => {
      buildTreeNode(child, depth + 1);
    });
  }
  buildTreeNode(rootElement, 0);
}

function setupSlider(property, value, min, max) {
  const slider = shadowRootRef.getElementById(`slider-${property}`);
  const display = shadowRootRef.getElementById(`val-${property}`);
  const tokenBadge = shadowRootRef.getElementById(`token-${property}`);
  
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

function setupColorSliders(type, colorRgb) {
  const parsed = parseRgb(colorRgb);
  const hsl = rgbToHsl(parsed.r, parsed.g, parsed.b);
  const idPrefix = type === 'background' ? 'bg' : type;
  
  const hInput = shadowRootRef.getElementById(`${idPrefix}-h`);
  const sInput = shadowRootRef.getElementById(`${idPrefix}-s`);
  const lInput = shadowRootRef.getElementById(`${idPrefix}-l`);
  
  if (hInput) hInput.value = hsl.h;
  if (sInput) sInput.value = hsl.s;
  if (lInput) lInput.value = hsl.l;
  
  const hVal = shadowRootRef.getElementById(`${idPrefix}-h-val`);
  const sVal = shadowRootRef.getElementById(`${idPrefix}-s-val`);
  const lVal = shadowRootRef.getElementById(`${idPrefix}-l-val`);
  
  if (hVal) hVal.textContent = hsl.h;
  if (sVal) sVal.textContent = hsl.s + '%';
  if (lVal) lVal.textContent = hsl.l + '%';
  
  const preview = shadowRootRef.getElementById(`${idPrefix}-preview`);
  const textStr = shadowRootRef.getElementById(`${idPrefix}-hsl-string`);
  const hslStr = `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
  
  if (preview) preview.style.backgroundColor = hslStr;
  if (textStr) textStr.textContent = hslStr;
}

function selectElement(element, isChildSelection = false) {
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
  
  if (state.focusRoot && state.activeElement && state.focusRoot !== state.activeElement) {
    state.focusRoot.classList.add('inspect-focus-root');
    state.activeElement.classList.add('inspect-selected');
  } else {
    element.classList.add('inspect-selected');
  }
  
  const computed = window.getComputedStyle(element);
  
  const emptyContainer = shadowRootRef.getElementById('meta-container');
  if (emptyContainer) emptyContainer.classList.add('hidden');
  
  const details = shadowRootRef.getElementById('meta-details');
  if (details) details.classList.remove('hidden');
  
  const metaTag = shadowRootRef.getElementById('meta-tag');
  if (metaTag) metaTag.textContent = element.tagName.toLowerCase();
  
  const classList = Array.from(element.classList)
    .filter(c => c !== 'inspect-selected' && c !== 'inspect-hovered' && c !== 'inspect-focus-root')
    .map(c => '.' + c)
    .join(' ');
  const metaClasses = shadowRootRef.getElementById('meta-classes');
  if (metaClasses) metaClasses.textContent = classList || '(none)';
  
  const selector = getUniqueSelector(element);
  const metaSelector = shadowRootRef.getElementById('meta-selector');
  if (metaSelector) metaSelector.textContent = selector;
  
  const classification = classifyUIElement(element);
  const metaUiType = shadowRootRef.getElementById('meta-ui-type');
  if (metaUiType) {
    metaUiType.textContent = `${classification.icon} ${classification.label}`;
  }
  
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
  
  setupSlider('padding', getNumericValue(computed.paddingTop || computed.padding), 0, 100);
  setupSlider('margin', getNumericValue(computed.marginTop || computed.margin), 0, 100);
  setupSlider('width', getNumericValue(computed.width), 50, 1000);
  setupSlider('height', getNumericValue(computed.height), 10, 800);
  setupSlider('borderRadius', getNumericValue(computed.borderRadius), 0, 100);
  setupSlider('fontSize', getNumericValue(computed.fontSize), 8, 72);
  
  setupColorSliders('background', computed.backgroundColor);
  setupColorSliders('text', computed.color);
  
  const textInput = shadowRootRef.getElementById('input-textContent');
  if (textInput) {
    textInput.value = element.textContent.trim();
  }
  
  filterSlidersByElementType(element);
  renderHierarchyTree(state.focusRoot);
  updateVoicePanel();
}

/* ==========================================================================
   SANDBOX MUTATION CONTROLLER
   ========================================================================== */
function updateElementStyle(property, value) {
  if (!state.activeElement) return;
  const selector = getUniqueSelector(state.activeElement);
  const entry = state.stagedChanges.get(selector);
  
  if (!(property in entry.originalStyles)) {
    entry.originalStyles[property] = state.activeElement.style[property] || window.getComputedStyle(state.activeElement)[property];
  }
  entry.currentStyles[property] = value;
  state.activeElement.style[property] = value;
  renderStagedChanges();
}

function updateElementTextContent(value) {
  if (!state.activeElement) return;
  const selector = getUniqueSelector(state.activeElement);
  const entry = state.stagedChanges.get(selector);
  
  if (!('textContent' in entry.originalStyles)) {
    entry.originalStyles['textContent'] = entry.element.textContent;
  }
  entry.currentStyles['textContent'] = value;
  state.activeElement.textContent = value;
  
  const textInput = shadowRootRef.getElementById('input-textContent');
  if (textInput && textInput.value !== value) {
    textInput.value = value;
  }
  renderStagedChanges();
}

function handleSliderChange(property, value) {
  const valueNum = parseFloat(value);
  let displayValue = value + 'px';
  let applyValue = displayValue;
  
  const token = mapToToken(property, valueNum);
  if (token) {
    applyValue = token;
  }
  
  const slider = shadowRootRef.getElementById(`slider-${property}`);
  if (slider) slider.value = value;
  
  const tokenBadge = shadowRootRef.getElementById(`token-${property}`);
  if (tokenBadge) {
    if (token) {
      tokenBadge.textContent = token.replace('var(', '').replace(')', '');
      tokenBadge.classList.remove('hidden');
    } else {
      tokenBadge.classList.add('hidden');
    }
  }
  
  const numDisplay = shadowRootRef.getElementById(`val-${property}`);
  if (numDisplay) numDisplay.textContent = displayValue;
  
  if (property === 'width' || property === 'height' || property === 'fontSize') {
    applyValue = value + 'px';
  }
  updateElementStyle(property, applyValue);
}

function handleColorChange(type) {
  if (!state.activeElement) return;
  const idPrefix = type === 'background' ? 'bg' : type;
  
  const hInput = shadowRootRef.getElementById(`${idPrefix}-h`);
  const sInput = shadowRootRef.getElementById(`${idPrefix}-s`);
  const lInput = shadowRootRef.getElementById(`${idPrefix}-l`);
  if (!hInput || !sInput || !lInput) return;
  
  const h = hInput.value;
  const s = sInput.value;
  const l = lInput.value;
  const hslStr = `hsl(${h}, ${s}%, ${l}%)`;
  
  const hVal = shadowRootRef.getElementById(`${idPrefix}-h-val`);
  const sVal = shadowRootRef.getElementById(`${idPrefix}-s-val`);
  const lVal = shadowRootRef.getElementById(`${idPrefix}-l-val`);
  if (hVal) hVal.textContent = h;
  if (sVal) sVal.textContent = s + '%';
  if (lVal) lVal.textContent = l + '%';
  
  const preview = shadowRootRef.getElementById(`${idPrefix}-preview`);
  const textStr = shadowRootRef.getElementById(`${idPrefix}-hsl-string`);
  if (preview) preview.style.backgroundColor = hslStr;
  if (textStr) textStr.textContent = hslStr;
  
  const styleProp = type === 'background' ? 'backgroundColor' : 'color';
  updateElementStyle(styleProp, hslStr);
}

/* ==========================================================================
   VOICE ANNOTATION & PERSISTENCE
   ========================================================================== */
let mediaStream = null;
let mediaRecorder = null;
let audioChunks = [];
let recordingSeconds = 0;
let timerInterval = null;

function updateVoicePanel() {
  const btnVoiceRecord = shadowRootRef.getElementById('btn-voice-record');
  const btnVoiceDelete = shadowRootRef.getElementById('btn-voice-delete');
  const voiceStatusContainer = shadowRootRef.getElementById('voice-status-container');
  const voiceAudioPlayerContainer = shadowRootRef.getElementById('voice-audio-player-container');
  const voiceAudioPlayer = shadowRootRef.getElementById('voice-audio-player');
  const recordBtnText = shadowRootRef.getElementById('record-btn-text');

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

function startAudioRecording() {
  if (!state.activeElement || state.recordingMode) return;

  navigator.mediaDevices.getUserMedia({ audio: true })
    .then(stream => {
      mediaStream = stream;
      state.recordingMode = true;
      audioChunks = [];

      let options = { mimeType: 'audio/webm' };
      if (!MediaRecorder.isTypeSupported('audio/webm')) {
        options = { mimeType: 'audio/ogg' };
      }
      if (!MediaRecorder.isTypeSupported('audio/ogg')) {
        options = {};
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
      const timerEl = shadowRootRef.getElementById('voice-timer');
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
      console.error('Microphone access failed, executing WAV fallback download:', err);
      
      const timestamp = getFormattedTimestamp();
      const filename = `${timestamp}_feedback.wav`;
      
      // Trigger WAV fallback download cleanly using standard browser transient anchor
      triggerWavFallbackDownload(filename);
      
      alert('Could not access microphone. A transient fallback WAV file has been downloaded instead.');
    });
}

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

function triggerWavFallbackDownload(filename) {
  const buffer = new ArrayBuffer(44);
  const view = new DataView(buffer);
  
  view.setUint32(0, 0x52494646, false); // "RIFF"
  view.setUint32(4, 36, true);
  view.setUint32(8, 0x57415645, false); // "WAVE"
  view.setUint32(12, 0x666d7420, false); // "fmt "
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, 8000, true);
  view.setUint32(28, 8000, true);
  view.setUint16(32, 1, true);
  view.setUint16(34, 8, true);
  view.setUint32(36, 0x64617461, false); // "data"
  view.setUint32(40, 0, true);

  const blob = new Blob([buffer], { type: 'audio/wav' });
  const audioUrl = URL.createObjectURL(blob);
  
  const anchor = document.createElement('a');
  anchor.href = audioUrl;
  anchor.download = filename || 'fallback.wav';
  anchor.style.cssText = 'position: absolute; left: -9999px; top: -9999px;';
  
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(audioUrl);
}

function saveVoiceNote(blob) {
  if (!state.activeElement) return;
  const selector = getUniqueSelector(state.activeElement);
  const entry = state.stagedChanges.get(selector);
  if (!entry) return;

  const timestamp = getFormattedTimestamp();
  const filename = `${timestamp}_feedback.wav`;

  const absolutePath = `d:\\Github Repos\\Extensiones_Ideas\\visual_ai_staging\\.ai-staging\\audio\\${filename}`;
  const urlPath = `file:///d:/Github%20Repos/Extensiones_Ideas/visual_ai_staging/.ai-staging/audio/${filename}`;
  const audioUrl = URL.createObjectURL(blob);

  entry.voiceNote = {
    url: audioUrl,
    absolutePath: absolutePath,
    urlPath: urlPath,
    filename: filename
  };

  const fallbackDownload = () => {
    const downloadAnchor = document.createElement('a');
    downloadAnchor.href = audioUrl;
    downloadAnchor.download = filename;
    downloadAnchor.style.cssText = 'position: absolute; left: -9999px; top: -9999px;';
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Absolute server URL prefix for save API endpoint
  fetch(`http://localhost:${state.activeDevServerPort}/api/save-audio?filename=${encodeURIComponent(filename)}`, {
    method: 'POST',
    body: blob
  })
  .then(res => {
    if (!res.ok) {
      fallbackDownload();
      showToastNotification('WAV audio downloaded. Local server returned an error.', true);
    } else {
      showToastNotification('WAV audio saved directly to active workspace.', false, `File path: .ai-staging/audio/${filename}`);
    }
  })
  .catch(err => {
    fallbackDownload();
    showToastNotification('WAV audio downloaded. Local server offline or CSP restricted.', true);
  });

  renderStagedChanges();
  updateVoicePanel();
}

function deleteVoiceNote() {
  if (!state.activeElement) return;
  const selector = getUniqueSelector(state.activeElement);
  const entry = state.stagedChanges.get(selector);
  if (!entry) return;

  if (entry.voiceNote) {
    URL.revokeObjectURL(entry.voiceNote.url);
    delete entry.voiceNote;
  }

  const hasStyleChanges = Object.keys(entry.currentStyles).some(
    prop => entry.currentStyles[prop] !== entry.originalStyles[prop]
  );
  if (!hasStyleChanges) {
    state.stagedChanges.delete(selector);
  }

  renderStagedChanges();
  updateVoicePanel();
}

function updateVoiceBadges() {
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

/* ==========================================================================
   STAGED CHANGES RENDERING & REVERTS
   ========================================================================== */
function renderStagedChanges() {
  const container = shadowRootRef.getElementById('staged-changes-list');
  if (!container) return;
  container.innerHTML = '';
  let count = 0;
  
  state.stagedChanges.forEach((changeData, selector) => {
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
    
    if (changeData.voiceNote) {
      hasVisibleChanges = true;
      const voicePropEl = document.createElement('div');
      voicePropEl.className = 'change-prop voice-note-indicator';
      const voiceIconSpan = document.createElement('span');
      voiceIconSpan.textContent = '🎤 ';
      const voiceTextSpan = document.createElement('span');
      voiceTextSpan.className = 'prop-val-new';
      voiceTextSpan.style.color = 'var(--color-accent)';
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
    changePropElements.forEach(propEl => bodyEl.appendChild(propEl));
    
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
  updateVoiceBadges();
}

function revertAllChangesFor(selector) {
  const changeData = state.stagedChanges.get(selector);
  if (!changeData) return;
  
  if (changeData.type === 'insertion') {
    deleteBoundingBox(changeData.boxId);
    return;
  }
  for (const [prop, val] of Object.entries(changeData.originalStyles)) {
    changeData.element.style[prop] = val;
  }
  if (changeData.voiceNote) {
    URL.revokeObjectURL(changeData.voiceNote.url);
  }
  state.stagedChanges.delete(selector);
  renderStagedChanges();
  if (state.activeElement === changeData.element) {
    selectElement(changeData.element);
  }
}

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
  renderBoundingBoxes();
  renderStagedChanges();
  
  if (state.activeElement) {
    state.activeElement.classList.remove('inspect-selected');
    state.activeElement = null;
  }
  updateVoicePanel();
  
  const emptyContainer = shadowRootRef.getElementById('meta-container');
  if (emptyContainer) emptyContainer.classList.remove('hidden');
  
  const details = shadowRootRef.getElementById('meta-details');
  if (details) details.classList.add('hidden');
}

/* ==========================================================================
   PROMPT COMPILER & EXPORT WORKFLOWS
   ========================================================================== */
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

function triggerFeedbackDownload(recipe) {
  const timestamp = getFormattedTimestamp();
  const filename = `${timestamp}_feedback.md`;
  
  const fallbackDownload = () => {
    const blob = new Blob([recipe], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.style.cssText = 'position: absolute; left: -9999px; top: -9999px;';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  };

  // Absolute server URL prefix for save API endpoint
  fetch(`http://localhost:${state.activeDevServerPort}/api/save-feedback`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ filename: filename, content: recipe })
  })
  .then(res => {
    if (!res.ok) {
      fallbackDownload();
      showToastNotification(filename, true);
    } else {
      showToastNotification(filename, false);
    }
  })
  .catch(err => {
    fallbackDownload();
    showToastNotification(filename, true);
  });
  return filename;
}

function showToastNotification(filenameOrMessage, isError = false, metaText = '') {
  const existingToast = document.querySelector('.toast-notification');
  if (existingToast) existingToast.remove();

  const toast = document.createElement('div');
  toast.className = 'toast-notification';

  const header = document.createElement('div');
  header.className = 'toast-header';
  const iconSpan = document.createElement('span');
  iconSpan.textContent = isError ? '❌' : '✨';
  header.appendChild(iconSpan);
  const titleSpan = document.createElement('span');
  titleSpan.textContent = isError ? 'Visual AI Staging Warning' : 'Recipe Prompt Exported!';
  header.appendChild(titleSpan);
  toast.appendChild(header);

  const body = document.createElement('div');
  body.className = 'toast-body';
  const p1 = document.createElement('p');
  
  const isFilename = typeof filenameOrMessage === 'string' && filenameOrMessage.includes('_feedback.md');
  if (isFilename) {
    p1.textContent = isError 
      ? 'Could not copy the prompt automatically, but the recipe file is ready.'
      : 'The compiled recipe prompt was successfully copied to your clipboard.';
  } else {
    p1.textContent = filenameOrMessage;
  }
  body.appendChild(p1);

  const hasMeta = metaText || isFilename;
  if (hasMeta) {
    const p2 = document.createElement('div');
    p2.className = 'toast-meta';
    p2.textContent = metaText || `Auto-saved feedback file: .ai-staging/feedback/${filenameOrMessage}`;
    body.appendChild(p2);
  }

  toast.appendChild(body);
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('hide');
    setTimeout(() => toast.remove(), 300);
  }, 5000);
}

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
SPATIAL ANNOTATIONS & INSERTS DETAILS
=========================================
`;

  state.stagedChanges.forEach((changeData, selector) => {
    if (changeData.type === 'insertion') {
      insertionsCount++;
      const hasVoiceNote = !!changeData.voiceNote;
      
      insertionsText += `
### Insertion #${changeData.boxId}: ${changeData.template}
- **Preset Type**: ${changeData.template}
- **Resolved Nearest Parent Container Selector**: \`${changeData.parentSelector}\`
- **Bounding Box Position (relative to canvas)**: x: ${Math.round(changeData.x)}px, y: ${Math.round(changeData.y)}px, width: ${Math.round(changeData.width)}px, height: ${Math.round(changeData.height)}px
- **Developer Notes**: ${changeData.notes || 'Spatial annotation and layout modification defined via the Bounding Box canvas.'}
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
   BOUNDING BOX VECTOR OVERLAY & DRAWING SYSTEM
   ========================================================================== */
let isDrawing = false;
let startX = 0;
let startY = 0;
let tempRect = null;
let nextBoxId = 1;
let pendingBoxData = null;

function getOrCreateCanvasOverlay() {
  let canvas = document.getElementById('canvas-overlay');
  if (!canvas) {
    canvas = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    canvas.id = 'canvas-overlay';
    canvas.style.cssText = 'position: absolute; top: 0; left: 0; pointer-events: none; z-index: 2147483646;';
    document.body.appendChild(canvas);
  }
  const scrollWidth = Math.max(document.documentElement.scrollWidth, document.body.scrollWidth, window.innerWidth);
  const scrollHeight = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight, window.innerHeight);
  canvas.style.width = scrollWidth + 'px';
  canvas.style.height = scrollHeight + 'px';
  return canvas;
}

function toggleDrawingMode(forceState) {
  const targetState = forceState !== undefined ? forceState : !state.drawingMode;
  state.drawingMode = targetState;
  
  const btnDrawing = shadowRootRef.getElementById('btn-drawing');
  const canvasOverlay = getOrCreateCanvasOverlay();
  
  if (targetState) {
    if (state.inspectionMode) {
      toggleInspectionMode(false);
    }
    if (btnDrawing) btnDrawing.classList.add('active');
    if (canvasOverlay) {
      canvasOverlay.style.pointerEvents = 'auto';
    }
  } else {
    if (btnDrawing) btnDrawing.classList.remove('active');
    if (canvasOverlay) {
      canvasOverlay.style.pointerEvents = 'none';
    }
    isDrawing = false;
    if (tempRect) {
      tempRect.remove();
      tempRect = null;
    }
  }
  renderBoundingBoxes();
}

function findNearestParentContainer(element) {
  if (!element) return document.body;
  
  let current = element;
  while (current && current !== document.documentElement) {
    if (current === document.body) {
      return document.body;
    }
    const isSectionOrHeader = ['section', 'header', 'nav', 'article', 'aside', 'footer', 'main', 'div'].includes(current.tagName.toLowerCase());
    const hasContainerClass = Array.from(current.classList).some(cls => 
      cls.includes('card') || 
      cls.includes('grid') || 
      cls.includes('hero') || 
      cls.includes('section') || 
      cls.includes('container')
    );
    if (isSectionOrHeader || hasContainerClass) {
      return current;
    }
    current = current.parentElement;
  }
  return document.body;
}

function handleCompletedDraw(x, y, width, height, clientX, clientY) {
  const canvasOverlay = getOrCreateCanvasOverlay();
  if (!canvasOverlay) return;
  
  const rect = canvasOverlay.getBoundingClientRect();
  const centerX = rect.left + x + width / 2;
  const centerY = rect.top + y + height / 2;
  
  const originalPointerEvents = canvasOverlay.style.pointerEvents;
  canvasOverlay.style.pointerEvents = 'none';
  
  const elementUnder = document.elementFromPoint(centerX, centerY);
  canvasOverlay.style.pointerEvents = originalPointerEvents;
  
  const parentContainer = findNearestParentContainer(elementUnder);
  const parentSelector = getUniqueSelector(parentContainer);
  openDrawingModal(x, y, width, height, parentSelector);
}

function openDrawingModal(x, y, width, height, parentSelector) {
  pendingBoxData = { x, y, width, height, parentSelector };
  
  const modal = shadowRootRef.getElementById('drawing-modal');
  const selectorDisplay = shadowRootRef.getElementById('modal-resolved-selector');
  const selectPreset = shadowRootRef.getElementById('modal-template-select');
  const notesTextarea = shadowRootRef.getElementById('modal-notes-textarea');
  
  if (selectorDisplay) selectorDisplay.textContent = parentSelector;
  if (selectPreset) selectPreset.value = 'Carousel Slider';
  if (notesTextarea) notesTextarea.value = '';
  
  if (modal) modal.classList.remove('hidden');
}

function closeDrawingModal() {
  const modal = shadowRootRef.getElementById('drawing-modal');
  if (modal) modal.classList.add('hidden');
  pendingBoxData = null;
}

function confirmDrawingInsertion() {
  if (!pendingBoxData) return;
  
  const selectPreset = shadowRootRef.getElementById('modal-template-select');
  const notesTextarea = shadowRootRef.getElementById('modal-notes-textarea');
  
  const template = selectPreset ? selectPreset.value : 'Carousel Slider';
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

function cancelDrawingInsertion() {
  closeDrawingModal();
}

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

function renderBoundingBoxes() {
  const canvasOverlay = getOrCreateCanvasOverlay();
  if (!canvasOverlay) return;
  canvasOverlay.innerHTML = '';
  
  if (!state.drawingMode) return;
  
  state.stagedChanges.forEach((changeData) => {
    if (changeData.type !== 'insertion') return;
    
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('class', 'completed-box-group');
    g.setAttribute('data-box-id', changeData.boxId);
    
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('class', 'drawing-rect-completed');
    rect.setAttribute('x', changeData.x);
    rect.setAttribute('y', changeData.y);
    rect.setAttribute('width', changeData.width);
    rect.setAttribute('height', changeData.height);
    
    const labelTextStr = `#${changeData.boxId}: ${changeData.template}`;
    
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('class', 'drawing-label-text');
    text.setAttribute('x', changeData.x + 8);
    text.setAttribute('y', changeData.y + 11);
    text.style.textAnchor = 'start';
    text.style.dominantBaseline = 'middle';
    text.textContent = labelTextStr;
    
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
   EXTENSION CSP BINDINGS
   ========================================================================== */
function bindAllExtensionListeners() {
  injectHostStyles();
  
  // Header modes
  const btnInspect = shadowRootRef.getElementById('btn-inspect');
  if (btnInspect) {
    btnInspect.addEventListener('click', () => toggleInspectionMode());
  }
  const btnDrawing = shadowRootRef.getElementById('btn-drawing');
  if (btnDrawing) {
    btnDrawing.addEventListener('click', () => toggleDrawingMode());
  }
  
  // Quick Actions in extension header
  const clearBtn = shadowRootRef.getElementById('fab-btn-clear');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => clearAllStagedChanges());
  }
  const copyBtn = shadowRootRef.getElementById('fab-btn-copy');
  if (copyBtn) {
    copyBtn.addEventListener('click', () => copyGeneratedPrompt());
  }

  // Bounding Box SVG drawing overlay
  const canvasOverlay = getOrCreateCanvasOverlay();
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
  const btnCloseModal = shadowRootRef.getElementById('btn-close-modal');
  if (btnCloseModal) btnCloseModal.addEventListener('click', cancelDrawingInsertion);
  const btnCancelModal = shadowRootRef.getElementById('btn-cancel-modal');
  if (btnCancelModal) btnCancelModal.addEventListener('click', cancelDrawingInsertion);
  const btnConfirmModal = shadowRootRef.getElementById('btn-confirm-modal');
  if (btnConfirmModal) btnConfirmModal.addEventListener('click', confirmDrawingInsertion);

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
    const el = shadowRootRef.getElementById(s.id);
    if (el) {
      el.addEventListener('input', (e) => handleSliderChange(s.property, e.target.value));
    }
  });

  // HSL Background color sliders
  ['bg-h', 'bg-s', 'bg-l'].forEach(id => {
    const el = shadowRootRef.getElementById(id);
    if (el) {
      el.addEventListener('input', () => handleColorChange('background'));
    }
  });

  // HSL Text color sliders
  ['text-h', 'text-s', 'text-l'].forEach(id => {
    const el = shadowRootRef.getElementById(id);
    if (el) {
      el.addEventListener('input', () => handleColorChange('text'));
    }
  });

  // Text Content input
  const textInput = shadowRootRef.getElementById('input-textContent');
  if (textInput) {
    textInput.addEventListener('input', (e) => updateElementTextContent(e.target.value));
  }

  // Voice record buttons
  const btnVoiceRecord = shadowRootRef.getElementById('btn-voice-record');
  if (btnVoiceRecord) {
    btnVoiceRecord.addEventListener('click', () => {
      if (state.recordingMode) {
        stopAudioRecording();
      } else {
        startAudioRecording();
      }
    });
  }
  const btnVoiceDelete = shadowRootRef.getElementById('btn-voice-delete');
  if (btnVoiceDelete) {
    btnVoiceDelete.addEventListener('click', deleteVoiceNote);
  }
}

function injectHostStyles() {
  let styleTag = document.getElementById('vais-host-styles');
  if (!styleTag) {
    styleTag = document.createElement('style');
    styleTag.id = 'vais-host-styles';
    styleTag.textContent = `
      .inspect-hovered {
        outline: 2px dashed #0095ff !important;
        background-color: rgba(0, 149, 255, 0.08) !important;
        cursor: pointer !important;
      }
      .inspect-selected {
        outline: 2px solid #0095ff !important;
        box-shadow: 0 0 16px rgba(0, 149, 255, 0.25) !important;
      }
      .inspect-focus-root {
        outline: 2px dashed #a855f7 !important;
      }
      .voice-badge {
        position: absolute;
        top: -6px;
        right: -6px;
        background: #0095ff;
        color: white;
        border-radius: 50%;
        width: 18px;
        height: 18px;
        font-size: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        z-index: 10000;
        animation: pulse-glow 2s infinite ease-in-out;
      }
      @keyframes pulse-glow {
        0%, 100% { transform: scale(1); filter: brightness(1); }
        50% { transform: scale(1.1); filter: brightness(1.2); }
      }
      .drawing-rect-completed {
        stroke: #a855f7 !important;
        stroke-width: 2px !important;
        fill: rgba(168, 85, 247, 0.1) !important;
      }
      .drawing-rect-temp {
        stroke: #0095ff !important;
        stroke-width: 2px !important;
        stroke-dasharray: 4 !important;
        fill: rgba(0, 149, 255, 0.15) !important;
      }
      .drawing-label-bg {
        fill: #a855f7 !important;
        rx: 3px !important;
      }
      .drawing-label-text {
        fill: #ffffff !important;
        font-family: sans-serif !important;
        font-size: 10px !important;
        font-weight: bold !important;
      }
      .toast-notification {
        position: fixed;
        bottom: 24px;
        left: 24px;
        background: rgba(22, 28, 38, 0.95);
        backdrop-filter: blur(8px);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 8px;
        padding: 16px;
        width: 320px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
        z-index: 2147483647;
        color: white;
        font-family: sans-serif;
        transition: all 0.3s ease;
      }
      .toast-notification.hide {
        opacity: 0;
        transform: translateY(20px);
      }
      .toast-header {
        display: flex;
        align-items: center;
        gap: 8px;
        font-weight: bold;
        font-size: 14px;
        margin-bottom: 8px;
      }
      .toast-body {
        font-size: 12px;
        line-height: 1.4;
        color: #e2e8f0;
      }
      .toast-meta {
        font-family: monospace;
        font-size: 10px;
        margin-top: 8px;
        color: #94a3b8;
        background: rgba(0,0,0,0.2);
        padding: 4px;
        border-radius: 4px;
      }
    `;
    document.head.appendChild(styleTag);
  }
}

/* ==========================================================================
   EXTENSION TOGGLE SIDEBAR INJECTION
   ========================================================================== */
function toggleStagingPanel() {
  companionRoot = document.getElementById('vais-companion-root');
  if (!companionRoot) {
    companionRoot = document.createElement('div');
    companionRoot.id = 'vais-companion-root';
    companionRoot.style.cssText = 'position: fixed; top: 0; right: 0; width: 400px; height: 100vh; z-index: 2147483647; display: flex; flex-direction: column; box-shadow: -5px 0 25px rgba(0,0,0,0.35);';
    document.body.appendChild(companionRoot);
    
    shadowRootRef = companionRoot.attachShadow({ mode: 'open' });
    
    const stylesheetLink = document.createElement('link');
    stylesheetLink.rel = 'stylesheet';
    stylesheetLink.href = chrome.runtime.getURL('shadow.css');
    shadowRootRef.appendChild(stylesheetLink);
    
    const lateralPanel = document.createElement('div');
    lateralPanel.style.cssText = 'display: flex; flex-direction: column; height: 100%; width: 100%; overflow: hidden;';
    lateralPanel.innerHTML = `
<aside id="main-staging-panel" class="staging-panel glass-panel" style="width: 100%; height: 100%; flex: 1; display: flex; flex-direction: column; overflow-y: auto;">
  <header class="app-header" style="padding: 12px; margin-bottom: 8px; display: flex; flex-direction: column; gap: 8px; align-items: stretch; background-color: var(--color-bg-secondary); border-bottom: 1px solid var(--glass-border);">
    <div class="header-logo" style="display: flex; justify-content: space-between; align-items: center;">
      <h1 style="font-size: 1rem; margin: 0; font-weight: 700; color: #fff;">Visual AI Staging <span class="badge" style="background-color: var(--color-accent); font-size: 0.65rem; padding: 2px 4px; border-radius: var(--border-radius-sm);">Companion</span></h1>
      <div style="display: flex; align-items: center; gap: 4px;">
        <span class="status-indicator active" style="width: 8px; height: 8px; border-radius: 50%; background-color: #10b981; box-shadow: 0 0 8px #10b981;"></span>
        <span style="font-size: 0.75rem; color: var(--color-text-secondary);">Connected</span>
      </div>
    </div>
    <div class="toolbar-modes" style="display: flex; gap: 8px; margin-top: 4px;">
      <button id="btn-inspect" class="toolbar-btn" style="flex: 1; justify-content: center; padding: 6px; font-size: 0.8rem;">
        🔍 Inspect
      </button>
      <button id="btn-drawing" class="toolbar-btn" style="flex: 1; justify-content: center; padding: 6px; font-size: 0.8rem;">
        📐 Draw Zone
      </button>
    </div>
    <div style="display: flex; gap: 8px;">
      <button id="fab-btn-clear" class="toolbar-btn" style="flex: 1; justify-content: center; padding: 6px; font-size: 0.8rem; background-color: rgba(239, 68, 68, 0.15); border-color: rgba(239, 68, 68, 0.3);">
        🧹 Clear
      </button>
      <button id="fab-btn-copy" class="toolbar-btn" style="flex: 1; justify-content: center; padding: 6px; font-size: 0.8rem; background-color: rgba(16, 185, 129, 0.15); border-color: rgba(16, 185, 129, 0.3);">
        📋 Copy Recipe
      </button>
    </div>
    <div id="vais-sessions-container" style="margin-top: 8px; display: flex; flex-direction: column; gap: 4px;">
      <label for="vais-active-session-select" style="font-size: 0.65rem; color: var(--color-text-secondary); font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Active Staging Server</label>
      <select id="vais-active-session-select" style="width: 100%; padding: 4px 6px; font-size: 0.75rem; border-radius: var(--border-radius-sm); background: var(--color-bg-primary); color: #fff; border: 1px solid var(--glass-border); outline: none;">
        <option value="3000">Scanning local servers...</option>
      </select>
    </div>
  </header>

  <!-- Section 1: Selected Element Metadata -->
  <section class="staging-section element-meta-section">
    <div class="meta-section-header" style="display: flex; justify-content: space-between; align-items: center;">
      <h3 class="section-heading" style="margin: 0; flex: 1;">Selected Element</h3>
    </div>
    <div id="meta-container" class="meta-empty">
      No element selected. Toggle Inspect Mode and click an element inside the page to begin.
    </div>
    <div id="meta-details" class="hidden">
      <div class="meta-row">
        <span class="meta-label">Tag Name:</span>
        <span id="meta-tag" class="meta-value tag-value">div</span>
      </div>
      <div class="meta-row">
        <span class="meta-label">Class List:</span>
        <span id="meta-classes" class="meta-value class-value">.hero-content</span>
      </div>
      <div class="meta-row">
        <span class="meta-label">CSS Selector:</span>
        <span id="meta-selector" class="meta-value selector-value">body > div</span>
      </div>
      <div class="meta-row">
        <span class="meta-label">UI Component Type:</span>
        <span id="meta-ui-type" class="meta-value ui-type-value">⚙️ Generic Element</span>
      </div>
      
      <div class="hierarchy-header-title" style="margin-top: 10px; font-size: 0.75rem; font-weight: 700; color: var(--color-text-secondary); text-transform: uppercase;">DOM Hierarchy Tree</div>
      <div id="hierarchy-tree-container" class="hierarchy-tree-container"></div>
    </div>
  </section>

  <!-- Section 2: Visual Sandbox Sliders -->
  <section class="staging-section properties-section">
    <h3 class="section-heading">Visual Sandbox</h3>
    <div class="properties-controls">
      <!-- Padding Slider -->
      <div class="control-group">
        <div class="control-header">
          <label for="slider-padding">Padding</label>
          <div class="val-wrapper">
            <span id="val-padding" class="control-num">0px</span>
            <span id="token-padding" class="token-badge hidden">--spacing-xs</span>
          </div>
        </div>
        <input type="range" id="slider-padding" min="0" max="100" value="0" class="slider">
      </div>

      <!-- Margin Slider -->
      <div class="control-group">
        <div class="control-header">
          <label for="slider-margin">Margin</label>
          <div class="val-wrapper">
            <span id="val-margin" class="control-num">0px</span>
            <span id="token-margin" class="token-badge hidden">--spacing-xs</span>
          </div>
        </div>
        <input type="range" id="slider-margin" min="0" max="100" value="0" class="slider">
      </div>

      <!-- Width Slider -->
      <div class="control-group">
        <div class="control-header">
          <label for="slider-width">Width</label>
          <div class="val-wrapper">
            <span id="val-width" class="control-num">auto</span>
          </div>
        </div>
        <input type="range" id="slider-width" min="50" max="1000" value="300" class="slider">
      </div>

      <!-- Height Slider -->
      <div class="control-group">
        <div class="control-header">
          <label for="slider-height">Height</label>
          <div class="val-wrapper">
            <span id="val-height" class="control-num">auto</span>
          </div>
        </div>
        <input type="range" id="slider-height" min="10" max="800" value="100" class="slider">
      </div>

      <!-- Border Radius Slider -->
      <div class="control-group">
        <div class="control-header">
          <label for="slider-borderRadius">Border Radius</label>
          <div class="val-wrapper">
            <span id="val-borderRadius" class="control-num">0px</span>
            <span id="token-borderRadius" class="token-badge hidden">--border-radius-sm</span>
          </div>
        </div>
        <input type="range" id="slider-borderRadius" min="0" max="100" value="0" class="slider">
      </div>

      <!-- Font Size Slider -->
      <div class="control-group">
        <div class="control-header">
          <label for="slider-fontSize">Font Size</label>
          <div class="val-wrapper">
            <span id="val-fontSize" class="control-num">16px</span>
          </div>
        </div>
        <input type="range" id="slider-fontSize" min="8" max="72" value="16" class="slider">
      </div>

      <!-- Text Content Input -->
      <div class="control-group text-content-group">
        <div class="control-header">
          <label for="input-textContent">Text Content</label>
        </div>
        <input type="text" id="input-textContent" class="text-input" placeholder="Edit text content...">
      </div>
    </div>
  </section>

  <!-- Section 3: Color Sliders -->
  <section class="staging-section colors-section">
    <h3 class="section-heading">Color Staging</h3>
    
    <!-- Background Color -->
    <div class="color-control-box">
      <div class="color-title">Background Color</div>
      <div class="hsl-sliders">
        <div class="slider-row">
          <span class="hsl-label">H</span>
          <input type="range" id="bg-h" min="0" max="360" value="220" class="slider color-h-slider">
          <span id="bg-h-val" class="hsl-val">220</span>
        </div>
        <div class="slider-row">
          <span class="hsl-label">S</span>
          <input type="range" id="bg-s" min="0" max="100" value="15" class="slider">
          <span id="bg-s-val" class="hsl-val">15%</span>
        </div>
        <div class="slider-row">
          <span class="hsl-label">L</span>
          <input type="range" id="bg-l" min="0" max="100" value="10" class="slider">
          <span id="bg-l-val" class="hsl-val">10%</span>
        </div>
      </div>
      <div class="color-palette-repr">
        <div id="bg-preview" class="color-preview-swatch"></div>
        <span id="bg-hsl-string" class="hsl-string">hsl(220, 15%, 10%)</span>
      </div>
    </div>

    <!-- Text Color -->
    <div class="color-control-box">
      <div class="color-title">Text Color</div>
      <div class="hsl-sliders">
        <div class="slider-row">
          <span class="hsl-label">H</span>
          <input type="range" id="text-h" min="0" max="360" value="220" class="slider color-h-slider">
          <span id="text-h-val" class="hsl-val">220</span>
        </div>
        <div class="slider-row">
          <span class="hsl-label">S</span>
          <input type="range" id="text-s" min="0" max="100" value="10" class="slider">
          <span id="text-s-val" class="hsl-val">10%</span>
        </div>
        <div class="slider-row">
          <span class="hsl-label">L</span>
          <input type="range" id="text-l" min="0" max="100" value="95" class="slider">
          <span id="text-l-val" class="hsl-val">95%</span>
        </div>
      </div>
      <div class="color-palette-repr">
        <div id="text-preview" class="color-preview-swatch"></div>
        <span id="text-hsl-string" class="hsl-string">hsl(220, 10%, 95%)</span>
      </div>
    </div>
  </section>

  <!-- Section 3.5: Voice Annotation -->
  <section class="staging-section voice-annotation-section">
    <h3 class="section-heading">Voice Annotation</h3>
    <div class="voice-controls-box">
      <div class="voice-actions">
        <button id="btn-voice-record" class="voice-btn record-btn" disabled>
          <span class="voice-icon">🎤</span> <span id="record-btn-text">Record Voice Note</span>
        </button>
        <button id="btn-voice-delete" class="voice-btn delete-btn hidden" title="Delete voice note">
          🗑️
        </button>
      </div>
      
      <div id="voice-status-container" class="voice-status hidden">
        <span class="pulse-indicator"></span>
        <span id="voice-timer">00:00</span>
        <span class="status-label">Recording...</span>
      </div>

      <div id="voice-audio-player-container" class="audio-player-container hidden">
        <audio id="voice-audio-player" controls></audio>
      </div>
    </div>
  </section>

  <!-- Section 4: Staged Changes List -->
  <section class="staging-section changes-section">
    <h3 class="section-heading">Staged Changes</h3>
    <div id="staged-changes-list" class="changes-list">
      <div class="no-changes">No staged changes yet. Select an element and adjust properties.</div>
    </div>
  </section>
</aside>

<!-- Bounding Box Annotation Modal -->
<div id="drawing-modal" class="modal-overlay hidden" style="position: absolute; z-index: 2147483647; width: 100%; height: 100%; top: 0; left: 0; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.5);">
  <div class="modal-content glass-panel" style="width: 90%; max-width: 360px; padding: 15px; border-radius: var(--border-radius-lg); background: var(--color-bg-secondary); border: 1px solid var(--glass-border);">
    <div class="modal-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
      <h4 style="margin: 0; font-size: 0.95rem; color: #fff;">Configure Bounding Box</h4>
      <button id="btn-close-modal" class="modal-close-btn" style="background: none; border: none; color: #fff; font-size: 1.2rem; cursor: pointer;">&times;</button>
    </div>
    <div class="modal-body" style="display: flex; flex-direction: column; gap: 10px;">
      <div class="form-group">
        <label style="font-size: 0.75rem; color: var(--color-text-secondary); display: block; margin-bottom: 4px;">Parent Container Selector</label>
        <div id="modal-resolved-selector" class="resolved-selector-display" style="font-family: monospace; font-size: 0.75rem; padding: 6px; background: rgba(0,0,0,0.2); border-radius: var(--border-radius-sm); color: #fff; word-break: break-all;"></div>
      </div>
      
      <div class="form-group">
        <label for="modal-template-select" style="font-size: 0.75rem; color: var(--color-text-secondary); display: block; margin-bottom: 4px;">Quick Template Preset</label>
        <select id="modal-template-select" class="modal-select" style="width: 100%; padding: 6px; border-radius: var(--border-radius-sm); background: var(--color-bg-primary); color: #fff; border: 1px solid var(--glass-border);">
          <optgroup label="Layout & Containers">
            <option value="Header / Navigation Bar">🧭 Header / Navbar (Navigation Bar)</option>
            <option value="Hero Section">🚀 Hero Section (Intro Banner)</option>
            <option value="Container / Card">📦 Container / Card (Widget)</option>
            <option value="Grid / Flex Layout">🎛️ Grid / Flex Container</option>
            <option value="Footer">🏁 Footer (Page End)</option>
          </optgroup>
          <optgroup label="Interactives & Forms">
            <option value="Button (Primary/Secondary)">🔘 Button (Call to Action)</option>
            <option value="Formulario (Form)">📝 Complete Form</option>
            <option value="Input Field / Input Group">✏️ Input (Text Field)</option>
            <option value="Search Bar">🔍 Search Bar (Search Box)</option>
            <option value="Toggle / Selector">⌥ Toggle / Checkbox</option>
          </optgroup>
          <optgroup label="Media & Contents">
            <option value="Image Placeholder">🖼️ Image Placeholder (Photo)</option>
            <option value="Carousel Slider">🎡 Carousel / Slider</option>
            <option value="Video Player">🎥 Video Player</option>
            <option value="Avatar / Profile Badge">👤 Avatar (User Profile)</option>
          </optgroup>
          <optgroup label="WebApp Components">
            <option value="Modal / Dialog Box">💬 Modal / Pop-up Dialog</option>
            <option value="Tabs Container">📑 Tabs Container</option>
            <option value="Accordion / FAQ">📂 Accordion / FAQ</option>
            <option value="Charts / Data Analytics">📊 Charts / Data Visualizer</option>
            <option value="Data Table">📅 Data Table</option>
          </optgroup>
          <optgroup label="Others">
            <option value="Custom Component">⚙️ Custom Component</option>
          </optgroup>
        </select>
      </div>
      
      <div class="form-group">
        <label for="modal-notes-textarea" style="font-size: 0.75rem; color: var(--color-text-secondary); display: block; margin-bottom: 4px;">Developer Notes</label>
        <textarea id="modal-notes-textarea" class="modal-textarea" style="width: 100%; height: 60px; padding: 6px; border-radius: var(--border-radius-sm); background: var(--color-bg-primary); color: #fff; border: 1px solid var(--glass-border); resize: none;" placeholder="Write design notes here..."></textarea>
      </div>
    </div>
    <div class="modal-footer" style="display: flex; justify-content: flex-end; gap: 8px; margin-top: 12px;">
      <button id="btn-cancel-modal" class="modal-btn modal-btn-secondary" style="padding: 6px 12px; font-size: 0.8rem; cursor: pointer;">Cancel</button>
      <button id="btn-confirm-modal" class="modal-btn modal-btn-primary" style="padding: 6px 12px; font-size: 0.8rem; cursor: pointer; background: var(--color-accent); color: #fff; border: none; border-radius: var(--border-radius-sm);">Confirm</button>
    </div>
  </div>
</div>
    `;
    shadowRootRef.appendChild(lateralPanel);
    bindAllExtensionListeners();
    
    // Bind session selector change
    const sessionSelect = shadowRootRef.getElementById('vais-active-session-select');
    if (sessionSelect) {
      sessionSelect.addEventListener('change', (e) => {
        state.activeDevServerPort = parseInt(e.target.value);
      });
    }
    
    scanActiveSessions();
  } else {
    if (companionRoot.style.display === 'none') {
      companionRoot.style.display = 'flex';
      scanActiveSessions();
    } else {
      companionRoot.style.display = 'none';
      if (state.inspectionMode) toggleInspectionMode(false);
      if (state.drawingMode) toggleDrawingMode(false);
    }
  }
}

function scanActiveSessions() {
  const selectEl = shadowRootRef.getElementById('vais-active-session-select');
  if (!selectEl) return;

  const portsToScan = [3000, 3001, 3002, 3003, 3004, 3005];
  const activeSessions = [];
  let scannedCount = 0;

  portsToScan.forEach(port => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 800);

    fetch(`http://localhost:${port}/api/session-info`, {
      signal: controller.signal,
      method: 'GET'
    })
    .then(res => res.json())
    .then(data => {
      clearTimeout(timeoutId);
      if (data && data.success) {
        activeSessions.push({ port, projectName: data.projectName });
      }
    })
    .catch(() => {
      clearTimeout(timeoutId);
    })
    .finally(() => {
      scannedCount++;
      if (scannedCount === portsToScan.length) {
        selectEl.innerHTML = '';
        if (activeSessions.length === 0) {
          const opt = document.createElement('option');
          opt.value = '3000';
          opt.textContent = 'No dev server running (using 3000)';
          selectEl.appendChild(opt);
          state.activeDevServerPort = 3000;
        } else {
          activeSessions.sort((a, b) => a.port - b.port);
          
          const currentPort = parseInt(window.location.port);
          let selectedPort = activeSessions[0].port;
          
          activeSessions.forEach(session => {
            const opt = document.createElement('option');
            opt.value = session.port.toString();
            opt.textContent = `${session.projectName} (Port ${session.port})`;
            if (currentPort === session.port) {
              opt.selected = true;
              selectedPort = session.port;
            }
            selectEl.appendChild(opt);
          });
          
          state.activeDevServerPort = selectedPort;
          selectEl.value = selectedPort.toString();
        }
      }
    });
  });
}

/* ==========================================================================
   EXTENSION TOGGLE MESSAGE RECEIVER
   ========================================================================== */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "TOGGLE_PANEL") {
    toggleStagingPanel();
    sendResponse({ success: true });
  }
  return true;
});
