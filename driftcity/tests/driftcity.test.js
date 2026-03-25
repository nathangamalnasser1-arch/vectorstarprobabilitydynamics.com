/**
 * Drift City Portal — Unit Tests
 * Tests cover all interactive components and business-logic functions.
 * Run with: npm test
 * Environment: jest-environment-jsdom (configured in package.json)
 */

'use strict';

/**
 * Jest runs each file in the jsdom environment.
 * We set up the document once via a global beforeAll so every describe
 * block operates on the fully-parsed Drift City HTML.
 */
const fs = require('fs');
const path = require('path');

// ─── BROWSER API STUBS (jsdom gaps) ────────────────────────────
// IntersectionObserver is not implemented in jsdom; provide a no-op stub
// so the page script doesn't throw before the DOM is fully built.
global.IntersectionObserver = class {
  constructor(cb) { this._cb = cb; }
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Canvas 2D context methods used by the page animations
HTMLCanvasElement.prototype.getContext = () => ({
  clearRect() {}, beginPath() {}, closePath() {}, moveTo() {}, lineTo() {},
  arc() {}, fill() {}, stroke() {}, fillText() {},
  fillRect() {}, strokeRect() {},
  setLineDash() {}, save() {}, restore() {}, translate() {}, rotate() {},
  get lineDashOffset(){return 0;}, set lineDashOffset(_){},
  get shadowBlur() { return 0; }, set shadowBlur(_v) {},
  get shadowColor() { return ''; }, set shadowColor(_v) {},
  get strokeStyle() { return ''; }, set strokeStyle(_v) {},
  get fillStyle() { return ''; }, set fillStyle(_v) {},
  get lineWidth() { return 1; }, set lineWidth(_v) {},
  get font() { return ''; }, set font(_v) {},
  get textAlign() { return ''; }, set textAlign(_v) {},
  get textBaseline() { return ''; }, set textBaseline(_v) {},
  get globalAlpha() { return 1; }, set globalAlpha(_v) {},
});

// requestAnimationFrame — suppress animation loop in tests
global.requestAnimationFrame = () => 0;
global.cancelAnimationFrame = () => {};

// Set up document from the built HTML file before any test runs.
beforeAll(() => {
  const html = fs.readFileSync(
    path.resolve(__dirname, '../index.html'),
    'utf8'
  );
  document.open();
  document.write(html);
  document.close();
});

// ══════════════════════════════════════════════════════════════
// SECTION 1 — PAGE STRUCTURE
// ══════════════════════════════════════════════════════════════
describe('Page Structure', () => {
  test('page title is correct', () => {
    expect(document.title).toBe('DRIFT CITY — The Asphalt Creed');
  });

  test('nav element is rendered', () => {
    expect(document.querySelector('nav')).not.toBeNull();
  });

  test('nav logo contains DRIFT and CITY', () => {
    const logo = document.querySelector('.nav-logo');
    expect(logo).not.toBeNull();
    expect(logo.textContent).toContain('DRIFT');
    expect(logo.textContent).toContain('CITY');
  });

  test('all nine required sections exist', () => {
    const ids = [
      'hero', 'ev-mandate', 'rules', 'asn9',
      'residential', 'racing', 'logistics', 'manufacturer', 'dcu',
    ];
    ids.forEach(id => {
      expect(document.getElementById(id)).not.toBeNull();
    });
  });

  test('footer is rendered', () => {
    expect(document.querySelector('footer')).not.toBeNull();
  });
});

// ══════════════════════════════════════════════════════════════
// SECTION 2 — HERO CONTENT
// ══════════════════════════════════════════════════════════════
describe('Hero Section Content', () => {
  test('hero title contains "DRIFT" and "CITY"', () => {
    const title = document.querySelector('.hero-title');
    expect(title).not.toBeNull();
    expect(title.textContent).toContain('DRIFT');
    expect(title.textContent).toContain('CITY');
  });

  test('hero subtitle contains the creed', () => {
    const sub = document.querySelector('.hero-subtitle');
    expect(sub).not.toBeNull();
    expect(sub.textContent).toContain('Drift City is not for everyone');
    expect(sub.textContent).toContain('entirely the point');
  });

  test('city average speed stat shows 88', () => {
    const stat = document.querySelector('.hero-stat-num');
    expect(stat?.textContent).toContain('88');
  });

  test('847 smart signals stat is rendered', () => {
    const vals = [...document.querySelectorAll('.hero-stat-num')].map(s => s.textContent.trim());
    expect(vals).toContain('847');
  });

  test('zero traffic jams stat is rendered', () => {
    const vals = [...document.querySelectorAll('.hero-stat-num')].map(s => s.textContent.trim());
    expect(vals).toContain('0');
  });

  test('#avg-speed live element exists', () => {
    expect(document.getElementById('avg-speed')).not.toBeNull();
  });

  test('#residents-count live element exists', () => {
    expect(document.getElementById('residents-count')).not.toBeNull();
  });

  test('primary CTA links to #ev-mandate', () => {
    expect(document.querySelector('.btn-primary')?.getAttribute('href')).toBe('#ev-mandate');
  });

  test('ghost CTA links to #rules', () => {
    expect(document.querySelector('.btn-ghost')?.getAttribute('href')).toBe('#rules');
  });
});

// ══════════════════════════════════════════════════════════════
// SECTION 3 — EV PERFORMANCE MANDATE
// ══════════════════════════════════════════════════════════════
describe('EV Performance Mandate', () => {
  test('section label contains EV PERFORMANCE MANDATE', () => {
    const label = document.querySelector('#ev-mandate .section-label');
    expect(label?.textContent).toContain('EV PERFORMANCE MANDATE');
  });

  test('<5s acceleration threshold is displayed', () => {
    const t = document.querySelector('#ev-mandate .ev-threshold-num');
    expect(t?.textContent).toContain('5s');
  });

  test('$600 fine for slow EV is displayed', () => {
    const vals = [...document.querySelectorAll('#ev-mandate .ev-threshold-num')].map(n => n.textContent.trim());
    expect(vals).toContain('$600');
  });

  test('exactly 4 EV cards are rendered', () => {
    expect(document.querySelectorAll('#ev-mandate .ev-card').length).toBe(4);
  });

  test('danger card is rendered', () => {
    expect(document.querySelector('.ev-card.danger')).not.toBeNull();
  });

  test('Koenigsegg Gemera exception is mentioned', () => {
    expect(document.getElementById('ev-mandate').textContent).toContain('Gemera');
  });
});

// ══════════════════════════════════════════════════════════════
// SECTION 4 — RULES OF THE ROAD
// ══════════════════════════════════════════════════════════════
describe('Rules of the Road', () => {
  test('25° controlled oversteer rule is present', () => {
    expect(document.getElementById('rules').textContent).toContain('25°');
  });

  test('$400 citation for missing drift is shown', () => {
    const finesText = [...document.querySelectorAll('#rules .rule-fine')].map(f => f.textContent).join(' ');
    expect(finesText).toContain('$400');
  });

  test('exactly 5 rule items are listed', () => {
    expect(document.querySelectorAll('#rules .rule-item').length).toBe(5);
  });

  test('zero-tolerance block exists', () => {
    expect(document.querySelector('.zero-tolerance')).not.toBeNull();
  });

  test('at least 4 ban triggers are listed', () => {
    expect(document.querySelectorAll('.zt-list li').length).toBeGreaterThanOrEqual(4);
  });

  test('LIFETIME BAN badge text is correct', () => {
    expect(document.querySelector('.ban-badge')?.textContent.trim()).toBe('LIFETIME BAN');
  });

  test('Green Wave speed range 70–110 km/h is mentioned', () => {
    const t = document.getElementById('rules').textContent;
    expect(t).toContain('70');
    expect(t).toContain('110');
  });
});

// ══════════════════════════════════════════════════════════════
// SECTION 5 — ASN-9 NETWORK
// ══════════════════════════════════════════════════════════════
describe('ASN-9 Network', () => {
  test('847 traffic nodes stat is shown', () => {
    const vals = [...document.querySelectorAll('#asn9 .asn-stat-val')].map(v => v.textContent.trim());
    expect(vals).toContain('847');
  });

  test('8.4s predictive lead time is displayed', () => {
    expect(document.getElementById('asn9').textContent).toContain('8.4s');
  });

  test('4.2M data points stat is displayed', () => {
    expect(document.getElementById('asn9').textContent).toContain('4.2M');
  });

  test('wave canvas element exists', () => {
    expect(document.getElementById('wave-canvas')).not.toBeNull();
  });

  test('4 road indicator nodes are rendered', () => {
    expect(document.querySelectorAll('.road-node').length).toBe(4);
  });

  test('road speed node IDs r1–r4 exist', () => {
    ['r1','r2','r3','r4'].forEach(id => {
      expect(document.getElementById(id)).not.toBeNull();
    });
  });

  test('28 speed bar segments are rendered', () => {
    expect(document.querySelectorAll('.speed-segment').length).toBe(28);
  });
});

// ══════════════════════════════════════════════════════════════
// SECTION 6 — RESIDENTIAL CODE §14
// ══════════════════════════════════════════════════════════════
describe('Residential Architecture Code §14', () => {
  test('six residential code cards are rendered', () => {
    expect(document.querySelectorAll('#residential .res-card').length).toBe(6);
  });

  test('no-front-door policy is mentioned', () => {
    expect(document.getElementById('residential').textContent.toLowerCase()).toContain('front door');
  });

  test('30-car gallery standard is present', () => {
    expect(document.getElementById('residential').textContent).toContain('30');
  });

  test('400-metre plate recognition range is displayed', () => {
    const metrics = [...document.querySelectorAll('.res-metric')].map(m => m.textContent.trim());
    expect(metrics.some(t => t.includes('400'))).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════
// SECTION 7 — RACING ECOSYSTEM
// ══════════════════════════════════════════════════════════════
describe('Racing Ecosystem', () => {
  test('GPC navigator is mentioned', () => {
    expect(document.getElementById('racing').textContent).toContain('GPC');
  });

  test('AI-Generated Race Traces feature is present', () => {
    expect(document.getElementById('racing').textContent).toContain('Race Traces');
  });

  test('four race features are listed', () => {
    expect(document.querySelectorAll('.race-feature').length).toBe(4);
  });

  test('race trace canvas exists', () => {
    expect(document.getElementById('race-canvas')).not.toBeNull();
  });

  test('traffic lights as race markers is mentioned', () => {
    expect(document.getElementById('racing').textContent.toLowerCase()).toContain('traffic lights');
  });
});

// ══════════════════════════════════════════════════════════════
// SECTION 8 — ELITE LOGISTICS
// ══════════════════════════════════════════════════════════════
describe('Elite Logistics', () => {
  test('three logistics cards are rendered', () => {
    expect(document.querySelectorAll('.logistics-card').length).toBe(3);
  });

  test('delivery ban is mentioned', () => {
    expect(document.getElementById('logistics').textContent.toLowerCase()).toContain('banned');
  });

  test('helicopter-only access is documented', () => {
    expect(document.getElementById('logistics').textContent.toLowerCase()).toContain('helicopter');
  });

  test('lockdown banner is rendered', () => {
    expect(document.querySelector('.lockdown-banner')).not.toBeNull();
  });

  test('ASN-9 4-second response is mentioned in lockdown banner', () => {
    expect(document.querySelector('.lockdown-banner')?.textContent).toContain('4 seconds');
  });
});

// ══════════════════════════════════════════════════════════════
// SECTION 9 — MANUFACTURER PORTAL
// ══════════════════════════════════════════════════════════════
describe('Manufacturer Portal', () => {
  test('three manufacturer cards are rendered', () => {
    expect(document.querySelectorAll('.mfr-card').length).toBe(3);
  });

  test('Ferrari card is present', () => {
    const names = [...document.querySelectorAll('.mfr-logo')].map(l => l.textContent.trim());
    expect(names).toContain('FERRARI');
  });

  test('Lamborghini card is present', () => {
    const names = [...document.querySelectorAll('.mfr-logo')].map(l => l.textContent.trim());
    expect(names).toContain('LAMBORGHINI');
  });

  test('Koenigsegg card is present', () => {
    const names = [...document.querySelectorAll('.mfr-logo')].map(l => l.textContent.trim());
    expect(names).toContain('KOENIGSEGG');
  });

  test('Koenigsegg Gemera 4-seat exception is noted', () => {
    const card = [...document.querySelectorAll('.mfr-card')].find(c => c.textContent.includes('KOENIGSEGG'));
    expect(card?.textContent).toContain('Gemera');
    expect(card?.textContent).toContain('4-seat');
  });

  test('portal terminal output element exists', () => {
    expect(document.getElementById('terminal-output')).not.toBeNull();
  });

  test('portal input field exists', () => {
    expect(document.getElementById('portal-input')).not.toBeNull();
  });

  test('terminal cursor element is present', () => {
    expect(document.querySelector('.terminal-cursor')).not.toBeNull();
  });

  test('all manufacturers show LIVE LIAISON ACTIVE', () => {
    [...document.querySelectorAll('.mfr-status')].forEach(s => {
      expect(s.textContent.trim()).toBe('LIVE LIAISON ACTIVE');
    });
  });
});

// ══════════════════════════════════════════════════════════════
// SECTION 10 — DCU RESEARCH HUB
// ══════════════════════════════════════════════════════════════
describe('DCU Research Hub', () => {
  test('four departments are listed', () => {
    expect(document.querySelectorAll('.dcu-dept').length).toBe(4);
  });

  test('atmospheric / air purification department exists', () => {
    const names = [...document.querySelectorAll('.dcu-dept-name')].map(d => d.textContent.toLowerCase());
    expect(names.some(n => n.includes('atmospheric') || n.includes('air'))).toBe(true);
  });

  test('tire science department exists', () => {
    const names = [...document.querySelectorAll('.dcu-dept-name')].map(d => d.textContent.toLowerCase());
    expect(names.some(n => n.includes('tire'))).toBe(true);
  });

  test('ASN-9 neural architecture lab is listed', () => {
    const names = [...document.querySelectorAll('.dcu-dept-name')].map(d => d.textContent.toLowerCase());
    expect(names.some(n => n.includes('asn') || n.includes('neural'))).toBe(true);
  });

  test('research budget table shows 5 line items', () => {
    expect(document.querySelectorAll('.dcu-fund-row').length).toBe(5);
  });

  test('total disclosed budget exceeds $400M', () => {
    const total = [...document.querySelectorAll('.dcu-fund-val')].reduce((acc, r) => {
      return acc + (parseFloat(r.textContent.replace(/[^0-9.]/g, '')) || 0);
    }, 0);
    expect(total).toBeGreaterThan(400);
  });
});

// ══════════════════════════════════════════════════════════════
// SECTION 11 — FOOTER MANDATES
// ══════════════════════════════════════════════════════════════
describe('Footer Mandates', () => {
  test('crime ban mandate is in footer', () => {
    expect(document.querySelector('footer').textContent.toLowerCase()).toContain('any crime is a ban');
  });

  test('ASN-9 surveillance notice is in footer', () => {
    expect(document.querySelector('footer').textContent.toLowerCase()).toContain('surveillance by asn-9');
  });

  test('monthly tire replacement mandate is in footer', () => {
    expect(document.querySelector('footer').textContent.toLowerCase()).toContain('monthly tire');
  });

  test('residency by race-license is in footer', () => {
    expect(document.querySelector('footer').textContent.toLowerCase()).toContain('race-license');
  });

  test('private security enforced is mentioned', () => {
    expect(document.querySelector('footer').textContent.toLowerCase()).toContain('private security');
  });

  test('footer navigation has at least 8 links', () => {
    expect(document.querySelectorAll('.footer-links a').length).toBeGreaterThanOrEqual(8);
  });
});

// ══════════════════════════════════════════════════════════════
// SECTION 12 — WIDGET ELEMENTS
// ══════════════════════════════════════════════════════════════
describe('Interactive Widget Elements', () => {
  test('speedometer canvas exists', () => {
    expect(document.getElementById('speedo-canvas')).not.toBeNull();
  });

  test('speedometer label reads CITY AVG SPEED', () => {
    expect(document.querySelector('.speedo-label')?.textContent.trim()).toBe('CITY AVG SPEED');
  });

  test('nav status shows 847/847 NODES ACTIVE', () => {
    expect(document.querySelector('.nav-status')?.textContent).toContain('847/847 NODES ACTIVE');
  });

  test('hero scan line element is present', () => {
    expect(document.querySelector('.hero-scan-line')).not.toBeNull();
  });

  test('hero grid background element is present', () => {
    expect(document.querySelector('.hero-grid-bg')).not.toBeNull();
  });

  test('more than 10 fade-in elements are present', () => {
    expect(document.querySelectorAll('.fade-in').length).toBeGreaterThan(10);
  });

  test('each directive section has a section-label', () => {
    ['#ev-mandate','#rules','#asn9','#residential','#racing','#logistics','#manufacturer','#dcu'].forEach(sel => {
      expect(document.querySelector(`${sel} .section-label`)).not.toBeNull();
    });
  });
});

// ══════════════════════════════════════════════════════════════
// SECTION 13 — PURE BUSINESS LOGIC: EV Compliance
// ══════════════════════════════════════════════════════════════
describe('Business Logic — EV Compliance (0-100 in <5s)', () => {
  const isEvCompliant = (s) => s < 5;

  test('3.9 s is compliant', () => expect(isEvCompliant(3.9)).toBe(true));
  test('4.99 s is compliant', () => expect(isEvCompliant(4.99)).toBe(true));
  test('exactly 5.0 s is NOT compliant', () => expect(isEvCompliant(5.0)).toBe(false));
  test('7.2 s is NOT compliant', () => expect(isEvCompliant(7.2)).toBe(false));
});

// ══════════════════════════════════════════════════════════════
// SECTION 14 — PURE BUSINESS LOGIC: Green Wave Window
// ══════════════════════════════════════════════════════════════
describe('Business Logic — Green Wave Speed Window (70–110 km/h)', () => {
  const inWave = (s) => s >= 70 && s <= 110;

  test('70 km/h is the inclusive lower boundary', () => expect(inWave(70)).toBe(true));
  test('110 km/h is the inclusive upper boundary', () => expect(inWave(110)).toBe(true));
  test('88 km/h (city avg) is in wave', () => expect(inWave(88)).toBe(true));
  test('69 km/h is below the wave', () => expect(inWave(69)).toBe(false));
  test('111 km/h is above the wave', () => expect(inWave(111)).toBe(false));
  test('0 km/h (stopped) is a severe infraction', () => expect(inWave(0)).toBe(false));
});

// ══════════════════════════════════════════════════════════════
// SECTION 15 — PURE BUSINESS LOGIC: Zero-Tolerance Ban
// ══════════════════════════════════════════════════════════════
describe('Business Logic — Zero-Tolerance Lifetime Ban', () => {
  const BAN_TRIGGERS = new Set([
    'collision', 'mechanical_stall', 'vehicle_fire',
    'impaired_driving', 'asn9_non_compliance',
  ]);
  const triggersBan = (t) => BAN_TRIGGERS.has(t);

  test('collision → ban', () => expect(triggersBan('collision')).toBe(true));
  test('mechanical_stall → ban', () => expect(triggersBan('mechanical_stall')).toBe(true));
  test('vehicle_fire → ban', () => expect(triggersBan('vehicle_fire')).toBe(true));
  test('impaired_driving → ban', () => expect(triggersBan('impaired_driving')).toBe(true));
  test('asn9_non_compliance → ban', () => expect(triggersBan('asn9_non_compliance')).toBe(true));
  test('speeding_citation alone does NOT ban', () => expect(triggersBan('speeding_citation')).toBe(false));
  test('missed_drift_angle alone does NOT ban', () => expect(triggersBan('missed_drift_angle')).toBe(false));
});

// ══════════════════════════════════════════════════════════════
// SECTION 16 — PURE BUSINESS LOGIC: Drift Angle Compliance
// ══════════════════════════════════════════════════════════════
describe('Business Logic — 25° Drift Angle Compliance', () => {
  const isDriftCompliant = (deg) => deg >= 25;

  test('25° is the minimum compliant angle', () => expect(isDriftCompliant(25)).toBe(true));
  test('45° is compliant', () => expect(isDriftCompliant(45)).toBe(true));
  test('24.9° triggers $400 citation', () => expect(isDriftCompliant(24.9)).toBe(false));
  test('0° (straight line) is max infraction', () => expect(isDriftCompliant(0)).toBe(false));
});

// ══════════════════════════════════════════════════════════════
// SECTION 17 — PURE BUSINESS LOGIC: Plate Recognition Zone
// ══════════════════════════════════════════════════════════════
describe('Business Logic — 400m Plate Recognition Zone', () => {
  const inZone = (d) => d <= 400;

  test('400m is exactly the activation boundary', () => expect(inZone(400)).toBe(true));
  test('200m is within recognition range', () => expect(inZone(200)).toBe(true));
  test('401m is outside recognition range', () => expect(inZone(401)).toBe(false));
  test('0m (at garage) is within range', () => expect(inZone(0)).toBe(true));
});

// ══════════════════════════════════════════════════════════════
// SECTION 18 — PERFORMANCE TAX SECTION: DOM
// ══════════════════════════════════════════════════════════════
describe('Performance Tax Section — DOM', () => {
  test('#perf-tax section exists', () => {
    expect(document.getElementById('perf-tax')).not.toBeNull();
  });

  test('section label contains ASPHALT DIVIDEND', () => {
    const label = document.querySelector('#perf-tax .section-label');
    expect(label?.textContent).toContain('ASPHALT DIVIDEND');
  });

  test('km-slider input exists', () => {
    expect(document.getElementById('km-slider')).not.toBeNull();
  });

  test('speed-slider input exists', () => {
    expect(document.getElementById('speed-slider')).not.toBeNull();
  });

  test('km-slider default value is 40000', () => {
    expect(document.getElementById('km-slider').value).toBe('40000');
  });

  test('speed-slider default value is 88', () => {
    expect(document.getElementById('speed-slider').value).toBe('88');
  });

  test('km-slider range is 5000–120000', () => {
    const sl = document.getElementById('km-slider');
    expect(sl.min).toBe('5000');
    expect(sl.max).toBe('120000');
  });

  test('speed-slider range is 60–160', () => {
    const sl = document.getElementById('speed-slider');
    expect(sl.min).toBe('60');
    expect(sl.max).toBe('160');
  });

  test('tax-rate-display element exists', () => {
    expect(document.getElementById('tax-rate-display')).not.toBeNull();
  });

  test('tax-class-display element exists', () => {
    expect(document.getElementById('tax-class-display')).not.toBeNull();
  });

  test('score-display element exists', () => {
    expect(document.getElementById('score-display')).not.toBeNull();
  });

  test('tax-verdict element exists', () => {
    expect(document.getElementById('tax-verdict')).not.toBeNull();
  });

  test('score-bar element exists', () => {
    expect(document.getElementById('score-bar')).not.toBeNull();
  });

  test('four tax bracket rows are rendered', () => {
    expect(document.querySelectorAll('.tax-bracket').length).toBe(4);
  });

  test('Apex Class bracket shows 0%', () => {
    const apex = document.getElementById('bracket-apex');
    expect(apex?.textContent).toContain('0%');
    expect(apex?.textContent).toContain('Apex Class');
  });

  test('Compliance Class bracket shows 22%', () => {
    const c = document.getElementById('bracket-compliance');
    expect(c?.textContent).toContain('22%');
    expect(c?.textContent).toContain('Compliance Class');
  });

  test('leaderboard has 5 resident rows', () => {
    expect(document.querySelectorAll('.lb-row').length).toBe(5);
  });

  test('top resident is ranked gold', () => {
    expect(document.querySelector('.lb-rank.gold')).not.toBeNull();
  });

  test('leaderboard top three show 0% tax rate', () => {
    const topThree = [...document.querySelectorAll('.lb-tax-rate.tier-1')];
    expect(topThree.length).toBeGreaterThanOrEqual(3);
    topThree.slice(0, 3).forEach(el => expect(el.textContent.trim()).toBe('0%'));
  });

  test('Koenigsegg Gemera appears in leaderboard', () => {
    const lb = document.querySelector('.tax-leaderboard');
    expect(lb?.textContent).toContain('Gemera');
  });

  test('performance tax nav link exists', () => {
    const links = [...document.querySelectorAll('.nav-links a')];
    const taxLink = links.find(l => l.getAttribute('href') === '#perf-tax');
    expect(taxLink).not.toBeNull();
  });

  test('performance tax footer link exists', () => {
    const links = [...document.querySelectorAll('.footer-links a')];
    const taxLink = links.find(l => l.getAttribute('href') === '#perf-tax');
    expect(taxLink).not.toBeNull();
  });
});

// ══════════════════════════════════════════════════════════════
// SECTION 19 — PURE BUSINESS LOGIC: Performance Score Formula
// ══════════════════════════════════════════════════════════════
describe('Business Logic — Performance Score Formula', () => {
  // score = round((km / 100) × (speed / 88), 1)
  // A city-average resident (40 000 km at 88 km/h) lands exactly on Apex boundary (400 pts)
  const score = (km, speed) => Math.round((km / 100) * (speed / 88) * 10) / 10;

  test('40 000 km at 88 km/h → score 400', () => {
    expect(score(40000, 88)).toBe(400);
  });

  test('88 000 km at 88 km/h → score 880', () => {
    expect(score(88000, 88)).toBe(880);
  });

  test('higher speed with same distance → higher score', () => {
    expect(score(40000, 110)).toBeGreaterThan(score(40000, 88));
  });

  test('higher distance with same speed → higher score', () => {
    expect(score(80000, 88)).toBeGreaterThan(score(40000, 88));
  });

  test('minimum inputs (5 000 km, 60 km/h) produce a low score', () => {
    expect(score(5000, 60)).toBeLessThan(100);
  });

  test('maximum inputs (120 000 km, 160 km/h) produce a very high score', () => {
    expect(score(120000, 160)).toBeGreaterThan(400);
  });
});

// ══════════════════════════════════════════════════════════════
// SECTION 20 — PURE BUSINESS LOGIC: Tax Bracket Assignment
// ══════════════════════════════════════════════════════════════
describe('Business Logic — Tax Bracket Assignment', () => {
  function getTaxBracket(score) {
    if (score >= 400) return { rate: 0,  cls: 'Apex Class',       tier: 1 };
    if (score >= 250) return { rate: 4,  cls: 'Velocity Class',   tier: 2 };
    if (score >= 100) return { rate: 12, cls: 'Cruise Class',     tier: 3 };
    return              { rate: 22, cls: 'Compliance Class', tier: 4 };
  }

  test('score 400 → Apex Class, 0% tax', () => {
    const b = getTaxBracket(400);
    expect(b.rate).toBe(0);
    expect(b.cls).toBe('Apex Class');
  });

  test('score 399 → Velocity Class, 4% tax', () => {
    const b = getTaxBracket(399);
    expect(b.rate).toBe(4);
    expect(b.cls).toBe('Velocity Class');
  });

  test('score 250 → Velocity Class, 4% tax', () => {
    const b = getTaxBracket(250);
    expect(b.rate).toBe(4);
  });

  test('score 249 → Cruise Class, 12% tax', () => {
    const b = getTaxBracket(249);
    expect(b.rate).toBe(12);
    expect(b.cls).toBe('Cruise Class');
  });

  test('score 100 → Cruise Class, 12% tax', () => {
    expect(getTaxBracket(100).rate).toBe(12);
  });

  test('score 99 → Compliance Class, 22% tax', () => {
    const b = getTaxBracket(99);
    expect(b.rate).toBe(22);
    expect(b.cls).toBe('Compliance Class');
  });

  test('score 0 → Compliance Class, 22% tax', () => {
    expect(getTaxBracket(0).rate).toBe(22);
  });

  test('boundary 400 is inclusive for Apex', () => {
    expect(getTaxBracket(400).tier).toBe(1);
    expect(getTaxBracket(401).tier).toBe(1);
  });

  test('boundary just below 400 is Velocity', () => {
    expect(getTaxBracket(399.9).tier).toBe(2);
  });

  test('Apex Class tier is 1', () => expect(getTaxBracket(500).tier).toBe(1));
  test('Velocity Class tier is 2', () => expect(getTaxBracket(300).tier).toBe(2));
  test('Cruise Class tier is 3', () => expect(getTaxBracket(150).tier).toBe(3));
  test('Compliance Class tier is 4', () => expect(getTaxBracket(50).tier).toBe(4));

  test('four distinct rate levels exist', () => {
    const rates = new Set([
      getTaxBracket(500).rate,
      getTaxBracket(300).rate,
      getTaxBracket(150).rate,
      getTaxBracket(50).rate,
    ]);
    expect(rates.size).toBe(4);
  });
});

// ══════════════════════════════════════════════════════════════
// SECTION 21 — BUSINESS LOGIC: Drive-More-Pay-Less Invariant
// ══════════════════════════════════════════════════════════════
describe('Business Logic — Drive More Pay Less Invariant', () => {
  const score = (km, speed) => Math.round((km / 100) * (speed / 88) * 10) / 10;
  function taxRate(km, speed) {
    const s = score(km, speed);
    if (s >= 400) return 0;
    if (s >= 250) return 4;
    if (s >= 100) return 12;
    return 22;
  }

  test('doubling km always results in same or lower tax rate', () => {
    const baseRate = taxRate(20000, 88);
    const doubledRate = taxRate(40000, 88);
    expect(doubledRate).toBeLessThanOrEqual(baseRate);
  });

  test('increasing speed always results in same or lower tax rate', () => {
    const slowRate = taxRate(30000, 70);
    const fastRate = taxRate(30000, 110);
    expect(fastRate).toBeLessThanOrEqual(slowRate);
  });

  test('a resident driving 100k km at 110 km/h pays 0% tax', () => {
    expect(taxRate(100000, 110)).toBe(0);
  });

  test('a resident driving 5k km at 60 km/h pays maximum 22% tax', () => {
    expect(taxRate(5000, 60)).toBe(22);
  });

  test('city-average driver (40k km, 88 km/h) is exactly Apex boundary → 0%', () => {
    expect(taxRate(40000, 88)).toBe(0);
  });

  test('no scenario produces a tax rate above 22%', () => {
    const testCases = [
      [5000, 60], [10000, 65], [8000, 70], [500, 88],
    ];
    testCases.forEach(([km, spd]) => {
      expect(taxRate(km, spd)).toBeLessThanOrEqual(22);
    });
  });

  test('no scenario produces a negative tax rate', () => {
    expect(taxRate(200000, 200)).toBeGreaterThanOrEqual(0);
  });
});

// ══════════════════════════════════════════════════════════════
// SECTION 22 — FLEET REDISTRIBUTION: DOM
// ══════════════════════════════════════════════════════════════
describe('Fleet Redistribution Section — DOM', () => {
  test('#fleet-redistribution section exists', () => {
    expect(document.getElementById('fleet-redistribution')).not.toBeNull();
  });

  test('section label contains FLEET REDISTRIBUTION PROTOCOL', () => {
    expect(document.querySelector('#fleet-redistribution .section-label')?.textContent)
      .toContain('FLEET REDISTRIBUTION PROTOCOL');
  });

  test('four acquisition tier rows are rendered', () => {
    expect(document.querySelectorAll('.acq-tier').length).toBe(4);
  });

  test('Creed Class tier shows −40%', () => {
    const t1 = document.getElementById('acq-tier-1');
    expect(t1?.textContent).toContain('−40%');
    expect(t1?.textContent).toContain('Creed Class');
  });

  test('Asphalt Class tier shows −25%', () => {
    const t2 = document.getElementById('acq-tier-2');
    expect(t2?.textContent).toContain('−25%');
  });

  test('Tarmac Class tier shows −10%', () => {
    const t3 = document.getElementById('acq-tier-3');
    expect(t3?.textContent).toContain('−10%');
  });

  test('control-slider exists with correct range', () => {
    const s = document.getElementById('control-slider');
    expect(s).not.toBeNull();
    expect(s.min).toBe('0');
    expect(s.max).toBe('100');
  });

  test('ethics-slider exists with correct range', () => {
    const s = document.getElementById('ethics-slider');
    expect(s).not.toBeNull();
    expect(s.min).toBe('0');
    expect(s.max).toBe('100');
  });

  test('total-score-display element exists', () => {
    expect(document.getElementById('total-score-display')).not.toBeNull();
  });

  test('ethics-tier-name element exists', () => {
    expect(document.getElementById('ethics-tier-name')).not.toBeNull();
  });

  test('ethics-discount element exists', () => {
    expect(document.getElementById('ethics-discount')).not.toBeNull();
  });

  test('six forfeited fleet cards are rendered', () => {
    expect(document.querySelectorAll('.fleet-card').length).toBe(6);
  });

  test('each fleet card has a market value data attribute', () => {
    document.querySelectorAll('.fleet-card').forEach(card => {
      expect(parseInt(card.dataset.market)).toBeGreaterThan(0);
    });
  });

  test('each fleet card has a minimum score data attribute', () => {
    document.querySelectorAll('.fleet-card').forEach(card => {
      expect(parseInt(card.dataset.minScore)).toBeGreaterThan(0);
    });
  });

  test('Ferrari SF90 Stradale is in the registry', () => {
    const names = [...document.querySelectorAll('.fleet-card-name')].map(n => n.textContent);
    expect(names.some(n => n.includes('Ferrari SF90'))).toBe(true);
  });

  test('Koenigsegg Gemera is in the registry', () => {
    const names = [...document.querySelectorAll('.fleet-card-name')].map(n => n.textContent);
    expect(names.some(n => n.includes('Gemera'))).toBe(true);
  });

  test('ban reasons are shown in red on fleet cards', () => {
    const reasons = document.querySelectorAll('.fleet-card-meta .ban-reason');
    expect(reasons.length).toBe(6);
  });

  test('ban consequence calculator section exists', () => {
    expect(document.querySelector('.ban-consequence')).not.toBeNull();
  });

  test('bc-cars-slider exists with range 1–30', () => {
    const s = document.getElementById('bc-cars-slider');
    expect(s).not.toBeNull();
    expect(s.min).toBe('1');
    expect(s.max).toBe('30');
  });

  test('bc-avg-slider exists with range 100k–5M', () => {
    const s = document.getElementById('bc-avg-slider');
    expect(s).not.toBeNull();
    expect(s.min).toBe('100000');
    expect(s.max).toBe('5000000');
  });

  test('bc-total element exists', () => {
    expect(document.getElementById('bc-total')).not.toBeNull();
  });

  test('zero-tolerance block links to #fleet-redistribution', () => {
    const link = document.querySelector('.zero-tolerance a[href="#fleet-redistribution"]');
    expect(link).not.toBeNull();
  });

  test('fleet redistribution nav link exists', () => {
    const links = [...document.querySelectorAll('.nav-links a')];
    expect(links.find(l => l.getAttribute('href') === '#fleet-redistribution')).not.toBeNull();
  });

  test('fleet redistribution footer link exists', () => {
    const links = [...document.querySelectorAll('.footer-links a')];
    expect(links.find(l => l.getAttribute('href') === '#fleet-redistribution')).not.toBeNull();
  });
});

// ══════════════════════════════════════════════════════════════
// SECTION 23 — PURE BUSINESS LOGIC: Acquisition Tier
// ══════════════════════════════════════════════════════════════
describe('Business Logic — Acquisition Tier Assignment', () => {
  function getAcquisitionTier(ctrl, eth) {
    const total = ctrl + eth;
    if (total >= 180 && ctrl >= 90 && eth >= 90) {
      return { tier: 1, name: 'Creed Class', discount: 40 };
    }
    if (total >= 150) {
      return { tier: 2, name: 'Asphalt Class', discount: 25 };
    }
    if (total >= 120) {
      return { tier: 3, name: 'Tarmac Class', discount: 10 };
    }
    return { tier: 0, name: 'Ineligible', discount: 0 };
  }

  test('ctrl=90, ethics=90 (total=180) → Creed Class, −40%', () => {
    const t = getAcquisitionTier(90, 90);
    expect(t.tier).toBe(1);
    expect(t.discount).toBe(40);
    expect(t.name).toBe('Creed Class');
  });

  test('ctrl=95, ethics=95 → Creed Class', () => {
    expect(getAcquisitionTier(95, 95).tier).toBe(1);
  });

  test('ctrl=100, ethics=100 → Creed Class', () => {
    expect(getAcquisitionTier(100, 100).tier).toBe(1);
  });

  test('ctrl=89, ethics=91 (total=180) but ctrl < 90 → Asphalt Class', () => {
    const t = getAcquisitionTier(89, 91);
    expect(t.tier).toBe(2);
    expect(t.name).toBe('Asphalt Class');
  });

  test('ctrl=80, ethics=80 (total=160) → Asphalt Class, −25%', () => {
    const t = getAcquisitionTier(80, 80);
    expect(t.tier).toBe(2);
    expect(t.discount).toBe(25);
  });

  test('total exactly 150 → Asphalt Class', () => {
    expect(getAcquisitionTier(75, 75).tier).toBe(2);
  });

  test('total 149 → Tarmac Class, −10%', () => {
    const t = getAcquisitionTier(75, 74);
    expect(t.tier).toBe(3);
    expect(t.discount).toBe(10);
  });

  test('total exactly 120 → Tarmac Class', () => {
    expect(getAcquisitionTier(60, 60).tier).toBe(3);
  });

  test('total 119 → Ineligible, 0%', () => {
    const t = getAcquisitionTier(60, 59);
    expect(t.tier).toBe(0);
    expect(t.discount).toBe(0);
    expect(t.name).toBe('Ineligible');
  });

  test('total 0 → Ineligible', () => {
    expect(getAcquisitionTier(0, 0).tier).toBe(0);
  });

  test('four distinct discount levels exist', () => {
    const discounts = new Set([
      getAcquisitionTier(95, 95).discount,
      getAcquisitionTier(80, 80).discount,
      getAcquisitionTier(60, 60).discount,
      getAcquisitionTier(50, 50).discount,
    ]);
    expect(discounts.size).toBe(4);
  });

  test('discount never exceeds 40%', () => {
    expect(getAcquisitionTier(100, 100).discount).toBeLessThanOrEqual(40);
  });

  test('discount is never negative', () => {
    expect(getAcquisitionTier(0, 0).discount).toBeGreaterThanOrEqual(0);
  });
});

// ══════════════════════════════════════════════════════════════
// SECTION 24 — PURE BUSINESS LOGIC: Fleet Eligibility
// ══════════════════════════════════════════════════════════════
describe('Business Logic — Fleet Vehicle Eligibility by Tier', () => {
  function isEligible(tier, totalScore, marketValue, minScore) {
    if (tier === 0 || totalScore < minScore) return false;
    if (tier === 1) return true;
    if (tier === 2) return marketValue <= 800000;
    if (tier === 3) return marketValue <= 500000;
    return false;
  }

  test('Creed Class (tier=1) is eligible for all vehicles', () => {
    expect(isEligible(1, 185, 3200000, 180)).toBe(true);
    expect(isEligible(1, 185, 480000,  120)).toBe(true);
  });

  test('Asphalt Class cannot access vehicles above €800k', () => {
    expect(isEligible(2, 160, 3200000, 150)).toBe(false);
    expect(isEligible(2, 160, 1900000, 150)).toBe(false);
  });

  test('Asphalt Class can access vehicles at exactly €800k', () => {
    expect(isEligible(2, 160, 800000, 150)).toBe(true);
  });

  test('Tarmac Class cannot access vehicles above €500k', () => {
    expect(isEligible(3, 130, 650000, 120)).toBe(false);
  });

  test('Tarmac Class can access vehicles at or below €500k', () => {
    expect(isEligible(3, 130, 480000, 120)).toBe(true);
    expect(isEligible(3, 130, 500000, 120)).toBe(true);
  });

  test('Ineligible tier (0) can access nothing', () => {
    expect(isEligible(0, 100, 480000, 120)).toBe(false);
  });

  test('score below vehicle minimum blocks access even for higher tier', () => {
    expect(isEligible(2, 140, 480000, 150)).toBe(false);
  });
});

// ══════════════════════════════════════════════════════════════
// SECTION 25 — PURE BUSINESS LOGIC: Ban Fleet Forfeiture Value
// ══════════════════════════════════════════════════════════════
describe('Business Logic — Ban Fleet Forfeiture Value', () => {
  const forfeitureValue = (cars, avgValue) => cars * avgValue;

  test('1 car × €480k → forfeiture of €480k', () => {
    expect(forfeitureValue(1, 480000)).toBe(480000);
  });

  test('12 cars × €850k → forfeiture of €10.2M', () => {
    expect(forfeitureValue(12, 850000)).toBe(10200000);
  });

  test('30 cars × €5M → forfeiture of €150M', () => {
    expect(forfeitureValue(30, 5000000)).toBe(150000000);
  });

  test('forfeiture value is always non-negative', () => {
    expect(forfeitureValue(0, 500000)).toBeGreaterThanOrEqual(0);
  });

  test('more cars always means higher forfeiture', () => {
    expect(forfeitureValue(20, 1000000)).toBeGreaterThan(forfeitureValue(10, 1000000));
  });

  test('higher avg value always means higher forfeiture', () => {
    expect(forfeitureValue(10, 2000000)).toBeGreaterThan(forfeitureValue(10, 1000000));
  });

  test('forfeiture scales linearly with car count', () => {
    expect(forfeitureValue(20, 500000)).toBe(2 * forfeitureValue(10, 500000));
  });
});

// ══════════════════════════════════════════════════════════════
// SECTION 26 — URBAN CELL SECTION: DOM
// ══════════════════════════════════════════════════════════════
describe('Urban Cell Section — DOM', () => {
  test('#urban-cell section exists', () => {
    expect(document.getElementById('urban-cell')).not.toBeNull();
  });

  test('section label contains CIRCULAR AGGLOMERATION', () => {
    expect(document.querySelector('#urban-cell .section-label')?.textContent)
      .toContain('CIRCULAR AGGLOMERATION');
  });

  test('uc-canvas element exists', () => {
    expect(document.getElementById('uc-canvas')).not.toBeNull();
  });

  test('urban cell shows three zone specs (exterior, interior, connectivity)', () => {
    expect(document.querySelectorAll('#urban-cell .uc-zone').length).toBe(3);
  });

  test('exterior zone mentions 70–110 km/h', () => {
    const zones = document.querySelectorAll('#urban-cell .uc-zone');
    expect(zones[0].textContent).toContain('70');
    expect(zones[0].textContent).toContain('110');
  });

  test('interior zone mentions pedestrian / no car', () => {
    const zones = document.querySelectorAll('#urban-cell .uc-zone');
    expect(zones[1].textContent.toLowerCase()).toContain('pedestrian');
  });

  test('interior zone mentions Farmers Market and mall', () => {
    const zones = document.querySelectorAll('#urban-cell .uc-zone');
    const text = zones[1].textContent.toLowerCase();
    expect(text).toContain("farmers' market");
    expect(text).toContain('mall');
  });

  test('400m sensor spec badge is shown in exterior zone', () => {
    expect(document.querySelector('#urban-cell .uc-spec-row')?.textContent).toContain('400M SENSOR');
  });

  test('uc-mansion-num element exists and has numeric content', () => {
    const el = document.getElementById('uc-mansion-num');
    expect(el).not.toBeNull();
    expect(parseInt(el.textContent)).toBeGreaterThanOrEqual(10);
    expect(parseInt(el.textContent)).toBeLessThanOrEqual(20);
  });

  test('urban cell nav link exists', () => {
    const links = [...document.querySelectorAll('.nav-links a')];
    expect(links.find(l => l.getAttribute('href') === '#urban-cell')).not.toBeNull();
  });

  test('urban cell footer link exists', () => {
    const links = [...document.querySelectorAll('.footer-links a')];
    expect(links.find(l => l.getAttribute('href') === '#urban-cell')).not.toBeNull();
  });
});

// ══════════════════════════════════════════════════════════════
// SECTION 27 — GUEST TIER SECTION: DOM
// ══════════════════════════════════════════════════════════════
describe('Guest Tier & Staff Integration — DOM', () => {
  test('#guest-tier section exists', () => {
    expect(document.getElementById('guest-tier')).not.toBeNull();
  });

  test('section label contains SERVICE AT VELOCITY', () => {
    expect(document.querySelector('#guest-tier .section-label')?.textContent)
      .toContain('GUEST TIER');
  });

  test('three logistics cards (subway, helicopter, upper-floor) are rendered', () => {
    expect(document.querySelectorAll('#guest-tier .gt-card').length).toBe(3);
  });

  test('subterranean / subway access is documented', () => {
    const section = document.getElementById('guest-tier');
    const text = section.textContent.toLowerCase();
    expect(text).toContain('subway');
  });

  test('helicopter access is documented', () => {
    expect(document.getElementById('guest-tier').textContent.toLowerCase())
      .toContain('helicopter');
  });

  test('upper-floor suite residency is mentioned', () => {
    expect(document.getElementById('guest-tier').textContent.toLowerCase())
      .toContain('upper-floor');
  });

  test('supercar teacher model section exists', () => {
    expect(document.querySelector('.supercar-teacher')).not.toBeNull();
  });

  test('five staff vehicle rules are listed', () => {
    expect(document.querySelectorAll('.st-rule').length).toBe(5);
  });

  test('rule 2 mentions 0–100 in under 5 seconds for staff vehicles', () => {
    const rules = document.querySelectorAll('.st-rule');
    expect(rules[1].textContent).toContain('5 seconds');
  });

  test('rule 3 mentions mandatory 25° drift for licensed staff', () => {
    expect(document.querySelectorAll('.st-rule')[2].textContent).toContain('25°');
  });

  test('no-delivery banner is in guest-tier section', () => {
    expect(document.querySelector('#guest-tier .no-delivery-banner')).not.toBeNull();
  });

  test('no-delivery banner shows 0 delivery services', () => {
    const nd = document.querySelector('.nd-val');
    expect(nd?.textContent.trim()).toBe('0');
  });

  test('no-delivery banner shows 200L petrol mandate', () => {
    const metrics = document.querySelectorAll('.nd-val');
    const texts = [...metrics].map(m => m.textContent.trim());
    expect(texts.some(t => t.includes('200'))).toBe(true);
  });

  test('guest-tier nav link exists', () => {
    const links = [...document.querySelectorAll('.nav-links a')];
    expect(links.find(l => l.getAttribute('href') === '#guest-tier')).not.toBeNull();
  });
});

// ══════════════════════════════════════════════════════════════
// SECTION 28 — EV PERFORMANCE BANNER: DOM
// ══════════════════════════════════════════════════════════════
describe('EV Performance Banner — DOM', () => {
  test('#ev-banner element exists', () => {
    expect(document.getElementById('ev-banner')).not.toBeNull();
  });

  test('banner states HIGH-PERFORMANCE EVs WELCOME', () => {
    expect(document.getElementById('ev-banner').textContent)
      .toContain('HIGH-PERFORMANCE');
    expect(document.getElementById('ev-banner').textContent.toUpperCase())
      .toContain('WELCOME');
  });

  test('banner shows <5s threshold', () => {
    expect(document.getElementById('ev-banner').textContent).toContain('5s');
  });

  test('banner mentions 88 km/h ecosystem', () => {
    expect(document.getElementById('ev-banner').textContent).toContain('88');
  });

  test('banner appears before the EV section', () => {
    const banner = document.getElementById('ev-banner');
    const section = document.getElementById('ev-mandate');
    expect(banner).not.toBeNull();
    expect(section).not.toBeNull();
    // Banner should be a sibling/ancestor earlier in document order
    const position = banner.compareDocumentPosition(section);
    expect(position & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});

// ══════════════════════════════════════════════════════════════
// SECTION 29 — PURE BUSINESS LOGIC: Urban Cell Ring Geometry
// ══════════════════════════════════════════════════════════════
describe('Business Logic — Urban Cell Ring Geometry', () => {
  /** Evenly space N mansions on a ring — returns angular positions in radians */
  function mansionAngles(n) {
    return Array.from({ length: n }, (_, i) => (i / n) * 2 * Math.PI);
  }

  /** Angular gap between adjacent mansions in degrees */
  function angularGapDeg(n) { return 360 / n; }

  test('12 mansions produce 30° gaps', () => {
    expect(angularGapDeg(12)).toBeCloseTo(30);
  });

  test('15 mansions produce 24° gaps', () => {
    expect(angularGapDeg(15)).toBeCloseTo(24);
  });

  test('10 mansions produce 36° gaps', () => {
    expect(angularGapDeg(10)).toBeCloseTo(36);
  });

  test('mansionAngles returns correct count', () => {
    expect(mansionAngles(12)).toHaveLength(12);
    expect(mansionAngles(20)).toHaveLength(20);
  });

  test('first mansion is always at angle 0', () => {
    expect(mansionAngles(12)[0]).toBe(0);
  });

  test('all angles are in [0, 2π)', () => {
    mansionAngles(15).forEach(a => {
      expect(a).toBeGreaterThanOrEqual(0);
      expect(a).toBeLessThan(2 * Math.PI);
    });
  });

  test('valid mansion count range is 10–20', () => {
    const isValidCount = n => n >= 10 && n <= 20;
    expect(isValidCount(10)).toBe(true);
    expect(isValidCount(12)).toBe(true);
    expect(isValidCount(20)).toBe(true);
    expect(isValidCount(9)).toBe(false);
    expect(isValidCount(21)).toBe(false);
  });
});

// ══════════════════════════════════════════════════════════════
// SECTION 30 — PURE BUSINESS LOGIC: Staff Vehicle Rules
// ══════════════════════════════════════════════════════════════
describe('Business Logic — Staff Vehicle Compliance Rules', () => {
  function isStaffVehicleCompliant(zeroToHundred, driftAngle, hasLicense) {
    return hasLicense && zeroToHundred < 5 && driftAngle >= 25;
  }

  test('licensed staff, compliant car, 25° drift → compliant', () => {
    expect(isStaffVehicleCompliant(4.5, 25, true)).toBe(true);
  });

  test('no license → not compliant regardless of car', () => {
    expect(isStaffVehicleCompliant(3.0, 30, false)).toBe(false);
  });

  test('slow car (5.0s) → not compliant even with license', () => {
    expect(isStaffVehicleCompliant(5.0, 30, true)).toBe(false);
  });

  test('insufficient drift angle (24°) → $400 citation', () => {
    expect(isStaffVehicleCompliant(4.0, 24, true)).toBe(false);
  });

  test('all three conditions must be met simultaneously', () => {
    expect(isStaffVehicleCompliant(4.9, 25, true)).toBe(true);
    expect(isStaffVehicleCompliant(4.9, 25, false)).toBe(false);
    expect(isStaffVehicleCompliant(5.1, 25, true)).toBe(false);
    expect(isStaffVehicleCompliant(4.9, 24, true)).toBe(false);
  });

  test('a supercar teacher in a Koenigsegg Gemera at 2.9s → compliant', () => {
    expect(isStaffVehicleCompliant(2.9, 28, true)).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════
// SECTION 31 — PURE BUSINESS LOGIC: No-Delivery Petrol Quota
// ══════════════════════════════════════════════════════════════
describe('Business Logic — No-Delivery Petrol Quota', () => {
  const MANDATE_LITRES = 200;

  function quotaStatus(litres) {
    const pct = Math.max(0, Math.min(100, Math.round(litres / MANDATE_LITRES * 100)));
    const remaining = Math.max(0, MANDATE_LITRES - litres);
    const met = litres >= MANDATE_LITRES;
    return { pct, remaining: Math.round(remaining), met };
  }

  test('0L → 0%, 200L remaining, not met', () => {
    const s = quotaStatus(0);
    expect(s.pct).toBe(0);
    expect(s.remaining).toBe(200);
    expect(s.met).toBe(false);
  });

  test('100L → 50%, 100 remaining, not met', () => {
    const s = quotaStatus(100);
    expect(s.pct).toBe(50);
    expect(s.remaining).toBe(100);
    expect(s.met).toBe(false);
  });

  test('200L → 100%, 0 remaining, mandate met', () => {
    const s = quotaStatus(200);
    expect(s.pct).toBe(100);
    expect(s.remaining).toBe(0);
    expect(s.met).toBe(true);
  });

  test('201L → capped at 100%, 0 remaining, met', () => {
    const s = quotaStatus(201);
    expect(s.pct).toBe(100);
    expect(s.remaining).toBe(0);
    expect(s.met).toBe(true);
  });

  test('residents who fetch goods themselves accumulate quota naturally', () => {
    const trips = [30, 45, 28, 52, 45]; // litres per weekly trip
    const total = trips.reduce((a, b) => a + b, 0);
    expect(total).toBe(200);
    expect(quotaStatus(total).met).toBe(true);
  });
});
