'use strict';

(function initGarbageCanExplainer() {
  var svgEl = document.getElementById('can-explainer-svg');
  var toggleBtn = document.getElementById('can-toggle-btn');
  var resetBtn = document.getElementById('can-reset-btn');
  var captionEl = document.getElementById('can-explainer-caption');
  if (!svgEl || !toggleBtn || !resetBtn || !captionEl || typeof d3 === 'undefined') return;

  function readCssVar(name, fallback) {
    if (typeof window === 'undefined' || typeof document === 'undefined') return fallback;
    var root = document.documentElement;
    var raw = window.getComputedStyle(root).getPropertyValue(name);
    return raw && raw.trim() ? raw.trim() : fallback;
  }

  function readNumberCssVarFromEl(el, name, fallback) {
    if (!el || typeof window === 'undefined') return fallback;
    var raw = window.getComputedStyle(el).getPropertyValue(name);
    var num = parseFloat(raw);
    return Number.isFinite(num) ? num : fallback;
  }

  var SVG_W = 920;
  var SVG_H = 560;
  var CAN_X = SVG_W / 2;
  var CAN_Y = 330;
  var CAN_R = 160;
  var STREAM_X = {
    problem: 220,
    solution: 460,
    participant: 700
  };
  var STREAM_TOP_Y = 96;
  var STREAM_GATE_Y = CAN_Y - CAN_R - 18;
  var ADRIFT_Y = SVG_H - 18;

  var colors = {
    // Remapped to requested stream semantics.
    problem: readCssVar('--viz-slate', '#3D4F5C'),           // blue
    entering: readCssVar('--viz-rust-light', '#B85C40'),     // entering signal
    solution: readCssVar('--viz-sage-light', '#6B8F62'),     // green
    participant: readCssVar('--viz-gold', '#B8943A'),        // yellow
    resolved: readCssVar('--viz-sage', '#4A6741'),           // resolved marker
    adrift: readCssVar('--viz-rust', '#8B3A2A'),             // unresolved drift signal
    ink: readCssVar('--viz-ink', '#2A2018'),
    faint: readCssVar('--viz-ink-faint', '#7A6E5F'),
    ghost: readCssVar('--viz-ink-ghost', '#B0A490')
  };
  var CHOICE_STROKE_WIDTH = 1.8;
  var CHOICE_STROKE_WIDTH_RESOLVED = 1.2;

  var timers = [];
  var controller = null;

  function addTimer(fn, ms) {
    var id = window.setTimeout(fn, ms);
    timers.push(id);
    return id;
  }

  function clearTimers() {
    timers.forEach(function(id) { window.clearTimeout(id); });
    timers = [];
  }

  function render() {
    if (controller && typeof controller.stop === 'function') controller.stop();
    clearTimers();
    captionEl.textContent = '';

    var svg = d3.select(svgEl)
      .attr('viewBox', '0 0 ' + SVG_W + ' ' + SVG_H);
    svg.selectAll('*').remove();

    // SVG text sizes are specified in user units and then scaled by the viewBox.
    // Compute user-unit font sizes from target on-screen px so labels stay legible on mobile.
    var rect = svgEl.getBoundingClientRect();
    var sx = rect.width > 0 ? (rect.width / SVG_W) : 1;
    var sy = rect.height > 0 ? (rect.height / SVG_H) : sx;
    var svgScale = Math.max(0.01, Math.min(sx, sy));
    var targetPx = {
      token: readNumberCssVarFromEl(svgEl, '--can-exp-fs-token-px', 18),
      legend: readNumberCssVarFromEl(svgEl, '--can-exp-fs-legend-px', 17),
      top: readNumberCssVarFromEl(svgEl, '--can-exp-fs-top-px', 16),
      co: readNumberCssVarFromEl(svgEl, '--can-exp-fs-co-px', 24)
    };
    var FONT_U = {
      token: targetPx.token / svgScale,
      legend: targetPx.legend / svgScale,
      top: targetPx.top / svgScale,
      co: targetPx.co / svgScale
    };

    var state = {
      cycle: 0,
      resolved: 0,
      adrift: 0,
      queueProblems: [],
      queueSolutions: [],
      queueParticipants: []
    };
    var isRunning = true;

    var layer = svg.append('g');
    var streamLayer = layer.append('g').attr('aria-hidden', 'true');
    var canLayer = layer.append('g').attr('aria-hidden', 'true');
    var tokenLayer = layer.append('g').attr('aria-hidden', 'true');
    var hudLayer = layer.append('g').attr('aria-hidden', 'true');

    var canCircle = canLayer.append('circle')
      .attr('cx', CAN_X)
      .attr('cy', CAN_Y)
      .attr('r', CAN_R)
      .attr('fill', 'none')
      .attr('stroke', colors.ghost)
      .attr('stroke-width', CHOICE_STROKE_WIDTH)
      .attr('opacity', 1);

    canLayer.append('text')
      .attr('class', 'gc-viz__choice-label can-explainer__co-label')
      .attr('x', CAN_X)
      .attr('y', CAN_Y + CAN_R + 40)
      .attr('text-anchor', 'middle')
      .attr('font-size', FONT_U.co)
      .text('CO');

    var hud = hudLayer.append('text')
      .attr('class', 'gc-viz__top-legend')
      .attr('x', 0)
      .attr('font-size', FONT_U.top)
      .attr('y', 18);

    function updateHud() {
      hud.selectAll('tspan').remove();
      var segments = [
        { text: 'Org. iteration ' + state.cycle + '  |  ', fill: colors.faint },
        { text: 'Problems Resolved ' + state.resolved, fill: colors.resolved },
        { text: '  |  ', fill: colors.faint },
        { text: 'Problems Adrift ' + state.adrift, fill: colors.adrift }
      ];
      var maxHudWidth = Math.max(160, (rect.width / svgScale) - 8);
      var lineGapEm = 1.45;
      var maxHudWidthPx = maxHudWidth * svgScale;
      var currentLinePx = 0;

      segments.forEach(function(seg, idx) {
        var t = hud.append('tspan')
          .attr('fill', seg.fill)
          .text(seg.text);
        if (idx === 0) t.attr('x', 0).attr('dy', 0);

        var segPx = t.node().getComputedTextLength() * svgScale;
        if (idx > 0 && currentLinePx + segPx > maxHudWidthPx) {
          t.attr('x', 0).attr('dy', lineGapEm + 'em');
          currentLinePx = segPx;
        } else if (idx > 0) {
          t.attr('dy', 0).attr('x', null);
          currentLinePx += segPx;
        } else {
          currentLinePx = segPx;
        }
      });
    }

    function pulseCan() {
      canCircle.interrupt()
        .transition().duration(220)
          .attr('stroke', colors.faint)
          .attr('stroke-width', CHOICE_STROKE_WIDTH + 1.1)
        .transition().duration(360)
          .attr('stroke', colors.ghost)
          .attr('stroke-width', CHOICE_STROKE_WIDTH)
          .attr('opacity', 1);
    }

    function clampToCan(x, y, padding) {
      var pad = padding || 16;
      var maxR = Math.max(8, CAN_R - pad);
      var dx = x - CAN_X;
      var dy = y - CAN_Y;
      var dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= maxR) return { x: x, y: y };
      var scale = maxR / dist;
      return {
        x: CAN_X + dx * scale,
        y: CAN_Y + dy * scale
      };
    }

    function parseTranslate(g) {
      var tr = g.attr('transform') || '';
      var m = /translate\(([-\d.]+),\s*([-\d.]+)\)/.exec(tr);
      if (!m) return { x: CAN_X, y: CAN_Y };
      return { x: parseFloat(m[1]), y: parseFloat(m[2]) };
    }

    function startInteractionJitter(tokenG) {
      function tick() {
        if (!isRunning || !tokenG || tokenG.empty()) return;
        var p = parseTranslate(tokenG);
        var nx = p.x + (Math.random() * 28 - 14);
        var ny = p.y + (Math.random() * 28 - 14);
        var bounded = clampToCan(nx, ny, 18);
        tokenG
          .transition('jitter')
          .duration(420 + Math.round(Math.random() * 320))
          .ease(d3.easeCubicInOut)
          .attr('transform', 'translate(' + bounded.x + ',' + bounded.y + ')')
          .on('end', tick);
      }
      tick();
    }

    function animateAdrift(problemToken) {
      if (!isRunning) return;
      state.adrift += 1;
      updateHud();
      problemToken.select('text')
        .text('adrift')
        .attr('fill', colors.adrift);
      problemToken.select('rect')
        .attr('fill', colors.adrift)
        .attr('stroke', colors.adrift)
        .attr('fill-opacity', 0.22);
      problemToken
        .interrupt('jitter')
        .transition()
        .duration(860)
        .ease(d3.easeCubicInOut)
        .attr('transform', 'translate(152,' + ADRIFT_Y + ')')
        .style('opacity', 1)
        .transition()
        .duration(760)
        .ease(d3.easeCubicOut)
        .style('opacity', 0)
        .remove();
    }

    function animateResolution(problemToken, solutionToken, participantToken) {
      if (!isRunning) return;
      state.resolved += 1;
      updateHud();
      pulseCan();
      problemToken.select('text')
        .text('resolved')
        .attr('fill', colors.problem);
      problemToken.select('rect')
        .attr('fill', colors.resolved)
        .attr('stroke', colors.resolved)
        .attr('fill-opacity', 0.24);

      problemToken
        .interrupt('jitter')
        .transition()
        .duration(860)
        .ease(d3.easeCubicInOut)
        .attr('transform', 'translate(' + (SVG_W - 84 - (state.resolved % 8) * 78) + ',' + (SVG_H - 74) + ')')
        .style('opacity', 1)
        .transition()
        .duration(760)
        .ease(d3.easeCubicOut)
        .style('opacity', 0)
        .remove();

      solutionToken
        .interrupt('jitter')
        .transition()
        .duration(1500)
        .ease(d3.easeCubicInOut)
        .style('opacity', 0)
        .remove();

      participantToken
        .interrupt('jitter')
        .transition()
        .duration(1500)
        .ease(d3.easeCubicInOut)
        .style('opacity', 0)
        .remove();

      // Briefly echo gc-viz resolved stroke de-emphasis when closure occurs.
      canCircle
        .transition()
        .duration(260)
        .attr('stroke-width', CHOICE_STROKE_WIDTH_RESOLVED)
        .attr('opacity', 0.88)
        .transition()
        .duration(320)
        .attr('stroke-width', CHOICE_STROKE_WIDTH)
        .attr('opacity', 1);
    }

    function attemptOutcome() {
      if (!isRunning) return;
      if (state.queueProblems.length > 0 && state.queueSolutions.length > 0 && state.queueParticipants.length > 0) {
        var p = state.queueProblems.shift();
        var s = state.queueSolutions.shift();
        var u = state.queueParticipants.shift();
        animateResolution(p, s, u);
        return;
      }

      if (state.queueProblems.length >= 2) {
        var oldestProblem = state.queueProblems.shift();
        animateAdrift(oldestProblem);
      }
    }

    function spawnToken(type, streamX, label, color) {
      if (!isRunning) return;
      var g = tokenLayer.append('g')
        .attr('transform', 'translate(' + streamX + ',' + STREAM_TOP_Y + ')')
        .style('opacity', 0);

      var text = g.append('text')
        .attr('class', 'gc-viz__legend-text')
        .attr('x', 0)
        .attr('y', 0)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'central')
        .attr('fill', colors.ink)
        .attr('font-size', FONT_U.token)
        .attr('font-weight', 500)
        .text(label);

      var bbox = text.node().getBBox();
      g.insert('rect', 'text')
        .attr('x', bbox.x - 5)
        .attr('y', bbox.y - 2)
        .attr('width', bbox.width + 10)
        .attr('height', bbox.height + 4)
        .attr('fill', color)
        .attr('fill-opacity', 0.22)
        .attr('stroke', color)
        .attr('stroke-opacity', 0.9)
        .attr('stroke-width', 0.85);

      g.transition()
        .duration(320)
        .style('opacity', 1)
        .transition()
        .duration(1450)
        .attr('transform', 'translate(' + streamX + ',' + STREAM_GATE_Y + ')')
        .transition()
        .duration(980)
        .attr('transform', function() {
          var tx = CAN_X + (Math.random() * 156 - 78);
          var ty = CAN_Y + (Math.random() * 172 - 86);
          var bounded = clampToCan(tx, ty, 18);
          return 'translate(' + bounded.x + ',' + bounded.y + ')';
        })
        .on('end', function() {
          if (type === 'problem') {
            g.select('text').attr('fill', colors.solution);
            g.select('rect')
              .attr('fill', colors.solution)
              .attr('stroke', colors.solution);
          }
          startInteractionJitter(g);
          if (type === 'problem') state.queueProblems.push(g);
          if (type === 'solution') state.queueSolutions.push(g);
          if (type === 'participant') state.queueParticipants.push(g);
          attemptOutcome();
        });
    }

    function runCycle() {
      if (!isRunning) return;
      state.cycle += 1;
      updateHud();

      // Guarantee visible drift dynamics: if problems are waiting every second cycle,
      // force one problem to leave adrift.
      if (state.queueProblems.length > 0 && state.cycle % 2 === 0) {
        animateAdrift(state.queueProblems.shift());
      }

      spawnToken('problem', STREAM_X.problem, 'problem', colors.entering);
      if (state.cycle % 2 !== 0) {
        addTimer(function() {
          if (!isRunning) return;
          spawnToken('solution', STREAM_X.solution, 'solution', colors.solution);
        }, 500);
      }
      if (state.cycle % 3 !== 0) {
        addTimer(function() {
          if (!isRunning) return;
          spawnToken('participant', STREAM_X.participant, 'participant', colors.participant);
        }, 900);
      }

      addTimer(function() {
        if (!isRunning) return;
        if (Math.random() < 0.85 && state.queueProblems.length > 0) {
          var drifting = state.queueProblems.shift();
          animateAdrift(drifting);
        }
      }, 2400);

      addTimer(runCycle, 3900);
    }

    runCycle();

    function setToggleLabel() {
      toggleBtn.textContent = isRunning ? '⏸' : '▶';
      toggleBtn.setAttribute('aria-label', isRunning ? 'Pause animation' : 'Play animation');
      toggleBtn.setAttribute('title', isRunning ? 'Pause animation' : 'Play animation');
    }

    function start() {
      if (isRunning) return;
      isRunning = true;
      setToggleLabel();
      runCycle();
    }

    function stop() {
      if (!isRunning) return;
      isRunning = false;
      clearTimers();
      tokenLayer.selectAll('*').interrupt();
      canLayer.selectAll('*').interrupt();
      setToggleLabel();
    }

    setToggleLabel();
    controller = {
      toggle: function() {
        if (isRunning) stop();
        else start();
      },
      stop: stop,
      reset: render
    };
  }

  toggleBtn.addEventListener('click', function() {
    if (controller && typeof controller.toggle === 'function') controller.toggle();
  });
  resetBtn.addEventListener('click', function() {
    if (controller && typeof controller.reset === 'function') controller.reset();
  });
  render();
})();
