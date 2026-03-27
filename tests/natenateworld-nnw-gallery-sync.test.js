/**
 * Ensures every image in natenateworld images/nnw appears in the NNW carousel, and vice versa.
 * Run: node tests/natenateworld-nnw-gallery-sync.test.js
 */
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const root = path.join(__dirname, '..');
const imgDir = path.join(root, 'natenateworld images', 'nnw');
const htmlPath = path.join(root, 'natenateworld.html');
const html = fs.readFileSync(htmlPath, 'utf8');

assert.ok(fs.existsSync(imgDir), 'natenateworld images/nnw folder must exist');

const IMAGE_EXT = /\.(png|jpe?g|webp|gif)$/i;
const filesOnDisk = fs
  .readdirSync(imgDir)
  .filter((f) => IMAGE_EXT.test(f))
  .sort();

const start = html.indexOf('<!-- NNW CAROUSEL');
const end = html.indexOf('<!-- CONCEPT -->', start);
assert.ok(start >= 0 && end > start, 'NNW CAROUSEL section block not found');
const block = html.slice(start, end);

const re = /natenateworld images\/nnw\/([^"']+\.(?:png|jpe?g|webp|gif))/gi;
const fromHtml = [];
let m;
while ((m = re.exec(block)) !== null) {
  fromHtml.push(m[1]);
}
const uniqueFromHtml = [...new Set(fromHtml)].sort();

assert.deepStrictEqual(
  uniqueFromHtml,
  filesOnDisk,
  'Carousel image set must match files in natenateworld images/nnw',
);

filesOnDisk.forEach((f) => {
  const rel = path.join('natenateworld images', 'nnw', f);
  assert.ok(fs.existsSync(path.join(root, rel)), rel);
});

const capMatch = block.match(/Folder:\s*natenateworld images\/nnw\s*·\s*(\d+)\s*assets/i);
assert.ok(capMatch, 'nnw-gallery-cap asset count line not found');
assert.strictEqual(
  parseInt(capMatch[1], 10),
  filesOnDisk.length,
  'Update nnw-gallery-cap to match number of image files',
);

assert.ok(
  html.includes('id="nnw-carousel"') && html.includes('id="nnw-car-viewport"'),
  'carousel root elements must exist',
);
assert.ok(
  html.includes('initNnwCarousel'),
  'carousel init script must exist',
);

console.log(`ok: NNW gallery sync (${filesOnDisk.length} images)`);
