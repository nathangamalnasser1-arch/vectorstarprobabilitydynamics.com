/**
 * Unit tests for the HL-LHC SOA 2.0 Enrichment page.
 * Run with: node tests/hl-lhc-enrichment.test.js
 */
const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, '..', 'hl-lhc-enrichment.html');
const html = fs.readFileSync(htmlPath, 'utf8');

const required = {
  title: /HL-LHC.*SOA 2\.0.*Enrichment/i,
  navLink: /href="hl-lhc-enrichment\.html"/,
  sidebar: /simple-explanation-sidebar/,
  header: /SOA 2\.0 Enrichment Frontier/,
  section1: /Strategic Vision.*Contextualizing SOA 2\.0/,
  section2: /Technical Grounding.*Operational Parameters/,
  section3: /Logic Architecture.*Data Enrichment/,
  section4: /Visual Storyboarding/,
  section5: /Master AI IDE Prompt/,
  table: /hl-lhc-table/,
  tableBunchPop: /2\.2\s*\\times\s*10\^/,
  tableLuminosity: /7\.5\s*\\times\s*10\^/,
  tablePileup: /200/,
  luminosityCounter: /luminosity-counter/,
  luminosityTarget: /4000/,
  cernColors: [/#1e293b|#64748b|#f59e0b/, /--hl-bg-primary|--hl-accent/],
  terminology: [/triplet aperture|Nb.*3.*Sn|levelling operation|long-range beam-beam/],
};

let failed = 0;
for (const [name, pattern] of Object.entries(required)) {
  const patterns = Array.isArray(pattern) ? pattern : [pattern];
  const ok = patterns.some(p => (typeof p === 'string' ? html.includes(p) : p.test(html)));
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
console.log('\nAll HL-LHC enrichment page tests passed.');
process.exit(0);
