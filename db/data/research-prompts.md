# PongSmith — Recherche-Prompts für KI-Agenten

**Anleitung:** Jeden Batch separat in einen neuen Perplexity- / ChatGPT-Agenten kopieren. Output ist immer JSON. Speichere die JSON-Antworten in Dateien wie `research-batch-01.json`, `research-batch-02.json` etc. und schick sie zurück.

---

## 🔧 SYSTEM-INSTRUKTIONEN (für alle Batches identisch)

Diese kommen in jeden einzelnen Prompt — du musst sie also pro Batch mit-kopieren.

```
Du bist ein Tischtennis-Produkt-Researcher. Recherchiere für jedes der unten aufgelisteten Produkte (Beläge oder Hölzer) die folgenden Informationen aus dem öffentlichen Web. Quellen ausschließlich:
1. Offizielle Hersteller-Website (höchste Priorität für Hersteller-Text und Bild-URL)
2. TableTennisDB.com, Revspin.net, RacketInsight.com, Megaspin.net (für Community-Meinungen)
3. Tabletennisdaily.com Forum, MyTableTennis.net Forum (für Spielerstimmen)
4. Hersteller-Produktkatalog-PDFs falls auffindbar

Für JEDES Produkt liefere folgende Felder im JSON-Format zurück:

{
  "slug": "<exakter Slug wie unten angegeben>",
  "name": "<offizieller Produktname>",
  "manufacturer": "<Hersteller>",
  "imageUrl": "<absolute URL zum offiziellen Produktbild auf der Hersteller-CDN, möglichst hochauflösend, KEINE Bilder von Drittanbieter-Shops>",
  "imageSource": "<Domain der Bild-Quelle, z.B. butterfly-global.com>",
  "manufacturerUrl": "<URL der offiziellen Hersteller-Produktseite>",
  "manufacturerDescription": "<Vollständiger Marketing-/Produkttext des Herstellers, wörtlich übernommen, auf Englisch oder Deutsch je nachdem wie er publiziert wurde. Mindestens 3 Sätze, idealerweise 5-10. Falls der Hersteller den Text auf seiner Website ausführlich beschreibt (z.B. eine ganze Seite Marketing), übernimm den vollständigen Text. Falls nur ein kurzer Spec-Satz vorhanden ist, dann eben kurz.>",
  "manufacturerSpecs": {
    "speed": "<Hersteller-Speed-Wert mit Skala, z.B. '13.0/13.0' bei Butterfly>",
    "spin": "<dito, nur bei Belägen>",
    "control": "<dito>",
    "spongeHardness": "<z.B. '36 Grad' oder 'medium-hard'>",
    "thickness": "<verfügbare Schwammdicken, z.B. '1.7 / 1.9 / 2.1 mm'>",
    "weight": "<Gramm-Range, nur bei Hölzern, z.B. '85-90 g'>",
    "layers": "<Furnier-Aufbau, nur bei Hölzern, z.B. '5 Holz + 2 ALC'>",
    "category": "<bei Belägen: 'inverted/smooth' | 'long pips' | 'short pips' | 'anti'>"
  },
  "communityConsensus": {
    "summary": "<2-4 Sätze deutsche Synthese der wiederkehrenden Spielermeinungen aus mehreren Quellen. Fokus: Was sagen die meisten Spieler übereinstimmend? Was sind wiederkehrende Lobpunkte und wiederkehrende Kritikpunkte?>",
    "sources": ["<Liste der URLs aus denen du die Community-Meinung gezogen hast>"],
    "playerLevelRange": "<Welche TTR/Spielstärke-Range nennen Spieler typischerweise? z.B. 'TTR 1500-2000'>",
    "primaryUseCase": "<Wofür wird der Belag/das Holz vom Großteil der Community am meisten empfohlen? z.B. 'Vorhand-Topspin für Offensivspieler'>"
  }
}

Wichtige Regeln:
- KEIN halluziniertes Bild — wenn du keine offizielle Hersteller-Bild-URL findest, setze imageUrl auf null
- KEIN halluzinierter Hersteller-Text — wenn die Hersteller-Website kein Produkt-Detail hat, setze manufacturerDescription auf null
- Bei der Community-Synthese: NUR Aussagen, die in mindestens 2 unabhängigen Quellen vorkommen
- Sprache der manufacturerDescription bleibt Originalsprache (Englisch oder Deutsch)
- Sprache von communityConsensus.summary IMMER Deutsch
- Bei Bildern bevorzuge .jpg/.png/.webp mit mindestens 300x300 Pixel
- Liefere die Ergebnisse als ein einziges JSON-Array, nicht als Fließtext

Beginne die Recherche jetzt und gib am Ende ein vollständiges JSON-Array zurück.
```

---

## 📦 BATCH 01 — Butterfly (20 Produkte)

**Site-Hinweis für den Agenten:** Offizielle Quelle ist `butterfly-global.com` und `butterfly.tt`. Bilder liegen meist unter `butterfly-global.com/uploads/` oder `butterfly.tt/products/`.

```
[Hier System-Instruktionen oben einfügen]

Liste der Produkte (Slug | Name | Hersteller | Typ):

butterfly-dignics-05 | Butterfly Dignics 05 | Butterfly | Belag-invertiert
butterfly-dignics-09c | Butterfly Dignics 09C | Butterfly | Belag-invertiert
butterfly-dignics-64 | Butterfly Dignics 64 | Butterfly | Belag-invertiert
butterfly-dignics-80 | Butterfly Dignics 80 | Butterfly | Belag-invertiert
butterfly-rozena | Butterfly Rozena | Butterfly | Belag-invertiert
butterfly-sriver-el | Butterfly Sriver EL | Butterfly | Belag-invertiert
butterfly-tackifire-drive | Butterfly Tackifire Drive | Butterfly | Belag-invertiert
butterfly-tenergy-05 | Butterfly Tenergy 05 | Butterfly | Belag-invertiert
butterfly-tenergy-05-fx | Butterfly Tenergy 05 FX | Butterfly | Belag-invertiert
butterfly-tenergy-19 | Butterfly Tenergy 19 | Butterfly | Belag-invertiert
butterfly-tenergy-64 | Butterfly Tenergy 64 | Butterfly | Belag-invertiert
butterfly-tenergy-80 | Butterfly Tenergy 80 | Butterfly | Belag-invertiert
butterfly-tenergy-80-fx | Butterfly Tenergy 80 FX | Butterfly | Belag-invertiert
butterfly-addoy | Addoy | Butterfly | Holz
butterfly-innerforce-layer-alc | Butterfly Innerforce Layer ALC | Butterfly | Holz
butterfly-primorac | Butterfly Primorac | Butterfly | Holz
butterfly-timo-boll-alc | Butterfly Timo Boll ALC | Butterfly | Holz
butterfly-timo-boll-zlf | Butterfly Timo Boll ZLF | Butterfly | Holz
butterfly-viscaria | Butterfly Viscaria | Butterfly | Holz
butterfly-zhang-jike-alc | Butterfly Zhang Jike ALC | Butterfly | Holz
butterfly-joo-se-hyuk | Joo Se Hyuk | Butterfly | Holz
```

---

## 📦 BATCH 02 — Stiga (10 Produkte)

**Site-Hinweis:** `stigasports.com` und `stiga.com`. Produkt-URLs meist `/products/table-tennis/...`.

```
[Hier System-Instruktionen oben einfügen]

Liste der Produkte:

stiga-calibra-lt | Stiga Calibra LT | Stiga | Belag-invertiert
stiga-calibra-lt-sound | Stiga Calibra LT Sound | Stiga | Belag-invertiert
stiga-mantra-h | Stiga Mantra H | Stiga | Belag-invertiert
stiga-mantra-m | Stiga Mantra M | Stiga | Belag-invertiert
stiga-mantra-s | Stiga Mantra S | Stiga | Belag-invertiert
stiga-defensive-wrb | Defensive WRB | Stiga | Holz
stiga-allround-classic | Stiga Allround Classic | Stiga | Holz
stiga-allround-evolution | Stiga Allround Evolution | Stiga | Holz
stiga-clipper-cr | Stiga Clipper CR | Stiga | Holz
stiga-offensive-classic | Stiga Offensive Classic (OC) | Stiga | Holz
```

---

## 📦 BATCH 03 — Donic (10 Produkte)

**Site-Hinweis:** `donic.com`. Produktbilder unter `donic.com/fileadmin/...`.

```
[Hier System-Instruktionen oben einfügen]

Liste der Produkte:

donic-baracuda | Donic Baracuda | Donic | Belag-invertiert
donic-bluefire-m1 | Donic Bluefire M1 | Donic | Belag-invertiert
donic-bluefire-m2 | Donic Bluefire M2 | Donic | Belag-invertiert
donic-bluefire-m3 | Donic Bluefire M3 | Donic | Belag-invertiert
donic-coppa-jo-silver | Donic Coppa JO Silver | Donic | Belag-invertiert
donic-quattro-a1 | Quattro A1 | Donic | Belag-kurze-Noppen
donic-slice-40-cd-turbo | Slice 40 CD Turbo | Donic | Belag-anti
donic-appelgren-allplay-senso-v2 | Appelgren Allplay Senso V2 | Donic | Holz
donic-ovtcharov-carbospeed | Donic Ovtcharov Carbospeed | Donic | Holz
donic-persson-powerplay | Donic Persson Powerplay | Donic | Holz
donic-waldner-allplay | Donic Waldner Allplay | Donic | Holz
donic-waldner-senso-carbon | Donic Waldner Senso Carbon | Donic | Holz
```

---

## 📦 BATCH 04 — Tibhar (12 Produkte)

**Site-Hinweis:** `tibhar.com` und `tibhar.de`. Beschreibungen oft ausführlich auf Deutsch verfügbar.

```
[Hier System-Instruktionen oben einfügen]

Liste der Produkte:

tibhar-aurus | Tibhar Aurus | Tibhar | Belag-invertiert
tibhar-aurus-sound | Tibhar Aurus Sound | Tibhar | Belag-invertiert
tibhar-evolution-el-s | Tibhar Evolution EL-S | Tibhar | Belag-invertiert
tibhar-evolution-fx-s | Tibhar Evolution FX-S | Tibhar | Belag-invertiert
tibhar-evolution-mx-p | Tibhar Evolution MX-P | Tibhar | Belag-invertiert
tibhar-evolution-mx-s | Tibhar Evolution MX-S | Tibhar | Belag-invertiert
tibhar-grass-dtecs | Grass D.TecS | Tibhar | Belag-lange-Noppen
tibhar-phantom-guang | Phantom Guang | Tibhar | Belag-anti
tibhar-speedy-soft | Speedy Soft | Tibhar | Belag-kurze-Noppen
tibhar-speedy-soft-dtecs | Speedy Soft D.TecS | Tibhar | Belag-kurze-Noppen
tibhar-champ | Champ | Tibhar | Holz
tibhar-samsonov-force-pro | Tibhar Samsonov Force Pro | Tibhar | Holz
tibhar-stratus-power-wood | Tibhar Stratus Power Wood | Tibhar | Holz
```

---

## 📦 BATCH 05 — Joola + Andro (12 Produkte)

**Site-Hinweis:** `joola.com` und `andro.de`. Beide haben deutsche Produktseiten.

```
[Hier System-Instruktionen oben einfügen]

Liste der Produkte:

joola-dynaryz-agr | JOOLA Dynaryz AGR | Joola | Belag-invertiert
joola-rhyzm | JOOLA Rhyzm | Joola | Belag-invertiert
joola-rhyzm-tech | JOOLA Rhyzm Tech | Joola | Belag-invertiert
joola-rhyzm-p | JOOLA Rhyzm-P | Joola | Belag-invertiert
joola-zack | JOOLA Zack | Joola | Belag-invertiert
joola-express-ultra | Express Ultra | Joola | Belag-kurze-Noppen
joola-orca | Orca | Joola | Belag-anti
joola-k5 | JOOLA K5 | Joola | Holz
andro-hexer | Andro Hexer | Andro | Belag-invertiert
andro-hexer-powergrip | Andro Hexer Powergrip | Andro | Belag-invertiert
andro-rasant | Andro Rasant | Andro | Belag-invertiert
andro-rasant-powergrip | Andro Rasant PowerGrip | Andro | Belag-invertiert
andro-super-core-cell-off | Andro Super Core Cell OFF | Andro | Holz
```

---

## 📦 BATCH 06 — Xiom + Yasaka (15 Produkte)

**Site-Hinweis:** `xiom.com` und `yasaka.se`.

```
[Hier System-Instruktionen oben einfügen]

Liste der Produkte:

xiom-omega-vii-pro | Xiom Omega VII Pro | Xiom | Belag-invertiert
xiom-omega-vii-tour | Xiom Omega VII Tour | Xiom | Belag-invertiert
xiom-vega-asia | Xiom Vega Asia | Xiom | Belag-invertiert
xiom-vega-elite | Xiom Vega Elite | Xiom | Belag-invertiert
xiom-vega-europe | Xiom Vega Europe | Xiom | Belag-invertiert
xiom-vega-pro | Xiom Vega Pro | Xiom | Belag-invertiert
xiom-hayabusa-z | Xiom Hayabusa Z | Xiom | Holz
xiom-stradivarius | Xiom Stradivarius | Xiom | Holz
yasaka-mark-v | Yasaka Mark V | Yasaka | Belag-invertiert
yasaka-rakza-7 | Yasaka Rakza 7 | Yasaka | Belag-invertiert
yasaka-rakza-7-soft | Yasaka Rakza 7 Soft | Yasaka | Belag-invertiert
yasaka-rakza-x | Yasaka Rakza X | Yasaka | Belag-invertiert
yasaka-phantom-0011-infinity | Phantom 0011 Infinity | Yasaka | Belag-lange-Noppen
yasaka-ma-lin-extra-offensive | Yasaka Ma Lin Extra Offensive | Yasaka | Holz
yasaka-sweden-extra | Yasaka Sweden Extra | Yasaka | Holz
```

---

## 📦 BATCH 07 — Nittaku + Victas + DHS (13 Produkte)

**Site-Hinweis:** `nittaku.com` (Japan), `victas.com` (Japan/EU), `dhs-tabletennis.com` (China). Bei DHS oft auch englische Seiten von Distributoren.

```
[Hier System-Instruktionen oben einfügen]

Liste der Produkte:

nittaku-fastarc-c-1 | Nittaku Fastarc C-1 | Nittaku | Belag-invertiert
nittaku-fastarc-g-1 | Nittaku Fastarc G-1 | Nittaku | Belag-invertiert
nittaku-fastarc-s-1 | Nittaku Fastarc S-1 | Nittaku | Belag-invertiert
nittaku-curl-p1r | Curl P-1R | Nittaku | Belag-lange-Noppen
nittaku-spectol-s1 | Spectol S1 | Nittaku | Belag-kurze-Noppen
nittaku-acoustic | Nittaku Acoustic | Nittaku | Holz
nittaku-violin | Nittaku Violin | Nittaku | Holz
nittaku-ludeack | Ludeack | Nittaku | Holz
victas-triple-extra | Victas Triple Extra | Victas | Belag-invertiert
victas-ventus-extra | Victas Ventus Extra | Victas | Belag-invertiert
victas-vo-101 | VO > 101 | Victas | Belag-kurze-Noppen
victas-vo-102 | VO > 102 | Victas | Belag-lange-Noppen
victas-curl-p5v | Curl P5V | Victas | Belag-anti
dhs-hurricane-3 | DHS Hurricane 3 (H3) | DHS | Belag-invertiert
dhs-hurricane-8 | DHS Hurricane 8 | DHS | Belag-invertiert
```

---

## 📦 BATCH 08 — Dr. Neubauer + SpinLord (12 Produkte)

**Site-Hinweis:** Spezialhersteller für Material-Spieler. `dr-neubauer.de` und `spinlord.de` haben sehr ausführliche deutsche Beschreibungen — hier kommt der Agent gut zum Zug.

```
[Hier System-Instruktionen oben einfügen]

Liste der Produkte:

dr-neubauer-abs-2 | A-B-S 2 | Dr. Neubauer | Belag-lange-Noppen
dr-neubauer-aggressivo | Aggressivo | Dr. Neubauer | Belag-anti
dr-neubauer-desperado | Desperado | Dr. Neubauer | Belag-lange-Noppen
dr-neubauer-explosion | Explosion | Dr. Neubauer | Belag-kurze-Noppen
dr-neubauer-golem | Golem | Dr. Neubauer | Belag-kurze-Noppen
dr-neubauer-grizzly | Grizzly | Dr. Neubauer | Belag-lange-Noppen
dr-neubauer-killer | Killer | Dr. Neubauer | Belag-lange-Noppen
dr-neubauer-super-block | Super Block | Dr. Neubauer | Belag-anti
dr-neubauer-tactical | Tactical | Dr. Neubauer | Holz
spinlord-dornenglanz-ii | Dornenglanz II | SpinLord | Belag-lange-Noppen
spinlord-marder | Marder | SpinLord | Belag-lange-Noppen
spinlord-waran | Waran | SpinLord | Belag-kurze-Noppen
```

---

## 📦 BATCH 09 — Asiatische Marken (5 Produkte)

**Site-Hinweis:** Schwierige Quellen — `friendship-tt.com` (729), `juic.co.jp`, `dawei-table-tennis.com`, `yinhe.cc`. Falls Hersteller-Site keine Bilder hat: Distributor wie `tabletennis11.com` als sekundäre Quelle nutzen, aber **das Bild muss von der Hersteller-CDN sein**.

```
[Hier System-Instruktionen oben einfügen]

Liste der Produkte:

friendship-729-cream | 729 Cream | Friendship | Belag-anti
friendship-802-40 | 802-40 | Friendship | Belag-kurze-Noppen
juic-999-elite | 999 Elite | Juic | Belag-lange-Noppen
yinhe-galaxy-955 | Galaxy 955 | Yinhe | Belag-lange-Noppen
dawei-388d-1 | 388D-1 | Dawei | Belag-lange-Noppen
```

---

## ✅ Übersicht

| Batch | Hersteller | Anzahl |
|-------|------------|--------|
| 01 | Butterfly | 20 |
| 02 | Stiga | 10 |
| 03 | Donic | 12 |
| 04 | Tibhar | 13 |
| 05 | Joola + Andro | 13 |
| 06 | Xiom + Yasaka | 15 |
| 07 | Nittaku + Victas + DHS | 15 |
| 08 | Dr. Neubauer + SpinLord | 12 |
| 09 | Asiatische Mini-Marken | 5 |
| **Gesamt** | | **115** |

**Reihenfolge der Bearbeitung:** 1 → 2 → 3 → 4 ... oder parallel je nach Agenten-Verfügbarkeit.

**Wenn du die JSON-Antworten zurückbekommst:** Speichere als `db/data/research-batch-XX.json` und sag mir Bescheid — dann importiere ich automatisiert in die DB.
