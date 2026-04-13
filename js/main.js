import { physics } from "./core/physics.js";
import { scrollEngine } from "./core/scrollEngine.js";
import { SETTINGS } from "./core/settings.js";
import { springs } from "./core/springs.js";
import { state } from "./core/state.js";
import { cssVar } from "./utils/cssVar.js";
import * from "./utils/helper.js";
import { utils } from "./utils/utils.js";
import { navbarModule } from "./modules/navbarModule.js";
import { scrollSectionHintModule } from "./modules/scrollSectionHintModule.js";


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


  // ---------------------------------------------------------------------
  // 5) ZENTRALER STATE
  // ---------------------------------------------------------------------
  
  // ---------------------------------------------------------------------
  // 6) PHYSIK-/MOTION-WERTE
  // ---------------------------------------------------------------------


  // ---------------------------------------------------------------------
  // 7) GEMEINSAME HILFSFUNKTIONEN FÜR ANIMATIONEN
  // ---------------------------------------------------------------------
  

  // ---------------------------------------------------------------------
  // 8) SCROLL-ENGINE
  // ---------------------------------------------------------------------


  // ---------------------------------------------------------------------
  // 9) NAVBAR-MODUL
  // ---------------------------------------------------------------------


  // ---------------------------------------------------------------------
  // 10) SECTION-NAVIGATION
  // ---------------------------------------------------------------------
  const sectionNavigationModule = {
	  
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

  // ---------------------------------------------------------------------
  // 11) SCROLL-HINT-SYSTEM
  // ---------------------------------------------------------------------






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
	// 13) PREWARM UTILITY (für HeroCalendar + ContactMap)
	// ---------------------------------------------------------------------
	const prewarmUtils = {
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
	  },
	};

  // ---------------------------------------------------------------------
  // 14) UI-MODUL (CTA, HERO-KLICK, PRICING TABS)
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
		state.ui.heroCalendarLastScrollY = window.scrollY;
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

		const layoutDuration = this.getHeroCalendarLayoutDuration();
		const revealDelay = this.getHeroCalendarRevealDelay();

		/*
		  Negative Werte bedeuten:
		  Schon vor Ende der Layout-Animation einblenden.
		  Beispiel:
		  layoutDuration = 750ms
		  revealDelay = -200ms
		  => Reveal startet nach 550ms
		*/
		const revealAfterMs = Math.max(0, layoutDuration + revealDelay);

		const revealCalendar = () => {
			DOM.heroCalendar.classList.add("is-open");
			DOM.heroCalendar.setAttribute("aria-hidden", "false");

			requestAnimationFrame(() => {
				this.updateFullCalendarSize();
			});
		};

		state.ui.heroCalendarRevealTimer = setTimeout(revealCalendar, revealAfterMs);

		this.animateHeroCalendarLayout(0, state.ui.heroCalendarMeasuredExtra, {
			mode: "open",

			onComplete: () => {
				state.ui.heroCalendarOpen = true;
				this.restoreNavbarAfterHeroCalendar({ preserveState: false });
			},
		});
	},

	closeHeroCalendar({ preserveAboutBoundaryAtTop = false, onComplete = null } = {}) {
	  if (!DOM.cta || !DOM.heroCalendar || !DOM.hero) return;

	  if (!state.ui.heroCalendarOpen && !state.ui.heroCalendarAnimating) {
		onComplete?.();
		return;
	  }

	  if (state.ui.heroCalendarAnimating || !state.ui.heroCalendarOpen) return;

	  state.ui.heroCalendarAnimating = true;
	  this.clearHeroCalendarTimers();

	  DOM.heroCalendar.classList.remove("is-open");
	  DOM.heroCalendar.setAttribute("aria-hidden", "true");

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

			  state.ui.heroCalendarAutoCloseArmed = false;

			  clearTimeout(state.ui.heroCalendarAutoCloseTimer);
			  state.ui.heroCalendarAutoCloseTimer = null;

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

			  this.restoreNavbarAfterHeroCalendar({ preserveState: true });

			  onComplete?.();
			},
		  }
		);
	  }, Math.max(0, this.getHeroCalendarRevealDelay()));
	},

	closeHeroCalendarInstant() {
		if (!DOM.cta || !DOM.heroCalendar || !DOM.hero) return;
		if (!state.ui.heroCalendarOpen) return;

		this.clearHeroCalendarTimers();

		/* Harte State-Resets */
		state.ui.heroCalendarAnimating = false;
		state.ui.heroCalendarOpen = false;
		state.ui.heroCalendarKeepCtaFlat = false;
		state.ui.heroCalendarAutoCloseArmed = false;
		state.scroll.programmatic = false;

		clearTimeout(state.ui.heroCalendarAutoCloseTimer);
		state.ui.heroCalendarAutoCloseTimer = null;

		DOM.heroCalendar.classList.remove("is-open");
		DOM.heroCalendar.setAttribute("aria-hidden", "true");

		DOM.cta.classList.remove("calendar-open");
		DOM.cta.setAttribute("aria-expanded", "false");

		if (DOM.ctaLabel) {
			DOM.ctaLabel.textContent =
				state.ui.ctaDefaultLabel || "Termin vereinbaren";
		}

		DOM.hero.classList.add("hero-calendar-close-instant");

		this.setHeroCalendarExtraHeight(0);

		DOM.hero.classList.remove("hero-calendar-open");
		DOM.hero.classList.remove("hero-calendar-active");
		DOM.hero.classList.remove("hero-calendar-lock-motion");

		DOM.heroCalendar.style.top = "";
		DOM.heroCalendar.style.height = "";

		resetAnimatedValue(state.cta.elasticY, 0);
		resetAnimatedValue(state.hero.parallax, 0);

		navbarModule.renderCTA();
		navbarModule.suppressCtaHoverTemporarily(250);

		this.restoreNavbarAfterHeroCalendar({ preserveState: true });

		/* Ganz wichtig: Scroll-/Navbar-Zustand neu synchronisieren */
		state.lastScrollY = window.scrollY;
		state.nav.manualOpen = false;

		navbarModule.handleScroll();
		navbarModule.startAnimation();

		requestAnimationFrame(() => {
			DOM.hero.classList.remove("hero-calendar-close-instant");
		});
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
		if (state.scroll.programmatic) return;

		const currentY = window.scrollY;
		const about = this.getHomeAboutBoundaryEl();
		if (!about) return;

		const navbarBottom = DOM.navbar
			? DOM.navbar.getBoundingClientRect().bottom
			: 0;

		const aboutTop = about.getBoundingClientRect().top;
		const autoCloseDepth = cssVar.lengthPx(
			"--hero-calendar-auto-close-depth",
			120
		);

		const scrollingDown = currentY > state.ui.heroCalendarLastScrollY + 1;
		state.ui.heroCalendarLastScrollY = currentY;

		if (!scrollingDown) return;

		/*
		  Wie tief ist #about bereits "unter" die Navbar-Unterkante gewandert?
		  0   => Boundary ist noch unterhalb / genau auf Navbar-Niveau
		  80  => #about ist bereits 80px weiter hineingescrollt
		*/
		const scrolledIntoAbout = Math.max(0, navbarBottom - aboutTop);

		if (scrolledIntoAbout >= autoCloseDepth) {
			if (state.ui.heroCalendarAutoCloseArmed) return;

			state.ui.heroCalendarAutoCloseArmed = true;

			clearTimeout(state.ui.heroCalendarAutoCloseTimer);
			state.ui.heroCalendarAutoCloseTimer = setTimeout(() => {
				state.ui.heroCalendarAutoCloseTimer = null;

				if (!state.ui.heroCalendarOpen) return;
				if (state.ui.heroCalendarAnimating) return;

				const currentAboutTop = about.getBoundingClientRect().top;
				const currentNavbarBottom = DOM.navbar
					? DOM.navbar.getBoundingClientRect().bottom
					: 0;

				const currentScrolledIntoAbout = Math.max(
					0,
					currentNavbarBottom - currentAboutTop
				);

				if (currentScrolledIntoAbout >= autoCloseDepth) {
					this.closeHeroCalendar({
						preserveAboutBoundaryAtTop: true
					});
				} else {
					state.ui.heroCalendarAutoCloseArmed = false;
				}
			}, 180);

			return;
		}

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
	
	getHeroCalendarPrewarmDistancePx() {
	  const about = document.getElementById("about");
	  if (!about) return window.innerHeight * 0.2;

	  const ratio = cssVar.number("--hero-calendar-prewarm-about-ratio", 0.2);
	  return Math.max(0, about.offsetHeight * ratio);
	},
	
	setHeroCalendarExtraHeight(px) {
		const value = Math.max(0, px);
		state.ui.heroCalendarExtraHeight = value;

		DOM.hero?.style.setProperty("--hero-calendar-extra-height", `${value}px`);
		DOM.heroContent?.style.setProperty("--hero-calendar-extra-height", `${value}px`);
	},
	
	clearHeroCalendarTimers() {
		if (state.ui.heroCalendarLayoutRaf) {
			cancelAnimationFrame(state.ui.heroCalendarLayoutRaf);
			state.ui.heroCalendarLayoutRaf = null;
		}

		clearTimeout(state.ui.heroCalendarRevealTimer);
		state.ui.heroCalendarRevealTimer = null;

		clearTimeout(state.ui.heroCalendarAutoCloseTimer);
		state.ui.heroCalendarAutoCloseTimer = null;
		state.ui.heroCalendarAutoCloseArmed = false;

		this.unlockHeroCalendarScrollBehavior();
	},

	easeHeroCalendar(t) {
		return 1 - Math.pow(1 - t, 3);
	},
	
	getElementTopWithinHero(element, heroRect) {
		if (!element || !heroRect) return 0;
		return element.getBoundingClientRect().top - heroRect.top;
	},

	measureHeroCalendarLayout() {
		if (!DOM.hero || !DOM.heroCalendar || !DOM.cta) {
			return { extraHeight: 0, calendarTop: 0, calendarHeight: 0 };
		}

		const heroDescription = document.querySelector(".hero-description");
		if (!heroDescription) {
			return { extraHeight: 0, calendarTop: 0, calendarHeight: 0 };
		}

		const gap = this.getHeroCalendarGap();
		const preferredCalendarHeight = this.getHeroCalendarPreferredHeight();
		const desiredBottomOffset = cssVar.lengthPx("--hero-cta-gap-to-boundary", 90);
		const ctaHeight = DOM.cta.getBoundingClientRect().height || 64;
		
		DOM.heroContent?.style.setProperty(
			"--cta-height-live",
			`${ctaHeight}px`
		);

		/* gedachte kompakte Navbar-Unterkante */
		const compactNavHeight = cssVar.lengthPx("--nav-height-min", 58);

		/* Ausgangszustand sichern */
		const previousExtra = state.ui.heroCalendarExtraHeight || 0;

		/* Grundmessung */
		let heroRect = DOM.hero.getBoundingClientRect();
		let descRect = heroDescription.getBoundingClientRect();

		/* Description-basierte Position */
		const descriptionBasedTop =
			Math.round((descRect.bottom - heroRect.top) + gap);

		/* kompakte Navbar als zusätzlicher oberer Viewport-Offset */
		const calendarTop =
			Math.round(descriptionBasedTop + compactNavHeight);

		/* benötigter Platz unterhalb der Kalenderoberkante */
		const requiredSpaceBelowCalendarTop =
			preferredCalendarHeight + gap + ctaHeight + desiredBottomOffset;

		/* aktuell vorhandener Platz */
		const availableSpaceBelowCalendarTop =
			heroRect.height - calendarTop;

		let extraHeight = Math.max(
			0,
			Math.ceil(requiredSpaceBelowCalendarTop - availableSpaceBelowCalendarTop)
		);

		/*
		  Zusatzanforderung:
		  Description soll nach dem Öffnen gerade oben aus dem Viewport raus sein,
		  OHNE Navbar-Berücksichtigung.

		  Da beim Öffnen die About-Grenze festgehalten wird, entspricht die nötige
		  Verschiebung nach oben näherungsweise der aufgebauten Zusatzhöhe.
		  Also muss extraHeight mindestens die aktuelle Description-Unterkante abdecken.
		*/
		const requiredExtraForDescriptionToLeaveViewport =
			Math.max(0, Math.ceil(descRect.bottom));

		extraHeight = Math.max(
			extraHeight,
			requiredExtraForDescriptionToLeaveViewport
		);

		/* probeweise anwenden und real nachmessen */
		this.setHeroCalendarExtraHeight(extraHeight);

		heroRect = DOM.hero.getBoundingClientRect();

		const ctaTopWithinHero = this.getElementTopWithinHero(DOM.cta, heroRect);
		const calendarBottomWithinHero = calendarTop + preferredCalendarHeight;
		const ctaBottomWithinHero = ctaTopWithinHero + ctaHeight;

		const actualGapBetweenCalendarAndCta =
			ctaTopWithinHero - calendarBottomWithinHero;

		const actualBottomOffset =
			heroRect.height - ctaBottomWithinHero;

		const missingGap = Math.max(0, gap - actualGapBetweenCalendarAndCta);
		const missingBottomOffset = Math.max(0, desiredBottomOffset - actualBottomOffset);

		extraHeight += Math.ceil(missingGap + missingBottomOffset);

		/* Ursprungszustand wiederherstellen */
		this.setHeroCalendarExtraHeight(previousExtra);

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
		const startCtaViewportTop = DOM.cta ? DOM.cta.getBoundingClientRect().top : 0;

		state.scroll.programmatic = true;
		this.lockHeroCalendarScrollBehavior();

		const finish = () => {
			state.lastScrollY = window.scrollY;
			this.unlockHeroCalendarScrollBehavior();
			navbarModule.handleScroll();
			navbarModule.startAnimation();
			onComplete?.();
		};

		const step = (now) => {
			const t = Math.min(1, (now - start) / duration);
			const eased = this.easeHeroCalendar(t);

			const currentExtra = from + ((to - from) * eased);
			this.setHeroCalendarExtraHeight(currentExtra);

			let nextScrollY = startScrollY;

			if (mode === "open" || mode === "close-keep-about-position") {
				/* About-Grenze exakt an ihrer Startposition halten */
				if (about) {
					const currentAboutTop = about.getBoundingClientRect().top;
					const deltaToTarget = currentAboutTop - startAboutViewportTop;
					nextScrollY = window.scrollY + deltaToTarget;
				}
			} else if (mode === "close") {
				/* normales manuelles Schließen: CTA visuell festhalten */
				if (DOM.cta) {
					const currentCtaTop = DOM.cta.getBoundingClientRect().top;
					const deltaToTarget = currentCtaTop - startCtaViewportTop;
					nextScrollY = window.scrollY + deltaToTarget;
				}
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

			/* Vor dem Unlock exakt ausrichten */
			if ((mode === "open" || mode === "close-keep-about-position") && about) {
				const finalAboutTop = about.getBoundingClientRect().top;
				window.scrollTo(
					0,
					Math.max(0, window.scrollY + (finalAboutTop - startAboutViewportTop))
				);
				finish();
				return;
			}

			if (mode === "close" && DOM.cta) {
				const finalCtaTop = DOM.cta.getBoundingClientRect().top;
				window.scrollTo(
					0,
					Math.max(0, window.scrollY + (finalCtaTop - startCtaViewportTop))
				);

				/* Noch NICHT freigeben – erst nach der visuellen Endkorrektur */
				requestAnimationFrame(() => {
					requestAnimationFrame(() => {
						const correctedCtaTop = DOM.cta.getBoundingClientRect().top;
						const deltaAfterUnlock = correctedCtaTop - startCtaViewportTop;

						if (Math.abs(deltaAfterUnlock) > 0.5) {
							window.scrollTo(
								0,
								Math.max(0, window.scrollY + deltaAfterUnlock)
							);
						}

						/* Erst jetzt CTA wieder freigeben */
						state.ui.heroCalendarKeepCtaFlat = false;

						finish();
					});
				});
				return;
			}

			finish();
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
	
	restoreNavbarAfterHeroCalendar({ preserveState = true } = {}) {
		state.ui.heroCalendarNavbarFreeze = false;

		state.nav.gestureStretch.current = 0;
		state.nav.gestureStretch.target = 0;

		state.lastScrollY = window.scrollY;

		/* Wichtig:
		   Beim Schließen des Kalenders Navbar-Zustand NICHT neu berechnen */
		if (!preserveState) {
			navbarModule.handleScroll();
			navbarModule.startAnimation();
		}
	},
	
	prewarmHeroCalendar() {
		if (
			state.ui.heroCalendarPrewarmed ||
			state.ui.fullCalendarInstance ||
			!DOM.heroCalendarEl
		) {
			return;
		}

		state.ui.heroCalendarPrewarmed = true;

		this.ensureFullCalendar();
		this.positionHeroCalendar();
		this.applyMeasuredHeroCalendarBox();

		if (DOM.heroCalendar) {
			DOM.heroCalendar.classList.remove("is-open");
			DOM.heroCalendar.setAttribute("aria-hidden", "true");
		}
	},

	bindHeroCalendarPrewarm() {
	  prewarmUtils.bind({
		element: DOM.hero,
		stateKeyObserver: "heroCalendarPrewarmObserver",
		stateKeyPrewarmed: "heroCalendarPrewarmed",
		getDistancePx: () => this.getHeroCalendarPrewarmDistancePx(),
		onPrewarm: () => this.prewarmHeroCalendar(),
	  });
	}

  };

// ---------------------------------------------------------------------
// 15) CONTACT MAP (MAPLIBRE 3D)
// ---------------------------------------------------------------------
const contactMapModule = {
  map: null,
  container: null,
  marker: null,
  isInitializing: false,
  entranceObserver: null,
  navIntentHandlersBound: false,
  navAnimationTimer: null,
  
	readyPromise: null,
	readyResolve: null,

  getContainer() {
    return document.getElementById("contact-map");
  },

  getContactSection() {
    return document.getElementById("contact");
  },

  getRootStyle() {
    return getComputedStyle(document.documentElement);
  },

  getCssVarString(name, fallback = "") {
    const value = this.getRootStyle().getPropertyValue(name).trim();
    return value || fallback;
  },

  getSalonCoords() {
    return [9.2045023, 48.7765731];
  },

  getCinematicStartCoords() {
    return [9.1799, 48.7786]; // Schlossplatz Stuttgart
  },

  getMapStyle() {
    return "https://tiles.openfreemap.org/styles/liberty";
  },

  getVectorSourceUrl() {
    return "https://tiles.openfreemap.org/planet";
  },

  // --------------------------------------------------
  // Standard / kleine Animation
  // --------------------------------------------------
  getStartZoom() {
    return cssVar.number("--contact-map-zoom-start", 14);
  },

  getEndZoom() {
    return cssVar.number("--contact-map-zoom-end", 15);
  },

  getStartPitch() {
    return cssVar.number("--contact-map-pitch-start", 52);
  },

  getEndPitch() {
    return cssVar.number("--contact-map-pitch-end", 56);
  },

  getStartBearing() {
    return cssVar.number("--contact-map-bearing-start", -14);
  },

  getEndBearing() {
    return cssVar.number("--contact-map-bearing-end", -18);
  },

  getAnimationDurationMs() {
    return cssVar.timeMs("--contact-map-animation-duration", 2200);
  },

  getAnimationDelayMs() {
    return cssVar.timeMs("--contact-map-animation-delay", 1000);
  },

  // --------------------------------------------------
  // Große Navbar-Cinematic
  // --------------------------------------------------
  getCinematicStartZoom() {
    return cssVar.number("--contact-map-cinematic-start-zoom", 17.4);
  },

  getCinematicStartPitch() {
    return cssVar.number("--contact-map-cinematic-start-pitch", 60);
  },

  getCinematicStartBearing() {
    return cssVar.number("--contact-map-cinematic-start-bearing", -32);
  },

  getCinematicDelayMs() {
    return cssVar.timeMs("--contact-map-cinematic-delay", 120);
  },

  getFlySpeed() {
    return cssVar.number("--contact-map-fly-speed", 0.18);
  },

  getFlyCurve() {
    return cssVar.number("--contact-map-fly-curve", 1);
  },

  getFlyMinZoom() {
    return cssVar.number("--contact-map-fly-min-zoom", 11.8);
  },

  getFlyScreenSpeed() {
    return cssVar.number("--contact-map-fly-screen-speed", 0.16);
  },

  getUseMinZoom() {
    return this.getCssVarString("--contact-map-fly-use-min-zoom", "true") !== "false";
  },

  getReducedMotionEnabled() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  },
  
  getNavbarIntentSelector() {
	  return '[data-contact-nav-flyto]';
	},

  findFirstLabelLayerId() {
    if (!this.map) return undefined;

    const layers = this.map.getStyle()?.layers || [];

    for (let i = 0; i < layers.length; i += 1) {
      const layer = layers[i];

      if (
        layer.type === "symbol" &&
        layer.layout &&
        layer.layout["text-field"]
      ) {
        return layer.id;
      }
    }

    return undefined;
  },

  add3DBuildings() {
    if (!this.map) return;

    const map = this.map;
    const sourceId = "openfreemap";
    const layerId = "3d-buildings";

    if (!map.getSource(sourceId)) {
      map.addSource(sourceId, {
        type: "vector",
        url: this.getVectorSourceUrl(),
      });
    }

    if (map.getLayer(layerId)) return;

    const labelLayerId = this.findFirstLabelLayerId();

    map.addLayer(
      {
        id: layerId,
        type: "fill-extrusion",
        source: sourceId,
        "source-layer": "building",
        minzoom: 15,
        filter: ["!=", ["get", "hide_3d"], true],
        paint: {
          "fill-extrusion-color": [
            "interpolate",
            ["linear"],
            ["coalesce", ["get", "render_height"], 0],
            0, "#d9d3c7",
            60, "#d6c7aa",
            120, "#cfb98b",
            220, "#c4a96d"
          ],
          "fill-extrusion-height": [
            "interpolate",
            ["linear"],
            ["zoom"],
            15, 0,
            16, ["coalesce", ["get", "render_height"], 0]
          ],    
          "fill-extrusion-base": [
			  "interpolate",
			  ["linear"],
			  ["zoom"],
			  15, 0,
			  16, ["coalesce", ["get", "render_min_height"], 0]
			],
          "fill-extrusion-opacity": 0.92
        }
      },
      labelLayerId
    );
  },
  
  init() {
	  this.container = this.getContainer();

	  if (!this.container || typeof maplibregl === "undefined") return;
	  if (this.map || this.isInitializing) return;

	  this.isInitializing = true;
	  this.createReadyPromise();

	  const salonCoords = this.getSalonCoords();

	  this.map = new maplibregl.Map({
		container: this.container,
		style: this.getMapStyle(),
		center: salonCoords,
		zoom: this.getStartZoom(),
		pitch: this.getStartPitch(),
		bearing: this.getStartBearing(),
		attributionControl: false,
		canvasContextAttributes: { antialias: true }
	  });

	  this.marker = new maplibregl.Marker({ color: "#d4af37" })
		.setLngLat(salonCoords)
		.addTo(this.map);

	  this.map.once("load", () => {
		if (!this.map) {
		  this.isInitializing = false;
		  return;
		}

		this.isInitializing = false;
		this.resize();
		this.add3DBuildings();
		this.runEntranceAnimationWhenVisible();

		this.map.once("idle", () => {
		  this.resolveReady();
		});
	  });

	  this.map.on("error", (error) => {
		console.error("MapLibre Fehler:", error);
		this.isInitializing = false;
		this.resolveReady();
	  });

	  this.map.on("remove", () => {
		this.disconnectEntranceObserver();
		this.clearNavAnimationTimer();
		this.map = null;
		this.marker = null;
		this.isInitializing = false;
		state.ui.contactMapAnimated = false;

		this.readyPromise = null;
		this.readyResolve = null;
	  });
	},

  destroy() {
    if (!this.map) return;

    this.disconnectEntranceObserver();
    this.clearNavAnimationTimer();

    this.map.remove();
    this.map = null;
    this.marker = null;
    this.isInitializing = false;
    state.ui.contactMapAnimated = false;
  },

  resize() {
    if (!this.map) return;
    this.map.resize();
  },

  prewarm() {
    if (state.ui.contactMapPrewarmed || this.map) return;

    state.ui.contactMapPrewarmed = true;
    this.init();
  },

  clearReinitTimer() {
    clearTimeout(state.ui.contactMapReinitTimer);
    state.ui.contactMapReinitTimer = null;
  },

  clearNavAnimationTimer() {
    clearTimeout(this.navAnimationTimer);
    this.navAnimationTimer = null;
  },

  disconnectEntranceObserver() {
    if (!this.entranceObserver) return;
    this.entranceObserver.disconnect();
    this.entranceObserver = null;
  },

  markNavbarContactIntent() {
    state.ui.contactMapNavCinematicRequested = true;
  },

  consumeNavbarContactIntent() {
    const requested = Boolean(state.ui.contactMapNavCinematicRequested);
    state.ui.contactMapNavCinematicRequested = false;
    return requested;
  },

  bindNavbarIntent() {
	  if (this.navIntentHandlersBound) return;

	  const selector = this.getNavbarIntentSelector();
	  if (!selector) return;

	  const handler = (event) => {
		const trigger = event.target?.closest?.(selector);
		if (!trigger) return;

		// Zusätzliche Absicherung:
		// Nur Links/Buttons akzeptieren, die wirklich auf #contact zeigen
		const href = trigger.getAttribute("href");
		const target = trigger.getAttribute("data-target");
		const controls = trigger.getAttribute("aria-controls");

		const pointsToContact =
		  href === "#contact" ||
		  target === "#contact" ||
		  controls === "contact";

		if (!pointsToContact) return;

		state.ui.contactMapNavCinematicRequested = true;
		this.prewarm();
	  };

	  document.addEventListener("click", handler, true);

	  document.addEventListener(
		"keydown",
		(event) => {
		  if (event.key !== "Enter" && event.key !== " ") return;
		  handler(event);
		},
		true
	  );

	  this.navIntentHandlersBound = true;
	},

  resetView() {
    if (!this.map) return;

    this.map.stop();
    this.clearNavAnimationTimer();

    this.map.jumpTo({
      center: this.getSalonCoords(),
      zoom: this.getStartZoom(),
      pitch: this.getStartPitch(),
      bearing: this.getStartBearing()
    });

    state.ui.contactMapAnimated = false;
    this.disconnectEntranceObserver();
  },
  
  async playAnimationFlow({ cinematic = false } = {}) {
	  this.prewarm();

	  await this.waitForMapReady();
	  await this.waitUntilVisible();
	  await this.waitForStableRender();

	  if (!this.map || state.ui.contactMapAnimated) return;
		
		if (cinematic) {
		  this.map.once("render", () => {
			this.map.once("idle", () => {
			  if (!this.map || state.ui.contactMapAnimated) return;
			  this.playNavbarCinematic();
			});
		  });
		} else {
		  this.playEntranceAnimation();
		}
	},

  playEntranceAnimation() {
    if (!this.map || state.ui.contactMapAnimated) return;

    this.map.stop();

    this.map.easeTo({
      center: this.getSalonCoords(),
      zoom: this.getEndZoom(),
      pitch: this.getEndPitch(),
      bearing: this.getEndBearing(),
      duration: this.getAnimationDurationMs(),
      essential: true
    });

    state.ui.contactMapAnimated = true;
  },

  prepareCinematicStartView() {
    if (!this.map) return;

    this.map.stop();

    this.map.jumpTo({
      center: this.getCinematicStartCoords(),
      zoom: this.getCinematicStartZoom(),
      pitch: this.getCinematicStartPitch(),
      bearing: this.getCinematicStartBearing()
    });
  },

  playNavbarCinematic() {
    if (!this.map || state.ui.contactMapAnimated) return;

    if (this.getReducedMotionEnabled()) {
      this.map.jumpTo({
        center: this.getSalonCoords(),
        zoom: this.getEndZoom(),
        pitch: this.getEndPitch(),
        bearing: this.getEndBearing()
      });

      state.ui.contactMapAnimated = true;
      return;
    }

    this.prepareCinematicStartView();
    this.clearNavAnimationTimer();

    this.navAnimationTimer = setTimeout(() => {
      if (!this.map || state.ui.contactMapAnimated) return;

      const flyOptions = {
        center: this.getSalonCoords(),
        zoom: this.getEndZoom(),
        pitch: this.getEndPitch(),
        bearing: this.getEndBearing(),
        essential: true,
        speed: this.getFlySpeed(),
        curve: this.getFlyCurve(),
        screenSpeed: this.getFlyScreenSpeed()
      };

      if (this.getUseMinZoom()) {
        flyOptions.minZoom = this.getFlyMinZoom();
      }

      this.map.flyTo(flyOptions);
      state.ui.contactMapAnimated = true;
      this.navAnimationTimer = null;
    }, this.getCinematicDelayMs());
  },

  getReinitOffsetPx() {
    return cssVar.lengthPx("--contact-map-reinit-offset", 120);
  },

  getPrewarmDistancePx() {
    const about = document.getElementById("about");
    if (!about) return window.innerHeight * 0.2;

    const ratio = cssVar.number("--contact-map-prewarm-about-ratio", 0.2);
    return Math.max(0, about.offsetHeight * ratio);
  },

  getContactViewportZone() {
    const contact = this.getContactSection();
    if (!contact) return "inside";

    const rect = contact.getBoundingClientRect();
    const offset = this.getReinitOffsetPx();
    const viewportHeight = window.innerHeight;

    if (rect.bottom <= -offset) return "outsideTop";
    if (rect.top >= viewportHeight + offset) return "outsideBottom";

    return "inside";
  },

  maybeResetOnSectionExit() {
    const contact = this.getContactSection();
    if (!contact) return;

    const zone = this.getContactViewportZone();
    const previousZone = state.ui.contactMapLastOutsideZone;

    if (previousZone === null) {
      state.ui.contactMapLastOutsideZone = zone;
      return;
    }

    if (zone === "inside") {
      state.ui.contactMapReinitArmed = false;
      this.clearReinitTimer();

      if (previousZone !== "inside") {
        this.runEntranceAnimationWhenVisible();
      }

      state.ui.contactMapLastOutsideZone = zone;
      return;
    }

    if (zone !== previousZone) {
      state.ui.contactMapReinitArmed = true;
      this.clearReinitTimer();

      state.ui.contactMapReinitTimer = setTimeout(() => {
        state.ui.contactMapReinitTimer = null;

        if (this.getContactViewportZone() === zone) {
          this.resetView();
        }

        state.ui.contactMapReinitArmed = false;
      }, 120);
    }

    state.ui.contactMapLastOutsideZone = zone;
  },

  bindPrewarm() {
    const contact = this.getContactSection();

    prewarmUtils.bind({
      element: contact,
      stateKeyObserver: "contactMapPrewarmObserver",
      stateKeyPrewarmed: "contactMapPrewarmed",
      getDistancePx: () => this.getPrewarmDistancePx(),
      onPrewarm: () => this.prewarm(),
    });
  },

  bindLifecycle() {
    window.addEventListener(
      "scroll",
      () => {
        this.maybeResetOnSectionExit();
      },
      { passive: true }
    );

    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) {
        this.resize();
      }
    });
  },

  initModule() {
    state.ui.contactMapNavCinematicRequested ??= false;

    this.init();
    this.bindPrewarm();
    this.bindLifecycle();
    this.bindNavbarIntent();
    this.maybeResetOnSectionExit();
  },
  
  runEntranceAnimationWhenVisible() {
	  if (state.ui.contactMapAnimated) return;

	  const target = this.getContainer();
	  if (!target) return;

	  this.disconnectEntranceObserver();

	  this.entranceObserver = new IntersectionObserver(
		(entries) => {
		  const entry = entries[0];
		  if (!entry || entry.intersectionRatio < 0.6) return;

		  this.disconnectEntranceObserver();

		  const cinematic = this.consumeNavbarContactIntent();

		  this.playAnimationFlow({ cinematic });
		},
		{ threshold: 0.6 }
	  );

	  this.entranceObserver.observe(target);
	},
  
  createReadyPromise() {
	  if (this.readyPromise) return this.readyPromise;

	  this.readyPromise = new Promise((resolve) => {
		this.readyResolve = resolve;
	  });

	  return this.readyPromise;
	},

	resolveReady() {
	  if (this.readyResolve) {
		this.readyResolve();
		this.readyResolve = null;
	  }
	},
	
	waitForMapReady() {
	  if (!this.map) return Promise.resolve();

	  return new Promise((resolve) => {
		if (this.map.loaded()) {
		  this.map.once("idle", resolve);
		  setTimeout(resolve, 1000);
		  return;
		}

		this.map.once("load", () => {
		  this.map.once("idle", resolve);
		  setTimeout(resolve, 1000);
		});
	  });
	},
	
	waitUntilVisible() {
	  const el = this.getContainer();
	  if (!el) return Promise.resolve();

	  return new Promise((resolve) => {
		const check = () => {
		  const rect = el.getBoundingClientRect();
		  const visible =
			rect.top < window.innerHeight &&
			rect.bottom > 0;

		  if (visible) {
			resolve();
		  } else {
			requestAnimationFrame(check);
		  }
		};

		check();
	  });
	},
	
	waitForStableRender() {
	  if (!this.map) return Promise.resolve();

	  return new Promise((resolve) => {
		requestAnimationFrame(() => {
		  this.resize();

		  let done = false;

		  const finish = () => {
			if (done) return;
			done = true;
			resolve();
		  };

		  this.map.once("render", () => {
			this.map.once("idle", finish);
		  });

		  setTimeout(finish, 800);
		});
	  });
	},
	
};

  // ---------------------------------------------------------------------
  // 16) USER-SCROLL-INTERRUPTS
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
  // 17) POSITIONIERUNG DER SCROLL-HINT-SPALTE
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
  // 18) PERFORMANCE-MODUL
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
  // 19) INITIALISIERUNG
  // ---------------------------------------------------------------------
  function init() { 
    // performanceModule.init(); // optional wieder aktivieren
    physics.update();
    sectionNavigationModule.buildOrderedSections();

    //~ navbarModule.bindEvents();
    navbarModule.init();
    sectionNavigationModule.bindEvents();
    scrollEngine.init();
    scrollSectionHintModule.init();
    scrollSectionHintPositionModule.init();
    
    galleryModule.init();
    
    uiModule.bindCTA();
	uiModule.bindHeroClickBehavior();
	uiModule.bindHeroCalendarPrewarm();
	uiModule.bindPricingTabs();
	uiModule.setInitialVisualState();

	contactMapModule.initModule();

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
	  contactMapModule.resize();

	  if (!state.ui.heroCalendarPrewarmObserver && !state.ui.heroCalendarPrewarmed) {
		  uiModule.bindHeroCalendarPrewarm();
		}

		if (!state.ui.contactMapPrewarmed && !state.ui.contactMapPrewarmObserver) {
		  contactMapModule.bindPrewarm();
		}

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
