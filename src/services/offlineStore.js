// Each account/school has its own durable snapshot and outbox. Credentials are never queued.
const collections = new Map();
const PREFIX = "eduregistro-offline-v1:";
let activeUser = null;
let syncing = false;
let lastError = "";

export function offlineKey(user) {
  if (!user?.id || !user?.escolaId) throw new Error("Usuário sem escola vinculada.");
  return `${PREFIX}${user.id}:${user.escolaId}`;
}

function read(user) {
  const value = localStorage.getItem(offlineKey(user));
  return value ? JSON.parse(value) : { data: {}, queue: [] };
}

function save(user, state) {
  // Failure (quota/private mode) must reach the caller: never report an unsaved write as saved.
  localStorage.setItem(offlineKey(user), JSON.stringify(state));
  window.dispatchEvent(new Event("offline-status"));
}

function locked(user, task) {
  return navigator.locks
    ? navigator.locks.request(offlineKey(user), task)
    : task();
}

export function setOfflineUser(user) {
  activeUser = user;
  lastError = "";
}

export function offlineStatus(user) {
  const queue = user?.escolaId ? read(user).queue : [];
  return { pending: queue.length, syncing, error: lastError };
}

export function isNetworkError(error) {
  const cause = error?.cause || error;
  return navigator.onLine === false ||
    /Failed to fetch|NetworkError|Load failed|fetch failed|network request|AbortError|TimeoutError|timed out/i.test(`${cause?.name || ""}: ${cause?.message || ""}`);
}

function overlay(state, name) {
  let rows = [...(state.data[name] || [])];
  for (const item of state.queue.filter((entry) => entry.name === name)) {
    for (const row of item.rows) {
      const index = rows.findIndex((entry) => entry.id === row.id);
      if (index < 0) rows.unshift(row);
      else rows[index] = { ...rows[index], ...row };
    }
  }
  return rows;
}

export function offlineCollection(name, remoteList, operations) {
  const collection = {
    async list(user) {
      if (navigator.onLine !== false) {
        try {
          const rows = await remoteList(user);
          await locked(user, () => {
            const state = read(user);
            state.data[name] = rows;
            save(user, state);
          });
        } catch (error) {
          if (!isNetworkError(error)) throw error;
        }
      }
      const state = read(user);
      if (!state.data[name] && !state.queue.some((item) => item.name === name)) {
        throw new Error("Estes dados ainda não estão disponíveis off-line. Conecte-se para carregá-los.");
      }
      return overlay(state, name);
    },
    async mutate(user, operation, args, rows) {
      if (activeUser?.id !== user.id || activeUser?.escolaId !== user.escolaId) {
        throw new Error("Entre novamente para salvar alterações.");
      }
      await locked(user, () => {
        const state = read(user);
        state.queue.push({ id: crypto.randomUUID(), name, operation, args, rows });
        save(user, state);
      });
      // Sending runs separately; the durable local write is already complete.
      window.dispatchEvent(new Event("offline-pending"));
      return rows.length === 1 ? rows[0] : rows;
    },
    remoteList,
    operations,
  };
  collections.set(name, collection);
  return collection;
}

export async function syncOffline(user) {
  if (syncing || navigator.onLine === false || !user?.escolaId) return false;
  syncing = true;
  lastError = "";
  window.dispatchEvent(new Event("offline-status"));
  let changed = false;
  try {
    const synchronize = async () => {
      const isCurrent = () => activeUser?.id === user.id && activeUser?.escolaId === user.escolaId;
      while (isCurrent()) {
        const state = read(user);
        const item = state.queue[0];
        if (!item) break;
        const collection = collections.get(item.name);
        if (!collection) throw new Error("Abra novamente o aplicativo para sincronizar.");
        const result = await collection.operations[item.operation](user, ...item.args);
        await locked(user, () => {
          const latest = read(user);
          const rows = Array.isArray(result) ? result : result?.id ? [result] : item.rows;
          for (const row of rows) {
            const previous = latest.data[item.name] || [];
            latest.data[item.name] = [row, ...previous.filter((entry) => entry.id !== row.id)];
          }
          // Re-read after the request: another tab may have appended new changes.
          latest.queue = latest.queue.filter((entry) => entry.id !== item.id);
          save(user, latest);
        });
        changed = true;
      }
      if (!isCurrent()) return;
      for (const [name, collection] of collections) {
        const rows = await collection.remoteList(user);
        if (!isCurrent()) return;
        await locked(user, () => {
          const state = read(user);
          changed ||= JSON.stringify(state.data[name]) !== JSON.stringify(rows);
          state.data[name] = rows;
          save(user, state);
        });
      }
    };
    if (navigator.locks) await navigator.locks.request(`${offlineKey(user)}:sync`, synchronize);
    else await synchronize();
  } catch (error) {
    lastError = isNetworkError(error)
      ? "Sem conexão com o servidor. As alterações continuam salvas neste dispositivo."
      : `Sincronização pendente: ${error.message}`;
  } finally {
    syncing = false;
    window.dispatchEvent(new Event("offline-status"));
    if (changed) window.dispatchEvent(new Event("offline-data-updated"));
  }
  return changed;
}
