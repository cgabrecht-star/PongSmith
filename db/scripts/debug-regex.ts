import mammoth from "mammoth";

async function main() {
  const result = await mammoth.extractRawText({ path: "C:\\Users\\Gabrecht\\Desktop\\Data\\7.docx" });
  const t = result.value;

  // Zeige die Bytes um Position 315 (im Original, ohne Cleanup)
  const idx = t.indexOf("youtube]");
  if (idx === -1) { console.log("youtube] nicht gefunden"); process.exit(0); }

  console.log(`'youtube]' gefunden an Position ${idx}`);
  // Zeige 30 Zeichen davor mit Codes
  console.log("\nZeichen davor:");
  for (let i = idx - 5; i < idx + 15; i++) {
    const ch = t[i]!;
    console.log(`  [${i}] '${ch}' = U+${ch.charCodeAt(0).toString(16).padStart(4, "0")}`);
  }

  // Test ob Regex matcht
  const testStr = t.substring(idx - 5, idx + 15);
  console.log(`\nTest-Substring: ${JSON.stringify(testStr)}`);
  const re = /"([a-z][a-z0-9\-\.+]*)(?=[},\]])/gi;
  const match = testStr.match(re);
  console.log(`Regex-Match: ${match ? JSON.stringify(match) : "kein Match"}`);

  process.exit(0);
}
main().catch(console.error);
