'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const PUBLISHED_DIR = path.join(ROOT, 'content', 'notes', 'published');
const NOTES_INDEX_JSON = path.join(ROOT, 'data', 'notes-index.json');
const TAGS_INDEX_JSON = path.join(ROOT, 'data', 'tags-index.json');
const NOTES_INDEX_HTML = path.join(ROOT, 'notes', 'index.html');
const TAGS_INDEX_HTML = path.join(ROOT, 'tags', 'index.html');

function listMarkdownFiles(dirPath) {
  if (!fs.existsSync(dirPath)) return [];
  const out = [];
  function walk(current) {
    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      const abs = path.join(current, entry.name);
      if (entry.isDirectory()) walk(abs);
      else if (entry.isFile() && entry.name.toLowerCase().endsWith('.md')) out.push(abs);
    }
  }
  walk(dirPath);
  return out.sort();
}

function parseFrontmatter(raw, filePath) {
  const match = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n?/);
  assert(match, 'Missing YAML frontmatter in: ' + filePath);
  const lines = match[1].replace(/\r\n/g, '\n').split('\n');
  const out = {};

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (!line || !line.trim() || line.trim().startsWith('#')) continue;
    const keyMatch = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!keyMatch) continue;

    const key = keyMatch[1];
    const rest = keyMatch[2].trim();

    if (!rest) {
      const arr = [];
      let j = i + 1;
      while (j < lines.length) {
        const itemMatch = lines[j].match(/^\s*-\s*(.*)$/);
        if (!itemMatch) break;
        arr.push(parseScalar(itemMatch[1].trim()));
        j += 1;
      }
      out[key] = arr;
      i = j - 1;
      continue;
    }

    if (rest.startsWith('[') && rest.endsWith(']')) {
      const inner = rest.slice(1, -1).trim();
      out[key] = inner ? splitCsv(inner).map((item) => parseScalar(item.trim())) : [];
      continue;
    }

    out[key] = parseScalar(rest);
  }

  return out;
}

function splitCsv(text) {
  const out = [];
  let current = '';
  let quote = null;

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if ((ch === '"' || ch === '\'') && (i === 0 || text[i - 1] !== '\\')) {
      if (!quote) quote = ch;
      else if (quote === ch) quote = null;
      current += ch;
      continue;
    }
    if (ch === ',' && !quote) {
      out.push(current);
      current = '';
      continue;
    }
    current += ch;
  }

  if (current) out.push(current);
  return out;
}

function parseScalar(value) {
  if (!value) return '';
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith('\'') && value.endsWith('\''))) {
    return value.slice(1, -1);
  }
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (/^-?\d+(\.\d+)?$/.test(value)) return Number(value);
  return value;
}

function slugify(input) {
  return String(input || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function runBuild() {
  const result = spawnSync(process.execPath, [path.join(ROOT, 'scripts', 'build-notes.js')], {
    cwd: ROOT,
    encoding: 'utf8',
  });

  if (result.status !== 0) {
    const output = [result.stdout || '', result.stderr || ''].join('\n').trim();
    throw new Error('build-notes.js failed\n' + output);
  }
}

function run() {
  runBuild();

  assert(fs.existsSync(NOTES_INDEX_JSON), 'Missing generated data file: data/notes-index.json');
  assert(fs.existsSync(TAGS_INDEX_JSON), 'Missing generated data file: data/tags-index.json');
  assert(fs.existsSync(NOTES_INDEX_HTML), 'Missing generated notes index: notes/index.html');
  assert(fs.existsSync(TAGS_INDEX_HTML), 'Missing generated tags index: tags/index.html');

  const mdFiles = listMarkdownFiles(PUBLISHED_DIR);
  const frontmatterRows = mdFiles.map((filePath) => {
    const raw = fs.readFileSync(filePath, 'utf8');
    const fm = parseFrontmatter(raw, filePath);
    assert(fm.title && fm.title.trim(), 'Missing frontmatter title in: ' + filePath);
    assert(fm.slug && fm.slug.trim(), 'Missing frontmatter slug in: ' + filePath);
    assert(fm.date && /^\d{4}-\d{2}-\d{2}$/.test(fm.date.replace(/['"]/g, '')), 'Invalid frontmatter date in: ' + filePath);
    assert(fm.summary && fm.summary.trim(), 'Missing frontmatter summary in: ' + filePath);
    assert(fm.status && fm.status.trim(), 'Missing frontmatter status in: ' + filePath);
    const hasTags = Array.isArray(fm.tags) ? fm.tags.length > 0 : !!(fm.tags && String(fm.tags).trim());
    assert(hasTags, 'Missing frontmatter tags in: ' + filePath);

    const slug = fm.slug.replace(/^['"]|['"]$/g, '');
    assert(slug === slugify(slug), 'Slug must be lowercase/kebab-case in: ' + filePath);

    return {
      filePath,
      slug,
      status: fm.status.replace(/^['"]|['"]$/g, '').toLowerCase(),
    };
  });

  const nonDraft = frontmatterRows.filter((row) => row.status !== 'draft');
  const slugSet = new Set();
  for (const row of nonDraft) {
    assert(!slugSet.has(row.slug), 'Duplicate published slug: ' + row.slug);
    slugSet.add(row.slug);
  }

  const notesIndex = JSON.parse(fs.readFileSync(NOTES_INDEX_JSON, 'utf8'));
  const tagsIndex = JSON.parse(fs.readFileSync(TAGS_INDEX_JSON, 'utf8'));

  assert(Array.isArray(notesIndex), 'notes-index.json must contain an array');
  assert(Array.isArray(tagsIndex), 'tags-index.json must contain an array');
  assert.strictEqual(notesIndex.length, nonDraft.length, 'notes-index count must match published markdown count');

  for (const note of notesIndex) {
    assert(note.title, 'notes-index entry missing title');
    assert(note.slug, 'notes-index entry missing slug');
    assert(note.summary, 'notes-index entry missing summary');
    assert(note.date, 'notes-index entry missing date');
    assert(Array.isArray(note.tags), 'notes-index entry missing tags array');
    assert(Array.isArray(note.relatedModules), 'notes-index entry missing relatedModules array');
    assert(fs.existsSync(path.join(ROOT, 'notes', note.slug, 'index.html')), 'Missing generated note page for slug: ' + note.slug);
  }

  for (const tag of tagsIndex) {
    assert(tag.label, 'tags-index entry missing label');
    assert(tag.slug, 'tags-index entry missing slug');
    assert(Array.isArray(tag.notes), 'tags-index entry missing notes array');
    assert(Array.isArray(tag.modules), 'tags-index entry missing modules array');
    assert(fs.existsSync(path.join(ROOT, 'tags', tag.slug, 'index.html')), 'Missing generated tag page for slug: ' + tag.slug);
  }

  console.log('PASS: tests/test-notes-build-contract.js');
}

run();
