// Davvi Slider – Hero SUB 1 „Vibrant Arctic“ (reine Daten, CMS-tauglich).
// Bilder und Startpunkte: Design-Lieferung „Hero Sliders“ (Andreas, Tabelle „Bilder und Startpunkte“ vom 19.10.2026),
// exportiert nach img/hero/vibrant-arctic/ (WebP, max. 1400 px hoch). Startpunkt = Ausgangsecke des Schwenks.
// Feintuning: slider-lab.html?page=vibrant-arctic öffnen, „Konfiguration exportieren“ und die heruntergeladene
// Datei hier 1:1 ersetzen (Dateiname slider-config-vibrant-arctic.js beibehalten). Bildpfade relativ zur HTML-Seite.
// Hinweis: height/margin wirken nur im Lab-Standalone-Modus; auf der Website bestimmt das Figma-Layout
// (css/davvi.css) Höhe und Rand des Heros.
window.DAVVI_CONFIG = {
  "devMode": false,
  "settings": {
    "autoZoom": false,
    "fadeEasing": "ease-in",
    "introEasing": "easeOutCubic",
    "zoomEasing": "easeInSine",
    "panEasing": "easeInSine",
    "phoneBreakpoint": 599,
    "tabletBreakpoint": 899,
    "startZoom": 2.5,
    "middleZoom": 1.5,
    "endZoom": 1,
    "transition": 3,
    "panThreshold": 10,
    "desktop": { "height": 76, "margin": 24, "duration": 14 },
    "tablet":  { "height": 72, "margin": 18, "duration": 14 },
    "phone":   { "height": 72, "margin": 12, "duration": 14 }
  },
  "slides": [
    { "desktop": "img/hero/vibrant-arctic/01-dji_20260915110634_0065_d-pano.webp", "tablet": "", "phone": "", "horizontal": "right", "vertical": "bottom", "panning": true },
    { "desktop": "img/hero/vibrant-arctic/02-l1000072.webp",                "tablet": "", "phone": "", "horizontal": "right", "vertical": "top",    "panning": true },
    { "desktop": "img/hero/vibrant-arctic/03-img_0064.webp",                "tablet": "", "phone": "", "horizontal": "left",  "vertical": "bottom", "panning": true },
    { "desktop": "img/hero/vibrant-arctic/04-l1000130.webp",                "tablet": "", "phone": "", "horizontal": "left",  "vertical": "top",    "panning": true },
    { "desktop": "img/hero/vibrant-arctic/05-l1000368.webp",                "tablet": "", "phone": "", "horizontal": "left",  "vertical": "bottom", "panning": true }
  ]
};
