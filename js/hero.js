/* DAVVI – Hero-Slider der Startseite (Anbindung)
   Engine:  vendor/davvi-slider-1.0.0/slider.js (Lieferung Design, bewusst unverändert – Updates einfach ersetzen)
   Daten:   js/slider-config.js (reine Daten, CMS-tauglich; Feintuning über slider-lab.html)
   Diese Datei passt die Engine an die Website an:
   - Höhe und Rand des Heros kommen aus dem Figma-Layout (css/davvi.css), nicht aus height/margin der Config.
   - Der Figma-Fortschrittsbalken (.hero__progress) zeigt den Fortschritt der Bildfolge.
   - Pause-Taste (erscheint bei Tastaturfokus), Stillstand außerhalb des Viewports.
   - Ohne JavaScript oder bei fehlerhafter Config bleibt das statische Hero-Bild (<noscript>) stehen. */
(function () {
  'use strict';
  var hero = document.querySelector('.hero[data-slider]');
  if (!hero) return;

  function fallback(error) {
    if (error && window.console) console.warn('DAVVI Hero-Slider: ' + error.message);
    var poster = hero.querySelector('noscript');
    if (poster && !hero.querySelector('.hero__img')) poster.insertAdjacentHTML('afterend', poster.textContent);
    var bottom = hero.querySelector('.hero-bottom');
    if (bottom) bottom.hidden = true;
  }

  if (!window.DavviSlider || !window.DAVVI_CONFIG) return fallback(new Error('Engine oder Config fehlt.'));

  class HeroSlider extends window.DavviSlider {
    layout() {
      super.layout();               // wählt PHN/TAB/PC und rechnet die Zeit beim Wechsel um
      this.root.style.margin = '';  // Größe bestimmt das Figma-Layout
      this.root.style.height = '';
    }
    tick(now) {
      if (this.offscreen) {         // außerhalb des Viewports nichts rechnen, beim Zurückkommen weiterlaufen
        this.last = null;
        this.frame = requestAnimationFrame((t) => this.tick(t));
        return;
      }
      super.tick(now);
    }
  }

  var bar = hero.querySelector('.hero__progress');
  var pause = hero.querySelector('.hero__pause');
  var slider;
  try {
    var config = window.DavviConfig.validate(window.DAVVI_CONFIG);
    slider = new HeroSlider(hero, config.settings, config.slides, function (state) {
      if (bar) bar.style.setProperty('--hero-p', state.progress.toFixed(4));
      if (pause && pause.dataset.state !== String(state.paused)) {
        pause.dataset.state = String(state.paused);
        pause.textContent = state.paused ? 'Play' : 'Pause';
        pause.setAttribute('aria-label', state.paused ? 'Play slideshow' : 'Pause slideshow');
      }
    });
  } catch (error) {
    return fallback(error);
  }

  if (pause) pause.addEventListener('click', function () { slider.toggle(); });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      slider.offscreen = !entries[entries.length - 1].isIntersecting;
    }).observe(hero);
  }
  window.davviHero = slider;
})();
