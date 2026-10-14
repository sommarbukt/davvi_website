(() => {
  'use strict';
  try {
    const defaults = DavviConfig.validate(window.DAVVI_CONFIG);
    const devMode = defaults.devMode === true;
    // File values remain authoritative; persisted drafts apply only to this exact source.
    const storageKey = 'davvi-config-preview-v1';
    const source = JSON.stringify(defaults);
    let config = structuredClone(defaults),
      slider;
    if (devMode) {
      try {
        const saved = JSON.parse(localStorage.getItem(storageKey));
        if (
          saved?.source === source &&
          Array.isArray(saved.config?.slides) &&
          saved.config.slides.length === defaults.slides.length
        )
          config = DavviConfig.validate(saved.config);
      } catch (_) {}
    }
    config.settings = { ...DavviEasing.defaults, ...config.settings };
    for (const key of ['fadeEasing', 'introEasing', 'zoomEasing', 'panEasing']) {
      try {
        DavviEasing.parse(config.settings[key]);
      } catch (_) {
        config.settings[key] = DavviEasing.defaults[key];
      }
    }
    const escapeHtml = (value) =>
      String(value).replace(
        /[&<>"']/g,
        (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
      );
    const fields = [
      ['phoneBreakpoint', 'Phone bis (px)', 320, 1600, 1],
      ['tabletBreakpoint', 'Tablet bis (px)', 321, 2400, 1],
      ['startZoom', 'Start-Zoom', 1, 5, 0.05],
      ['middleZoom', 'Übergangs-Zoom', 1, 5, 0.05],
      ['endZoom', 'End-Zoom', 1, 5, 0.05],
      ['transition', 'Bildwechsel (s)', 0.5, 10, 0.1],
      ['panThreshold', 'Schwenkschwelle (%)', 0, 100, 1],
    ];
    function input(key, label, min, max, step, value) {
      return `<label>${label}<input required type="number" name="${key}" min="${min}" max="${max}" step="${step}" value="${escapeHtml(value)}"></label>`;
    }
    function form() {
      let html =
        '<h3>Globale Animation</h3><div class="field-grid">' +
        fields.map(([key, ...args]) => input(key, ...args, config.settings[key])).join('') +
        '</div>';
      for (const [mode, title] of [
        ['desktop', 'Desktop'],
        ['tablet', 'Tablet'],
        ['phone', 'Phone'],
      ]) {
        html +=
          `<h3>${title}</h3><div class="field-grid">` +
          input(mode + '.height', 'Höhe (% Viewport)', 20, 100, 1, config.settings[mode].height) +
          input(mode + '.margin', 'Außenabstand (px)', 0, 80, 1, config.settings[mode].margin) +
          input(
            mode + '.duration',
            'Bilddauer inkl. Wechsel (s)',
            4,
            60,
            0.5,
            config.settings[mode].duration,
          ) +
          '</div>';
      }
      document.querySelector('#global-fields').innerHTML =
        html +
        '<p>Die Bilddauer umfasst die gesamte Bewegung. Der nächste Bildwechsel startet um die Wechselzeit früher: bei 14 s Bilddauer und 3 s Wechselzeit alle 11 s. Schwenken beginnt direkt mit der Einblendung.</p>';
      document.querySelector('#export-dev-mode').checked = config.devMode === true;
      document.querySelector('#export-status').textContent = '';
      DavviEasingControls.mount(document.querySelector('#global-fields'), config.settings);
      document.querySelector('#slide-fields').innerHTML = config.slides
        .map(
          (s, i) =>
            `<fieldset><legend>${String(i + 1).padStart(2, '0')} · ${escapeHtml(s.desktop.split('/').pop())}</legend><div class="slide-config"><img src="${escapeHtml(s.desktop)}" alt=""><label>Horizontal<select name="slide-${i}-horizontal"><option value="left" ${s.horizontal === 'left' ? 'selected' : ''}>Links</option><option value="right" ${s.horizontal === 'right' ? 'selected' : ''}>Rechts</option></select></label><label>Vertikal<select name="slide-${i}-vertical"><option value="top" ${s.vertical === 'top' ? 'selected' : ''}>Oben</option><option value="bottom" ${s.vertical === 'bottom' ? 'selected' : ''}>Unten</option></select></label></div><label class="check"><input type="checkbox" name="slide-${i}-panning" ${s.panning ? 'checked' : ''}>Schwenken aktiv</label></fieldset>`,
        )
        .join('');
    }
    function start() {
      slider?.destroy();
      slider = new DavviSlider(
        document.querySelector('#hero'),
        config.settings,
        config.slides,
        (state) => {
          document.querySelector('#counter').textContent =
            `${String(state.index + 1).padStart(2, '0')} / ${String(state.count).padStart(2, '0')}`;
          document.querySelector('.progress i').style.transform = `scaleX(${state.progress})`;
          document
            .querySelector('.progress')
            .setAttribute('aria-valuenow', Math.round(state.progress * 100));
          if (devMode)
            document.querySelector('#diagnostics').textContent =
              `${state.mode.toUpperCase()} · ${state.panning ? (state.axis === 'x' ? 'HORIZONTAL' : 'VERTIKAL') : 'NUR ZOOM'} · ${state.zoom.toFixed(2)}×`;
          const pause = document.querySelector('#pause');
          pause.textContent = state.paused ? 'Abspielen' : 'Pause';
          pause.setAttribute(
            'aria-label',
            state.paused ? 'Animation abspielen' : 'Animation pausieren',
          );
        },
      );
      window.davviPreview = slider;
    }
    function readForm() {
      const formElement = document.querySelector('#settings-form');
      if (!formElement.reportValidity()) return null;
      const data = new FormData(formElement),
        next = structuredClone(config);
      next.devMode = document.querySelector('#export-dev-mode').checked;
      for (const [key] of fields) next.settings[key] = Number(data.get(key));
      for (const mode of ['desktop', 'tablet', 'phone'])
        for (const key of ['height', 'margin', 'duration'])
          next.settings[mode][key] = Number(data.get(mode + '.' + key));
      const easingSettings = DavviEasingControls.read(next.settings);
      if (!easingSettings) return;
      next.settings = easingSettings;
      const s = next.settings;
      if (
        s.phoneBreakpoint >= s.tabletBreakpoint ||
        s.startZoom < s.middleZoom ||
        s.middleZoom < s.endZoom ||
        ['desktop', 'tablet', 'phone'].some((mode) => s[mode].duration <= s.transition)
      ) {
        alert(
          'Bitte prüfen: Phone-Grenze < Tablet-Grenze; Start-Zoom ≥ Übergangs-Zoom ≥ End-Zoom; Bilddauer > Wechselzeit.',
        );
        return;
      }
      next.slides.forEach((slide, i) => {
        slide.horizontal = data.get(`slide-${i}-horizontal`);
        slide.vertical = data.get(`slide-${i}-vertical`);
        slide.panning = data.has(`slide-${i}-panning`);
      });
      try {
        return DavviConfig.validate(next);
      } catch (error) {
        document.querySelector('#export-status').textContent = error.message;
        return null;
      }
    }
    function save(next) {
      config = next;
      try {
        localStorage.setItem(storageKey, JSON.stringify({ source, config }));
      } catch (_) {}
    }
    document.querySelector('#pause').onclick = () => slider.toggle();
    if (!devMode) {
      document.querySelector('.masthead').remove();
      document.querySelector('#settings').remove();
      document.querySelector('#diagnostics').closest('footer').remove();
      start();
      return;
    }
    document.querySelector('.masthead').hidden = false;
    document.querySelector('#settings-form').addEventListener('submit', (event) => {
      event.preventDefault();
      const next = readForm();
      if (next) {
        save(next);
        start();
      }
    });
    // Export is a local Blob download. There is deliberately no server write endpoint.
    document.querySelector('#export-config').onclick = () => {
      const next = readForm();
      if (!next) return;
      const text =
        '// Davvi Slider – exportierte Konfiguration. Bildpfade relativ zur HTML-Seite.\nwindow.DAVVI_CONFIG = ' +
        JSON.stringify(next, null, 2) +
        ';\n';
      const url = URL.createObjectURL(new Blob([text], { type: 'text/javascript;charset=utf-8' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = 'slider-config.js';
      document.body.append(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
      document.querySelector('#export-status').textContent =
        'Konfiguration zum Download bereitgestellt. Zum Veröffentlichen slider-config.js manuell ersetzen. Es wurde nichts auf den Server geschrieben.';
    };
    function panel(open) {
      document.querySelector('#settings').hidden = !open;
      document.querySelector('#settings-toggle').setAttribute('aria-expanded', open);
      if (open) document.querySelector('#close-settings').focus();
      else document.querySelector('#settings-toggle').focus();
    }
    document.querySelector('#settings-toggle').onclick = () =>
      panel(document.querySelector('#settings').hidden);
    document.querySelector('#close-settings').onclick = () => panel(false);
    // Keep keyboard focus inside the open settings dialog.
    document.addEventListener('keydown', (e) => {
      const dialog = document.querySelector('#settings');
      if (dialog.hidden) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        panel(false);
      }
      if (e.key === 'Tab') {
        const controls = [...dialog.querySelectorAll('button,input,select,a[href]')].filter(
          (el) => !el.matches(':disabled') && el.getClientRects().length,
        );
        const first = controls[0],
          last = controls[controls.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    });
    document.querySelector('#reset').onclick = () => {
      config = structuredClone(defaults);
      try {
        localStorage.removeItem(storageKey);
      } catch (_) {}
      form();
      start();
    };
    form();
    start();
  } catch (error) {
    document.querySelector('#status').textContent = 'Slider-Konfiguration prüfen: ' + error.message;
    document.querySelector('#settings-toggle').disabled = true;
    document.querySelector('.hero-bottom').hidden = true;
  }
})();
