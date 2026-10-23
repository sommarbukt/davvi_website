/* DAVVI – Grundrisse: vergrößerte Ansicht im Overlay (Andreas 23.10.2026, Prio C)
   Klick/Tipp auf einen Grundriss öffnet ihn groß. Wechsel mit den Pfeilen, den Pfeiltasten oder per Wischen.
   Schließen mit X, Esc oder Klick neben das Bild. Das Overlay ist ein <dialog> (Fokus bleibt darin, Esc nativ). */
(function () {
  var figs = [].slice.call(document.querySelectorAll('.plans .plan'));
  if (!figs.length || typeof HTMLDialogElement !== 'function') return;

  var items = figs.map(function (f) {
    var img = f.querySelector('img'), cap = f.querySelector('figcaption');
    return { src: img.currentSrc || img.src, alt: img.alt, cap: cap ? cap.innerHTML : '' };
  });

  var dlg = document.createElement('dialog');
  dlg.className = 'lightbox';
  dlg.setAttribute('aria-label', 'Floor plans');
  dlg.innerHTML =
    '<div class="lightbox__stage">' +
      '<figure class="lightbox__fig"><img class="lightbox__img" alt=""><figcaption class="lightbox__cap"></figcaption></figure>' +
    '</div>' +
    '<div class="lightbox__ctl swiper-ctl__in">' +
      '<button class="swiper-ctl__btn" type="button" data-dir="-1" aria-label="Previous floor plan"><img src="img/icons/arrow-l.svg" alt="" width="19" height="23"><img class="is-hover" src="img/icons/arrow-l-hover.svg" alt="" width="19" height="23"></button>' +
      '<span class="lightbox__count" aria-live="polite"></span>' +
      '<button class="swiper-ctl__btn" type="button" data-dir="1" aria-label="Next floor plan"><img src="img/icons/arrow-r.svg" alt="" width="19" height="23"><img class="is-hover" src="img/icons/arrow-r-hover.svg" alt="" width="19" height="23"></button>' +
    '</div>' +
    '<button class="lightbox__close" type="button" aria-label="Close" autofocus><span aria-hidden="true"></span></button>';
  document.body.appendChild(dlg);

  var img = dlg.querySelector('.lightbox__img'), cap = dlg.querySelector('.lightbox__cap'),
      count = dlg.querySelector('.lightbox__count'), cur = 0, opener = null;

  function show(i) {
    cur = (i + items.length) % items.length;
    img.src = items[cur].src; img.alt = items[cur].alt;
    cap.innerHTML = items[cur].cap;
    count.textContent = (cur + 1) + ' / ' + items.length;
  }
  function open(i) {
    opener = document.activeElement;
    show(i);
    dlg.showModal();
    document.documentElement.classList.add('has-lightbox');
  }
  dlg.addEventListener('close', function () {
    document.documentElement.classList.remove('has-lightbox');
    if (opener && opener.focus) opener.focus();
  });

  figs.forEach(function (f, i) {
    f.setAttribute('role', 'button');
    f.setAttribute('tabindex', '0');
    f.setAttribute('aria-label', 'Enlarge: ' + items[i].alt);
    f.addEventListener('click', function () { open(i); });
    f.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(i); }
    });
  });

  [].forEach.call(dlg.querySelectorAll('[data-dir]'), function (b) {
    b.addEventListener('click', function () { show(cur + (+b.getAttribute('data-dir'))); });
  });
  dlg.querySelector('.lightbox__close').addEventListener('click', function () { dlg.close(); });
  // Klick auf die Fläche neben Bild und Steuerung schließt
  dlg.addEventListener('click', function (e) {
    if (e.target === dlg || e.target.classList.contains('lightbox__stage')) dlg.close();
  });
  dlg.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowLeft') { e.preventDefault(); show(cur - 1); }
    if (e.key === 'ArrowRight') { e.preventDefault(); show(cur + 1); }
  });

  // Wischen (Touch): waagerecht > 40 px und deutlich waagerechter als senkrecht
  var x0 = null, y0 = 0;
  dlg.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }, { passive: true });
  dlg.addEventListener('touchend', function (e) {
    if (x0 === null) return;
    var dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0;
    x0 = null;
    if (Math.abs(dx) > 40 && Math.abs(dx) > 1.5 * Math.abs(dy)) show(cur + (dx < 0 ? 1 : -1));
  }, { passive: true });
})();
