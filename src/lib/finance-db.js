const DB_NAME = 'finance-local-db';
const DB_VERSION = 1;
const STORE_NAMES = ['accounts', 'categories', 'transactions', 'budgets', 'meta', 'syncQueue'];

let dbPromise;

function promisifyRequest(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function withStore(storeName, mode, handler) {
  return getFinanceDb().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, mode);
        const store = tx.objectStore(storeName);
        let result;

        tx.oncomplete = () => resolve(result);
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error);

        Promise.resolve(handler(store))
          .then((value) => {
            result = value;
          })
          .catch(reject);
      })
  );
}

export function canUseIndexedDb() {
  return typeof window !== 'undefined' && 'indexedDB' in window;
}

export function getFinanceDb() {
  if (!canUseIndexedDb()) {
    return Promise.reject(new Error('IndexedDB is not available in this environment.'));
  }

  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = () => {
        const db = request.result;
        STORE_NAMES.forEach((storeName) => {
          if (!db.objectStoreNames.contains(storeName)) {
            db.createObjectStore(storeName, { keyPath: 'id' });
          }
        });
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  return dbPromise;
}

export function getAllRecords(storeName) {
  return withStore(storeName, 'readonly', (store) => promisifyRequest(store.getAll()));
}

export function getRecord(storeName, id) {
  return withStore(storeName, 'readonly', (store) => promisifyRequest(store.get(id)));
}

export function putRecord(storeName, record) {
  return withStore(storeName, 'readwrite', (store) => promisifyRequest(store.put(record)));
}

export function deleteRecord(storeName, id) {
  return withStore(storeName, 'readwrite', (store) => promisifyRequest(store.delete(id)));
}

export function bulkPutRecords(storeName, records) {
  return withStore(storeName, 'readwrite', async (store) => {
    for (const record of records) {
      await promisifyRequest(store.put(record));
    }
    return true;
  });
}

export function clearStore(storeName) {
  return withStore(storeName, 'readwrite', (store) => promisifyRequest(store.clear()));
}

export async function getMeta(key, fallback = null) {
  const value = await getRecord('meta', key);
  return value?.value ?? fallback;
}

export function setMeta(key, value) {
  return putRecord('meta', { id: key, value });
}

export async function getSyncQueue() {
  const queue = await getAllRecords('syncQueue');
  return queue.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export function enqueueSyncOperation(operation) {
  return putRecord('syncQueue', operation);
}

export function removeSyncOperation(id) {
  return deleteRecord('syncQueue', id);
}
