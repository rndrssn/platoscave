'use strict';

(function initMixMapperLayoutUtils(root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
    return;
  }
  root.MixMapperLayoutUtils = factory();
}(typeof globalThis !== 'undefined' ? globalThis : this, function buildMixMapperLayoutUtils() {
  function createLayoutUtils(deps) {
    deps = deps || {};
    var clamp = deps.clamp || function(value, min, max) {
      return Math.max(min, Math.min(max, value));
    };
    var readScopedCssNumber = deps.readScopedCssNumber || function(_name, fallback) {
      return fallback;
    };
    var getColors = typeof deps.getColors === 'function' ? deps.getColors : function() {
      return {
        muted: '#5C4F3A',
        gold: '#B8943A'
      };
    };

    function getLayout(shellEl) {
      var shellWidth = Math.max(320, shellEl && shellEl.clientWidth ? shellEl.clientWidth : 980);
      var width = clamp(Math.round(shellWidth), 520, 980);
      var compact = width < 700;
      var height = compact
        ? Math.max(920, Math.round(width * 1.42))
        : Math.max(900, Math.round(width * 1.01));

      var laneGap = compact
        ? Math.max(132, Math.round(width * 0.27))
        : Math.max(198, Math.round(width * 0.31));
      var laneGapScale = clamp(readScopedCssNumber('--mix-map-lane-gap-scale', 1), 0.8, 2.4);
      var laneGapMin = compact ? 132 : 198;
      var laneGapMax = width * (compact ? 0.72 : 0.74);
      laneGap = clamp(Math.round(laneGap * laneGapScale), laneGapMin, laneGapMax);

      var laneCenter = width / 2;
      var laneX = {
        complexity: laneCenter - (laneGap / 2),
        traditional: laneCenter + (laneGap / 2)
      };

      var baseNodeWidth = compact
        ? clamp(laneGap - 34, 126, 162)
        : clamp(laneGap - 42, 162, 196);

      var baseNodeHeight = compact ? 56 : 54;
      var nodeWidthScale = clamp(readScopedCssNumber('--mix-map-node-width-scale', 1), 0.72, 1.35);
      var nodeHeightScale = clamp(readScopedCssNumber('--mix-map-node-height-scale', 1), 0.72, 1.35);
      var nodeWidth = clamp(
        Math.round(baseNodeWidth * nodeWidthScale),
        compact ? 108 : 140,
        compact ? 188 : 224
      );
      var nodeHeight = clamp(
        Math.round(baseNodeHeight * nodeHeightScale * 0.7),
        compact ? 30 : 29,
        compact ? 58 : 56
      );
      var nodeStrokeWidth = clamp(readScopedCssNumber('--mix-map-node-stroke-width', 1.35), 0.8, 2.2);
      var fitContentNodeWidth = readScopedCssNumber('--mix-map-node-fit-content-width', 0) >= 0.5;
      var nodeLabelMaxLines = Math.round(clamp(readScopedCssNumber('--mix-map-node-label-max-lines', 2), 1, 3));
      var allowArcOverflowX = readScopedCssNumber('--mix-map-desktop-arc-overflow', compact ? 0 : 1) >= 0.5;
      var learningArc = clamp(
        readScopedCssNumber('--mix-map-learning-arc', compact ? 150 : 252),
        compact ? 96 : 132,
        allowArcOverflowX ? 760 : (compact ? 260 : 420)
      );
      var feedbackArc = clamp(
        readScopedCssNumber('--mix-map-feedback-arc', compact ? 92 : 162),
        compact ? 64 : 90,
        allowArcOverflowX ? 560 : (compact ? 210 : 320)
      );
      var topY = compact ? 142 : 140;
      var bottomPad = compact ? 124 : 110;
      var mobileStepGapScale = clamp(readScopedCssNumber('--mix-map-mobile-step-gap-scale', 1), 0.8, 1.8);
      var stepGapBase = ((height - topY - bottomPad) / 5) * 0.6125;
      var stepGap = compact ? (stepGapBase * mobileStepGapScale) : stepGapBase;

      return {
        width: width,
        height: height,
        compact: compact,
        laneGap: laneGap,
        laneX: laneX,
        nodeWidth: nodeWidth,
        nodeHeight: nodeHeight,
        fitContentNodeWidth: fitContentNodeWidth,
        nodeLabelMaxLines: nodeLabelMaxLines,
        nodeStrokeWidth: nodeStrokeWidth,
        topY: topY,
        stepGap: stepGap,
        laneTitleSize: compact ? 13.6 : 14.8,
        laneSubtitleSize: compact ? 10.6 : 11.6,
        compareLabelSize: compact ? 9.8 : 10.8,
        edgePrimary: compact ? 2.1 : 2.4,
        edgeSecondary: compact ? 1.55 : 1.8,
        edgeLearning: compact ? 1.75 : 2.05,
        learningArc: learningArc,
        feedbackArc: feedbackArc,
        allowArcOverflowX: allowArcOverflowX,
        pulseRadius: compact ? 3.2 : 3.8
      };
    }

    function fitHeaderLabel(text) {
      return text || '';
    }

    function measureSvgTextLength(textEl, text) {
      var probe = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
      probe.textContent = text;
      textEl.appendChild(probe);
      var width = 0;
      try {
        width = probe.getComputedTextLength();
      } catch (error) {
        width = 0;
      }
      textEl.removeChild(probe);
      return width;
    }

    function truncateTextWithEllipsis(textEl, text, maxWidth) {
      var full = String(text || '').trim();
      if (!full) return '';

      if (measureSvgTextLength(textEl, full) <= maxWidth) return full;
      var ellipsis = '\u2026';
      var candidate = full;
      while (candidate.length > 1) {
        candidate = candidate.slice(0, -1).trimEnd();
        var next = candidate + ellipsis;
        if (measureSvgTextLength(textEl, next) <= maxWidth) return next;
      }
      return ellipsis;
    }

    function wrapNodeLabelLines(textEl, text, maxWidth, lineHeight, maxLines) {
      textEl.textContent = '';
      var words = String(text || '').trim().split(/\s+/).filter(Boolean);
      if (!words.length) return;

      var lines = [];
      var current = '';

      words.forEach(function(word) {
        var probeLine = current ? (current + ' ' + word) : word;
        if (!current || measureSvgTextLength(textEl, probeLine) <= maxWidth) {
          current = probeLine;
          return;
        }

        lines.push(current);
        current = word;
      });

      if (current) lines.push(current);

      if (lines.length > maxLines) {
        var allowed = lines.slice(0, maxLines);
        var overflowText = lines.slice(maxLines - 1).join(' ');
        allowed[maxLines - 1] = truncateTextWithEllipsis(textEl, overflowText, maxWidth);
        lines = allowed;
      }

      var xValue = textEl.getAttribute('x') || '0';
      var firstDy = lines.length === 1 ? 0 : -((lines.length - 1) * lineHeight) / 2;

      lines.forEach(function(line, index) {
        var tspan = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
        tspan.setAttribute('x', xValue);
        tspan.setAttribute('dy', String(index === 0 ? firstDy : lineHeight));
        tspan.textContent = line;
        textEl.appendChild(tspan);

        try {
          if (tspan.getComputedTextLength() > maxWidth) {
            tspan.textContent = truncateTextWithEllipsis(textEl, line, maxWidth);
          }
        } catch (error) {
          // Ignore measurement issues in browsers that fail SVG text metrics during init.
        }
      });
    }

    function fitNodeLabelsToWidth(labelSel, layout) {
      var maxLabelWidth = Math.max(24, layout.nodeWidth - (layout.compact ? 16 : 20));
      var maxLines = Number.isFinite(layout.nodeLabelMaxLines) && layout.nodeLabelMaxLines > 0
        ? Math.floor(layout.nodeLabelMaxLines)
        : 2;

      labelSel.each(function() {
        var labelNode = this;
        var baseText = labelNode.getAttribute('data-label-full') || labelNode.textContent || '';
        var baseFont = parseFloat(labelNode.getAttribute('data-base-font-u') || labelNode.getAttribute('font-size') || '0');
        if (!(baseFont > 0)) {
          baseFont = layout.compact ? 10.8 : 11.2;
        }

        labelNode.setAttribute('font-size', String(baseFont));
        labelNode.removeAttribute('textLength');
        labelNode.removeAttribute('lengthAdjust');
        wrapNodeLabelLines(labelNode, baseText, maxLabelWidth, baseFont * 1.06, maxLines);
      });
    }

    function scheduleNodeLabelFit(labelSel, layout, renderStamp, getCurrentRenderStamp) {
      var renderStampReader = typeof getCurrentRenderStamp === 'function'
        ? getCurrentRenderStamp
        : function() {
          return renderStamp;
        };

      var runFit = function() {
        if (renderStamp !== renderStampReader()) return;
        fitNodeLabelsToWidth(labelSel, layout);
      };

      runFit();

      if (typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function') {
        window.requestAnimationFrame(runFit);
      }

      if (typeof window !== 'undefined') {
        window.setTimeout(runFit, 140);
      }

      if (
        typeof document !== 'undefined' &&
        document.fonts &&
        document.fonts.ready &&
        typeof document.fonts.ready.then === 'function'
      ) {
        document.fonts.ready.then(runFit).catch(function() {
          // Ignore font readiness errors; immediate fit already applied.
        });
      }
    }

    function wrapTextToWidth(textEl, text, maxWidth, lineHeight, options) {
      options = options || {};
      var applyLengthAdjust = options.applyLengthAdjust !== false;
      textEl.textContent = '';

      var raw = String(text || '').trim();
      if (!raw) return;
      var explicitLines = raw.indexOf('\n') > -1
        ? raw.split(/\n+/).map(function(line) { return line.trim(); }).filter(Boolean)
        : null;
      if (explicitLines && explicitLines.length) {
        var explicitX = textEl.getAttribute('x') || '0';
        explicitLines.forEach(function(line, index) {
          var explicitTspan = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
          explicitTspan.setAttribute('x', explicitX);
          explicitTspan.setAttribute('dy', index === 0 ? '0' : String(lineHeight));
          explicitTspan.textContent = line;
          textEl.appendChild(explicitTspan);
        });
        return;
      }

      var words = raw.split(/\s+/).filter(Boolean);
      if (!words.length) return;

      var probe = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
      textEl.appendChild(probe);

      var lines = [];
      var lineWords = [];

      words.forEach(function(word) {
        lineWords.push(word);
        probe.textContent = lineWords.join(' ');

        var tooWide = false;
        try {
          tooWide = probe.getComputedTextLength() > maxWidth;
        } catch (error) {
          tooWide = false;
        }

        if (tooWide && lineWords.length > 1) {
          lineWords.pop();
          lines.push(lineWords.join(' '));
          lineWords = [word];
          probe.textContent = lineWords.join(' ');
        }
      });

      if (lineWords.length) lines.push(lineWords.join(' '));
      textEl.removeChild(probe);

      var xValue = textEl.getAttribute('x') || '0';
      lines.forEach(function(line, index) {
        var tspan = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
        tspan.setAttribute('x', xValue);
        tspan.setAttribute('dy', index === 0 ? '0' : String(lineHeight));
        tspan.textContent = line;
        textEl.appendChild(tspan);

        try {
          if (applyLengthAdjust && tspan.getComputedTextLength() > maxWidth) {
            tspan.setAttribute('lengthAdjust', 'spacingAndGlyphs');
            tspan.setAttribute('textLength', String(maxWidth));
          }
        } catch (error) {
          // Ignore measurement issues in browsers that fail SVG text metrics during init.
        }
      });
    }

    function getTextBox(textEl) {
      try {
        return textEl.getBBox();
      } catch (error) {
        return null;
      }
    }

    function comparisonRowY(row, nodeById) {
      var anchor = nodeById[row.anchorId];
      if (!anchor) return 0;

      var lanePrefix = anchor.id ? anchor.id.charAt(0) : '';
      var forward = nodeById[lanePrefix + String(anchor.step + 1)];
      if (forward) return ((anchor.y + forward.y) / 2) + (Number(row.yOffset) || 0);

      var backward = nodeById[lanePrefix + String(anchor.step - 1)];
      if (backward) return ((anchor.y + backward.y) / 2) + (Number(row.yOffset) || 0);

      return anchor.y + (Number(row.yOffset) || 0);
    }

    function readTypographySize(typography, key, fallback) {
      if (!typography || typeof typography !== 'object') return fallback;
      var value = typography[key];
      if (!Number.isFinite(value) || value <= 0) return fallback;
      return value;
    }

    function layoutComparisonLabels(labelSel, layout, nodeById, compareLineStart, compareLineEnd, typography) {
      var COLORS = getColors();
      var fontSize = readTypographySize(typography, 'compareFontU', layout.compareLabelSize || (layout.compact ? 11.5 : 12.5));
      var minVerticalGap = layout.compact ? 4 : 5;
      var laneSpan = compareLineEnd - compareLineStart;
      var compareCenterX = compareLineStart + (laneSpan / 2);
      var maxLabelWidth = clamp(
        laneSpan - 2,
        42,
        layout.compact ? 340 : 380
      );
      if (maxLabelWidth < 84) fontSize *= 0.9;
      if (maxLabelWidth < 64) fontSize *= 0.88;

      function rowFontSize(row) {
        var rowScale = clamp(Number(row && row.fontScale) || 1, 0.72, 1.2);
        return fontSize * rowScale;
      }

      labelSel
        .attr('x', compareCenterX)
        .attr('y', function(row) {
          return comparisonRowY(row, nodeById);
        })
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .attr('font-size', function(row) {
          return rowFontSize(row);
        })
        .attr('font-family', 'var(--mono)')
        .attr('fill', COLORS.muted);

      labelSel.each(function(row) {
        wrapTextToWidth(this, row.text, maxLabelWidth, rowFontSize(row) * 1.3, { applyLengthAdjust: false });
      });

      var previousBottom = -Infinity;
      labelSel
        .sort(function(a, b) {
          return comparisonRowY(a, nodeById) - comparisonRowY(b, nodeById);
        })
        .each(function(row) {
          var textEl = this;
          var baseY = comparisonRowY(row, nodeById);
          textEl.setAttribute('y', String(baseY));

          var box = getTextBox(textEl);
          if (!box) return;

          if (box.y < previousBottom + minVerticalGap) {
            var shiftDown = (previousBottom + minVerticalGap) - box.y;
            textEl.setAttribute('y', String(baseY + shiftDown));
            box = getTextBox(textEl);
          }

          if (box) previousBottom = box.y + box.height;
        });
    }

    function renderComparisonHighlights(highlightLayer, labelSel) {
      var COLORS = getColors();
      var marks = [];

      labelSel.each(function(row) {
        var textEl = this;
        var tspans = Array.prototype.slice.call(textEl.querySelectorAll('tspan'));
        if (!tspans.length) {
          var loneBox = getTextBox(textEl);
          if (!loneBox) return;
          marks.push({
            id: row.anchorId + '-line-0',
            x: loneBox.x - 2.8,
            y: loneBox.y - 1.4,
            width: loneBox.width + 5.6,
            height: loneBox.height + 2.8
          });
          return;
        }

        tspans.forEach(function(tspan, idx) {
          var lineBox = getTextBox(tspan);
          if (!lineBox) return;
          marks.push({
            id: row.anchorId + '-line-' + String(idx),
            x: lineBox.x - 2.8,
            y: lineBox.y - 1.4,
            width: lineBox.width + 5.6,
            height: lineBox.height + 2.8
          });
        });
      });

      highlightLayer.selectAll('.mix-map-compare-highlight')
        .data(marks, function(mark) {
          return mark.id;
        })
        .join('rect')
        .attr('class', 'mix-map-compare-highlight')
        .attr('x', function(mark) {
          return mark.x;
        })
        .attr('y', function(mark) {
          return mark.y;
        })
        .attr('width', function(mark) {
          return mark.width;
        })
        .attr('height', function(mark) {
          return mark.height;
        })
        .attr('rx', 0)
        .attr('ry', 0)
        .attr('stroke', 'color-mix(in srgb, ' + COLORS.gold + ' 44%, transparent 56%)')
        .attr('stroke-width', 0.3)
        .attr('fill', 'color-mix(in srgb, ' + COLORS.gold + ' 24%, transparent 76%)')
        .attr('opacity', 0.62);
    }

    function layoutLaneHeaderText(titleSel, subtitleSel, layout, laneTitle, laneSubtitle, typography) {
      var laneTextWidth = clamp(
        layout.laneGap - (layout.compact ? 18 : 26),
        layout.compact ? 88 : 112,
        layout.compact ? 154 : 236
      );
      var laneCenterX = Number.parseFloat(titleSel.attr('x'));
      if (!Number.isFinite(laneCenterX)) laneCenterX = layout.width / 2;
      var laneLeftX = laneCenterX - (laneTextWidth / 2);
      var titleSizeBase = readTypographySize(typography, 'laneTitleFontU', layout.laneTitleSize);
      var subtitleSizeBase = readTypographySize(typography, 'laneSubtitleFontU', layout.laneSubtitleSize);

      var scale = 1;
      for (var attempt = 0; attempt < 4; attempt += 1) {
        var titleSize = titleSizeBase * 1.08 * scale;
        var subtitleSize = subtitleSizeBase * scale;
        var titleLineHeight = titleSize * 1.18;
        var subtitleLineHeight = subtitleSize * 1.32;

        titleSel
          .attr('x', laneLeftX)
          .attr('text-anchor', 'start')
          .attr('font-size', titleSize);
        titleSel.each(function() {
          wrapTextToWidth(this, laneTitle, laneTextWidth, titleLineHeight);
        });

        var titleBox = getTextBox(titleSel.node());
        var subtitleY = titleBox
          ? (titleBox.y + titleBox.height + Math.max(8, subtitleSize * 0.9))
          : 78;

        subtitleSel
          .attr('x', laneLeftX)
          .attr('text-anchor', 'start')
          .attr('font-size', subtitleSize)
          .attr('y', subtitleY);
        subtitleSel.each(function() {
          wrapTextToWidth(this, laneSubtitle, laneTextWidth, subtitleLineHeight);
        });

        var subtitleBox = getTextBox(subtitleSel.node());
        var overlapsTitle = !!(titleBox && subtitleBox && subtitleBox.y < (titleBox.y + titleBox.height + 1));
        var spillsIntoNodes = !!(subtitleBox && (subtitleBox.y + subtitleBox.height > layout.topY - 12));

        if (!overlapsTitle && !spillsIntoNodes) break;
        scale *= 0.9;
      }
    }

    return {
      getLayout: getLayout,
      fitHeaderLabel: fitHeaderLabel,
      scheduleNodeLabelFit: scheduleNodeLabelFit,
      comparisonRowY: comparisonRowY,
      layoutComparisonLabels: layoutComparisonLabels,
      renderComparisonHighlights: renderComparisonHighlights,
      layoutLaneHeaderText: layoutLaneHeaderText
    };
  }

  return {
    createLayoutUtils: createLayoutUtils
  };
}));
