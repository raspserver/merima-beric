// performanceModule.js

import { utils } from "../utils/utils.js";

// ---------------------------------------------------------------------
// PERFORMANCE-MODUL
// ---------------------------------------------------------------------

export const performanceModule = {
  fpsSampleFrames: 45,
  lowFpsThreshold: 42,

  applyInitialProfile() {
    if (utils.getPerformanceProfile().lowEnd) {
      document.documentElement.classList.add("low-end");
    }
  },

  measureInitialFPS() {
    if (utils.prefersReducedMotion()) return;

    let frames = 0;
    let start = 0;

    const sample = (now) => {
      if (!start) start = now;
      frames += 1;

      if (frames < this.fpsSampleFrames) {
        requestAnimationFrame(sample);
        return;
      }

      const fps = frames / ((now - start) / 1000);

      if (fps < this.lowFpsThreshold) {
        document.documentElement.classList.add("low-fps");
      }
    };

    requestAnimationFrame(sample);
  },

  init() {
    this.applyInitialProfile();
    window.addEventListener("load", () => this.measureInitialFPS());
  }
};
