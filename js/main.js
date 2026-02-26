document.addEventListener("DOMContentLoaded", () => {

	
	/* =========================
	   GALLERY SLIDER SYSTEM
	========================= */

	const videoFiles = [
	  "videos/snaptik_7204469200172190982_hd.mp4",
	  "videos/snaptik_7208965603661499654_hd.mp4",
	  "videos/snaptik_7211607331648441605_hd.mp4",
	  "videos/snaptik_7444629475364474145_hd.mp4"
	];

	// Shuffle
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
	  let currentIndex = 0;
	  let videos = [];

	  // Videos erzeugen
	  shuffled.forEach(src => {
		const video = document.createElement("video");
		video.src = src;
		video.playsInline = true;
		video.preload = "metadata";
		video.controls = false;
		video.muted = false;
		video.volume = 1;
		track.appendChild(video);
		videos.push(video);
	  });

	  function updateSlider() {
		track.style.transform = `translateX(-${currentIndex * 100}%)`;

		videos.forEach((vid, i) => {
		  if (i === currentIndex) {
			vid.play().catch(() => {});
		  } else {
			vid.pause();
		  }
		});
	  }

	  updateSlider();

	  /* Swipe Handling */
	  let startX = 0;
	  let isDragging = false;

	  track.addEventListener("touchstart", e => {
		startX = e.touches[0].clientX;
		isDragging = true;
	  });

	  track.addEventListener("touchend", e => {
		if (!isDragging) return;

		let diff = e.changedTouches[0].clientX - startX;

		if (diff > 50 && currentIndex > 0) {
		  currentIndex--;
		}

		if (diff < -50 && currentIndex < videos.length - 1) {
		  currentIndex++;
		}

		updateSlider();
		isDragging = false;
	  });

	  /* Desktop Swipe via Mouse */
	  track.addEventListener("mousedown", e => {
		startX = e.clientX;
		isDragging = true;
	  });

	  track.addEventListener("mouseup", e => {
		if (!isDragging) return;

		let diff = e.clientX - startX;

		if (diff > 50 && currentIndex > 0) {
		  currentIndex--;
		}

		if (diff < -50 && currentIndex < videos.length - 1) {
		  currentIndex++;
		}

		updateSlider();
		isDragging = false;
	  });

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
