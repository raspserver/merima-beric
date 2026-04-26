// main.js

import { physics } from "./core/physics.js";
import { scrollEngine } from "./core/scrollEngine.js";
import { state } from "./core/state.js";
import { contactMapModule } from "./modules/contactMapModule.js";
import { ctaMagneticModule } from "./modules/ctaMagneticModule.js";
import { galleryModule } from "./modules/galleryModule.js";
import { heroCalendarModule } from "./modules/heroCalendarModule.js";
import { navbarModule } from "./modules/navbarModule.js";
import { performanceModule } from "./modules/performanceModule.js";
import { scrollSectionHintModule } from "./modules/scrollSectionHintModule.js";
import { scrollSectionHintPositionModule } from "./modules/scrollSectionHintPositionModule.js";
import { sectionNavigationModule } from "./modules/sectionNavigationModule.js";
import { uiModule } from "./modules/uiModule.js";

// ---------------------------------------------------------------------
// MAIN.JS
// ---------------------------------------------------------------------

document.addEventListener("DOMContentLoaded", () => {
  function init() {
    physics.update();
    scrollEngine.init();
    contactMapModule.init();
    ctaMagneticModule.init();
    galleryModule.init();
    heroCalendarModule.init();
    navbarModule.init();
    // performanceModule.init();
    //~ scrollSectionHintModule.init();
    //~ scrollSectionHintPositionModule.init();
    sectionNavigationModule.init();
    uiModule.init();
  }

  init();
});
