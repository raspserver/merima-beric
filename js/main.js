document.addEventListener("DOMContentLoaded", () => {
		
	/* prefers-reduced-motion Support (Accessibility Pflicht) */
	const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
	
	/* SCROLL INDICATOR HERO SECTION */
	const indicator = document.querySelector('.scroll-indicator');



	
	/* Scroll Indicator verschwindet, wenn nach unten gescrollt wird */
	//~ window.addEventListener('scroll', () => {
	  //~ indicator.classList.toggle('hidden', window.scrollY > 40);
	//~ });
	
	/* Scroll Indicator verschwindet, wenn nach unten gescrollt wird					*/
	/* Toggle throttle																	*/
	/* Performance Optimierung. DOM-Update nur wenn sich der Zustand wirklich ändert.	*/
	let indicatorHidden = false;

	window.addEventListener('scroll', () => {
	  const shouldHide = window.scrollY > 40;

	  if (shouldHide !== indicatorHidden) {
		indicator.classList.toggle('hidden', shouldHide);
		indicatorHidden = shouldHide;
	  }
	}, { passive: true });
	
	
	

	/* Scroll Indicator erscheint mit 1,2s Verzögerung, um nicht von den Animationen des Logos abzulenken */
	setTimeout(() => {
	  indicator.classList.add('visible');
	}, 1200);
	
	/* Click auf Scroll Indicator navigiert zur nächsten Sektion */
	indicator.addEventListener('click', () => {
	  const nextSection = document.querySelector('#about');
	  nextSection.scrollIntoView({ behavior: 'smooth' });
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
		if (autoPlay) playOnly(currentIndex); else videos.forEach(v => v.pause());
	  }

	  // Initial
	  setPosition(currentIndex, false);
	  playOnly(currentIndex);

	  // Loop Reset
	  track.addEventListener("transitionend", () => {
		isAnimating = false;
		if (currentIndex === videos.length - 1) currentIndex = 1;
		if (currentIndex === 0) currentIndex = videos.length - 2;
		requestAnimationFrame(() => setPosition(currentIndex, false));
	  });

	  // Swipe
	  let startX = 0, isDragging = false;
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

	  // Intersection Observer
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

	  // Visibility API
	  document.addEventListener("visibilitychange", () => {
		document.hidden ? videos.forEach(v => v.pause()) : playOnly(currentIndex);
	  });

	  // Resize Fix
	  window.addEventListener("resize", () => setPosition(currentIndex, false));
	}
	
	/* =========================
	   NAVBAR
	========================= */

	const navbar = document.querySelector(".navbar");
	const hero = document.querySelector(".hero");
	const navToggle = document.querySelector(".nav-toggle");
	const navMenu = document.querySelector(".nav-menu");
	const navLinks = document.querySelectorAll(".nav-menu a");
	
	let lastScrollY = window.scrollY;
	let scrollVelocity = 0;

	if (navbar) {

		/* prefers-reduced-motion Support (Accessibility Pflicht) */
		if (prefersReducedMotion) {
		  navbar.style.setProperty("--nav-progress", 1);
		  navbar.style.setProperty("--nav-height-progress", 1);
		  return;
		}

	  /* ===============================
		   CLEAN DUAL SPRING SYSTEM
		================================ */

		const inertiaThreshold = 180;

		let targetProgress = 0;
		let currentProgress = 0;
		let velocity = 0;

		let heightProgress = 0;
		let heightVelocity = 0;
		
		let stiffness, damping, heightStiffness, heightDamping;

		function updatePhysics() {
		  const isMobile = window.innerWidth <= 768;

		  stiffness = isMobile ? 0.06 : 0.08;
		  damping = isMobile ? 0.85 : 0.82;

		  heightStiffness = isMobile ? 0.035 : 0.045;
		  heightDamping = isMobile ? 0.9 : 0.88;
		}

		updatePhysics();
		window.addEventListener("resize", updatePhysics);
		
		function handleScroll() {
			
			const currentY = window.scrollY;
			scrollVelocity = (currentY - lastScrollY) * 0.8;
			lastScrollY = currentY;	
		
		  const scrollY = Math.max(window.scrollY, 0);

		  if (scrollY <= 5) {
			  targetProgress = 0;
			} else {
			  const raw = scrollY / inertiaThreshold;
			  targetProgress = Math.min(Math.max(raw, 0), 1);
			}
		    
		  if (!animationRunning) {
			  animationRunning = true;
			  lastFrameTime = performance.now();
			  requestAnimationFrame(animate);
			}
		  
		}

		window.addEventListener("scroll", handleScroll, { passive: true });

		let animationRunning = false;
		let lastFrameTime = performance.now();
		function animate(now) {
			
			/* Scroll Engine FPS-Schutz */
			if (document.hidden) {
			   animationRunning = false;
			   return;
			}
				
		  animationRunning = true;
		  
		  scrollVelocity *= 0.9;

		  /* ===== SCALE SPRING ===== */

		  const force = (targetProgress - currentProgress) * stiffness;
			const delta = (now - lastFrameTime) / 16.67;
			lastFrameTime = now;
			
			velocity += force * delta;
			velocity *= Math.pow(damping, delta);
			currentProgress += velocity * delta;

			currentProgress = Math.max(0, Math.min(currentProgress, 1));

		  /* ===== HEIGHT SPRING ===== */

		  const heightForce = (currentProgress - heightProgress) * heightStiffness;

			heightVelocity += heightForce * delta;
			heightVelocity *= Math.pow(heightDamping, delta);
			heightProgress += heightVelocity * delta;

		  heightProgress = Math.max(0, Math.min(heightProgress, 1));
		  
		  // Ease-Out-Cubic
			const easedHeight = 1 - Math.pow(1 - heightProgress, 3);

			navbar.style.setProperty("--nav-progress", currentProgress);
			navbar.style.setProperty("--nav-height-progress", easedHeight);
			
			// ✨ Velocity Based Blur Boost
			const velocityFactor = Math.min(Math.abs(scrollVelocity) * 0.15, 6);
			navbar.style.setProperty("--nav-velocity-blur", velocityFactor);
		  	
			if (hero) {

			  const counter = 1 - currentProgress;

			  hero.style.setProperty("--hero-scale", 1 + (counter * 0.01));
			  hero.style.setProperty("--hero-brightness", 1 - (currentProgress * 0.06));

			  // ✨ Parallax (sehr subtil)
			  const scrollY = window.scrollY;
			  const parallaxOffset = Math.min(scrollY * -0.04, -40);

			  hero.style.setProperty("--hero-parallax", `${parallaxOffset}px`);
			}

		  /* ===== STOP CONDITION ===== */

		  const stillMoving =
			Math.abs(targetProgress - currentProgress) > 0.0005 ||
			Math.abs(velocity) > 0.0005 ||
			Math.abs(heightVelocity) > 0.0005;

		  if (stillMoving) {
			requestAnimationFrame(animate);
		  } else {
			animationRunning = false;
		  }
		}

	  handleScroll();
	  
	  /* VISIBILITY API – RAF & Videos pausieren wenn Tab inaktiv */
	  document.addEventListener("visibilitychange", () => {
		  if (document.hidden) {
			animationRunning = false;
		  } else {
			handleScroll(); // re-sync when returning
		  }
		});
	  
	  
	/* HAMBURGER TOGGLE */
	if (navToggle && navMenu) {
	  navToggle.addEventListener("click", (e) => {
		e.stopPropagation(); // verhindert Konflikt mit navbar click

		navToggle.classList.toggle("active");
		navMenu.classList.toggle("active");
	  });
	}

	/* HERO CLICK */


	  /* NAVBAR CLICK (nur im Home sichtbar schließen) */

	  /* HERO CTA */
	  const heroCta = document.querySelector(".cta-button");

		if (heroCta) {
		  heroCta.addEventListener("click", (e) => {
			e.preventDefault();

			const target = document.querySelector("#contact");
			if (!target) return;

			const navbarHeight = navbar.offsetHeight;
			const targetPosition = target.offsetTop - navbarHeight;

			window.scrollTo({
			  top: targetPosition,
			  behavior: "smooth"
			});
		  });
		}
	  
	  

	  /* NAV LINKS */		
		navLinks.forEach(link => {
		  link.addEventListener("click", (e) => {

			e.preventDefault();

			const targetId = link.getAttribute("href");
			const target = document.querySelector(targetId);
			if (!target) return;

			const navbarHeight = navbar.offsetHeight;
			const targetPosition = target.offsetTop - navbarHeight;

			window.scrollTo({
			  top: targetPosition,
			  behavior: "smooth"
			});

			navMenu.classList.remove("active");
			navToggle.classList.remove("active");
		  });
		});

	}
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	


  /* Pricing Tabs */
  const pricingTabs = document.querySelectorAll('.pricing-tab');
  const pricingContents = document.querySelectorAll('.pricing-content');

  pricingTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      pricingTabs.forEach(t => t.classList.remove('active'));
      pricingContents.forEach(c => c.classList.remove('active'));

      tab.classList.add('active');
      const target = document.getElementById(tab.dataset.tab);
      if (target) target.classList.add('active');
    });
  });

  /* Jahr im Footer */
  const year = document.getElementById('year');
  if (year) {
    year.textContent = new Date().getFullYear();
  }

});
