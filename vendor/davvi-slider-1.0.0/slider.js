/* Framework-independent animation engine. All time values are seconds. */
(function () {
  'use strict';
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  class DavviSlider {
    constructor(root, settings, slides, onUpdate = () => {}) {
      const valid = DavviConfig.validate({ devMode: false, settings, slides });
      root.querySelector('.hero-bottom').hidden = false;
      this.root = root;
      this.settings = valid.settings;
      this.slides = valid.slides;
      this.onUpdate = onUpdate;
      this.curves = Object.fromEntries(
        ['fadeEasing', 'introEasing', 'zoomEasing', 'panEasing'].map((key) => [
          key,
          DavviEasing.parse(this.settings[key]),
        ]),
      );
      this.elapsed = 0;
      this.manualPaused = false;
      this.last = null;
      this.cache = new Map();
      this.disposed = false;
      this.motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
      this.reduced = this.motionPreference.matches;
      this.preferenceChanged = () => {
        this.reduced = this.motionPreference.matches;
        if (this.reduced) this.manualPaused = true;
        this.last = null;
        this.render();
      };
      this.motionPreference.addEventListener('change', this.preferenceChanged);
      this.manualPaused = this.reduced;
      // Keep all overlapping images below the controls, even for long transitions.
      root.querySelector('.layers').style.zIndex = '0';
      this.layers = [0, 1].map(() => {
        const el = document.createElement('div');
        el.className = 'slide-layer';
        const img = new Image();
        img.alt = '';
        el.append(img);
        root.querySelector('.layers').append(el);
        return { el, img, source: null };
      });
      this.visibility = () => {
        this.last = null;
      };
      document.addEventListener('visibilitychange', this.visibility);
      this.resize = () => {
        this.layout();
        this.render();
      };
      window.addEventListener('resize', this.resize);
      this.observer = new ResizeObserver(() => this.render());
      this.observer.observe(root);
      this.layout();
      this.render();
      this.frame = requestAnimationFrame((t) => this.tick(t));
    }
    layout() {
      const s = this.settings,
        width = window.innerWidth;
      const next =
        width <= s.phoneBreakpoint ? 'phone' : width <= s.tabletBreakpoint ? 'tablet' : 'desktop';
      if (this.mode && next !== this.mode) {
        const oldDuration = s[this.mode].duration,
          newDuration = s[next].duration;
        const oldTransition = Math.min(s.transition, oldDuration - 0.1),
          newTransition = Math.min(s.transition, newDuration - 0.1);
        const oldStride = oldDuration - oldTransition,
          newStride = newDuration - newTransition;
        const index = Math.floor(this.elapsed / oldStride),
          local = this.elapsed - index * oldStride;
        const mapped =
          oldStride > oldTransition && newStride > newTransition
            ? local < oldTransition
              ? (local / oldTransition) * newTransition
              : newTransition +
                ((local - oldTransition) / (oldStride - oldTransition)) *
                  (newStride - newTransition)
            : (local / oldStride) * newStride;
        this.elapsed = index * newStride + mapped;
      }
      this.mode = next;
      const c = s[next];
      this.root.style.margin = `${c.margin}px`;
      this.root.style.height = `${Math.max(180, (window.innerHeight * c.height) / 100)}px`;
    }
    source(index) {
      const slide = this.slides[index],
        variant = slide[this.mode];
      // A broken responsive asset falls back to its desktop image as well.
      return variant && !this.cache.get(variant)?.failed ? variant : slide.desktop;
    }
    asset(src) {
      if (!this.cache.has(src)) {
        const asset = { ready: false, failed: false, image: new Image(), timer: null };
        this.cache.set(src, asset);
        const fail = () => {
          if (this.disposed || asset.ready || asset.failed) return;
          clearTimeout(asset.timer);
          asset.failed = true;
          this.render();
        };
        asset.timer = setTimeout(fail, 20000);
        asset.image.onload = async () => {
          try {
            await asset.image.decode();
          } catch (_) {
            fail();
            return;
          }
          if (this.disposed || asset.failed) return;
          clearTimeout(asset.timer);
          if (!asset.image.naturalWidth || !asset.image.naturalHeight) {
            fail();
            return;
          }
          asset.ready = true;
          this.render();
        };
        asset.image.onerror = fail;
        asset.image.src = src;
      }
      return this.cache.get(src);
    }
    trimCache(keep) {
      // Bound retained decoded images on large galleries; failed entries remain lightweight markers.
      for (const [source, asset] of this.cache) {
        if (this.cache.size <= 24) break;
        if (asset.ready && !keep.has(source)) {
          asset.image.onload = null;
          asset.image.onerror = null;
          this.cache.delete(source);
        }
      }
    }
    recoverImages() {
      // A failed desktop image cannot hold the whole sequence indefinitely.
      const playable = this.slides.filter((slide) => !this.cache.get(slide.desktop)?.failed);
      if (playable.length !== this.slides.length) {
        this.slides = playable;
        this.elapsed = 0;
        this.last = null;
        this.layers.forEach((layer) => {
          layer.el.style.opacity = 0;
        });
      }
      if (!this.slides.length) {
        const status = this.root.querySelector('#status');
        if (status)
          status.textContent =
            'Keine Bilder verfügbar. Bitte Bildpfade und Verbindung prüfen und die Seite neu laden.';
        this.root.querySelector('.hero-bottom').hidden = true;
        return false;
      }
      return true;
    }
    geometry(asset, slide, zoom, progress) {
      const w = this.root.clientWidth,
        h = this.root.clientHeight;
      const iw = asset.image.naturalWidth,
        ih = asset.image.naturalHeight;
      const cover = Math.max(w / iw, h / ih),
        bw = iw * cover,
        bh = ih * cover;
      const axis =
        Math.abs(bw - w) < 0.1 && Math.abs(bh - h) < 0.1
          ? w >= h
            ? 'x'
            : 'y'
          : bw / w > bh / h
            ? 'x'
            : 'y';
      const overflow =
        axis === 'x' ? (bw * this.settings.endZoom - w) / w : (bh * this.settings.endZoom - h) / h;
      const panning = slide.panning && overflow * 100 >= this.settings.panThreshold;
      const start =
        axis === 'x' ? (slide.horizontal === 'right' ? 1 : 0) : slide.vertical === 'bottom' ? 1 : 0;
      const position = panning ? start + (1 - 2 * start) * progress : 0.5;
      return {
        bw,
        bh,
        x: -(bw * zoom - w) * (axis === 'x' ? position : 0.5),
        y: -(bh * zoom - h) * (axis === 'y' ? position : 0.5),
        axis,
        panning,
      };
    }
    state() {
      const duration = this.settings[this.mode].duration;
      const n = this.slides.length;
      const transition = Math.min(this.settings.transition, duration - 0.1);
      const stride = duration - transition;
      const sequence = Math.floor(this.elapsed / stride);
      return {
        duration,
        transition,
        stride,
        sequence,
        index: sequence % n,
        local: this.elapsed - sequence * stride,
      };
    }
    active() {
      const { duration, stride, sequence, local } = this.state(),
        active = [];
      // Support long overlaps too: more than two images can be alive when T > D/2.
      for (let offset = 0; offset <= sequence && local + offset * stride < duration; offset++) {
        active.push({
          index: (sequence - offset) % this.slides.length,
          age: local + offset * stride,
          slot: offset === 0 ? 1 : offset === 1 ? 0 : offset,
        });
      }
      return active;
    }
    motion(age) {
      const { duration, transition } = this.state(),
        s = this.settings;
      let zoom, alpha;
      if (age < transition) {
        const t = clamp(age / transition, 0, 1);
        // Limit the Hermite tangent to prevent overshoot when the two zoom levels coincide.
        const tangent = Math.max(
          -3 * (s.startZoom - s.middleZoom),
          ((s.endZoom - s.middleZoom) / (duration - transition)) * transition,
        );
        zoom = s.autoZoom
          ? (2 * t * t * t - 3 * t * t + 1) * s.startZoom +
            (-2 * t * t * t + 3 * t * t) * s.middleZoom +
            (t * t * t - t * t) * tangent
          : s.startZoom + (s.middleZoom - s.startZoom) * this.curves.introEasing(t);
        alpha = this.curves.fadeEasing(t);
      } else {
        const t = clamp((age - transition) / (duration - transition), 0, 1);
        zoom =
          s.middleZoom + (s.endZoom - s.middleZoom) * (s.autoZoom ? t : this.curves.zoomEasing(t));
        alpha = 1;
      }
      const pan = this.curves.panEasing(clamp(age / duration, 0, 1));
      return this.reduced ? { zoom: s.endZoom, pan: 0.5, alpha: 1 } : { zoom, pan, alpha };
    }
    paint(layer, index, zoom, pan, opacity) {
      const src = this.source(index),
        asset = this.asset(src);
      if (!asset.ready) return false;
      if (layer.source !== src) {
        layer.img.src = src;
        layer.source = src;
      }
      const g = this.geometry(asset, this.slides[index], zoom, pan);
      layer.img.style.width = `${g.bw}px`;
      layer.img.style.height = `${g.bh}px`;
      layer.img.style.transform = `translate3d(${g.x}px,${g.y}px,0) scale(${zoom})`;
      layer.el.style.opacity = opacity;
      return g;
    }
    render() {
      if (this.disposed || !this.recoverImages()) return;
      const { stride, index, local } = this.state();
      const active = this.active();
      // Decode the next image in the background; never run time past an unavailable slide.
      this.asset(this.source((index + 1) % this.slides.length));
      const status = this.root.querySelector('#status');
      const assets = active.map((item) => this.asset(this.source(item.index)));
      if (assets.some((asset) => !asset.ready)) {
        if (status)
          status.textContent = assets.some((asset) => asset.failed)
            ? 'Dieses Bild konnte nicht geladen werden. Bitte Bildpfad prüfen.'
            : '';
        return;
      }
      if (status) status.textContent = '';
      const visibleSlots = new Set(active.map((item) => item.slot));
      this.layers.forEach((layer, index) => {
        if (!visibleSlots.has(index)) layer.el.style.opacity = 0;
      });
      let g;
      active.forEach((item, offset) => {
        if (!this.layers[item.slot]) {
          const el = document.createElement('div'),
            img = new Image();
          el.className = 'slide-layer';
          img.alt = '';
          el.append(img);
          this.root.querySelector('.layers').append(el);
          this.layers[item.slot] = { el, img, source: null };
        }
        const layer = this.layers[item.slot],
          motion = this.motion(item.age);
        layer.el.style.zIndex = active.length - offset;
        const geometry = this.paint(layer, item.index, motion.zoom, motion.pan, motion.alpha);
        if (offset === 0) g = geometry;
      });
      this.trimCache(
        new Set([
          ...active.map((item) => this.source(item.index)),
          this.source((index + 1) % this.slides.length),
        ]),
      );
      const { zoom, pan } = this.motion(local);
      this.onUpdate({
        index,
        count: this.slides.length,
        mode: this.mode,
        progress: (this.elapsed % (stride * this.slides.length)) / (stride * this.slides.length),
        pan,
        zoom,
        axis: g.axis,
        panning: g.panning,
        paused: this.manualPaused,
        reduced: this.reduced,
      });
    }
    tick(now) {
      if (this.disposed || !this.recoverImages()) return;
      const before = this.elapsed;
      if (this.last !== null && !document.hidden && !this.manualPaused) {
        const delta = clamp((now - this.last) / 1000, 0, 0.1),
          { index, stride, sequence, local } = this.state();
        if (this.active().every((item) => this.asset(this.source(item.index)).ready)) {
          const crosses = local + delta >= stride;
          if (!crosses || this.asset(this.source((index + 1) % this.slides.length)).ready)
            this.elapsed += delta;
          else this.elapsed = sequence * stride + stride - 0.00001;
        }
      }
      this.last = now;
      if (this.elapsed !== before) this.render();
      this.frame = requestAnimationFrame((t) => this.tick(t));
    }
    toggle() {
      this.manualPaused = !this.manualPaused;
      this.last = null;
      this.render();
    }
    destroy() {
      this.disposed = true;
      cancelAnimationFrame(this.frame);
      this.observer.disconnect();
      document.removeEventListener('visibilitychange', this.visibility);
      window.removeEventListener('resize', this.resize);
      this.motionPreference.removeEventListener('change', this.preferenceChanged);
      this.cache.forEach((asset) => {
        clearTimeout(asset.timer);
        asset.image.onload = null;
        asset.image.onerror = null;
      });
      this.cache.clear();
      this.root.querySelector('.layers').replaceChildren();
    }
  }
  window.DavviSlider = DavviSlider;
})();
