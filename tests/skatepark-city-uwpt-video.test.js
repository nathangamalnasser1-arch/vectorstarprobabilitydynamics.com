/**
 * Skatepark City — UWPT section: Anti Subway YouTube modal (wheels-first transit).
 * Run: node tests/skatepark-city-uwpt-video.test.js
 */
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const htmlPath = path.join(__dirname, '..', 'skatepark-city.html');
const html = fs.readFileSync(htmlPath, 'utf8');

assert.ok(/id="uwpt-video-open"/.test(html), 'open button');
assert.ok(/id="uwpt-video-overlay"/.test(html), 'modal overlay');
assert.ok(/youtube\.com\/embed\/EQ-XIZ3b5mM/.test(html), 'YouTube embed id');
assert.ok(/function\(\)\{\s*const overlay=document\.getElementById\('uwpt-video-overlay'\)/.test(html.replace(/\s+/g, ' ')), 'UWPT modal script');
assert.ok(/aria-controls="uwpt-video-overlay"/.test(html), 'button aria-controls');

console.log('ok: skatepark-city UWPT Anti Subway video modal checks passed');
