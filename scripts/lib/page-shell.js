'use strict';

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeAttr(value) {
  return escapeHtml(value).replace(/`/g, '&#96;');
}

function navHtml(prefix, active) {
  const homeClass = active === 'home' ? 'nav-link nav-link--active' : 'nav-link';
  const modulesClass = active === 'modules' ? 'nav-link nav-link--active' : 'nav-link';
  const notesClass = active === 'notes' ? 'nav-link nav-link--active' : 'nav-link';
  const notesCurrent = active === 'notes' ? ' aria-current="page"' : '';
  const modulesCurrent = active === 'modules' ? ' aria-current="page"' : '';

  return '  <nav class="main-nav">\n'
    + '    <a class="nav-title" href="' + prefix + '">To the Bedrock</a>\n'
    + '    <div class="nav-links" id="primary-nav">\n'
    + '      <a class="' + homeClass + '" href="' + prefix + '">Home</a>\n'
    + '      <a class="' + notesClass + '" href="' + prefix + 'notes/"' + notesCurrent + '>Notes</a>\n'
    + '      <a class="' + modulesClass + '" href="' + prefix + 'modules/"' + modulesCurrent + '>Modules</a>\n'
    + '    </div>\n'
    + '    <button class="nav-mobile-toggle" aria-label="Toggle menu" aria-controls="primary-nav" aria-expanded="false">&#x22EF;</button>\n'
    + '  </nav>';
}

function htmlShell(params) {
  const title = params.title;
  const description = params.description;
  const prefix = params.prefix;
  const nav = params.nav;
  const main = params.main;
  const extraScripts = Array.isArray(params.extraScripts) ? params.extraScripts : [];

  return '<!DOCTYPE html>\n'
    + '<html lang="en">\n'
    + '<head>\n'
    + '  <meta charset="UTF-8" />\n'
    + '  <meta name="viewport" content="width=device-width, initial-scale=1.0" />\n'
    + '  <meta name="description" content="' + escapeAttr(description) + '" />\n'
    + '  <title>' + escapeHtml(title) + '</title>\n'
    + '  <script src="' + prefix + 'theme.config.js"></script>\n'
    + '  <script src="' + prefix + 'js/theme-bootstrap.js"></script>\n'
    + '  <link rel="preload" href="' + prefix + 'assets/fonts/JTUSjIg69CK48gW7PXoo9Wlhyw.woff2" as="font" type="font/woff2" crossorigin />\n'
    + '  <link rel="preload" href="' + prefix + 'assets/fonts/i7dPIFZifjKcF5UAWdDRYEF8RQ.woff2" as="font" type="font/woff2" crossorigin />\n'
    + '  <link rel="stylesheet" href="' + prefix + 'css/main.css" />\n'
    + '</head>\n'
    + '<body>\n'
    + '  <a class="skip-link" href="#main-content">Skip to main content</a>\n\n'
    + nav + '\n\n'
    + '  <main id="main-content" class="main--narrow">\n'
    + main + '\n'
    + '  </main>\n\n'
    + '  <footer>\n'
    + '    <p class="footer-text">&copy; 2026 Robert Andersson &middot; To the Bedrock &middot; <a href="' + prefix + 'colophon/" class="footer-link">Site Notes</a></p>\n'
    + '  </footer>\n\n'
    + extraScripts.map((src) => '  <script src="' + escapeAttr(src) + '"></script>\n').join('')
    + '  <script src="' + prefix + 'js/nav-controller.js"></script>\n'
    + '</body>\n'
    + '</html>\n';
}

module.exports = {
  navHtml,
  htmlShell,
};
