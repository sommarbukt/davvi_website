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
- **Hero-Slider (Startseite):** Engine aus der Lieferung des Designs (`vendor/davvi-slider-1.0.0/`, unverändert –
  bei Updates einfach den Ordner ersetzen), Daten in `js/slider-config.js` (reines JSON, CMS-tauglich),
  Anbindung an das Figma-Layout in `js/hero.js` (Höhe/Rand aus `css/davvi.css`, Figma-Fortschrittsbalken,
  Pause-Taste bei Tastaturfokus, Stillstand außerhalb des Viewports, Fallback-Bild ohne JS).
  Bilder: `img/hero/` (derzeit Demo-Bilder, Kandidaten liefert das Design).
- **Chalets-Seite (`chalets.html`):** Unterseite SUB 3 „My private Panorama“ nach den Figma-Frames SUB 3 – PC XL/L/M,
  TAB und PHN (Stand 15.10.2026). Auf TAB/PHN laufen Kombipanels und Faktenblock als Swiper (`js/swiper.js`,
  Pfeile in `img/icons/`). Buchungswidget und „Book a stay“ sind Platzhalter wie im Figma, Lodgify ist nicht eingebunden.
  Inhalte der Kombipanels (3× Skaret, gleiches Bild) und Grundrisse (nur Tind) sind Figma-Platzhalter.
- **Unterseiten SUB 1, SUB 2, SUB 4 (Stand 19.10.2026)** nach den Figma-Frames PC XL/L/M, TAB, PHN:
  - `vibrant-arctic.html` (SUB 1 „Vibrant Arctic“): Collage auf Ice-Grey-Band, Textbox-Reihe als Swiper (auch auf PC),
    Block Link Chalets, Panel unten wie Chalets-Seite, Section ABOUT + CONTACT.
  - `the-place.html` (SUB 2 „A distinct Place“): Bildstreifen, Gletscher-Reihe, Tiere, Ridge-Karte, Block Link Chalets 2.
    Die Karte (`img/ridge-map-*.webp`) ist ein 1×-Render aus Figma – Originalgrafik (SVG/PNG mit Transparenz) fehlt noch.
  - `experiences.html` (SUB 4 „365 Days“): Faktenblock, Kombipanels Activities (Hero XL, Zweierreihe, Swiper),
    Block Chalets + Booking (Lodgify-Platzhalter). Im Figma sind nur die PC-Zustände fertig; TAB/PHN sind abgeleitet.
  - Gemeinsame neue Komponenten am Ende von `css/davvi.css` (`.vlf`, `.band--*`, `.hrow`/`.tbox`, `.blc`, `.contact`, `.act`, `.bcb` …).
    Hero-Headline je Seite über `--sh-left` (inline am Hero).
  - Platzhalter wie im Figma: Blindtexte (SUB 1 Textbox-Reihe, SUB 2 Textbox unter der Karte), alle Aktivitäten-Panels
    (Orca, „Whale watching“). `img/cloudberry-740.webp` ist nur ein Figma-Render (Original fehlt im Bildpool).
- Menü: alle vier Punkte verlinken jetzt auf die Unterseiten (auch auf der Startseite), „See more“-Buttons ebenso.
- **Slider Lab:** `slider-lab.html` öffnen → Dev-Mode des Sliders im selben Bildrahmen wie auf der Startseite.
  „Konfiguration exportieren“ → heruntergeladene `slider-config.js` nach `js/` kopieren. Original-Lieferung
  (inkl. Demo-JPGs und Readme): `../00_Doku/Lieferungen/slider-minimal-1.0.0/`.
