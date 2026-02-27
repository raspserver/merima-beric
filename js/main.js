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
	  
	  let isTransitioning = false;

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

		  isTransitioning = true;

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
		  
		  isTransitioning = false;

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

		function handleGalleryVisibility() {

		  const rect = gallerySection.getBoundingClientRect();
		  const windowHeight = window.innerHeight;

		  const fullyOut =
			rect.bottom < 0 || rect.top > windowHeight;

		  if (fullyOut) {
			videos.forEach(video => video.pause());
		  } else {
			playOnly(currentIndex);
		  }
		}

		window.addEventListener("scroll", handleGalleryVisibility);
		window.addEventListener("resize", handleGalleryVisibility);
	  
	  

	}
	


  const navbar = document.querySelector('.navbar');
  const navToggle = document.querySelector('.nav-toggle');
  const navMenu = document.querySelector('.nav-menu');

	/* Native Smooth Scroll + Snap kompatibel */
	document.querySelectorAll('a[href^="#"]').forEach(anchor => {
	  anchor.addEventListener('click', () => {

		// Mobile Menü schließen
		if (navToggle && navMenu) {
		  navToggle.classList.remove('active');
		  navMenu.classList.remove('active');
		}

	  });
	});

	/* Navbar beim Scrollen anzeigen */
	const hero = document.querySelector('.hero');
	
	/* === Premium Scroll Direction Navbar === */
	let lastScrollY = window.scrollY;
	let ticking = false;

	window.addEventListener('scroll', () => {
	  if (!ticking) {
		window.requestAnimationFrame(() => {

		  const currentScrollY = window.scrollY;
		  
		  if (navbar) {

			  if (currentScrollY <= 10) {
				navbar.classList.remove('visible', 'compact');
			  }

			  else if (currentScrollY > lastScrollY) {
				navbar.classList.remove('visible');
			  }

			  else {
				navbar.classList.add('visible');

				// compact sobald nicht mehr ganz oben
				if (currentScrollY > 80) {
				  navbar.classList.add('compact');
				} else {
				  navbar.classList.remove('compact');
				}
			  }
			}
		  
		  

		  // Hero settling Effekt bleibt wie gehabt
		  if (hero) {
			const heroHeight = hero.offsetHeight;
			hero.classList.toggle('scrolled', currentScrollY > heroHeight * 0.4);
		  }

		  lastScrollY = currentScrollY;
		  ticking = false;

		});

		ticking = true;
	  }
	});

  /* Intersection Observer */
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  });

  if (navToggle && navMenu) {

	  // Toggle Button (Hamburger)
	  navToggle.addEventListener('click', () => {
		navToggle.classList.toggle('active');
		navMenu.classList.toggle('active');
	  });

	  // Menü schließen bei Klick auf Nav-Link
	  const navLinks = document.querySelectorAll('.nav-menu a');

	  navLinks.forEach(link => {
		link.addEventListener('click', () => {
		  navToggle.classList.remove('active');
		  navMenu.classList.remove('active');
		});
	  });

	  // Menü schließen bei Klick außerhalb
	  document.addEventListener('click', (event) => {
		if (
		  !navMenu.contains(event.target) &&
		  !navToggle.contains(event.target) &&
		  navMenu.classList.contains('active')
		) {
		  navToggle.classList.remove('active');
		  navMenu.classList.remove('active');
		}
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
