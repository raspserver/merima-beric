import { physics } from "./core/physics.js";
import { scrollEngine } from "./core/scrollEngine.js";
import { SETTINGS } from "./core/settings.js";
import { springs } from "./core/springs.js";
import { state } from "./core/state.js";
import { bindUserScrollInterrupts } from "./core/bindUserScrollInterrupts.js";
import { cssVar } from "./utils/cssVar.js";
import { clamp }			from	"./utils/helper.js";
import { utils } from "./utils/utils.js";
import { prewarmUtils } from "./utils/prewarmUtils.js";
import { navbarModule } from "./modules/navbarModule.js";
import { performanceModule } from "./modules/performanceModule.js";
import { scrollSectionHintModule } from "./modules/scrollSectionHintModule.js";
import { scrollSectionHintPositionModule } from "./modules/scrollSectionHintPositionModule.js";
import { sectionNavigationModule } from "./modules/sectionNavigationModule.js";
import { uiModule } from "./modules/uiModule.js";
import { galleryModule } from "./modules/galleryModule.js";
import { contactMapModule } from "./modules/contactMapModule.js";
import { SECTION_SELECTOR }			from	"./core/sectionSelector.js";

document.addEventListener("DOMContentLoaded", () => {

  // ---------------------------------------------------------------------
  // 1) GLOBALE EINSTELLUNGEN
  // ---------------------------------------------------------------------


  // ---------------------------------------------------------------------
  // 2) DOM-REFERENZEN
  // ---------------------------------------------------------------------
  
  const DOM = {
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

  // ---------------------------------------------------------------------
  // 3) KLEINE BASIS-HELPER
  // ---------------------------------------------------------------------


  // ---------------------------------------------------------------------
  // 4) CSS-VARIABLEN UND ALLGEMEINE UTILS
  // ---------------------------------------------------------------------


  // ---------------------------------------------------------------------
  // 5) ZENTRALER STATE
  // ---------------------------------------------------------------------
  
  // ---------------------------------------------------------------------
  // 6) PHYSIK-/MOTION-WERTE
  // ---------------------------------------------------------------------


  // ---------------------------------------------------------------------
  // 7) GEMEINSAME HILFSFUNKTIONEN FÜR ANIMATIONEN
  // ---------------------------------------------------------------------
  

  // ---------------------------------------------------------------------
  // 8) SCROLL-ENGINE
  // ---------------------------------------------------------------------


  // ---------------------------------------------------------------------
  // 9) NAVBAR-MODUL
  // ---------------------------------------------------------------------


  // ---------------------------------------------------------------------
  // 10) SECTION-NAVIGATION
  // ---------------------------------------------------------------------

  // ---------------------------------------------------------------------
  // 11) SCROLL-HINT-SYSTEM
  // ---------------------------------------------------------------------

  // ---------------------------------------------------------------------
  // 12) GALLERY-MODUL
  // ---------------------------------------------------------------------


	// ---------------------------------------------------------------------
	// 13) PREWARM UTILITY (für HeroCalendar + ContactMap)
	// ---------------------------------------------------------------------


  // ---------------------------------------------------------------------
  // 14) UI-MODUL (CTA, HERO-KLICK, PRICING TABS)
  // ---------------------------------------------------------------------
  
// ---------------------------------------------------------------------
// 15) CONTACT MAP (MAPLIBRE 3D)
// ---------------------------------------------------------------------


  // ---------------------------------------------------------------------
  // 16) USER-SCROLL-INTERRUPTS
  // ---------------------------------------------------------------------


  // ---------------------------------------------------------------------
  // 17) POSITIONIERUNG DER SCROLL-HINT-SPALTE
  // ---------------------------------------------------------------------


  // ---------------------------------------------------------------------
  // 18) PERFORMANCE-MODUL
  // ---------------------------------------------------------------------


  // ---------------------------------------------------------------------
  // 19) INITIALISIERUNG
  // ---------------------------------------------------------------------
  function init() { 
    // performanceModule.init(); // optional wieder aktivieren
    physics.update();
	uiModule.init();
	sectionNavigationModule.init();
    navbarModule.init();
    scrollEngine.init();
    scrollSectionHintModule.init();
    scrollSectionHintPositionModule.init();
    galleryModule.init();
	contactMapModule.initModule();

    bindUserScrollInterrupts();
    
    DOM.heroCalendar?.addEventListener("click", (e) => {
	  e.stopPropagation();
	});

	DOM.heroCalendarEl?.addEventListener("click", (e) => {
	  e.stopPropagation();
	});

	window.addEventListener(
		"scroll",
		() => {
			if (!state.ui.heroCalendarOpen && !state.ui.heroCalendarAnimating) {
				state.ui.heroCalendarKeepCtaFlat = false;
			}

			uiModule.closeHeroCalendarIfHeroFullyOut();
			navbarModule.handleScroll();
		},
		{ passive: true }
	);
	
	window.addEventListener("resize", () => {
	  physics.update();
	  galleryModule.setPosition(galleryModule.currentIndex, false);
	  contactMapModule.resize();

	  if (!state.ui.heroCalendarPrewarmObserver && !state.ui.heroCalendarPrewarmed) {
		  uiModule.bindHeroCalendarPrewarm();
		}

		if (!state.ui.contactMapPrewarmed && !state.ui.contactMapPrewarmObserver) {
		  contactMapModule.bindPrewarm();
		}

	  if (state.ui.heroCalendarOpen) {
		clearTimeout(state.ui.fullCalendarResizeTimer);

		state.ui.fullCalendarResizeTimer = setTimeout(() => {
		  uiModule.positionHeroCalendar();
		  uiModule.refreshFullCalendarView();
		  uiModule.applyMeasuredHeroCalendarBox();
		  uiModule.setHeroCalendarExtraHeight(state.ui.heroCalendarMeasuredExtra);

		  requestAnimationFrame(() => {
			uiModule.applyMeasuredHeroCalendarBox();
			uiModule.updateFullCalendarSize();
		  });
		}, 120);
	  }
	});

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        state.animation.running = false;
      } else {
        navbarModule.handleScroll();
      }
    });

    navbarModule.handleScroll();
  }

  init();

});
