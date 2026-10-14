/* DAVVI – Motion-Config
   Nur Daten, keine Logik: Der Inhalt von DAVVI_MOTION ist reines JSON und kann 1:1 aus einem CMS kommen.
   Die Logik steckt in motion.js. Werte werden direkt hier gepflegt.

   Federn (springs): physikalisch gerechnet, nicht als Bézierkurve angenähert.
     response  Grundtempo der Feder in Sekunden (Periode der ungedämpften Schwingung). Kleiner = schneller.
     bounce    0 = kritisch gedämpft: kein Überschwingen, aber ein weiches, langes Ausklingen.
               < 0 = noch weicher/träger.  > 0 = Überschwingen (Bouncing) – laut Vorgabe nicht verwenden.
   Die tatsächliche Laufzeit ergibt sich aus der Feder (Ausschwingzeit) und wird automatisch berechnet.

   Transparenz und Bewegung haben getrennte Kurven (fade vs. springs).

   Einheiten: Zeiten in s, rise in px, headline.distance in vw, amount/pan in %, triggerAt = Auslöselinie
   in % der Viewporthöhe von oben (82 = Effekt startet, wenn das Element 82 % tief im Bild ankommt).
   phoneTrigger: im PHN löst statt der ganzen Gruppe dieses Element aus (Textbox unter dem Bild).
   Hero-Headline: im PHN-Zustand bewusst ohne Einflug (Vorgabe Design).
   Ken Burns: startPoints = Schwenk-Startpunkt je Bild (x/y von -1 bis 1, reihum vergeben);
   ein einzelnes Bild kann per data-kb="x y" überschrieben werden. */
window.DAVVI_MOTION = {
  "springs": {
    "sections": { "response": 0.75, "bounce": 0 },
    "header":   { "response": 0.6,  "bounce": 0 },
    "headline": { "response": 1.1,  "bounce": 0 },
    "stretch":  { "response": 1.2,  "bounce": 0 }
  },
  "fade": { "duration": 0.7, "easing": "cubic-bezier(0.22, 1, 0.36, 1)" },

  "header": {
    "hideDuration": 0.32,
    "hideEasing": "cubic-bezier(0.4, 0, 1, 1)"
  },

  "headline": {
    "enabled": true,
    "distance": 14,
    "delay": 0.25,
    "stagger": 0.14
  },

  "stacking": {
    "enabled": true,
    "rise": 44,
    "stagger": 0.09,
    "triggerAt": 82,
    "groups": [
      { "name": "Map",    "target": ".map",          "items": ["img", "p"] },
      { "name": "Panels", "target": ".panel",        "items": [".line:first-child", ".tb__hl", ".tb__txt", ".btn", ".line:last-child"], "delay": 0.18, "phoneTrigger": ".tb" },
      { "name": "Facts",  "target": ".facts",        "items": [".fact"] },
      { "name": "Footer", "target": ".footer__main", "items": [".footer__logo", ".footer__links .btn"], "delay": 0.1 }
    ]
  },

  "stretch": {
    "enabled": true,
    "target": ".panel",
    "amount": 15,
    "triggerAt": 85
  },

  "kenBurns": {
    "enabled": false,
    "target": ".panel__img",
    "zoom": 1.07,
    "pan": 2,
    "duration": 16,
    "easing": "cubic-bezier(0.25, 0.6, 0.3, 1)",
    "startPoints": [[-1, 0.5], [1, -0.5], [0, 1], [-1, -0.5]]
  }
};
