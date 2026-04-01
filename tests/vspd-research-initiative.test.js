/**
 * Unit tests for VSPD Research Initiative standalone page.
 * Run with: node tests/vspd-research-initiative.test.js
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const htmlPath = path.join(root, 'vspd-research-initiative.html');
const html = fs.readFileSync(htmlPath, 'utf8');
const indexPath = path.join(root, 'index.html');
const indexHtml = fs.readFileSync(indexPath, 'utf8');

const required = {
  title: /VSPD Research Initiative/i,
  navLinkInIndex: /href="vspd-research-initiative\.html">VSPD Research Initiative</,
  root: /id="root"|id='root'/,
};

let failed = 0;
for (const [name, re] of Object.entries(required)) {
  const source = name === 'navLinkInIndex' ? indexHtml : html;
  const ok = re.test(source);
  if (!ok) {
    console.error('FAIL:', name);
    failed++;
  } else {
    console.log('OK:', name);
  }
}

if (failed > 0) {
  console.error('\n' + failed + ' test(s) failed.');
  process.exit(1);
}
console.log('\nAll VSPD Research Initiative tests passed.');
process.exit(0);
