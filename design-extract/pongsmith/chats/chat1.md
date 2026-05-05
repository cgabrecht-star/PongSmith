# Forge Hero Design

_Started 2026-05-03 12:00 UTC_

---

## User



## Assistant

I'll build this as an interactive prototype. Let me first ask a few targeted questions before diving in, since the brief is detailed but a few things would help me commit to the right direction.

_[tool: questions_v2]_

## User

Questions answered:
- scope: Decide for me
- display_font: Decide for me
- ui_font: Decide for me
- spark_intensity: Markant — sichtbares Schmiede-Motiv im Hero, Glut-Glühen unter CTAs
- synergy_viz: 2
- tweaks: Decide for me
- language: multilingual wählbar
- chat_demo: Decide for me
- shops: unwichtig erstmal

## Assistant

I'll build the full prototype with all 5 screens. Going with: Bebas Neue display + Inter UI, markant smithy aesthetic with glow, ring-progress synergy score, generic shops, German default with EN/DE toggle.

_[tool: update_todos]_

_[tool: copy_starter_component]_

_[tool: read_file]_

Good, I have the panel. Now let me build the prototype. I'll structure it as: main HTML + components.jsx + screens for each section.

_[tool: write_file]_

Now the shared library — icons, hooks, i18n, data:

_[tool: write_file]_

_[tool: snip]_

_[tool: write_file]_

_[tool: snip]_

_[tool: write_file]_

_[tool: write_file]_

_[tool: snip]_

_[tool: write_file]_

_[tool: write_file]_

_[tool: snip]_

_[tool: write_file]_

_[tool: snip]_

_[tool: done]_

_[tool: snip]_

_[tool: fork_verifier_agent]_

PongSmith ist gebaut — alle 5 Screens (Landing, Chat, Empfehlung, Setup-Detail, Ratgeber) als durchklickbarer Prototyp mit Schmiede-Anmutung: Anthrazit-Basis, Glut-Akzente unter CTAs, animierter Hammer im Hero, aufsteigende Funken, ringförmiger Synergie-Score, Speed/Spin/Control-Balken.

**Tweaks** (rechts unten): Sprache DE/EN, Glut-Intensität, Akzent-Farbe, Display-Font (Bebas Neue / Oswald / Archivo Black / Space Grotesk), Direkt-Sprung zu jedem Screen.

**Navigation:** Top-Bar (Desktop) und Bottom-Tabs (Mobile). Chat hat einen automatisch ablaufenden Beispieldialog plus echte Eingabe mit simulierter KI-Antwort.

