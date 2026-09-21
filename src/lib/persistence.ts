// localStorage + IndexedDB helpers
const debouncers = new Map<string, ReturnType<typeof setTimeout>>();
export function saveLS(key: string, value: unknown, debounceMs = 200) {
  const run = () => { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* quota */ } };
  if (debounceMs <= 0) return run();
  clearTimeout(debouncers.get(key));
  debouncers.set(key, setTimeout(run, debounceMs));
}
export function loadLS<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch { return fallback; }
}

export function idb(): Promise<IDBDatabase> {
  return new Promise((res, rej) => {
    const rq = indexedDB.open("portfolio-os", 1);
    rq.onupgradeneeded = () => {
      const db = rq.result;
      if (!db.objectStoreNames.contains("kv")) db.createObjectStore("kv");
    };
    rq.onsuccess = () => res(rq.result);
    rq.onerror = () => rej(rq.error);
  });
}
export async function idbSet(key: string, value: unknown) {
  const db = await idb();
  return new Promise<void>((res, rej) => {
    const tx = db.transaction("kv", "readwrite");
    tx.objectStore("kv").put(value, key);
    tx.oncomplete = () => res(); tx.onerror = () => rej(tx.error);
  });
}
export async function idbGet<T>(key: string): Promise<T | undefined> {
  const db = await idb();
  return new Promise((res, rej) => {
    const rq = db.transaction("kv").objectStore("kv").get(key);
    rq.onsuccess = () => res(rq.result as T); rq.onerror = () => rej(rq.error);
  });
}
