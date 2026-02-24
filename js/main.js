document.addEventListener("DOMContentLoaded", () => {

  const navbar = document.querySelector('.navbar');
  const navToggle = document.querySelector('.nav-toggle');
  const navMenu = document.querySelector('.nav-menu');

	/* Navbar beim Scrollen anzeigen */
	const hero = document.querySelector('.hero');
	window.addEventListener('scroll', () => {

	  if (navbar) {
		navbar.classList.toggle('visible', window.scrollY > 100);
	  }

	  if (hero) {
		const heroHeight = hero.offsetHeight;
		hero.classList.toggle('scrolled', window.scrollY > heroHeight * 0.4);
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

//  document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));



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
