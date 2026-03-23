'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const source = fs.readFileSync(path.join(__dirname, '..', 'js', 'nav-controller.js'), 'utf8');

function makeClassList() {
  const set = new Set();
  return {
    add(name) { set.add(name); },
    remove(name) { set.delete(name); },
    contains(name) { return set.has(name); },
  };
}

function makeElement(className) {
  const listeners = Object.create(null);
  const attrs = Object.create(null);
  const classList = makeClassList();
  (className || '').split(/\s+/).filter(Boolean).forEach((c) => classList.add(c));

  return {
    classList,
    addEventListener(type, cb) {
      if (!listeners[type]) listeners[type] = [];
      listeners[type].push(cb);
    },
    emit(type, event) {
      const arr = listeners[type] || [];
      arr.forEach((cb) => cb.call(this, event || { type, target: this }));
    },
    setAttribute(name, value) {
      attrs[name] = String(value);
    },
    getAttribute(name) {
      return Object.prototype.hasOwnProperty.call(attrs, name) ? attrs[name] : null;
    },
    contains(target) {
      return target === this;
    },
  };
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function run() {
  const docListeners = Object.create(null);
  const navToggle = makeElement('nav-mobile-toggle');
  const navLinks = makeElement('nav-links');

  const document = {
    addEventListener(type, cb) {
      if (!docListeners[type]) docListeners[type] = [];
      docListeners[type].push(cb);
    },
    emit(type, event) {
      const arr = docListeners[type] || [];
      arr.forEach((cb) => cb.call(document, event || { type }));
    },
    querySelector(selector) {
      if (selector === '.nav-mobile-toggle') return navToggle;
      if (selector === '.nav-links') return navLinks;
      return null;
    },
  };

  const context = { document, window: {} };
  vm.createContext(context);
  vm.runInContext(source, context, { filename: 'nav-controller.js' });

  document.emit('DOMContentLoaded');

  navToggle.emit('click', { type: 'click', target: navToggle });
  assert(navLinks.classList.contains('is-open'), 'Expected menu open after toggle click');
  assert(navToggle.getAttribute('aria-expanded') === 'true', 'Expected aria-expanded=true when open');

  const outside = makeElement('outside');
  document.emit('pointerdown', { type: 'pointerdown', target: outside });
  assert(!navLinks.classList.contains('is-open'), 'Expected outside pointerdown to close menu');
  assert(navToggle.getAttribute('aria-expanded') === 'false', 'Expected aria-expanded=false when closed');

  navToggle.emit('click', { type: 'click', target: navToggle });
  assert(navLinks.classList.contains('is-open'), 'Expected menu open before Escape test');
  document.emit('keydown', { type: 'keydown', key: 'Escape' });
  assert(!navLinks.classList.contains('is-open'), 'Expected Escape to close menu');

  navToggle.emit('click', { type: 'click', target: navToggle });
  assert(navLinks.classList.contains('is-open'), 'Expected menu open before nav-link click test');
  const linkTarget = {
    closest(selector) {
      if (selector === '.nav-link') return { ok: true };
      return null;
    },
  };
  navLinks.emit('click', { type: 'click', target: linkTarget });
  assert(!navLinks.classList.contains('is-open'), 'Expected nav-link click to close menu');

  console.log('PASS: tests/test-nav-controller.js');
}

run();
