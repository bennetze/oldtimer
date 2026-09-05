const heroTitleLetter = document.querySelector(
  "[data-hero-title-letter]",
);
const heroTitleLetterGlyph = document.querySelector(
  "[data-hero-title-letter-glyph]",
);
let heroTitleCycleAnimation;
let heroTitleCycleStarted = false;
let heroTitleResizeFrame;
const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
let heroShouldAnimate = false;

const measureHeroTitleLetter = () => {
  if (
    !(heroTitleLetter instanceof HTMLElement) ||
    !(heroTitleLetterGlyph instanceof HTMLElement)
  ) {
    return;
  }

  const letterWidth = heroTitleLetterGlyph.getBoundingClientRect().width;
  if (letterWidth > 0) {
    heroTitleLetter.style.setProperty(
      "--hero-title-letter-width",
      `${letterWidth}px`,
    );
  }

  return letterWidth;
};

const startHeroTitleCycle = () => {
  if (!(heroTitleLetter instanceof HTMLElement)) {
    return;
  }

  Promise.resolve(document.fonts?.ready).then(() => {
    const letterWidth = measureHeroTitleLetter();
    if (!letterWidth) {
      return;
    }

    heroTitleCycleAnimation?.cancel();
    heroTitleLetter.classList.remove("is-cycling", "is-revealing");
    Object.assign(heroTitleLetter.style, {
      clipPath: "none",
      display: "inline-block",
      overflow: "visible",
      verticalAlign: "baseline",
    });

    if (
      motionPreference.matches ||
      typeof heroTitleLetter.animate !== "function"
    ) {
      Object.assign(heroTitleLetter.style, {
        filter: "blur(0)",
        opacity: "1",
        transform: "none",
        width: `${letterWidth}px`,
      });
      return;
    }

    const hiddenLetter = {
      filter: "blur(0.1em)",
      opacity: 0,
      transform: "translateX(-0.14em)",
      width: "0px",
    };
    const visibleLetter = {
      filter: "blur(0)",
      opacity: 1,
      transform: "translateX(0)",
      width: `${letterWidth}px`,
    };

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        heroTitleCycleAnimation = heroTitleLetter.animate(
          [
            { ...hiddenLetter, offset: 0 },
            {
              ...hiddenLetter,
              easing: "cubic-bezier(0.65, 0, 0.35, 1)",
              offset: 1 / 10,
            },
            { ...visibleLetter, offset: 2 / 10 },
            {
              ...visibleLetter,
              easing: "cubic-bezier(0.65, 0, 0.35, 1)",
              offset: 8 / 10,
            },
            { ...hiddenLetter, offset: 9 / 10 },
            { ...hiddenLetter, offset: 1 },
          ],
          {
            duration: 7500,
            fill: "both",
            iterations: Infinity,
          },
        );
        if (!heroShouldAnimate) heroTitleCycleAnimation.pause();
      });
    });

    heroTitleCycleStarted = true;
  });
};

if (heroTitleLetter instanceof HTMLElement && !motionPreference.matches) {
  heroTitleLetter.classList.remove("is-cycling", "is-revealing");
  Object.assign(heroTitleLetter.style, {
    clipPath: "none",
    display: "inline-block",
    filter: "blur(0.1em)",
    opacity: "0",
    overflow: "visible",
    transform: "translateX(-0.14em)",
    verticalAlign: "baseline",
    width: "0px",
  });
}

if (document.readyState === "complete") {
  startHeroTitleCycle();
} else {
  window.addEventListener("load", startHeroTitleCycle, { once: true });
}

window.addEventListener(
  "resize",
  () => {
    window.cancelAnimationFrame(heroTitleResizeFrame);
    heroTitleResizeFrame = window.requestAnimationFrame(() => {
      if (heroTitleCycleStarted) {
        startHeroTitleCycle();
      } else {
        measureHeroTitleLetter();
      }
    });
  },
  { passive: true },
);

const setHeroAnimationRunning = (running) => {
	heroShouldAnimate = running;
	if (running) heroTitleCycleAnimation?.play();
	else heroTitleCycleAnimation?.pause();
};
motionPreference.addEventListener('change', startHeroTitleCycle);

function initMotionPanel(panel) {
	const video = panel.querySelector('[data-motion-video]');
	const picture = panel.querySelector('[data-motion-fallback]');
	const image = panel.querySelector('[data-motion-image]');
	const toggle = panel.querySelector('[data-motion-toggle]');
	if (!(video instanceof HTMLVideoElement) || !(image instanceof HTMLImageElement) || !picture) return;

	let userPaused = motionPreference.matches;
	let manualPaused;
	let inViewport = false;
	let autoplayBlocked = false;
	let fallbackActive = false;
	let timer;
	let attempt = 0;
	let playPending = false;
	const isHero = panel.hasAttribute('data-hero');
	const canAnimate = () => !userPaused && inViewport && !document.hidden;
	const updateToggle = () => {
		toggle?.classList.toggle('is-paused', userPaused);
		toggle?.setAttribute('aria-label', userPaused ? 'Animation abspielen' : 'Animation pausieren');
		if (isHero) setHeroAnimationRunning(canAnimate());
	};
	const showPoster = () => {
		picture.querySelectorAll('[data-motion-generated-source]').forEach((source) => source.remove());
		image.src = image.dataset.motionPoster;
		delete image.dataset.motionReady;
	};
	const showFallback = () => {
		if (!canAnimate()) return;
		window.clearTimeout(timer);
		fallbackActive = true;
		panel.classList.remove('is-video-ready');
		panel.classList.add('is-motion-fallback');
		if (image.dataset.motionReady !== 'true') {
			if (image.dataset.motionAvif) {
				const source = document.createElement('source');
				source.type = 'image/avif';
				source.srcset = image.dataset.motionAvif;
				source.dataset.motionGeneratedSource = 'true';
				picture.prepend(source);
			}
			if (image.dataset.motionWebp) image.src = image.dataset.motionWebp;
			image.dataset.motionReady = 'true';
		}
	};
	const suspend = () => {
		attempt++;
		playPending = false;
		window.clearTimeout(timer);
		video.autoplay = false;
		video.pause();
		if (fallbackActive) showPoster();
		updateToggle();
	};
	const ready = () => {
		if (!canAnimate()) { suspend(); return; }
		window.clearTimeout(timer);
		autoplayBlocked = false;
		fallbackActive = false;
		showPoster();
		panel.classList.add('is-video-ready');
		panel.classList.remove('is-motion-fallback');
		updateToggle();
	};
	const play = ({ userGesture = false } = {}) => {
		if (!canAnimate()) return;
		updateToggle();
		if (autoplayBlocked && !userGesture) { showFallback(); return; }
		if (playPending) return;
		video.muted = true;
		video.defaultMuted = true;
		video.autoplay = true;
		video.loop = true;
		video.playsInline = true;
		video.volume = 0;
		video.controls = false;
		const request = ++attempt;
		playPending = true;
		video.play().then(() => {
			if (request !== attempt) return;
			playPending = false;
			ready();
		}).catch(() => {
			if (request !== attempt || !canAnimate()) return;
			playPending = false;
			autoplayBlocked = true;
			showFallback();
		});
	};
	const scheduleFallback = () => {
		if (!canAnimate()) return;
		window.clearTimeout(timer);
		timer = window.setTimeout(() => {
			if (canAnimate() && (video.paused || video.readyState < HTMLMediaElement.HAVE_FUTURE_DATA)) showFallback();
		}, 900);
	};
	video.addEventListener('playing', ready);
	video.addEventListener('waiting', scheduleFallback);
	video.addEventListener('stalled', scheduleFallback);
	video.addEventListener('error', () => {
		autoplayBlocked = true;
		showFallback();
	});
	toggle?.addEventListener('click', () => {
		userPaused = !userPaused;
		manualPaused = userPaused;
		if (userPaused) suspend();
		else play({ userGesture: true });
		updateToggle();
	});
	motionPreference.addEventListener('change', () => {
		userPaused = motionPreference.matches || manualPaused === true;
		if (userPaused) suspend();
		else play();
		updateToggle();
	});
	video.autoplay = false;
	video.pause();
	updateToggle();
	if ('IntersectionObserver' in window) {
		new IntersectionObserver(([entry]) => {
			inViewport = entry.isIntersecting && entry.intersectionRatio >= 0.12;
			if (inViewport) play();
			else suspend();
		}, { threshold: [0, 0.12] }).observe(panel);
	} else {
		inViewport = true;
		play();
	}
	document.addEventListener('visibilitychange', () => document.hidden ? suspend() : play());
	window.addEventListener('pagehide', suspend);
	window.addEventListener('pageshow', () => { updateToggle(); play(); });
	['pointerdown', 'keydown', 'touchstart'].forEach((eventName) => {
		window.addEventListener(eventName, () => play({ userGesture: true }), { once: true, passive: true });
	});
}

document.querySelectorAll('[data-motion-panel]').forEach(initMotionPanel);
