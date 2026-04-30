/* Shared UI helpers for Garbage Can pages (assess, explorer). */

function centerSimulationCanvasInViewport() {
  var canvas = document.getElementById('viz-svg');
  if (!canvas || typeof canvas.getBoundingClientRect !== 'function') return;
  var rect = canvas.getBoundingClientRect();
  var canvasCenterY = rect.top + window.pageYOffset + (rect.height / 2);
  var viewportCenterY = (window.innerHeight || document.documentElement.clientHeight || 0) / 2;
  var targetY = Math.max(0, canvasCenterY - viewportCenterY);
  window.scrollTo({ top: targetY, behavior: 'smooth' });
}
