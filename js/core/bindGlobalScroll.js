// ---------------------------------------------------------------------
// javascript Verzeichnisstruktur
// ---------------------------------------------------------------------
//	/js
//		/core
//			/bindUserScrollInterrupts.js
//			/physics.js
//			/scrollEngine.js
//			/sectionSelector.js
//			/settings.js
//			/springs.js
//			/state.js
//		/modules
//			/contactMapModule.js
//			/galleryModule.js
//			/navbarModule.js
//			/performanceModule.js
//			/scrollSectionHintModule.js
//			/scrollSectionHintPositionModule.js
//			/sectionNavigationModule.js
//			/uiModule.js
//		/utils
//			/cssVar.js
//			/helper.js
//			/prewarmUtils.js
//			/utils.js
//		/main.js
// ---------------------------------------------------------------------

import { state }					from	"./state.js";

import { navbarModule }				from	'../modules/navbarModule.js';
import { uiModule }					from	'../modules/uiModule.js';

// ---------------------------------------------------------------------
// SCROLL-LISTENER
// ---------------------------------------------------------------------

export function bindGlobalScroll() {
  window.addEventListener("scroll", onScroll, { passive: true });
}

function onScroll() {
  if (!state.ui.heroCalendarOpen && !state.ui.heroCalendarAnimating) {
    state.ui.heroCalendarKeepCtaFlat = false;
  }

  uiModule.closeHeroCalendarIfHeroFullyOut();
  navbarModule.handleScroll();
}
