#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { htmlShell, navHtml } = require('./lib/page-shell');

const ROOT = path.resolve(__dirname, '..');
const CONTENT_ROOT = path.join(ROOT, 'content', 'notes');
const PUBLISHED_DIR = path.join(CONTENT_ROOT, 'published');
const OUTPUT_NOTES_DIR = path.join(ROOT, 'notes');
const OUTPUT_TAGS_DIR = path.join(ROOT, 'tags');
const DATA_DIR = path.join(ROOT, 'data');
const MODULES_META_PATH = path.join(ROOT, 'content', 'meta', 'modules.json');
const NOTE_STATUSES = new Set(['published', 'draft', 'unpublished']);

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function readFile(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function writeFile(filePath, content) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, content);
}

function removeDirIfExists(dirPath) {
  if (fs.existsSync(dirPath)) fs.rmSync(dirPath, { recursive: true, force: true });
}

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

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeAttr(value) {
  return escapeHtml(value).replace(/`/g, '&#96;');
}

function isExternalHref(href) {
  const value = String(href || '').trim();
  return /^https?:\/\//i.test(value);
}

function splitFrontmatter(raw) {
  if (!raw.startsWith('---')) return { frontmatter: {}, body: raw };
  const match = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/);
  if (!match) return { frontmatter: {}, body: raw };
  return { frontmatter: parseFrontmatterYaml(match[1]), body: match[2] };
}

function parseFrontmatterYaml(yamlText) {
  const lines = yamlText.replace(/\r\n/g, '\n').split('\n');
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
      if (!inner) {
        out[key] = [];
      } else {
        out[key] = splitCsv(inner).map((item) => parseScalar(item.trim()));
      }
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
    if ((ch === '"' || ch === "'") && (i === 0 || text[i - 1] !== '\\')) {
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
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    return value.slice(1, -1);
  }
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (/^-?\d+(\.\d+)?$/.test(value)) return Number(value);
  return value;
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

function normalizeTags(tagsValue) {
  if (!Array.isArray(tagsValue)) return [];
  const seen = new Set();
  const tags = [];
  for (const raw of tagsValue) {
    const label = String(raw || '').trim();
    if (!label) continue;
    const slug = slugify(label);
    if (!slug || seen.has(slug)) continue;
    seen.add(slug);
    tags.push({ label, slug });
  }
  return tags;
}

function resolveRelatedModules(relatedIds, modulesById) {
  if (!Array.isArray(relatedIds) || !relatedIds.length) return [];
  return relatedIds
    .map((id) => String(id || '').trim())
    .filter(Boolean)
    .map((id) => modulesById.get(id))
    .filter(Boolean);
}

function parseDate(value) {
  const text = String(value || '').trim();
  if (!text) return null;
  const date = new Date(text);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

function formatDate(date) {
  if (!date) return 'Undated';
  return date.toISOString().slice(0, 10);
}

function renderInline(rawText) {
  const codeSlots = [];
  let text = String(rawText || '');

  text = text.replace(/`([^`]+)`/g, (_, code) => {
    const idx = codeSlots.length;
    codeSlots.push('<code>' + escapeHtml(code) + '</code>');
    return '@@CODE' + idx + '@@';
  });

  text = escapeHtml(text);

  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, href) => {
    const safeHref = escapeAttr(href.trim());
    const externalAttrs = isExternalHref(href)
      ? ' target="_blank" rel="noopener noreferrer"'
      : '';
    return '<a href="' + safeHref + '"' + externalAttrs + '>' + label + '</a>';
  });
  text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  text = text.replace(/\*([^*]+)\*/g, '<em>$1</em>');

  text = text.replace(/@@CODE(\d+)@@/g, (_, idx) => codeSlots[Number(idx)] || '');
  return text;
}

function renderMarkdown(markdown) {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const html = [];
  let i = 0;

  function isBlank(line) {
    return !line || !line.trim();
  }

  while (i < lines.length) {
    const line = lines[i];

    if (isBlank(line)) {
      i += 1;
      continue;
    }

    if (/^```/.test(line.trim())) {
      const codeLines = [];
      i += 1;
      while (i < lines.length && !/^```/.test(lines[i].trim())) {
        codeLines.push(lines[i]);
        i += 1;
      }
      if (i < lines.length) i += 1;
      html.push('<pre><code>' + escapeHtml(codeLines.join('\n')) + '</code></pre>');
      continue;
    }

    const heading = line.match(/^(#{1,6})\s+(.*)$/);
    if (heading) {
      const level = heading[1].length;
      html.push('<h' + level + '>' + renderInline(heading[2].trim()) + '</h' + level + '>');
      i += 1;
      continue;
    }

    if (/^\s*>\s+/.test(line)) {
      const quote = [];
      while (i < lines.length && /^\s*>\s+/.test(lines[i])) {
        quote.push(lines[i].replace(/^\s*>\s+/, ''));
        i += 1;
      }
      html.push('<blockquote><p>' + renderInline(quote.join(' ')) + '</p></blockquote>');
      continue;
    }

    if (/^\s*-\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^\s*-\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*-\s+/, ''));
        i += 1;
      }
      html.push('<ul>' + items.map((item) => '<li>' + renderInline(item.trim()) + '</li>').join('') + '</ul>');
      continue;
    }

    if (/^\s*\d+\.\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*\d+\.\s+/, ''));
        i += 1;
      }
      html.push('<ol>' + items.map((item) => '<li>' + renderInline(item.trim()) + '</li>').join('') + '</ol>');
      continue;
    }

    const paragraph = [];
    while (i < lines.length) {
      if (isBlank(lines[i])) break;
      if (/^```/.test(lines[i].trim())) break;
      if (/^(#{1,6})\s+/.test(lines[i])) break;
      if (/^\s*>\s+/.test(lines[i])) break;
      if (/^\s*-\s+/.test(lines[i])) break;
      if (/^\s*\d+\.\s+/.test(lines[i])) break;
      paragraph.push(lines[i].trim());
      i += 1;
    }
    html.push('<p>' + renderInline(paragraph.join(' ')) + '</p>');
  }

  return html.join('\n');
}

function renderTagLinks(tags, hrefPrefix) {
  if (!tags.length) return '';
  return '<div class="module-tags note-page-tags">'
    + tags.map((tag) => '<a class="module-tag" href="' + hrefPrefix + 'tags/' + tag.slug + '/">#' + escapeHtml(tag.label) + '</a>').join('')
    + '</div>';
}

function readModulesMeta() {
  if (!fs.existsSync(MODULES_META_PATH)) return [];
  try {
    const parsed = JSON.parse(readFile(MODULES_META_PATH));
    if (!Array.isArray(parsed)) return [];
    return parsed.map((item) => ({
      id: String(item.id || '').trim(),
      title: String(item.title || '').trim(),
      url: String(item.url || '').trim(),
      summary: String(item.summary || '').trim(),
      tags: normalizeTags(item.tags || [])
    })).filter((item) => item.id && item.title && item.url);
  } catch (err) {
    console.error('FAIL: invalid JSON in content/meta/modules.json');
    console.error(err.message);
    process.exit(1);
  }
}

function collectNotes() {
  const files = listMarkdownFiles(PUBLISHED_DIR);
  const notes = [];
  const slugSet = new Set();

  for (const filePath of files) {
    const raw = readFile(filePath);
    const parsed = splitFrontmatter(raw);
    const fm = parsed.frontmatter;

    const status = String(fm.status || '').trim().toLowerCase();
    if (!status) {
      console.error('FAIL: missing status in', filePath);
      process.exit(1);
    }
    if (!NOTE_STATUSES.has(status)) {
      console.error('FAIL: invalid status in', filePath, '- expected one of published|draft|unpublished');
      process.exit(1);
    }

    const title = String(fm.title || '').trim();
    if (!title) {
      console.error('FAIL: missing title in', filePath);
      process.exit(1);
    }

    const explicitSlug = String(fm.slug || '').trim();
    if (!explicitSlug) {
      console.error('FAIL: missing slug in', filePath);
      process.exit(1);
    }
    const slug = slugify(explicitSlug);
    if (!slug) {
      console.error('FAIL: could not derive slug for', filePath);
      process.exit(1);
    }
    if (slug !== explicitSlug) {
      console.error('FAIL: slug must be lowercase kebab-case in', filePath);
      process.exit(1);
    }
    if (slugSet.has(slug)) {
      console.error('FAIL: duplicate slug', slug);
      process.exit(1);
    }
    slugSet.add(slug);

    if (status !== 'published') continue;

    const dateRaw = String(fm.date || '').trim();
    if (!dateRaw || !/^\d{4}-\d{2}-\d{2}$/.test(dateRaw)) {
      console.error('FAIL: invalid date (expected YYYY-MM-DD) in', filePath);
      process.exit(1);
    }

    if (!Array.isArray(fm.tags) || fm.tags.length === 0) {
      console.error('FAIL: missing tags array in', filePath);
      process.exit(1);
    }

    const dateObj = parseDate(dateRaw);
    if (!dateObj) {
      console.error('FAIL: invalid date in', filePath);
      process.exit(1);
    }
    const tags = normalizeTags(fm.tags || []);
    if (!tags.length) {
      console.error('FAIL: tags must contain at least one valid tag in', filePath);
      process.exit(1);
    }
    const summary = String(fm.summary || '').trim();
    const relatedModules = Array.isArray(fm.related_modules) ? fm.related_modules.map((v) => String(v).trim()).filter(Boolean) : [];

    notes.push({
      sourcePath: filePath,
      title,
      slug,
      summary,
      status,
      dateObj,
      dateIso: formatDate(dateObj),
      tags,
      relatedModules,
      markdown: parsed.body.trim() + '\n',
      htmlBody: renderMarkdown(parsed.body.trim() + '\n')
    });
  }

  notes.sort((a, b) => {
    const aT = a.dateObj ? a.dateObj.getTime() : 0;
    const bT = b.dateObj ? b.dateObj.getTime() : 0;
    if (aT !== bT) return bT - aT;
    return a.title.localeCompare(b.title);
  });

  return notes;
}

function writeNotePage(note) {
  const prefix = '../../';
  const tagsHtml = renderTagLinks(note.tags, prefix);
  const summaryHtml = note.summary
    ? '<p class="module-header-body">' + escapeHtml(note.summary) + '</p>'
    : '';

  const body = '    <div class="module-page">\n'
    + '      <header class="module-header">\n'
    + '        <h1 class="module-header-title">' + escapeHtml(note.title) + '</h1>\n'
    + summaryHtml + '\n'
    + '        <p class="positioning-caption">Published ' + escapeHtml(note.dateIso) + '</p>\n'
    + (tagsHtml ? ('        ' + tagsHtml + '\n') : '')
    + '      </header>\n\n'
    + '      <article class="module-essay note-content">\n'
    + '        <section class="essay-section">\n'
    + note.htmlBody.split('\n').map((line) => '          ' + line).join('\n') + '\n'
    + '        </section>\n'
    + '      </article>\n\n'
    + '      <nav class="module-footer-nav module-footer-nav--section" aria-label="Section navigation">\n'
    + '        <a class="footer-nav-link" href="../" aria-label="Back to Notes">\n'
    + '          <span class="footer-nav-label-full">&larr; Back to Notes</span>\n'
    + '          <span class="footer-nav-label-short">&larr; Notes</span>\n'
    + '        </a>\n'
    + '        <span></span>\n'
    + '      </nav>\n'
    + '    </div>';

  const html = htmlShell({
    title: note.title + ' · Notes · To the Bedrock',
    description: note.summary || ('Note: ' + note.title),
    prefix,
    nav: navHtml(prefix, 'notes'),
    main: body
  });

  const outDir = path.join(OUTPUT_NOTES_DIR, note.slug);
  ensureDir(outDir);
  writeFile(path.join(outDir, 'index.html'), html);
}

function writeNotesIndex(notes) {
  const prefix = '../';
  const listHtml = notes.length
    ? ('<div id="notes-list" class="essay-links essay-links--notes">\n'
      + notes.map((note) => {
        const searchText = [
          note.title,
          note.summary || '',
          note.dateIso,
          note.tags.map((tag) => tag.label).join(' ')
        ].join(' ').toLowerCase();
        const tagsLine = note.tags.length
          ? note.tags.map((tag) => '<a href="../tags/' + tag.slug + '/" class="module-tag">#' + escapeHtml(tag.label) + '</a>').join('')
          : '<span class="module-tag">#untagged</span>';
        return '          <article class="note-index-card" data-note-search="' + escapeAttr(searchText) + '">\n'
          + '            <a class="note-index-link" href="./' + note.slug + '/">\n'
          + '              <span class="note-index-head">\n'
          + '                <span class="note-index-title">' + escapeHtml(note.title) + '</span>\n'
          + '                <span class="note-index-date">Published ' + escapeHtml(note.dateIso) + '</span>\n'
          + '              </span>\n'
          + (note.summary
            ? ('              <span class="note-index-summary">' + escapeHtml(note.summary) + '</span>\n')
            : '')
          + '            </a>\n'
          + '            <div class="module-tags note-index-tags">' + tagsLine + '</div>\n'
          + '          </article>';
      }).join('\n')
      + '\n        </div>')
    : '<p class="essay-body">No published notes yet.</p>';

  const body = '    <div class="module-page">\n'
    + '      <header class="module-header">\n'
    + '        <h1 class="module-header-title">Notes</h1>\n'
    + '        <p class="module-header-body">\n'
    + '          My notes are stories and reflections about the way we organise work, the way we do that work, related feedback loops, and the emergent phenomena that lead to tensions, fragility, and unexpected behaviors in organisations and technologies. Some notes become future <a href="../modules/">modules</a>. This is not a chronological blog feed; it is a field-notes layer connected to the interactive work.\n'
    + '        </p>\n'
    + '      </header>\n\n'
    + '      <article class="module-essay">\n'
    + '        <section class="essay-section">\n'
    + '          <div class="note-search" role="search" aria-label="Search notes">\n'
    + '            <span class="note-search-icon" aria-hidden="true">&#9906;</span>\n'
    + '            <input id="notes-search-input" class="note-search-input" type="search" placeholder="Search notes" autocomplete="off" />\n'
    + '          </div>\n'
    + '          ' + listHtml + '\n'
    + '        </section>\n'
    + '      </article>\n'
    + '    </div>';

  const html = htmlShell({
    title: 'Notes · To the Bedrock',
    description: 'Notes and stories behind the modules and models in To the Bedrock.',
    prefix,
    nav: navHtml(prefix, 'notes'),
    main: body,
    extraScripts: [prefix + 'js/notes-search.js']
  });

  writeFile(path.join(OUTPUT_NOTES_DIR, 'index.html'), html);
}

function writeTagPage(tag, notes, modules) {
  const prefix = '../../';

  const noteItems = notes.length
    ? '<div class="essay-links">\n'
      + notes.map((note) => '          <a class="essay-link" href="../../notes/' + note.slug + '/">\n'
          + '            <span class="essay-link-label">' + escapeHtml(note.title) + '</span>\n'
          + (note.summary
            ? ('            <span class="essay-link-desc">' + escapeHtml(note.summary) + '</span>\n')
            : '')
          + '          </a>').join('\n')
      + '\n        </div>'
    : '<p class="essay-body">No notes yet for this tag.</p>';

  const moduleItems = modules.length
    ? '<div class="essay-links">\n'
      + modules.map((mod) => {
        const href = mod.url.startsWith('http://') || mod.url.startsWith('https://')
          ? mod.url
          : ('../../' + mod.url.replace(/^\/+/, ''));
        return '          <a class="essay-link" href="' + href + '">\n'
          + '            <span class="essay-link-label">' + escapeHtml(mod.title) + '</span>\n'
          + '            <span class="essay-link-desc">' + escapeHtml(mod.summary || 'Interactive module') + '</span>\n'
          + '          </a>';
      }).join('\n')
      + '\n        </div>'
    : '<p class="essay-body">No modules mapped to this tag yet.</p>';

  const body = '    <div class="module-page">\n'
    + '      <header class="module-header">\n'
    + '        <h1 class="module-header-title">Tag: ' + escapeHtml(tag.label) + '</h1>\n'
    + '        <p class="module-header-body">Related notes and modules for this theme.</p>\n'
    + '      </header>\n\n'
    + '      <article class="module-essay">\n'
    + '        <section class="essay-section">\n'
    + '          <h2 class="essay-heading">Notes</h2>\n'
    + '          ' + noteItems + '\n'
    + '        </section>\n'
    + '        <section class="essay-section">\n'
    + '          <h2 class="essay-heading">Modules</h2>\n'
    + '          ' + moduleItems + '\n'
    + '        </section>\n'
    + '      </article>\n\n'
    + '      <nav class="module-footer-nav module-footer-nav--section" aria-label="Section navigation">\n'
    + '        <a class="footer-nav-link" href="../../tags/" aria-label="Back to Tags">\n'
    + '          <span class="footer-nav-label-full">&larr; Back to Tags</span>\n'
    + '          <span class="footer-nav-label-short">&larr; Tags</span>\n'
    + '        </a>\n'
    + '        <a class="footer-nav-link" href="../../notes/" aria-label="Back to Notes">\n'
    + '          <span class="footer-nav-label-full">Back to Notes &rarr;</span>\n'
    + '          <span class="footer-nav-label-short">Notes &rarr;</span>\n'
    + '        </a>\n'
    + '      </nav>\n'
    + '    </div>';

  const html = htmlShell({
    title: 'Tag: ' + tag.label + ' · To the Bedrock',
    description: 'Tag page for ' + tag.label,
    prefix,
    nav: navHtml(prefix, 'notes'),
    main: body
  });

  const outDir = path.join(OUTPUT_TAGS_DIR, tag.slug);
  ensureDir(outDir);
  writeFile(path.join(outDir, 'index.html'), html);
}

function writeTagsIndex(tagsWithCounts) {
  const prefix = '../';
  const list = tagsWithCounts.length
    ? ('<div class="essay-links">\n'
      + tagsWithCounts.map((tag) => '          <a class="essay-link" href="./' + tag.slug + '/">\n'
        + '            <span class="essay-link-label">#' + escapeHtml(tag.label) + '</span>\n'
        + '            <span class="essay-link-desc">' + escapeHtml(tag.noteCount + ' notes · ' + tag.moduleCount + ' modules') + '</span>\n'
        + '          </a>').join('\n')
      + '\n        </div>')
    : '<p class="essay-body">No tags yet.</p>';

  const body = '    <div class="module-page">\n'
    + '      <header class="module-header">\n'
    + '        <h1 class="module-header-title">Tags</h1>\n'
    + '        <p class="module-header-body">Browse themes across notes and mapped modules.</p>\n'
    + '      </header>\n\n'
    + '      <article class="module-essay">\n'
    + '        <section class="essay-section">\n'
    + '          <h2 class="essay-heading">All Tags</h2>\n'
    + '          ' + list + '\n'
    + '        </section>\n'
    + '      </article>\n'
    + '    </div>';

  const html = htmlShell({
    title: 'Tags · To the Bedrock',
    description: 'Tag index across notes and modules.',
    prefix,
    nav: navHtml(prefix, 'notes'),
    main: body
  });

  writeFile(path.join(OUTPUT_TAGS_DIR, 'index.html'), html);
}

function cleanGeneratedDirs(baseDir, keepFiles) {
  if (!fs.existsSync(baseDir)) return;
  const entries = fs.readdirSync(baseDir, { withFileTypes: true });
  for (const entry of entries) {
    const abs = path.join(baseDir, entry.name);
    if (entry.isDirectory()) {
      removeDirIfExists(abs);
      continue;
    }
    if (entry.isFile() && !keepFiles.has(entry.name)) {
      fs.unlinkSync(abs);
    }
  }
}

function build() {
  ensureDir(PUBLISHED_DIR);
  ensureDir(OUTPUT_NOTES_DIR);
  ensureDir(OUTPUT_TAGS_DIR);
  ensureDir(DATA_DIR);

  const notes = collectNotes();
  const modules = readModulesMeta();
  const modulesById = new Map(modules.map((mod) => [mod.id, mod]));

  for (const note of notes) {
    note.relatedModules = resolveRelatedModules(note.relatedModules, modulesById);
  }

  cleanGeneratedDirs(OUTPUT_NOTES_DIR, new Set(['index.html']));
  cleanGeneratedDirs(OUTPUT_TAGS_DIR, new Set(['index.html']));

  for (const note of notes) {
    writeNotePage(note);
  }

  writeNotesIndex(notes);

  const tagsMap = new Map();

  for (const note of notes) {
    for (const tag of note.tags) {
      if (!tagsMap.has(tag.slug)) tagsMap.set(tag.slug, { label: tag.label, slug: tag.slug, notes: [], modules: [] });
      tagsMap.get(tag.slug).notes.push(note);
    }
  }

  for (const mod of modules) {
    for (const tag of mod.tags) {
      if (!tagsMap.has(tag.slug)) tagsMap.set(tag.slug, { label: tag.label, slug: tag.slug, notes: [], modules: [] });
      tagsMap.get(tag.slug).modules.push(mod);
    }
  }

  const tags = Array.from(tagsMap.values()).sort((a, b) => a.label.localeCompare(b.label));

  for (const tag of tags) {
    writeTagPage(tag, tag.notes, tag.modules);
  }

  writeTagsIndex(tags.map((tag) => ({
    label: tag.label,
    slug: tag.slug,
    noteCount: tag.notes.length,
    moduleCount: tag.modules.length
  })));

  writeFile(path.join(DATA_DIR, 'notes-index.json'), JSON.stringify(notes.map((note) => ({
    title: note.title,
    slug: note.slug,
    summary: note.summary,
    date: note.dateIso,
    tags: note.tags,
    relatedModules: note.relatedModules
  })), null, 2) + '\n');

  writeFile(path.join(DATA_DIR, 'tags-index.json'), JSON.stringify(tags.map((tag) => ({
    label: tag.label,
    slug: tag.slug,
    notes: tag.notes.map((note) => note.slug),
    modules: tag.modules.map((mod) => mod.id)
  })), null, 2) + '\n');

  console.log('PASS: built notes and tags');
  console.log('Generated notes:', notes.length);
  console.log('Generated tags:', tags.length);
}

build();
