/**
 * Tracer LIVE/LOAD buttons must stay clickable: #hud has pointer-events:none,
 * so both buttons need pointer-events:auto in their inline styles.
 * Run: node tests/tracer-live-button-clickable.test.js
 */
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const htmlPath = path.join(__dirname, '..', 'tracer-real.html');
const html = fs.readFileSync(htmlPath, 'utf8');

const loadBtn = html.match(/<div id="loadBtn"[^>]*>/);
assert.ok(loadBtn, 'loadBtn present');

const liveBtn = html.match(/<div id="liveBtn"[^>]*>/);
assert.ok(liveBtn, 'liveBtn present');

// pointer-events:auto may be inline on each button or a CSS rule covering both
const cssRule = /#loadBtn\s*,\s*#liveBtn\s*\{[^}]*pointer-events:\s*auto/.test(html);
const inlineLoad = /pointer-events:\s*auto/.test(loadBtn[0]);
const inlineLive = /pointer-events:\s*auto/.test(liveBtn[0]);
assert.ok(cssRule || inlineLoad, 'LOAD button must have pointer-events:auto (hud blocks clicks otherwise)');
assert.ok(cssRule || inlineLive, 'LIVE button must have pointer-events:auto (hud blocks clicks otherwise)');

assert.ok(/onclick="showLiveOverlay\(\)"/.test(liveBtn[0]), 'LIVE button must open the live overlay');

console.log('ok: tracer LIVE/LOAD buttons are clickable');
