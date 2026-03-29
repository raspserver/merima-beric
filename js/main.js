document.addEventListener("DOMContentLoaded", () => {
  /*
    =====================================================================
    MERIMA BERIC - MAIN.JS V3.1
    Kleine Bugfix-/Cleanup-Fassung mit deutscher Kommentierung
    =====================================================================

    Änderungen gegenüber V3:
    - Gallery-Offset robuster: Padding + Gap werden direkt aus CSS gelesen
    - Scroll-Hint-Timing sauber getrennt: Show-Delay vs. Show-Duration
    - ein paar kleine Stabilitätsverbesserungen in der Gallery
    - kleine Defensive-Verbesserungen bei Transition-/Resize-Fällen
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
    
    input: {
		lastInteractionType: null, // "touch" | "mouse" | "keyboard" | null
		lastTouchTs: 0,
	  },

    ui: {
      suppressCtaHoverCleanup: null,
      suppressNextClick: false,
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
  // 8) GENERISCHE MINI-ENGINE FÜR MAGNETISCHE BUTTONS
  // ---------------------------------------------------------------------
  function createMagneticEngine(selector, options = {}) {
    const items = [...document.querySelectorAll(selector)].map((button) => ({
      button,
      near: false,
      values: {
        x: 0,
        y: 0,
        scale: 1,
        shadowY: 0,
        shadowBlur: 0,
        shadowAlpha: 0,
        labelX: 0,
        labelY: 0,
        labelScale: 1,
        glossX: 50,
        glossY: 50,
        glossOpacity: 0,
      },
      target: {
        x: 0,
        y: 0,
        scale: 1,
        shadowY: 0,
        shadowBlur: 0,
        shadowAlpha: 0,
        labelX: 0,
        labelY: 0,
        labelScale: 1,
        glossX: 50,
        glossY: 50,
        glossOpacity: 0,
      },
      velocity: {
        x: 0,
        y: 0,
        scale: 0,
        shadowY: 0,
        shadowBlur: 0,
        shadowAlpha: 0,
        labelX: 0,
        labelY: 0,
        labelScale: 0,
        glossX: 0,
        glossY: 0,
        glossOpacity: 0,
      },
    }));

    const cfg = {
      maxDistance: 1,
      springNear: 0.16,
      springFar: 0.11,
      dampingNear: 0.78,
      dampingFar: 0.82,
      isDisabled: () => false,
      ...options,
    };

    let running = false;
    let lastFrame = 0;

    const keys = [
      "x",
      "y",
      "scale",
      "shadowY",
      "shadowBlur",
      "shadowAlpha",
      "labelX",
      "labelY",
      "labelScale",
      "glossX",
      "glossY",
      "glossOpacity",
    ];

    function setButtonVars(item) {
      utils.setVars(item.button, {
        "--magnetic-x": `${item.values.x.toFixed(2)}px`,
        "--magnetic-y": `${item.values.y.toFixed(2)}px`,
        "--magnetic-scale": item.values.scale.toFixed(4),
        "--magnetic-shadow-y": `${item.values.shadowY.toFixed(2)}px`,
        "--magnetic-shadow-blur": `${item.values.shadowBlur.toFixed(2)}px`,
        "--magnetic-shadow-alpha": item.values.shadowAlpha.toFixed(3),
        "--label-x": `${item.values.labelX.toFixed(2)}px`,
        "--label-y": `${item.values.labelY.toFixed(2)}px`,
        "--label-scale": item.values.labelScale.toFixed(4),
        "--gloss-x": `${item.values.glossX.toFixed(2)}%`,
        "--gloss-y": `${item.values.glossY.toFixed(2)}%`,
        "--gloss-opacity": item.values.glossOpacity.toFixed(3),
      });
    }

    function reset(item, hard = false) {
      item.near = false;
      item.button.classList.remove("is-magnetic-near", "is-hovered");

      Object.assign(item.target, {
        x: 0,
        y: 0,
        scale: 1,
        shadowY: 0,
        shadowBlur: 0,
        shadowAlpha: 0,
        labelX: 0,
        labelY: 0,
        labelScale: 1,
        glossX: 50,
        glossY: 50,
        glossOpacity: 0,
      });

      if (!hard) return;

      Object.assign(item.values, item.target);
      Object.keys(item.velocity).forEach((key) => {
        item.velocity[key] = 0;
      });

      setButtonVars(item);
    }

    function resetAll(hard = false) {
      items.forEach((item) => reset(item, hard));
      start();
    }

    function step(current, target, velocity, spring, damping, delta) {
      const force = (target - current) * spring;
      velocity += force * delta;
      velocity *= Math.pow(damping, delta);
      current += velocity * delta;
      return { current, velocity };
    }

    function animate(now) {
      let delta = (now - lastFrame) / 16.67;
      lastFrame = now;
      delta = Math.min(delta, 2);

      let moving = false;

      items.forEach((item) => {
        const spring = item.near ? cfg.springNear : cfg.springFar;
        const damping = item.near ? cfg.dampingNear : cfg.dampingFar;

        keys.forEach((key) => {
          const next = step(
            item.values[key],
            item.target[key],
            item.velocity[key],
            spring,
            damping,
            delta
          );

          item.values[key] = next.current;
          item.velocity[key] = next.velocity;

          if (
            Math.abs(item.target[key] - item.values[key]) > 0.01 ||
            Math.abs(item.velocity[key]) > 0.01
          ) {
            moving = true;
          }
        });

        setButtonVars(item);
      });

      if (!moving) {
        running = false;
        return;
      }

      requestAnimationFrame(animate);
    }

    function start() {
      if (running) return;
      running = true;
      lastFrame = performance.now();
      requestAnimationFrame(animate);
    }

    function applyPointer(item, clientX, clientY) {
      if (cfg.isDisabled()) {
        reset(item);
        return;
      }

      const rect = item.button.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const dx = clientX - centerX;
      const dy = clientY - centerY;

      const nx = dx / (rect.width * 1.15);
      const ny = dy / (rect.height * 1.9);
      const distance = Math.sqrt(nx * nx + ny * ny);

      if (distance > cfg.maxDistance) {
        reset(item);
        return;
      }

      item.near = true;
      item.button.classList.add("is-magnetic-near");

      const proximity = 1 - distance;
      const eased = 1 - Math.pow(1 - proximity, 3);
      const shaped = Math.pow(eased, 1.6);

      const innerNX = dx / (rect.width / 2);
      const innerNY = dy / (rect.height / 2);
      const innerDistance = Math.sqrt(innerNX * innerNX + innerNY * innerNY);
      const inside = innerDistance <= 1;
      const innerProximity = inside ? 1 - innerDistance : 0;

      const innerBoost = inside
        ? Math.pow(1 - Math.pow(1 - innerProximity, 3), 1.15)
        : 0;

      const strength = inside
        ? Math.min(0.32 * shaped + 0.68 * innerBoost, 1)
        : Math.min(0.62 * shaped, 0.5);

      const length = Math.hypot(dx, dy) || 1;
      const dirX = dx / length;
      const dirY = dy / length;

      Object.assign(item.target, {
        x: dirX * Math.min(rect.width * 0.12, 15) * strength,
        y: dirY * Math.min(rect.height * 0.26, 11) * strength,
        scale: 1 + strength * 0.014,

        shadowY: 10 + strength * 12,
        shadowBlur: 28 + strength * 20,
        shadowAlpha: 0.12 + strength * 0.18,

        labelX:
          dirX * Math.min(rect.width * 0.065, 10) * Math.min(strength * 1.18, 1),
        labelY:
          dirY *
          Math.min(rect.height * 0.11, 6) *
          Math.min(strength * 1.18, 1),
        labelScale: 1 + strength * 0.01,

        glossX: clamp(((clientX - rect.left) / rect.width) * 100, 0, 100),
        glossY: clamp(((clientY - rect.top) / rect.height) * 100, 0, 100),
        glossOpacity: 0.18 + strength * 0.24,
      });
    }

    function bind() {
      window.addEventListener(
        "pointermove",
        (e) => {
          if (e.pointerType !== "mouse") {
            resetAll();
            return;
          }

          items.forEach((item) => applyPointer(item, e.clientX, e.clientY));
          start();
        },
        { passive: true }
      );

      window.addEventListener("pointerleave", () => resetAll());

      items.forEach((item) => {
        item.button.addEventListener("blur", () => {
          reset(item);
          start();
        });

        item.button.addEventListener("pointerenter", (e) => {
          if (e.pointerType === "mouse" && !cfg.isDisabled()) {
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
    }

    return {
      items,
      bind,
      start,
      resetAll,
    };
  }

  // ---------------------------------------------------------------------
  // 9) SCROLL-ENGINE
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

      const mode = forcedMode || this.getModeForTarget(target);
      const isHeroTarget = target.classList?.contains("hero");
      const alreadyAtTop = window.scrollY <= 5;

      state.nav.manualOpen = false;

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
  // 10) NAVBAR-MODUL
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

      const currentY = window.scrollY;
      const deltaY = currentY - state.lastScrollY;

      state.scrollVelocity = deltaY * 0.8;
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

      state.hero.parallax.target = scrollY * physics.values.heroParallaxFactor;

      utils.setVars(DOM.hero, {
        "--hero-scale": 1 - progress * physics.values.heroScaleScrollFactor,
        "--hero-brightness":
          1 - progress * physics.values.heroBrightnessScrollFactor,
        "--hero-parallax": `${state.hero.parallax.current}px`,
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

      state.nav.visible.current = clamp(state.nav.visible.current, 0, 1);
      state.nav.compact.current = clamp(state.nav.compact.current, 0, 1);
      state.nav.surface.current = clamp(state.nav.surface.current, 0, 1);
      state.nav.gestureStretch.current = clamp(
        state.nav.gestureStretch.current,
        -physics.values.navGestureCompressMax,
        physics.values.navGestureExpandMax
      );

      this.renderNavbar();
      this.renderHero();

      const stillMoving =
        isAnimatedValueMoving(state.nav.visible, springs.navVisible) ||
        isAnimatedValueMoving(state.nav.compact, springs.navCompact) ||
        isAnimatedValueMoving(state.nav.surface, springs.navSurface) ||
        isAnimatedValueMoving(state.nav.gestureStretch, springs.navGesture) ||
        isAnimatedValueMoving(state.hero.parallax, springs.heroParallax);

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

        e.preventDefault();
        e.stopPropagation();
        state.ui.suppressNextClick = true;

        if (onCta || onSectionScrollHead) {
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
  // 11) SECTION-NAVIGATION
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
  // 12) SCROLL-HINT-SYSTEM
  // ---------------------------------------------------------------------
  const scrollSectionHintModule = {
    root: null,
    measurer: null,
    hintSlots: [],
    metricsCache: new Map(),
    raf: null,

    state: {
      visible: false,
      unlocked: false,
      lastScrollTs: 0,
      lastObservedY: window.scrollY,
      distance: 0,
      timers: {
        scrollEnd: null,
        visibility: null,
        relock: null,
      },
    },

    config: {
      maxVisibleHints: 2,
      showDelayMs: 500,
      hideDelayMs: 1000,
      fadeDurationMs: 500,
      showScrollDistancePx: window.innerHeight,
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
        { length: this.config.maxVisibleHints },
        (_, i) => `
          <div class="scroll-section-hint-anchor scroll-section-hint-anchor--${i}" tabindex="0" role="button">
            <div class="scroll-section-hint scroll-section-hint--${i}">
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

    timer(name, fn, delay) {
      clearTimeout(this.state.timers[name]);
      this.state.timers[name] = setTimeout(() => {
        this.state.timers[name] = null;
        fn();
      }, delay);
    },

    clearTimer(name) {
      clearTimeout(this.state.timers[name]);
      this.state.timers[name] = null;
    },

    refreshConfig() {
      this.config.showDelayMs = cssVar.timeMs("--section-hint-show-delay", 500);
      this.config.hideDelayMs = cssVar.timeMs("--section-hint-hide-delay", 1000);
      this.config.fadeDurationMs = cssVar.timeMs("--section-hint-fade-duration", 500);
      this.config.showScrollDistancePx = cssVar.lengthPx(
        "--section-hint-show-scroll-distance",
        window.innerHeight
      );
    },

    getSections() {
      return state.orderedSections.filter((section) => {
        if (!section) return false;
        if (section.classList?.contains("hero")) return true;
        return !!section.id && !!this.labels[section.id];
      });
    },

    getViewportBottom() {
      return (
        window.visualViewport?.height ||
        window.innerHeight ||
        document.documentElement.clientHeight
      );
    },

    getNavbarBottom() {
      return DOM.navbar
        ? DOM.navbar.getBoundingClientRect().bottom
        : cssVar.number("--nav-height", 78);
    },

    gapPx() {
      return cssVar.remPx("--section-hint-boundary-gap", 4.8);
    },

    makeText(section, variant = "forward") {
      if (!section?.id || !this.labels[section.id]) return "";
      return variant === "forward"
        ? `>> ${this.labels[section.id]} >>`
        : `<< ${this.labels[section.id]} <<`;
    },

    measure(text) {
      const key = text || " ";
      if (this.metricsCache.has(key)) return this.metricsCache.get(key);

      this.measurer.textContent = key;
      const rect = this.measurer.getBoundingClientRect();
      const value = { width: rect.width || 0, height: rect.height || 0 };
      this.metricsCache.set(key, value);
      return value;
    },

    anchorHeight(text) {
      return Math.max(48, this.measure(text).width + 16);
    },

    parseColor(color) {
      if (!color) return null;

      const value = color.trim().toLowerCase();
      const rgb = value.match(/rgba?\(([^)]+)\)/);

      if (rgb) {
        const parts = rgb[1].split(",").map((p) => parseFloat(p.trim()));
        if (parts.length >= 3 && parts.slice(0, 3).every(Number.isFinite)) {
          return { r: parts[0], g: parts[1], b: parts[2] };
        }
      }

      const hex = value.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
      if (!hex) return null;

      let h = hex[1];
      if (h.length === 3) h = h.split("").map((c) => c + c).join("");
      const intVal = parseInt(h, 16);

      return {
        r: (intVal >> 16) & 255,
        g: (intVal >> 8) & 255,
        b: intVal & 255,
      };
    },

    luminance({ r, g, b }) {
      const normalize = (c) => {
        const v = c / 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
      };

      return (
        0.2126 * normalize(r) +
        0.7152 * normalize(g) +
        0.0722 * normalize(b)
      );
    },

    getSectionTheme(sectionEl) {
      if (!sectionEl) return "dark";

      const explicit = sectionEl.dataset.hintTheme;
      if (explicit === "light" || explicit === "dark") return explicit;

      const bg = getComputedStyle(sectionEl).backgroundColor;
      const rgb = this.parseColor(bg) || { r: 250, g: 250, b: 248 };
      return this.luminance(rgb) < 0.42 ? "light" : "dark";
    },

    currentContext() {
      const sections = this.getSections();
      if (!sections.length) return null;

      const navBottom = this.getNavbarBottom();
      const viewportBottom = this.getViewportBottom();
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
          const switchLine = scrollingUp ? navBottom : lowerThirdY;
          if (rect.top <= switchLine) currentIndex = i;
          else break;
          continue;
        }

        if (rect.top <= navBottom) currentIndex = i;
        else break;
      }

      return {
        sections,
        current: sections[currentIndex] || null,
        next: sections[currentIndex + 1] || null,
        overnext: sections[currentIndex + 2] || null,
      };
    },

    createPlacement(section, variant, top, priority = 0, opacity = 1) {
      if (!section) return null;
      return { section, variant, top, priority, opacity };
    },

    buildPlacements(ctx) {
      if (!ctx?.current) return [];

      const { current, next, overnext, sections } = ctx;
      const gap = this.gapPx();
      const navBottom = this.getNavbarBottom();
      const viewportBottom = this.getViewportBottom();
      const lowerThirdY = viewportBottom * (2 / 3);

      const placements = [];
      const push = (...items) => items.filter(Boolean).forEach((item) => placements.push(item));

      const isHome = current.classList?.contains("hero") || current.id === "home";

      const nextRect = next?.getBoundingClientRect();
      const overnextRect = overnext?.getBoundingClientRect();

      const nextTop = nextRect?.top ?? Infinity;
      const overnextTop = overnextRect?.top ?? Infinity;

      const nextForwardTop = next
        ? nextTop + gap + this.anchorHeight(this.makeText(next, "forward")) / 2
        : 0;

      const nextBackwardTop = next
        ? nextTop - gap - this.anchorHeight(this.makeText(next, "backward")) / 2
        : 0;

      const overnextBackwardTop = overnext
        ? overnextTop -
          gap -
          this.anchorHeight(this.makeText(overnext, "backward")) / 2
        : 0;

      const currentDockTop =
        navBottom + gap + this.anchorHeight(this.makeText(current, "forward")) / 2;

      const nextDockBottom = next
        ? viewportBottom -
          gap -
          this.anchorHeight(this.makeText(next, "backward")) / 2
        : 0;

      const nextDockLower = next
        ? lowerThirdY -
          gap -
          this.anchorHeight(this.makeText(next, "backward")) / 2
        : 0;

      const overnextDockBottom = overnext
        ? viewportBottom -
          gap -
          this.anchorHeight(this.makeText(overnext, "backward")) / 2
        : 0;

      const overnextDockLower = overnext
        ? lowerThirdY -
          gap -
          this.anchorHeight(this.makeText(overnext, "backward")) / 2
        : 0;

      const zone = (y) => {
        if (!Number.isFinite(y) || y <= navBottom || y >= viewportBottom) {
          return "outside";
        }

        const rel = y - navBottom;
        const third = (viewportBottom - navBottom) / 3;

        if (rel < third) return "entering";
        if (rel < third * 2) return "passing";
        return "leaving";
      };

      const nextZone = zone(nextTop);
      const overnextZone = zone(overnextTop);

      const about = sections.find((s) => s?.id === "about");
      const gallery = sections.find((s) => s?.id === "gallery");

      if (about && current.classList?.contains("hero")) {
        const boundaryY = about.getBoundingClientRect().top;

        if (boundaryY > navBottom && boundaryY < viewportBottom) {
          const topThirdEnd = viewportBottom / 3;
          const middleThirdEnd = viewportBottom * (2 / 3);
          const scrollingUp = state.scrollDirection === "up";

          const aboutForwardTop =
            boundaryY + gap + this.anchorHeight(this.makeText(about, "forward")) / 2;

          const aboutBackwardTop =
            boundaryY - gap - this.anchorHeight(this.makeText(about, "backward")) / 2;

          const galleryBottomTop = gallery
            ? viewportBottom -
              gap -
              this.anchorHeight(this.makeText(gallery, "backward")) / 2
            : 0;

          if (scrollingUp) {
            if (boundaryY < topThirdEnd) {
              push(
                this.createPlacement(about, "forward", aboutForwardTop, 100),
                gallery && this.createPlacement(gallery, "backward", galleryBottomTop, 60)
              );
              return placements;
            }

            if (boundaryY < middleThirdEnd) {
              push(this.createPlacement(about, "forward", aboutForwardTop, 100));
              return placements;
            }

            push(this.createPlacement(about, "backward", aboutBackwardTop, 100));
            return placements;
          }

          if (boundaryY < middleThirdEnd) {
            push(this.createPlacement(about, "forward", aboutForwardTop, 100));
            if (gallery && boundaryY < topThirdEnd) {
              push(this.createPlacement(gallery, "backward", galleryBottomTop, 60));
            }
            return placements;
          }

          return placements;
        }
      }

      if (!isHome && !next) {
        push(this.createPlacement(current, "forward", currentDockTop, 100));
        return placements;
      }

      if (isHome) {
        if (nextZone === "entering" || nextZone === "passing") {
          push(this.createPlacement(next, "forward", nextForwardTop, 100));
        }

        if (overnext) {
          push(
            overnextZone !== "outside"
              ? this.createPlacement(overnext, "backward", overnextBackwardTop, 60)
              : nextZone === "entering"
              ? this.createPlacement(overnext, "backward", overnextDockLower, 60)
              : null
          );
        }

        if (
          (nextZone === "outside" || nextZone === "leaving") &&
          nextTop > nextDockLower + gap
        ) {
          push(this.createPlacement(next, "backward", nextDockLower, 70));
        }

        return placements;
      }

      if (nextZone === "outside") {
        push(
          this.createPlacement(current, "forward", currentDockTop, 100),
          this.createPlacement(next, "backward", nextDockBottom, 70)
        );
        return placements;
      }

      if (nextZone === "entering") {
        push(this.createPlacement(next, "forward", nextForwardTop, 100));

        if (overnext) {
          push(
            overnextZone !== "outside"
              ? this.createPlacement(overnext, "backward", overnextBackwardTop, 60)
              : this.createPlacement(overnext, "backward", overnextDockBottom, 60)
          );
        }

        return placements;
      }

      if (nextZone === "passing") {
        push(
          this.createPlacement(current, "forward", currentDockTop, 90),
          this.createPlacement(next, "forward", nextForwardTop, 100)
        );
        return placements;
      }

      if (nextZone === "leaving") {
        push(
          this.createPlacement(current, "forward", currentDockTop, 90),
          this.createPlacement(next, "backward", nextBackwardTop, 100)
        );
      }

      return placements;
    },

    setHint(hintEl, placement = null) {
      const anchor = hintEl?.parentElement;
      const base = hintEl?.querySelector(".scroll-section-hint-base");

      if (!hintEl || !anchor || !base || !placement?.section) {
        if (base) base.textContent = "";
        if (hintEl) hintEl.style.opacity = "0";

        if (anchor) {
          anchor.dataset.scrollTarget = "";
          anchor.style.pointerEvents = "none";
          anchor.style.opacity = "0";
          anchor.setAttribute("aria-hidden", "true");
        }

        return;
      }

      const text = this.makeText(placement.section, placement.variant);
      const opacity =
        clamp(placement.opacity ?? 1, 0, 1) *
        cssVar.number("--section-hint-visibility", 0.5);

      const metrics = this.measure(text);

      base.textContent = text;
      hintEl.style.opacity = String(opacity);
      hintEl.style.top = "50%";
      hintEl.style.left = "50%";
      hintEl.dataset.theme = this.getSectionTheme(placement.section);

      anchor.dataset.scrollTarget = placement.section.id
        ? `#${placement.section.id}`
        : "";

      anchor.style.top = `${Math.round(placement.top)}px`;
      anchor.style.width = `${Math.max(48, metrics.height + 16)}px`;
      anchor.style.height = `${Math.max(48, metrics.width + 16)}px`;
      anchor.style.pointerEvents = "auto";
      anchor.style.opacity = "1";
      anchor.setAttribute("aria-hidden", "false");
    },

    render() {
      if (!this.root) return;

      const ctx = this.currentContext();
      document.body.classList.toggle("in-gallery", ctx?.current?.id === "gallery");

      const placements = this.buildPlacements(ctx)
        .filter(Boolean)
        .sort((a, b) => (a.top - b.top) || ((b.priority ?? 0) - (a.priority ?? 0)));

      this.hintSlots.forEach((hintEl, i) => {
        this.setHint(hintEl, placements[i] || null);
      });
    },

    scheduleRender() {
      if (this.raf) return;

      this.raf = requestAnimationFrame(() => {
        this.raf = null;
        this.render();
      });
    },

    applyVisible(show) {
      this.state.visible = show;
      this.root.classList.toggle("is-visible", show);
      document.body.classList.toggle("hints-visible", show);

      if (!show) {
        this.timer("relock", () => {
          if (!this.state.visible) {
            this.state.unlocked = false;
            this.state.distance = 0;
          }
        }, this.config.fadeDurationMs);
      } else {
        this.clearTimer("relock");
      }
    },
    
    show() {
	  // Schon sichtbar? Nichts neu timen.
	  if (this.state.visible) {
		this.clearTimer("relock");
		return;
	  }

	  // Läuft bereits ein Show-Timer? Nicht erneut starten.
	  if (this.state.timers.visibility) return;

	  this.timer(
		"visibility",
		() => this.applyVisible(true),
		this.config.showDelayMs
	  );
	},

	isTouchDrivenScroll() {
	  if (state.scroll.programmatic) return false;

	  const now = performance.now();
	  const recentTouch = now - state.input.lastTouchTs < 1200;

	  return (
		state.touch.active ||
		(state.input.lastInteractionType === "touch" && recentTouch)
	  );
	},

	hideImmediatelyForNonTouchInput() {
	  if (!this.root) return;

	  ["scrollEnd", "visibility", "relock"].forEach((name) => this.clearTimer(name));

	  this.state.visible = false;

	  this.root.classList.add("is-instant-hidden");
	  this.root.classList.remove("is-visible");
	  document.body.classList.remove("hints-visible");
	  document.body.classList.add("hints-instant-hide");

	  requestAnimationFrame(() => {
		requestAnimationFrame(() => {
		  this.root?.classList.remove("is-instant-hidden");
		  document.body.classList.remove("hints-instant-hide");
		});
	  });
	},
	
	onScrollActivity() {
	  if (state.scroll.programmatic) {
		this.hideImmediatelyForProgrammaticScroll();
		return;
	  }

	  if (!this.isTouchDrivenScroll()) {
		this.hideImmediatelyForNonTouchInput();
		return;
	  }

	  const currentY = window.scrollY;
	  this.state.lastScrollTs = performance.now();
	  this.state.distance += Math.abs(currentY - this.state.lastObservedY);
	  this.state.lastObservedY = currentY;

	  // Noch nicht freigeschaltet: erst Mindestscrollstrecke sammeln
	  if (!this.state.unlocked) {
		if (this.state.distance < this.config.showScrollDistancePx) {
		  this.hideWithScrollDelay();
		  this.scheduleHideAfterIdle();
		  return;
		}

		this.state.unlocked = true;
	  }

	  // Nur touch-getriebener Scroll darf Hints zeigen
	  this.show();
	  this.scheduleHideAfterIdle();
	},
	
    hide() {
      this.clearTimer("visibility");
      this.applyVisible(false);
    },

    hideWithScrollDelay() {
      this.clearTimer("visibility");
      this.timer("visibility", () => this.applyVisible(false), this.config.showDelayMs);
    },

    scheduleHide() {
      this.scheduleHideAfterIdle();
    },

    hideImmediatelyForProgrammaticScroll() {
      if (!this.root) return;

      ["scrollEnd", "visibility", "relock"].forEach((name) => this.clearTimer(name));

      this.state.visible = false;
      this.state.unlocked = false;
      this.state.distance = 0;

      this.root.classList.add("is-instant-hidden");
      this.root.classList.remove("is-visible");
      document.body.classList.remove("hints-visible");
      document.body.classList.add("hints-instant-hide");

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          this.root?.classList.remove("is-instant-hidden");
          document.body.classList.remove("hints-instant-hide");
        });
      });
    },

    scheduleHideAfterIdle() {
      this.clearTimer("scrollEnd");

      this.timer("scrollEnd", () => {
        const idleFor = performance.now() - this.state.lastScrollTs;

        if (idleFor >= this.config.hideDelayMs) {
          this.hide();
        } else {
          this.scheduleHideAfterIdle();
        }
      }, this.config.hideDelayMs);
    },

    bindClicks() {
      this.hintSlots.forEach((hintEl) => {
        const anchor = hintEl.parentElement;
        if (!anchor) return;

        const go = (e) => {
          e.preventDefault();
          e.stopPropagation();

          const targetSelector = anchor.dataset.scrollTarget;
          const opacity = parseFloat(hintEl.style.opacity || "0");
          const text = hintEl.textContent || "";

          if (!targetSelector || opacity <= 0.01) return;

          scrollEngine.goTo(
            targetSelector,
            text.includes(">>") ? "down" : "up-section"
          );
        };

        anchor.addEventListener("click", go);
        anchor.addEventListener("touchstart", go, { passive: false });
        anchor.addEventListener("keydown", (e) => {
          if (e.key === "Enter" || e.key === " ") go(e);
        });
      });
    },

    bindEvents() {
      window.addEventListener(
        "scroll",
        () => {
          this.scheduleRender();
          this.onScrollActivity();
        },
        { passive: true }
      );

      window.addEventListener(
		  "pointerdown",
		  (e) => {
			if (e.pointerType === "mouse" || e.pointerType === "pen") {
			  this.hideImmediatelyForNonTouchInput();
			}
		  },
		  { passive: true }
		);

      const onResize = () => {
        this.metricsCache.clear();
        this.refreshConfig();
        this.state.lastObservedY = window.scrollY;
        this.scheduleRender();
      };

      window.addEventListener("resize", onResize);
      window.addEventListener("orientationchange", () => setTimeout(onResize, 120));

      if (window.visualViewport) {
        window.visualViewport.addEventListener("resize", onResize);
        window.visualViewport.addEventListener("scroll", () => this.scheduleRender(), {
          passive: true,
        });
      }

      if ("onscrollend" in document) {
        document.addEventListener(
          "scrollend",
          () => {
            if (!state.scroll.programmatic) {
              this.state.lastScrollTs = performance.now();
              this.scheduleHideAfterIdle();
            }
          },
          { passive: true }
        );
      }
    },

    init() {
      this.build();
      this.refreshConfig();
      this.bindClicks();
      this.bindEvents();
      this.hide();
      this.render();
    },
  };

  // ---------------------------------------------------------------------
  // 13) GALLERY-MODUL
  // ---------------------------------------------------------------------
  const galleryModule = {
    videos: [],
    currentIndex: 1,
    isAnimating: false,
    startX: 0,
    isDragging: false,

    getSlider() {
      return DOM.track?.parentElement || null;
    },

    getSliderMetrics() {
      const slider = this.getSlider();
      const firstVideo = this.videos[0];
      if (!slider || !firstVideo || !DOM.track) return null;

      const sliderStyle = getComputedStyle(slider);
      const trackStyle = getComputedStyle(DOM.track);

      const paddingLeft = parseFloat(sliderStyle.paddingLeft) || 0;
      const gap =
        parseFloat(trackStyle.columnGap) ||
        parseFloat(trackStyle.gap) ||
        0;

      const videoWidth = firstVideo.getBoundingClientRect().width;

      return {
        slider,
        videoWidth,
        paddingLeft,
        gap,
      };
    },

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

      const metrics = this.getSliderMetrics();
      if (!metrics) return;

      const { videoWidth, paddingLeft, gap } = metrics;
      const slideStride = videoWidth + gap;
      const offset = index * slideStride - paddingLeft;

      DOM.track.style.transition = animate
        ? "transform 0.6s cubic-bezier(.16,.84,.44,1)"
        : "none";

      DOM.track.style.transform = `translateX(-${offset}px)`;
    },

    moveTo(index, autoPlay = false) {
      if (this.isAnimating || !this.videos.length) return;

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

      DOM.track.addEventListener("transitionend", (e) => {
        if (e.target !== DOM.track) return;

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

          const metrics = this.getSliderMetrics();
          if (!metrics) return;

          const diff = e.touches[0].clientX - this.startX;
          const { videoWidth, paddingLeft, gap } = metrics;
          const slideStride = videoWidth + gap;

          DOM.track.style.transform = `translateX(${
            -(this.currentIndex * slideStride - paddingLeft) + diff
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

      DOM.track.addEventListener(
        "touchcancel",
        () => {
          if (!this.isDragging) return;
          this.isDragging = false;
          this.setPosition(this.currentIndex, true);
        },
        { passive: true }
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
        requestAnimationFrame(() => this.setPosition(this.currentIndex, false));
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
  // 14) UI-MODUL (CTA, HERO-KLICK, PRICING TABS)
  // ---------------------------------------------------------------------
  const uiModule = {
    magnetic: null,

    resetCtaMagnetic() {
      this.magnetic?.resetAll(true);
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

      this.magnetic = createMagneticEngine(".cta-button", {
        isDisabled: () =>
          document.body.classList.contains("nav-menu-open") ||
          (utils.isMobileViewport() && navbarModule.isOpen()) ||
          document.body.classList.contains("suppress-cta-hover"),
      });

      this.magnetic.bind();
    },

    bindHeroClickBehavior() {
      DOM.hero?.addEventListener("click", (e) => {
        if (!DOM.navbar || (utils.isMobileViewport() && navbarModule.isOpen())) {
          return;
        }

        if (e.target.closest(".cta-button")) return;

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
  };

  // ---------------------------------------------------------------------
  // 15) USER-SCROLL-INTERRUPTS
  // ---------------------------------------------------------------------
  function bindUserScrollInterrupts() {
	  window.addEventListener(
		"wheel",
		() => {
		  state.input.lastInteractionType = "mouse";
		  scrollEngine.cancelActiveScroll();
		  state.touch.active = false;
		  state.nav.gestureStretch.target = 0;
		  navbarModule.startAnimation();
		  scrollSectionHintModule.hideImmediatelyForNonTouchInput?.();
		},
		{ passive: true }
	  );

	  const endTouchScroll = () => {
		state.touch.active = false;
		state.nav.gestureStretch.target = 0;
		navbarModule.startAnimation();
	  };

	  window.addEventListener(
		"touchstart",
		() => {
		  state.input.lastInteractionType = "touch";
		  state.input.lastTouchTs = performance.now();
		  scrollEngine.cancelActiveScroll();
		  state.touch.active = true;
		},
		{ passive: true }
	  );

	  window.addEventListener(
		"touchmove",
		() => {
		  state.input.lastInteractionType = "touch";
		  state.input.lastTouchTs = performance.now();
		  state.touch.active = true;
		},
		{ passive: true }
	  );

	  window.addEventListener("touchend", endTouchScroll, { passive: true });
	  window.addEventListener("touchcancel", endTouchScroll, { passive: true });

	  window.addEventListener(
		"keydown",
		(e) => {
		  const scrollKeys = [
			"ArrowUp",
			"ArrowDown",
			"PageUp",
			"PageDown",
			"Home",
			"End",
			" ",
			"Spacebar",
		  ];

		  if (!scrollKeys.includes(e.key)) return;

		  state.input.lastInteractionType = "keyboard";
		  state.touch.active = false;
		  scrollSectionHintModule.hideImmediatelyForNonTouchInput?.();
		},
		{ passive: true }
	  );

	  window.addEventListener(
		"pointerdown",
		(e) => {
		  if (e.pointerType === "touch") {
			state.input.lastInteractionType = "touch";
			state.input.lastTouchTs = performance.now();
		  } else if (e.pointerType === "mouse" || e.pointerType === "pen") {
			state.input.lastInteractionType = "mouse";
			state.touch.active = false;
			scrollSectionHintModule.hideImmediatelyForNonTouchInput?.();
		  }
		},
		{ passive: true }
	  );
	}

  // ---------------------------------------------------------------------
  // 16) POSITIONIERUNG DER SCROLL-HINT-SPALTE
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
  // 17) PERFORMANCE-MODUL
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
  // 18) INITIALISIERUNG
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

    if (DOM.navbar) {
      window.addEventListener(
        "scroll",
        () => navbarModule.handleScroll(),
        { passive: true }
      );
    }

    window.addEventListener("resize", () => {
      physics.update();
      galleryModule.setPosition(galleryModule.currentIndex, false);
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
