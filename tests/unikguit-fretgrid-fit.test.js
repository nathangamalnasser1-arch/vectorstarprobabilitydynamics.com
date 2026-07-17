/**
 * Unikguit fret selector: full width, large cells, below the layout.
 * Run: node tests/unikguit-fretgrid-fit.test.js
 */
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const html = fs.readFileSync(path.join(__dirname, '..', 'unikguit.html'), 'utf8');

const gridwrapMatch = html.match(/\.gridwrap\{[^}]+\}/);
assert.ok(gridwrapMatch, '.gridwrap rule present');
assert.ok(!/overflow-x\s*:\s*auto/.test(gridwrapMatch[0]), '.gridwrap must not use overflow-x:auto');

const fretgridMatch = html.match(/table\.fretgrid\{[^}]+\}/);
assert.ok(fretgridMatch, 'table.fretgrid rule present');
assert.ok(/width\s*:\s*100%/.test(fretgridMatch[0]), 'table.fretgrid must be width:100%');
assert.ok(/table-layout\s*:\s*fixed/.test(fretgridMatch[0]), 'table.fretgrid must use table-layout:fixed');
assert.ok(/font-size\s*:\s*12px/.test(fretgridMatch[0]), 'table.fretgrid font must be readable (12px)');

const cellMatch = html.match(/\.cell\{[^}]+\}/);
assert.ok(cellMatch, '.cell rule present');
assert.ok(!/width\s*:\s*22px/.test(cellMatch[0]), '.cell must not hardcode width:22px');
assert.ok(/height\s*:\s*36px/.test(cellMatch[0]), '.cell height must be 36px');

// Grid sits after .layout closes, not inside .options
const layoutClose = html.indexOf('</div>\n\n  <div id="grid" class="gridwrap"></div>');
assert.ok(layoutClose > 0, 'grid must sit below the layout, not in the side column');
const optionsEnd = html.indexOf('</div>\n\n    <div class="viewer">');
assert.ok(optionsEnd > 0, 'options column closes before viewer');
const gridId = html.indexOf('id="grid"');
assert.ok(gridId > optionsEnd, 'grid comes after options column');

console.log('ok: unikguit fretboard large, full-width, bottom-placed');
