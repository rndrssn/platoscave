'use strict';

class FakeClassList {
  constructor(owner) {
    this.owner = owner;
    this.set = new Set();
  }

  add(name) { this.set.add(name); this._sync(); }
  remove(name) { this.set.delete(name); this._sync(); }
  contains(name) { return this.set.has(name); }

  toggle(name, force) {
    if (force === true) {
      this.set.add(name);
      this._sync();
      return true;
    }
    if (force === false) {
      this.set.delete(name);
      this._sync();
      return false;
    }
    if (this.set.has(name)) {
      this.set.delete(name);
      this._sync();
      return false;
    }
    this.set.add(name);
    this._sync();
    return true;
  }

  _sync() {
    this.owner.className = Array.from(this.set).join(' ');
  }
}

class FakeElement {
  constructor(tagName, opts) {
    const options = opts || {};
    this.tagName = tagName.toUpperCase();
    this.id = options.id || '';
    this.name = options.name || '';
    this.value = options.value || '';
    this.checked = !!options.checked;
    this.hidden = !!options.hidden;
    this.disabled = !!options.disabled;
    this.textContent = options.textContent || '';
    this.className = options.className || '';
    this.dataset = options.dataset || {};
    this.attributes = Object.assign({}, options.attributes || {});
    this.children = [];
    this.parent = null;
    this.listeners = Object.create(null);
    this.classList = new FakeClassList(this);

    if (this.className) {
      this.className.split(/\s+/).filter(Boolean).forEach((c) => this.classList.add(c));
    }
  }

  addEventListener(type, cb) {
    if (!this.listeners[type]) this.listeners[type] = [];
    this.listeners[type].push(cb);
  }

  dispatchEvent(evt) {
    const event = evt || { type: 'unknown' };
    if (!event.type) throw new Error('Event type required');
    if (!event.preventDefault) event.preventDefault = function() {};
    event.target = this;
    const list = this.listeners[event.type] || [];
    list.forEach((cb) => cb.call(this, event));
  }

  click() {
    if (this.disabled) return;
    this.dispatchEvent({ type: 'click', preventDefault: function() {} });
  }

  setAttribute(name, value) {
    this.attributes[name] = String(value);
  }

  getAttribute(name) {
    if (Object.prototype.hasOwnProperty.call(this.attributes, name)) return this.attributes[name];
    return null;
  }

  removeAttribute(name) {
    delete this.attributes[name];
  }

  appendChild(child) {
    child.parent = this;
    this.children.push(child);
    return child;
  }

  removeChild(child) {
    const idx = this.children.indexOf(child);
    if (idx >= 0) {
      this.children.splice(idx, 1);
      child.parent = null;
    }
    return child;
  }

  get firstChild() {
    return this.children.length > 0 ? this.children[0] : null;
  }

  querySelector(selector) {
    if (!this.ownerDocument) return null;
    return this.ownerDocument.querySelector(selector);
  }

  querySelectorAll(selector) {
    if (!this.ownerDocument) return [];
    return this.ownerDocument.querySelectorAll(selector);
  }

  scrollIntoView() {}

  getBoundingClientRect() {
    return { top: 0, left: 0, width: 100, height: 20 };
  }

  set innerHTML(_v) {
    this.children = [];
    this.textContent = '';
  }

  get innerHTML() {
    return '';
  }
}

class FakeDocument {
  constructor() {
    this.elementsById = new Map();
    this.elements = [];
    this.documentElement = new FakeElement('html', { id: 'documentElement' });
    this.documentElement.ownerDocument = this;
    this.elements.push(this.documentElement);
  }

  register(el) {
    el.ownerDocument = this;
    this.elements.push(el);
    if (el.id) this.elementsById.set(el.id, el);
    return el;
  }

  createElement(tagName) {
    return this.register(new FakeElement(tagName));
  }

  getElementById(id) {
    return this.elementsById.get(id) || null;
  }

  querySelector(selector) {
    const all = this.querySelectorAll(selector);
    return all.length > 0 ? all[0] : null;
  }

  querySelectorAll(selector) {
    if (selector.startsWith('#')) {
      const el = this.getElementById(selector.slice(1));
      return el ? [el] : [];
    }

    if (selector.startsWith('.')) {
      const cls = selector.slice(1);
      return this.elements.filter((e) => e.classList.contains(cls));
    }

    const inputMatch = selector.match(/^input\[name="([^"]+)"\](?::checked)?$/);
    if (inputMatch) {
      const inputName = inputMatch[1];
      const checkedOnly = selector.endsWith(':checked');
      return this.elements.filter((e) => {
        if (e.tagName !== 'INPUT') return false;
        if (e.name !== inputName) return false;
        return checkedOnly ? !!e.checked : true;
      });
    }

    return [];
  }
}

function buildWindow(doc) {
  return {
    document: doc,
    pageYOffset: 0,
    scrollTo: function() {},
  };
}

module.exports = {
  FakeDocument,
  FakeElement,
  buildWindow,
};
