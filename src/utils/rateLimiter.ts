import { getItem, setItem } from './storage';
import { StorageKeys } from './storage';

export interface RateLimitData {
  count: number;
  lastReset: number; // timestamp
}

const MAX_REQUESTS_PER_DAY = 10;
const DAY_IN_MS = 24 * 60 * 60 * 1000;

export async function checkRateLimit(): Promise<{ allowed: boolean; remaining: number }> {
  const now = Date.now();
  let data = await getItem<RateLimitData>(StorageKeys.RATE_LIMIT);

  // If no data or last reset was more than a day ago, reset the count
  if (!data || now - data.lastReset > DAY_IN_MS) {
    data = { count: 0, lastReset: now };
  }

  const remaining = MAX_REQUESTS_PER_DAY - data.count;

  return {
    allowed: remaining > 0,
    remaining,
  };
}

export async function incrementRateLimit(): Promise<void> {
  const now = Date.now();
  let data = await getItem<RateLimitData>(StorageKeys.RATE_LIMIT);

  if (!data || now - data.lastReset > DAY_IN_MS) {
    data = { count: 1, lastReset: now };
  } else {
    data.count += 1;
  }

  await setItem(StorageKeys.RATE_LIMIT, data);
}
