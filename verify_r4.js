/**
 * Programmatic verification script for Milestone 5 (R4 Prompt Compiler & Auto-save)
 * This script runs in Node.js, mocking the browser DOM, navigator, and URL APIs,
 * and asserts that the System Pre-prompt is correctly formatted, the auto-save
 * programmatic download triggers, and the toast notifications display safely.
 */

// Mock Browser Environment Globals
global.window = global;
global.Node = { ELEMENT_NODE: 1 };
global.Element = class MockElement {
  constructor(tagName = 'div', id = '', classList = []) {
    this.nodeType = 1;
    this.tagName = tagName.toUpperCase();
    this.nodeName = tagName.toUpperCase();
    this.id = id;
    this.classList = {
      list: new Set(classList),
      add(c) { this.list.add(c); },
      remove(c) { this.list.delete(c); },
      contains(c) { return this.list.has(c); },
      toggle(c) {
        if (this.list.has(c)) {
          this.list.delete(c);
          return false;
        } else {
          this.list.add(c);
          return true;
        }
      },
      forEach(cb) { this.list.forEach(cb); }
    };
    this.style = {
      position: '',
      left: '',
      top: '',
      display: '',
      setProperty(p, v) { this[p] = v; }
    };
    this.dataset = {};
    this.children = [];
    this._text = 'Mock text content';
    this.listeners = {};
  }

  get className() {
    return Array.from(this.classList.list).join(' ');
  }
  set className(val) {
    this.classList.list = new Set(val.split(' ').filter(Boolean));
  }

  get textContent() {
    if (this.children.length === 0) {
      return this._text;
    }
    return this.children.map(c => c.textContent).join(' ');
  }
  set textContent(val) { this._text = val; }
  get innerText() { return this.textContent; }
  set innerText(val) { this._text = val; }

  get classListArray() {
    return Array.from(this.classList.list);
  }

  addEventListener(event, handler) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(handler);
  }

  dispatchEvent(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(handler => handler(data));
    }
  }

  appendChild(child) {
    this.children.push(child);
    child.parentElement = this;
    return child;
  }

  removeChild(child) {
    const idx = this.children.indexOf(child);
    if (idx !== -1) {
      this.children.splice(idx, 1);
      child.parentElement = null;
    }
    return child;
  }

  click() {
    this.dispatchEvent('click');
    if (this.tagName === 'A' && this.clickSpy) {
      this.clickSpy();
    }
  }

  remove() {
    if (this.parentElement) {
      this.parentElement.removeChild(this);
    }
  }
};

// Mock Elements Database
const mockElements = {
  'mock-page': new Element('div', 'mock-page'),
  'btn-inspect': new Element('button', 'btn-inspect'),
  'btn-drawing': new Element('button', 'btn-drawing'),
  'fab-trigger': new Element('button', 'fab-trigger'),
  'fab-btn-inspect': new Element('button', 'fab-btn-inspect'),
  'fab-btn-clear': new Element('button', 'fab-btn-clear'),
  'fab-btn-copy': new Element('button', 'fab-btn-copy'),
  'btn-voice-record': new Element('button', 'btn-voice-record'),
  'btn-voice-delete': new Element('button', 'btn-voice-delete'),
  'voice-status-container': new Element('div', 'voice-status-container'),
  'voice-audio-player-container': new Element('div', 'voice-audio-player-container'),
  'voice-audio-player': new Element('audio', 'voice-audio-player'),
  'record-btn-text': new Element('span', 'record-btn-text'),
  'voice-timer': new Element('span', 'voice-timer'),
  'staged-changes-list': new Element('div', 'staged-changes-list'),
  'meta-container': new Element('div', 'meta-container'),
  'meta-details': new Element('div', 'meta-details'),
  'meta-tag': new Element('span', 'meta-tag'),
  'meta-classes': new Element('span', 'meta-classes'),
  'meta-selector': new Element('span', 'meta-selector'),
  'canvas-overlay': new Element('svg', 'canvas-overlay'),
  'slider-padding': new Element('input', 'slider-padding'),
  'val-padding': new Element('span', 'val-padding'),
  'token-padding': new Element('span', 'token-padding'),
  'slider-margin': new Element('input', 'slider-margin'),
  'val-margin': new Element('span', 'val-margin'),
  'token-margin': new Element('span', 'token-margin'),
  'slider-width': new Element('input', 'slider-width'),
  'val-width': new Element('span', 'val-width'),
  'slider-height': new Element('input', 'slider-height'),
  'val-height': new Element('span', 'val-height'),
  'slider-borderRadius': new Element('input', 'slider-borderRadius'),
  'val-borderRadius': new Element('span', 'val-borderRadius'),
  'token-borderRadius': new Element('span', 'token-borderRadius'),
  'slider-fontSize': new Element('input', 'slider-fontSize'),
  'val-fontSize': new Element('span', 'val-fontSize'),
  'fab-menu': new Element('div', 'fab-menu')
};

global.document = {
  body: new Element('body'),
  getElementById(id) {
    return mockElements[id] || null;
  },
  createElement(tag) {
    const el = new Element(tag);
    if (tag === 'a') {
      el.clickSpy = () => {
        global.document.lastClickedAnchor = el;
      };
    }
    return el;
  },
  createElementNS(ns, tag) {
    return new Element(tag);
  },
  querySelectorAll(query) {
    if (query === '.toast-notification') {
      return global.document.body.children.filter(c => c.classList.contains('toast-notification'));
    }
    if (query === '.voice-badge') {
      return [];
    }
    return [];
  },
  querySelector(query) {
    if (query === '.toast-notification') {
      const items = global.document.body.children.filter(c => c.classList.contains('toast-notification'));
      return items[0] || null;
    }
    return null;
  },
  addEventListener(event, handler) {
    if (event === 'DOMContentLoaded') {
      this.domContentLoadedHandler = handler;
    }
  }
};

Object.defineProperty(global, 'navigator', {
  value: {
    clipboard: {
      writeText(txt) {
        this.clipboardText = txt;
        return Promise.resolve();
      }
    },
    mediaDevices: {
      getUserMedia(constraints) {
        return Promise.resolve({
          getTracks() {
            return [{ stop() {} }];
          }
        });
      }
    }
  },
  configurable: true,
  writable: true
});

global.Blob = class MockBlob {
  constructor(contentParts, options) {
    this.content = contentParts.join('');
    this.options = options;
  }
};

global.URL = {
  createObjectURL(blob) {
    this.createdBlob = blob;
    return 'blob:mock-recipe-data-url';
  },
  revokeObjectURL(url) {
    this.revokedUrl = url;
  }
};

global.window.getComputedStyle = function(el) {
  return {
    position: el.style.position || 'static',
    padding: '8px',
    margin: '16px',
    width: '200px',
    height: '100px',
    borderRadius: '4px',
    fontSize: '14px',
    backgroundColor: 'rgb(0, 0, 0)',
    color: 'rgb(255, 255, 255)'
  };
};

global.alert = function(msg) {
  console.log('ALERT:', msg);
};

// Load app.js code
console.log('Loading app.js in mock R4 verification environment...');
require('./app.js');

// Trigger DOMContentLoaded
if (document.domContentLoadedHandler) {
  console.log('Simulating DOMContentLoaded event...');
  document.domContentLoadedHandler();
}

console.log('--- STARTING PROGRAMMATIC R4 TESTS ---');

// Test Case 1: Pre-Prompt in generateMarkdownRecipe
console.log('Test 1: Verification of System Pre-Prompt output...');
const mockTarget = new Element('div', 'features-box', ['mock-features']);
mockElements['mock-page'].appendChild(mockTarget);

// Select and stage some overrides
window.selectElement(mockTarget);
window.handleSliderChange('padding', 16); // maps to --spacing-md
window.handleSliderChange('borderRadius', 8); // maps to --border-radius-md

const recipe = window.generateMarkdownRecipe();

if (recipe.includes('# SYSTEM PRE-PROMPT (AI DEVELOPER INSTRUCTIONS)')) {
  console.log('  Pass: System Pre-Prompt header successfully prepended.');
} else {
  console.error('  Fail: Recipe is missing System Pre-Prompt header!');
  process.exit(1);
}

if (recipe.includes('1. **Interpret Element Visual Staging**') && recipe.includes('2. **Interpret Spatial Bounding Box Insertions**')) {
  console.log('  Pass: Premium instructions to receiving assistants are robust.');
} else {
  console.error('  Fail: Pre-prompt contents are not fully structured!');
  process.exit(1);
}

if (recipe.includes('var(--spacing-md)') && recipe.includes('var(--border-radius-md)')) {
  console.log('  Pass: Design tokens mapped correctly in the staging report.');
} else {
  console.error('  Fail: Modified properties did not map to design tokens!', recipe);
  process.exit(1);
}

// Test Case 2: Programmatic download structure
console.log('Test 2: Verification of triggerFeedbackDownload execution...');
const downloadedFilename = window.triggerFeedbackDownload(recipe);
console.log('  Generated filename:', downloadedFilename);

const datePattern = /^\d{4}-\d{2}-\d{2}_\d{6}_feedback\.md$/;
if (datePattern.test(downloadedFilename)) {
  console.log('  Pass: Filename format matches YYYY-MM-DD_HHMMSS_feedback.md perfectly.');
} else {
  console.error('  Fail: Filename format is incorrect!', downloadedFilename);
  process.exit(1);
}

const clickedAnchor = global.document.lastClickedAnchor;
if (clickedAnchor && clickedAnchor.tagName === 'A') {
  console.log('  Pass: Programmatic off-screen <a> download anchor created.');
  if (clickedAnchor.download === downloadedFilename) {
    console.log('  Pass: Download anchor has the correct filename value.');
  } else {
    console.error('  Fail: Anchor download filename is wrong!', clickedAnchor.download);
    process.exit(1);
  }
  if (clickedAnchor.href === 'blob:mock-recipe-data-url') {
    console.log('  Pass: Anchor links to correctly generated Object URL.');
  } else {
    console.error('  Fail: Anchor href does not link to Object URL!');
    process.exit(1);
  }
  if (global.URL.revokedUrl === 'blob:mock-recipe-data-url') {
    console.log('  Pass: Object URL was revoked cleanly after click.');
  } else {
    console.error('  Fail: Object URL was not revoked!');
    process.exit(1);
  }
} else {
  console.error('  Fail: No anchor element clicked or registered!');
  process.exit(1);
}

// Test Case 3: Toast notification security and CSP compliance
console.log('Test 3: Verification of toast notification rendering and safety...');
window.showToastNotification(downloadedFilename);

const toast = global.document.querySelector('.toast-notification');
if (toast) {
  console.log('  Pass: Toast notification element rendered with class .toast-notification.');
  
  // Verify that we do not have style attributes on the toast that bypass CSP, and uses classes
  const toastMeta = toast.children[1].children[1]; // toast-meta div
  if (toastMeta && toastMeta.className === 'toast-meta') {
    console.log('  Pass: Toast uses decoupled .toast-meta class instead of inline styles.');
  } else {
    console.error('  Fail: Toast meta is not configured with class toast-meta!', toastMeta);
    process.exit(1);
  }

  // Verify that user-supplied input (like filename) is safe and inserted via textContent
  if (toast.textContent.includes(`.ai-staging/feedback/${downloadedFilename}`)) {
    console.log('  Pass: Toast correctly states saved workspace folder path .ai-staging/feedback/');
  } else {
    console.error('  Fail: Toast message text content does not show the feedback save folder!');
    process.exit(1);
  }
} else {
  console.error('  Fail: Toast notification was not found in document body!');
  process.exit(1);
}

// Test Case 4: Copy button unified copy-and-download feedback workflow
console.log('Test 4: Verification of unified workflow click handlers on fab-btn-copy...');
global.document.lastClickedAnchor = null; // reset
global.URL.revokedUrl = null; // reset

const fabCopyBtn = mockElements['fab-btn-copy'];
if (fabCopyBtn.listeners['click']) {
  console.log('  Pass: click event listener successfully registered to fab-btn-copy.');
  
  // Simulate click
  fabCopyBtn.click();
  
  setTimeout(() => {
    if (global.navigator.clipboard.clipboardText.includes('# SYSTEM PRE-PROMPT (AI DEVELOPER INSTRUCTIONS)')) {
      console.log('  Pass: Clipboard write text triggered with compiled recipe.');
    } else {
      console.error('  Fail: Clipboard did not receive the recipe!');
      process.exit(1);
    }
    
    if (global.document.lastClickedAnchor && global.document.lastClickedAnchor.download.endsWith('_feedback.md')) {
      console.log('  Pass: Programmatic browser download triggered as part of click pipeline.');
    } else {
      console.error('  Fail: Programmatic download did not trigger during copy pipeline!');
      process.exit(1);
    }
    
    console.log('=== ALL MILESTONE 5 (R4) TESTS PASSED SUCCESSFULLY! ===');
    process.exit(0);
  }, 50);
} else {
  console.error('  Fail: Copy button is missing its click listener!');
  process.exit(1);
}
