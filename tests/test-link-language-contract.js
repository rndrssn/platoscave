'use strict';

const fs = require('fs');
const path = require('path');

const pagesSource = fs.readFileSync(path.join(__dirname, '..', 'css', 'pages.css'), 'utf8');
const componentsSource = fs.readFileSync(path.join(__dirname, '..', 'css', 'components.css'), 'utf8');
const contentCardsSource = fs.readFileSync(path.join(__dirname, '..', 'css', 'pages', 'content-cards.css'), 'utf8');
const linkLanguageSource = fs.readFileSync(path.join(__dirname, '..', 'css', 'pages', 'link-language.css'), 'utf8');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function getPageImports(source) {
  return Array.from(source.matchAll(/@import\s+url\('([^']+)'\);/g)).map((m) => m[1]);
}

function testLinkLanguageLoadedLast() {
  const imports = getPageImports(pagesSource);
  assert(imports.length > 0, 'css/pages.css has no @import entries');
  assert(
    imports[imports.length - 1] === './pages/link-language.css',
    'css/pages.css must load ./pages/link-language.css as the final page layer import'
  );
}

function testLegacyHomeSchemaRemovedFromComponents() {
  assert(
    !componentsSource.includes("[data-doodle-layout='home'] .js-enabled .nav-links .nav-link.nav-link--editorial:not(.nav-modules-toggle)"),
    'Legacy home-scoped nav link schema should not live in css/components.css'
  );
}

function testThemeScopedContentLinkOverridesRemoved() {
  assert(
    !/\[data-theme\]\s+\.essay-body\s+a\s*,/.test(contentCardsSource),
    'Theme-scoped prose link overrides should be removed from css/pages/content-cards.css'
  );
}

function testLegacyNotesUnderlineRulesRemoved() {
  assert(
    !/\.note-index-tags\s+\.module-tag:hover[\s\S]*text-decoration\s*:\s*underline/i.test(contentCardsSource),
    'Legacy note-index tag underline hover should not remain in css/pages/content-cards.css'
  );
  assert(
    !/\.note-page-tags\s+\.module-tag:hover[\s\S]*text-decoration\s*:\s*underline/i.test(contentCardsSource),
    'Legacy note-page tag underline hover should not remain in css/pages/content-cards.css'
  );
  assert(
    !/\.note-index-more[\s\S]*text-decoration\s*:\s*underline/i.test(contentCardsSource),
    'Legacy note-index-more underline should not remain in css/pages/content-cards.css'
  );
}

function testCanonicalLinkLayerCoverage() {
  const requiredSnippets = [
    '.js-enabled .nav-links .nav-link.nav-link--editorial:not(.nav-modules-toggle)',
    '.nav-modules-submenu .nav-sublink',
    '.module-sub-nav .module-sub-nav-link',
    '.module-context-link',
    '.essay-link-label',
    '.note-index-tags .module-tag',
    '.note-index-more',
    '.footer-socials .footer-social-link--cv',
    '.ep-jump',
    ':is(.essay-body, .module-header-body, .hero-body, .field-notes-body, .diagnosis-body, .note-content) a'
  ];

  for (const snippet of requiredSnippets) {
    assert(
      linkLanguageSource.includes(snippet),
      'css/pages/link-language.css missing canonical selector: ' + snippet
    );
  }
}

function testNoUnderlineOrThemeSelectorInCanonicalLayer() {
  assert(
    !/text-decoration\s*:\s*underline/i.test(linkLanguageSource),
    'css/pages/link-language.css should avoid underline-based affordance'
  );
  assert(
    !/\[data-theme\]/.test(linkLanguageSource),
    'css/pages/link-language.css should be theme-agnostic (tokens only, no [data-theme] selectors)'
  );
}

function run() {
  testLinkLanguageLoadedLast();
  testLegacyHomeSchemaRemovedFromComponents();
  testThemeScopedContentLinkOverridesRemoved();
  testLegacyNotesUnderlineRulesRemoved();
  testCanonicalLinkLayerCoverage();
  testNoUnderlineOrThemeSelectorInCanonicalLayer();
  console.log('PASS: tests/test-link-language-contract.js');
}

run();
