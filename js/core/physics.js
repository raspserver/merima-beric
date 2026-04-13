// ---------------------------------------------------------------------
// javascript Verzeichnisstruktur
// ---------------------------------------------------------------------
//	/js
//		/core
//			/physics.js
//			/scrollEngine.js
//			/settings.js
//			/springs.js
//			/state.js
//		/modules
//			/navbarModule.js
//			/scrollSectionHintModule.js
//		/utils
//			/cssVar.js
//			/helper.js
//			/utils.js
//		/main.js
// ---------------------------------------------------------------------

import { springs }		from	"./springs.js";

import { cssVar }		from	"../utils/cssVar.js";
import { utils }		from	"../utils/utils.js";

// ---------------------------------------------------------------------
// PHYSIK-WERTE
// ---------------------------------------------------------------------
export const physics = {
    values: {
      navVisibleStiffness: 0.08,
      navVisibleDamping: 0.82,
      navCompactStiffness: 0.045,
      navCompactDamping: 0.88,

      NAV_SURFACE_UP: 0.18,
      sectionScrollInset: 1,

      scrollElasticDecay: 10,
      scrollElasticFrequency: 10,
      scrollElasticPhaseShift: 0.75,
      scrollDurationFactor: 0.6,
      scrollDurationMin: 700,
      scrollDurationMax: 1600,

      heroParallaxFactor: -0.06,
      heroParallaxStiffness: 0.04,
      heroParallaxDamping: 0.85,
      heroScaleScrollFactor: 0.01,
      heroBrightnessScrollFactor: 0.06,

      navGestureExpandMax: 22,
      navGestureCompressMax: 12,
      navGestureExpandVelocityFactor: 0.18,
      navGestureCompressVelocityFactor: 0.12,
      navGestureStiffness: 0.18,
      navGestureDamping: 0.74,
      
		ctaElasticStiffness: 0.032,
		ctaElasticDamping: 0.87,
		ctaElasticVelocityFactor: 0.10,
		ctaElasticMax: 18,
    },

    update() {
      const isMobile = utils.isPhysicsMobileViewport();

      this.values.NAV_SURFACE_UP = cssVar.number("--nav-surface-up", 0.18);
      this.values.sectionScrollInset = cssVar.number("--section-scroll-inset", 1);

      this.values.scrollElasticDecay = cssVar.number("--scroll-elastic-decay", 10);
      this.values.scrollElasticFrequency = cssVar.number(
        "--scroll-elastic-frequency",
        10
      );
      this.values.scrollElasticPhaseShift = cssVar.number(
        "--scroll-elastic-phase-shift",
        0.75
      );
      this.values.scrollDurationFactor = cssVar.number(
        "--scroll-duration-factor",
        0.6
      );
      this.values.scrollDurationMin = cssVar.number("--scroll-duration-min", 700);
      this.values.scrollDurationMax = cssVar.number("--scroll-duration-max", 1600);

      this.values.heroParallaxFactor = cssVar.number("--hero-parallax-factor", -0.06);
      this.values.heroParallaxStiffness = cssVar.number(
        "--hero-parallax-stiffness",
        0.04
      );
      this.values.heroParallaxDamping = cssVar.number(
        "--hero-parallax-damping",
        0.85
      );
      this.values.heroScaleScrollFactor = cssVar.number(
        "--hero-scale-scroll-factor",
        0.01
      );
      this.values.heroBrightnessScrollFactor = cssVar.number(
        "--hero-brightness-scroll-factor",
        0.06
      );

      this.values.navGestureExpandMax = cssVar.number("--nav-gesture-expand-max", 22);
      this.values.navGestureCompressMax = cssVar.number(
        "--nav-gesture-compress-max",
        12
      );
      this.values.navGestureExpandVelocityFactor = cssVar.number(
        "--nav-gesture-expand-velocity-factor",
        0.18
      );
      this.values.navGestureCompressVelocityFactor = cssVar.number(
        "--nav-gesture-compress-velocity-factor",
        0.12
      );
      this.values.navGestureStiffness = cssVar.number(
        "--nav-gesture-stiffness",
        0.18
      );
      this.values.navGestureDamping = cssVar.number("--nav-gesture-damping", 0.74);
	
	this.values.ctaElasticStiffness = cssVar.number("--cta-elastic-stiffness", 0.032);
	this.values.ctaElasticDamping = cssVar.number("--cta-elastic-damping", 0.87);
	this.values.ctaElasticVelocityFactor = cssVar.number("--cta-elastic-velocity-factor", 0.10);
	this.values.ctaElasticMax = cssVar.number("--cta-elastic-max", 18);

	springs.ctaElastic.stiffness = this.values.ctaElasticStiffness;
	springs.ctaElastic.damping = this.values.ctaElasticDamping;

      if (isMobile) {
        this.values.navVisibleStiffness = cssVar.number(
          "--nav-spring-stiffness-mobile",
          0.06
        );
        this.values.navVisibleDamping = cssVar.number(
          "--nav-spring-damping-mobile",
          0.85
        );
        this.values.navCompactStiffness = cssVar.number(
          "--nav-compact-stiffness-mobile",
          0.035
        );
        this.values.navCompactDamping = cssVar.number(
          "--nav-compact-damping-mobile",
          0.9
        );
      } else {
        this.values.navVisibleStiffness = cssVar.number(
          "--nav-spring-stiffness-desktop",
          0.08
        );
        this.values.navVisibleDamping = cssVar.number(
          "--nav-spring-damping-desktop",
          0.82
        );
        this.values.navCompactStiffness = cssVar.number(
          "--nav-compact-stiffness-desktop",
          0.045
        );
        this.values.navCompactDamping = cssVar.number(
          "--nav-compact-damping-desktop",
          0.88
        );
      }

      // Springs nach Update der Physics-Werte synchronisieren
      springs.navVisible.stiffness = this.values.navVisibleStiffness;
      springs.navVisible.damping = this.values.navVisibleDamping;

      springs.navCompact.stiffness = this.values.navCompactStiffness;
      springs.navCompact.damping = this.values.navCompactDamping;

      springs.navSurface.stiffness = this.values.navCompactStiffness;
      springs.navSurface.damping = this.values.navCompactDamping;

      springs.navGesture.stiffness = this.values.navGestureStiffness;
      springs.navGesture.damping = this.values.navGestureDamping;

      springs.heroParallax.stiffness = this.values.heroParallaxStiffness;
      springs.heroParallax.damping = this.values.heroParallaxDamping;
    }
  };
