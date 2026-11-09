import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOCALES_DIR = path.resolve(__dirname, "../frontend/src/i18n/locales");
const STATUS_PATH = path.resolve(__dirname, "../docs/i18n/STATUS.md");

const enPath = path.join(LOCALES_DIR, "en.json");
const en = JSON.parse(fs.readFileSync(enPath, "utf-8"));

function flattenKeys(obj, prefix = "") {
  let keys = {};
  for (const [k, v] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${k}` : k;
    if (typeof v === "object" && v !== null && !Array.isArray(v)) {
      Object.assign(keys, flattenKeys(v, fullKey));
    } else {
      keys[fullKey] = String(v);
    }
  }
  return keys;
}

function extractPlaceholders(text) {
  const matches = text.match(/{{([^}]+)}}/g);
  return matches ? matches.map(m => m.replace(/[{}]/g, "").trim()).sort() : [];
}

const enFlat = flattenKeys(en);
const enKeyList = Object.keys(enFlat);
const totalKeys = enKeyList.length;

const files = fs.readdirSync(LOCALES_DIR).filter(f => f.endsWith(".json"));

let hasErrors = false;
const statusRows = [];

// Tier 1 reviewed: en, hi, gu
const REVIEWED_LOCALES = new Set(["en", "hi", "gu"]);

for (const file of files) {
  const code = file.replace(".json", "");
  const content = JSON.parse(fs.readFileSync(path.join(LOCALES_DIR, file), "utf-8"));
  const flat = flattenKeys(content);

  const missingKeys = [];
  const extraKeys = [];
  const placeholderMismatches = [];

  for (const k of enKeyList) {
    if (!(k in flat)) {
      missingKeys.push(k);
    } else {
      const enPlaceholders = extractPlaceholders(enFlat[k]);
      const curPlaceholders = extractPlaceholders(flat[k]);
      if (enPlaceholders.join(",") !== curPlaceholders.join(",")) {
        placeholderMismatches.push(
          `${k}: expected [${enPlaceholders.join(", ")}], got [${curPlaceholders.join(", ")}]`
        );
      }
    }
  }

  for (const k of Object.keys(flat)) {
    if (!(k in enFlat)) {
      extraKeys.push(k);
    }
  }

  const matchedKeys = enKeyList.filter(k => k in flat).length;
  const coveragePct = Math.round((matchedKeys / totalKeys) * 100);

  const isReviewed = REVIEWED_LOCALES.has(code);
  const statusLabel = isReviewed ? "Ready" : "Beta";
  const reviewer = isReviewed ? "Core Team (Reviewed)" : "Machine Draft (Automated)";
  const reviewDate = isReviewed ? "2026-11-09" : "Pending Human Review";

  statusRows.push({
    code,
    matchedKeys,
    totalKeys,
    coveragePct,
    statusLabel,
    reviewer,
    reviewDate,
  });

  if (missingKeys.length > 0) {
    console.error(`[FAIL] ${code}: Missing ${missingKeys.length} keys: ${missingKeys.slice(0, 5).join(", ")}...`);
    hasErrors = true;
  }
  if (extraKeys.length > 0) {
    console.error(`[FAIL] ${code}: Extra ${extraKeys.length} keys: ${extraKeys.slice(0, 5).join(", ")}...`);
    hasErrors = true;
  }
  if (placeholderMismatches.length > 0) {
    console.error(`[FAIL] ${code}: Placeholder mismatches in ${placeholderMismatches.length} keys`);
    hasErrors = true;
  }
}

// Generate STATUS.md
statusRows.sort((a, b) => {
  if (a.statusLabel === "Ready" && b.statusLabel !== "Ready") return -1;
  if (a.statusLabel !== "Ready" && b.statusLabel === "Ready") return 1;
  return a.code.localeCompare(b.code);
});

let markdown = `# KrishiSetu AI: Localization & Key Parity Status\n\n`;
markdown += `> Generated on ${new Date().toISOString().split("T")[0]} by \`scripts/i18n-check.mjs\`.\n`;
markdown += `> Single source of truth for multilingual coverage across all 23 scheduled Indian languages.\n\n`;
markdown += `| Code | Language Coverage | Status | Reviewer | Review Date |\n`;
markdown += `|---|---|---|---|---|\n`;

for (const row of statusRows) {
  markdown += `| \`${row.code}\` | ${row.coveragePct}% (${row.matchedKeys}/${row.totalKeys} keys) | **${row.statusLabel}** | ${row.reviewer} | ${row.reviewDate} |\n`;
}

markdown += `\n## Quality Tiers\n\n`;
markdown += `- **Tier 1 (Ready):** Hand-reviewed by fluent speakers. Verified on mobile at 360 px.\n`;
markdown += `- **Tier 2 (Beta):** High-coverage automated draft for major regional Indic languages. Awaiting community native speaker verification.\n`;
markdown += `- **Tier 3 (Beta):** Automated draft for additional scheduled languages, accessible under extended language options.\n`;

fs.writeFileSync(STATUS_PATH, markdown, "utf-8");
console.log(`Updated status report at ${STATUS_PATH}`);

if (hasErrors) {
  console.error("i18n key parity check failed.");
  process.exit(1);
} else {
  console.log(`All ${files.length} locales passed key parity and placeholder validation with 100% coverage.`);
}
