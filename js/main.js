document.addEventListener("DOMContentLoaded", () => {
	/* =========================================================
	   SETTINGS
	========================================================= */
	const SETTINGS = {
		breakpoints: {
			mobileNav: 968,
			mobilePhysics: 768
		},
		thresholds: {
			directionLock: 8,
			inertia: Math.min(document.documentElement.clientHeight * 0.6, 600),
			sectionNavClickDelay: 240
		},
		gallery: {
			videoFiles: [
				"videos/snaptik_7204469200172190982_hd.mp4",
				"videos/snaptik_7208965603661499654_hd.mp4",
				"videos/snaptik_7211607331648441605_hd.mp4",
				"videos/snaptik_7444629475364474145_hd.mp4"
			],
			swipeThreshold: 80
		}
	};

	/* =========================================================
	   DOM
	========================================================= */
	const DOM = {
		navbar: document.querySelector(".navbar"),
		hero: document.querySelector(".hero"),
		navToggle: document.querySelector(".nav-toggle"),
		navMenu: document.querySelector(".nav-menu"),
		navLinks: document.querySelectorAll(".nav-menu a"),
		navLogo: document.querySelector(".nav-logo"),
		cta: document.querySelector(".cta-button"),
		footer: document.querySelector("footer"),
		track: document.querySelector(".gallery-track"),
		pricingTabs: document.querySelectorAll(".pricing-tab"),
		pricingContents: document.querySelectorAll(".pricing-content"),
		year: document.getElementById("year")
	};

	/* =========================================================
	   UTILS
	========================================================= */
	const utils = {
		prefersReducedMotion() {
			return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
		},

		getRootNumber(name, fallback) {
			const value = parseFloat(
				getComputedStyle(document.documentElement).getPropertyValue(name)
			);
			return Number.isFinite(value) ? value : fallback;
		},

		isMobileViewport() {
			return window.innerWidth <= SETTINGS.breakpoints.mobileNav;
		},

		isPhysicsMobileViewport() {
			return window.innerWidth <= SETTINGS.breakpoints.mobilePhysics;
		},

		getMaxScrollY() {
			return Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
		},

		shuffle(array) {
			for (let i = array.length - 1; i > 0; i--) {
				const j = Math.floor(Math.random() * (i + 1));
				[array[i], array[j]] = [array[j], array[i]];
			}
			return array;
		},

		resolveTarget(targetOrSelector) {
			if (!targetOrSelector) return null;
			if (targetOrSelector instanceof Element) return targetOrSelector;

			if (typeof targetOrSelector === "string") {
				let selector = targetOrSelector.trim();

				if (selector === "#home") {
					return document.querySelector("#home") || document.querySelector(".hero");
				}

				if (!selector.startsWith("#")) {
					try {
						selector = new URL(selector, window.location.href).hash || selector;
					} catch {}
				}

				if (!selector.startsWith("#")) return null;

				return document.querySelector(selector);
			}

			return null;
		},

		safePlay(video) {
			const p = video.play();
			if (p !== undefined) p.catch(() => {});
		},
		
		getRootRemPx(name, fallbackPx) {
			const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
			if (!raw) return fallbackPx;

			if (raw.endsWith("rem")) {
				const rem = parseFloat(raw);
				const rootFont = parseFloat(getComputedStyle(document.documentElement).fontSize);
				return Number.isFinite(rem) && Number.isFinite(rootFont) ? rem * rootFont : fallbackPx;
			}

			const px = parseFloat(raw);
			return Number.isFinite(px) ? px : fallbackPx;
		}
		
	};

	/* =========================================================
	   STATE
	========================================================= */
	const state = {
		lastScrollY: window.scrollY,
		scrollVelocity: 0,
		scrollDirection: "down",

		heroParallax: 0,
		heroParallaxVelocity: 0,

		animationRunning: false,
		lastFrameTime: performance.now(),

		programmaticScroll: false,
		manualNavbarOpen: false,
		programmaticNavMode: null, // null | "down" | "up-section" | "hero-top"

		suppressCtaHoverCleanup: null,
		suppressNextClick: false,

		targetVisible: 0,
		currentVisible: 0,
		visibleVelocity: 0,

		targetCompact: 0,
		currentCompact: 0,
		compactVelocity: 0,

		targetSurface: 0,
		currentSurface: 0,
		surfaceVelocity: 0,

		activeScrollAnimation: null,
		activeScrollToken: 0,
		
		topSettleRaf: null,
		topSettleTimeout: null,

		orderedSections: []
	};

	/* =========================================================
	   PHYSICS
	========================================================= */
	const physics = {
		values: {
			navVisibleStiffness: 0.08,
			navVisibleDamping: 0.82,
			navCompactStiffness: 0.045,
			navCompactDamping: 0.88,

			NAV_SURFACE_UP: 0.18,
			sectionScrollInset: 1,

			scrollElasticDecay: 10,
			scrollElasticFrequency: 10,
			scrollElasticPhaseShift: 0.75,
			scrollDurationFactor: 0.6,
			scrollDurationMin: 700,
			scrollDurationMax: 1600,

			heroParallaxFactor: -0.06,
			heroParallaxStiffness: 0.04,
			heroParallaxDamping: 0.85,
			heroScaleScrollFactor: 0.01,
			heroBrightnessScrollFactor: 0.06
		},

		update() {
			const isMobile = utils.isPhysicsMobileViewport();

			this.values.NAV_SURFACE_UP = utils.getRootNumber("--nav-surface-up", 0.18);
			this.values.sectionScrollInset = utils.getRootNumber("--section-scroll-inset", 1);

			this.values.scrollElasticDecay = utils.getRootNumber("--scroll-elastic-decay", 10);
			this.values.scrollElasticFrequency = utils.getRootNumber("--scroll-elastic-frequency", 10);
			this.values.scrollElasticPhaseShift = utils.getRootNumber("--scroll-elastic-phase-shift", 0.75);
			this.values.scrollDurationFactor = utils.getRootNumber("--scroll-duration-factor", 0.6);
			this.values.scrollDurationMin = utils.getRootNumber("--scroll-duration-min", 700);
			this.values.scrollDurationMax = utils.getRootNumber("--scroll-duration-max", 1600);

			this.values.heroParallaxFactor = utils.getRootNumber("--hero-parallax-factor", -0.06);
			this.values.heroParallaxStiffness = utils.getRootNumber("--hero-parallax-stiffness", 0.04);
			this.values.heroParallaxDamping = utils.getRootNumber("--hero-parallax-damping", 0.85);
			this.values.heroScaleScrollFactor = utils.getRootNumber("--hero-scale-scroll-factor", 0.01);
			this.values.heroBrightnessScrollFactor = utils.getRootNumber("--hero-brightness-scroll-factor", 0.06);

			if (isMobile) {
				this.values.navVisibleStiffness = utils.getRootNumber("--nav-spring-stiffness-mobile", 0.06);
				this.values.navVisibleDamping = utils.getRootNumber("--nav-spring-damping-mobile", 0.85);
				this.values.navCompactStiffness = utils.getRootNumber("--nav-compact-stiffness-mobile", 0.035);
				this.values.navCompactDamping = utils.getRootNumber("--nav-compact-damping-mobile", 0.90);
			} else {
				this.values.navVisibleStiffness = utils.getRootNumber("--nav-spring-stiffness-desktop", 0.08);
				this.values.navVisibleDamping = utils.getRootNumber("--nav-spring-damping-desktop", 0.82);
				this.values.navCompactStiffness = utils.getRootNumber("--nav-compact-stiffness-desktop", 0.045);
				this.values.navCompactDamping = utils.getRootNumber("--nav-compact-damping-desktop", 0.88);
			}
		}
	};

	/* =========================================================
	   SCROLL ENGINE
	========================================================= */
	const scrollEngine = {
		easeOutElastic(t) {
			if (t === 0) return 0;
			if (t === 1) return 1;

			const {
				scrollElasticDecay,
				scrollElasticFrequency,
				scrollElasticPhaseShift
			} = physics.values;

			const c = (2 * Math.PI) / 3;

			return Math.pow(2, -scrollElasticDecay * t) *
				Math.sin((t * scrollElasticFrequency - scrollElasticPhaseShift) * c) + 1;
		},

		getTargetNavOffset(navMode = null) {
			if (!DOM.navbar) return 0;

			const navMin = utils.getRootNumber("--nav-height-min", 58);
			const navMax = utils.getRootNumber("--nav-height-max", 78);

			if (navMode === "down" || navMode === "up-section") {
				return navMin;
			}

			return DOM.navbar.offsetHeight || navMax;
		},

		getModeForTarget(target) {
			if (!target) return "down";

			const currentY = window.scrollY;
			const targetY = target.getBoundingClientRect().top + window.pageYOffset;

			if (target.classList?.contains("hero")) return "up-section";
			return targetY < currentY ? "up-section" : "down";
		},

		getSurfaceForMode(mode) {
			return mode === "up-section" ? physics.values.NAV_SURFACE_UP : 1;
		},

		animateWindowScrollTo(targetY, { onComplete } = {}) {
			if (state.activeScrollAnimation) {
				cancelAnimationFrame(state.activeScrollAnimation);
				state.activeScrollAnimation = null;
			}

			const scrollToken = ++state.activeScrollToken;
			const maxScrollY = utils.getMaxScrollY();
			const clampedTargetY = Math.max(0, Math.min(targetY, maxScrollY));
			const startY = window.scrollY;
			const distance = clampedTargetY - startY;
			const absDistance = Math.abs(distance);
			
			const hardSnap = (y) => {
				window.scrollTo(0, y);

				requestAnimationFrame(() => {
					window.scrollTo(0, y);
				});
			};
			
			if (absDistance < 1) {
				hardSnap(clampedTargetY);
				onComplete?.(clampedTargetY);
				return;
			}

			const duration = utils.prefersReducedMotion()
				? Math.min(900, Math.max(350, absDistance * 0.35))
				: Math.min(
					physics.values.scrollDurationMax,
					Math.max(
						physics.values.scrollDurationMin,
						absDistance * physics.values.scrollDurationFactor
					)
				);

			const startTime = performance.now();

			const frame = (now) => {
				if (scrollToken !== state.activeScrollToken) return;

				const elapsed = now - startTime;
				const t = Math.min(elapsed / duration, 1);
				const eased = utils.prefersReducedMotion() ? t : this.easeOutElastic(t);

				const nextY = startY + distance * eased;
				const clampedNextY = Math.max(0, Math.min(nextY, maxScrollY));

				window.scrollTo(0, clampedNextY);

				if (t < 1) {
					state.activeScrollAnimation = requestAnimationFrame(frame);
				} else {
					hardSnap(clampedTargetY);
					state.activeScrollAnimation = null;
					onComplete?.(clampedTargetY);
				}
			};

			state.activeScrollAnimation = requestAnimationFrame(frame);
		},
		
		scrollToSection(target, navMode = null) {
			if (!target) return;

			const isHeroTarget = target.classList?.contains("hero");
			const isFooterTarget = target.tagName?.toLowerCase() === "footer";

			const effectiveNavMode =
				isHeroTarget && (navMode === "up-section" || navMode === "hero-top")
					? "hero-top"
					: navMode;

			const navOffset =
				isHeroTarget || isFooterTarget ? 0 : this.getTargetNavOffset(effectiveNavMode);

			const shouldInsetByOnePixel =
				target.matches?.("#about, #gallery, #services, #pricing, #testimonials, #contact");

			const inset = shouldInsetByOnePixel ? physics.values.sectionScrollInset : 0;

			const y = isHeroTarget
				? 0
				: target.getBoundingClientRect().top +
				  window.pageYOffset -
				  navOffset +
				  inset;

			state.programmaticScroll = true;
			state.programmaticNavMode = effectiveNavMode;

			if (effectiveNavMode === "down") {
				state.scrollDirection = "down";
			} else if (effectiveNavMode === "up-section" || effectiveNavMode === "hero-top") {
				state.scrollDirection = "up";
			}

			this.animateWindowScrollTo(Math.max(0, y), {
				onComplete: () => {
					const finalMode = state.programmaticNavMode;
					const finalY = window.scrollY;

					state.programmaticScroll = false;
					state.lastScrollY = finalY;

					if (finalMode === "down") {
						navbarModule.setTargets(1, 1, 1);
					} else if (finalMode === "up-section") {
						navbarModule.setTargets(1, 1, physics.values.NAV_SURFACE_UP);	
					} else if (finalMode === "hero-top") {
						scrollEngine.settleToTop({
							onDone: () => {
								state.lastScrollY = window.scrollY;

								if (window.scrollY <= 5) {
									navbarModule.setTargets(0, 0, 0);
								} else {
									navbarModule.setTargets(1, 1, physics.values.NAV_SURFACE_UP);
								}

								navbarModule.startAnimation();
								navbarModule.handleScroll();
							}
						});
					}
					
					state.programmaticNavMode = null;
					navbarModule.startAnimation();
					navbarModule.handleScroll();
				}
			});
		},
		
		goTo(targetOrSelector, forcedMode = null) {
			const target = utils.resolveTarget(targetOrSelector);
			if (!target) return;

			const mode = forcedMode || this.getModeForTarget(target);
			const isHeroTarget = target.classList?.contains("hero");
			const alreadyAtTop = window.scrollY <= 5;

			state.manualNavbarOpen = false;

			if (isHeroTarget && alreadyAtTop) {
				navbarModule.setTargets(0, 0, 0);
			} else {
				navbarModule.setTargets(1, 1, this.getSurfaceForMode(mode));
			}

			this.scrollToSection(target, mode);
			navbarModule.startAnimation();
		},

		scrollToPageBottom() {
			state.programmaticScroll = true;
			state.programmaticNavMode = "down";
			state.scrollDirection = "down";

			this.animateWindowScrollTo(utils.getMaxScrollY(), {
				onComplete: () => {
					state.programmaticScroll = false;
					state.programmaticNavMode = null;
					state.lastScrollY = window.scrollY;

					navbarModule.setTargets(1, 1, 1);
					navbarModule.startAnimation();
					navbarModule.handleScroll();
				}
			});
		},
		
		cancelActiveScroll({ keepPosition = true } = {}) {
			this.clearTopSettle();
			
			const hadActiveScroll = !!state.activeScrollAnimation || state.programmaticScroll;

			if (!hadActiveScroll) return;

			if (state.activeScrollAnimation) {
				cancelAnimationFrame(state.activeScrollAnimation);
				state.activeScrollAnimation = null;
			}

			state.activeScrollToken++;
			state.programmaticScroll = false;
			state.programmaticNavMode = null;

			if (keepPosition) {
				window.scrollTo(0, window.scrollY);
			}

			state.lastScrollY = window.scrollY;
			navbarModule.handleScroll();
		},
		
		clearTopSettle() {
			if (state.topSettleRaf) {
				cancelAnimationFrame(state.topSettleRaf);
				state.topSettleRaf = null;
			}

			if (state.topSettleTimeout) {
				clearTimeout(state.topSettleTimeout);
				state.topSettleTimeout = null;
			}
		},

		settleToTop({ onDone } = {}) {
			this.clearTopSettle();

			let stableFrames = 0;
			let lastY = -1;
			const startedAt = performance.now();

			const tick = () => {
				window.scrollTo(0, 0);

				const y = window.scrollY;

				/* wirklich oben oder praktisch oben */
				if (y <= 0) {
					if (lastY === 0) {
						stableFrames++;
					} else {
						stableFrames = 1;
					}
				} else {
					stableFrames = 0;
				}

				lastY = y;

				/* 3 stabile Frames am Stück = fertig */
				if (stableFrames >= 3) {
					this.clearTopSettle();
					onDone?.();
					return;
				}

				/* Sicherheitsgrenze für sehr schwache Geräte */
				if (performance.now() - startedAt > 1200) {
					window.scrollTo(0, 0);
					this.clearTopSettle();
					onDone?.();
					return;
				}

				state.topSettleRaf = requestAnimationFrame(tick);
			};

			/* zusätzlich harter Fallback */
			state.topSettleTimeout = setTimeout(() => {
				window.scrollTo(0, 0);
				this.clearTopSettle();
				onDone?.();
			}, 1400);

			state.topSettleRaf = requestAnimationFrame(tick);
		},
		
	};

	/* =========================================================
	   NAVBAR MODULE
	========================================================= */
	const navbarModule = {
		isOpen() {
			return !!(DOM.navMenu && DOM.navToggle && DOM.navMenu.classList.contains("active"));
		},

		openMenu() {
			if (!DOM.navMenu || !DOM.navToggle) return;

			DOM.navMenu.classList.add("active");
			DOM.navToggle.classList.add("active");
			document.body.classList.add("nav-menu-open");

		},

		closeMenu({ keepNavbarVisible = false } = {}) {
			if (!DOM.navMenu || !DOM.navToggle) return;

			DOM.navMenu.classList.remove("active");
			DOM.navToggle.classList.remove("active");
			document.body.classList.remove("nav-menu-open");

			uiModule.resetCtaMagnetic();

			if (DOM.cta) {
				DOM.cta.classList.remove("is-magnetic-near");
				DOM.cta.classList.remove("is-hovered");
				DOM.cta.blur();

				DOM.cta.style.setProperty("--magnetic-x", "0px");
				DOM.cta.style.setProperty("--magnetic-y", "0px");
				DOM.cta.style.setProperty("--hover-lift", "0px");
				DOM.cta.style.setProperty("--magnetic-scale", "1");
				DOM.cta.style.setProperty("--magnetic-shadow-y", "0px");
				DOM.cta.style.setProperty("--magnetic-shadow-blur", "0px");
				DOM.cta.style.setProperty("--magnetic-shadow-alpha", "0");

				DOM.cta.style.setProperty("--label-x", "0px");
				DOM.cta.style.setProperty("--label-y", "0px");
				DOM.cta.style.setProperty("--label-scale", "1");

				DOM.cta.style.setProperty("--gloss-x", "50%");
				DOM.cta.style.setProperty("--gloss-y", "50%");
				DOM.cta.style.setProperty("--gloss-opacity", "0");
			}

			this.suppressCtaHoverTemporarily(700);
			state.manualNavbarOpen = false;

			if (keepNavbarVisible) {
				this.setTargets(1, 1, 1);
				this.startAnimation();
				return;
			}

			if (window.scrollY <= 5 && !state.programmaticScroll) {
				this.setTargets(0, 0, 0);
			} else {
				this.handleScroll();
			}
		},

		setTargets(visible, compact, surface) {
			if (!DOM.navbar) return;

			state.targetVisible = visible;
			state.targetCompact = compact;
			state.targetSurface = surface;

			this.startAnimation();
		},

		startAnimation() {
			if (!state.animationRunning) {
				state.animationRunning = true;
				state.lastFrameTime = performance.now();
				requestAnimationFrame(this.animate.bind(this));
			}
		},

		handleScroll() {
			if (!DOM.navbar) return;

			const currentY = window.scrollY;
			const deltaY = currentY - state.lastScrollY;

			state.scrollVelocity = deltaY * 0.8;

			if (!state.programmaticScroll && Math.abs(deltaY) > SETTINGS.thresholds.directionLock) {
				state.scrollDirection = deltaY > 0 ? "down" : "up";
			}

			state.lastScrollY = currentY;

			DOM.hero?.classList.toggle("scrolled", currentY > 10);

			if (state.programmaticNavMode === "down") {
				this.setTargets(1, 1, 1);
				return;
			}

			if (state.programmaticNavMode === "up-section") {
				this.setTargets(1, 1, physics.values.NAV_SURFACE_UP);
				return;
			}

			if (state.programmaticNavMode === "hero-top") {
				this.setTargets(0, 0, 0);
				return;
			}

			if (state.manualNavbarOpen) {
				if (currentY <= 5) {
					state.manualNavbarOpen = false;
					this.setTargets(0, 0, 0);
				} else {
					this.setTargets(1, 1, 1);
				}
				return;
			}

			if (currentY <= 5) {
				this.setTargets(0, 0, 0);
			} else if (state.scrollDirection === "down") {
				this.setTargets(1, 1, 1);
			} else {
				this.setTargets(1, 1, physics.values.NAV_SURFACE_UP);
			}
		},

		animate(now) {
			if (!DOM.navbar || document.hidden) {
				state.animationRunning = false;
				return;
			}

			state.animationRunning = true;
			state.scrollVelocity *= 0.9;

			let delta = (now - state.lastFrameTime) / 16.67;
			state.lastFrameTime = now;
			delta = Math.min(delta, 2);

			const visibleForce =
				(state.targetVisible - state.currentVisible) * physics.values.navVisibleStiffness;
			state.visibleVelocity += visibleForce * delta;
			state.visibleVelocity *= Math.pow(physics.values.navVisibleDamping, delta);
			state.currentVisible += state.visibleVelocity * delta;
			state.currentVisible = Math.max(0, Math.min(state.currentVisible, 1));

			const compactForce =
				(state.targetCompact - state.currentCompact) * physics.values.navCompactStiffness;
			state.compactVelocity += compactForce * delta;
			state.compactVelocity *= Math.pow(physics.values.navCompactDamping, delta);
			state.currentCompact += state.compactVelocity * delta;
			state.currentCompact = Math.max(0, Math.min(state.currentCompact, 1));

			const surfaceForce =
				(state.targetSurface - state.currentSurface) * physics.values.navCompactStiffness;
			state.surfaceVelocity += surfaceForce * delta;
			state.surfaceVelocity *= Math.pow(physics.values.navCompactDamping, delta);
			state.currentSurface += state.surfaceVelocity * delta;
			state.currentSurface = Math.max(0, Math.min(state.currentSurface, 1));

			const easedCompact = 1 - Math.pow(1 - state.currentCompact, 3);
			const easedSurface = 1 - Math.pow(1 - state.currentSurface, 3);

			DOM.navbar.style.setProperty("--nav-visible", state.currentVisible);
			DOM.navbar.style.setProperty("--nav-compact", easedCompact);
			DOM.navbar.style.setProperty("--nav-surface", easedSurface);
			DOM.navbar.style.setProperty("--nav-height-progress", easedCompact);

			const velocityFactor = Math.round(Math.min(Math.abs(state.scrollVelocity) * 0.15, 6));
			DOM.navbar.style.setProperty("--nav-velocity-blur", velocityFactor);

			const refraction = Math.min(Math.abs(state.scrollVelocity) * 0.02, 1);
			DOM.navbar.style.setProperty("--nav-refraction", refraction);

			const velocityShadow = Math.min(Math.abs(state.scrollVelocity) * 0.02, 0.2);
			DOM.navbar.style.boxShadow =
				`0 ${10 * easedSurface}px ${40 * easedSurface}px rgba(0,0,0, ${0.45 * easedSurface + velocityShadow})`;

			if (DOM.hero) {
				const scrollY = window.scrollY;
				const progress = Math.min(scrollY / SETTINGS.thresholds.inertia, 1);

				DOM.hero.style.setProperty(
					"--hero-scale",
					1 - (progress * physics.values.heroScaleScrollFactor)
				);

				DOM.hero.style.setProperty(
					"--hero-brightness",
					1 - (progress * physics.values.heroBrightnessScrollFactor)
				);

				const targetParallax = scrollY * physics.values.heroParallaxFactor;
				const parallaxForce =
					(targetParallax - state.heroParallax) * physics.values.heroParallaxStiffness;

				state.heroParallaxVelocity += parallaxForce;
				state.heroParallaxVelocity *= physics.values.heroParallaxDamping;
				state.heroParallax += state.heroParallaxVelocity;

				DOM.hero.style.setProperty("--hero-parallax", `${state.heroParallax}px`);
			}

			const stillMoving =
				Math.abs(state.targetVisible - state.currentVisible) > 0.0005 ||
				Math.abs(state.visibleVelocity) > 0.0005 ||
				Math.abs(state.targetCompact - state.currentCompact) > 0.0005 ||
				Math.abs(state.compactVelocity) > 0.0005 ||
				Math.abs(state.targetSurface - state.currentSurface) > 0.0005 ||
				Math.abs(state.surfaceVelocity) > 0.0005;

			if (!stillMoving) {
				state.animationRunning = false;
				return;
			}

			requestAnimationFrame(this.animate.bind(this));
		},

		bindEvents() {
			if (DOM.navToggle && DOM.navMenu) {
				DOM.navToggle.addEventListener("click", (e) => {
					e.preventDefault();
					e.stopPropagation();
					this.isOpen() ? this.closeMenu() : this.openMenu();
				});
			}

			DOM.navLinks.forEach(link => {
				link.addEventListener("click", (e) => {
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

					const doScroll = () => {
						const mode = scrollEngine.getModeForTarget(target);
						scrollEngine.goTo(target, mode);
					};

					if (utils.isMobileViewport() && navbarModule.isOpen()) {
						const menu = DOM.navMenu;
						const isHeroTarget = target.classList?.contains("hero");

						navbarModule.closeMenu({ keepNavbarVisible: !isHeroTarget });

						let done = false;

						const finish = () => {
							if (done) return;
							done = true;
							menu?.removeEventListener("transitionend", onEnd);
							doScroll();
						};

						const onEnd = (evt) => {
							if (evt.target !== menu) return;
							finish();
						};

						menu?.addEventListener("transitionend", onEnd, { once: true });

						setTimeout(finish, 450);
						return;
					}

					doScroll();
				});
			});

			DOM.navLogo?.addEventListener("click", (e) => {
				e.preventDefault();
				e.stopPropagation();

				const goHome = () => {
					scrollEngine.goTo(DOM.hero, "hero-top");
				};

				if (utils.isMobileViewport() && this.isOpen()) {
					const menu = DOM.navMenu;

					this.closeMenu({ keepNavbarVisible: false });

					let done = false;

					const finish = () => {
						if (done) return;
						done = true;
						menu?.removeEventListener("transitionend", onEnd);
						goHome();
					};

					const onEnd = (evt) => {
						if (evt.target !== menu) return;
						finish();
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

				/* Jeder Klick außerhalb des Menüs soll nur das Menü schließen,
				   aber keine Folgeaktion auslösen */
				if (onCta || onSectionScrollHead) {
					e.preventDefault();
					e.stopPropagation();

					state.suppressNextClick = true;

					this.suppressCtaHoverTemporarily();
					uiModule.resetCtaMagnetic();
					this.closeMenu();
					return;
				}

				e.preventDefault();
				e.stopPropagation();
				state.suppressNextClick = true;
				this.closeMenu();
			});

			document.addEventListener("click", (e) => {
				if (!state.suppressNextClick) return;

				state.suppressNextClick = false;
				e.preventDefault();
				e.stopPropagation();
			}, true);

		},
		
		suppressCtaHoverTemporarily(duration = 700) {
			document.body.classList.add("suppress-cta-hover");

			if (state.suppressCtaHoverCleanup) {
				window.removeEventListener("pointermove", state.suppressCtaHoverCleanup);
				clearTimeout(state.suppressCtaHoverCleanup.__timeoutId);
			}

			const cleanup = (e) => {
				/* Nur echte Mausbewegung darf Hover wieder freigeben */
				if (e && e.pointerType && e.pointerType !== "mouse") return;

				document.body.classList.remove("suppress-cta-hover");
				window.removeEventListener("pointermove", cleanup);

				if (cleanup.__timeoutId) {
					clearTimeout(cleanup.__timeoutId);
				}

				state.suppressCtaHoverCleanup = null;
			};

			cleanup.__timeoutId = setTimeout(() => {
				document.body.classList.remove("suppress-cta-hover");
				window.removeEventListener("pointermove", cleanup);
				state.suppressCtaHoverCleanup = null;
			}, duration);

			state.suppressCtaHoverCleanup = cleanup;

			window.addEventListener("pointermove", cleanup);
		},

	};

	/* =========================================================
	   SECTION NAVIGATION MODULE
	========================================================= */	
	const sectionNavigationModule = {
		buildOrderedSections() {
			state.orderedSections = [
				document.querySelector(".hero"),
				document.querySelector("#about"),
				document.querySelector("#gallery"),
				document.querySelector("#services"),
				document.querySelector("#pricing"),
				document.querySelector("#testimonials"),
				document.querySelector("#contact")
			].filter(Boolean);
		},

		getSectionIndex(sectionEl) {
			return state.orderedSections.findIndex(section => section === sectionEl);
		},

		getSectionHomeY(sectionEl, navMode = "down") {
			if (!sectionEl) return 0;

			const isHeroTarget = sectionEl.classList?.contains("hero");
			const isFooterTarget = sectionEl.tagName?.toLowerCase() === "footer";

			const effectiveNavMode =
				isHeroTarget && navMode === "up-section" ? "hero-top" : navMode;

			const navOffset =
				isHeroTarget || isFooterTarget
					? 0
					: scrollEngine.getTargetNavOffset(effectiveNavMode);

			const shouldInsetByOnePixel =
				sectionEl.matches?.("#about, #gallery, #services, #pricing, #testimonials, #contact");

			const inset = shouldInsetByOnePixel ? physics.values.sectionScrollInset : 0;

			const rawY =
				sectionEl.getBoundingClientRect().top +
				window.pageYOffset -
				navOffset +
				inset;

			const maxScrollY = utils.getMaxScrollY();
			return Math.max(0, Math.min(rawY, maxScrollY));
		},
		
		isAtOwnSectionHomePosition(sectionEl, tolerance = 4) {
			if (!sectionEl) return false;

			const currentY = window.scrollY;
			const downHomeY = this.getSectionHomeY(sectionEl, "down");
			const upHomeY = this.getSectionHomeY(sectionEl, "up-section");

			return (
				Math.abs(currentY - downHomeY) <= tolerance ||
				Math.abs(currentY - upHomeY) <= tolerance
			);
		},
		
		navigateToSectionHome(sectionEl) {
			if (!sectionEl) return;

			const currentY = window.scrollY;
			const downHomeY = this.getSectionHomeY(sectionEl, "down");
			const upHomeY = this.getSectionHomeY(sectionEl, "up-section");

			const distanceToDown = Math.abs(currentY - downHomeY);
			const distanceToUp = Math.abs(currentY - upHomeY);

			const mode = distanceToUp < distanceToDown ? "up-section" : "down";
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
				if (!nextTarget) return;

				scrollEngine.goTo(nextTarget, "down");
				return;
			}

			if (direction === "prev" && allowPrev) {
				const prevTarget = state.orderedSections[currentIndex - 1] || null;
				if (!prevTarget) return;
				scrollEngine.goTo(prevTarget, "up-section");
			}
		},

		bindSectionNavigator(triggerEl, sectionEl, { allowPrev = true, headSelector = null } = {}) {
			if (!triggerEl || !sectionEl) return;

			let clickTimer = null;

			const isInteractiveElement = (target) => {
				return !!target.closest(
					'a, button, input, textarea, select, option, label, video, iframe, [role="button"], .pricing-tab, .cta-button'
				);
			};

			const isInsideHeadArea = (event) => {
				if (!headSelector) return true;

				const head = sectionEl.querySelector(headSelector);
				if (!head) return false;

				const rect = head.getBoundingClientRect();
				return event.clientY >= rect.top && event.clientY <= rect.bottom;
			};
			
			triggerEl.addEventListener("click", (e) => {
				if (isInteractiveElement(e.target)) return;
				if (!isInsideHeadArea(e)) return;

				e.preventDefault();
				e.stopPropagation();

				const isAtOwnHome = this.isAtOwnSectionHomePosition(sectionEl);

				/* FALL 2:
				   Nicht auf eigener y-section-home-position
				   -> keine Doppelclick-Logik, also sofort navigieren */
				if (!isAtOwnHome) {
					if (clickTimer) {
						clearTimeout(clickTimer);
						clickTimer = null;
					}

					this.navigateToSectionHome(sectionEl);
					return;
				}

				/* FALL 1:
				   Auf eigener y-section-home-position
				   -> Single-/Double-Click unterscheiden */
				if (clickTimer) clearTimeout(clickTimer);

				clickTimer = setTimeout(() => {
					clickTimer = null;
					this.navigateSection(sectionEl, "next", allowPrev);
				}, SETTINGS.thresholds.sectionNavClickDelay);
			});
			
			triggerEl.addEventListener("dblclick", (e) => {
				if (isInteractiveElement(e.target)) return;
				if (!isInsideHeadArea(e)) return;

				e.preventDefault();
				e.stopPropagation();

				if (clickTimer) {
					clearTimeout(clickTimer);
					clickTimer = null;
				}

				/* Doppelclick nur dann, wenn wir auf einer home-position sind */
				if (!this.isAtOwnSectionHomePosition(sectionEl)) return;
				
				this.navigateSection(sectionEl, "prev", allowPrev);
			});

			triggerEl.addEventListener("keydown", (e) => {
				if (headSelector) return;

				if (e.key === "Enter" || e.key === " ") {
					e.preventDefault();
		
					if (!this.isAtOwnSectionHomePosition(sectionEl)) {
						this.navigateToSectionHome(sectionEl);
						return;
					}
					
					this.navigateSection(sectionEl, "next", allowPrev);
				}
			});
		},
	
		bindEvents() {
			document.querySelectorAll("section").forEach(section => {
				if (section.classList.contains("hero")) return;

				this.bindSectionNavigator(section, section, {
					allowPrev: true,
					headSelector: ".section-scroll-head"
				});
			});

			this.bindDirectScrollTargets();
		},

		bindDirectScrollTargets() {
			document.querySelectorAll("[data-scroll-target]").forEach(triggerEl => {
				const targetSelector = triggerEl.getAttribute("data-scroll-target");
				const forcedMode = triggerEl.getAttribute("data-scroll-mode") || "down";

				if (!targetSelector) return;

				const go = () => {
					scrollEngine.goTo(targetSelector, forcedMode);
				};

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
	};

	/* =========================================================
	   SCROLL SECTION HINT MODULE
	========================================================= */
	const scrollSectionHintModule = {
		root: null,
		measurer: null,
		metricsCache: new Map(),
		hintA: null,
		hintB: null,
		updateRaf: null,
		liveTrackingRaf: null,
		liveTrackingActive: false,

		labels: {
			about: "ÜBER MICH",
			gallery: "VIDEO-FUN",
			services: "LEISTUNGEN",
			pricing: "PREISE",
			testimonials: "BEWERTUNGEN",
			contact: "KONTAKT"
		},

		build() {
			if (this.root) return;

			this.root = document.createElement("div");
			this.root.className = "scroll-section-hints";
			this.root.setAttribute("aria-hidden", "true");

			this.root.innerHTML = `
				<div class="scroll-section-hint-anchor scroll-section-hint-anchor--a">
					<div class="scroll-section-hint scroll-section-hint--a">
						<span class="scroll-section-hint-text scroll-section-hint-base"></span>
					</div>
				</div>

				<div class="scroll-section-hint-anchor scroll-section-hint-anchor--b">
					<div class="scroll-section-hint scroll-section-hint--b">
						<span class="scroll-section-hint-text scroll-section-hint-base"></span>
					</div>
				</div>
			`;

			document.body.appendChild(this.root);

			this.measurer = document.createElement("span");
			this.measurer.className = "scroll-section-hint-measurer";
			document.body.appendChild(this.measurer);

			this.hintA = this.root.querySelector(".scroll-section-hint--a");
			this.hintB = this.root.querySelector(".scroll-section-hint--b");
			
		},

		bindHintClicks() {
			[this.hintA, this.hintB].forEach(hintEl => {
				if (!hintEl) return;

				const anchor = hintEl.parentElement;
				if (!anchor) return;

				anchor.setAttribute("tabindex", "0");
				anchor.setAttribute("role", "button");

				const goToHintTarget = () => {
					const targetSelector = hintEl.dataset.scrollTarget;
					const opacity = parseFloat(hintEl.style.opacity || "0");
					const text = hintEl.textContent || "";

					if (!targetSelector || opacity <= 0.01) return;

					const forcedMode = text.includes(">>") ? "down" : "up-section";
					scrollEngine.goTo(targetSelector, forcedMode);
				};

				anchor.addEventListener("click", (e) => {
					e.preventDefault();
					e.stopPropagation();
					goToHintTarget();
				});

				anchor.addEventListener("keydown", (e) => {
					if (e.key !== "Enter" && e.key !== " ") return;

					e.preventDefault();
					e.stopPropagation();
					goToHintTarget();
				});
			});
		},

		getContentSections() {
			return state.orderedSections.filter(section => {
				if (!section) return false;
				if (section.classList?.contains("hero")) return true;
				return !!section.id && !!this.labels[section.id];
			});
		},

		getViewportHeight() {
			return window.visualViewport?.height || window.innerHeight;
		},

		getViewportOffsetTop() {
			return window.visualViewport?.offsetTop || 0;
		},

		getNavbarBottom() {
			if (!DOM.navbar) {
				return utils.getRootNumber("--nav-height", 78);
			}

			const navRect = DOM.navbar.getBoundingClientRect();
			return navRect.bottom - this.getViewportOffsetTop();
		},

		getBoundaryGapPx() {
			return utils.getRootRemPx("--section-hint-boundary-gap", 4.8);
		},

		getSectionContext() {
			const sections = this.getContentSections();
			if (!sections.length) return null;

			const navbarBottom = this.getNavbarBottom();
			let currentIndex = 0;

			for (let i = 0; i < sections.length; i++) {
				const section = sections[i];

				if (section.classList?.contains("hero")) {
					const heroBottom = section.getBoundingClientRect().bottom;
					if (heroBottom > navbarBottom) {
						currentIndex = i;
						break;
					}
					continue;
				}

				const rect = section.getBoundingClientRect();
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
				overnext: sections[currentIndex + 2] || null
			};
		},

		measureHint(text) {
			if (!this.measurer) return { width: 0, height: 0 };

			const key = text || " ";
			const cached = this.metricsCache.get(key);
			if (cached) return cached;

			this.measurer.textContent = key;
			const rect = this.measurer.getBoundingClientRect();

			const metrics = {
				width: rect.width || 0,
				height: rect.height || 0
			};

			this.metricsCache.set(key, metrics);
			return metrics;
		},

		getRotatedBandLength(text) {
			return this.measureHint(text).width || 0;
		},

		getTopDockTop(text, gap) {
			const navHeight = utils.getRootNumber("--nav-height", 78);
			const { width, height } = this.measureHint(text);
			const rotatedBandLength = width || 0;
			const correction = Math.max(0, (rotatedBandLength - height) / 2);

			return navHeight + gap + correction;
		},

		getBottomDockTop(text, gap) {
			const viewportHeight = this.getViewportHeight();
			const { width, height } = this.measureHint(text);
			const rotatedBandLength = width || 0;
			const correction = (rotatedBandLength + height) / 2;

			return viewportHeight - gap - correction;
		},
		
		getBoundaryBelowTop(text, changeY, gap) {
			const { width, height } = this.measureHint(text);
			const rotatedBandLength = width || 0;
			const correction = Math.max(0, (rotatedBandLength - height) / 2);

			return changeY + gap + correction;
		},

		getBoundaryAboveTop(text, changeY, gap) {
			const { width, height } = this.measureHint(text);
			const rotatedBandLength = width || 0;
			const correction = (rotatedBandLength + height) / 2;

			return changeY - gap - correction;
		},

		setAnchorTop(hintEl, topPx) {
			const anchor = hintEl?.parentElement;
			if (!anchor) return;
			anchor.style.top = `${Math.round(topPx * 2) / 2}px`;
		},

		setHint(hintEl, {
			text = "",
			top = 0,
			y = 0,
			opacity = 0,
			theme = "dark",
			target = ""
		} = {}) {
			if (!hintEl) return;

			const anchor = hintEl.parentElement;
			const base = hintEl.querySelector(".scroll-section-hint-base");
			const visible = !!text && opacity > 0.001;

			if (base) base.textContent = text;

			this.setAnchorTop(hintEl, top);
			hintEl.style.opacity = `${Math.max(0, Math.min(1, opacity))}`;
			hintEl.dataset.theme = theme;
			hintEl.dataset.scrollTarget = target || "";
			hintEl.classList.toggle("is-empty", !visible);

			if (anchor) {
				anchor.style.pointerEvents = visible ? "auto" : "none";
				anchor.style.opacity = visible ? "1" : "0";
				anchor.setAttribute("aria-hidden", visible ? "false" : "true");
			}
		},

		hideHint(hintEl) {
			this.setHint(hintEl, {
				text: "",
				top: 0,
				y: 0,
				opacity: 0,
				target: ""
			});
		},

		hideAll() {
			this.hideHint(this.hintA);
			this.hideHint(this.hintB);
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

			if (value === "transparent" || value === "rgba(0, 0, 0, 0)") {
				return null;
			}

			const rgbMatch = value.match(/rgba?\(([^)]+)\)/);
			if (rgbMatch) {
				const parts = rgbMatch[1].split(",").map(part => parseFloat(part.trim()));
				if (parts.length >= 3 && parts.slice(0, 3).every(Number.isFinite)) {
					return { r: parts[0], g: parts[1], b: parts[2] };
				}
			}

			const hexMatch = value.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
			if (hexMatch) {
				let hex = hexMatch[1];

				if (hex.length === 3) {
					hex = hex.split("").map(ch => ch + ch).join("");
				}

				const intVal = parseInt(hex, 16);
				return {
					r: (intVal >> 16) & 255,
					g: (intVal >> 8) & 255,
					b: intVal & 255
				};
			}

			return null;
		},

		getRelativeLuminance({ r, g, b }) {
			const normalize = (channel) => {
				const v = channel / 255;
				return v <= 0.03928
					? v / 12.92
					: Math.pow((v + 0.055) / 1.055, 2.4);
			};

			const R = normalize(r);
			const G = normalize(g);
			const B = normalize(b);

			return 0.2126 * R + 0.7152 * G + 0.0722 * B;
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
				this.getRgbFromColorString(getComputedStyle(document.body).backgroundColor) ||
				{ r: 250, g: 250, b: 248 };

			const luminance = this.getRelativeLuminance(rgb);
			return luminance < 0.42 ? "light" : "dark";
		},

		classifyCase(changeY, bandTop, bandBottom) {
			if (!Number.isFinite(changeY)) return 1;
			if (changeY <= bandTop || changeY >= bandBottom) return 1;

			const bandHeight = bandBottom - bandTop;
			if (bandHeight <= 0) return 1;

			const rel = changeY - bandTop;
			const third = bandHeight / 3;

			if (rel < third) return 2;
			if (rel < third * 2) return 3;
			return 4;
		},

		applyHint(hintEl, section, {
			variant = "forward",
			top = 0,
			y = 0,
			opacity = 1
		} = {}) {
			if (!section) {
				this.hideHint(hintEl);
				return;
			}

			const text = this.makeText(section, variant);
			const theme = this.getSectionTheme(section);
			const target = section.id ? `#${section.id}` : "";

			this.setHint(hintEl, {
				text,
				top,
				y,
				opacity: text ? opacity : 0,
				theme,
				target
			});
		},

		buildGeometry(context) {
			const gap = this.getBoundaryGapPx();
			const navbarBottom = this.getNavbarBottom();
			const viewportBottom = this.getViewportHeight();

			const bandTop = navbarBottom;
			const bandBottom = viewportBottom;

			const { current, next } = context;

			const currentText = this.makeText(current, "forward");
			const nextForwardText = next ? this.makeText(next, "forward") : "";
			const nextBackwardText = next ? this.makeText(next, "backward") : "";
			
			const currentTop = this.getTopDockTop(currentText, gap);
			const bottomDockTop = next ? this.getBottomDockTop(nextBackwardText, gap) : 0;		

			const nextRect = next?.getBoundingClientRect() || null;
			const changeY = nextRect ? nextRect.top : Number.POSITIVE_INFINITY;
			
			const nextBelowBoundaryTop = next
				? this.getBoundaryBelowTop(nextForwardText, changeY, gap)
				: 0;

			const nextAboveBoundaryTop = next
				? this.getBoundaryAboveTop(nextBackwardText, changeY, gap)
				: 0;
			
			return {
				gap,
				bandTop,
				bandBottom,
				currentText,
				nextForwardText,
				nextBackwardText,
				currentTop,
				bottomDockTop,
				changeY,
				nextBelowBoundaryTop,
				nextAboveBoundaryTop
			};
		},
		
		renderSingleCurrent(current, geometry) {
			this.applyHint(this.hintA, current, {
				variant: "forward",
				top: geometry.currentTop,
				y: 0,
				opacity: 1
			});
			this.hideHint(this.hintB);
		},

		renderCurrentAndBottomNext(current, next, geometry) {
			this.applyHint(this.hintA, current, {
				variant: "forward",
				top: geometry.currentTop,
				y: 0,
				opacity: 1
			});

			if (next) {
				this.applyHint(this.hintB, next, {
					variant: "backward",
					top: geometry.bottomDockTop,
					y: 0,
					opacity: 1
				});
			} else {
				this.hideHint(this.hintB);
			}
		},

		renderNextAndBottomOvernext(next, overnext, geometry) {
			this.applyHint(this.hintA, next, {
				variant: "forward",
				top: geometry.nextBelowBoundaryTop,
				y: 0,
				opacity: 1
			});

			if (overnext) {
				this.applyHint(this.hintB, overnext, {
					variant: "backward",
					top: this.getBottomDockTop(this.makeText(overnext, "backward"), geometry.gap),
					y: 0,
					opacity: 1
				});
			} else {
				this.hideHint(this.hintB);
			}
		},

		renderCurrentAndNextForward(current, next, geometry) {
			this.applyHint(this.hintA, current, {
				variant: "forward",
				top: geometry.currentTop,
				y: 0,
				opacity: 1
			});

			this.applyHint(this.hintB, next, {
				variant: "forward",
				top: geometry.nextBelowBoundaryTop,
				y: 0,
				opacity: 1
			});
		},
		
		renderCurrentAndNextBackward(current, next, geometry) {
			this.applyHint(this.hintA, current, {
				variant: "forward",
				top: geometry.currentTop,
				y: 0,
				opacity: 1
			});

			this.applyHint(this.hintB, next, {
				variant: "backward",
				top: geometry.nextAboveBoundaryTop,
				y: 0,
				opacity: 1
			});
		},	
		
		handleHomeCase(caseNumber, context, geometry) {
			const { next, overnext } = context;

			if (caseNumber === 1 || caseNumber === 4) {
				this.hideAll();
				return true;
			}

			if (caseNumber === 2) {
				this.renderNextAndBottomOvernext(next, overnext, geometry);
				return true;
			}

			if (caseNumber === 3) {
				this.applyHint(this.hintA, next, {
					variant: "forward",
					top: geometry.nextBelowBoundaryTop,
					y: 0,
					opacity: 1
				});
				this.hideHint(this.hintB);
				return true;
			}

			return false;
		},

		handleStandardCase(caseNumber, context, geometry) {
			const { current, next, overnext } = context;

			if (caseNumber === 1) {
				this.renderCurrentAndBottomNext(current, next, geometry);
				return true;
			}

			if (caseNumber === 2) {
				this.renderNextAndBottomOvernext(next, overnext, geometry);
				return true;
			}

			if (caseNumber === 3) {
				this.renderCurrentAndNextForward(current, next, geometry);
				return true;
			}

			if (caseNumber === 4) {
				this.renderCurrentAndNextBackward(current, next, geometry);
				return true;
			}

			return false;
		},

		update() {
			if (!this.root) return;

			const context = this.getSectionContext();
			if (!context?.current) {
				this.hideAll();
				return;
			}

			const { current, next } = context;
			const isHomeCurrent =
				current?.classList?.contains("hero") ||
				current?.id === "home";

			const geometry = this.buildGeometry(context);

			if (!isHomeCurrent && !next) {
				this.renderSingleCurrent(current, geometry);
				return;
			}

			const caseNumber = next
				? this.classifyCase(geometry.changeY, geometry.bandTop, geometry.bandBottom)
				: 1;

			if (isHomeCurrent) {
				if (this.handleHomeCase(caseNumber, context, geometry)) return;
			}

			if (this.handleStandardCase(caseNumber, context, geometry)) return;

			this.hideAll();
		},

		scheduleUpdate() {
			if (this.updateRaf) return;

			this.updateRaf = requestAnimationFrame(() => {
				this.updateRaf = null;
				this.update();
			});
		},

		startLiveTracking() {
			if (this.liveTrackingActive) return;
			this.liveTrackingActive = true;

			const tick = () => {
				if (!this.liveTrackingActive) return;
				this.update();
				this.liveTrackingRaf = requestAnimationFrame(tick);
			};

			this.liveTrackingRaf = requestAnimationFrame(tick);
		},

		stopLiveTracking() {
			this.liveTrackingActive = false;

			if (this.liveTrackingRaf) {
				cancelAnimationFrame(this.liveTrackingRaf);
				this.liveTrackingRaf = null;
			}
		},

		bindEvents() {
			window.addEventListener("scroll", () => this.scheduleUpdate(), { passive: true });

			window.addEventListener("resize", () => {
				this.metricsCache.clear();
				this.scheduleUpdate();
			});

			window.addEventListener("orientationchange", () => {
				setTimeout(() => {
					this.metricsCache.clear();
					this.scheduleUpdate();
				}, 120);
			});

			window.addEventListener("touchstart", () => this.startLiveTracking(), { passive: true });

			window.addEventListener("touchend", () => {
				this.stopLiveTracking();
				this.scheduleUpdate();
			}, { passive: true });

			window.addEventListener("touchcancel", () => {
				this.stopLiveTracking();
				this.scheduleUpdate();
			}, { passive: true });

			if (window.visualViewport) {
				window.visualViewport.addEventListener("resize", () => {
					this.metricsCache.clear();
					this.scheduleUpdate();
				}, { passive: true });

				window.visualViewport.addEventListener("scroll", () => {
					this.scheduleUpdate();
				}, { passive: true });
			}
		},

		init() {
			this.build();
			this.bindHintClicks();
			this.update();
			this.bindEvents();
		}
	};

	/* =========================================================
	   GALLERY MODULE
	========================================================= */
	const galleryModule = {
		videos: [],
		currentIndex: 1,
		isAnimating: false,
		startX: 0,
		isDragging: false,

		buildVideos() {
			if (!DOM.track) return;

			const shuffled = utils.shuffle([...SETTINGS.gallery.videoFiles]);
			const firstCloneSrc = shuffled[0];
			const lastCloneSrc = shuffled[shuffled.length - 1];
			const fullList = [lastCloneSrc, ...shuffled, firstCloneSrc];

			fullList.forEach(src => {
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
					video.paused ? utils.safePlay(video) : video.pause();
				});

				video.addEventListener("ended", () => this.moveTo(this.currentIndex + 1, true));

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
				this.videos.forEach(v => v.pause());
			}
		},

		bindTrackEvents() {
			if (!DOM.track) return;

			DOM.track.addEventListener("transitionend", () => {
				this.isAnimating = false;

				if (this.currentIndex === this.videos.length - 1) this.currentIndex = 1;
				if (this.currentIndex === 0) this.currentIndex = this.videos.length - 2;

				requestAnimationFrame(() => this.setPosition(this.currentIndex, false));
			});

			DOM.track.style.touchAction = "pan-y";

			DOM.track.addEventListener("touchstart", (e) => {
				if (utils.isMobileViewport() && navbarModule.isOpen()) {
					e.preventDefault();
					return;
				}

				this.startX = e.touches[0].clientX;
				this.isDragging = true;
				DOM.track.style.transition = "none";
			}, { passive: false });

			DOM.track.addEventListener("touchmove", (e) => {
				if (utils.isMobileViewport() && navbarModule.isOpen()) {
					e.preventDefault();
					return;
				}

				if (!this.isDragging || !this.videos.length) return;

				const diff = e.touches[0].clientX - this.startX;
				const videoWidth = this.videos[0].offsetWidth;
				const padding = DOM.track.parentElement.offsetWidth * 0.1;

				DOM.track.style.transform =
					`translateX(${-this.currentIndex * videoWidth + diff - padding}px)`;
			}, { passive: false });

			DOM.track.addEventListener("touchend", (e) => {
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
			});
		},

		bindVisibilityEvents() {
			const gallerySection = document.querySelector(".gallery");
			if (gallerySection) {
				const observer = new IntersectionObserver((entries) => {
					entries.forEach(entry => {
						if (!this.videos[this.currentIndex]) return;
						entry.isIntersecting
							? this.playOnly(this.currentIndex)
							: this.videos.forEach(v => v.pause());
					});
				}, { threshold: 0.4 });

				observer.observe(gallerySection);
			}

			document.addEventListener("visibilitychange", () => {
				document.hidden
					? this.videos.forEach(v => v.pause())
					: this.playOnly(this.currentIndex);
			});

			window.addEventListener("resize", () => this.setPosition(this.currentIndex, false));
		},

		init() {
			if (!DOM.track) return;

			this.buildVideos();
			this.setPosition(this.currentIndex, false);
			this.playOnly(this.currentIndex);
			this.bindTrackEvents();
			this.bindVisibilityEvents();
		}
	};

	/* =========================================================
	   UI MODULE
	========================================================= */
	const uiModule = {
		ctaMagneticButtons: [],
		ctaMagneticRunning: false,
		ctaMagneticLastFrame: 0,

		resetCtaMagnetic() {
			this.ctaMagneticButtons.forEach(item => {
				item.button.classList.remove("is-magnetic-near");
				item.button.classList.remove("is-hovered");

				item.targetX = 0;
				item.targetY = 0;
				item.targetScale = 1;
				item.targetShadowY = 0;
				item.targetShadowBlur = 0;
				item.targetShadowAlpha = 0;

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

				item.button.style.setProperty("--magnetic-x", "0px");
				item.button.style.setProperty("--magnetic-y", "0px");
				item.button.style.setProperty("--magnetic-scale", "1");
				item.button.style.setProperty("--magnetic-shadow-y", "0px");
				item.button.style.setProperty("--magnetic-shadow-blur", "0px");
				item.button.style.setProperty("--magnetic-shadow-alpha", "0");
				
				item.targetLabelX = 0;
				item.targetLabelY = 0;
				item.targetLabelScale = 1;

				item.currentLabelX = 0;
				item.currentLabelY = 0;
				item.currentLabelScale = 1;

				item.velocityLabelX = 0;
				item.velocityLabelY = 0;
				item.velocityLabelScale = 0;

				item.targetGlossX = 50;
				item.targetGlossY = 50;
				item.targetGlossOpacity = 0;

				item.currentGlossX = 50;
				item.currentGlossY = 50;
				item.currentGlossOpacity = 0;

				item.velocityGlossX = 0;
				item.velocityGlossY = 0;
				item.velocityGlossOpacity = 0;

				item.button.style.setProperty("--label-x", "0px");
				item.button.style.setProperty("--label-y", "0px");
				item.button.style.setProperty("--label-scale", "1");

				item.button.style.setProperty("--gloss-x", "50%");
				item.button.style.setProperty("--gloss-y", "50%");
				item.button.style.setProperty("--gloss-opacity", "0");
				
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

			this.ctaMagneticButtons.forEach(item => {
				const spring = item.isNear ? 0.16 : 0.11;
				const damping = item.isNear ? 0.78 : 0.82;

				const stepSpring = (current, target, velocity) => {
					const force = (target - current) * spring;
					velocity += force * delta;
					velocity *= Math.pow(damping, delta);
					current += velocity * delta;
					return { current, velocity };
				};

				let result;

				result = stepSpring(item.currentX, item.targetX, item.velocityX);
				item.currentX = result.current;
				item.velocityX = result.velocity;

				result = stepSpring(item.currentY, item.targetY, item.velocityY);
				item.currentY = result.current;
				item.velocityY = result.velocity;

				result = stepSpring(item.currentScale, item.targetScale, item.velocityScale);
				item.currentScale = result.current;
				item.velocityScale = result.velocity;

				result = stepSpring(item.currentShadowY, item.targetShadowY, item.velocityShadowY);
				item.currentShadowY = result.current;
				item.velocityShadowY = result.velocity;

				result = stepSpring(item.currentShadowBlur, item.targetShadowBlur, item.velocityShadowBlur);
				item.currentShadowBlur = result.current;
				item.velocityShadowBlur = result.velocity;

				result = stepSpring(item.currentShadowAlpha, item.targetShadowAlpha, item.velocityShadowAlpha);
				item.currentShadowAlpha = result.current;
				item.velocityShadowAlpha = result.velocity;

				result = stepSpring(item.currentLabelX, item.targetLabelX, item.velocityLabelX);
				item.currentLabelX = result.current;
				item.velocityLabelX = result.velocity;

				result = stepSpring(item.currentLabelY, item.targetLabelY, item.velocityLabelY);
				item.currentLabelY = result.current;
				item.velocityLabelY = result.velocity;

				result = stepSpring(item.currentLabelScale, item.targetLabelScale, item.velocityLabelScale);
				item.currentLabelScale = result.current;
				item.velocityLabelScale = result.velocity;

				result = stepSpring(item.currentGlossX, item.targetGlossX, item.velocityGlossX);
				item.currentGlossX = result.current;
				item.velocityGlossX = result.velocity;

				result = stepSpring(item.currentGlossY, item.targetGlossY, item.velocityGlossY);
				item.currentGlossY = result.current;
				item.velocityGlossY = result.velocity;

				result = stepSpring(item.currentGlossOpacity, item.targetGlossOpacity, item.velocityGlossOpacity);
				item.currentGlossOpacity = result.current;
				item.velocityGlossOpacity = result.velocity;

				item.button.style.setProperty("--magnetic-x", `${item.currentX.toFixed(2)}px`);
				item.button.style.setProperty("--magnetic-y", `${item.currentY.toFixed(2)}px`);
				item.button.style.setProperty("--magnetic-scale", item.currentScale.toFixed(4));
				item.button.style.setProperty("--magnetic-shadow-y", `${item.currentShadowY.toFixed(2)}px`);
				item.button.style.setProperty("--magnetic-shadow-blur", `${item.currentShadowBlur.toFixed(2)}px`);
				item.button.style.setProperty("--magnetic-shadow-alpha", item.currentShadowAlpha.toFixed(3));
				
				item.button.style.setProperty("--label-x", `${item.currentLabelX.toFixed(2)}px`);
				item.button.style.setProperty("--label-y", `${item.currentLabelY.toFixed(2)}px`);
				item.button.style.setProperty("--label-scale", item.currentLabelScale.toFixed(4));

				item.button.style.setProperty("--gloss-x", `${item.currentGlossX.toFixed(2)}%`);
				item.button.style.setProperty("--gloss-y", `${item.currentGlossY.toFixed(2)}%`);
				item.button.style.setProperty("--gloss-opacity", item.currentGlossOpacity.toFixed(3));

				const moving =
					Math.abs(item.targetX - item.currentX) > 0.01 ||
					Math.abs(item.targetY - item.currentY) > 0.01 ||
					Math.abs(item.targetScale - item.currentScale) > 0.001 ||
					Math.abs(item.targetShadowY - item.currentShadowY) > 0.01 ||
					Math.abs(item.targetShadowBlur - item.currentShadowBlur) > 0.01 ||
					Math.abs(item.targetShadowAlpha - item.currentShadowAlpha) > 0.001 ||

					Math.abs(item.targetLabelX - item.currentLabelX) > 0.01 ||
					Math.abs(item.targetLabelY - item.currentLabelY) > 0.01 ||
					Math.abs(item.targetLabelScale - item.currentLabelScale) > 0.001 ||

					Math.abs(item.targetGlossX - item.currentGlossX) > 0.01 ||
					Math.abs(item.targetGlossY - item.currentGlossY) > 0.01 ||
					Math.abs(item.targetGlossOpacity - item.currentGlossOpacity) > 0.001 ||

					Math.abs(item.velocityX) > 0.01 ||
					Math.abs(item.velocityY) > 0.01 ||
					Math.abs(item.velocityScale) > 0.001 ||
					Math.abs(item.velocityShadowY) > 0.01 ||
					Math.abs(item.velocityShadowBlur) > 0.01 ||
					Math.abs(item.velocityShadowAlpha) > 0.001 ||

					Math.abs(item.velocityLabelX) > 0.01 ||
					Math.abs(item.velocityLabelY) > 0.01 ||
					Math.abs(item.velocityLabelScale) > 0.001 ||

					Math.abs(item.velocityGlossX) > 0.01 ||
					Math.abs(item.velocityGlossY) > 0.01 ||
					Math.abs(item.velocityGlossOpacity) > 0.001;

				if (moving) hasMotion = true;
			});

			if (!hasMotion) {
				this.ctaMagneticRunning = false;
				return;
			}

			requestAnimationFrame(this.animateCtaMagnetic.bind(this));
		},

		bindCTA() {
			DOM.cta?.addEventListener("click", (e) => {
				e.preventDefault();
				e.stopPropagation();

				if (utils.isMobileViewport() && navbarModule.isOpen()) {
					navbarModule.closeMenu();

					requestAnimationFrame(() => {
						scrollEngine.goTo("#contact", "down");
					});
					return;
				}

				scrollEngine.goTo("#contact", "down");
			});

			const buttons = [...document.querySelectorAll(".cta-button")];
		
			this.ctaMagneticButtons = buttons.map(button => ({
				button,
				label: button.querySelector(".cta-label"),
				gloss: button.querySelector(".cta-gloss"),
				isNear: false,

				/* OUTER */
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

				/* INNER LABEL */
				targetLabelX: 0,
				targetLabelY: 0,
				targetLabelScale: 1,

				currentLabelX: 0,
				currentLabelY: 0,
				currentLabelScale: 1,

				velocityLabelX: 0,
				velocityLabelY: 0,
				velocityLabelScale: 0,

				/* GLOSS */
				targetGlossX: 50,
				targetGlossY: 50,
				targetGlossOpacity: 0,

				currentGlossX: 50,
				currentGlossY: 50,
				currentGlossOpacity: 0,

				velocityGlossX: 0,
				velocityGlossY: 0,
				velocityGlossOpacity: 0
			}));
			
			const resetButtonTarget = (item) => {
				item.isNear = false;
				item.button.classList.remove("is-magnetic-near");
				item.button.classList.remove("is-hovered");

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
			};

			const applyMagneticField = (item, clientX, clientY) => {
				const btn = item.button;

				if (document.body.classList.contains("nav-menu-open")) {
					resetButtonTarget(item);
					return;
				}

				if (utils.isMobileViewport() && navbarModule.isOpen()) {
					resetButtonTarget(item);
					return;
				}

				if (document.body.classList.contains("suppress-cta-hover")) {
					resetButtonTarget(item);
					return;
				}

				const rect = btn.getBoundingClientRect();

				const centerX = rect.left + rect.width / 2;
				const centerY = rect.top + rect.height / 2;

				const dx = clientX - centerX;
				const dy = clientY - centerY;

				const outerRadiusX = rect.width * 1.15;
				const outerRadiusY = rect.height * 1.9;

				const nx = dx / outerRadiusX;
				const ny = dy / outerRadiusY;
				const rawDistance = Math.sqrt(nx * nx + ny * ny);

				if (rawDistance > 1) {
					resetButtonTarget(item);
					return;
				}

				item.isNear = true;
				btn.classList.add("is-magnetic-near");

				const proximity = 1 - rawDistance;
				const eased = 1 - Math.pow(1 - proximity, 3);
				const shaped = Math.pow(eased, 1.6);

				const innerNX = dx / (rect.width / 2);
				const innerNY = dy / (rect.height / 2);
				const innerDistance = Math.sqrt(innerNX * innerNX + innerNY * innerNY);
				const insideButton = innerDistance <= 1;

				const innerProximity = insideButton ? (1 - innerDistance) : 0;
				const innerBoost = insideButton
					? Math.pow(1 - Math.pow(1 - innerProximity, 3), 1.15)
					: 0;

				const combinedStrength = insideButton
					? Math.min(0.32 * shaped + 0.68 * innerBoost, 1)
					: Math.min(0.62 * shaped, 0.5);

				const length = Math.hypot(dx, dy) || 1;
				const dirX = dx / length;
				const dirY = dy / length;

				const maxShiftX = Math.min(rect.width * 0.12, 15);
				const maxShiftY = Math.min(rect.height * 0.26, 11);

				item.targetX = dirX * maxShiftX * combinedStrength;
				item.targetY = dirY * maxShiftY * combinedStrength;
				item.targetScale = 1 + (combinedStrength * 0.014);
				item.targetShadowY = 10 + (combinedStrength * 12);
				item.targetShadowBlur = 28 + (combinedStrength * 20);
				item.targetShadowAlpha = 0.12 + (combinedStrength * 0.18);
				
				const labelShiftX = Math.min(rect.width * 0.065, 10);
				const labelShiftY = Math.min(rect.height * 0.11, 6);

				item.targetLabelX = dirX * labelShiftX * Math.min(combinedStrength * 1.18, 1);
				item.targetLabelY = dirY * labelShiftY * Math.min(combinedStrength * 1.18, 1);
				item.targetLabelScale = 1 + (combinedStrength * 0.01);

				/* Pointerposition relativ im Button -> Gloss */
				const localX = ((clientX - rect.left) / rect.width) * 100;
				const localY = ((clientY - rect.top) / rect.height) * 100;

				item.targetGlossX = Math.max(0, Math.min(localX, 100));
				item.targetGlossY = Math.max(0, Math.min(localY, 100));
				item.targetGlossOpacity = 0.18 + (combinedStrength * 0.24);

			};

			const handlePointerMove = (e) => {
				if (e.pointerType !== "mouse") {
					this.ctaMagneticButtons.forEach(item => resetButtonTarget(item));
					this.startCtaMagneticAnimation();
					return;
				}

				this.ctaMagneticButtons.forEach(item => {
					applyMagneticField(item, e.clientX, e.clientY);
				});
				this.startCtaMagneticAnimation();
			};
			
			const handlePointerLeaveWindow = () => {
				this.ctaMagneticButtons.forEach(item => resetButtonTarget(item));
				this.startCtaMagneticAnimation();
			};

			window.addEventListener("pointermove", handlePointerMove, { passive: true });
			window.addEventListener("pointerleave", handlePointerLeaveWindow);

			this.ctaMagneticButtons.forEach(item => {
				item.button.addEventListener("blur", () => {
					resetButtonTarget(item);
					this.startCtaMagneticAnimation();
				});
			});

			this.ctaMagneticButtons.forEach(item => {
				item.button.addEventListener("pointerenter", (e) => {
					if (e.pointerType !== "mouse") return;
					if (document.body.classList.contains("suppress-cta-hover")) return;
					if (document.body.classList.contains("nav-menu-open")) return;

					item.button.classList.add("is-hovered");
				});

				item.button.addEventListener("pointerleave", () => {
					item.button.classList.remove("is-hovered");
				});

				item.button.addEventListener("pointerdown", (e) => {
					if (e.pointerType !== "mouse") {
						item.button.classList.remove("is-hovered");
					}
				});

				item.button.addEventListener("blur", () => {
					item.button.classList.remove("is-hovered");
				});
			});
		},
		
		bindHeroClickBehavior() {
			DOM.hero?.addEventListener("click", (e) => {
				if (!DOM.navbar) return;
				if (utils.isMobileViewport() && navbarModule.isOpen()) return;

				const clickedCTA = e.target.closest(".cta-button");

				if (clickedCTA) return;

				const visible = parseFloat(
					getComputedStyle(DOM.navbar).getPropertyValue("--nav-visible")
				);

				const newTarget = visible < 0.5 ? 1 : 0;

				state.targetVisible = newTarget;
				state.targetCompact = newTarget;
				state.targetSurface = newTarget;
				state.manualNavbarOpen = newTarget === 1;

				navbarModule.startAnimation();
			});
		},

		bindPricingTabs() {
			DOM.pricingTabs.forEach(tab => {
				tab.addEventListener("click", () => {
					if (utils.isMobileViewport() && navbarModule.isOpen()) return;

					DOM.pricingTabs.forEach(t => t.classList.remove("active"));
					DOM.pricingContents.forEach(c => c.classList.remove("active"));

					tab.classList.add("active");
					const target = document.getElementById(tab.dataset.tab);
					if (target) target.classList.add("active");
				});
			});
		},

		setInitialVisualState() {
			if (DOM.hero) {
				DOM.hero.style.setProperty(
					"--hero-brightness",
					1 - (Math.min(window.scrollY / window.innerHeight, 1) * physics.values.heroBrightnessScrollFactor)
				);
			}

			if (DOM.navbar && utils.prefersReducedMotion()) {
				DOM.navbar.style.setProperty("--nav-visible", 1);
				DOM.navbar.style.setProperty("--nav-compact", 1);
				DOM.navbar.style.setProperty("--nav-surface", 1);
				DOM.navbar.style.setProperty("--nav-height-progress", 1);
			}

			if (DOM.year) {
				DOM.year.textContent = new Date().getFullYear();
			}
		}
	};

	/* =========================================================
	   USER SCROLL INTERRUPT
	========================================================= */
	function bindUserScrollInterrupts() {
		const interrupt = () => {
			scrollEngine.cancelActiveScroll();
		};

		window.addEventListener("wheel", interrupt, { passive: true });
		window.addEventListener("touchstart", interrupt, { passive: true });
	}

	/* =========================================================
	   SCROLL SECTION HINT POSITION MODULE
	========================================================= */
	const scrollSectionHintPositionModule = {
		update() {
			const hintsRoot = document.querySelector(".scroll-section-hints");
			if (!hintsRoot) return;

			const referenceColumn =
				document.querySelector("#about .about-text") ||
				document.querySelector("#about .container") ||
				document.querySelector("section .container");

			if (!referenceColumn) return;

			const rect = referenceColumn.getBoundingClientRect();
			const contentLeft = rect.left;

			/* Mittelpunkt zwischen linkem Viewportrand und linkem Rand der Textspalte */
			const hintCenterX = contentLeft / 2;

			hintsRoot.style.setProperty("--scroll-hint-column-center", `${hintCenterX}px`);
		},

		init() {
			this.update();

			window.addEventListener("resize", () => this.update());

			window.addEventListener("orientationchange", () => {
				setTimeout(() => this.update(), 120);
			});

			window.addEventListener("pageshow", () => {
				requestAnimationFrame(() => this.update());
			});

			if (document.fonts?.ready) {
				document.fonts.ready.then(() => this.update());
			}
		}
	};

	/* =========================================================
	   INIT
	========================================================= */
	function init() {
		physics.update();
		sectionNavigationModule.buildOrderedSections();

		navbarModule.bindEvents();
		sectionNavigationModule.bindEvents();
		scrollSectionHintModule.init();
		scrollSectionHintPositionModule.init();
		galleryModule.init();

		uiModule.bindCTA();
		uiModule.bindHeroClickBehavior();
		uiModule.bindPricingTabs();
		uiModule.setInitialVisualState();
		
		bindUserScrollInterrupts();

		if (DOM.navbar) {
			window.addEventListener("scroll", () => navbarModule.handleScroll(), { passive: true });
		}

		window.addEventListener("resize", () => {
			physics.update();
			galleryModule.setPosition(galleryModule.currentIndex, false);
		});

		document.addEventListener("visibilitychange", () => {
			if (document.hidden) {
				state.animationRunning = false;
			} else {
				navbarModule.handleScroll();
			}
		});

		navbarModule.handleScroll();
	}

	init();
});
