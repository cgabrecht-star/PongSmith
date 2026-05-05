# PongSmith — Bilder-Recherche-Prompts

**Anleitung:** Jeden Batch separat in einen Perplexity- / ChatGPT-Agenten kopieren (mit Browsing/Bildersuche aktiv). Output als JSON-Array. Speichere die Antworten als `1.docx` / `2.docx` / `3.docx` in `C:\Users\Gabrecht\Desktop\Data-Bilder` (neuer Ordner!). Dann sag mir Bescheid.

---

## 🔧 SYSTEM-INSTRUKTIONEN (für alle 3 Batches identisch)

```
Du bist ein Tischtennis-Produktbild-Researcher. Für jedes der unten aufgelisteten Produkte (Beläge oder Hölzer) sollst du eine DIREKTE BILD-URL finden, unter der das offizielle Produktbild öffentlich abrufbar ist.

ZIEL: Eine URL, die direkt auf eine Bilddatei (.jpg / .png / .webp) zeigt, mindestens 300x300 Pixel, ohne Login-Schranke oder Hotlink-Schutz.

ERLAUBTE QUELLEN — in dieser Priorität:
1. Offizielle Hersteller-CDN (z.B. butterfly-global.com/uploads/, stigasports.com/images/, donic.com/fileadmin/)
2. Hersteller-Pressemappen, Datenblatt-PDFs (wenn das Bild als JPG/PNG einzeln erreichbar ist)
3. Tabletennisdb.com, Tabletennis-reference.com (haben offizielle Bilder lizenziert)
4. Wikimedia Commons / Wikipedia (frei lizenziert)
5. Öffentlich verlinkte Bilder von Hersteller-eigenen Social-Media-Profilen (Facebook/Instagram-CDN)

NICHT ERLAUBT:
- Amazon-Bilder (m.media-amazon.com etc.) — Lizenzprobleme
- Konkurrenz-Shop-Bilder (TT-Shop.de, Megaspin.net, Tabletennis11.com etc.)
- Revspin.net (blockt Hotlinking, würde also nicht funktionieren)
- AliExpress, Ebay, sonstige Marktplätze

KRITISCHE FORMATIERUNGSREGEL — sonst zerbricht der Importer:
- Liefere die Ausgabe als EIN einziges, valides JSON-Array
- KEINE Perplexity-Zitations-Marker im JSON (kein "[1]", "butterfly+2", "tabletennisdb" etc.)
- NUR gerade ASCII-Anführungszeichen "
- Beginne deine Antwort direkt mit [ und ende mit ]
- KEIN Markdown-Code-Block (kein ```json drumherum)

VALIDIERUNG: Wenn möglich, validiere die Bild-URL bevor du sie zurückgibst — also tatsächlich aufrufen und prüfen ob ein Bild kommt. Wenn du keine geeignete URL findest, setze imageUrl auf null.

Pro Produkt liefere:

{
  "slug": "<exakter Slug wie unten>",
  "imageUrl": "<vollständige absolute Bild-URL>",
  "imageSource": "<Domain woher das Bild kommt, z.B. butterfly-global.com>",
  "notes": "<optionale kurze Notiz wenn Bild schwer zu finden war oder Alternativen verworfen wurden>"
}

Wenn keine geeignete URL gefunden wird:
{
  "slug": "<slug>",
  "imageUrl": null,
  "imageSource": null,
  "notes": "<warum nicht gefunden>"
}

Beginne die Recherche jetzt.
```

---

## 📦 BATCH 1 — Spezialisten / Material-Beläge (15 Produkte)

**Site-Hinweise:**
- Dr. Neubauer: `dr-neubauer.de` hat Produktbilder unter `/wp-content/uploads/` oder `/produkte/`
- SpinLord: `spinlord.de` ähnliche Struktur
- Yinhe / Galaxy: `yinhe.cc` oder Galaxy Sport offiziell
- Juic: `juic.co.jp` (japanisch)
- Dawei: schwer auffindbar — eventuell Wikipedia oder offizielles Datenblatt
- Friendship 729: `friendship-tt.com` falls existent

```
[Hier System-Instruktionen oben einfügen]

Liste der Produkte:

dr-neubauer-abs-2 | A-B-S 2 | Dr. Neubauer | Belag-Anti
dr-neubauer-aggressivo | Aggressivo | Dr. Neubauer | Belag-Anti
dr-neubauer-desperado | Desperado | Dr. Neubauer | Belag-LP
dr-neubauer-explosion | Explosion | Dr. Neubauer | Belag-SP
dr-neubauer-golem | Golem | Dr. Neubauer | Belag-SP
dr-neubauer-grizzly | Grizzly | Dr. Neubauer | Belag-LP
dr-neubauer-killer | Killer | Dr. Neubauer | Belag-LP
dr-neubauer-super-block | Super Block | Dr. Neubauer | Belag-Anti
dr-neubauer-tactical | Tactical | Dr. Neubauer | Holz
spinlord-dornenglanz-ii | Dornenglanz II | SpinLord | Belag-LP
spinlord-marder | Marder | SpinLord | Belag-LP
spinlord-waran | Waran | SpinLord | Belag-SP
yinhe-galaxy-955 | Galaxy 955 | Yinhe | Belag-LP
juic-999-elite | 999 Elite | Juic | Belag-LP
dawei-388d-1 | 388D-1 | Dawei | Belag-LP
```

---

## 📦 BATCH 2 — Premium-Marken (16 Produkte)

**Site-Hinweise:**
- Butterfly: `butterfly-global.com/en/products/detail/{ID}.html` mit IDs wie 30551, 35861. Bilder unter `/uploads/` oder direkt verlinkbar
- Donic: `donic.com/fileadmin/` oder über die Produktseite mit "Produktbild herunterladen"-Link
- Joola: `joola.com/de` oder `joola.de`
- Stiga: `stigasports.com/de` (oft große Hero-Bilder verfügbar)
- Tibhar: `tibhar.com` oder `tibhar.de`

```
[Hier System-Instruktionen oben einfügen]

Liste der Produkte:

butterfly-joo-se-hyuk | Joo Se Hyuk | Butterfly | Holz
butterfly-timo-boll-zlf | Butterfly Timo Boll ZLF | Butterfly | Holz
butterfly-zhang-jike-alc | Butterfly Zhang Jike ALC | Butterfly | Holz
donic-coppa-jo-silver | Donic Coppa JO Silver | Donic | Belag-invertiert
donic-quattro-a1 | Quattro A1 | Donic | Belag-SP
donic-ovtcharov-carbospeed | Donic Ovtcharov Carbospeed | Donic | Holz
joola-rhyzm | JOOLA Rhyzm | Joola | Belag-invertiert
joola-rhyzm-tech | JOOLA Rhyzm Tech | Joola | Belag-invertiert
joola-rhyzm-p | JOOLA Rhyzm-P | Joola | Belag-invertiert
joola-orca | Orca | Joola | Belag-Anti
joola-k5 | JOOLA K5 | Joola | Holz
stiga-calibra-lt | Stiga Calibra LT | Stiga | Belag-invertiert
stiga-calibra-lt-sound | Stiga Calibra LT Sound | Stiga | Belag-invertiert
stiga-mantra-h | Stiga Mantra H | Stiga | Belag-invertiert
stiga-mantra-m | Stiga Mantra M | Stiga | Belag-invertiert
stiga-mantra-s | Stiga Mantra S | Stiga | Belag-invertiert
stiga-defensive-wrb | Defensive WRB | Stiga | Holz
tibhar-phantom-guang | Phantom Guang | Tibhar | Belag-Anti
```

---

## 📦 BATCH 3 — Mid-Brands + Rest (10 Produkte)

**Site-Hinweise:**
- Andro: `andro.de` oder `andro-tt.com`
- Yasaka: `yasakatabletennis.com` oder `yasaka.se`
- Nittaku: `nittaku.com` (japanisch, oft internationaler Fastarc-Bereich)
- Xiom: `xiom.com` oder `xiom.eu`

```
[Hier System-Instruktionen oben einfügen]

Liste der Produkte:

andro-rasant | Andro Rasant | Andro | Belag-invertiert
andro-rasant-powergrip | Andro Rasant PowerGrip | Andro | Belag-invertiert
andro-super-core-cell-off | Andro Super Core Cell OFF | Andro | Holz
yasaka-rakza-7 | Yasaka Rakza 7 | Yasaka | Belag-invertiert
yasaka-rakza-x | Yasaka Rakza X | Yasaka | Belag-invertiert
yasaka-sweden-extra | Yasaka Sweden Extra | Yasaka | Holz
nittaku-fastarc-c-1 | Nittaku Fastarc C-1 | Nittaku | Belag-invertiert
xiom-stradivarius | Xiom Stradivarius | Xiom | Holz
```

---

## ✅ Übersicht

| Batch | Anzahl | Schwerpunkt |
|-------|--------|-------------|
| 1 | 15 | Dr. Neubauer + SpinLord + Asien-Mini-Marken |
| 2 | 18 | Butterfly + Donic + Joola + Stiga + Tibhar |
| 3 | 8 | Andro + Yasaka + Nittaku + Xiom |
| **Gesamt** | **41** | |

**Reihenfolge:** Egal — kannst alle drei parallel laufen lassen wenn du Pro-Account hast.

**Wenn fertig:** speichere als `1.docx`, `2.docx`, `3.docx` in einem **neuen Ordner** `C:\Users\Gabrecht\Desktop\Data-Bilder` (nicht in den alten Data-Ordner!) und sag Bescheid. Ich baue einen separaten Importer der die URLs durch Auto-Download (gleiches Skript wie eben) jagt — das prüft auch automatisch ob die URL wirklich funktioniert.
