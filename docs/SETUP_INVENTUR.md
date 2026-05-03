# PongSmith — Setup-Inventur Vereinsspieler

**Zweck:** Strukturierte Datenerhebung zu echten Setups, Wechselgründen und Spielererfahrungen. Diese Daten bilden das Herzstück der PongSmith-Empfehlungs-Engine.

**Zielgröße Phase 1:** 10-15 Interviews, je 5-10 Minuten.

---

## Wie du das Interview führst (Mini-Anleitung)

**Tonalität:** Locker, neugierig, kein Verhör. Du sammelst Erfahrungen, keine Daten.

**Einstieg:** "Hey, ich baue gerade ein Beratungstool für TT-Material und brauche echte Erfahrungen von Vereinsspielern. Hast du 5-10 Minuten? Geht um dein Setup, deine Wechsel, was funktioniert hat und was nicht."

**Wichtig:**
- Lass den Spieler erzählen, nicht nur antworten.
- Notiere wörtliche Zitate. ("Das Holz ist mir zu schnell" ist mehr wert als nur "zu schnell")
- Frag nach, wenn etwas vage ist ("Wie meinst du 'fühlt sich teigig an'?")
- Kein Urteil. Auch wenn der Spieler ein "schlechtes" Setup hat, alles ist Information.

**Nach dem Interview:** Kurz ergänzen, was du selbst über den Spieler weißt (Spielstil, der dir aufgefallen ist, technische Schwächen/Stärken, die du aus Spielen kennst).

---

## Interview-Bogen (zum Ausdrucken oder digital)

### Teil 1: Spieler-Profil (1 Min)

**Name (intern):** _____________________________________

**Q-TTR oder LPZ:** ___________

**Mannschaft / Liga:** ___________

**Spielstil-Selbsteinschätzung:**
- [ ] Offensiv-Topspin
- [ ] Allround
- [ ] Defensiv (Schupfen, Block)
- [ ] Materialspieler (Noppen, Anti)
- [ ] Penholder
- [ ] Sonstiges: __________

**Spielhand:** [ ] RH  [ ] LH  [ ] Beidhändig

**Wie lange spielst du Tischtennis?** _____ Jahre

**Trainings-Frequenz:** _____ x/Woche

---

### Teil 2: Aktuelles Setup (2 Min)

**Holz (Hersteller + Modell):** _____________________________________

**Belag VH:** _____________________________________
- Schwammhärte (wenn bekannt): __________
- Belag-Dicke: __________ mm

**Belag RH:** _____________________________________
- Schwammhärte: __________
- Belag-Dicke: __________ mm

**Schlägergewicht (falls bekannt):** _____ g

**Wie lange spielst du dieses Setup schon?** _____ Monate

**Wer hat dir das Setup empfohlen?**
- [ ] Niemand, selbst recherchiert
- [ ] Mannschaftskollege
- [ ] Trainer
- [ ] Lokaler Shop / Beratung
- [ ] Online-Beratung
- [ ] YouTube / Forum
- [ ] Sonstiges: __________

---

### Teil 3: Bewertung des aktuellen Setups (3 Min)

**Beschreibe dein Setup in einem Satz:**
_____________________________________________________________

**Was kannst du damit gut?**
_____________________________________________________________
_____________________________________________________________

**Wo fühlst du dich limitiert?**
_____________________________________________________________
_____________________________________________________________

**Bewerte folgende Eigenschaften (1-10):**

| Eigenschaft | Wert | Kommentar |
|---|---|---|
| Tempo (zu langsam ↔ zu schnell, 5 = perfekt) | __ | __________ |
| Spin-Erzeugung | __ | __________ |
| Kontrolle | __ | __________ |
| Block-Verhalten | __ | __________ |
| Aufschlag-Kontrolle | __ | __________ |
| Schlägerfühl-Feedback | __ | __________ |
| Gesamtzufriedenheit | __ | __________ |

---

### Teil 4: Wechsel-Historie (3 Min)

**Was hast du DAVOR gespielt?**

Holz: _____________________________________
Belag VH: _____________________________________
Belag RH: _____________________________________

**Warum hast du gewechselt?**
_____________________________________________________________
_____________________________________________________________

**Hat der Wechsel das Problem gelöst?**
- [ ] Ja, voll
- [ ] Teilweise
- [ ] Nein
- [ ] Hat neue Probleme gebracht

**Was hat sich konkret verändert (besser / schlechter)?**
_____________________________________________________________
_____________________________________________________________

**Falls weitere frühere Setups: hier kurz nennen mit Wechselgrund**
_____________________________________________________________

---

### Teil 5: Wunsch & Frust (1 Min)

**Wenn du jetzt frei wählen könntest: Was würdest du am Setup anders machen?**
_____________________________________________________________

**Größter Frust beim Material-Kauf bisher?**
_____________________________________________________________

**Wie informierst du dich über Material? (Mehrfachantwort)**
- [ ] Mannschaftskollegen
- [ ] Trainer
- [ ] mytischtennis-Forum
- [ ] YouTube
- [ ] TT-Shop / Hersteller-Sites
- [ ] TT-Spin / unabhängige Berater
- [ ] Reddit / OOAK
- [ ] Gar nicht, kauf einfach

---

### Teil 6: Eigenbeobachtung (nach dem Interview, vom Interviewer)

**Was beobachtest DU bei diesem Spieler im Spiel?**

Stärken:
_____________________________________________________________

Technische Defizite:
_____________________________________________________________

Würdest du persönlich dem Spieler ein anderes Setup empfehlen? Wenn ja, welches und warum?
_____________________________________________________________
_____________________________________________________________

**Match-Score zwischen Selbsteinschätzung und deiner Beobachtung:**
- [ ] Spieler schätzt sich realistisch ein
- [ ] Spieler unterschätzt sich
- [ ] Spieler überschätzt sich
- [ ] Spieler hat blinden Fleck bei: __________

---

## Datenmodell für Notion / Airtable / Excel

Wenn du die Interviews digital erfassen willst, hier die Felder als Tabellen-Schema:

### Tabelle 1: spieler

| Feld | Typ | Beispiel |
|---|---|---|
| id | UUID | auto |
| name_intern | Text | "Spieler 03 / Marc" |
| qttr | Zahl | 1340 |
| mannschaft | Text | "2. Mannschaft" |
| liga | Text | "Bezirksklasse" |
| spielstil | Multi-Select | "Allround" |
| spielhand | Select | "RH" |
| jahre_aktiv | Zahl | 12 |
| training_pro_woche | Zahl | 2 |
| anmerkungen | Text | freie Notizen |
| created_at | Datum | auto |

### Tabelle 2: setups

| Feld | Typ | Beispiel |
|---|---|---|
| id | UUID | auto |
| spieler_id | Relation → spieler | |
| status | Select | "aktuell" / "vorher" / "frueher" |
| holz_hersteller | Text | "Stiga" |
| holz_modell | Text | "Allround Classic" |
| belag_vh_hersteller | Text | "Donic" |
| belag_vh_modell | Text | "Bluefire M2" |
| belag_vh_haerte | Text | "Mittel 47.5°" |
| belag_vh_dicke | Zahl | 2.0 |
| belag_rh_hersteller | Text | |
| belag_rh_modell | Text | |
| belag_rh_haerte | Text | |
| belag_rh_dicke | Zahl | |
| schlaegergewicht | Zahl | 178 |
| spielzeit_monate | Zahl | 14 |
| empfehlung_quelle | Multi-Select | "Mannschaftskollege" |
| beschreibung_in_einem_satz | Text | wörtliches Zitat |
| was_gut | Text | |
| was_limitierend | Text | |
| score_tempo | Zahl 1-10 | 6 |
| score_spin | Zahl 1-10 | 7 |
| score_kontrolle | Zahl 1-10 | 8 |
| score_block | Zahl 1-10 | 7 |
| score_aufschlag | Zahl 1-10 | 6 |
| score_feedback | Zahl 1-10 | 7 |
| score_gesamt | Zahl 1-10 | 7 |
| wechselgrund | Text | "altes war zu langsam" |
| wechsel_erfolg | Select | "ja"/"teilweise"/"nein"/"neue Probleme" |
| wechsel_was_veraendert | Text | |
| created_at | Datum | auto |

### Tabelle 3: beobachtungen (deine eigene Sicht)

| Feld | Typ | Beispiel |
|---|---|---|
| id | UUID | auto |
| spieler_id | Relation → spieler | |
| beobachtete_staerken | Text | |
| beobachtete_defizite | Text | |
| eigene_setup_empfehlung | Text | |
| eigene_empfehlung_grund | Text | |
| selbsteinschaetzung_qualitaet | Select | "realistisch"/"unter"/"ueber"/"blinder Fleck" |
| blinder_fleck_thema | Text | |
| created_at | Datum | auto |

---

## Tipp: Notion-Setup in 10 Minuten

1. Neue Notion-Page anlegen: "PongSmith — Vereinsspieler-Inventur"
2. Drei Tabellen-Datenbanken (Database) erstellen, Felder wie oben
3. Beziehungen zwischen Tabellen verknüpfen (Relation-Feld)
4. Mobile Notion-App auf Handy installieren — perfekt für Halle
5. Bei jedem Interview: Spieler anlegen → Setups dazu (mind. aktuell + ein vorheriges) → Beobachtung dazu

Alternative: Airtable (kostenlos bis 1.000 Datensätze) oder Excel (offline-fähig).

---

## Warum diese Daten Goldwert sind

Diese Erhebung gibt dir gleich vier Ergebnisse:

1. **Persona-Validierung:** Stimmen meine Annahmen über Marco?
2. **Sprache:** Wie reden Vereinsspieler tatsächlich über Material? Diese Sprache braucht der KI-Berater.
3. **Erfahrungs-DB:** Echte Setup-Bewertungen mit echten Wechselgründen, etwas was niemand sonst hat.
4. **Test-Set:** Wenn die Empfehlungs-Engine später läuft, kannst du gegenchecken: "Hätte sie für Spieler 03 dieselbe Empfehlung ausgesprochen, die er selbst nach Erfahrung als richtig erlebt hat?"

---

*PongSmith Foundation — Setup-Inventur Tool — 02.05.2026*
