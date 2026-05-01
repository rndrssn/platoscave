'use strict';

const fs = require('fs');
const path = require('path');

const PAGES = [
  {
    label: '01 Conway',
    file: path.join(__dirname, '..', 'modules', 'emergence', 'index.html'),
  },
  {
    label: '02 GANTT-GoL',
    file: path.join(__dirname, '..', 'modules', 'emergence', 'ganttgol', 'index.html'),
  },
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function extractSeedKeys(source) {
  const keys = new Set();
  const re = /data-ep-seed="([^"]+)"/g;
  let match;
  while ((match = re.exec(source))) {
    keys.add(match[1]);
  }
  return keys;
}

function extractJumpAnchors(source) {
  const anchors = [];
  const re = /<a\b[^>]*class="[^"]*\bep-jump\b[^"]*"[^>]*>/g;
  let match;
  while ((match = re.exec(source))) {
    anchors.push(match[0]);
  }
  return anchors;
}

function getAttr(tag, name) {
  const re = new RegExp('\\b' + name + '="([^"]*)"');
  const m = tag.match(re);
  return m ? m[1] : null;
}

function checkPage(page) {
  const source = fs.readFileSync(page.file, 'utf8');

  assert(
    /<div\b[^>]*\bclass="ep-life-panel"[^>]*\bid="ep-life-panel"|<div\b[^>]*\bid="ep-life-panel"[^>]*\bclass="[^"]*\bep-life-panel\b/.test(source),
    page.label + ': expected .ep-life-panel to carry id="ep-life-panel" for deep-link targeting'
  );

  const anchors = extractJumpAnchors(source);
  assert(
    anchors.length >= 2,
    page.label + ': expected at least two .ep-jump anchors; got ' + anchors.length
  );

  anchors.forEach((tag) => {
    const href = getAttr(tag, 'href');
    assert(
      href === '#ep-life-panel',
      page.label + ': every .ep-jump anchor must href to #ep-life-panel; got ' + href
    );
  });

  const seedKeys = extractSeedKeys(source);
  anchors.forEach((tag) => {
    const jumpSeed = getAttr(tag, 'data-ep-jump-seed');
    if (!jumpSeed) return;
    assert(
      seedKeys.has(jumpSeed),
      page.label + ': data-ep-jump-seed="' + jumpSeed + '" has no matching .ep-seed-btn[data-ep-seed]'
    );
  });

  const patternsJump = anchors.find((tag) => /\bdata-ep-jump-patterns\b/.test(tag));
  if (patternsJump) {
    assert(
      /\bdata-ep-pattern-toggle\b/.test(source),
      page.label + ': data-ep-jump-patterns anchor present but no [data-ep-pattern-toggle] button to open the drawer'
    );
  }
}

function run() {
  PAGES.forEach(checkPage);
  console.log('PASS: tests/test-emergence-primer-jump-anchors-contract.js');
}

run();
