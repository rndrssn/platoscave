'use strict';

const fs = require('fs');
const path = require('path');

const navControllerSource = fs.readFileSync(
  path.join(__dirname, '..', 'js', 'nav-controller.js'),
  'utf8'
);
const routeData = require('../js/module-route-data.js');
const modulesIndexSource = fs.readFileSync(
  path.join(__dirname, '..', 'modules', 'index.html'),
  'utf8'
);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function decodeHtmlText(value) {
  return String(value || '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function parseModulesIndex(source) {
  const liRegex = /<li class="module-entry module-entry--(live|coming)">([\s\S]*?)<\/li>/g;
  const out = [];
  let match = liRegex.exec(source);
  while (match) {
    const state = match[1] === 'coming' ? 'coming-soon' : '';
    const block = match[2];
    const titleMatch = block.match(/<span class="module-title">([^<]+)<\/span>/);
    const title = titleMatch ? decodeHtmlText(titleMatch[1].trim()) : '';
    const hrefMatch = block.match(/<a class="module-entry-link" href="([^"]+)">/);
    const href = hrefMatch ? hrefMatch[1] : null;
    const descriptorMatch = block.match(/<p class="module-descriptor">([^<]+)<\/p>/);
    const sectionsMatch = block.match(/<p class="module-entry-sections">([^<]+)<\/p>/);

    out.push({
      title,
      status: state,
      href,
      descriptor: descriptorMatch ? decodeHtmlText(descriptorMatch[1].trim()) : '',
      sections: sectionsMatch ? decodeHtmlText(sectionsMatch[1].trim()) : '',
    });

    match = liRegex.exec(source);
  }

  assert(out.length > 0, 'No module entries parsed from modules/index.html');
  return out;
}

function listNavHtmlPages(rootDir) {
  const out = [];
  const stack = [rootDir];
  while (stack.length) {
    const current = stack.pop();
    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name === '.git' || entry.name === 'node_modules') continue;
      const abs = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(abs);
        continue;
      }
      if (!entry.isFile() || !entry.name.toLowerCase().endsWith('.html')) continue;
      const source = fs.readFileSync(abs, 'utf8');
      if (/src="[^"]*js\/nav-controller\.js"/.test(source)) {
        out.push({
          relPath: path.relative(path.join(__dirname, '..'), abs).split(path.sep).join('/'),
          source,
        });
      }
    }
  }
  return out.sort((a, b) => a.relPath.localeCompare(b.relPath));
}

function run() {
  assert(
    !/number:\s*'/.test(navControllerSource),
    'Module route data should not define top-level module number fields'
  );
  assert(
    /PlatoscaveModuleRouteData/.test(navControllerSource),
    'Expected js/nav-controller.js to read module menu defaults from js/module-route-data.js'
  );
  assert(
    !/var\s+DEFAULT_MODULE_MENU_ITEMS\s*=/.test(navControllerSource),
    'Expected js/nav-controller.js to avoid a second inline module route registry'
  );
  assert(
    !/class="module-number"/.test(modulesIndexSource),
    'modules/index.html should not render top-level module number spans'
  );

  const navDefaults = routeData.getModuleRoutes();
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

    assert(
      navEntry.descriptor === entry.descriptor,
      'Descriptor mismatch for module "' + entry.title + '"'
    );
    assert(
      navEntry.sections === entry.sections,
      'Sections mismatch for module "' + entry.title + '"'
    );
  });

  const navPages = listNavHtmlPages(path.join(__dirname, '..'));
  assert(navPages.length > 0, 'Expected pages that load js/nav-controller.js');
  navPages.forEach((page) => {
    const routeDataIndex = page.source.indexOf('js/module-route-data.js');
    const navControllerIndex = page.source.indexOf('js/nav-controller.js');
    assert(routeDataIndex !== -1, page.relPath + ' must load js/module-route-data.js');
    assert(
      routeDataIndex < navControllerIndex,
      page.relPath + ' must load js/module-route-data.js before js/nav-controller.js'
    );
  });

  console.log('PASS: tests/test-nav-modules-menu-contract.js');
}

run();
