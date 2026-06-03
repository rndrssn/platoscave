// Client-side keyword filter and JSON-backed rendering for the notes index page.
'use strict';

(function initNotesSearch() {
  var input = document.getElementById('notes-search-input');
  var list = document.getElementById('notes-list');
  if (!input || !list) return;

  var cards = Array.from(list.querySelectorAll('.note-index-card'));

  function normalize(text) {
    return String(text || '').toLowerCase().replace(/\s+/g, ' ').trim();
  }

  function safeSlug(value) {
    var slug = String(value || '').trim();
    return /^[a-z0-9-]+$/.test(slug) ? slug : '';
  }

  function buildSearchText(entry) {
    var tags = Array.isArray(entry.tags) ? entry.tags : [];
    return normalize([
      entry.title,
      entry.summary,
      entry.date,
      tags.map(function(tag) { return tag && tag.label; }).join(' ')
    ].join(' '));
  }

  function appendTextNode(parent, tagName, className, text) {
    var el = document.createElement(tagName);
    if (className) el.className = className;
    if (className && el.classList) {
      className.split(/\s+/).filter(Boolean).forEach(function(name) {
        el.classList.add(name);
      });
    }
    el.textContent = String(text || '');
    parent.appendChild(el);
    return el;
  }

  function appendTags(parent, tags) {
    if (!Array.isArray(tags) || !tags.length) {
      appendTextNode(parent, 'span', 'module-tag', '#untagged');
      return;
    }

    tags.forEach(function(tag) {
      var slug = safeSlug(tag && tag.slug);
      if (!slug) return;
      var link = appendTextNode(parent, 'a', 'module-tag', '#' + String(tag.label || slug));
      link.setAttribute('href', '../tags/' + slug + '/');
    });
  }

  function buildCard(entry) {
    var slug = safeSlug(entry && entry.slug);
    if (!slug) return null;

    var card = document.createElement('article');
    card.className = 'note-index-card';
    if (card.classList) card.classList.add('note-index-card');
    card.setAttribute('data-writing-slug', slug);
    card.setAttribute('data-note-search', buildSearchText(entry));

    var link = document.createElement('a');
    link.className = 'note-index-link';
    if (link.classList) link.classList.add('note-index-link');
    link.setAttribute('href', './' + slug + '/');
    card.appendChild(link);

    var head = document.createElement('span');
    head.className = 'note-index-head';
    if (head.classList) head.classList.add('note-index-head');
    link.appendChild(head);

    appendTextNode(head, 'span', 'note-index-title', entry.title || slug);
    appendTextNode(head, 'span', 'note-index-date', entry.date ? 'Published ' + entry.date : 'Published');

    if (entry.summary) {
      appendTextNode(link, 'span', 'note-index-summary', entry.summary);
      appendTextNode(link, 'span', 'note-index-more', '...more');
    }

    var tagLine = document.createElement('div');
    tagLine.className = 'module-tags note-index-tags';
    if (tagLine.classList) {
      tagLine.classList.add('module-tags');
      tagLine.classList.add('note-index-tags');
    }
    appendTags(tagLine, entry.tags);
    card.appendChild(tagLine);

    return card;
  }

  function runFilter() {
    var query = normalize(input.value);

    cards.forEach(function(card) {
      var haystack = normalize(card.getAttribute('data-note-search') || card.textContent || '');
      var isMatch = !query || haystack.indexOf(query) !== -1;
      card.hidden = !isMatch;
    });
  }

  function renderFreshEntries(entries) {
    while (list.firstChild) {
      list.removeChild(list.firstChild);
    }

    entries.forEach(function(entry) {
      var card = buildCard(entry);
      if (card) list.appendChild(card);
    });

    cards = Array.from(list.querySelectorAll('.note-index-card'));
    runFilter();
  }

  function fetchFreshIndex() {
    if (typeof fetch !== 'function') return;

    fetch('../data/notes-index.json?fresh=' + Date.now(), { cache: 'no-store' })
      .then(function(response) {
        if (!response || !response.ok) return null;
        return response.json();
      })
      .then(function(entries) {
        if (Array.isArray(entries)) renderFreshEntries(entries);
      })
      .catch(function() {});
  }

  input.addEventListener('input', runFilter);
  fetchFreshIndex();
})();
