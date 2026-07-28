// src/data/bookmarkService.ts
//
// Single source of truth for saved ayahs. Backed by AsyncStorage, with an
// in-memory cache and a simple pub-sub pattern so ReaderScreen and
// BookmarksScreen stay in sync without needing React Context.
//
// Also owns last-read position (setLastRead / getLastRead / clearLastRead).

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Bookmark } from '../types';

const STORAGE_KEY   = 'quran-reader:bookmarks:v1';
const LAST_READ_KEY = 'quran-reader:lastread:v1';

export interface LastRead {
  surahNumber: number;
  ayahNumber:  number;
  surahNameEn: string;
  surahNameAr: string;
  readAt:      number;
}

type Listener = (bookmarks: Bookmark[]) => void;

let cache: Bookmark[] = [];
let loaded = false;
const listeners = new Set<Listener>();

async function persist() {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
  listeners.forEach(l => l(cache));
}

async function ensureLoaded() {
  if (loaded) return;
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    cache = raw ? JSON.parse(raw) : [];
  } catch {
    cache = [];
  }
  loaded = true;
}

export const bookmarkService = {

  // ── Bookmarks ─────────────────────────────────────────────────
  async getAll(): Promise<Bookmark[]> {
    await ensureLoaded();
    return [...cache].sort((a, b) => b.savedAt - a.savedAt);
  },

  async isBookmarked(surahNumber: number, ayahNumber: number): Promise<boolean> {
    await ensureLoaded();
    return cache.some(b => b.surahNumber === surahNumber && b.ayahNumber === ayahNumber);
  },

  async add(bookmark: Omit<Bookmark, 'savedAt'>): Promise<void> {
    await ensureLoaded();
    const exists = cache.some(
      b => b.surahNumber === bookmark.surahNumber && b.ayahNumber === bookmark.ayahNumber
    );
    if (exists) return;
    cache = [...cache, { ...bookmark, savedAt: Date.now() }];
    await persist();
  },

  async remove(surahNumber: number, ayahNumber: number): Promise<void> {
    await ensureLoaded();
    cache = cache.filter(
      b => !(b.surahNumber === surahNumber && b.ayahNumber === ayahNumber)
    );
    await persist();
  },

  /** Remove every saved bookmark. Used by Settings → Clear Bookmarks. */
  async clearAll(): Promise<void> {
    cache = [];
    await AsyncStorage.removeItem(STORAGE_KEY);
    listeners.forEach(l => l([]));
  },

  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    if (loaded) {
      listener(cache);
    } else {
      ensureLoaded().then(() => listener(cache));
    }
    return () => listeners.delete(listener);
  },

  // ── Last-read position ────────────────────────────────────────
  async setLastRead(
    surahNumber: number,
    ayahNumber:  number,
    surahNameEn: string,
    surahNameAr: string,
  ): Promise<void> {
    const data: LastRead = { surahNumber, ayahNumber, surahNameEn, surahNameAr, readAt: Date.now() };
    await AsyncStorage.setItem(LAST_READ_KEY, JSON.stringify(data));
  },

  async getLastRead(): Promise<LastRead | null> {
    try {
      const raw = await AsyncStorage.getItem(LAST_READ_KEY);
      return raw ? (JSON.parse(raw) as LastRead) : null;
    } catch {
      return null;
    }
  },

  /** Clear last-read position. Used by Settings → Clear Last Read Position. */
  async clearLastRead(): Promise<void> {
    await AsyncStorage.removeItem(LAST_READ_KEY);
  },
};
