document.addEventListener("DOMContentLoaded", () => {

	/* =========================
	   GALLERY VIDEO SYSTEM
	========================= */

	const videoFiles = [
	  "videos/snaptik_7204469200172190982_hd.mp4",
	  "videos/snaptik_7208965603661499654_hd.mp4",
	  "videos/snaptik_7211607331648441605_hd.mp4",
	  "videos/snaptik_7444629475364474145_hd.mp4"
	  // hier neue Videos ergänzen
	];

	// Shuffle Funktion
	function shuffle(array) {
	  for (let i = array.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[array[i], array[j]] = [array[j], array[i]];
	  }
	  return array;
	}

	const galleryContainer = document.querySelector(".gallery-videos");

	if (galleryContainer) {

	  const shuffledVideos = shuffle([...videoFiles]);

	  shuffledVideos.forEach(src => {
		const video = document.createElement("video");

		video.src = src;
		video.muted = true;
		video.playsInline = true;
		video.preload = "metadata";
		video.style.opacity = "0";
		video.style.transition = "opacity 0.6s ease";

		galleryContainer.appendChild(video);
	  });

	  const videos = document.querySelectorAll(".gallery video");

	  const videoObserver = new IntersectionObserver(entries => {
		entries.forEach(entry => {
		  const video = entry.target;

		  if (entry.isIntersecting) {
			video.play().catch(() => {});
			video.style.opacity = "1";
		  } else {
			video.pause();
		  }
		});
	  }, {
		threshold: 0.35
	  });

	  videos.forEach(video => {
		videoObserver.observe(video);
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
