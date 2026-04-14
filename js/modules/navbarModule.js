// ---------------------------------------------------------------------
// javascript Verzeichnisstruktur
// ---------------------------------------------------------------------
//	/js
//		/core
//			/physics.js
//			/scrollEngine.js
//			/settings.js
//			/springs.js
//			/state.js
//		/modules
//			/navbarModule.js
//			/scrollSectionHintModule.js
//		/utils
//			/cssVar.js
//			/helper.js
//			/utils.js
//		/main.js
// ---------------------------------------------------------------------

import { physics }														from	"../core/physics.js";
import { scrollEngine }													from	"../core/scrollEngine.js";
import { SETTINGS }														from	"../core/settings.js";
import { springs }														from	"../core/springs.js";
import { state }														from	"../core/state.js";

import { contactMapModule }												from	'./contactMapModule.js';
import { uiModule }														from	'./uiModule.js';

import { clamp,easeOutCubic,resetAnimatedValue,stepAnimatedValue,isAnimatedValueMoving }	from	"../utils/helper.js";
import { utils }														from	"../utils/utils.js";


// ---------------------------------------------------------------------
// NAVBAR-MODUL
// ---------------------------------------------------------------------

export const navbarModule = {
	navToggle: null,
	navMenu: null,
	cta: null,
	navbar: null,
	hero: null,
	navLinks: null,
	navLogo: null,
	
	cacheDOM() {
		this.navToggle = document.querySelector(".nav-toggle");
		this.navMenu = document.querySelector(".nav-menu");
		this.cta = document.querySelector(".cta-button");
		this.navbar = document.querySelector(".navbar");
		this.hero = document.querySelector(".hero");
		this.navLinks = [...document.querySelectorAll(".nav-menu a")];
		this.navLogo = document.querySelector(".nav-logo");
	},
	
    isOpen() {
      return !!(
        this.navMenu &&
        this.navToggle &&
        this.navMenu.classList.contains("active")
      );
    },

    applyCtaNeutralState() {
      if (!this.cta) return;

      this.cta.classList.remove("is-magnetic-near", "is-hovered");
      this.cta.blur();

      utils.setVars(this.cta, {
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
      if (!this.navMenu || !this.navToggle) return;

      this.navMenu.classList.add("active");
      this.navToggle.classList.add("active");
      document.body.classList.add("nav-menu-open");

      state.nav.gestureStretch.target = 0;
      this.startAnimation();
    },

    closeMenu({ keepNavbarVisible = false } = {}) {
      if (!this.navMenu || !this.navToggle) return;

      this.navMenu.classList.remove("active");
      this.navToggle.classList.remove("active");
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
      if (!this.navbar) return;

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
		if (!this.navbar) return;

		const currentY = window.scrollY;
		const deltaY = currentY - state.lastScrollY;

		state.scrollVelocity = deltaY * 0.8;

		if (
			!state.scroll.programmatic &&
			Math.abs(deltaY) > SETTINGS.thresholds.directionLock
		) {
			state.scrollDirection = deltaY > 0 ? "down" : "up";
		}

		/* Auch während Navbar-Freeze den Scroll-State aktuell halten */
		if (state.ui.heroCalendarNavbarFreeze && state.ui.heroCalendarAnimating) {
		  state.lastScrollY = currentY;
		  return;
		}

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

			state.cta.elasticY.velocity += impulse;
		}

		this.updateGestureStretch(deltaY, currentY);

		if (state.nav.manualOpen && currentY > 5) {
			state.nav.manualOpen = false;
		}

		state.lastScrollY = currentY;
		this.hero?.classList.toggle("scrolled", currentY > 10);

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

      utils.setVars(this.navbar, {
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

      this.navbar.style.boxShadow = `0 ${10 * easedSurface}px ${
        40 * easedSurface
      }px rgba(0,0,0, ${0.45 * easedSurface + velocityShadow})`;
    },

    renderHero() {
      if (!this.hero) return;

      const scrollY = window.scrollY;
      const progress = Math.min(scrollY / SETTINGS.thresholds.inertia, 1);

      utils.setVars(this.hero, {
        "--hero-scale": 1 - progress * physics.values.heroScaleScrollFactor,
        "--hero-brightness":
          1 - progress * physics.values.heroBrightnessScrollFactor,
        "--hero-parallax": `${state.hero.parallax.current}px`,
      });
    },
    
	renderCTA() {
	  if (!this.cta) return;

	  utils.setVars(this.cta, {
		"--cta-elastic-y": `${state.cta.elasticY.current}px`,
	  });
	},

    animate(now) {
      if (!this.navbar || document.hidden) {
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
      if (this.navToggle && this.navMenu) {
        this.navToggle.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.isOpen() ? this.closeMenu() : this.openMenu();
        });
      }

      this.navLinks.forEach((link) => {
		  link.addEventListener("click", async (e) => {
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

			const doScroll = async () => {
			  const isContactTarget = hash === "#contact" || target.id === "contact";

				if (isContactTarget) {
				  contactMapModule.markNavbarContactIntent();
				  contactMapModule.prewarm(); // nur prewarm, kein warten!
				}

				scrollEngine.goTo(target, scrollEngine.getModeForTarget(target));
			  
			};

			if (utils.isMobileViewport() && this.isOpen()) {
			  const menu = this.navMenu;
			  const isHeroTarget = target.classList?.contains("hero");

			  this.closeMenu({ keepNavbarVisible: !isHeroTarget });

			  let done = false;

			  const finish = async () => {
				if (done) return;
				done = true;
				menu?.removeEventListener("transitionend", onEnd);
				await doScroll();
			  };

			  const onEnd = (evt) => {
				if (evt.target === menu) finish();
			  };

			  menu?.addEventListener("transitionend", onEnd, { once: true });
			  setTimeout(finish, 450);
			  return;
			}

			await doScroll();
		  });
		});

      this.navLogo?.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();

        const goHome = () => scrollEngine.goTo(this.hero, "hero-top");

        if (utils.isMobileViewport() && this.isOpen()) {
          const menu = this.navMenu;

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
    
    init() {
		this.cacheDOM();
		this.bindEvents();
	  }
  };
