'use strict';

(function initForceGraphUtils(root) {
  function buildLinkIndex(links) {
    var idx = new Set();
    if (!links || !links.forEach) return idx;
    links.forEach(function(l) {
      var s = (typeof l.source === 'object' && l.source) ? l.source.id : l.source;
      var t = (typeof l.target === 'object' && l.target) ? l.target.id : l.target;
      if (s === undefined || t === undefined) return;
      idx.add(s + '|' + t);
      idx.add(t + '|' + s);
    });
    return idx;
  }

  function isNeighbour(linkIndex, focusedId, otherId) {
    if (focusedId === otherId) return true;
    return linkIndex.has(focusedId + '|' + otherId);
  }

  function clearHighlights(selections) {
    if (!selections) return;
    if (selections.node) {
      selections.node
        .classed('is-dim', false)
        .classed('is-related', false)
        .classed('is-group-focus', false);
    }
    if (selections.label) {
      selections.label
        .classed('is-dim', false)
        .classed('is-related', false)
        .classed('is-active', false);
    }
    if (selections.link) {
      selections.link
        .classed('is-dim', false)
        .classed('is-related', false);
    }
  }

  function applyFocus(selections, focused) {
    if (!selections || !focused) return;
    var linkIndex = selections.linkIndex;
    if (!linkIndex) return;
    var focusedId = focused.id;

    if (selections.node) {
      selections.node
        .classed('is-group-focus', false)
        .classed('is-related', false)
        .classed('is-dim', function(n) {
          return !isNeighbour(linkIndex, focusedId, n.id);
        });
    }
    if (selections.label) {
      selections.label
        .classed('is-related', false)
        .classed('is-dim', function(n) {
          return !isNeighbour(linkIndex, focusedId, n.id);
        })
        .classed('is-active', function(n) {
          return isNeighbour(linkIndex, focusedId, n.id);
        });
    }
    if (selections.link) {
      selections.link
        .classed('is-dim', function(l) {
          var s = (typeof l.source === 'object') ? l.source.id : l.source;
          var t = (typeof l.target === 'object') ? l.target.id : l.target;
          return s !== focusedId && t !== focusedId;
        })
        .classed('is-related', function(l) {
          var s = (typeof l.source === 'object') ? l.source.id : l.source;
          var t = (typeof l.target === 'object') ? l.target.id : l.target;
          return s === focusedId || t === focusedId;
        });
    }
  }

  function applyLegendFilter(selections, predicate, options) {
    if (!selections || typeof predicate !== 'function') return;
    var opts = options || {};
    var includeRelated = opts.includeRelated !== false; // default true
    var primary = new Set();
    var related = new Set();

    if (selections.simulation && selections.simulation.nodes) {
      selections.simulation.nodes().forEach(function(n) {
        if (predicate(n)) primary.add(n.id);
      });
      if (includeRelated) {
        var linkForce = selections.simulation.force ? selections.simulation.force('link') : null;
        var simLinks = linkForce && linkForce.links ? linkForce.links() : [];
        simLinks.forEach(function(l) {
          var s = (typeof l.source === 'object') ? l.source.id : l.source;
          var t = (typeof l.target === 'object') ? l.target.id : l.target;
          if (primary.has(s) && !primary.has(t)) related.add(t);
          if (primary.has(t) && !primary.has(s)) related.add(s);
        });
      }
    }

    if (selections.node) {
      selections.node
        .classed('is-group-focus', function(n) { return primary.has(n.id); })
        .classed('is-related', function(n) { return !primary.has(n.id) && related.has(n.id); })
        .classed('is-dim', function(n) { return !primary.has(n.id) && !related.has(n.id); });
    }
    if (selections.label) {
      selections.label
        .classed('is-active', function(n) { return primary.has(n.id); })
        .classed('is-related', function(n) { return !primary.has(n.id) && related.has(n.id); })
        .classed('is-dim', function(n) { return !primary.has(n.id) && !related.has(n.id); });
    }
    if (selections.link) {
      selections.link
        .classed('is-related', function(l) {
          var s = (typeof l.source === 'object') ? l.source.id : l.source;
          var t = (typeof l.target === 'object') ? l.target.id : l.target;
          return (primary.has(s) && primary.has(t))
            || (primary.has(s) && related.has(t))
            || (primary.has(t) && related.has(s));
        })
        .classed('is-dim', function(l) {
          var s = (typeof l.source === 'object') ? l.source.id : l.source;
          var t = (typeof l.target === 'object') ? l.target.id : l.target;
          var touchesPrimary = primary.has(s) || primary.has(t);
          return !touchesPrimary;
        });
    }
  }

  function wireLegend(items, callbacks) {
    var list = Array.isArray(items) ? items : Array.prototype.slice.call(items || []);
    var detach = [];
    var pinnedKey = null;

    function isPinned() {
      return pinnedKey !== null;
    }

    list.forEach(function(item) {
      var key = item.getAttribute('data-legend-group')
        || item.getAttribute('data-legend-type')
        || item.getAttribute('data-legend-key');

      function onMouseEnter() {
        if (isPinned()) return;
        callbacks && callbacks.onActivate && callbacks.onActivate(key, item);
      }
      function onMouseLeave() {
        if (isPinned()) return;
        callbacks && callbacks.onClear && callbacks.onClear();
      }
      function onFocus() {
        if (isPinned()) return;
        callbacks && callbacks.onActivate && callbacks.onActivate(key, item);
      }
      function onBlur() {
        if (isPinned()) return;
        callbacks && callbacks.onClear && callbacks.onClear();
      }
      function onClick() {
        if (pinnedKey === key) {
          pinnedKey = null;
          list.forEach(function(it) { it.setAttribute('aria-pressed', 'false'); });
          callbacks && callbacks.onClear && callbacks.onClear();
          return;
        }
        pinnedKey = key;
        list.forEach(function(it) {
          var match = (it === item);
          it.setAttribute('aria-pressed', match ? 'true' : 'false');
        });
        callbacks && callbacks.onPin && callbacks.onPin(key, item);
      }
      function onKeyDown(event) {
        if (event.key === 'Escape') {
          event.preventDefault();
          if (pinnedKey !== null) {
            pinnedKey = null;
            list.forEach(function(it) { it.setAttribute('aria-pressed', 'false'); });
          }
          callbacks && callbacks.onClear && callbacks.onClear();
        }
      }

      item.addEventListener('mouseenter', onMouseEnter);
      item.addEventListener('mouseleave', onMouseLeave);
      item.addEventListener('focus', onFocus);
      item.addEventListener('blur', onBlur);
      item.addEventListener('click', onClick);
      item.addEventListener('keydown', onKeyDown);

      detach.push(function() {
        item.removeEventListener('mouseenter', onMouseEnter);
        item.removeEventListener('mouseleave', onMouseLeave);
        item.removeEventListener('focus', onFocus);
        item.removeEventListener('blur', onBlur);
        item.removeEventListener('click', onClick);
        item.removeEventListener('keydown', onKeyDown);
      });
    });

    return {
      isPinned: isPinned,
      activeKey: function() { return pinnedKey; },
      release: function() {
        pinnedKey = null;
        list.forEach(function(it) { it.setAttribute('aria-pressed', 'false'); });
      },
      detach: function() {
        detach.forEach(function(fn) { fn(); });
      }
    };
  }

  var api = {
    buildLinkIndex: buildLinkIndex,
    isNeighbour: isNeighbour,
    clearHighlights: clearHighlights,
    applyFocus: applyFocus,
    applyLegendFilter: applyLegendFilter,
    wireLegend: wireLegend
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  root.ForceGraphUtils = api;
})(typeof window !== 'undefined' ? window : globalThis);
