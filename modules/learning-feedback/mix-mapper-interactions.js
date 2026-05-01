'use strict';

(function initMixMapperInteractions(root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
    return;
  }
  root.MixMapperInteractions = factory();
}(typeof globalThis !== 'undefined' ? globalThis : this, function buildMixMapperInteractions() {
  function createInteractionBindings(deps) {
    deps = deps || {};
    var getMode = deps.getMode || function() {
      return 'all';
    };
    var getLinkMode = deps.getLinkMode || function(_link, fallbackMode) {
      return fallbackMode || getMode();
    };
    var showTooltip = deps.showTooltip || function() {};
    var hideTooltip = deps.hideTooltip || function() {};
    var linkTooltipHtml = deps.linkTooltipHtml || function() {
      return '';
    };
    var linkAriaLabel = deps.linkAriaLabel || function() {
      return '';
    };
    var tooltipHtml = deps.tooltipHtml || function() {
      return '';
    };
    var highlightNode = deps.highlightNode || function() {};
    var clearHighlight = deps.clearHighlight || function() {};
    var highlightLink = deps.highlightLink || function() {};
    var clearLinkHighlight = deps.clearLinkHighlight || function() {};
    var dotTooltipHtml = deps.dotTooltipHtml || function() {
      return '';
    };

    function updateLinkAriaLabels(state, mode) {
      if (!state || !state.nodeById) return;
      var activeMode = mode || getMode();
      if (state.linkSel) {
        state.linkSel.attr('aria-label', function(link) {
          return linkAriaLabel(link, getLinkMode(link, activeMode), state.nodeById);
        });
      }
      if (state.linkHitSel) {
        state.linkHitSel.attr('aria-label', function(link) {
          return linkAriaLabel(link, getLinkMode(link, activeMode), state.nodeById);
        });
      }
    }

    function bindLinkInteractions(selection, nodeById) {
      selection
        .attr('role', 'button')
        .attr('tabindex', 0)
        .attr('aria-label', function(link) {
          var modeForLink = getLinkMode(link, getMode());
          return linkAriaLabel(link, modeForLink, nodeById);
        })
        .on('mousemove', function(event, link) {
          var modeForLink = getLinkMode(link, getMode());
          showTooltip(linkTooltipHtml(link, modeForLink, nodeById), event.clientX, event.clientY);
        })
        .on('mouseenter', function(event, link) {
          highlightLink(link);
          var modeForLink = getLinkMode(link, getMode());
          showTooltip(linkTooltipHtml(link, modeForLink, nodeById), event.clientX, event.clientY);
        })
        .on('mouseleave', function() {
          clearLinkHighlight();
          hideTooltip();
        })
        .on('focus', function(event, link) {
          highlightLink(link);
          var box = this.getBoundingClientRect();
          var modeForLink = getLinkMode(link, getMode());
          showTooltip(
            linkTooltipHtml(link, modeForLink, nodeById),
            box.left + (box.width / 2),
            box.top + Math.max(10, box.height / 2),
            { anchorMode: 'focus' }
          );
        })
        .on('blur', function() {
          clearLinkHighlight();
          hideTooltip();
        })
        .on('keydown', function(event, link) {
          if (event.key === 'Escape') {
            hideTooltip();
            this.blur();
            return;
          }
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            var box = this.getBoundingClientRect();
            var modeForLink = getLinkMode(link, getMode());
            showTooltip(
              linkTooltipHtml(link, modeForLink, nodeById),
              box.left + (box.width / 2),
              box.top + Math.max(10, box.height / 2),
              { anchorMode: 'focus' }
            );
          }
        })
        .on('click', function(event, link) {
          var modeForLink = getLinkMode(link, getMode());
          showTooltip(linkTooltipHtml(link, modeForLink, nodeById), event.clientX, event.clientY);
        });
    }

    function bindNodeInteractions(selection) {
      selection
        .on('mousemove', function(event, node) {
          showTooltip(tooltipHtml(node), event.clientX, event.clientY);
        })
        .on('mouseenter', function(event, node) {
          var path = this.querySelector('path');
          if (path) path.style.setProperty('fill', 'color-mix(in srgb, var(--viz-ink, #2A2018) 38%, var(--paper, #FAF8F1) 62%)');
          highlightNode(node.id);
          showTooltip(tooltipHtml(node), event.clientX, event.clientY);
        })
        .on('mouseleave', function() {
          var path = this.querySelector('path');
          if (path) path.style.removeProperty('fill');
          hideTooltip();
          clearHighlight();
        })
        .on('focus', function(event, node) {
          var path = this.querySelector('path');
          if (path) path.style.setProperty('fill', 'color-mix(in srgb, var(--viz-ink, #2A2018) 38%, var(--paper, #FAF8F1) 62%)');
          var box = this.getBoundingClientRect();
          highlightNode(node.id);
          showTooltip(tooltipHtml(node), box.left + (box.width / 2), box.top + 8, { anchorMode: 'focus' });
        })
        .on('blur', function() {
          var path = this.querySelector('path');
          if (path) path.style.removeProperty('fill');
          hideTooltip();
          clearHighlight();
        })
        .on('keydown', function(event, node) {
          if (event.key === 'Escape') {
            hideTooltip();
            clearHighlight();
            this.blur();
            return;
          }
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            var box = this.getBoundingClientRect();
            highlightNode(node.id);
            showTooltip(tooltipHtml(node), box.left + (box.width / 2), box.top + 8, { anchorMode: 'focus' });
          }
        });
    }

    function bindDotInteractions(selection) {
      selection
        .on('mouseenter', function(event, row) {
          if (this.parentNode) this.parentNode.classList.add('is-highlighted');
          showTooltip(dotTooltipHtml(row), event.clientX, event.clientY);
        })
        .on('mousemove', function(event, row) {
          showTooltip(dotTooltipHtml(row), event.clientX, event.clientY);
        })
        .on('mouseleave', function() {
          if (this.parentNode) this.parentNode.classList.remove('is-highlighted');
          hideTooltip();
        })
        .on('focus', function(event, row) {
          if (this.parentNode) this.parentNode.classList.add('is-highlighted');
          var box = this.getBoundingClientRect();
          showTooltip(
            dotTooltipHtml(row),
            box.left + (box.width / 2),
            box.top + (box.height / 2),
            { anchorMode: 'focus' }
          );
        })
        .on('blur', function() {
          if (this.parentNode) this.parentNode.classList.remove('is-highlighted');
          hideTooltip();
        })
        .on('click', function(event, row) {
          showTooltip(dotTooltipHtml(row), event.clientX, event.clientY);
        })
        .on('keydown', function(event, row) {
          if (event.key === 'Escape') {
            hideTooltip();
            return;
          }
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            var box = this.getBoundingClientRect();
            showTooltip(
              dotTooltipHtml(row),
              box.left + (box.width / 2),
              box.top + (box.height / 2),
              { anchorMode: 'focus' }
            );
          }
        });
    }

    function resolveNextMode(currentMode, requestedMode) {
      if (!requestedMode) return currentMode || 'all';
      return requestedMode === currentMode ? 'all' : requestedMode;
    }

    function bindModeButtons(modeButtons, onModeSelected, options) {
      options = options || {};
      var getCurrentMode = typeof options.getMode === 'function'
        ? options.getMode
        : function() {
          return 'all';
        };

      modeButtons.forEach(function(button) {
        if (!button || typeof button.addEventListener !== 'function') return;
        if (
          button.__mixMapperModeClickHandler &&
          typeof button.removeEventListener === 'function'
        ) {
          button.removeEventListener('click', button.__mixMapperModeClickHandler);
        }

        var onClick = function() {
          var requestedMode = button.getAttribute('data-mode');
          if (!requestedMode) return;
          var nextMode = resolveNextMode(getCurrentMode(), requestedMode);
          onModeSelected(nextMode, requestedMode);
        };

        button.__mixMapperModeClickHandler = onClick;
        button.addEventListener('click', onClick);
      });
    }

    return {
      updateLinkAriaLabels: updateLinkAriaLabels,
      bindLinkInteractions: bindLinkInteractions,
      bindNodeInteractions: bindNodeInteractions,
      bindDotInteractions: bindDotInteractions,
      bindModeButtons: bindModeButtons,
      resolveNextMode: resolveNextMode
    };
  }

  return {
    createInteractionBindings: createInteractionBindings
  };
}));
