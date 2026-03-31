'use strict';

(function initMixMapperSemantics(root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
    return;
  }
  root.MixMapperSemantics = factory();
}(typeof globalThis !== 'undefined' ? globalThis : this, function buildMixMapperSemantics() {
  function modeLabel(mode) {
    if (mode === 'all') return 'Overview';
    if (mode === 'assumptions') return 'Assumptions';
    if (mode === 'learning') return 'Learning';
    return 'Process';
  }

  function linkKey(link) {
    return link.source + '>' + link.target + ':' + link.kind;
  }

  function defaultLinkNarrative(link, mode) {
    if (mode === 'assumptions') {
      if (link.lane === 'traditional' && link.kind === 'primary') {
        return 'Assumes requirements can be known early and remain stable through downstream delivery.';
      }
      if (link.lane === 'traditional' && link.kind === 'learning') {
        return 'Assumes post-release evidence can reopen requirements, but only through a bounded governance path.';
      }
      if (link.lane === 'traditional') {
        return 'Assumes late changes can be managed as local rework without reframing the full request.';
      }
      if (link.lane === 'complexity' && link.kind === 'primary') {
        return 'Assumes uncertainty is normal and that commitments should stay revisable while evidence matures.';
      }
      return 'Assumes feedback and adaptation are required to keep decisions aligned with reality.';
    }

    if (mode === 'learning') {
      if (link.lane === 'traditional' && link.kind === 'primary') {
        return 'Learning is weakly encoded here; flow emphasizes planned handoff over explicit adaptation.';
      }
      if (link.lane === 'traditional' && link.kind === 'learning') {
        return 'Learning can travel upstream from release to requirements, but mostly after delivery rather than continuously.';
      }
      if (link.lane === 'traditional') {
        return 'Learning appears mainly as downstream rework after friction is discovered.';
      }
      if (link.lane === 'complexity' && link.kind === 'primary') {
        return 'Forward flow remains open to updates as new evidence appears.';
      }
      return 'Feedback loops convert outcomes into upstream change.';
    }

    if (link.kind === 'minor' || link.kind === 'feedback' || link.kind === 'learning') {
      return 'This connection represents an adjustment loop around the core sequence.';
    }
    return 'This connection represents a primary handoff in the lifecycle.';
  }

  function complexityLinkNarrative(link, mode, narrativeMap) {
    var narratives = narrativeMap[linkKey(link)];
    if (narratives) return narratives[mode] || narratives.process || link.semantic || '';
    return defaultLinkNarrative(link, mode);
  }

  function getProcessRole(link) {
    if (link.kind === 'primary' && link.lane === 'traditional') return 'traditional-flow';
    if (link.kind === 'primary' && link.lane === 'complexity') return 'complexity-flow';
    if (link.kind === 'minor' && link.lane === 'traditional') return 'handoff-rework';
    if (link.kind === 'minor') return 'local-adjust';
    return 'adaptive-context';
  }

  function isTraditionalAdaptiveLink(link) {
    return link.lane === 'traditional' && (link.kind === 'minor' || link.kind === 'learning');
  }

  function getAssumptionRole(link) {
    if (link.lane === 'traditional' && link.kind === 'primary') return 'certainty';
    if (isTraditionalAdaptiveLink(link)) return 'certainty-revisit';
    if (link.lane === 'complexity' && (link.kind === 'feedback' || link.kind === 'learning')) return 'learning-test';
    return 'context';
  }

  function getLearningRole(link) {
    if (link.lane === 'complexity' && (link.kind === 'feedback' || link.kind === 'learning')) return 'learning-loop';
    if (link.lane === 'complexity' && link.kind === 'primary') return 'learning-support';
    if (link.lane === 'traditional' && link.kind === 'primary') return 'learning-support';
    if (isTraditionalAdaptiveLink(link)) return 'legacy-upstream';
    return 'delivery-context';
  }

  return {
    modeLabel: modeLabel,
    linkKey: linkKey,
    defaultLinkNarrative: defaultLinkNarrative,
    complexityLinkNarrative: complexityLinkNarrative,
    getProcessRole: getProcessRole,
    isTraditionalAdaptiveLink: isTraditionalAdaptiveLink,
    getAssumptionRole: getAssumptionRole,
    getLearningRole: getLearningRole
  };
}));
