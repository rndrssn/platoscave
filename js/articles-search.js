'use strict';

(function initArticlesSearch() {
  var input = document.getElementById('articles-search-input');
  var list = document.getElementById('articles-list');
  if (!input || !list) return;

  var cards = Array.from(list.querySelectorAll('.article-index-card'));
  if (!cards.length) return;

  function normalize(text) {
    return String(text || '').toLowerCase().replace(/\s+/g, ' ').trim();
  }

  function runFilter() {
    var query = normalize(input.value);

    cards.forEach(function(card) {
      var haystack = normalize(card.getAttribute('data-article-search') || card.textContent || '');
      var isMatch = !query || haystack.indexOf(query) !== -1;
      card.hidden = !isMatch;
    });
  }

  input.addEventListener('input', runFilter);
})();
