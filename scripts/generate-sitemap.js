// Generates sitemap.xml by crawling the real link graph starting from `/`,
// the same way a search engine would discover pages — rather than walking
// every HTML file on disk. That's deliberate: a blind filesystem walk also
// picks up pages nothing links to (archive/, modules/maturity/ — a "(planned)"
// module not yet promoted into the catalogue) and dev-only fixtures
// (tests/*.html), none of which should be advertised for indexing. Redirect
// stubs (legacy/renamed module paths, /cv/, /skills/, /cases/) are still
// crawled through — in case they carry a fallback link — but never listed
// themselves; a sitemap should only ever point at canonical destinations.
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const BASE_URL = 'https://platoscave.bedrockrebel.app';

function resolveFsPathFromRequestPath(requestPath) {
  const clean = decodeURIComponent(requestPath || '/');
  if (clean.includes('\0')) return null;
  const stripped = clean.replace(/^\/+/, '');

  const candidateFiles = [];
  if (!stripped) {
    candidateFiles.push('index.html');
  } else if (stripped.endsWith('/')) {
    candidateFiles.push(stripped + 'index.html');
  } else if (path.extname(stripped)) {
    candidateFiles.push(stripped);
  } else {
    candidateFiles.push(stripped);
    candidateFiles.push(stripped + '/index.html');
  }

  for (const relFile of candidateFiles) {
    const abs = path.resolve(ROOT, relFile);
    if (!abs.startsWith(ROOT)) continue;
    if (fs.existsSync(abs) && fs.statSync(abs).isFile()) return abs;
  }
  return null;
}

function extractHrefs(htmlSource) {
  const hrefs = [];
  const re = /href\s*=\s*["']([^"']+)["']/gi;
  let match = re.exec(htmlSource);
  while (match) {
    hrefs.push(match[1].trim());
    match = re.exec(htmlSource);
  }
  return hrefs;
}

function shouldSkipHref(href) {
  if (!href) return true;
  if (href.startsWith('#')) return true;
  if (/^(mailto:|tel:|javascript:)/i.test(href)) return true;
  if (/^https?:\/\//i.test(href)) return true;
  if (/^\/\//.test(href)) return true;
  return false;
}

function toInternalPath(href, pageRoute) {
  const resolved = new URL(href, 'http://local.test' + pageRoute);
  return resolved.pathname;
}

function isRedirectStub(source) {
  return /<meta[^>]+http-equiv=["']refresh["']/i.test(source);
}

function isHtmlFile(absPath) {
  return absPath.toLowerCase().endsWith('.html') && fs.existsSync(absPath) && fs.statSync(absPath).isFile();
}

// js/nav-controller.js injects a shared footer into every page at runtime
// (ensureFooterActions()), linking to colophon/ ("Site Notes"). That's
// invisible to a static-HTML crawl, so it's seeded explicitly here.
// colophon/ itself links to design-system/, so that's picked up from there.
const RUNTIME_INJECTED_ROUTES = ['/colophon/'];

function crawl() {
  const visited = new Set();
  const canonicalRoutes = [];
  const queue = ['/', ...RUNTIME_INJECTED_ROUTES];

  while (queue.length) {
    const route = queue.shift();
    if (visited.has(route)) continue;
    visited.add(route);

    const absPath = resolveFsPathFromRequestPath(route);
    if (!absPath || !isHtmlFile(absPath)) continue;

    const source = fs.readFileSync(absPath, 'utf8');
    if (!isRedirectStub(source)) canonicalRoutes.push(route);

    for (const href of extractHrefs(source)) {
      if (shouldSkipHref(href)) continue;
      const nextRoute = toInternalPath(href, route);
      if (!visited.has(nextRoute)) queue.push(nextRoute);
    }
  }

  return canonicalRoutes.sort();
}

function generate() {
  const routes = crawl();
  const urls = routes.map((route) => `  <url><loc>${BASE_URL}${route}</loc></url>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

if (require.main === module) {
  fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), generate());
  console.log('Wrote sitemap.xml');
}

module.exports = { generate, crawl, resolveFsPathFromRequestPath, isRedirectStub };
