/**
 * I Am Curious app: project layout and built static bundle.
 * Run: node tests/iamcurious-app.test.js
 * Build first: cd iamcurious && npm install && npm run build
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const appDir = path.join(root, 'iamcurious');
const distIndex = path.join(appDir, 'dist', 'index.html');
const pkgPath = path.join(appDir, 'package.json');
const componentPath = path.join(appDir, 'src', 'CuriousKid.jsx');

let failed = 0;

function fail(msg) {
  console.error('FAIL:', msg);
  failed++;
}

if (!fs.existsSync(pkgPath)) {
  fail('iamcurious/package.json missing');
} else {
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  if (!pkg.scripts?.build) {
    fail('iamcurious/package.json missing build script');
  } else {
    console.log('OK: package.json has build script');
  }
}

if (!fs.existsSync(componentPath)) {
  fail('iamcurious/src/CuriousKid.jsx missing');
} else {
  const src = fs.readFileSync(componentPath, 'utf8');
  if (!src.includes('VITE_ANTHROPIC_API_KEY') || !src.includes('api.anthropic.com')) {
    fail('CuriousKid.jsx missing API env or endpoint');
  } else {
    console.log('OK: CuriousKid.jsx API wiring');
  }
}

if (!fs.existsSync(distIndex)) {
  fail('iamcurious/dist/index.html missing — run: cd iamcurious && npm install && npm run build');
} else {
  const html = fs.readFileSync(distIndex, 'utf8');
  if (!/id=["']root["']/.test(html)) {
    fail('dist/index.html unexpected structure');
  } else {
    console.log('OK: dist/index.html present');
  }
}

if (failed > 0) {
  console.error('\n' + failed + ' test(s) failed.');
  process.exit(1);
}
console.log('\nAll I Am Curious app tests passed.');
process.exit(0);
