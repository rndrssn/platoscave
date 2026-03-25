'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { FakeDocument, FakeElement, buildWindow } = require('./helpers/fake-dom');

function createD3Stub() {
  function createNode(tagName) {
    return {
      tagName,
      attrs: Object.create(null),
      styles: Object.create(null),
      textContent: '',
      children: [],
      parent: null,
      getBBox() {
        const text = String(this.textContent || '');
        const w = Math.max(2, text.length * 6);
        return { x: -w / 2, y: -6, width: w, height: 12 };
      },
      getComputedTextLength() {
        const text = String(this.textContent || '');
        return Math.max(1, text.length * 6);
      },
    };
  }

  function removeNode(node) {
    if (!node || !node.parent) return;
    const idx = node.parent.children.indexOf(node);
    if (idx >= 0) node.parent.children.splice(idx, 1);
    node.parent = null;
  }

  class Selection {
    constructor(node, isEmpty) {
      this._node = node || null;
      this._empty = !!isEmpty || !node;
    }

    empty() { return this._empty; }

    node() {
      if (this._empty) {
        return {
          getBBox: function() { return { x: 0, y: 0, width: 0, height: 0 }; },
          getComputedTextLength: function() { return 0; },
        };
      }
      return this._node;
    }

    attr(name, value) {
      if (this._empty) return value === undefined ? undefined : this;
      if (value === undefined) return this._node.attrs[name];
      let next = value;
      if (typeof value === 'function') next = value.call(this._node);
      if (next === null || next === undefined) delete this._node.attrs[name];
      else this._node.attrs[name] = String(next);
      return this;
    }

    style(name, value) {
      if (this._empty) return value === undefined ? undefined : this;
      if (value === undefined) return this._node.styles[name];
      let next = value;
      if (typeof value === 'function') next = value.call(this._node);
      this._node.styles[name] = String(next);
      return this;
    }

    text(value) {
      if (this._empty) return value === undefined ? '' : this;
      if (value === undefined) return this._node.textContent;
      this._node.textContent = String(value);
      return this;
    }

    append(tagName) {
      if (this._empty) return new Selection(null, true);
      const child = createNode(tagName);
      child.parent = this._node;
      this._node.children.push(child);
      return new Selection(child, false);
    }

    insert(tagName) {
      return this.append(tagName);
    }

    select(tagName) {
      if (this._empty) return new Selection(null, true);
      const found = this._node.children.find((c) => c.tagName === tagName);
      return found ? new Selection(found, false) : new Selection(null, true);
    }

    selectAll(selector) {
      return new MultiSelection(this._node, selector, this._empty);
    }

    remove() {
      if (!this._empty) removeNode(this._node);
      return this;
    }

    interrupt() {
      return this;
    }

    transition() {
      return new Transition(this);
    }
  }

  class MultiSelection {
    constructor(parent, selector, isEmpty) {
      this.parent = parent || null;
      this.selector = selector;
      this._empty = !!isEmpty || !parent;
    }

    remove() {
      if (this._empty) return this;
      if (this.selector === '*') {
        this.parent.children = [];
        return this;
      }
      this.parent.children = this.parent.children.filter((child) => child.tagName !== this.selector);
      return this;
    }

    interrupt() {
      return this;
    }
  }

  class Transition {
    constructor(selection) {
      this.selection = selection;
    }

    duration() { return this; }
    ease() { return this; }

    attr(name, value) {
      this.selection.attr(name, value);
      return this;
    }

    style(name, value) {
      this.selection.style(name, value);
      return this;
    }

    on() {
      // Intentionally do not auto-fire transition callbacks in unit tests.
      return this;
    }

    transition() {
      return this;
    }

    remove() {
      this.selection.remove();
      return this;
    }
  }

  const roots = new WeakMap();
  return {
    select(hostEl) {
      if (!roots.has(hostEl)) roots.set(hostEl, createNode('svg-root'));
      return new Selection(roots.get(hostEl), false);
    },
    easeCubicInOut: function(v) { return v; },
    easeCubicOut: function(v) { return v; },
  };
}

function makeHarness() {
  const document = new FakeDocument();
  const windowObj = buildWindow(document);

  const svgEl = document.register(new FakeElement('svg', { id: 'can-explainer-svg' }));
  const stopBtn = document.register(new FakeElement('button', { id: 'can-stop-btn' }));
  const playBtn = document.register(new FakeElement('button', { id: 'can-play-btn' }));
  const resetBtn = document.register(new FakeElement('button', { id: 'can-reset-btn' }));
  const captionEl = document.register(new FakeElement('p', { id: 'can-explainer-caption' }));

  svgEl.getBoundingClientRect = function() {
    return { top: 0, left: 0, width: 920, height: 560 };
  };

  let nextTimerId = 0;
  const timers = new Map();
  windowObj.setTimeout = function(fn, ms) {
    nextTimerId += 1;
    timers.set(nextTimerId, { fn, ms });
    return nextTimerId;
  };
  windowObj.clearTimeout = function(id) {
    timers.delete(id);
  };
  windowObj.getComputedStyle = function() {
    return {
      getPropertyValue: function() { return ''; },
    };
  };

  return {
    document,
    window: windowObj,
    d3: createD3Stub(),
    svgEl,
    stopBtn,
    playBtn,
    resetBtn,
    captionEl,
    timers,
  };
}

function loadScript(contextHarness) {
  const source = fs.readFileSync(path.join(__dirname, '..', 'modules', 'garbage-can', 'can-explainer', 'can-explainer.js'), 'utf8');
  const context = {
    document: contextHarness.document,
    window: contextHarness.window,
    d3: contextHarness.d3,
    console,
    Math,
  };
  vm.createContext(context);
  vm.runInContext(source, context, { filename: 'can-explainer.js' });
}

function run() {
  const html = fs.readFileSync(
    path.join(__dirname, '..', 'modules', 'garbage-can', 'can-explainer', 'index.html'),
    'utf8'
  );

  assert(/id="can-explainer-svg"/.test(html), 'can-explainer DOM contract: missing #can-explainer-svg');
  assert(/id="can-stop-btn"/.test(html), 'can-explainer DOM contract: missing #can-stop-btn');
  assert(/id="can-play-btn"/.test(html), 'can-explainer DOM contract: missing #can-play-btn');
  assert(/id="can-stop-btn"[^>]*aria-label="Stop animation"/.test(html), 'can-explainer DOM contract: missing stop aria-label');
  assert(/id="can-play-btn"[^>]*aria-label="Play animation"/.test(html), 'can-explainer DOM contract: missing play aria-label');
  assert(/id="can-reset-btn"/.test(html), 'can-explainer DOM contract: missing #can-reset-btn');
  assert(/id="can-explainer-caption"/.test(html), 'can-explainer DOM contract: missing #can-explainer-caption');

  const h = makeHarness();
  loadScript(h);

  assert(h.stopBtn.listeners.click && h.stopBtn.listeners.click.length === 1, 'stop button should bind one click handler');
  assert(h.playBtn.listeners.click && h.playBtn.listeners.click.length === 1, 'play button should bind one click handler');
  assert(h.resetBtn.listeners.click && h.resetBtn.listeners.click.length === 1, 'reset button should bind one click handler');

  assert.strictEqual(h.stopBtn.getAttribute('aria-pressed'), 'true', 'initial state should have stop active');
  assert.strictEqual(h.playBtn.getAttribute('aria-pressed'), 'false', 'initial state should have play inactive');
  assert.strictEqual(h.captionEl.textContent, '', 'caption should initialize empty');

  h.stopBtn.dispatchEvent({ type: 'click', preventDefault: function() {} });
  assert.strictEqual(h.stopBtn.getAttribute('aria-pressed'), 'false', 'stop click should pause animation');
  assert.strictEqual(h.playBtn.getAttribute('aria-pressed'), 'true', 'stop click should make play active');

  h.playBtn.dispatchEvent({ type: 'click', preventDefault: function() {} });
  assert.strictEqual(h.stopBtn.getAttribute('aria-pressed'), 'true', 'play click should resume animation');
  assert.strictEqual(h.playBtn.getAttribute('aria-pressed'), 'false', 'play click should make stop active');

  h.captionEl.textContent = 'temp';
  h.resetBtn.dispatchEvent({ type: 'click', preventDefault: function() {} });
  assert.strictEqual(h.stopBtn.getAttribute('aria-pressed'), 'true', 'reset should render running state (stop active)');
  assert.strictEqual(h.playBtn.getAttribute('aria-pressed'), 'false', 'reset should render running state (play inactive)');
  assert.strictEqual(h.captionEl.textContent, '', 'reset should clear caption text');

  console.log('PASS: tests/test-can-explainer-integration.js');
}

run();
