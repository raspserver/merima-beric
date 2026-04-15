// prewarmUtils.js

import { state } from "../core/state.js";

// ---------------------------------------------------------------------
// PREWARM UTILITY (für HeroCalendar + ContactMap)
// ---------------------------------------------------------------------

export const prewarmUtils = {
  bind({
    element,
    stateKeyObserver,
    stateKeyPrewarmed,
    getDistancePx,
    onPrewarm,
  }) {
    if (!element) return;
    if (state.ui[stateKeyObserver] || state.ui[stateKeyPrewarmed]) return;

    const distance = typeof getDistancePx === "function"
      ? getDistancePx()
      : 0;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting) return;

        onPrewarm?.();

        observer.disconnect();
        state.ui[stateKeyObserver] = null;
      },
      {
        root: null,
        threshold: 0,
        rootMargin: `${distance}px 0px ${distance}px 0px`,
      }
    );

    observer.observe(element);
    state.ui[stateKeyObserver] = observer;
  }
};
