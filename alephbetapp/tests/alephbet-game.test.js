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
