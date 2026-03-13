document.addEventListener("DOMContentLoaded", () => {
	/* prefers-reduced-motion Support */
	const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

	/* =========================
	   GLOBAL NAV / SCROLL STATE
	========================= */
	const navbar = document.querySelector(".navbar");
	const hero = document.querySelector(".hero");
	const navToggle = document.querySelector(".nav-toggle");
	const navMenu = document.querySelector(".nav-menu");
	const navLinks = document.querySelectorAll(".nav-menu a");
	const navLogo = document.querySelector(".nav-logo");
	const cta = document.querySelector(".cta-button");
	
	const directionLockThreshold = 8;
	const inertiaThreshold = Math.min(document.documentElement.clientHeight * 0.6, 600);

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
	let navbarVisibilityLockUntil = 0;

	let targetVisible = 0;
	let currentVisible = 0;
	let visibleVelocity = 0;

	let targetCompact = 0;
	let currentCompact = 0;
	let compactVelocity = 0;

	let targetSurface = 0;
	let currentSurface = 0;
	let surfaceVelocity = 0;

	let navVisibleStiffness, navVisibleDamping, navCompactStiffness, navCompactDamping;

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

	/* =========================
	   ROOT VARIABLE HELPERS
	========================= */
	function getRootNumber(name, fallback) {
		const value = parseFloat(
			getComputedStyle(document.documentElement).getPropertyValue(name)
		);
		return Number.isFinite(value) ? value : fallback;
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

	updatePhysics();
	window.addEventListener("resize", updatePhysics);

	/* =========================
	   ANIMATION CORE
	========================= */
	function startNavbarAnimation() {
		if (!animationRunning) {
			animationRunning = true;
			lastFrameTime = performance.now();
			requestAnimationFrame(animate);
		}
	}

	function setNavbarTargets(visible, compact, surface) {
		if (!navbar) return;

		targetVisible = visible;
		targetCompact = compact;
		targetSurface = surface;

		startNavbarAnimation();
	}

	/* =========================
	   CUSTOM SCREEN SCROLL
	========================= */
	let activeScrollAnimation = null;
	let pageBounceAnimation = null;

	function getMaxScrollY() {
		return Math.max(
			0,
			document.documentElement.scrollHeight - window.innerHeight
		);
	}

	function triggerScreenBounce(intensity = 18) {
		if (prefersReducedMotion) return;

		const bounceTargets = Array.from(document.body.children).filter(el => {
			return !el.classList.contains("navbar");
		});

		if (!bounceTargets.length) return;

		if (pageBounceAnimation) {
			pageBounceAnimation.forEach(animation => animation.cancel());
			pageBounceAnimation = null;
		}

		/* Navbar während des Bounces sichtbar halten */
		navbarVisibilityLockUntil = performance.now() + 900;
		targetVisible = 1;
		targetCompact = 1;
		targetSurface = 1;
		startNavbarAnimation();

		bounceTargets.forEach(el => {
			el.style.willChange = "transform";
		});

		if (bounceTargets[0].animate) {
			pageBounceAnimation = bounceTargets.map(el =>
				el.animate(
					[
						{ transform: "translateY(0)" },
						{ transform: `translateY(-${intensity}px)` },
						{ transform: `translateY(${Math.round(intensity * 0.42)}px)` },
						{ transform: `translateY(-${Math.round(intensity * 0.14)}px)` },
						{ transform: "translateY(0)" }
					],
					{
						duration: 720,
						easing: "cubic-bezier(.16,.84,.44,1)",
						fill: "none"
					}
				)
			);

			const clear = () => {
				bounceTargets.forEach(el => {
					el.style.willChange = "";
				});
				pageBounceAnimation = null;
				handleScroll();
			};

			pageBounceAnimation[0]?.addEventListener("finish", clear, { once: true });
			pageBounceAnimation[0]?.addEventListener("cancel", clear, { once: true });
			return;
		}

		/* Fallback ohne WAAPI */
		bounceTargets.forEach(el => {
			el.classList.remove("screen-bounce");
			void el.offsetWidth;
			el.classList.add("screen-bounce");
		});

		window.setTimeout(() => {
			bounceTargets.forEach(el => {
				el.classList.remove("screen-bounce");
				el.style.willChange = "";
			});
			handleScroll();
		}, 750);
	}

	function easeOutElastic(t) {
		if (t === 0) return 0;
		if (t === 1) return 1;

		const c = (2 * Math.PI) / 3;

		return Math.pow(2, -scrollElasticDecay * t) *
			Math.sin((t * scrollElasticFrequency - scrollElasticPhaseShift) * c) + 1;
	}
	
	function easeOutCubic(t) {
		return 1 - Math.pow(1 - t, 3);
	}

	function animateWindowScrollTo(targetY, { onComplete } = {}) {
		if (activeScrollAnimation) {
			cancelAnimationFrame(activeScrollAnimation);
			activeScrollAnimation = null;
		}

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

		/* Kein Elastic-Overshoot an den Dokumentgrenzen */
		const hitsBoundary =
			clampedTargetY === 0 ||
			clampedTargetY === maxScrollY ||
			clampedTargetY !== targetY;

		function frame(now) {
			const elapsed = now - startTime;
			const t = Math.min(elapsed / duration, 1);

			const eased = prefersReducedMotion
				? t
				: hitsBoundary
					? easeOutCubic(t)
					: easeOutElastic(t);

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

	function getTargetNavOffset(navMode = null) {
		if (!navbar) return 0;

		const navMin = getRootNumber("--nav-height-min", 58);
		const navMax = getRootNumber("--nav-height-max", 78);

		if (navMode === "down" || navMode === "up-section") {
			return navMin;
		}

		return navbar.offsetHeight || navMax;
	}
	
	/* =================================================
	   CENTRAL SCROLL ENGINE
	================================================= */	
	function scrollToSection(target, navMode = null, { bounceOnComplete = false } = {}) {	
		if (!target) return;

		const isHeroTarget = target.classList?.contains("hero");

		const effectiveNavMode = isHeroTarget && navMode === "up-section" ? "hero-top" : navMode;

		const navOffset = isHeroTarget ? 0 : getTargetNavOffset(effectiveNavMode);

		const shouldInsetByOnePixel =
			target.matches?.("#about, #gallery, #services, #pricing, #testimonials, #contact");

		const inset = shouldInsetByOnePixel ? sectionScrollInset : 0;

		const y =
			target.getBoundingClientRect().top +
			window.pageYOffset -
			navOffset +
			inset;

		const isFooterTarget = target.tagName?.toLowerCase() === "footer";
		const navOffset = isHeroTarget || isFooterTarget ? 0 : getTargetNavOffset(effectiveNavMode);

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
				
				if (bounceOnComplete) {
					triggerScreenBounce();
				}
			}
		});
	}

	/* =========================
	   SECTION SCROLL NAVIGATION
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

	const footer = document.querySelector("footer");
	const sectionNavClickDelay = 240;

	function getSectionIndex(sectionEl) {
		return orderedSections.findIndex(section => section === sectionEl);
	}

	function navigateSection(sectionEl, direction, allowPrev = true) {
		if (!sectionEl) return;

		const currentIndex = getSectionIndex(sectionEl);
		if (currentIndex === -1) return;

		if (direction === "next") {
			let nextTarget = null;

			if (sectionEl.id === "contact") {
				nextTarget = footer;
			} else {
				nextTarget = orderedSections[currentIndex + 1] || null;
			}

			if (!nextTarget) return;

			manualNavbarOpen = false;
			setNavbarTargets(1, 1, 1);
			scrollToSection(nextTarget, "down", {
				bounceOnComplete: sectionEl.id === "contact"
			});
			startNavbarAnimation();
			return;
		}

		if (direction === "prev") {
			if (!allowPrev) return;

			const prevTarget = orderedSections[currentIndex - 1] || null;
			if (!prevTarget) return;

			manualNavbarOpen = false;
			setNavbarTargets(1, 1, NAV_SURFACE_UP);
			scrollToSection(prevTarget, "up-section");
			startNavbarAnimation();
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

	/* Hero-Scroll-Indikator */
	const heroIndicator = document.querySelector(".hero .scroll-indicator");

	heroIndicator?.addEventListener("click", (e) => {
		e.preventDefault();
		e.stopPropagation();

		manualNavbarOpen = false;
		setNavbarTargets(1, 1, 1);

		const about = document.querySelector("#about");
		scrollToSection(about, "down");
		startNavbarAnimation();
	});

	document.querySelectorAll("section").forEach(section => {
		if (section.classList.contains("hero")) return;

		bindSectionNavigator(section, section, {
			allowPrev: true,
			headSelector: ".section-scroll-head"
		});
	});
	
	/* scroll indicator footer click */
	const footerToContactTrigger = document.querySelector(".footer-scroll-trigger");

	footerToContactTrigger?.addEventListener("click", (e) => {
		e.preventDefault();
		e.stopPropagation();

		manualNavbarOpen = false;
		setNavbarTargets(1, 1, NAV_SURFACE_UP);

		const contact = document.querySelector("#contact");
		scrollToSection(contact, "up-section");
		startNavbarAnimation();
	});

	footerToContactTrigger?.addEventListener("keydown", (e) => {
		if (e.key !== "Enter" && e.key !== " ") return;

		e.preventDefault();

		manualNavbarOpen = false;
		setNavbarTargets(1, 1, NAV_SURFACE_UP);

		const contact = document.querySelector("#contact");
		scrollToSection(contact, "up-section");
		startNavbarAnimation();
	});
	
	/* Magnetic CTA Button */
	const magneticButtons = document.querySelectorAll(".cta-button");
	magneticButtons.forEach(btn => {
		btn.addEventListener("mousemove", (e) => {
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
	   TRUE INFINITE GALLERY
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

			video.addEventListener("pointerup", e => {
				e.stopPropagation();
				video.paused ? safePlay(video) : video.pause();
			});

			video.addEventListener("ended", () => moveTo(currentIndex + 1, true));

			track.appendChild(video);
			videos.push(video);
		});

		function safePlay(video) {
			const p = video.play();
			if (p !== undefined) p.catch(() => {});
		}

		function playOnly(index) {
			videos.forEach((v, i) => i === index ? (v.currentTime = 0, safePlay(v)) : v.pause());
		}

		function setPosition(index, animate = true) {
			const videoWidth = videos[0].offsetWidth;
			const padding = track.parentElement.offsetWidth * 0.1;
			const offset = videoWidth * index - padding;
			track.style.transition = animate ? "transform 0.6s cubic-bezier(.16,.84,.44,1)" : "none";
			track.style.transform = `translateX(-${offset}px)`;
		}

		function moveTo(index, autoPlay = false) {
			if (isAnimating) return;
			isAnimating = true;
			currentIndex = index;
			setPosition(currentIndex, true);
			if (autoPlay) playOnly(currentIndex);
			else videos.forEach(v => v.pause());
		}

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

		track.addEventListener("touchstart", e => {
			startX = e.touches[0].clientX;
			isDragging = true;
			track.style.transition = "none";
		});

		track.addEventListener("touchmove", e => {
			if (!isDragging) return;
			const diff = e.touches[0].clientX - startX;
			const videoWidth = videos[0].offsetWidth;
			const padding = track.parentElement.offsetWidth * 0.1;
			track.style.transform = `translateX(${-currentIndex * videoWidth + diff - padding}px)`;
		});

		track.addEventListener("touchend", e => {
			if (!isDragging) return;
			const diff = e.changedTouches[0].clientX - startX;
			if (diff > 80) moveTo(currentIndex - 1, true);
			else if (diff < -80) moveTo(currentIndex + 1, true);
			else setPosition(currentIndex, true);
			isDragging = false;
		});

		const gallerySection = document.querySelector(".gallery");
		if (gallerySection) {
			const observer = new IntersectionObserver(entries => {
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
	   NAVBAR
	========================= */
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

	cta?.addEventListener("click", (e) => {
		e.preventDefault();

		manualNavbarOpen = false;
		setNavbarTargets(1, 1, 1);

		const target = document.querySelector("#contact");
		scrollToSection(target, "down");
		startNavbarAnimation();
	});

	if (navLogo) {
		navLogo.addEventListener("click", (e) => {
			e.preventDefault();

			manualNavbarOpen = false;
			setNavbarTargets(1, 1, NAV_SURFACE_UP);

			const heroSection = document.querySelector(".hero");
			scrollToSection(heroSection, "up-section");
			startNavbarAnimation();
		});
	}

	hero?.addEventListener("click", (e) => {
		if (!navbar) return;

		const clickedCTA = e.target.closest(".cta-button");
		const clickedIndicator = e.target.closest(".scroll-indicator");

		if (clickedCTA || clickedIndicator) return;

		const ctaRect = cta?.getBoundingClientRect();

		if (ctaRect) {
			const clickY = e.clientY;

			if (clickY > ctaRect.bottom) {
				manualNavbarOpen = false;
				setNavbarTargets(1, 1, 1);

				const about = document.querySelector("#about");
				scrollToSection(about, "down");
				startNavbarAnimation();
				return;
			}
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

	function handleScroll() {
		if (!navbar) return;

		if (performance.now() < navbarVisibilityLockUntil) {
			targetVisible = 1;
			targetCompact = 1;
			targetSurface = 1;
			startNavbarAnimation();
			return;
		}

		const currentY = window.scrollY;
		const deltaY = currentY - lastScrollY;

		scrollVelocity = deltaY * 0.8;

		if (!programmaticScroll) {
			if (Math.abs(deltaY) > directionLockThreshold) {
				scrollDirection = deltaY > 0 ? "down" : "up";
			}
		}

		lastScrollY = currentY;

		const scrollY = lastScrollY;
		hero?.classList.toggle("scrolled", scrollY > 10);

		/* =========================
		   PROGRAMMATIC SCROLL STATE
		========================= */
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

		/* =========================
		   MANUAL NAVBAR OPEN STATE
		========================= */
		if (manualNavbarOpen) {
			if (scrollY <= 5) {
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

		/* =========================
		   NORMAL SCROLL BEHAVIOR
		========================= */
		if (scrollY <= 5) {
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

	if (navbar) {
		window.addEventListener("scroll", handleScroll, { passive: true });
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
	
	handleScroll();

	document.addEventListener("visibilitychange", () => {
		if (document.hidden) {
			animationRunning = false;
		} else {
			handleScroll();
		}
	});

	/* HAMBURGER TOGGLE */
	if (navToggle && navMenu) {
		navToggle.addEventListener("click", () => {
			navToggle.classList.toggle("active");
			navMenu.classList.toggle("active");
		});
	}

	/* NAV LINKS */
	navLinks.forEach(link => {
		link.addEventListener("click", (e) => {
			e.preventDefault();

			const targetId = link.getAttribute("href");
			const target = document.querySelector(targetId);
			if (!target) return;

			const currentY = window.scrollY;
			const targetY = target.getBoundingClientRect().top + window.pageYOffset;
			const isScrollingUp = targetY < currentY;

			manualNavbarOpen = false;

			if (isScrollingUp) {
				setNavbarTargets(1, 1, NAV_SURFACE_UP);
				scrollToSection(target, "up-section");
			} else {
				setNavbarTargets(1, 1, 1);
				scrollToSection(target, "down");
			}

			startNavbarAnimation();

			navMenu.classList.remove("active");
			navToggle?.classList.remove("active");
		});
	});

	/* Pricing Tabs */
	const pricingTabs = document.querySelectorAll(".pricing-tab");
	const pricingContents = document.querySelectorAll(".pricing-content");

	pricingTabs.forEach(tab => {
		tab.addEventListener("click", () => {
			pricingTabs.forEach(t => t.classList.remove("active"));
			pricingContents.forEach(c => c.classList.remove("active"));

			tab.classList.add("active");
			const target = document.getElementById(tab.dataset.tab);
			if (target) target.classList.add("active");
		});
	});

	/* Jahr im Footer */
	const year = document.getElementById("year");
	if (year) {
		year.textContent = new Date().getFullYear();
	}
});
