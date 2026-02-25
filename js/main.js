document.addEventListener("DOMContentLoaded", () => {

  const navbar = document.querySelector('.navbar');
  const navToggle = document.querySelector('.nav-toggle');
  const navMenu = document.querySelector('.nav-menu');

	// Smooth Scroll mit Navbar-Offset (Android stabil)
	document.querySelectorAll('a[href^="#"]').forEach(anchor => {
	  anchor.addEventListener('click', function (e) {
		const targetId = this.getAttribute('href');

		if (targetId.length > 1) {
		  const target = document.querySelector(targetId);

		  if (target) {
			e.preventDefault();

			const navbarHeight = document.querySelector('.navbar')?.offsetHeight || 0;
			const targetPosition = target.getBoundingClientRect().top + window.pageYOffset;

			window.scrollTo({
			  top: targetPosition - navbarHeight - 10,
			  behavior: 'smooth'
			});
		  }
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

			// Ganz oben → Navbar verstecken
			if (currentScrollY <= 10) {
			  navbar.classList.remove('visible');
			}

			// Scroll nach unten → verstecken
			else if (currentScrollY > lastScrollY) {
			  navbar.classList.remove('visible');
			}

			// Scroll nach oben → anzeigen
			else {
			  navbar.classList.add('visible');
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
