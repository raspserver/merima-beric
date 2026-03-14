document.addEventListener("DOMContentLoaded", () => {
	const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

	/* =========================
	   DOM
	========================= */
	const navbar = document.querySelector(".navbar");
	const hero = document.querySelector(".hero");
	const navToggle = document.querySelector(".nav-toggle");
	const navMenu = document.querySelector(".nav-menu");
	const navLinks = document.querySelectorAll(".nav-menu a");
	const navLogo = document.querySelector(".nav-logo");
	const navDismissLayer = document.querySelector(".nav-dismiss-layer");
	const cta = document.querySelector(".cta-button");
	const footer = document.querySelector("footer");
	const heroIndicator = document.querySelector(".hero .scroll-indicator");
	const footerToContactTrigger = document.querySelector(".footer-scroll-trigger");

	/* =========================
	   CONFIG
	========================= */
	const directionLockThreshold = 8;
	const inertiaThreshold = Math.min(document.documentElement.clientHeight * 0.6, 600);
	const sectionNavClickDelay = 240;

	/* =========================
	   STATE
	========================= */
	let lastScrollY = window.scrollY;
	let scrollVelocity = 0;
	let scrollDirection = "down";

	let heroParallax = 0;
	let heroParallaxVelocity = 0;

	let animationRunning = false;
	let lastFrameTime = performance.now();

	let programmaticScroll = false;
	let manualNavbarOpen = false;
	let programmaticNavMode = null; // null | "down" | "up-section" | "hero-top"

	let targetVisible = 0;
	let currentVisible = 0;
	let visibleVelocity = 0;

	let targetCompact = 0;
	let currentCompact = 0;
	let compactVelocity = 0;

	let targetSurface = 0;
	let currentSurface = 0;
	let surfaceVelocity = 0;

	let navVisibleStiffness = 0.08;
	let navVisibleDamping = 0.82;
	let navCompactStiffness = 0.045;
	let navCompactDamping = 0.88;

	let NAV_SURFACE_UP = 0.18;
	let sectionScrollInset = 1;

	let scrollElasticDecay = 10;
	let scrollElasticFrequency = 10;
	let scrollElasticPhaseShift = 0.75;
	let scrollDurationFactor = 0.6;
	let scrollDurationMin = 700;
	let scrollDurationMax = 1600;

	let heroParallaxFactor = -0.06;
	let heroParallaxStiffness = 0.04;
	let heroParallaxDamping = 0.85;
	let heroScaleScrollFactor = 0.01;
	let heroBrightnessScrollFactor = 0.06;

	let activeScrollAnimation = null;
	let activeScrollToken = 0;

	/* =========================
	   HELPERS
	========================= */
	function getRootNumber(name, fallback) {
		const value = parseFloat(
			getComputedStyle(document.documentElement).getPropertyValue(name)
		);
		return Number.isFinite(value) ? value : fallback;
	}

	function isMobileViewport() {
		return window.innerWidth <= 968;
	}

	function isMobileNavOpen() {
		return !!(navMenu && navToggle && navMenu.classList.contains("active"));
	}

	function openMobileNavMenu() {
		if (!navMenu || !navToggle) return;
		navMenu.classList.add("active");
		navToggle.classList.add("active");
		navDismissLayer?.classList.add("active");
	}

	function closeMobileNavMenu() {
		if (!navMenu || !navToggle) return;
		navMenu.classList.remove("active");
		navToggle.classList.remove("active");
		navDismissLayer?.classList.remove("active");
	}

	function setNavbarTargets(visible, compact, surface) {
		if (!navbar) return;
		targetVisible = visible;
		targetCompact = compact;
		targetSurface = surface;
		startNavbarAnimation();
	}

	function startNavbarAnimation() {
		if (!animationRunning) {
			animationRunning = true;
			lastFrameTime = performance.now();
			requestAnimationFrame(animate);
		}
	}

	function updatePhysics() {
		const isMobile = window.innerWidth <= 768;

		NAV_SURFACE_UP = getRootNumber("--nav-surface-up", 0.18);
		sectionScrollInset = getRootNumber("--section-scroll-inset", 1);

		scrollElasticDecay = getRootNumber("--scroll-elastic-decay", 10);
		scrollElasticFrequency = getRootNumber("--scroll-elastic-frequency", 10);
		scrollElasticPhaseShift = getRootNumber("--scroll-elastic-phase-shift", 0.75);
		scrollDurationFactor = getRootNumber("--scroll-duration-factor", 0.6);
		scrollDurationMin = getRootNumber("--scroll-duration-min", 700);
		scrollDurationMax = getRootNumber("--scroll-duration-max", 1600);

		heroParallaxFactor = getRootNumber("--hero-parallax-factor", -0.06);
		heroParallaxStiffness = getRootNumber("--hero-parallax-stiffness", 0.04);
		heroParallaxDamping = getRootNumber("--hero-parallax-damping", 0.85);
		heroScaleScrollFactor = getRootNumber("--hero-scale-scroll-factor", 0.01);
		heroBrightnessScrollFactor = getRootNumber("--hero-brightness-scroll-factor", 0.06);

		if (isMobile) {
			navVisibleStiffness = getRootNumber("--nav-spring-stiffness-mobile", 0.06);
			navVisibleDamping = getRootNumber("--nav-spring-damping-mobile", 0.85);
			navCompactStiffness = getRootNumber("--nav-compact-stiffness-mobile", 0.035);
			navCompactDamping = getRootNumber("--nav-compact-damping-mobile", 0.90);
		} else {
			navVisibleStiffness = getRootNumber("--nav-spring-stiffness-desktop", 0.08);
			navVisibleDamping = getRootNumber("--nav-spring-damping-desktop", 0.82);
			navCompactStiffness = getRootNumber("--nav-compact-stiffness-desktop", 0.045);
			navCompactDamping = getRootNumber("--nav-compact-damping-desktop", 0.88);
		}
	}

	function getMaxScrollY() {
		return Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
	}

	function easeOutElastic(t) {
		if (t === 0) return 0;
		if (t === 1) return 1;

		const c = (2 * Math.PI) / 3;
		return Math.pow(2, -scrollElasticDecay * t) *
			Math.sin((t * scrollElasticFrequency - scrollElasticPhaseShift) * c) + 1;
	}

	function getTargetNavOffset(navMode = null) {
		if (!navbar) return 0;

		const navMin = getRootNumber("--nav-height-min", 58);
		const navMax = getRootNumber("--nav-height-max", 78);

		if (navMode === "down" || navMode === "up-section") return navMin;
		return navbar.offsetHeight || navMax;
	}

	function resolveTarget(targetOrSelector) {
		if (!targetOrSelector) return null;
		if (targetOrSelector instanceof Element) return targetOrSelector;

		if (typeof targetOrSelector === "string") {
			if (targetOrSelector === "#home") {
				return document.querySelector("#home") || document.querySelector(".hero");
			}
			return document.querySelector(targetOrSelector);
		}

		return null;
	}

	function getScrollModeForTarget(target) {
		if (!target) return "down";

		const currentY = window.scrollY;
		const targetY = target.getBoundingClientRect().top + window.pageYOffset;

		if (target.classList?.contains("hero")) return "up-section";
		return targetY < currentY ? "up-section" : "down";
	}

	function getSurfaceForMode(mode) {
		return mode === "up-section" ? NAV_SURFACE_UP : 1;
	}

	function goToTarget(targetOrSelector, forcedMode = null) {
		const target = resolveTarget(targetOrSelector);
		if (!target) return;

		const mode = forcedMode || getScrollModeForTarget(target);

		if (isMobileViewport() && isMobileNavOpen()) {
			closeMobileNavMenu();
		}

		manualNavbarOpen = false;
		setNavbarTargets(1, 1, getSurfaceForMode(mode));
		scrollToSection(target, mode);
		startNavbarAnimation();
	}

	function animateWindowScrollTo(targetY, { onComplete } = {}) {
		if (activeScrollAnimation) {
			cancelAnimationFrame(activeScrollAnimation);
			activeScrollAnimation = null;
		}

		const scrollToken = ++activeScrollToken;
		const maxScrollY = getMaxScrollY();
		const clampedTargetY = Math.max(0, Math.min(targetY, maxScrollY));
		const startY = window.scrollY;
		const distance = clampedTargetY - startY;
		const absDistance = Math.abs(distance);

		if (absDistance < 1) {
			window.scrollTo(0, clampedTargetY);
			onComplete?.(clampedTargetY);
			return;
		}

		const duration = prefersReducedMotion
			? Math.min(900, Math.max(350, absDistance * 0.35))
			: Math.min(
				scrollDurationMax,
				Math.max(scrollDurationMin, absDistance * scrollDurationFactor)
			);

		const startTime = performance.now();

		function frame(now) {
			if (scrollToken !== activeScrollToken) return;

			const elapsed = now - startTime;
			const t = Math.min(elapsed / duration, 1);
			const eased = prefersReducedMotion ? t : easeOutElastic(t);

			const nextY = startY + distance * eased;
			const clampedNextY = Math.max(0, Math.min(nextY, maxScrollY));
			window.scrollTo(0, clampedNextY);

			if (t < 1) {
				activeScrollAnimation = requestAnimationFrame(frame);
			} else {
				window.scrollTo(0, clampedTargetY);
				activeScrollAnimation = null;
				onComplete?.(clampedTargetY);
			}
		}

		activeScrollAnimation = requestAnimationFrame(frame);
	}

	function scrollToSection(target, navMode = null) {
		if (!target) return;

		const isHeroTarget = target.classList?.contains("hero");
		const isFooterTarget = target.tagName?.toLowerCase() === "footer";

		const effectiveNavMode =
			isHeroTarget && navMode === "up-section" ? "hero-top" : navMode;

		const navOffset =
			isHeroTarget || isFooterTarget ? 0 : getTargetNavOffset(effectiveNavMode);

		const shouldInsetByOnePixel =
			target.matches?.("#about, #gallery, #services, #pricing, #testimonials, #contact");

		const inset = shouldInsetByOnePixel ? sectionScrollInset : 0;

		const y =
			target.getBoundingClientRect().top +
			window.pageYOffset -
			navOffset +
			inset;

		programmaticScroll = true;
		programmaticNavMode = effectiveNavMode;

		if (effectiveNavMode === "down") {
			scrollDirection = "down";
		} else if (effectiveNavMode === "up-section" || effectiveNavMode === "hero-top") {
			scrollDirection = "up";
		}

		animateWindowScrollTo(Math.max(0, y), {
			onComplete: () => {
				const finalMode = programmaticNavMode;
				const finalY = window.scrollY;

				programmaticScroll = false;
				lastScrollY = finalY;

				if (finalMode === "down") {
					targetVisible = 1;
					targetCompact = 1;
					targetSurface = 1;
				} else if (finalMode === "up-section") {
					targetVisible = 1;
					targetCompact = 1;
					targetSurface = NAV_SURFACE_UP;
				} else if (finalMode === "hero-top") {
					if (finalY <= 5) {
						targetVisible = 0;
						targetCompact = 0;
						targetSurface = 0;
					} else {
						targetVisible = 1;
						targetCompact = 1;
						targetSurface = NAV_SURFACE_UP;
					}
				}

				programmaticNavMode = null;
				startNavbarAnimation();
				handleScroll();
			}
		});
	}

	/* =========================
	   SECTION NAVIGATION
	========================= */
	const orderedSections = [
		document.querySelector(".hero"),
		document.querySelector("#about"),
		document.querySelector("#gallery"),
		document.querySelector("#services"),
		document.querySelector("#pricing"),
		document.querySelector("#testimonials"),
		document.querySelector("#contact")
	].filter(Boolean);

	function getSectionIndex(sectionEl) {
		return orderedSections.findIndex(section => section === sectionEl);
	}

	function navigateSection(sectionEl, direction, allowPrev = true) {
		if (!sectionEl) return;

		const currentIndex = getSectionIndex(sectionEl);
		if (currentIndex === -1) return;

		if (direction === "next") {
			const nextTarget =
				sectionEl.id === "contact"
					? footer
					: orderedSections[currentIndex + 1] || null;

			if (!nextTarget) return;
			goToTarget(nextTarget, "down");
			return;
		}

		if (direction === "prev" && allowPrev) {
			const prevTarget = orderedSections[currentIndex - 1] || null;
			if (!prevTarget) return;
			goToTarget(prevTarget, "up-section");
		}
	}

	function bindSectionNavigator(
		triggerEl,
		sectionEl,
		{ allowPrev = true, headSelector = null } = {}
	) {
		if (!triggerEl || !sectionEl) return;

		let clickTimer = null;

		function isInteractiveElement(target) {
			return !!target.closest(
				'a, button, input, textarea, select, option, label, video, iframe, [role="button"], .pricing-tab, .cta-button'
			);
		}

		function isInsideHeadArea(event) {
			if (!headSelector) return true;

			const head = sectionEl.querySelector(headSelector);
			if (!head) return false;

			const rect = head.getBoundingClientRect();
			return event.clientY >= rect.top && event.clientY <= rect.bottom;
		}

		triggerEl.addEventListener("click", (e) => {
			if (isInteractiveElement(e.target)) return;
			if (!isInsideHeadArea(e)) return;

			e.preventDefault();
			e.stopPropagation();

			if (clickTimer) clearTimeout(clickTimer);

			clickTimer = setTimeout(() => {
				clickTimer = null;
				navigateSection(sectionEl, "next", allowPrev);
			}, sectionNavClickDelay);
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

			navigateSection(sectionEl, "prev", allowPrev);
		});

		triggerEl.addEventListener("keydown", (e) => {
			if (headSelector) return;

			if (e.key === "Enter" || e.key === " ") {
				e.preventDefault();
				navigateSection(sectionEl, "next", allowPrev);
			}
		});
	}

	/* =========================
	   HERO / FOOTER / CTA
	========================= */
	heroIndicator?.addEventListener("click", (e) => {
		e.preventDefault();
		e.stopPropagation();
		goToTarget("#about", "down");
	});

	footerToContactTrigger?.addEventListener("click", (e) => {
		e.preventDefault();
		e.stopPropagation();
		goToTarget("#contact", "up-section");
	});

	footerToContactTrigger?.addEventListener("keydown", (e) => {
		if (e.key !== "Enter" && e.key !== " ") return;
		e.preventDefault();
		goToTarget("#contact", "up-section");
	});

	cta?.addEventListener("click", (e) => {
		e.preventDefault();
		e.stopPropagation();
		goToTarget("#contact", "down");
	});

	if (navLogo) {
		navLogo.addEventListener("click", (e) => {
			e.preventDefault();
			e.stopPropagation();
			goToTarget(document.querySelector(".hero"), "up-section");
		});
	}

	/* =========================
	   MAGNETIC CTA
	========================= */
	document.querySelectorAll(".cta-button").forEach(btn => {
		btn.addEventListener("mousemove", (e) => {
			if (isMobileViewport() && isMobileNavOpen()) {
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

	/* =========================
	   GALLERY
	========================= */
	const videoFiles = [
		"videos/snaptik_7204469200172190982_hd.mp4",
		"videos/snaptik_7208965603661499654_hd.mp4",
		"videos/snaptik_7211607331648441605_hd.mp4",
		"videos/snaptik_7444629475364474145_hd.mp4"
	];

	const track = document.querySelector(".gallery-track");

	if (track) {
		let videos = [];
		let currentIndex = 1;
		let isAnimating = false;

		function shuffle(array) {
			for (let i = array.length - 1; i > 0; i--) {
				const j = Math.floor(Math.random() * (i + 1));
				[array[i], array[j]] = [array[j], array[i]];
			}
			return array;
		}

		function safePlay(video) {
			const p = video.play();
			if (p !== undefined) p.catch(() => {});
		}

		function playOnly(index) {
			videos.forEach((v, i) => {
				if (i === index) {
					v.currentTime = 0;
					safePlay(v);
				} else {
					v.pause();
				}
			});
		}

		function setPosition(index, animate = true) {
			const videoWidth = videos[0].offsetWidth;
			const padding = track.parentElement.offsetWidth * 0.1;
			const offset = videoWidth * index - padding;

			track.style.transition = animate
				? "transform 0.6s cubic-bezier(.16,.84,.44,1)"
				: "none";

			track.style.transform = `translateX(-${offset}px)`;
		}

		function moveTo(index, autoPlay = false) {
			if (isAnimating) return;
			isAnimating = true;
			currentIndex = index;
			setPosition(currentIndex, true);

			if (autoPlay) {
				playOnly(currentIndex);
			} else {
				videos.forEach(v => v.pause());
			}
		}

		const shuffled = shuffle([...videoFiles]);
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
				if (isMobileViewport() && isMobileNavOpen()) {
					e.preventDefault();
					e.stopPropagation();
				}
			});

			video.addEventListener("pointerup", (e) => {
				if (isMobileViewport() && isMobileNavOpen()) {
					e.preventDefault();
					e.stopPropagation();
					closeMobileNavMenu();
					return;
				}

				e.stopPropagation();
				video.paused ? safePlay(video) : video.pause();
			});

			video.addEventListener("ended", () => moveTo(currentIndex + 1, true));

			track.appendChild(video);
			videos.push(video);
		});

		setPosition(currentIndex, false);
		playOnly(currentIndex);

		track.addEventListener("transitionend", () => {
			isAnimating = false;

			if (currentIndex === videos.length - 1) currentIndex = 1;
			if (currentIndex === 0) currentIndex = videos.length - 2;

			requestAnimationFrame(() => setPosition(currentIndex, false));
		});

		let startX = 0;
		let isDragging = false;
		track.style.touchAction = "pan-y";

		track.addEventListener("touchstart", (e) => {
			if (isMobileViewport() && isMobileNavOpen()) {
				e.preventDefault();
				return;
			}

			startX = e.touches[0].clientX;
			isDragging = true;
			track.style.transition = "none";
		}, { passive: false });

		track.addEventListener("touchmove", (e) => {
			if (isMobileViewport() && isMobileNavOpen()) {
				e.preventDefault();
				return;
			}

			if (!isDragging) return;

			const diff = e.touches[0].clientX - startX;
			const videoWidth = videos[0].offsetWidth;
			const padding = track.parentElement.offsetWidth * 0.1;

			track.style.transform = `translateX(${-currentIndex * videoWidth + diff - padding}px)`;
		}, { passive: false });

		track.addEventListener("touchend", (e) => {
			if (isMobileViewport() && isMobileNavOpen()) {
				e.preventDefault();
				isDragging = false;
				return;
			}

			if (!isDragging) return;

			const diff = e.changedTouches[0].clientX - startX;

			if (diff > 80) moveTo(currentIndex - 1, true);
			else if (diff < -80) moveTo(currentIndex + 1, true);
			else setPosition(currentIndex, true);

			isDragging = false;
		});

		const gallerySection = document.querySelector(".gallery");
		if (gallerySection) {
			const observer = new IntersectionObserver((entries) => {
				entries.forEach(entry => {
					if (!videos[currentIndex]) return;
					entry.isIntersecting ? playOnly(currentIndex) : videos.forEach(v => v.pause());
				});
			}, { threshold: 0.4 });

			observer.observe(gallerySection);
		}

		document.addEventListener("visibilitychange", () => {
			document.hidden ? videos.forEach(v => v.pause()) : playOnly(currentIndex);
		});

		window.addEventListener("resize", () => setPosition(currentIndex, false));
	}

	/* =========================
	   HERO CLICK BEHAVIOR
	========================= */
	hero?.addEventListener("click", (e) => {
		if (!navbar) return;
		if (isMobileViewport() && isMobileNavOpen()) return;

		const clickedCTA = e.target.closest(".cta-button");
		const clickedIndicator = e.target.closest(".scroll-indicator");
		if (clickedCTA || clickedIndicator) return;

		const ctaRect = cta?.getBoundingClientRect();
		if (ctaRect && e.clientY > ctaRect.bottom) {
			goToTarget("#about", "down");
			return;
		}

		const visible = parseFloat(
			getComputedStyle(navbar).getPropertyValue("--nav-visible")
		);

		const newTarget = visible < 0.5 ? 1 : 0;
		targetVisible = newTarget;
		targetCompact = newTarget;
		targetSurface = newTarget;
		manualNavbarOpen = newTarget === 1;

		startNavbarAnimation();
	});

	/* =========================
	   NAVBAR SCROLL LOGIC
	========================= */
	function handleScroll() {
		if (!navbar) return;

		const currentY = window.scrollY;
		const deltaY = currentY - lastScrollY;

		scrollVelocity = deltaY * 0.8;

		if (!programmaticScroll && Math.abs(deltaY) > directionLockThreshold) {
			scrollDirection = deltaY > 0 ? "down" : "up";
		}

		lastScrollY = currentY;
		hero?.classList.toggle("scrolled", currentY > 10);

		if (programmaticNavMode === "down") {
			targetVisible = 1;
			targetCompact = 1;
			targetSurface = 1;
			startNavbarAnimation();
			return;
		}

		if (programmaticNavMode === "up-section") {
			targetVisible = 1;
			targetCompact = 1;
			targetSurface = NAV_SURFACE_UP;
			startNavbarAnimation();
			return;
		}

		if (programmaticNavMode === "hero-top") {
			targetVisible = 0;
			targetCompact = 0;
			targetSurface = 0;
			startNavbarAnimation();
			return;
		}

		if (manualNavbarOpen) {
			if (currentY <= 5) {
				manualNavbarOpen = false;
				targetVisible = 0;
				targetCompact = 0;
				targetSurface = 0;
			} else {
				targetVisible = 1;
				targetCompact = 1;
				targetSurface = 1;
			}

			startNavbarAnimation();
			return;
		}

		if (currentY <= 5) {
			targetVisible = 0;
			targetCompact = 0;
			targetSurface = 0;
		} else if (scrollDirection === "down") {
			targetVisible = 1;
			targetCompact = 1;
			targetSurface = 1;
		} else {
			targetVisible = 1;
			targetCompact = 1;
			targetSurface = NAV_SURFACE_UP;
		}

		startNavbarAnimation();
	}

	function animate(now) {
		if (!navbar || document.hidden) {
			animationRunning = false;
			return;
		}

		animationRunning = true;
		scrollVelocity *= 0.9;

		let delta = (now - lastFrameTime) / 16.67;
		lastFrameTime = now;
		delta = Math.min(delta, 2);

		const visibleForce = (targetVisible - currentVisible) * navVisibleStiffness;
		visibleVelocity += visibleForce * delta;
		visibleVelocity *= Math.pow(navVisibleDamping, delta);
		currentVisible += visibleVelocity * delta;
		currentVisible = Math.max(0, Math.min(currentVisible, 1));

		const compactForce = (targetCompact - currentCompact) * navCompactStiffness;
		compactVelocity += compactForce * delta;
		compactVelocity *= Math.pow(navCompactDamping, delta);
		currentCompact += compactVelocity * delta;
		currentCompact = Math.max(0, Math.min(currentCompact, 1));

		const surfaceForce = (targetSurface - currentSurface) * navCompactStiffness;
		surfaceVelocity += surfaceForce * delta;
		surfaceVelocity *= Math.pow(navCompactDamping, delta);
		currentSurface += surfaceVelocity * delta;
		currentSurface = Math.max(0, Math.min(currentSurface, 1));

		const easedCompact = 1 - Math.pow(1 - currentCompact, 3);
		const easedSurface = 1 - Math.pow(1 - currentSurface, 3);

		navbar.style.setProperty("--nav-visible", currentVisible);
		navbar.style.setProperty("--nav-compact", easedCompact);
		navbar.style.setProperty("--nav-surface", easedSurface);
		navbar.style.setProperty("--nav-height-progress", easedCompact);

		const velocityFactor = Math.round(Math.min(Math.abs(scrollVelocity) * 0.15, 6));
		navbar.style.setProperty("--nav-velocity-blur", velocityFactor);

		const refraction = Math.min(Math.abs(scrollVelocity) * 0.02, 1);
		navbar.style.setProperty("--nav-refraction", refraction);

		const velocityShadow = Math.min(Math.abs(scrollVelocity) * 0.02, 0.2);
		navbar.style.boxShadow =
			`0 ${10 * easedSurface}px ${40 * easedSurface}px rgba(0,0,0, ${0.45 * easedSurface + velocityShadow})`;

		if (hero) {
			const scrollY = window.scrollY;
			const progress = Math.min(scrollY / inertiaThreshold, 1);

			hero.style.setProperty("--hero-scale", 1 - (progress * heroScaleScrollFactor));
			hero.style.setProperty("--hero-brightness", 1 - (progress * heroBrightnessScrollFactor));

			const targetParallax = scrollY * heroParallaxFactor;
			const parallaxForce = (targetParallax - heroParallax) * heroParallaxStiffness;

			heroParallaxVelocity += parallaxForce;
			heroParallaxVelocity *= heroParallaxDamping;
			heroParallax += heroParallaxVelocity;

			hero.style.setProperty("--hero-parallax", `${heroParallax}px`);
		}

		const stillMoving =
			Math.abs(targetVisible - currentVisible) > 0.0005 ||
			Math.abs(visibleVelocity) > 0.0005 ||
			Math.abs(targetCompact - currentCompact) > 0.0005 ||
			Math.abs(compactVelocity) > 0.0005 ||
			Math.abs(targetSurface - currentSurface) > 0.0005 ||
			Math.abs(surfaceVelocity) > 0.0005;

		if (!stillMoving) {
			animationRunning = false;
			return;
		}

		requestAnimationFrame(animate);
	}

	/* =========================
	   NAV EVENTS
	========================= */
	if (navToggle && navMenu) {
		navToggle.addEventListener("click", (e) => {
			e.preventDefault();
			e.stopPropagation();
			isMobileNavOpen() ? closeMobileNavMenu() : openMobileNavMenu();
		});
	}

	navbar?.addEventListener("click", (e) => {
		if (!isMobileViewport() || !isMobileNavOpen()) return;

		const clickedLink = e.target.closest(".nav-menu a");
		const clickedLogo = e.target.closest(".nav-logo");
		const clickedToggle = e.target.closest(".nav-toggle");

		if (clickedLink || clickedLogo || clickedToggle) return;

		e.preventDefault();
		e.stopPropagation();
		closeMobileNavMenu();
	});

	navDismissLayer?.addEventListener("pointerdown", (e) => {
		e.preventDefault();
		e.stopPropagation();
		closeMobileNavMenu();
	});

	navDismissLayer?.addEventListener("click", (e) => {
		e.preventDefault();
		e.stopPropagation();
	});

	navLinks.forEach(link => {
		link.addEventListener("click", (e) => {
			e.preventDefault();
			e.stopPropagation();

			const href = link.getAttribute("href");
			const target = resolveTarget(href);
			if (!target) return;

			goToTarget(target);
		});
	});

	/* =========================
	   SECTION CLICK BINDINGS
	========================= */
	document.querySelectorAll("section").forEach(section => {
		if (section.classList.contains("hero")) return;

		bindSectionNavigator(section, section, {
			allowPrev: true,
			headSelector: ".section-scroll-head"
		});
	});

	/* =========================
	   PRICING TABS
	========================= */
	const pricingTabs = document.querySelectorAll(".pricing-tab");
	const pricingContents = document.querySelectorAll(".pricing-content");

	pricingTabs.forEach(tab => {
		tab.addEventListener("click", () => {
			if (isMobileViewport() && isMobileNavOpen()) return;

			pricingTabs.forEach(t => t.classList.remove("active"));
			pricingContents.forEach(c => c.classList.remove("active"));

			tab.classList.add("active");
			const target = document.getElementById(tab.dataset.tab);
			if (target) target.classList.add("active");
		});
	});

	/* =========================
	   INIT
	========================= */
	updatePhysics();
	window.addEventListener("resize", updatePhysics);

	if (hero) {
		hero.style.setProperty(
			"--hero-brightness",
			1 - (Math.min(window.scrollY / window.innerHeight, 1) * heroBrightnessScrollFactor)
		);
	}

	if (navbar && prefersReducedMotion) {
		navbar.style.setProperty("--nav-visible", 1);
		navbar.style.setProperty("--nav-compact", 1);
		navbar.style.setProperty("--nav-surface", 1);
		navbar.style.setProperty("--nav-height-progress", 1);
	}

	if (navbar) {
		window.addEventListener("scroll", handleScroll, { passive: true });
	}

	handleScroll();

	document.addEventListener("visibilitychange", () => {
		if (document.hidden) {
			animationRunning = false;
		} else {
			handleScroll();
		}
	});

	const year = document.getElementById("year");
	if (year) {
		year.textContent = new Date().getFullYear();
	}
});
