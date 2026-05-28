// Unit tests for nav-controller.js: active link detection and nav swatch application.
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const source = fs.readFileSync(path.join(__dirname, '..', 'js', 'nav-controller.js'), 'utf8');

function makeClassList() {
  const set = new Set();
  return {
    set,
    add(name) { set.add(name); },
    remove(name) { set.delete(name); },
    contains(name) { return set.has(name); },
  };
}

function makeElement(className) {
  const listeners = Object.create(null);
  const attrs = Object.create(null);
  const classList = makeClassList();
  const children = [];
  let storedClassName = className || '';
  (className || '').split(/\s+/).filter(Boolean).forEach((c) => classList.add(c));

  const element = {
    classList,
    children,
    textContent: '',
    href: '',
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
    appendChild(child) {
      children.push(child);
      return child;
    },
    querySelector(selector) {
      if (selector === '.footer-text') {
        return children.find((child) => child.classList && child.classList.contains('footer-text')) || null;
      }
      if (selector === '.footer-socials') {
        return children.find((child) => child.classList && child.classList.contains('footer-socials')) || null;
      }
      return null;
    },
    contains(target) {
      return target === this;
    },
  };
  Object.defineProperty(element, 'className', {
    get() {
      return storedClassName;
    },
    set(value) {
      storedClassName = String(value || '');
      classList.set.clear();
      storedClassName.split(/\s+/).filter(Boolean).forEach((c) => classList.add(c));
    },
  });
  element.className = storedClassName;
  return element;
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function run() {
  const docListeners = Object.create(null);
  const navToggle = makeElement('nav-mobile-toggle');
  const navLinks = makeElement('nav-links');
  const footer = makeElement('');

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
      if (selector === 'footer') return footer;
      return null;
    },
    createElement(tagName) {
      return makeElement('');
    },
    createTextNode(value) {
      return { nodeType: 3, textContent: String(value) };
    },
  };

  const context = { document, window: {} };
  vm.createContext(context);
  vm.runInContext(source, context, { filename: 'nav-controller.js' });

  document.emit('DOMContentLoaded');

  const footerText = footer.querySelector('.footer-text');
  assert(footerText, 'Expected shared footer text to be rendered');
  assert(footerText.children.some((child) => child.href === './colophon/'), 'Expected Site Notes footer link');
  assert(
    footerText.children.some((child) => child.classList && child.classList.contains('footer-socials')),
    'Expected shared footer socials'
  );

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
