// Davvi Slider – Konfiguration des Startseiten-Heros (reine Daten, CMS-tauglich).
// Werte stammen aus der Lieferung „slider-minimal 1.0.0“ (Andreas, 14.10.2026); Breakpoints an das Figma angepasst
// (PHN bis 599 px, TAB bis 899 px). Feintuning: slider-lab.html öffnen, „Konfiguration exportieren“ und
// die heruntergeladene slider-config.js hier 1:1 ersetzen. Bildpfade relativ zur HTML-Seite.
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
    { "desktop": "img/hero/dji_20260915113044_0146_d.webp", "tablet": "", "phone": "", "horizontal": "left",  "vertical": "top",    "panning": true },
    { "desktop": "img/hero/l1000068.webp",                  "tablet": "", "phone": "", "horizontal": "right", "vertical": "bottom", "panning": true },
    { "desktop": "img/hero/l1000113.webp",                  "tablet": "", "phone": "", "horizontal": "left",  "vertical": "top",    "panning": true },
    { "desktop": "img/hero/l1000205.webp",                  "tablet": "", "phone": "", "horizontal": "right", "vertical": "bottom", "panning": true },
    { "desktop": "img/hero/l1000310.webp",                  "tablet": "", "phone": "", "horizontal": "left",  "vertical": "top",    "panning": true },
    { "desktop": "img/hero/l1000368.webp",                  "tablet": "", "phone": "", "horizontal": "right", "vertical": "bottom", "panning": true }
  ]
};
