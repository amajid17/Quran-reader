// src/data/settingsService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AppSettings } from '../types';
import { DEFAULT_SETTINGS } from '../types';

const STORAGE_KEY = 'quran-reader:settings:v1';
type Listener = (settings: AppSettings) => void;

let cache: AppSettings = { ...DEFAULT_SETTINGS };
let loaded = false;
const listeners = new Set<Listener>();

async function ensureLoaded() {
  if (loaded) return;
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      const saved = JSON.parse(raw) as Partial<AppSettings>;

      // Guard every value against corrupted or unexpected types.
      // If a value fails validation it silently falls back to the
      // default — the user loses that one preference but the app
      // never crashes from a bad AsyncStorage read.
      const scale = Number(saved.fontSizeScale);
      const safeScale = Number.isFinite(scale)
        ? Math.max(0, Math.min(1, scale))
        : DEFAULT_SETTINGS.fontSizeScale;

      const safeRules = { ...DEFAULT_SETTINGS.tajweedRules };
      if (saved.tajweedRules && typeof saved.tajweedRules === 'object') {
        for (const key of Object.keys(DEFAULT_SETTINGS.tajweedRules) as
          Array<keyof AppSettings['tajweedRules']>) {
          if (typeof saved.tajweedRules[key] === 'boolean') {
            safeRules[key] = saved.tajweedRules[key] as boolean;
          }
        }
      }

      cache = {
        ...DEFAULT_SETTINGS,
        ...saved,
        fontSizeScale: safeScale,
        tajweedRules:  safeRules,
        // uiTheme must be exactly 'dark' or 'light' — anything else
        // (including undefined or a future renamed value) falls back to dark.
        uiTheme: saved.uiTheme === 'light' ? 'light' : 'dark',
        // showBismillah must be a boolean — coerce if needed
        showBismillah: typeof saved.showBismillah === 'boolean'
          ? saved.showBismillah
          : DEFAULT_SETTINGS.showBismillah,
      };
    }
  } catch {
    cache = { ...DEFAULT_SETTINGS };
  }
  loaded = true;
}

async function persist() {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
  listeners.forEach(l => l(cache));
}

// Shared Arabic font-size mapping (fontSizeScale is stored 0..1).
// Both SettingsScreen's live preview and ReaderScreen's actual rendering
// import this — one source of truth, can't drift out of sync.
export const FONT_MIN = 20;
export const FONT_MAX = 34;
export function scaleToFontSize(scale: number): number {
  return Math.round(FONT_MIN + scale * (FONT_MAX - FONT_MIN));
}

export const settingsService = {
  async get(): Promise<AppSettings> {
    await ensureLoaded();
    return cache;
  },
  async update(partial: Partial<AppSettings>): Promise<void> {
    await ensureLoaded();
    cache = { ...cache, ...partial };
    await persist();
  },
  async updateTajweedRule(rule: keyof AppSettings['tajweedRules'], value: boolean): Promise<void> {
    await ensureLoaded();
    cache = { ...cache, tajweedRules: { ...cache.tajweedRules, [rule]: value } };
    await persist();
  },
  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    if (loaded) listener(cache);
    else ensureLoaded().then(() => listener(cache));
    return () => listeners.delete(listener);
  },
};
