/**
 * Liest die Recherche-DOCX-Dateien aus einem Quellordner und extrahiert
 * das JSON-Array daraus. Speichert pro Datei eine .json in db/data/research/.
 *
 * Usage: npm run db:parse-research -- <quell-ordner>
 *  z.B.  npm run db:parse-research -- C:\Users\Gabrecht\Desktop\Data
 */

import mammoth from "mammoth";
import { jsonrepair } from "jsonrepair";
import fs from "fs/promises";
import path from "path";

const OUT_DIR = path.join(process.cwd(), "db", "data", "research");

/**
 * Versucht aus einem Text-Block ein JSON-Array zu extrahieren.
 * Sucht nach dem ersten "[" und dem letzten "]" und versucht zu parsen.
 */
function extractJsonArray(text: string): unknown[] | null {
  // Code-Fences entfernen falls vorhanden
  let cleaned = text
    .replace(/```json\s*/gi, "")
    .replace(/```\s*$/gm, "");

  // Perplexity-Zitationsmarker entfernen — Varianten:
  //   "text",megaspin+2"sources"   → "text","sources"
  //   "text"racketinsight+1}       → "text"}
  //   "text"youtube]               → "text"]
  cleaned = cleaned.replace(/"([a-z][a-z0-9\-\.+]*)(?=[},\]])/gi, '"');
  cleaned = cleaned.replace(/,\s*[a-z][a-z0-9\-\.+]*(?=")/gi, ",");

  // Inline-Marker innerhalb von Strings entfernen, z.B. [web:25], [^donic:1]
  cleaned = cleaned.replace(/\[web:\d+\]/g, "");
  cleaned = cleaned.replace(/\[\^?[a-z]+:?\d+\]/gi, "");

  // Wenn die Datei mit "key": "value" anfängt (DOCX hat den Anfang gefressen),
  // prepend [{ um wenigstens die folgenden Objekte retten zu können.
  const trimmed = cleaned.trimStart();
  if (trimmed.startsWith('"') && !trimmed.startsWith('"[')) {
    cleaned = "[{" + trimmed;
  }

  const start = cleaned.indexOf("[");
  const end = cleaned.lastIndexOf("]");
  if (start === -1 || end === -1 || end <= start) return null;

  const candidate = cleaned.substring(start, end + 1);

  // Erst klassischer JSON.parse (schnell, sauber wenn es geht)
  try {
    const parsed = JSON.parse(candidate);
    if (Array.isArray(parsed)) return parsed;
  } catch {
    /* weiter zum Fallback */
  }

  // Fallback: jsonrepair (verzeiht unescapte Quotes, Trailing Commas, Smart Quotes etc.)
  try {
    const repaired = jsonrepair(candidate);
    const parsed = JSON.parse(repaired);
    if (Array.isArray(parsed)) return parsed;
  } catch {
    /* weiter zum nächsten Fallback */
  }
  // Fallback 2: Per-Objekt-Extraktion mit balancierter Klammern-Suche.
  // Geht das gesamte Array Zeichen für Zeichen durch und findet vollständige
  // Top-Level-Objekte (auch über mehrere Zeilen, mit eingebetteten Klammern).
  const objects: unknown[] = [];
  let depth = 0;
  let inString = false;
  let escape = false;
  let objStart = -1;

  for (let i = 1; i < candidate.length - 1; i++) {
    const ch = candidate[i]!;

    if (escape) { escape = false; continue; }
    if (ch === "\\") { escape = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;

    if (ch === "{") {
      if (depth === 0) objStart = i;
      depth++;
    } else if (ch === "}") {
      depth--;
      if (depth === 0 && objStart !== -1) {
        const objStr = candidate.substring(objStart, i + 1);
        // Versuche zuerst direkt, dann mit jsonrepair
        try {
          objects.push(JSON.parse(objStr));
        } catch {
          try {
            objects.push(JSON.parse(jsonrepair(objStr)));
          } catch {
            /* überspringen */
          }
        }
        objStart = -1;
      }
    }
  }

  return objects.length > 0 ? objects : null;
}

async function main() {
  const sourceDir = process.argv[2];
  if (!sourceDir) {
    console.error("✗ Bitte Quell-Ordner angeben:");
    console.error("  npm run db:parse-research -- <quell-ordner>");
    process.exit(1);
  }

  const exists = await fs.stat(sourceDir).catch(() => null);
  if (!exists) {
    console.error(`✗ Ordner nicht gefunden: ${sourceDir}`);
    process.exit(1);
  }

  await fs.mkdir(OUT_DIR, { recursive: true });

  const files = (await fs.readdir(sourceDir))
    .filter((f) => f.toLowerCase().endsWith(".docx"))
    .sort();

  console.log(`=== ${files.length} DOCX-Dateien gefunden ===\n`);

  let totalProducts = 0;
  let totalErrors = 0;

  for (const file of files) {
    const filePath = path.join(sourceDir, file);
    console.log(`📄 ${file}`);

    try {
      // DOCX → Plain Text
      const result = await mammoth.extractRawText({ path: filePath });
      const text = result.value;

      // JSON-Array extrahieren
      const products = extractJsonArray(text);

      if (!products || products.length === 0) {
        console.log(`  ⚠ Kein JSON-Array gefunden — Datei wird trotzdem als .txt gespeichert für manuelle Inspektion`);
        const txtName = file.replace(/\.docx$/i, ".txt");
        await fs.writeFile(path.join(OUT_DIR, txtName), text, "utf-8");
        totalErrors++;
        continue;
      }

      // JSON speichern
      const jsonName = file.replace(/\.docx$/i, ".json");
      await fs.writeFile(
        path.join(OUT_DIR, jsonName),
        JSON.stringify(products, null, 2),
        "utf-8"
      );

      console.log(`  ✓ ${products.length} Produkte extrahiert → ${jsonName}`);
      totalProducts += products.length;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`  ✗ Fehler: ${msg.substring(0, 100)}`);
      totalErrors++;
    }
  }

  console.log("\n══════════════════════════════");
  console.log(`  Dateien:        ${files.length}`);
  console.log(`  Produkte:       ${totalProducts}`);
  console.log(`  Mit Problemen:  ${totalErrors}`);
  console.log(`\n  Output: ${OUT_DIR}`);

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
