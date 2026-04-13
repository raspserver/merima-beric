
import { createSpring } from '../utils/helper.js';


// ---------------------------------------------------------------------
// MOTION-WERTE
// ---------------------------------------------------------------------
export const springs = {
    navVisible: createSpring({ stiffness: 0.08, damping: 0.82 }),
    navCompact: createSpring({ stiffness: 0.045, damping: 0.88 }),
    navSurface: createSpring({ stiffness: 0.045, damping: 0.88 }),
    navGesture: createSpring({ stiffness: 0.18, damping: 0.74, precision: 0.01 }),
    heroParallax: createSpring({ stiffness: 0.04, damping: 0.85 }),
    ctaElastic: createSpring({ stiffness: 0.032, damping: 0.87 }),
  };
