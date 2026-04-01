/**
 * Unit tests for Jayden E-Commerce consultant landing page.
 * Run with: node tests/jayden-ecommerce.test.js
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const htmlPath = path.join(root, 'jayden-ecommerce.html');
const html = fs.readFileSync(htmlPath, 'utf8');

const required = {
  title: /Jayden.*E-Commerce Consultant/i,
  rateHero: /\$50\/h.*minimum\s+3\s+hours/i,
  rateContact: /Rates[\s\S]*\$50\/h.*minimum\s+3\s+hours/i,
  contactSection: /id="contact"/,
  gallery: /id="gallery"/,
  carousel: /jayCarouselViewport/,
  imgJay1: /jay\/jay1\.png/,
  imgJay2: /jay\/jay2\.png/,
  imgJay3: /jay\/jajy3\.png/,
  structuralReset: /Architecting the Structural Reset/i,
  aiDiscoveryCard: /AI Discovery Rate[\s\S]*Rufus.*Perplexity/i,
  revenue2026e: /2026E:\s*\$8\.8T/,
  serviceImmersive: /Immersive CRO[\s\S]*20%[\s\S]*30%/i,
  serviceOmnichannel: /91%[\s\S]*\$1 trillion/i,
  serviceLastMile: /53%/,
};

let failed = 0;
for (const [name, re] of Object.entries(required)) {
  const ok = re.test(html);
  if (!ok) {
    console.error('FAIL:', name);
    failed++;
  } else {
    console.log('OK:', name);
  }
}

const jayImages = ['jay/jay1.png', 'jay/jay2.png', 'jay/jajy3.png'];
for (const rel of jayImages) {
  const p = path.join(root, rel);
  if (!fs.existsSync(p)) {
    console.error('FAIL: missing file', rel);
    failed++;
  } else {
    console.log('OK: file', rel);
  }
}

if (failed > 0) {
  console.error('\n' + failed + ' test(s) failed.');
  process.exit(1);
}
console.log('\nAll Jayden E-Commerce page tests passed.');
process.exit(0);
