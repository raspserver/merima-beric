// ctaMagneticModule.js

import { state } from "../core/state.js";
import { utils } from "../utils/utils.js";
import { heroCalendarModule } from "./heroCalendarModule.js";
import { navbarModule } from "./navbarModule.js";

// ---------------------------------------------------------------------
// CTA MAGNETIC MODULE
// ---------------------------------------------------------------------

export const ctaMagneticModule = {
  ctaMagneticButtons: [],
  ctaMagneticRunning: false,
  ctaMagneticLastFrame: 0,

  init() {
    this.cacheDOM();
    this.bindCTA();
  },

  cacheDOM() {
    this.cta = document.querySelector(".cta-button");
    this.ctaLabel = document.querySelector(".cta-button .cta-label");
  },

  createMagneticItem(button) {
    return {
      button,
      label: button.querySelector(".cta-label"),
      gloss: button.querySelector(".cta-gloss"),
      isNear: false,

      targetX: 0,
      targetY: 0,
      targetScale: 1,
      targetShadowY: 0,
      targetShadowBlur: 0,
      targetShadowAlpha: 0,

      currentX: 0,
      currentY: 0,
      currentScale: 1,
      currentShadowY: 0,
      currentShadowBlur: 0,
      currentShadowAlpha: 0,

      velocityX: 0,
      velocityY: 0,
      velocityScale: 0,
      velocityShadowY: 0,
      velocityShadowBlur: 0,
      velocityShadowAlpha: 0,

      targetLabelX: 0,
      targetLabelY: 0,
      targetLabelScale: 1,
      currentLabelX: 0,
      currentLabelY: 0,
      currentLabelScale: 1,
      velocityLabelX: 0,
      velocityLabelY: 0,
      velocityLabelScale: 0,

      targetGlossX: 50,
      targetGlossY: 50,
      targetGlossOpacity: 0,
      currentGlossX: 50,
      currentGlossY: 50,
      currentGlossOpacity: 0,
      velocityGlossX: 0,
      velocityGlossY: 0,
      velocityGlossOpacity: 0,
    };
  },

  resetMagneticItem(item) {
    item.isNear = false;
    item.button.classList.remove("is-magnetic-near", "is-hovered");

    item.targetX = 0;
    item.targetY = 0;
    item.targetScale = 1;
    item.targetShadowY = 0;
    item.targetShadowBlur = 0;
    item.targetShadowAlpha = 0;

    item.targetLabelX = 0;
    item.targetLabelY = 0;
    item.targetLabelScale = 1;

    item.targetGlossX = 50;
    item.targetGlossY = 50;
    item.targetGlossOpacity = 0;
  },

  resetCtaMagnetic() {
    this.ctaMagneticButtons.forEach((item) => {
      this.resetMagneticItem(item);

      item.currentX = 0;
      item.currentY = 0;
      item.currentScale = 1;
      item.currentShadowY = 0;
      item.currentShadowBlur = 0;
      item.currentShadowAlpha = 0;

      item.velocityX = 0;
      item.velocityY = 0;
      item.velocityScale = 0;
      item.velocityShadowY = 0;
      item.velocityShadowBlur = 0;
      item.velocityShadowAlpha = 0;

      item.currentLabelX = 0;
      item.currentLabelY = 0;
      item.currentLabelScale = 1;
      item.velocityLabelX = 0;
      item.velocityLabelY = 0;
      item.velocityLabelScale = 0;

      item.currentGlossX = 50;
      item.currentGlossY = 50;
      item.currentGlossOpacity = 0;
      item.velocityGlossX = 0;
      item.velocityGlossY = 0;
      item.velocityGlossOpacity = 0;

      utils.setVars(item.button, {
        "--magnetic-x": "0px",
        "--magnetic-y": "0px",
        "--magnetic-scale": "1",
        "--magnetic-shadow-y": "0px",
        "--magnetic-shadow-blur": "0px",
        "--magnetic-shadow-alpha": "0",
        "--label-x": "0px",
        "--label-y": "0px",
        "--label-scale": "1",
        "--gloss-x": "50%",
        "--gloss-y": "50%",
        "--gloss-opacity": "0",
      });
    });
  },

  startCtaMagneticAnimation() {
    if (this.ctaMagneticRunning) return;

    this.ctaMagneticRunning = true;
    this.ctaMagneticLastFrame = performance.now();

    requestAnimationFrame(this.animateCtaMagnetic.bind(this));
  },

  animateCtaMagnetic(now) {
    this.ctaMagneticRunning = true;

    let delta = (now - this.ctaMagneticLastFrame) / 16.67;
    this.ctaMagneticLastFrame = now;
    delta = Math.min(delta, 2);

    let hasMotion = false;

    this.ctaMagneticButtons.forEach((item) => {
      const spring = item.isNear ? 0.16 : 0.11;
      const damping = item.isNear ? 0.78 : 0.82;

      const stepSpring = (current, target, velocity) => {
        const force = (target - current) * spring;
        velocity += force * delta;
        velocity *= Math.pow(damping, delta);
        current += velocity * delta;
        return { current, velocity };
      };

      [
        "X",
        "Y",
        "Scale",
        "ShadowY",
        "ShadowBlur",
        "ShadowAlpha",
        "LabelX",
        "LabelY",
        "LabelScale",
        "GlossX",
        "GlossY",
        "GlossOpacity",
      ].forEach((suffix) => {
        const currentKey = `current${suffix}`;
        const targetKey = `target${suffix}`;
        const velocityKey = `velocity${suffix}`;

        const result = stepSpring(
          item[currentKey],
          item[targetKey],
          item[velocityKey]
        );

        item[currentKey] = result.current;
        item[velocityKey] = result.velocity;
      });

      utils.setVars(item.button, {
        "--magnetic-x": `${item.currentX.toFixed(2)}px`,
        "--magnetic-y": `${item.currentY.toFixed(2)}px`,
        "--magnetic-scale": item.currentScale.toFixed(4),
        "--magnetic-shadow-y": `${item.currentShadowY.toFixed(2)}px`,
        "--magnetic-shadow-blur": `${item.currentShadowBlur.toFixed(2)}px`,
        "--magnetic-shadow-alpha": item.currentShadowAlpha.toFixed(3),
        "--label-x": `${item.currentLabelX.toFixed(2)}px`,
        "--label-y": `${item.currentLabelY.toFixed(2)}px`,
        "--label-scale": item.currentLabelScale.toFixed(4),
        "--gloss-x": `${item.currentGlossX.toFixed(2)}%`,
        "--gloss-y": `${item.currentGlossY.toFixed(2)}%`,
        "--gloss-opacity": item.currentGlossOpacity.toFixed(3),
      });

      const moving = [
        Math.abs(item.targetX - item.currentX) > 0.01,
        Math.abs(item.targetY - item.currentY) > 0.01,
        Math.abs(item.targetScale - item.currentScale) > 0.001,
        Math.abs(item.targetShadowY - item.currentShadowY) > 0.01,
        Math.abs(item.targetShadowBlur - item.currentShadowBlur) > 0.01,
        Math.abs(item.targetShadowAlpha - item.currentShadowAlpha) > 0.001,
        Math.abs(item.targetLabelX - item.currentLabelX) > 0.01,
        Math.abs(item.targetLabelY - item.currentLabelY) > 0.01,
        Math.abs(item.targetLabelScale - item.currentLabelScale) > 0.001,
        Math.abs(item.targetGlossX - item.currentGlossX) > 0.01,
        Math.abs(item.targetGlossY - item.currentGlossY) > 0.01,
        Math.abs(item.targetGlossOpacity - item.currentGlossOpacity) > 0.001,
        Math.abs(item.velocityX) > 0.01,
        Math.abs(item.velocityY) > 0.01,
        Math.abs(item.velocityScale) > 0.001,
        Math.abs(item.velocityShadowY) > 0.01,
        Math.abs(item.velocityShadowBlur) > 0.01,
        Math.abs(item.velocityShadowAlpha) > 0.001,
        Math.abs(item.velocityLabelX) > 0.01,
        Math.abs(item.velocityLabelY) > 0.01,
        Math.abs(item.velocityLabelScale) > 0.001,
        Math.abs(item.velocityGlossX) > 0.01,
        Math.abs(item.velocityGlossY) > 0.01,
        Math.abs(item.velocityGlossOpacity) > 0.001,
      ].some(Boolean);

      if (moving) hasMotion = true;
    });

    if (!hasMotion) {
      this.ctaMagneticRunning = false;
      return;
    }

    requestAnimationFrame(this.animateCtaMagnetic.bind(this));
  },

  bindCTA() {
    state.ui.ctaDefaultLabel = this.ctaLabel?.textContent?.trim() || "Termin vereinbaren";

    this.cta?.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      heroCalendarModule.toggle();
    });

    this.ctaMagneticButtons = [...document.querySelectorAll(".cta-button")].map(
      (button) => this.createMagneticItem(button)
    );

    const applyMagneticField = (item, clientX, clientY) => {
      if (item.button.classList.contains("calendar-open")) {
        this.resetMagneticItem(item);
        return;
      }

      if (
        document.body.classList.contains("nav-menu-open") ||
        (utils.isMobileViewport() && navbarModule.isOpen()) ||
        document.body.classList.contains("suppress-cta-hover")
      ) {
        this.resetMagneticItem(item);
        return;
      }

      const rect = item.button.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const dx = clientX - centerX;
      const dy = clientY - centerY;

      const nx = dx / (rect.width * 1.15);
      const ny = dy / (rect.height * 1.9);
      const rawDistance = Math.sqrt(nx * nx + ny * ny);

      if (rawDistance > 1) {
        this.resetMagneticItem(item);
        return;
      }

      item.isNear = true;
      item.button.classList.add("is-magnetic-near");

      const proximity = 1 - rawDistance;
      const eased = 1 - Math.pow(1 - proximity, 3);
      const shaped = Math.pow(eased, 1.6);

      const innerNX = dx / (rect.width / 2);
      const innerNY = dy / (rect.height / 2);
      const innerDistance = Math.sqrt(innerNX * innerNX + innerNY * innerNY);

      const insideButton = innerDistance <= 1;
      const innerProximity = insideButton ? 1 - innerDistance : 0;

      const innerBoost = insideButton
        ? Math.pow(1 - Math.pow(1 - innerProximity, 3), 1.15)
        : 0;

      const combinedStrength = insideButton
        ? Math.min(0.32 * shaped + 0.68 * innerBoost, 1)
        : Math.min(0.62 * shaped, 0.5);

      const length = Math.hypot(dx, dy) || 1;
      const dirX = dx / length;
      const dirY = dy / length;

      item.targetX = dirX * Math.min(rect.width * 0.12, 15) * combinedStrength;
      item.targetY = dirY * Math.min(rect.height * 0.26, 11) * combinedStrength;
      item.targetScale = 1 + combinedStrength * 0.014;

      item.targetShadowY = 10 + combinedStrength * 12;
      item.targetShadowBlur = 28 + combinedStrength * 20;
      item.targetShadowAlpha = 0.12 + combinedStrength * 0.18;

      item.targetLabelX =
        dirX *
        Math.min(rect.width * 0.065, 10) *
        Math.min(combinedStrength * 1.18, 1);

      item.targetLabelY =
        dirY *
        Math.min(rect.height * 0.11, 6) *
        Math.min(combinedStrength * 1.18, 1);

      item.targetLabelScale = 1 + combinedStrength * 0.01;

      item.targetGlossX = utils.clamp(
        ((clientX - rect.left) / rect.width) * 100,
        0,
        100
      );

      item.targetGlossY = utils.clamp(
        ((clientY - rect.top) / rect.height) * 100,
        0,
        100
      );

      item.targetGlossOpacity = 0.18 + combinedStrength * 0.24;
    };

    window.addEventListener(
      "pointermove",
      (e) => {
        if (e.pointerType !== "mouse") {
          this.ctaMagneticButtons.forEach((item) =>
            this.resetMagneticItem(item)
          );
          this.startCtaMagneticAnimation();
          return;
        }

        this.ctaMagneticButtons.forEach((item) =>
          applyMagneticField(item, e.clientX, e.clientY)
        );

        this.startCtaMagneticAnimation();
      },
      { passive: true }
    );

    window.addEventListener("pointerleave", () => {
      this.ctaMagneticButtons.forEach((item) => this.resetMagneticItem(item));
      this.startCtaMagneticAnimation();
    });

    this.ctaMagneticButtons.forEach((item) => {
      item.button.addEventListener("blur", () => {
        this.resetMagneticItem(item);
        item.button.classList.remove("is-hovered");
        this.startCtaMagneticAnimation();
      });

      item.button.addEventListener("pointerenter", (e) => {
        if (
          e.pointerType === "mouse" &&
          !document.body.classList.contains("suppress-cta-hover") &&
          !document.body.classList.contains("nav-menu-open")
        ) {
          item.button.classList.add("is-hovered");
        }
      });

      item.button.addEventListener("pointerleave", () => {
        item.button.classList.remove("is-hovered");
      });

      item.button.addEventListener("pointerdown", (e) => {
        if (e.pointerType !== "mouse") {
          item.button.classList.remove("is-hovered");
        }
      });
    });
  }
};
