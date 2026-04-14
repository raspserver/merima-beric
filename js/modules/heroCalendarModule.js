import { state } from "../core/state.js";
import { navbarModule } from "./navbarModule.js";
import { cssVar } from "../utils/cssVar.js";
import { resetAnimatedValue } from "../utils/helper.js";
import { prewarmUtils } from "../utils/prewarmUtils.js";

export const heroCalendarModule = {
  hero: null,
  calendar: null,
  calendarEl: null,
  cta: null,
  label: null,

  init() {
    this.cacheDOM();
    this.bindEvents();
    this.bindPrewarm();
  },

  cacheDOM() {
    this.hero = document.querySelector(".hero");
    this.calendar = document.getElementById("hero-calendar");
    this.calendarEl = document.getElementById("hero-fullcalendar");
    this.cta = document.querySelector(".cta-button");
    this.label = document.querySelector(".cta-label");
  },

  bindEvents() {
    this.cta?.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.toggle();
    });

    this.calendar?.addEventListener("click", this.stop);
    this.calendarEl?.addEventListener("click", this.stop);
  },

  stop(e) {
    e.stopPropagation();
  },

  toggle() {
    if (state.ui.heroCalendarAnimating) return;
    state.ui.heroCalendarOpen ? this.close() : this.open();
  },

  open() {
    state.ui.heroCalendarAnimating = true;

    this.hero.classList.add("hero-calendar-open");
    this.cta.classList.add("calendar-open");

    if (this.label) {
      this.label.textContent = "Kalender schließen";
    }

    this.ensureCalendar();

    setTimeout(() => {
      state.ui.heroCalendarOpen = true;
      state.ui.heroCalendarAnimating = false;
    }, 300);
  },

  close() {
    state.ui.heroCalendarAnimating = true;

    this.hero.classList.remove("hero-calendar-open");
    this.cta.classList.remove("calendar-open");

    if (this.label) {
      this.label.textContent = "Termin vereinbaren";
    }

    setTimeout(() => {
      state.ui.heroCalendarOpen = false;
      state.ui.heroCalendarAnimating = false;
    }, 300);
  },

  ensureCalendar() {
    if (state.ui.fullCalendarInstance || !this.calendarEl) return;

    state.ui.fullCalendarInstance = new FullCalendar.Calendar(
      this.calendarEl,
      {
        initialView: "dayGridMonth",
        height: "100%",
      }
    );

    state.ui.fullCalendarInstance.render();
  },

  bindPrewarm() {
    prewarmUtils.bind({
      element: this.hero,
      stateKeyObserver: "heroCalendarPrewarmObserver",
      stateKeyPrewarmed: "heroCalendarPrewarmed",
      getDistancePx: () => 200,
      onPrewarm: () => this.ensureCalendar(),
    });
  }
};
