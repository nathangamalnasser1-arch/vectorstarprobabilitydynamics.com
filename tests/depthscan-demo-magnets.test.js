/**
 * DepthScan live demo: side + phone views must show 3 magnets on the part.
 * Run: node tests/depthscan-demo-magnets.test.js
 */
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const htmlPath = path.join(__dirname, '..', 'depthscan', 'index.html');
const html = fs.readFileSync(htmlPath, 'utf8');

const start = html.indexOf('// LIVE DEMO — side view + phone mesh canvas');
const end = html.indexOf('// MAGNET CALIBRATION VISUAL');
assert.ok(start > 0 && end > start, 'demo script block present');
const block = html.slice(start, end);

assert.ok(block.includes('const DEMO_MAGNET_COLORS'), 'shared magnet colors');
assert.ok(block.includes('const DEMO_SIDE_MAGNETS'), 'side-view magnet positions');
assert.ok(block.includes('const DEMO_MESH_MAGNET_ANGLES'), 'phone-view magnet angles');
assert.strictEqual((block.match(/rgba\(255,80,140/g) || []).length >= 1, true, 'pink magnet color');
assert.strictEqual((block.match(/rgba\(255,140,90/g) || []).length >= 1, true, 'orange magnet color');
assert.strictEqual((block.match(/rgba\(255,200,100/g) || []).length >= 1, true, 'yellow magnet color');

const sideMagnetBlock = block.slice(block.indexOf('DEMO_SIDE_MAGNETS'), block.indexOf('DEMO_MESH_MAGNET_ANGLES'));
assert.strictEqual((sideMagnetBlock.match(/\{\s*x:/g) || []).length, 3, '3 side-view magnets');

const meshAngleBlock = block.slice(block.indexOf('DEMO_MESH_MAGNET_ANGLES'), block.indexOf('function drawDemoMagnetSticker'));
assert.strictEqual((meshAngleBlock.match(/[0-9]+\.[0-9]+/g) || []).length, 3, '3 phone-view magnet angles');

assert.ok(block.includes('DEMO_SIDE_MAGNETS.forEach'), 'side view loops all magnets');
assert.ok(block.includes('DEMO_MESH_MAGNET_ANGLES.forEach'), 'phone view loops all magnets');
assert.ok(!block.includes('const stickerX = partW/2 - 7'), 'single-magnet side view removed');

console.log('ok: DepthScan demo renders 3 magnets on side + phone views');
