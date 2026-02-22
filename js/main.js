document.addEventListener("DOMContentLoaded", () => {

  const navbar = document.querySelector('.navbar');
  const navToggle = document.querySelector('.nav-toggle');
  const navMenu = document.querySelector('.nav-menu');
  const navLogo = document.querySelector('.nav-logo');

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

  document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));

  /* Mobile Menu */
  if (navToggle && navMenu) {
	  navToggle.addEventListener('click', () => {
		navToggle.classList.toggle('active');
		navMenu.classList.toggle('active');
	  });
  if (navToggle && navMenu) {

  document.addEventListener('click', (event) => {
    if (!navMenu.contains(event.target) && 
        !navToggle.contains(event.target) && 
        navMenu.classList.contains('active')) {
      navToggle.classList.remove('active');
      navMenu.classList.remove('active');
    }
  });

  /* Pricing Tabs */
  const pricingTabs = document.querySelectorAll('.pricing-tab');
  const pricingContents = document.querySelectorAll('.pricing-content');

  pricingTabs.forEach(tab => {
    tab.addEventListener('click', () => {

      pricingTabs.forEach(t => t.classList.remove('active'));
      pricingContents.forEach(c => c.classList.remove('active'));

      tab.classList.add('active');
      document.getElementById(tab.dataset.tab).classList.add('active');
    });
  });

  /* Smooth Scroll */
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
	  anchor.addEventListener('click', function (e) {

		const target = document.querySelector(this.getAttribute('href'));
		if (!target) return;

		e.preventDefault();

		const offset = 80;
		const position = target.offsetTop - offset;

		window.scrollTo({
		  top: position,
		  behavior: 'smooth'
		});

		/* 🔥 Menü automatisch schließen wenn offen */
		if (navMenu && navMenu.classList.contains('active')) {
		  navToggle.classList.remove('active');
		  navMenu.classList.remove('active');
		}

	  });
	});

  /* Navbar visibility */
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('visible', window.pageYOffset > 100);
  });

  /* Footer year */
  document.getElementById("year").textContent = new Date().getFullYear();
  
	.fade-in {
	  opacity: 0;
	  transform: translateY(20px);
	  transition: ...
	}

	.fade-in.visible {
	  opacity: 1;
	  transform: translateY(0);
	}

});
