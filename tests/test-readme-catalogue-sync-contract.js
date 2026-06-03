// Contract test keeping README catalogue, module route data, and catalogue HTML aligned.
'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const routeData = require('../js/module-route-data.js');

function read(relPath) {
  return fs.readFileSync(path.join(ROOT, relPath), 'utf8');
}

function decodeHtmlText(value) {
  return String(value || '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function htmlToText(html) {
  return decodeHtmlText(html.replace(/<[^>]+>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim();
}

const readme = read('README.md');
const modulesIndexHtml = read('modules/index.html');
const modulesIndexText = htmlToText(modulesIndexHtml);
const routes = routeData.getModuleRoutes();
const failures = [];

for (const route of routes) {
  if (!route.title || !route.slug || !route.path) {
    failures.push('Route entries must have title, slug, and path: ' + JSON.stringify(route));
    continue;
  }

  if (route.path !== route.slug + '/') {
    failures.push(route.title + ' route path must be slug + "/"');
  }

  if (!readme.includes('- **' + route.title + '**')) {
    failures.push('README Catalogue must include module title: ' + route.title);
  }

  if (!modulesIndexText.includes(route.title)) {
    failures.push('modules/index.html must include module title: ' + route.title);
  }

  if (route.descriptor && !modulesIndexText.includes(route.descriptor)) {
    failures.push('modules/index.html descriptor must match route data for ' + route.title);
  }

  if (route.sections && !modulesIndexText.includes(route.sections)) {
    failures.push('modules/index.html sections must match route data for ' + route.title);
  }

  if (route.status === 'coming-soon') {
    if (!modulesIndexText.includes('Coming Soon')) {
      failures.push('Coming-soon route should be represented with Coming Soon status: ' + route.title);
    }
    continue;
  }

  if (!modulesIndexHtml.includes('href="' + route.slug + '/"')) {
    failures.push('modules/index.html must link live module slug: ' + route.slug);
  }

  if (!readme.includes('(`/modules/' + route.slug + '/`)')) {
    failures.push('README Catalogue must include canonical root URL for live module: ' + route.slug);
  }

  const moduleRoot = path.join(ROOT, 'modules', route.slug, 'index.html');
  if (!fs.existsSync(moduleRoot)) {
    failures.push('Live module root must exist: modules/' + route.slug + '/index.html');
  }

  if (route.demo && !modulesIndexHtml.includes('<span class="module-demo-tag" aria-label="Demo">D</span>')) {
    failures.push('Demo route must render the catalogue Demo tag: ' + route.title);
  }
}

assert.strictEqual(failures.length, 0, 'README/catalogue sync failures:\n' + failures.join('\n'));

console.log('PASS: tests/test-readme-catalogue-sync-contract.js');
