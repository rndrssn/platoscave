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
