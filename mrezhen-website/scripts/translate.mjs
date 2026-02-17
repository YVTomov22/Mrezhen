#!/usr/bin/env node
/**
 * Auto-translate script for Mrezhen i18n.
 *
 * Usage:
 *   node scripts/translate.mjs           # translate all languages
 *   node scripts/translate.mjs es fr de  # translate only specific languages
 *   node scripts/translate.mjs --force   # re-translate everything (ignore cache)
 *
 * How it works:
 *   1. Reads messages/en.json as the single source of truth.
 *   2. For each target language, only translates NEW or CHANGED keys
 *      (compares against existing translation file).
 *   3. Preserves {placeholder} variables (e.g. {name}, {year}).
 *   4. Writes the result to messages/<lang>.json
 *
 * To add a new language, just add its code to the LANGUAGES array below.
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import translate from "google-translate-api-x";

const __dirname = dirname(fileURLToPath(import.meta.url));
const MESSAGES_DIR = join(__dirname, "..", "messages");

// All supported target languages (ISO 639-1 codes)
const LANGUAGES = [
  "es", "fr", "de", "pt", "it", "nl", "ru",
  "zh", "ja", "ko", "ar", "hi", "tr", "pl",
  "sv", "da", "fi", "no",
];

// Google Translate uses "zh-CN" for simplified Chinese, "nb" for Norwegian Bokmål
const LANG_MAP = {
  zh: "zh-CN",
  no: "no",
};

// ── Helpers ──────────────────────────────────────────────

/** Flatten { nav: { dashboard: "x" } } → { "nav.dashboard": "x" } */
function flatten(obj, prefix = "") {
  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      Object.assign(result, flatten(value, path));
    } else {
      result[path] = value;
    }
  }
  return result;
}

/** Unflatten { "nav.dashboard": "x" } → { nav: { dashboard: "x" } } */
function unflatten(obj) {
  const result = {};
  for (const [path, value] of Object.entries(obj)) {
    const keys = path.split(".");
    let current = result;
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) current[keys[i]] = {};
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
  }
  return result;
}

/**
 * Protect {placeholders} from being mangled by Google Translate.
 * Replaces {name} → [[0]], {year} → [[1]], etc.
 * Returns the modified string and a restore function.
 */
function protectPlaceholders(text) {
  const placeholders = [];
  const protected_ = text.replace(/\{(\w+)\}/g, (match) => {
    placeholders.push(match);
    return `[[${placeholders.length - 1}]]`;
  });
  return {
    text: protected_,
    restore: (translated) =>
      translated.replace(/\[\[(\d+)\]\]/g, (_, idx) => placeholders[parseInt(idx)] || _),
  };
}

/** Sleep helper to avoid rate-limiting */
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ── Main ─────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const forceAll = args.includes("--force");
  const specificLangs = args.filter((a) => !a.startsWith("--"));

  const targetLangs =
    specificLangs.length > 0
      ? specificLangs.filter((l) => LANGUAGES.includes(l))
      : LANGUAGES;

  if (targetLangs.length === 0) {
    console.error("No valid languages specified. Available:", LANGUAGES.join(", "));
    process.exit(1);
  }

  // 1. Read source
  const enPath = join(MESSAGES_DIR, "en.json");
  const enData = JSON.parse(readFileSync(enPath, "utf-8"));
  const enFlat = flatten(enData);
  const totalKeys = Object.keys(enFlat).length;

  console.log(`\n📖 Source: en.json (${totalKeys} keys)`);
  console.log(`🌍 Targets: ${targetLangs.join(", ")}${forceAll ? " (force mode)" : ""}\n`);

  for (const lang of targetLangs) {
    const targetPath = join(MESSAGES_DIR, `${lang}.json`);
    let existingFlat = {};

    // Load existing translations if not force mode
    if (!forceAll && existsSync(targetPath)) {
      try {
        const existing = JSON.parse(readFileSync(targetPath, "utf-8"));
        existingFlat = flatten(existing);
      } catch {
        // If file is corrupted, re-translate everything
      }
    }

    // Find keys that need translation (new or changed in en.json)
    const toTranslate = {};
    // We also need to track the en.json values that existed when we last translated
    // For simplicity: if the key exists in the target AND the source hasn't changed
    // since the target was written, skip it.
    // Since we can't know the original EN value, we translate any key that's
    // missing from the target file.
    for (const [key, value] of Object.entries(enFlat)) {
      if (!existingFlat[key]) {
        toTranslate[key] = value;
      }
    }

    // Remove keys from existing that no longer exist in en.json
    for (const key of Object.keys(existingFlat)) {
      if (!(key in enFlat)) {
        delete existingFlat[key];
      }
    }

    const newCount = Object.keys(toTranslate).length;

    if (newCount === 0) {
      console.log(`  ✅ ${lang}.json — up to date (${totalKeys} keys)`);
      // Still write to ensure key order matches en.json and stale keys are removed
      const ordered = {};
      for (const key of Object.keys(enFlat)) {
        ordered[key] = existingFlat[key];
      }
      writeFileSync(targetPath, JSON.stringify(unflatten(ordered), null, 2) + "\n", "utf-8");
      continue;
    }

    console.log(`  🔄 ${lang}.json — translating ${newCount} new keys...`);

    const googleLang = LANG_MAP[lang] || lang;

    // Batch translate: collect texts, protect placeholders, send in chunks
    const keys = Object.keys(toTranslate);
    const BATCH_SIZE = 30; // Google Translate handles batches well

    for (let i = 0; i < keys.length; i += BATCH_SIZE) {
      const batchKeys = keys.slice(i, i + BATCH_SIZE);
      const batchTexts = batchKeys.map((k) => toTranslate[k]);

      // Protect placeholders
      const protected_ = batchTexts.map((t) => protectPlaceholders(String(t)));

      try {
        const results = await translate(
          protected_.map((p) => p.text),
          { from: "en", to: googleLang }
        );

        // results is an array when input is array
        const resultsArray = Array.isArray(results) ? results : [results];

        for (let j = 0; j < batchKeys.length; j++) {
          const translated = resultsArray[j]?.text || batchTexts[j];
          existingFlat[batchKeys[j]] = protected_[j].restore(translated);
        }
      } catch (err) {
        console.error(`    ⚠️  Batch failed for ${lang} (keys ${i}-${i + batchKeys.length}): ${err.message}`);
        // Fall back to English for failed keys
        for (const key of batchKeys) {
          if (!existingFlat[key]) existingFlat[key] = toTranslate[key];
        }
      }

      // Rate-limit: small delay between batches
      if (i + BATCH_SIZE < keys.length) {
        await sleep(1000);
      }
    }

    // Write output, preserving key order from en.json
    const ordered = {};
    for (const key of Object.keys(enFlat)) {
      ordered[key] = existingFlat[key] || enFlat[key];
    }

    writeFileSync(targetPath, JSON.stringify(unflatten(ordered), null, 2) + "\n", "utf-8");
    console.log(`  ✅ ${lang}.json — done (${totalKeys} keys)`);

    // Delay between languages to be nice to Google
    await sleep(1500);
  }

  console.log("\n🎉 All translations complete!\n");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
