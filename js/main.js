document.addEventListener("DOMContentLoaded", () => {
	
	/* =========================
	   TRUE INFINITE GALLERY
	========================= */

	const videoFiles = [
	  "videos/snaptik_7204469200172190982_hd.mp4",
	  "videos/snaptik_7208965603661499654_hd.mp4",
	  "videos/snaptik_7211607331648441605_hd.mp4",
	  "videos/snaptik_7444629475364474145_hd.mp4"
	];

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
		video.muted = false;

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

	  
		function moveTo(index, autoPlay = false) {

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
	  

	  // Swipe
	  let startX = 0;
	  let isDragging = false;

	  track.addEventListener("touchstart", e => {
		startX = e.touches[0].clientX;
		isDragging = true;
	  });

	  track.addEventListener("touchend", e => {
		if (!isDragging) return;

		let diff = e.changedTouches[0].clientX - startX;

		if (diff > 50) prev();
		if (diff < -50) next();

		isDragging = false;
	  });

	  track.addEventListener("mousedown", e => {
		startX = e.clientX;
		isDragging = true;
	  });

	  track.addEventListener("mouseup", e => {
		if (!isDragging) return;

		let diff = e.clientX - startX;

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

		  if (entry.isIntersecting) {
			// Nur abspielen wenn pausiert und nicht am Anfang
			if (activeVideo.paused && activeVideo.currentTime > 0) {
			  activeVideo.play();
			}
		  } else {
			activeVideo.pause();
		  }

		});

	  }, {
		threshold: 0.4  // 40% sichtbar = aktiv
	  });

	  observer.observe(gallerySection);
	}
	  
	}







	
	
	
	
	
	
	
	/* =========================
	   NAVBAR (STATE MACHINE)
	========================= */

	const navbar = document.querySelector(".navbar");
	const hero = document.querySelector(".hero");
	const navToggle = document.querySelector(".nav-toggle");
	const navMenu = document.querySelector(".nav-menu");
	const navLinks = document.querySelectorAll(".nav-menu a");
	const navbarHeight = navbar.getBoundingClientRect().height;

	if (navbar) {

	  const STATES = {
		HOME_HIDDEN: "HOME_HIDDEN",
		HOME_VISIBLE: "HOME_VISIBLE",
		SCROLLED: "SCROLLED",
		COMPACT: "COMPACT"
	  };

	  let currentState = STATES.HOME_HIDDEN;

	  function setState(newState) {
		if (currentState === newState) return;

		currentState = newState;
		render();
	  }

	  function render() {
		navbar.classList.remove("visible", "compact");

		switch (currentState) {

		  case STATES.HOME_HIDDEN:
			break;

		  case STATES.HOME_VISIBLE:
			navbar.classList.add("visible");
			break;

		  case STATES.SCROLLED:
			navbar.classList.add("visible");
			break;

		  case STATES.COMPACT:
			navbar.classList.add("visible");
			navbar.classList.add("compact");
			break;
		}
	  }
 
	  const inertiaThreshold = 180; // px bis full compact

		function handleScroll() {

		  const scrollY = Math.max(window.scrollY, 0);
		  const isHome = scrollY <= 5;

		  // HERO STATE
		  if (isHome) {
			navbar.style.setProperty("--nav-progress", 0);

			if (currentState !== STATES.HOME_VISIBLE) {
			  setState(STATES.HOME_HIDDEN);
			}

			return;
		  }

		  // Ab hier Navbar immer sichtbar
		  if (!navbar.classList.contains("visible")) {
			navbar.classList.add("visible");
		  }

		  // Progress berechnen (0 → 1)
		  const rawProgress = scrollY / inertiaThreshold;
		  const clamped = Math.min(Math.max(rawProgress, 0), 1);

		  // Easing Curve (Luxury Feel)
		  const eased = 1 - Math.pow(1 - clamped, 3);

		  navbar.style.setProperty("--nav-progress", eased);
		}

	  window.addEventListener("scroll", handleScroll, { passive: true });

	  handleScroll();
	  
	/* HAMBURGER TOGGLE */
	if (navToggle && navMenu) {
	  navToggle.addEventListener("click", (e) => {
		e.stopPropagation(); // verhindert Konflikt mit navbar click

		navToggle.classList.toggle("active");
		navMenu.classList.toggle("active");
	  });
	}

	/* HERO CLICK */
	  if (hero) {
		hero.addEventListener("click", () => {
		  if (window.scrollY <= 5) {
			if (currentState === STATES.HOME_VISIBLE) {
			  setState(STATES.HOME_HIDDEN);
			} else {
			  setState(STATES.HOME_VISIBLE);
			}
		  }
		});
		hero.style.transform = `scale(${1 - (eased * 0.008)})`;
		hero.style.filter = `brightness(${1 - (eased * 0.05)})`;
	  }

	  /* NAVBAR CLICK (nur im Home sichtbar schließen) */
	  navbar.addEventListener("click", (e) => {

		if (currentState !== STATES.HOME_VISIBLE) return;

		if (e.target.closest(".nav-menu")) return;
		if (e.target.closest(".nav-toggle")) return;

		setState(STATES.HOME_HIDDEN);
	  });

	  /* HERO CTA */
	  const heroCta = document.querySelector(".cta-button");

	  if (heroCta) {
		heroCta.addEventListener("click", (e) => {
		  e.preventDefault();

		  const target = document.querySelector("#contact");
		  if (!target) return;

		  const navbarHeight = navbar.offsetHeight;
		  const targetPosition = target.offsetTop - navbarHeight;

		  setState(STATES.COMPACT);

		  window.scrollTo({ top: targetPosition });
		});
	  }

	  /* NAV LINKS */
	  navLinks.forEach(link => {
		  link.addEventListener("click", (e) => {

			e.preventDefault();
			e.stopPropagation();

			const targetId = link.getAttribute("href");
			const target = document.querySelector(targetId);
			if (!target) return;

			// 1️⃣ Erst Navbar fixieren
			setState(STATES.COMPACT);

			// 2️⃣ Einen Frame warten damit Layout stabil ist
			requestAnimationFrame(() => {

			  const navbarHeight = navbar.offsetHeight;
			  const targetPosition = target.offsetTop - navbarHeight;

			  window.scrollTo({
				top: targetPosition,
				behavior: "smooth"
			  });

			});

			navMenu.classList.remove("active");
			navToggle.classList.remove("active");
		  });
		});
	  
	  
	  
	  
	  
	  
	  /* Menü schließen beim Scroll */
		window.addEventListener("scroll", () => {
		  navMenu.classList.remove("active");
		  navToggle.classList.remove("active");
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
