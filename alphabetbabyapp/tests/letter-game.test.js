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
