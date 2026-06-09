/**
 * PongSmith Berater-Eval-Harness
 *
 * Läuft 10 Personas (aus personas.json) gegen die /api/berater-API.
 * Simuliert pro Persona eine komplette Konversation: User-Initial-Message
 * + gescriptete Follow-up-Antworten. Sammelt deterministische Checks pro
 * Persona und schreibt einen JSON-Report + Console-Summary.
 *
 * Usage:
 *   node --env-file=.env.local eval/run.mjs                  → gegen Production
 *   BERATER_URL=http://localhost:3000/api/berater node --env-file=.env.local eval/run.mjs  → gegen lokal
 *
 * Output:
 *   - Console: pro Persona "✓ X/Y checks, Z turns, N setups"
 *   - eval/report.json: vollständiger Konversations-Verlauf + Checks
 */

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import postgres from "postgres";

const __dirname = dirname(fileURLToPath(import.meta.url));
const personas = JSON.parse(readFileSync(join(__dirname, "personas.json"), "utf-8"));

const BERATER_URL = process.env.BERATER_URL ?? "https://pongsmith.de/api/berater";
const MAX_TURNS = 5;

// ─── DB-Index für Fabrications-Check ──────────────────────────────────────

const sql = postgres(process.env.DATABASE_URL);
const dbBlades = await sql`SELECT name FROM blades WHERE is_active = true`;
const dbRubbers = await sql`SELECT name FROM rubbers WHERE is_active = true`;
await sql.end();

const knownProductNames = new Set([
  ...dbBlades.map((b) => normalize(b.name)),
  ...dbRubbers.map((r) => normalize(r.name)),
]);

function normalize(s) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

// ─── Konversation simulieren ──────────────────────────────────────────────

async function runPersona(persona) {
  const history = [];
  const queue = [...persona.followupAnswers];
  let assistantText = "";
  let setups = [];
  let turns = 0;

  history.push({ role: "user", content: persona.initialMessage });

  while (turns < MAX_TURNS) {
    turns++;
    let data;
    try {
      const res = await fetch(BERATER_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history, lang: "de" }),
      });
      if (!res.ok) {
        return { error: `API ${res.status}: ${await res.text().catch(() => "")}`, turns, history };
      }
      data = await res.json();
    } catch (err) {
      return { error: `fetch: ${err.message}`, turns, history };
    }

    assistantText = data.text ?? "";
    setups = data.setups ?? [];
    history.push({ role: "assistant", content: assistantText });

    // Wenn der Berater Setups vorgeschlagen hat: fertig.
    if (setups.length > 0) break;

    // Sonst: Berater hat zurückgefragt, gib die nächste gescriptete Antwort.
    if (queue.length === 0) break; // Skript ausgeschöpft, ohne Empfehlung
    history.push({ role: "user", content: queue.shift() });
  }

  return { turns, history, finalText: assistantText, setups };
}

// ─── Deterministische Checks ──────────────────────────────────────────────

function runChecks(persona, result) {
  const checks = [];
  const { finalText, setups, turns } = result;
  const exp = persona.expectations ?? {};

  // (1) Max-Turns respektiert
  const maxTurns = exp.maxTurnsBeforeRecommendation ?? 3;
  checks.push({
    name: "max-turns-respected",
    pass: turns <= maxTurns || (setups.length === 0 && exp.expectRefusal === true),
    detail: `${turns} turns (max ${maxTurns}), ${setups.length} setups`,
  });

  // (2) Budget-Cap (Budget + 15 € Toleranz)
  if (exp.budgetCeilingEur != null && !exp.expectRefusal) {
    const cap = exp.budgetCeilingEur + 15;
    // Preise im Text matchen: ~162 Euro / 162 EUR / 162€
    const re = /(?:~|circa|ca\.?\s*)?(\d{2,4})(?:[,.]\d{1,2})?\s*(?:€|euro|eur)\b/gi;
    const mentions = [...finalText.matchAll(re)].map((m) => Number(m[1]));
    const overBudget = mentions.filter((n) => n > cap);
    checks.push({
      name: "budget-cap-respected",
      pass: overBudget.length === 0,
      detail: overBudget.length === 0 ? "OK" : `${overBudget.length} Preise > ${cap}€: ${overBudget.join(", ")}`,
    });
  }

  // (3) Keine Mid-Stream-Korrektur
  const midStream = /\b(warte,?\s+das|lass mich (das )?nochmal|moment, das|halt,? das sprengt|korrigier|nein, das)/i;
  const hasMidStream = midStream.test(finalText);
  checks.push({
    name: "no-mid-stream-correction",
    pass: !hasMidStream,
    detail: hasMidStream ? `Match: "${finalText.match(midStream)?.[0]}"` : "OK",
  });

  // (4) Keine Em-/En-Dashes
  const dashMatch = finalText.match(/[–—]/);
  checks.push({
    name: "no-em-dashes",
    pass: !dashMatch,
    detail: dashMatch ? `gefunden: ${dashMatch[0]}` : "OK",
  });

  // (5) Kein "KI"-Wording
  const kiMatch = finalText.match(/\bKI\b|KI-Berater/);
  checks.push({
    name: "no-ki-wording",
    pass: !kiMatch,
    detail: kiMatch ? `gefunden: ${kiMatch[0]}` : "OK",
  });

  // (6) Setup-Reihenfolge konsistent: wenn "Tipp/Empfehlung: Setup X", muss X == 1 sein
  const tipMatch = finalText.match(
    /(?:mein\s+(?:ehrlicher\s+)?tipp|top-?empfehlung|favorit|würde\s+ich\s+nehmen|wäre\s+meine\s+wahl)[^.\n]{0,80}?setup\s*(\d)/i,
  );
  if (tipMatch) {
    checks.push({
      name: "setup-1-is-top-tip",
      pass: tipMatch[1] === "1",
      detail: tipMatch[1] === "1" ? "OK" : `Tipp = Setup ${tipMatch[1]}, sollte 1 sein`,
    });
  }

  // (7) Keine erfundenen Produkte in den Setup-Karten
  if (setups.length > 0) {
    const mentioned = [];
    for (const s of setups) {
      for (const p of s.products ?? []) {
        mentioned.push({ name: p.name, manufacturer: p.manufacturer });
      }
    }
    const fabricated = mentioned.filter((p) => {
      // Suche Match in DB (mit oder ohne Manufacturer-Präfix)
      const n = normalize(p.name);
      const nNoMfg = p.manufacturer ? normalize(p.name.replace(new RegExp(`^${p.manufacturer}\\s+`, "i"), "")) : null;
      return !knownProductNames.has(n) && (!nNoMfg || !knownProductNames.has(nNoMfg));
    });
    checks.push({
      name: "no-fabricated-products",
      pass: fabricated.length === 0,
      detail: fabricated.length === 0 ? "OK" : `Erfunden: ${fabricated.map((f) => f.name).join(", ")}`,
    });
  }

  // (8) Anfänger-Refusal: bei TTR < 900 erwarten wir KEINE Setups, dafür Einsteiger-Hinweis
  if (exp.expectRefusal) {
    const hasRefusal = setups.length === 0;
    const mentionsEntry = /einsteiger|anfänger|vorkonfektion|fertig.{0,4}schläger|in 3 bis 6 monaten|zurückkommen/i.test(
      finalText,
    );
    checks.push({
      name: "anfaenger-refusal-correct",
      pass: hasRefusal && mentionsEntry,
      detail: !hasRefusal
        ? `${setups.length} Setups returned, expected 0`
        : !mentionsEntry
          ? "Setups=0 OK, aber kein Einsteiger-Hinweis im Text"
          : "OK",
    });
  }

  // (9) Aspirations-Carbon: Spieler will Carbon-Schritt, mind. ein Setup mit Carbon-Holz.
  // Liest die composition (zuverlässig), Name als Fallback.
  if (exp.shouldRecommendCarbon && setups.length > 0) {
    const carbonPattern = /(carbon|alc|zlc|zlf|aramid|arylat|zylon|kevlar|composite)/i;
    const namePattern = /(ALC|ZLC|ZLF|Viscaria|Innerforce|Hayabusa|Hurricane Long|Fang Bo|Ma Long.*(Carbon|5)|Stradivarius)/i;
    const infos = setups.map((s) => {
      const blade = (s.products ?? []).find((p) => p.type === "blade");
      return { comp: s.bladeComposition ?? "", name: blade?.name ?? "" };
    });
    const hasCarbon = infos.some((i) => carbonPattern.test(i.comp) || namePattern.test(i.name));
    checks.push({
      name: "aspirational-carbon-recommended",
      pass: hasCarbon,
      detail: hasCarbon ? "OK" : `kein Carbon: ${infos.map((i) => `${i.name} (${i.comp || "?"})`).join(" | ")}`,
    });
  }

  // (10) Defensive-Bias verhindern: bei Offensiv-Aspiration KEINE DEF-Hölzer
  if (exp.forbidDefensiveBlades && setups.length > 0) {
    const allBlades = setups
      .flatMap((s) => (s.products ?? []).filter((p) => p.type === "blade"))
      .map((p) => p.name);
    const defPattern = /\b(DEF\b|Defender|Defensive|Defplay|Timber.{0,8}DEF|Chen Defender)\b/i;
    const defensive = allBlades.filter((n) => defPattern.test(n));
    checks.push({
      name: "no-defensive-bias",
      pass: defensive.length === 0,
      detail: defensive.length === 0 ? "OK" : `Defensiv-Hölzer: ${defensive.join(", ")}`,
    });
  }

  // (11b) Teil-Tausch: bei rubber_only mit bekanntem Holz müssen ALLE Karten das Holz behalten
  if (exp.expectKeepsBlade && setups.length > 0) {
    const want = exp.expectKeepsBlade.toLowerCase();
    const bladeNames = setups.map((s) => {
      const b = (s.products ?? []).find((p) => p.type === "blade");
      return b?.name ?? "";
    });
    const allKeep = bladeNames.length > 0 && bladeNames.every((n) => n.toLowerCase().includes(want));
    checks.push({
      name: "kept-blade-honored",
      pass: allKeep,
      detail: allKeep ? "OK" : `Karten-Hölzer: ${bladeNames.join(" | ")} (erwartet alle "${exp.expectKeepsBlade}")`,
    });
  }

  // (11) DB-Lücke ehrlich: bei DB-Lücke-Persona muss Berater zugeben dass Produkt nicht in DB ist
  if (exp.expectHonestyAboutDbGap) {
    const honest = /(nicht in (unserer|meiner|der)|nicht aus (unserer|der)|kenne (ich|das|dein)|nicht im detail|finde ich nicht|nicht hinterlegt|nicht gelistet|kein eintrag|nicht in der db|datenbank)/i.test(
      finalText,
    );
    checks.push({
      name: "honest-about-db-gap",
      pass: honest,
      detail: honest ? "OK" : "Berater hat DB-Lücke nicht erwähnt",
    });
  }

  return checks;
}

// ─── Main ─────────────────────────────────────────────────────────────────

console.log(`PongSmith Berater-Eval`);
console.log(`Endpoint: ${BERATER_URL}`);
console.log(`Personas: ${personas.length}, Max-Turns/Persona: ${MAX_TURNS}\n`);

const results = [];
const startedAt = Date.now();

for (const persona of personas) {
  process.stdout.write(`▶ ${persona.id.padEnd(40)} `);
  const t0 = Date.now();
  try {
    const result = await runPersona(persona);
    if (result.error) {
      console.log(`ERROR: ${result.error}`);
      results.push({ persona: persona.id, error: result.error });
      continue;
    }
    const checks = runChecks(persona, result);
    const passed = checks.filter((c) => c.pass).length;
    const total = checks.length;
    const ms = Date.now() - t0;
    const icon = passed === total ? "✓" : "✗";
    console.log(`${icon} ${passed}/${total} checks · ${result.turns}T · ${result.setups.length}S · ${ms}ms`);
    results.push({
      persona: persona.id,
      description: persona.description,
      turns: result.turns,
      setupsCount: result.setups.length,
      checks,
      conversation: result.history,
      finalText: result.finalText,
      setups: result.setups,
    });
  } catch (err) {
    console.log(`EXCEPTION: ${err.message}`);
    results.push({ persona: persona.id, error: err.message });
  }
}

// ─── Report ───────────────────────────────────────────────────────────────

const totalChecks = results.reduce((s, r) => s + (r.checks?.length ?? 0), 0);
const passedChecks = results.reduce((s, r) => s + (r.checks?.filter((c) => c.pass).length ?? 0), 0);
const errored = results.filter((r) => r.error).length;
const fullyPassedPersonas = results.filter((r) => r.checks && r.checks.every((c) => c.pass)).length;

console.log("\n═══ Summary ═══");
console.log(`Personas durch: ${results.length - errored}/${results.length}`);
console.log(`Personas 100% sauber: ${fullyPassedPersonas}/${results.length}`);
console.log(`Checks gesamt: ${passedChecks}/${totalChecks}`);
console.log(`Laufzeit: ${((Date.now() - startedAt) / 1000).toFixed(1)}s`);

// Fails-Details
const failureLines = [];
for (const r of results) {
  if (r.error) {
    failureLines.push(`  [${r.persona}] ERROR: ${r.error}`);
    continue;
  }
  const failed = (r.checks ?? []).filter((c) => !c.pass);
  for (const c of failed) {
    failureLines.push(`  [${r.persona}] ${c.name}: ${c.detail}`);
  }
}

if (failureLines.length > 0) {
  console.log("\nFails im Detail:");
  for (const line of failureLines) console.log(line);
} else {
  console.log("\nKeine Fails. Sehr stark.");
}

// JSON-Report für tieferes Nachsehen
const reportPath = join(__dirname, "report.json");
writeFileSync(reportPath, JSON.stringify(results, null, 2));
console.log(`\nDetail-Report: ${reportPath}`);

// Exit-Code: 0 wenn alles passt, 1 sonst (für CI)
process.exit(failureLines.length === 0 ? 0 : 1);
