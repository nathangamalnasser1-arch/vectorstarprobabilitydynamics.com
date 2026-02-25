/**
 * Unit tests for the Natapps page.
 * Run with: node tests/natapps.test.js
 */
const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, '..', 'natapps.html');
const html = fs.readFileSync(htmlPath, 'utf8');

const required = {
  title: /Natapps|Nathan.*Apps/i,
  periodicTablePoker: /periodictablepoker\.web\.app/,
  youknObtainium: /youknobtainium\.web\.app/,
  moreToCome: /more to come|coming soon/i,
  playButtons: /Play Now/,
  targetBlank: /target="_blank"/,
  noopener: /rel="noopener noreferrer"/,
};

let failed = 0;
for (const [name, pattern] of Object.entries(required)) {
  const ok = typeof pattern === 'string' ? html.includes(pattern) : pattern.test(html);
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
console.log('\nAll Natapps tests passed.');
process.exit(0);
