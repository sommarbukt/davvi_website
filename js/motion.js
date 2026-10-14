/* DAVVI – Motion-Engine
   Liest die Daten aus motion.config.js (window.DAVVI_MOTION) und setzt sie um:
   - Federkurven: aus response/bounce physikalisch berechnet (gedämpfter harmonischer Oszillator) und als
     CSS linear() mit automatisch ermittelter Ausschwingzeit ausgegeben. Keine Animations-Bibliothek nötig.
   - Header: Wiedereintritt von oben mit Feder (die Mechanik selbst steckt in davvi.js).
   - Hero-Headline: Zeile 1 von rechts, Zeile 2 von links (nicht im PHN).
   - Scroll-Stacking: Zeilen einer Section stapeln sich gestaffelt von unten ein.
   - Bildzonen-Stretch: Bilder öffnen beim Eintritt die letzten x % bis zur Zielbreite, Textbox fährt mit.
   - Ken Burns (optional): Zoom + Schwenk mit Ease-out, Startpunkt pro Bild.
   - Motion Lab: Seite mit ?lab aufrufen → Regler, Kurvenvorschau, Zeitlupe, Vergleich mit Ease-in-out,
     „Config kopieren“ liefert den fertigen Block für motion.config.js.
   Ohne JS oder bei „Bewegung reduzieren“ bleibt die Seite statisch (alles hängt an html.m-on). */
(function () {
  'use strict';
  var root = document.documentElement;
  var BASE = window.DAVVI_MOTION;
  function bail() { root.classList.remove('m-on', 'm-intro'); }
  if (!BASE || !root.classList.contains('m-on')) { bail(); return; }

  var LAB = /[?&]lab\b/.test(location.search);
  var STORE = 'davvi-motion-lab';
  var SPRINGS = ['sections', 'header', 'headline', 'stretch'];
  var PHONE = window.matchMedia('(max-width: 599.98px)');

  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function isObj(v) { return v && typeof v === 'object' && !Array.isArray(v); }
  function merge(a, b) {
    Object.keys(b).forEach(function (k) { if (isObj(a[k]) && isObj(b[k])) merge(a[k], b[k]); else a[k] = b[k]; });
    return a;
  }
  function get(o, path) { return path.split('.').reduce(function (x, k) { return x[k]; }, o); }
  function set(o, path, v) { var p = path.split('.'), last = p.pop(); p.reduce(function (x, k) { return x[k]; }, o)[last] = v; }
  function $all(sel, ctx) { return [].slice.call((ctx || document).querySelectorAll(sel)); }
  function setVar(k, v) { root.style.setProperty(k, v); }
  function reflow(el) { void (el || root).offsetWidth; }

  var cfg = clone(BASE);
  if (LAB) { try { var saved = sessionStorage.getItem(STORE); if (saved) merge(cfg, JSON.parse(saved)); } catch (e) {} }
  var view = { slow: 1, compare: false };
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

  // ---- Zurücksetzen und neu abspielen (Motion Lab) -----------------------------------------------------
  function replay() {
    Object.keys(observers).forEach(function (k) { observers[k].disconnect(); });
    watched.forEach(function (el) { el._mFns = {}; });
    root.classList.add('m-instant');
    groups.forEach(function (g) { g.items.forEach(function (el) { el.classList.remove('is-in'); }); });
    stretchEls.forEach(function (p) { p.classList.remove('is-in'); });
    kbEls.forEach(function (img) { img.classList.remove('m-kb'); });
    reflow();
    root.classList.remove('m-instant');
    reflow();
    armStacking(); armStretch(); armKenBurns();
    var hero = document.querySelector('.hero');
    if (hero && hero.getBoundingClientRect().bottom > 0) playIntro(false);
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

  if (LAB) buildLab();

  // ======================================================================================================
  //  MOTION LAB
  // ======================================================================================================
  function buildLab() {
    var SPRING_NAMES = { sections: 'Sections & Zeilen', header: 'Header (Wiedereintritt)', headline: 'Hero-Headline', stretch: 'Bildzonen-Stretch' };
    var GROUPS = [
      { title: 'Transparenz', rows: [
        { path: 'fade.duration', label: 'Dauer Einblenden', min: 0.1, max: 2, step: 0.05, unit: 's' }
      ] },
      { title: 'Scroll-Stacking', toggle: 'stacking.enabled', rows: [
        { path: 'stacking.rise', label: 'Weg von unten', min: 0, max: 140, step: 2, unit: 'px' },
        { path: 'stacking.stagger', label: 'Versatz je Zeile', min: 0, max: 0.4, step: 0.01, unit: 's' },
        { path: 'stacking.triggerAt', label: 'Auslösen bei', min: 50, max: 100, step: 1, unit: '% Viewport', re: true }
      ] },
      { title: 'Hero-Headline', toggle: 'headline.enabled', rows: [
        { path: 'headline.distance', label: 'Flugweg', min: 2, max: 50, step: 1, unit: 'vw' },
        { path: 'headline.delay', label: 'Start nach', min: 0, max: 1.5, step: 0.05, unit: 's' },
        { path: 'headline.stagger', label: 'Versatz Zeile 2', min: 0, max: 0.8, step: 0.02, unit: 's' }
      ] },
      { title: 'Bildzonen-Stretch', toggle: 'stretch.enabled', rows: [
        { path: 'stretch.amount', label: 'Stretch-Anteil', min: 0, max: 35, step: 1, unit: '%' },
        { path: 'stretch.triggerAt', label: 'Auslösen bei', min: 50, max: 100, step: 1, unit: '% Viewport', re: true }
      ] },
      { title: 'Ken Burns', toggle: 'kenBurns.enabled', rows: [
        { path: 'kenBurns.zoom', label: 'Zoom', min: 1, max: 1.25, step: 0.01, unit: '×' },
        { path: 'kenBurns.pan', label: 'Schwenk', min: 0, max: 5, step: 0.25, unit: '%' },
        { path: 'kenBurns.duration', label: 'Dauer', min: 4, max: 40, step: 1, unit: 's' }
      ] }
    ];

    var css = '' +
      '.mlab{position:fixed;right:16px;bottom:16px;z-index:1000;width:340px;max-height:calc(100vh - 32px);display:flex;flex-direction:column;' +
      'background:rgba(28,40,44,.94);-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);color:#fff;border:1px solid rgba(255,255,255,.12);' +
      'box-shadow:0 24px 60px -20px rgba(0,0,0,.7);font:300 13px/1.35 var(--f-body);letter-spacing:.3px;translate:0 0;transition:translate .5s var(--m-ease-header)}' +
      '.mlab.is-min{translate:0 calc(100% - 46px)}' +
      '.mlab *{box-sizing:border-box}' +
      '.mlab__head{display:flex;align-items:center;gap:10px;padding:12px 14px;border-bottom:1px solid rgba(255,255,255,.1);cursor:pointer;user-select:none}' +
      '.mlab__head img{width:44px;height:auto;opacity:.9}' +
      '.mlab__title{flex:1;font:300 18px/1 var(--f-caps);letter-spacing:1px;text-transform:uppercase}' +
      '.mlab__title small{opacity:.5;margin-left:4px}' +
      '.mlab__chev{opacity:.6;transition:rotate .3s}.mlab.is-min .mlab__chev{rotate:180deg}' +
      '.mlab__body{overflow:auto;padding:4px 14px 14px;overscroll-behavior:contain}' +
      '.mlab__sec{padding:12px 0 6px;border-bottom:1px solid rgba(255,255,255,.08)}' +
      '.mlab__sec:last-child{border:0}' +
      '.mlab__sh{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;font:300 16px/1 var(--f-caps);letter-spacing:1px;text-transform:uppercase;color:var(--hblau)}' +
      '.mlab__row{display:grid;grid-template-columns:1fr auto;gap:2px 8px;margin:0 0 9px}' +
      '.mlab__row label{opacity:.75}.mlab__row output{font-variant-numeric:tabular-nums;opacity:.95}' +
      '.mlab__row input[type=range]{grid-column:1/-1;width:100%;margin:0;accent-color:var(--hblau);height:18px}' +
      '.mlab select{width:100%;margin:0 0 10px;padding:6px 8px;background:rgba(0,0,0,.3);color:#fff;border:1px solid rgba(255,255,255,.15);font:inherit}' +
      '.mlab__sw{position:relative;width:34px;height:18px;flex:none}.mlab__sw input{position:absolute;inset:0;opacity:0;margin:0;cursor:pointer}' +
      '.mlab__sw i{position:absolute;inset:0;border-radius:9px;background:rgba(255,255,255,.2);transition:background .2s;pointer-events:none}' +
      '.mlab__sw i::after{content:"";position:absolute;left:2px;top:2px;width:14px;height:14px;border-radius:50%;background:#fff;transition:translate .35s var(--m-ease-header)}' +
      '.mlab__sw input:checked+i{background:var(--hblau)}.mlab__sw input:checked+i::after{translate:16px 0}' +
      '.mlab__sw input:focus-visible+i{outline:2px solid var(--hblau);outline-offset:2px}' +
      '.mlab__line{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:0 0 9px}.mlab__line span{opacity:.75}' +
      '.mlab__curve{display:block;width:100%;height:auto;background:rgba(0,0,0,.25);margin:0 0 6px}' +
      '.mlab__meta{font-size:12px;opacity:.7;margin:0 0 10px}.mlab__meta b{font-weight:400;color:#fff;opacity:1}' +
      '.mlab__warn{color:#f6a35c}' +
      '.mlab__actions{display:grid;grid-template-columns:1fr 1fr;gap:6px;padding:12px 14px;border-top:1px solid rgba(255,255,255,.1)}' +
      '.mlab__actions button{padding:9px 10px 10px;background:rgba(255,255,255,.1);color:#fff;font:300 16px/1 var(--f-caps);letter-spacing:1px;text-transform:uppercase;transition:background .2s}' +
      '.mlab__actions button:hover{background:rgba(255,255,255,.2)}' +
      '.mlab__actions .is-primary{grid-column:1/-1;background:var(--hblau);color:#000}.mlab__actions .is-primary:hover{background:#a9cbe6}' +
      '.mlab__note{padding:0 14px 12px;font-size:11px;opacity:.5}' +
      '.mlab textarea{width:100%;height:160px;margin-top:8px;background:#0b1316;color:#cfe3f2;border:0;font:12px/1.4 ui-monospace,monospace;padding:8px}' +
      '@media (max-width:599.98px){.mlab{left:8px;right:8px;bottom:8px;width:auto;max-height:70vh}}';
    var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

    var box = document.createElement('aside');
    box.className = 'mlab'; box.setAttribute('aria-label', 'Motion Lab');
    var html = '<div class="mlab__head" role="button" tabindex="0" aria-expanded="true">' +
      '<img src="logo/davvi_logo_weiss.svg" alt=""><div class="mlab__title">Motion Lab <small>beta</small></div><span class="mlab__chev" aria-hidden="true">&#9662;</span></div>' +
      '<div class="mlab__body">' +
      '<section class="mlab__sec"><div class="mlab__sh">Federkurven</div>' +
      '<select data-spring-pick>' + SPRINGS.map(function (n) { return '<option value="' + n + '">' + SPRING_NAMES[n] + '</option>'; }).join('') + '</select>' +
      '<svg class="mlab__curve" viewBox="0 0 300 130" aria-hidden="true"></svg><p class="mlab__meta" data-spring-meta></p>' +
      row({ path: '@response', label: 'Tempo (response)', min: 0.2, max: 2.5, step: 0.05, unit: 's' }) +
      row({ path: '@bounce', label: 'Dämpfung (bounce)', min: -0.6, max: 0.3, step: 0.01, unit: '' }) +
      '</section>';
    GROUPS.forEach(function (g) {
      html += '<section class="mlab__sec"><div class="mlab__sh">' + g.title +
        (g.toggle ? sw(g.toggle, g.title + ' an/aus') : '') + '</div>' + g.rows.map(row).join('') + '</section>';
    });
    html += '<section class="mlab__sec"><div class="mlab__sh">Ansicht</div>' +
      '<div class="mlab__line"><span>Zeitlupe (4×)</span>' + sw('@slow', 'Zeitlupe') + '</div>' +
      '<div class="mlab__line"><span>Vergleich: klassisches Ease-in-out</span>' + sw('@compare', 'Vergleich Ease-in-out') + '</div>' +
      '</section></div>' +
      '<div class="mlab__actions"><button type="button" class="is-primary" data-act="replay">&#9654;&ensp;Abspielen</button>' +
      '<button type="button" data-act="copy">Config kopieren</button><button type="button" data-act="reset">Zurücksetzen</button></div>' +
      '<p class="mlab__note">Änderungen gelten nur in diesem Browser-Tab. „Config kopieren“ liefert den Block für js/motion.config.js.</p>';
    box.innerHTML = html;
    document.body.appendChild(box);

    function row(r) {
      return '<div class="mlab__row"><label for="ml-' + r.path + '">' + r.label + '</label><output data-out="' + r.path + '" data-unit="' + r.unit + '"></output>' +
        '<input id="ml-' + r.path + '" type="range" min="' + r.min + '" max="' + r.max + '" step="' + r.step + '" data-path="' + r.path + '"' + (r.re ? ' data-re="1"' : '') + '></div>';
    }
    function sw(path, label) {
      return '<span class="mlab__sw"><input type="checkbox" data-path="' + path + '" aria-label="' + label + '"><i></i></span>';
    }

    var pick = box.querySelector('[data-spring-pick]');
    var svg = box.querySelector('.mlab__curve');
    var meta = box.querySelector('[data-spring-meta]');

    function realPath(p) { return p.charAt(0) === '@' && p !== '@slow' && p !== '@compare' ? 'springs.' + pick.value + '.' + p.slice(1) : p; }
    function read(p) {
      if (p === '@slow') return view.slow > 1;
      if (p === '@compare') return view.compare;
      return get(cfg, realPath(p));
    }
    function fmt(v, unit) {
      var s = (Math.round(v * 100) / 100).toString().replace('.', ',');
      return unit ? s + ' ' + unit : s;
    }
    function sync() {
      $all('[data-path]', box).forEach(function (inp) {
        var v = read(inp.getAttribute('data-path'));
        if (inp.type === 'checkbox') inp.checked = !!v; else inp.value = v;
      });
      $all('[data-out]', box).forEach(function (o) { o.textContent = fmt(read(o.getAttribute('data-out')), o.getAttribute('data-unit')); });
      drawCurve();
    }
    function save() { try { sessionStorage.setItem(STORE, JSON.stringify(cfg)); } catch (e) {} }

    function drawCurve() {
      var c = spring(cfg.springs[pick.value]);
      var W = 300, H = 130, pl = 8, pr = 8, pt = 14, pb = 16, T = c.duration;
      var ymax = Math.max(1.08, 1 + c.overshoot + 0.04);
      function X(t) { return pl + t / T * (W - pl - pr); }
      function Y(v) { return H - pb - v / ymax * (H - pt - pb); }
      var d = '', e = '';
      for (var i = 0; i <= 120; i++) {
        var t = T * i / 120;
        d += (i ? 'L' : 'M') + X(t).toFixed(1) + ' ' + Y(c.f(t)).toFixed(1);
        var u = Math.min(1, t / 0.6), ez = u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;   // Ease-in-out zum Vergleich (0,6 s)
        e += (i ? 'L' : 'M') + X(t).toFixed(1) + ' ' + Y(ez).toFixed(1);
      }
      svg.innerHTML =
        '<line x1="' + pl + '" x2="' + (W - pr) + '" y1="' + Y(1) + '" y2="' + Y(1) + '" stroke="rgba(255,255,255,.25)" stroke-dasharray="3 4"/>' +
        '<line x1="' + pl + '" x2="' + (W - pr) + '" y1="' + Y(0) + '" y2="' + Y(0) + '" stroke="rgba(255,255,255,.12)"/>' +
        '<path d="' + e + '" fill="none" stroke="rgba(255,255,255,.35)" stroke-width="1.2" stroke-dasharray="2 3"/>' +
        '<path d="' + d + '" fill="none" stroke="#8CB9DC" stroke-width="2.2" stroke-linecap="round"/>' +
        '<text x="' + (W - pr) + '" y="' + (H - 4) + '" fill="rgba(255,255,255,.45)" font-size="10" text-anchor="end">' + fmt(T, 's') + '</text>' +
        '<text x="' + pl + '" y="10" fill="rgba(255,255,255,.45)" font-size="10">Feder</text>' +
        '<text x="' + (pl + 40) + '" y="10" fill="rgba(255,255,255,.3)" font-size="10">- - Ease-in-out 0,6 s</text>';
      var os = c.overshoot * 100;
      meta.innerHTML = 'Laufzeit <b>' + fmt(c.duration, 's') + '</b> · Überschwingen <b>' + fmt(os, '%') + '</b>' +
        (os > 0.5 ? '<br><span class="mlab__warn">Achtung: sichtbares Überschwingen = Bouncing</span>' : '');
    }

    var rTimer;
    function scheduleReplay(rearm) { clearTimeout(rTimer); rTimer = setTimeout(function () { replay(); }, rearm ? 0 : 250); }

    box.addEventListener('input', function (e) {
      var inp = e.target, p = inp.getAttribute && inp.getAttribute('data-path');
      if (!p) return;
      if (p === '@slow') view.slow = inp.checked ? 4 : 1;
      else if (p === '@compare') view.compare = inp.checked;
      else set(cfg, realPath(p), inp.type === 'checkbox' ? inp.checked : parseFloat(inp.value));
      applyVars(); sync(); save();
      if (inp.type === 'checkbox' && p !== '@slow' && p !== '@compare') scheduleReplay(true);
    });
    box.addEventListener('change', function (e) {
      var inp = e.target;
      if (inp === pick) { sync(); return; }
      if (inp.type === 'range') scheduleReplay(inp.hasAttribute('data-re'));
      if (inp.getAttribute('data-path') === '@compare' || inp.getAttribute('data-path') === '@slow') scheduleReplay(true);
    });

    var head = box.querySelector('.mlab__head');
    function toggleMin() { var m = box.classList.toggle('is-min'); head.setAttribute('aria-expanded', m ? 'false' : 'true'); }
    head.addEventListener('click', toggleMin);
    head.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleMin(); } });

    box.addEventListener('click', function (e) {
      var b = e.target.closest('[data-act]'); if (!b) return;
      var act = b.getAttribute('data-act');
      if (act === 'replay') replay();
      if (act === 'reset') {
        try { sessionStorage.removeItem(STORE); } catch (err) {}
        cfg = clone(BASE); view.slow = 1; view.compare = false;
        applyVars(); sync(); replay();
      }
      if (act === 'copy') {
        var txt = 'window.DAVVI_MOTION = ' + JSON.stringify(cfg, null, 2) + ';\n';
        var done = function () { var t = b.textContent; b.textContent = 'Kopiert ✓'; setTimeout(function () { b.textContent = t; }, 1600); };
        var fallback = function () {
          var ta = box.querySelector('textarea') || document.createElement('textarea');
          ta.value = txt; ta.readOnly = true; box.querySelector('.mlab__body').appendChild(ta); ta.focus(); ta.select();
        };
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(done, fallback); else fallback();
      }
    });

    sync();
  }
})();
