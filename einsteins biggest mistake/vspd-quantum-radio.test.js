/**
 * Unit tests for VSPD Quantum Radio & Time Microscope page.
 * Run: npm install && npm test
 */
const fs = require('fs');
const path = require('path');

function loadHtml() {
  const htmlPath = path.join(__dirname, 'vspd-quantum-radio.html');
  return fs.readFileSync(htmlPath, 'utf8');
}

function getJSDOM() {
  try {
    return require('jsdom');
  } catch (e) {
    console.error('Run npm install first (jsdom required).');
    process.exit(1);
  }
}

function runTests() {
  const html = loadHtml();
  const { JSDOM } = getJSDOM();
  const dom = new JSDOM(html, { runScripts: 'outside-only', resources: 'usable' });
  const doc = dom.window.document;
  const body = doc.body;

  let passed = 0;
  let failed = 0;

  function ok(condition, name) {
    if (condition) {
      passed++;
      console.log('  ✓ ' + name);
    } else {
      failed++;
      console.log('  ✗ ' + name);
    }
  }

  console.log('VSPD Quantum Radio — unit tests\n');

  ok(doc.querySelector('title') && doc.querySelector('title').textContent.includes('VSPD'), 'Page title includes VSPD');
  ok(doc.querySelector('h1') && doc.querySelector('h1').textContent.includes('Time Microscope'), 'Header contains Time Microscope');
  ok(doc.getElementById('mode-toggle'), 'Mode toggle (Kid/Expert) exists');
  ok(doc.getElementById('dt-slider'), 'Δt slider exists');
  ok(doc.getElementById('sirius-toggle'), 'Sirius B toggle exists');
  ok(doc.getElementById('p5-container'), 'p5.js container exists');
  ok(body.getAttribute('data-mode') === 'kid' || body.getAttribute('data-mode') === 'expert', 'Body has data-mode attribute');

  const kidOnly = doc.querySelectorAll('.kid-only');
  const expertOnly = doc.querySelectorAll('.expert-only');
  ok(kidOnly.length >= 1, 'Kid-only content sections exist');
  ok(expertOnly.length >= 1, 'Expert-only content sections exist');

  const mathBlocks = doc.querySelectorAll('[class*="bg-slate-800"]');
  ok(html.includes('Psi_'), 'MathJax equation (Psi_obs) present in HTML');
  ok(html.includes('lambda_'), 'Redshift equation (lambda) present');
  ok(html.includes('Delta t'), 'Quality factor / Δt relation referenced');

  const footerLinks = doc.querySelectorAll('footer a[href*="cern"]');
  ok(footerLinks.length >= 1, 'Footer includes CERN Open Data link');

  body.setAttribute('data-mode', 'expert');
  ok(body.getAttribute('data-mode') === 'expert', 'data-mode can be set to expert');
  body.setAttribute('data-mode', 'kid');
  ok(body.getAttribute('data-mode') === 'kid', 'data-mode can be set to kid');

  console.log('\n' + passed + ' passed, ' + failed + ' failed.');
  process.exit(failed > 0 ? 1 : 0);
}

runTests();
