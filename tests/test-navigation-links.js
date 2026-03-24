'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const IGNORE_DIRS = new Set(['.git', 'node_modules', 'docs']);
const FORBIDDEN_HREF_PATTERNS = [
  /href="index\.html"/i,
  /href="\.\/index\.html"/i,
  /href="[^"]*\/index\.html"/i,
];

function walkHtmlFiles(baseDir) {
  const out = [];
  const stack = [baseDir];
  while (stack.length) {
    const current = stack.pop();
    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      const abs = path.join(current, entry.name);
      const rel = path.relative(baseDir, abs);
      if (entry.isDirectory()) {
        if (!IGNORE_DIRS.has(entry.name)) stack.push(abs);
        continue;
      }
      if (entry.isFile() && entry.name.toLowerCase().endsWith('.html')) {
        out.push(rel);
      }
    }
  }
  return out.sort();
}

function pageRouteFromRelHtml(relHtmlPath) {
  const normalized = relHtmlPath.split(path.sep).join('/');
  if (normalized === 'index.html') return '/';
  if (normalized.endsWith('/index.html')) return '/' + normalized.slice(0, -'index.html'.length);
  return '/' + normalized;
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

async function run() {
  const htmlFiles = walkHtmlFiles(ROOT);
  assert(htmlFiles.length > 0, 'No HTML files found');

  for (const relHtml of htmlFiles) {
    const source = fs.readFileSync(path.join(ROOT, relHtml), 'utf8');
    for (const pattern of FORBIDDEN_HREF_PATTERNS) {
      assert(!pattern.test(source), relHtml + ' contains forbidden href pattern ' + pattern);
    }
  }

  const internalPaths = new Set(['/']);

  for (const relHtml of htmlFiles) {
    const source = fs.readFileSync(path.join(ROOT, relHtml), 'utf8');
    const pageRoute = pageRouteFromRelHtml(relHtml);
    internalPaths.add(pageRoute);
    for (const href of extractHrefs(source)) {
      if (shouldSkipHref(href)) continue;
      internalPaths.add(toInternalPath(href, pageRoute));
    }
  }

  const failures = [];
  for (const pathname of Array.from(internalPaths).sort()) {
    const absFile = resolveFsPathFromRequestPath(pathname);
    if (!absFile) failures.push(pathname + ' -> unresolved route');
  }

  if (failures.length) {
    throw new Error('Broken internal links:\n' + failures.join('\n'));
  }

  console.log('PASS: tests/test-navigation-links.js');
  console.log('Checked internal paths:', internalPaths.size);
}

run().catch((err) => {
  console.error('FAIL: tests/test-navigation-links.js');
  console.error(err.message || err);
  process.exit(1);
});
