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

import { SETTINGS }			from	"../core/settings.js";

import { utils }			from	"../utils/utils.js";

// ---------------------------------------------------------------------
// GALLERY-MODUL
// ---------------------------------------------------------------------

export const galleryModule = {
	track: null,
    videos: [],
    currentIndex: 1,
    isAnimating: false,
    startX: 0,
    isDragging: false,

	cacheDOM() {
		this.track = document.querySelector(".gallery-track");
	},

    buildVideos() {
      if (!this.track) return;

      const shuffled = utils.shuffle([...SETTINGS.gallery.videoFiles]);
      const fullList = [shuffled[shuffled.length - 1], ...shuffled, shuffled[0]];

      fullList.forEach((src) => {
        const video = document.createElement("video");

        video.src = src;
        video.playsInline = true;
        video.preload = "auto";
        video.controls = false;
        video.muted = true;

        video.addEventListener("loadeddata", () => {
          video.currentTime = 0.01;
        });

        video.addEventListener("pointerdown", (e) => {
          if (utils.isMobileViewport() && navbarModule.isOpen()) {
            e.preventDefault();
            e.stopPropagation();
          }
        });

        video.addEventListener("pointerup", (e) => {
          if (utils.isMobileViewport() && navbarModule.isOpen()) {
            e.preventDefault();
            e.stopPropagation();
            navbarModule.closeMenu();
            return;
          }

          e.stopPropagation();
          if (video.paused) {
            utils.safePlay(video);
          } else {
            video.pause();
          }
        });

        video.addEventListener("ended", () => {
          this.moveTo(this.currentIndex + 1, true);
        });

        this.track.appendChild(video);
        this.videos.push(video);
      });
    },

    playOnly(index) {
      this.videos.forEach((video, i) => {
        if (i === index) {
          video.currentTime = 0;
          utils.safePlay(video);
        } else {
          video.pause();
        }
      });
    },

    setPosition(index, animate = true) {
      if (!this.videos.length || !this.track) return;

      const videoWidth = this.videos[0].offsetWidth;
      const padding = this.track.parentElement.offsetWidth * 0.1;
      const offset = videoWidth * index - padding;

      this.track.style.transition = animate
        ? "transform 0.6s cubic-bezier(.16,.84,.44,1)"
        : "none";

      this.track.style.transform = `translateX(-${offset}px)`;
    },

    moveTo(index, autoPlay = false) {
      if (this.isAnimating) return;

      this.isAnimating = true;
      this.currentIndex = index;
      this.setPosition(this.currentIndex, true);

      if (autoPlay) {
        this.playOnly(this.currentIndex);
      } else {
        this.videos.forEach((video) => video.pause());
      }
    },

    bindTrackEvents() {
      if (!this.track) return;

      this.track.addEventListener("transitionend", () => {
        this.isAnimating = false;

        if (this.currentIndex === this.videos.length - 1) {
          this.currentIndex = 1;
        }

        if (this.currentIndex === 0) {
          this.currentIndex = this.videos.length - 2;
        }

        requestAnimationFrame(() => this.setPosition(this.currentIndex, false));
      });

      this.track.style.touchAction = "pan-y";

      this.track.addEventListener(
        "touchstart",
        (e) => {
          if (utils.isMobileViewport() && navbarModule.isOpen()) {
            e.preventDefault();
            return;
          }

          this.startX = e.touches[0].clientX;
          this.isDragging = true;
          this.track.style.transition = "none";
        },
        { passive: false }
      );

      this.track.addEventListener(
        "touchmove",
        (e) => {
          if (utils.isMobileViewport() && navbarModule.isOpen()) {
            e.preventDefault();
            return;
          }

          if (!this.isDragging || !this.videos.length) return;

          const diff = e.touches[0].clientX - this.startX;
          const videoWidth = this.videos[0].offsetWidth;
          const padding = this.track.parentElement.offsetWidth * 0.1;

          this.track.style.transform = `translateX(${
            -this.currentIndex * videoWidth + diff - padding
          }px)`;
        },
        { passive: false }
      );

      this.track.addEventListener(
        "touchend",
        (e) => {
          if (utils.isMobileViewport() && navbarModule.isOpen()) {
            e.preventDefault();
            this.isDragging = false;
            return;
          }

          if (!this.isDragging) return;

          const diff = e.changedTouches[0].clientX - this.startX;

          if (diff > SETTINGS.gallery.swipeThreshold) {
            this.moveTo(this.currentIndex - 1, true);
          } else if (diff < -SETTINGS.gallery.swipeThreshold) {
            this.moveTo(this.currentIndex + 1, true);
          } else {
            this.setPosition(this.currentIndex, true);
          }

          this.isDragging = false;
        },
        { passive: false }
      );
    },

    bindVisibilityEvents() {
      const gallerySection = document.querySelector(".gallery");

      if (gallerySection) {
        const observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (!this.videos[this.currentIndex]) return;

              if (entry.isIntersecting) {
                this.playOnly(this.currentIndex);
              } else {
                this.videos.forEach((video) => video.pause());
              }
            });
          },
          { threshold: 0.4 }
        );

        observer.observe(gallerySection);
      }

      document.addEventListener("visibilitychange", () => {
        if (document.hidden) {
          this.videos.forEach((video) => video.pause());
        } else {
          this.playOnly(this.currentIndex);
        }
      });

      window.addEventListener("resize", () => {
        this.setPosition(this.currentIndex, false);
      });
    },

    init() {
		this.cacheDOM();
      if (!this.track) return;

      this.buildVideos();
      this.setPosition(this.currentIndex, false);
      this.playOnly(this.currentIndex);
      this.bindTrackEvents();
      this.bindVisibilityEvents();
    }
  };
