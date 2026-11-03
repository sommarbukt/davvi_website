/* DAVVI – Vercel Web Analytics: eigene Events (Stand 03.11.2026)
   Seitenaufrufe zählt Vercel automatisch (Script /_vercel/insights/script.js, eingebunden am Ende jeder Seite).
   Hier nur die Klicks, die zur Buchung führen:
     „Book a stay“  – Buttons mit data-track-chalet="<haus>" (Chalets-Seite)   → { chalet, page }
     „Search“       – Search-Button der Lodgify-Suchleiste bzw. Ersatzlink      → { page, dates }
   Pro-Plan: max. 2 Eigenschaften je Event, Werte max. 255 Zeichen, keine personenbezogenen Daten senden.
   Test: Seite mit ?va-debug öffnen (oder lokal) → jedes Event erscheint in der Browser-Konsole. */
(function () {
  'use strict';

  var debug = /[?&]va-debug\b/.test(location.search) ||
    location.hostname === 'localhost' || location.hostname === '127.0.0.1';

  // Seitenname ohne .html, Startseite = "home"
  function pageName() {
    var p = location.pathname.replace(/\/index(\.html)?$/, '/').replace(/\.html$/, '').replace(/\/+$/, '');
    return p ? p.slice(p.lastIndexOf('/') + 1) : 'home';
  }

  function send(name, data) {
    if (typeof window.va !== 'function') return;
    window.va('event', { name: name, data: data });
    if (debug && window.console) console.info('[va] event', name, data);
  }

  // Hat der Gast in der Lodgify-Suchleiste Daten gewählt? (nur ja/nein, keine Daten selbst)
  function datesChosen(bar) {
    var fields = bar ? bar.querySelectorAll('[data-testid$="-date-button"] .date') : [];
    for (var i = 0; i < fields.length; i++) {
      if (fields[i].textContent.trim()) return 'yes';
    }
    return 'no';
  }

  // Capture-Phase: greift auch, wenn Lodgify das Klick-Event selbst abfängt
  document.addEventListener('click', function (e) {
    var t = e.target;
    if (!t || !t.closest) return;

    var book = t.closest('[data-track-chalet]');
    if (book) {
      send('Book a stay', { chalet: book.getAttribute('data-track-chalet'), page: pageName() });
      return;
    }

    var search = t.closest('#lodgify-search-bar a[data-testid="button"]');
    if (search) {
      send('Search', { page: pageName(), dates: datesChosen(search.closest('#lodgify-search-bar')) });
      return;
    }

    if (t.closest('.booking__fallback')) {
      send('Search', { page: pageName(), dates: 'fallback' });
    }
  }, true);
})();
