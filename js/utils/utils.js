import { SETTINGS } from "../core/settings.js";

export const utils = {
    prefersReducedMotion() {
      return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    },

    isMobileViewport() {
        return window.innerWidth <= SETTINGS.breakpoints.mobileNav;
    },

    isPhysicsMobileViewport() {
        return window.innerWidth <= SETTINGS.breakpoints.mobilePhysics;
    },

    getMaxScrollY() {
        return Math.max(
            0,
            document.documentElement.scrollHeight - window.innerHeight
        );
    },

    shuffle(array) {
        for (let i = array.length - 1; i > 0; i -= 1) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    },

    resolveTarget(targetOrSelector) {
        if (!targetOrSelector) return null;
        if (targetOrSelector instanceof Element) return targetOrSelector;
        if (typeof targetOrSelector !== "string") return null;

        let selector = targetOrSelector.trim();

        if (selector === "#home") {
            return document.querySelector("#home") || document.querySelector(".hero");
        }

        if (!selector.startsWith("#")) {
            try {
                selector = new URL(selector, window.location.href).hash || selector;
            } catch {
                return null;
            }
        }

        return selector.startsWith("#") ? document.querySelector(selector) : null;
    },

    safePlay(video) {
        const result = video.play();
        if (result !== undefined) result.catch(() => {});
    },

    setVars(element, vars) {
        if (!element) return;
        Object.entries(vars).forEach(([name, value]) => {
            element.style.setProperty(name, String(value));
        });
    },

    clearRaf(id) {
        if (id) cancelAnimationFrame(id);
        return null;
    },

    clearTimer(id) {
        if (id) clearTimeout(id);
        return null;
    },

    getPerformanceProfile() {
        const cores = navigator.hardwareConcurrency || 0;
        const memory = navigator.deviceMemory || 0;
        const reducedMotion = this.prefersReducedMotion();

        let reducedTransparency = false;
        try {
            reducedTransparency = window.matchMedia(
                "(prefers-reduced-transparency: reduce)"
            ).matches;
        } catch {}

        return {
            cores,
            memory,
            reducedMotion,
            reducedTransparency,
            lowEnd:
                (cores > 0 && cores <= 4) ||
                (memory > 0 && memory <= 4) ||
                reducedMotion ||
                reducedTransparency,
        };
    },

// ---------------------------------------------------------------------
// cssVar
// ---------------------------------------------------------------------

    cssVar: {
        raw(name) {
            return getComputedStyle(document.documentElement)
                .getPropertyValue(name)
                .trim();
        },

        number(name, fallback) {
            const value = parseFloat(this.raw(name));
            return Number.isFinite(value) ? value : fallback;
        },

        remPx(name, fallbackPx) {
            const raw = this.raw(name);
            if (!raw) return fallbackPx;

            if (raw.endsWith("rem")) {
                const rem = parseFloat(raw);
                const rootFont = parseFloat(
                    getComputedStyle(document.documentElement).fontSize
                );
                return Number.isFinite(rem) && Number.isFinite(rootFont)
                    ? rem * rootFont
                    : fallbackPx;
            }

            const px = parseFloat(raw);
            return Number.isFinite(px) ? px : fallbackPx;
        },

        timeMs(name, fallbackMs) {
            const raw = this.raw(name);
            if (!raw) return fallbackMs;

            if (raw.endsWith("ms")) return parseFloat(raw) || fallbackMs;
            if (raw.endsWith("s")) return (parseFloat(raw) || 0) * 1000 || fallbackMs;

            const value = parseFloat(raw);
            return Number.isFinite(value) ? value : fallbackMs;
        },

        lengthPx(name, fallbackPx) {
            const raw = this.raw(name);
            if (!raw) return fallbackPx;

            const probe = document.createElement("div");
            probe.style.position = "absolute";
            probe.style.visibility = "hidden";
            probe.style.pointerEvents = "none";
            probe.style.height = raw;
            document.body.appendChild(probe);

            const px = probe.getBoundingClientRect().height;
            probe.remove();

            return Number.isFinite(px) && px > 0 ? px : fallbackPx;
        }
    },

// ---------------------------------------------------------------------
// HELPER
// ---------------------------------------------------------------------    

	clamp(value, min, max) {
		return Math.max(min, Math.min(value, max));
	}

};
