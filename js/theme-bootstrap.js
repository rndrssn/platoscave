'use strict';

(function applyConfiguredTheme() {
  var configured = (window.PLATOSCAVE_THEME || '').trim();
  var root = document.documentElement;
  root.classList.add('js-enabled');

  if (!configured || configured === 'default' || configured === 'base') {
    root.removeAttribute('data-theme');
    return;
  }

  root.setAttribute('data-theme', configured);
})();

(function addMobileNavDismissBehavior() {
  if (
    !document ||
    typeof document.addEventListener !== 'function' ||
    typeof document.querySelector !== 'function'
  ) {
    return;
  }

  document.addEventListener('DOMContentLoaded', function () {
    var navToggle = document.querySelector('.nav-mobile-toggle');
    var navLinks = document.querySelector('.nav-links');

    if (!navToggle || !navLinks) return;

    function closeMenu() {
      if (!navLinks.classList.contains('is-open')) return;
      navLinks.classList.remove('is-open');
      navToggle.setAttribute('aria-expanded', 'false');
    }

    document.addEventListener('pointerdown', function (event) {
      if (!navLinks.classList.contains('is-open')) return;
      var target = event.target;
      if (navLinks.contains(target) || navToggle.contains(target)) return;
      closeMenu();
    });

    document.addEventListener('keydown', function (event) {
      if (event.key !== 'Escape') return;
      closeMenu();
    });
  });
})();
