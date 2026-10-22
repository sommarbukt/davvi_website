// Davvi Slider – Hero Startseite (HOME) (reine Daten, CMS-tauglich).
// Bilder und Startpunkte: Design-Lieferung „Hero Sliders“ (Andreas, Tabelle „Bilder und Startpunkte“ vom 19.10.2026),
// exportiert nach img/hero/home/ (WebP, max. 1400 px hoch). Startpunkt = Ausgangsecke des Schwenks.
// Feintuning: slider-lab.html öffnen, „Konfiguration exportieren“ und die heruntergeladene
// Datei hier 1:1 ersetzen (Dateiname slider-config.js beibehalten). Bildpfade relativ zur HTML-Seite.
// Hinweis: height/margin wirken nur im Lab-Standalone-Modus; auf der Website bestimmt das Figma-Layout
// (css/davvi.css) Höhe und Rand des Heros.
window.DAVVI_CONFIG = {
  "devMode": false,
  "settings": {
    "autoZoom": false,
    "fadeEasing": "ease-in",
    "introEasing": "easeOutCubic",
    "zoomEasing": "linear",
    "panEasing": "linear",
    "phoneBreakpoint": 599,
    "tabletBreakpoint": 899,
    "startZoom": 3,
    "middleZoom": 1.5,
    "endZoom": 1,
    "transition": 3,
    "panThreshold": 20,
    "desktop": { "height": 76, "margin": 24, "duration": 14 },
    "tablet":  { "height": 72, "margin": 18, "duration": 14 },
    "phone":   { "height": 72, "margin": 12, "duration": 14 }
  },
  "slides": [
    { "desktop": "img/hero/home/01-3376.webp",                              "tablet": "", "phone": "", "horizontal": "right", "vertical": "top",    "panning": true },
    { "desktop": "img/hero/home/02-107.webp",                               "tablet": "", "phone": "", "horizontal": "left",  "vertical": "top",    "panning": true },
    { "desktop": "img/hero/home/03-l1000310.webp",                          "tablet": "", "phone": "", "horizontal": "right", "vertical": "bottom", "panning": true },
    { "desktop": "img/hero/home/04-3526.webp",                              "tablet": "", "phone": "", "horizontal": "left",  "vertical": "bottom", "panning": true },
    { "desktop": "img/hero/home/05-l1000113.webp",                          "tablet": "", "phone": "", "horizontal": "left",  "vertical": "top",    "panning": true },
    { "desktop": "img/hero/home/06-img-2026-05-09-3415.webp",               "tablet": "", "phone": "", "horizontal": "right", "vertical": "bottom", "panning": true }
  ]
};
