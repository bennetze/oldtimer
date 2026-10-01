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
	let healthTimer;
	let qualitySample;
	let useMobile = window.innerWidth <= 900 || navigator.connection?.saveData === true;
	const mobileSource = video.querySelectorAll('source[data-motion-src]')[0]?.dataset.motionMobileSrc;
	const clearHealth = () => { window.clearTimeout(healthTimer); healthTimer = undefined; qualitySample = undefined; };
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
		// Stop the decoder before starting an animated image; late play promises
		// must not switch the panel back to video behind the user's pause control.
		attempt++;
		playPending = false;
		clearHealth();
		video.autoplay = false;
		video.pause();
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
		clearHealth();
		window.clearTimeout(timer);
		timer = undefined;
		video.autoplay = false;
		video.pause();
		if (fallbackActive) showPoster();
		updateToggle();
	};
	const ready = () => {
		if (!canAnimate()) { suspend(); return; }
		if (fallbackActive) { video.pause(); return; }
		window.clearTimeout(timer);
		timer = undefined;
		autoplayBlocked = false;
		fallbackActive = false;
		showPoster();
		panel.classList.add('is-video-ready');
		panel.classList.remove('is-motion-fallback');
		monitorQuality();
		updateToggle();
	};
	const play = ({ userGesture = false } = {}) => {
		if (!canAnimate()) return;
		updateToggle();
		if ((autoplayBlocked || fallbackActive) && !userGesture) { showFallback(); return; }
		if (playPending || (!video.paused && panel.classList.contains('is-video-ready'))) return;
		fallbackActive = false;
		// play() is explicitly controlled here. Setting autoplay as well makes
		// Safari's hidden-element autoplay rules race the poster reveal.
		video.autoplay = false;
		if (!sourcesSelected) {
			video.querySelectorAll('source[data-motion-src]').forEach((source) => {
				source.src = useMobile && source.type === 'video/mp4' && mobileSource ? mobileSource : source.dataset.motionSrc;
			});
			sourcesSelected = true;
			video.preload = 'auto';
			video.load();
		}
		video.poster = image.currentSrc || image.src;
		video.muted = true;
		video.defaultMuted = true;
		video.autoplay = false;
		video.loop = true;
		video.playsInline = true;
		video.volume = 0;
		video.controls = false;
		const request = ++attempt;
		playPending = true;
		scheduleFallback();
		let result;
		try { result = video.play(); } catch (error) { result = Promise.reject(error); }
		Promise.resolve(result).then(() => {
			if (request !== attempt) return;
			playPending = false;
			ready();
		}).catch((error) => {
			if (request !== attempt || !canAnimate()) return;
			playPending = false;
			if (error?.name === 'AbortError') { scheduleFallback(); return; }
			autoplayBlocked = true;
			showFallback();
		});
	};
	const monitorQuality = () => {
		if (!mobileSource || useMobile || !video.getVideoPlaybackQuality || healthTimer !== undefined) return;
		qualitySample = video.getVideoPlaybackQuality();
		healthTimer = window.setTimeout(() => {
			healthTimer = undefined;
			if (!canAnimate() || video.paused || fallbackActive) return;
			const current = video.getVideoPlaybackQuality();
			const frames = current.totalVideoFrames - qualitySample.totalVideoFrames;
			const dropped = current.droppedVideoFrames - qualitySample.droppedVideoFrames;
			if (frames >= 30 && dropped / frames > 0.25) {
				// Preserve position and pause intent when a device cannot decode 1080p.
				const position = video.currentTime;
				suspend();
				useMobile = true;
				sourcesSelected = false;
				panel.classList.remove('is-video-ready');
				video.addEventListener('loadedmetadata', () => {
					if (Number.isFinite(video.duration)) video.currentTime = Math.min(position, video.duration);
				}, { once: true });
				play();
			} else monitorQuality();
		}, 3000);
	};
	const currentBufferedEnd = () => video.buffered?.length ? video.buffered.end(video.buffered.length - 1) : 0;
	const scheduleFallback = () => {
		if (!canAnimate() || timer !== undefined) return;
		stalledAtTime = video.currentTime;
		bufferedEnd = currentBufferedEnd();
		timer = window.setTimeout(() => {
			timer = undefined;
			if (!canAnimate() || video.currentTime !== stalledAtTime) return;
			if (currentBufferedEnd() > bufferedEnd) { scheduleFallback(); return; }
			showFallback();
		}, 8000);
	};
	const clearStall = () => { window.clearTimeout(timer); timer = undefined; };
	video.addEventListener('timeupdate', () => {
		if (timer !== undefined && video.currentTime !== stalledAtTime) { clearStall(); if (playPending || video.readyState < HTMLMediaElement.HAVE_FUTURE_DATA) scheduleFallback(); }
	});
	video.addEventListener('progress', () => {
		if (currentBufferedEnd() > bufferedEnd) { clearStall(); if (playPending || video.readyState < HTMLMediaElement.HAVE_FUTURE_DATA) scheduleFallback(); }
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
			inViewport = entry.isIntersecting && entry.intersectionRatio > 0.5;
			if (inViewport) play();
			else suspend();
		}, { threshold: [0, 0.5, 0.51] }).observe(panel);
	} else {
		const updateVisibility = () => {
			const bounds = panel.getBoundingClientRect();
			const visibleHeight = Math.max(0, Math.min(bounds.bottom, window.innerHeight) - Math.max(bounds.top, 0));
			inViewport = visibleHeight / Math.min(bounds.height, window.innerHeight) > 0.5;
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
