'use strict';

const fs = require('fs');
const path = require('path');

const navControllerSource = fs.readFileSync(
  path.join(__dirname, '..', 'js', 'nav-controller.js'),
  'utf8'
);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function parseNavDefaults(source) {
  const blockMatch = source.match(/var\s+DEFAULT_MODULE_MENU_ITEMS\s*=\s*\[([\s\S]*?)\];/);
  assert(blockMatch, 'Could not locate DEFAULT_MODULE_MENU_ITEMS block in js/nav-controller.js');

  const block = blockMatch[1];
  const entryRegex = /{\s*number:\s*'([^']+)'\s*,\s*title:\s*'([^']*)'\s*,\s*slug:\s*'([^']*)'\s*,\s*path:\s*'([^']*)'\s*,\s*status:\s*'([^']+)'\s*}/g;
  const out = [];
  let match = entryRegex.exec(block);
  while (match) {
    out.push({
      number: match[1],
      title: match[2],
      slug: match[3],
      path: match[4],
      status: match[5],
    });
    match = entryRegex.exec(block);
  }

  assert(out.length > 0, 'No entries parsed from DEFAULT_MODULE_MENU_ITEMS');
  return out;
}

function read(relPath) {
  return fs.readFileSync(path.join(__dirname, '..', relPath), 'utf8');
}

function countActiveSubNavLinks(html) {
  const matches = html.match(/class="[^"]*module-sub-nav-link[^"]*module-sub-nav-link--active[^"]*"/g);
  return matches ? matches.length : 0;
}

function run() {
  const navEntries = parseNavDefaults(navControllerSource)
    .filter((entry) => entry.status === 'live' && entry.slug);

  navEntries.forEach((entry) => {
    assert(
      entry.path === entry.slug + '/',
      'Live module ' + entry.number + ' must land at /modules/' + entry.slug + '/ (found path=' + entry.path + ')'
    );

    const relIndexPath = path.join('modules', entry.slug, 'index.html');
    const html = read(relIndexPath);

    assert(
      !/<meta[^>]+http-equiv=["']refresh["']/i.test(html),
      relIndexPath + ' must be a real landing page, not a hard redirect'
    );

    assert(
      /<a[^>]*class="module-back-link"[^>]*href="\.\.\/"[^>]*aria-label="Back to Modules"[^>]*>\s*<\/a>/i.test(html),
      relIndexPath + ' must include the rust back-arrow link to /modules/'
    );

    const contextMatch = html.match(/class="module-header-number module-context-number module-context-link"\s+href="\.\/"[^>]*>(\d{2})\s*&middot;/i);
    assert(contextMatch, relIndexPath + ' must include module context link with href="./" and numbered prefix');
    assert(contextMatch[1] === entry.number, relIndexPath + ' context number must match nav entry number');

    assert(
      /<nav class="module-sub-nav"/i.test(html),
      relIndexPath + ' must include .module-sub-nav'
    );

    const activeCount = countActiveSubNavLinks(html);
    assert(activeCount === 1, relIndexPath + ' must have exactly one active local section link');

    const activeLinkMatch = html.match(/<a[^>]*class="[^"]*module-sub-nav-link[^"]*module-sub-nav-link--active[^"]*"[^>]*href="([^"]+)"[^>]*aria-current="page"[^>]*>\s*<span class="module-sub-nav-number">(\d{2})\.(\d{2})<\/span>/i);
    assert(activeLinkMatch, relIndexPath + ' must expose numbered active section with aria-current="page"');

    const activeHref = activeLinkMatch[1];
    const activeModuleNumber = activeLinkMatch[2];
    const activeSectionNumber = activeLinkMatch[3];

    assert(activeHref === './', relIndexPath + ' active section must target "./" (xx.01 canonical landing)');
    assert(activeModuleNumber === entry.number, relIndexPath + ' active section module number mismatch');
    assert(activeSectionNumber === '01', relIndexPath + ' root landing must be xx.01');
  });

  console.log('PASS: tests/test-module-landing-pattern-contract.js');
}

run();
