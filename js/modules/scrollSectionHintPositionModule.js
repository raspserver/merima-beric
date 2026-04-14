// ---------------------------------------------------------------------
// javascript Verzeichnisstruktur
// ---------------------------------------------------------------------
//	/js
//		/core
//			/bindUserScrollInterrupts.js
//			/physics.js
//			/scrollEngine.js
//			/sectionSelector.js
//			/settings.js
//			/springs.js
//			/state.js
//		/modules
//			/contactMapModule.js
//			/galleryModule.js
//			/navbarModule.js
//			/performanceModule.js
//			/scrollSectionHintModule.js
//			/scrollSectionHintPositionModule.js
//			/sectionNavigationModule.js
//			/uiModule.js
//		/utils
//			/cssVar.js
//			/helper.js
//			/prewarmUtils.js
//			/utils.js
//		/main.js
// ---------------------------------------------------------------------

import { clamp }		from	'../utils/helper.js';

// ---------------------------------------------------------------------
// POSITIONIERUNG DER SCROLL-HINT-SPALTE
// ---------------------------------------------------------------------

export const scrollSectionHintPositionModule = {
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
      const laneLeftInsideSlider = clamp(
        hintCenterX - sliderRect.left,
        0,
        sliderRect.width
      );

      gallerySlider.style.setProperty(
        "--gallery-lane-left",
        `${laneLeftInsideSlider}px`
      );
    },

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
    }
  };
