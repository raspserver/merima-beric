// uiModule.js

import { physics } from "../core/physics.js";
import { state } from "../core/state.js";
import { navbarModule } from "./navbarModule.js";
import { utils } from "../utils/utils.js";

// ---------------------------------------------------------------------
// UI-MODUL PRICING TABS CLICK BEHAVIOR
// ---------------------------------------------------------------------

export const uiModule = {
  init() {
    this.cacheDOM();
    this.bindHeroClickBehavior();
    this.bindPricingTabs();
    this.setInitialVisualState();
  },

  cacheDOM() {
    this.navbar = document.querySelector(".navbar");
    this.hero = document.querySelector(".hero");
    this.pricingTabs = [...document.querySelectorAll(".pricing-tab")];
    this.pricingContents = [...document.querySelectorAll(".pricing-content")];
    this.year = document.getElementById("year");
  },

  bindHeroClickBehavior() {
    this.hero?.addEventListener("click", (e) => {
      if (!this.navbar || (utils.isMobileViewport() && navbarModule.isOpen())) {
        return;
      }

      if (state.ui.heroCalendarAnimating) {
        return;
      }

      if (
        state.ui.heroCalendarOpen &&
        (e.target.closest("#hero-calendar") || e.target.closest("#hero-fullcalendar"))
      ) {
        return;
      }

      if (
        e.target.closest(".cta-button") ||
        e.target.closest("#hero-calendar") ||
        e.target.closest("#hero-fullcalendar")
      ) {
        return;
      }

      const visible = parseFloat(
        getComputedStyle(this.navbar).getPropertyValue("--nav-visible")
      );

      const openManually = visible < 0.5;

      state.nav.manualOpen = openManually;
      state.nav.visible.target = openManually ? 1 : 0;
      state.nav.compact.target = openManually ? 1 : 0;
      state.nav.surface.target = openManually ? 1 : 0;
      state.nav.gestureStretch.target = 0;

      navbarModule.startAnimation();
    });
  },

  bindPricingTabs() {
    this.pricingTabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        if (utils.isMobileViewport() && navbarModule.isOpen()) return;

        this.pricingTabs.forEach((item) => item.classList.remove("active"));
        this.pricingContents.forEach((item) => item.classList.remove("active"));

        tab.classList.add("active");
        document.getElementById(tab.dataset.tab)?.classList.add("active");
      });
    });
  },

  setInitialVisualState() {
    if (this.hero) {
      this.hero.style.setProperty(
        "--hero-brightness",
        1 -
          Math.min(window.scrollY / window.innerHeight, 1) *
            physics.values.heroBrightnessScrollFactor
      );
    }

    if (this.navbar && utils.prefersReducedMotion()) {
      utils.setVars(this.navbar, {
        "--nav-visible": 1,
        "--nav-compact": 1,
        "--nav-surface": 1,
        "--nav-height-progress": 1,
        "--nav-gesture-stretch": "0px",
      });
    }

    if (this.year) {
      this.year.textContent = String(new Date().getFullYear());
    }
  }
};
