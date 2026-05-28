// Contract tests: checks the site-wide link language stays centralized and quiet.
'use strict';

const fs = require('fs');
const path = require('path');
const { readCssWithImports } = require('./helpers/read-css-with-imports.js');

const pagesSource = fs.readFileSync(path.join(__dirname, '..', 'css', 'pages.css'), 'utf8');
const componentsSource = readCssWithImports(path.join(__dirname, '..', 'css', 'components.css'));
const contentCardsSource = fs.readFileSync(path.join(__dirname, '..', 'css', 'pages', 'content-cards.css'), 'utf8');
const linkLanguageSource = fs.readFileSync(path.join(__dirname, '..', 'css', 'pages', 'link-language.css'), 'utf8');
const tokensSource = fs.readFileSync(path.join(__dirname, '..', 'css', 'tokens.css'), 'utf8');

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
    '.module-back-link',
    '.module-sub-nav .module-sub-nav-link',
    '.module-context-link',
    '.essay-link-label',
    '.note-index-tags .module-tag',
    '.note-index-more',
    '.footer-socials .footer-social-link--cv',
    '.ep-jump',
    '.satellite-three-index-link',
    'a.eq-ref',
    ':is(.essay-body, .module-header-body, .hero-body, .field-notes-body, .diagnosis-body, .note-content, .experience-skill-body) a'
  ];

  for (const snippet of requiredSnippets) {
    assert(
      linkLanguageSource.includes(snippet),
      'css/pages/link-language.css missing canonical selector: ' + snippet
    );
  }
}

function testQuietCanonicalLinkLayer() {
  assert(
    /text-decoration-line\s*:\s*underline/i.test(linkLanguageSource),
    'css/pages/link-language.css should use a restrained underline affordance for prose links'
  );
  assert(
    !/--link-surface-(inline|nav|cta|footer)-visited/.test(linkLanguageSource),
    'css/pages/link-language.css should not reintroduce visually distinct visited link surfaces'
  );
  assert(
    !/background\s*:\s*var\(--link-surface-(inline|cta|footer)/.test(linkLanguageSource),
    'css/pages/link-language.css should avoid bright chip backgrounds for prose, CTA, or footer links'
  );
  assert(
    !/\[data-theme\]/.test(linkLanguageSource),
    'css/pages/link-language.css should be theme-agnostic (tokens only, no [data-theme] selectors)'
  );
}

function testBentoActiveLinkCueStaysOnLeftBar() {
  assert(
    /\.nav-sublink--catalogue-child\.nav-sublink--active[\s\S]*padding-left:\s*1\.5rem;[\s\S]*border-left-color:/m.test(componentsSource),
    'Active bento catalogue children should keep normal indentation and highlight the left vertical only'
  );
  assert(
    !/\.nav-sublink--catalogue-child\.nav-sublink--active[\s\S]*padding-left:\s*1\.75rem;/m.test(componentsSource),
    'Active bento catalogue children should not add an active-state indent'
  );
  assert(
    /\.nav-sublink--catalogue-child\.nav-sublink--active[\s\S]*box-shadow:\s*none;/m.test(linkLanguageSource),
    'Active bento catalogue children should not render the shared active underline'
  );
}

function testNeutralLinkTokens() {
  const requiredTokens = [
    '--link-text:',
    '--link-text-hover:',
    '--link-text-muted:',
    '--link-underline:',
    '--link-underline-hover:',
    '--link-surface-subtle:',
    '--link-surface-active:'
  ];

  for (const token of requiredTokens) {
    assert(tokensSource.includes(token), 'css/tokens.css missing quiet link token: ' + token);
  }

  assert(
    !/--tag-chip:\s*#[fF]{2}/.test(tokensSource),
    'Tag chips should not use hot accent color as the default link treatment'
  );
}

function run() {
  testLinkLanguageLoadedLast();
  testLegacyHomeSchemaRemovedFromComponents();
  testThemeScopedContentLinkOverridesRemoved();
  testLegacyNotesUnderlineRulesRemoved();
  testCanonicalLinkLayerCoverage();
  testQuietCanonicalLinkLayer();
  testBentoActiveLinkCueStaysOnLeftBar();
  testNeutralLinkTokens();
  console.log('PASS: tests/test-link-language-contract.js');
}

run();
