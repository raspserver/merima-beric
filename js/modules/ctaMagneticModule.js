import { state } from "../core/state.js";
import { navbarModule } from "./navbarModule.js";
import { utils } from "../utils/utils.js";
import { clamp } from "../utils/helper.js";

export const ctaMagneticModule = {
  buttons: [],
  running: false,
  lastFrame: 0,

  init() {
    this.buttons = [...document.querySelectorAll(".cta-button")].map((btn) =>
      this.createItem(btn)
    );

    this.bindPointerEvents();
    this.bindButtonEvents();
  },

  createItem(button) {
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

  resetItem(item) {
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

  resetAll() {
    this.buttons.forEach((item) => this.resetItem(item));
  },

  startAnimation() {
    if (this.running) return;

    this.running = true;
    this.lastFrame = performance.now();

    requestAnimationFrame(this.animate.bind(this));
  },

  animate(now) {
    let delta = (now - this.lastFrame) / 16.67;
    this.lastFrame = now;
    delta = Math.min(delta, 2);

    let hasMotion = false;

    this.buttons.forEach((item) => {
      const spring = item.isNear ? 0.16 : 0.11;
      const damping = item.isNear ? 0.78 : 0.82;

      const step = (c, t, v) => {
        const f = (t - c) * spring;
        v += f * delta;
        v *= Math.pow(damping, delta);
        c += v * delta;
        return { c, v };
      };

      ["X","Y","Scale","ShadowY","ShadowBlur","ShadowAlpha",
       "LabelX","LabelY","LabelScale","GlossX","GlossY","GlossOpacity"]
      .forEach((s) => {
        const r = step(item["current"+s], item["target"+s], item["velocity"+s]);
        item["current"+s] = r.c;
        item["velocity"+s] = r.v;
      });

      utils.setVars(item.button, {
        "--magnetic-x": `${item.currentX}px`,
        "--magnetic-y": `${item.currentY}px`,
        "--magnetic-scale": item.currentScale,
      });

      if (Math.abs(item.velocityX) > 0.01 || Math.abs(item.velocityY) > 0.01) {
        hasMotion = true;
      }
    });

    if (!hasMotion) {
      this.running = false;
      return;
    }

    requestAnimationFrame(this.animate.bind(this));
  },

  applyField(item, x, y) {
    if (document.body.classList.contains("nav-menu-open")) {
      this.resetItem(item);
      return;
    }

    const rect = item.button.getBoundingClientRect();
    const dx = x - (rect.left + rect.width / 2);
    const dy = y - (rect.top + rect.height / 2);

    const dist = Math.hypot(dx, dy);
    if (dist > rect.width) {
      this.resetItem(item);
      return;
    }

    item.isNear = true;
    item.targetX = dx * 0.1;
    item.targetY = dy * 0.1;
    item.targetScale = 1.03;
  },

  bindPointerEvents() {
    window.addEventListener("pointermove", (e) => {
      if (e.pointerType !== "mouse") {
        this.resetAll();
        this.startAnimation();
        return;
      }

      this.buttons.forEach((item) =>
        this.applyField(item, e.clientX, e.clientY)
      );

      this.startAnimation();
    }, { passive: true });

    window.addEventListener("pointerleave", () => {
      this.resetAll();
      this.startAnimation();
    });
  },

  bindButtonEvents() {
    this.buttons.forEach((item) => {
      item.button.addEventListener("pointerenter", () => {
        item.button.classList.add("is-hovered");
      });

      item.button.addEventListener("pointerleave", () => {
        item.button.classList.remove("is-hovered");
      });
    });
  }
};
