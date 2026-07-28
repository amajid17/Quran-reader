// src/types.ts

import type { NavigatorScreenParams } from '@react-navigation/native';

export interface SurahMeta {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  numberOfAyahs: number;
  revelationType: 'Meccan' | 'Medinan';
  juzNumber: number;
}

export interface Ayah {
  number: number;
  numberInSurah: number;
  text: string;
  juz: number;
  page: number;
  sajda: boolean;
  translation?: string;
}

export interface SurahData {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  numberOfAyahs: number;
  revelationType: string;
  ayahs: Ayah[];
}

export interface JuzEntry {
  number: number;
  arabicName: string;
  startSurah: number;
  startAyah: number;
  surahName: string;
  endSurah: number;
  endAyah: number;
}

export interface Bookmark {
  surahNumber: number;
  ayahNumber: number;
  surahNameArabic: string;
  surahNameEn: string;
  textPreview: string;
  savedAt: number;
}

// ── App settings ─────────────────────────────────────────────────────────────

export interface AppSettings {
  fontSizeScale: number;
  tajweedRules: {
    madd: boolean;
    ghunnah: boolean;
    ikhfa: boolean;
    idgham: boolean;
    iqlab: boolean;
    qalqalah: boolean;
    silent: boolean;
  };
  showBismillah: boolean;
  translationLanguage: 'en';
  /** 'dark' = Deep Night (default/brand). 'light' = Parchment Light. */
  uiTheme: 'dark' | 'light';
}

export const DEFAULT_SETTINGS: AppSettings = {
  fontSizeScale: 0.5,
  tajweedRules: {
    madd: true,
    ghunnah: true,
    ikhfa: true,
    idgham: true,
    iqlab: true,
    qalqalah: true,
    silent: true,
  },
  showBismillah: true,
  translationLanguage: 'en',
  uiTheme: 'dark',
};

// ── Navigation param types ────────────────────────────────────────────────────

export type QuranStackParamList = {
  Home: undefined;
  Reader: { surahNumber: number; scrollToAyah?: number };
};

export type RootTabParamList = {
  Quran: NavigatorScreenParams<QuranStackParamList>;
  Juz: undefined;
  Bookmarks: undefined;
};

export type RootStackParamList = {
  Onboarding: undefined;
  MainTabs: undefined;
  Settings: undefined;
};
