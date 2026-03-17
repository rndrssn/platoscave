'use strict';

(function applyConfiguredTheme() {
  var configured = (window.PLATOSCAVE_THEME || '').trim();
  var root = document.documentElement;

  if (!configured || configured === 'default' || configured === 'base') {
    root.removeAttribute('data-theme');
    return;
  }

  root.setAttribute('data-theme', configured);
})();
