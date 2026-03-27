/**
 * Ensures every file in skateparkcity images appears in #gallery, and vice versa.
 * Run: node tests/skatepark-city-gallery-sync.test.js
 */
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const root = path.join(__dirname, '..');
const imgDir = path.join(root, 'skateparkcity images');
const htmlPath = path.join(root, 'skatepark-city.html');
const html = fs.readFileSync(htmlPath, 'utf8');

const IMAGE_EXT = /\.(png|jpe?g|webp|gif)$/i;
const filesOnDisk = fs
  .readdirSync(imgDir)
  .filter((f) => IMAGE_EXT.test(f))
  .sort();

const gStart = html.indexOf('<!-- GALLERY -->');
const gEnd = html.indexOf('<!-- VIDEOS', gStart);
assert.ok(gStart >= 0 && gEnd > gStart, 'GALLERY section block not found');
const galleryBlock = html.slice(gStart, gEnd);

const re = /skateparkcity images\/([^"']+\.(?:png|jpe?g|webp|gif))/gi;
const fromHtml = [];
let m;
while ((m = re.exec(galleryBlock)) !== null) {
  fromHtml.push(m[1]);
}
const uniqueFromHtml = [...new Set(fromHtml)].sort();

assert.deepStrictEqual(
  uniqueFromHtml,
  filesOnDisk,
  'Gallery image set must match files in skateparkcity images (add new <a> rows for new files)',
);

filesOnDisk.forEach((f) => {
  const rel = `skateparkcity images/${f}`;
  assert.ok(fs.existsSync(path.join(root, rel)), rel);
});

const capMatch = html.match(/Folder:\s*skateparkcity images\s*·\s*(\d+)\s*assets/i);
assert.ok(capMatch, 'gallery-cap asset count line not found');
assert.strictEqual(
  parseInt(capMatch[1], 10),
  filesOnDisk.length,
  'Update gallery-cap to match number of image files',
);

console.log(`ok: gallery sync (${filesOnDisk.length} images)`);
