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
      return '<strong>' + safeTitle + '</strong><br>' + safeDesc + '<br><span class="mix-mapper-tooltip-tags">' + safeTags + '</span>';
    }

    function linkTooltipHtml(link, mode, nodeById) {
      var source = nodeById[link.source];
      var target = nodeById[link.target];
      if (!source || !target) return '';

      var title = escapeHtml(source.shortLabel + ' to ' + target.shortLabel);
      var lens = modeLabel(mode);
      var narrative = escapeHtml(complexityLinkNarrative(link, mode));
      var semantic = escapeHtml(link.semantic || '');

      return '<strong>' + title + '</strong><br>' +
        '<span class="mix-mapper-tooltip-tags">' + escapeHtml(lens) + '</span>: ' + narrative +
        '<br><span class="mix-mapper-tooltip-tags">' + semantic + '</span>';
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
