document.addEventListener("DOMContentLoaded", () => {
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

  const DOM = {
    navbar: document.querySelector(".navbar"),
    hero: document.querySelector(".hero"),
    navToggle: document.querySelector(".nav-toggle"),
    navMenu: document.querySelector(".nav-menu"),
    navLinks: [...document.querySelectorAll(".nav-menu a")],
    navLogo: document.querySelector(".nav-logo"),
    cta: document.querySelector(".cta-button"),
    footer: document.querySelector("footer"),
    track: document.querySelector(".gallery-track"),
    pricingTabs: [...document.querySelectorAll(".pricing-tab")],
    pricingContents: [...document.querySelectorAll(".pricing-content")],
    year: document.getElementById("year"),
  };

  const SECTION_SELECTOR = "#about, #gallery, #services, #pricing, #testimonials, #contact";

  const utils = {
    prefersReducedMotion() {
      return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    },

    getRootNumber(name, fallback) {
      const value = parseFloat(getComputedStyle(document.documentElement).getPropertyValue(name));
      return Number.isFinite(value) ? value : fallback;
    },

    getRootRemPx(name, fallbackPx) {
      const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
      if (!raw) return fallbackPx;

      if (raw.endsWith("rem")) {
        const rem = parseFloat(raw);
        const rootFont = parseFloat(getComputedStyle(document.documentElement).fontSize);
        return Number.isFinite(rem) && Number.isFinite(rootFont) ? rem * rootFont : fallbackPx;
      }

      const px = parseFloat(raw);
      return Number.isFinite(px) ? px : fallbackPx;
    },

    getRootTimeMs(name, fallbackMs) {
      const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
      if (!raw) return fallbackMs;
      if (raw.endsWith("ms")) return parseFloat(raw) || fallbackMs;
      if (raw.endsWith("s")) return (parseFloat(raw) || 0) * 1000 || fallbackMs;
      const num = parseFloat(raw);
      return Number.isFinite(num) ? num : fallbackMs;
    },

    getRootLengthPx(name, fallbackPx) {
      const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
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

    isMobileViewport() {
      return window.innerWidth <= SETTINGS.breakpoints.mobileNav;
    },

    isPhysicsMobileViewport() {
      return window.innerWidth <= SETTINGS.breakpoints.mobilePhysics;
    },

    getMaxScrollY() {
      return Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    },

    shuffle(array) {
      for (let i = array.length - 1; i > 0; i--) {
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
      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      let reducedTransparency = false;
      try {
        reducedTransparency = window.matchMedia("(prefers-reduced-transparency: reduce)").matches;
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

  const state = {
    lastScrollY: window.scrollY,
    scrollVelocity: 0,
    scrollDirection: "down",

    heroParallax: 0,
    heroParallaxVelocity: 0,

    animationRunning: false,
    lastFrameTime: performance.now(),

    programmaticScroll: false,
    manualNavbarOpen: false,
    programmaticNavMode: null,

    suppressCtaHoverCleanup: null,
    suppressNextClick: false,

    targetVisible: 0,
    currentVisible: 0,
    visibleVelocity: 0,

    targetCompact: 0,
    currentCompact: 0,
    compactVelocity: 0,

    targetSurface: 0,
    currentSurface: 0,
    surfaceVelocity: 0,

    touchScrollActive: false,
    targetGestureStretch: 0,
    currentGestureStretch: 0,
    gestureStretchVelocity: 0,

    activeScrollAnimation: null,
    activeScrollToken: 0,

    topSettleRaf: null,
    topSettleTimeout: null,

    orderedSections: [],
  };

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
    },

    update() {
      const isMobile = utils.isPhysicsMobileViewport();
      const get = utils.getRootNumber;

      this.values.NAV_SURFACE_UP = get("--nav-surface-up", 0.18);
      this.values.sectionScrollInset = get("--section-scroll-inset", 1);
      this.values.scrollElasticDecay = get("--scroll-elastic-decay", 10);
      this.values.scrollElasticFrequency = get("--scroll-elastic-frequency", 10);
      this.values.scrollElasticPhaseShift = get("--scroll-elastic-phase-shift", 0.75);
      this.values.scrollDurationFactor = get("--scroll-duration-factor", 0.6);
      this.values.scrollDurationMin = get("--scroll-duration-min", 700);
      this.values.scrollDurationMax = get("--scroll-duration-max", 1600);
      this.values.heroParallaxFactor = get("--hero-parallax-factor", -0.06);
      this.values.heroParallaxStiffness = get("--hero-parallax-stiffness", 0.04);
      this.values.heroParallaxDamping = get("--hero-parallax-damping", 0.85);
      this.values.heroScaleScrollFactor = get("--hero-scale-scroll-factor", 0.01);
      this.values.heroBrightnessScrollFactor = get("--hero-brightness-scroll-factor", 0.06);
      this.values.navGestureExpandMax = get("--nav-gesture-expand-max", 22);
      this.values.navGestureCompressMax = get("--nav-gesture-compress-max", 12);
      this.values.navGestureExpandVelocityFactor = get("--nav-gesture-expand-velocity-factor", 0.18);
      this.values.navGestureCompressVelocityFactor = get("--nav-gesture-compress-velocity-factor", 0.12);
      this.values.navGestureStiffness = get("--nav-gesture-stiffness", 0.18);
      this.values.navGestureDamping = get("--nav-gesture-damping", 0.74);

      if (isMobile) {
        this.values.navVisibleStiffness = get("--nav-spring-stiffness-mobile", 0.06);
        this.values.navVisibleDamping = get("--nav-spring-damping-mobile", 0.85);
        this.values.navCompactStiffness = get("--nav-compact-stiffness-mobile", 0.035);
        this.values.navCompactDamping = get("--nav-compact-damping-mobile", 0.9);
      } else {
        this.values.navVisibleStiffness = get("--nav-spring-stiffness-desktop", 0.08);
        this.values.navVisibleDamping = get("--nav-spring-damping-desktop", 0.82);
        this.values.navCompactStiffness = get("--nav-compact-stiffness-desktop", 0.045);
        this.values.navCompactDamping = get("--nav-compact-damping-desktop", 0.88);
      }
    },
  };

  const scrollEngine = {
    easeOutElastic(t) {
      if (t === 0) return 0;
      if (t === 1) return 1;

      const { scrollElasticDecay, scrollElasticFrequency, scrollElasticPhaseShift } = physics.values;
      const c = (2 * Math.PI) / 3;

      return (
        Math.pow(2, -scrollElasticDecay * t) *
          Math.sin((t * scrollElasticFrequency - scrollElasticPhaseShift) * c) +
        1
      );
    },

    getTargetNavOffset(navMode = null) {
      if (!DOM.navbar) return 0;
      const navMax = utils.getRootNumber("--nav-height-max", 78);
      const navMin = utils.getRootNumber("--nav-height-min", 58);
      return navMode === "down" || navMode === "up-section" ? navMin : DOM.navbar.offsetHeight || navMax;
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
      const effectiveNavMode = isHeroTarget && navMode === "up-section" ? "hero-top" : navMode;
      const navOffset = isHeroTarget || isFooterTarget ? 0 : this.getTargetNavOffset(effectiveNavMode);
      const inset = target.matches?.(SECTION_SELECTOR) ? physics.values.sectionScrollInset : 0;

      const y = isHeroTarget
        ? 0
        : target.getBoundingClientRect().top + window.pageYOffset - navOffset + inset;

      return Math.max(0, Math.min(y, utils.getMaxScrollY()));
    },

    hardSnap(y) {
      window.scrollTo(0, y);
      requestAnimationFrame(() => window.scrollTo(0, y));
    },

    animateWindowScrollTo(targetY, { onComplete } = {}) {
      if (state.activeScrollAnimation) {
        cancelAnimationFrame(state.activeScrollAnimation);
        state.activeScrollAnimation = null;
      }

      const scrollToken = ++state.activeScrollToken;
      const maxScrollY = utils.getMaxScrollY();
      const clampedTargetY = Math.max(0, Math.min(targetY, maxScrollY));
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
            Math.max(physics.values.scrollDurationMin, absDistance * physics.values.scrollDurationFactor)
          );

      const startTime = performance.now();

      const frame = (now) => {
        if (scrollToken !== state.activeScrollToken) return;

        const elapsed = now - startTime;
        const t = Math.min(elapsed / duration, 1);
        const eased = utils.prefersReducedMotion() ? t : this.easeOutElastic(t);
        const nextY = Math.max(0, Math.min(startY + distance * eased, maxScrollY));

        window.scrollTo(0, nextY);

        if (t < 1) {
          state.activeScrollAnimation = requestAnimationFrame(frame);
          return;
        }

        this.hardSnap(clampedTargetY);
        state.activeScrollAnimation = null;
        onComplete?.(clampedTargetY);
      };

      state.activeScrollAnimation = requestAnimationFrame(frame);
    },

    clearTopSettle() {
      state.topSettleRaf = utils.clearRaf(state.topSettleRaf);
      state.topSettleTimeout = utils.clearTimer(state.topSettleTimeout);
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

        state.topSettleRaf = requestAnimationFrame(tick);
      };

      state.topSettleTimeout = setTimeout(() => {
        window.scrollTo(0, 0);
        this.clearTopSettle();
        onDone?.();
      }, 1400);

      state.topSettleRaf = requestAnimationFrame(tick);
    },

    scrollToSection(target, navMode = null) {
      if (!target) return;

      const isHeroTarget = target.classList?.contains("hero");
      const effectiveNavMode = isHeroTarget && (navMode === "up-section" || navMode === "hero-top")
        ? "hero-top"
        : navMode;

      scrollSectionHintModule.hideImmediatelyForProgrammaticScroll?.();

      state.programmaticScroll = true;
      state.programmaticNavMode = effectiveNavMode;
      state.targetGestureStretch = 0;

      if (effectiveNavMode === "down") state.scrollDirection = "down";
      if (effectiveNavMode === "up-section" || effectiveNavMode === "hero-top") state.scrollDirection = "up";

      navbarModule.startAnimation();

      this.animateWindowScrollTo(this.getTargetY(target, effectiveNavMode), {
        onComplete: () => {
          const finalMode = state.programmaticNavMode;
          state.programmaticScroll = false;
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

          state.programmaticNavMode = null;
          navbarModule.startAnimation();
          navbarModule.handleScroll();
        },
      });
    },

    goTo(targetOrSelector, forcedMode = null) {
      const target = utils.resolveTarget(targetOrSelector);
      if (!target) return;

      const mode = forcedMode || this.getModeForTarget(target);
      const isHeroTarget = target.classList?.contains("hero");
      const alreadyAtTop = window.scrollY <= 5;

      state.manualNavbarOpen = false;

      if (isHeroTarget && alreadyAtTop) {
        navbarModule.setTargets(0, 0, 0);
      } else {
        navbarModule.setTargets(1, 1, this.getSurfaceForMode(mode));
      }

      this.scrollToSection(target, mode);
      navbarModule.startAnimation();
    },

    scrollToPageBottom() {
      scrollSectionHintModule.hideImmediatelyForProgrammaticScroll?.();
      state.programmaticScroll = true;
      state.programmaticNavMode = "down";
      state.scrollDirection = "down";
      state.targetGestureStretch = 0;
      navbarModule.startAnimation();

      this.animateWindowScrollTo(utils.getMaxScrollY(), {
        onComplete: () => {
          state.programmaticScroll = false;
          state.programmaticNavMode = null;
          state.lastScrollY = window.scrollY;
          navbarModule.setTargets(1, 1, 1);
          navbarModule.startAnimation();
          navbarModule.handleScroll();
        },
      });
    },

    cancelActiveScroll({ keepPosition = true } = {}) {
      this.clearTopSettle();
      const hadActiveScroll = !!state.activeScrollAnimation || state.programmaticScroll;
      if (!hadActiveScroll) return;

      if (state.activeScrollAnimation) {
        cancelAnimationFrame(state.activeScrollAnimation);
        state.activeScrollAnimation = null;
      }

      state.activeScrollToken += 1;
      state.programmaticScroll = false;
      state.programmaticNavMode = null;
      state.targetGestureStretch = 0;

      if (keepPosition) window.scrollTo(0, window.scrollY);

      state.lastScrollY = window.scrollY;
      scrollSectionHintModule.scheduleHide?.();
      navbarModule.handleScroll();
      navbarModule.startAnimation();
    },
  };

  const navbarModule = {
    isOpen() {
      return !!(DOM.navMenu && DOM.navToggle && DOM.navMenu.classList.contains("active"));
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
      state.targetGestureStretch = 0;
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

      state.manualNavbarOpen = false;
      state.targetGestureStretch = 0;
      this.startAnimation();

      if (keepNavbarVisible) {
        this.setTargets(1, 1, 1);
        return;
      }

      if (window.scrollY <= 5 && !state.programmaticScroll) {
        this.setTargets(0, 0, 0);
      } else {
        this.handleScroll();
      }
    },

    setTargets(visible, compact, surface) {
      if (!DOM.navbar) return;
      state.targetVisible = visible;
      state.targetCompact = compact;
      state.targetSurface = surface;
      this.startAnimation();
    },

    startAnimation() {
      if (state.animationRunning) return;
      state.animationRunning = true;
      state.lastFrameTime = performance.now();
      requestAnimationFrame(this.animate.bind(this));
    },

    canUseGestureStretch(currentY) {
      return (
        state.touchScrollActive &&
        !state.programmaticScroll &&
        !state.manualNavbarOpen &&
        !this.isOpen() &&
        currentY > 5 &&
        state.targetVisible >= 1 &&
        state.targetCompact >= 1 &&
        state.programmaticNavMode !== "hero-top"
      );
    },

    updateGestureStretch(deltaY, currentY) {
      if (!this.canUseGestureStretch(currentY)) {
        state.targetGestureStretch = 0;
        return;
      }

      const absDelta = Math.abs(deltaY);

      if (deltaY < 0) {
        state.targetGestureStretch = Math.min(
          absDelta * physics.values.navGestureExpandVelocityFactor,
          physics.values.navGestureExpandMax
        );
        return;
      }

      if (deltaY > 0) {
        state.targetGestureStretch = -Math.min(
          absDelta * physics.values.navGestureCompressVelocityFactor,
          physics.values.navGestureCompressMax
        );
        return;
      }

      state.targetGestureStretch = 0;
    },

    handleScroll() {
      if (!DOM.navbar) return;

      const currentY = window.scrollY;
      const deltaY = currentY - state.lastScrollY;

      state.scrollVelocity = deltaY * 0.8;
      this.updateGestureStretch(deltaY, currentY);

      if (!state.programmaticScroll && Math.abs(deltaY) > SETTINGS.thresholds.directionLock) {
        state.scrollDirection = deltaY > 0 ? "down" : "up";
      }

      if (state.manualNavbarOpen && currentY > 5) {
        state.manualNavbarOpen = false;
      }

      state.lastScrollY = currentY;
      DOM.hero?.classList.toggle("scrolled", currentY > 10);

      if (state.programmaticNavMode === "down") return this.setTargets(1, 1, 1);
      if (state.programmaticNavMode === "up-section") return this.setTargets(1, 1, physics.values.NAV_SURFACE_UP);
      if (state.programmaticNavMode === "hero-top") return this.setTargets(0, 0, 0);

      if (state.manualNavbarOpen) {
        return currentY <= 5 ? this.setTargets(0, 0, 0) : this.setTargets(1, 1, 1);
      }

      if (currentY <= 5) {
        state.targetGestureStretch = 0;
        this.setTargets(0, 0, 0);
      } else if (state.scrollDirection === "down") {
        this.setTargets(1, 1, 1);
      } else {
        this.setTargets(1, 1, physics.values.NAV_SURFACE_UP);
      }
    },

    animate(now) {
      if (!DOM.navbar || document.hidden) {
        state.animationRunning = false;
        return;
      }

      state.scrollVelocity *= 0.9;

      let delta = (now - state.lastFrameTime) / 16.67;
      state.lastFrameTime = now;
      delta = Math.min(delta, 2);

      const springStep = (current, target, velocity, stiffness, damping) => {
        const force = (target - current) * stiffness;
        velocity += force * delta;
        velocity *= Math.pow(damping, delta);
        current += velocity * delta;
        return { current, velocity };
      };

      ({ current: state.currentVisible, velocity: state.visibleVelocity } = springStep(
        state.currentVisible,
        state.targetVisible,
        state.visibleVelocity,
        physics.values.navVisibleStiffness,
        physics.values.navVisibleDamping
      ));

      ({ current: state.currentCompact, velocity: state.compactVelocity } = springStep(
        state.currentCompact,
        state.targetCompact,
        state.compactVelocity,
        physics.values.navCompactStiffness,
        physics.values.navCompactDamping
      ));

      ({ current: state.currentSurface, velocity: state.surfaceVelocity } = springStep(
        state.currentSurface,
        state.targetSurface,
        state.surfaceVelocity,
        physics.values.navCompactStiffness,
        physics.values.navCompactDamping
      ));

      ({ current: state.currentGestureStretch, velocity: state.gestureStretchVelocity } = springStep(
        state.currentGestureStretch,
        state.targetGestureStretch,
        state.gestureStretchVelocity,
        physics.values.navGestureStiffness,
        physics.values.navGestureDamping
      ));

      state.currentVisible = Math.max(0, Math.min(state.currentVisible, 1));
      state.currentCompact = Math.max(0, Math.min(state.currentCompact, 1));
      state.currentSurface = Math.max(0, Math.min(state.currentSurface, 1));
      state.currentGestureStretch = Math.max(
        -physics.values.navGestureCompressMax,
        Math.min(state.currentGestureStretch, physics.values.navGestureExpandMax)
      );

      const easedCompact = 1 - Math.pow(1 - state.currentCompact, 3);
      const easedSurface = 1 - Math.pow(1 - state.currentSurface, 3);

      utils.setVars(DOM.navbar, {
        "--nav-visible": state.currentVisible,
        "--nav-compact": easedCompact,
        "--nav-settle": easedCompact,
        "--nav-surface": easedSurface,
        "--nav-height-progress": easedCompact,
        "--nav-gesture-stretch": `${state.currentGestureStretch.toFixed(2)}px`,
        "--nav-velocity-blur": Math.round(Math.min(Math.abs(state.scrollVelocity) * 0.15, 6)),
        "--nav-refraction": Math.min(Math.abs(state.scrollVelocity) * 0.02, 1),
      });

      const velocityShadow = Math.min(Math.abs(state.scrollVelocity) * 0.02, 0.2);
      DOM.navbar.style.boxShadow = `0 ${10 * easedSurface}px ${40 * easedSurface}px rgba(0,0,0, ${0.45 * easedSurface + velocityShadow})`;

      if (DOM.hero) {
        const scrollY = window.scrollY;
        const progress = Math.min(scrollY / SETTINGS.thresholds.inertia, 1);

        utils.setVars(DOM.hero, {
          "--hero-scale": 1 - progress * physics.values.heroScaleScrollFactor,
          "--hero-brightness": 1 - progress * physics.values.heroBrightnessScrollFactor,
        });

        const targetParallax = scrollY * physics.values.heroParallaxFactor;
        const parallaxForce = (targetParallax - state.heroParallax) * physics.values.heroParallaxStiffness;
        state.heroParallaxVelocity += parallaxForce;
        state.heroParallaxVelocity *= physics.values.heroParallaxDamping;
        state.heroParallax += state.heroParallaxVelocity;

        DOM.hero.style.setProperty("--hero-parallax", `${state.heroParallax}px`);
      }

      const stillMoving =
        Math.abs(state.targetVisible - state.currentVisible) > 0.0005 ||
        Math.abs(state.visibleVelocity) > 0.0005 ||
        Math.abs(state.targetCompact - state.currentCompact) > 0.0005 ||
        Math.abs(state.compactVelocity) > 0.0005 ||
        Math.abs(state.targetSurface - state.currentSurface) > 0.0005 ||
        Math.abs(state.surfaceVelocity) > 0.0005 ||
        Math.abs(state.targetGestureStretch - state.currentGestureStretch) > 0.01 ||
        Math.abs(state.gestureStretchVelocity) > 0.01;

      if (!stillMoving) {
        state.animationRunning = false;
        return;
      }

      requestAnimationFrame(this.animate.bind(this));
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
            hash = rawHref.startsWith("#") ? rawHref : new URL(rawHref, window.location.href).hash;
          } catch {
            hash = rawHref.startsWith("#") ? rawHref : "";
          }

          if (!hash) return;

          const target = utils.resolveTarget(hash);
          if (!target) return;

          e.preventDefault();
          e.stopPropagation();

          const doScroll = () => scrollEngine.goTo(target, scrollEngine.getModeForTarget(target));

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

        e.preventDefault();
        e.stopPropagation();
        state.suppressNextClick = true;

        if (onCta || onSectionScrollHead) {
          this.suppressCtaHoverTemporarily();
          uiModule.resetCtaMagnetic();
        }

        this.closeMenu();
      });

      document.addEventListener(
        "click",
        (e) => {
          if (!state.suppressNextClick) return;
          state.suppressNextClick = false;
          e.preventDefault();
          e.stopPropagation();
        },
        true
      );
    },

    suppressCtaHoverTemporarily(duration = 700) {
      document.body.classList.add("suppress-cta-hover");

      if (state.suppressCtaHoverCleanup) {
        window.removeEventListener("pointermove", state.suppressCtaHoverCleanup);
        clearTimeout(state.suppressCtaHoverCleanup.__timeoutId);
      }

      const cleanup = (e) => {
        if (e && e.pointerType && e.pointerType !== "mouse") return;
        document.body.classList.remove("suppress-cta-hover");
        window.removeEventListener("pointermove", cleanup);
        if (cleanup.__timeoutId) clearTimeout(cleanup.__timeoutId);
        state.suppressCtaHoverCleanup = null;
      };

      cleanup.__timeoutId = setTimeout(cleanup, duration);
      state.suppressCtaHoverCleanup = cleanup;
      window.addEventListener("pointermove", cleanup);
    },
  };

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
      const mode = Math.abs(currentY - upHomeY) < Math.abs(currentY - downHomeY) ? "up-section" : "down";
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

    bindSectionNavigator(triggerEl, sectionEl, { allowPrev = true, headSelector = null } = {}) {
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
 
	const scrollSectionHintModule = {
	  root: null,
	  measurer: null,
	  metricsCache: new Map(),
	  hintSlots: [],
	  updateRaf: null,
	  maxVisibleHints: 2,
	  isVisible: false,
	  hasUnlockedScrollHints: false,
	  scrollEndTimer: null,
	  hideCompleteTimer: null,
	  lastScrollTs: 0,
	  scrollGestureActive: false,
	  scrollGestureStartY: null,
	  scrollGestureType: null,
	  scrollGestureAccumulatedDistance: 0,
	  lastObservedScrollY: window.scrollY,
	  touchContactActive: false,
	  waitingForFreshTouchMove: false,
	  countingCurrentTouchSequence: false,
	  hideDelayMs: 1000,
	  fadeDurationMs: 500,
	  showScrollDistancePx: window.innerHeight,

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
		this.root.innerHTML = Array.from({ length: this.maxVisibleHints }, (_, index) => `
		  <div class="scroll-section-hint-anchor scroll-section-hint-anchor--${index}">
			<div class="scroll-section-hint scroll-section-hint--${index}">
			  <span class="scroll-section-hint-text scroll-section-hint-base"></span>
			</div>
		  </div>
		`).join("");

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
			scrollEngine.goTo(targetSelector, text.includes(">>") ? "down" : "up-section");
		  };

		  const triggerNavigation = (e) => {
			e.preventDefault();
			e.stopPropagation();
			goToHintTarget();
		  };

		  anchor.addEventListener("pointerdown", (e) => {
			if (e.pointerType !== "mouse") triggerNavigation(e);
		  }, { passive: false });

		  anchor.addEventListener("touchstart", triggerNavigation, { passive: false });
		  anchor.addEventListener("click", (e) => {
			if (!e.pointerType || e.pointerType === "mouse") triggerNavigation(e);
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
		return window.visualViewport ? window.visualViewport.height : window.innerHeight || document.documentElement.clientHeight;
	  },

	  getBoundaryGapPx() {
		return utils.getRootRemPx("--section-hint-boundary-gap", 4.8);
	  },

	  getNavbarBottom() {
		return DOM.navbar ? DOM.navbar.getBoundingClientRect().bottom : utils.getRootNumber("--nav-height", 78);
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

		  // Sonderfall für erste echte Section (#about)
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
		if (cached || !this.measurer) return cached || { width: 0, height: 0 };

		this.measurer.textContent = key;
		const rect = this.measurer.getBoundingClientRect();
		const metrics = { width: rect.width || 0, height: rect.height || 0 };
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
		  const parts = rgbMatch[1].split(",").map((part) => parseFloat(part.trim()));
		  if (parts.length >= 3 && parts.slice(0, 3).every(Number.isFinite)) {
			return { r: parts[0], g: parts[1], b: parts[2] };
		  }
		}

		const hexMatch = value.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
		if (!hexMatch) return null;

		let hex = hexMatch[1];
		if (hex.length === 3) hex = hex.split("").map((ch) => ch + ch).join("");
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
		  return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
		};

		return 0.2126 * normalize(r) + 0.7152 * normalize(g) + 0.0722 * normalize(b);
	  },

	  getSectionTheme(sectionEl) {
		if (!sectionEl) return "dark";
		const explicitTheme = sectionEl.dataset.hintTheme;
		if (explicitTheme === "light" || explicitTheme === "dark") return explicitTheme;

		const style = getComputedStyle(sectionEl);
		const rgb =
		  this.getRgbFromColorString(style.backgroundColor) ||
		  this.getRgbFromColorString(getComputedStyle(document.body).backgroundColor) ||
		  { r: 250, g: 250, b: 248 };

		return this.getRelativeLuminance(rgb) < 0.42 ? "light" : "dark";
	  },

	  getSectionAtViewportY(viewportY) {
		return this.getContentSections().find((section) => {
		  const rect = section.getBoundingClientRect();
		  return viewportY >= rect.top && viewportY <= rect.bottom;
		}) || null;
	  },

	  getThemeAtViewportY(viewportY, fallbackSection = null) {
		return this.getSectionTheme(this.getSectionAtViewportY(viewportY) || fallbackSection);
	  },

	  setAnchorCenterY(hintEl, centerYPx) {
		const anchor = hintEl?.parentElement;
		if (anchor) anchor.style.top = `${Math.round(centerYPx)}px`;
	  },

	  setHint(hintEl, { text = "", top = 0, opacity = 0, theme = "dark", target = "" } = {}) {
		if (!hintEl) return;

		const anchor = hintEl.parentElement;
		const base = hintEl.querySelector(".scroll-section-hint-base");
		const visible = !!text && opacity > 0.001;
		if (base) base.textContent = text;

		this.setAnchorCenterY(hintEl, top);
		hintEl.style.opacity = `${Math.max(0, Math.min(1, opacity)) * utils.getRootNumber("--section-hint-visibility", 0.5)}`;
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
		if (!placement?.section) return this.hideHint(hintEl);
		this.setHint(hintEl, {
		  text: this.makeText(placement.section, placement.variant),
		  top: placement.top,
		  opacity: placement.opacity ?? 1,
		  theme: this.getThemeAtViewportY(placement.top, placement.section),
		  target: placement.section.id ? `#${placement.section.id}` : "",
		});
	  },

	  hideHint(hintEl) {
		this.setHint(hintEl, { text: "", top: 0, opacity: 0, target: "" });
	  },

	  hideAll() {
		this.hintSlots.forEach((hintEl) => this.hideHint(hintEl));
	  },

	  getTransitionZone(changeY, bandTop, bandBottom) {
		if (!Number.isFinite(changeY) || changeY <= bandTop || changeY >= bandBottom) return "outside";
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
		const overnextChangeY = overnextRect ? overnextRect.top : Number.POSITIVE_INFINITY;

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
			  next: next ? viewportBottom - gap - anchorHeights.nextBackward / 2 : 0,
			  overnext: overnext ? viewportBottom - gap - anchorHeights.overnextBackward / 2 : 0,
			},
			lowerThird: {
			  next: next ? lowerThirdY - gap - anchorHeights.nextBackward / 2 : 0,
			  overnext: overnext ? lowerThirdY - gap - anchorHeights.overnextBackward / 2 : 0,
			},
		  },
		  band: {
			top: navbarBottom,
			bottom: viewportBottom,
		  },
		  transition: {
			nextForwardBelowBoundary: next ? changeY + gap + anchorHeights.nextForward / 2 : 0,
			nextBackwardAboveBoundary: next ? changeY - gap - anchorHeights.nextBackward / 2 : 0,
			overnextBackwardAboveBoundary: overnext ? overnextChangeY - gap - anchorHeights.overnextBackward / 2 : 0,
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

		// Nur aktiv, solange die Grenze home/about im Sichtfeld ist
		if (!Number.isFinite(boundaryY) || boundaryY <= navbarBottom || boundaryY >= viewportBottom) {
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
		const galleryBackwardHeight = gallery ? this.getAnchorHeightForText(galleryBackwardText) : 0;

		const aboutBelowBoundaryTop = boundaryY + geometry.gap + aboutForwardHeight / 2;
		const aboutAboveBoundaryForwardTop = boundaryY - geometry.gap - aboutForwardHeight / 2;
		const aboutAboveBoundaryBackwardTop = boundaryY - geometry.gap - aboutBackwardHeight / 2;
		const galleryBottomTop = gallery
		  ? viewportBottom - geometry.gap - galleryBackwardHeight / 2
		  : 0;

		if (scrollingUp) {
		  // von #about nach oben Richtung #home

		  if (boundaryY < middleThirdEnd) {
			// oberes + mittleres Drittel:
			// #about unterhalb der Grenze mitlaufend
			push(this.createPlacement(about, {
			  role: "transition",
			  variant: "forward",
			  top: aboutBelowBoundaryTop,
			  priority: 100,
			}));

			// #gallery unten stehen lassen, im mittleren Drittel ausfaden
			if (gallery) {
			  let galleryOpacity = 1;

			  if (boundaryY >= topThirdEnd) {
				const fadeProgress = (boundaryY - topThirdEnd) / (middleThirdEnd - topThirdEnd);
				galleryOpacity = Math.max(0, 1 - fadeProgress);
			  }

			  if (galleryOpacity > 0.001) {
				push(this.createPlacement(gallery, {
				  role: "bottomDock",
				  variant: "backward",
				  top: galleryBottomTop,
				  opacity: galleryOpacity,
				  priority: 60,
				}));
			  }
			}

			return placements;
		  }

		  // unteres Drittel:
		  // #about oberhalb der Grenze, Richtungswechsel auf <<
		  push(this.createPlacement(about, {
			role: "transition",
			variant: "backward",
			top: aboutAboveBoundaryBackwardTop,
			priority: 100,
		  }));

		  return placements;
		}

		// scrolling down: von #home nach unten Richtung #about

		// unteres Drittel: noch keine Hints
		if (boundaryY >= middleThirdEnd) {
		  return [];
		}

		// mittleres + oberes Drittel: #about oberhalb der Grenze
		push(this.createPlacement(about, {
		  role: "transition",
		  variant: "forward",
		  top: aboutBelowBoundaryTop,
		  priority: 100,
		}));

		// erst im oberen Drittel zusätzlich #gallery unten anzeigen
		if (gallery && boundaryY < topThirdEnd) {
		  push(this.createPlacement(gallery, {
			role: "bottomDock",
			variant: "backward",
			top: galleryBottomTop,
			priority: 60,
		  }));
		}

		return placements;
	  },

	  buildPlacements(context, geometry) {
		const specialHomeAbout = this.buildHomeAboutSpecialPlacements(context, geometry);
		if (specialHomeAbout) return specialHomeAbout;

		const { current, next, overnext } = context;
		const placements = [];
		const push = (placement) => placement?.section && placements.push(placement);

		const isHomeCurrent = current?.classList?.contains("hero") || current?.id === "home";

		const nextZone = next
		  ? this.getTransitionZone(geometry.changeY, geometry.band.top, geometry.band.bottom)
		  : "outside";

		const overnextZone = overnext
		  ? this.getTransitionZone(geometry.overnextChangeY, geometry.band.top, geometry.band.bottom)
		  : "outside";

		if (!isHomeCurrent && !next) {
		  push(this.createPlacement(current, {
			role: "topDock",
			variant: "forward",
			top: geometry.docks.top.current,
			priority: 100,
		  }));
		  return placements;
		}

		// HERO / HOME als aktuelle Section
		if (isHomeCurrent) {
		  if (nextZone === "entering" || nextZone === "passing") {
			push(this.createPlacement(next, {
			  role: "transition",
			  variant: "forward",
			  top: geometry.transition.nextForwardBelowBoundary,
			  priority: 100,
			}));
		  }

		  if (overnext) {
			if (overnextZone !== "outside") {
			  push(this.createPlacement(overnext, {
				role: "transition",
				variant: "backward",
				top: geometry.transition.overnextBackwardAboveBoundary,
				priority: 60,
			  }));
			} else if (nextZone === "entering") {
			  push(this.createPlacement(overnext, {
				role: "bottomDock",
				variant: "backward",
				top: geometry.docks.lowerThird.overnext,
				priority: 60,
			  }));
			}
		  }

		  if (nextZone === "outside" || nextZone === "leaving") {
			if (geometry.changeY > geometry.docks.lowerThird.next + geometry.gap) {
			  push(this.createPlacement(next, {
				role: "bottomDock",
				variant: "backward",
				top: geometry.docks.lowerThird.next,
				priority: 70,
			  }));
			}
		  }

		  return placements;
		}

		if (nextZone === "outside") {
		  push(this.createPlacement(current, {
			role: "topDock",
			variant: "forward",
			top: geometry.docks.top.current,
			priority: 100,
		  }));
		  push(this.createPlacement(next, {
			role: "bottomDock",
			variant: "backward",
			top: geometry.docks.bottom.next,
			priority: 70,
		  }));
		  return placements;
		}

		if (nextZone === "entering") {
		  push(this.createPlacement(next, {
			role: "transition",
			variant: "forward",
			top: geometry.transition.nextForwardBelowBoundary,
			priority: 100,
		  }));

		  if (overnext) {
			push(this.createPlacement(overnext, {
			  role: overnextZone !== "outside" ? "transition" : "bottomDock",
			  variant: "backward",
			  top: overnextZone !== "outside"
				? geometry.transition.overnextBackwardAboveBoundary
				: geometry.docks.bottom.overnext,
			  priority: 60,
			}));
		  }

		  return placements;
		}

		if (nextZone === "passing") {
		  push(this.createPlacement(current, {
			role: "topDock",
			variant: "forward",
			top: geometry.docks.top.current,
			priority: 90,
		  }));
		  push(this.createPlacement(next, {
			role: "transition",
			variant: "forward",
			top: geometry.transition.nextForwardBelowBoundary,
			priority: 100,
		  }));
		  return placements;
		}

		if (nextZone === "leaving") {
		  push(this.createPlacement(current, {
			role: "topDock",
			variant: "forward",
			top: geometry.docks.top.current,
			priority: 90,
		  }));
		  push(this.createPlacement(next, {
			role: "transition",
			variant: "backward",
			top: geometry.transition.nextBackwardAboveBoundary,
			priority: 100,
		  }));
		}

		return placements;
	  },

	  renderPlacements(placements) {
		const visiblePlacements = (placements || [])
		  .filter(Boolean)
		  .filter((placement) => placement.section && (placement.opacity ?? 1) > 0.001)
		  .sort((a, b) => (a.top !== b.top ? a.top - b.top : (b.priority ?? 0) - (a.priority ?? 0)));

		if (!visiblePlacements.length) {
		  this.hideAll();
		  return;
		}

		this.hintSlots.forEach((hintEl, index) => {
		  const placement = visiblePlacements[index];
		  placement ? this.applyHint(hintEl, placement) : this.hideHint(hintEl);
		});
	  },

	  updateGalleryBodyState(currentSection) {
		document.body.classList.toggle("in-gallery", currentSection?.id === "gallery");
	  },

	  update() {
		if (!this.root) return;
		const context = this.getSectionContext();
		this.updateGalleryBodyState(context?.current || null);
		if (!context?.current) return this.hideAll();
		this.renderPlacements(this.buildPlacements(context, this.buildGeometry(context)));
	  },

	  scheduleUpdate() {
		if (this.updateRaf) return;
		this.updateRaf = requestAnimationFrame(() => {
		  this.updateRaf = null;
		  this.update();
		});
	  },

	  refreshTimingVars() {
		this.hideDelayMs = utils.getRootTimeMs("--section-hint-hide-delay", 1000);
		this.fadeDurationMs = utils.getRootTimeMs("--section-hint-fade-duration", 500);
		this.showScrollDistancePx = utils.getRootLengthPx("--section-hint-show-scroll-distance", window.innerHeight);
	  },

	  clearScrollEndTimer() {
		this.scrollEndTimer = utils.clearTimer(this.scrollEndTimer);
	  },

	  clearHideCompleteTimer() {
		this.hideCompleteTimer = utils.clearTimer(this.hideCompleteTimer);
	  },

	  scheduleRelockAfterFullyHidden() {
		this.clearHideCompleteTimer();
		this.hideCompleteTimer = setTimeout(() => {
		  if (!this.isVisible && !this.root?.classList.contains("is-visible")) {
			this.hasUnlockedScrollHints = false;
			this.scrollGestureType = null;
			this.scrollGestureStartY = null;
			this.endScrollGesture();
		  }
		  this.hideCompleteTimer = null;
		}, this.fadeDurationMs);
	  },

	  beginScrollGesture(type) {
		this.clearScrollEndTimer();
		this.clearHideCompleteTimer();

		if (!this.hasUnlockedScrollHints) {
		  this.isVisible = false;
		  this.root?.classList.remove("is-visible");
		  document.body.classList.remove("hints-visible");
		}

		this.scrollGestureType = type;
		this.scrollGestureStartY = window.scrollY;
		this.scrollGestureAccumulatedDistance = 0;
		this.lastObservedScrollY = window.scrollY;

		if (type === "touch") {
		  this.touchContactActive = true;
		  this.waitingForFreshTouchMove = true;
		  this.countingCurrentTouchSequence = false;
		  this.scrollGestureActive = this.hasUnlockedScrollHints;
		  return;
		}

		this.scrollGestureActive = true;
	  },

	  startCountingFreshTouchGesture() {
		if (this.scrollGestureType !== "touch") return;
		this.waitingForFreshTouchMove = false;
		this.countingCurrentTouchSequence = true;
		this.scrollGestureActive = true;
		this.scrollGestureAccumulatedDistance = 0;
		this.lastObservedScrollY = window.scrollY;
	  },

	  endScrollGesture() {
		this.scrollGestureActive = false;
		this.scrollGestureType = null;
		this.scrollGestureStartY = null;
		this.touchContactActive = false;
		this.waitingForFreshTouchMove = false;
		this.countingCurrentTouchSequence = false;
	  },

	  accumulateScrollDistance() {
		const currentY = window.scrollY;
		const delta = Math.abs(currentY - this.lastObservedScrollY);
		if (delta > 0) this.scrollGestureAccumulatedDistance += delta;
		this.lastObservedScrollY = currentY;
	  },

	  hasReachedShowScrollDistance() {
		return this.scrollGestureAccumulatedDistance >= this.showScrollDistancePx;
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

	  scheduleHide() {
		this.scheduleHideAfterScrollEnd();
	  },

	  handleScrollActivity() {
		if (state.programmaticScroll) {
		  this.hideImmediatelyForProgrammaticScroll();
		  return;
		}

		if (this.scrollGestureType === "touch" && this.waitingForFreshTouchMove) {
		  this.lastObservedScrollY = window.scrollY;
		  if (!this.hasUnlockedScrollHints) {
			this.hide();
			return;
		  }
		  this.show();
		  this.scheduleHideAfterScrollEnd();
		  return;
		}

		const touchSequenceStillRelevant =
		  this.hasUnlockedScrollHints || this.scrollGestureActive || this.countingCurrentTouchSequence;

		if (!touchSequenceStillRelevant) return;

		this.lastScrollTs = performance.now();
		this.accumulateScrollDistance();

		if (!this.hasUnlockedScrollHints) {
		  if (!this.hasReachedShowScrollDistance()) {
			this.hide();
			return;
		  }
		  this.hasUnlockedScrollHints = true;
		}

		this.show();
		this.scheduleHideAfterScrollEnd();
	  },

	  scheduleHideAfterScrollEnd() {
		this.clearScrollEndTimer();
		this.scrollEndTimer = setTimeout(() => {
		  const idleFor = performance.now() - this.lastScrollTs;
		  if (idleFor >= this.hideDelayMs) {
			this.hide();
			this.endScrollGesture();
			return;
		  }
		  this.scheduleHideAfterScrollEnd();
		}, this.hideDelayMs);
	  },

	  hideImmediatelyForProgrammaticScroll() {
		if (!this.root) return;
		this.clearScrollEndTimer();
		this.clearHideCompleteTimer();
		this.endScrollGesture();
		this.isVisible = false;
		this.hasUnlockedScrollHints = false;
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
		const onTouchStart = () => this.beginScrollGesture("touch");
		const onTouchMove = () => {
		  if (this.scrollGestureType !== "touch") this.beginScrollGesture("touch");
		  if (this.waitingForFreshTouchMove) this.startCountingFreshTouchGesture();
		};
		const onTouchEndLike = (cancelled = false) => {
		  if (this.scrollGestureType !== "touch") return;

		  this.touchContactActive = false;
		  if (cancelled) {
			this.waitingForFreshTouchMove = false;
			this.countingCurrentTouchSequence = false;
			this.hide();
			this.endScrollGesture();
			return;
		  }

		  this.lastScrollTs = performance.now();
		  if (this.countingCurrentTouchSequence || this.hasUnlockedScrollHints) {
			this.scrollGestureActive = true;
			this.scheduleHideAfterScrollEnd();
			return;
		  }

		  this.waitingForFreshTouchMove = false;
		  this.scrollGestureActive = false;
		  this.countingCurrentTouchSequence = false;
		  this.hide();
		};

		window.addEventListener("scroll", () => {
		  this.scheduleUpdate();

		  if (state.programmaticScroll) {
			this.hideImmediatelyForProgrammaticScroll();
			return;
		  }

		  if (this.scrollGestureType === "touch") {
			this.handleScrollActivity();
		  } else {
			this.hide();
		  }
		}, { passive: true });

		window.addEventListener("touchstart", onTouchStart, { passive: true });
		window.addEventListener("touchmove", onTouchMove, { passive: true });
		window.addEventListener("touchend", () => onTouchEndLike(false), { passive: true });
		window.addEventListener("touchcancel", () => onTouchEndLike(true), { passive: true });

		window.addEventListener("pointerdown", (e) => {
		  if (e.pointerType === "touch") onTouchStart();
		  if (e.pointerType === "mouse") this.hide();
		}, { passive: true });

		window.addEventListener("pointermove", (e) => {
		  if (e.pointerType === "touch") onTouchMove();
		}, { passive: true });

		window.addEventListener("pointerup", (e) => {
		  if (e.pointerType === "touch") onTouchEndLike(false);
		}, { passive: true });

		window.addEventListener("pointercancel", (e) => {
		  if (e.pointerType === "touch") onTouchEndLike(true);
		}, { passive: true });

		if ("onscrollend" in document) {
		  document.addEventListener("scrollend", () => {
			if (!state.programmaticScroll && this.scrollGestureType === "touch") {
			  this.lastScrollTs = performance.now();
			  this.scheduleHideAfterScrollEnd();
			}
		  }, { passive: true });
		}

		const onResize = () => {
		  this.metricsCache.clear();
		  this.refreshTimingVars();
		  this.scheduleUpdate();
		};

		window.addEventListener("resize", onResize);
		window.addEventListener("orientationchange", () => setTimeout(onResize, 120));

		if (window.visualViewport) {
		  window.visualViewport.addEventListener("resize", onResize);
		  window.visualViewport.addEventListener("scroll", () => this.scheduleUpdate(), { passive: true });
		}
	  },

	  init() {
		this.build();
		this.refreshTimingVars();
		this.bindHintClicks();
		this.hide();
		this.update();
		this.bindEvents();
	  },
	};

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
          video.paused ? utils.safePlay(video) : video.pause();
        });

        video.addEventListener("ended", () => this.moveTo(this.currentIndex + 1, true));
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
      DOM.track.style.transition = animate ? "transform 0.6s cubic-bezier(.16,.84,.44,1)" : "none";
      DOM.track.style.transform = `translateX(-${offset}px)`;
    },

    moveTo(index, autoPlay = false) {
      if (this.isAnimating) return;
      this.isAnimating = true;
      this.currentIndex = index;
      this.setPosition(this.currentIndex, true);
      autoPlay ? this.playOnly(this.currentIndex) : this.videos.forEach((video) => video.pause());
    },

    bindTrackEvents() {
      if (!DOM.track) return;

      DOM.track.addEventListener("transitionend", () => {
        this.isAnimating = false;
        if (this.currentIndex === this.videos.length - 1) this.currentIndex = 1;
        if (this.currentIndex === 0) this.currentIndex = this.videos.length - 2;
        requestAnimationFrame(() => this.setPosition(this.currentIndex, false));
      });

      DOM.track.style.touchAction = "pan-y";

      DOM.track.addEventListener("touchstart", (e) => {
        if (utils.isMobileViewport() && navbarModule.isOpen()) {
          e.preventDefault();
          return;
        }
        this.startX = e.touches[0].clientX;
        this.isDragging = true;
        DOM.track.style.transition = "none";
      }, { passive: false });

      DOM.track.addEventListener("touchmove", (e) => {
        if (utils.isMobileViewport() && navbarModule.isOpen()) {
          e.preventDefault();
          return;
        }
        if (!this.isDragging || !this.videos.length) return;

        const diff = e.touches[0].clientX - this.startX;
        const videoWidth = this.videos[0].offsetWidth;
        const padding = DOM.track.parentElement.offsetWidth * 0.1;
        DOM.track.style.transform = `translateX(${-this.currentIndex * videoWidth + diff - padding}px)`;
      }, { passive: false });

      DOM.track.addEventListener("touchend", (e) => {
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
      });
    },

    bindVisibilityEvents() {
      const gallerySection = document.querySelector(".gallery");
      if (gallerySection) {
        const observer = new IntersectionObserver((entries) => {
          entries.forEach((entry) => {
            if (!this.videos[this.currentIndex]) return;
            entry.isIntersecting ? this.playOnly(this.currentIndex) : this.videos.forEach((video) => video.pause());
          });
        }, { threshold: 0.4 });

        observer.observe(gallerySection);
      }

      document.addEventListener("visibilitychange", () => {
        if (document.hidden) {
          this.videos.forEach((video) => video.pause());
        } else {
          this.playOnly(this.currentIndex);
        }
      });

      window.addEventListener("resize", () => this.setPosition(this.currentIndex, false));
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

  const uiModule = {
    ctaMagneticButtons: [],
    ctaMagneticRunning: false,
    ctaMagneticLastFrame: 0,

    resetCtaMagnetic() {
      this.ctaMagneticButtons.forEach((item) => {
        item.button.classList.remove("is-magnetic-near", "is-hovered");

        Object.assign(item, {
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
        });

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
          ["X", ""],
          ["Y", ""],
          ["Scale", ""],
          ["ShadowY", ""],
          ["ShadowBlur", ""],
          ["ShadowAlpha", ""],
          ["LabelX", "Label"],
          ["LabelY", "Label"],
          ["LabelScale", "Label"],
          ["GlossX", "Gloss"],
          ["GlossY", "Gloss"],
          ["GlossOpacity", "Gloss"],
        ].forEach(([suffix]) => {
          const currentKey = `current${suffix}`;
          const targetKey = `target${suffix}`;
          const velocityKey = `velocity${suffix}`;
          const result = stepSpring(item[currentKey], item[targetKey], item[velocityKey]);
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
      DOM.cta?.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (utils.isMobileViewport() && navbarModule.isOpen()) {
          navbarModule.closeMenu();
          requestAnimationFrame(() => scrollEngine.goTo("#contact", "down"));
          return;
        }

        scrollEngine.goTo("#contact", "down");
      });

      this.ctaMagneticButtons = [...document.querySelectorAll(".cta-button")].map((button) => ({
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
      }));

      const resetButtonTarget = (item) => {
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
      };

      const applyMagneticField = (item, clientX, clientY) => {
        if (
          document.body.classList.contains("nav-menu-open") ||
          (utils.isMobileViewport() && navbarModule.isOpen()) ||
          document.body.classList.contains("suppress-cta-hover")
        ) {
          resetButtonTarget(item);
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
          resetButtonTarget(item);
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
        const innerBoost = insideButton ? Math.pow(1 - Math.pow(1 - innerProximity, 3), 1.15) : 0;
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

        item.targetLabelX = dirX * Math.min(rect.width * 0.065, 10) * Math.min(combinedStrength * 1.18, 1);
        item.targetLabelY = dirY * Math.min(rect.height * 0.11, 6) * Math.min(combinedStrength * 1.18, 1);
        item.targetLabelScale = 1 + combinedStrength * 0.01;

        item.targetGlossX = Math.max(0, Math.min(((clientX - rect.left) / rect.width) * 100, 100));
        item.targetGlossY = Math.max(0, Math.min(((clientY - rect.top) / rect.height) * 100, 100));
        item.targetGlossOpacity = 0.18 + combinedStrength * 0.24;
      };

      window.addEventListener("pointermove", (e) => {
        if (e.pointerType !== "mouse") {
          this.ctaMagneticButtons.forEach(resetButtonTarget);
          this.startCtaMagneticAnimation();
          return;
        }

        this.ctaMagneticButtons.forEach((item) => applyMagneticField(item, e.clientX, e.clientY));
        this.startCtaMagneticAnimation();
      }, { passive: true });

      window.addEventListener("pointerleave", () => {
        this.ctaMagneticButtons.forEach(resetButtonTarget);
        this.startCtaMagneticAnimation();
      });

      this.ctaMagneticButtons.forEach((item) => {
        item.button.addEventListener("blur", () => {
          resetButtonTarget(item);
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
          if (e.pointerType !== "mouse") item.button.classList.remove("is-hovered");
        });
      });
    },

    bindHeroClickBehavior() {
      DOM.hero?.addEventListener("click", (e) => {
        if (!DOM.navbar || (utils.isMobileViewport() && navbarModule.isOpen())) return;
        if (e.target.closest(".cta-button")) return;

        const visible = parseFloat(getComputedStyle(DOM.navbar).getPropertyValue("--nav-visible"));
        const openManually = visible < 0.5;

        state.manualNavbarOpen = openManually;
        state.targetVisible = openManually ? 1 : 0;
        state.targetCompact = openManually ? 1 : 0;
        state.targetSurface = openManually ? 1 : 0;
        state.targetGestureStretch = 0;
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
          1 - Math.min(window.scrollY / window.innerHeight, 1) * physics.values.heroBrightnessScrollFactor
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

      if (DOM.year) DOM.year.textContent = String(new Date().getFullYear());
    },
  };

  function bindUserScrollInterrupts() {
    window.addEventListener("wheel", () => {
      scrollEngine.cancelActiveScroll();
      state.touchScrollActive = false;
      state.targetGestureStretch = 0;
      navbarModule.startAnimation();
    }, { passive: true });

    const endTouchScroll = () => {
      state.touchScrollActive = false;
      state.targetGestureStretch = 0;
      navbarModule.startAnimation();
    };

    window.addEventListener("touchstart", () => {
      scrollEngine.cancelActiveScroll();
      state.touchScrollActive = true;
    }, { passive: true });

    window.addEventListener("touchend", endTouchScroll, { passive: true });
    window.addEventListener("touchcancel", endTouchScroll, { passive: true });
  }

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

      document.documentElement.style.setProperty("--scroll-hint-column-center", `${hintCenterX}px`);
      document.documentElement.style.setProperty("--gallery-hint-lane-width", `${contentLeft}px`);
      hintsRoot.style.setProperty("--scroll-hint-column-center", `${hintCenterX}px`);

      const gallerySlider = document.querySelector(".gallery-slider");
      if (!gallerySlider) return;

      const sliderRect = gallerySlider.getBoundingClientRect();
      const laneLeftInsideSlider = Math.max(0, Math.min(sliderRect.width, hintCenterX - sliderRect.left));
      gallerySlider.style.setProperty("--gallery-lane-left", `${laneLeftInsideSlider}px`);
    },

    init() {
      this.update();
      window.addEventListener("resize", () => this.update());
      window.addEventListener("orientationchange", () => setTimeout(() => this.update(), 120));
      window.addEventListener("pageshow", () => requestAnimationFrame(() => this.update()));
      document.fonts?.ready?.then(() => this.update());
    },
  };

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

  function init() {
    // performanceModule.init();
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

    if (DOM.navbar) {
      window.addEventListener("scroll", () => navbarModule.handleScroll(), { passive: true });
    }

    window.addEventListener("resize", () => {
      physics.update();
      galleryModule.setPosition(galleryModule.currentIndex, false);
    });

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        state.animationRunning = false;
      } else {
        navbarModule.handleScroll();
      }
    });

    navbarModule.handleScroll();
  }

  init();
});
