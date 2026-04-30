'use strict';

(function initMixMapperData(root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
    return;
  }
  root.MixMapperData = factory();
}(typeof globalThis !== 'undefined' ? globalThis : this, function buildMixMapperData() {
  var BASE_NODES = [
    {
      id: 'c1',
      lane: 'complexity',
      step: 1,
      title: 'Opportunity and Sensing Intake',
      shortLabel: 'Sensing',
      description: 'Surface signals before committing to a predefined solution.',
      tags: ['signals', 'opportunity', 'ambiguity']
    },
    {
      id: 'c2',
      lane: 'complexity',
      step: 2,
      title: 'Strategic and Tactical Portfolio Fit',
      shortLabel: 'Portfolio Fit',
      description: 'Balance investment choices while uncertainty is still high.',
      tags: ['investment', 'optionality', 'uncertainty']
    },
    {
      id: 'c3',
      lane: 'complexity',
      step: 3,
      title: 'Discovery and Framing',
      shortLabel: 'Discovery',
      description: 'Frame the problem and stress-test assumptions with evidence.',
      tags: ['assumptions', 'framing', 'evidence']
    },
    {
      id: 'c4',
      lane: 'complexity',
      step: 4,
      title: 'Solution Exploration, Design and Validation',
      shortLabel: 'Explore & Validate',
      description: 'Explore options in parallel and iterate with feedback.',
      tags: ['options', 'experiments', 'feedback']
    },
    {
      id: 'c5',
      lane: 'complexity',
      step: 5,
      title: 'Delivery Planning and Execute',
      shortLabel: 'Incremental Delivery',
      description: 'Ship in increments while validation continues.',
      tags: ['incremental', 'delivery', 'adaptation']
    },
    {
      id: 'c6',
      lane: 'complexity',
      step: 6,
      title: 'Launch, Measure, Adapt and Change',
      shortLabel: 'Launch & Learn',
      description: 'Use market evidence to reshape upstream choices.',
      tags: ['measurement', 'learning', 'adaptation']
    },
    {
      id: 't1',
      lane: 'traditional',
      step: 1,
      title: 'Request Submission',
      shortLabel: 'Request',
      description: 'Start from stated requirements and requested work.',
      tags: ['request', 'requirements', 'intake']
    },
    {
      id: 't2',
      lane: 'traditional',
      step: 2,
      title: 'Business Case Review',
      shortLabel: 'Business Case',
      description: 'Seek approval before detailed downstream work can proceed.',
      tags: ['approval', 'gate', 'commitment']
    },
    {
      id: 't3',
      lane: 'traditional',
      step: 3,
      title: 'Requirements Gathering and Engineering',
      shortLabel: 'Requirements',
      description: 'Define and stabilize requirements early in the lifecycle.',
      tags: ['specifications', 'freeze', 'handoff']
    },
    {
      id: 't4',
      lane: 'traditional',
      step: 4,
      title: 'Design and Stakeholder Alignment',
      shortLabel: 'Design Alignment',
      description: 'Align architecture and stakeholders before implementation.',
      tags: ['alignment', 'architecture', 'handoff']
    },
    {
      id: 't5',
      lane: 'traditional',
      step: 5,
      title: 'Implementation',
      shortLabel: 'Build',
      description: 'Deliver according to approved scope and sequence.',
      tags: ['plan', 'execution', 'schedule']
    },
    {
      id: 't6',
      lane: 'traditional',
      step: 6,
      title: 'Release and Close Project',
      shortLabel: 'Release & Close',
      description: 'Deploy and close the project cycle.',
      tags: ['deployment', 'closure', 'handoff']
    }
  ];

  var LINKS = [
    { source: 't1', target: 't2', lane: 'traditional', kind: 'primary', semantic: 'approval flow' },
    { source: 't2', target: 't3', lane: 'traditional', kind: 'primary', semantic: 'authorized requirements work' },
    { source: 't3', target: 't4', lane: 'traditional', kind: 'primary', semantic: 'requirements handoff' },
    { source: 't4', target: 't5', lane: 'traditional', kind: 'primary', semantic: 'design-to-build handoff' },
    { source: 't5', target: 't6', lane: 'traditional', kind: 'primary', semantic: 'delivery to release' },
    { source: 't4', target: 't3', lane: 'traditional', kind: 'minor', semantic: 'clarification loop' },
    { source: 't6', target: 't5', lane: 'traditional', kind: 'minor', semantic: 'post-release fixes' },
    { source: 't6', target: 't3', lane: 'traditional', kind: 'learning', semantic: 'release evidence informs requirements refresh' },

    { source: 'c1', target: 'c2', lane: 'complexity', kind: 'primary', semantic: 'signals inform investment' },
    { source: 'c2', target: 'c3', lane: 'complexity', kind: 'primary', semantic: 'portfolio shapes framing' },
    { source: 'c3', target: 'c4', lane: 'complexity', kind: 'primary', semantic: 'framing drives exploration' },
    { source: 'c4', target: 'c5', lane: 'complexity', kind: 'primary', semantic: 'validated options enter delivery' },
    { source: 'c5', target: 'c6', lane: 'complexity', kind: 'primary', semantic: 'delivery reaches launch' },
    { source: 'c3', target: 'c2', lane: 'complexity', kind: 'feedback', semantic: 'discovery reshapes portfolio' },
    { source: 'c4', target: 'c3', lane: 'complexity', kind: 'feedback', semantic: 'validation revises framing' },
    { source: 'c5', target: 'c4', lane: 'complexity', kind: 'feedback', semantic: 'delivery reveals design gaps' },
    { source: 'c4', target: 'c2', lane: 'complexity', kind: 'feedback', semantic: 'option evidence alters commitment' },
    { source: 'c6', target: 'c1', lane: 'complexity', kind: 'learning', semantic: 'market evidence updates sensing' },
    { source: 'c6', target: 'c2', lane: 'complexity', kind: 'learning', semantic: 'outcomes reshape investments' },
    { source: 'c6', target: 'c3', lane: 'complexity', kind: 'learning', semantic: 'launch signals reframe discovery' },
    { source: 'c6', target: 'c4', lane: 'complexity', kind: 'learning', semantic: 'outcomes redirect solution experiments' }
  ];

  var COMPLEXITY_LINK_NARRATIVES = {
    'c1>c2:primary': {
      process: 'Signals from sensing feed portfolio choices before delivery commitments are locked.',
      assumptions: 'Assumes intake quality is good enough to rank uncertain opportunities without forcing premature certainty.',
      learning: 'Early signal quality influences where later learning effort is invested.'
    },
    'c2>c3:primary': {
      process: 'Portfolio priorities shape what discovery work starts first and what is deferred.',
      assumptions: 'Assumes teams can hold options open while still narrowing scope for focused discovery.',
      learning: 'Portfolio priorities are expected to evolve when discovery evidence updates option value.'
    },
    'c3>c4:primary': {
      process: 'Discovery outputs move into solution exploration and validation cycles.',
      assumptions: 'Assumes framing is explicit enough to guide experiments without pretending uncertainty is gone.',
      learning: 'What is learned in framing directs which experiments run next.'
    },
    'c4>c5:primary': {
      process: 'Validated options move into incremental delivery planning and execution.',
      assumptions: 'Assumes validation thresholds are credible and tied to outcomes, not just activity completion.',
      learning: 'Delivery scope is expected to reflect evidence from exploration, not only initial intent.'
    },
    'c5>c6:primary': {
      process: 'Delivery increments reach launch and measurement.',
      assumptions: 'Assumes release slices are small enough to attribute outcomes and observe meaningful effects.',
      learning: 'Launch outcomes create the evidence base for system-level adaptation.'
    },
    'c3>c2:feedback': {
      process: 'Discovery sends evidence back to portfolio for re-prioritization.',
      assumptions: 'Assumes decision rights allow portfolio decisions to change when better evidence appears.',
      learning: 'Discovery findings can redirect investment before major build commitments are made.'
    },
    'c4>c3:feedback': {
      process: 'Validation findings loop back to refine discovery framing.',
      assumptions: 'Assumes teams can revise problem framing without excessive coordination friction.',
      learning: 'Experiment results are used to sharpen hypotheses and reduce avoidable waste.'
    },
    'c5>c4:feedback': {
      process: 'Delivery realities return to exploration for design and option adjustments.',
      assumptions: 'Assumes implementation constraints are treated as learning signals, not late-stage exceptions.',
      learning: 'Build feedback informs the next cycle of solution exploration.'
    },
    'c4>c2:feedback': {
      process: 'Option evidence can trigger portfolio-level commitment changes.',
      assumptions: 'Assumes leadership tolerates changing commitments when uncertainty resolves in new directions.',
      learning: 'Strong evidence can move investment posture, not just local feature choices.'
    },
    'c6>c1:learning': {
      process: 'Post-launch signals feed the next sensing cycle.',
      assumptions: 'Assumes post-launch evidence is captured and used to reshape upstream opportunity sensing.',
      learning: 'Market outcomes become inputs for the next round of opportunity discovery.'
    },
    'c6>c2:learning': {
      process: 'Measured outcomes flow back into portfolio balancing.',
      assumptions: 'Assumes portfolio governance can update priorities based on real outcomes rather than sunk plans.',
      learning: 'Outcome signals adjust where effort is amplified, paused, or retired.'
    },
    'c6>c3:learning': {
      process: 'Launch evidence loops into new discovery framing.',
      assumptions: 'Assumes teams revisit earlier framing with fresh evidence instead of defending prior narratives.',
      learning: 'Real-world performance reframes hypotheses for the next discovery cycle.'
    },
    'c6>c4:learning': {
      process: 'Launch evidence can send teams directly back into solution exploration and validation.',
      assumptions: 'Assumes measured outcomes are strong enough to reopen solution options, not only reporting dashboards.',
      learning: 'Market response redirects which solution experiments should run next.'
    }
  };

  var COMPARISON_ROWS = [
    {
      anchorId: 'c1',
      text: 'Opportunity sensing vs. submitted request',
      yOffset: -10,
      fontScale: 0.86
    },
    {
      anchorId: 'c3',
      text: 'Assumptions tested vs. requirements stabilized'
    },
    {
      anchorId: 'c6',
      text: 'Upstream learning vs. project closure'
    }
  ];

  return {
    BASE_NODES: BASE_NODES,
    LINKS: LINKS,
    COMPLEXITY_LINK_NARRATIVES: COMPLEXITY_LINK_NARRATIVES,
    COMPARISON_ROWS: COMPARISON_ROWS
  };
}));
