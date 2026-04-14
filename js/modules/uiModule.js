import { physics } from "../core/physics.js";
import { navbarModule } from "./navbarModule.js";
import { utils } from "../utils/utils.js";

import { ctaMagneticModule } from "./ctaMagneticModule.js";
import { heroCalendarModule } from "./heroCalendarModule.js";

export const uiModule = {
  navbar: null,
  hero: null,
  pricingTabs: null,
  pricingContents: null,
  year: null,

  cacheDOM() {
    this.navbar = document.querySelector(".navbar");
    this.hero = document.querySelector(".hero");
    this.pricingTabs = [...document.querySelectorAll(".pricing-tab")];
    this.pricingContents = [...document.querySelectorAll(".pricing-content")];
    this.year = document.getElementById("year");
  },

  bindHeroClickBehavior() {
    this.hero?.addEventListener("click", () => {
      if (!this.navbar) return;

      navbarModule.startAnimation();
    });
  },

  bindPricingTabs() {
    this.pricingTabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        this.pricingTabs.forEach((t) => t.classList.remove("active"));
        this.pricingContents.forEach((c) => c.classList.remove("active"));

        tab.classList.add("active");
        document.getElementById(tab.dataset.tab)?.classList.add("active");
      });
    });
  },

  setInitialVisualState() {
    if (this.hero) {
      this.hero.style.setProperty(
        "--hero-brightness",
        1 - Math.min(window.scrollY / window.innerHeight, 1) *
        physics.values.heroBrightnessScrollFactor
      );
    }

    if (this.year) {
      this.year.textContent = String(new Date().getFullYear());
    }
  },

  init() {
    this.cacheDOM();

    ctaMagneticModule.init();
    heroCalendarModule.init();

    this.bindHeroClickBehavior();
    this.bindPricingTabs();
    this.setInitialVisualState();
  }
};
