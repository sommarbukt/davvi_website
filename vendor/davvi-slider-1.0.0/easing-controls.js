(function () {
  'use strict';
  const definitions = [
    ['fadeEasing', 'Einblenden · Transparenz'],
    ['introEasing', 'Zoom · Bildwechsel'],
    ['zoomEasing', 'Zoom · Bildbewegung'],
    ['panEasing', 'Schwenken · beide Achsen'],
  ];
  let holder;
  function mount(parent, settings) {
    holder = document.createElement('section');
    const title = document.createElement('h3');
    title.textContent = 'Globale Bewegungskurven';
    holder.append(title);
    const label = document.createElement('label');
    label.className = 'check';
    const auto = document.createElement('input');
    auto.type = 'checkbox';
    auto.name = 'autoZoom';
    auto.checked = settings.autoZoom;
    label.append(auto, document.createTextNode('Zoomübergang automatisch weich verbinden'));
    holder.append(label);
    const note = document.createElement('p');
    note.textContent =
      'Automatik verbindet beide Zoomphasen; die zweite bleibt linear. Für eigene Zoomkurven Automatik ausschalten. Einblenden und Schwenken sind unabhängig einstellbar.';
    holder.append(note);
    for (const [key, title] of definitions) {
      const field = document.createElement('fieldset');
      field.dataset.easing = key;
      const legend = document.createElement('legend');
      legend.textContent = title;
      field.append(legend);
      const sl = document.createElement('label');
      sl.textContent = 'Kurve';
      const select = document.createElement('select');
      select.name = key + 'Preset';
      for (const name of [...DavviEasing.names, 'custom']) {
        const opt = document.createElement('option');
        opt.value = name;
        opt.textContent =
          name === 'custom'
            ? 'Benutzerdefiniert'
            : name === 'smoothstep'
              ? 'Weich (bisherige Einblendung)'
              : name;
        select.append(opt);
      }
      select.value = DavviEasing.names.includes(settings[key]) ? settings[key] : 'custom';
      sl.append(select);
      field.append(sl);
      const il = document.createElement('label');
      il.textContent = 'Kurvenname oder cubic-bezier';
      il.style.marginTop = '10px';
      const input = document.createElement('input');
      input.name = key;
      input.type = 'text';
      input.value = settings[key];
      input.placeholder = 'cubic-bezier(0.22, 0.61, 0.36, 1)';
      input.spellcheck = false;
      il.append(input);
      field.append(il);
      const error = document.createElement('p');
      error.className = 'error';
      error.id = key + 'Error';
      error.setAttribute('aria-live', 'polite');
      input.setAttribute('aria-describedby', error.id);
      field.append(error);
      const sync = () => {
        il.hidden = select.value !== 'custom';
        il.style.display = il.hidden ? 'none' : 'flex';
        if (select.value !== 'custom') input.value = select.value;
        error.textContent = '';
        input.removeAttribute('aria-invalid');
      };
      select.addEventListener('change', sync);
      input.addEventListener('input', () => {
        error.textContent = '';
        input.removeAttribute('aria-invalid');
      });
      sync();
      holder.append(field);
    }
    const syncAuto = () => {
      for (const key of ['introEasing', 'zoomEasing']) {
        const field = holder.querySelector('[data-easing="' + key + '"]');
        field.disabled = auto.checked;
        field.style.opacity = auto.checked ? '.5' : '1';
      }
    };
    auto.addEventListener('change', syncAuto);
    syncAuto();
    parent.append(holder);
  }
  function read(settings) {
    const next = { ...settings, autoZoom: holder.querySelector('[name="autoZoom"]').checked };
    let first = null;
    for (const [key] of definitions) {
      if (next.autoZoom && ['introEasing', 'zoomEasing'].includes(key)) continue;
      const input = holder.querySelector('[name="' + key + '"]'),
        error = holder.querySelector('#' + key + 'Error');
      try {
        DavviEasing.parse(input.value);
        next[key] = input.value.trim();
        error.textContent = '';
        input.removeAttribute('aria-invalid');
      } catch (e) {
        error.textContent = e.message;
        input.setAttribute('aria-invalid', 'true');
        first ||= input;
      }
    }
    if (first) {
      first.focus();
      return null;
    }
    return next;
  }
  window.DavviEasingControls = { mount, read };
})();
