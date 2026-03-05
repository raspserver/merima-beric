document.addEventListener("DOMContentLoaded", () => {
	
	/* prefers-reduced-motion Support (Accessibility Pflicht) */
	const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
	
	
	
	
	
	
	
	//~ /* =========================
	   //~ HOMESCREEN TAP NAVBAR
	//~ ========================= */
	//~ const hero = document.querySelector(".hero");
	//~ const ctaButton = document.querySelector(".cta-button");
	
	//~ /* Scroll-Physics Funktion */
	//~ function smoothScrollTo(targetY, duration) {

	  //~ const startY = window.scrollY;
	  //~ const diff = targetY - startY;

	  //~ let startTime = null;

	  //~ function step(timestamp) {

		//~ if (!startTime) startTime = timestamp;

		//~ const progress = Math.min((timestamp - startTime) / duration, 1);

		//~ // Ease-Out (fühlt sich wie iOS an)
		//~ const eased = 1 - Math.pow(1 - progress, 3);

		//~ window.scrollTo(0, startY + diff * eased);

		//~ if (progress < 1) {
		  //~ requestAnimationFrame(step);
		//~ }

	  //~ }

	  //~ requestAnimationFrame(step);

	//~ }
	
	//~ /* Tap-Spam Schutz */
	//~ let navTapAnimating = false;
	//~ let navTapOpened = false;
	
	//~ /* Tap Logik */
	//~ hero.addEventListener("click", (e) => {

	  //~ if (prefersReducedMotion) return;

	  //~ // Anti-Spam
	  //~ if (navTapAnimating) return;

	  //~ // CTA Button ignorieren
	  //~ if (ctaButton && ctaButton.contains(e.target)) return;

	  //~ // nur wenn wirklich im Hero
	  //~ if (!hero.contains(e.target)) return;

	  //~ // nur wenn ganz oben
	  //~ if (window.scrollY > 5) return;

	  //~ navTapAnimating = true;

	  //~ if (!navTapOpened) {

		//~ navTapOpened = true;

		//~ smoothScrollTo(window.innerHeight * 0.35, 2000);

		//~ setTimeout(() => {
		  //~ navTapAnimating = false;
		//~ }, 2000);

	  //~ } else {

		//~ navTapOpened = false;

		//~ smoothScrollTo(0, 500);

		//~ setTimeout(() => {
		  //~ navTapAnimating = false;
		//~ }, 500);

	  //~ }

	//~ });
	
	//~ /* Scroll Reset */
	//~ window.addEventListener("scroll", () => {

	  //~ if (window.scrollY > window.innerHeight * 0.4) {
		//~ navTapOpened = false;
	  //~ }

	//~ });	
	
	//~ /* =========================
	   //~ NAVBAR SCROLL PROGRESS
	//~ ========================= */

	//~ const navbar = document.querySelector(".navbar");
	//~ navbar.style.setProperty("--nav-progress", 0);
	//~ navbar.style.setProperty("--nav-height-progress", 0);
	//~ if (!navbar) return;

	//~ function updateNavbar() {

	  //~ const scrollY = window.scrollY;
	  //~ const heroHeight = window.innerHeight;

	  //~ // Progress von 0 → 1
	  //~ let progress = scrollY / (heroHeight * 0.35);
	  //~ progress = Math.max(0, Math.min(progress, 1));

	  //~ navbar.style.setProperty("--nav-progress", progress);

	  //~ // Height Progress etwas langsamer
	  //~ let heightProgress = scrollY / (heroHeight * 0.55);
	  //~ heightProgress = Math.max(0, Math.min(heightProgress, 1));

	  //~ navbar.style.setProperty("--nav-height-progress", heightProgress);

	//~ }

	//~ window.addEventListener("scroll", updateNavbar);
	//~ updateNavbar();
	

	
	
	
	
	
	
	/* =========================
	   TRUE INFINITE GALLERY
	========================= */

	const videoFiles = [
	  "videos/snaptik_7204469200172190982_hd.mp4",
	  "videos/snaptik_7208965603661499654_hd.mp4",
	  "videos/snaptik_7211607331648441605_hd.mp4",
	  "videos/snaptik_7444629475364474145_hd.mp4"
	];
	
	/* Gallery Anti-Spam Guard */
	let isAnimating = false;

	function shuffle(array) {
	  for (let i = array.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[array[i], array[j]] = [array[j], array[i]];
	  }
	  return array;
	}

	const track = document.querySelector(".gallery-track");

	if (track) {

	  const shuffled = shuffle([...videoFiles]);

	  let videos = [];
	  let currentIndex = 1; // wir starten bei 1 wegen clone

	  // 1️⃣ Clone letztes Video vorne einfügen
	  const firstCloneSrc = shuffled[0];
	  const lastCloneSrc = shuffled[shuffled.length - 1];

	  const fullList = [
		lastCloneSrc,
		...shuffled,
		firstCloneSrc
	  ];

	  fullList.forEach(src => {
		const video = document.createElement("video");
		video.src = src;
		video.playsInline = true;
		video.preload = "metadata";
		video.controls = false;
		video.muted = true;

		track.appendChild(video);
		videos.push(video);

		// Tap = Play/Pause
		video.addEventListener("click", () => {
		  if (video.paused) {
			video.play();
		  } else {
			video.pause();
		  }
		});

		video.addEventListener("ended", () => {
		  moveTo(currentIndex + 1, true);
		});
	  });

	  function setPosition(index, animate = true) {
		if (!animate) {
		  track.style.transition = "none";
		} else {
		  track.style.transition = "transform 0.6s cubic-bezier(.16,.84,.44,1)";
		}

		track.style.transform = `translateX(-${index * 100}%)`;
	  }
	  
	  function playOnly(index) {
		  videos.forEach((video, i) => {
			if (i === index) {
			  video.currentTime = 0;
			  video.play();
			} else {
			  video.pause();
			}
		  });
		}

		/* Gallery Anti-Spam Guard */
		function moveTo(index, autoPlay = false) {

		  if (isAnimating) return;
		  isAnimating = true;

		  currentIndex = index;
		  setPosition(currentIndex, true);

		  if (autoPlay) {
			playOnly(currentIndex);
		  } else {
			videos.forEach(video => video.pause());
		  }
		}
	  
	  // Initial Position
	  setPosition(currentIndex, false);
	  playOnly(currentIndex);

	  // Transition-End-Check (unsichtbarer Sprung)
		
		track.addEventListener("transitionend", () => {

		  let jumped = false;
		  isAnimating = false;

		  if (currentIndex === videos.length - 1) {
			currentIndex = 1;
			jumped = true;
		  }

		  if (currentIndex === 0) {
			currentIndex = videos.length - 2;
			jumped = true;
		  }

		  if (jumped) {
			setPosition(currentIndex, false);
			playOnly(currentIndex);
		  }

		});
	  
	  
	  
	function next() {
		moveTo(currentIndex + 1, true);
	}

	function prev() {
		moveTo(currentIndex - 1, true);
	}
	  
		/* prefers-reduced-motion Support (Accessibility Pflicht) */
		if (prefersReducedMotion) {
		  videos.forEach(v => v.pause());
		  return;
		}

	  // Swipe
		track.style.touchAction = "pan-y";

	    let startX = 0;
		let isDragging = false;

		track.addEventListener("pointerdown", (e) => {
		  startX = e.clientX;
		  isDragging = true;
		});

		track.addEventListener("pointerup", (e) => {
		  if (!isDragging) return;

		  const diff = e.clientX - startX;

		  if (diff > 50) prev();
		  if (diff < -50) next();

		  isDragging = false;
		});

	  const gallerySection = document.querySelector(".gallery");

	if (gallerySection) {

	  const observer = new IntersectionObserver((entries) => {

		entries.forEach(entry => {

		  const activeVideo = videos[currentIndex];

		  if (!activeVideo) return;
			
			/* Sicherheits-Guard für IntersectionObserver */
			if (entry.isIntersecting) {
			  playOnly(currentIndex);
			} else {
			  videos.forEach(v => v.pause());
			}
		  
		});

	  }, {
		threshold: 0.4  // 40% sichtbar = aktiv
	  });

	  observer.observe(gallerySection);
	 
	  /* VISIBILITY API – RAF & Videos pausieren wenn Tab inaktiv */
	  document.addEventListener("visibilitychange", () => {
		  if (document.hidden) {
			videos.forEach(v => v.pause());
		  } else {
			playOnly(currentIndex);
		  }
		});
	  
	}
	  
	  
	  /* Resize-Fix für Gallery Width */
		window.addEventListener("resize", () => {
		  setPosition(currentIndex, false);
		});
	  
	  
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
