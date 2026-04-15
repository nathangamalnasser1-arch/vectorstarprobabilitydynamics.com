const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const path = require("node:path");

function loadGameScript() {
  const scriptPath = path.join(__dirname, "..", "script.js");
  const code = fs.readFileSync(scriptPath, "utf8");
  const sandbox = {
    globalThis: {},
    window: {},
    document: undefined,
  };
  vm.runInNewContext(code, sandbox);
  return sandbox.globalThis.LetterGame || sandbox.window.LetterGame;
}

test("creates all 26 uppercase letters", () => {
  const game = loadGameScript();
  assert.equal(game.LETTERS.length, 26);
  assert.equal(game.LETTERS[0], "A");
  assert.equal(game.LETTERS[25], "Z");
});

test("next index wraps forward from end", () => {
  const game = loadGameScript();
  assert.equal(game.getNextLetterIndex(25, "next", 26), 0);
});

test("next index wraps backward from beginning", () => {
  const game = loadGameScript();
  assert.equal(game.getNextLetterIndex(0, "previous", 26), 25);
});

test("mobile single-card mode activates for small widths", () => {
  const game = loadGameScript();
  assert.equal(game.isMobileSingleCardWidth(768), true);
  assert.equal(game.isMobileSingleCardWidth(500), true);
  assert.equal(game.isMobileSingleCardWidth(769), false);
});

test("farm animals include horse and sound phrase", () => {
  const game = loadGameScript();
  const horse = game.FARM_ANIMALS.find((animal) => animal.name === "Horse");
  assert.ok(horse);
  assert.equal(game.getAnimalSoundPhrase(horse), "Horse says Neigh");
});

test("baby mode size levels cycle across three steps", () => {
  const game = loadGameScript();
  assert.equal(game.normalizeBabySizeLevel(1), 1);
  assert.equal(game.normalizeBabySizeLevel(3), 3);
  assert.equal(game.normalizeBabySizeLevel(99), 1);

  assert.equal(game.getNextBabySizeLevel(1), 2);
  assert.equal(game.getNextBabySizeLevel(2), 3);
  assert.equal(game.getNextBabySizeLevel(3), 1);
});

test("baby mode random color generator returns hsl values", () => {
  const game = loadGameScript();
  const fakeRandom = (() => {
    const values = [0.5, 0.25, 0.75];
    let index = 0;
    return () => {
      const value = values[index];
      index = (index + 1) % values.length;
      return value;
    };
  })();

  assert.equal(game.getRandomKidColor(fakeRandom), "hsl(180deg 78% 53%)");
});

test("baby mode random motion creates deterministic shift and spin", () => {
  const game = loadGameScript();
  const fakeRandom = (() => {
    const values = [0.0, 1.0, 0.5];
    let index = 0;
    return () => {
      const value = values[index];
      index = (index + 1) % values.length;
      return value;
    };
  })();

  const motion = game.getRandomBabyMotion(fakeRandom);
  assert.equal(motion.shiftX, -18);
  assert.equal(motion.shiftY, 15);
  assert.equal(motion.rotation, 0);
});

test("baby mode chooses requested sound names randomly", () => {
  const game = loadGameScript();
  assert.equal(game.getRandomBabySoundName(() => 0.0), "laugh");
  assert.equal(game.getRandomBabySoundName(() => 0.21), "boing");
  assert.equal(game.getRandomBabySoundName(() => 0.99), "pop");
});

test("baby mode maps sounds to kid-friendly haptic patterns", () => {
  const game = loadGameScript();
  assert.equal(game.getHapticPatternForBabySound("laugh").join(","), "14,18,14");
  assert.equal(game.getHapticPatternForBabySound("snap").join(","), "12");
  assert.equal(game.getHapticPatternForBabySound("unknown").join(","), "18,12,30");
});
