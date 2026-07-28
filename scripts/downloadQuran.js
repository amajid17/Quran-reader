// scripts/downloadQuran.js
//
// Run once during development:
//   node scripts/downloadQuran.js
//
// Downloads all 114 surahs from the alquran.cloud tajweed API and writes
// them to assets/data/surah/. After every file is saved, generates a
// SHA-256 manifest at assets/data/manifest.json.
//
// The manifest is read at app launch by src/data/integrityCheck.ts.
// If any surah file has been altered (corrupted write, partial download,
// or tampering), the check logs a warning and the app falls back gracefully.
//
// This script is NEVER called at runtime — it is a build-time tool only.

const fs     = require('fs');
const path   = require('path');
const crypto = require('crypto');

const SURAH_DIR   = path.join(__dirname, '../assets/data/surah');
const MANIFEST    = path.join(__dirname, '../assets/data/manifest.json');
const BASE_URL    = 'https://api.alquran.cloud/v1/surah';
const EDITION     = 'quran-tajweed';
const DELAY_MS    = 250;   // polite delay between requests
const MAX_RETRIES = 3;

function sha256(str) {
  return crypto.createHash('sha256').update(str, 'utf8').digest('hex');
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchWithRetry(url, retries = MAX_RETRIES) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      if (attempt === retries) throw err;
      console.warn(`  ↺ Retry ${attempt}/${retries - 1} for ${url}`);
      await sleep(DELAY_MS * attempt);
    }
  }
}

async function downloadAll() {
  if (!fs.existsSync(SURAH_DIR)) {
    fs.mkdirSync(SURAH_DIR, { recursive: true });
  }

  const manifest = {};   // { "1": "sha256hex", "2": "sha256hex", ... }
  let failed = [];

  console.log('Downloading 114 surahs from alquran.cloud...\n');

  for (let i = 1; i <= 114; i++) {
    const url      = `${BASE_URL}/${i}/${EDITION}`;
    const filePath = path.join(SURAH_DIR, `${i}.json`);

    try {
      const json     = await fetchWithRetry(url);
      const content  = JSON.stringify(json.data);
      fs.writeFileSync(filePath, content, 'utf8');

      // Hash the exact string written to disk
      manifest[String(i)] = sha256(content);
      console.log(`✓ ${String(i).padStart(3, ' ')}  ${json.data.englishName}`);
    } catch (err) {
      console.error(`✗ Surah ${i} failed: ${err.message}`);
      failed.push(i);
    }

    await sleep(DELAY_MS);
  }

  // Write manifest — only includes successfully downloaded surahs
  fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2), 'utf8');

  console.log('\n─────────────────────────────────────────');
  if (failed.length === 0) {
    console.log(`✅  All 114 surahs downloaded successfully.`);
    console.log(`📋  Manifest written to assets/data/manifest.json`);
    console.log(`\n    Commit both assets/data/surah/ and assets/data/manifest.json.`);
    console.log(`    This script never needs to run again.\n`);
  } else {
    console.warn(`⚠️   ${failed.length} surah(s) failed: ${failed.join(', ')}`);
    console.warn(`    Re-run the script to retry failed surahs.`);
    console.warn(`    Do NOT commit an incomplete dataset.\n`);
    process.exit(1);
  }
}

downloadAll();
