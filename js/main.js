document.addEventListener("DOMContentLoaded", () => {
  /*
    =====================================================================
    MERIMA BERIC - MAIN.JS V2
    Bereinigte Version mit deutscher Kommentierung
    =====================================================================

    Ziele dieser Version:
    - gleiche Grundidee wie bisher
    - weniger verstreute Zustände
    - wiederholte Animationen zusammengezogen
    - Scroll-/Nav-Logik klarer getrennt
    - bessere Lesbarkeit und Wartbarkeit

    Hinweis:
    Diese Version bleibt nah an deinem bisherigen Verhalten.
    Sie ist keine komplette Neuentwicklung, sondern eine strukturierte V2.
  */

  // ---------------------------------------------------------------------
  // 1) GLOBALE EINSTELLUNGEN
  // ---------------------------------------------------------------------
  const SETTINGS = {
    breakpoints: {
      mobileNav: 968,
      mobilePhysics: 768,
    },

    thresholds: {
      directionLock: 8,
      inertia: Math.min(document.documentElement.clientHeight * 0.6, 600),
      sectionNavClickDelay: 240,
    },

    gallery: {
      videoFiles: [
        "videos/snaptik_7204469200172190982_hd.mp4",
        "videos/snaptik_7208965603661499654_hd.mp4",
        "videos/snaptik_7211607331648441605_hd.mp4",
        "videos/snaptik_7444629475364474145_hd.mp4",
      ],
      swipeThreshold: 80,
    },
  };

  // ---------------------------------------------------------------------
  // 2) DOM-REFERENZEN
  // ---------------------------------------------------------------------
  const DOM = {
	navbar: document.querySelector(".navbar"),
	hero: document.querySelector(".hero"),
	heroContent: document.querySelector(".hero-content"),
	navToggle: document.querySelector(".nav-toggle"),
	navMenu: document.querySelector(".nav-menu"),
	navLinks: [...document.querySelectorAll(".nav-menu a")],
	navLogo: document.querySelector(".nav-logo"),
	cta: document.querySelector(".cta-button"),
	ctaLabel: document.querySelector(".cta-button .cta-label"),
	heroInner: document.querySelector(".hero-inner"),
	heroCalendar: document.getElementById("hero-calendar"),
	heroCalendarEl: document.getElementById("hero-fullcalendar"),
	footer: document.querySelector("footer"),
	track: document.querySelector(".gallery-track"),
	pricingTabs: [...document.querySelectorAll(".pricing-tab")],
	pricingContents: [...document.querySelectorAll(".pricing-content")],
	year: document.getElementById("year"),
  };

  const SECTION_SELECTOR =
    "#about, #gallery, #services, #pricing, #testimonials, #contact";

  // ---------------------------------------------------------------------
  // 3) KLEINE BASIS-HELPER
  // ---------------------------------------------------------------------
  function clamp(value, min, max) {
    return Math.max(min, Math.min(value, max));
  }

  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  function createAnimatedValue(initial = 0) {
    return {
      current: initial,
      target: initial,
      velocity: 0,
    };
  }

  function resetAnimatedValue(animated, value = 0) {
    animated.current = value;
    animated.target = value;
    animated.velocity = 0;
  }

  function createSpring({ stiffness, damping, precision = 0.001 }) {
    return {
      stiffness,
      damping,
      precision,

      step(current, target, velocity, delta) {
        const force = (target - current) * this.stiffness;
        velocity += force * delta;
        velocity *= Math.pow(this.damping, delta);
        current += velocity * delta;
        return { current, velocity };
      },

      isSettled(current, target, velocity, epsilon = this.precision) {
        return (
          Math.abs(target - current) <= epsilon &&
          Math.abs(velocity) <= epsilon
        );
      },
    };
  }

  // ---------------------------------------------------------------------
  // 4) CSS-VARIABLEN UND ALLGEMEINE UTILS
  // ---------------------------------------------------------------------
  const cssVar = {
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

  const utils = {
    prefersReducedMotion() {
      return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    },

    isMobileViewport() {
      return window.innerWidth <= SETTINGS.breakpoints.mobileNav;
    },

    isPhysicsMobileViewport() {
      return window.innerWidth <= SETTINGS.breakpoints.mobilePhysics;
    },

    getMaxScrollY() {
      return Math.max(
        0,
        document.documentElement.scrollHeight - window.innerHeight
      );
    },

    shuffle(array) {
      for (let i = array.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
      }
      return array;
    },

    resolveTarget(targetOrSelector) {
      if (!targetOrSelector) return null;
      if (targetOrSelector instanceof Element) return targetOrSelector;
      if (typeof targetOrSelector !== "string") return null;

      let selector = targetOrSelector.trim();

      if (selector === "#home") {
        return document.querySelector("#home") || document.querySelector(".hero");
      }

      if (!selector.startsWith("#")) {
        try {
          selector = new URL(selector, window.location.href).hash || selector;
        } catch {
          return null;
        }
      }

      return selector.startsWith("#") ? document.querySelector(selector) : null;
    },

    safePlay(video) {
      const result = video.play();
      if (result !== undefined) result.catch(() => {});
    },

    setVars(element, vars) {
      if (!element) return;
      Object.entries(vars).forEach(([name, value]) => {
        element.style.setProperty(name, String(value));
      });
    },

    clearRaf(id) {
      if (id) cancelAnimationFrame(id);
      return null;
    },

    clearTimer(id) {
      if (id) clearTimeout(id);
      return null;
    },

    getPerformanceProfile() {
      const cores = navigator.hardwareConcurrency || 0;
      const memory = navigator.deviceMemory || 0;
      const reducedMotion = this.prefersReducedMotion();

      let reducedTransparency = false;
      try {
        reducedTransparency = window.matchMedia(
          "(prefers-reduced-transparency: reduce)"
        ).matches;
      } catch {}

      return {
        cores,
        memory,
        reducedMotion,
        reducedTransparency,
        lowEnd:
          (cores > 0 && cores <= 4) ||
          (memory > 0 && memory <= 4) ||
          reducedMotion ||
          reducedTransparency,
      };
    },
  };

  // ---------------------------------------------------------------------
  // 5) ZENTRALER STATE
  // ---------------------------------------------------------------------
  const state = {
    lastScrollY: window.scrollY,
    scrollVelocity: 0,
    scrollDirection: "down",

    animation: {
      running: false,
      lastFrameTime: performance.now(),
    },

    nav: {
      visible: createAnimatedValue(0),
      compact: createAnimatedValue(0),
      surface: createAnimatedValue(0),
      gestureStretch: createAnimatedValue(0),
      manualOpen: false,
    },

    hero: {
      parallax: createAnimatedValue(0),
    },
	
	cta: {
	  elasticY: createAnimatedValue(0),
	},

    scroll: {
      programmatic: false,
      mode: null,
      activeAnimation: null,
      activeToken: 0,
      topSettleRaf: null,
      topSettleTimeout: null,
    },

    touch: {
      active: false,
    },


	ui: {
		suppressCtaHoverCleanup: null,
		suppressNextClick: false,
		heroCalendarOpen: false,
		ctaDefaultLabel: "",
		heroCalendarCloseTimer: null,
		heroCalendarExtraHeight: 0,
		heroCalendarAnimating: false,
		heroCalendarLayoutRaf: null,
		heroCalendarRevealTimer: null,
		heroCalendarMeasuredTop: 0,
		heroCalendarMeasuredHeight: 0,
		heroCalendarMeasuredExtra: 0,
		heroCalendarKeepCtaFlat: false,
		heroCalendarNavbarFreeze: false,
		heroClosedHeroHeight: 0,
		heroClosedContentHeight: 0,
		fullCalendarInstance: null,
		fullCalendarResizeTimer: null,
		heroCalendarAutoCloseTimer: null,
		heroCalendarAutoCloseArmed: false,
	},

    orderedSections: [],
  };

  // ---------------------------------------------------------------------
  // 6) PHYSIK-/MOTION-WERTE
  // ---------------------------------------------------------------------
  const physics = {
    values: {
      navVisibleStiffness: 0.08,
      navVisibleDamping: 0.82,
      navCompactStiffness: 0.045,
      navCompactDamping: 0.88,

      NAV_SURFACE_UP: 0.18,
      sectionScrollInset: 1,

      scrollElasticDecay: 10,
      scrollElasticFrequency: 10,
      scrollElasticPhaseShift: 0.75,
      scrollDurationFactor: 0.6,
      scrollDurationMin: 700,
      scrollDurationMax: 1600,

      heroParallaxFactor: -0.06,
      heroParallaxStiffness: 0.04,
      heroParallaxDamping: 0.85,
      heroScaleScrollFactor: 0.01,
      heroBrightnessScrollFactor: 0.06,

      navGestureExpandMax: 22,
      navGestureCompressMax: 12,
      navGestureExpandVelocityFactor: 0.18,
      navGestureCompressVelocityFactor: 0.12,
      navGestureStiffness: 0.18,
      navGestureDamping: 0.74,
      
		ctaElasticStiffness: 0.032,
		ctaElasticDamping: 0.87,
		ctaElasticVelocityFactor: 0.10,
		ctaElasticMax: 18,
    },

    update() {
      const isMobile = utils.isPhysicsMobileViewport();

      this.values.NAV_SURFACE_UP = cssVar.number("--nav-surface-up", 0.18);
      this.values.sectionScrollInset = cssVar.number("--section-scroll-inset", 1);

      this.values.scrollElasticDecay = cssVar.number("--scroll-elastic-decay", 10);
      this.values.scrollElasticFrequency = cssVar.number(
        "--scroll-elastic-frequency",
        10
      );
      this.values.scrollElasticPhaseShift = cssVar.number(
        "--scroll-elastic-phase-shift",
        0.75
      );
      this.values.scrollDurationFactor = cssVar.number(
        "--scroll-duration-factor",
        0.6
      );
      this.values.scrollDurationMin = cssVar.number("--scroll-duration-min", 700);
      this.values.scrollDurationMax = cssVar.number("--scroll-duration-max", 1600);

      this.values.heroParallaxFactor = cssVar.number("--hero-parallax-factor", -0.06);
      this.values.heroParallaxStiffness = cssVar.number(
        "--hero-parallax-stiffness",
        0.04
      );
      this.values.heroParallaxDamping = cssVar.number(
        "--hero-parallax-damping",
        0.85
      );
      this.values.heroScaleScrollFactor = cssVar.number(
        "--hero-scale-scroll-factor",
        0.01
      );
      this.values.heroBrightnessScrollFactor = cssVar.number(
        "--hero-brightness-scroll-factor",
        0.06
      );

      this.values.navGestureExpandMax = cssVar.number("--nav-gesture-expand-max", 22);
      this.values.navGestureCompressMax = cssVar.number(
        "--nav-gesture-compress-max",
        12
      );
      this.values.navGestureExpandVelocityFactor = cssVar.number(
        "--nav-gesture-expand-velocity-factor",
        0.18
      );
      this.values.navGestureCompressVelocityFactor = cssVar.number(
        "--nav-gesture-compress-velocity-factor",
        0.12
      );
      this.values.navGestureStiffness = cssVar.number(
        "--nav-gesture-stiffness",
        0.18
      );
      this.values.navGestureDamping = cssVar.number("--nav-gesture-damping", 0.74);
	
	this.values.ctaElasticStiffness = cssVar.number("--cta-elastic-stiffness", 0.032);
	this.values.ctaElasticDamping = cssVar.number("--cta-elastic-damping", 0.87);
	this.values.ctaElasticVelocityFactor = cssVar.number("--cta-elastic-velocity-factor", 0.10);
	this.values.ctaElasticMax = cssVar.number("--cta-elastic-max", 18);

	springs.ctaElastic.stiffness = this.values.ctaElasticStiffness;
	springs.ctaElastic.damping = this.values.ctaElasticDamping;

      if (isMobile) {
        this.values.navVisibleStiffness = cssVar.number(
          "--nav-spring-stiffness-mobile",
          0.06
        );
        this.values.navVisibleDamping = cssVar.number(
          "--nav-spring-damping-mobile",
          0.85
        );
        this.values.navCompactStiffness = cssVar.number(
          "--nav-compact-stiffness-mobile",
          0.035
        );
        this.values.navCompactDamping = cssVar.number(
          "--nav-compact-damping-mobile",
          0.9
        );
      } else {
        this.values.navVisibleStiffness = cssVar.number(
          "--nav-spring-stiffness-desktop",
          0.08
        );
        this.values.navVisibleDamping = cssVar.number(
          "--nav-spring-damping-desktop",
          0.82
        );
        this.values.navCompactStiffness = cssVar.number(
          "--nav-compact-stiffness-desktop",
          0.045
        );
        this.values.navCompactDamping = cssVar.number(
          "--nav-compact-damping-desktop",
          0.88
        );
      }

      // Springs nach Update der Physics-Werte synchronisieren
      springs.navVisible.stiffness = this.values.navVisibleStiffness;
      springs.navVisible.damping = this.values.navVisibleDamping;

      springs.navCompact.stiffness = this.values.navCompactStiffness;
      springs.navCompact.damping = this.values.navCompactDamping;

      springs.navSurface.stiffness = this.values.navCompactStiffness;
      springs.navSurface.damping = this.values.navCompactDamping;

      springs.navGesture.stiffness = this.values.navGestureStiffness;
      springs.navGesture.damping = this.values.navGestureDamping;

      springs.heroParallax.stiffness = this.values.heroParallaxStiffness;
      springs.heroParallax.damping = this.values.heroParallaxDamping;
    },
  };

  const springs = {
    navVisible: createSpring({ stiffness: 0.08, damping: 0.82 }),
    navCompact: createSpring({ stiffness: 0.045, damping: 0.88 }),
    navSurface: createSpring({ stiffness: 0.045, damping: 0.88 }),
    navGesture: createSpring({ stiffness: 0.18, damping: 0.74, precision: 0.01 }),
    heroParallax: createSpring({ stiffness: 0.04, damping: 0.85 }),
    ctaElastic: createSpring({ stiffness: 0.032, damping: 0.87 }),
  };

  // ---------------------------------------------------------------------
  // 7) GEMEINSAME HILFSFUNKTIONEN FÜR ANIMATIONEN
  // ---------------------------------------------------------------------
  function stepAnimatedValue(animated, spring, delta) {
    const result = spring.step(
      animated.current,
      animated.target,
      animated.velocity,
      delta
    );

    animated.current = result.current;
    animated.velocity = result.velocity;
  }

  function isAnimatedValueMoving(animated, spring) {
    return !spring.isSettled(animated.current, animated.target, animated.velocity);
  }

  // ---------------------------------------------------------------------
  // 8) SCROLL-ENGINE
  // ---------------------------------------------------------------------
  const scrollEngine = {
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
      if (!DOM.navbar) return 0;

      const navMax = cssVar.number("--nav-height-max", 78);
      const navMin = cssVar.number("--nav-height-min", 58);

      return navMode === "down" || navMode === "up-section"
        ? navMin
        : DOM.navbar.offsetHeight || navMax;
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

		const isHeroTarget = target === DOM.hero || target.id === "home";

		// Kalender bei jeder Navigation schließen – auch bei HOME / Logo
		if (state.ui.heroCalendarOpen) {
			uiModule.closeHeroCalendar();
		}

		const mode = forcedMode || this.getModeForTarget(target);
		state.nav.manualOpen = false;

		if (isHeroTarget && window.scrollY <= 5) {
			navbarModule.setTargets(0, 0, 0);
		} else {
			navbarModule.setTargets(1, 1, this.getSurfaceForMode(mode));
		}

		this.scrollToSection(target, mode);
		navbarModule.startAnimation();
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
  };

  // ---------------------------------------------------------------------
  // 9) NAVBAR-MODUL
  // ---------------------------------------------------------------------
  const navbarModule = {
    isOpen() {
      return !!(
        DOM.navMenu &&
        DOM.navToggle &&
        DOM.navMenu.classList.contains("active")
      );
    },

    applyCtaNeutralState() {
      if (!DOM.cta) return;

      DOM.cta.classList.remove("is-magnetic-near", "is-hovered");
      DOM.cta.blur();

      utils.setVars(DOM.cta, {
        "--magnetic-x": "0px",
        "--magnetic-y": "0px",
        "--hover-lift": "0px",
        "--magnetic-scale": "1",
        "--magnetic-shadow-y": "0px",
        "--magnetic-shadow-blur": "0px",
        "--magnetic-shadow-alpha": "0",
        "--label-x": "0px",
        "--label-y": "0px",
        "--label-scale": "1",
        "--gloss-x": "50%",
        "--gloss-y": "50%",
        "--gloss-opacity": "0",
      });
    },

    openMenu() {
      if (!DOM.navMenu || !DOM.navToggle) return;

      DOM.navMenu.classList.add("active");
      DOM.navToggle.classList.add("active");
      document.body.classList.add("nav-menu-open");

      state.nav.gestureStretch.target = 0;
      this.startAnimation();
    },

    closeMenu({ keepNavbarVisible = false } = {}) {
      if (!DOM.navMenu || !DOM.navToggle) return;

      DOM.navMenu.classList.remove("active");
      DOM.navToggle.classList.remove("active");
      document.body.classList.remove("nav-menu-open");

      uiModule.resetCtaMagnetic();
      this.applyCtaNeutralState();
      this.suppressCtaHoverTemporarily(700);

      state.nav.manualOpen = false;
      state.nav.gestureStretch.target = 0;
      this.startAnimation();

      if (keepNavbarVisible) {
        this.setTargets(1, 1, 1);
        return;
      }

      if (window.scrollY <= 5 && !state.scroll.programmatic) {
        this.setTargets(0, 0, 0);
      } else {
        this.handleScroll();
      }
    },

    setTargets(visible, compact, surface) {
      if (!DOM.navbar) return;

      state.nav.visible.target = visible;
      state.nav.compact.target = compact;
      state.nav.surface.target = surface;

      this.startAnimation();
    },

    startAnimation() {
      if (state.animation.running) return;

      state.animation.running = true;
      state.animation.lastFrameTime = performance.now();

      requestAnimationFrame(this.animate.bind(this));
    },

    canUseGestureStretch(currentY) {
      return (
        state.touch.active &&
        !state.scroll.programmatic &&
        !state.nav.manualOpen &&
        !this.isOpen() &&
        currentY > 5 &&
        state.nav.visible.target >= 1 &&
        state.nav.compact.target >= 1 &&
        state.scroll.mode !== "hero-top"
      );
    },

    updateGestureStretch(deltaY, currentY) {
      if (!this.canUseGestureStretch(currentY)) {
        state.nav.gestureStretch.target = 0;
        return;
      }

      const absDelta = Math.abs(deltaY);

      if (deltaY < 0) {
        state.nav.gestureStretch.target = Math.min(
          absDelta * physics.values.navGestureExpandVelocityFactor,
          physics.values.navGestureExpandMax
        );
        return;
      }

      if (deltaY > 0) {
        state.nav.gestureStretch.target = -Math.min(
          absDelta * physics.values.navGestureCompressVelocityFactor,
          physics.values.navGestureCompressMax
        );
        return;
      }

      state.nav.gestureStretch.target = 0;
    },



	handleScroll() {
		if (!DOM.navbar) return;

		if (state.ui.heroCalendarNavbarFreeze) {
			state.lastScrollY = window.scrollY;
			return;
		}

      if (!DOM.navbar) return;

      const currentY = window.scrollY;
      const deltaY = currentY - state.lastScrollY;

      state.scrollVelocity = deltaY * 0.8;

		if (
			  !state.ui.heroCalendarOpen &&
			  !state.ui.heroCalendarAnimating &&
			  !state.ui.heroCalendarKeepCtaFlat
			) {
			  const impulse = clamp(
				-deltaY * physics.values.ctaElasticVelocityFactor,
				-physics.values.ctaElasticMax,
				physics.values.ctaElasticMax
			  );

			  /* Nur Impuls auf die Feder geben, Nullpunkt bleibt bottom */
			  state.cta.elasticY.velocity += impulse;
			}
      
      this.updateGestureStretch(deltaY, currentY);

      if (
        !state.scroll.programmatic &&
        Math.abs(deltaY) > SETTINGS.thresholds.directionLock
      ) {
        state.scrollDirection = deltaY > 0 ? "down" : "up";
      }

      if (state.nav.manualOpen && currentY > 5) {
        state.nav.manualOpen = false;
      }

      state.lastScrollY = currentY;
      DOM.hero?.classList.toggle("scrolled", currentY > 10);

      if (state.scroll.mode === "down") {
        this.setTargets(1, 1, 1);
        return;
      }

      if (state.scroll.mode === "up-section") {
        this.setTargets(1, 1, physics.values.NAV_SURFACE_UP);
        return;
      }

      if (state.scroll.mode === "hero-top") {
        this.setTargets(0, 0, 0);
        return;
      }

      if (state.nav.manualOpen) {
        if (currentY <= 5) {
          this.setTargets(0, 0, 0);
        } else {
          this.setTargets(1, 1, 1);
        }
        return;
      }

      if (currentY <= 5) {
        state.nav.gestureStretch.target = 0;
        this.setTargets(0, 0, 0);
      } else if (state.scrollDirection === "down") {
        this.setTargets(1, 1, 1);
      } else {
        this.setTargets(1, 1, physics.values.NAV_SURFACE_UP);
      }
    },

    renderNavbar() {
      const easedCompact = easeOutCubic(state.nav.compact.current);
      const easedSurface = easeOutCubic(state.nav.surface.current);

      utils.setVars(DOM.navbar, {
        "--nav-visible": state.nav.visible.current,
        "--nav-compact": easedCompact,
        "--nav-settle": easedCompact,
        "--nav-surface": easedSurface,
        "--nav-height-progress": easedCompact,
        "--nav-gesture-stretch": `${state.nav.gestureStretch.current.toFixed(2)}px`,
        "--nav-velocity-blur": Math.round(
          Math.min(Math.abs(state.scrollVelocity) * 0.15, 6)
        ),
        "--nav-refraction": Math.min(Math.abs(state.scrollVelocity) * 0.02, 1),
      });

      const velocityShadow = Math.min(Math.abs(state.scrollVelocity) * 0.02, 0.2);

      DOM.navbar.style.boxShadow = `0 ${10 * easedSurface}px ${
        40 * easedSurface
      }px rgba(0,0,0, ${0.45 * easedSurface + velocityShadow})`;
    },

    renderHero() {
      if (!DOM.hero) return;

      const scrollY = window.scrollY;
      const progress = Math.min(scrollY / SETTINGS.thresholds.inertia, 1);

      utils.setVars(DOM.hero, {
        "--hero-scale": 1 - progress * physics.values.heroScaleScrollFactor,
        "--hero-brightness":
          1 - progress * physics.values.heroBrightnessScrollFactor,
        "--hero-parallax": `${state.hero.parallax.current}px`,
      });
    },
    
	renderCTA() {
	  if (!DOM.cta) return;

	  utils.setVars(DOM.cta, {
		"--cta-elastic-y": `${state.cta.elasticY.current}px`,
	  });
	},

    animate(now) {
      if (!DOM.navbar || document.hidden) {
        state.animation.running = false;
        return;
      }

      state.scrollVelocity *= 0.9;

      let delta = (now - state.animation.lastFrameTime) / 16.67;
      state.animation.lastFrameTime = now;
      delta = Math.min(delta, 2);

      stepAnimatedValue(state.nav.visible, springs.navVisible, delta);
      stepAnimatedValue(state.nav.compact, springs.navCompact, delta);
      stepAnimatedValue(state.nav.surface, springs.navSurface, delta);
      stepAnimatedValue(state.nav.gestureStretch, springs.navGesture, delta);
      stepAnimatedValue(state.hero.parallax, springs.heroParallax, delta);
      stepAnimatedValue(state.cta.elasticY, springs.ctaElastic, delta);

      state.nav.visible.current = clamp(state.nav.visible.current, 0, 1);
      state.nav.compact.current = clamp(state.nav.compact.current, 0, 1);
      state.nav.surface.current = clamp(state.nav.surface.current, 0, 1);
      state.nav.gestureStretch.current = clamp(
        state.nav.gestureStretch.current,
        -physics.values.navGestureCompressMax,
        physics.values.navGestureExpandMax
      );

	const scrollY = window.scrollY;

	if (
	  state.ui.heroCalendarOpen ||
	  state.ui.heroCalendarAnimating ||
	  state.ui.heroCalendarKeepCtaFlat
	) {
	  resetAnimatedValue(state.hero.parallax, 0);
	  resetAnimatedValue(state.cta.elasticY, 0);
	} else {
	  state.hero.parallax.target =
		scrollY * physics.values.heroParallaxFactor;

	  state.cta.elasticY.target = 0;
	}

	this.renderNavbar();
	this.renderHero();
	this.renderCTA();

      const stillMoving =
        isAnimatedValueMoving(state.nav.visible, springs.navVisible) ||
        isAnimatedValueMoving(state.nav.compact, springs.navCompact) ||
        isAnimatedValueMoving(state.nav.surface, springs.navSurface) ||
        isAnimatedValueMoving(state.nav.gestureStretch, springs.navGesture) ||
        isAnimatedValueMoving(state.hero.parallax, springs.heroParallax) ||
        isAnimatedValueMoving(state.cta.elasticY, springs.ctaElastic)

      if (!stillMoving) {
        state.animation.running = false;
        return;
      }

      requestAnimationFrame(this.animate.bind(this));
    },

    suppressCtaHoverTemporarily(duration = 700) {
      document.body.classList.add("suppress-cta-hover");

      if (state.ui.suppressCtaHoverCleanup) {
        window.removeEventListener(
          "pointermove",
          state.ui.suppressCtaHoverCleanup
        );
        clearTimeout(state.ui.suppressCtaHoverCleanup.__timeoutId);
      }

      const cleanup = (e) => {
        if (e && e.pointerType && e.pointerType !== "mouse") return;

        document.body.classList.remove("suppress-cta-hover");
        window.removeEventListener("pointermove", cleanup);

        if (cleanup.__timeoutId) clearTimeout(cleanup.__timeoutId);
        state.ui.suppressCtaHoverCleanup = null;
      };

      cleanup.__timeoutId = setTimeout(cleanup, duration);
      state.ui.suppressCtaHoverCleanup = cleanup;
      window.addEventListener("pointermove", cleanup);
    },

    bindEvents() {
      if (DOM.navToggle && DOM.navMenu) {
        DOM.navToggle.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.isOpen() ? this.closeMenu() : this.openMenu();
        });
      }

      DOM.navLinks.forEach((link) => {
        link.addEventListener("click", (e) => {
          const rawHref = link.getAttribute("href");
          if (!rawHref) return;

          let hash = "";

          try {
            hash = rawHref.startsWith("#")
              ? rawHref
              : new URL(rawHref, window.location.href).hash;
          } catch {
            hash = rawHref.startsWith("#") ? rawHref : "";
          }

          if (!hash) return;

          const target = utils.resolveTarget(hash);
          if (!target) return;

          e.preventDefault();
          e.stopPropagation();

          const doScroll = () =>
            scrollEngine.goTo(target, scrollEngine.getModeForTarget(target));

          if (utils.isMobileViewport() && this.isOpen()) {
            const menu = DOM.navMenu;
            const isHeroTarget = target.classList?.contains("hero");

            this.closeMenu({ keepNavbarVisible: !isHeroTarget });

            let done = false;

            const finish = () => {
              if (done) return;
              done = true;
              menu?.removeEventListener("transitionend", onEnd);
              doScroll();
            };

            const onEnd = (evt) => {
              if (evt.target === menu) finish();
            };

            menu?.addEventListener("transitionend", onEnd, { once: true });
            setTimeout(finish, 450);
            return;
          }

          doScroll();
        });
      });

      DOM.navLogo?.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();

        const goHome = () => scrollEngine.goTo(DOM.hero, "hero-top");

        if (utils.isMobileViewport() && this.isOpen()) {
          const menu = DOM.navMenu;

          this.closeMenu({ keepNavbarVisible: false });

          let done = false;

          const finish = () => {
            if (done) return;
            done = true;
            menu?.removeEventListener("transitionend", onEnd);
            goHome();
          };

          const onEnd = (evt) => {
            if (evt.target === menu) finish();
          };

          menu?.addEventListener("transitionend", onEnd, { once: true });
          setTimeout(finish, 450);
          return;
        }

        goHome();
      });

      document.addEventListener("pointerdown", (e) => {
        if (!utils.isMobileViewport() || !this.isOpen()) return;

        const target = e.target instanceof Element ? e.target : null;
        if (!target) return;

        const insideMenu = target.closest(".nav-menu");
        const onToggle = target.closest(".nav-toggle");
        const onLogo = target.closest(".nav-logo");
        const onCta = target.closest(".cta-button");
        const onSectionScrollHead = target.closest(".section-scroll-head");

        if (insideMenu || onToggle || onLogo) return;

		/* CTA soll NICHT als Outside-Click gelten */
		if (onCta) {
		  this.suppressCtaHoverTemporarily();
		  uiModule.resetCtaMagnetic();
		  return;
		}

		e.preventDefault();
		e.stopPropagation();
		state.ui.suppressNextClick = true;

		if (onSectionScrollHead) {
		  this.suppressCtaHoverTemporarily();
		  uiModule.resetCtaMagnetic();
		}

		this.closeMenu();

      });

      document.addEventListener(
        "click",
        (e) => {
          if (!state.ui.suppressNextClick) return;
          state.ui.suppressNextClick = false;
          e.preventDefault();
          e.stopPropagation();
        },
        true
      );
    },
  };

  // ---------------------------------------------------------------------
  // 10) SECTION-NAVIGATION
  // ---------------------------------------------------------------------
  const sectionNavigationModule = {
    buildOrderedSections() {
      state.orderedSections = [
        document.querySelector(".hero"),
        document.querySelector("#about"),
        document.querySelector("#gallery"),
        document.querySelector("#services"),
        document.querySelector("#pricing"),
        document.querySelector("#testimonials"),
        document.querySelector("#contact"),
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

  // ---------------------------------------------------------------------
  // 11) SCROLL-HINT-SYSTEM
  // ---------------------------------------------------------------------
	const scrollSectionHintModule = {
	  root: null,
	  measurer: null,
	  metricsCache: new Map(),
	  hintSlots: [],
	  updateRaf: null,

	  maxVisibleHints: 2,
	  isVisible: false,

	  hideTimer: null,
	  hideCompleteTimer: null,
	  stopCheckRaf: null,

	  lastScrollTs: 0,
	  lastObservedScrollY: window.scrollY,
	  lastStopCheckY: window.scrollY,
	  stableSinceTs: 0,

	  hideDelayMs: 1000,
	  fadeDurationMs: 500,
	  showScrollDistancePx: window.innerHeight,

	  /* Erst wenn scrollY für diese Zeit wirklich stabil bleibt,
		 gilt der Scroll als beendet. */
	  restStableMs: 220,
	  movementTolerancePx: 0.25,

	  gesture: {
		type: null,
		active: false,
		distance: 0,
		lastTouchStartTs: 0,
		lastTouchEndTs: 0,

		sessionHadTouch: false,
		sessionUnlocked: false,
	  },

	  labels: {
		about: "ÜBER MICH",
		gallery: "VIDEO-FUN",
		services: "LEISTUNGEN",
		pricing: "PREISE",
		testimonials: "BEWERTUNGEN",
		contact: "KONTAKT",
	  },

	  build() {
		if (this.root) return;

		this.root = document.createElement("div");
		this.root.className = "scroll-section-hints";
		this.root.setAttribute("aria-hidden", "true");

		this.root.innerHTML = Array.from(
		  { length: this.maxVisibleHints },
		  (_, index) => `
			<div class="scroll-section-hint-anchor scroll-section-hint-anchor--${index}">
			  <div class="scroll-section-hint scroll-section-hint--${index}">
				<span class="scroll-section-hint-text scroll-section-hint-base"></span>
			  </div>
			</div>
		  `
		).join("");

		document.body.appendChild(this.root);

		this.measurer = document.createElement("span");
		this.measurer.className = "scroll-section-hint-measurer";
		document.body.appendChild(this.measurer);

		this.hintSlots = [...this.root.querySelectorAll(".scroll-section-hint")];
	  },

	  bindHintClicks() {
		this.hintSlots.forEach((hintEl) => {
		  const anchor = hintEl?.parentElement;
		  if (!anchor) return;

		  anchor.setAttribute("tabindex", "0");
		  anchor.setAttribute("role", "button");

		  const goToHintTarget = () => {
			const targetSelector = anchor.dataset.scrollTarget;
			const opacity = parseFloat(hintEl.style.opacity || "0");
			const text = hintEl.textContent || "";

			if (!targetSelector || opacity <= 0.01) return;

			scrollEngine.goTo(
			  targetSelector,
			  text.includes(">>") ? "down" : "up-section"
			);
		  };

		  const triggerNavigation = (e) => {
			e.preventDefault();
			e.stopPropagation();
			goToHintTarget();
		  };

		  anchor.addEventListener(
			"pointerdown",
			(e) => {
			  if (e.pointerType !== "mouse") triggerNavigation(e);
			},
			{ passive: false }
		  );

		  anchor.addEventListener("touchstart", triggerNavigation, {
			passive: false,
		  });

		  anchor.addEventListener("click", (e) => {
			if (!e.pointerType || e.pointerType === "mouse") {
			  triggerNavigation(e);
			}
		  });

		  anchor.addEventListener("keydown", (e) => {
			if (e.key === "Enter" || e.key === " ") triggerNavigation(e);
		  });
		});
	  },

	  getContentSections() {
		return state.orderedSections.filter((section) => {
		  if (!section) return false;
		  if (section.classList?.contains("hero")) return true;
		  return !!section.id && !!this.labels[section.id];
		});
	  },

	  getVisualViewportBottom() {
		return window.visualViewport
		  ? window.visualViewport.height
		  : window.innerHeight || document.documentElement.clientHeight;
	  },

	  getBoundaryGapPx() {
		return cssVar.remPx("--section-hint-boundary-gap", 4.8);
	  },

	  getNavbarBottom() {
		return DOM.navbar
		  ? DOM.navbar.getBoundingClientRect().bottom
		  : cssVar.number("--nav-height", 78);
	  },

	  getSectionContext() {
		const sections = this.getContentSections();
		if (!sections.length) return null;

		const navbarBottom = this.getNavbarBottom();
		const viewportBottom = this.getVisualViewportBottom();
		const lowerThirdY = viewportBottom * (2 / 3);
		const scrollingUp = state.scrollDirection === "up";

		let currentIndex = 0;

		for (let i = 0; i < sections.length; i += 1) {
		  const section = sections[i];

		  if (section.classList?.contains("hero")) {
			currentIndex = i;
			continue;
		  }

		  const rect = section.getBoundingClientRect();

		  if (section.id === "about") {
			const switchLine = scrollingUp ? navbarBottom : lowerThirdY;

			if (rect.top <= switchLine) {
			  currentIndex = i;
			} else {
			  break;
			}

			continue;
		  }

		  if (rect.top <= navbarBottom) {
			currentIndex = i;
		  } else {
			break;
		  }
		}

		return {
		  sections,
		  currentIndex,
		  current: sections[currentIndex] || null,
		  next: sections[currentIndex + 1] || null,
		  overnext: sections[currentIndex + 2] || null,
		};
	  },

	  measureHint(text) {
		const key = text || " ";
		const cached = this.metricsCache.get(key);

		if (cached || !this.measurer) {
		  return cached || { width: 0, height: 0 };
		}

		this.measurer.textContent = key;

		const rect = this.measurer.getBoundingClientRect();
		const metrics = {
		  width: rect.width || 0,
		  height: rect.height || 0,
		};

		this.metricsCache.set(key, metrics);
		return metrics;
	  },

	  getAnchorHeightForText(text) {
		return Math.max(48, this.measureHint(text).width + 16);
	  },

	  makeText(section, variant = "forward") {
		if (!section?.id || !this.labels[section.id]) return "";

		return variant === "forward"
		  ? `>> ${this.labels[section.id]} >>`
		  : `<< ${this.labels[section.id]} <<`;
	  },

	  getRgbFromColorString(color) {
		if (!color) return null;

		const value = color.trim().toLowerCase();

		if (value === "transparent" || value === "rgba(0, 0, 0, 0)") return null;

		const rgbMatch = value.match(/rgba?\(([^)]+)\)/);
		if (rgbMatch) {
		  const parts = rgbMatch[1]
			.split(",")
			.map((part) => parseFloat(part.trim()));

		  if (parts.length >= 3 && parts.slice(0, 3).every(Number.isFinite)) {
			return { r: parts[0], g: parts[1], b: parts[2] };
		  }
		}

		const hexMatch = value.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
		if (!hexMatch) return null;

		let hex = hexMatch[1];
		if (hex.length === 3) {
		  hex = hex
			.split("")
			.map((ch) => ch + ch)
			.join("");
		}

		const intVal = parseInt(hex, 16);

		return {
		  r: (intVal >> 16) & 255,
		  g: (intVal >> 8) & 255,
		  b: intVal & 255,
		};
	  },

	  getRelativeLuminance({ r, g, b }) {
		const normalize = (channel) => {
		  const v = channel / 255;
		  return v <= 0.03928
			? v / 12.92
			: Math.pow((v + 0.055) / 1.055, 2.4);
		};

		return (
		  0.2126 * normalize(r) +
		  0.7152 * normalize(g) +
		  0.0722 * normalize(b)
		);
	  },

	  getSectionTheme(sectionEl) {
		if (!sectionEl) return "dark";

		const explicitTheme = sectionEl.dataset.hintTheme;
		if (explicitTheme === "light" || explicitTheme === "dark") {
		  return explicitTheme;
		}

		const style = getComputedStyle(sectionEl);
		const rgb =
		  this.getRgbFromColorString(style.backgroundColor) ||
		  this.getRgbFromColorString(getComputedStyle(document.body).backgroundColor) || {
			r: 250,
			g: 250,
			b: 248,
		  };

		return this.getRelativeLuminance(rgb) < 0.42 ? "light" : "dark";
	  },

	  getSectionAtViewportY(viewportY) {
		return (
		  this.getContentSections().find((section) => {
			const rect = section.getBoundingClientRect();
			return viewportY >= rect.top && viewportY <= rect.bottom;
		  }) || null
		);
	  },

	  getThemeAtViewportY(viewportY, fallbackSection = null) {
		return this.getSectionTheme(
		  this.getSectionAtViewportY(viewportY) || fallbackSection
		);
	  },

	  setAnchorCenterY(hintEl, centerYPx) {
		const anchor = hintEl?.parentElement;
		if (anchor) anchor.style.top = `${Math.round(centerYPx)}px`;
	  },

	  setHint(
		hintEl,
		{ text = "", top = 0, opacity = 0, theme = "dark", target = "" } = {}
	  ) {
		if (!hintEl) return;

		const anchor = hintEl.parentElement;
		const base = hintEl.querySelector(".scroll-section-hint-base");
		const visible = !!text && opacity > 0.001;

		if (base) base.textContent = text;

		this.setAnchorCenterY(hintEl, top);

		hintEl.style.opacity = `${
		  clamp(opacity, 0, 1) * cssVar.number("--section-hint-visibility", 0.5)
		}`;

		hintEl.dataset.theme = theme;
		hintEl.classList.toggle("is-empty", !visible);

		if (anchor) {
		  const metrics = this.measureHint(text);

		  anchor.dataset.scrollTarget = target || "";
		  anchor.style.width = `${Math.max(48, metrics.height + 16)}px`;
		  anchor.style.height = `${Math.max(48, metrics.width + 16)}px`;
		  anchor.style.pointerEvents = visible ? "auto" : "none";
		  anchor.style.opacity = visible ? "1" : "0";
		  anchor.setAttribute("aria-hidden", visible ? "false" : "true");
		}
	  },

	  applyHint(hintEl, placement) {
		if (!placement?.section) {
		  this.hideHint(hintEl);
		  return;
		}

		this.setHint(hintEl, {
		  text: this.makeText(placement.section, placement.variant),
		  top: placement.top,
		  opacity: placement.opacity ?? 1,
		  theme: this.getThemeAtViewportY(placement.top, placement.section),
		  target: placement.section.id ? `#${placement.section.id}` : "",
		});
	  },

	  hideHint(hintEl) {
		this.setHint(hintEl, {
		  text: "",
		  top: 0,
		  opacity: 0,
		  target: "",
		});
	  },

	  hideAll() {
		this.hintSlots.forEach((hintEl) => this.hideHint(hintEl));
	  },

	  getTransitionZone(changeY, bandTop, bandBottom) {
		if (!Number.isFinite(changeY) || changeY <= bandTop || changeY >= bandBottom) {
		  return "outside";
		}

		const rel = changeY - bandTop;
		const third = (bandBottom - bandTop) / 3;

		if (rel < third) return "entering";
		if (rel < third * 2) return "passing";
		return "leaving";
	  },

	  createPlacement(section, config = {}) {
		if (!section) return null;

		return {
		  section,
		  role: config.role || "transition",
		  variant: config.variant || "forward",
		  top: config.top || 0,
		  opacity: config.opacity ?? 1,
		  priority: config.priority || 0,
		};
	  },

	  buildGeometry(context) {
		const gap = this.getBoundaryGapPx();
		const navbarBottom = this.getNavbarBottom();
		const viewportBottom = this.getVisualViewportBottom();
		const lowerThirdY = viewportBottom * (2 / 3);

		const { current, next, overnext } = context;

		const text = {
		  currentForward: this.makeText(current, "forward"),
		  nextForward: next ? this.makeText(next, "forward") : "",
		  nextBackward: next ? this.makeText(next, "backward") : "",
		  overnextBackward: overnext ? this.makeText(overnext, "backward") : "",
		};

		const nextRect = next?.getBoundingClientRect() || null;
		const overnextRect = overnext?.getBoundingClientRect() || null;

		const changeY = nextRect ? nextRect.top : Number.POSITIVE_INFINITY;
		const overnextChangeY = overnextRect
		  ? overnextRect.top
		  : Number.POSITIVE_INFINITY;

		const anchorHeights = {
		  currentForward: this.getAnchorHeightForText(text.currentForward),
		  nextForward: this.getAnchorHeightForText(text.nextForward),
		  nextBackward: this.getAnchorHeightForText(text.nextBackward),
		  overnextBackward: this.getAnchorHeightForText(text.overnextBackward),
		};

		return {
		  gap,
		  changeY,
		  overnextChangeY,

		  docks: {
			top: {
			  current: navbarBottom + gap + anchorHeights.currentForward / 2,
			},

			bottom: {
			  next: next
				? viewportBottom - gap - anchorHeights.nextBackward / 2
				: 0,
			  overnext: overnext
				? viewportBottom - gap - anchorHeights.overnextBackward / 2
				: 0,
			},

			lowerThird: {
			  next: next
				? lowerThirdY - gap - anchorHeights.nextBackward / 2
				: 0,
			  overnext: overnext
				? lowerThirdY - gap - anchorHeights.overnextBackward / 2
				: 0,
			},
		  },

		  band: {
			top: navbarBottom,
			bottom: viewportBottom,
		  },

		  transition: {
			nextForwardBelowBoundary: next
			  ? changeY + gap + anchorHeights.nextForward / 2
			  : 0,

			nextBackwardAboveBoundary: next
			  ? changeY - gap - anchorHeights.nextBackward / 2
			  : 0,

			overnextBackwardAboveBoundary: overnext
			  ? overnextChangeY - gap - anchorHeights.overnextBackward / 2
			  : 0,
		  },
		};
	  },

	  buildHomeAboutSpecialPlacements(context, geometry) {
		const about = context.sections.find((section) => section?.id === "about");
		const gallery = context.sections.find((section) => section?.id === "gallery");

		if (!about) return null;

		const boundaryY = about.getBoundingClientRect().top;
		const viewportBottom = geometry.band.bottom;
		const navbarBottom = geometry.band.top;

		if (
		  !Number.isFinite(boundaryY) ||
		  boundaryY <= navbarBottom ||
		  boundaryY >= viewportBottom
		) {
		  return null;
		}

		const topThirdEnd = viewportBottom / 3;
		const middleThirdEnd = viewportBottom * (2 / 3);
		const scrollingUp = state.scrollDirection === "up";

		const placements = [];
		const push = (placement) => placement?.section && placements.push(placement);

		const aboutForwardText = this.makeText(about, "forward");
		const aboutBackwardText = this.makeText(about, "backward");
		const galleryBackwardText = gallery ? this.makeText(gallery, "backward") : "";

		const aboutForwardHeight = this.getAnchorHeightForText(aboutForwardText);
		const aboutBackwardHeight = this.getAnchorHeightForText(aboutBackwardText);
		const galleryBackwardHeight = gallery
		  ? this.getAnchorHeightForText(galleryBackwardText)
		  : 0;

		const aboutBelowBoundaryTop =
		  boundaryY + geometry.gap + aboutForwardHeight / 2;

		const aboutAboveBoundaryBackwardTop =
		  boundaryY - geometry.gap - aboutBackwardHeight / 2;

		const galleryBottomTop = gallery
		  ? viewportBottom - geometry.gap - galleryBackwardHeight / 2
		  : 0;

		if (scrollingUp) {
		  if (boundaryY < topThirdEnd) {
			push(
			  this.createPlacement(about, {
				role: "transition",
				variant: "forward",
				top: aboutBelowBoundaryTop,
				priority: 100,
			  })
			);

			if (gallery) {
			  push(
				this.createPlacement(gallery, {
				  role: "bottomDock",
				  variant: "backward",
				  top: galleryBottomTop,
				  priority: 60,
				})
			  );
			}

			return placements;
		  }

		  if (boundaryY < middleThirdEnd) {
			push(
			  this.createPlacement(about, {
				role: "transition",
				variant: "forward",
				top: aboutBelowBoundaryTop,
				priority: 100,
			  })
			);

			return placements;
		  }

		  push(
			this.createPlacement(about, {
			  role: "transition",
			  variant: "backward",
			  top: aboutAboveBoundaryBackwardTop,
			  priority: 100,
			})
		  );

		  return placements;
		}

		if (boundaryY >= middleThirdEnd) {
		  return [];
		}

		push(
		  this.createPlacement(about, {
			role: "transition",
			variant: "forward",
			top: aboutBelowBoundaryTop,
			priority: 100,
		  })
		);

		if (gallery && boundaryY < topThirdEnd) {
		  push(
			this.createPlacement(gallery, {
			  role: "bottomDock",
			  variant: "backward",
			  top: galleryBottomTop,
			  priority: 60,
			})
		  );
		}

		return placements;
	  },

	  buildPlacements(context, geometry) {
		const specialHomeAbout = this.buildHomeAboutSpecialPlacements(
		  context,
		  geometry
		);
		if (specialHomeAbout) return specialHomeAbout;

		const { current, next, overnext } = context;
		const placements = [];
		const push = (placement) => placement?.section && placements.push(placement);

		const isHomeCurrent =
		  current?.classList?.contains("hero") || current?.id === "home";

		const nextZone = next
		  ? this.getTransitionZone(geometry.changeY, geometry.band.top, geometry.band.bottom)
		  : "outside";

		const overnextZone = overnext
		  ? this.getTransitionZone(
			  geometry.overnextChangeY,
			  geometry.band.top,
			  geometry.band.bottom
			)
		  : "outside";

		if (!isHomeCurrent && !next) {
		  push(
			this.createPlacement(current, {
			  role: "topDock",
			  variant: "forward",
			  top: geometry.docks.top.current,
			  priority: 100,
			})
		  );

		  return placements;
		}

		if (isHomeCurrent) {
		  if (nextZone === "entering" || nextZone === "passing") {
			push(
			  this.createPlacement(next, {
				role: "transition",
				variant: "forward",
				top: geometry.transition.nextForwardBelowBoundary,
				priority: 100,
			  })
			);
		  }

		  if (overnext) {
			if (overnextZone !== "outside") {
			  push(
				this.createPlacement(overnext, {
				  role: "transition",
				  variant: "backward",
				  top: geometry.transition.overnextBackwardAboveBoundary,
				  priority: 60,
				})
			  );
			} else if (nextZone === "entering") {
			  push(
				this.createPlacement(overnext, {
				  role: "bottomDock",
				  variant: "backward",
				  top: geometry.docks.lowerThird.overnext,
				  priority: 60,
				})
			  );
			}
		  }

		  if (nextZone === "outside" || nextZone === "leaving") {
			if (geometry.changeY > geometry.docks.lowerThird.next + geometry.gap) {
			  push(
				this.createPlacement(next, {
				  role: "bottomDock",
				  variant: "backward",
				  top: geometry.docks.lowerThird.next,
				  priority: 70,
				})
			  );
			}
		  }

		  return placements;
		}

		if (nextZone === "outside") {
		  push(
			this.createPlacement(current, {
			  role: "topDock",
			  variant: "forward",
			  top: geometry.docks.top.current,
			  priority: 100,
			})
		  );

		  push(
			this.createPlacement(next, {
			  role: "bottomDock",
			  variant: "backward",
			  top: geometry.docks.bottom.next,
			  priority: 70,
			})
		  );

		  return placements;
		}

		if (nextZone === "entering") {
		  push(
			this.createPlacement(next, {
			  role: "transition",
			  variant: "forward",
			  top: geometry.transition.nextForwardBelowBoundary,
			  priority: 100,
			})
		  );

		  if (overnext) {
			push(
			  this.createPlacement(overnext, {
				role: overnextZone !== "outside" ? "transition" : "bottomDock",
				variant: "backward",
				top:
				  overnextZone !== "outside"
					? geometry.transition.overnextBackwardAboveBoundary
					: geometry.docks.bottom.overnext,
				priority: 60,
			  })
			);
		  }

		  return placements;
		}

		if (nextZone === "passing") {
		  push(
			this.createPlacement(current, {
			  role: "topDock",
			  variant: "forward",
			  top: geometry.docks.top.current,
			  priority: 90,
			})
		  );

		  push(
			this.createPlacement(next, {
			  role: "transition",
			  variant: "forward",
			  top: geometry.transition.nextForwardBelowBoundary,
			  priority: 100,
			})
		  );

		  return placements;
		}

		if (nextZone === "leaving") {
		  push(
			this.createPlacement(current, {
			  role: "topDock",
			  variant: "forward",
			  top: geometry.docks.top.current,
			  priority: 90,
			})
		  );

		  push(
			this.createPlacement(next, {
			  role: "transition",
			  variant: "backward",
			  top: geometry.transition.nextBackwardAboveBoundary,
			  priority: 100,
			})
		  );
		}

		return placements;
	  },

	  renderPlacements(placements) {
		const visiblePlacements = (placements || [])
		  .filter(Boolean)
		  .filter(
			(placement) => placement.section && (placement.opacity ?? 1) > 0.001
		  )
		  .sort((a, b) =>
			a.top !== b.top ? a.top - b.top : (b.priority ?? 0) - (a.priority ?? 0)
		  );

		if (!visiblePlacements.length) {
		  this.hideAll();
		  return;
		}

		this.hintSlots.forEach((hintEl, index) => {
		  const placement = visiblePlacements[index];
		  if (placement) {
			this.applyHint(hintEl, placement);
		  } else {
			this.hideHint(hintEl);
		  }
		});
	  },

	  updateGalleryBodyState(currentSection) {
		document.body.classList.toggle("in-gallery", currentSection?.id === "gallery");
	  },

	  update() {
		if (!this.root) return;

		const context = this.getSectionContext();
		this.updateGalleryBodyState(context?.current || null);

		if (!context?.current) {
		  this.hideAll();
		  return;
		}

		this.renderPlacements(
		  this.buildPlacements(context, this.buildGeometry(context))
		);
	  },

	  scheduleUpdate() {
		if (this.updateRaf) return;

		this.updateRaf = requestAnimationFrame(() => {
		  this.updateRaf = null;
		  this.update();
		});
	  },

	  refreshTimingVars() {
		this.hideDelayMs = cssVar.timeMs("--section-hint-hide-delay", 1000);
		this.fadeDurationMs = cssVar.timeMs("--section-hint-fade-duration", 500);
		this.showScrollDistancePx = cssVar.lengthPx(
		  "--section-hint-show-scroll-distance",
		  window.innerHeight
		);
	  },

	  clearHideTimer() {
		this.hideTimer = utils.clearTimer(this.hideTimer);
	  },

	  clearHideCompleteTimer() {
		this.hideCompleteTimer = utils.clearTimer(this.hideCompleteTimer);
	  },

	  clearStopDetection() {
		if (this.stopCheckRaf) {
		  cancelAnimationFrame(this.stopCheckRaf);
		  this.stopCheckRaf = null;
		}

		this.stableSinceTs = 0;
	  },
	  
	  resetSession() {
		  this.gesture.type = null;
		  this.gesture.active = false;
		  this.gesture.distance = 0;
		  this.gesture.sessionHadTouch = false;
		  this.gesture.sessionUnlocked = false;
		  this.clearStopDetection();
		},

		relockScrollDistanceAfterStop() {
		  this.gesture.distance = 0;
		  this.gesture.sessionUnlocked = false;
		  this.gesture.active = false;
		  this.lastObservedScrollY = window.scrollY;
		  this.lastStopCheckY = window.scrollY;
		},

	  beginGesture(type) {
		  this.clearHideTimer();
		  this.clearHideCompleteTimer();
		  this.clearStopDetection();

		  const startsNewTouchSession =
			type === "touch" &&
			!this.gesture.active &&
			!this.gesture.sessionHadTouch &&
			!this.isVisible;

		  this.gesture.type = type;
		  this.gesture.active = true;

		  // Distanz NICHT bei jeder neuen Wischgeste zurücksetzen
		  // sondern nur bei wirklich neuer Session
		  if (startsNewTouchSession) {
			this.gesture.distance = 0;
			this.gesture.sessionUnlocked = false;
		  }

		  if (type === "touch") {
			this.gesture.sessionHadTouch = true;
			this.gesture.lastTouchStartTs = performance.now();
		  }

		  this.lastObservedScrollY = window.scrollY;
		  this.lastStopCheckY = window.scrollY;
		  this.stableSinceTs = 0;
		},

	  accumulateScrollDistance() {
		const currentY = window.scrollY;
		const delta = Math.abs(currentY - this.lastObservedScrollY);

		if (delta > 0) this.gesture.distance += delta;
		this.lastObservedScrollY = currentY;
	  },

	  hasReachedShowScrollDistance() {
		return this.gesture.distance >= this.showScrollDistancePx;
	  },

	  show() {
		if (!this.root) return;

		this.clearHideCompleteTimer();
		this.isVisible = true;

		this.root.classList.remove("is-instant-hidden");
		document.body.classList.remove("hints-instant-hide");

		this.root.classList.add("is-visible");
		document.body.classList.add("hints-visible");
	  },

	  hide() {
		if (!this.root) return;

		this.isVisible = false;
		this.root.classList.remove("is-visible");
		document.body.classList.remove("hints-visible");

		this.scheduleRelockAfterFullyHidden();
	  },

	  scheduleRelockAfterFullyHidden() {
		this.clearHideCompleteTimer();

		this.hideCompleteTimer = setTimeout(() => {
		  this.hideCompleteTimer = null;
		}, this.fadeDurationMs);
	  },
	  
	  startHideCountdown() {
		  this.clearHideTimer();

		  this.hideTimer = setTimeout(() => {
			this.hide();

			// Erst NACH dem Ausblenden / nach der Delay wieder sperren
			this.relockScrollDistanceAfterStop();

			// Touch-Session darf danach beendet sein
			this.gesture.type = null;
			this.gesture.sessionHadTouch = false;
		  }, this.hideDelayMs);
		},  
	  
	  scheduleStopDetection() {
		  this.clearStopDetection();

		  this.lastStopCheckY = window.scrollY;
		  this.stableSinceTs = 0;

		  const check = (now) => {
			if (state.scroll.programmatic) return;

			const currentY = window.scrollY;
			const delta = Math.abs(currentY - this.lastStopCheckY);

			if (delta <= this.movementTolerancePx) {
			  if (!this.stableSinceTs) {
				this.stableSinceTs = now;
			  }

			  if (now - this.stableSinceTs >= this.restStableMs) {
				this.stopCheckRaf = null;

				// FALL A:
				// Schwelle noch nicht erreicht -> sofort Distanz zurücksetzen
				if (!this.gesture.sessionUnlocked) {
				  this.relockScrollDistanceAfterStop();
				  this.hide();
				  return;
				}

				// FALL B:
				// Schwelle erreicht / Hints sichtbar -> erst hide-delay abwarten,
				// dann ausblenden und danach Distanz zurücksetzen
				if (this.isVisible) {
				  this.startHideCountdown();
				  return;
				}

				// Fallback
				this.relockScrollDistanceAfterStop();
				return;
			  }
			} else {
			  this.stableSinceTs = 0;
			  this.lastStopCheckY = currentY;
			}

			this.stopCheckRaf = requestAnimationFrame(check);
		  };

		  this.stopCheckRaf = requestAnimationFrame(check);
		},

	  scheduleHide() {
		this.scheduleStopDetection();
	  },

	  handleScrollActivity() {
		if (state.scroll.programmatic) {
		  this.hideImmediatelyForProgrammaticScroll();
		  return;
		}

		this.lastScrollTs = performance.now();
		this.accumulateScrollDistance();

		this.clearHideTimer();
		this.clearHideCompleteTimer();
		this.clearStopDetection();

		if (!this.gesture.sessionHadTouch && !this.gesture.sessionUnlocked) {
		  this.hide();
		  return;
		}
		
		if (!this.gesture.sessionUnlocked) {
		  if (!this.hasReachedShowScrollDistance()) {
			this.hide();

			// Wichtig:
			// Auch unterhalb der Schwelle weiter prüfen,
			// damit bei Stillstand sofort auf 0 zurückgesetzt wird
			this.scheduleStopDetection();
			return;
		  }

		  this.gesture.sessionUnlocked = true;
		}

		this.show();
		this.scheduleStopDetection();
	  },

	  hideImmediatelyForProgrammaticScroll() {
		if (!this.root) return;

		this.clearHideTimer();
		this.clearHideCompleteTimer();
		this.clearStopDetection();
		this.resetSession();

		this.isVisible = false;

		this.root.classList.add("is-instant-hidden");
		document.body.classList.add("hints-instant-hide");

		this.root.classList.remove("is-visible");
		document.body.classList.remove("hints-visible");

		requestAnimationFrame(() => {
		  requestAnimationFrame(() => {
			this.root?.classList.remove("is-instant-hidden");
			document.body.classList.remove("hints-instant-hide");
		  });
		});
	  },

	  bindEvents() {
		const onTouchStart = () => {
		  this.beginGesture("touch");
		};

		const onTouchEndLike = () => {
		  this.gesture.lastTouchEndTs = performance.now();
		  this.gesture.active = false;
		  this.lastObservedScrollY = window.scrollY;

		  /* Kein Hide hier:
			 touchend ist nicht gleich scroll end. */
		};

		window.addEventListener(
		  "scroll",
		  () => {
			this.scheduleUpdate();

			if (state.scroll.programmatic) {
			  this.hideImmediatelyForProgrammaticScroll();
			  return;
			}

			this.handleScrollActivity();
		  },
		  { passive: true }
		);

		window.addEventListener("touchstart", onTouchStart, { passive: true });
		window.addEventListener("touchend", onTouchEndLike, { passive: true });
		window.addEventListener("touchcancel", onTouchEndLike, { passive: true });

		window.addEventListener(
		  "pointerdown",
		  (e) => {
			if (e.pointerType === "mouse") {
			  this.resetSession();
			  this.clearHideTimer();
			  this.clearStopDetection();
			  this.hide();
			}
		  },
		  { passive: true }
		);

		window.addEventListener(
		  "wheel",
		  () => {
			this.resetSession();
			this.clearHideTimer();
			this.clearStopDetection();
			this.hide();
		  },
		  { passive: true }
		);

		window.addEventListener("keydown", () => {
		  this.resetSession();
		  this.clearHideTimer();
		  this.clearStopDetection();
		  this.hide();
		});

		if ("onscrollend" in document) {
		  document.addEventListener(
			"scrollend",
			() => {
			  if (state.scroll.programmatic) return;
			  if (!this.gesture.sessionUnlocked) return;

			  this.scheduleStopDetection();
			},
			{ passive: true }
		  );
		}

		const onResize = () => {
		  this.metricsCache.clear();
		  this.refreshTimingVars();
		  this.lastObservedScrollY = window.scrollY;
		  this.lastStopCheckY = window.scrollY;
		  this.scheduleUpdate();
		};

		window.addEventListener("resize", onResize);
		window.addEventListener("orientationchange", () => setTimeout(onResize, 120));

		if (window.visualViewport) {
		  window.visualViewport.addEventListener("resize", onResize);
		  window.visualViewport.addEventListener(
			"scroll",
			() => this.scheduleUpdate(),
			{ passive: true }
		  );
		}	
	  },

	  init() {
		this.build();
		this.refreshTimingVars();
		this.bindHintClicks();
		this.hide();
		this.lastObservedScrollY = window.scrollY;
		this.lastStopCheckY = window.scrollY;
		this.update();
		this.bindEvents();
	  },
	};

  // ---------------------------------------------------------------------
  // 12) GALLERY-MODUL
  // ---------------------------------------------------------------------
  const galleryModule = {
    videos: [],
    currentIndex: 1,
    isAnimating: false,
    startX: 0,
    isDragging: false,

    buildVideos() {
      if (!DOM.track) return;

      const shuffled = utils.shuffle([...SETTINGS.gallery.videoFiles]);
      const fullList = [shuffled[shuffled.length - 1], ...shuffled, shuffled[0]];

      fullList.forEach((src) => {
        const video = document.createElement("video");

        video.src = src;
        video.playsInline = true;
        video.preload = "auto";
        video.controls = false;
        video.muted = true;

        video.addEventListener("loadeddata", () => {
          video.currentTime = 0.01;
        });

        video.addEventListener("pointerdown", (e) => {
          if (utils.isMobileViewport() && navbarModule.isOpen()) {
            e.preventDefault();
            e.stopPropagation();
          }
        });

        video.addEventListener("pointerup", (e) => {
          if (utils.isMobileViewport() && navbarModule.isOpen()) {
            e.preventDefault();
            e.stopPropagation();
            navbarModule.closeMenu();
            return;
          }

          e.stopPropagation();
          if (video.paused) {
            utils.safePlay(video);
          } else {
            video.pause();
          }
        });

        video.addEventListener("ended", () => {
          this.moveTo(this.currentIndex + 1, true);
        });

        DOM.track.appendChild(video);
        this.videos.push(video);
      });
    },

    playOnly(index) {
      this.videos.forEach((video, i) => {
        if (i === index) {
          video.currentTime = 0;
          utils.safePlay(video);
        } else {
          video.pause();
        }
      });
    },

    setPosition(index, animate = true) {
      if (!this.videos.length || !DOM.track) return;

      const videoWidth = this.videos[0].offsetWidth;
      const padding = DOM.track.parentElement.offsetWidth * 0.1;
      const offset = videoWidth * index - padding;

      DOM.track.style.transition = animate
        ? "transform 0.6s cubic-bezier(.16,.84,.44,1)"
        : "none";

      DOM.track.style.transform = `translateX(-${offset}px)`;
    },

    moveTo(index, autoPlay = false) {
      if (this.isAnimating) return;

      this.isAnimating = true;
      this.currentIndex = index;
      this.setPosition(this.currentIndex, true);

      if (autoPlay) {
        this.playOnly(this.currentIndex);
      } else {
        this.videos.forEach((video) => video.pause());
      }
    },

    bindTrackEvents() {
      if (!DOM.track) return;

      DOM.track.addEventListener("transitionend", () => {
        this.isAnimating = false;

        if (this.currentIndex === this.videos.length - 1) {
          this.currentIndex = 1;
        }

        if (this.currentIndex === 0) {
          this.currentIndex = this.videos.length - 2;
        }

        requestAnimationFrame(() => this.setPosition(this.currentIndex, false));
      });

      DOM.track.style.touchAction = "pan-y";

      DOM.track.addEventListener(
        "touchstart",
        (e) => {
          if (utils.isMobileViewport() && navbarModule.isOpen()) {
            e.preventDefault();
            return;
          }

          this.startX = e.touches[0].clientX;
          this.isDragging = true;
          DOM.track.style.transition = "none";
        },
        { passive: false }
      );

      DOM.track.addEventListener(
        "touchmove",
        (e) => {
          if (utils.isMobileViewport() && navbarModule.isOpen()) {
            e.preventDefault();
            return;
          }

          if (!this.isDragging || !this.videos.length) return;

          const diff = e.touches[0].clientX - this.startX;
          const videoWidth = this.videos[0].offsetWidth;
          const padding = DOM.track.parentElement.offsetWidth * 0.1;

          DOM.track.style.transform = `translateX(${
            -this.currentIndex * videoWidth + diff - padding
          }px)`;
        },
        { passive: false }
      );

      DOM.track.addEventListener(
        "touchend",
        (e) => {
          if (utils.isMobileViewport() && navbarModule.isOpen()) {
            e.preventDefault();
            this.isDragging = false;
            return;
          }

          if (!this.isDragging) return;

          const diff = e.changedTouches[0].clientX - this.startX;

          if (diff > SETTINGS.gallery.swipeThreshold) {
            this.moveTo(this.currentIndex - 1, true);
          } else if (diff < -SETTINGS.gallery.swipeThreshold) {
            this.moveTo(this.currentIndex + 1, true);
          } else {
            this.setPosition(this.currentIndex, true);
          }

          this.isDragging = false;
        },
        { passive: false }
      );
    },

    bindVisibilityEvents() {
      const gallerySection = document.querySelector(".gallery");

      if (gallerySection) {
        const observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (!this.videos[this.currentIndex]) return;

              if (entry.isIntersecting) {
                this.playOnly(this.currentIndex);
              } else {
                this.videos.forEach((video) => video.pause());
              }
            });
          },
          { threshold: 0.4 }
        );

        observer.observe(gallerySection);
      }

      document.addEventListener("visibilitychange", () => {
        if (document.hidden) {
          this.videos.forEach((video) => video.pause());
        } else {
          this.playOnly(this.currentIndex);
        }
      });

      window.addEventListener("resize", () => {
        this.setPosition(this.currentIndex, false);
      });
    },

    init() {
      if (!DOM.track) return;

      this.buildVideos();
      this.setPosition(this.currentIndex, false);
      this.playOnly(this.currentIndex);
      this.bindTrackEvents();
      this.bindVisibilityEvents();
    },
  };

  // ---------------------------------------------------------------------
  // 13) UI-MODUL (CTA, HERO-KLICK, PRICING TABS)
  // ---------------------------------------------------------------------
  const uiModule = {
    ctaMagneticButtons: [],
    ctaMagneticRunning: false,
    ctaMagneticLastFrame: 0,

    createMagneticItem(button) {
      return {
        button,
        label: button.querySelector(".cta-label"),
        gloss: button.querySelector(".cta-gloss"),
        isNear: false,

        targetX: 0,
        targetY: 0,
        targetScale: 1,
        targetShadowY: 0,
        targetShadowBlur: 0,
        targetShadowAlpha: 0,

        currentX: 0,
        currentY: 0,
        currentScale: 1,
        currentShadowY: 0,
        currentShadowBlur: 0,
        currentShadowAlpha: 0,

        velocityX: 0,
        velocityY: 0,
        velocityScale: 0,
        velocityShadowY: 0,
        velocityShadowBlur: 0,
        velocityShadowAlpha: 0,

        targetLabelX: 0,
        targetLabelY: 0,
        targetLabelScale: 1,
        currentLabelX: 0,
        currentLabelY: 0,
        currentLabelScale: 1,
        velocityLabelX: 0,
        velocityLabelY: 0,
        velocityLabelScale: 0,

        targetGlossX: 50,
        targetGlossY: 50,
        targetGlossOpacity: 0,
        currentGlossX: 50,
        currentGlossY: 50,
        currentGlossOpacity: 0,
        velocityGlossX: 0,
        velocityGlossY: 0,
        velocityGlossOpacity: 0,
      };
    },

    resetMagneticItem(item) {
      item.isNear = false;
      item.button.classList.remove("is-magnetic-near", "is-hovered");

      item.targetX = 0;
      item.targetY = 0;
      item.targetScale = 1;
      item.targetShadowY = 0;
      item.targetShadowBlur = 0;
      item.targetShadowAlpha = 0;

      item.targetLabelX = 0;
      item.targetLabelY = 0;
      item.targetLabelScale = 1;

      item.targetGlossX = 50;
      item.targetGlossY = 50;
      item.targetGlossOpacity = 0;
    },

    resetCtaMagnetic() {
      this.ctaMagneticButtons.forEach((item) => {
        this.resetMagneticItem(item);

        item.currentX = 0;
        item.currentY = 0;
        item.currentScale = 1;
        item.currentShadowY = 0;
        item.currentShadowBlur = 0;
        item.currentShadowAlpha = 0;

        item.velocityX = 0;
        item.velocityY = 0;
        item.velocityScale = 0;
        item.velocityShadowY = 0;
        item.velocityShadowBlur = 0;
        item.velocityShadowAlpha = 0;

        item.currentLabelX = 0;
        item.currentLabelY = 0;
        item.currentLabelScale = 1;
        item.velocityLabelX = 0;
        item.velocityLabelY = 0;
        item.velocityLabelScale = 0;

        item.currentGlossX = 50;
        item.currentGlossY = 50;
        item.currentGlossOpacity = 0;
        item.velocityGlossX = 0;
        item.velocityGlossY = 0;
        item.velocityGlossOpacity = 0;

        utils.setVars(item.button, {
          "--magnetic-x": "0px",
          "--magnetic-y": "0px",
          "--magnetic-scale": "1",
          "--magnetic-shadow-y": "0px",
          "--magnetic-shadow-blur": "0px",
          "--magnetic-shadow-alpha": "0",
          "--label-x": "0px",
          "--label-y": "0px",
          "--label-scale": "1",
          "--gloss-x": "50%",
          "--gloss-y": "50%",
          "--gloss-opacity": "0",
        });
      });
    },

    startCtaMagneticAnimation() {
      if (this.ctaMagneticRunning) return;

      this.ctaMagneticRunning = true;
      this.ctaMagneticLastFrame = performance.now();

      requestAnimationFrame(this.animateCtaMagnetic.bind(this));
    },

    animateCtaMagnetic(now) {
      this.ctaMagneticRunning = true;

      let delta = (now - this.ctaMagneticLastFrame) / 16.67;
      this.ctaMagneticLastFrame = now;
      delta = Math.min(delta, 2);

      let hasMotion = false;

      this.ctaMagneticButtons.forEach((item) => {
        const spring = item.isNear ? 0.16 : 0.11;
        const damping = item.isNear ? 0.78 : 0.82;

        const stepSpring = (current, target, velocity) => {
          const force = (target - current) * spring;
          velocity += force * delta;
          velocity *= Math.pow(damping, delta);
          current += velocity * delta;
          return { current, velocity };
        };

        [
          "X",
          "Y",
          "Scale",
          "ShadowY",
          "ShadowBlur",
          "ShadowAlpha",
          "LabelX",
          "LabelY",
          "LabelScale",
          "GlossX",
          "GlossY",
          "GlossOpacity",
        ].forEach((suffix) => {
          const currentKey = `current${suffix}`;
          const targetKey = `target${suffix}`;
          const velocityKey = `velocity${suffix}`;

          const result = stepSpring(
            item[currentKey],
            item[targetKey],
            item[velocityKey]
          );

          item[currentKey] = result.current;
          item[velocityKey] = result.velocity;
        });

        utils.setVars(item.button, {
          "--magnetic-x": `${item.currentX.toFixed(2)}px`,
          "--magnetic-y": `${item.currentY.toFixed(2)}px`,
          "--magnetic-scale": item.currentScale.toFixed(4),
          "--magnetic-shadow-y": `${item.currentShadowY.toFixed(2)}px`,
          "--magnetic-shadow-blur": `${item.currentShadowBlur.toFixed(2)}px`,
          "--magnetic-shadow-alpha": item.currentShadowAlpha.toFixed(3),
          "--label-x": `${item.currentLabelX.toFixed(2)}px`,
          "--label-y": `${item.currentLabelY.toFixed(2)}px`,
          "--label-scale": item.currentLabelScale.toFixed(4),
          "--gloss-x": `${item.currentGlossX.toFixed(2)}%`,
          "--gloss-y": `${item.currentGlossY.toFixed(2)}%`,
          "--gloss-opacity": item.currentGlossOpacity.toFixed(3),
        });

        const moving = [
          Math.abs(item.targetX - item.currentX) > 0.01,
          Math.abs(item.targetY - item.currentY) > 0.01,
          Math.abs(item.targetScale - item.currentScale) > 0.001,
          Math.abs(item.targetShadowY - item.currentShadowY) > 0.01,
          Math.abs(item.targetShadowBlur - item.currentShadowBlur) > 0.01,
          Math.abs(item.targetShadowAlpha - item.currentShadowAlpha) > 0.001,
          Math.abs(item.targetLabelX - item.currentLabelX) > 0.01,
          Math.abs(item.targetLabelY - item.currentLabelY) > 0.01,
          Math.abs(item.targetLabelScale - item.currentLabelScale) > 0.001,
          Math.abs(item.targetGlossX - item.currentGlossX) > 0.01,
          Math.abs(item.targetGlossY - item.currentGlossY) > 0.01,
          Math.abs(item.targetGlossOpacity - item.currentGlossOpacity) > 0.001,
          Math.abs(item.velocityX) > 0.01,
          Math.abs(item.velocityY) > 0.01,
          Math.abs(item.velocityScale) > 0.001,
          Math.abs(item.velocityShadowY) > 0.01,
          Math.abs(item.velocityShadowBlur) > 0.01,
          Math.abs(item.velocityShadowAlpha) > 0.001,
          Math.abs(item.velocityLabelX) > 0.01,
          Math.abs(item.velocityLabelY) > 0.01,
          Math.abs(item.velocityLabelScale) > 0.001,
          Math.abs(item.velocityGlossX) > 0.01,
          Math.abs(item.velocityGlossY) > 0.01,
          Math.abs(item.velocityGlossOpacity) > 0.001,
        ].some(Boolean);

        if (moving) hasMotion = true;
      });

      if (!hasMotion) {
        this.ctaMagneticRunning = false;
        return;
      }

      requestAnimationFrame(this.animateCtaMagnetic.bind(this));
    },
  
  bindCTA() {
	state.ui.ctaDefaultLabel = DOM.ctaLabel?.textContent?.trim() || "Termin vereinbaren";

	DOM.cta?.addEventListener("click", (e) => {
		e.preventDefault();
		e.stopPropagation();

		this.toggleHeroCalendar();
	});

      this.ctaMagneticButtons = [...document.querySelectorAll(".cta-button")].map(
        (button) => this.createMagneticItem(button)
      );

      const applyMagneticField = (item, clientX, clientY) => {
		  if (item.button.classList.contains("calendar-open")) {
				this.resetMagneticItem(item);
				return;
			} 
		  
        if (
          document.body.classList.contains("nav-menu-open") ||
          (utils.isMobileViewport() && navbarModule.isOpen()) ||
          document.body.classList.contains("suppress-cta-hover")
        ) {
          this.resetMagneticItem(item);
          return;
        }

        const rect = item.button.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const dx = clientX - centerX;
        const dy = clientY - centerY;

        const nx = dx / (rect.width * 1.15);
        const ny = dy / (rect.height * 1.9);
        const rawDistance = Math.sqrt(nx * nx + ny * ny);

        if (rawDistance > 1) {
          this.resetMagneticItem(item);
          return;
        }

        item.isNear = true;
        item.button.classList.add("is-magnetic-near");

        const proximity = 1 - rawDistance;
        const eased = 1 - Math.pow(1 - proximity, 3);
        const shaped = Math.pow(eased, 1.6);

        const innerNX = dx / (rect.width / 2);
        const innerNY = dy / (rect.height / 2);
        const innerDistance = Math.sqrt(innerNX * innerNX + innerNY * innerNY);

        const insideButton = innerDistance <= 1;
        const innerProximity = insideButton ? 1 - innerDistance : 0;

        const innerBoost = insideButton
          ? Math.pow(1 - Math.pow(1 - innerProximity, 3), 1.15)
          : 0;

        const combinedStrength = insideButton
          ? Math.min(0.32 * shaped + 0.68 * innerBoost, 1)
          : Math.min(0.62 * shaped, 0.5);

        const length = Math.hypot(dx, dy) || 1;
        const dirX = dx / length;
        const dirY = dy / length;

        item.targetX = dirX * Math.min(rect.width * 0.12, 15) * combinedStrength;
        item.targetY = dirY * Math.min(rect.height * 0.26, 11) * combinedStrength;
        item.targetScale = 1 + combinedStrength * 0.014;

        item.targetShadowY = 10 + combinedStrength * 12;
        item.targetShadowBlur = 28 + combinedStrength * 20;
        item.targetShadowAlpha = 0.12 + combinedStrength * 0.18;

        item.targetLabelX =
          dirX *
          Math.min(rect.width * 0.065, 10) *
          Math.min(combinedStrength * 1.18, 1);

        item.targetLabelY =
          dirY *
          Math.min(rect.height * 0.11, 6) *
          Math.min(combinedStrength * 1.18, 1);

        item.targetLabelScale = 1 + combinedStrength * 0.01;

        item.targetGlossX = clamp(
          ((clientX - rect.left) / rect.width) * 100,
          0,
          100
        );

        item.targetGlossY = clamp(
          ((clientY - rect.top) / rect.height) * 100,
          0,
          100
        );

        item.targetGlossOpacity = 0.18 + combinedStrength * 0.24;
      };

      window.addEventListener(
        "pointermove",
        (e) => {
          if (e.pointerType !== "mouse") {
            this.ctaMagneticButtons.forEach((item) =>
              this.resetMagneticItem(item)
            );
            this.startCtaMagneticAnimation();
            return;
          }

          this.ctaMagneticButtons.forEach((item) =>
            applyMagneticField(item, e.clientX, e.clientY)
          );

          this.startCtaMagneticAnimation();
        },
        { passive: true }
      );

      window.addEventListener("pointerleave", () => {
        this.ctaMagneticButtons.forEach((item) => this.resetMagneticItem(item));
        this.startCtaMagneticAnimation();
      });

      this.ctaMagneticButtons.forEach((item) => {
        item.button.addEventListener("blur", () => {
          this.resetMagneticItem(item);
          item.button.classList.remove("is-hovered");
          this.startCtaMagneticAnimation();
        });

        item.button.addEventListener("pointerenter", (e) => {
          if (
            e.pointerType === "mouse" &&
            !document.body.classList.contains("suppress-cta-hover") &&
            !document.body.classList.contains("nav-menu-open")
          ) {
            item.button.classList.add("is-hovered");
          }
        });

        item.button.addEventListener("pointerleave", () => {
          item.button.classList.remove("is-hovered");
        });

        item.button.addEventListener("pointerdown", (e) => {
          if (e.pointerType !== "mouse") {
            item.button.classList.remove("is-hovered");
          }
        });
      });
    },
    
	bindHeroClickBehavior() {
		DOM.hero?.addEventListener("click", (e) => {
			if (!DOM.navbar || (utils.isMobileViewport() && navbarModule.isOpen())) {
				return;
			}

			if (state.ui.heroCalendarAnimating) {
				return;
			}

			if (
				state.ui.heroCalendarOpen &&
				(
					e.target.closest("#hero-calendar") ||
					e.target.closest("#hero-fullcalendar")
				)
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
				getComputedStyle(DOM.navbar).getPropertyValue("--nav-visible")
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
      DOM.pricingTabs.forEach((tab) => {
        tab.addEventListener("click", () => {
          if (utils.isMobileViewport() && navbarModule.isOpen()) return;

          DOM.pricingTabs.forEach((item) => item.classList.remove("active"));
          DOM.pricingContents.forEach((item) => item.classList.remove("active"));

          tab.classList.add("active");
          document.getElementById(tab.dataset.tab)?.classList.add("active");
        });
      });
    },

    setInitialVisualState() {
      if (DOM.hero) {
        DOM.hero.style.setProperty(
          "--hero-brightness",
          1 -
            Math.min(window.scrollY / window.innerHeight, 1) *
              physics.values.heroBrightnessScrollFactor
        );
      }

      if (DOM.navbar && utils.prefersReducedMotion()) {
        utils.setVars(DOM.navbar, {
          "--nav-visible": 1,
          "--nav-compact": 1,
          "--nav-surface": 1,
          "--nav-height-progress": 1,
          "--nav-gesture-stretch": "0px",
        });
      }

      if (DOM.year) {
        DOM.year.textContent = String(new Date().getFullYear());
      }
    },

	getCalendarConfig() {
		return {
			googleCalendarApiKey: "AIzaSyDqAZYI2AbNdax1SmFtBZte87Gix3NOh30",
			calendarId: "1f06dd46653f2c54d7dfde59ea175a8c346e7fcb2835f433d2238a2f3ae8c5a2@group.calendar.google.com",
		};
	},

	ensureFullCalendar() {
		if (state.ui.fullCalendarInstance || !DOM.heroCalendarEl) return;

		const { googleCalendarApiKey, calendarId } = this.getCalendarConfig();

		state.ui.fullCalendarInstance = new FullCalendar.Calendar(DOM.heroCalendarEl, {
			locale: "de",
			timeZone: "Europe/Berlin",
			initialView: window.innerWidth <= 768 ? "listMonth" : "dayGridMonth",
			height: "100%",
			firstDay: 1,
			weekends: true,
			navLinks: false,
			nowIndicator: true,
			expandRows: true,
			headerToolbar: {
				left: "prev,next today",
				center: "title",
				right: window.innerWidth <= 768
					? "listMonth,dayGridMonth"
					: "dayGridMonth,timeGridWeek,listMonth"
			},
			buttonText: {
				today: "Heute",
				month: "Monat",
				week: "Woche",
				list: "Liste"
			},
			noEventsContent: "Keine Termine vorhanden",
			eventTimeFormat: {
				hour: "2-digit",
				minute: "2-digit",
				hour12: false
			},
			googleCalendarApiKey,
			events: {
				googleCalendarId: calendarId
			},
			eventClick(info) {
				if (info.event.url) {
					info.jsEvent.preventDefault();
					window.open(info.event.url, "_blank", "noopener");
				}
			},
			loading(isLoading) {
				DOM.heroCalendarEl.classList.toggle("is-loading", isLoading);
			}
		});

		state.ui.fullCalendarInstance.render();
	},

	destroyFullCalendar() {
		if (!state.ui.fullCalendarInstance) return;
		state.ui.fullCalendarInstance.destroy();
		state.ui.fullCalendarInstance = null;
	},

	updateFullCalendarSize() {
		if (!state.ui.fullCalendarInstance) return;
		state.ui.fullCalendarInstance.updateSize();
	},

	refreshFullCalendarView() {
		if (!state.ui.fullCalendarInstance) return;

		const nextView = window.innerWidth <= 768 ? "listMonth" : "dayGridMonth";
		const currentView = state.ui.fullCalendarInstance.view?.type;

		if (currentView !== nextView) {
			state.ui.fullCalendarInstance.changeView(nextView);
		}

		state.ui.fullCalendarInstance.updateSize();
	},
	
	getHomeAboutBoundaryEl() {
	  return document.querySelector("#about");
	},
	
	getHeroCalendarGap() {
		return cssVar.lengthPx("--hero-calendar-gap", 20);
	},
	
	getHeroCalendarAutoCloseOffset() {
		return window.innerWidth <= 768 ? 160 : 24;
	},

	positionHeroCalendar() {
		if (!DOM.heroCalendar) return;

		const layout = this.measureHeroCalendarLayout();

		state.ui.heroCalendarMeasuredTop = layout.calendarTop;
		state.ui.heroCalendarMeasuredHeight = layout.calendarHeight;
		state.ui.heroCalendarMeasuredExtra = layout.extraHeight;

		this.applyMeasuredHeroCalendarBox();
	},

	openHeroCalendar() {
		if (!DOM.cta || !DOM.heroCalendar || !DOM.hero) return;
		if (state.ui.heroCalendarAnimating || state.ui.heroCalendarOpen) return;

		this.clearHeroCalendarTimers();
		this.resetCtaMagnetic();
		navbarModule.applyCtaNeutralState();

		DOM.hero.classList.add("hero-calendar-active");
		DOM.hero.classList.add("hero-calendar-lock-motion");

		state.ui.heroCalendarKeepCtaFlat = true;
		state.ui.heroCalendarAnimating = true;
		resetAnimatedValue(state.cta.elasticY, 0);
		navbarModule.renderCTA();

		this.ensureFullCalendar();
		this.positionHeroCalendar();

		DOM.cta.classList.add("calendar-open");
		DOM.cta.classList.remove("is-hovered", "is-magnetic-near");
		DOM.cta.setAttribute("aria-expanded", "true");

		if (DOM.ctaLabel) {
			DOM.ctaLabel.textContent = "Kalender schließen";
		}

		DOM.hero.classList.add("hero-calendar-open");
		DOM.heroCalendar.setAttribute("aria-hidden", "true");
		DOM.heroCalendar.classList.remove("is-open");

		this.applyMeasuredHeroCalendarBox();

		this.freezeNavbarForHeroCalendar();

		this.animateHeroCalendarLayout(0, state.ui.heroCalendarMeasuredExtra, {
			mode: "open",
			onComplete: () => {
				
				state.ui.heroCalendarOpen = true;

				state.ui.heroCalendarRevealTimer = setTimeout(() => {
					DOM.heroCalendar.classList.add("is-open");
					DOM.heroCalendar.setAttribute("aria-hidden", "false");

					requestAnimationFrame(() => {
						this.updateFullCalendarSize();
					});
				}, this.getHeroCalendarRevealDelay());
			},
		});
	},
	
	//~ closeHeroCalendar({ preserveAboutBoundaryAtTop = false } = {}) {
		
	
	closeHeroCalendar({ preserveAboutBoundaryAtTop = false, source = "unknown" } = {}) {
		if (!DOM.cta || !DOM.heroCalendar || !DOM.hero) return;
		if (state.ui.heroCalendarAnimating || !state.ui.heroCalendarOpen) return;

		state.ui.heroCalendarAnimating = true;
		this.clearHeroCalendarTimers();

		DOM.heroCalendar.classList.remove("is-open");
		DOM.heroCalendar.setAttribute("aria-hidden", "true");

		/* erst Kalender ausblenden, dann Layout zurückfahren */
		state.ui.heroCalendarRevealTimer = setTimeout(() => {
			this.freezeNavbarForHeroCalendar();
					
			this.animateHeroCalendarLayout(
				state.ui.heroCalendarExtraHeight,
				0,
				{
					mode: preserveAboutBoundaryAtTop
						? "close-keep-about-position"
						: "close",			
					
					onComplete: () => {
						state.ui.heroCalendarOpen = false;

						DOM.cta.classList.remove("calendar-open");
						DOM.cta.setAttribute("aria-expanded", "false");

						if (DOM.ctaLabel) {
							DOM.ctaLabel.textContent =
								state.ui.ctaDefaultLabel || "Termin vereinbaren";
						}

						DOM.hero.classList.remove("hero-calendar-open");
						DOM.hero.classList.remove("hero-calendar-active");
						DOM.hero.classList.remove("hero-calendar-lock-motion");
						DOM.heroCalendar.style.top = "";
						DOM.heroCalendar.style.height = "";

						this.destroyFullCalendar();

						resetAnimatedValue(state.cta.elasticY, 0);
						navbarModule.renderCTA();

						navbarModule.suppressCtaHoverTemporarily(250);

						this.restoreNavbarAfterHeroCalendar();
					},
				}
			);
		}, this.getHeroCalendarRevealDelay());
	},
	
	toggleHeroCalendar() {
		if (state.ui.heroCalendarAnimating) return;

		if (state.ui.heroCalendarOpen) {
			this.closeHeroCalendar();
		} else {
			this.openHeroCalendar();
		}
	},
	
	closeHeroCalendarIfHeroFullyOut() {
		if (!state.ui.heroCalendarOpen) return;
		if (state.ui.heroCalendarAnimating) return;
		if (state.scroll.programmatic) return;
		if (state.scrollDirection !== "down") return;

		const about = this.getHomeAboutBoundaryEl();
		if (!about) return;

		const navbarBottom = DOM.navbar
			? DOM.navbar.getBoundingClientRect().bottom
			: 0;

		const aboutTop = about.getBoundingClientRect().top;

		/* Hysterese:
		   erst "armen", wenn about wirklich an der Navbar ist */
		const autoCloseOffset = this.getHeroCalendarAutoCloseOffset();
		if (aboutTop <= navbarBottom - autoCloseOffset) {	
			if (state.ui.heroCalendarAutoCloseArmed) return;

			state.ui.heroCalendarAutoCloseArmed = true;

			clearTimeout(state.ui.heroCalendarAutoCloseTimer);
			state.ui.heroCalendarAutoCloseTimer = setTimeout(() => {
				state.ui.heroCalendarAutoCloseTimer = null;

				/* vor dem echten Close nochmal prüfen */
				if (!state.ui.heroCalendarOpen) return;
				if (state.ui.heroCalendarAnimating) return;

				const currentAboutTop = about.getBoundingClientRect().top;
				const currentNavbarBottom = DOM.navbar
					? DOM.navbar.getBoundingClientRect().bottom
					: 0;

				/* Nur schließen, wenn die Bedingung immer noch stabil gilt */
				if (currentAboutTop <= currentNavbarBottom - autoCloseOffset) {
					this.closeHeroCalendar({
						preserveAboutBoundaryAtTop: true,
						source: "closeHeroCalendarIfHeroFullyOut"
					});
				} else {
					state.ui.heroCalendarAutoCloseArmed = false;
				}
			}, 180);

			return;
		}

		/* Wenn wieder oberhalb der Grenze, Trigger zurücksetzen */
		state.ui.heroCalendarAutoCloseArmed = false;
		clearTimeout(state.ui.heroCalendarAutoCloseTimer);
		state.ui.heroCalendarAutoCloseTimer = null;
	},
	
	getHeroCalendarLayoutDuration() {
		return cssVar.timeMs("--hero-calendar-layout-duration", 750);
	},

	getHeroCalendarRevealDelay() {
		return cssVar.timeMs("--hero-calendar-reveal-delay", 180);
	},

	getHeroCalendarPreferredHeight() {
		return cssVar.lengthPx(
			"--hero-calendar-preferred-height",
			window.innerWidth <= 768 ? 520 : 560
		);
	},
	
	setHeroCalendarExtraHeight(px) {
		const value = Math.max(0, px);
		state.ui.heroCalendarExtraHeight = value;

		DOM.hero?.style.setProperty("--hero-calendar-extra-height", `${value}px`);
		DOM.heroContent?.style.setProperty("--hero-calendar-extra-height", `${value}px`);

		document.documentElement.style.setProperty(
			"--hero-calendar-extra-height-global",
			`${value}px`
		);
	},
	
	clearHeroCalendarTimers() {
		if (state.ui.heroCalendarLayoutRaf) {
			cancelAnimationFrame(state.ui.heroCalendarLayoutRaf);
			state.ui.heroCalendarLayoutRaf = null;
		}

		clearTimeout(state.ui.heroCalendarRevealTimer);
		state.ui.heroCalendarRevealTimer = null;

		clearTimeout(state.ui.heroCalendarCloseTimer);
		state.ui.heroCalendarCloseTimer = null;

		clearTimeout(state.ui.heroCalendarAutoCloseTimer);
		state.ui.heroCalendarAutoCloseTimer = null;
		state.ui.heroCalendarAutoCloseArmed = false;

		this.unlockHeroCalendarScrollBehavior();
	},

	easeHeroCalendar(t) {
		return 1 - Math.pow(1 - t, 3);
	},
		
	measureHeroCalendarLayout() {
		if (!DOM.hero || !DOM.heroCalendar || !DOM.cta) {
			return { extraHeight: 0, calendarTop: 0, calendarHeight: 0 };
		}

		const heroDescription = document.querySelector(".hero-description");
		if (!heroDescription) {
			return { extraHeight: 0, calendarTop: 0, calendarHeight: 0 };
		}

		const heroRect = DOM.hero.getBoundingClientRect();
		const descRect = heroDescription.getBoundingClientRect();

		const gap = this.getHeroCalendarGap();

		/* Kalender startet direkt unter der Description */
		const calendarTop = Math.round((descRect.bottom - heroRect.top) + gap);

		/* Zielhöhe des Kalenderkastens */
		const preferredCalendarHeight = this.getHeroCalendarPreferredHeight();

		/* CTA-Geometrie */
		const ctaBottomOffset = cssVar.lengthPx("--hero-cta-gap-to-boundary", 90);
		const ctaHeight =
			DOM.cta.offsetHeight || cssVar.lengthPx("--hero-cta-height", 64);

		/* Benötigte Hero-Gesamthöhe */
		const requiredHeroHeight =
			calendarTop +
			preferredCalendarHeight +
			gap +
			ctaHeight +
			ctaBottomOffset;

		/* Harte Untergrenze, weil dein Layout real mehr Platz braucht
		   als die Berechnung zuverlässig liefert */
		const absoluteMinExtra =
			window.innerWidth <= 768 ? 520 : 600;

		const extraHeight = Math.max(
			absoluteMinExtra,
			Math.ceil(requiredHeroHeight - DOM.hero.offsetHeight + 120)
		);

		return {
			extraHeight,
			calendarTop,
			calendarHeight: preferredCalendarHeight,
		};
	},

	applyMeasuredHeroCalendarBox() {
		if (!DOM.heroCalendar) return;

		DOM.heroCalendar.style.top = `${state.ui.heroCalendarMeasuredTop}px`;
		DOM.heroCalendar.style.height = `${state.ui.heroCalendarMeasuredHeight}px`;
	},

	animateHeroCalendarLayout(from, to, { mode = "open", onComplete } = {}) {
		DOM.hero?.classList.add("hero-calendar-active");

		const duration = this.getHeroCalendarLayoutDuration();
		const start = performance.now();

		const about = this.getHomeAboutBoundaryEl();
		const startScrollY = window.scrollY;
		const startAboutViewportTop = about ? about.getBoundingClientRect().top : 0;

		state.scroll.programmatic = true;
		this.lockHeroCalendarScrollBehavior();

		const step = (now) => {
			const t = Math.min(1, (now - start) / duration);
			const eased = this.easeHeroCalendar(t);

			const currentExtra = from + ((to - from) * eased);
			this.setHeroCalendarExtraHeight(currentExtra);

			let nextScrollY = startScrollY;

			if (mode === "open") {
				/* Öffnen: Grenze exakt an ihrer Startposition halten */
				if (about) {
					const currentAboutTop = about.getBoundingClientRect().top;
					const deltaToTarget = currentAboutTop - startAboutViewportTop;
					nextScrollY = window.scrollY + deltaToTarget;
				}
			} else if (mode === "close-keep-about-position") {
				/* Schließen beim Herunterscrollen:
				   Grenze exakt dort halten, wo sie beim Start des Schließens war */
				if (about) {
					const currentAboutTop = about.getBoundingClientRect().top;
					const deltaToTarget = currentAboutTop - startAboutViewportTop;
					nextScrollY = window.scrollY + deltaToTarget;
				}
			} else if (mode === "close") {
				/* normales manuelles Schließen */
				const scrollDeltaTotal = from - to;
				nextScrollY = startScrollY - (scrollDeltaTotal * eased);
			}

			window.scrollTo(0, Math.max(0, nextScrollY));
			state.lastScrollY = window.scrollY;

			if (state.ui.fullCalendarInstance) {
				state.ui.fullCalendarInstance.updateSize();
			}

			if (t < 1) {
				state.ui.heroCalendarLayoutRaf = requestAnimationFrame(step);
				return;
			}

			state.ui.heroCalendarLayoutRaf = null;
			state.ui.heroCalendarAnimating = false;
			state.scroll.programmatic = false;

			this.setHeroCalendarExtraHeight(to);

			if (about && (mode === "open" || mode === "close-keep-about-position")) {
				const finalAboutTop = about.getBoundingClientRect().top;
				window.scrollTo(0, Math.max(0, window.scrollY + (finalAboutTop - startAboutViewportTop)));
			} else if (mode === "close") {
				window.scrollTo(0, Math.max(0, startScrollY - (from - to)));
			}

			state.lastScrollY = window.scrollY;

			this.unlockHeroCalendarScrollBehavior();
			navbarModule.handleScroll();
			onComplete?.();
		};

		state.ui.heroCalendarLayoutRaf = requestAnimationFrame(step);
	},
	
	lockHeroCalendarScrollBehavior() {
		document.documentElement.classList.add("disable-overscroll");
		document.documentElement.classList.add("hero-calendar-animating");
	},

	unlockHeroCalendarScrollBehavior() {
		document.documentElement.classList.remove("disable-overscroll");
		document.documentElement.classList.remove("hero-calendar-animating");
	},
		
	freezeNavbarForHeroCalendar() {
		state.ui.heroCalendarNavbarFreeze = true;
	},
	
	restoreNavbarAfterHeroCalendar() {
		state.ui.heroCalendarNavbarFreeze = false;

		state.nav.gestureStretch.current = 0;
		state.nav.gestureStretch.target = 0;

		/* Wichtig:
		   KEIN altes Navbar-State zurückschreiben.
		   Die Navbar bleibt einfach in dem Zustand,
		   den sie beim Schließen gerade hat. */
		navbarModule.startAnimation();
	}

  };

  // ---------------------------------------------------------------------
  // 14) USER-SCROLL-INTERRUPTS
  // ---------------------------------------------------------------------
	function bindUserScrollInterrupts() {
	  let touchReleaseTimer = null;

	  const clearTouchReleaseTimer = () => {
		if (touchReleaseTimer) {
		  clearTimeout(touchReleaseTimer);
		  touchReleaseTimer = null;
		}
	  };

	  const releaseTouchStateDelayed = (delay = 700) => {
		clearTouchReleaseTimer();

		touchReleaseTimer = setTimeout(() => {
		  touchReleaseTimer = null;
		  state.touch.active = false;
		  state.nav.gestureStretch.target = 0;
		  navbarModule.startAnimation();
		}, delay);
	  };

	  window.addEventListener("wheel", () => {
		scrollEngine.cancelActiveScroll();
		clearTouchReleaseTimer();
		state.touch.active = false;
		state.nav.gestureStretch.target = 0;
		navbarModule.startAnimation();
	  }, { passive: true });

	  window.addEventListener("touchstart", () => {
		clearTouchReleaseTimer();
		scrollEngine.cancelActiveScroll();
		state.touch.active = true;
	  }, { passive: true });

	  window.addEventListener("touchmove", () => {
		clearTouchReleaseTimer();
		state.touch.active = true;
	  }, { passive: true });

	  window.addEventListener("touchend", () => {
		releaseTouchStateDelayed(700);
	  }, { passive: true });

	  window.addEventListener("touchcancel", () => {
		releaseTouchStateDelayed(700);
	  }, { passive: true });

	  window.addEventListener("scroll", () => {
		if (state.touch.active) {
		  releaseTouchStateDelayed(700);
		}
	  }, { passive: true });

	  window.addEventListener("pointerdown", (e) => {
		if (e.pointerType === "mouse") {
		  clearTouchReleaseTimer();
		  state.touch.active = false;
		  state.nav.gestureStretch.target = 0;
		  navbarModule.startAnimation();
		}
	  }, { passive: true });

	  window.addEventListener("blur", () => {
		clearTouchReleaseTimer();
		state.touch.active = false;
		state.nav.gestureStretch.target = 0;
		navbarModule.startAnimation();
	  });

	  document.addEventListener("visibilitychange", () => {
		if (document.hidden) {
		  clearTouchReleaseTimer();
		  state.touch.active = false;
		  state.nav.gestureStretch.target = 0;
		  navbarModule.startAnimation();
		}
	  });
	}

  // ---------------------------------------------------------------------
  // 15) POSITIONIERUNG DER SCROLL-HINT-SPALTE
  // ---------------------------------------------------------------------
  const scrollSectionHintPositionModule = {
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
    },
  };

  // ---------------------------------------------------------------------
  // 16) PERFORMANCE-MODUL
  // ---------------------------------------------------------------------
  const performanceModule = {
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
    },
  };

  // ---------------------------------------------------------------------
  // 17) INITIALISIERUNG
  // ---------------------------------------------------------------------
  function init() {
    // performanceModule.init(); // optional wieder aktivieren
    physics.update();
    sectionNavigationModule.buildOrderedSections();

    navbarModule.bindEvents();
    sectionNavigationModule.bindEvents();
    scrollSectionHintModule.init();
    scrollSectionHintPositionModule.init();
    galleryModule.init();

    uiModule.bindCTA();
    uiModule.bindHeroClickBehavior();
    uiModule.bindPricingTabs();
    uiModule.setInitialVisualState();

    bindUserScrollInterrupts();
    
    DOM.heroCalendar?.addEventListener("click", (e) => {
	  e.stopPropagation();
	});

	DOM.heroCalendarEl?.addEventListener("click", (e) => {
	  e.stopPropagation();
	});

	window.addEventListener(
		"scroll",
		() => {
			if (!state.ui.heroCalendarOpen && !state.ui.heroCalendarAnimating) {
				state.ui.heroCalendarKeepCtaFlat = false;
			}

			uiModule.closeHeroCalendarIfHeroFullyOut();
			navbarModule.handleScroll();
		},
		{ passive: true }
	);

	window.addEventListener("resize", () => {
		physics.update();
		galleryModule.setPosition(galleryModule.currentIndex, false);
		
		if (state.ui.heroCalendarOpen) {
			clearTimeout(state.ui.fullCalendarResizeTimer);

			state.ui.fullCalendarResizeTimer = setTimeout(() => {
				uiModule.positionHeroCalendar();
				uiModule.refreshFullCalendarView();
				uiModule.applyMeasuredHeroCalendarBox();
				uiModule.setHeroCalendarExtraHeight(state.ui.heroCalendarMeasuredExtra);

				requestAnimationFrame(() => {
					uiModule.applyMeasuredHeroCalendarBox();
					uiModule.updateFullCalendarSize();
				});
			}, 120);
		}
	});

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        state.animation.running = false;
      } else {
        navbarModule.handleScroll();
      }
    });

    navbarModule.handleScroll();
  }

  init();

});
