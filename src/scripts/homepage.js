import { watchMedia } from './accessibility.js';
const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");

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
	let sourcesSelected = false;
	let stalledAtTime;
	let bufferedEnd = 0;
	let attempt = 0;
	let playPending = false;
	const canAnimate = () => !userPaused && inViewport && !document.hidden;
	const updateToggle = () => {
		toggle?.classList.toggle('is-paused', userPaused);
		toggle?.setAttribute('aria-label', document.documentElement.lang === 'en'
			? (userPaused ? 'Play animation' : 'Pause animation')
			: (userPaused ? 'Animation abspielen' : 'Animation pausieren'));
	};
	const posterSource = picture.querySelector('[data-motion-poster-source]');
	const showPoster = () => {
		if (posterSource) posterSource.media = '';
		picture.querySelectorAll('[data-motion-generated-source]').forEach((source) => source.remove());
		image.src = image.dataset.motionPoster;
		delete image.dataset.motionReady;
	};
	const showFallback = () => {
		if (!canAnimate()) return;
		window.clearTimeout(timer);
		timer = undefined;
		fallbackActive = true;
		panel.classList.remove('is-video-ready');
		panel.classList.add('is-motion-fallback');
		if (image.dataset.motionReady !== 'true') {
			if (posterSource) posterSource.media = 'not all';
			const avif = image.dataset.motionAvif;
			const webp = image.dataset.motionWebp;
			if (avif) {
				const source = document.createElement('source');
				source.type = 'image/avif';
				source.srcset = avif;
				source.dataset.motionGeneratedSource = 'true';
				picture.prepend(source);
			}
			if (webp) image.src = webp;
			image.dataset.motionReady = 'true';
		}
	};
	const suspend = () => {
		attempt++;
		playPending = false;
		window.clearTimeout(timer);
		timer = undefined;
		video.autoplay = false;
		video.pause();
		if (fallbackActive) showPoster();
		updateToggle();
	};
	const ready = () => {
		if (!canAnimate()) { suspend(); return; }
		window.clearTimeout(timer);
		timer = undefined;
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
		if (!sourcesSelected) {
			video.querySelectorAll('source[data-motion-src]').forEach((source) => {
				source.src = source.dataset.motionSrc;
			});
			sourcesSelected = true;
			video.preload = 'auto';
			video.load();
		}
		video.poster = image.currentSrc || image.src;
		video.muted = true;
		video.defaultMuted = true;
		video.autoplay = true;
		video.loop = true;
		video.playsInline = true;
		video.volume = 0;
		video.controls = false;
		const request = ++attempt;
		playPending = true;
		Promise.resolve(video.play()).then(() => {
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
	const currentBufferedEnd = () => video.buffered?.length ? video.buffered.end(video.buffered.length - 1) : 0;
	const scheduleFallback = () => {
		if (!canAnimate() || timer !== undefined) return;
		stalledAtTime = video.currentTime;
		bufferedEnd = currentBufferedEnd();
		timer = window.setTimeout(() => {
			timer = undefined;
			if (canAnimate() && video.currentTime === stalledAtTime && currentBufferedEnd() <= bufferedEnd &&
				(video.paused || video.readyState < HTMLMediaElement.HAVE_FUTURE_DATA)) showFallback();
		}, 8000);
	};
	const clearStall = () => { window.clearTimeout(timer); timer = undefined; };
	video.addEventListener('timeupdate', () => {
		if (timer !== undefined && video.currentTime !== stalledAtTime) { clearStall(); if (video.readyState < HTMLMediaElement.HAVE_FUTURE_DATA) scheduleFallback(); }
	});
	video.addEventListener('progress', () => {
		if (currentBufferedEnd() > bufferedEnd) { clearStall(); if (video.readyState < HTMLMediaElement.HAVE_FUTURE_DATA) scheduleFallback(); }
	});
	video.addEventListener('playing', ready);
	video.addEventListener('waiting', scheduleFallback);
	video.addEventListener('stalled', scheduleFallback);
	video.addEventListener('error', () => {
		if (!sourcesSelected) return;
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
	watchMedia(motionPreference, () => {
		userPaused = motionPreference.matches || manualPaused === true;
		if (userPaused) suspend();
		else play();
		updateToggle();
	});
	video.autoplay = false;
	video.pause();
	updateToggle();
	if (toggle instanceof HTMLElement) toggle.hidden = false;
	if ('IntersectionObserver' in window) {
		new IntersectionObserver(([entry]) => {
			inViewport = entry.isIntersecting && entry.intersectionRatio >= 0.12;
			if (inViewport) play();
			else suspend();
		}, { threshold: [0, 0.12] }).observe(panel);
	} else {
		const updateVisibility = () => {
			const bounds = panel.getBoundingClientRect();
			const visibleHeight = Math.max(0, Math.min(bounds.bottom, window.innerHeight) - Math.max(bounds.top, 0));
			inViewport = visibleHeight / Math.min(bounds.height, window.innerHeight) >= 0.12;
			if (inViewport) play();
			else suspend();
		};
		window.addEventListener('scroll', updateVisibility, { passive: true });
		window.addEventListener('resize', updateVisibility);
		updateVisibility();
	}
	document.addEventListener('visibilitychange', () => document.hidden ? suspend() : play());
	window.addEventListener('pagehide', suspend);
	window.addEventListener('pageshow', () => { updateToggle(); play(); });
	['pointerdown', 'keydown', 'touchstart'].forEach((eventName) => {
		window.addEventListener(eventName, () => play({ userGesture: true }), { once: true, passive: true });
	});
}

document.querySelectorAll('[data-motion-panel]').forEach(initMotionPanel);
