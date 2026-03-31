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

    function updateLinkAriaLabels(state, mode) {
      if (!state || !state.nodeById) return;
      var activeMode = mode || getMode();
      if (state.linkSel) {
        state.linkSel.attr('aria-label', function(link) {
          return linkAriaLabel(link, activeMode, state.nodeById);
        });
      }
      if (state.linkHitSel) {
        state.linkHitSel.attr('aria-label', function(link) {
          return linkAriaLabel(link, activeMode, state.nodeById);
        });
      }
    }

    function bindLinkInteractions(selection, nodeById) {
      selection
        .attr('role', 'button')
        .attr('tabindex', 0)
        .attr('aria-label', function(link) {
          return linkAriaLabel(link, getMode(), nodeById);
        })
        .on('mousemove', function(event, link) {
          showTooltip(linkTooltipHtml(link, getMode(), nodeById), event.clientX, event.clientY);
        })
        .on('mouseenter', function(event, link) {
          showTooltip(linkTooltipHtml(link, getMode(), nodeById), event.clientX, event.clientY);
        })
        .on('mouseleave', function() {
          hideTooltip();
        })
        .on('focus', function(event, link) {
          var box = this.getBoundingClientRect();
          showTooltip(
            linkTooltipHtml(link, getMode(), nodeById),
            box.left + (box.width / 2),
            box.top + Math.max(10, box.height / 2),
            { anchorMode: 'focus' }
          );
        })
        .on('blur', function() {
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
            showTooltip(
              linkTooltipHtml(link, getMode(), nodeById),
              box.left + (box.width / 2),
              box.top + Math.max(10, box.height / 2),
              { anchorMode: 'focus' }
            );
          }
        })
        .on('click', function(event, link) {
          showTooltip(linkTooltipHtml(link, getMode(), nodeById), event.clientX, event.clientY);
        });
    }

    function bindNodeInteractions(selection) {
      selection
        .on('mousemove', function(event, node) {
          showTooltip(tooltipHtml(node), event.clientX, event.clientY);
        })
        .on('mouseenter', function(event, node) {
          highlightNode(node.id);
          showTooltip(tooltipHtml(node), event.clientX, event.clientY);
        })
        .on('mouseleave', function() {
          hideTooltip();
          clearHighlight();
        })
        .on('focus', function(event, node) {
          var box = this.getBoundingClientRect();
          highlightNode(node.id);
          showTooltip(tooltipHtml(node), box.left + (box.width / 2), box.top + 8, { anchorMode: 'focus' });
        })
        .on('blur', function() {
          hideTooltip();
          clearHighlight();
        })
        .on('keydown', function(event) {
          if (event.key === 'Escape') {
            hideTooltip();
            clearHighlight();
            this.blur();
          }
        });
    }

    function bindModeButtons(modeButtons, onModeSelected) {
      modeButtons.forEach(function(button) {
        button.addEventListener('click', function() {
          var nextMode = button.getAttribute('data-mode');
          if (!nextMode) return;
          onModeSelected(nextMode);
        });
      });
    }

    return {
      updateLinkAriaLabels: updateLinkAriaLabels,
      bindLinkInteractions: bindLinkInteractions,
      bindNodeInteractions: bindNodeInteractions,
      bindModeButtons: bindModeButtons
    };
  }

  return {
    createInteractionBindings: createInteractionBindings
  };
}));
