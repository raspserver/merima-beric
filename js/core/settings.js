// ---------------------------------------------------------------------
// GLOBALE EINSTELLUNGEN
// ---------------------------------------------------------------------
export const SETTINGS = {
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
