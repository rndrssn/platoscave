'use strict';

const fs = require('fs');
const path = require('path');

const navControllerSource = fs.readFileSync(
  path.join(__dirname, '..', 'js', 'nav-controller.js'),
  'utf8'
);
const modulesIndexSource = fs.readFileSync(
  path.join(__dirname, '..', 'modules', 'index.html'),
  'utf8'
);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function parseNavDefaults(source) {
  const blockMatch = source.match(/var\s+DEFAULT_MODULE_MENU_ITEMS\s*=\s*\[([\s\S]*?)\];/);
  assert(blockMatch, 'Could not locate DEFAULT_MODULE_MENU_ITEMS block in js/nav-controller.js');

  const block = blockMatch[1];
  const entryRegex = /{\s*title:\s*'([^']*)'\s*,\s*slug:\s*'([^']*)'\s*,\s*path:\s*'([^']*)'(?:\s*,\s*status:\s*'([^']+)')?\s*}/g;
  const out = [];
  let match = entryRegex.exec(block);
  while (match) {
    out.push({
      title: match[1],
      slug: match[2],
      path: match[3],
      status: match[4] === 'coming-soon' ? 'coming-soon' : '',
    });
    match = entryRegex.exec(block);
  }

  assert(out.length > 0, 'No entries parsed from DEFAULT_MODULE_MENU_ITEMS');
  return out;
}

function parseModulesIndex(source) {
  const liRegex = /<li class="module-entry module-entry--(live|coming)">([\s\S]*?)<\/li>/g;
  const out = [];
  let match = liRegex.exec(source);
  while (match) {
    const state = match[1] === 'coming' ? 'coming-soon' : '';
    const block = match[2];
    const titleMatch = block.match(/<span class="module-title">([^<]+)<\/span>/);
    const title = titleMatch ? titleMatch[1].trim() : '';
    const hrefMatch = block.match(/<a class="module-entry-link" href="([^"]+)">/);
    const href = hrefMatch ? hrefMatch[1] : null;

    out.push({
      title,
      status: state,
      href,
    });

    match = liRegex.exec(source);
  }

  assert(out.length > 0, 'No module entries parsed from modules/index.html');
  return out;
}

function run() {
  assert(
    !/number:\s*'/.test(navControllerSource),
    'DEFAULT_MODULE_MENU_ITEMS should not define top-level module number fields'
  );
  assert(
    !/class="module-number"/.test(modulesIndexSource),
    'modules/index.html should not render top-level module number spans'
  );

  const navDefaults = parseNavDefaults(navControllerSource);
  const modulesIndex = parseModulesIndex(modulesIndexSource);

  assert(
    navDefaults.length === modulesIndex.length,
    'Module entry count mismatch between nav defaults and modules/index'
  );

  modulesIndex.forEach((entry, index) => {
    const navEntry = navDefaults[index];
    assert(navEntry, 'Missing nav entry at index ' + index);
    assert(entry.title, 'Expected module entry title at index ' + index);
    assert(
      navEntry.title === entry.title,
      'Title mismatch at index ' + index + ': nav=' + navEntry.title + ', modules/index=' + entry.title
    );
    assert(
      navEntry.status === entry.status,
      'Status mismatch for module "' + entry.title + '": nav=' + navEntry.status + ', modules/index=' + entry.status
    );

    if (entry.status !== 'coming-soon') {
      assert(entry.href, 'Expected live module "' + entry.title + '" to have clickable href in modules/index.html');
      assert(navEntry.path, 'Expected available module "' + entry.title + '" to have path in DEFAULT_MODULE_MENU_ITEMS');
      assert(
        navEntry.path === entry.href,
        'Path mismatch for available module "' + entry.title + '": nav=' + navEntry.path + ', modules/index=' + entry.href
      );
      assert(
        entry.href === navEntry.slug + '/',
        'Expected live module href to match slug path for "' + entry.title + '"'
      );
    }
  });

  console.log('PASS: tests/test-nav-modules-menu-contract.js');
}

run();
