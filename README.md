# DAVVI – Website

Statische Website für DAVVI (vier Chalets in Sjursnes am Ullsfjord). Kein Build-Schritt:
HTML, CSS und JS werden direkt ausgeliefert (Vercel, Framework „Other“, ohne Build-Command).

- **Lokal starten:** im Ordner `website` ein Terminal öffnen (Explorer → Adresszeile `cmd` eintippen) und
  `python -m http.server 8000` ausführen, dann im Browser http://localhost:8000 öffnen. Alternative ohne Python: `npx serve`.
  Nicht per Doppelklick auf die HTML-Datei öffnen (file://), sonst laden Slider-Configs und Lodgify nicht sauber.
  Beenden mit Strg+C.
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
  Pfeile in `img/icons/`). Buchungswidget = Lodgify-Suchleiste (siehe unten).
  Inhalte der Kombipanels (3× Skaret, gleiches Bild) sind Figma-Platzhalter – Hausfotos aus dem Sommarbukt-Pool fehlen noch.
  Grundrisse Tind seit 22.10.2026 aus den transparenten Originalen; Kontakt-Section unten (neu im Figma).
- **Unterseiten SUB 1, SUB 2, SUB 4 (Stand 19.10.2026)** nach den Figma-Frames PC XL/L/M, TAB, PHN:
  - `vibrant-arctic.html` (SUB 1 „Vibrant Arctic“): Collage auf Ice-Grey-Band, Textbox-Reihe als Swiper (auch auf PC),
    Block Link Chalets, Panel unten wie Chalets-Seite, Section ABOUT + CONTACT.
  - `the-place.html` (SUB 2 „A distinct Place“): Bildstreifen, Gletscher-Reihe, Tiere, Ridge-Karte, Block Link Chalets 2.
    Die Karte (`img/ridge-map-*.webp`) ist seit 22.10.2026 aus den Originalgrafiken gebaut (PC 2×, PHN aus der Fassung „schmal“).
  - `experiences.html` (SUB 4 „365 Days“): Faktenblock, Kombipanels Activities (Hero XL, Zweierreihe, Swiper),
    Block Chalets + Booking (Lodgify-Suchleiste). Im Figma sind nur die PC-Zustände fertig; TAB/PHN sind abgeleitet.
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

### Lodgify-Suchleiste (22.10.2026)
- Das „Booking-Widget 01“ aus dem Figma ist jetzt die Lodgify „Portable Search Bar“ des DAVVI-Accounts (Website-ID 682380):
  Startseite, Chalets (nur PC, wie im Figma) und 365 Days (über dem Nordlicht-Bild). Suche öffnet
  `https://davvi-ridge.com/en/choose-your-chalet` in neuem Tab.
- Markup (`#lodgify-search-bar` mit allen `data-…`-Texten) in der `.booking__pill`, Script
  `app.lodgify.com/portable-search-bar/stable/renderPortableSearchBar.js` am Seitenende.
- Look in `css/lodgify.css` (nur Tokens aus `tokens.css`): weiße Pille 100 px, Felder mit Caps-Label + Wert, Trennlinien,
  Gäste-Zähler mit runden ± , „Search“ als schwarze BTN-STD-Pille; Kalender eckig, Monatsnamen in Tussilago,
  Zeitraum schwarz/Ice-Grey. TAB kompakter, PHN als zweizeilige Karte (Daten oben, Gäste + Search unten), Kalender einspaltig.
- Lodgify-Klassen (`css-xxxx`) ändern sich bei Updates → angesprochen wird nur über IDs, `data-testid` und `role`.
  Texte „Guests“/„Add date“ kommen aus CSS-Variablen (`--psb-txt-…`), für DE dort überschreiben.
- Ohne JS oder wenn Lodgify nicht lädt, ist die Pille ein Link „Check availability“ zur Lodgify-Suchseite.

### Update 23.10.2026 (Mail Andreas „SUB 3 Chalets“, Prio A)
- Chalet-Kacheln: Tind, Nordlys, Bjørka, Skaret mit Fakten aus Lodgify (davvi-ridge.com/en/chalets), „Book a stay“ → jeweilige
  Lodgify-Hausseite (neuer Tab). Kachel 5 und 6 als „Coming soon“ (`.kombi--soon`, ohne Button). Fotos weiter Platzhalter, Auswahl kommt von Andreas.
- Chalet-Swiper TAB: Kachel = 6 Rasterspalten, elastisch (`calc((100% - gutter) / 2)`), Anschnitt rechts = links. PHN unverändert (zentriert, symmetrisch).
- Booking-Widget (Lodgify) auf der Chalets-Seite jetzt auch in TAB und PHN, Abstand oben = Section oben.
- Footer auf allen Seiten englisch: „Imprint“ → `imprint.html`, „Privacy“ → `privacy.html`. Beide Seiten sind ENTWÜRFE auf Basis von
  davvi-ridge.com/en/imprint bzw. /en/privacy-policy, ergänzt um Vercel, Adobe Fonts und Lodgify-Suchleiste – juristisch prüfen (`<!-- Prüfen -->`-Kommentare).
- Prio B: Lodgify-Suchleiste – Werte in den Feldern („Add date“, Datum, Gästezahl) in der schmalen Caps-Schrift (`css/lodgify.css`).
- Prio C: Grundrisse öffnen per Klick/Tipp groß im Overlay (`js/plans.js`, `<dialog>`): Pfeile, Pfeiltasten, Wischen; Schließen mit X, Esc oder Klick daneben.

### Update 23.10.2026 (Mail Andreas „Additional Services“, SUB 4, Prio A)
- Faktenblock „Additional services“: zwei Gruppen wie im Figma (Gruppe 1 = 5 Kacheln, Gruppe 2 = 4). PC: eine Zeile, wenn alle neun passen,
  sonst 5+4 – nie mehr 8+1 oder 6+3. TAB 3+3+3 und PHN-Swiper unverändert (Gruppen dort `display: contents`).
- Headline „Additional services“ im PC eine Spalte nach rechts: Spalte 2–7 (`.band--2to7`).

### Bilder für das Lodgify-Buchungsportal (23.10.2026)
- `img/booking/start-dsc00956-*.webp` = Hintergrund von davvi-ridge.com/en/choose-your-chalet, `img/booking/inquiry-dji-0146-*.webp` = für eine
  spätere Seite „Individual Inquiry“. Werden vom Lodgify-Custom-CSS (`../04_Lodgify_Bloecke/00_custom_css_head.css`) per absoluter URL geladen – nicht umbenennen.

### Domains (23.10.2026)
- Homepage (dieses Repo, Vercel): **davvi-ridge.com** (+ www). DNS bei United Domains: A `@` und A `www` → 216.198.79.1 (Vercel). MX/autodiscover (Microsoft 365) unverändert.
- Buchungsportal (Lodgify): **davvi.de** – alle Buchungslinks, Suchleiste und Hausseiten zeigen auf `https://davvi.de/en/…`.
