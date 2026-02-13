/**
 * Unit tests for the Thought Experiment (Bouncing Ball Universe) page.
 * Run with: node tests/thought-experiment.test.js
 */
const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, '..', 'thought-experiment.html');
const html = fs.readFileSync(htmlPath, 'utf8');

const required = {
  title: /Thought Experiment|Bouncing Ball/i,
  bouncingBallsCanvas: /id="bouncing-balls-canvas"/,
  playPauseBtn: /id="play-pause-btn"/,
  resetBtn: /id="reset-btn"/,
  cloudBtn: /id="cloud-btn"/,
  gravityBtn: /id="gravity-btn"/,
  ballCountSlider: /id="ball-count-slider"/,
  bouncingBallsScript: /bouncing-balls\.js/,
  // Controls must NOT use inline handlers (CSP blocks them)
  noInlineOnclick: !html.includes('onclick="'),
  noInlineOninput: !html.includes('oninput="'),
};

let failed = 0;
for (const [name, condition] of Object.entries(required)) {
  const ok = typeof condition === 'boolean' ? condition : 
    (typeof condition === 'string' ? html.includes(condition) : condition.test(html));
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
console.log('\nAll Thought Experiment tests passed.');
process.exit(0);
