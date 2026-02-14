
const DB_NAME = 'FamilyFinanceDB';
const DB_VERSION = 1;

export const STORES = {
  MEMBERS: 'members',
  ASSETS: 'assets',
  DEBTS: 'debts',
  INCOME: 'income'
};

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORES.MEMBERS)) db.createObjectStore(STORES.MEMBERS, { keyPath: 'id' });
      if (!db.objectStoreNames.contains(STORES.ASSETS)) db.createObjectStore(STORES.ASSETS, { keyPath: 'id' });
      if (!db.objectStoreNames.contains(STORES.DEBTS)) db.createObjectStore(STORES.DEBTS, { keyPath: 'id' });
      if (!db.objectStoreNames.contains(STORES.INCOME)) db.createObjectStore(STORES.INCOME, { keyPath: 'id' });
    };
  });
};

export const dbService = {
  async getAll<T>(storeName: string): Promise<T[]> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  async put<T>(storeName: string, item: T): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(item);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  async delete(storeName: string, id: string): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
};
