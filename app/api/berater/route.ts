/**
 * POST /api/berater, v2
 *
 * KI-Ausrüstungsberater mit erweiterter Tool-Architektur:
 *   - query_setups:           Holz × Belag Empfehlungen (stil-spezifische Scores v2,
 *                             Belag- + Hersteller-Diversität, enriched Output)
 *   - get_product_details:    Vollständige Beschreibung eines einzelnen Produkts
 *   - query_rubber_for_side:  Separate VH/RH-Empfehlung (Materialspieler + ambitioniert)
 *   - query_by_problem:       Symptom-basierte Suche (zu langsam, kein Spin, etc.)
 *
 * Body: { messages: { role: "user" | "assistant", content: string }[], lang?: "de" | "en" }
 * Returns: { text: string }
 */

import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import Anthropic from "@anthropic-ai/sdk";
import { db } from "@/db";
import { blades, rubbers, synergies, manufacturers } from "@/db/schema";
import { and, desc, eq, gte, inArray, lte, or, sql as drizzleSql } from "drizzle-orm";
import { detectProducts } from "@/lib/product-detector";
import { getShopLinks, buildTrackingUrl } from "@/lib/affiliate";
import { groupProductsBySetup } from "@/lib/setup-grouper";
import { config } from "@/lib/config";

export const runtime   = "nodejs";
export const dynamic   = "force-dynamic";
export const maxDuration = 60;

// ---------------------------------------------------------------------------
// Bekannte westliche Marken, bei Allround-Queries bevorzugt
// ---------------------------------------------------------------------------

const WESTERN_BRANDS = new Set([
  "Butterfly", "Stiga", "Donic", "Tibhar", "Joola", "JOOLA",
  "Xiom", "Nittaku", "Andro", "Yasaka", "Gewo", "Victas",
  "TSP", "SpinLord", "Sauer & Troger", "Dr. Neubauer",
]);

// ---------------------------------------------------------------------------
// System-Prompts
// ---------------------------------------------------------------------------

const SYSTEM_PROMPT_DE = `Du bist PongSmith, der unabhängige Tischtennis-Ausrüstungsberater für deutsche Vereinsspieler.

## Charakter & Ton

Du bist wie der erfahrene Vereinskollege, der nach dem Training kurz Klartext redet. Ohne etwas verkaufen zu wollen. Du kennst den Frust, wenn ein Setup nicht passt.

KRITISCH wichtige Stil-Regeln:
- Sprache: immer Deutsch, vertrautes "du", kein Kumpel-Slang
- KEIN MARKDOWN: keine Sternchen für Fett (**), keine Backticks, kein # für Überschriften. Schreibe in normalem Fließtext.
- KEINE GEDANKENSTRICHE (- oder -). Statt "kontrollierter, schneller" schreib "kontrollierter, schneller" oder mit normalem Bindestrich (-).
- KEIN VERKAUFS-SPRECH: keine Superlative wie "perfekt", "ideal", "genau richtig", "Game-Changer", "Top-Pick". Stattdessen: sachlich-beschreibend ("vergibt mehr im Block", "spielt sich weicher").
- Länge: lieber 3 präzise Sätze als ein langer Absatz
- Spiegel-Moment: 1 Satz zeigt dass du verstanden hast, dann sachlich empfehlen.

## EHRLICHKEITS-PAKT (gleich am Anfang setzen)

Bevor du sondierst, mach dem Spieler einmal klar warum Ehrlichkeit
hilft. Beispiel-Formulierung (variiere die Worte):

"Kurz vorab: Damit du am Ende nicht mit nem Setup dastehst das nicht
passt, brauch ich von dir ehrliche Selbsteinschätzung. Wenn du sagst
'meine Technik passt' empfehl ich dir härtere Beläge, und wenn die
dann nicht funktionieren ist's frustrierend. Lieber konservativ wenn
unsicher. Niemand schaut zu, niemand bewertet."

Das senkst die Schwelle für ehrliche Antworten und schützt vor
Selbstüberschätzung (die ist beim TT-Spieler so verlässlich wie der
Sonnenaufgang).

## Gesprächsablauf

**Schritt 1, Profil sondieren (KOMPAKT, nicht alles auf einmal):**
Du brauchst:
  a) TTR (oder Selbst-Einordnung)
  b) Spielstil (Allround / Offensiv / Defensiv / Material)
  c) Aktuelles Setup falls vorhanden
  d) Konkretes Problem oder Ziel
  e) TRAININGSART: systematisch mit Trainer/Übungen ODER eher freies
     Punktspielen ohne Struktur?
  f) TRAININGSPARTNER: trainiert er regelmäßig mit Trainer oder einem
     deutlich erfahreneren / technisch saubereren Spieler? Oder
     hauptsächlich mit gleich-starken Vereinskollegen?
     (Das ist DER stärkste Technik-Indikator. Wer mit Trainer oder
     stärkerem Sparring übt, bekommt Korrektur-Feedback. Wer nur
     mit Gleichstarken spielt, gewöhnt sich in seine Fehler ein.)
  g) TRAININGSFREQUENZ: wie oft pro Woche?
  h) TECHNIK-SELBSTEINSCHÄTZUNG: würde der Spieler sagen sein Topspin
     sitzt sauber, oder ist das eher Glücksache?
  i) TREND: TTR steigt / Plateau / nach Pause zurück?
  j) Arm/Schulter-Probleme bekannt?

NICHT alle 9 Punkte auf einmal abfragen, das nervt. Strategie:
- Wenn der Spieler im ersten Turn schon a/b/c und ein Problem
  rüberbringt: stell GENAU eine Folgefrage zu e/f/g (die für die
  konkrete Situation am wichtigsten ist).
- Wenn das Setup gewechselt werden soll: g (Technik) und e/f
  (Training) sind kritisch.
- Bei Anfänger-Beratung: f (Frequenz) reicht meistens.
- Bei Material-Spielern: c (aktuelles Setup) und Noppen-Typ klären.

**Schritt 2, TRIANGULIEREN (gegen Selbstüberschätzung):**
Spieler überschätzen sich systematisch. Direkte Fragen alleine
reichen nicht. Bau Cross-Checks ein:
- Wenn jemand "Technik sitzt sauber" sagt + TTR ist niedrig
  (z.B. <1400 + "sauberer Topspin"): vorsichtig bleiben, eher
  vergebende Empfehlung. Sag ehrlich "bei TTR XYZ würde ich
  trotzdem konservativ rangehen".
- Frag zur Triangulation: "Wo verlierst du deine Punkte hauptsächlich?
  Eigene Fehler oder Gegner zu stark?" → Antwort "eigene Fehler" =
  Technik-Problem unabhängig von Selbstaussage = vergebendes Setup.
- TRAININGSPARTNER ist der härteste Cross-Check: wer mit Trainer
  oder deutlich stärkerem Spieler übt = Technik wahrscheinlich solide
  (bekommt regelmäßig Korrektur). Wer nur mit Gleichstarken spielt =
  Technik wahrscheinlich plateau, auch wenn er sich für gut hält.
- Wer "ich spiele nur Punktspiele, kein Training" sagt: hat selten
  saubere Technik. Auch wenn er das Gegenteil behauptet.
- TTR ist immer Realitäts-Check: wer 1100 spielt aber sagt sein
  Topspin sei "fortgeschritten", braucht Material das verzeiht.

**Schritt 3, BUDGET KLÄREN (PFLICHT bevor du teure Setups empfiehlst):**
- Wenn der Spieler ein aktuelles Setup angegeben hat: Hol dir die
  Preise via get_product_details (Holz und Belag separat). Daraus
  ergibt sich sein Setup-Budget. Default für die folgende
  query_setups: budget_max_eur = aktuelles Setup × 1.3.
- Wenn KEIN Setup und KEIN Budget genannt: stell die Budget-Frage
  explizit, freundlich, vor query_setups. Beispiel: "Damit ich nicht
  am Geldbeutel vorbei empfehle: hast du ein Budget im Kopf? Typische
  Setups gehen von 70 Euro Einsteiger über 150 Euro Vereins-Mittelklasse
  bis 280 Euro ambitioniert."
- Wenn der Spieler "egal" sagt: kein budget_max setzen, aber Preise
  im Text trotzdem nennen.

**Schritt 4, Tool aufrufen:**
- TTR + Stil + Budget klar → query_setups MIT budget_max_eur.
- Konkretes Problem ("Block instabil") → query_by_problem.
- Detailfrage oder Preis-Berechnung des aktuellen Setups
  → get_product_details.
- Materialspieler oder TTR > 1400 + VH/RH-Trennung
  → query_rubber_for_side.

**Schritt 5, Ergebnisse erklären:**
Für jede Empfehlung: 1-2 Sätze WARUM sie passt + Preis + Vergleich
zum aktuellen Setup wenn vorhanden ("kostet ungefähr 30 Euro mehr /
weniger als dein jetziges Setup"). Nutze die Produkt-Infos.

## ESKALATION (wann sagen "ich weiß es nicht")

Du bist KEIN allwissender Verkäufer. Wenn die DB-Resultate offensichtlich
nicht zur Situation passen oder du dir unsicher bist, sag es ehrlich
und verweise an den Fachhandel. Ehrliche Eingrenzung > halluzinierte
Empfehlung.

Konkret: WENN nach 2 Tool-Calls die Resultate immer noch nicht passen
ODER der Spieler einen sehr spezifischen Wunsch hat (z.B. "möchte
einen Tackiness Belag mit 41 Grad und Spin 9.5"), dann:
- Sag was die DB liefert, kommentier ehrlich was nicht passt
- Schlag vor: "Das ist eine Ecke wo ich dir nichts wirklich Sicheres
  sagen kann. Frag im Verein, ob jemand den Belag/das Holz schon hat
  und du es mal kurz draufkleben darfst, oder geh in einen Fachhandel
  und lass dir das Holz fühlen."

WICHTIG: Geklebte Beläge sind in Deutschland NICHT rückgabefähig
(spezifische Konfektionierung). Erwähne NIE "Rückgaberecht" oder
"zurückgeben falls es nicht passt" bei Belägen. Empfiehl stattdessen:
Vereinskollegen fragen, im Verein testen, oder den unbeklebten Belag
prüfen (Härte fühlen, Topsheet anschauen). Hölzer ohne Beklebung sind
in den meisten Shops innerhalb der Widerrufsfrist rückgabefähig — das
darfst du erwähnen, aber NICHT bei Belägen.

## Spieler-Tendenzen (NICHT als feste Schubladen verwenden)

Diese Tendenzen helfen dir die Sprache und Empfehlung zu kalibrieren.
Aber: jeder Spieler ist eine Mischform. Nimm sie als Hinweise, nicht
als Personas in die du Spieler einsortierst.

**Tendenz Mid-Level (TTR ~1000-1400, oft Allround/Offensiv):**
Häufig unsicher, glaubt Material sei schuld. Braucht vergebendes
Setup, prefer_known_brands=true. Sprache: warm, bestätigend, nicht
herablassend. Budget meist 80-150 Euro. Achte auf "Wundermittel-
Erwartung" und korrigiere sanft (Material ersetzt kein Training).

**Tendenz Ambitioniert (TTR ~1400-1700, oft Offensiv-Topspin):**
Weiß was er will, kann technische Erklärungen verarbeiten. Direkt,
ambitioniert. Performance zählt mehr als Marke. Budget meist
150-250 Euro.

**Tendenz Material-Spieler:** Spielt bewusst anders, oft sehr
informiert über Noppen/Anti. Kein Belächeln. Nach Noppen-Typ
fragen (KN/LP/Anti), query_rubber_for_side für VH und RH separat.

**Tendenz Pro/Senior (TTR 1700+):** Hat oft schon teures Setup,
will optimieren oder Alternative finden. Budget breit (50-400),
unbedingt fragen. Bei Senior: Arm-Belastung mitdenken.

## Symptom-Erkennung → Tool-Wahl

| Spieler sagt | → Tool | Problem-Parameter |
|---|---|---|
| "Block ist instabil / fliegt weg" | query_by_problem | block_unstable |
| "Topspin fällt zu kurz / ins Netz" | query_by_problem | topspin_falls |
| "Kein Spin drauf" | query_by_problem | no_spin |
| "Zu langsam, kein Tempo" | query_by_problem | too_slow |
| "Zu schnell, keine Kontrolle" | query_by_problem | too_fast |
| "Arm wird schnell müde" | query_by_problem | tired_arm |
| "Was ist [Produkt] genau?" | get_product_details |, |

## FACHWISSEN-BIBLIOTHEK (nutz das aktiv beim Erklären, NIE als Marketing-Sprech)

### Belag-Topsheets (DB liefert Tag, nutze ihn aktiv)

- **grippy** = tensioniert europäisch (griffig, eingebaute Spannung): Tenergy, Rakza, Dignics, Hexer, Acuda, Rasanter, Evolution, Bluefire. Moderner Standard, gut spielbar ab TTR ~1300. Funktioniert mit fast jedem Holz.

- **sticky** = klebrig klassisch chinesisch (ungespannt): Hurricane Neo 3, Hurricane 9, Skyline 3, klassische Big Dipper, Ka Long. Höchstes Spinpotenzial, anspruchsvoller (braucht aktives Spiel mit ganzem Körper), für Topspin-Spieler ab TTR ~1500. **BRAUCHT STEIFES HOLZ** (stiff oder very_stiff Klassifikation), sonst kein sauberer Spin-Übertrag. NICHT für Vereinsspieler-Mittelklasse.

- **hybrid** = chinesisches Topsheet + europäischer Tensor-Schwamm (AKTUELLER TREND 2022-2026): Tibhar K3 / Hybrid MK, DHS Hurricane Neo Provincial/National (Blue/Orange Sponge), JOOLA Dynaryz CMD/Inferno, Friendship 729 Cross/Battle, Sanwei Target National, Andro Rasanter C53. Kombinieren chinesischen Spin mit europäischer Spielbarkeit. **BRAUCHT MITTLERES BIS STEIFES HOLZ** (medium-stiff bis stiff ist ideal, NICHT very_stiff wie classic sticky). Tolerant gegenüber Mittelklasse-Spielern (TTR ab ~1400 sinnvoll). Wenn ein Spieler nach "mehr Spin aber Hexer/Tenergy ist mir zu zahm" fragt → Hybrid ist oft die Antwort.

- **neutral** = weder klebrig noch ausgeprägt griffig: Donic Slice, Acuda S3, Friendship 729 FX, Rakza 7. Anfängerfreundlich, gutmütig im Block.

**Wann Hybrid empfehlen:**
- Spieler hat tensionierten Belag (Tenergy, Hexer, Acuda) und sucht "mehr Spin" → Hybrid testen
- Spieler hat sticky chinesisch und sagt "zu langsam, zu viel Eigeninitiative nötig" → Hybrid als Mittelweg
- Spieler ist neugierig auf chinesisches Spielgefühl aber will keine 30 Trainingseinheiten Umgewöhnung → Hybrid als sanfter Einstieg
- TTR <1400 oder Spieler trainiert nur mit Gleichstarken: kein Hybrid, bleib bei tensioniert europäisch

### Belag-Kategorien
- Inverted (smooth, glatt): Standard, > 90 Prozent aller Spieler.
- Long-Pips (Lange Noppen): Defensivspiel, kehren Spin um.
- Short-Pips (Kurze Noppen): direktes Konterspiel.
- Anti-Spin: dämpft Spin komplett, sehr nischig.

### Holz-Konstruktion
- Allround (5-furnig, Vollholz): Stiga Allround Classic, Tibhar Stratus Power, Donic Persson Powerallround, Andro All Plus. Verzeihend, Anfänger bis Allround.
- Off- bis Off+ (5-7 furnig, Vollholz): Mehr Tempo. Donic Persson Powerplay, Stiga Offensive Classic, Yasaka Sweden Extra.
- Carbon AUSSEN (ALC outer, OFF+): direkter, härter, "Klick im Treffmoment". Butterfly Viscaria, Timo Boll ALC, Zhang Jike. Ab TTR ~1400.
- Carbon INNEN (Innerforce-Prinzip): Carbon im Kern, weichere Holzlagen außen. Behält Holz-Gefühl, dämpft Vibrationen. Butterfly Innerforce ALC/AL, Stiga Carbo Classic. Ab TTR ~1500, gut für Spieler die kein "harter Carbon" mögen.
- ZLC (Zylon-Carbon, super-schnell): Top-Niveau ab TTR 1700+.
- Defensiv-Hölzer (große Schlagfläche, langsam): Stiga Defensive, Donic Defplay, Joola Chen Weixing.
- Balsa-Hölzer: extrem leicht, gut für Senior/Arm-Probleme. TSP Black Balsa, Butterfly Balsa Carbo X5.

### Preisklassen (orientierend)
- Einsteiger: Holz 25-50 Euro, Belag 15-30 Euro → Setup ca. 70-110 Euro
- Vereinsspieler Mittelklasse: Holz 60-100 Euro, Belag 35-50 Euro → Setup 130-200 Euro
- Ambitioniert: Holz 100-150 Euro, Belag 50-70 Euro → Setup 200-290 Euro
- Pro: Holz 150-280 Euro+, Belag 65-80 Euro (Tenergy/Dignics) → Setup 290-440 Euro+

### Aktuelle Trends (Stand 2025/26)
- Hybrid-Beläge sehr im Kommen (Tibhar K3, Yinhe Pro 13, Joola Dynaryz CMD)
- ALC bleibt Pro-Standard für Carbon-Hölzer
- Donic Slice 40 + günstige Tensoren erleben Renaissance bei Allround-Spielern
- DHS Hurricane Neo 3 mit Blue/Orange Sponge (Provincial/National) bleibt Top für offensive Spinspieler
- Innerforce-Prinzip wird wichtiger als Outer-Carbon für ambitioniertes Mittelfeld

## TOOL-OUTPUT, was die Werte BEDEUTEN

Damit du die DB-Resultate richtig interpretierst:

**Synergie-Score (0-100):**
- 90-100: exzellente Übereinstimmung Holz × Belag, sehr verlässlich.
- 80-89: gute Übereinstimmung, normale Empfehlung.
- 70-79: ok, aber kein Selbstläufer, beim Spieler nochmal kommentieren.
- < 70: vorsichtig, nur erwähnen wenn nichts besseres da ist und
  dazu sagen "Score ist mittel, würde ich nicht ohne Test-Möglichkeit
  bestellen".

**Tempo / Kontrolle / Spin (0-100):**
Sind ABSOLUTE Werte des Setups. Skala:
- 0-50: niedrig (z.B. Kontrolle 40 = sehr nervös)
- 50-70: mittel
- 70-85: hoch
- 85-100: sehr hoch

Im Spieler-Kontext:
- Anfänger TTR <1300: Kontrolle SOLLTE >85 sein, Tempo eher <70
- Mittelfeld TTR 1300-1500: Kontrolle 75-90, Tempo 70-85
- Ambitioniert TTR 1500+: Tempo 80+ ok, Kontrolle 70+ reicht
- Tired-arm-Anfrage: Tempo möglichst niedrig, Kontrolle hoch

**Popularitäts-Tags:**
- [Klassiker] (100+ Reviews) → seit Jahren am Markt, sicher verfügbar,
  bevorzugt empfehlen
- [etabliert] (30+) → solide Präsenz, gut empfehlbar
- [bekannt] (10+) → existiert, aber kein Mainstream
- [Nische] (<10) → erscheint NICHT in den Resultaten (DB filtert)

**Preis "k.A.":** Wir haben für diesen Artikel keinen UVP gepflegt.
NICHT raten — sag dem Spieler ehrlich "Preis ist in unserer DB nicht
hinterlegt, schätzungsweise [grobe Klasse]". Lieber transparent als
falsche Zahl.

## DATENBANKRESULTATE, STRIKTE REGELN

Die Datenbank liefert pro Setup: Hersteller-Tags wie [Klassiker] (100+ Reviews), [etabliert] (30+), [bekannt] (10+). Plus GESAMT-PREIS in Euro (Holz + ein Belag pro Seite).

Wichtig:
- Nur Produkte aus den Tool-Ergebnissen empfehlen. NICHTS aus dem Gedächtnis, auch wenn dir ein Belag noch im Kopf ist.
- IMMER zwei bis drei Setups vorschlagen (außer Anfänger).
- BEVORZUGE [Klassiker] und [etabliert] vor [bekannt]. [Nische] solltest du nur vorschlagen wenn es klar zur Anfrage passt und du das auch begründen kannst.
- BUDGET-DISZIPLIN: Wenn ein Setup um mehr als 40 Prozent teurer ist als das Spieler-Budget oder das aktuelle Setup, nenne den Mehrpreis EXPLIZIT ("kostet ungefähr 80 Euro mehr, lohnt sich wenn..."). Nie kommentarlos teurer empfehlen.
- WENN Preis "k.A.": ehrlich sagen, schätze grob aus der Klasse, frag den Spieler ob er es trotzdem will.

## STRUKTUR-PFLICHT bei mehreren Setups

Wenn du 2-3 Setups empfiehlst, formuliere IMMER so, mit echten Zeilenumbrüchen zwischen den Setups:

Setup 1: [Holzname] mit [Belagname] (~XX Euro)
[Ein bis zwei Sätze Begründung warum dieses Setup zum Spieler passt + ggf. Preis-Vergleich zum aktuellen Setup.]

Setup 2: [Holzname] mit [Belagname] (~XX Euro)
[Begründung.]

Setup 3: [Holzname] mit [Belagname] (~XX Euro)
[Begründung.]

Wichtig:
- Schreibe die Setups NIE als langen Fließtext-Absatz ohne Trennung.
- Jedes Setup beginnt mit "Setup N:" am Zeilenanfang, gefolgt von Holz + Belag + Preis in Klammern.
- Pro Setup nur EIN Holz und EIN Belag (oder VH/RH wenn explizit unterschiedlich).
- Wenn du einen Belag explizit als NICHT passend einordnest: nenne ihn nur im Fließtext mit klarer Negation ("Den X würde ich hier weglassen, weil..."), NIE im "Setup N:"-Format.

Bei DB_KEIN_ERGEBNIS: Ehrlich sagen, kurz warum (TTR-Randbereich, seltener Stil). Anderen Tool-Call mit leicht anderen Parametern vorschlagen.

Bei DB_ANFAENGER (TTR < 900): Direkt: unsere DB startet bei TTR 1000. Genau EINEN Einsteiger-Tipp: vorkonfektionierter Schläger 30 bis 60 Euro (Stiga, Donic, Butterfly Einstieg). Keine Belag-Namen aus dem Gedächtnis. Einladung in 3 bis 6 Monaten.

Bei Material-Spielern: Noppen-Typ klären (KN/LP/Anti). Dann query_rubber_for_side für VH und RH separat nutzen. Holz und VH-Belag im selben Response empfehlen wenn möglich.

## MUSTERANTWORT (so soll Beratung aussehen)

Spieler-Input: "TTR 1300, Allround. Hab Stiga Allround Classic mit
Andro Hexer Powergrip. Will im Topspin besser werden."

Gute Antwort:
"Bevor ich konkret werde, kurz: damit du nicht mit nem Setup dastehst
das nicht passt, brauch ich ne ehrliche Selbsteinschätzung. Wenn du
sagst deine Technik passt schon, empfehl ich dir härtere Beläge, und
wenn die nicht funktionieren ist's frustrierend. Lieber konservativ
wenn unsicher.

Drei Sachen würden mir helfen: Trainierst du systematisch (mit Trainer
oder festen Übungen) oder spielst du eher Punktspiele? Wie oft pro
Woche? Und: würdest du sagen dein Topspin sitzt sauber, oder ist das
eher noch Glücksache?"

[Spieler antwortet: "Vereinstraining 1× Woche, Topspin sitzt
manchmal, manchmal Netz. TTR ist bei 1300 stabil seit nem Jahr."]

"Klare Diagnose: Plateau, kein systematischer Aufbau, Topspin nicht
verlässlich. Da würde ich am Setup wenig schrauben - Hexer Powergrip
ist gut. Das Allround Classic ist mit Speed 4.6 aber sehr langsam,
das könnte tatsächlich bremsen.

[ruft get_product_details auf, dann query_setups mit budget_max_eur=120]

Setup 1: Tibhar Stratus Power Wood mit Andro Hexer Powergrip (~95 Euro)
Etwas mehr Tempo als das Allround Classic, du behältst aber dein
gewohntes Belag-Gefühl. Den vorhandenen Hexer behalten, nur Holz
tauschen ist auch günstiger als Komplett-Wechsel.

Setup 2: Stiga Hybrid Wood NCT mit Donic Acuda S2 (~150 Euro)
Setup für wenn du dem Topspin technisch jetzt Zeit zum Wachsen geben
willst. Der Acuda S2 hat etwas mehr Eigen-Spin als der Hexer,
verzeiht aber noch genug. Kostet ~50 Euro mehr als jetzt.

Mein ehrlicher Tipp: erstmal Setup 1. Holz wechseln, Hexer behalten,
nochmal 6 Monate trainieren. Wenn der Topspin dann sitzt, kommen wir
zur nächsten Stufe."

(Was diese Antwort gut macht: Ehrlichkeits-Pakt vorab, Triangulation
über Trainings-Frage + Trend, ehrliche Diagnose Plateau, MINIMALER
Wechsel statt Komplett-Empfehlung, Preise nennen, klare Reihenfolge
"erst Setup 1, dann später vielleicht 2".)

## Anti-Patterns (NIE machen)

Falsch: "Der **Donic Vario** ist genau der richtige Ansatz, deutlich kontrollierter."
Richtig: "Der Donic Vario ist kontrollierter als der Hexer Powergrip und vergibt im Block mehr."

Falsch: "Setup-Empfehlung: Allround-Kombi mit maximalem Spin-Potenzial!"
Richtig: "Setup 1: Stiga Allround Classic mit Donic Acuda S2 (~70 Euro). Gibt dir Kontrolle ohne Tempo-Verlust."

Falsch: User hat 140-Euro-Setup → du empfiehlst 320-Euro-Setup ohne Kommentar.
Richtig: User hat 140-Euro-Setup → du empfiehlst max ~180 Euro, oder beim teureren Setup explizit "~150 Euro mehr als jetzt, lohnt sich wenn dir Y wichtig ist".

Falsch: User fragt nach Alternative → du empfiehlst Nische-Holz das es kaum noch zu kaufen gibt.
Richtig: bevorzuge [Klassiker] und [etabliert] aus den Tool-Resultaten.

Falsch: "Drei Wege, perfekt abgestimmt auf dein Profil."
Richtig: "Drei Setups, die zu deinem Profil passen:"`;

const SYSTEM_PROMPT_EN = `You are PongSmith, the independent table-tennis equipment advisor for club players.

## Character & Tone

You are like the experienced club teammate who gives honest advice after practice. No sales talk.

CRITICAL style rules:
- Language: always English, friendly but not chummy
- NO MARKDOWN: no asterisks for bold (**), no backticks, no # headings. Plain prose.
- NO EM-DASHES or EN-DASHES (- or -). Use commas or plain hyphens (-) instead.
- NO SALES TALK: avoid superlatives like "perfect", "ideal", "game-changer", "top pick". Stay descriptive ("gives more block forgiveness", "plays softer").
- Length: three precise sentences over one long paragraph.
- Mirror moment: one sentence showing you understood, then recommend factually.

## Conversation flow

**Step 1, Understand the profile:**
Find: TTR (or experience), play style, current setup, specific problem/goal. Don't ask everything at once.

**Step 2, Call the right tool:**
TTR + style clear → query_setups. Specific problem → query_by_problem first.
Detail question → get_product_details. Material player or TTR > 1400 wanting VH/RH split → query_rubber_for_side.

**Step 3, Explain results:**
1-2 sentences per recommendation on WHY it fits this player. Use the product info provided (hardness, character, description).

## Player types

**Mid-level (TTR 1000-1400, allround/offensive):** Unsure, feels gear is to blame. Needs forgiving setup. Tone: warm, affirming. Set prefer_known_brands=true.
**Ambitious (TTR 1400-1700, offensive):** Knows what they want. Technical explanations OK. Direct, ambitious tone.
**Material player:** Respect their style. Ask pip type first (LP/SP/Anti). Use query_rubber_for_side for VH and RH.

## Symptom → Tool mapping

| Player says | → Tool | problem param |
|---|---|---|
| "Block flies off" | query_by_problem | block_unstable |
| "Topspin falls short" | query_by_problem | topspin_falls |
| "No spin" | query_by_problem | no_spin |
| "Too slow" | query_by_problem | too_slow |
| "No control" | query_by_problem | too_fast |
| "Arm tires quickly" | query_by_problem | tired_arm |
| "Tell me about [product]" | get_product_details |, |

## Database result rules

→ Only products from results. Max 3, by priority. Nothing from memory.
→ DB_KEIN_ERGEBNIS: honest, brief reason, suggest retry with adjusted params.
→ DB_ANFAENGER (TTR < 900): starts at TTR 1000, one entry-level tip (pre-made racket €30-60).`;

function getSystemPrompt(lang: "de" | "en"): string {
  return lang === "en" ? SYSTEM_PROMPT_EN : SYSTEM_PROMPT_DE;
}

// ---------------------------------------------------------------------------
// Tool-Definitionen
// ---------------------------------------------------------------------------

const TOOLS: Anthropic.Tool[] = [
  {
    name: "query_setups",
    description: "Fragt die PongSmith-DB nach passenden Holz+Belag-Kombinationen ab. Liefert bis zu 5 diverse Empfehlungen mit Produktdetails.",
    input_schema: {
      type: "object" as const,
      properties: {
        ttr: { type: "number", description: "TTR des Spielers (600-2000). Schätz 700 für absolute Anfänger." },
        play_style: {
          type: "string",
          enum: ["offensive_topspin", "allround", "defensive", "material"],
          description: "Spielstil: offensive_topspin | allround | defensive | material",
        },
        rubber_type: {
          type: "string",
          enum: ["inverted", "long_pips", "short_pips", "anti"],
          description: "Optional: Belag-Typ. Weglassen für Standard (invertiert).",
        },
        prefer_known_brands: {
          type: "boolean",
          description: "true = westliche Marken bevorzugen (Butterfly, Stiga, Donic etc.). Default: true für TTR <1400, false für ambitionierte Spieler.",
        },
        budget_max_eur: {
          type: "number",
          description: "Optional: Maximales Gesamtbudget für Holz+Belag in EUR. Setups die deutlich teurer sind werden gefiltert. Beispiel: 150 für Vereins-Mittelklasse, 250 für ambitioniert. Bei Setup-Wechsel: ungefähr ±30% des aktuellen Setup-Preises.",
        },
        max_results: {
          type: "number",
          description: "Maximale Treffer (1-5). Default: 3.",
        },
      },
      required: ["ttr", "play_style"],
    },
  },
  {
    name: "get_product_details",
    description: "Gibt vollständige Infos zu einem einzelnen Holz oder Belag zurück, Beschreibung, Community-Meinung, alle technischen Werte.",
    input_schema: {
      type: "object" as const,
      properties: {
        product_type: { type: "string", enum: ["blade", "rubber"], description: "Produkttyp" },
        product_name: { type: "string", description: "Name des Produkts (aus query_setups Ergebnis)" },
      },
      required: ["product_type", "product_name"],
    },
  },
  {
    name: "query_rubber_for_side",
    description: "Sucht Beläge für eine spezifische Schlägerseite (VH oder RH). Für Materialspieler und ambitionierte Spieler mit unterschiedlichen VH/RH-Anforderungen.",
    input_schema: {
      type: "object" as const,
      properties: {
        ttr: { type: "number", description: "TTR des Spielers" },
        side: { type: "string", enum: ["vh", "rh"], description: "Schlägerseite: vh (Vorhand) oder rh (Rückhand)" },
        desired_character: {
          type: "string",
          enum: ["spin_offensive", "control_allround", "control_defensive", "long_pips", "short_pips", "anti"],
          description: "Gewünschter Charakter: spin_offensive | control_allround | control_defensive | long_pips | short_pips | anti",
        },
      },
      required: ["ttr", "side", "desired_character"],
    },
  },
  {
    name: "query_by_problem",
    description: "Symptom-basierte Suche: Spieler beschreibt ein konkretes Problem → passende Lösungen.",
    input_schema: {
      type: "object" as const,
      properties: {
        ttr: { type: "number", description: "TTR des Spielers" },
        play_style: {
          type: "string",
          enum: ["offensive_topspin", "allround", "defensive", "material"],
        },
        problem: {
          type: "string",
          enum: ["block_unstable", "topspin_falls", "no_spin", "too_slow", "too_fast", "tired_arm"],
          description: "Problem: block_unstable | topspin_falls | no_spin | too_slow | too_fast | tired_arm",
        },
      },
      required: ["ttr", "play_style", "problem"],
    },
  },
];

// ---------------------------------------------------------------------------
// DB-Hilfstyp
// ---------------------------------------------------------------------------

interface SetupRow {
  synergyScore: number;
  scoreOffensive: number | null;
  scoreAllround: number | null;
  scoreDefensive: number | null;
  scoreMaterial: number | null;
  tempoMatch: number | null;
  controlReserve: number | null;
  spinPotential: number | null;
  bladeName: string;
  bladeManufacturerId: number;
  bladeComposition: string | null;
  bladeStiffness: string | null;
  bladePriceEur: string | null;
  bladeReviewCount: number | null;
  bladeIsCurated: boolean | null;
  rubberName: string;
  rubberHardnessMin: number | null;
  rubberHardnessMax: number | null;
  rubberTopsheet: string | null;
  rubberPriceEur: string | null;
  rubberReviewCount: number | null;
  rubberIsCurated: boolean | null;
  ttrTarget: number;
}

// ---------------------------------------------------------------------------
// Diversitäts-Filter: max 1 pro Hersteller + max 1 pro Belag → Top N
// ---------------------------------------------------------------------------

function diversify(
  rows: SetupRow[],
  maxResults: number,
  preferWestern: boolean,
): SetupRow[] {
  const seenManufacturer = new Set<number>();
  const seenRubber = new Set<string>();
  const result: SetupRow[] = [];

  const processRow = (row: SetupRow): boolean => {
    if (seenManufacturer.has(row.bladeManufacturerId)) return false;
    if (seenRubber.has(row.rubberName)) return false;
    seenManufacturer.add(row.bladeManufacturerId);
    seenRubber.add(row.rubberName);
    result.push(row);
    return true;
  };

  const isWestern = (row: SetupRow): boolean => {
    const firstWord = row.bladeName.split(" ")[0] ?? "";
    if (!WESTERN_BRANDS.has(firstWord)) return false;
    // Auch der Belag-Hersteller sollte westlich sein.
    // Wir greifen den ersten Token vom Belag-Namen ab.
    const rubberFirstWord = row.rubberName.split(" ")[0] ?? "";
    return WESTERN_BRANDS.has(rubberFirstWord);
  };

  if (preferWestern) {
    // STRIKT: Nur Westmarken. Keine Auffüll-Logik mit chinesischen Beläge mehr,
    // weil die für die Kern-Zielgruppe (Vereinsspieler ohne Spezial-Vorliebe)
    // nicht zur Spielerfahrung passen und beim Kauf bei DE-Shops oft nicht
    // verfügbar sind.
    for (const row of rows) {
      if (result.length >= maxResults) break;
      if (isWestern(row)) processRow(row);
    }
    // Notfall-Fallback nur wenn 0 Western-Treffer existieren: dann zumindest
    // irgendwas zurückgeben, damit der Berater nicht "DB leer" sagt.
    if (result.length === 0) {
      for (const row of rows) {
        if (result.length >= maxResults) break;
        processRow(row);
      }
    }
  } else {
    for (const row of rows) {
      if (result.length >= maxResults) break;
      processRow(row);
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Ergebnis-Formatter
// ---------------------------------------------------------------------------

function formatHardness(min: number | null, max: number | null): string {
  if (min === null) return "k.A.";
  if (max === null) return `${min}°`;
  return `${min}-${max}°`;
}

function formatTopsheet(ts: string | null): string {
  if (!ts) return "";
  if (ts === "sticky") return "klebrig klassisch (chinesisch, ungespannt)";
  if (ts === "grippy") return "griffig (europäisch tensioniert)";
  if (ts === "hybrid") return "HYBRID (chin. Topsheet + europ. Tensor-Schwamm)";
  return "neutral";
}

function formatPrice(eur: string | null): string {
  if (!eur) return "Preis k.A.";
  const n = parseFloat(eur);
  return `${Math.round(n)} EUR`;
}

function formatPopularity(reviewCount: number | null, isCurated?: boolean | null): string {
  if (isCurated) return "DE-Klassiker, redaktionell ergänzt";
  const n = reviewCount ?? 0;
  if (n >= 100) return "Klassiker";
  if (n >= 30) return "etabliert";
  if (n >= 10) return "bekannt";
  return "Nische";
}

function rowsToText(rows: SetupRow[], ttr: number, styleName: string, lang: "de" | "en"): string {
  const isEn = lang === "en";
  const header = isEn
    ? `Database results for TTR ${ttr} (${styleName}):`
    : `Datenbankresultate für TTR ${ttr} (${styleName}):`;

  const lines = rows.map((r, i) => {
    const hardness = formatHardness(r.rubberHardnessMin, r.rubberHardnessMax);
    const topsheet = r.rubberTopsheet ? `Topsheet: ${formatTopsheet(r.rubberTopsheet)}` : "";
    const composition = r.bladeComposition ? `Aufbau: ${r.bladeComposition}` : "";
    const stiffness = r.bladeStiffness ? `Steifigkeit: ${r.bladeStiffness}` : "";

    const bladeInfo = [composition, stiffness].filter(Boolean).join(", ");
    const rubberInfo = [hardness !== "k.A." ? `Härte: ${hardness}` : "", topsheet].filter(Boolean).join(", ");

    const bladePrice = formatPrice(r.bladePriceEur);
    const rubberPrice = formatPrice(r.rubberPriceEur);
    const totalPrice = setupPrice(r);
    const totalLine = totalPrice
      ? `   GESAMT-PREIS: ~${totalPrice} EUR (Holz ${bladePrice} + Belag ${rubberPrice}, ein Belag pro Seite gerechnet)`
      : `   PREIS: ${bladePrice} (Holz) + ${rubberPrice} (Belag) — Gesamt unbekannt`;

    return [
      `${i + 1}. Holz: ${r.bladeName} [${formatPopularity(r.bladeReviewCount, r.bladeIsCurated)}]${bladeInfo ? ` (${bladeInfo})` : ""}`,
      `   Belag: ${r.rubberName} [${formatPopularity(r.rubberReviewCount, r.rubberIsCurated)}]${rubberInfo ? ` (${rubberInfo})` : ""}`,
      totalLine,
      `   Synergie: ${r.synergyScore}/100 | Tempo: ${r.tempoMatch ?? "-"} | Kontrolle: ${r.controlReserve ?? "-"} | Spin: ${r.spinPotential ?? "-"}`,
    ].join("\n");
  });

  return `${header}\n\n${lines.join("\n\n")}`;
}

// ---------------------------------------------------------------------------
// Wiederverwendbare Select-Felder + Filter
// ---------------------------------------------------------------------------

const SETUP_ROW_SELECT = {
  synergyScore: synergies.synergyScore,
  scoreOffensive: synergies.scoreOffensive,
  scoreAllround: synergies.scoreAllround,
  scoreDefensive: synergies.scoreDefensive,
  scoreMaterial: synergies.scoreMaterial,
  tempoMatch: synergies.tempoMatch,
  controlReserve: synergies.controlReserve,
  spinPotential: synergies.spinPotential,
  bladeName: blades.name,
  bladeManufacturerId: blades.manufacturerId,
  bladeComposition: blades.composition,
  bladeStiffness: blades.stiffness,
  bladePriceEur: blades.priceEur,
  bladeReviewCount: blades.communityReviewCount,
  bladeIsCurated: blades.isManuallyCurated,
  rubberName: rubbers.name,
  rubberHardnessMin: rubbers.hardnessMin,
  rubberHardnessMax: rubbers.hardnessMax,
  rubberTopsheet: rubbers.topsheetCharacter,
  rubberPriceEur: rubbers.priceEur,
  rubberReviewCount: rubbers.communityReviewCount,
  rubberIsCurated: rubbers.isManuallyCurated,
  ttrTarget: synergies.ttrTarget,
} as const;

/** Filter: nur Produkte mit minimalem Review-Count (Verfügbarkeits-Proxy
 *  gegen discontinued/Nische-Hölzer die niemand mehr kaufen kann). */
const MIN_REVIEW_COUNT = 10;

/** Holz-Filter: bekanntes Produkt ODER redaktionell ergänzter DE-Klassiker. */
const bladeAvailabilityFilter = or(
  gte(blades.communityReviewCount, MIN_REVIEW_COUNT),
  eq(blades.isManuallyCurated, true),
);

/** Belag-Filter: identisches Konzept. */
const rubberAvailabilityFilter = or(
  gte(rubbers.communityReviewCount, MIN_REVIEW_COUNT),
  eq(rubbers.isManuallyCurated, true),
);

/** Setup-Preis (Holz + Belag). null wenn ein Preis fehlt. */
function setupPrice(row: SetupRow): number | null {
  const b = row.bladePriceEur ? parseFloat(row.bladePriceEur) : null;
  const r = row.rubberPriceEur ? parseFloat(row.rubberPriceEur) : null;
  if (b === null || r === null) return null;
  return Math.round(b + r);
}

/** Filter Setups auf Budget-Cap. Setups ohne Preisdaten bleiben drin
 *  (KI bekommt dann den Hinweis "Preis unbekannt"). */
function applyBudget(rows: SetupRow[], budgetMaxEur?: number): SetupRow[] {
  if (!budgetMaxEur) return rows;
  return rows.filter((r) => {
    const p = setupPrice(r);
    return p === null || p <= budgetMaxEur * 1.05; // 5% Toleranz
  });
}

/** Confidence-Discount: Setups mit niedrigen Review-Counts werden in der
 *  Sortierung leicht abgewertet, damit [Klassiker] systematisch vor
 *  [bekannt] angezeigt werden. Der angezeigte synergyScore bleibt unverändert
 *  - wir verändern nur die Sortier-Reihenfolge.
 */
function confidenceFactor(reviewCount: number | null): number {
  const n = reviewCount ?? 0;
  if (n >= 100) return 1.0;   // Klassiker: voller Score
  if (n >= 30) return 0.97;   // etabliert: minimaler Abschlag
  if (n >= 10) return 0.90;   // bekannt: 10% Abschlag
  return 0.75;                // Nische: 25% Abschlag (kommt durch Filter eh selten)
}

function sortByConfidenceAdjustedScore(rows: SetupRow[]): SetupRow[] {
  return [...rows].sort((a, b) => {
    const aFactor = Math.min(
      confidenceFactor(a.bladeReviewCount),
      confidenceFactor(a.rubberReviewCount),
    );
    const bFactor = Math.min(
      confidenceFactor(b.bladeReviewCount),
      confidenceFactor(b.rubberReviewCount),
    );
    return b.synergyScore * bFactor - a.synergyScore * aFactor;
  });
}

// ---------------------------------------------------------------------------
// Tool: query_setups
// ---------------------------------------------------------------------------

async function runQuerySetups(
  ttr: number,
  playStyle: string,
  rubberType: string | undefined,
  preferKnownBrands: boolean,
  maxResults: number,
  lang: "de" | "en",
  budgetMaxEur?: number,
): Promise<string> {
  if (ttr < 900) return "DB_ANFAENGER";

  const clamped = Math.max(1000, Math.min(1700, ttr));

  // Material-Spieler
  const isMaterial = playStyle === "material" || (rubberType && rubberType !== "inverted");
  if (isMaterial) {
    const dbRubberType =
      rubberType === "long_pips" ? "long_pips"
      : rubberType === "short_pips" ? "short_pips"
      : rubberType === "anti" ? "anti"
      : null;
    return runMaterialQuery(clamped, dbRubberType, preferKnownBrands, Math.min(maxResults, 5), lang, budgetMaxEur);
  }

  const validStyle = ["offensive_topspin", "allround", "defensive"].includes(playStyle)
    ? playStyle as "offensive_topspin" | "allround" | "defensive"
    : "allround";

  // Stil-spezifische Score-Spalte wählen
  const scoreColumn =
    validStyle === "offensive_topspin" ? synergies.scoreOffensive
    : validStyle === "defensive"       ? synergies.scoreDefensive
    : synergies.scoreAllround;

  const rows = await db
    .select(SETUP_ROW_SELECT)
    .from(synergies)
    .innerJoin(blades, eq(synergies.bladeId, blades.id))
    .innerJoin(rubbers, eq(synergies.rubberId, rubbers.id))
    .where(
      and(
        gte(synergies.ttrTarget, clamped - 300),
        lte(synergies.ttrTarget, clamped + 300),
        eq(synergies.playStyleTarget, validStyle),
        eq(rubbers.type, "smooth"),
        bladeAvailabilityFilter,
        rubberAvailabilityFilter,
      ),
    )
    .orderBy(desc(scoreColumn))
    .limit(120); // großes Pool für Diversitäts- + Budget-Filter

  const budgetFiltered = applyBudget(rows as SetupRow[], budgetMaxEur);
  const confidenceSorted = sortByConfidenceAdjustedScore(budgetFiltered);
  const diverse = diversify(confidenceSorted, Math.min(maxResults, 5), preferKnownBrands);

  if (diverse.length === 0) {
    // Fallback: Spielstil auf allround lockern, Review-Filter beibehalten
    const fallback = await db
      .select(SETUP_ROW_SELECT)
      .from(synergies)
      .innerJoin(blades, eq(synergies.bladeId, blades.id))
      .innerJoin(rubbers, eq(synergies.rubberId, rubbers.id))
      .where(
        and(
          gte(synergies.ttrTarget, clamped - 300),
          lte(synergies.ttrTarget, clamped + 300),
          eq(rubbers.type, "smooth"),
          bladeAvailabilityFilter,
          rubberAvailabilityFilter,
        ),
      )
      .orderBy(desc(synergies.scoreAllround))
      .limit(120);

    const fallbackBudgeted = applyBudget(fallback as SetupRow[], budgetMaxEur);
    const fallbackSorted = sortByConfidenceAdjustedScore(fallbackBudgeted);
    const diverseFallback = diversify(fallbackSorted, 5, preferKnownBrands);
    if (diverseFallback.length === 0) {
      const budgetHint = budgetMaxEur ? ` (Budget: max ${budgetMaxEur} EUR)` : "";
      return `DB_KEIN_ERGEBNIS (TTR: ${ttr}, Stil: ${validStyle}${budgetHint})`;
    }

    const styleName = lang === "en" ? "Allround (Fallback)" : "Allround (Fallback, keine genauen Treffer für gewünschten Stil)";
    return rowsToText(diverseFallback, ttr, styleName, lang);
  }

  const styleNames: Record<string, string> = {
    offensive_topspin: lang === "en" ? "Offensive/Topspin" : "Offensiv/Topspin",
    allround: "Allround",
    defensive: lang === "en" ? "Defensive" : "Defensiv",
  };

  return rowsToText(diverse, ttr, styleNames[validStyle] ?? validStyle, lang);
}

async function runMaterialQuery(
  clamped: number,
  rubberType: "long_pips" | "short_pips" | "anti" | null,
  preferKnownBrands: boolean,
  maxResults: number,
  lang: "de" | "en",
  budgetMaxEur?: number,
): Promise<string> {
  const rubberTypeFilter = rubberType
    ? eq(rubbers.type, rubberType)
    : inArray(rubbers.type, ["long_pips", "short_pips", "anti"]);

  const rows = await db
    .select(SETUP_ROW_SELECT)
    .from(synergies)
    .innerJoin(blades, eq(synergies.bladeId, blades.id))
    .innerJoin(rubbers, eq(synergies.rubberId, rubbers.id))
    .where(
      and(
        gte(synergies.ttrTarget, clamped - 300),
        lte(synergies.ttrTarget, clamped + 300),
        eq(synergies.playStyleTarget, "material"),
        rubberTypeFilter,
        bladeAvailabilityFilter,
        rubberAvailabilityFilter,
      ),
    )
    .orderBy(desc(synergies.scoreMaterial))
    .limit(120);

  const budgetFiltered = applyBudget(rows as SetupRow[], budgetMaxEur);
  const confidenceSorted = sortByConfidenceAdjustedScore(budgetFiltered);
  const diverse = diversify(confidenceSorted, maxResults, preferKnownBrands);

  if (diverse.length === 0) {
    const budgetHint = budgetMaxEur ? ` (Budget: max ${budgetMaxEur} EUR)` : "";
    return `DB_KEIN_ERGEBNIS (TTR: ${clamped}, Material-Stil: ${rubberType ?? "alle Typen"}${budgetHint})`;
  }

  const typeName = lang === "en"
    ? (rubberType === "long_pips" ? "Long Pips" : rubberType === "short_pips" ? "Short Pips" : rubberType === "anti" ? "Anti" : "Material")
    : (rubberType === "long_pips" ? "Lange Noppen" : rubberType === "short_pips" ? "Kurze Noppen" : rubberType === "anti" ? "Anti-Belag" : "Material");

  return rowsToText(diverse, clamped, typeName, lang);
}

// ---------------------------------------------------------------------------
// Tool: get_product_details
// ---------------------------------------------------------------------------

async function runGetProductDetails(
  productType: "blade" | "rubber",
  productName: string,
  lang: "de" | "en",
): Promise<string> {
  const isEn = lang === "en";

  if (productType === "blade") {
    const rows = await db
      .select({
        name: blades.name,
        composition: blades.composition,
        stiffness: blades.stiffness,
        layers: blades.layers,
        weightMin: blades.weightMin,
        weightMax: blades.weightMax,
        communitySpeed: blades.communitySpeed,
        communityControl: blades.communityControl,
        communityReviewCount: blades.communityReviewCount,
        speedNorm: blades.speedNorm,
        controlNorm: blades.controlNorm,
        ttrMin: blades.ttrMin,
        ttrMax: blades.ttrMax,
        priceEur: blades.priceEur,
        isManuallyCurated: blades.isManuallyCurated,
        description: blades.description,
        communityDescription: blades.communityDescription,
      })
      .from(blades)
      .where(drizzleSql`LOWER(${blades.name}) LIKE LOWER(${"%" + productName + "%"})`)
      .limit(1);

    if (rows.length === 0) {
      return isEn
        ? `No blade found matching "${productName}".`
        : `Kein Holz gefunden mit Name "${productName}".`;
    }

    const b = rows[0]!;
    const speed = b.communitySpeed ?? b.speedNorm ?? "k.A.";
    const control = b.communityControl ?? b.controlNorm ?? "k.A.";
    const weight = b.weightMin && b.weightMax ? `${b.weightMin}-${b.weightMax}g` : "k.A.";

    return [
      `Holz: ${b.name}`,
      `Aufbau: ${b.composition ?? "k.A."} | Steifigkeit: ${b.stiffness ?? "k.A."} | Furniere: ${b.layers ?? "k.A."} | Gewicht: ${weight}`,
      `Speed: ${speed} | Kontrolle: ${control} (Community, ${b.communityReviewCount ?? 0} Reviews) [${formatPopularity(b.communityReviewCount, b.isManuallyCurated)}]`,
      `PREIS: ${formatPrice(b.priceEur)}`,
      b.description ? `\nHersteller-Info: ${b.description.substring(0, 400)}` : "",
      b.communityDescription ? `\nSpieler-Fazit: ${b.communityDescription.substring(0, 300)}` : "",
    ].filter(Boolean).join("\n");
  }

  // rubber
  const rows = await db
    .select({
      name: rubbers.name,
      type: rubbers.type,
      hardnessMin: rubbers.hardnessMin,
      hardnessMax: rubbers.hardnessMax,
      topsheetCharacter: rubbers.topsheetCharacter,
      communitySpeed: rubbers.communitySpeed,
      communitySpin: rubbers.communitySpin,
      communityControl: rubbers.communityControl,
      communityReviewCount: rubbers.communityReviewCount,
      ttrMin: rubbers.ttrMin,
      ttrMax: rubbers.ttrMax,
      priceEur: rubbers.priceEur,
      isManuallyCurated: rubbers.isManuallyCurated,
      description: rubbers.description,
      communityDescription: rubbers.communityDescription,
    })
    .from(rubbers)
    .where(drizzleSql`LOWER(${rubbers.name}) LIKE LOWER(${"%" + productName + "%"})`)
    .limit(1);

  if (rows.length === 0) {
    return isEn
      ? `No rubber found matching "${productName}".`
      : `Kein Belag gefunden mit Name "${productName}".`;
  }

  const r = rows[0]!;
  const hardness = formatHardnessDetail(r.hardnessMin, r.hardnessMax);
  const topsheet = r.topsheetCharacter ? formatTopsheet(r.topsheetCharacter) : "k.A.";
  const typeLabel = r.type === "smooth" ? "Noppen innen" : r.type === "long_pips" ? "Lange Noppen" : r.type === "short_pips" ? "Kurze Noppen" : "Anti";

  return [
    `Belag: ${r.name} (${typeLabel})`,
    `Härte: ${hardness} | Topsheet: ${topsheet}`,
    `Speed: ${r.communitySpeed ?? "k.A."} | Spin: ${r.communitySpin ?? "k.A."} | Kontrolle: ${r.communityControl ?? "k.A."} (${r.communityReviewCount ?? 0} Reviews) [${formatPopularity(r.communityReviewCount, r.isManuallyCurated)}]`,
    `PREIS: ${formatPrice(r.priceEur)}`,
    r.description ? `\nHersteller-Info: ${r.description.substring(0, 400)}` : "",
    r.communityDescription ? `\nSpieler-Fazit: ${r.communityDescription.substring(0, 300)}` : "",
  ].filter(Boolean).join("\n");
}

function formatHardnessDetail(min: number | null, max: number | null): string {
  if (!min) return "k.A.";
  return max ? `${min}-${max}°` : `${min}°`;
}

// ---------------------------------------------------------------------------
// Tool: query_rubber_for_side
// ---------------------------------------------------------------------------

async function runQueryRubberForSide(
  ttr: number,
  side: "vh" | "rh",
  desiredCharacter: string,
  lang: "de" | "en",
): Promise<string> {
  const clamped = Math.max(1000, Math.min(1700, ttr));
  const isEn = lang === "en";

  // Character → Filter-Logik
  let rubberTypeFilter;
  let scoreColumn;
  let minSpeed: number | null = null;
  let maxSpeed: number | null = null;

  switch (desiredCharacter) {
    case "spin_offensive":
      rubberTypeFilter = eq(rubbers.type, "smooth");
      scoreColumn = synergies.scoreOffensive;
      minSpeed = 7;
      break;
    case "control_allround":
      rubberTypeFilter = eq(rubbers.type, "smooth");
      scoreColumn = synergies.scoreAllround;
      break;
    case "control_defensive":
      rubberTypeFilter = eq(rubbers.type, "smooth");
      scoreColumn = synergies.scoreDefensive;
      maxSpeed = 7;
      break;
    case "long_pips":
      rubberTypeFilter = eq(rubbers.type, "long_pips");
      scoreColumn = synergies.scoreMaterial;
      break;
    case "short_pips":
      rubberTypeFilter = eq(rubbers.type, "short_pips");
      scoreColumn = synergies.scoreMaterial;
      break;
    case "anti":
      rubberTypeFilter = eq(rubbers.type, "anti");
      scoreColumn = synergies.scoreMaterial;
      break;
    default:
      rubberTypeFilter = eq(rubbers.type, "smooth");
      scoreColumn = synergies.scoreAllround;
  }

  const conditions = [
    gte(synergies.ttrTarget, clamped - 250),
    lte(synergies.ttrTarget, clamped + 250),
    rubberTypeFilter,
  ];

  const rows = await db
    .select({
      rubberName: rubbers.name,
      rubberHardnessMin: rubbers.hardnessMin,
      rubberHardnessMax: rubbers.hardnessMax,
      rubberTopsheet: rubbers.topsheetCharacter,
      communitySpeed: rubbers.communitySpeed,
      communitySpin: rubbers.communitySpin,
      communityControl: rubbers.communityControl,
      score: scoreColumn,
    })
    .from(synergies)
    .innerJoin(rubbers, eq(synergies.rubberId, rubbers.id))
    .where(and(...conditions))
    .orderBy(desc(scoreColumn))
    .limit(100);

  // Deduplizieren nach Belag-Name, Speed-Filter anwenden
  const seen = new Set<string>();
  const filtered = rows
    .filter((r) => {
      const s = parseFloat(String(r.communitySpeed ?? 7));
      if (minSpeed !== null && s < minSpeed) return false;
      if (maxSpeed !== null && s > maxSpeed) return false;
      return true;
    })
    .filter((r) => {
      if (seen.has(r.rubberName)) return false;
      seen.add(r.rubberName);
      return true;
    })
    .slice(0, 3);

  if (filtered.length === 0) {
    return isEn
      ? `DB_KEIN_ERGEBNIS (TTR: ${ttr}, side: ${side}, character: ${desiredCharacter})`
      : `DB_KEIN_ERGEBNIS (TTR: ${ttr}, Seite: ${side}, Charakter: ${desiredCharacter})`;
  }

  const sideLabel = isEn ? (side === "vh" ? "Forehand" : "Backhand") : (side === "vh" ? "Vorhand" : "Rückhand");
  const charLabel = isEn ? desiredCharacter : {
    spin_offensive: "Spin/Offensiv", control_allround: "Control/Allround",
    control_defensive: "Control/Defensiv", long_pips: "Lange Noppen",
    short_pips: "Kurze Noppen", anti: "Anti",
  }[desiredCharacter] ?? desiredCharacter;

  const header = isEn
    ? `Rubber recommendations for ${sideLabel} (TTR ${ttr}, ${charLabel}):`
    : `Belag-Empfehlungen für ${sideLabel} (TTR ${ttr}, ${charLabel}):`;

  const lines = filtered.map((r, i) => {
    const hardness = formatHardnessDetail(r.rubberHardnessMin, r.rubberHardnessMax);
    const topsheet = r.rubberTopsheet ? formatTopsheet(r.rubberTopsheet) : "";
    const speed = r.communitySpeed ?? "-";
    const spin = r.communitySpin ?? "-";
    const control = r.communityControl ?? "-";
    return `${i + 1}. ${r.rubberName} | Härte: ${hardness} | ${topsheet ? `Topsheet: ${topsheet} | ` : ""}Speed: ${speed}, Spin: ${spin}, Kontrolle: ${control}`;
  });

  return `${header}\n${lines.join("\n")}`;
}

// ---------------------------------------------------------------------------
// Tool: query_by_problem
// ---------------------------------------------------------------------------

async function runQueryByProblem(
  ttr: number,
  playStyle: string,
  problem: string,
  lang: "de" | "en",
): Promise<string> {
  const clamped = Math.max(1000, Math.min(1700, ttr));

  // Problem → Score-Priorität und Mindest-Werte
  const problemConfig: Record<string, {
    orderByCol: keyof typeof synergies;
    descriptionDE: string;
    descriptionEN: string;
    minControl?: number;
    minSpin?: number;
    minTempo?: number;
    maxTempo?: number;
  }> = {
    block_unstable: {
      orderByCol: "controlReserve",
      descriptionDE: "Block instabil, Setup mit hoher Kontrollreserve gesucht",
      descriptionEN: "Unstable block, looking for high control reserve",
      minControl: 70,
    },
    topspin_falls: {
      orderByCol: "spinPotential",
      descriptionDE: "Topspin fällt zu kurz, Setup mit höherem Spin-Potenzial gesucht",
      descriptionEN: "Topspin falls short, higher spin potential needed",
      minSpin: 75,
    },
    no_spin: {
      orderByCol: "spinPotential",
      descriptionDE: "Kein Spin, spinstarkes Setup gesucht",
      descriptionEN: "No spin, high-spin setup needed",
      minSpin: 80,
    },
    too_slow: {
      orderByCol: "tempoMatch",
      descriptionDE: "Zu langsam, schnelleres Setup gesucht",
      descriptionEN: "Too slow, faster setup needed",
      minTempo: 60,
    },
    too_fast: {
      orderByCol: "controlReserve",
      descriptionDE: "Zu schnell, kontrollierbareres Setup gesucht",
      descriptionEN: "Too fast, more controllable setup needed",
      minControl: 75,
      maxTempo: 70,
    },
    tired_arm: {
      orderByCol: "controlReserve",
      descriptionDE: "Müder Arm, leichteres, weiches Setup gesucht",
      descriptionEN: "Tired arm, lighter, softer setup needed",
      minControl: 70,
      maxTempo: 65,
    },
  };

  const config = problemConfig[problem];
  if (!config) {
    return `DB_KEIN_ERGEBNIS (unbekanntes Problem: ${problem})`;
  }

  const validStyle = ["offensive_topspin", "allround", "defensive", "material"].includes(playStyle)
    ? playStyle as "offensive_topspin" | "allround" | "defensive" | "material"
    : "allround";

  const scoreColumn =
    validStyle === "offensive_topspin" ? synergies.scoreOffensive
    : validStyle === "defensive"       ? synergies.scoreDefensive
    : validStyle === "material"        ? synergies.scoreMaterial
    : synergies.scoreAllround;

  // Primäre Sortierung nach problem-spezifischer Spalte
  const orderCol =
    config.orderByCol === "controlReserve" ? synergies.controlReserve
    : config.orderByCol === "spinPotential" ? synergies.spinPotential
    : synergies.tempoMatch;

  const conditions = [
    gte(synergies.ttrTarget, clamped - 300),
    lte(synergies.ttrTarget, clamped + 300),
    eq(synergies.playStyleTarget, validStyle),
    eq(rubbers.type, "smooth"),
    bladeAvailabilityFilter,
    rubberAvailabilityFilter,
  ];

  const rows = await db
    .select(SETUP_ROW_SELECT)
    .from(synergies)
    .innerJoin(blades, eq(synergies.bladeId, blades.id))
    .innerJoin(rubbers, eq(synergies.rubberId, rubbers.id))
    .where(and(...conditions))
    .orderBy(desc(orderCol))
    .limit(120);

  // Zusätzliche Filter nach Problem-Schwellwerten
  const filtered = (rows as SetupRow[]).filter((r) => {
    if (config.minControl !== undefined && (r.controlReserve ?? 0) < config.minControl) return false;
    if (config.minSpin !== undefined && (r.spinPotential ?? 0) < config.minSpin) return false;
    if (config.minTempo !== undefined && (r.tempoMatch ?? 0) < config.minTempo) return false;
    if (config.maxTempo !== undefined && (r.tempoMatch ?? 100) > config.maxTempo) return false;
    return true;
  });

  const filteredAndSorted = sortByConfidenceAdjustedScore(filtered);
  const diverse = diversify(filteredAndSorted, 3, true);

  if (diverse.length === 0) {
    return lang === "de"
      ? `DB_KEIN_ERGEBNIS, Kein Setup mit passendem Profil für "${problem}" gefunden. Versuche query_setups mit dem Spielstil.`
      : `DB_KEIN_ERGEBNIS, No setup found for problem "${problem}". Try query_setups with the play style.`;
  }

  const styleLabel = lang === "en" ? config.descriptionEN : config.descriptionDE;
  return rowsToText(diverse, ttr, styleLabel, lang);
}

// ---------------------------------------------------------------------------
// Agentic Loop
// ---------------------------------------------------------------------------

// ─── Rate-Limiting gegen Cost-DoS auf der Anthropic-API ──────────────────
//
// Jeder /api/berater-Call kostet uns echtes Geld. Ohne Limit könnte jemand
// uns durch Brute-Force in die Insolvenz schicken.
// In-Memory-Map, OK für Single-Region Vercel.

const RATE_LIMIT_PER_HOUR = 20;
const RATE_LIMIT_PER_DAY = 100;
const rateMapHour = new Map<string, { count: number; resetAt: number }>();
const rateMapDay = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ipHash: string): { allowed: boolean; reason?: string } {
  const now = Date.now();

  // Stündlich
  const hourEntry = rateMapHour.get(ipHash);
  if (!hourEntry || now > hourEntry.resetAt) {
    rateMapHour.set(ipHash, { count: 1, resetAt: now + 3_600_000 });
  } else {
    if (hourEntry.count >= RATE_LIMIT_PER_HOUR) {
      return { allowed: false, reason: "stündlich" };
    }
    hourEntry.count++;
  }

  // Täglich
  const dayEntry = rateMapDay.get(ipHash);
  if (!dayEntry || now > dayEntry.resetAt) {
    rateMapDay.set(ipHash, { count: 1, resetAt: now + 86_400_000 });
  } else {
    if (dayEntry.count >= RATE_LIMIT_PER_DAY) {
      return { allowed: false, reason: "täglich" };
    }
    dayEntry.count++;
  }

  return { allowed: true };
}

// Periodisch alte Einträge aufräumen
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of rateMapHour.entries()) {
    if (now > v.resetAt) rateMapHour.delete(k);
  }
  for (const [k, v] of rateMapDay.entries()) {
    if (now > v.resetAt) rateMapDay.delete(k);
  }
}, 600_000).unref?.();

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY nicht konfiguriert." },
      { status: 503 },
    );
  }

  // Rate-Limit-Check (IP-Hash, keine Klartext-IP gespeichert)
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";
  const ipHash = createHash("sha256").update(ip).digest("hex");
  const limit = checkRateLimit(ipHash);
  if (!limit.allowed) {
    return NextResponse.json(
      {
        error: `Du hast das ${limit.reason}e Limit erreicht. Versuch's später nochmal.`,
      },
      { status: 429 },
    );
  }

  try {
    const { messages, lang: rawLang } = (await req.json()) as {
      messages: { role: "user" | "assistant"; content: string }[];
      lang?: string;
    };

    const lang: "de" | "en" = rawLang === "en" ? "en" : "de";
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    let current: Anthropic.MessageParam[] = messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    // Agentic Loop (max. 6 Runden, mehr Tools = mehr mögliche Calls)
    // Modell aus config.ts — Sonnet 4.7 für Kosteneffizienz (Mai 2026).
    for (let i = 0; i < 6; i++) {
      const response = await client.messages.create({
        model: config.modelBerater,
        max_tokens: 1200,
        system: getSystemPrompt(lang),
        tools: TOOLS,
        messages: current,
      });

      if (response.stop_reason === "end_turn") {
        const text = response.content
          .filter((b): b is Anthropic.TextBlock => b.type === "text")
          .map((b) => b.text)
          .join("");

        // Produkte erkennen
        const detected = await detectProducts(text);

        // Bild-URLs + Review-Counts + Slugs pro Produkt nachladen
        const bladeIds = detected.filter((p) => p.type === "blade").map((p) => p.id);
        const rubberIds = detected.filter((p) => p.type === "rubber").map((p) => p.id);

        const [bladeMeta, rubberMeta] = await Promise.all([
          bladeIds.length > 0
            ? db.select({
                id: blades.id,
                slug: blades.slug,
                imageUrl: blades.imageUrl,
                reviewCount: blades.communityReviewCount,
              }).from(blades).where(inArray(blades.id, bladeIds))
            : Promise.resolve([]),
          rubberIds.length > 0
            ? db.select({
                id: rubbers.id,
                slug: rubbers.slug,
                imageUrl: rubbers.imageUrl,
                reviewCount: rubbers.communityReviewCount,
              }).from(rubbers).where(inArray(rubbers.id, rubberIds))
            : Promise.resolve([]),
        ]);

        const bladeMetaById = new Map(bladeMeta.map((b) => [b.id, b]));
        const rubberMetaById = new Map(rubberMeta.map((r) => [r.id, r]));

        const enrichProduct = (p: typeof detected[0]) => {
          const meta = p.type === "blade" ? bladeMetaById.get(p.id) : rubberMetaById.get(p.id);
          const ref = { type: p.type, id: p.id, name: p.name, manufacturer: p.manufacturer };
          const shops = getShopLinks(ref).map((l) => ({
            id: l.shop.id,
            name: l.shop.name,
            url: buildTrackingUrl({ shopId: l.shop.id, productType: p.type, productId: p.id }),
            affiliateActive: l.affiliateActive,
          }));
          return {
            type: p.type,
            id: p.id,
            name: p.name,
            manufacturer: p.manufacturer,
            slug: meta?.slug ?? null,
            imageUrl: meta?.imageUrl ?? null,
            reviewCount: meta?.reviewCount ?? 0,
            shops,
          };
        };

        const products = detected.map(enrichProduct);

        // Setup-Gruppen erkennen + Synergie-Scores pro Setup nachladen
        let setupGroups = groupProductsBySetup(text, detected);

        // Fallback: Wenn keine Setup-Marker erkannt wurden, NUR dann eine
        // generische Karte zeigen, wenn die Produkt-Liste klar ein einzelnes
        // Setup ergibt (max 1 Holz + max 2 Beläge). Sonst lieber gar keine
        // Karte als ein zusammengewürfeltes Frankenstein-Setup aus mehreren
        // Empfehlungen oder disclaimten Produkten.
        if (setupGroups.length === 0 && detected.length > 0) {
          const bladeCount = detected.filter((p) => p.type === "blade").length;
          const rubberCount = detected.filter((p) => p.type === "rubber").length;
          const looksLikeSingleSetup = bladeCount <= 1 && rubberCount <= 2 && detected.length <= 3;
          if (looksLikeSingleSetup) {
            setupGroups = [{
              index: 1,
              title: "Empfohlenes Setup",
              description: "Aus den im Text genannten Produkten zusammengestellt.",
              products: detected,
            }];
          }
          // Sonst: setupGroups bleibt leer, UI zeigt nur Beratertext ohne Karten.
        }

        const setups = await Promise.all(setupGroups.map(async (g) => {
          const blade = g.products.find((p) => p.type === "blade");
          const setupRubbers = g.products.filter((p) => p.type === "rubber");

          // Synergie-Score: Durchschnitt der Holz×Belag-Synergien dieses Setups
          let synergyScore: number | null = null;
          if (blade && setupRubbers.length > 0) {
            const synRows = await db.select({
              score: synergies.synergyScore,
            }).from(synergies).where(
              and(
                eq(synergies.bladeId, blade.id),
                inArray(synergies.rubberId, setupRubbers.map((r) => r.id)),
              ),
            );
            if (synRows.length > 0) {
              const avg = synRows.reduce((s, r) => s + r.score, 0) / synRows.length;
              synergyScore = Math.round(avg);
            }
          }

          return {
            index: g.index,
            title: g.title,
            description: g.description,
            synergyScore,
            products: g.products.map(enrichProduct),
          };
        }));

        return NextResponse.json({ text, products, setups });
      }

      if (response.stop_reason === "tool_use") {
        const toolBlocks = response.content.filter(
          (b): b is Anthropic.ToolUseBlock => b.type === "tool_use",
        );

        const toolResults: Anthropic.ToolResultBlockParam[] = [];

        for (const toolBlock of toolBlocks) {
          let toolResult = "";

          if (toolBlock.name === "query_setups") {
            const inp = toolBlock.input as {
              ttr: number;
              play_style: string;
              rubber_type?: string;
              prefer_known_brands?: boolean;
              budget_max_eur?: number;
              max_results?: number;
            };
            toolResult = await runQuerySetups(
              inp.ttr,
              inp.play_style,
              inp.rubber_type,
              inp.prefer_known_brands ?? true,
              inp.max_results ?? 3,
              lang,
              inp.budget_max_eur,
            );
          } else if (toolBlock.name === "get_product_details") {
            const inp = toolBlock.input as { product_type: "blade" | "rubber"; product_name: string };
            toolResult = await runGetProductDetails(inp.product_type, inp.product_name, lang);
          } else if (toolBlock.name === "query_rubber_for_side") {
            const inp = toolBlock.input as { ttr: number; side: "vh" | "rh"; desired_character: string };
            toolResult = await runQueryRubberForSide(inp.ttr, inp.side, inp.desired_character, lang);
          } else if (toolBlock.name === "query_by_problem") {
            const inp = toolBlock.input as { ttr: number; play_style: string; problem: string };
            toolResult = await runQueryByProblem(inp.ttr, inp.play_style, inp.problem, lang);
          }

          toolResults.push({
            type: "tool_result",
            tool_use_id: toolBlock.id,
            content: toolResult,
          });
        }

        current = [
          ...current,
          { role: "assistant", content: response.content },
          { role: "user", content: toolResults },
        ];
      }
    }

    const fallback = lang === "en"
      ? "Sorry, I couldn't generate a response."
      : "Entschuldigung, konnte keine Antwort generieren.";
    return NextResponse.json({ text: fallback });

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[berater]", msg);
    const detail = process.env.NODE_ENV !== "production" ? msg : msg.substring(0, 120);
    return NextResponse.json({ error: detail }, { status: 500 });
  }
}
