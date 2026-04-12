
import {
    createAnimatedValue,
    resetAnimatedValue
} from "../utils/helper.js";

// ---------------------------------------------------------------------
// ZENTRALER STATE
// ---------------------------------------------------------------------

export const state = {
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
		ctaDefaultLabel: "",
		
		fullCalendarInstance: null,
		fullCalendarResizeTimer: null,
		
		heroCalendarOpen: false,
		heroCalendarExtraHeight: 0,
		heroCalendarAnimating: false,
		heroCalendarLayoutRaf: null,
		heroCalendarRevealTimer: null,
		heroCalendarMeasuredTop: 0,
		heroCalendarMeasuredHeight: 0,
		heroCalendarMeasuredExtra: 0,
		heroCalendarKeepCtaFlat: false,
		heroCalendarNavbarFreeze: false,
		heroCalendarAutoCloseTimer: null,
		heroCalendarAutoCloseArmed: false,
		heroCalendarLastScrollY: window.scrollY,
		heroCalendarPrewarmed: false,
		heroCalendarPrewarmObserver: null,
		
		pendingNavAfterHeroCalendarCloseToken: 0,
		
		contactMapPrewarmed: false,
		contactMapPrewarmObserver: null,
		contactMapLastOutsideZone: null,
		contactMapReinitArmed: false,
		contactMapReinitTimer: null,
		contactMapLastReinitAt: 0,
		contactMapAnimated: false,
		contactMapNavCinematicRequested: false
		
	},

    orderedSections: [],
  };
