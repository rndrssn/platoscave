'use strict';

(function initGlobalNavController() {
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

    function isOpen() {
      return navLinks.classList.contains('is-open');
    }

    function setExpanded(open) {
      navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    }

    function openMenu() {
      navLinks.classList.add('is-open');
      setExpanded(true);
    }

    function closeMenu() {
      if (!isOpen()) return;
      navLinks.classList.remove('is-open');
      setExpanded(false);
    }

    function toggleMenu() {
      if (isOpen()) closeMenu();
      else openMenu();
    }

    navToggle.addEventListener('click', toggleMenu);

    document.addEventListener('pointerdown', function (event) {
      if (!isOpen()) return;
      var target = event.target;
      if (navLinks.contains(target) || navToggle.contains(target)) return;
      closeMenu();
    });

    document.addEventListener('keydown', function (event) {
      if (event.key !== 'Escape') return;
      closeMenu();
    });

    navLinks.addEventListener('click', function (event) {
      var target = event.target;
      if (!target || typeof target.closest !== 'function') return;
      if (target.closest('.nav-link')) closeMenu();
    });
  });
})();
