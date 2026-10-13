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
