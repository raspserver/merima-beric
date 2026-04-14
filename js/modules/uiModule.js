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

import { physics }						from	"../core/physics.js";
import { state }						from	"../core/state.js";

import { navbarModule }					from	'./navbarModule.js';

import { cssVar }						from	"../utils/cssVar.js";
import { clamp,resetAnimatedValue }		from	'../utils/helper.js';

import { prewarmUtils }					from	"../utils/prewarmUtils.js";
import { utils }						from	"../utils/utils.js";

// ---------------------------------------------------------------------
// UI-MODUL (CTA, HERO-KLICK, PRICING TABS)
// ---------------------------------------------------------------------

export const uiModule = {
	  navbar: null,
	  hero: null,
	  heroContent: null,
	  cta: null,
	  ctaLabel: null,
	  heroCalendar: null,
	  heroCalendarEl: null,
	  pricingTabs: null,
	  pricingContents: null,
	  year: null,
	  
    ctaMagneticButtons: [],
    ctaMagneticRunning: false,
    ctaMagneticLastFrame: 0,

	cacheDOM() {
		this.navbar = document.querySelector(".navbar");
		this.hero = document.querySelector(".hero");
		this.heroContent = document.querySelector(".hero-content");
		this.cta = document.querySelector(".cta-button");
		this.ctaLabel = document.querySelector(".cta-button .cta-label");
		this.heroCalendar = document.getElementById("hero-calendar");
		this.heroCalendarEl = document.getElementById("hero-fullcalendar");
		this.pricingTabs = [...document.querySelectorAll(".pricing-tab")];
		this.pricingContents = [...document.querySelectorAll(".pricing-content")];
		this.year = document.getElementById("year");
	},

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
	state.ui.ctaDefaultLabel = this.ctaLabel?.textContent?.trim() || "Termin vereinbaren";

	this.cta?.addEventListener("click", (e) => {
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
		this.hero?.addEventListener("click", (e) => {
			if (!this.navbar || (utils.isMobileViewport() && navbarModule.isOpen())) {
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
    },

	getCalendarConfig() {
		return {
			googleCalendarApiKey: "AIzaSyDqAZYI2AbNdax1SmFtBZte87Gix3NOh30",
			calendarId: "1f06dd46653f2c54d7dfde59ea175a8c346e7fcb2835f433d2238a2f3ae8c5a2@group.calendar.google.com",
		};
	},

	ensureFullCalendar() {
		if (state.ui.fullCalendarInstance || !this.heroCalendarEl) return;

		const { googleCalendarApiKey, calendarId } = this.getCalendarConfig();

		const el = this.heroCalendarEl;

		state.ui.fullCalendarInstance = new FullCalendar.Calendar(el, {
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
				el.classList.toggle("is-loading", isLoading);
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
		if (!this.heroCalendar) return;

		const layout = this.measureHeroCalendarLayout();

		state.ui.heroCalendarMeasuredTop = layout.calendarTop;
		state.ui.heroCalendarMeasuredHeight = layout.calendarHeight;
		state.ui.heroCalendarMeasuredExtra = layout.extraHeight;

		this.applyMeasuredHeroCalendarBox();
	},

	openHeroCalendar() {
		if (!this.cta || !this.heroCalendar || !this.hero) return;
		if (state.ui.heroCalendarAnimating || state.ui.heroCalendarOpen) return;

		this.clearHeroCalendarTimers();
		this.resetCtaMagnetic();
		navbarModule.applyCtaNeutralState();

		this.hero.classList.add("hero-calendar-active");
		this.hero.classList.add("hero-calendar-lock-motion");

		state.ui.heroCalendarKeepCtaFlat = true;
		state.ui.heroCalendarAnimating = true;
		state.ui.heroCalendarLastScrollY = window.scrollY;
		resetAnimatedValue(state.cta.elasticY, 0);
		navbarModule.renderCTA();

		this.ensureFullCalendar();
		this.positionHeroCalendar();

		this.cta.classList.add("calendar-open");
		this.cta.classList.remove("is-hovered", "is-magnetic-near");
		this.cta.setAttribute("aria-expanded", "true");

		if (this.ctaLabel) {
			this.ctaLabel.textContent = "Kalender schließen";
		}

		this.hero.classList.add("hero-calendar-open");
		this.heroCalendar.setAttribute("aria-hidden", "true");
		this.heroCalendar.classList.remove("is-open");

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
			this.heroCalendar.classList.add("is-open");
			this.heroCalendar.setAttribute("aria-hidden", "false");

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
	  if (!this.cta || !this.heroCalendar || !this.hero) return;

	  if (!state.ui.heroCalendarOpen && !state.ui.heroCalendarAnimating) {
		onComplete?.();
		return;
	  }

	  if (state.ui.heroCalendarAnimating || !state.ui.heroCalendarOpen) return;

	  state.ui.heroCalendarAnimating = true;
	  this.clearHeroCalendarTimers();

	  this.heroCalendar.classList.remove("is-open");
	  this.heroCalendar.setAttribute("aria-hidden", "true");

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

			  this.cta.classList.remove("calendar-open");
			  this.cta.setAttribute("aria-expanded", "false");

			  if (this.ctaLabel) {
				this.ctaLabel.textContent =
				  state.ui.ctaDefaultLabel || "Termin vereinbaren";
			  }

			  this.hero.classList.remove("hero-calendar-open");
			  this.hero.classList.remove("hero-calendar-active");
			  this.hero.classList.remove("hero-calendar-lock-motion");
			  this.heroCalendar.style.top = "";
			  this.heroCalendar.style.height = "";

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
		if (!this.cta || !this.heroCalendar || !this.hero) return;
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

		this.heroCalendar.classList.remove("is-open");
		this.heroCalendar.setAttribute("aria-hidden", "true");

		this.cta.classList.remove("calendar-open");
		this.cta.setAttribute("aria-expanded", "false");

		if (this.ctaLabel) {
			this.ctaLabel.textContent =
				state.ui.ctaDefaultLabel || "Termin vereinbaren";
		}

		this.hero.classList.add("hero-calendar-close-instant");

		this.setHeroCalendarExtraHeight(0);

		this.hero.classList.remove("hero-calendar-open");
		this.hero.classList.remove("hero-calendar-active");
		this.hero.classList.remove("hero-calendar-lock-motion");

		this.heroCalendar.style.top = "";
		this.heroCalendar.style.height = "";

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
			this.hero.classList.remove("hero-calendar-close-instant");
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

		const navbarBottom = this.navbar
			? this.navbar.getBoundingClientRect().bottom
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
				const currentNavbarBottom = this.navbar
					? this.navbar.getBoundingClientRect().bottom
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

		this.hero?.style.setProperty("--hero-calendar-extra-height", `${value}px`);
		this.heroContent?.style.setProperty("--hero-calendar-extra-height", `${value}px`);
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
		if (!this.hero || !this.heroCalendar || !this.cta) {
			return { extraHeight: 0, calendarTop: 0, calendarHeight: 0 };
		}

		const heroDescription = document.querySelector(".hero-description");
		if (!heroDescription) {
			return { extraHeight: 0, calendarTop: 0, calendarHeight: 0 };
		}

		const gap = this.getHeroCalendarGap();
		const preferredCalendarHeight = this.getHeroCalendarPreferredHeight();
		const desiredBottomOffset = cssVar.lengthPx("--hero-cta-gap-to-boundary", 90);
		const ctaHeight = this.cta.getBoundingClientRect().height || 64;
		
		this.heroContent?.style.setProperty(
			"--cta-height-live",
			`${ctaHeight}px`
		);

		/* gedachte kompakte Navbar-Unterkante */
		const compactNavHeight = cssVar.lengthPx("--nav-height-min", 58);

		/* Ausgangszustand sichern */
		const previousExtra = state.ui.heroCalendarExtraHeight || 0;

		/* Grundmessung */
		let heroRect = this.hero.getBoundingClientRect();
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

		heroRect = this.hero.getBoundingClientRect();

		const ctaTopWithinHero = this.getElementTopWithinHero(this.cta, heroRect);
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
		if (!this.heroCalendar) return;

		this.heroCalendar.style.top = `${state.ui.heroCalendarMeasuredTop}px`;
		this.heroCalendar.style.height = `${state.ui.heroCalendarMeasuredHeight}px`;
	},
	
	animateHeroCalendarLayout(from, to, { mode = "open", onComplete } = {}) {
		this.hero?.classList.add("hero-calendar-active");

		const duration = this.getHeroCalendarLayoutDuration();
		const start = performance.now();

		const about = this.getHomeAboutBoundaryEl();
		const startScrollY = window.scrollY;
		const startAboutViewportTop = about ? about.getBoundingClientRect().top : 0;
		const startCtaViewportTop = this.cta ? this.cta.getBoundingClientRect().top : 0;

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
				if (this.cta) {
					const currentCtaTop = this.cta.getBoundingClientRect().top;
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

			if (mode === "close" && this.cta) {
				const finalCtaTop = this.cta.getBoundingClientRect().top;
				window.scrollTo(
					0,
					Math.max(0, window.scrollY + (finalCtaTop - startCtaViewportTop))
				);

				/* Noch NICHT freigeben – erst nach der visuellen Endkorrektur */
				requestAnimationFrame(() => {
					requestAnimationFrame(() => {
						const correctedCtaTop = this.cta.getBoundingClientRect().top;
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
			!this.heroCalendarEl
		) {
			return;
		}

		state.ui.heroCalendarPrewarmed = true;

		this.ensureFullCalendar();
		this.positionHeroCalendar();
		this.applyMeasuredHeroCalendarBox();

		if (this.heroCalendar) {
			this.heroCalendar.classList.remove("is-open");
			this.heroCalendar.setAttribute("aria-hidden", "true");
		}
	},

	bindHeroCalendarPrewarm() {
	  prewarmUtils.bind({
		element: this.hero,
		stateKeyObserver: "heroCalendarPrewarmObserver",
		stateKeyPrewarmed: "heroCalendarPrewarmed",
		getDistancePx: () => this.getHeroCalendarPrewarmDistancePx(),
		onPrewarm: () => this.prewarmHeroCalendar(),
	  });
	},
	
	init() {
		this.cacheDOM();
		this.bindCTA();
		this.bindHeroClickBehavior();
		this.bindHeroCalendarPrewarm();
		this.bindPricingTabs();
		this.setInitialVisualState();
	  }

  };
