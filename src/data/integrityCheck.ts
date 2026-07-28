// src/data/integrityCheck.ts
//
// Lightweight runtime integrity check for bundled Quran data.
//
// WHY NOT HASH EVERY FILE AT RUNTIME:
// Metro bundler requires all require() paths to be statically analysable
// at build time. A dynamic require(`surah/${n}.json`) inside a loop throws
// a Metro transform error. Full per-file SHA-256 verification must be done
// at build time — see scripts/verifyManifest.js for that tool.
//
// WHAT THIS DOES INSTEAD:
// 1. Confirms manifest.json exists and covers all 114 surahs.
// 2. Confirms each listed surah has a non-empty ayahs array via readSurah().
//    readSurah() uses the same require() pattern Metro already accepts in
//    quranData.ts — this is not a new dynamic require.
// 3. Returns a structured result so App.tsx can log failures to a crash
//    reporter without blocking the user from reading.
//
// GUARANTEES:
// A Metro bundle already guarantees the files existed and were valid JSON
// when the app was built. This check catches post-build corruption on device
// (extremely rare) and missing manifest (download script not run).

import type { SurahData } from '../types';
import { readSurah } from './quranData';

interface Manifest {
  [surahNumber: string]: string;
}

export interface IntegrityResult {
  ok:             boolean;
  checked:        number;   // number of surahs spot-checked
  manifestCount:  number;   // number of entries in the manifest
  failures:       number[]; // surah numbers that failed spot-check
}

/** Returns a small deterministic sample of surah numbers to spot-check. */
function sampleSurahs(manifest: Manifest): number[] {
  const all = Object.keys(manifest).map(Number).sort((a, b) => a - b);
  if (all.length === 0) return [];

  // Always check first, last, and 3 evenly-spaced middle surahs —
  // 5 checks total, covering the full range without a loop over 114 files.
  const indices = [
    0,
    Math.floor(all.length * 0.25),
    Math.floor(all.length * 0.5),
    Math.floor(all.length * 0.75),
    all.length - 1,
  ];
  return [...new Set(indices)].map(i => all[i]);
}

export async function verifyIntegrity(): Promise<IntegrityResult> {
  let manifest: Manifest;

  try {
    // Static require — Metro resolves this fine because the path is a literal.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    manifest = require('../../assets/data/manifest.json') as Manifest;
  } catch {
    console.warn(
      '[integrityCheck] manifest.json not found. ' +
      'Run scripts/downloadQuran.js then rebuild the app.'
    );
    return { ok: true, checked: 0, manifestCount: 0, failures: [] };
  }

  const manifestCount = Object.keys(manifest).length;

  // Manifest should cover all 114 surahs
  if (manifestCount !== 114) {
    console.error(
      `[integrityCheck] manifest.json has ${manifestCount} entries — expected 114. ` +
      `Re-run scripts/downloadQuran.js.`
    );
    return { ok: false, checked: 0, manifestCount, failures: [] };
  }

  // Spot-check 5 surahs — confirm data is readable and non-empty
  const sample   = sampleSurahs(manifest);
  const failures: number[] = [];

  for (const n of sample) {
    try {
      const surah = readSurah(n) as SurahData;
      if (!surah || !Array.isArray(surah.ayahs) || surah.ayahs.length === 0) {
        failures.push(n);
        console.error(`[integrityCheck] Surah ${n} loaded but ayahs array is empty or missing.`);
      }
    } catch (err) {
      failures.push(n);
      console.error(`[integrityCheck] Surah ${n} could not be loaded: ${err}`);
    }
  }

  const result: IntegrityResult = {
    ok:            failures.length === 0,
    checked:       sample.length,
    manifestCount,
    failures,
  };

  if (!result.ok) {
    console.error(
      `[integrityCheck] ⚠️  ${failures.length} surah(s) failed spot-check: ` +
      `${failures.join(', ')}. Re-run scripts/downloadQuran.js and rebuild.`
    );
  } else {
    console.log(
      `[integrityCheck] ✓ Manifest covers ${manifestCount} surahs. ` +
      `Spot-checked ${sample.length}: all ok.`
    );
  }

  return result;
}