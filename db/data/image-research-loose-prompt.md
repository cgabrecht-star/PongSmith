# Bilder-Recherche — Lockere Variante (Final-Run für 33 Lücken)

**Anleitung:** Diesen einen Prompt komplett in einen Perplexity- / ChatGPT-Agenten kopieren. Output als JSON-Array. Speichere die Antwort als `1.docx` in `C:\Users\Gabrecht\Desktop\Data-Bilder` (Ordner anlegen falls nicht da). Dann sag mir Bescheid.

---

```
Du bist ein Tischtennis-Produktbild-Researcher. Für jedes der unten aufgelisteten Produkte sollst du eine DIREKTE BILD-URL finden, unter der das offizielle Produktbild öffentlich abrufbar ist.

ZIEL: Eine URL die direkt auf eine Bilddatei (.jpg / .png / .webp) zeigt — am besten mindestens 300x300 Pixel.

ERLAUBTE QUELLEN — alles ist OK solange das Bild öffentlich zugänglich ist:
- Offizielle Hersteller-CDN
- Hersteller-eigene Social-Media (Facebook/Instagram CDN-Bilder)
- Tabletennisdb.com, Tabletennis-reference.com, Megaspin.net, Tabletennis11.com (auch als Quelle OK weil offizielle Hersteller-Bilder lizenziert)
- TT-news.de, Forum-Galerien
- Wikipedia / Wikimedia Commons
- Andere TT-Distributor-Sites die offizielle Hersteller-Bilder nutzen

VERMEIDEN (aber nicht streng verboten):
- Amazon-Bilder (m.media-amazon.com) — versuche Alternative zuerst
- Konkurrenz-Shop wenn deutscher offizieller Hersteller-Link verfügbar wäre

Du MUSST nicht die URL vorab validieren — wir prüfen das beim Download. Lieber eine plausible URL geben als null.

KRITISCHE FORMATIERUNGSREGELN — sonst zerbricht der Importer:
- Output ist EIN einziges valides JSON-Array
- KEINE Perplexity-Zitations-Marker im JSON ([1], megaspin+2, etc.)
- NUR gerade ASCII-Anführungszeichen "
- Antwort beginnt direkt mit [ und endet mit ]
- KEIN Markdown-Code-Block

Pro Produkt liefere genau dieses Format:

{
  "slug": "<exakter Slug>",
  "imageUrl": "<vollständige absolute Bild-URL — direkter Pfad zu .jpg/.png/.webp>",
  "imageSource": "<Domain — z.B. butterfly-global.com>"
}

Wenn nach gründlicher Suche wirklich nichts findbar ist:
{
  "slug": "<slug>",
  "imageUrl": null,
  "imageSource": null
}

Strategie pro Produkt:
1. Hersteller-Site direkt nach Produktbild-Datei suchen
2. Falls nicht: Bildersuche (Google Images / Bing) nach Produktname → die direkten Bild-URLs auf Hersteller-CDN oder Distributor-CDN nehmen
3. Falls nicht: Distributor wie Megaspin oder Tabletennisdb suchen — die haben oft offizielle Bilder direkt verlinkbar
4. Falls auch nicht: Forum-Gallery-Posts oder Reviews mit Bildern

Liste der Produkte (33 gesamt):

andro-rasant | Andro Rasant | Andro | Belag-invertiert
andro-rasant-powergrip | Andro Rasant PowerGrip | Andro | Belag-invertiert
andro-super-core-cell-off | Andro Super Core Cell OFF | Andro | Holz
butterfly-joo-se-hyuk | Joo Se Hyuk | Butterfly | Holz
butterfly-timo-boll-zlf | Butterfly Timo Boll ZLF | Butterfly | Holz
butterfly-zhang-jike-alc | Butterfly Zhang Jike ALC | Butterfly | Holz
dawei-388d-1 | 388D-1 | Dawei | Belag-LP
donic-coppa-jo-silver | Donic Coppa JO Silver | Donic | Belag-invertiert
donic-ovtcharov-carbospeed | Donic Ovtcharov Carbospeed | Donic | Holz
donic-quattro-a1 | Quattro A1 | Donic | Belag-SP
dr-neubauer-aggressivo | Aggressivo | Dr. Neubauer | Belag-Anti
dr-neubauer-golem | Golem | Dr. Neubauer | Belag-SP
dr-neubauer-super-block | Super Block | Dr. Neubauer | Belag-Anti
dr-neubauer-tactical | Tactical | Dr. Neubauer | Holz
joola-k5 | JOOLA K5 | Joola | Holz
joola-orca | Orca | Joola | Belag-Anti
joola-rhyzm | JOOLA Rhyzm | Joola | Belag-invertiert
joola-rhyzm-p | JOOLA Rhyzm-P | Joola | Belag-invertiert
joola-rhyzm-tech | JOOLA Rhyzm Tech | Joola | Belag-invertiert
juic-999-elite | 999 Elite | Juic | Belag-LP
nittaku-fastarc-c-1 | Nittaku Fastarc C-1 | Nittaku | Belag-invertiert
spinlord-dornenglanz-ii | Dornenglanz II | SpinLord | Belag-LP
spinlord-marder | Marder | SpinLord | Belag-LP
spinlord-waran | Waran | SpinLord | Belag-SP
stiga-calibra-lt | Stiga Calibra LT | Stiga | Belag-invertiert
stiga-calibra-lt-sound | Stiga Calibra LT Sound | Stiga | Belag-invertiert
stiga-defensive-wrb | Defensive WRB | Stiga | Holz
stiga-mantra-h | Stiga Mantra H | Stiga | Belag-invertiert
stiga-mantra-m | Stiga Mantra M | Stiga | Belag-invertiert
stiga-mantra-s | Stiga Mantra S | Stiga | Belag-invertiert
tibhar-phantom-guang | Phantom Guang | Tibhar | Belag-Anti
xiom-stradivarius | Xiom Stradivarius | Xiom | Holz
yinhe-galaxy-955 | Galaxy 955 | Yinhe | Belag-LP

Beginne die Recherche jetzt und gib am Ende ein vollständiges JSON-Array zurück.
```

---

**Wenn die DOCX zurück ist:** speichere als `1.docx` in `C:\Users\Gabrecht\Desktop\Data-Bilder` und sag Bescheid. Ich baue einen kleinen Importer der die URLs durch den Auto-Downloader jagt — der validiert pro URL ob ein echtes Bild kommt und filtert tote/falsche URLs raus.
