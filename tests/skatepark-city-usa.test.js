/**
 * Unit tests for the Skate City USA location panel in skatepark-city.html.
 * Run with: node tests/skatepark-city-usa.test.js
 */
const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, '..', 'skatepark-city.html');
const html = fs.readFileSync(htmlPath, 'utf8');

const required = {
  usaTabButton:            /id="ltab-us"/,
  usaPanelDiv:             /id="loc-us"/,
  switchLocUsaPanel:       /us:'loc-us'/,
  switchLocUsaTab:         /us:'ltab-us'/,
  switchLocUsaColor:       /us:'#ef4444'/,
  navLinkUsa:              /switchLoc\('us'\).*USA|USA.*switchLoc\('us'\)/,
  sevenLocationsHeading:   /SEVEN.*LOCATIONS|SEVEN<br>LOCATIONS/,
  taosCandidateSite:       /TAOS.*NM|Taos.*New Mexico/i,
  ashevilleCandidateSite:  /ASHEVILLE.*NC|Asheville.*Blue Ridge/i,
  bendCandidateSite:       /BEND.*OR|Bend.*Oregon|Bend.*Cascades/i,
  usaHeroStats:            /2,130m/,
  usaSunDays:              /300\+/,
  usaBuildCost:            /\$2\.4B/,
  usaRoadmap:              /Phase 0.*Site Selection|Site Selection/i,
  usaColor:                /#ef4444/,
  taosSkiValley:           /Taos Ski Valley/,
  endLocUs:                /end loc-us/,
};

let failed = 0;
for (const [name, pattern] of Object.entries(required)) {
  const ok = typeof pattern === 'string' ? html.includes(pattern) : pattern.test(html);
  if (!ok) {
    console.error('FAIL:', name);
    failed++;
  } else {
    console.log('OK  :', name);
  }
}

if (failed > 0) {
  console.error('\n' + failed + ' test(s) failed.');
  process.exit(1);
}
console.log('\nAll Skate City USA tests passed.');
process.exit(0);
