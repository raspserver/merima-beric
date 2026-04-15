// scrollSectionHintPositionModule.js

import { utils } from "../utils/utils.js";

// ---------------------------------------------------------------------
// POSITIONIERUNG DER SCROLL-HINT-SPALTE
// ---------------------------------------------------------------------

export const scrollSectionHintPositionModule = {
  init() {
    this.update();

    window.addEventListener("resize", () => this.update());
    window.addEventListener("orientationchange", () =>
      setTimeout(() => this.update(), 120)
    );
    window.addEventListener("pageshow", () =>
      requestAnimationFrame(() => this.update())
    );

    document.fonts?.ready?.then(() => this.update());
  },
	
  update() {
    const hintsRoot = document.querySelector(".scroll-section-hints");
    if (!hintsRoot) return;

    const referenceColumn =
      document.querySelector("#about .about-text") ||
      document.querySelector("#about .container") ||
      document.querySelector("section .container");

    if (!referenceColumn) return;

    const contentLeft = referenceColumn.getBoundingClientRect().left;
    const hintCenterX = contentLeft / 2;

    document.documentElement.style.setProperty(
      "--scroll-hint-column-center",
      `${hintCenterX}px`
    );

    document.documentElement.style.setProperty(
      "--gallery-hint-lane-width",
      `${contentLeft}px`
    );

    hintsRoot.style.setProperty(
      "--scroll-hint-column-center",
      `${hintCenterX}px`
    );

    const gallerySlider = document.querySelector(".gallery-slider");
    if (!gallerySlider) return;

    const sliderRect = gallerySlider.getBoundingClientRect();
    const laneLeftInsideSlider = utils.clamp(
      hintCenterX - sliderRect.left,
      0,
      sliderRect.width
    );

    gallerySlider.style.setProperty(
      "--gallery-lane-left",
      `${laneLeftInsideSlider}px`
    );
  }
};
