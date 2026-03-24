#!/usr/bin/env node
'use strict';

/**
 * Optional note-polish step (spelling + punctuation only).
 *
 * Usage:
 *   node scripts/polish-note.js --slug long-tails
 *   node scripts/polish-note.js --file content/notes/published/long-tails.md
 *   node scripts/polish-note.js --slug long-tails --dry-run
 *
 * Env:
 *   OPENAI_API_KEY        required
 *   NOTES_POLISH_MODEL    optional (default: gpt-5-mini)
 *   OPENAI_API_BASE       optional (default: https://api.openai.com/v1)
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PUBLISHED_DIR = path.join(ROOT, 'content', 'notes', 'published');

function parseArgs(argv) {
  const out = {
    slug: '',
    file: '',
    dryRun: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--slug') {
      out.slug = String(argv[i + 1] || '').trim();
      i += 1;
      continue;
    }
    if (arg === '--file') {
      out.file = String(argv[i + 1] || '').trim();
      i += 1;
      continue;
    }
    if (arg === '--dry-run') {
      out.dryRun = true;
      continue;
    }
    if (arg === '-h' || arg === '--help') {
      printHelp();
      process.exit(0);
    }
    throw new Error('Unknown argument: ' + arg);
  }

  if (!out.slug && !out.file) {
    throw new Error('Missing target. Use --slug <slug> or --file <path>.');
  }

  return out;
}

function printHelp() {
  process.stdout.write(
    'Usage:\n'
    + '  node scripts/polish-note.js --slug <slug>\n'
    + '  node scripts/polish-note.js --file <path>\n'
    + '  node scripts/polish-note.js --slug <slug> --dry-run\n'
  );
}

function splitFrontmatter(raw) {
  if (!raw.startsWith('---')) return { frontmatter: '', body: raw, hasFrontmatter: false };
  const match = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/);
  if (!match) return { frontmatter: '', body: raw, hasFrontmatter: false };
  return {
    frontmatter: match[1],
    body: match[2],
    hasFrontmatter: true,
  };
}

function parseSimpleFrontmatter(frontmatterText) {
  const out = {};
  const lines = String(frontmatterText || '').split('\n');
  for (const line of lines) {
    const m = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!m) continue;
    out[m[1]] = m[2].trim().replace(/^['"]|['"]$/g, '');
  }
  return out;
}

function slugify(value) {
  return String(value || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function listMarkdownFiles(dirPath) {
  if (!fs.existsSync(dirPath)) return [];
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith('.md'))
    .map((entry) => path.join(dirPath, entry.name))
    .sort();
}

function resolveTargetFile(opts) {
  if (opts.file) {
    const abs = path.isAbsolute(opts.file) ? opts.file : path.join(ROOT, opts.file);
    if (!fs.existsSync(abs)) throw new Error('File not found: ' + abs);
    return abs;
  }

  const slug = slugify(opts.slug);
  const direct = path.join(PUBLISHED_DIR, slug + '.md');
  if (fs.existsSync(direct)) return direct;

  const files = listMarkdownFiles(PUBLISHED_DIR);
  for (const filePath of files) {
    const raw = fs.readFileSync(filePath, 'utf8');
    const parts = splitFrontmatter(raw);
    if (!parts.hasFrontmatter) continue;
    const fm = parseSimpleFrontmatter(parts.frontmatter);
    if (slugify(fm.slug || '') === slug) return filePath;
  }

  throw new Error('Could not resolve note for slug: ' + opts.slug);
}

function extractOutputText(responseJson) {
  if (!responseJson || typeof responseJson !== 'object') return '';

  if (typeof responseJson.output_text === 'string' && responseJson.output_text.trim()) {
    return responseJson.output_text.trim();
  }

  const output = Array.isArray(responseJson.output) ? responseJson.output : [];
  const chunks = [];

  for (const item of output) {
    const content = Array.isArray(item && item.content) ? item.content : [];
    for (const part of content) {
      if (part && part.type === 'output_text' && typeof part.text === 'string') {
        chunks.push(part.text);
      }
    }
  }

  return chunks.join('\n').trim();
}

async function requestPolish(bodyMarkdown, meta) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is required for note polish.');
  }

  const model = process.env.NOTES_POLISH_MODEL || 'gpt-5-mini';
  const apiBase = process.env.OPENAI_API_BASE || 'https://api.openai.com/v1';
  const endpoint = apiBase.replace(/\/+$/, '') + '/responses';

  const instructions = [
    'You are a copy editor.',
    'Task: fix spelling, punctuation, and obvious grammar in Markdown.',
    'Do not rewrite voice, structure, or meaning.',
    'Do not add or remove sections, bullets, or headings.',
    'Preserve Markdown formatting exactly where possible.',
    'Return only corrected Markdown body, no fences, no commentary.',
  ].join(' ');

  const input = [
    'NOTE META:',
    'title: ' + (meta.title || ''),
    'slug: ' + (meta.slug || ''),
    '',
    'MARKDOWN BODY START',
    bodyMarkdown,
    'MARKDOWN BODY END',
  ].join('\n');

  const payload = {
    model,
    instructions,
    input,
  };

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = json && json.error && json.error.message ? json.error.message : ('HTTP ' + res.status);
    throw new Error('OpenAI API error: ' + msg);
  }

  const text = extractOutputText(json);
  if (!text) throw new Error('No text returned from model.');
  return text;
}

function normalizeNewlines(text) {
  return String(text || '').replace(/\r\n/g, '\n');
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const filePath = resolveTargetFile(opts);
  const raw = fs.readFileSync(filePath, 'utf8');
  const parts = splitFrontmatter(raw);
  if (!parts.hasFrontmatter) {
    throw new Error('Missing YAML frontmatter in: ' + filePath);
  }

  const meta = parseSimpleFrontmatter(parts.frontmatter);
  const originalBody = normalizeNewlines(parts.body).trimEnd() + '\n';
  const correctedBody = normalizeNewlines(await requestPolish(originalBody, meta)).trimEnd() + '\n';

  if (correctedBody === originalBody) {
    process.stdout.write('No spelling/punctuation changes suggested.\n');
    return;
  }

  if (opts.dryRun) {
    process.stdout.write('Dry run: suggestions generated for ' + path.relative(ROOT, filePath) + '\n');
    process.stdout.write('Tip: run without --dry-run to apply.\n');
    return;
  }

  const rebuilt = '---\n' + parts.frontmatter.trimEnd() + '\n---\n\n' + correctedBody;
  fs.writeFileSync(filePath, rebuilt, 'utf8');
  process.stdout.write('Updated note: ' + path.relative(ROOT, filePath) + '\n');
}

main().catch((err) => {
  process.stderr.write('ERROR: ' + err.message + '\n');
  process.exit(1);
});

