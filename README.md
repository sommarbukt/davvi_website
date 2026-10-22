# DAVVI – Website

Statische Website für DAVVI (vier Chalets in Sjursnes am Ullsfjord). Kein Build-Schritt:
HTML, CSS und JS werden direkt ausgeliefert (Vercel, Framework „Other“, ohne Build-Command).

- Design-Quelle: Figma „26-8039-DVV-IN26 – R-00 DEV“
- Design-Tokens (Figma-Variablen, Modi PC/TAB/PHN): `css/tokens.css`
- Layout und Komponenten: `css/davvi.css`
- Menü-Verhalten: `js/davvi.js`
- Schriften: Adobe Fonts, Kit `gcq7kct` (Domain muss im Kit freigegeben sein)
- Motion (Scroll-Stacking, Header-Feder, Hero-Headline, Bildzonen-Stretch, Ken Burns):
  `js/motion.config.js` (nur Daten, CMS-tauglich) + `js/motion.js` (Logik) + `css/motion.css`
- **Motion Lab:** Seite mit `?lab` aufrufen (z. B. `index.html?lab`) → alle Kurven und Werte live einstellen,
  Zeitlupe, Vergleich mit klassischem Ease-in-out, „Config kopieren“ liefert den Block für `motion.config.js`.
  Federn werden aus `response`/`bounce` physikalisch berechnet und als CSS `linear()` ausgegeben, ohne Bibliothek.
  Bei „Bewegung reduzieren“ (Systemeinstellung) bleibt die Seite statisch.
- **Hero-Slider (alle Seiten, Stand 22.10.2026):** Engine aus der Lieferung des Designs (`vendor/davvi-slider-1.0.0/`, unverändert –
  bei Updates einfach den Ordner ersetzen), Daten je Seite als reines JSON (CMS-tauglich): `js/slider-config.js` (Startseite),
  `js/slider-config-vibrant-arctic.js`, `-the-place.js`, `-chalets.js`, `-experiences.js`. Anbindung an das Figma-Layout in `js/hero.js`
  (Höhe/Rand aus `css/davvi.css`, Figma-Fortschrittsbalken, Pause-Taste bei Tastaturfokus, Stillstand außerhalb des Viewports,
  Fallback-Bild ohne JS). Bilder und Startpunkte: Design-Lieferung „Hero Sliders“ (Andreas, Tabelle vom 19.10.2026),
  exportiert nach `img/hero/<seite>/` (WebP, max. 1400 px hoch).
- **Chalets-Seite (`chalets.html`):** Unterseite SUB 3 „My private Panorama“ nach den Figma-Frames SUB 3 – PC XL/L/M,
  TAB und PHN (Stand 15.10.2026). Auf TAB/PHN laufen Kombipanels und Faktenblock als Swiper (`js/swiper.js`,
  Pfeile in `img/icons/`). Buchungswidget und „Book a stay“ sind Platzhalter wie im Figma, Lodgify ist nicht eingebunden.
  Inhalte der Kombipanels (3× Skaret, gleiches Bild) sind Figma-Platzhalter – Hausfotos aus dem Sommarbukt-Pool fehlen noch.
  Grundrisse Tind seit 22.10.2026 aus den transparenten Originalen; Kontakt-Section unten (neu im Figma).
- **Unterseiten SUB 1, SUB 2, SUB 4 (Stand 19.10.2026)** nach den Figma-Frames PC XL/L/M, TAB, PHN:
  - `vibrant-arctic.html` (SUB 1 „Vibrant Arctic“): Collage auf Ice-Grey-Band, Textbox-Reihe als Swiper (auch auf PC),
    Block Link Chalets, Panel unten wie Chalets-Seite, Section ABOUT + CONTACT.
  - `the-place.html` (SUB 2 „A distinct Place“): Bildstreifen, Gletscher-Reihe, Tiere, Ridge-Karte, Block Link Chalets 2.
    Die Karte (`img/ridge-map-*.webp`) ist seit 22.10.2026 aus den Originalgrafiken gebaut (PC 2×, PHN aus der Fassung „schmal“).
  - `experiences.html` (SUB 4 „365 Days“): Faktenblock, Kombipanels Activities (Hero XL, Zweierreihe, Swiper),
    Block Chalets + Booking (Lodgify-Platzhalter). Im Figma sind nur die PC-Zustände fertig; TAB/PHN sind abgeleitet.
  - Gemeinsame neue Komponenten am Ende von `css/davvi.css` (`.vlf`, `.band--*`, `.hrow`/`.tbox`, `.blc`, `.contact`, `.act`, `.bcb` …).
    Hero-Headline je Seite über `--sh-left` (inline am Hero).
  - `img/cloudberry-740.webp` ist nur ein Figma-Render (Original fehlt im Bildpool).
- Menü: alle vier Punkte verlinken jetzt auf die Unterseiten (auch auf der Startseite), „See more“-Buttons ebenso.
- **Slider Lab:** `slider-lab.html` öffnen → Dev-Mode des Sliders im selben Bildrahmen wie auf der Startseite.
  „Konfiguration exportieren“ → heruntergeladene `slider-config.js` nach `js/` kopieren. Original-Lieferung
  (inkl. Demo-JPGs und Readme): `../00_Doku/Lieferungen/slider-minimal-1.0.0/`.

### Update 22.10.2026 (Lieferung Andreas: Hero Sliders, Aktivitäten, Texte R01-03)
- Texte nach `../00_Doku/26-8039 DAVVI Website - Texte - R01 - 03.xlsx` (nur EN übernommen): Startseite Welcome-Infos + neue
  Kontakt-Section, SUB 1 elf „Good to know“-Blöcke, SUB 2 Text unter der Karte, SUB 3 Kontakt-Section, SUB 4 Aktivitäten.
- SUB 4: 15 Aktivitäten (AKT 01–03 oben, 04–15 im Swiper), Bilder `img/act/` aus dem Ordner „Aktivitäten“ des Bildpools.
  TAB/PHN nach dem inzwischen fertigen Figma: Fakten PC 5+4 / TAB 3+3+3 / PHN Swiper, Activities PHN alle 3:2,
  Block Chalets + Booking TAB 800 px / PHN 600 px fest (Nachtrag am Ende von `css/davvi.css`).
- Slider Lab: `slider-lab.html?page=<seite>` lädt die Config der Unterseite.
