import { physics }					from	"./physics.js";
import { state }					from	"./state.js";

import { cssVar }					from	"../utils/cssVar.js";
import { clamp }					from	'../utils/helper.js';
import { utils }					from	"../utils/utils.js";

import { navbarModule }				from	'../modules/navbarModule.js';
import { scrollSectionHintModule }	from	'../modules/scrollSectionHintModule.js';

// ---------------------------------------------------------------------
// SCROLL-ENGINE
// ---------------------------------------------------------------------

export const scrollEngine = {
	navbar: null,
	hero: null,
	
	cacheDOM() {
		this.navbar = document.querySelector(".navbar");
		this.hero = document.querySelector(".hero");
	},
	
	
    easeOutElastic(t) {
      if (t === 0) return 0;
      if (t === 1) return 1;

      const {
        scrollElasticDecay,
        scrollElasticFrequency,
        scrollElasticPhaseShift,
      } = physics.values;

      const c = (2 * Math.PI) / 3;

      return (
        Math.pow(2, -scrollElasticDecay * t) *
          Math.sin((t * scrollElasticFrequency - scrollElasticPhaseShift) * c) +
        1
      );
    },

    getTargetNavOffset(navMode = null) {
      if (!this.navbar) return 0;

      const navMax = cssVar.number("--nav-height-max", 78);
      const navMin = cssVar.number("--nav-height-min", 58);

      return navMode === "down" || navMode === "up-section"
        ? navMin
        : this.navbar.offsetHeight || navMax;
    },

    getModeForTarget(target) {
      if (!target) return "down";
      if (target.classList?.contains("hero")) return "up-section";

      const currentY = window.scrollY;
      const targetY = target.getBoundingClientRect().top + window.pageYOffset;
      return targetY < currentY ? "up-section" : "down";
    },

    getSurfaceForMode(mode) {
      return mode === "up-section" ? physics.values.NAV_SURFACE_UP : 1;
    },

    getTargetY(target, navMode = null) {
      if (!target) return 0;

      const isHeroTarget = target.classList?.contains("hero");
      const isFooterTarget = target.tagName?.toLowerCase() === "footer";

      const effectiveNavMode =
        isHeroTarget && navMode === "up-section" ? "hero-top" : navMode;

      const navOffset =
        isHeroTarget || isFooterTarget
          ? 0
          : this.getTargetNavOffset(effectiveNavMode);

      const inset = target.matches?.(SECTION_SELECTOR)
        ? physics.values.sectionScrollInset
        : 0;

      const y = isHeroTarget
        ? 0
        : target.getBoundingClientRect().top + window.pageYOffset - navOffset + inset;

      return clamp(y, 0, utils.getMaxScrollY());
    },

    hardSnap(y) {
      window.scrollTo(0, y);
      requestAnimationFrame(() => window.scrollTo(0, y));
    },

    animateWindowScrollTo(targetY, { onComplete } = {}) {
      if (state.scroll.activeAnimation) {
        cancelAnimationFrame(state.scroll.activeAnimation);
        state.scroll.activeAnimation = null;
      }

      const scrollToken = ++state.scroll.activeToken;
      const maxScrollY = utils.getMaxScrollY();
      const clampedTargetY = clamp(targetY, 0, maxScrollY);
      const startY = window.scrollY;
      const distance = clampedTargetY - startY;
      const absDistance = Math.abs(distance);

      if (absDistance < 1) {
        this.hardSnap(clampedTargetY);
        onComplete?.(clampedTargetY);
        return;
      }

      const duration = utils.prefersReducedMotion()
        ? Math.min(900, Math.max(350, absDistance * 0.35))
        : Math.min(
            physics.values.scrollDurationMax,
            Math.max(
              physics.values.scrollDurationMin,
              absDistance * physics.values.scrollDurationFactor
            )
          );

      const startTime = performance.now();

      const frame = (now) => {
        if (scrollToken !== state.scroll.activeToken) return;

        const elapsed = now - startTime;
        const t = Math.min(elapsed / duration, 1);
        const eased = utils.prefersReducedMotion() ? t : this.easeOutElastic(t);
        const nextY = clamp(startY + distance * eased, 0, maxScrollY);

        window.scrollTo(0, nextY);

        if (t < 1) {
          state.scroll.activeAnimation = requestAnimationFrame(frame);
          return;
        }

        this.hardSnap(clampedTargetY);
        state.scroll.activeAnimation = null;
        onComplete?.(clampedTargetY);
      };

      state.scroll.activeAnimation = requestAnimationFrame(frame);
    },

    clearTopSettle() {
      state.scroll.topSettleRaf = utils.clearRaf(state.scroll.topSettleRaf);
      state.scroll.topSettleTimeout = utils.clearTimer(
        state.scroll.topSettleTimeout
      );
    },

    settleToTop({ onDone } = {}) {
      this.clearTopSettle();

      let stableFrames = 0;
      let lastY = -1;
      const startedAt = performance.now();

      const tick = () => {
        window.scrollTo(0, 0);
        const y = window.scrollY;

        if (y <= 0) {
          stableFrames = lastY === 0 ? stableFrames + 1 : 1;
        } else {
          stableFrames = 0;
        }

        lastY = y;

        if (stableFrames >= 3 || performance.now() - startedAt > 1200) {
          window.scrollTo(0, 0);
          this.clearTopSettle();
          onDone?.();
          return;
        }

        state.scroll.topSettleRaf = requestAnimationFrame(tick);
      };

      state.scroll.topSettleTimeout = setTimeout(() => {
        window.scrollTo(0, 0);
        this.clearTopSettle();
        onDone?.();
      }, 1400);

      state.scroll.topSettleRaf = requestAnimationFrame(tick);
    },

    scrollToSection(target, navMode = null) {
      if (!target) return;

      const isHeroTarget = target.classList?.contains("hero");
      const effectiveNavMode =
        isHeroTarget && (navMode === "up-section" || navMode === "hero-top")
          ? "hero-top"
          : navMode;

      scrollSectionHintModule.hideImmediatelyForProgrammaticScroll?.();

      state.scroll.programmatic = true;
      state.scroll.mode = effectiveNavMode;
      state.nav.gestureStretch.target = 0;

      if (effectiveNavMode === "down") state.scrollDirection = "down";
      if (effectiveNavMode === "up-section" || effectiveNavMode === "hero-top") {
        state.scrollDirection = "up";
      }

      navbarModule.startAnimation();

      this.animateWindowScrollTo(this.getTargetY(target, effectiveNavMode), {
        onComplete: () => {
          const finalMode = state.scroll.mode;
          state.scroll.programmatic = false;
          state.lastScrollY = window.scrollY;

          if (finalMode === "down") {
            navbarModule.setTargets(1, 1, 1);
          } else if (finalMode === "up-section") {
            navbarModule.setTargets(1, 1, physics.values.NAV_SURFACE_UP);
          } else if (finalMode === "hero-top") {
            this.settleToTop({
              onDone: () => {
                state.lastScrollY = window.scrollY;

                if (window.scrollY <= 5) {
                  navbarModule.setTargets(0, 0, 0);
                } else {
                  navbarModule.setTargets(1, 1, physics.values.NAV_SURFACE_UP);
                }

                navbarModule.startAnimation();
                navbarModule.handleScroll();
              },
            });
          }

          state.scroll.mode = null;
          navbarModule.startAnimation();
          navbarModule.handleScroll();
        },
      });
    },

	goTo(targetOrSelector, forcedMode = null) {
	  const target = utils.resolveTarget(targetOrSelector);
	  if (!target) return;

	  const isHeroTarget = target === this.hero || target.id === "home";
	  const navToken = ++state.ui.pendingNavAfterHeroCalendarCloseToken;

	  const startNavigation = () => {
		if (navToken !== state.ui.pendingNavAfterHeroCalendarCloseToken) return;

		const mode = forcedMode || this.getModeForTarget(target);

		state.nav.manualOpen = false;

		if (isHeroTarget && window.scrollY <= 5) {
		  navbarModule.setTargets(0, 0, 0);
		} else {
		  navbarModule.setTargets(1, 1, this.getSurfaceForMode(mode));
		}

		this.scrollToSection(target, mode);
		navbarModule.startAnimation();
	  };

	  if (state.ui.heroCalendarOpen || state.ui.heroCalendarAnimating) {
		uiModule.closeHeroCalendar({
		  preserveAboutBoundaryAtTop: false,
		  onComplete: startNavigation,
		});
		return;
	  }

	  startNavigation();
	},

    scrollToPageBottom() {
      scrollSectionHintModule.hideImmediatelyForProgrammaticScroll?.();

      state.scroll.programmatic = true;
      state.scroll.mode = "down";
      state.scrollDirection = "down";
      state.nav.gestureStretch.target = 0;

      navbarModule.startAnimation();

      this.animateWindowScrollTo(utils.getMaxScrollY(), {
        onComplete: () => {
          state.scroll.programmatic = false;
          state.scroll.mode = null;
          state.lastScrollY = window.scrollY;

          navbarModule.setTargets(1, 1, 1);
          navbarModule.startAnimation();
          navbarModule.handleScroll();
        },
      });
    },

    cancelActiveScroll({ keepPosition = true } = {}) {
      this.clearTopSettle();

      const hadActiveScroll =
        !!state.scroll.activeAnimation || state.scroll.programmatic;

      if (!hadActiveScroll) return;

      if (state.scroll.activeAnimation) {
        cancelAnimationFrame(state.scroll.activeAnimation);
        state.scroll.activeAnimation = null;
      }

      state.scroll.activeToken += 1;
      state.scroll.programmatic = false;
      state.scroll.mode = null;
      state.nav.gestureStretch.target = 0;

      if (keepPosition) window.scrollTo(0, window.scrollY);

      state.lastScrollY = window.scrollY;
      scrollSectionHintModule.scheduleHide?.();
      navbarModule.handleScroll();
      navbarModule.startAnimation();
    },
    
    init() {
		this.cacheDOM();
	  }
  };
