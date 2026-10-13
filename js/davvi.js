/* DAVVI – Menü-Panel und kleine Helfer
   - Das Menü-Panel läuft beim Scrollen mit aus dem Bild. Scrollt man wieder nach oben, kehrt es als
     fixierter Header zurück (mit HOME-Bildmarke); beim Weiterscrollen nach unten verschwindet es wieder.
   - PHN: Burger klappt die Menüpunkte auf.
   - Startseite: aktiver Menüpunkt je nach sichtbarer Section. */
(function () {
  var menu = document.getElementById('menu');
  var slot = document.getElementById('menu-slot');
  if (!menu || !slot) return;

  // --- Header-Verhalten ------------------------------------------------------
  var lastY = window.scrollY, ticking = false;
  function update() {
    ticking = false;
    var y = window.scrollY;
    var slotBottom = slot.getBoundingClientRect().bottom;   // Unterkante des Platzhalters im Viewport
    var slotTop = slot.getBoundingClientRect().top;
    var dy = y - lastY;
    if (Math.abs(dy) < 4) return;                           // Zittern ignorieren
    if (slotTop >= 0) {
      // Panel steht wieder an seinem Platz im Seitenfluss
      menu.classList.remove('is-fixed', 'is-shown');
    } else if (slotBottom < 0 || menu.classList.contains('is-fixed')) {
      if (!menu.classList.contains('is-fixed')) {
        menu.style.transition = 'none';                     // ohne Übergang andocken, sonst blitzt der Header kurz auf
        menu.classList.add('is-fixed');
        void menu.offsetWidth;                              // Startposition (oben außerhalb) übernehmen
        menu.style.transition = '';
      }
      var up = dy < 0;
      menu.classList.toggle('is-shown', up);
      if (!up) close();
    }
    lastY = y;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }, { passive: true });

  // --- Burger (PHN) ----------------------------------------------------------
  var burger = menu.querySelector('.menu__burger');
  function close() {
    if (!burger) return;
    menu.classList.remove('is-open');
    burger.setAttribute('aria-expanded', 'false');
  }
  if (burger) {
    burger.addEventListener('click', function () {
      var open = !menu.classList.contains('is-open');
      menu.classList.toggle('is-open', open);
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    menu.addEventListener('click', function (e) { if (e.target.closest('.menu__list a')) close(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
  }

  // --- Aktiver Menüpunkt (nur Anker-Links der Startseite) ----------------------
  var links = [].slice.call(menu.querySelectorAll('.menu__list a.menu__btn[href^="#"]'));
  var map = links.map(function (a) { return [a, document.querySelector(a.getAttribute('href'))]; })
                 .filter(function (p) { return p[1]; });
  if (map.length && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        map.forEach(function (p) { if (p[1] === en.target) p[0].classList.toggle('is-active', en.isIntersecting); });
      });
    }, { rootMargin: '-45% 0px -45% 0px' });
    map.forEach(function (p) { io.observe(p[1]); });
  }
})();
