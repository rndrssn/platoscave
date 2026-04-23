'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const BUILD_SCRIPT = path.join(ROOT, 'scripts', 'build-notes.js');
const PUBLISHED_DIR = path.join(ROOT, 'content', 'notes', 'published');

function runBuild() {
  return spawnSync(process.execPath, [BUILD_SCRIPT], {
    cwd: ROOT,
    encoding: 'utf8',
  });
}

function writeTempNote(name, body) {
  const file = path.join(PUBLISHED_DIR, name);
  fs.writeFileSync(file, body, 'utf8');
  return file;
}

function expectBuildFail(noteFileName, noteBody, expectedPattern) {
  const tempFile = writeTempNote(noteFileName, noteBody);
  try {
    const result = runBuild();
    const output = ((result.stdout || '') + '\n' + (result.stderr || '')).trim();
    assert.notStrictEqual(result.status, 0, 'build-notes.js should fail for invalid note fixture');
    assert(expectedPattern.test(output), 'Expected build failure output to match ' + expectedPattern + '\nOutput:\n' + output);
  } finally {
    if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
  }
}

function expectBuildPass(noteFileName, noteBody) {
  const tempFile = writeTempNote(noteFileName, noteBody);
  try {
    const result = runBuild();
    const output = ((result.stdout || '') + '\n' + (result.stderr || '')).trim();
    assert.strictEqual(result.status, 0, 'build-notes.js should pass for valid note fixture\nOutput:\n' + output);
  } finally {
    if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
  }
}

function run() {
  const stamp = Date.now();

  expectBuildFail(
    `__tmp_missing_title_${stamp}.md`,
    [
      '---',
      'slug: "tmp-missing-title-' + stamp + '"',
      'date: "2026-03-24"',
      'status: "published"',
      'summary: "temp note"',
      'tags: ["temp"]',
      '---',
      '',
      'Body',
      '',
    ].join('\n'),
    /missing title/i
  );

  expectBuildFail(
    `__tmp_duplicate_slug_${stamp}.md`,
    [
      '---',
      'title: "Duplicate slug fixture"',
      'slug: "what-works-and-what-doesnt-work"',
      'date: "2026-03-24"',
      'status: "published"',
      'summary: "temp note"',
      'tags: ["temp"]',
      '---',
      '',
      'Body',
      '',
    ].join('\n'),
    /duplicate slug/i
  );

  expectBuildFail(
    `__tmp_invalid_status_${stamp}.md`,
    [
      '---',
      'title: "Invalid status fixture"',
      'slug: "invalid-status-' + stamp + '"',
      'date: "2026-03-24"',
      'status: "archived"',
      'summary: "temp note"',
      'tags: ["temp"]',
      '---',
      '',
      'Body',
      '',
    ].join('\n'),
    /invalid status/i
  );

  expectBuildPass(
    `__tmp_missing_tags_${stamp}.md`,
    [
      '---',
      'title: "Missing tags fixture"',
      'slug: "missing-tags-' + stamp + '"',
      'date: "2026-03-24"',
      'status: "published"',
      'summary: "temp note"',
      '---',
      '',
      'Body',
      '',
    ].join('\n')
  );

  const recovery = runBuild();
  if (recovery.status !== 0) {
    const output = ((recovery.stdout || '') + '\n' + (recovery.stderr || '')).trim();
    throw new Error('build-notes.js should recover after fixture cleanup\n' + output);
  }

  console.log('PASS: tests/test-notes-build-negative.js');
}

run();
