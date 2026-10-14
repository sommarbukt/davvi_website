# Davvi Slider

## Installation

1. ZIP entpacken und den gesamten Inhalt inklusive `demo-bilder/` in das gewünschte Webverzeichnis hochladen.
2. `index.html` im Browser aufrufen. Zum lokalen Testen kann die Datei direkt geöffnet werden.
3. Für eine bestehende HTML-Seite den Slider-Bereich und die zugehörigen Bedienelemente aus `index.html` übernehmen sowie CSS und Skripte in der angegebenen Reihenfolge einbinden. Die Einbindung ist für einen Slider pro Seite ausgelegt.

Es werden kein CMS, keine Datenbank, kein PHP und keine Installation von Node.js benötigt. JavaScript muss im Browser aktiviert sein. Alle mitgelieferten JS- und CSS-Dateien gehören zum Betrieb, auch wenn der Dev-Mode deaktiviert ist.

## Konfiguration

Alle Einstellungen stehen in **`slider-config.js`**. Dezimalzahlen mit Punkt schreiben, z. B. `1.5`.

- `devMode: false`: normaler Betrieb ohne Einstellungsbereich; das ist der Auslieferungszustand.
- `devMode: true`: Einstellungsbereich und Diagnoseanzeige aktivieren.

### Globale Werte (`settings`)

| Einstellung                        | Bedeutung                                                             | Standard        |
| ---------------------------------- | --------------------------------------------------------------------- | --------------- |
| phoneBreakpoint / tabletBreakpoint | Viewportbreite bis einschließlich Phone / Tablet, in px               | 767 / 1024      |
| startZoom / middleZoom / endZoom   | Zoom zu Beginn, nach der Einblendung und am Bildende                  | 3 / 1.5 / 1     |
| transition                         | Dauer der Überblendung in Sekunden                                    | 3               |
| panThreshold                       | Mindestüberstand für den Schwenk, in %                                | 20              |
| autoZoom                           | Automatisch weicher Zoomanschluss; überschreibt die beiden Zoomkurven | false           |
| fadeEasing                         | Kurve der Einblendung                                                 | ease-in         |
| introEasing                        | Kurve des Übergangszooms                                              | easeOutCubic    |
| zoomEasing / panEasing             | Kurven des anschließenden Zooms / Schwenks                            | linear / linear |

Pro `desktop`, `tablet` und `phone` gibt es `height` (Höhe in % des Viewports), `margin` (Außenabstand in px) und `duration` (gesamte Bilddauer in Sekunden). Standards: Desktop **76 / 24 / 14**, Tablet **72 / 18 / 14**, Phone **72 / 12 / 14**.

Zoomwerte müssen `Start ≥ Übergang ≥ Ende ≥ 1` erfüllen. Die Bilddauer muss mindestens 0.5 Sekunden länger als die Überblendung sein. Einstellungen außerhalb der zulässigen Bereiche werden mit einer Meldung abgewiesen.

Kurven können über die Auswahlliste im Dev-Mode oder als `cubic-bezier(x1, y1, x2, y2)` eingetragen werden. Alle vier Bezier-Werte müssen zwischen 0 und 1 liegen.

### Bilder (`slides`)

Die Reihenfolge der Einträge bestimmt die Bildfolge. Jeder Eintrag enthält:

- `desktop`: erforderlicher Bildpfad.
- `tablet` und `phone`: optionale Bildvarianten; `''` verwendet das Desktopbild.
- `horizontal`: Startpunkt `'left'` oder `'right'`.
- `vertical`: Startpunkt `'top'` oder `'bottom'`.
- `panning`: Schwenken mit `true` aktivieren oder mit `false` deaktivieren.

Bildpfade beziehen sich auf die HTML-Seite. Eigene Bilder hochladen und die Pfade entsprechend anpassen. Unterstützt werden 1–100 Einträge.

### Einstellungen exportieren

Im Dev-Mode Werte anpassen und **Konfiguration exportieren** wählen. Der Download enthält auch noch nicht angewendete Eingaben. Über die Checkbox lässt sich der Dev-Mode der exportierten Datei festlegen.

Die heruntergeladene `slider-config.js` anschließend manuell auf dem Server ersetzen. Der Export schreibt nichts auf den Server und enthält keine Bilddateien. **Zurücksetzen** lädt die Werte der Konfigurationsdatei. Lokale Browserwerte werden nur bei aktivem Dev-Mode und unveränderter Ausgangskonfiguration verwendet.

## Betrieb

- Bei 14 Sekunden Bilddauer und 3 Sekunden Überblendung beginnt alle 11 Sekunden ein neues Bild. Beide Bilder bewegen sich während des Übergangs weiter.
- Die Sequenz wiederholt sich. Hintergrundtabs und die Pausetaste halten die Animation an.
- Bei aktivierter Systemeinstellung „Bewegung reduzieren“ startet der Slider als Standbild; Abspielen ermöglicht Bildwechsel ohne Zoom und Schwenk.
- Fehlerhafte Mobilbilder fallen auf Desktop zurück. Fehlerhafte Desktopbilder oder Bilder mit mehr als 20 Sekunden Ladezeit werden aus der laufenden Folge entfernt; die verbleibende Folge startet neu. Sind keine Bilder verfügbar, erscheint eine Meldung. Nach Korrektur der Bildpfade die Seite neu laden.
- Falls nach einem Dateiaustausch alte Inhalte erscheinen: Browsercache aktualisieren beziehungsweise den `?v=...`-Wert des betroffenen Dateiverweises in `index.html` erhöhen.
- Dev-Mode ist kein Passwortschutz. Ein Zugriffsschutz muss auf dem Hosting separat eingerichtet werden. Keine Zugangsdaten in der Konfigurationsdatei speichern.
