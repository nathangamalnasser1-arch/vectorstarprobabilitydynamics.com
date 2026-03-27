/**
 * Skatepark City — El Salvador panel: underground pumptrack spine (not subways).
 * Run: node tests/skatepark-city-underground.test.js
 */
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const htmlPath = path.join(__dirname, '..', 'skatepark-city.html');
const html = fs.readFileSync(htmlPath, 'utf8');

const start = html.indexOf('<div id="loc-sv"');
const end = html.indexOf('</div><!-- end loc-sv -->');
assert.ok(start > 0 && end > start, 'loc-sv panel bounds');
const svPanel = html.slice(start, end);

assert.ok(/Underground way — pumptracks, not subways/i.test(svPanel), 'section heading');
assert.ok(/UWPT/i.test(svPanel) && /Underway Pumptrack/i.test(svPanel), 'UWPT acronym');
assert.ok(/hydronically heated|heated UWPT/i.test(svPanel), 'heated UWPT');
assert.ok(/many exits/i.test(svPanel), 'many exits');
assert.ok(/ski, snowboard, and snowmobile/i.test(svPanel), 'winter exterior modes');
assert.ok(/Skatepark City Quebec/i.test(svPanel) && /Skatepark City China/i.test(svPanel), 'Quebec and China editions');
assert.ok(/~12 ft \(~3\.7 m\) vertical drops/i.test(svPanel), '12 ft vertical drops');
assert.ok(/double rollers/i.test(svPanel), 'direct vs double-roller pumptrack entry');
assert.ok(/stations/i.test(svPanel) && /exterior/i.test(svPanel), 'station and exterior access');
assert.ok(/rainy days/i.test(svPanel) && /UWPT water evacuation/i.test(svPanel), 'rainy-day UWPT drainage');
assert.ok(/stormwater/i.test(svPanel), 'stormwater network');
assert.ok(/not a conventional subway/i.test(svPanel), 'explicit not-subway framing');
assert.ok(/UWPT — underway pumptrack spine/i.test(svPanel), 'city levels row label');
assert.ok(/id="spc-pumptrack-underway-map"/.test(svPanel), 'fictive map SVG id');
assert.ok(/Fictive schematic — pumptrack underway/i.test(svPanel), 'fictive map section label');
assert.ok(/UWPT · HEATED/.test(svPanel), 'SVG heated UWPT label');

console.log('ok: skatepark-city underground pumptrack (El Salvador) checks passed');
