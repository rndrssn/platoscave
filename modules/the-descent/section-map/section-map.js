(function () {
  'use strict';

  // Per-station readiness percentages (0-100) and restated-in set,
  // carried over from the prototype at sandbox/brief_section_map.html.
  const STATIONS = [
    { id: 'problem',       number: 1, label: 'The Problem',         exploration: 70,  solutioning: 10,  dev: 5,  livesIn: 'narrative',                tip: 'Why this work exists. Ambiguity is highest here.' },
    { id: 'direction',     number: 2, label: 'Direction',           exploration: 100, solutioning: 20,  dev: 10, livesIn: 'brief',                    tip: 'Desired change in the world. Outcome, not solution. The last fully open station.' },
    { id: 'where-we-are',  number: 3, label: 'Where We Are',        exploration: 100, solutioning: 50,  dev: 25, livesIn: 'brief',                    tip: 'Baseline for improvement briefs. Anchors design and engineering in the existing system.', anchorFor: 'improvement' },
    { id: 'people',        number: 4, label: 'People',              exploration: 100, solutioning: 65,  dev: 25, livesIn: 'brief',                    tip: 'Users, jobs, conditions. Load-bearing for new-feature briefs where no baseline exists.',  anchorFor: 'new-feature' },
    { id: 'scope',         number: 5, label: 'Scope',               exploration: 100, solutioning: 75,  dev: 35, livesIn: 'brief',                    tip: 'In, out, open questions. The open-questions column should shrink as discovery progresses.' },
    { id: 'slices',        number: 6, label: 'Slices',              exploration: 100, solutioning: 100, dev: 55, livesIn: 'story',                    tip: 'User-facing units of value. Loose in the brief, tight in stories.' },
    { id: 'constraints',   number: 7, label: 'Constraints',         exploration: 100, solutioning: 100, dev: 70, livesIn: 'story', consideredIn: ['plan'], tip: 'Legal, technical, deadlines, non-functional. Considered in the plan; crystallizes in stories.' },
    { id: 'acceptance',    number: 8, label: 'Acceptance Criteria', exploration: 100, solutioning: 100, dev: 95, livesIn: 'ticket',                   tip: 'Binary pass/fail. The most precise thing in the document.' }
  ];

  const TRACKS = [
    { key: 'exploration', label: 'Explore',  className: 'section-map-bar--exploration' },
    { key: 'solutioning', label: 'Converge', className: 'section-map-bar--solutioning' },
    { key: 'dev',         label: 'Dev',      className: 'section-map-bar--dev' }
  ];

  const ARTIFACTS = [
    { id: 'narrative', label: 'Narrative' },
    { id: 'brief',     label: 'Brief' },
    { id: 'plan',      label: 'Plan' },
    { id: 'story',     label: 'Story' },
    { id: 'ticket',    label: 'Ticket' }
  ];

  const CAPTIONS = {
    'improvement': 'Anchor: Where We Are — something already exists. How it works today is what we stand on.',
    'new-feature': 'Anchor: People — nothing exists yet. Who we\u2019re building for is what we stand on.'
  };

  const state = { mode: 'improvement' };

  let resizeRaf = 0;
  let svgRef, shellRef, tooltipRef, captionRef;

  function init() {
    const svgEl = document.getElementById('section-map-svg');
    const shellEl = document.getElementById('section-map-shell');
    const fallbackEl = document.getElementById('section-map-fallback');
    const tooltipEl = document.getElementById('section-map-tooltip');

    if (!window.d3 || !svgEl || !shellEl) {
      if (fallbackEl) fallbackEl.hidden = false;
      return;
    }

    svgRef = svgEl;
    shellRef = shellEl;
    tooltipRef = tooltipEl;
    captionRef = document.getElementById('section-map-caption');

    updateCaption(captionRef);
    render(svgRef, shellRef, tooltipRef);

    window.addEventListener('resize', () => {
      cancelAnimationFrame(resizeRaf);
      resizeRaf = requestAnimationFrame(() => render(svgRef, shellRef, tooltipRef));
    });
  }

  function setMode(mode) {
    if (!mode || state.mode === mode) return;
    state.mode = mode;
    hideTip(tooltipRef);
    updateCaption(captionRef);
    render(svgRef, shellRef, tooltipRef);
  }

  function updateCaption(el) {
    if (!el) return;
    el.textContent = CAPTIONS[state.mode] || '';
  }

  function render(svgEl, shellEl, tooltipEl) {
    const d3 = window.d3;
    const VIEW_W = 720;
    const rowHeight = 54;
    const topPad = 78;
    const bottomPad = 38;
    const height = topPad + (STATIONS.length - 1) * rowHeight + bottomPad;

    // Column x-positions in viewBox units.
    const numberX = 30;
    const spineX = 46;
    const labelX = 62;
    const barStartX = 232;
    const barWidth = 58;
    const barGap = 22;
    const artifactStartX = barStartX + 3 * barWidth + 2 * barGap + 22;
    const artifactStep = 44;
    const artifactDotR = 4;

    const svg = d3.select(svgEl)
      .attr('viewBox', `0 0 ${VIEW_W} ${height}`)
      .attr('preserveAspectRatio', 'xMidYMid meet');
    svg.selectAll('*').remove();

    const yFor = (index) => topPad + index * rowHeight;

    // Ambiguity gradient behind the spine — top dense, bottom faint.
    const defs = svg.append('defs');
    const grad = defs.append('linearGradient')
      .attr('id', 'section-map-ambiguity')
      .attr('x1', '0').attr('y1', '0')
      .attr('x2', '0').attr('y2', '1');
    grad.append('stop').attr('offset', '0%').attr('stop-color', 'currentColor').attr('stop-opacity', 0.08);
    grad.append('stop').attr('offset', '100%').attr('stop-color', 'currentColor').attr('stop-opacity', 0);

    svg.append('rect')
      .attr('class', 'section-map-ambiguity-bg')
      .attr('x', spineX - 36)
      .attr('y', topPad - 14)
      .attr('width', 72)
      .attr('height', height - topPad - bottomPad + 28)
      .attr('fill', 'url(#section-map-ambiguity)');

    // Column headers
    const headerY = topPad - 20;
    const headerG = svg.append('g').attr('class', 'section-map-header');
    TRACKS.forEach((track, i) => {
      const cx = barStartX + i * (barWidth + barGap) + barWidth / 2;
      headerG.append('text')
        .attr('class', 'section-map-col-header')
        .attr('x', cx).attr('y', headerY)
        .text(track.label);
    });
    const artifactGroupCenter = artifactStartX + (ARTIFACTS.length - 1) * artifactStep / 2;
    headerG.append('text')
      .attr('class', 'section-map-col-header')
      .attr('x', artifactGroupCenter).attr('y', headerY - 12)
      .text('Lives in');
    ARTIFACTS.forEach((artifact, ai) => {
      headerG.append('text')
        .attr('class', 'section-map-col-header section-map-col-header--sub')
        .attr('x', artifactStartX + ai * artifactStep).attr('y', headerY)
        .text(artifact.label);
    });

    // Spine
    svg.append('line')
      .attr('class', 'section-map-spine')
      .attr('x1', spineX).attr('y1', topPad - 8)
      .attr('x2', spineX).attr('y2', yFor(STATIONS.length - 1) + 8);

    // Station rows
    const stationG = svg.append('g').attr('class', 'section-map-stations');
    STATIONS.forEach((station, i) => {
      const y = yFor(i);
      const isAnchor = station.anchorFor === state.mode;
      const isShadowAnchor = station.anchorFor && station.anchorFor !== state.mode;

      const canToggleHere = isShadowAnchor;
      const g = stationG.append('g')
        .attr('class', 'section-map-station'
          + (isAnchor ? ' is-anchor' : '')
          + (isShadowAnchor ? ' is-shadow' : '')
          + (canToggleHere ? ' is-toggleable' : ''))
        .attr('transform', `translate(0, ${y})`);

      if (canToggleHere) {
        g.attr('tabindex', 0)
          .attr('role', 'button')
          .attr('aria-label', 'Switch anchor to ' + station.label);
      }

      g.append('circle')
        .attr('class', 'section-map-station-dot')
        .attr('cx', spineX).attr('cy', 0)
        .attr('r', isAnchor ? 6.5 : 4);

      if (isAnchor) {
        g.append('circle')
          .attr('class', 'section-map-station-halo')
          .attr('cx', spineX).attr('cy', 0)
          .attr('r', 12);
      } else if (canToggleHere) {
        g.append('circle')
          .attr('class', 'section-map-station-halo section-map-station-halo--shadow')
          .attr('cx', spineX).attr('cy', 0)
          .attr('r', 11);
      }

      g.append('text')
        .attr('class', 'section-map-station-number')
        .attr('x', numberX).attr('y', 4)
        .text(String(station.number));

      g.append('text')
        .attr('class', 'section-map-station-label')
        .attr('x', labelX).attr('y', 4)
        .text(station.label);

      // Readiness bars
      TRACKS.forEach((track, ti) => {
        const bx = barStartX + ti * (barWidth + barGap);
        const by = -4;
        const pct = Math.max(0, Math.min(100, station[track.key] || 0));
        g.append('rect')
          .attr('class', 'section-map-bar-bg')
          .attr('x', bx).attr('y', by)
          .attr('width', barWidth).attr('height', 8);
        g.append('rect')
          .attr('class', 'section-map-bar ' + track.className)
          .attr('x', bx).attr('y', by)
          .attr('width', barWidth * (pct / 100))
          .attr('height', 8);
      });

      // Lives-in artifact dots — single filled dot for home, hollow for considered.
      const consideredSet = new Set(station.consideredIn || []);
      ARTIFACTS.forEach((artifact, ai) => {
        const cx = artifactStartX + ai * artifactStep;
        const isHome = station.livesIn === artifact.id;
        const isConsidered = consideredSet.has(artifact.id);
        if (!isHome && !isConsidered) return;
        g.append('circle')
          .attr('class', 'section-map-artifact-dot' + (isHome ? ' is-home' : ' is-considered'))
          .attr('cx', cx).attr('cy', 0)
          .attr('r', artifactDotR);
      });

      // Hover target spans the whole row
      const hoverRect = g.append('rect')
        .attr('class', 'section-map-row-hover' + (canToggleHere ? ' is-toggleable' : ''))
        .attr('x', 0).attr('y', -rowHeight / 2)
        .attr('width', VIEW_W).attr('height', rowHeight)
        .attr('fill', 'transparent')
        .on('mouseenter', (event) => showTip(tooltipEl, event, station.label, station.tip))
        .on('mousemove', (event) => moveTip(tooltipEl, event))
        .on('mouseleave', () => hideTip(tooltipEl));

      if (canToggleHere) {
        const toggle = () => setMode(station.anchorFor);
        g.on('click', toggle);
        g.on('keydown', (event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            toggle();
          }
        });
      }
    });

    // Axis hints on the spine
    svg.append('text')
      .attr('class', 'section-map-axis-hint')
      .attr('x', spineX).attr('y', topPad - 34)
      .text('ambiguity');

    svg.append('text')
      .attr('class', 'section-map-axis-hint')
      .attr('x', spineX).attr('y', height - 8)
      .text('precision');
  }

  function showTip(el, event, header, body) {
    if (!el) return;
    el.innerHTML = '';
    const h = document.createElement('div');
    h.className = 'section-map-tooltip-header';
    h.textContent = header;
    el.appendChild(h);
    const b = document.createElement('div');
    b.className = 'section-map-tooltip-body';
    b.textContent = body;
    el.appendChild(b);
    el.classList.add('is-visible');
    el.setAttribute('aria-hidden', 'false');
    moveTip(el, event);
  }

  function moveTip(el, event) {
    if (!el || !el.classList.contains('is-visible')) return;
    const pad = 14;
    const x = event.clientX + window.scrollX + pad;
    const y = event.clientY + window.scrollY + pad;
    el.style.left = x + 'px';
    el.style.top = y + 'px';
  }

  function hideTip(el) {
    if (!el) return;
    el.classList.remove('is-visible');
    el.setAttribute('aria-hidden', 'true');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
