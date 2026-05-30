/**
 * Programmatic verification script for Milestone 4 (R3 Grabador de Audio Localizado y DOM Badges)
 * This script runs in Node.js, mocking the necessary browser API variables and checking the
 * implemented state logic, element selections, custom WAV saving paths, and compiled markdown.
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
      forEach(cb) { this.list.forEach(cb); }
    };
    this.style = {};
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

  get textContent() { return this._text; }
  set textContent(val) { this._text = val; }
  get innerText() { return this._text; }
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

  click() {
    this.dispatchEvent('click');
  }

  remove() {
    if (this.parentElement) {
      const idx = this.parentElement.children.indexOf(this);
      if (idx !== -1) {
        this.parentElement.children.splice(idx, 1);
      }
    }
  }
};

// Mock Elements Database
const elementsDb = {};
const mockElements = {
  'mock-page': new Element('div', 'mock-page'),
  'btn-voice-record': (() => {
    const el = new Element('button', 'btn-voice-record');
    el.disabled = true;
    return el;
  })(),
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
};

global.document = {
  body: new Element('body'),
  getElementById(id) {
    return mockElements[id] || null;
  },
  createElement(tag) {
    return new Element(tag);
  },
  createElementNS(ns, tag) {
    return new Element(tag);
  },
  querySelectorAll(query) {
    if (query === '.voice-badge') {
      const badges = [];
      const traverse = (el) => {
        el.children.forEach(c => {
          if (c.classList.contains('voice-badge')) {
            badges.push(c);
          }
          traverse(c);
        });
      };
      Object.values(mockElements).forEach(traverse);
      return badges;
    }
    return [];
  },
  addEventListener(event, handler) {
    if (event === 'DOMContentLoaded') {
      // We will trigger handler manually
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

global.MediaRecorder = class MockMediaRecorder {
  static isTypeSupported(type) {
    return true;
  }
  constructor(stream, options) {
    this.stream = stream;
    this.options = options;
  }
  start() {
    setTimeout(() => {
      if (this.ondataavailable) {
        this.ondataavailable({ data: { size: 100 } });
      }
    }, 10);
  }
  stop() {
    if (this.onstop) {
      this.onstop();
    }
  }
};

global.URL = {
  createObjectURL(blob) {
    return 'blob:mock-audio-data';
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
console.log('Loading app.js in mock environment...');
require('./app.js');

// Trigger DOMContentLoaded
if (document.domContentLoadedHandler) {
  console.log('Simulating DOMContentLoaded event...');
  document.domContentLoadedHandler();
}

console.log('--- STARTING PROGRAMMATIC TESTS ---');

// Test Case 1: Initial Staging State
console.log('Test 1: Verification of activeElement default state...');
if (mockElements['btn-voice-record'].disabled === true) {
  console.log('  Pass: Record button disabled by default.');
} else {
  console.error('  Fail: Record button should be disabled by default!');
  process.exit(1);
}

// Test Case 2: Element Selection & Panel Sync
console.log('Test 2: Selecting a target mock element...');
const mockTarget = new Element('button', 'launch-btn', ['mock-btn', 'mock-btn-primary']);
mockElements['mock-page'].appendChild(mockTarget);

window.toggleInspectionMode(true);
window.selectElement(mockTarget);

if (mockElements['btn-voice-record'].disabled === false) {
  console.log('  Pass: Record button enabled successfully on element selection.');
} else {
  console.error('  Fail: Record button was not enabled on selection!');
  process.exit(1);
}

const recordTextSpan = mockElements['record-btn-text'];
if (recordTextSpan.innerText === 'Record Voice Note') {
  console.log('  Pass: Button text correctly set to "Record Voice Note".');
} else {
  console.error('  Fail: Record button text incorrect!', recordTextSpan.innerText);
  process.exit(1);
}

// Test Case 3: Start/Stop Audio Recording State Machine
console.log('Test 3: Testing start and stop audio recording states...');
window.startAudioRecording();

// Check recording indicators
setTimeout(() => {
  if (mockElements['btn-voice-record'].classList.contains('recording')) {
    console.log('  Pass: Button has "recording" visual pulse class.');
  } else {
    console.error('  Fail: Button missing "recording" class!');
    process.exit(1);
  }

  if (recordTextSpan.innerText === 'Stop Recording') {
    console.log('  Pass: Button text successfully toggled to "Stop Recording".');
  } else {
    console.error('  Fail: Text should be "Stop Recording", got:', recordTextSpan.innerText);
    process.exit(1);
  }

  // Stop recording
  window.stopAudioRecording();

  // Validate Saved State
  setTimeout(() => {
    const selector = window.getUniqueSelector(mockTarget);
    const entry = window.state.stagedChanges.get(selector);

    if (entry && entry.voiceNote) {
      console.log('  Pass: Voice note metadata registered in staged changes state.');
      console.log('    Filename:', entry.voiceNote.filename);
      console.log('    Absolute Path:', entry.voiceNote.absolutePath);
      console.log('    URI reference:', entry.voiceNote.urlPath);
      
      if (entry.voiceNote.absolutePath.includes('.ai-staging\\audio\\') && entry.voiceNote.absolutePath.endsWith('_feedback.wav')) {
        console.log('    Pass: Absolute local file path format matches perfectly!');
      } else {
        console.error('    Fail: Local file path format is incorrect!', entry.voiceNote.absolutePath);
        process.exit(1);
      }
    } else {
      console.error('  Fail: Voice note not registered in state!');
      process.exit(1);
    }

    if (recordTextSpan.innerText === 'Re-record Voice Note') {
      console.log('  Pass: Button text successfully changed to "Re-record Voice Note".');
    } else {
      console.error('  Fail: Expected "Re-record Voice Note", got:', recordTextSpan.innerText);
      process.exit(1);
    }

    if (!mockElements['btn-voice-delete'].classList.contains('hidden')) {
      console.log('  Pass: Delete button is now visible.');
    } else {
      console.error('  Fail: Delete button should be visible!');
      process.exit(1);
    }

    // Test Case 4: Microphone DOM Badges Reactivity
    console.log('Test 4: Verification of floating microphone DOM badges...');
    const targetBadges = mockTarget.children.filter(c => c.classList.contains('voice-badge'));
    if (targetBadges.length === 1 && targetBadges[0].innerText === '🎤') {
      console.log('  Pass: Microphone DOM Badge floating element reactively created and appended.');
    } else {
      console.error('  Fail: Microphone badge not found inside target element!', targetBadges);
      process.exit(1);
    }

    if (mockTarget.style.position === 'relative') {
      console.log('  Pass: Dynamic layout compensation set target to position:relative.');
    } else {
      console.error('  Fail: Target element position should be "relative" for clean badge anchoring.');
      process.exit(1);
    }

    // Test Case 5: Prompt Compiler Integration
    console.log('Test 5: Prompt compiler integration in generateMarkdownRecipe...');
    const recipe = window.generateMarkdownRecipe();
    console.log('  Compiled Markdown Recipe preview:');
    console.log('--------------------------------------------------');
    console.log(recipe);
    console.log('--------------------------------------------------');

    if (recipe.includes('d:\\Github Repos\\Extensiones_Ideas\\visual_ai_staging\\.ai-staging\\audio\\') && 
        recipe.includes('file:///d:/Github%20Repos/Extensiones_Ideas/visual_ai_staging/.ai-staging/audio/')) {
      console.log('  Pass: Markdown successfully compiled and integrates absolute and URI references.');
    } else {
      console.error('  Fail: Markdown compiler did not include target voice annotation files correctly!');
      process.exit(1);
    }

    // Test Case 6: Deleting Voice Note
    console.log('Test 6: Deleting voice note annotation...');
    window.deleteVoiceNote();

    const emptyEntry = window.state.stagedChanges.get(selector);
    if (!emptyEntry) {
      console.log('  Pass: Selector entry cleaned from state (since no visual styles were changed).');
    } else {
      console.error('  Fail: Empty selector entry remained in state!', emptyEntry);
      process.exit(1);
    }

    const cleanBadges = mockTarget.children.filter(c => c.classList.contains('voice-badge'));
    if (cleanBadges.length === 0) {
      console.log('  Pass: Floating Microphone DOM Badge reactively cleaned and removed.');
    } else {
      console.error('  Fail: Badge was not cleaned up after delete!');
      process.exit(1);
    }

    if (mockTarget.style.position === '') {
      console.log('  Pass: Relative position style cleaned up on deletion.');
    } else {
      console.error('  Fail: Style position not cleaned up!', mockTarget.style.position);
      process.exit(1);
    }

    console.log('=== ALL MILESTONE 4 TESTS COMPLETED SUCCESSFULLY! ===');
    process.exit(0);
  }, 100);
}, 100);
