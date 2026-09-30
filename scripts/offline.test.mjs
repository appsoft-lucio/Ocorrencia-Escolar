import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";

let store;
let memory;
const user = { id: "teacher-a", escolaId: "school-a" };
beforeEach(async () => {
  memory = new Map();
  globalThis.localStorage = {
    getItem: (key) => memory.get(key) || null,
    setItem: (key, value) => memory.set(key, value),
  };
  globalThis.window = new EventTarget();
  Object.defineProperty(globalThis, "navigator", { configurable: true, value: { onLine: true } });
  store = await import(`../src/services/offlineStore.js?test=${crypto.randomUUID()}`);
  store.setOfflineUser(user);
});

test("previously loaded records survive a network failure and are isolated by account and school", async () => {
  let fail = false;
  const records = store.offlineCollection("records", async () => {
    if (fail) throw new TypeError("Failed to fetch");
    return [{ id: "one", text: "saved" }];
  }, {});
  await records.list(user);
  fail = true;
  assert.equal((await records.list(user))[0].text, "saved");
  navigator.onLine = false;
  await assert.rejects(records.list({ ...user, id: "other" }), /disponíveis off-line/);
  await assert.rejects(records.list({ ...user, escolaId: "other" }), /disponíveis off-line/);
});

test("offline writes persist through reload and synchronize in order", async () => {
  let remote = [];
  const calls = [];
  const register = () => store.offlineCollection("records", async () => remote, {
    create: async (_user, row) => { calls.push(row.id); remote.push(row); return row; },
    update: async (_user, row) => { calls.push(row.text); remote = [row]; return row; },
  });
  let records = register();
  await records.list(user);
  navigator.onLine = false;
  await records.mutate(user, "create", [{ id: "one", text: "draft" }], [{ id: "one", text: "draft" }]);
  await records.mutate(user, "update", [{ id: "one", text: "final" }], [{ id: "one", text: "final" }]);
  store = await import(`../src/services/offlineStore.js?reload=${crypto.randomUUID()}`);
  store.setOfflineUser(user);
  records = register();
  assert.equal((await records.list(user))[0].text, "final");
  assert.equal(store.offlineStatus(user).pending, 2);
  navigator.onLine = true;
  await store.syncOffline(user);
  assert.deepEqual(calls, ["one", "final"]);
  assert.equal(store.offlineStatus(user).pending, 0);
  assert.equal((await records.list(user))[0].text, "final");
});

test("failed sends remain visible and retries do not duplicate acknowledged creates", async () => {
  const remote = new Map();
  let loseResponse = true;
  const records = store.offlineCollection("records", async () => [...remote.values()], {
    create: async (_user, row) => {
      if (remote.has(row.id)) return remote.get(row.id);
      remote.set(row.id, row);
      if (loseResponse) throw new TypeError("Failed to fetch");
      return row;
    },
  });
  await records.mutate(user, "create", [{ id: "stable-id" }], [{ id: "stable-id" }]);
  await store.syncOffline(user);
  assert.equal(store.offlineStatus(user).pending, 1);
  assert.match(store.offlineStatus(user).error, /Sem conexão/);
  loseResponse = false;
  await store.syncOffline(user);
  assert.equal(remote.size, 1);
  assert.equal(store.offlineStatus(user).pending, 0);
});

test("authorization failures do not fall back to old cached data", async () => {
  let denied = false;
  const records = store.offlineCollection("records", async () => {
    if (denied) throw new Error("Forbidden");
    return [{ id: "one" }];
  }, {});
  await records.list(user);
  denied = true;
  await assert.rejects(records.list(user), /Forbidden/);
});

test("storage quota failures reject writes instead of reporting success", async () => {
  const records = store.offlineCollection("records", async () => [], {});
  localStorage.setItem = () => { throw new Error("QuotaExceededError"); };
  await assert.rejects(records.mutate(user, "create", [], [{ id: "one" }]), /QuotaExceededError/);
  assert.equal(store.offlineStatus(user).pending, 0);
});

test("a write appended while synchronization is in flight is not lost", async () => {
  const remote = [];
  let records;
  records = store.offlineCollection("records", async () => remote, {
    create: async (_user, row) => {
      if (row.id === "one") await records.mutate(user, "create", [{ id: "two" }], [{ id: "two" }]);
      remote.push(row);
      return row;
    },
  });
  await records.mutate(user, "create", [{ id: "one" }], [{ id: "one" }]);
  await store.syncOffline(user);
  assert.deepEqual(remote.map((row) => row.id), ["one", "two"]);
  assert.equal(store.offlineStatus(user).pending, 0);
});

test("logout stops queued work and prevents writes by the previous account", async () => {
  let calls = 0;
  const records = store.offlineCollection("records", async () => [], {
    create: async () => { calls++; },
  });
  await records.mutate(user, "create", [], [{ id: "one" }]);
  store.setOfflineUser(null);
  await store.syncOffline(user);
  await assert.rejects(records.mutate(user, "create", [], [{ id: "two" }]), /Entre novamente/);
  assert.equal(calls, 0);
  assert.equal(store.offlineStatus(user).pending, 1);
});

test("new server changes are fetched even when there is no pending write", async () => {
  let remote = [{ id: "one", status: "Pendente" }];
  const records = store.offlineCollection("records", async () => remote, {});
  await records.list(user);
  remote = [{ id: "one", status: "Resolvida" }];
  assert.equal(await store.syncOffline(user), true);
  navigator.onLine = false;
  assert.equal((await records.list(user))[0].status, "Resolvida");
});
