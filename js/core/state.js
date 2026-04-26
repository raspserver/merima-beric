// state.js

import { utils } from "../utils/utils.js";

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
    visible: utils.createAnimatedValue(0),
    compact: utils.createAnimatedValue(0),
    surface: utils.createAnimatedValue(0),
    gestureStretch: utils.createAnimatedValue(0),
    manualOpen: false,
    behaviorState: "INIT",
  },

  hero: {
    parallax: utils.createAnimatedValue(0),
  },

  cta: {
    elasticY: utils.createAnimatedValue(0),
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
    contactMapNavCinematicRequested: false,
  },

  orderedSections: [],
};
