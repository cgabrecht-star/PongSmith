"""
Generiert eine PDF mit 20 vollständig ausgefüllten Marken-Recherche-Prompts.
Ausgabe: pongsmith-marken-prompts.pdf im Projekt-Root.
"""
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib.colors import HexColor, black, white
from reportlab.lib.enums import TA_LEFT
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, PageBreak, Preformatted,
    Table, TableStyle,
)

PRIMARY = HexColor("#ff6b35")  # PongSmith Orange
INK = HexColor("#0e0e0e")
GRAY = HexColor("#666666")
LIGHT = HexColor("#f5f5f5")

# ─── Master-Prompt-Template ────────────────────────────────────────────────
MASTER_TEMPLATE = """ROLLE
Du bist Recherche-Agent für die Tischtennis-Marke {marke}.
Deine Aufgabe: vollständige, aktuelle Liste aller in Deutschland
verfügbaren Hölzer UND Beläge dieser Marke als sauberes JSON.

QUELLEN (in dieser Reihenfolge)
1. {hersteller_url} (offizielle Webseite, idealerweise DE-Version)
2. https://www.tt-shop.de — Markenseite + Sortimentssuche
3. https://www.tischtennis.biz — Sortimentssuche
4. https://www.contra-sport.de — Sortimentssuche
5. https://revspin.net — für Community-Ratings (Speed/Spin/Control)
6. https://www.tabletennisdaily.com — Equipment-Forenposts als Sanity-Check

MARKEN-SPEZIFISCHER HINWEIS
{skalen_hinweis}

WAS DU LIEFERN MUSST

Ein einzelnes JSON-Array. Das erste Element ist ein Meta-Header,
dann folgen die Produkte. Beispiel:

[
  {{
    "_meta": {{
      "marke": "{marke}",
      "anzahl": 42,
      "scraped_at": "2026-05-16T19:30:00Z",
      "primary_source": "{hersteller_url}",
      "notes": "freie Notiz zu Besonderheiten der Marke"
    }}
  }},
  {{
    "type": "blade",
    "brand": "{marke}",
    "name": "Andro Treiber CO Allround",
    "category": "ALL+",
    "blade": {{
      "speedRaw": 7,
      "controlRaw": 8,
      "speedScale": 10,
      "composition": "5+2 Carbon",
      "layers": 5,
      "weightAvgGrams": 86,
      "stiffness": "medium",
      "carbonPosition": "outer | inner | none",
      "specialMaterial": "ALC | ZLC | Aramid | Hinoki | Balsa | null"
    }},
    "rubber": null,
    "uvpEur": 80,
    "imageUrl": "https://...jpg",
    "descriptionDe": "max 300 Zeichen, sachlich, keine Marketing-Floskeln",
    "isCurrentlyAvailable": true,
    "availableAt": ["tt-shop.de", "tischtennis.biz"],
    "sources": ["https://www.andro.de/...", "https://www.tt-shop.de/..."],
    "confidence": "high | medium | low",
    "issues": null
  }},
  {{
    "type": "rubber",
    "brand": "{marke}",
    "name": "Andro Rasanter R48",
    "category": "OFF",
    "blade": null,
    "rubber": {{
      "speedRaw": 9.4,
      "spinRaw": 9.5,
      "controlRaw": 8.3,
      "speedScale": 10,
      "rubberType": "smooth | long_pips | short_pips | anti",
      "hardnessMin": 48,
      "hardnessMax": 48,
      "topsheetCharacter": "grippy | sticky | hybrid | neutral",
      "spongeColor": "rot | blau | orange | null",
      "isHybrid": false
    }},
    "uvpEur": 55,
    "imageUrl": "https://...jpg",
    "descriptionDe": "...",
    "isCurrentlyAvailable": true,
    "availableAt": ["tt-shop.de", "tischtennis.biz", "contra-sport.de"],
    "sources": ["..."],
    "confidence": "high",
    "issues": null
  }}
]

KATEGORIEN-DEFINITION (verbindlich)
- Hölzer: "DEF" | "ALL-" | "ALL" | "ALL+" | "OFF-" | "OFF" | "OFF+"
- Beläge: derselbe Stil-Code wenn vorhanden, sonst nach Tempo:
  speed < 7 = "DEF/ALL-", speed 7-8 = "ALL", speed 8-9 = "OFF-/OFF",
  speed > 9 = "OFF/OFF+", Material-Beläge: "MAT"

TOPSHEET-KLASSIFIKATION FÜR BELÄGE (wichtig!)
- "grippy" = europäisch-tensioniert (Tenergy, Rakza, Hexer, Acuda, Rasanter)
- "sticky" = klebrig klassisch chinesisch ohne Tensor (Hurricane Neo,
  Skyline 3, Big Dipper klassisch, Ka Long)
- "hybrid" = chinesisches/asiatisches Topsheet + europäischer
  Tensor-Schwamm (Trend 2022+: Tibhar K3, DHS Hurricane Provincial/National
  mit Blue/Orange Sponge, JOOLA Dynaryz CMD, Friendship 729 Cross/Battle)
- "neutral" = weder klebrig noch ausgeprägt griffig

STIFFNESS-KLASSIFIKATION FÜR HÖLZER
- "soft" = vergebend, weich im Treffmoment (Stiga Allround Classic Niveau)
- "medium" = ausgewogen (Standard für die meisten 5+0 Hölzer)
- "stiff" = direkt (typisch für ALC-Carbon-Hölzer, Butterfly Viscaria)
- "very_stiff" = sehr direkt (ZLC, hartes Hinoki)

WICHTIGE REGELN

1. Nur Produkte aufnehmen die in MINDESTENS EINEM von tt-shop.de,
   tischtennis.biz oder contra-sport.de aktuell gelistet UND als
   verfügbar markiert sind. Wenn überall ausverkauft oder gar nicht
   gelistet: nicht aufnehmen ODER isCurrentlyAvailable: false +
   confidence: "low".

2. Bei fehlenden numerischen Werten: NULL. NIE raten. Lieber 30 saubere
   Einträge als 60 halbgeratene.

3. Bei unklarer Klassifikation: confidence: "low" + Kommentar im
   issues-Feld. Beispiele:
   - "Topsheet-Klassifikation unsicher, sieht nach hybrid aus aber
     Hersteller nennt es sticky"
   - "Härteangabe variiert zwischen Hersteller (47°) und revspin (45°)"

4. KEINE Marketing-Floskeln in descriptionDe ("Game-Changer",
   "revolutionär", "perfekt": raus). Stattdessen sachlich:
   "spinorientiertes Topsheet auf 47° Tensor-Schwamm".

5. Pro Eintrag MINDESTENS 1 Quell-URL (sources-Array). Idealerweise 2-3.

6. Bei Nische- oder Sonder-Produkten (sehr exotisch, kaum verfügbar):
   eintragen aber confidence: "low" und im issues-Feld "Nische,
   Verfügbarkeit unsicher".

7. Discontinued Produkte (Hersteller hat Produktion eingestellt):
   eintragen mit isCurrentlyAvailable: false + issues:
   "discontinued laut Hersteller-Webseite".

WAS DU NICHT TUN DARFST

- Keine Empfehlungen abgeben oder bewerten ("gut für Anfänger" raus)
- Keine Annahmen über Spielstil-Passung
- Nicht über die Marke {marke} hinaus recherchieren
- Nicht erfinden, was du nicht findest
- Keine Antworten mit Markdown, nur reines JSON

OUTPUT

Ein einzelnes valides JSON-Array. Kein Text davor, kein Text danach,
keine Code-Block-Fences. Beginnt mit [ endet mit ].

PRÜFE VOR DER ABGABE:
- Sind alle Produkte aktuell in mind. 1 DE-Shop?
- Sind alle Hersteller-Skalen korrekt vermerkt (speedScale-Feld)?
- Hat jeder Eintrag mindestens 1 Quell-URL?
- Ist topsheetCharacter korrekt klassifiziert (besonders hybrid!)
- Sind alle Preise in EUR (nicht USD, GBP)?
- Ist das JSON valide?

Wenn du fertig bist: gib das JSON aus, sonst nichts.
"""

# ─── 20 Marken-Variablen ───────────────────────────────────────────────────
BRANDS = [
    {
        "nr": 1, "tier": "Tier 1 - Premium",
        "marke": "Butterfly",
        "hersteller_url": "https://www.butterfly-shop.de",
        "skalen_hinweis": "Butterfly Skala 1-13 (sowohl Hölzer als auch Beläge). Speed > 11 = Pro-Niveau, 8-10 = ambitioniert, < 8 = Allround. Besonderheit: Tenergy/Dignics-Linien sind alle tensioniert europäisch (grippy).",
    },
    {
        "nr": 2, "tier": "Tier 1 - Premium",
        "marke": "Stiga",
        "hersteller_url": "https://stigasports.com/de",
        "skalen_hinweis": "Stiga Skala 0-100 (Hölzer) und 0-110 (Beläge, DNA-Linie). NCT = New Carbon Technology, CR = Crystal Resin Coating. DNA Hybrid M/XH = hybrid.",
    },
    {
        "nr": 3, "tier": "Tier 1 - Premium",
        "marke": "Donic",
        "hersteller_url": "https://www.donic.com/de",
        "skalen_hinweis": "Donic Skala 1-12 für Hölzer, 1-110 für Beläge. Senso = Vibrationsdämpfung. Bluefire/Acuda = Hauptlinien für Beläge.",
    },
    {
        "nr": 4, "tier": "Tier 1 - Premium",
        "marke": "Tibhar",
        "hersteller_url": "https://www.tibhar.de",
        "skalen_hinweis": "Tibhar Skala 1-10. Aurus/Evolution/Genius = Belag-Linien. Hybrid MK = Hybrid-Linie. Stratus = Holz-Klassiker. K3 = wichtiger Hybrid.",
    },
    {
        "nr": 5, "tier": "Tier 1 - Premium",
        "marke": "Andro",
        "hersteller_url": "https://www.andro.de",
        "skalen_hinweis": "Andro Skala 1-10 (vereinfacht). Linien: Hexer (Powergrip/Pips+/Duro), Rasanter (R37-R53), Roxon, Treiber (CO/CI/FI/FO), Wanokiwami.",
    },
    {
        "nr": 6, "tier": "Tier 1 - Premium",
        "marke": "Nittaku",
        "hersteller_url": "https://www.nittaku.de",
        "skalen_hinweis": "Nittaku Skala 1-15 (japanisch). Acoustic = japanisches Kult-Holz. Fastarc-Serie = Tensor-Beläge. Hurricane Pro 3 = chinesisches Lizenz-Produkt.",
    },
    {
        "nr": 7, "tier": "Tier 1 - Premium",
        "marke": "Yasaka",
        "hersteller_url": "https://yasaka.de",
        "skalen_hinweis": "Yasaka Skala 0-10 (Hölzer), 0-100 (Beläge). Mark V = Klassiker seit Jahrzehnten. Rakza = moderne Tensor-Linie. Rakza Z Extra Hard = Tackiness/Hybrid.",
    },
    {
        "nr": 8, "tier": "Tier 1 - Premium",
        "marke": "JOOLA",
        "hersteller_url": "https://www.joola.de",
        "skalen_hinweis": "JOOLA Skala 1-10 (Hölzer), 1-100 (Beläge). Rhyzer/Dynaryz/Maxxx = Hauptbelag-Linien. Dynaryz CMD = Hybrid.",
    },
    {
        "nr": 9, "tier": "Tier 1 - Premium",
        "marke": "Victas",
        "hersteller_url": "https://www.victas-shop.de",
        "skalen_hinweis": "Victas Skala variabel. Nachfolger der TSP-Marke (japanischer Konzern, viele alte TSP-Modelle wurden als Victas weitergeführt).",
    },
    {
        "nr": 10, "tier": "Tier 1 - Premium",
        "marke": "Xiom",
        "hersteller_url": "https://www.xiom.com",
        "skalen_hinweis": "Xiom Skala 1-10. Vega-Linie = Mainstream-Beläge. Omega = Pro-Belag-Linie. Stradivarius/Hayabusa = wichtige Hölzer.",
    },
    {
        "nr": 11, "tier": "Tier 2 - China-Marken",
        "marke": "DHS",
        "hersteller_url": "https://dhs-shop.de",
        "skalen_hinweis": "DHS Skala 1-100. Hurricane 3 mit verschiedenen Sponges: Commercial / Provincial / National (Blue/Orange Sponge): bei Provincial/National Blue/Orange Sponge ist es ein HYBRID (chin. Topsheet + Tensor-Schwamm). Klassisches Hurricane 3 ohne Sponge-Suffix = sticky.",
    },
    {
        "nr": 12, "tier": "Tier 2 - China-Marken",
        "marke": "Sanwei",
        "hersteller_url": "https://sanwei-shop.com",
        "skalen_hinweis": "Sanwei Skala variabel, oft 1-100. Target = chinesische Belag-Hauptlinie. Target National = Hybrid. FEXTRA 7 = wichtigstes Holz.",
    },
    {
        "nr": 13, "tier": "Tier 2 - China-Marken",
        "marke": "Yinhe",
        "hersteller_url": "https://yinhe-galaxy.de",
        "skalen_hinweis": "Yinhe = Galaxy (gleiche Marke, doppelte Bezeichnung). Big Dipper = sticky-Linie, Big Dipper Pro / Pro 13 = Hybrid. Moon/Sun/Mars = günstige Tensor-Beläge.",
    },
    {
        "nr": 14, "tier": "Tier 2 - China-Marken",
        "marke": "Friendship",
        "hersteller_url": "https://729-tt-shop.de",
        "skalen_hinweis": "Marke 'Friendship 729' oder einfach '729'. Klassische Linien: 729-2, 729 FX, 729 Higher. Hybrid-Linien: Cross, Battle II/III (mit verschiedenen Sponges).",
    },
    {
        "nr": 15, "tier": "Tier 3 - Material-Spezialisten",
        "marke": "SpinLord",
        "hersteller_url": "https://www.spinlord-shop.de",
        "skalen_hinweis": "SpinLord = deutscher Material-Spezialist. FOKUS: Long Pips (Marder, Keiler, Strahlkraft, Waran, Sandwind), Short Pips, Anti. Wenig smooth.",
    },
    {
        "nr": 16, "tier": "Tier 3 - Material-Spezialisten",
        "marke": "Sauer & Troger",
        "hersteller_url": "https://www.sauer-troger.com",
        "skalen_hinweis": "Deutscher Material-Spezialist, ähnlich SpinLord. FOKUS: Long Pips (Hass, Schmerz, Easy P, Special), Anti (Secret), Defensive-Setups.",
    },
    {
        "nr": 17, "tier": "Tier 3 - Material-Spezialisten",
        "marke": "Dr. Neubauer",
        "hersteller_url": "https://www.drneubauer.com",
        "skalen_hinweis": "Deutscher Material-Spezialist. FOKUS: Long Pips (Killer, Death, Phantom), Anti (Aggressor), Spezial-Hölzer für Material-Spieler.",
    },
    {
        "nr": 18, "tier": "Tier 3 - Material-Spezialisten",
        "marke": "Hallmark",
        "hersteller_url": "https://www.hallmark-tt.de",
        "skalen_hinweis": "Englische Marke, in DE über Spezialhändler. FOKUS: Long Pips (Frustration, Power Tact), Anti.",
    },
    {
        "nr": 19, "tier": "Tier 4 - Vertriebsmarken",
        "marke": "TSP",
        "hersteller_url": "https://www.victas-shop.de",
        "skalen_hinweis": "TSP existiert teilweise nicht mehr eigenständig. Viele Modelle wurden als Victas weitergeführt oder discontinued. Markiere alte TSP-Modelle die NUR noch unter Victas erhältlich sind klar mit issues: 'ehemals TSP, jetzt unter Victas'.",
    },
    {
        "nr": 20, "tier": "Tier 4 - Vertriebsmarken",
        "marke": "Gewo",
        "hersteller_url": "https://www.gewo-shop.de",
        "skalen_hinweis": "Bayerische Vertriebsmarke (auch Komplettsetups, Tische). Hauptlinien: CS (Carbon Speed), Nexxus, Hype.",
    },
]


def build_pdf(out_path: str):
    doc = SimpleDocTemplate(
        out_path,
        pagesize=A4,
        leftMargin=1.5*cm, rightMargin=1.5*cm,
        topMargin=1.5*cm, bottomMargin=1.5*cm,
        title="PongSmith - Marken-Recherche-Prompts",
        author="PongSmith",
    )

    styles = getSampleStyleSheet()

    # Custom Styles
    cover_title = ParagraphStyle(
        "CoverTitle", parent=styles["Title"],
        fontSize=28, leading=34, textColor=PRIMARY,
        spaceAfter=12, alignment=TA_LEFT,
    )
    cover_subtitle = ParagraphStyle(
        "CoverSubtitle", parent=styles["Normal"],
        fontSize=14, leading=18, textColor=INK,
        spaceAfter=18,
    )
    intro_h = ParagraphStyle(
        "IntroH", parent=styles["Heading2"],
        fontSize=14, leading=18, textColor=INK, spaceAfter=8, spaceBefore=14,
    )
    body = ParagraphStyle(
        "Body", parent=styles["Normal"],
        fontSize=10.5, leading=15, textColor=INK, spaceAfter=8,
    )
    section_label = ParagraphStyle(
        "SectionLabel", parent=styles["Normal"],
        fontSize=9, leading=12, textColor=GRAY, spaceAfter=2,
    )
    brand_h = ParagraphStyle(
        "BrandH", parent=styles["Heading1"],
        fontSize=22, leading=26, textColor=PRIMARY, spaceAfter=4,
    )
    brand_sub = ParagraphStyle(
        "BrandSub", parent=styles["Normal"],
        fontSize=10, leading=14, textColor=GRAY, spaceAfter=12,
    )
    prompt_style = ParagraphStyle(
        "Prompt", parent=styles["Code"],
        fontSize=7.5, leading=10, textColor=INK,
        fontName="Courier", spaceAfter=6, leftIndent=0,
    )

    story = []

    # ─── Cover ────────────────────────────────────────────────────────────
    story.append(Paragraph("PongSmith", cover_title))
    story.append(Paragraph("Marken-Recherche-Prompts für 20 TT-Hersteller", cover_subtitle))
    story.append(Spacer(1, 12))

    story.append(Paragraph("So nutzt du diese PDF", intro_h))
    story.append(Paragraph(
        "Diese PDF enthält 20 vollständig ausgefüllte Recherche-Prompts. "
        "Pro Marke einen kompletten Prompt, fertig zum copy-paste an einen Claude-Agenten. "
        "Du schickst pro Marke einen Agenten los, sammelst die JSON-Outputs ein und "
        "speicherst sie in <font name='Courier' size='10'>C:\\dev\\pongsmith\\data\\scraped\\&lt;marke&gt;.json</font>. "
        "Wenn alle 20 da sind, importiere ich sie ins System.",
        body,
    ))

    story.append(Paragraph("Vorgehen", intro_h))
    story.append(Paragraph(
        "1. Geh zur Marke deiner Wahl in dieser PDF.<br/>"
        "2. Markiere den kompletten Prompt-Block (alles zwischen den Trennlinien).<br/>"
        "3. Copy &amp; paste in einen neuen Claude-Chat oder Browser-Agent.<br/>"
        "4. Warte auf den JSON-Output.<br/>"
        "5. Speicher als <font name='Courier' size='10'>marke.json</font> in <font name='Courier' size='10'>data/scraped/</font>.<br/>"
        "6. Nächste Marke.",
        body,
    ))

    story.append(Paragraph("Empfohlene Reihenfolge", intro_h))

    tier_data = [
        ["Runde", "Marken", "Hinweis"],
        ["1 (Tier-1 Top-5)", "Butterfly, Stiga, Donic, Tibhar, Andro", "größter Hebel im Berater"],
        ["2 (Tier-1 Rest)", "Nittaku, Yasaka, JOOLA, Victas, Xiom", "ergänzt Tier-1"],
        ["3 (China)", "DHS, Sanwei, Yinhe, Friendship 729", "Hybrid-Beläge sind hier"],
        ["4 (Material)", "SpinLord, Sauer & Troger, Dr. Neubauer, Hallmark", "kleine Webseiten, eher schwer"],
        ["5 (Vertrieb)", "TSP, Gewo", "Restposten"],
    ]
    tbl = Table(tier_data, colWidths=[3.2*cm, 8.5*cm, 6.0*cm])
    tbl.setStyle(TableStyle([
        ("BACKGROUND", (0,0), (-1,0), PRIMARY),
        ("TEXTCOLOR", (0,0), (-1,0), white),
        ("FONTNAME", (0,0), (-1,0), "Helvetica-Bold"),
        ("FONTSIZE", (0,0), (-1,-1), 9),
        ("VALIGN", (0,0), (-1,-1), "MIDDLE"),
        ("PADDING", (0,0), (-1,-1), 6),
        ("BACKGROUND", (0,1), (-1,-1), LIGHT),
        ("GRID", (0,0), (-1,-1), 0.5, GRAY),
    ]))
    story.append(tbl)
    story.append(Spacer(1, 18))

    story.append(Paragraph("Output-Ablage", intro_h))
    story.append(Paragraph(
        "Speicher jede Agent-Antwort als JSON-Datei. Lege im Repo den Ordner "
        "<font name='Courier' size='10'>data/scraped/</font> an. Pro Marke eine Datei, "
        "z.B. <font name='Courier' size='10'>butterfly.json</font>, "
        "<font name='Courier' size='10'>andro.json</font>. Wenn alle 20 vorliegen, "
        "läuft das Import-Skript das die Daten in die DB überträgt.",
        body,
    ))

    story.append(PageBreak())

    # ─── Pro Marke eine Seite mit vollständigem Prompt ────────────────────
    for b in BRANDS:
        # Header
        story.append(Paragraph(f"#{b['nr']:02d} &nbsp;&nbsp; {b['marke']}", brand_h))
        story.append(Paragraph(f"{b['tier']} &nbsp;|&nbsp; {b['hersteller_url']}", brand_sub))

        story.append(Paragraph("PROMPT - copy alles ab hier:", section_label))

        # Trennlinie
        line = Table([[""]], colWidths=[18*cm], rowHeights=[1])
        line.setStyle(TableStyle([("LINEABOVE", (0,0), (-1,-1), 1, PRIMARY)]))
        story.append(line)
        story.append(Spacer(1, 6))

        # Voll ausgefüllter Prompt
        prompt_text = MASTER_TEMPLATE.format(
            marke=b["marke"],
            hersteller_url=b["hersteller_url"],
            skalen_hinweis=b["skalen_hinweis"],
        )
        # Preformatted respektiert Zeilenumbrüche und Whitespace
        story.append(Preformatted(prompt_text, prompt_style))

        # Untere Trennlinie + footer
        story.append(Spacer(1, 4))
        story.append(line)
        story.append(Paragraph(
            f"Ende Prompt für {b['marke']} - speichern als data/scraped/{b['marke'].lower().replace(' ', '-').replace('&', 'and').replace('.', '')}.json",
            section_label,
        ))

        story.append(PageBreak())

    doc.build(story)
    print(f"PDF erstellt: {out_path}")


if __name__ == "__main__":
    import os
    repo_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    out = os.path.join(repo_root, "pongsmith-marken-prompts.pdf")
    build_pdf(out)
