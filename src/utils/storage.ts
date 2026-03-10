import localforage from 'localforage';

// Configure localforage instance
localforage.config({
  name: 'PourOverApp',
  version: 1.0,
  storeName: 'coffee_data',
  description: 'Offline storage for Pour-Over Coffee App'
});

export const StorageKeys = {
  BEANS: 'beans',
  HISTORY: 'history',
  SETTINGS: 'settings',
  RATE_LIMIT: 'rate_limit',
  HAS_SEEN_ONBOARDING: 'has_seen_onboarding',
};

/**
 * Generic getter
 */
export async function getItem<T>(key: string): Promise<T | null> {
  try {
    return await localforage.getItem<T>(key);
  } catch (err) {
    console.error(`Error getting item ${key}:`, err);
    return null;
  }
}

/**
 * Generic setter
 */
export async function setItem<T>(key: string, value: T): Promise<void> {
  try {
    await localforage.setItem(key, value);
  } catch (err) {
    console.error(`Error setting item ${key}:`, err);
  }
}

/**
 * Generic remover
 */
export async function removeItem(key: string): Promise<void> {
  try {
    await localforage.removeItem(key);
  } catch (err) {
    console.error(`Error removing item ${key}:`, err);
  }
}
