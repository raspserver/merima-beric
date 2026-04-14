// ---------------------------------------------------------------------
// javascript Verzeichnisstruktur
// ---------------------------------------------------------------------
//	/js
//		/core
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

import { physics }									from	"./core/physics.js";
import { scrollEngine }								from	"./core/scrollEngine.js";
import { state }									from	"./core/state.js";

import { contactMapModule }							from	"./modules/contactMapModule.js";
import { galleryModule }							from	"./modules/galleryModule.js";
import { navbarModule }								from	"./modules/navbarModule.js";
import { performanceModule }						from	"./modules/performanceModule.js";
import { scrollSectionHintModule }					from	"./modules/scrollSectionHintModule.js";
import { scrollSectionHintPositionModule }			from	"./modules/scrollSectionHintPositionModule.js";
import { sectionNavigationModule }					from	"./modules/sectionNavigationModule.js";
import { uiModule }									from	"./modules/uiModule.js";

document.addEventListener("DOMContentLoaded", () => {

// ---------------------------------------------------------------------
// INITIALISIERUNG
// ---------------------------------------------------------------------
  
	function init() { 
		physics.update();
		scrollEngine.init();
		contactMapModule.initModule();
		galleryModule.init();
		navbarModule.init();
		//~ performanceModule.init();
		scrollSectionHintModule.init();
		scrollSectionHintPositionModule.init();
		sectionNavigationModule.init();
		uiModule.init();
	}

	init();

});
