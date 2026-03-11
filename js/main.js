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

	let lastScrollY = window.scrollY;
	let scrollVelocity = 0;
	let scrollDirection = "down";
	const directionLockThreshold = 8;

	let heroParallax = 0;
	let heroParallaxVelocity = 0;

	let animationRunning = false;
	let lastFrameTime = performance.now();

	let programmaticScroll = false;
	let manualNavbarOpen = false;
	let programmaticNavMode = null; // null | "down" | "top"

	let targetVisible = 0;
	let currentVisible = 0;
	let visibleVelocity = 0;

	let targetCompact = 0;
	let currentCompact = 0;
	let compactVelocity = 0;

	let targetSurface = 0;
	let currentSurface = 0;
	let surfaceVelocity = 0;

	let targetBounce = 0;
	let currentBounce = 0;
	let bounceVelocity = 0;

	let stiffness, damping, compactStiffness, compactDamping;
	let bounceStiffness, bounceDamping;

	function updatePhysics() {
		const isMobile = window.innerWidth <= 768;

		stiffness = isMobile ? 0.06 : 0.08;
		damping = isMobile ? 0.85 : 0.82;

		compactStiffness = isMobile ? 0.035 : 0.045;
		compactDamping = isMobile ? 0.9 : 0.88;

		bounceStiffness = isMobile ? 0.16 : 0.18;
		bounceDamping = isMobile ? 0.74 : 0.72;
	}

	updatePhysics();
	window.addEventListener("resize", updatePhysics);

	function startNavbarAnimation() {
		if (!animationRunning) {
			animationRunning = true;
			lastFrameTime = performance.now();
			requestAnimationFrame(animate);
		}
	}

	function applyNavbarStateImmediately(visible, compact, surface) {
		if (!navbar) return;

		targetVisible = currentVisible = visible;
		targetCompact = currentCompact = compact;
		targetSurface = currentSurface = surface;

		visibleVelocity = 0;
		compactVelocity = 0;
		surfaceVelocity = 0;

		const easedCompact = 1 - Math.pow(1 - currentCompact, 3);
		const easedSurface = 1 - Math.pow(1 - currentSurface, 3);

		navbar.style.setProperty("--nav-visible", currentVisible);
		navbar.style.setProperty("--nav-compact", easedCompact);
		navbar.style.setProperty("--nav-surface", easedSurface);
		navbar.style.setProperty("--nav-height-progress", easedCompact);
	}

	function triggerNavbarBounce(delta) {
		if (!navbar || prefersReducedMotion) return;

		const magnitude = Math.min(Math.abs(delta), 120);
		if (magnitude < 2) return;

		const impulse = Math.min(0.18 + (magnitude / 120) * 0.82, 1);

		if (impulse > targetBounce || Math.abs(currentBounce) < 0.08) {
			targetBounce = impulse;
		}

		startNavbarAnimation();
	}

	/* =================================================
	   CENTRAL SCROLL ENGINE
	================================================= */
	function scrollToSection(target, navMode = null) {
		if (!target) return;

		const navHeight = navbar ? navbar.offsetHeight : 0;
		const isHeroTarget = target.classList?.contains("hero");
		const offset = isHeroTarget ? 0 : navHeight;

		const y =
			target.getBoundingClientRect().top +
			window.pageYOffset -
			offset;

		programmaticScroll = true;
		programmaticNavMode = navMode;

		if (navMode === "down") {
			scrollDirection = "down";
		} else if (navMode === "top") {
			scrollDirection = "up";
		}

		window.scrollTo({
			top: Math.max(0, y),
			behavior: "smooth"
		});

		setTimeout(() => {
			const finalMode = programmaticNavMode;
			const finalY = window.scrollY;

			programmaticScroll = false;
			lastScrollY = finalY;

			if (finalMode === "down") {
				targetVisible = 1;
				targetCompact = 1;
				targetSurface = 1;
			} else if (finalMode === "top") {
				if (finalY <= 5) {
					targetVisible = 0;
					targetCompact = 0;
					targetSurface = 0;
				} else {
					targetVisible = 1;
					targetCompact = 1;
					targetSurface = 0.18;
				}
			}

			programmaticNavMode = null;
			startNavbarAnimation();
			handleScroll();
		}, 750);
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

			/* contact -> footer */
			if (sectionEl.id === "contact") {
				nextTarget = footer;
			} else {
				nextTarget = orderedSections[currentIndex + 1] || null;
			}

			if (!nextTarget) return;

			manualNavbarOpen = false;
			applyNavbarStateImmediately(1, 1, 1);
			scrollToSection(nextTarget, "down");
			startNavbarAnimation();
			return;
		}

		if (direction === "prev") {
			if (!allowPrev) return;

			const prevTarget = orderedSections[currentIndex - 1] || null;
			if (!prevTarget) return;

			manualNavbarOpen = false;
			applyNavbarStateImmediately(1, 1, 0.18);

			/* zur Hero soll das bestehende "top"-Verhalten genutzt werden */
			if (prevTarget.classList.contains("hero")) {
				scrollToSection(prevTarget, "top");
			} else {
				scrollToSection(prevTarget, "top");
			}

			startNavbarAnimation();
		}
	}

	function bindSectionNavigator(triggerEl, sectionEl, { allowPrev = true } = {}) {
		if (!triggerEl || !sectionEl) return;

		let clickTimer = null;

		triggerEl.addEventListener("click", (e) => {
			e.preventDefault();
			e.stopPropagation();

			if (clickTimer) clearTimeout(clickTimer);

			clickTimer = setTimeout(() => {
				clickTimer = null;
				navigateSection(sectionEl, "next", allowPrev);
			}, sectionNavClickDelay);
		});

		triggerEl.addEventListener("dblclick", (e) => {
			e.preventDefault();
			e.stopPropagation();

			if (clickTimer) {
				clearTimeout(clickTimer);
				clickTimer = null;
			}

			navigateSection(sectionEl, "prev", allowPrev);
		});

		/* Tastatur-Support */
		triggerEl.addEventListener("keydown", (e) => {
			if (e.key === "Enter" || e.key === " ") {
				e.preventDefault();
				navigateSection(sectionEl, "next", allowPrev);
			}
		});
	}

	/* Hero: vorhandenen Scroll-Indikator nutzen, aber ohne Double-Click-Funktion */
	const heroIndicator = document.querySelector(".hero .scroll-indicator");
	const heroSection = document.querySelector(".hero");
	bindSectionNavigator(heroIndicator, heroSection, { allowPrev: false });

	/* Alle Kopf-Navigatoren der restlichen Sektionen */
	document.querySelectorAll(".section-scroll-head").forEach(head => {
		const parentSection = head.closest("section");
		bindSectionNavigator(head, parentSection, { allowPrev: true });
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
			1 - (Math.min(window.scrollY / window.innerHeight, 1) * 0.15)
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
		applyNavbarStateImmediately(1, 1, 1);

		const target = document.querySelector("#contact");
		scrollToSection(target, "down");
		startNavbarAnimation();
	});

	if (navLogo) {
		navLogo.addEventListener("click", (e) => {
			e.preventDefault();

			manualNavbarOpen = false;
			applyNavbarStateImmediately(1, 1, 0.18);

			const heroSection = document.querySelector(".hero");
			scrollToSection(heroSection, "top");
			startNavbarAnimation();
		});
	}

	hero?.addEventListener("click", (e) => {
		if (!navbar) return;

		const clickedCTA = e.target.closest(".cta-button");
		const clickedIndicator = e.target.closest(".scroll-indicator");

		if (clickedCTA) return;

		/* Der Hero-Scroll-Indikator wird jetzt separat behandelt */
		if (clickedIndicator) return;

		const ctaRect = cta?.getBoundingClientRect();

		if (ctaRect) {
			const clickY = e.clientY;

			if (clickY > ctaRect.bottom) {
				manualNavbarOpen = false;
				applyNavbarStateImmediately(1, 1, 1);

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

	const inertiaThreshold = Math.min(document.documentElement.clientHeight * 0.6, 600);

	function handleScroll() {
		if (!navbar) return;

		const currentY = window.scrollY;
		const delta = currentY - lastScrollY;

		scrollVelocity = delta * 0.8;

		if (!programmaticScroll) {
			triggerNavbarBounce(delta);

			if (Math.abs(delta) > directionLockThreshold) {
				scrollDirection = delta > 0 ? "down" : "up";
			}
		}

		lastScrollY = currentY;

		const scrollY = lastScrollY;
		hero?.classList.toggle("scrolled", scrollY > 10);

		if (programmaticNavMode === "down") {
			targetVisible = 1;
			targetCompact = 1;
			targetSurface = 1;

		} else if (programmaticNavMode === "top") {
			if (scrollY <= 5) {
				targetVisible = 0;
				targetCompact = 0;
				targetSurface = 0;
			} else {
				targetVisible = 1;
				targetCompact = 1;
				targetSurface = 0.18;
			}

		} else if (manualNavbarOpen) {
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

		} else {
			if (scrollY <= 5) {
				targetVisible = 0;
				targetCompact = 0;
				targetSurface = 0;
			} else if (scrollDirection === "down") {
				targetVisible = 1;
				targetCompact = 1;
				targetSurface = 1;
			} else if (scrollDirection === "up") {
				targetVisible = 1;
				targetCompact = 1;
				targetSurface = 0.18;
			}
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

		const visibleForce = (targetVisible - currentVisible) * stiffness;
		visibleVelocity += visibleForce * delta;
		visibleVelocity *= Math.pow(damping, delta);
		currentVisible += visibleVelocity * delta;
		currentVisible = Math.max(0, Math.min(currentVisible, 1));

		const compactForce = (targetCompact - currentCompact) * compactStiffness;
		compactVelocity += compactForce * delta;
		compactVelocity *= Math.pow(compactDamping, delta);
		currentCompact += compactVelocity * delta;
		currentCompact = Math.max(0, Math.min(currentCompact, 1));

		const surfaceForce = (targetSurface - currentSurface) * compactStiffness;
		surfaceVelocity += surfaceForce * delta;
		surfaceVelocity *= Math.pow(compactDamping, delta);
		currentSurface += surfaceVelocity * delta;
		currentSurface = Math.max(0, Math.min(currentSurface, 1));

		const bounceForce = (targetBounce - currentBounce) * bounceStiffness;
		bounceVelocity += bounceForce * delta;
		bounceVelocity *= Math.pow(bounceDamping, delta);
		currentBounce += bounceVelocity * delta;

		currentBounce = Math.max(-0.35, Math.min(currentBounce, 1.2));

		targetBounce *= Math.pow(0.78, delta);
		if (targetBounce < 0.001) targetBounce = 0;

		const easedCompact = 1 - Math.pow(1 - currentCompact, 3);
		const easedSurface = 1 - Math.pow(1 - currentSurface, 3);

		navbar.style.setProperty("--nav-visible", currentVisible);
		navbar.style.setProperty("--nav-compact", easedCompact);
		navbar.style.setProperty("--nav-surface", easedSurface);
		navbar.style.setProperty("--nav-height-progress", easedCompact);

		const easedBounce =
			currentBounce >= 0
				? 1 - Math.pow(1 - Math.min(currentBounce, 1), 2.2)
				: currentBounce;

		navbar.style.setProperty("--nav-bounce", easedBounce);

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

			hero.style.setProperty("--hero-scale", 1 - (progress * 0.01));
			hero.style.setProperty("--hero-brightness", 1 - (progress * 0.06));

			const targetParallax = window.scrollY * -0.06;
			const parallaxForce = (targetParallax - heroParallax) * 0.04;

			heroParallaxVelocity += parallaxForce;
			heroParallaxVelocity *= 0.85;
			heroParallax += heroParallaxVelocity;

			hero.style.setProperty("--hero-parallax", `${heroParallax}px`);
		}

		const stillMoving =
			Math.abs(targetVisible - currentVisible) > 0.0005 ||
			Math.abs(visibleVelocity) > 0.0005 ||
			Math.abs(targetCompact - currentCompact) > 0.0005 ||
			Math.abs(compactVelocity) > 0.0005 ||
			Math.abs(targetSurface - currentSurface) > 0.0005 ||
			Math.abs(surfaceVelocity) > 0.0005 ||
			Math.abs(targetBounce - currentBounce) > 0.0005 ||
			Math.abs(bounceVelocity) > 0.0005;

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
				applyNavbarStateImmediately(1, 1, 0.18);
				scrollToSection(target, "top");
			} else {
				applyNavbarStateImmediately(1, 1, 1);
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
