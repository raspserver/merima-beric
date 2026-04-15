// contactMapModule.js

import { state } from "../core/state.js";
import { prewarmUtils } from "../utils/prewarmUtils.js";
import { utils } from "../utils/utils.js";

// ---------------------------------------------------------------------
// CONTACT MAP (MAPLIBRE 3D)
// ---------------------------------------------------------------------

export const contactMapModule = {
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
    return utils.cssVar.number("--contact-map-zoom-start", 14);
  },

  getEndZoom() {
    return utils.cssVar.number("--contact-map-zoom-end", 15);
  },

  getStartPitch() {
    return utils.cssVar.number("--contact-map-pitch-start", 52);
  },

  getEndPitch() {
    return utils.cssVar.number("--contact-map-pitch-end", 56);
  },

  getStartBearing() {
    return utils.cssVar.number("--contact-map-bearing-start", -14);
  },

  getEndBearing() {
    return utils.cssVar.number("--contact-map-bearing-end", -18);
  },

  getAnimationDurationMs() {
    return utils.cssVar.timeMs("--contact-map-animation-duration", 2200);
  },

  getAnimationDelayMs() {
    return utils.cssVar.timeMs("--contact-map-animation-delay", 1000);
  },

  // --------------------------------------------------
  // Große Navbar-Cinematic
  // --------------------------------------------------
  getCinematicStartZoom() {
    return utils.cssVar.number("--contact-map-cinematic-start-zoom", 17.4);
  },

  getCinematicStartPitch() {
    return utils.cssVar.number("--contact-map-cinematic-start-pitch", 60);
  },

  getCinematicStartBearing() {
    return utils.cssVar.number("--contact-map-cinematic-start-bearing", -32);
  },

  getCinematicDelayMs() {
    return utils.cssVar.timeMs("--contact-map-cinematic-delay", 120);
  },

  getFlySpeed() {
    return utils.cssVar.number("--contact-map-fly-speed", 0.18);
  },

  getFlyCurve() {
    return utils.cssVar.number("--contact-map-fly-curve", 1);
  },

  getFlyMinZoom() {
    return utils.cssVar.number("--contact-map-fly-min-zoom", 11.8);
  },

  getFlyScreenSpeed() {
    return utils.cssVar.number("--contact-map-fly-screen-speed", 0.16);
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
      bearing: this.getStartBearing(),
    });

    // Animation beendet
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
      essential: true,
    });

    // Animation gestartet
    state.ui.contactMapAnimated = true;
  },

  prepareCinematicStartView() {
    if (!this.map) return;

    this.map.stop();

    this.map.jumpTo({
      center: this.getCinematicStartCoords(),
      zoom: this.getCinematicStartZoom(),
      pitch: this.getCinematicStartPitch(),
      bearing: this.getCinematicStartBearing(),
    });
  },

  playNavbarCinematic() {
    if (!this.map || state.ui.contactMapAnimated) return;

    if (this.getReducedMotionEnabled()) {
      this.map.jumpTo({
        center: this.getSalonCoords(),
        zoom: this.getEndZoom(),
        pitch: this.getEndPitch(),
        bearing: this.getEndBearing(),
      });

      // Cinematic übersprungen
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
        screenSpeed: this.getFlyScreenSpeed(),
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
    return utils.cssVar.lengthPx("--contact-map-reinit-offset", 120);
  },

  getPrewarmDistancePx() {
    const about = document.getElementById("about");
    if (!about) return window.innerHeight * 0.2;

    const ratio = utils.cssVar.number("--contact-map-prewarm-about-ratio", 0.2);
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

};
