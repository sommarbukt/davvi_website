(function () {
  'use strict';
  const named = { linear: (t) => t, smoothstep: (t) => t * t * (3 - 2 * t) };
  const families = {
    Sine: (t) => 1 - Math.cos((t * Math.PI) / 2),
    Quad: (t) => t * t,
    Cubic: (t) => t * t * t,
    Quart: (t) => t ** 4,
    Quint: (t) => t ** 5,
    Expo: (t) => (t === 0 ? 0 : 2 ** (10 * t - 10)),
    Circ: (t) => 1 - Math.sqrt(1 - t * t),
  };
  for (const [name, fn] of Object.entries(families)) {
    named['easeIn' + name] = fn;
    named['easeOut' + name] = (t) => 1 - fn(1 - t);
    named['easeInOut' + name] = (t) => (t < 0.5 ? fn(2 * t) / 2 : 1 - fn(2 - 2 * t) / 2);
  }
  const aliases = {
    ease: 'cubic-bezier(.25,.1,.25,1)',
    'ease-in': 'cubic-bezier(.42,0,1,1)',
    'ease-out': 'cubic-bezier(0,0,.58,1)',
    'ease-in-out': 'cubic-bezier(.42,0,.58,1)',
  };
  function parse(value) {
    if (typeof value !== 'string')
      throw Error('Bitte einen Kurvennamen oder cubic-bezier(x1, y1, x2, y2) eingeben.');
    value = value.trim();
    if (Object.hasOwn(named, value)) return named[value];
    value = Object.hasOwn(aliases, value) ? aliases[value] : value;
    const match = /^cubic-bezier\(\s*([^()]+)\s*\)$/.exec(value);
    if (!match)
      throw Error(
        'Unbekannte Kurve. Beispiel: easeInOutSine oder cubic-bezier(0.22, 0.61, 0.36, 1).',
      );
    const parts = match[1].split(',').map((v) => v.trim());
    if (
      parts.length !== 4 ||
      parts.some((v) => !/^[-+]?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?$/i.test(v))
    )
      throw Error('Bitte genau vier Zahlen mit Dezimalpunkt eingeben.');
    const [x1, y1, x2, y2] = parts.map(Number);
    if ([x1, y1, x2, y2].some((v) => !Number.isFinite(v) || v < 0 || v > 1))
      throw Error(
        'Alle vier Bezier-Werte müssen zwischen 0 und 1 liegen, damit die Bewegung innerhalb der Bildgrenzen bleibt.',
      );
    const sample = (u, a, b) => 3 * (1 - u) * (1 - u) * u * a + 3 * (1 - u) * u * u * b + u * u * u;
    // Solve x(u)=time before evaluating y(u); time is not the Bezier parameter.
    return (t) => {
      if (t <= 0) return 0;
      if (t >= 1) return 1;
      let lo = 0,
        hi = 1;
      for (let i = 0; i < 40; i++) {
        const u = (lo + hi) / 2;
        if (sample(u, x1, x2) < t) lo = u;
        else hi = u;
      }
      return sample((lo + hi) / 2, y1, y2);
    };
  }
  window.DavviEasing = {
    parse,
    names: [...Object.keys(named), ...Object.keys(aliases)],
    defaults: {
      autoZoom: false,
      fadeEasing: 'ease-in',
      introEasing: 'easeOutCubic',
      zoomEasing: 'linear',
      panEasing: 'linear',
    },
  };
})();
