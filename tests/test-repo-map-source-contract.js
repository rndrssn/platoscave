// Contract test for source metadata that keeps REPO_MAP.md generation useful.
'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const IGNORE_DIRS = new Set([
  'node_modules',
  '.git',
  'dist',
  'build',
  '.wrangler',
  '.next',
  '.vscode',
  'coverage',
  '.venv',
  'venv',
  '__pycache__',
  'vendor',
]);

function walkFiles(baseDir, predicate) {
  const out = [];
  const stack = [baseDir];
  while (stack.length) {
    const current = stack.pop();
    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      const abs = path.join(current, entry.name);
      const relParts = path.relative(baseDir, abs).split(path.sep);
      if (entry.isDirectory()) {
        if (!relParts.some(part => IGNORE_DIRS.has(part))) stack.push(abs);
        continue;
      }
      if (entry.isFile() && predicate(abs)) out.push(abs);
    }
  }
  return out.sort();
}

function repoPath(absPath) {
  return path.relative(ROOT, absPath).split(path.sep).join('/');
}

function stripBom(source) {
  return source.replace(/^\uFEFF/, '');
}

function readLeadingPurposeComment(source) {
  let cursor = 0;
  const text = stripBom(source);

  if (text.startsWith('#!')) {
    const newline = text.indexOf('\n');
    if (newline === -1) return '';
    cursor = newline + 1;
  }

  while (cursor < text.length) {
    const whitespace = text.slice(cursor).match(/^\s*/)[0];
    cursor += whitespace.length;

    const useStrict = text.slice(cursor).match(/^(?:'use strict'|"use strict");?/);
    if (useStrict) {
      cursor += useStrict[0].length;
      continue;
    }
    break;
  }

  const rest = text.slice(cursor);
  if (rest.startsWith('//')) {
    return rest.split(/\r?\n/)[0].replace(/^\/\//, '').trim();
  }
  if (rest.startsWith('/*')) {
    const end = rest.indexOf('*/', 2);
    if (end === -1) return '';
    return rest.slice(2, end).replace(/^\s*\*/gm, '').trim();
  }
  return '';
}

function isSectionDivider(comment) {
  const letters = comment.replace(/[^A-Za-z]/g, '');
  return comment.length > 0 && letters.length / comment.length < 0.4;
}

function hasUsefulPurposeComment(comment) {
  return comment.length >= 16
    && /[A-Za-z]/.test(comment)
    && !isSectionDivider(comment);
}

function extractTagText(html, tagName) {
  const match = html.match(new RegExp('<' + tagName + '\\b[^>]*>([\\s\\S]*?)<\\/' + tagName + '>', 'i'));
  return match ? match[1].replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim() : '';
}

function getAttribute(tagSource, attrName) {
  const match = tagSource.match(new RegExp("\\b" + attrName + "\\s*=\\s*['\"]([^'\"]*)['\"]", 'i'));
  return match ? match[1].trim() : '';
}

function extractMetaDescription(html) {
  const metaTags = html.match(/<meta\b[^>]*>/gi) || [];
  for (const tag of metaTags) {
    if (getAttribute(tag, 'name').toLowerCase() === 'description') {
      return getAttribute(tag, 'content');
    }
  }
  return '';
}

function isRedirectPage(html) {
  return /<meta[^>]+http-equiv=["']refresh["']/i.test(html);
}

const jsFailures = [];
for (const absPath of walkFiles(ROOT, abs => {
  const name = path.basename(abs);
  return name.endsWith('.js') && !name.includes('.min.');
})) {
  const purpose = readLeadingPurposeComment(fs.readFileSync(absPath, 'utf8'));
  if (!hasUsefulPurposeComment(purpose)) {
    jsFailures.push(repoPath(absPath) + ' must start with a one-sentence purpose comment for REPO_MAP.md');
  }
}

const htmlFailures = [];
for (const absPath of walkFiles(ROOT, abs => abs.endsWith('.html'))) {
  const rel = repoPath(absPath);
  const html = fs.readFileSync(absPath, 'utf8');
  if (isRedirectPage(html)) continue;

  const title = extractTagText(html, 'title');
  const h1 = extractTagText(html, 'h1');
  const description = extractMetaDescription(html);

  if (!title) htmlFailures.push(rel + ' must have a factual <title> for REPO_MAP.md orientation');
  if (!h1) htmlFailures.push(rel + ' must have a primary <h1> for REPO_MAP.md orientation');
  if (!rel.startsWith('tests/') && !description) {
    htmlFailures.push(rel + ' must have a meta description aligned with its title/H1');
  }
}

assert.strictEqual(jsFailures.length, 0, 'JS purpose-comment failures:\n' + jsFailures.join('\n'));
assert.strictEqual(htmlFailures.length, 0, 'HTML metadata failures:\n' + htmlFailures.join('\n'));

console.log('PASS: tests/test-repo-map-source-contract.js');
