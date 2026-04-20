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
  const entryRegex = /{\s*number:\s*'([^']+)'\s*,\s*title:\s*'([^']*)'\s*,\s*slug:\s*'([^']*)'\s*,\s*path:\s*'([^']*)'(?:\s*,\s*status:\s*'([^']+)')?\s*}/g;
  const out = new Map();
  let match = entryRegex.exec(block);
  while (match) {
    out.set(match[1], {
      number: match[1],
      title: match[2],
      slug: match[3],
      path: match[4],
      status: match[5] === 'coming-soon' ? 'coming-soon' : '',
    });
    match = entryRegex.exec(block);
  }

  assert(out.size > 0, 'No entries parsed from DEFAULT_MODULE_MENU_ITEMS');
  return out;
}

function parseModulesIndex(source) {
  const liRegex = /<li class="module-entry module-entry--(live|coming)">([\s\S]*?)<\/li>/g;
  const out = new Map();
  let match = liRegex.exec(source);
  while (match) {
    const state = match[1] === 'coming' ? 'coming-soon' : '';
    const block = match[2];
    const numberMatch = block.match(/<span class="module-number">(\d{2})\s*&middot;<\/span>/);
    if (!numberMatch) {
      match = liRegex.exec(source);
      continue;
    }

    const hrefMatch = block.match(/<a class="module-entry-link" href="([^"]+)">/);
    out.set(numberMatch[1], {
      number: numberMatch[1],
      status: state,
      href: hrefMatch ? hrefMatch[1] : null,
    });

    match = liRegex.exec(source);
  }

  assert(out.size > 0, 'No module entries parsed from modules/index.html');
  return out;
}

function run() {
  const navDefaults = parseNavDefaults(navControllerSource);
  const modulesIndex = parseModulesIndex(modulesIndexSource);

  modulesIndex.forEach((entry, number) => {
    const navEntry = navDefaults.get(number);
    assert(navEntry, 'Missing module number ' + number + ' in DEFAULT_MODULE_MENU_ITEMS');
    assert(
      navEntry.status === entry.status,
      'Status mismatch for module ' + number + ': nav=' + navEntry.status + ', modules/index=' + entry.status
    );

    if (entry.status !== 'coming-soon') {
      assert(entry.href, 'Expected live module ' + number + ' to have clickable href in modules/index.html');
      assert(navEntry.path, 'Expected available module ' + number + ' to have path in DEFAULT_MODULE_MENU_ITEMS');
      assert(
        navEntry.path === entry.href,
        'Path mismatch for available module ' + number + ': nav=' + navEntry.path + ', modules/index=' + entry.href
      );
    }
  });

  const mixMapper = navDefaults.get('04');
  assert(mixMapper, 'Missing Mix Mapper (04) entry in DEFAULT_MODULE_MENU_ITEMS');
  assert(mixMapper.status !== 'coming-soon', 'Expected Mix Mapper (04) nav menu to be available');

  console.log('PASS: tests/test-nav-modules-menu-contract.js');
}

run();
