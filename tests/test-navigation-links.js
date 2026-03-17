/**
 * test-navigation-links.js
 * 
 * Automated link checker for To the Bedrock.
 * Verifies all internal navigation links resolve without 404.
 * 
 * Tech stack: plain Node.js — no dependencies required.
 * 
 * Usage:
 *   node tests/test-navigation-links.js
 * 
 * Run this before every merge from development to main.
 * All tests must pass before merging.
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

// ─── Configuration ────────────────────────────────────────────────────────────

const BASE_URL = 'http://localhost:8080'; // adjust port to match your local server

/**
 * All internal links that must resolve without error.
 * Update this list as new pages are added.
 * Mirrors the URL structure defined in EPIC-navigation.md.
 */
const INTERNAL_LINKS = [
  '/',
  '/modules/',
  '/modules/emergence-primer/',
  '/modules/maturity/',
  '/modules/garbage-can/',
  '/modules/mix-mapper/',
];

/**
 * Links that must NOT appear anywhere in the HTML source.
 * These are explicitly forbidden by EPIC-navigation.md.
 */
const FORBIDDEN_LINK_PATTERNS = [
  /href="index\.html"/,
  /href="\.\/index\.html"/,
  /href="[^"]*\/index\.html"/,
];

/**
 * HTML files to scan for forbidden link patterns.
 */
const HTML_FILES = [
  'index.html',
  'modules/index.html',
  'modules/emergence-primer/index.html',
  'modules/maturity/index.html',
  'modules/garbage-can/index.html',
  'modules/mix-mapper/index.html',
];

// ─── Test runner ──────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;
const failures = [];

function pass(message) {
  console.log(`  ✓ ${message}`);
  passed++;
}

function fail(message) {
  console.log(`  ✗ ${message}`);
  failed++;
  failures.push(message);
}

// ─── Test 1: HTTP link resolution ─────────────────────────────────────────────

async function checkUrl(url) {
  return new Promise((resolve) => {
    const fullUrl = `${BASE_URL}${url}`;
    const client = fullUrl.startsWith('https') ? https : http;
    const req = client.get(fullUrl, (res) => {
      resolve({ url, status: res.statusCode });
    });
    req.on('error', () => {
      resolve({ url, status: 'ERROR - could not connect' });
    });
    req.setTimeout(5000, () => {
      req.destroy();
      resolve({ url, status: 'TIMEOUT' });
    });
  });
}

async function testLinkResolution() {
  console.log('\n── Test 1: Internal links resolve without 404 ──────────────────');
  console.log(`   Base URL: ${BASE_URL}`);
  console.log(`   Make sure your local server is running before running this test.\n`);

  for (const link of INTERNAL_LINKS) {
    const result = await checkUrl(link);
    if (result.status === 200) {
      pass(`${link} → 200 OK`);
    } else {
      fail(`${link} → ${result.status}`);
    }
  }
}

// ─── Test 2: Forbidden link patterns ──────────────────────────────────────────

function testForbiddenPatterns() {
  console.log('\n── Test 2: No forbidden index.html references in HTML files ────\n');

  for (const file of HTML_FILES) {
    const filePath = path.join(process.cwd(), file);

    if (!fs.existsSync(filePath)) {
      console.log(`  — ${file} (skipped — file does not exist yet)`);
      continue;
    }

    const content = fs.readFileSync(filePath, 'utf8');
    let filePassed = true;

    for (const pattern of FORBIDDEN_LINK_PATTERNS) {
      if (pattern.test(content)) {
        fail(`${file} contains forbidden link pattern: ${pattern}`);
        filePassed = false;
      }
    }

    if (filePassed) {
      pass(`${file} — no forbidden link patterns found`);
    }
  }
}

// ─── Test 3: Directory structure ──────────────────────────────────────────────

function testDirectoryStructure() {
  console.log('\n── Test 3: Required index.html files exist ─────────────────────\n');

  for (const file of HTML_FILES) {
    const filePath = path.join(process.cwd(), file);
    if (fs.existsSync(filePath)) {
      pass(`${file} exists`);
    } else {
      fail(`${file} is missing — directory URL will 404`);
    }
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function run() {
  console.log('');
  console.log('════════════════════════════════════════════════════════════════');
  console.log('  To the Bedrock — Navigation Link Tests');
  console.log('════════════════════════════════════════════════════════════════');

  testForbiddenPatterns();
  testDirectoryStructure();
  await testLinkResolution();

  console.log('\n════════════════════════════════════════════════════════════════');
  console.log(`  Results: ${passed} passed, ${failed} failed`);

  if (failures.length > 0) {
    console.log('\n  Failures:');
    failures.forEach(f => console.log(`    • ${f}`));
    console.log('\n  ✗ Tests failed — do not merge to main until all pass.');
    console.log('════════════════════════════════════════════════════════════════\n');
    process.exit(1);
  } else {
    console.log('\n  ✓ All tests passed — safe to merge to main.');
    console.log('════════════════════════════════════════════════════════════════\n');
    process.exit(0);
  }
}

run();
