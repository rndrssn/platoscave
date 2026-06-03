// Regression tests for stale notes/articles index pages repairing themselves from fresh JSON.
'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { FakeDocument, FakeElement } = require('./helpers/fake-dom');

function flushPromises() {
  return Promise.resolve().then(() => Promise.resolve()).then(() => Promise.resolve());
}

function loadScript(scriptName, harness) {
  const source = fs.readFileSync(path.join(__dirname, '..', 'js', scriptName), 'utf8');
  const context = {
    document: harness.document,
    fetch: harness.fetch,
    Date: { now: () => 123456789 },
    console,
  };
  vm.createContext(context);
  vm.runInContext(source, context, { filename: scriptName });
}

function makeHarness(options) {
  const document = new FakeDocument();
  const input = document.register(new FakeElement('input', { id: options.inputId }));
  const list = document.register(new FakeElement('div', { id: options.listId }));
  let fetchCall = null;

  function fetch(url, fetchOptions) {
    fetchCall = { url, options: fetchOptions };
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve(options.entries)
    });
  }

  return {
    document,
    input,
    list,
    fetch,
    get fetchCall() { return fetchCall; }
  };
}

function addExistingCard(harness, slug, cardClasses, searchAttrName) {
  const card = harness.document.createElement('article');
  cardClasses.forEach((className) => card.classList.add(className));
  card.setAttribute(searchAttrName, slug.replace(/-/g, ' '));

  const link = harness.document.createElement('a');
  link.classList.add('note-index-link');
  link.setAttribute('href', './' + slug + '/');
  card.appendChild(link);

  harness.list.appendChild(card);
  return card;
}

function cardSlugs(list) {
  return list.children.map((card) => {
    const explicit = card.getAttribute('data-writing-slug');
    if (explicit) return explicit;
    const link = card.querySelector('.note-index-link');
    const href = link ? link.getAttribute('href') : '';
    const match = String(href || '').match(/\.\/([^/]+)\//);
    return match ? match[1] : '';
  });
}

async function testNotesIndexPrependsMissingFreshEntries() {
  const harness = makeHarness({
    inputId: 'notes-search-input',
    listId: 'notes-list',
    entries: [
      {
        title: 'Newest note',
        slug: 'newest-note',
        summary: 'Fresh writing',
        date: '2026-06-03',
        tags: [{ label: 'testing', slug: 'testing' }]
      },
      {
        title: 'Middle note',
        slug: 'middle-note',
        summary: 'Visible when filtered',
        date: '2026-06-02',
        tags: []
      },
      {
        title: 'Old note',
        slug: 'old-note',
        summary: 'Already rendered',
        date: '2026-06-01',
        tags: []
      }
    ]
  });

  harness.input.value = 'middle';
  addExistingCard(harness, 'old-note', ['note-index-card'], 'data-note-search');

  loadScript('notes-search.js', harness);
  await flushPromises();

  assert.strictEqual(harness.fetchCall.url, '../data/notes-index.json?fresh=123456789');
  assert.strictEqual(harness.fetchCall.options.cache, 'no-store');
  assert.deepStrictEqual(cardSlugs(harness.list), ['newest-note', 'middle-note', 'old-note']);
  assert.strictEqual(harness.list.children[0].hidden, true, 'non-matching fresh note should be hidden by active filter');
  assert.strictEqual(harness.list.children[1].hidden, false, 'matching fresh note should remain visible');
  assert.strictEqual(harness.list.children[2].hidden, true, 'existing non-matching note should be hidden by active filter');
}

async function testArticlesIndexPrependsMissingFreshEntries() {
  const harness = makeHarness({
    inputId: 'articles-search-input',
    listId: 'articles-list',
    entries: [
      {
        title: 'New article',
        slug: 'new-article',
        summary: 'Fresh article',
        date: '2026-06-03',
        tags: [{ label: 'governance', slug: 'governance' }]
      },
      {
        title: 'Old article',
        slug: 'old-article',
        summary: 'Already rendered',
        date: '2026-06-01',
        tags: []
      }
    ]
  });

  addExistingCard(harness, 'old-article', ['note-index-card', 'article-index-card'], 'data-article-search');

  loadScript('articles-search.js', harness);
  await flushPromises();

  assert.strictEqual(harness.fetchCall.url, '../data/articles-index.json?fresh=123456789');
  assert.strictEqual(harness.fetchCall.options.cache, 'no-store');
  assert.deepStrictEqual(cardSlugs(harness.list), ['new-article', 'old-article']);
  assert(harness.list.children[0].classList.contains('article-index-card'), 'fresh article card should keep article index class');

  const tagLink = harness.list.children[0].querySelector('.module-tag');
  assert.strictEqual(tagLink.getAttribute('href'), '../tags/governance/');
  assert.strictEqual(tagLink.textContent, '#governance');
}

async function run() {
  await testNotesIndexPrependsMissingFreshEntries();
  await testArticlesIndexPrependsMissingFreshEntries();
  console.log('PASS: tests/test-writing-index-freshness.js');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
