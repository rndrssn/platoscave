'use strict';

(function applyConfiguredTheme() {
  var configured = (window.PLATOSCAVE_THEME || '').trim();
  var root = document.documentElement;
  var AVAILABLE_THEMES = [
    'high-contrast',
    'editorial-electric',
    'editorial-skateboard',
    'urban-grid',
    'urban-grid1',
    'urban-grid2',
    'urban-grid3',
    'new-yorker',
    'emergent-systems',
    'decision-collision',
    'decision-collision-cold',
  ];

  root.classList.add('js-enabled');

  if (!configured || configured === 'default' || configured === 'base') {
    root.removeAttribute('data-theme');
    return;
  }

  if (AVAILABLE_THEMES.indexOf(configured) === -1) {
    if (typeof console !== 'undefined' && typeof console.warn === 'function') {
      console.warn('Unknown PLATOSCAVE_THEME:', configured, '- using default theme');
    }
    root.removeAttribute('data-theme');
    return;
  }

  root.setAttribute('data-theme', configured);
})();
