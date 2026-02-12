/**
 * Unit tests for experiment logic (grouping by event_index, scalar probability, vector field).
 * Run with Node: node tests/experiment.test.js
 * No DOM required; uses mock data.
 */

(function () {
  'use strict';

  var passed = 0;
  var failed = 0;

  function assert(condition, message) {
    if (condition) {
      passed++;
      console.log('  OK: ' + message);
    } else {
      failed++;
      console.log('  FAIL: ' + message);
    }
  }

  function assertEqual(a, b, message) {
    var ok = a === b;
    if (ok) {
      passed++;
      console.log('  OK: ' + message);
    } else {
      failed++;
      console.log('  FAIL: ' + message + ' (expected ' + b + ', got ' + a + ')');
    }
  }

  function assertInRange(x, lo, hi, message) {
    var ok = x >= lo && x <= hi;
    if (ok) {
      passed++;
      console.log('  OK: ' + message);
    } else {
      failed++;
      console.log('  FAIL: ' + message + ' (value ' + x + ' not in [' + lo + ',' + hi + '])');
    }
  }

  // --- Pure logic (same as in experiment.js) ---
  function groupByEventIndex(raw) {
    var byEvent = {};
    for (var i = 0; i < raw.length; i++) {
      var ei = raw[i].event_index;
      if (!byEvent[ei]) byEvent[ei] = [];
      byEvent[ei].push(raw[i]);
    }
    var events = [];
    var keys = Object.keys(byEvent).map(Number).sort(function (a, b) { return a - b; });
    for (var k = 0; k < keys.length; k++) {
      events.push({ event_index: keys[k], particles: byEvent[keys[k]] });
    }
    var maxEventIndex = keys.length ? keys[keys.length - 1] : 0;
    return { events: events, maxEventIndex: maxEventIndex };
  }

  function getParticlesAtEvent(events, idx) {
    for (var i = 0; i < events.length; i++) {
      if (events[i].event_index === idx) return events[i].particles;
    }
    return [];
  }

  function scalarProbability(particle) {
    var e = Math.max(0.1, particle.energy);
    var norm = 3;
    var rho = e / norm;
    return Math.min(1, rho);
  }

  function getVectorAt(gridX, gridY, particles, cellHalf) {
    if (!particles.length) return { vx: 0, vy: 0, mag: 0 };
    cellHalf = cellHalf || 0.5;
    var vx = 0, vy = 0, count = 0;
    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      if (Math.abs(p.x - gridX) <= cellHalf && Math.abs(p.y - gridY) <= cellHalf) {
        vx += p.px;
        vy += p.py;
        count++;
      }
    }
    if (count === 0) return { vx: 0, vy: 0, mag: 0 };
    vx /= count;
    vy /= count;
    var mag = Math.sqrt(vx * vx + vy * vy) || 1e-6;
    return { vx: vx, vy: vy, mag: mag };
  }

  // --- Tests ---
  var mockData = [
    { event_index: 0, x: 0, y: 0, px: 1, py: 0, energy: 2 },
    { event_index: 0, x: 1, y: 1, px: -1, py: 0, energy: 1.5 },
    { event_index: 1, x: 0.5, y: 0.5, px: 0, py: 1, energy: 3 }
  ];

  console.log('Experiment logic unit tests\n');

  console.log('groupByEventIndex');
  var result = groupByEventIndex(mockData);
  assert(result.events.length >= 1, 'events array non-empty');
  assertEqual(getParticlesAtEvent(result.events, 0).length, 2, 'event 0 has 2 particles');
  assertEqual(getParticlesAtEvent(result.events, 1).length, 1, 'event 1 has 1 particle');
  assertEqual(getParticlesAtEvent(result.events, 2).length, 0, 'event 2 has 0 particles');
  assertEqual(result.maxEventIndex, 1, 'maxEventIndex is 1');

  console.log('\nscalarProbability');
  var rho = scalarProbability(mockData[0]);
  assertInRange(rho, 0, 1, 'scalar probability in [0,1]');
  assert(scalarProbability({ energy: 0.1 }) > 0, 'small energy gives positive rho');

  console.log('\ngetVectorAt');
  var particles0 = getParticlesAtEvent(result.events, 0);
  var vec = getVectorAt(0, 0, particles0, 0.6);
  assert(typeof vec.vx === 'number' && typeof vec.vy === 'number' && typeof vec.mag === 'number', 'returns vx, vy, mag');
  assert(vec.mag >= 0, 'magnitude non-negative');
  var vecEmpty = getVectorAt(10, 10, particles0, 0.5);
  assertEqual(vecEmpty.mag, 0, 'empty cell has zero magnitude');

  console.log('\n--- ' + passed + ' passed, ' + failed + ' failed ---');
  process.exit(failed > 0 ? 1 : 0);
})();
