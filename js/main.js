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

 
 
 

	  /* ===============================
		   CLEAN DUAL SPRING SYSTEM
		================================ */

		const inertiaThreshold = 180;

		let targetProgress = 0;
		let currentProgress = 0;
		let velocity = 0;

		let heightProgress = 0;
		let heightVelocity = 0;

		const stiffness = 0.08;
		const damping = 0.82;

		const heightStiffness = 0.045;
		const heightDamping = 0.88;

		function handleScroll() {
		  const scrollY = Math.max(window.scrollY, 0);

		  if (scrollY <= 5) {
			  targetProgress = 0;
			} else {
			  const raw = scrollY / inertiaThreshold;
			  targetProgress = Math.min(Math.max(raw, 0), 1);
			}

		  if (!animationRunning) {
			requestAnimationFrame(animate);
		  }
		}
		
		

		window.addEventListener("scroll", handleScroll, { passive: true });

		let animationRunning = false;
		function animate() {

		  animationRunning = true;

		  /* ===== SCALE SPRING ===== */

		  const force = (targetProgress - currentProgress) * stiffness;
		  velocity += force;
		  velocity *= damping;
		  currentProgress += velocity;

		  currentProgress = Math.max(0, Math.min(currentProgress, 1));

		  /* ===== HEIGHT SPRING ===== */

		  const heightForce = (currentProgress - heightProgress) * heightStiffness;
		  heightVelocity += heightForce;
		  heightVelocity *= heightDamping;
		  heightProgress += heightVelocity;

		  heightProgress = Math.max(0, Math.min(heightProgress, 1));
		  
		  // Ease-Out-Cubic
			const easedHeight = 1 - Math.pow(1 - heightProgress, 3);

			navbar.style.setProperty("--nav-progress", currentProgress);
			navbar.style.setProperty("--nav-height-progress", easedHeight);
		  
		  
		  
		  if (hero) {

			  const counter = 1 - currentProgress;

			  hero.style.setProperty("--hero-scale", 1 + (counter * 0.01));
			  hero.style.setProperty("--hero-brightness", 1 - (currentProgress * 0.06));
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
