
// ---------------------------------------------------------------------
// CSS-VARIABLEN
// ---------------------------------------------------------------------
export const cssVar = {
    raw(name) {
      return getComputedStyle(document.documentElement)
        .getPropertyValue(name)
        .trim();
    },

    number(name, fallback) {
      const value = parseFloat(this.raw(name));
      return Number.isFinite(value) ? value : fallback;
    },

    remPx(name, fallbackPx) {
      const raw = this.raw(name);
      if (!raw) return fallbackPx;

      if (raw.endsWith("rem")) {
        const rem = parseFloat(raw);
        const rootFont = parseFloat(
          getComputedStyle(document.documentElement).fontSize
        );
        return Number.isFinite(rem) && Number.isFinite(rootFont)
          ? rem * rootFont
          : fallbackPx;
      }

      const px = parseFloat(raw);
      return Number.isFinite(px) ? px : fallbackPx;
    },

    timeMs(name, fallbackMs) {
      const raw = this.raw(name);
      if (!raw) return fallbackMs;

      if (raw.endsWith("ms")) return parseFloat(raw) || fallbackMs;
      if (raw.endsWith("s")) return (parseFloat(raw) || 0) * 1000 || fallbackMs;

      const value = parseFloat(raw);
      return Number.isFinite(value) ? value : fallbackMs;
    },

    lengthPx(name, fallbackPx) {
      const raw = this.raw(name);
      if (!raw) return fallbackPx;

      const probe = document.createElement("div");
      probe.style.position = "absolute";
      probe.style.visibility = "hidden";
      probe.style.pointerEvents = "none";
      probe.style.height = raw;
      document.body.appendChild(probe);

      const px = probe.getBoundingClientRect().height;
      probe.remove();

      return Number.isFinite(px) && px > 0 ? px : fallbackPx;
    },
  };


