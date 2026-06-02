// Animates why a local prewritten answer card can satisfy only three of four Bell-game cases.
'use strict';

(function initClassicalExpectation(root) {
  var CARDS = [
    { aliceRed: 'Yes', aliceBlue: 'Yes', bobRed: 'Yes', bobBlue: 'Yes' },
    { aliceRed: 'Yes', aliceBlue: 'No', bobRed: 'Yes', bobBlue: 'Yes' },
    { aliceRed: 'No', aliceBlue: 'No', bobRed: 'No', bobBlue: 'Yes' },
    { aliceRed: 'No', aliceBlue: 'Yes', bobRed: 'No', bobBlue: 'No' },
  ];
  var CASES = [
    { key: 'rr', label: 'Alice red / Bob red', alice: 'aliceRed', bob: 'bobRed', want: 'same' },
    { key: 'rb', label: 'Alice red / Bob blue', alice: 'aliceRed', bob: 'bobBlue', want: 'same' },
    { key: 'br', label: 'Alice blue / Bob red', alice: 'aliceBlue', bob: 'bobRed', want: 'same' },
    { key: 'bb', label: 'Alice blue / Bob blue', alice: 'aliceBlue', bob: 'bobBlue', want: 'different' },
  ];

  function init() {
    var stage = document.querySelector('[data-bell-classical-stage]');
    if (!stage) return;

    var hasD3 = typeof root.d3 !== 'undefined';
    var fallback = document.querySelector('[data-bell-classical-fallback]');
    if (fallback) fallback.hidden = hasD3;
    if (!hasD3) return;

    var state = { cardIndex: 0, caseIndex: 0 };
    var status = document.querySelector('[data-bell-classical-status]');

    function render() {
      renderClassicalStage(stage, CARDS[state.cardIndex], state.caseIndex);
      var activeCase = CASES[state.caseIndex];
      status.textContent = activeCase.label + ': this card ' + (caseWins(CARDS[state.cardIndex], activeCase) ? 'passes' : 'fails') + '.';
    }

    document.querySelector('[data-bell-classical-step]').addEventListener('click', function onStep() {
      state.caseIndex = (state.caseIndex + 1) % CASES.length;
      render();
    });

    document.querySelector('[data-bell-classical-deal]').addEventListener('click', function onDeal() {
      state.cardIndex = (state.cardIndex + 1) % CARDS.length;
      state.caseIndex = 0;
      render();
    });

    render();
  }

  function caseWins(card, testCase) {
    var same = card[testCase.alice] === card[testCase.bob];
    return testCase.want === 'same' ? same : !same;
  }

  function renderClassicalStage(stageNode, card, activeIndex) {
    var svg = root.d3.select(stageNode);
    svg.selectAll('*').remove();
    svg.attr('viewBox', '0 0 900 360').attr('preserveAspectRatio', 'xMidYMid meet');

    var ink = cssValue('--ink') || '#1f1b18';
    var faint = cssValue('--ink-faint') || '#756f68';
    var ghost = cssValue('--ink-ghost') || '#b8b0a8';
    var rust = cssValue('--rust') || '#9b4a35';
    var sage = cssValue('--sage') || '#6f8f72';
    var gold = cssValue('--gold') || '#c4a343';
    var active = CASES[activeIndex];

    drawCard(svg, card, 90, 76, rust, sage);
    drawCaseRows(svg, card, activeIndex, 420, 58, ink, faint, ghost, rust, sage, gold);

    svg.append('text')
      .attr('x', 90)
      .attr('y', 312)
      .attr('text-anchor', 'start')
      .style('font-family', 'var(--mono)')
      .style('font-size', '12px')
      .style('letter-spacing', '0.06em')
      .style('text-transform', 'uppercase')
      .style('fill', caseWins(card, active) ? sage : rust)
      .text(caseWins(card, active) ? 'this case passes' : 'this is the unavoidable failed case');
  }

  function drawCard(svg, card, x, y, rust, sage) {
    svg.append('text')
      .attr('x', x)
      .attr('y', y - 28)
      .style('font-family', 'var(--mono)')
      .style('font-size', '12px')
      .style('letter-spacing', '0.08em')
      .style('text-transform', 'uppercase')
      .style('fill', 'var(--ink)')
      .text('prewritten answer card');

    [
      ['Alice red', card.aliceRed, rust],
      ['Alice blue', card.aliceBlue, rust],
      ['Bob red', card.bobRed, sage],
      ['Bob blue', card.bobBlue, sage],
    ].forEach(function drawEntry(entry, index) {
      var rowY = y + index * 48;
      svg.append('rect')
        .attr('x', x)
        .attr('y', rowY)
        .attr('width', 250)
        .attr('height', 38)
        .style('fill', 'transparent')
        .style('stroke', entry[2])
        .style('stroke-width', 1);
      svg.append('text')
        .attr('x', x + 14)
        .attr('y', rowY + 24)
        .style('font-family', 'var(--mono)')
        .style('font-size', '12px')
        .style('letter-spacing', '0.06em')
        .style('text-transform', 'uppercase')
        .style('fill', entry[2])
        .text(entry[0]);
      svg.append('text')
        .attr('x', x + 230)
        .attr('y', rowY + 24)
        .attr('text-anchor', 'end')
        .style('font-family', 'var(--mono)')
        .style('font-size', '13px')
        .style('fill', entry[2])
        .text(entry[1]);
    });
  }

  function drawCaseRows(svg, card, activeIndex, x, y, ink, faint, ghost, rust, sage, gold) {
    svg.append('text')
      .attr('x', x)
      .attr('y', y - 10)
      .style('font-family', 'var(--mono)')
      .style('font-size', '12px')
      .style('letter-spacing', '0.08em')
      .style('text-transform', 'uppercase')
      .style('fill', ink)
      .text('four possible question pairs');

    CASES.forEach(function drawCase(testCase, index) {
      var rowY = y + index * 58;
      var win = caseWins(card, testCase);
      var active = index === activeIndex;
      svg.append('rect')
        .attr('x', x)
        .attr('y', rowY)
        .attr('width', 380)
        .attr('height', 44)
        .style('fill', active ? 'var(--paper-dark)' : 'transparent')
        .style('stroke', active ? (win ? sage : rust) : ghost)
        .style('stroke-width', active ? 1.5 : 1);
      svg.append('text')
        .attr('x', x + 14)
        .attr('y', rowY + 17)
        .style('font-family', 'var(--mono)')
        .style('font-size', '11px')
        .style('letter-spacing', '0.06em')
        .style('text-transform', 'uppercase')
        .style('fill', active ? ink : faint)
        .text(testCase.label);
      svg.append('text')
        .attr('x', x + 14)
        .attr('y', rowY + 34)
        .style('font-family', 'var(--mono)')
        .style('font-size', '10px')
        .style('letter-spacing', '0.04em')
        .style('text-transform', 'uppercase')
        .style('fill', active ? ink : faint)
        .text('needs ' + testCase.want + ' answers');
      svg.append('text')
        .attr('x', x + 360)
        .attr('y', rowY + 27)
        .attr('text-anchor', 'end')
        .style('font-family', 'var(--mono)')
        .style('font-size', '12px')
        .style('letter-spacing', '0.08em')
        .style('text-transform', 'uppercase')
        .style('fill', win ? sage : (active ? rust : gold))
        .text(win ? 'pass' : 'fail');
    });
  }

  function cssValue(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}(typeof globalThis !== 'undefined' ? globalThis : this));
