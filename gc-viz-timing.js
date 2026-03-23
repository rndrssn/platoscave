'use strict';

(function(factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
    return;
  }
  if (typeof window !== 'undefined') {
    window.GcVizTiming = factory();
  }
})(function createGcVizTiming() {
  const TIMING = {
    legendLeadMs: 220,
    openingLeadMs: 220,
    finalPauseMs: 1100,
    minTickMs: 1600,
    maxTickMs: 3600,
    motionFraction: 0.72,
    eventPauseMs: 460,
    densitySlowMs: 340,
    densityFastMs: -80,
    deadTickFastMs: -120,
    resolvePauseMs: 820,
    enteringPauseMs: 760,
    enteringDensityPauseMs: 120,
    enteringDensityPauseCapMs: 420,
    searchingPauseMs: 520,
    baseEarlyMs: 2600,
    baseMidMs: 2250,
    baseLateMs: 1850,
  };

  function computeTickTiming(iterTick, analysis, timingOverride) {
    const t = timingOverride || TIMING;
    var base = t.baseLateMs;
    if (iterTick <= 5) base = t.baseEarlyMs;
    else if (iterTick <= 10) base = t.baseMidMs;

    var adjusted = base;
    if (analysis.density >= 0.45) adjusted += t.densitySlowMs;
    else if (analysis.density <= 0.08) adjusted += t.densityFastMs;
    if (analysis.eventful) adjusted += t.eventPauseMs;
    if (analysis.hasResolution) adjusted += t.resolvePauseMs;
    if (analysis.hasEntering) adjusted += t.enteringPauseMs;
    if (analysis.enteringCount > 1) {
      adjusted += Math.min(
        t.enteringDensityPauseCapMs,
        (analysis.enteringCount - 1) * t.enteringDensityPauseMs
      );
    }
    if (analysis.hasSearching) adjusted += t.searchingPauseMs;
    if (analysis.isDead) adjusted += t.deadTickFastMs;

    var tickMs = Math.max(t.minTickMs, Math.min(t.maxTickMs, adjusted));
    var motionMs = Math.max(360, Math.round(tickMs * t.motionFraction));
    return { tickMs, motionMs };
  }

  return {
    TIMING,
    computeTickTiming,
  };
});
