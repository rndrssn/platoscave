#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

function printUsage() {
  console.log(
    [
      'Usage:',
      '  node scripts/new-module.js --slug decision-theater --title "Decision Theater" [--section "Overview"] [--description "..."] [--dry-run]',
      '',
      'Creates /modules/<slug>/index.html using the canonical local section 01 landing pattern:',
      '- section 01 lives at /modules/<slug>/ (root)',
      '- module back-link points to /modules/',
      '- active local sub-nav link is 01 with href="./"',
    ].join('\n')
  );
}

function parseArgs(argv) {
  const out = Object.create(null);
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg.startsWith('--')) continue;
    const key = arg.slice(2);
    if (key === 'dry-run' || key === 'help') {
      out[key] = true;
      continue;
    }
    const value = argv[i + 1];
    if (!value || value.startsWith('--')) {
      throw new Error('Missing value for --' + key);
    }
    out[key] = value;
    i += 1;
  }
  return out;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderModuleLandingHtml(config) {
  const moduleTitle = escapeHtml(config.title);
  const sectionTitle = escapeHtml(config.section || 'Overview');
  const description = escapeHtml(
    config.description ||
      ('Module: ' + config.title + ' (draft).')
  );

  return [
    '<!DOCTYPE html>',
    '<html lang="en">',
    '<head>',
    '  <meta charset="UTF-8" />',
    '  <meta name="viewport" content="width=device-width, initial-scale=1.0" />',
    '  <meta name="description" content="' + description + '" />',
    '  <title>' + sectionTitle + ' · ' + moduleTitle + ' · To the Bedrock</title>',
    '  <script src="../../theme.config.js"></script>',
    '  <script src="../../js/theme-bootstrap.js"></script>',
    '  <link rel="preload" href="../../assets/fonts/JTUSjIg69CK48gW7PXoo9Wlhyw.woff2" as="font" type="font/woff2" crossorigin />',
    '  <link rel="preload" href="../../assets/fonts/i7dPIFZifjKcF5UAWdDRYEF8RQ.woff2" as="font" type="font/woff2" crossorigin />',
    '  <link rel="stylesheet" href="../../css/fonts.css" />',
    '  <link rel="stylesheet" href="../../css/tokens.css" />',
    '  <link rel="stylesheet" href="../../css/base.css" />',
    '  <link rel="stylesheet" href="../../css/layout.css" />',
    '  <link rel="stylesheet" href="../../css/components.css" />',
    '  <link rel="stylesheet" href="../../css/utilities.css" />',
    '  <link rel="stylesheet" href="../../css/themes.css" />',
    '  <link rel="stylesheet" href="../../css/gc-viz.css" />',
    '  <link rel="stylesheet" href="../../css/pages.css" />',
    '  <link rel="icon" type="image/png" href="../../assets/images/doodles/skate_c.png" />',
    '  <link rel="apple-touch-icon" href="../../assets/images/doodles/skate_c.png" />',
    '</head>',
    '<body>',
    '  <a class="skip-link" href="#main-content">Skip to main content</a>',
    '',
    '  <header class="site-header">',
    '    <a class="nav-title" href="../../">To the Bedrock</a>',
    '    <nav class="main-nav">',
    '    <div class="nav-links" id="primary-nav">',
    '      <a class="nav-link" href="../../">Home</a>',
    '      <a class="nav-link" href="../../notes/">Notes</a>',
    '      <a class="nav-link nav-link--active" href="../../modules/" aria-current="page">Modules</a>',
    '    </div>',
    '    <button class="nav-mobile-toggle" aria-label="Toggle menu" aria-controls="primary-nav" aria-expanded="false">&#x22EF;</button>',
    '    </nav>',
    '  </header>',
    '',
    '  <main id="main-content" class="main--narrow">',
    '    <div class="module-page">',
    '      <a class="module-back-link" href="../" aria-label="Back to Modules"></a>',
    '      <a class="module-header-number module-context-number module-context-link" href="./">' + moduleTitle + '</a>',
    '',
    '      <nav class="module-sub-nav" aria-label="Module sections">',
    '        <a class="module-sub-nav-link module-sub-nav-link--active" href="./" aria-current="page"><span class="module-sub-nav-number">01</span> ' + sectionTitle + '</a>',
    '      </nav>',
    '',
    '      <header class="module-header">',
    '        <h1 class="module-header-title">' + sectionTitle + '</h1>',
    '        <p class="module-header-body">Replace this draft text with the module narrative and section intent.</p>',
    '      </header>',
    '',
    '      <article class="module-essay">',
    '        <section class="essay-section">',
    '          <h2 class="essay-heading">Draft</h2>',
    '          <p class="essay-body">Build out this section. Keep section 01 canonical at this root path.</p>',
    '        </section>',
    '      </article>',
    '',
    '      <nav class="module-footer-nav module-footer-nav--section" aria-label="Section navigation">',
    '        <a class="footer-nav-link" href="../" aria-label="Back to Modules">',
    '          <span class="footer-nav-label-full">&larr; Back to Modules</span>',
    '          <span class="footer-nav-label-short">&larr; Modules</span>',
    '        </a>',
    '        <span></span>',
    '      </nav>',
    '    </div>',
    '  </main>',
    '',
    '  <footer>',
    '    <p class="footer-text">&copy; 2026 Robert Andersson &middot; To the Bedrock &middot; <a href="../../colophon/" class="footer-link">Site Notes</a></p>',
    '  </footer>',
    '',
    '  <script src="../../js/nav-controller.js"></script>',
    '</body>',
    '</html>',
    ''
  ].join('\n');
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printUsage();
    return;
  }

  const slug = String(args.slug || '').trim();
  const title = String(args.title || '').trim();

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw new Error('Expected --slug in kebab-case, for example decision-theater');
  }
  if (!title) {
    throw new Error('Expected --title');
  }

  const root = path.resolve(__dirname, '..');
  const moduleDir = path.join(root, 'modules', slug);
  const indexPath = path.join(moduleDir, 'index.html');

  if (fs.existsSync(indexPath)) {
    throw new Error('Refusing to overwrite existing module landing: ' + path.relative(root, indexPath));
  }

  const html = renderModuleLandingHtml({
    slug,
    title,
    section: args.section,
    description: args.description,
  });

  if (args['dry-run']) {
    console.log('DRY RUN: would create ' + path.relative(root, indexPath));
    return;
  }

  fs.mkdirSync(moduleDir, { recursive: true });
  fs.writeFileSync(indexPath, html, 'utf8');

  console.log('Created ' + path.relative(root, indexPath));
  console.log('Next steps:');
  console.log('1. Add the new module to modules/index.html');
  console.log('2. Add/update DEFAULT_MODULE_MENU_ITEMS in js/nav-controller.js');
  console.log('3. Run node tests/run-all.js');
}

try {
  main();
} catch (error) {
  console.error('FAIL:', error && error.message ? error.message : error);
  process.exit(1);
}
