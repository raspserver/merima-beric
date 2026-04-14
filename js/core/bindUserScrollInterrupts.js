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
//			/scrollSectionHintModule.js
//			/sectionNavigationModule.js
//			/uiModule.js
//		/utils
//			/cssVar.js
//			/helper.js
//			/prewarmUtils.js
//			/utils.js
//		/main.js
// ---------------------------------------------------------------------

import { scrollEngine }					from	"./scrollEngine.js";
import { state }						from	"./state.js";

import { navbarModule }					from	'../modules/navbarModule.js';

// ---------------------------------------------------------------------
// USER-SCROLL-INTERRUPTS
// ---------------------------------------------------------------------

export function bindUserScrollInterrupts() {
	  let touchReleaseTimer = null;

	  const clearTouchReleaseTimer = () => {
		if (touchReleaseTimer) {
		  clearTimeout(touchReleaseTimer);
		  touchReleaseTimer = null;
		}
	  };

	  const releaseTouchStateDelayed = (delay = 700) => {
		clearTouchReleaseTimer();

		touchReleaseTimer = setTimeout(() => {
		  touchReleaseTimer = null;
		  state.touch.active = false;
		  state.nav.gestureStretch.target = 0;
		  navbarModule.startAnimation();
		}, delay);
	  };

	  window.addEventListener("wheel", () => {
		scrollEngine.cancelActiveScroll();
		clearTouchReleaseTimer();
		state.touch.active = false;
		state.nav.gestureStretch.target = 0;
		navbarModule.startAnimation();
	  }, { passive: true });

	  window.addEventListener("touchstart", () => {
		clearTouchReleaseTimer();
		scrollEngine.cancelActiveScroll();
		state.touch.active = true;
	  }, { passive: true });

	  window.addEventListener("touchmove", () => {
		clearTouchReleaseTimer();
		state.touch.active = true;
	  }, { passive: true });

	  window.addEventListener("touchend", () => {
		releaseTouchStateDelayed(700);
	  }, { passive: true });

	  window.addEventListener("touchcancel", () => {
		releaseTouchStateDelayed(700);
	  }, { passive: true });

	  window.addEventListener("scroll", () => {
		if (state.touch.active) {
		  releaseTouchStateDelayed(700);
		}
	  }, { passive: true });

	  window.addEventListener("pointerdown", (e) => {
		if (e.pointerType === "mouse") {
		  clearTouchReleaseTimer();
		  state.touch.active = false;
		  state.nav.gestureStretch.target = 0;
		  navbarModule.startAnimation();
		}
	  }, { passive: true });

	  window.addEventListener("blur", () => {
		clearTouchReleaseTimer();
		state.touch.active = false;
		state.nav.gestureStretch.target = 0;
		navbarModule.startAnimation();
	  });

	  document.addEventListener("visibilitychange", () => {
		if (document.hidden) {
		  clearTouchReleaseTimer();
		  state.touch.active = false;
		  state.nav.gestureStretch.target = 0;
		  navbarModule.startAnimation();
		}
	  });
	}
