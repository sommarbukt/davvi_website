/* Validate every entry point: config file, local storage, form and engine API. */
(function () {
  'use strict';
  function object(value, label) {
    if (!value || typeof value !== 'object' || Array.isArray(value))
      throw Error(label + ' muss ein Objekt sein.');
    return value;
  }
  function number(value, label, min, max) {
    if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max)
      throw Error(label + ': Zahl zwischen ' + min + ' und ' + max + ' erforderlich.');
    return value;
  }
  function boolean(value, label) {
    if (typeof value !== 'boolean') throw Error(label + ': true oder false erforderlich.');
    return value;
  }
  function picture(value, label, optional) {
    if (optional && (value === '' || value === undefined)) return '';
    if (typeof value !== 'string' || !value.trim() || value.length > 2048)
      throw Error(label + ': gültiger Bildpfad erforderlich.');
    const text = value.trim();
    // Reject executable/data URLs, embedded credentials and absolute local file URLs.
    const url = new URL(text, document.baseURI);
    const relative =
      !/^[a-z][a-z0-9+.-]*:/i.test(text) && !text.startsWith('//') && !text.includes('\\');
    if (
      (!['https:', 'http:'].includes(url.protocol) && !(relative && url.protocol === 'file:')) ||
      url.username ||
      url.password
    )
      throw Error(label + ': relativen Bildpfad oder HTTP(S)-URL verwenden.');
    return text;
  }
  function validate(raw) {
    object(raw, 'Konfiguration');
    const devMode = boolean(raw.devMode, 'devMode');
    const source = object(raw.settings, 'settings');
    const s = {};
    for (const [key, min, max] of [
      ['phoneBreakpoint', 320, 1600],
      ['tabletBreakpoint', 321, 2400],
      ['startZoom', 1, 5],
      ['middleZoom', 1, 5],
      ['endZoom', 1, 5],
      ['transition', 0.5, 10],
      ['panThreshold', 0, 100],
    ])
      s[key] = number(source[key], key, min, max);
    if (s.phoneBreakpoint >= s.tabletBreakpoint)
      throw Error('Phone-Breakpoint muss kleiner als Tablet-Breakpoint sein.');
    if (s.startZoom < s.middleZoom || s.middleZoom < s.endZoom)
      throw Error('Zoomwerte müssen Start ≥ Übergang ≥ Ende erfüllen.');
    for (const mode of ['desktop', 'tablet', 'phone']) {
      const entry = object(source[mode], mode);
      s[mode] = {
        height: number(entry.height, mode + '.height', 20, 100),
        margin: number(entry.margin, mode + '.margin', 0, 80),
        duration: number(entry.duration, mode + '.duration', 4, 60),
      };
      const stride = s[mode].duration - s.transition;
      // Bound simultaneous GPU layers for unusually long transitions.
      if (stride < 0.5 || Math.ceil(s[mode].duration / stride) > 12)
        throw Error(
          mode +
            ': Bilddauer muss mindestens 0,5 s länger als der Wechsel sein; maximal 12 überlappende Bilder.',
        );
    }
    s.autoZoom = boolean(source.autoZoom ?? DavviEasing.defaults.autoZoom, 'autoZoom');
    for (const key of ['fadeEasing', 'introEasing', 'zoomEasing', 'panEasing']) {
      const value = source[key] ?? DavviEasing.defaults[key];
      if (typeof value !== 'string' || value.length > 200) throw Error(key + ': ungültige Kurve.');
      DavviEasing.parse(value);
      s[key] = value.trim();
    }
    if (!Array.isArray(raw.slides) || raw.slides.length < 1 || raw.slides.length > 100)
      throw Error('slides benötigt 1 bis 100 Bilder.');
    const slides = raw.slides.map((entry, index) => {
      object(entry, 'Bild ' + (index + 1));
      if (
        !['left', 'right'].includes(entry.horizontal) ||
        !['top', 'bottom'].includes(entry.vertical)
      )
        throw Error('Bild ' + (index + 1) + ': ungültiger Startpunkt.');
      return {
        desktop: picture(entry.desktop, 'Desktopbild ' + (index + 1), false),
        tablet: picture(entry.tablet, 'Tabletbild ' + (index + 1), true),
        phone: picture(entry.phone, 'Phonebild ' + (index + 1), true),
        horizontal: entry.horizontal,
        vertical: entry.vertical,
        panning: boolean(entry.panning, 'panning'),
      };
    });
    // Explicit projection keeps unknown keys and prototype-shaped input out of the runtime.
    return { devMode, settings: s, slides };
  }
  window.DavviConfig = { validate };
})();
