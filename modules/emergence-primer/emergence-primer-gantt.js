'use strict';

(function registerEmergenceGanttModel(root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
    return;
  }
  root.createEmergenceGanttModel = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function createFactory() {
  function createEmergenceGanttModel(options) {
    var config = options || {};
    var columns = Number(config.columns) || 192;
    var rows = Number(config.rows) || 120;
    var cellSize = Number(config.cellSize) || 5;

    function monthToX(xStart, xEnd, monthIndex, monthCount) {
      var span = monthCount - 1;
      if (span <= 0) return Math.round(xStart);
      return Math.round(xStart + ((xEnd - xStart) * monthIndex) / span);
    }

    function buildLayout() {
      var months = ['Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'];
      var labelAxisX = 3;
      var xStart = 34;
      var xEnd = 186;
      var yTop = 30;
      var rowGap = 14;
      var barHeight = 7;
      var timelineY = 10;

      var phaseDefs = [
        { id: 'requirements', label: 'Req. Gathering', start: 0.2, end: 2.0, row: 0 },
        { id: 'design', label: 'Solution Design', start: 2.5, end: 3.6, row: 1 },
        { id: 'build', label: 'Build', start: 4.0, end: 6.0, row: 2 },
        { id: 'sit', label: 'Sys. Integration Test', start: 6.3, end: 7.0, row: 3 },
        { id: 'uat', label: 'UAT', start: 7.2, end: 7.7, row: 4 },
        { id: 'hypercare', label: 'Hypercare', start: 7.9, end: 8.0, row: 5 }
      ];

      var phases = phaseDefs.map(function mapPhase(def) {
        var y0 = yTop + (def.row * rowGap);
        var x0 = monthToX(xStart, xEnd, def.start, months.length);
        var x1 = monthToX(xStart, xEnd, def.end, months.length);
        if (x1 <= x0) x1 = x0 + 1;
        return {
          id: def.id,
          label: def.label,
          x0: x0,
          x1: x1,
          y0: y0,
          y1: y0 + barHeight
        };
      });

      var gateDefs = [
        { id: 'business-case', label: 'Business case', month: 0.1, row: -0.5 },
        { id: 'requirements-signoff', label: 'Req. Sign-off', month: 2.2, row: 0.5 },
        { id: 'design-signoff', label: 'Design sign-off', month: 3.8, row: 1.5 },
        { id: 'change-approval', label: 'Change approval', month: 7.78, row: 4.2 },
        { id: 'go-live', label: 'Go-live', month: 7.88, row: 4.4 },
        { id: 'closure', label: 'Closure', month: 8.0, row: 5.9 }
      ];

      var gates = gateDefs.map(function mapGate(def) {
        var x = monthToX(xStart, xEnd, def.month, months.length);
        var y = Math.round(yTop + (def.row * rowGap) + Math.floor(barHeight / 2));
        return {
          id: def.id,
          label: def.label,
          x: x,
          y: y,
          routeTargetX: x,
          routeTargetY: y,
          r: 2
        };
      });

      var dependencies = [
        { from: 'gate:business-case', to: 'phase:requirements' },
        { from: 'phase:requirements', to: 'phase:design' },
        { from: 'phase:design', to: 'phase:build' },
        { from: 'phase:build', to: 'phase:sit' },
        { from: 'phase:sit', to: 'phase:uat' },
        { from: 'phase:uat', to: 'phase:hypercare' }
      ];

      var draftLayout = {
        phases: phases,
        gates: gates,
        dependencies: dependencies
      };

      var routesByKey = Object.create(null);
      for (var di = 0; di < dependencies.length; di += 1) {
        var dep = dependencies[di];
        var fromNode = resolveDependencyNode(draftLayout, dep.from, 'from');
        var toNode = resolveDependencyNode(draftLayout, dep.to, 'to');
        var route = buildDependencyRoute(fromNode, toNode);
        if (!route) continue;
        routesByKey[dep.from + '->' + dep.to] = route;
      }

      var gateIndexById = Object.create(null);
      for (var gi = 0; gi < gates.length; gi += 1) {
        gateIndexById[gates[gi].id] = gi;
      }

      var gateOnRoutePlacements = [
        { gateId: 'requirements-signoff', routeKey: 'phase:requirements->phase:design', t: 0.28 },
        { gateId: 'design-signoff', routeKey: 'phase:design->phase:build', t: 0.28 },
        { gateId: 'change-approval', routeKey: 'phase:uat->phase:hypercare', t: 0.34 },
        { gateId: 'go-live', routeKey: 'phase:uat->phase:hypercare', t: 0.74 }
      ];

      for (var pi = 0; pi < gateOnRoutePlacements.length; pi += 1) {
        var placement = gateOnRoutePlacements[pi];
        var routeForGate = routesByKey[placement.routeKey];
        if (!routeForGate) continue;
        var gateIndex = gateIndexById[placement.gateId];
        if (typeof gateIndex !== 'number') continue;
        var gate = gates[gateIndex];
        var dy = routeForGate.ty - routeForGate.sy;
        var y = routeForGate.sy;
        if (dy !== 0) {
          y = Math.round(routeForGate.sy + (dy * placement.t));
          if (y === routeForGate.sy) y += routeForGate.dirY;
          if (y === routeForGate.ty) y -= routeForGate.dirY;
        }
        gate.x = routeForGate.elbowX;
        gate.y = y;
      }

      var quarters = [
        { label: 'Q4', start: 0, end: 1 },
        { label: 'Q1', start: 2, end: 4 },
        { label: 'Q2', start: 5, end: 7 }
      ];

      return {
        months: months,
        quarters: quarters,
        timelineY: timelineY,
        labelAxisX: labelAxisX,
        xStart: xStart,
        xEnd: xEnd,
        yTop: yTop,
        activeMinX: xStart - 1,
        activeMinY: yTop - 4,
        phases: phases,
        gates: gates,
        dependencies: dependencies
      };
    }

    function resolveDependencyNode(layout, ref, anchorSide) {
      if (!layout || !ref) return null;

      if (ref.indexOf('phase:') === 0) {
        var phaseId = ref.slice('phase:'.length);
        for (var i = 0; i < layout.phases.length; i += 1) {
          var phase = layout.phases[i];
          if (phase.id !== phaseId) continue;
          return {
            x: anchorSide === 'from' ? phase.x1 : phase.x0,
            y: Math.floor((phase.y0 + phase.y1) / 2),
            nodeType: 'phase',
            anchorSide: anchorSide
          };
        }
        return null;
      }

      if (ref.indexOf('gate:') === 0) {
        var gateId = ref.slice('gate:'.length);
        for (var j = 0; j < layout.gates.length; j += 1) {
          var gate = layout.gates[j];
          if (gate.id !== gateId) continue;
          var useRouteTarget = anchorSide === 'to'
            && typeof gate.routeTargetX === 'number'
            && typeof gate.routeTargetY === 'number';
          return {
            x: useRouteTarget ? gate.routeTargetX : gate.x,
            y: useRouteTarget ? gate.routeTargetY : gate.y,
            nodeType: 'gate',
            anchorSide: anchorSide
          };
        }
      }

      return null;
    }

    function buildDependencyRoute(fromNode, toNode) {
      if (!fromNode || !toNode) return null;
      var sx = fromNode.x;
      var sy = fromNode.y;
      var tx = toNode.x;
      var ty = toNode.y;
      var safeTx = tx;
      if (safeTx <= sx) safeTx = sx + 2;
      var span = safeTx - sx;
      var minLead = span >= 8 ? 3 : 1;
      var minEntry = span >= 8 ? 2 : 1;
      var preferredLead = Math.max(minLead, Math.floor(span * 0.5));
      var elbowX = sx + preferredLead;
      var maxElbow = safeTx - minEntry;
      if (elbowX > maxElbow) elbowX = maxElbow;
      if (elbowX <= sx) elbowX = sx + 1;
      if (elbowX >= safeTx) elbowX = safeTx - 1;

      return {
        sx: sx,
        sy: sy,
        elbowX: elbowX,
        tx: safeTx,
        ty: ty,
        dirX: 1,
        dirY: ty >= sy ? 1 : -1
      };
    }

    function forEachDependencyCell(route, visitor) {
      if (!route || typeof visitor !== 'function') return;
      var seen = Object.create(null);

      function mark(xx, yy) {
        if (xx < 0 || xx >= columns || yy < 0 || yy >= rows) return;
        var key = String(xx) + ':' + String(yy);
        if (seen[key]) return;
        seen[key] = true;
        visitor(xx, yy);
      }

      var hx0 = Math.min(route.sx, route.elbowX);
      var hx1 = Math.max(route.sx, route.elbowX);
      for (var x = hx0; x <= hx1; x += 1) mark(x, route.sy);

      var vy0 = Math.min(route.sy, route.ty);
      var vy1 = Math.max(route.sy, route.ty);
      for (var y = vy0; y <= vy1; y += 1) mark(route.elbowX, y);

      var h2x0 = Math.min(route.elbowX, route.tx);
      var h2x1 = Math.max(route.elbowX, route.tx);
      for (var x2 = h2x0; x2 <= h2x1; x2 += 1) mark(x2, route.ty);

      mark(route.tx, route.ty);
      if (route.tx !== route.elbowX) {
        mark(route.tx - route.dirX, route.ty - 1);
        mark(route.tx - route.dirX, route.ty + 1);
      } else {
        mark(route.tx - 1, route.ty - route.dirY);
        mark(route.tx + 1, route.ty - route.dirY);
      }
    }

    function buildLabelPlan(layout, metrics) {
      if (!layout) return null;
      var params = metrics || {};
      var phaseFontPx = Number(params.phaseFontPx) || 16;
      var gateFontPx = Number(params.gateFontPx) || 12;
      var phaseLineHeight = Number(params.phaseLineHeight) || Math.max(18, Math.floor(phaseFontPx * 1.08));
      var canvasHeightPx = Number(params.canvasHeightPx) || (rows * cellSize);
      var phaseLabelColumnX = Number(params.phaseLabelColumnX) || 0;
      var milestoneLabelColumnX = Number(params.milestoneLabelColumnX) || 0;

      var wrappedLabelsByPhase = {
        requirements: ['Req. Gathering'],
        design: ['Solution', 'Design'],
        build: ['Build'],
        sit: ['Sys. Integration', 'Test'],
        uat: ['UAT'],
        hypercare: ['Hypercare']
      };

      var milestoneLabelAllowlist = {
        'business-case': true,
        'requirements-signoff': true,
        'design-signoff': true,
        'change-approval': true,
        'go-live': true,
        'closure': true
      };

      var phaseLines = [];
      var milestoneLines = [];
      var phaseBands = [];
      var milestoneBands = [];

      function collidesBands(bands, top, bottom) {
        for (var i = 0; i < bands.length; i += 1) {
          var band = bands[i];
          if (bottom < band.top || top > band.bottom) continue;
          return true;
        }
        return false;
      }

      function reserveBand(bands, centerY, halfHeight, paddingPx) {
        var pad = typeof paddingPx === 'number' ? paddingPx : 2;
        bands.push({
          top: centerY - halfHeight - pad,
          bottom: centerY + halfHeight + pad
        });
      }

      function resolveLabelY(desiredY, halfHeight, paddingPx, bands, maxShiftPx) {
        var pad = typeof paddingPx === 'number' ? paddingPx : 2;
        var minY = halfHeight + pad + 1;
        var maxY = canvasHeightPx - halfHeight - pad - 1;
        var clamped = Math.max(minY, Math.min(maxY, desiredY));
        if (!collidesBands(bands, clamped - halfHeight - pad, clamped + halfHeight + pad)) return clamped;

        var maxDelta = typeof maxShiftPx === 'number' ? maxShiftPx : 120;
        for (var delta = 2; delta <= maxDelta; delta += 2) {
          var upY = clamped - delta;
          if (upY >= minY && !collidesBands(bands, upY - halfHeight - pad, upY + halfHeight + pad)) return upY;

          var downY = clamped + delta;
          if (downY <= maxY && !collidesBands(bands, downY - halfHeight - pad, downY + halfHeight + pad)) return downY;
        }

        return clamped;
      }

      var phaseHalf = Math.ceil(phaseFontPx * 0.6);
      for (var p = 0; p < layout.phases.length; p += 1) {
        var phase = layout.phases[p];
        var labelLines = wrappedLabelsByPhase[phase.id] || [phase.label];
        var centerY = Math.round(((phase.y0 + phase.y1) / 2) * cellSize);

        if (labelLines.length <= 1) {
          phaseLines.push({
            phaseId: phase.id,
            text: labelLines[0],
            y: centerY,
            x: phaseLabelColumnX,
            align: 'left'
          });
          reserveBand(phaseBands, centerY, phaseHalf, 2);
          continue;
        }

        var firstY = centerY - Math.round(phaseLineHeight * 0.5);
        for (var li = 0; li < labelLines.length; li += 1) {
          var lineY = firstY + (li * phaseLineHeight);
          phaseLines.push({
            phaseId: phase.id,
            text: labelLines[li],
            y: lineY,
            x: phaseLabelColumnX,
            align: 'left'
          });
          reserveBand(phaseBands, lineY, phaseHalf, 2);
        }
      }

      var sameLabelColumn = Math.abs(milestoneLabelColumnX - phaseLabelColumnX) <= Math.max(4, Math.round(gateFontPx * 0.5));
      var gateHalf = Math.ceil(gateFontPx * 0.6);
      var gatePadBase = Math.max(2, Math.ceil(gateFontPx * 0.15));
      var gatePad = sameLabelColumn ? Math.min(2, gatePadBase) : gatePadBase;
      var gateMaxShift = sameLabelColumn
        ? Math.max(64, Math.floor(gateFontPx * 4))
        : Math.max(6, Math.floor(gateFontPx * 0.55));
      for (var g = 0; g < layout.gates.length; g += 1) {
        var gate = layout.gates[g];
        if (!milestoneLabelAllowlist[gate.id]) continue;
        var anchorY = (gate.y + 0.5) * cellSize;
        var y = Math.max(gateHalf + 1, Math.min(canvasHeightPx - gateHalf - 1, anchorY));
        var collisionBands = sameLabelColumn ? phaseBands.concat(milestoneBands) : milestoneBands;
        if (collidesBands(collisionBands, y - gateHalf - gatePad, y + gateHalf + gatePad)) {
          y = resolveLabelY(y, gateHalf, gatePad, collisionBands, gateMaxShift);
        }
        milestoneLines.push({
          gateId: gate.id,
          text: gate.label,
          y: y,
          x: milestoneLabelColumnX,
          align: 'left',
          anchorY: anchorY
        });
        reserveBand(milestoneBands, y, gateHalf, gatePad);
      }

      return {
        phase: phaseLines,
        milestones: milestoneLines
      };
    }

    return {
      buildLayout: buildLayout,
      resolveDependencyNode: resolveDependencyNode,
      buildDependencyRoute: buildDependencyRoute,
      forEachDependencyCell: forEachDependencyCell,
      buildLabelPlan: buildLabelPlan
    };
  }

  return createEmergenceGanttModel;
});
