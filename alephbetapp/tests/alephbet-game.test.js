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
  return sandbox.globalThis.AlephbetGame || sandbox.window.AlephbetGame;
}

test("contains 22 hebrew letters", () => {
  const game = loadGameScript();
  assert.equal(game.ALEPHBET.length, 22);
  assert.equal(game.ALEPHBET[0].name, "Aleph");
  assert.equal(game.ALEPHBET[21].name, "Tav");
});

test("each letter includes example word, sound, and definition", () => {
  const game = loadGameScript();

  game.ALEPHBET.forEach((letter) => {
    assert.equal(typeof letter.word, "string");
    assert.equal(letter.word.length > 0, true);
    assert.equal(typeof letter.wordSound, "string");
    assert.equal(letter.wordSound.length > 0, true);
    assert.equal(typeof letter.definition, "string");
    assert.equal(letter.definition.length > 0, true);
    assert.equal(letter.word.startsWith(letter.hebrew), true);
  });
});

test("speech text uses english teaching format", () => {
  const game = loadGameScript();
  const text = game.buildSpeechText({
    name: "Shin",
    pronunciation: "SHEEN",
    word: "שמש",
    wordSound: "shemesh",
    definition: "sun",
  });
  assert.equal(
    text,
    "Shin. Pronounced SHEEN. Word: שמש, sounds like shemesh. Definition: sun."
  );
});

test("index wraps in both directions", () => {
  const game = loadGameScript();
  assert.equal(game.getNextLetterIndex(21, "next", 22), 0);
  assert.equal(game.getNextLetterIndex(0, "previous", 22), 21);
});

test("mobile mode activates on small screens", () => {
  const game = loadGameScript();
  assert.equal(game.isMobileSingleCardWidth(768), true);
  assert.equal(game.isMobileSingleCardWidth(900), false);
});

test("calculates hebrew gematria totals and per-letter values", () => {
  const game = loadGameScript();
  const details = game.calculateGematriaDetails("שלום");

  assert.equal(details.scriptType, "hebrew");
  assert.equal(details.total, 376);
  assert.equal(details.letters.map((item) => item.value).join(","), "300,30,6,40");
});

test("calculates english gematria totals with A1-Z26 mapping", () => {
  const game = loadGameScript();
  const details = game.calculateGematriaDetails("cab");

  assert.equal(details.scriptType, "english");
  assert.equal(details.total, 6);
  assert.equal(details.letters.map((item) => item.value).join(","), "3,1,2");
});

test("detects mixed script input", () => {
  const game = loadGameScript();
  assert.equal(game.getInputScriptType("shalom שלום"), "mixed");
});

test("returns local synonym suggestions for known english and hebrew words", () => {
  const game = loadGameScript();
  const englishSynonyms = game.buildFallbackSynonyms("light", "english");
  const hebrewSynonyms = game.buildFallbackSynonyms("שלום", "hebrew");

  assert.equal(englishSynonyms.includes("glow"), true);
  assert.equal(hebrewSynonyms.includes("שלווה"), true);
});

test("baby mode size levels cycle across three steps", () => {
  const game = loadGameScript();
  assert.equal(game.normalizeBabySizeLevel(1), 1);
  assert.equal(game.normalizeBabySizeLevel(3), 3);
  assert.equal(game.normalizeBabySizeLevel(-5), 1);

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
