'use strict';

(function applyConfiguredTheme() {
  var configured = (window.PLATOSCAVE_THEME || '').trim();
  var root = document.documentElement;
  var THEME_STYLESHEET_ID = 'platoscave-theme-runtime';
  var AVAILABLE_THEMES = [
    'new-yorker',
    'decision-collision-cold',
    'decision-collision-cold-contrast',
    'brutalist-max',
    'neon-bowie',
    'arcade-afterglow',
    'laser-bauhaus',
    'chrome-glam',
    'minimalist-brutalist',
    'neon-brutalist-extreme',
    'neon-brutalist-daylight',
  ];
  var THEME_ALIASES = {
    'collision-decision-cold': 'decision-collision-cold'
  };

  function removeThemeStylesheet() {
    if (!document || typeof document.getElementById !== 'function') return;
    var existing = document.getElementById(THEME_STYLESHEET_ID);
    if (existing && existing.parentNode && typeof existing.parentNode.removeChild === 'function') {
      existing.parentNode.removeChild(existing);
    }
  }

  function getBootstrapBaseHref() {
    if (!document || typeof document.getElementsByTagName !== 'function') return '';
    // Preferred: document.currentScript is reliable for synchronously-executing scripts.
    if (document.currentScript && typeof document.currentScript.src === 'string') {
      var currentSrc = document.currentScript.src;
      if (/js\/theme-bootstrap\.js(?:[?#].*)?$/i.test(currentSrc)) {
        return currentSrc.replace(/js\/theme-bootstrap\.js(?:[?#].*)?$/i, '');
      }
    }
    // Fallback: scan all script tags (handles async/deferred or older environments).
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

  function normalizeThemeName(rawTheme) {
    var trimmed = (rawTheme || '').trim();
    if (!trimmed || trimmed === 'default' || trimmed === 'base') return '';

    if (Object.prototype.hasOwnProperty.call(THEME_ALIASES, trimmed)) {
      var canonical = THEME_ALIASES[trimmed];
      if (typeof console !== 'undefined' && typeof console.warn === 'function') {
        console.warn('Deprecated PLATOSCAVE_THEME alias:', trimmed, '- using', canonical);
      }
      return canonical;
    }

    return trimmed;
  }

  root.classList.add('js-enabled');

  configured = normalizeThemeName(configured);

  if (!configured) {
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
