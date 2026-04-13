// ---------------------------------------------------------------------
// DOM-REFERENZEN
// ---------------------------------------------------------------------
export const DOM = {
	navbar: document.querySelector(".navbar"),
	hero: document.querySelector(".hero"),
	heroContent: document.querySelector(".hero-content"),
	navToggle: document.querySelector(".nav-toggle"),
	navMenu: document.querySelector(".nav-menu"),
	navLinks: [...document.querySelectorAll(".nav-menu a")],
	navLogo: document.querySelector(".nav-logo"),
	cta: document.querySelector(".cta-button"),
	ctaLabel: document.querySelector(".cta-button .cta-label"),
	heroInner: document.querySelector(".hero-inner"),
	heroCalendar: document.getElementById("hero-calendar"),
	heroCalendarEl: document.getElementById("hero-fullcalendar"),
	footer: document.querySelector("footer"),
	track: document.querySelector(".gallery-track"),
	pricingTabs: [...document.querySelectorAll(".pricing-tab")],
	pricingContents: [...document.querySelectorAll(".pricing-content")],
	year: document.getElementById("year"),
};
