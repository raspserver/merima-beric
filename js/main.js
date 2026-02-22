document.addEventListener("DOMContentLoaded", () => {

  const navbar = document.querySelector('.navbar');
  const navToggle = document.querySelector('.nav-toggle');
  const navMenu = document.querySelector('.nav-menu');

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

  /* Mobile Menu Toggle */
  if (navToggle && navMenu) {

    navToggle.addEventListener('click', () => {
      navToggle.classList.toggle('active');
      navMenu.classList.toggle('active');
    });

    document.addEventListener('click', (event) => {
      if (!navMenu.contains(event.target) &&
          !navToggle.contains(event.target) &&
          navMenu.classList.contains('active')) {
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
      pricing
