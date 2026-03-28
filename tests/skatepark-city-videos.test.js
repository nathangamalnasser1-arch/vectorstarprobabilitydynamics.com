/**
 * Skatepark City — #videos section embeds and links.
 * Run: node tests/skatepark-city-videos.test.js
 */
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const htmlPath = path.join(__dirname, '..', 'skatepark-city.html');
const html = fs.readFileSync(htmlPath, 'utf8');

const videoIds = ['swc2iJXfJos', '6R9w6y0nm4o', 'YdAK6B8hcUs', 'BEnHAAkA3OE'];

assert.ok(html.includes('id="videos"'), 'Expected #videos section');
videoIds.forEach((id) => {
  assert.ok(
    html.includes(`youtube.com/embed/${id}`),
    `Expected embed for ${id}`,
  );
  assert.ok(
    html.includes(`youtu.be/${id}`),
    `Expected youtu.be link for ${id}`,
  );
});

console.log('ok: skatepark-city videos section checks passed');
