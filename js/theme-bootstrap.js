'use strict';

(function applyConfiguredTheme() {
  var configured = (window.PLATOSCAVE_THEME || '').trim();
  var root = document.documentElement;
  var THEME_STYLESHEET_ID = 'platoscave-theme-runtime';
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
    'decision-collision-cold-contrast',
    'brutalist-max',
    'neon-bowie',
    'arcade-afterglow',
    'laser-bauhaus',
    'chrome-glam',
    'minimalist-brutalist',
  ];

  function removeThemeStylesheet() {
    if (!document || typeof document.getElementById !== 'function') return;
    var existing = document.getElementById(THEME_STYLESHEET_ID);
    if (existing && existing.parentNode && typeof existing.parentNode.removeChild === 'function') {
      existing.parentNode.removeChild(existing);
    }
  }

  function getBootstrapBaseHref() {
    if (!document || typeof document.getElementsByTagName !== 'function') return '';
    var scripts = document.getElementsByTagName('script');
    for (var i = 0; i < scripts.length; i += 1) {
      var script = scripts[i];
      var src = '';
      if (script && typeof script.src === 'string' && script.src) src = script.src;
      if (!src && script && typeof script.getAttribute === 'function') {
        src = script.getAttribute('src') || '';
      }
      if (!src) continue;
      if (!/js\/theme-bootstrap\.js(?:[?#].*)?$/i.test(src)) continue;
      return src.replace(/js\/theme-bootstrap\.js(?:[?#].*)?$/i, '');
    }
    return '';
  }

  function getThemeStylesheetHref(themeName) {
    if (!themeName) return '';
    var baseHref = getBootstrapBaseHref();
    if (!baseHref) return '';
    try {
      return new URL('css/themes/' + themeName + '.css', baseHref).toString();
    } catch (_err) {
      return '';
    }
  }

  function applyThemeStylesheet(themeName) {
    removeThemeStylesheet();
    if (!themeName) return;
    if (!document || !document.head || typeof document.createElement !== 'function') return;
    var href = getThemeStylesheetHref(themeName);
    if (!href) return;
    var link = document.createElement('link');
    link.id = THEME_STYLESHEET_ID;
    link.rel = 'stylesheet';
    link.href = href;
    link.setAttribute('data-theme-file', themeName);
    document.head.appendChild(link);
  }

  root.classList.add('js-enabled');

  if (!configured || configured === 'default' || configured === 'base') {
    root.removeAttribute('data-theme');
    removeThemeStylesheet();
    return;
  }

  if (AVAILABLE_THEMES.indexOf(configured) === -1) {
    if (typeof console !== 'undefined' && typeof console.warn === 'function') {
      console.warn('Unknown PLATOSCAVE_THEME:', configured, '- using default theme');
    }
    root.removeAttribute('data-theme');
    removeThemeStylesheet();
    return;
  }

  root.setAttribute('data-theme', configured);
  applyThemeStylesheet(configured);
})();
