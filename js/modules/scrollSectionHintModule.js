import { state } from "../core/state.js";
import { scrollEngine } from "../core/scrollEngine.js";
import { cssVar } from "../utils/cssVar.js";
import { utils } from "../utils/utils.js";
import { clamp } from '../utils/helper.js';


// ---------------------------------------------------------------------
// SCROLL-SECTION-HINT-MODULE
// ---------------------------------------------------------------------

export const scrollSectionHintModule = {
	root: null,
	navbar: null,
	measurer: null,
	metricsCache: new Map(),
	hintSlots: [],
	updateRaf: null,

	  maxVisibleHints: 2,
	  isVisible: false,

	  hideTimer: null,
	  hideCompleteTimer: null,
	  stopCheckRaf: null,

	  lastScrollTs: 0,
	  lastObservedScrollY: window.scrollY,
	  lastStopCheckY: window.scrollY,
	  stableSinceTs: 0,

	  hideDelayMs: 1000,
	  fadeDurationMs: 500,
	  showScrollDistancePx: window.innerHeight,

	  /* Erst wenn scrollY für diese Zeit wirklich stabil bleibt,
		 gilt der Scroll als beendet. */
	  restStableMs: 220,
	  movementTolerancePx: 0.25,

	  gesture: {
		type: null,
		active: false,
		distance: 0,
		lastTouchStartTs: 0,
		lastTouchEndTs: 0,

		sessionHadTouch: false,
		sessionUnlocked: false,
	  },

	  labels: {
		home: "START",
		about: "ÜBER MICH",
		gallery: "VIDEO-FUN",
		services: "LEISTUNGEN",
		pricing: "PREISE",
		testimonials: "BEWERTUNGEN",
		contact: "KONTAKT",
	  },

	cacheDOM() {
		this.navbar = document.querySelector(".navbar");
	},

	  build() {
		if (this.root) return;

		this.root = document.createElement("div");
		this.root.className = "scroll-section-hints";
		this.root.setAttribute("aria-hidden", "true");

		this.root.innerHTML = Array.from(
		  { length: this.maxVisibleHints },
		  (_, index) => `
			<div class="scroll-section-hint-anchor scroll-section-hint-anchor--${index}">
			  <div class="scroll-section-hint scroll-section-hint--${index}">
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

	  bindHintClicks() {
		this.hintSlots.forEach((hintEl) => {
		  const anchor = hintEl?.parentElement;
		  if (!anchor) return;

		  anchor.setAttribute("tabindex", "0");
		  anchor.setAttribute("role", "button");

		  const goToHintTarget = () => {
			const targetSelector = anchor.dataset.scrollTarget;
			const opacity = parseFloat(hintEl.style.opacity || "0");
			const text = hintEl.textContent || "";

			if (!targetSelector || opacity <= 0.01) return;

			scrollEngine.goTo(
			  targetSelector,
			  text.includes(">>") ? "down" : "up-section"
			);
		  };

		  const triggerNavigation = (e) => {
			e.preventDefault();
			e.stopPropagation();
			goToHintTarget();
		  };

		  anchor.addEventListener(
			"pointerdown",
			(e) => {
			  if (e.pointerType !== "mouse") triggerNavigation(e);
			},
			{ passive: false }
		  );

		  anchor.addEventListener("touchstart", triggerNavigation, {
			passive: false,
		  });

		  anchor.addEventListener("click", (e) => {
			if (!e.pointerType || e.pointerType === "mouse") {
			  triggerNavigation(e);
			}
		  });

		  anchor.addEventListener("keydown", (e) => {
			if (e.key === "Enter" || e.key === " ") triggerNavigation(e);
		  });
		});
	  },

	  getContentSections() {
		return state.orderedSections.filter((section) => {
		  if (!section) return false;
		  if (section.classList?.contains("hero")) return true;
		  return !!section.id && !!this.labels[section.id];
		});
	  },

	  getVisualViewportBottom() {
		return window.visualViewport
		  ? window.visualViewport.height
		  : window.innerHeight || document.documentElement.clientHeight;
	  },

	  getBoundaryGapPx() {
		return cssVar.remPx("--section-hint-boundary-gap", 4.8);
	  },
 
	  getNavbarBottom() {
		  return this.navbar
			? this.navbar.getBoundingClientRect().bottom
			: cssVar.number("--nav-height", 78);
		},

	  getSectionContext() {
		const sections = this.getContentSections();
		if (!sections.length) return null;

		const navbarBottom = this.getNavbarBottom();
		const viewportBottom = this.getVisualViewportBottom();
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
			const switchLine = scrollingUp ? navbarBottom : lowerThirdY;

			if (rect.top <= switchLine) {
			  currentIndex = i;
			} else {
			  break;
			}

			continue;
		  }

		  if (rect.top <= navbarBottom) {
			currentIndex = i;
		  } else {
			break;
		  }
		}

		return {
		  sections,
		  currentIndex,
		  current: sections[currentIndex] || null,
		  next: sections[currentIndex + 1] || null,
		  overnext: sections[currentIndex + 2] || null,
		};
	  },

	  measureHint(text) {
		const key = text || " ";
		const cached = this.metricsCache.get(key);

		if (cached || !this.measurer) {
		  return cached || { width: 0, height: 0 };
		}

		this.measurer.textContent = key;

		const rect = this.measurer.getBoundingClientRect();
		const metrics = {
		  width: rect.width || 0,
		  height: rect.height || 0,
		};

		this.metricsCache.set(key, metrics);
		return metrics;
	  },

	  getAnchorHeightForText(text) {
		return Math.max(48, this.measureHint(text).width + 16);
	  },

	  makeText(section, variant = "forward") {
		if (!section?.id || !this.labels[section.id]) return "";

		return variant === "forward"
		  ? `>> ${this.labels[section.id]} >>`
		  : `<< ${this.labels[section.id]} <<`;
	  },

	  getRgbFromColorString(color) {
		if (!color) return null;

		const value = color.trim().toLowerCase();

		if (value === "transparent" || value === "rgba(0, 0, 0, 0)") return null;

		const rgbMatch = value.match(/rgba?\(([^)]+)\)/);
		if (rgbMatch) {
		  const parts = rgbMatch[1]
			.split(",")
			.map((part) => parseFloat(part.trim()));

		  if (parts.length >= 3 && parts.slice(0, 3).every(Number.isFinite)) {
			return { r: parts[0], g: parts[1], b: parts[2] };
		  }
		}

		const hexMatch = value.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
		if (!hexMatch) return null;

		let hex = hexMatch[1];
		if (hex.length === 3) {
		  hex = hex
			.split("")
			.map((ch) => ch + ch)
			.join("");
		}

		const intVal = parseInt(hex, 16);

		return {
		  r: (intVal >> 16) & 255,
		  g: (intVal >> 8) & 255,
		  b: intVal & 255,
		};
	  },

	  getRelativeLuminance({ r, g, b }) {
		const normalize = (channel) => {
		  const v = channel / 255;
		  return v <= 0.03928
			? v / 12.92
			: Math.pow((v + 0.055) / 1.055, 2.4);
		};

		return (
		  0.2126 * normalize(r) +
		  0.7152 * normalize(g) +
		  0.0722 * normalize(b)
		);
	  },

	  getSectionTheme(sectionEl) {
		if (!sectionEl) return "dark";

		const explicitTheme = sectionEl.dataset.hintTheme;
		if (explicitTheme === "light" || explicitTheme === "dark") {
		  return explicitTheme;
		}

		const style = getComputedStyle(sectionEl);
		const rgb =
		  this.getRgbFromColorString(style.backgroundColor) ||
		  this.getRgbFromColorString(getComputedStyle(document.body).backgroundColor) || {
			r: 250,
			g: 250,
			b: 248,
		  };

		return this.getRelativeLuminance(rgb) < 0.42 ? "light" : "dark";
	  },

	  getSectionAtViewportY(viewportY) {
		return (
		  this.getContentSections().find((section) => {
			const rect = section.getBoundingClientRect();
			return viewportY >= rect.top && viewportY <= rect.bottom;
		  }) || null
		);
	  },

	  getThemeAtViewportY(viewportY, fallbackSection = null) {
		return this.getSectionTheme(
		  this.getSectionAtViewportY(viewportY) || fallbackSection
		);
	  },

	  setAnchorCenterY(hintEl, centerYPx) {
		const anchor = hintEl?.parentElement;
		if (anchor) anchor.style.top = `${Math.round(centerYPx)}px`;
	  },

	  setHint(
		hintEl,
		{ text = "", top = 0, opacity = 0, theme = "dark", target = "" } = {}
	  ) {
		if (!hintEl) return;

		const anchor = hintEl.parentElement;
		const base = hintEl.querySelector(".scroll-section-hint-base");
		const visible = !!text && opacity > 0.001;

		if (base) base.textContent = text;

		this.setAnchorCenterY(hintEl, top);

		hintEl.style.opacity = `${
		  clamp(opacity, 0, 1) * cssVar.number("--section-hint-visibility", 0.5)
		}`;

		hintEl.dataset.theme = theme;
		hintEl.classList.toggle("is-empty", !visible);

		if (anchor) {
		  const metrics = this.measureHint(text);

		  anchor.dataset.scrollTarget = target || "";
		  anchor.style.width = `${Math.max(48, metrics.height + 16)}px`;
		  anchor.style.height = `${Math.max(48, metrics.width + 16)}px`;
		  anchor.style.pointerEvents = visible ? "auto" : "none";
		  anchor.style.opacity = visible ? "1" : "0";
		  anchor.setAttribute("aria-hidden", visible ? "false" : "true");
		}
	  },

	  applyHint(hintEl, placement) {
		if (!placement?.section) {
		  this.hideHint(hintEl);
		  return;
		}

		this.setHint(hintEl, {
		  text: this.makeText(placement.section, placement.variant),
		  top: placement.top,
		  opacity: placement.opacity ?? 1,
		  theme: this.getThemeAtViewportY(placement.top, placement.section),
		  target: placement.section.id ? `#${placement.section.id}` : "",
		});
	  },

	  hideHint(hintEl) {
		this.setHint(hintEl, {
		  text: "",
		  top: 0,
		  opacity: 0,
		  target: "",
		});
	  },

	  hideAll() {
		this.hintSlots.forEach((hintEl) => this.hideHint(hintEl));
	  },

	  getTransitionZone(changeY, bandTop, bandBottom) {
		if (!Number.isFinite(changeY) || changeY <= bandTop || changeY >= bandBottom) {
		  return "outside";
		}

		const rel = changeY - bandTop;
		const third = (bandBottom - bandTop) / 3;

		if (rel < third) return "entering";
		if (rel < third * 2) return "passing";
		return "leaving";
	  },

	  createPlacement(section, config = {}) {
		if (!section) return null;

		return {
		  section,
		  role: config.role || "transition",
		  variant: config.variant || "forward",
		  top: config.top || 0,
		  opacity: config.opacity ?? 1,
		  priority: config.priority || 0,
		};
	  },

	  buildGeometry(context) {
		const gap = this.getBoundaryGapPx();
		const navbarBottom = this.getNavbarBottom();
		const viewportBottom = this.getVisualViewportBottom();
		const lowerThirdY = viewportBottom * (2 / 3);

		const { current, next, overnext } = context;

		const text = {
		  currentForward: this.makeText(current, "forward"),
		  nextForward: next ? this.makeText(next, "forward") : "",
		  nextBackward: next ? this.makeText(next, "backward") : "",
		  overnextBackward: overnext ? this.makeText(overnext, "backward") : "",
		};

		const nextRect = next?.getBoundingClientRect() || null;
		const overnextRect = overnext?.getBoundingClientRect() || null;

		const changeY = nextRect ? nextRect.top : Number.POSITIVE_INFINITY;
		const overnextChangeY = overnextRect
		  ? overnextRect.top
		  : Number.POSITIVE_INFINITY;

		const anchorHeights = {
		  currentForward: this.getAnchorHeightForText(text.currentForward),
		  nextForward: this.getAnchorHeightForText(text.nextForward),
		  nextBackward: this.getAnchorHeightForText(text.nextBackward),
		  overnextBackward: this.getAnchorHeightForText(text.overnextBackward),
		};

		return {
		  gap,
		  changeY,
		  overnextChangeY,

		  docks: {
			top: {
			  current: navbarBottom + gap + anchorHeights.currentForward / 2,
			},

			bottom: {
			  next: next
				? viewportBottom - gap - anchorHeights.nextBackward / 2
				: 0,
			  overnext: overnext
				? viewportBottom - gap - anchorHeights.overnextBackward / 2
				: 0,
			},

			lowerThird: {
			  next: next
				? lowerThirdY - gap - anchorHeights.nextBackward / 2
				: 0,
			  overnext: overnext
				? lowerThirdY - gap - anchorHeights.overnextBackward / 2
				: 0,
			},
		  },

		  band: {
			top: navbarBottom,
			bottom: viewportBottom,
		  },

		  transition: {
			nextForwardBelowBoundary: next
			  ? changeY + gap + anchorHeights.nextForward / 2
			  : 0,

			nextBackwardAboveBoundary: next
			  ? changeY - gap - anchorHeights.nextBackward / 2
			  : 0,

			overnextBackwardAboveBoundary: overnext
			  ? overnextChangeY - gap - anchorHeights.overnextBackward / 2
			  : 0,
		  },
		};
	  },

	  buildHomeAboutSpecialPlacements(context, geometry) {
		const about = context.sections.find((section) => section?.id === "about");
		const gallery = context.sections.find((section) => section?.id === "gallery");

		if (!about) return null;

		const boundaryY = about.getBoundingClientRect().top;
		const viewportBottom = geometry.band.bottom;
		const navbarBottom = geometry.band.top;

		if (
		  !Number.isFinite(boundaryY) ||
		  boundaryY <= navbarBottom ||
		  boundaryY >= viewportBottom
		) {
		  return null;
		}

		const topThirdEnd = viewportBottom / 3;
		const middleThirdEnd = viewportBottom * (2 / 3);
		const scrollingUp = state.scrollDirection === "up";

		const placements = [];
		const push = (placement) => placement?.section && placements.push(placement);

		const aboutForwardText = this.makeText(about, "forward");
		const aboutBackwardText = this.makeText(about, "backward");
		const galleryBackwardText = gallery ? this.makeText(gallery, "backward") : "";

		const aboutForwardHeight = this.getAnchorHeightForText(aboutForwardText);
		const aboutBackwardHeight = this.getAnchorHeightForText(aboutBackwardText);
		const galleryBackwardHeight = gallery
		  ? this.getAnchorHeightForText(galleryBackwardText)
		  : 0;

		const aboutBelowBoundaryTop =
		  boundaryY + geometry.gap + aboutForwardHeight / 2;

		const aboutAboveBoundaryBackwardTop =
		  boundaryY - geometry.gap - aboutBackwardHeight / 2;

		const galleryBottomTop = gallery
		  ? viewportBottom - geometry.gap - galleryBackwardHeight / 2
		  : 0;

		if (scrollingUp) {
		  if (boundaryY < topThirdEnd) {
			push(
			  this.createPlacement(about, {
				role: "transition",
				variant: "forward",
				top: aboutBelowBoundaryTop,
				priority: 100,
			  })
			);

			if (gallery) {
			  push(
				this.createPlacement(gallery, {
				  role: "bottomDock",
				  variant: "backward",
				  top: galleryBottomTop,
				  priority: 60,
				})
			  );
			}

			return placements;
		  }

		  if (boundaryY < middleThirdEnd) {
			push(
			  this.createPlacement(about, {
				role: "transition",
				variant: "forward",
				top: aboutBelowBoundaryTop,
				priority: 100,
			  })
			);

			return placements;
		  }

		  push(
			this.createPlacement(about, {
			  role: "transition",
			  variant: "backward",
			  top: aboutAboveBoundaryBackwardTop,
			  priority: 100,
			})
		  );

		  return placements;
		}

		if (boundaryY >= middleThirdEnd) {
		  return [];
		}

		push(
		  this.createPlacement(about, {
			role: "transition",
			variant: "forward",
			top: aboutBelowBoundaryTop,
			priority: 100,
		  })
		);

		if (gallery && boundaryY < topThirdEnd) {
		  push(
			this.createPlacement(gallery, {
			  role: "bottomDock",
			  variant: "backward",
			  top: galleryBottomTop,
			  priority: 60,
			})
		  );
		}

		return placements;
	  },

	  buildPlacements(context, geometry) {
		const specialHomeAbout = this.buildHomeAboutSpecialPlacements(
		  context,
		  geometry
		);
		if (specialHomeAbout) return specialHomeAbout;

		const { current, next, overnext } = context;
		const placements = [];
		const push = (placement) => placement?.section && placements.push(placement);

		const isHomeCurrent =
		  current?.classList?.contains("hero") || current?.id === "home";

		const nextZone = next
		  ? this.getTransitionZone(geometry.changeY, geometry.band.top, geometry.band.bottom)
		  : "outside";

		const overnextZone = overnext
		  ? this.getTransitionZone(
			  geometry.overnextChangeY,
			  geometry.band.top,
			  geometry.band.bottom
			)
		  : "outside";

		if (!isHomeCurrent && !next) {
		  push(
			this.createPlacement(current, {
			  role: "topDock",
			  variant: "forward",
			  top: geometry.docks.top.current,
			  priority: 100,
			})
		  );

		  return placements;
		}

		if (isHomeCurrent) {
		  if (nextZone === "entering" || nextZone === "passing") {
			push(
			  this.createPlacement(next, {
				role: "transition",
				variant: "forward",
				top: geometry.transition.nextForwardBelowBoundary,
				priority: 100,
			  })
			);
		  }

		  if (overnext) {
			if (overnextZone !== "outside") {
			  push(
				this.createPlacement(overnext, {
				  role: "transition",
				  variant: "backward",
				  top: geometry.transition.overnextBackwardAboveBoundary,
				  priority: 60,
				})
			  );
			} else if (nextZone === "entering") {
			  push(
				this.createPlacement(overnext, {
				  role: "bottomDock",
				  variant: "backward",
				  top: geometry.docks.lowerThird.overnext,
				  priority: 60,
				})
			  );
			}
		  }

		  if (nextZone === "outside" || nextZone === "leaving") {
			if (geometry.changeY > geometry.docks.lowerThird.next + geometry.gap) {
			  push(
				this.createPlacement(next, {
				  role: "bottomDock",
				  variant: "backward",
				  top: geometry.docks.lowerThird.next,
				  priority: 70,
				})
			  );
			}
		  }

		  return placements;
		}

		if (nextZone === "outside") {
		  push(
			this.createPlacement(current, {
			  role: "topDock",
			  variant: "forward",
			  top: geometry.docks.top.current,
			  priority: 100,
			})
		  );

		  push(
			this.createPlacement(next, {
			  role: "bottomDock",
			  variant: "backward",
			  top: geometry.docks.bottom.next,
			  priority: 70,
			})
		  );

		  return placements;
		}

		if (nextZone === "entering") {
		  push(
			this.createPlacement(next, {
			  role: "transition",
			  variant: "forward",
			  top: geometry.transition.nextForwardBelowBoundary,
			  priority: 100,
			})
		  );

		  if (overnext) {
			push(
			  this.createPlacement(overnext, {
				role: overnextZone !== "outside" ? "transition" : "bottomDock",
				variant: "backward",
				top:
				  overnextZone !== "outside"
					? geometry.transition.overnextBackwardAboveBoundary
					: geometry.docks.bottom.overnext,
				priority: 60,
			  })
			);
		  }

		  return placements;
		}

		if (nextZone === "passing") {
		  push(
			this.createPlacement(current, {
			  role: "topDock",
			  variant: "forward",
			  top: geometry.docks.top.current,
			  priority: 90,
			})
		  );

		  push(
			this.createPlacement(next, {
			  role: "transition",
			  variant: "forward",
			  top: geometry.transition.nextForwardBelowBoundary,
			  priority: 100,
			})
		  );

		  return placements;
		}

		if (nextZone === "leaving") {
		  push(
			this.createPlacement(current, {
			  role: "topDock",
			  variant: "forward",
			  top: geometry.docks.top.current,
			  priority: 90,
			})
		  );

		  push(
			this.createPlacement(next, {
			  role: "transition",
			  variant: "backward",
			  top: geometry.transition.nextBackwardAboveBoundary,
			  priority: 100,
			})
		  );
		}

		return placements;
	  },

	  renderPlacements(placements) {
		const visiblePlacements = (placements || [])
		  .filter(Boolean)
		  .filter(
			(placement) => placement.section && (placement.opacity ?? 1) > 0.001
		  )
		  .sort((a, b) =>
			a.top !== b.top ? a.top - b.top : (b.priority ?? 0) - (a.priority ?? 0)
		  );

		if (!visiblePlacements.length) {
		  this.hideAll();
		  return;
		}

		this.hintSlots.forEach((hintEl, index) => {
		  const placement = visiblePlacements[index];
		  if (placement) {
			this.applyHint(hintEl, placement);
		  } else {
			this.hideHint(hintEl);
		  }
		});
	  },

	  updateGalleryBodyState(currentSection) {
		document.body.classList.toggle("in-gallery", currentSection?.id === "gallery");
	  },

	  update() {  
		if (!this.root) return;

		const context = this.getSectionContext();
		this.updateGalleryBodyState(context?.current || null);

		if (!context?.current) {
		  this.hideAll();
		  return;
		}

		this.renderPlacements(
		  this.buildPlacements(context, this.buildGeometry(context))
		);
	  },

	  scheduleUpdate() {
		if (this.updateRaf) return;

		this.updateRaf = requestAnimationFrame(() => {
		  this.updateRaf = null;
		  this.update();
		});
	  },

	  refreshTimingVars() {
		this.hideDelayMs = cssVar.timeMs("--section-hint-hide-delay", 1000);
		this.fadeDurationMs = cssVar.timeMs("--section-hint-fade-duration", 500);
		this.showScrollDistancePx = cssVar.lengthPx(
		  "--section-hint-show-scroll-distance",
		  window.innerHeight
		);
	  },

	  clearHideTimer() {
		this.hideTimer = utils.clearTimer(this.hideTimer);
	  },

	  clearHideCompleteTimer() {
		this.hideCompleteTimer = utils.clearTimer(this.hideCompleteTimer);
	  },

	  clearStopDetection() {
		if (this.stopCheckRaf) {
		  cancelAnimationFrame(this.stopCheckRaf);
		  this.stopCheckRaf = null;
		}

		this.stableSinceTs = 0;
	  },
	  
	  resetSession() {
		  this.gesture.type = null;
		  this.gesture.active = false;
		  this.gesture.distance = 0;
		  this.gesture.sessionHadTouch = false;
		  this.gesture.sessionUnlocked = false;
		  this.clearStopDetection();
		},

		relockScrollDistanceAfterStop() {
		  this.gesture.distance = 0;
		  this.gesture.sessionUnlocked = false;
		  this.gesture.active = false;
		  this.lastObservedScrollY = window.scrollY;
		  this.lastStopCheckY = window.scrollY;
		},

	  beginGesture(type) {
		  this.clearHideTimer();
		  this.clearHideCompleteTimer();
		  this.clearStopDetection();

		  const startsNewTouchSession =
			type === "touch" &&
			!this.gesture.active &&
			!this.gesture.sessionHadTouch &&
			!this.isVisible;

		  this.gesture.type = type;
		  this.gesture.active = true;

		  // Distanz NICHT bei jeder neuen Wischgeste zurücksetzen
		  // sondern nur bei wirklich neuer Session
		  if (startsNewTouchSession) {
			this.gesture.distance = 0;
			this.gesture.sessionUnlocked = false;
		  }

		  if (type === "touch") {
			this.gesture.sessionHadTouch = true;
			this.gesture.lastTouchStartTs = performance.now();
		  }

		  this.lastObservedScrollY = window.scrollY;
		  this.lastStopCheckY = window.scrollY;
		  this.stableSinceTs = 0;
		},

	  accumulateScrollDistance() {
		const currentY = window.scrollY;
		const delta = Math.abs(currentY - this.lastObservedScrollY);

		if (delta > 0) this.gesture.distance += delta;
		this.lastObservedScrollY = currentY;
	  },

	  hasReachedShowScrollDistance() {
		return this.gesture.distance >= this.showScrollDistancePx;
	  },

	  show() {
		if (!this.root) return;

		this.clearHideCompleteTimer();
		this.isVisible = true;

		this.root.classList.remove("is-instant-hidden");
		document.body.classList.remove("hints-instant-hide");

		this.root.classList.add("is-visible");
		document.body.classList.add("hints-visible");
	  },

	  hide() {
		if (!this.root) return;

		this.isVisible = false;
		this.root.classList.remove("is-visible");
		document.body.classList.remove("hints-visible");

		this.scheduleRelockAfterFullyHidden();
	  },

	  scheduleRelockAfterFullyHidden() {
		this.clearHideCompleteTimer();

		this.hideCompleteTimer = setTimeout(() => {
		  this.hideCompleteTimer = null;
		}, this.fadeDurationMs);
	  },
	  
	  startHideCountdown() {
		  this.clearHideTimer();

		  this.hideTimer = setTimeout(() => {
			this.hide();

			// Erst NACH dem Ausblenden / nach der Delay wieder sperren
			this.relockScrollDistanceAfterStop();

			// Touch-Session darf danach beendet sein
			this.gesture.type = null;
			this.gesture.sessionHadTouch = false;
		  }, this.hideDelayMs);
		},  
	  
	  scheduleStopDetection() {
		  this.clearStopDetection();

		  this.lastStopCheckY = window.scrollY;
		  this.stableSinceTs = 0;

		  const check = (now) => {
			if (state.scroll.programmatic) return;

			const currentY = window.scrollY;
			const delta = Math.abs(currentY - this.lastStopCheckY);

			if (delta <= this.movementTolerancePx) {
			  if (!this.stableSinceTs) {
				this.stableSinceTs = now;
			  }

			  if (now - this.stableSinceTs >= this.restStableMs) {
				this.stopCheckRaf = null;

				// FALL A:
				// Schwelle noch nicht erreicht -> sofort Distanz zurücksetzen
				if (!this.gesture.sessionUnlocked) {
				  this.relockScrollDistanceAfterStop();
				  this.hide();
				  return;
				}

				// FALL B:
				// Schwelle erreicht / Hints sichtbar -> erst hide-delay abwarten,
				// dann ausblenden und danach Distanz zurücksetzen
				if (this.isVisible) {
				  this.startHideCountdown();
				  return;
				}

				// Fallback
				this.relockScrollDistanceAfterStop();
				return;
			  }
			} else {
			  this.stableSinceTs = 0;
			  this.lastStopCheckY = currentY;
			}

			this.stopCheckRaf = requestAnimationFrame(check);
		  };

		  this.stopCheckRaf = requestAnimationFrame(check);
		},

	  scheduleHide() {
		this.scheduleStopDetection();
	  },

	  handleScrollActivity() {
		if (state.scroll.programmatic) {
		  this.hideImmediatelyForProgrammaticScroll();
		  return;
		}

		this.lastScrollTs = performance.now();
		this.accumulateScrollDistance();

		this.clearHideTimer();
		this.clearHideCompleteTimer();
		this.clearStopDetection();

		if (!this.gesture.sessionHadTouch && !this.gesture.sessionUnlocked) {
		  this.hide();
		  return;
		}
		
		if (!this.gesture.sessionUnlocked) {
		  if (!this.hasReachedShowScrollDistance()) {
			this.hide();

			// Wichtig:
			// Auch unterhalb der Schwelle weiter prüfen,
			// damit bei Stillstand sofort auf 0 zurückgesetzt wird
			this.scheduleStopDetection();
			return;
		  }

		  this.gesture.sessionUnlocked = true;
		}

		this.show();
		this.scheduleStopDetection();
	  },

	  hideImmediatelyForProgrammaticScroll() {
		if (!this.root) return;

		this.clearHideTimer();
		this.clearHideCompleteTimer();
		this.clearStopDetection();
		this.resetSession();

		this.isVisible = false;

		this.root.classList.add("is-instant-hidden");
		document.body.classList.add("hints-instant-hide");

		this.root.classList.remove("is-visible");
		document.body.classList.remove("hints-visible");

		requestAnimationFrame(() => {
		  requestAnimationFrame(() => {
			this.root?.classList.remove("is-instant-hidden");
			document.body.classList.remove("hints-instant-hide");
		  });
		});
	  },

	  bindEvents() {
		const onTouchStart = () => {
		  this.beginGesture("touch");
		};

		const onTouchEndLike = () => {
		  this.gesture.lastTouchEndTs = performance.now();
		  this.gesture.active = false;
		  this.lastObservedScrollY = window.scrollY;

		  /* Kein Hide hier:
			 touchend ist nicht gleich scroll end. */
		};

		window.addEventListener(
		  "scroll",
		  () => {
			this.scheduleUpdate();

			if (state.scroll.programmatic) {
			  this.hideImmediatelyForProgrammaticScroll();
			  return;
			}

			this.handleScrollActivity();
		  },
		  { passive: true }
		);

		window.addEventListener("touchstart", onTouchStart, { passive: true });
		window.addEventListener("touchend", onTouchEndLike, { passive: true });
		window.addEventListener("touchcancel", onTouchEndLike, { passive: true });

		window.addEventListener(
		  "pointerdown",
		  (e) => {
			if (e.pointerType === "mouse") {
			  this.resetSession();
			  this.clearHideTimer();
			  this.clearStopDetection();
			  this.hide();
			}
		  },
		  { passive: true }
		);

		window.addEventListener(
		  "wheel",
		  () => {
			this.resetSession();
			this.clearHideTimer();
			this.clearStopDetection();
			this.hide();
		  },
		  { passive: true }
		);

		window.addEventListener("keydown", () => {
		  this.resetSession();
		  this.clearHideTimer();
		  this.clearStopDetection();
		  this.hide();
		});

		if ("onscrollend" in document) {
		  document.addEventListener(
			"scrollend",
			() => {
			  if (state.scroll.programmatic) return;
			  if (!this.gesture.sessionUnlocked) return;

			  this.scheduleStopDetection();
			},
			{ passive: true }
		  );
		}

		const onResize = () => {
		  this.metricsCache.clear();
		  this.refreshTimingVars();
		  this.lastObservedScrollY = window.scrollY;
		  this.lastStopCheckY = window.scrollY;
		  this.scheduleUpdate();
		};

		window.addEventListener("resize", onResize);
		window.addEventListener("orientationchange", () => setTimeout(onResize, 120));

		if (window.visualViewport) {
		  window.visualViewport.addEventListener("resize", onResize);
		  window.visualViewport.addEventListener(
			"scroll",
			() => this.scheduleUpdate(),
			{ passive: true }
		  );
		}	
	  },

	init() {

		this.cacheDOM();

		this.build();
		this.refreshTimingVars();
		this.bindHintClicks();
		this.hide();
		this.lastObservedScrollY = window.scrollY;
		this.lastStopCheckY = window.scrollY;
		this.update();
		this.bindEvents();
	  }
};
