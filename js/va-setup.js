/* DAVVI – Vercel Web Analytics: Warteschlange + Schalter für eigene Besuche (Stand 04.11.2026)
   Muss VOR /_vercel/insights/script.js laufen (ohne defer), damit schon der erste Seitenaufruf gefiltert wird.
   Eigene Besuche nicht mitzählen: einmal https://www.davvi-ridge.com/?stats-off aufrufen
     → Merker "va-disable" im localStorage dieses Browsers; Seitenaufrufe und Events werden nicht mehr gesendet.
   Wieder mitzählen (z. B. zum Testen mit ?va-debug): ?stats-on aufrufen.
   Gilt je Browser und Gerät; privates Fenster / gelöschte Websitedaten = zählt wieder.
   Bei normalen Besuchern wird nichts im Browser gespeichert. */
window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };
(function () {
  try {
    var q = location.search;
    if (/[?&]stats-off\b/.test(q)) localStorage.setItem('va-disable', '1');
    if (/[?&]stats-on\b/.test(q)) localStorage.removeItem('va-disable');
    if (localStorage.getItem('va-disable') && window.console) console.info('[va] stats-off: dieser Browser wird nicht gezählt');
  } catch (e) {}
  window.va('beforeSend', function (event) {
    try { if (localStorage.getItem('va-disable')) return null; } catch (e) {}
    return event;
  });
})();
