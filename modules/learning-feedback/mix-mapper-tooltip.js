'use strict';

(function initMixMapperTooltip(root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
    return;
  }
  root.MixMapperTooltip = factory();
}(typeof globalThis !== 'undefined' ? globalThis : this, function buildMixMapperTooltip() {
  function createTooltipContent(deps) {
    deps = deps || {};
    var modeLabel = deps.modeLabel || function(mode) {
      if (mode === 'all') return 'Overview';
      if (mode === 'assumptions') return 'Assumptions';
      if (mode === 'learning') return 'Learning';
      return 'Process';
    };
    var complexityLinkNarrative = deps.complexityLinkNarrative || function(link) {
      return link && link.semantic ? link.semantic : '';
    };

    function escapeHtml(value) {
      return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }

    function tooltipHtml(node) {
      var safeTitle = escapeHtml(String(node.step) + '. ' + node.title);
      var safeDesc = escapeHtml(node.description);
      var safeTags = escapeHtml(node.tags.join(' · '));
      return '<div class="mix-mapper-tooltip-header">' + safeTitle + '</div>' +
        '<div class="mix-mapper-tooltip-body">' + safeDesc + '</div>' +
        '<div class="mix-mapper-tooltip-meta">' + safeTags + '</div>';
    }

    function linkTooltipHtml(link, mode, nodeById) {
      var source = nodeById[link.source];
      var target = nodeById[link.target];
      if (!source || !target) return '';

      var title = escapeHtml(source.shortLabel + ' \u2192 ' + target.shortLabel);
      var lens = escapeHtml(modeLabel(mode));
      var narrative = escapeHtml(complexityLinkNarrative(link, mode));
      var semantic = escapeHtml(link.semantic || '');
      var modeKey = mode === 'all' ? 'all' : mode;

      return '<div class="mix-mapper-tooltip-header">' + title + '</div>' +
        '<div class="mix-mapper-tooltip-lens mix-mapper-tooltip-lens--' + modeKey + '">' + lens + '</div>' +
        '<div class="mix-mapper-tooltip-body">' + narrative + '</div>' +
        (semantic ? '<div class="mix-mapper-tooltip-meta">' + semantic + '</div>' : '');
    }

    function linkAriaLabel(link, mode, nodeById) {
      var source = nodeById[link.source];
      var target = nodeById[link.target];
      if (!source || !target) return '';

      return source.shortLabel + ' to ' + target.shortLabel + '. ' +
        modeLabel(mode) + '. ' + complexityLinkNarrative(link, mode);
    }

    return {
      escapeHtml: escapeHtml,
      tooltipHtml: tooltipHtml,
      linkTooltipHtml: linkTooltipHtml,
      linkAriaLabel: linkAriaLabel
    };
  }

  return {
    createTooltipContent: createTooltipContent
  };
}));
