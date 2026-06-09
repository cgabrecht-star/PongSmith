# Berater-Eval-Harness

Automatisierte Tests gegen `/api/berater` mit 10 Personas aus echten
Revspin- und Forum-Daten.

## Schnellstart

```bash
npm run eval         # gegen Production (pongsmith.de)
npm run eval:local   # gegen lokal laufenden Next-Dev-Server
```

## Was passiert

Pro Persona:
1. Sendet die `initialMessage` an `/api/berater`
2. Wenn der Berater zurückfragt (0 Setups), gibt die nächste
   `followupAnswer` aus dem Script und sendet wieder
3. Max 5 Turns, dann bricht ab
4. Läuft alle deterministischen Checks gegen den finalen Output
5. Logt `✓/✗` mit Anzahl bestandener Checks

Am Ende: Summary in der Console, voller JSON-Report unter `eval/report.json`
(gitignored).

## Checks

Aktuell deterministisch (kein LLM-Judge):

1. **max-turns-respected**: Empfehlung innerhalb von max 3 Turns
2. **budget-cap-respected**: Alle erwähnten Preise ≤ Budget + 15 €
3. **no-mid-stream-correction**: Keine "Warte/Lass mich nochmal/Moment"
4. **no-em-dashes**: Keine — oder – im Output
5. **no-ki-wording**: Kein "KI" oder "KI-Berater"
6. **setup-1-is-top-tip**: Wenn "mein Tipp ist Setup X", dann X = 1
7. **no-fabricated-products**: Alle gezeigten Produkte existieren in DB
8. **anfaenger-refusal-correct**: TTR < 900 → kein Setup + Einsteiger-Hinweis
9. **aspirational-carbon-recommended**: Bei Carbon-Wunsch ≥1 Carbon-Holz
10. **no-defensive-bias**: Bei Offensiv-Aspiration keine DEF-Hölzer
11. **honest-about-db-gap**: Bei DB-Lücke wird das ehrlich erwähnt

## Personas

Siehe `personas.json`. Jede ist abgeleitet aus einer konkreten Quelle
(`realInspiration`-Feld), gescriptet mit fixen Follow-up-Antworten für
Reproduzierbarkeit. Erwartetes Berater-Verhalten in `expectations`.

## Nach einem Run

Wenn Checks fehlschlagen:
1. Schau in `eval/report.json` → `conversation`-Array der betroffenen
   Persona, da steht der komplette Dialog
2. `finalText` zeigt die letzte Berater-Antwort
3. Failure-Details stehen in `checks[].detail`

Wenn ein Failure-Pattern mehrere Personas trifft → System-Prompt-Fix
in `app/api/berater/route.ts`, dann nochmal `npm run eval`.

## Persona erweitern

`personas.json` editieren, neuen Eintrag im selben Schema anhängen.
Wichtig: `realInspiration` mit Quelle, damit klar bleibt warum diese
Persona im Test ist.
