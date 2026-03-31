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
const proxyWorkerPath = path.join(root, 'iamcurious-proxy', 'worker.js');
const proxyReadmePath = path.join(root, 'iamcurious-proxy', 'README.md');

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
  if (!src.includes('VITE_AI_PROXY_URL') || !src.includes('askGuide(')) {
    fail('CuriousKid.jsx missing proxy URL wiring');
  } else {
    console.log('OK: CuriousKid.jsx proxy wiring');
  }
}

if (!fs.existsSync(proxyWorkerPath)) {
  fail('iamcurious-proxy/worker.js missing');
} else {
  const worker = fs.readFileSync(proxyWorkerPath, 'utf8');
  if (!worker.includes('openrouter.ai/api/v1/chat/completions') || !worker.includes('OPENROUTER_API_KEY')) {
    fail('Proxy worker missing OpenRouter integration');
  } else {
    console.log('OK: proxy worker OpenRouter wiring');
  }
}

if (!fs.existsSync(proxyReadmePath)) {
  fail('iamcurious-proxy/README.md missing');
} else {
  console.log('OK: proxy setup README present');
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
