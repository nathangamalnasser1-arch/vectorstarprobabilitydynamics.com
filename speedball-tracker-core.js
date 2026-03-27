/**
 * Shared logic for speedball-tracker (Node tests + browser).
 * One punch cycle = 2 platform taps + glove contact → 3 scored hits.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.SpeedballCore = factory();
  }
})(typeof self !== 'undefined' ? self : this, function speedballCoreFactory() {
  var HITS_PER_PUNCH = 3;
  /** Min ms between counted punches (merges triple-tap from one strike). */
  var MIN_PUNCH_GAP_MS = 300;
  var BPM_WINDOW_MS = 6000;
  var BPM_RECENT_MS = 10000;

  /**
   * High-frequency energy ratio (rough voice / noise rejection).
   * freqBytes: Uint8Array from AnalyserNode.getByteFrequencyData (0–255).
   */
  function impactEnergyRatio(freqBytes, sampleRate, fftSize) {
    if (!freqBytes || !freqBytes.length || !sampleRate || !fftSize) return 0;
    var n = freqBytes.length;
    var binHz = sampleRate / fftSize;
    /** Energy from ~2.2 kHz upward (slaps, board, less vowel fundamental). */
    var start = Math.min(n - 1, Math.max(1, Math.floor(2200 / binHz)));
    var low = 0;
    var high = 0;
    for (var i = 0; i < n; i++) {
      var v = freqBytes[i];
      var e = v * v;
      if (i >= start) high += e;
      else low += e;
    }
    var t = low + high + 1e-6;
    return high / t;
  }

  /**
   * Minimum impact ratio for a hit; scales with sensitivity 1–100 (higher sens = accept quieter impacts).
   */
  function minImpactRatioForSensitivity(sens) {
    var s = Math.max(1, Math.min(100, sens));
    return 0.06 + (1 - s / 100) * 0.26;
  }

  function calcBpmFromPunches(punchTimes, now, windowMs) {
    var w = windowMs != null ? windowMs : BPM_WINDOW_MS;
    var t = now != null ? now : Date.now();
    var recent = punchTimes.filter(function (x) {
      return t - x < w;
    });
    if (recent.length < 2) return recent.length > 0 ? 0 : 0;
    var span = (recent[recent.length - 1] - recent[0]) / 1000;
    if (span <= 0) return 0;
    return Math.round(((recent.length - 1) / span) * 60 * HITS_PER_PUNCH);
  }

  function trimPunchTimes(punchTimes, now, keepMs) {
    var k = keepMs != null ? keepMs : BPM_RECENT_MS;
    var t = now != null ? now : Date.now();
    return punchTimes.filter(function (x) {
      return t - x < k;
    });
  }

  return {
    HITS_PER_PUNCH: HITS_PER_PUNCH,
    MIN_PUNCH_GAP_MS: MIN_PUNCH_GAP_MS,
    BPM_WINDOW_MS: BPM_WINDOW_MS,
    BPM_RECENT_MS: BPM_RECENT_MS,
    impactEnergyRatio: impactEnergyRatio,
    minImpactRatioForSensitivity: minImpactRatioForSensitivity,
    calcBpmFromPunches: calcBpmFromPunches,
    trimPunchTimes: trimPunchTimes,
  };
});
