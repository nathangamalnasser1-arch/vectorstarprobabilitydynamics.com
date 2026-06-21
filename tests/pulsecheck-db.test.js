/**
 * Unit tests for PulseCheck localStorage data layer.
 * Run with: node tests/pulsecheck-db.test.js
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

function createStorage() {
  const store = new Map();
  return {
    getItem(key) { return store.has(key) ? store.get(key) : null; },
    setItem(key, value) { store.set(key, String(value)); },
    removeItem(key) { store.delete(key); },
    clear() { store.clear(); },
  };
}

function loadDB(storage) {
  const scriptPath = path.join(__dirname, '..', 'pulsecheck', 'js', 'db.js');
  const code = fs.readFileSync(scriptPath, 'utf8').replace('const DB =', 'var DB =');
  const sandbox = { localStorage: storage };
  vm.runInNewContext(code, sandbox);
  assert.ok(sandbox.DB, 'DB module failed to load');
  return sandbox.DB;
}

test('getTasks returns empty array when unset', () => {
  const DB = loadDB(createStorage());
  assert.equal(JSON.stringify(DB.getTasks()), '[]');
});

test('saveTasks and getTasks round-trip', () => {
  const DB = loadDB(createStorage());
  const tasks = [{ id: 'a', name: 'Write', createdAt: 1, removedAt: null }];
  DB.saveTasks(tasks);
  assert.equal(JSON.stringify(DB.getTasks()), JSON.stringify(tasks));
});

test('addCheckpoint appends checkpoint records', () => {
  const DB = loadDB(createStorage());
  DB.addCheckpoint({ id: 'cp1', taskId: 'a', timestamp: 10, pct: 50, comment: null, action: 'answered' });
  DB.addCheckpoint({ id: 'cp2', taskId: 'a', timestamp: 20, pct: 80, comment: 'done', action: 'answered' });
  assert.equal(DB.getCheckpoints().length, 2);
  assert.equal(DB.getCheckpoints()[1].pct, 80);
});

test('archiveDay stores session snapshot and deduplicates by session id', () => {
  const DB = loadDB(createStorage());
  const session = { id: 's1', startedAt: 100, endedAt: 200, intervalMinutes: 20 };
  DB.saveSession(session);
  DB.saveTasks([{ id: 't1', name: 'Task', createdAt: 100, removedAt: null }]);
  DB.addCheckpoint({ id: 'cp1', taskId: 't1', timestamp: 150, pct: 40, comment: null, action: 'answered' });

  DB.archiveDay();
  DB.archiveDay();

  const history = DB.getHistory();
  assert.equal(history.length, 1);
  assert.equal(history[0].session.id, 's1');
  assert.equal(history[0].tasks.length, 1);
  assert.equal(history[0].checkpoints.length, 1);
});

test('checkpoint timer helpers persist next fire time', () => {
  const DB = loadDB(createStorage());
  assert.equal(DB.getNextCheckpoint(), null);
  DB.setNextCheckpoint(1234567890);
  assert.equal(DB.getNextCheckpoint(), 1234567890);
  DB.clearNextCheckpoint();
  assert.equal(DB.getNextCheckpoint(), null);
});

test('clearToday removes active day keys only', () => {
  const storage = createStorage();
  const DB = loadDB(storage);
  DB.saveTasks([{ id: 't1', name: 'Task', createdAt: 1, removedAt: null }]);
  DB.saveSession({ id: 's1', startedAt: 1, endedAt: null, intervalMinutes: 15 });
  DB.addCheckpoint({ id: 'cp1', taskId: 't1', timestamp: 2, pct: 10, comment: null, action: 'answered' });
  DB.setNextCheckpoint(999);
  DB.archiveDay();

  DB.clearToday();

  assert.equal(JSON.stringify(DB.getTasks()), '[]');
  assert.equal(DB.getSession(), null);
  assert.equal(JSON.stringify(DB.getCheckpoints()), '[]');
  assert.equal(DB.getNextCheckpoint(), null);
  assert.equal(DB.getHistory().length, 1);
});
