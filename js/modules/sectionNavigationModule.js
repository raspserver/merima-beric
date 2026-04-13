// ---------------------------------------------------------------------
// javascript Verzeichnisstruktur
// ---------------------------------------------------------------------
//	/js
//		/core
//			/physics.js
//			/scrollEngine.js
//			/sectionSelector.js
//			/settings.js
//			/springs.js
//			/state.js
//		/modules
//			/navbarModule.js
//			/scrollSectionHintModule.js
//			/sectionNavigationModule.js
//			/uiModule.js
//		/utils
//			/cssVar.js
//			/helper.js
//			/prewarmUtils.js
//			/utils.js
//		/main.js
// ---------------------------------------------------------------------

import { scrollEngine }		from	"../core/scrollEngine.js";
import { state }			from	"../core/state.js";

// ---------------------------------------------------------------------
// SECTION-NAVIGATION
// ---------------------------------------------------------------------

export const sectionNavigationModule = {
	  
	 buildOrderedSections() {
	  state.orderedSections = [
		document.getElementById("home"),
		document.getElementById("about"),
		document.getElementById("gallery"),
		document.getElementById("services"),
		document.getElementById("pricing"),
		document.getElementById("testimonials"),
		document.getElementById("contact"),
	  ].filter(Boolean);
	},	  

    getSectionIndex(sectionEl) {
      return state.orderedSections.findIndex((section) => section === sectionEl);
    },

    getSectionHomeY(sectionEl, navMode = "down") {
      return scrollEngine.getTargetY(sectionEl, navMode);
    },

    isAtOwnSectionHomePosition(sectionEl, tolerance = 4) {
      const currentY = window.scrollY;

      return (
        Math.abs(currentY - this.getSectionHomeY(sectionEl, "down")) <= tolerance ||
        Math.abs(currentY - this.getSectionHomeY(sectionEl, "up-section")) <= tolerance
      );
    },

    navigateToSectionHome(sectionEl) {
      const currentY = window.scrollY;
      const downHomeY = this.getSectionHomeY(sectionEl, "down");
      const upHomeY = this.getSectionHomeY(sectionEl, "up-section");

      const mode =
        Math.abs(currentY - upHomeY) < Math.abs(currentY - downHomeY)
          ? "up-section"
          : "down";

      scrollEngine.goTo(sectionEl, mode);
    },

    navigateSection(sectionEl, direction, allowPrev = true) {
      if (!sectionEl) return;

      const currentIndex = this.getSectionIndex(sectionEl);
      if (currentIndex === -1) return;

      if (direction === "next") {
        if (sectionEl.id === "contact") {
          scrollEngine.scrollToPageBottom();
          return;
        }

        const nextTarget = state.orderedSections[currentIndex + 1] || null;
        if (nextTarget) scrollEngine.goTo(nextTarget, "down");
        return;
      }

      if (direction === "prev" && allowPrev) {
        const prevTarget = state.orderedSections[currentIndex - 1] || null;
        if (prevTarget) scrollEngine.goTo(prevTarget, "up-section");
      }
    },

    bindSectionNavigator(
      triggerEl,
      sectionEl,
      { allowPrev = true, headSelector = null } = {}
    ) {
      if (!triggerEl || !sectionEl) return;

      let clickTimer = null;

      const isInteractiveElement = (target) =>
        !!target.closest(
          'a, button, input, textarea, select, option, label, video, iframe, [role="button"], .pricing-tab, .cta-button'
        );

      const isInsideHeadArea = (event) => {
        if (!headSelector) return true;

        const head = sectionEl.querySelector(headSelector);
        if (!head) return false;

        const rect = head.getBoundingClientRect();
        return event.clientY >= rect.top && event.clientY <= rect.bottom;
      };

      triggerEl.addEventListener("click", (e) => {
        if (isInteractiveElement(e.target) || !isInsideHeadArea(e)) return;

        e.preventDefault();
        e.stopPropagation();

        if (!this.isAtOwnSectionHomePosition(sectionEl)) {
          if (clickTimer) clearTimeout(clickTimer);
          clickTimer = null;
          this.navigateToSectionHome(sectionEl);
          return;
        }

        if (clickTimer) clearTimeout(clickTimer);

        clickTimer = setTimeout(() => {
          clickTimer = null;
          this.navigateSection(sectionEl, "next", allowPrev);
        }, SETTINGS.thresholds.sectionNavClickDelay);
      });

      triggerEl.addEventListener("dblclick", (e) => {
        if (isInteractiveElement(e.target) || !isInsideHeadArea(e)) return;

        e.preventDefault();
        e.stopPropagation();

        if (clickTimer) clearTimeout(clickTimer);
        clickTimer = null;

        if (this.isAtOwnSectionHomePosition(sectionEl)) {
          this.navigateSection(sectionEl, "prev", allowPrev);
        }
      });

      triggerEl.addEventListener("keydown", (e) => {
        if (headSelector) return;
        if (e.key !== "Enter" && e.key !== " ") return;

        e.preventDefault();

        if (!this.isAtOwnSectionHomePosition(sectionEl)) {
          this.navigateToSectionHome(sectionEl);
          return;
        }

        this.navigateSection(sectionEl, "next", allowPrev);
      });
    },

    bindDirectScrollTargets() {
      document.querySelectorAll("[data-scroll-target]").forEach((triggerEl) => {
        const targetSelector = triggerEl.getAttribute("data-scroll-target");
        const forcedMode = triggerEl.getAttribute("data-scroll-mode") || "down";

        if (!targetSelector) return;

        const go = () => scrollEngine.goTo(targetSelector, forcedMode);

        triggerEl.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          go();
        });

        triggerEl.addEventListener("keydown", (e) => {
          if (e.key !== "Enter" && e.key !== " ") return;

          e.preventDefault();
          e.stopPropagation();
          go();
        });
      });
    },

    bindEvents() {
      document.querySelectorAll("section").forEach((section) => {
        if (section.classList.contains("hero")) return;

        this.bindSectionNavigator(section, section, {
          allowPrev: true,
          headSelector: ".section-scroll-head",
        });
      });

      this.bindDirectScrollTargets();
    },
  };

