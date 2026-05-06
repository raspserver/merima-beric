// heroCalendarModule.js

import { state } from "../core/state.js";
import { ctaMagneticModule } from "./ctaMagneticModule.js";
import { navbarModule } from "./navbarModule.js";
import { prewarmUtils } from "../utils/prewarmUtils.js";
import { utils } from "../utils/utils.js";

// ---------------------------------------------------------------------
// HERO KALENDER MODUL
// ---------------------------------------------------------------------

export const heroCalendarModule = {
  hero: null,
  heroCalendar: null,
  heroCalendarEl: null,
  cta: null,
  ctaLabel: null,

  init() {
    this.cacheDOM();
    this.bindEvents();
    this.prewarmHeroCalendar();
    this.cancelBtn?.addEventListener("click", () => {
	  this.hideCalendarActionBar();
	});
	this.whatsappBtn?.addEventListener("click", () => {
	  this.openWhatsAppForEvent();
	});
  },

  cacheDOM() {
    this.hero = document.querySelector(".hero");
    this.heroCalendar = document.getElementById("hero-calendar");
    this.heroCalendarEl = document.getElementById("hero-fullcalendar");
    this.cta = document.querySelector(".cta-button");
    this.ctaLabel = document.querySelector(".cta-button .cta-label");
    this.actionBar = document.getElementById("fc-action-toolbar");
	this.cancelBtn = this.actionBar?.querySelector(".fc-action-cancel");
	this.whatsappBtn = this.actionBar?.querySelector(".fc-action-whatsapp");
  },
  
  async showCalendarActionBar(event) {
	  state.ui.selectedCalendarEvent = event;

	  const toolbar = this.heroCalendar.querySelector(".fc-header-toolbar");

	  const start = event.start;
	  const end = event.end;

	  // Datum (kurz)
	  const formattedShortDate = start?.toLocaleDateString("de-DE", {
		weekday: "short",
		day: "2-digit",
		month: "2-digit"
	  });

	  // 🔥 Zeit von / bis
	  const formattedStartTime = start?.toLocaleTimeString("de-DE", {
		hour: "2-digit",
		minute: "2-digit",
	  });

	  const formattedEndTime = end?.toLocaleTimeString("de-DE", {
		hour: "2-digit",
		minute: "2-digit",
	  });

	  // 🔥 Label setzen (Datum + Zeitspanne)
	  const subLabel = this.whatsappBtn?.querySelector(".fc-btn-sub");
	  if (subLabel) {
		if (formattedEndTime) {
		  subLabel.textContent = `(${formattedShortDate}, ${formattedStartTime} - ${formattedEndTime})`;
		} else {
		  // Fallback falls kein Enddatum vorhanden
		  subLabel.textContent = `(${formattedShortDate}, ${formattedStartTime})`;
		}
	  }

	  this.heroCalendar.classList.add("is-event-selected");

	  if (toolbar) {
		await this.waitForTransitionEnd(toolbar);
	  }
	},

	async hideCalendarActionBar() {
	  state.ui.selectedCalendarEvent = null;

	  // 🔥 Label zurücksetzen
	  const subLabel = this.whatsappBtn?.querySelector(".fc-btn-sub");
	  if (subLabel) {
		subLabel.textContent = "";
	  }

	  const actionBar = this.actionBar;

	  this.heroCalendar.classList.remove("is-event-selected");

	  if (actionBar) {
		await this.waitForTransitionEnd(actionBar);
	  }
	},

	openWhatsAppForEvent() {
	  const event = state.ui.selectedCalendarEvent;

	  if (!event) return;

	  const start = event.start;

	  const formattedDate = start?.toLocaleDateString("de-DE", {
		weekday: "long",
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
	  });

	  const formattedTime = start?.toLocaleTimeString("de-DE", {
		hour: "2-digit",
		minute: "2-digit",
	  });

	  const text =
		`Liebe Merima, ich hätte gerne einen Termin am ${formattedDate} um ${formattedTime} für `;

	  const url =
		`https://wa.me/?text=${encodeURIComponent(text)}`;

	  window.open(url, "_blank", "noopener");
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

	  // 🔥 Standardansicht immer Monat
	  initialView: "dayGridMonth",

	  height: "100%",
	  firstDay: 1,
	  weekends: true,
	  navLinks: false,
	  nowIndicator: true,
	  expandRows: true,
	  
	headerToolbar: {
	  left: "prev",
	  center: "title",
	  right: "next"
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
	  
	  eventClick: (info) => {
		  info.jsEvent.preventDefault();

		  this.showCalendarActionBar(info.event);
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

	  // 🔥 immer Monat als responsive default
	  const nextView = "dayGridMonth";

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
    return utils.cssVar.lengthPx("--hero-calendar-gap", 20);
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
	  // 🔥 sicherstellen dass kein alter State existiert
	  this.heroCalendar.classList.remove("is-event-selected");
	  state.ui.selectedCalendarEvent = null;
		
	  if (!this.cta || !this.heroCalendar || !this.hero) return;
	  if (state.ui.heroCalendarAnimating || state.ui.heroCalendarOpen) return;

	  this.clearHeroCalendarTimers();
	  ctaMagneticModule.resetCtaMagnetic();
	  navbarModule.applyCtaNeutralState();

	  this.hero.classList.add("hero-calendar-active");
	  this.hero.classList.add("hero-calendar-lock-motion");

	  state.ui.heroCalendarKeepCtaFlat = true;
	  state.ui.heroCalendarAnimating = true;
	  state.ui.heroCalendarLastScrollY = window.scrollY;

	  utils.resetAnimatedValue(state.cta.elasticY, 0);
	  navbarModule.renderCTA();

	  this.ensureFullCalendar();
	  this.positionHeroCalendar();
	  
		state.ui.frozenHeroCalendarExtraHeight = state.ui.heroCalendarMeasuredExtra;

	  /* CTA State */
	  this.cta.classList.remove("is-closed");
	  this.cta.classList.add("is-transitioning-open");
	  this.cta.classList.remove("is-open", "is-transitioning-close");

	  this.cta.classList.remove("is-hovered", "is-magnetic-near");
	  this.cta.setAttribute("aria-expanded", "true");

	  this.hero.classList.add("hero-calendar-open");

	  /* 🔥 Kalender initial in "Tiefe" halten */
	  this.heroCalendar.setAttribute("aria-hidden", "false");
	  this.heroCalendar.classList.remove("is-open", "is-closing");

	  this.applyMeasuredHeroCalendarBox();
	  this.freezeNavbarForHeroCalendar();

	  /* 🔥 Layout startet sofort */ 
	  this.animateHeroCalendarLayout(0, state.ui.frozenHeroCalendarExtraHeight, {
		mode: "open",
		onComplete: () => {
		  state.ui.heroCalendarOpen = true;

		  this.cta.classList.remove("is-transitioning-open");
		  this.cta.classList.add("is-open");
		  this.hero.classList.add("hero-calendar-title-visible");

		  this.restoreNavbarAfterHeroCalendar({ preserveState: false });
		},
	  });

	  /* 🔥 Depth Fade-In bewusst leicht verzögert */
	  const revealDelay = Math.min(
		140,
		this.getHeroCalendarLayoutDuration() * 0.18
	  );

	  requestAnimationFrame(() => {
		requestAnimationFrame(() => {
		  setTimeout(() => {
			this.heroCalendar.classList.add("is-open");

			requestAnimationFrame(() => {
			  this.updateFullCalendarSize();
			});
		  }, revealDelay);
		});
	  });
	},

	closeHeroCalendar({ preserveAboutBoundaryAtTop = false, onComplete = null } = {}) {	
	  this.hideCalendarActionBar();
	  
	  if (!this.cta || !this.heroCalendar || !this.hero) return;

	  if (!state.ui.heroCalendarOpen && !state.ui.heroCalendarAnimating) {
		onComplete?.();
		return;
	  }

	  if (state.ui.heroCalendarAnimating || !state.ui.heroCalendarOpen) return;

		this.hero.classList.remove("hero-calendar-title-visible");
	  state.ui.heroCalendarAnimating = true;
	  this.clearHeroCalendarTimers();

	  /* 🔥 CLOSE STATE START */
	  this.cta.classList.add("is-transitioning-close");
	  this.cta.classList.remove("is-open");

	  /* 🔥 Kalender bleibt sichtbar (Startzustand für Depth-Out) */
	  this.heroCalendar.classList.add("is-open");

	  /* 🔥 Depth-Out (Blur + Scale + Fade) */
	  requestAnimationFrame(() => {
		this.heroCalendar.classList.add("is-closing");
	  });

	  /* 🔥 Layout startet sofort → läuft parallel */
	  this.freezeNavbarForHeroCalendar();
	  
	  /* 🔥 SOFORT ausblenden */
	  this.hero.classList.remove("hero-calendar-open");

	  this.animateHeroCalendarLayout(
		state.ui.heroCalendarExtraHeight,
		0,
		{
		  mode: preserveAboutBoundaryAtTop
			? "close-keep-about-position"
			: "close",
		  onComplete: () => {
			state.ui.heroCalendarOpen = false;

			this.cta.setAttribute("aria-expanded", "false");

			this.hero.classList.remove("hero-calendar-active");
			this.hero.classList.remove("hero-calendar-lock-motion");
			this.heroCalendar.style.top = "";
			this.heroCalendar.style.height = "";

			this.destroyFullCalendar();

			utils.resetAnimatedValue(state.cta.elasticY, 0);
			navbarModule.renderCTA();

			navbarModule.suppressCtaHoverTemporarily(250);

			this.restoreNavbarAfterHeroCalendar({ preserveState: true });

			/* 🔥 finaler CTA Zustand */
			this.cta.classList.remove("is-transitioning-close");
			this.cta.classList.add("is-closed");
			
			state.ui.frozenHeroCalendarExtraHeight = null;

			onComplete?.();
		  },
		}
	  );

	  /* 🔥 Kalender erst nach Fade/Depth wirklich entfernen */
	  const duration = this.getHeroCalendarLayoutDuration();

	  state.ui.heroCalendarRevealTimer = setTimeout(() => {
		this.heroCalendar.classList.remove("is-open");
		this.heroCalendar.classList.remove("is-closing");
		this.heroCalendar.setAttribute("aria-hidden", "true");
	  }, duration * 0.6); // leicht früher als Layout-Ende → fühlt sich snappier an
	},

  closeHeroCalendarInstant() {
    if (!this.cta || !this.heroCalendar || !this.hero) return;
    if (!state.ui.heroCalendarOpen) return;

    this.clearHeroCalendarTimers();

    /* Harte State-Resets */
    state.ui.heroCalendarAnimating = false;
    state.ui.heroCalendarOpen = false;
    state.ui.heroCalendarKeepCtaFlat = false;
    state.scroll.programmatic = false;

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

    utils.resetAnimatedValue(state.cta.elasticY, 0);
    utils.resetAnimatedValue(state.hero.parallax, 0);

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

  getHeroCalendarLayoutDuration() {
    return utils.cssVar.timeMs("--hero-calendar-layout-duration", 750);
  },

  getHeroCalendarRevealDelay() {
    return utils.cssVar.timeMs("--hero-calendar-reveal-delay", 180);
  },

  getHeroCalendarPreferredHeight() {
    return utils.cssVar.lengthPx(
      "--hero-calendar-preferred-height",
      window.innerWidth <= 768 ? 520 : 560
    );
  },

  getHeroCalendarPrewarmDistancePx() {
    const about = document.getElementById("about");
    if (!about) return window.innerHeight * 0.2;

    const ratio = utils.cssVar.number("--hero-calendar-prewarm-about-ratio", 0.2);
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

    this.unlockHeroCalendarScrollBehavior();
	state.ui.heroCalendarNavbarFreeze = false;
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
    const desiredBottomOffset = utils.cssVar.lengthPx("--hero-cta-gap-to-boundary", 90);
    
    const ctaHeight = utils.cssVar.lengthPx("--cta-height", 60);

    const compactNavHeight = utils.cssVar.lengthPx("--nav-height-min", 58);

    const previousExtra = state.ui.heroCalendarExtraHeight || 0;

    let heroRect = this.hero.getBoundingClientRect();
    let descRect = heroDescription.getBoundingClientRect();

    const descriptionBasedTop =
      Math.round((descRect.bottom - heroRect.top) + gap);

    const calendarTop =
      Math.round(descriptionBasedTop + compactNavHeight);

    const requiredSpaceBelowCalendarTop =
      preferredCalendarHeight + gap + ctaHeight + desiredBottomOffset;

    const availableSpaceBelowCalendarTop =
      heroRect.height - calendarTop;

    let extraHeight = Math.max(
      0,
      Math.ceil(requiredSpaceBelowCalendarTop - availableSpaceBelowCalendarTop)
    );

/*
    const requiredExtraForDescriptionToLeaveViewport =
      Math.max(0, Math.ceil(descRect.bottom));

    extraHeight = Math.max(
      extraHeight,
      requiredExtraForDescriptionToLeaveViewport
    );
*/

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
	state.scroll.programmatic = true;
	
    this.hero?.classList.add("hero-calendar-active");

    const duration = this.getHeroCalendarLayoutDuration();
    const start = performance.now();

    const about = this.getHomeAboutBoundaryEl();
    const startScrollY = window.scrollY;
    const startAboutViewportTop = about ? about.getBoundingClientRect().top : 0;
    const startCtaViewportTop = this.cta ? this.cta.getBoundingClientRect().top : 0;

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
        if (about) {
          const currentAboutTop = about.getBoundingClientRect().top;
          const deltaToTarget = currentAboutTop - startAboutViewportTop;
          nextScrollY = window.scrollY + deltaToTarget;
        }
      } else if (mode === "close") {
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

	  // 🔥 NEU: Aktiven Scroll komplett blockieren
	  this._preventScrollHandler = (e) => {
		e.preventDefault();
	  };

	  window.addEventListener("wheel", this._preventScrollHandler, { passive: false });
	  window.addEventListener("touchmove", this._preventScrollHandler, { passive: false });
	},
  
  unlockHeroCalendarScrollBehavior() {
	  document.documentElement.classList.remove("disable-overscroll");
	  document.documentElement.classList.remove("hero-calendar-animating");

	  // 🔥 Wichtig: Listener entfernen
	  if (this._preventScrollHandler) {
		window.removeEventListener("wheel", this._preventScrollHandler);
		window.removeEventListener("touchmove", this._preventScrollHandler);
		this._preventScrollHandler = null;
	  }
	},

  freezeNavbarForHeroCalendar() {
    state.ui.heroCalendarNavbarFreeze = true;
  },

  restoreNavbarAfterHeroCalendar({ preserveState = true } = {}) {
    state.ui.heroCalendarNavbarFreeze = false;

    state.nav.gestureStretch.current = 0;
    state.nav.gestureStretch.target = 0;

    state.lastScrollY = window.scrollY;

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

  bindEvents() {
    this.cta?.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.toggle();
    });

    this.heroCalendar?.addEventListener("click", this.stopPropagation);
    this.heroCalendarEl?.addEventListener("click", this.stopPropagation);
  },

  toggle() {
    if (state.ui.heroCalendarAnimating) return;
    if (navbarModule.isOpen()) return;
    if (state.ui.heroCalendarOpen) {
      this.closeHeroCalendar();
    } else {
      this.openHeroCalendar();
    }
  },
  
  waitForTransitionEnd(element) {
	  return new Promise((resolve) => {
		const handler = (e) => {
		  if (e.target === element) {
			element.removeEventListener("transitionend", handler);
			resolve();
		  }
		};

		element.addEventListener("transitionend", handler);
	  });
	},

  stopPropagation(e) {
    e.stopPropagation();
  }
};
