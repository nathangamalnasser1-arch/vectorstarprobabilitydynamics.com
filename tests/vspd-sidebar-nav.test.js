/**
 * Unit tests: VSPD sidebar mobile nav + Competition Coin Paper link.
 * Run with: node tests/vspd-sidebar-nav.test.js
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const pages = [
  'index.html',
  'theory.html',
  'thought-experiment.html',
  'comparisons.html',
  'experiments.html',
  'about.html',
  'hl-lhc-enrichment.html',
  'natapps.html',
];

const patterns = {
  hamburger: /id="nav-mobile-toggle"/,
  sidebarId: /id="vspd-sidebar-nav"/,
  overlay: /id="nav-overlay"/,
  script: /js\/sidebar-nav\.js/,
  competitionHref: /competition%20coin%20paper\/index\.html/,
  competitionLabel: />Competition Coin Paper</,
  natosHref: /NatOS\/natos\.html/,
  natosLabel: />NatOS</,
  hallpassHref: /hallpassapp\//,
  hallpassLabel: />Hall Pass</,
  iamcuriousHref: /iamcurious\/dist\/index\.html/,
  iamcuriousLabel: />I Am Curious</,
  jaydenEcommerceHref: /jayden-ecommerce\.html/,
  jaydenEcommerceLabel: />Jayden E-Commerce</,
};

const jsPath = path.join(root, 'js', 'sidebar-nav.js');
const js = fs.readFileSync(jsPath, 'utf8');

let failed = 0;

if (!js.includes('nav-mobile-toggle') || !js.includes('vspd-sidebar-nav')) {
  console.error('FAIL: sidebar-nav.js missing expected id strings');
  failed++;
} else {
  console.log('OK: sidebar-nav.js structure');
}

for (const file of pages) {
  const htmlPath = path.join(root, file);
  const html = fs.readFileSync(htmlPath, 'utf8');
  for (const [name, re] of Object.entries(patterns)) {
    const ok = re.test(html);
    if (!ok) {
      console.error('FAIL:', file, name);
      failed++;
    } else {
      console.log('OK:', file, name);
    }
  }
}

if (failed > 0) {
  console.error('\n' + failed + ' test(s) failed.');
  process.exit(1);
}
console.log('\nAll VSPD sidebar nav tests passed.');
process.exit(0);
