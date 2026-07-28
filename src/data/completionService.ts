// src/data/completionService.ts
//
// Tracks which surahs have been fully read (i.e. the last ayah scrolled
// into view). Backed by AsyncStorage so completion persists across sessions.
// Same pub-sub pattern as bookmarkService for consistency.

import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'quran-reader:completed:v1';

type Listener = (completed: Set<number>) => void;

let cache    = new Set<number>();
let loaded   = false;
const listeners = new Set<Listener>();

async function ensureLoaded() {
  if (loaded) return;
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    cache = raw ? new Set<number>(JSON.parse(raw)) : new Set();
  } catch {
    cache = new Set();
  }
  loaded = true;
}

async function persist() {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([...cache]));
  listeners.forEach(l => l(new Set(cache)));
}

export const completionService = {
  /** Mark a surah as fully read. No-ops if already marked (avoids redundant writes). */
  async markComplete(surahNumber: number): Promise<void> {
    await ensureLoaded();
    if (cache.has(surahNumber)) return;
    cache.add(surahNumber);
    await persist();
  },

  async getCompleted(): Promise<Set<number>> {
    await ensureLoaded();
    return new Set(cache);
  },

  /** Subscribe to completion changes. Returns an unsubscribe function. */
  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    if (loaded) {
      listener(new Set(cache));
    } else {
      ensureLoaded().then(() => listener(new Set(cache)));
    }
    return () => listeners.delete(listener);
  },

  /** Clear all completion data (useful for settings / reset). */
  async clear(): Promise<void> {
    cache = new Set();
    await AsyncStorage.removeItem(STORAGE_KEY);
    listeners.forEach(l => l(new Set()));
  },
};
