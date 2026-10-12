// Renders the product-management intellectual history as an interactive metro map.
'use strict';

(function renderProductManagementHistory() {
  const root = document.querySelector('[data-pm-map]');
  const history = window.PRODUCT_MANAGEMENT_HISTORY;
  if (!root || !window.d3 || !history) return;

  const d3 = window.d3;
  const stations = history.stations;
  const svg = d3.select(root.querySelector('.pm-map-svg'));
  const stage = root.querySelector('.pm-map-stage');
  const tooltip = root.querySelector('.pm-map-tooltip');
  const detailKicker = root.querySelector('.pm-map-detail-kicker');
  const detailTitle = root.querySelector('.pm-map-detail-title');
  const detailSource = root.querySelector('.pm-map-detail-source');
  const detailContributed = root.querySelector('.pm-map-detail-contributed');
  const detailLimits = root.querySelector('.pm-map-detail-limits');
  const controls = root.querySelector('.pm-map-lines');
  const width = 1880;
  const height = 600;

  const routeMeta = {
    brand: { label: 'Brand management', color: 'var(--rust-light)' },
    engineering: { label: 'Engineering & NPD', color: 'var(--ochre)' },
    design: { label: 'Design & usability', color: 'var(--slate-light)' },
    discovery: { label: 'Startup discovery', color: 'var(--sage-light)' },
    product: { label: 'Software product model', color: 'var(--sage)' },
    backlash: { label: 'Recentralisation', color: 'var(--rust)' }
  };

  // Lines bend only at 45° and keep a 20-unit vertical offset wherever they run side by side,
  // so shared corridors read as parallel tracks rather than one overdrawn stroke.
  const routes = [
    route('brand', [[90, 120], [1060, 120], [1220, 280], [1300, 280]]),
    route('engineering', [[370, 220], [1140, 220], [1220, 300], [1300, 300]]),
    route('design', [[640, 400], [1140, 400], [1200, 340], [1300, 340]]),
    route('discovery', [[1030, 500], [1140, 500], [1280, 360], [1320, 360], [1440, 480], [1650, 480]]),
    route('product', [[850, 240], [1140, 240], [1220, 320], [1740, 320]]),
    route('backlash', [[1620, 320], [1700, 240], [1820, 240]])
  ];

  const eras = [
    { label: 'Origins · 1931–1967', x: 30, width: 290 },
    { label: 'Engineering & design · 1984–1999', x: 330, width: 655 },
    { label: 'Convergence & expansion · 2001–2021', x: 995, width: 690 },
    { label: 'Backlash · 2023–', x: 1690, width: 180, anchor: 'end' }
  ];

  const legend = [
    { role: 'foundation', label: 'Durable idea' },
    { role: 'codification', label: 'Operationalised' },
    { role: 'inflation', label: 'Role expansion' },
    { role: 'backlash', label: 'Backlash' },
    { role: 'provisional', label: 'Provisional' },
    { role: 'interchange', label: 'Lines meet' }
  ];

  svg.attr('viewBox', `0 0 ${width} ${height}`);
  svg.append('title').attr('id', 'pm-map-title').text('Product management intellectual history');
  svg.append('desc').attr('id', 'pm-map-desc').text('Four traditions converge at Inspired, then continue as a discovery line and a product-organisation line; recentralisation branches from Empowered.');

  svg.selectAll('.pm-era-band').data(eras).join('rect')
    .attr('class', 'pm-era-band').attr('x', (d) => d.x).attr('y', 48)
    .attr('width', (d) => d.width).attr('height', 532);
  svg.selectAll('.pm-era-label').data(eras).join('text')
    .attr('class', 'pm-era-label').attr('y', 34).text((d) => d.label)
    .attr('text-anchor', (d) => d.anchor || 'start')
    .attr('x', (d) => (d.anchor === 'end' ? d.x + d.width : d.x + 10));

  const line = d3.line().curve(d3.curveLinear);
  const routeSelection = svg.append('g').selectAll('.pm-route').data(routes).join('path')
    .attr('class', 'pm-route')
    .attr('data-route', (d) => d.id)
    .style('--pm-line-color', (d) => routeMeta[d.id].color)
    .attr('d', (d) => line(d.points));

  const stationSelection = svg.append('g').selectAll('.pm-station').data(stations).join('g')
    .attr('class', 'pm-station').attr('data-role', (d) => d.role)
    .attr('data-station', (d) => d.id).attr('tabindex', 0).attr('role', 'button')
    .attr('aria-label', (d) => `${d.year}: ${d.label}, ${d.author}, ${d.work}. Contributed: ${d.contributed} Limits and failure modes: ${d.limits}`)
    .attr('transform', (d) => `translate(${d.x},${tracks(d)[0]})`)
    .style('--pm-station-color', (d) => routeMeta[d.routes[0]].color);

  stationSelection.each(function drawStation(d) {
    const group = d3.select(this);
    const [top, bottom] = tracks(d);
    const span = bottom - top;
    if (span > 0) group.attr('data-shape', 'interchange');
    group.append('rect').attr('class', 'pm-station-halo').attr('x', -17).attr('y', -17)
      .attr('width', 34).attr('height', span + 34).attr('rx', 17);
    drawShape(group, span > 0 ? 'interchange' : d.role, span);
    const lines = labelLines(d.label);
    const firstLine = d.side === 'above' ? -16 - (lines.length - 1) * 18 : span + 50;
    group.append('text').attr('class', 'pm-station-year').attr('text-anchor', 'middle')
      .attr('y', firstLine - 20).text(d.year);
    group.append('text').attr('class', 'pm-station-label').attr('text-anchor', 'middle')
      .selectAll('tspan').data(lines).join('tspan')
      .attr('x', 0).attr('y', (_, index) => firstLine + index * 18).text((line) => line);
  });

  const legendSelection = svg.append('g').attr('class', 'pm-legend').attr('aria-hidden', 'true')
    .selectAll('g').data(legend).join('g')
    .attr('class', 'pm-legend-item')
    .attr('data-role', (d) => d.role)
    .attr('data-shape', (d) => (d.role === 'interchange' ? 'interchange' : null))
    .attr('transform', (_, index) => `translate(${legendOffset(index)},565)`);
  legendSelection.each(function drawLegendItem(d) {
    const isInterchange = d.role === 'interchange';
    drawShape(d3.select(this), d.role, isInterchange ? 10 : 0);
    if (isInterchange) d3.select(this).select('.pm-station-shape').attr('transform', 'translate(0,-5)');
  });
  legendSelection.append('text').attr('class', 'pm-legend-label').attr('x', 18).attr('y', 4).text((d) => d.label);

  Object.entries(routeMeta).forEach(([id, meta]) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'pm-map-line-button';
    button.textContent = meta.label;
    button.setAttribute('aria-pressed', 'false');
    button.style.setProperty('--pm-line-color', meta.color);
    button.addEventListener('click', () => toggleFocus(id, button));
    controls.appendChild(button);
  });

  stationSelection
    .on('click', (_, d) => selectStation(d))
    .on('keydown', (event, d) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      selectStation(d);
    })
    .on('pointerenter', (event, d) => showTooltip(event, d))
    .on('pointermove', (event) => positionTooltip(event))
    .on('pointerleave', hideTooltip);

  stage.addEventListener('scroll', updateScrollEdge, { passive: true });
  window.addEventListener('resize', updateScrollEdge);
  updateScrollEdge();
  root.classList.add('is-ready');

  function route(id, points) { return { id, points }; }

  function legendOffset(index) {
    return legend.slice(0, index).reduce((x, item) => x + 44 + item.label.length * 7.5, 50);
  }

  // Long names break at the space nearest their middle so stations can sit closer together at a readable size.
  function labelLines(label) {
    if (label.length <= 11) return [label];
    const middle = label.length / 2;
    const breakAt = [...label].reduce((best, char, index) =>
      (char === ' ' && Math.abs(index - middle) <= Math.abs(best - middle) ? index : best), -1);
    return breakAt < 0 ? [label] : [label.slice(0, breakAt), label.slice(breakAt + 1)];
  }

  function tracks(d) { return Array.isArray(d.y) ? d.y : [d.y, d.y]; }

  function drawShape(group, role, span) {
    if (role === 'interchange') {
      group.append('rect').attr('class', 'pm-station-shape').attr('x', -10).attr('y', -10)
        .attr('width', 20).attr('height', span + 20).attr('rx', 10);
    } else if (role === 'backlash') {
      group.append('path').attr('class', 'pm-station-shape').attr('d', 'M 0 -10 L 10 0 L 0 10 L -10 0 Z');
    } else if (role === 'codification' || role === 'inflation') {
      group.append('rect').attr('class', 'pm-station-shape').attr('x', -8).attr('y', -8).attr('width', 16).attr('height', 16);
    } else {
      group.append('circle').attr('class', 'pm-station-shape').attr('r', 8);
    }
  }

  function toggleFocus(id, button) {
    const active = button.getAttribute('aria-pressed') === 'true';
    controls.querySelectorAll('button').forEach((item) => item.setAttribute('aria-pressed', 'false'));
    root.classList.toggle('is-focused', !active);
    routeSelection.classed('is-focused', (d) => !active && d.id === id);
    stationSelection.classed('is-focused', (d) => !active && d.routes.includes(id));
    if (!active) button.setAttribute('aria-pressed', 'true');
  }

  function selectStation(d) {
    stationSelection.classed('is-selected', (stationDatum) => stationDatum.id === d.id);
    detailKicker.textContent = `${d.year} · ${roleLabel(d.role)}`;
    detailTitle.textContent = d.label;
    detailSource.textContent = `${d.author}\n${d.work}`;
    detailContributed.textContent = d.contributed;
    detailLimits.textContent = d.limits;
  }

  function roleLabel(role) {
    return ({ foundation: 'Durable idea', codification: 'Operationalised', inflation: 'Role expansion', backlash: 'Backlash', provisional: 'Provisional' })[role] || role;
  }

  function showTooltip(event, d) {
    tooltip.textContent = `${d.year} · ${d.label}\n${d.author}`;
    tooltip.hidden = false;
    positionTooltip(event);
  }

  function positionTooltip(event) {
    const bounds = stage.getBoundingClientRect();
    const gap = 12;
    const inset = 8;
    const x = event.clientX - bounds.left - stage.clientLeft;
    const y = event.clientY - bounds.top - stage.clientTop;
    tooltip.style.maxWidth = `${Math.max(0, Math.min(240, stage.clientWidth - inset * 2))}px`;
    const tooltipWidth = tooltip.offsetWidth;
    const tooltipHeight = tooltip.offsetHeight;
    const left = x + gap + tooltipWidth > stage.clientWidth - inset
      ? x - gap - tooltipWidth : x + gap;
    const top = y + gap + tooltipHeight > stage.clientHeight - inset
      ? y - gap - tooltipHeight : y + gap;
    tooltip.style.left = `${stage.scrollLeft + Math.max(inset, Math.min(left, stage.clientWidth - tooltipWidth - inset))}px`;
    tooltip.style.top = `${stage.scrollTop + Math.max(inset, Math.min(top, stage.clientHeight - tooltipHeight - inset))}px`;
  }

  function hideTooltip() { tooltip.hidden = true; }

  function updateScrollEdge() {
    stage.classList.toggle('is-scrolled-end', stage.scrollLeft + stage.clientWidth >= stage.scrollWidth - 4);
  }
})();
