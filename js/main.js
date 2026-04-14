import { physics } from "./core/physics.js";
import { scrollEngine } from "./core/scrollEngine.js";
import { SETTINGS } from "./core/settings.js";
import { springs } from "./core/springs.js";
import { state } from "./core/state.js";
import { cssVar } from "./utils/cssVar.js";
import { clamp }			from	"./utils/helper.js";
import { utils } from "./utils/utils.js";
import { prewarmUtils } from "./utils/prewarmUtils.js";
import { navbarModule } from "./modules/navbarModule.js";
import { scrollSectionHintModule } from "./modules/scrollSectionHintModule.js";
import { sectionNavigationModule } from "./modules/sectionNavigationModule.js";
import { uiModule } from "./modules/uiModule.js";
import { galleryModule } from "./modules/galleryModule.js";
import { SECTION_SELECTOR }			from	"./core/sectionSelector.js";

document.addEventListener("DOMContentLoaded", () => {

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

  // ---------------------------------------------------------------------
  // 3) KLEINE BASIS-HELPER
  // ---------------------------------------------------------------------


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

  // ---------------------------------------------------------------------
  // 11) SCROLL-HINT-SYSTEM
  // ---------------------------------------------------------------------

  // ---------------------------------------------------------------------
  // 12) GALLERY-MODUL
  // ---------------------------------------------------------------------


	// ---------------------------------------------------------------------
	// 13) PREWARM UTILITY (für HeroCalendar + ContactMap)
	// ---------------------------------------------------------------------


  // ---------------------------------------------------------------------
  // 14) UI-MODUL (CTA, HERO-KLICK, PRICING TABS)
  // ---------------------------------------------------------------------
  
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
	uiModule.init();
	sectionNavigationModule.init();
    navbarModule.init();
    scrollEngine.init();
    scrollSectionHintModule.init();
    scrollSectionHintPositionModule.init();
    galleryModule.init();
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
