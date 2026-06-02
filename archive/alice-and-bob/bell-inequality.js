// Runs the Bell Lab CHSH animation and exposes testable round/statistics helpers.
'use strict';

(function initBellInequality(root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory(root);
    return;
  }
  root.PlatoscaveBellInequality = factory(root);
}(typeof globalThis !== 'undefined' ? globalThis : this, function buildBellInequalityModule(root) {
  var QUANTUM_WIN_PROBABILITY = (2 + Math.SQRT2) / 4;
  var CLASSICAL_CEILING = 0.75;
  var SETTING_PAIRS = [
    { key: '00', alice: 0, bob: 0, label: 'A0 / B0' },
    { key: '01', alice: 0, bob: 1, label: 'A0 / B1' },
    { key: '10', alice: 1, bob: 0, label: 'A1 / B0' },
    { key: '11', alice: 1, bob: 1, label: 'A1 / B1' },
  ];
  var BEST_CLASSICAL_CARDS = buildBestClassicalCards();

  function mulberry32(seed) {
    var value = seed >>> 0;
    return function nextRandom() {
      value += 0x6D2B79F5;
      var t = value;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function signFromBit(bit) {
    return bit === 0 ? 1 : -1;
  }

  function symbolFromBit(bit) {
    return bit === 0 ? '+' : '-';
  }

  function winCondition(aliceSetting, bobSetting) {
    return aliceSetting === 1 && bobSetting === 1 ? 1 : 0;
  }

  function roundWins(round) {
    return (round.aliceBit ^ round.bobBit) === winCondition(round.aliceSetting, round.bobSetting);
  }

  function evaluateInstructionCard(card) {
    return SETTING_PAIRS.map(function evaluatePair(pair) {
      var aliceBit = pair.alice === 0 ? card.a0 : card.a1;
      var bobBit = pair.bob === 0 ? card.b0 : card.b1;
      var win = (aliceBit ^ bobBit) === winCondition(pair.alice, pair.bob);
      return {
        key: pair.key,
        label: pair.label,
        aliceSetting: pair.alice,
        bobSetting: pair.bob,
        aliceBit: aliceBit,
        bobBit: bobBit,
        win: win,
      };
    });
  }

  function buildBestClassicalCards() {
    var cards = [];
    for (var a0 = 0; a0 <= 1; a0 += 1) {
      for (var a1 = 0; a1 <= 1; a1 += 1) {
        for (var b0 = 0; b0 <= 1; b0 += 1) {
          for (var b1 = 0; b1 <= 1; b1 += 1) {
            var card = { a0: a0, a1: a1, b0: b0, b1: b1 };
            var wins = evaluateInstructionCard(card).filter(function onlyWins(test) {
              return test.win;
            }).length;
            if (wins === 3) cards.push(card);
          }
        }
      }
    }
    return cards;
  }

  function pickSetting(random) {
    return random() < 0.5 ? 0 : 1;
  }

  function sampleQuantumRound(random, id) {
    var aliceSetting = pickSetting(random);
    var bobSetting = pickSetting(random);
    var aliceBit = pickSetting(random);
    var desiredParity = winCondition(aliceSetting, bobSetting);
    var quantumWin = random() < QUANTUM_WIN_PROBABILITY;
    var bobBit = aliceBit ^ desiredParity ^ (quantumWin ? 0 : 1);
    return buildRound(id, 'quantum', aliceSetting, bobSetting, aliceBit, bobBit);
  }

  function sampleClassicalRound(random, id, card) {
    var instructionCard = card || BEST_CLASSICAL_CARDS[Math.floor(random() * BEST_CLASSICAL_CARDS.length)];
    var aliceSetting = pickSetting(random);
    var bobSetting = pickSetting(random);
    var aliceBit = aliceSetting === 0 ? instructionCard.a0 : instructionCard.a1;
    var bobBit = bobSetting === 0 ? instructionCard.b0 : instructionCard.b1;
    return buildRound(id, 'classical', aliceSetting, bobSetting, aliceBit, bobBit, instructionCard);
  }

  function buildRound(id, mode, aliceSetting, bobSetting, aliceBit, bobBit, card) {
    var aliceSign = signFromBit(aliceBit);
    var bobSign = signFromBit(bobBit);
    var win = (aliceBit ^ bobBit) === winCondition(aliceSetting, bobSetting);
    return {
      id: id,
      mode: mode,
      aliceSetting: aliceSetting,
      bobSetting: bobSetting,
      aliceBit: aliceBit,
      bobBit: bobBit,
      aliceSymbol: symbolFromBit(aliceBit),
      bobSymbol: symbolFromBit(bobBit),
      aliceSign: aliceSign,
      bobSign: bobSign,
      product: aliceSign * bobSign,
      win: win,
      card: card || null,
      settingKey: String(aliceSetting) + String(bobSetting),
    };
  }

  function createStats() {
    var bySetting = {};
    SETTING_PAIRS.forEach(function addSetting(pair) {
      bySetting[pair.key] = {
        key: pair.key,
        label: pair.label,
        count: 0,
        productSum: 0,
        wins: 0,
      };
    });
    return {
      rounds: 0,
      wins: 0,
      alicePlus: 0,
      bobPlus: 0,
      bySetting: bySetting,
      ledger: [],
    };
  }

  function applyRound(stats, round) {
    var bucket = stats.bySetting[round.settingKey];
    stats.rounds += 1;
    stats.wins += round.win ? 1 : 0;
    stats.alicePlus += round.aliceBit === 0 ? 1 : 0;
    stats.bobPlus += round.bobBit === 0 ? 1 : 0;
    bucket.count += 1;
    bucket.productSum += round.product;
    bucket.wins += round.win ? 1 : 0;
    stats.ledger.push(round);
    if (stats.ledger.length > 12) stats.ledger.shift();
    return stats;
  }

  function settingCorrelation(bucket) {
    return bucket.count > 0 ? bucket.productSum / bucket.count : null;
  }

  function calculateChsh(stats) {
    var e00 = settingCorrelation(stats.bySetting['00']);
    var e01 = settingCorrelation(stats.bySetting['01']);
    var e10 = settingCorrelation(stats.bySetting['10']);
    var e11 = settingCorrelation(stats.bySetting['11']);
    if (e00 === null || e01 === null || e10 === null || e11 === null) return null;
    return e00 + e01 + e10 - e11;
  }

  function summarizeStats(stats) {
    return {
      rounds: stats.rounds,
      wins: stats.wins,
      winRate: stats.rounds > 0 ? stats.wins / stats.rounds : null,
      alicePlusRate: stats.rounds > 0 ? stats.alicePlus / stats.rounds : null,
      bobPlusRate: stats.rounds > 0 ? stats.bobPlus / stats.rounds : null,
      chsh: calculateChsh(stats),
      bySetting: SETTING_PAIRS.map(function summarizePair(pair) {
        var bucket = stats.bySetting[pair.key];
        return {
          key: pair.key,
          label: pair.label,
          count: bucket.count,
          correlation: settingCorrelation(bucket),
          winRate: bucket.count > 0 ? bucket.wins / bucket.count : null,
        };
      }),
    };
  }

  function simulateRounds(options) {
    var opts = options || {};
    var mode = opts.mode === 'classical' ? 'classical' : 'quantum';
    var count = Math.max(0, Math.floor(opts.count || 0));
    var random = typeof opts.random === 'function' ? opts.random : mulberry32(opts.seed || 1);
    var stats = createStats();
    var card = opts.card || BEST_CLASSICAL_CARDS[0];
    for (var i = 0; i < count; i += 1) {
      var round = mode === 'classical'
        ? sampleClassicalRound(random, i + 1, card)
        : sampleQuantumRound(random, i + 1);
      applyRound(stats, round);
    }
    return summarizeStats(stats);
  }

  function formatPercent(value) {
    return value === null || Number.isNaN(value) ? '--' : (value * 100).toFixed(1) + '%';
  }

  function formatSigned(value) {
    if (value === null || Number.isNaN(value)) return '--';
    return (value >= 0 ? '+' : '') + value.toFixed(2);
  }

  function setText(node, value) {
    if (node) node.textContent = value;
  }

  function clearNode(node) {
    if (!node) return;
    while (node.firstChild) node.removeChild(node.firstChild);
  }

  function appendTextNode(parent, tag, className, text) {
    var el = document.createElement(tag);
    if (className) el.className = className;
    el.textContent = text;
    parent.appendChild(el);
    return el;
  }

  function initBrowser() {
    var stage = document.querySelector('[data-bell-stage]');
    if (!stage) return;
    document.documentElement.classList.add('bell-js-ready');

    var hasD3 = typeof root.d3 !== 'undefined';
    var fallback = document.querySelector('[data-bell-fallback]');
    if (fallback) fallback.hidden = hasD3;

    var state = {
      mode: 'quantum',
      stats: createStats(),
      random: Math.random,
      autoTimer: null,
      lastRound: null,
      card: BEST_CLASSICAL_CARDS[0],
    };

    var els = {
      stage: stage,
      status: document.querySelector('[data-bell-status]'),
      rounds: document.querySelector('[data-bell-rounds]'),
      winRate: document.querySelector('[data-bell-win-rate]'),
      liveRate: document.querySelector('[data-bell-live-rate]'),
      liveBar: document.querySelector('[data-bell-live-bar]'),
      chsh: document.querySelector('[data-bell-s]'),
      correlations: document.querySelector('[data-bell-correlations]'),
      ledger: document.querySelector('[data-bell-ledger]'),
      localBars: {
        alice: document.querySelector('[data-bell-local-bar="alice-plus"]'),
        bob: document.querySelector('[data-bell-local-bar="bob-plus"]'),
      },
      localText: {
        alice: document.querySelector('[data-bell-local-text="alice-plus"]'),
        bob: document.querySelector('[data-bell-local-text="bob-plus"]'),
      },
      auto: document.querySelector('[data-bell-auto]'),
      card: document.querySelector('[data-bell-card]'),
      cardTests: document.querySelector('[data-bell-card-tests]'),
    };

    function sampleNextRound() {
      var id = state.stats.rounds + 1;
      return state.mode === 'classical'
        ? sampleClassicalRound(state.random, id, state.card)
        : sampleQuantumRound(state.random, id);
    }

    function runRounds(count) {
      var last = null;
      for (var i = 0; i < count; i += 1) {
        last = sampleNextRound();
        applyRound(state.stats, last);
      }
      state.lastRound = last;
      renderAll();
    }

    function resetStats() {
      state.stats = createStats();
      state.lastRound = null;
      renderAll();
    }

    function setMode(nextMode) {
      state.mode = nextMode === 'classical' ? 'classical' : 'quantum';
      document.querySelectorAll('[data-bell-mode]').forEach(function updateButton(button) {
        button.setAttribute('aria-pressed', button.getAttribute('data-bell-mode') === state.mode ? 'true' : 'false');
      });
      resetStats();
    }

    function toggleAuto() {
      if (state.autoTimer) {
        clearInterval(state.autoTimer);
        state.autoTimer = null;
        if (els.auto) els.auto.setAttribute('aria-pressed', 'false');
        setText(els.status, 'Paused.');
        return;
      }
      state.autoTimer = setInterval(function autoRun() {
        runRounds(1);
      }, 2200);
      if (els.auto) els.auto.setAttribute('aria-pressed', 'true');
      setText(els.status, 'Auto-running trials.');
    }

    function dealCard() {
      var index = Math.floor(state.random() * BEST_CLASSICAL_CARDS.length);
      state.card = BEST_CLASSICAL_CARDS[index];
      if (state.mode === 'classical') resetStats();
      renderInstructionCard();
    }

    function renderAll() {
      if (hasD3) {
        renderStage(els.stage, state.lastRound, state.mode, state.stats);
      } else {
        renderUnavailableStage(els.stage);
      }
      renderStats();
      renderCorrelations();
      renderLedger();
      renderInstructionCard();
    }

    function renderStats() {
      var summary = summarizeStats(state.stats);
      setText(els.rounds, String(summary.rounds));
      setText(els.winRate, formatPercent(summary.winRate));
      setText(els.liveRate, formatPercent(summary.winRate));
      setText(els.chsh, formatSigned(summary.chsh));
      if (els.liveBar) els.liveBar.style.setProperty('--bell-limit', summary.winRate === null ? '0%' : Math.max(0, Math.min(100, summary.winRate * 100)) + '%');
      if (els.localBars.alice) els.localBars.alice.style.setProperty('--bell-local', summary.alicePlusRate === null ? '50%' : (summary.alicePlusRate * 100) + '%');
      if (els.localBars.bob) els.localBars.bob.style.setProperty('--bell-local', summary.bobPlusRate === null ? '50%' : (summary.bobPlusRate * 100) + '%');
      setText(els.localText.alice, formatPercent(summary.alicePlusRate));
      setText(els.localText.bob, formatPercent(summary.bobPlusRate));
      var target = state.mode === 'classical' ? CLASSICAL_CEILING : QUANTUM_WIN_PROBABILITY;
      var label = state.mode === 'classical' ? 'classical instruction-card' : 'quantum';
      var baseStatus = hasD3 ? 'Ready: JS active.' : 'JS active; D3 drawing layer unavailable, counters still work.';
      setText(els.status, summary.rounds === 0 ? baseStatus : summary.rounds + ' ' + label + ' trials. Target: ' + formatPercent(target) + '.');
    }

    function renderCorrelations() {
      clearNode(els.correlations);
      var summary = summarizeStats(state.stats);
      summary.bySetting.forEach(function addRow(pair) {
        var row = document.createElement('div');
        row.className = 'bell-correlation-row';
        appendTextNode(row, 'span', '', pair.label);
        var bar = document.createElement('i');
        var value = pair.correlation === null ? 0 : pair.correlation;
        var position = (value + 1) / 2;
        var left = Math.min(position, 0.5);
        var width = Math.abs(position - 0.5);
        bar.style.setProperty('--bell-correlation-left', String(left * 100) + '%');
        bar.style.setProperty('--bell-correlation-width', String(width * 100) + '%');
        row.appendChild(bar);
        appendTextNode(row, 'strong', '', pair.correlation === null ? '--' : formatSigned(pair.correlation));
        appendTextNode(row, 'em', '', pair.count + ' trials');
        els.correlations.appendChild(row);
      });
    }

    function renderLedger() {
      clearNode(els.ledger);
      state.stats.ledger.slice().reverse().forEach(function addLedgerRow(round) {
        var tr = document.createElement('tr');
        [
          String(round.id),
          'A' + round.aliceSetting,
          'B' + round.bobSetting,
          round.aliceSymbol,
          round.bobSymbol,
          round.win ? 'win' : 'loss',
        ].forEach(function addCell(text, index) {
          var cell = document.createElement(index === 0 ? 'th' : 'td');
          if (index === 0) cell.setAttribute('scope', 'row');
          cell.textContent = text;
          tr.appendChild(cell);
        });
        tr.className = round.win ? 'is-win' : 'is-loss';
        els.ledger.appendChild(tr);
      });
    }

    function renderInstructionCard() {
      clearNode(els.card);
      clearNode(els.cardTests);
      [
        ['A0', state.card.a0],
        ['A1', state.card.a1],
        ['B0', state.card.b0],
        ['B1', state.card.b1],
      ].forEach(function addCardCell(entry) {
        var cell = document.createElement('div');
        appendTextNode(cell, 'span', '', entry[0]);
        appendTextNode(cell, 'strong', '', symbolFromBit(entry[1]));
        els.card.appendChild(cell);
      });
      evaluateInstructionCard(state.card).forEach(function addTest(test) {
        var row = document.createElement('div');
        row.className = test.win ? 'is-win' : 'is-loss';
        appendTextNode(row, 'span', '', test.label);
        appendTextNode(row, 'strong', '', symbolFromBit(test.aliceBit) + ' / ' + symbolFromBit(test.bobBit));
        appendTextNode(row, 'em', '', test.win ? 'satisfies' : 'fails');
        els.cardTests.appendChild(row);
      });
    }

    bindClick('[data-bell-run-one]', function onRunOne() {
      runRounds(1);
    });
    bindClick('[data-bell-burst]', function onBurst() {
      runRounds(32);
    });
    bindClick('[data-bell-reset]', resetStats);
    bindClick('[data-bell-auto]', toggleAuto);
    bindClick('[data-bell-deal-card]', dealCard);
    document.querySelectorAll('[data-bell-mode]').forEach(function bindMode(button) {
      button.addEventListener('click', function onModeClick() {
        setMode(button.getAttribute('data-bell-mode'));
      });
    });
    window.addEventListener('resize', function onResize() {
      if (hasD3) renderStage(els.stage, state.lastRound, state.mode, state.stats);
    });

    renderAll();
  }

  function bindClick(selector, handler) {
    var node = document.querySelector(selector);
    if (node) node.addEventListener('click', handler);
  }

  function renderUnavailableStage(stageNode) {
    stageNode.setAttribute('viewBox', '0 0 900 180');
    clearNode(stageNode);
    var text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', '450');
    text.setAttribute('y', '90');
    text.setAttribute('text-anchor', 'middle');
    text.textContent = 'D3 drawing layer unavailable';
    text.style.fontFamily = 'var(--mono)';
    text.style.fontSize = '14px';
    text.style.fill = cssValue('--ink-faint') || '#756f68';
    stageNode.appendChild(text);
  }

  function renderStage(stageNode, round, mode, stats) {
    var d3 = root.d3;
    var svg = d3.select(stageNode);
    svg.selectAll('*').remove();
    svg.attr('viewBox', '0 0 900 410').attr('preserveAspectRatio', 'xMidYMid meet');

    var source = { x: 450, y: 62 };
    var alice = { x: 165, y: 166 };
    var bob = { x: 735, y: 166 };
    var ink = cssValue('--ink') || '#1f1b18';
    var faint = cssValue('--ink-faint') || '#756f68';
    var ghost = cssValue('--ink-ghost') || '#b8b0a8';
    var rust = cssValue('--rust') || '#9b4a35';
    var sage = cssValue('--sage') || '#6f8f72';
    var gold = cssValue('--gold') || '#c4a343';

    drawNoMessageGap(svg, ink, faint, ghost);
    drawSource(svg, source, ink, faint, mode);
    drawLab(svg, alice, 'Alice', round ? 'A' + round.aliceSetting : 'A?', rust, stats ? stats.ledger : []);
    drawLab(svg, bob, 'Bob', round ? 'B' + round.bobSetting : 'B?', sage, stats ? stats.ledger : []);
    drawAnalyzerDial(svg, alice, round ? round.aliceSetting : 0, rust, false);
    drawAnalyzerDial(svg, bob, round ? round.bobSetting : 0, sage, true);
    drawCompareLane(svg, round, ink, faint, ghost, rust, sage, gold);

    if (round) {
      drawParticleTrack(svg, source, { x: alice.x, y: alice.y - 28 }, rust);
      drawParticleTrack(svg, source, { x: bob.x, y: bob.y - 28 }, sage);
      animateEnvelope(svg, source, { x: alice.x, y: alice.y - 28 }, rust);
      animateEnvelope(svg, source, { x: bob.x, y: bob.y - 28 }, sage);
      drawResultCard(svg, bob.x, bob.y + 18, 'Bob', round.bobSymbol, sage, 650);
      drawResultCard(svg, alice.x, alice.y + 18, 'Alice', round.aliceSymbol, rust, 1500);
    }
  }

  function drawNoMessageGap(svg, ink, faint, ghost) {
    svg.append('line')
      .attr('x1', 300)
      .attr('y1', 166)
      .attr('x2', 600)
      .attr('y2', 166)
      .style('stroke', ghost)
      .style('stroke-dasharray', '2 10')
      .style('stroke-linecap', 'round')
      .style('stroke-width', 2);
    svg.append('text')
      .attr('x', 450)
      .attr('y', 154)
      .attr('text-anchor', 'middle')
      .style('font-family', 'var(--mono)')
      .style('font-size', '11px')
      .style('letter-spacing', '0.08em')
      .style('text-transform', 'uppercase')
      .style('fill', faint)
      .text('no message crosses this gap');
    svg.append('text')
      .attr('x', 450)
      .attr('y', 185)
      .attr('text-anchor', 'middle')
      .style('font-family', 'var(--mono)')
      .style('font-size', '10px')
      .style('letter-spacing', '0.06em')
      .style('text-transform', 'uppercase')
      .style('fill', ink)
      .text('compare logs later');
  }

  function drawSource(svg, source, ink, faint, mode) {
    svg.append('circle')
      .attr('cx', source.x)
      .attr('cy', source.y)
      .attr('r', 32)
      .style('fill', 'transparent')
      .style('stroke', ink)
      .style('stroke-width', 1.5);
    svg.append('text')
      .attr('x', source.x)
      .attr('y', source.y - 3)
      .attr('text-anchor', 'middle')
      .style('font-family', 'var(--mono)')
      .style('font-size', '11px')
      .style('letter-spacing', '0.08em')
      .style('text-transform', 'uppercase')
      .style('fill', ink)
      .text('Source');
    svg.append('text')
      .attr('x', source.x)
      .attr('y', source.y + 15)
      .attr('text-anchor', 'middle')
      .style('font-family', 'var(--mono)')
      .style('font-size', '10px')
      .style('fill', faint)
      .text(mode === 'classical' ? 'answer card pair' : 'entangled pair');
  }

  function drawParticleTrack(svg, source, target, color) {
    svg.append('line')
      .attr('x1', source.x)
      .attr('y1', source.y)
      .attr('x2', target.x)
      .attr('y2', target.y)
      .style('stroke', color)
      .style('stroke-width', 1.5)
      .style('stroke-opacity', 0.18);
  }

  function drawLab(svg, point, name, setting, color, ledger) {
    svg.append('rect')
      .attr('x', point.x - 110)
      .attr('y', point.y - 86)
      .attr('width', 220)
      .attr('height', 178)
      .style('fill', 'transparent')
      .style('stroke', color)
      .style('stroke-width', 1.25);
    svg.append('text')
      .attr('x', point.x - 96)
      .attr('y', point.y - 64)
      .attr('text-anchor', 'start')
      .style('font-family', 'var(--mono)')
      .style('font-size', '13px')
      .style('letter-spacing', '0.1em')
      .style('text-transform', 'uppercase')
      .style('fill', color)
      .text(name + ' lab');
    svg.append('text')
      .attr('x', point.x + 96)
      .attr('y', point.y - 64)
      .attr('text-anchor', 'end')
      .style('font-family', 'var(--mono)')
      .style('font-size', '11px')
      .style('letter-spacing', '0.08em')
      .style('text-transform', 'uppercase')
      .style('fill', color)
      .text(setting);
    drawLocalTape(svg, point, name, color, ledger);
  }

  function drawLocalTape(svg, point, name, color, ledger) {
    var isAlice = name === 'Alice';
    var recent = ledger.slice(-9);
    var startX = point.x - 86;
    var y = point.y + 62;
    svg.append('text')
      .attr('x', startX)
      .attr('y', y - 17)
      .attr('text-anchor', 'start')
      .style('font-family', 'var(--mono)')
      .style('font-size', '10px')
      .style('letter-spacing', '0.06em')
      .style('text-transform', 'uppercase')
      .style('fill', color)
      .text('local tape: random here');
    for (var i = 0; i < 9; i += 1) {
      var round = recent[i];
      var symbol = round ? (isAlice ? round.aliceSymbol : round.bobSymbol) : '';
      svg.append('rect')
        .attr('x', startX + i * 19)
        .attr('y', y - 7)
        .attr('width', 15)
        .attr('height', 18)
        .style('fill', round ? color : 'transparent')
        .style('fill-opacity', round ? 0.12 : 1)
        .style('stroke', color)
        .style('stroke-opacity', round ? 0.75 : 0.22)
        .style('stroke-width', 1);
      svg.append('text')
        .attr('x', startX + i * 19 + 7.5)
        .attr('y', y + 6)
        .attr('text-anchor', 'middle')
        .style('font-family', 'var(--mono)')
        .style('font-size', '11px')
        .style('fill', color)
        .text(symbol);
    }
  }

  function drawAnalyzerDial(svg, point, setting, color, mirror) {
    var dial = svg.append('g')
      .attr('transform', 'translate(' + point.x + ',' + (point.y - 16) + ')');
    var angle = setting === 0 ? -28 : 28;
    if (mirror) angle *= -1;
    dial.append('circle')
      .attr('r', 38)
      .style('fill', 'transparent')
      .style('stroke', color)
      .style('stroke-opacity', 0.72)
      .style('stroke-width', 1.25);
    dial.append('line')
      .attr('x1', 0)
      .attr('y1', 0)
      .attr('x2', 0)
      .attr('y2', -32)
      .attr('transform', 'rotate(' + angle + ')')
      .style('stroke', color)
      .style('stroke-width', 4)
      .style('stroke-linecap', 'round');
    dial.append('circle')
      .attr('r', 4)
      .style('fill', color);
    dial.append('text')
      .attr('x', 0)
      .attr('y', 56)
      .attr('text-anchor', 'middle')
      .style('font-family', 'var(--mono)')
      .style('font-size', '10px')
      .style('letter-spacing', '0.08em')
      .style('text-transform', 'uppercase')
      .style('fill', color)
      .text('analyzer setting ' + setting);
  }

  function drawCompareLane(svg, round, ink, faint, ghost, rust, sage, gold) {
    svg.append('rect')
      .attr('x', 72)
      .attr('y', 305)
      .attr('width', 756)
      .attr('height', 72)
      .style('fill', 'transparent')
      .style('stroke', ghost)
      .style('stroke-width', 1);
    svg.append('text')
      .attr('x', 92)
      .attr('y', 329)
      .attr('text-anchor', 'start')
      .style('font-family', 'var(--mono)')
      .style('font-size', '11px')
      .style('letter-spacing', '0.08em')
      .style('text-transform', 'uppercase')
      .style('fill', faint)
      .text('afterward: compare the two logs');
    if (!round) {
      svg.append('text')
        .attr('x', 92)
        .attr('y', 356)
        .attr('text-anchor', 'start')
        .style('font-family', 'var(--mono)')
        .style('font-size', '12px')
        .style('letter-spacing', '0.06em')
        .style('text-transform', 'uppercase')
        .style('fill', ink)
        .text('run a trial to reveal one paired receipt');
      return;
    }
    var relation = round.aliceSymbol === round.bobSymbol ? 'same' : 'opposite';
    var sameAxis = round.aliceSetting === round.bobSetting;
    var message = sameAxis
      ? 'same setting: Bob sees ' + round.bobSymbol + ', Alice is ' + relation
      : 'different settings: relation enters the CHSH ledger';
    svg.append('text')
      .attr('x', 92)
      .attr('y', 356)
      .attr('text-anchor', 'start')
      .style('font-family', 'var(--mono)')
      .style('font-size', '13px')
      .style('letter-spacing', '0.06em')
      .style('text-transform', 'uppercase')
      .style('fill', sameAxis ? rust : ink)
      .text(message);
    svg.append('text')
      .attr('x', 808)
      .attr('y', 356)
      .attr('text-anchor', 'end')
      .style('font-family', 'var(--mono)')
      .style('font-size', '12px')
      .style('letter-spacing', '0.08em')
      .style('text-transform', 'uppercase')
      .style('fill', round.win ? sage : gold)
      .text(round.win ? 'CHSH win' : 'CHSH loss');
  }

  function drawResultCard(svg, x, y, owner, symbol, color, delay) {
    var card = svg.append('g').attr('transform', 'translate(' + x + ',' + y + ')');
    card.append('rect')
      .attr('x', -44)
      .attr('y', -26)
      .attr('width', 88)
      .attr('height', 52)
      .style('fill', 'var(--paper)')
      .style('stroke', color)
      .style('stroke-width', 1.5);
    card.append('text')
      .attr('x', 0)
      .attr('y', -9)
      .attr('text-anchor', 'middle')
      .style('font-family', 'var(--mono)')
      .style('font-size', '9px')
      .style('letter-spacing', '0.08em')
      .style('text-transform', 'uppercase')
      .style('fill', color)
      .text(owner + ' result');
    var resultText = card.append('text')
      .attr('x', 0)
      .attr('y', 17)
      .attr('text-anchor', 'middle')
      .style('font-family', 'var(--mono)')
      .style('font-size', '24px')
      .style('fill', color)
      .text('?');
    resultText.transition()
      .delay(delay)
      .duration(1)
      .on('start', function revealResult() {
        root.d3.select(this).text(symbol);
      });
  }

  function animateEnvelope(svg, source, target, color) {
    var particle = svg.append('g').attr('transform', 'translate(' + source.x + ',' + source.y + ')');
    particle.append('rect')
      .attr('x', -13)
      .attr('y', -9)
      .attr('width', 26)
      .attr('height', 18)
      .style('fill', color)
      .style('fill-opacity', 0.16)
      .style('stroke', color)
      .style('stroke-width', 1.4);
    particle.append('path')
      .attr('d', 'M -13 -9 L 0 2 L 13 -9')
      .style('fill', 'none')
      .style('stroke', color)
      .style('stroke-width', 1);
    particle.transition()
      .duration(1800)
      .ease(root.d3.easeCubicOut)
      .attr('transform', 'translate(' + target.x + ',' + target.y + ')');
  }

  function cssValue(name) {
    if (typeof document === 'undefined') return '';
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initBrowser);
    } else {
      initBrowser();
    }
  }

  return {
    QUANTUM_WIN_PROBABILITY: QUANTUM_WIN_PROBABILITY,
    CLASSICAL_CEILING: CLASSICAL_CEILING,
    SETTING_PAIRS: SETTING_PAIRS.slice(),
    BEST_CLASSICAL_CARDS: BEST_CLASSICAL_CARDS.slice(),
    mulberry32: mulberry32,
    createStats: createStats,
    applyRound: applyRound,
    sampleQuantumRound: sampleQuantumRound,
    sampleClassicalRound: sampleClassicalRound,
    evaluateInstructionCard: evaluateInstructionCard,
    summarizeStats: summarizeStats,
    simulateRounds: simulateRounds,
  };
}));
