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
  vspdResearchHref: /vspd-research-initiative\.html/,
  vspdResearchLabel: />VSPD Research Initiative</,
  unikguitHref: /unikguit\.html/,
  unikguitLabel: />Unikguit</,
};
const absentPatterns = {
  cleankeyHref: /cleankey\/index\.html/,
  cleankeyLabel: />Clean Key</,
  hallpassHref: /hallpassapp\//,
  hallpassLabel: />Hall Pass</,
  jaydenLabel: />Jayden E-Commerce</i,
  jaydenHref: /jayden|e-?commerce|\/jay\//i,
  iamcuriousHref: /iamcurious\/dist\/index\.html/i,
  iamcuriousLabel: />I Am Curious</i,
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
    if (name === 'hallpassHref' || name === 'hallpassLabel') continue;
    const ok = re.test(html);
    if (!ok) {
      console.error('FAIL:', file, name);
      failed++;
    } else {
      console.log('OK:', file, name);
    }
  }
  for (const [name, re] of Object.entries(absentPatterns)) {
    const absent = !re.test(html);
    if (!absent) {
      console.error('FAIL:', file, name, 'should be absent');
      failed++;
    } else {
      console.log('OK:', file, name, 'absent');
    }
  }
}

if (failed > 0) {
  console.error('\n' + failed + ' test(s) failed.');
  process.exit(1);
}
console.log('\nAll VSPD sidebar nav tests passed.');
process.exit(0);
