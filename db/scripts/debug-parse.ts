/**
 * Debug-Skript: Parsed eine einzelne Datei und gibt den genauen JSON-Fehler aus.
 */
import mammoth from "mammoth";
import path from "path";

async function main() {
  const file = process.argv[2];
  if (!file) { console.error("Usage: tsx debug-parse.ts <file.docx>"); process.exit(1); }

  const result = await mammoth.extractRawText({ path: file });
  let cleaned = result.value
    .replace(/```json\s*/gi, "")
    .replace(/```\s*$/gm, "");

  cleaned = cleaned.replace(/,\s*[a-z][a-z0-9\-\.+]*(?=")/gi, ",");
  cleaned = cleaned.replace(/\[web:\d+\]/g, "");
  cleaned = cleaned.replace(/\[\^?[a-z]+:?\d+\]/gi, "");

  const start = cleaned.indexOf("[");
  const end = cleaned.lastIndexOf("]");
  const candidate = cleaned.substring(start, end + 1);

  try {
    const parsed = JSON.parse(candidate);
    console.log(`✓ OK — ${Array.isArray(parsed) ? parsed.length : "not array"} Items`);
  } catch (err) {
    const msg = (err as Error).message;
    console.log(`✗ ${msg}`);
    // Position aus Fehler extrahieren und Kontext zeigen
    const posMatch = msg.match(/position\s+(\d+)/i);
    if (posMatch) {
      const pos = parseInt(posMatch[1]!);
      const ctxStart = Math.max(0, pos - 100);
      const ctxEnd = Math.min(candidate.length, pos + 100);
      console.log(`\nKontext um Position ${pos}:`);
      console.log("---");
      console.log(candidate.substring(ctxStart, ctxEnd));
      console.log("---");
      console.log(`Zeichen an Position ${pos}: '${candidate[pos]}' (Code ${candidate.charCodeAt(pos)})`);
    }
  }
  process.exit(0);
}

main().catch(console.error);
