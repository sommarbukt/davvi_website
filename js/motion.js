/* DAVVI – Motion-Engine
   Liest die Daten aus motion.config.js (window.DAVVI_MOTION) und setzt sie um:
   - Federkurven: aus response/bounce physikalisch berechnet (gedämpfter harmonischer Oszillator) und als
     CSS linear() mit automatisch ermittelter Ausschwingzeit ausgegeben. Keine Animations-Bibliothek nötig.
   - Header: Wiedereintritt von oben mit Feder (die Mechanik selbst steckt in davvi.js).
   - Hero-Headline: Zeile 1 von rechts, Zeile 2 von links (nicht im PHN).
   - Scroll-Stacking: Zeilen einer Section stapeln sich gestaffelt von unten ein.
   - Bildzonen-Stretch: Bilder öffnen beim Eintritt die letzten x % bis zur Zielbreite, Textbox fährt mit.
   - Ken Burns (optional): Zoom + Schwenk mit Ease-out, Startpunkt pro Bild.
   Ohne JS oder bei „Bewegung reduzieren“ bleibt die Seite statisch (alles hängt an html.m-on). */
(function () {
  'use strict';
  var root = document.documentElement;
  var BASE = window.DAVVI_MOTION;
  function bail() { root.classList.remove('m-on', 'm-intro'); }
  if (!BASE || !root.classList.contains('m-on')) { bail(); return; }

  var SPRINGS = ['sections', 'header', 'headline', 'stretch'];
  var PHONE = window.matchMedia('(max-width: 599.98px)');

  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function $all(sel, ctx) { return [].slice.call((ctx || document).querySelectorAll(sel)); }
  function setVar(k, v) { root.style.setProperty(k, v); }
  function reflow(el) { void (el || root).offsetWidth; }

  var cfg = clone(BASE);
  var view = { slow: 1, compare: false }; // feste Werte (früher vom Motion Lab umschaltbar)
  var curves = {};

  // ---- Federn ------------------------------------------------------------------------------
  // response = Periode der ungedämpften Schwingung (s), bounce: 0 kritisch gedämpft, <0 überdämpft, >0 Überschwingen.
  function spring(p) {
    var omega = 2 * Math.PI / Math.max(0.05, +p.response || 0.5);
    var b = Math.max(-0.9, Math.min(0.9, +p.bounce || 0));
    var zeta = b >= 0 ? 1 - b : 1 / (1 + b);
    var f;
    if (Math.abs(zeta - 1) < 1e-6) {
      f = function (t) { return 1 - Math.exp(-omega * t) * (1 + omega * t); };
    } else if (zeta < 1) {
      var wd = omega * Math.sqrt(1 - zeta * zeta);
      f = function (t) { return 1 - Math.exp(-zeta * omega * t) * (Math.cos(wd * t) + zeta * omega / wd * Math.sin(wd * t)); };
    } else {
      var s = Math.sqrt(zeta * zeta - 1), r1 = -omega * (zeta - s), r2 = -omega * (zeta + s);
      f = function (t) { return 1 - (r2 * Math.exp(r1 * t) - r1 * Math.exp(r2 * t)) / (r2 - r1); };
    }
    // Ausschwingzeit: letzter Zeitpunkt, an dem die Kurve noch mehr als 0,15 % vom Ziel abweicht
    var dt = 1 / 240, T = 0, t, max = 0;
    for (t = 0; t < 8; t += dt) { var v = f(t); if (Math.abs(1 - v) > 0.0015) T = t; if (v > max) max = v; }
    T = Math.max(0.12, T + dt);
    var n = Math.max(24, Math.min(90, Math.round(T * 55))), pts = [];
    for (var i = 0; i <= n; i++) pts.push(i === n ? 1 : Math.round(f(T * i / n) * 10000) / 10000);
    return { css: 'linear(' + pts.join(', ') + ')', duration: T, f: f, overshoot: Math.max(0, max - 1) };
  }

  // ---- Variablen setzen ------------------------------------------------------------------------
  function applyVars() {
    var k = view.slow;
    SPRINGS.forEach(function (name) {
      var c = curves[name] = spring(cfg.springs[name]);
      setVar('--m-ease-' + name, view.compare ? 'ease-in-out' : c.css);
      setVar('--m-dur-' + name, ((view.compare ? 0.6 : c.duration) * k).toFixed(3) + 's');
    });
    setVar('--m-ease-fade', view.compare ? 'ease-in-out' : cfg.fade.easing);
    setVar('--m-dur-fade', (cfg.fade.duration * k).toFixed(3) + 's');
    setVar('--m-hide-ease', cfg.header.hideEasing);
    setVar('--m-hide-dur', (cfg.header.hideDuration * k).toFixed(3) + 's');
    setVar('--m-rise', cfg.stacking.rise + 'px');
    setVar('--m-hl-dist', cfg.headline.distance + 'vw');
    setVar('--m-stretch', (cfg.stretch.enabled ? cfg.stretch.amount : 0) + '%');
    setVar('--m-kb-dur', (cfg.kenBurns.duration * k) + 's');
    setVar('--m-kb-ease', view.compare ? 'ease-in-out' : cfg.kenBurns.easing);
    setDelays();
    updateShifts();
  }

  // ---- Auslöser (ein IntersectionObserver je Auslöselinie) -----------------------------------------
  // Ein Element kann mehrere Effekte tragen (Panel: Stacking + Stretch) – deshalb Callback-Listen je Auslöselinie.
  var observers = {}, watched = [];
  function observe(el, triggerAt, fn) {
    var key = Math.round(triggerAt);
    if (!observers[key]) {
      observers[key] = new IntersectionObserver(function (entries, io) {
        entries.forEach(function (en) {
          // Zone reicht nach oben „unendlich“ weit: Was übersprungen wurde (Sprunglink, Ende-Taste), gilt als erreicht.
          if (!en.isIntersecting) return;
          var above = en.boundingClientRect.bottom < 0;
          io.unobserve(en.target);
          var fns = (en.target._mFns || {})[key] || [];
          delete en.target._mFns[key];
          fns.forEach(function (f) { f(above); });
        });
      }, { rootMargin: '1000000px 0px ' + (key - 100) + '% 0px' });
    }
    el._mFns = el._mFns || {};
    (el._mFns[key] = el._mFns[key] || []).push(fn);
    if (watched.indexOf(el) < 0) watched.push(el);
    observers[key].observe(el);
  }
  // Ziel liegt schon oberhalb (Sprunglink, Reload mitten auf der Seite): ohne Animation zeigen
  function instantly(el, fn) {
    el.classList.add('m-instant'); fn(); reflow(el);
    requestAnimationFrame(function () { requestAnimationFrame(function () { el.classList.remove('m-instant'); }); });
  }

  // ---- Scroll-Stacking --------------------------------------------------------------------------
  var groups = [];
  function setupStacking() {
    var taken = [];
    cfg.stacking.groups.forEach(function (g) {
      $all(g.target).forEach(function (target) {
        var items = [];
        g.items.forEach(function (sel) {
          $all(sel, target).forEach(function (el) {
            if (taken.indexOf(el) > -1) return;
            taken.push(el); items.push(el);
            el.setAttribute('data-m', el.classList.contains('line') ? 'line' : 'rise');
          });
        });
        if (items.length) groups.push({ el: target, items: items, delay: g.delay || 0, phoneTrigger: g.phoneTrigger });
      });
    });
  }
  function setDelays() {
    groups.forEach(function (g) {
      g.items.forEach(function (el, i) {
        el.style.setProperty('--d', ((g.delay + i * cfg.stacking.stagger) * view.slow).toFixed(3) + 's');
      });
    });
    var l1 = document.querySelector('.hero__l1'), l2 = document.querySelector('.hero__l2');
    if (l1 && l2) {
      l1.style.setProperty('--d', (cfg.headline.delay * view.slow).toFixed(3) + 's');
      l2.style.setProperty('--d', ((cfg.headline.delay + cfg.headline.stagger) * view.slow).toFixed(3) + 's');
    }
  }
  function armStacking() {
    groups.forEach(function (g) {
      var show = function () { g.items.forEach(function (el) { el.classList.add('is-in'); }); };
      if (!cfg.stacking.enabled) { instantly(g.el, show); return; }
      // PHN: Steht die Textbox unter dem Bild, löst sie selbst aus (sonst liefen die Zeilen außerhalb des Bildes ein)
      var trig = (PHONE.matches && g.phoneTrigger && g.el.querySelector(g.phoneTrigger)) || g.el;
      observe(trig, cfg.stacking.triggerAt, function (above) { above ? instantly(g.el, show) : show(); });
    });
  }

  // ---- Bildzonen-Stretch ---------------------------------------------------------------------------
  var stretchEls = [];
  function setupStretch() {
    stretchEls = $all(cfg.stretch.target);
    stretchEls.forEach(function (p) { p.setAttribute('data-m-stretch', ''); });
  }
  // Die Textbox fährt mit der Bildkante: Versatz = beschnittener Anteil der Bildbreite (nur wo sie auf dem Bild liegt)
  function updateShifts() {
    var amt = cfg.stretch.enabled ? cfg.stretch.amount / 100 : 0;
    stretchEls.forEach(function (p) {
      var c = p.firstElementChild, w = c ? c.getBoundingClientRect().width : 0, s = 0;
      if (!PHONE.matches) {
        if (p.classList.contains('panel--l')) s = -w * amt;
        else if (p.classList.contains('panel--r')) s = w * amt;
      }
      p.style.setProperty('--m-shift', s.toFixed(1) + 'px');
    });
  }
  function armStretch() {
    stretchEls.forEach(function (p) {
      var show = function () { p.classList.add('is-in'); };
      observe(p, cfg.stretch.triggerAt, function (above) { above ? instantly(p, show) : show(); });
    });
  }

  // ---- Ken Burns ---------------------------------------------------------------------------------
  var kbEls = [];
  function setupKenBurns() {
    kbEls = $all(cfg.kenBurns.target);
    kbEls.forEach(function (img, i) { img._kbIndex = i; });
  }
  function kbVars(img) {
    var kb = cfg.kenBurns, pts = kb.startPoints || [[0, 0]];
    var own = img.getAttribute('data-kb');                  // optional pro Bild: data-kb="-1 0.5"
    var pt = own ? own.split(/\s+/).map(Number) : pts[img._kbIndex % pts.length];
    var x = (pt[0] || 0) * kb.pan, y = (pt[1] || 0) * kb.pan;
    var z0 = 1 + 2 * Math.max(Math.abs(x), Math.abs(y)) / 100 + 0.01;   // genug Reserve, damit beim Schwenk keine Kante sichtbar wird
    img.style.setProperty('--kb-x', x + '%');
    img.style.setProperty('--kb-y', y + '%');
    img.style.setProperty('--kb-z0', z0.toFixed(4));
    img.style.setProperty('--kb-z1', (z0 * kb.zoom).toFixed(4));
  }
  function startKB(img) {
    img.classList.remove('m-kb');
    if (!cfg.kenBurns.enabled) return;
    kbVars(img); reflow(img); img.classList.add('m-kb');
  }
  function armKenBurns() {
    kbEls.forEach(function (img) {
      img.classList.remove('m-kb');
      if (!cfg.kenBurns.enabled) return;
      observe(img, cfg.stretch.triggerAt, function () { startKB(img); });
    });
  }

  // ---- Hero-Headline -------------------------------------------------------------------------------
  function playIntro(first) {
    var hero = document.querySelector('.hero');
    if (!hero || !cfg.headline.enabled || PHONE.matches) { root.classList.remove('m-intro'); return; }
    if (!first) { hero.classList.add('m-instant'); root.classList.add('m-intro'); reflow(hero); hero.classList.remove('m-instant'); reflow(hero); }
    var go = function () { requestAnimationFrame(function () { root.classList.remove('m-intro'); }); };
    if (first && document.fonts && document.fonts.ready) {
      // erst animieren, wenn die Adobe-Schrift da ist (sonst fliegt die Ersatzschrift ein) – höchstens 1,2 s warten
      Promise.race([document.fonts.ready, new Promise(function (r) { setTimeout(r, 1200); })]).then(go);
    } else go();
  }

  // ---- Start ---------------------------------------------------------------------------------------
  try {
    setupStacking(); setupStretch(); setupKenBurns();
    applyVars();
    armStacking(); armStretch(); armKenBurns();
    playIntro(true);
    var rt;
    window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(updateShifts, 120); });
    window.DAVVI_MOTION_READY = true;
  } catch (err) {
    bail();
    if (window.console) console.error('[DAVVI motion]', err);
    return;
  }
})();
