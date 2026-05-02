'use strict';

const fs = require('fs');
const path = require('path');

const navControllerSource = fs.readFileSync(
  path.join(__dirname, '..', 'js', 'nav-controller.js'),
  'utf8'
);
const routeData = require('../js/module-route-data.js');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function read(relPath) {
  return fs.readFileSync(path.join(__dirname, '..', relPath), 'utf8');
}

function decodeHtmlText(value) {
  return String(value || '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function countActiveSubNavLinks(html) {
  const matches = html.match(/class="[^"]*module-sub-nav-link[^"]*module-sub-nav-link--active[^"]*"/g);
  return matches ? matches.length : 0;
}

function run() {
  assert(
    /PlatoscaveModuleRouteData/.test(navControllerSource),
    'Expected js/nav-controller.js to read module routes from js/module-route-data.js'
  );

  const navEntries = routeData.getModuleRoutes()
    .filter((entry) => entry.status !== 'coming-soon' && entry.slug);

  navEntries.forEach((entry) => {
    assert(
      entry.path === entry.slug + '/',
      'Available module ' + entry.slug + ' must land at /modules/' + entry.slug + '/ (found path=' + entry.path + ')'
    );

    const relIndexPath = path.join('modules', entry.slug, 'index.html');
    const html = read(relIndexPath);

    assert(
      !/<meta[^>]+http-equiv=["']refresh["']/i.test(html),
      relIndexPath + ' must be a real landing page, not a hard redirect'
    );

    assert(
      /<a[^>]*class="module-back-link"[^>]*href="\.\.\/"[^>]*aria-label="Back to Catalogue"[^>]*>\s*<\/a>/i.test(html),
      relIndexPath + ' must include the rust back-arrow link to /modules/'
    );

    const contextMatch = html.match(/class="module-header-number module-context-number module-context-link"\s+href="\.\/"[^>]*>([^<]+)</i);
    assert(contextMatch, relIndexPath + ' must include module context link with href="./"');
    assert(
      decodeHtmlText(contextMatch[1].trim()) === entry.title,
      relIndexPath + ' context title must match nav entry title'
    );

    assert(
      /<nav class="module-sub-nav"/i.test(html),
      relIndexPath + ' must include .module-sub-nav'
    );

    const activeCount = countActiveSubNavLinks(html);
    assert(activeCount === 1, relIndexPath + ' must have exactly one active local section link');

    const activeLinkMatch = html.match(/<a[^>]*class="[^"]*module-sub-nav-link[^"]*module-sub-nav-link--active[^"]*"[^>]*href="([^"]+)"[^>]*aria-current="page"[^>]*>\s*<span class="module-sub-nav-number">(\d{2})<\/span>/i);
    assert(activeLinkMatch, relIndexPath + ' must expose numbered active section with aria-current="page"');

    const activeHref = activeLinkMatch[1];
    const activeSectionNumber = activeLinkMatch[2];

    assert(activeHref === './', relIndexPath + ' active section must target "./" (01 canonical landing)');
    assert(activeSectionNumber === '01', relIndexPath + ' root landing must be local section 01');
  });

  console.log('PASS: tests/test-module-landing-pattern-contract.js');
}

run();
