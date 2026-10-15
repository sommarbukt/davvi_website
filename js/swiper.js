/* DAVVI – Swiper (Figma „Swiper komplett TAB/PHN“)
   Ein Swiper besteht aus einer horizontal scrollenden Spur [data-swiper-track] (id) und einer Steuerung
   .swiper-ctl[data-swiper-ctl="<id>"]: Pfeil links, Positionsbalken, Pfeil rechts.
   Gescrollt wird nativ (Wischen, Trackpad, Tastatur); die Pfeile springen um ein Element weiter.
   Ob die Spur scrollt, entscheidet allein das CSS (PC: kein Swiper, Steuerung ausgeblendet). */
(function () {
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  [].forEach.call(document.querySelectorAll('.swiper-ctl[data-swiper-ctl]'), function (ctl) {
    var track = document.getElementById(ctl.getAttribute('data-swiper-ctl'));
    if (!track) return;
    var thumb = ctl.querySelector('.swiper-ctl__thumb');
    var ticking = false;

    function items() {
      return [].filter.call(track.querySelectorAll('[data-swiper-item], .tbs'), function (el) { return el.offsetParent !== null; });
    }

    function update() {
      ticking = false;
      var max = track.scrollWidth - track.clientWidth;
      var scrolls = max > 1;
      // Spur nur dann per Tastatur erreichbar machen, wenn sie wirklich scrollt
      if (scrolls) track.setAttribute('tabindex', '0'); else track.removeAttribute('tabindex');
      if (!thumb) return;
      var vis = scrolls ? track.clientWidth / track.scrollWidth : 1;
      var pos = scrolls ? Math.min(1, Math.max(0, track.scrollLeft / max)) : 0;
      thumb.style.width = (vis * 100) + '%';
      thumb.style.left = 'calc(' + pos + ' * (100% - ' + thumb.offsetWidth + 'px))';
    }
    function request() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }

    function go(dir) {
      var list = items();
      if (!list.length) return;
      var trackLeft = track.getBoundingClientRect().left;
      var pad = parseFloat(getComputedStyle(track).scrollPaddingLeft) || 0;
      var target = null;
      // nächstes bzw. vorheriges Element, dessen linke Kante jenseits der aktuellen Position liegt
      for (var i = 0; i < list.length; i++) {
        var x = list[i].getBoundingClientRect().left - trackLeft - pad;
        if (dir > 0 && x > 2) { target = x; break; }
        if (dir < 0 && x < -2) target = x;
      }
      if (target === null) target = dir > 0 ? track.scrollWidth : -track.scrollWidth;
      // bei zentrierter Ausrichtung (PHN-Kombipanels) um eine Elementbreite springen
      if (getComputedStyle(list[0]).scrollSnapAlign.indexOf('center') > -1) {
        target = dir * (list[0].getBoundingClientRect().width + (parseFloat(getComputedStyle(track).columnGap) || 0));
      }
      track.scrollBy({ left: target, behavior: reduce ? 'auto' : 'smooth' });
    }

    [].forEach.call(ctl.querySelectorAll('[data-dir]'), function (b) {
      b.addEventListener('click', function () { go(+b.getAttribute('data-dir')); });
    });
    track.addEventListener('scroll', request, { passive: true });
    window.addEventListener('resize', request);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(request);
    window.addEventListener('load', request);
    update();
  });
})();
