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
		navDismissLayer: document.querySelector(".nav-dismiss-layer"),
		cta: document.querySelector(".cta-button"),
		footer: document.querySelector("footer"),
		heroIndicator: document.querySelector(".hero .scroll-indicator"),
		footerToContactTrigger: document.querySelector(".footer-scroll-trigger"),
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
		suppressNextCtaClick: false,

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

			if (absDistance < 1) {
				window.scrollTo(0, clampedTargetY);
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
					window.scrollTo(0, clampedTargetY);
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
				isHeroTarget && navMode === "up-section" ? "hero-top" : navMode;

			const navOffset =
				isHeroTarget || isFooterTarget ? 0 : this.getTargetNavOffset(effectiveNavMode);

			const shouldInsetByOnePixel =
				target.matches?.("#about, #gallery, #services, #pricing, #testimonials, #contact");

			const inset = shouldInsetByOnePixel ? physics.values.sectionScrollInset : 0;

			const y =
				target.getBoundingClientRect().top +
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
						if (finalY <= 5) {
							navbarModule.setTargets(0, 0, 0);
						} else {
							navbarModule.setTargets(1, 1, physics.values.NAV_SURFACE_UP);
						}
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

			state.manualNavbarOpen = false;
			navbarModule.setTargets(1, 1, this.getSurfaceForMode(mode));
			this.scrollToSection(target, mode);
			navbarModule.startAnimation();
		}
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

			DOM.navDismissLayer?.classList.add("active");

			if (DOM.navDismissLayer) {
				DOM.navDismissLayer.style.pointerEvents = "auto";
			}
		},
		
		closeMenu() {
			if (!DOM.navMenu || !DOM.navToggle) return;

			DOM.navMenu.classList.remove("active");
			DOM.navToggle.classList.remove("active");
			document.body.classList.remove("nav-menu-open");

			DOM.navDismissLayer?.classList.remove("active");

			if (DOM.navDismissLayer) {
				DOM.navDismissLayer.style.pointerEvents = "none";
			}
			
			document.querySelectorAll(".cta-button").forEach(btn => {
				btn.style.transform = "";
			});

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

					// Externe Links normal laufen lassen
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

						navbarModule.closeMenu();

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

						// Fallback, falls transitionend mal nicht feuert
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
					scrollEngine.goTo(DOM.hero, "up-section");
				};

				if (utils.isMobileViewport() && this.isOpen()) {
					const menu = DOM.navMenu;

					this.closeMenu();

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

				if (insideMenu || onToggle || onLogo) return;

				if (onCta) {
					this.suppressCtaHoverTemporarily();
					state.suppressNextCtaClick = true;
					uiModule.resetCtaMagnetic();
				}

				this.closeMenu();
			});

		},

		suppressCtaHoverTemporarily() {
			document.body.classList.add("suppress-cta-hover");

			if (state.suppressCtaHoverCleanup) {
				window.removeEventListener("pointerup", state.suppressCtaHoverCleanup);
				window.removeEventListener("pointercancel", state.suppressCtaHoverCleanup);
				clearTimeout(state.suppressCtaHoverCleanup.__timeoutId);
			}

			const cleanup = () => {
				document.body.classList.remove("suppress-cta-hover");

				window.removeEventListener("pointerup", cleanup);
				window.removeEventListener("pointercancel", cleanup);

				if (cleanup.__timeoutId) {
					clearTimeout(cleanup.__timeoutId);
				}

				state.suppressCtaHoverCleanup = null;
			};

			cleanup.__timeoutId = setTimeout(cleanup, 400);

			state.suppressCtaHoverCleanup = cleanup;

			window.addEventListener("pointerup", cleanup, { once: true });
			window.addEventListener("pointercancel", cleanup, { once: true });
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

		navigateSection(sectionEl, direction, allowPrev = true) {
			if (!sectionEl) return;

			const currentIndex = this.getSectionIndex(sectionEl);
			if (currentIndex === -1) return;

			if (direction === "next") {
				const nextTarget =
					sectionEl.id === "contact"
						? DOM.footer
						: state.orderedSections[currentIndex + 1] || null;

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

				this.navigateSection(sectionEl, "prev", allowPrev);
			});

			triggerEl.addEventListener("keydown", (e) => {
				if (headSelector) return;

				if (e.key === "Enter" || e.key === " ") {
					e.preventDefault();
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
		},
	};

	/* =========================================================
	   SCROLL SECTION HINT MODULE
	========================================================= */
	const scrollSectionHintModule = {
		root: null,
		topHint: null,
		bottomHint: null,
		hideTimer: null,
		lastKnownScrollY: window.scrollY,

		labels: {
			about: "ÜBER MICH",
			gallery: "VIDEO-FUN",
			services: "LEISTUNGEN",
			pricing: "PREISE",
			testimonials: "BEWERTUNGEN",
			contact: "TERMIN BUCHEN"
		},

		build() {
			if (this.root) return;

			this.root = document.createElement("div");
			this.root.className = "scroll-section-hints";
			this.root.setAttribute("aria-hidden", "true");

			this.root.innerHTML = `
				<div class="scroll-section-hint-anchor scroll-section-hint-anchor--top">
					<div class="scroll-section-hint scroll-section-hint--active">
						<span class="scroll-section-hint-text scroll-section-hint-base"></span>
						<span class="scroll-section-hint-text scroll-section-hint-invert"></span>
					</div>
				</div>
				<div class="scroll-section-hint-anchor scroll-section-hint-anchor--bottom">
					<div class="scroll-section-hint scroll-section-hint--next">
						<span class="scroll-section-hint-text scroll-section-hint-base"></span>
						<span class="scroll-section-hint-text scroll-section-hint-invert"></span>
					</div>
				</div>
			`;
			
			document.body.appendChild(this.root);

			this.topHint = this.root.querySelector(".scroll-section-hint--active");
			this.bottomHint = this.root.querySelector(".scroll-section-hint--next");
		},

		getContentSections() {
			return state.orderedSections.filter(section => {
				if (!section) return false;
				if (section.classList?.contains("hero")) return false;
				return !!section.id && !!this.labels[section.id];
			});
		},

		isHeroActive() {
			if (!DOM.hero) return false;

			const rect = DOM.hero.getBoundingClientRect();
			const probeY = window.innerHeight * 0.5;

			return rect.top <= probeY && rect.bottom > probeY;
		},

		getColumnLeft() {
			const aboutImage =
				document.querySelector("#about .about-image-wrapper") ||
				document.querySelector("#about .about-image");

			if (aboutImage) {
				const rect = aboutImage.getBoundingClientRect();

				if (Number.isFinite(rect.left)) {
					const viewportLeft = 0;
					const columnCenter = viewportLeft + ((rect.left - viewportLeft) / 2);
					return Math.max(12, columnCenter);
				}
			}

			const aboutContainer = document.querySelector("#about .container");
			if (aboutContainer) {
				const rect = aboutContainer.getBoundingClientRect();

				if (Number.isFinite(rect.left)) {
					return Math.max(12, rect.left / 2);
				}
			}

			return 24;
		},
		
		updateColumn() {
			if (!this.root) return;
			this.root.style.setProperty(
				"--scroll-hint-column-left",
				`${this.getColumnLeft()}px`
			);
		},

		getActiveSection() {
			const sections = this.getContentSections();
			if (!sections.length) return null;

			const probeY = window.innerHeight * 0.5;

			let active = sections.find(section => {
				const rect = section.getBoundingClientRect();
				return rect.top <= probeY && rect.bottom > probeY;
			});

			if (active) return active;

			active = sections.reduce((best, section) => {
				const rect = section.getBoundingClientRect();
				const sectionCenter = rect.top + rect.height / 2;
				const distance = Math.abs(sectionCenter - probeY);

				if (!best || distance < best.distance) {
					return { section, distance };
				}
				return best;
			}, null);

			return active?.section || sections[0];
		},

		getNextSection(activeSection) {
			const sections = this.getContentSections();
			if (!activeSection) return sections[0] || null;

			const index = sections.findIndex(section => section === activeSection);
			if (index === -1) return sections[0] || null;

			return sections[index + 1] || null;
		},

		updateLabels() {
			if (!this.topHint || !this.bottomHint) return;

			if (this.isHeroActive()) {
				
				this.setHintText(this.topHint, "");
				this.setHintText(this.bottomHint, "");

				this.topHint.classList.add("is-empty");
				this.bottomHint.classList.add("is-empty");

				this.updateHintVisuals();
				
				return;
			}

			const activeSection = this.getActiveSection();
			const nextSection = this.getNextSection(activeSection);

			const activeLabel = activeSection?.id ? this.labels[activeSection.id] : "";
			const nextLabel = nextSection?.id ? this.labels[nextSection.id] : "";
			
			this.setHintText(this.topHint, activeLabel ? `${activeLabel} >>` : "");
			this.setHintText(this.bottomHint, nextLabel ? `<< ${nextLabel}` : "");

			this.topHint.classList.toggle("is-empty", !activeLabel);
			this.bottomHint.classList.toggle("is-empty", !nextLabel);

			this.updateHintVisuals();
			
		},

		show() {
			if (!this.root) return;
			this.root.classList.add("is-visible");
		},

		hide() {
			if (!this.root) return;
			this.root.classList.remove("is-visible");
		},

		pulse() {
			this.revealTemporarily();
		},
	
		handleScroll() {
			const currentY = window.scrollY;
			if (currentY === this.lastKnownScrollY) return;

			this.lastKnownScrollY = currentY;

			if (!this.root) return;

			this.revealTemporarily();
		},

		bindEvents() {
			window.addEventListener("scroll", () => this.handleScroll(), { passive: true });

			window.addEventListener("resize", () => {
				this.updateColumn();
				this.updateLabels();
				this.updateHintVisuals();
			});

			window.addEventListener("orientationchange", () => {
				setTimeout(() => {
					this.updateColumn();
					this.updateLabels();
					this.updateHintVisuals();
				}, 120);
			});

			window.addEventListener("wheel", () => {
				this.pulse();
			}, { passive: true });

			window.addEventListener("touchmove", () => {
				this.pulse();
			}, { passive: true });
		},

		setHintText(hintEl, text) {
			if (!hintEl) return;

			const base = hintEl.querySelector(".scroll-section-hint-base");
			const invert = hintEl.querySelector(".scroll-section-hint-invert");

			if (base) base.textContent = text;
			if (invert) invert.textContent = text;
		},

		getDarkSectionRects() {
			return ["services", "contact"]
				.map(id => document.getElementById(id))
				.filter(Boolean)
				.map(el => el.getBoundingClientRect());
		},

		getIntersectionSegment(rectA, rectB) {
			const top = Math.max(rectA.top, rectB.top);
			const bottom = Math.min(rectA.bottom, rectB.bottom);

			if (bottom <= top) return null;

			return { top, bottom, height: bottom - top };
		},

		updateHintVisuals() {
			if (!this.topHint || !this.bottomHint) return;

			const heroRect = DOM.hero?.getBoundingClientRect() || null;
			const darkRects = this.getDarkSectionRects();

			[this.topHint, this.bottomHint].forEach(hint => {
				const rect = hint.getBoundingClientRect();
				const hintHeight = rect.height || 1;

				/* 1) kompletter Hint wird am Hero abgeschnitten */
				let clipTop = 0;
				let clipBottom = 0;

				if (heroRect) {
					const heroOverlap = this.getIntersectionSegment(rect, heroRect);

					if (heroOverlap) {
						/* bei deinem Layout relevant: Hero schneidet den oberen Bereich */
						if (heroRect.top <= rect.top) {
							clipTop = Math.max(0, heroOverlap.bottom - rect.top);
						} else if (heroRect.bottom >= rect.bottom) {
							clipBottom = Math.max(0, rect.bottom - heroOverlap.top);
						} else {
							/* Fallback für seltene Zwischenlage */
							clipTop = Math.max(0, heroOverlap.top - rect.top);
							clipBottom = Math.max(0, rect.bottom - heroOverlap.bottom);
						}
					}
				}

				hint.style.setProperty("--hint-clip-top", `${clipTop}px`);
				hint.style.setProperty("--hint-clip-bottom", `${clipBottom}px`);

				/* 2) weiße Version nur über dunklen Sections sichtbar */
				let bestOverlap = null;

				for (const darkRect of darkRects) {
					const overlap = this.getIntersectionSegment(rect, darkRect);
					if (!overlap) continue;

					if (!bestOverlap || overlap.height > bestOverlap.height) {
						bestOverlap = overlap;
					}
				}

				if (bestOverlap) {
					const darkClipTop = Math.max(0, bestOverlap.top - rect.top);
					const darkClipBottom = Math.max(0, rect.bottom - bestOverlap.bottom);

					hint.style.setProperty("--hint-dark-clip-top", `${darkClipTop}px`);
					hint.style.setProperty("--hint-dark-clip-bottom", `${darkClipBottom}px`);
				} else {
					hint.style.setProperty("--hint-dark-clip-top", `${hintHeight}px`);
					hint.style.setProperty("--hint-dark-clip-bottom", `0px`);
				}
			});
		},

		revealTemporarily() {
			if (!this.root || state.programmaticScroll) return;

			this.updateColumn();
			this.updateLabels();
			this.updateHintVisuals();

			if (this.isHeroActive()) {
				this.hide();

				if (this.hideTimer) {
					clearTimeout(this.hideTimer);
					this.hideTimer = null;
				}
				return;
			}

			this.show();

			if (this.hideTimer) {
				clearTimeout(this.hideTimer);
			}

			this.hideTimer = setTimeout(() => {
				this.hide();
			}, 2000);
		},

		init() {
			this.build();
			this.updateColumn();
			this.updateLabels();
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
		resetCtaMagnetic() {
			document.querySelectorAll(".cta-button").forEach(btn => {
				btn.style.transform = "";
			});
		},

		bindHeroAndFooter() {
			DOM.heroIndicator?.addEventListener("click", (e) => {
				e.preventDefault();
				e.stopPropagation();
				scrollEngine.goTo("#about", "down");
			});

			DOM.footerToContactTrigger?.addEventListener("click", (e) => {
				e.preventDefault();
				e.stopPropagation();
				scrollEngine.goTo("#contact", "up-section");
			});

			DOM.footerToContactTrigger?.addEventListener("keydown", (e) => {
				if (e.key !== "Enter" && e.key !== " ") return;
				e.preventDefault();
				scrollEngine.goTo("#contact", "up-section");
			});
		},

		bindCTA() {
			DOM.cta?.addEventListener("click", (e) => {
				if (state.suppressNextCtaClick) {
					state.suppressNextCtaClick = false;
					this.resetCtaMagnetic();
					e.preventDefault();
					e.stopPropagation();
					return;
				}

				if (utils.isMobileViewport() && navbarModule.isOpen()) {
					this.resetCtaMagnetic();
					e.preventDefault();
					e.stopPropagation();
					return;
				}

				e.preventDefault();
				e.stopPropagation();
				scrollEngine.goTo("#contact", "down");
			});

			const supportsRealHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

			document.querySelectorAll(".cta-button").forEach(btn => {
				if (!supportsRealHover) {
					btn.style.transform = "";
					return;
				}

				btn.addEventListener("mousemove", (e) => {
					if (utils.isMobileViewport() && navbarModule.isOpen()) {
						btn.style.transform = "";
						return;
					}

					if (document.body.classList.contains("suppress-cta-hover")) {
						btn.style.transform = "";
						return;
					}

					const rect = btn.getBoundingClientRect();
					const x = e.clientX - rect.left - rect.width / 2;
					const y = e.clientY - rect.top - rect.height / 2;
					btn.style.transform = `translate(${x * 0.18}px, ${y * 0.18}px)`;
				});

				btn.addEventListener("mouseleave", () => {
					btn.style.transform = "";
				});
			});
		},
		
		bindHeroClickBehavior() {
			DOM.hero?.addEventListener("click", (e) => {
				if (!DOM.navbar) return;
				if (utils.isMobileViewport() && navbarModule.isOpen()) return;

				const clickedCTA = e.target.closest(".cta-button");
				const clickedIndicator = e.target.closest(".scroll-indicator");

				if (clickedCTA || clickedIndicator) return;

				const indicatorRect = DOM.heroIndicator?.getBoundingClientRect();

				if (indicatorRect) {
					const zoneTop = indicatorRect.top - 80;
					const zoneBottom = indicatorRect.bottom + 80;

					if (e.clientY >= zoneTop && e.clientY <= zoneBottom) {
						scrollEngine.goTo("#about", "down");
						return;
					}
				}
				
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
	   INIT
	========================================================= */
	function init() {
		physics.update();
		sectionNavigationModule.buildOrderedSections();

		navbarModule.bindEvents();
		sectionNavigationModule.bindEvents();
		scrollSectionHintModule.init();
		galleryModule.init();

		uiModule.bindHeroAndFooter();
		uiModule.bindCTA();
		uiModule.bindHeroClickBehavior();
		uiModule.bindPricingTabs();
		uiModule.setInitialVisualState();

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
