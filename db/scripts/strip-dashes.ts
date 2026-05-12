/**
 * Einmaliges Cleanup-Skript: ersetzt alle Em-/En-Dashes durch normale
 * Bindestriche bzw. Kommas in den UI-relevanten Dateien.
 *
 * Regeln:
 *   " — "  →  ", "    (typisches Em-Dash mit Spaces zwischen Sätzen)
 *   "—"    →  "-"     (Em-Dash ohne Spaces)
 *   " – "  →  ", "
 *   "–"    →  "-"
 *
 * Files: app/**, components/**, lib/i18n.ts
 */

import { readFileSync, writeFileSync, statSync, readdirSync } from "fs";
import { join, extname } from "path";

const ROOTS = ["app", "components", "lib"];
const EXTENSIONS = new Set([".ts", ".tsx", ".md"]);
const SKIP_FILES = new Set([
  // Code-Skripte wo ein Dash zur Logik gehört (selten, aber sicher)
  "db/scripts/strip-dashes.ts",
]);

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) {
      if (name === "node_modules" || name === ".next") continue;
      out.push(...walk(p));
    } else if (EXTENSIONS.has(extname(name))) {
      out.push(p);
    }
  }
  return out;
}

function transform(content: string): string {
  let result = content;
  // Reihenfolge wichtig: erst spaced, dann standalone
  result = result.replace(/ — /g, ", ");
  result = result.replace(/ – /g, ", ");
  result = result.replace(/—/g, "-");
  result = result.replace(/–/g, "-");
  // Doppel-Spaces aufräumen die durch Komma-Replace entstehen können
  result = result.replace(/,  /g, ", ");
  return result;
}

let totalFiles = 0;
let changedFiles = 0;
let totalReplacements = 0;

for (const root of ROOTS) {
  if (!statSync(root).isDirectory()) continue;
  for (const file of walk(root)) {
    totalFiles++;
    const rel = file.replace(/\\/g, "/");
    if (SKIP_FILES.has(rel)) continue;

    const orig = readFileSync(file, "utf-8");
    const next = transform(orig);
    if (next !== orig) {
      changedFiles++;
      const before = (orig.match(/[—–]/g) ?? []).length;
      totalReplacements += before;
      writeFileSync(file, next, "utf-8");
      console.log(`  ${rel.padEnd(60)} ${before} replacements`);
    }
  }
}

console.log(`\n✓ ${changedFiles}/${totalFiles} Dateien geändert. ${totalReplacements} Dashes ersetzt.`);
