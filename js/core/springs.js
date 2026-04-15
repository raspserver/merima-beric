// springs.js

import { utils } from "../utils/utils.js";

// ---------------------------------------------------------------------
// SPRINGS
// ---------------------------------------------------------------------

export const springs = {
  navVisible: utils.createSpring({ stiffness: 0.08, damping: 0.82 }),
  navCompact: utils.createSpring({ stiffness: 0.045, damping: 0.88 }),
  navSurface: utils.createSpring({ stiffness: 0.045, damping: 0.88 }),
  navGesture: utils.createSpring({ stiffness: 0.18, damping: 0.74, precision: 0.01 }),
  heroParallax: utils.createSpring({ stiffness: 0.04, damping: 0.85 }),
  ctaElastic: utils.createSpring({ stiffness: 0.032, damping: 0.87 }),
};
