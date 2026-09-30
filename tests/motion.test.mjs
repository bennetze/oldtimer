import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { watchMedia } from '../src/scripts/accessibility.js';
const script = await readFile(new URL('../src/scripts/homepage.js', import.meta.url), 'utf8');

class Element {
	listeners = new Map();
	dataset = {};
	attributes = new Map();
	classes = new Set();
	classList = { add: (...names) => names.forEach((name) => this.classes.add(name)), remove: (...names) => names.forEach((name) => this.classes.delete(name)), toggle: (name, state) => state ? this.classes.add(name) : this.classes.delete(name) };
	addEventListener(name, listener) { this.listeners.set(name, [...(this.listeners.get(name) ?? []), listener]); }
	emit(name, event = {}) { for (const listener of this.listeners.get(name) ?? []) listener(event); }
	setAttribute(name, value) { this.attributes.set(name, value); }
	hasAttribute(name) { return this.attributes.has(name); }
}
class Video extends Element {
	paused = false;
	readyState = 0;
	requests = [];
	loads = 0;
	currentTime = 0;
	sourceNodes = [{type:'video/mp4', dataset:{motionSrc:'desktop.mp4'}}, {type:'video/webm', dataset:{motionSrc:'desktop.webm'}}];
	querySelectorAll() { return this.sourceNodes; }
	load() { this.loads++; }
	pause() { this.paused = true; }
	play() { return new Promise((resolve, reject) => this.requests.push({ resolve: () => { this.paused = false; resolve(); }, reject })); }
}
class Image extends Element {}
function setup(reduced = false, options = {}) {
	const preference = new Element(); preference.matches = reduced;
	if (options.legacy) { preference.addListener = callback => Element.prototype.addEventListener.call(preference, 'change', callback); preference.addEventListener = undefined; }
	const video = new Video(); video.dataset = {};
	if (options.voidPlay) video.play = () => { video.paused = false; };
	const image = new Image(); image.dataset = { motionPoster: 'poster.jpg', motionAvif: 'motion.avif', motionWebp: 'motion.webp' }; image.src = 'poster.jpg';
	const picture = new Element(); const sources = []; const posterSource = new Element(); picture.querySelector = () => posterSource;
	picture.prepend = (source) => { sources.push(source); source.remove = () => sources.splice(sources.indexOf(source), 1); };
	picture.querySelectorAll = () => [...sources];
	const toggle = new Element(); const panel = new Element();
	panel.top = 0; panel.getBoundingClientRect = () => ({ top: panel.top, bottom: panel.top + 100, height: 100 });
	panel.querySelector = (selector) => ({ '[data-motion-video]': video, '[data-motion-image]': image, '[data-motion-fallback]': picture, '[data-motion-toggle]': toggle })[selector];
	const document = new Element();
	document.documentElement = { lang: 'de' };
	document.hidden = false; document.readyState = 'complete';
	document.querySelector = () => null; document.querySelectorAll = () => [panel]; document.createElement = () => new Element();
	const timers = new Map(); let timerId = 0;
	const window = new Element(); window.matchMedia = () => preference;
	window.setTimeout = (callback) => { timers.set(++timerId, callback); return timerId; };
	window.clearTimeout = (id) => timers.delete(id);
	let intersect;
	class Observer { constructor(callback) { intersect = callback; } observe() {} }
	if (!options.noObserver) window.IntersectionObserver = Observer;
	window.innerHeight = 100; window.innerWidth = options.width || 1440; window.devicePixelRatio = options.pixelRatio || 1;
	vm.runInNewContext(script.replace(/^import .*;\n/gm, ''), { watchMedia, Promise, document, window, HTMLElement: Element, HTMLVideoElement: Video, HTMLImageElement: Image, HTMLMediaElement: { HAVE_FUTURE_DATA: 3 }, IntersectionObserver: Observer });
	return { window, video, image, sources, toggle, panel, preference, document, timers, posterSource, visible: (value) => intersect([{ isIntersecting: value, intersectionRatio: value ? 1 : 0 }]) };
}
const settle = async () => { await Promise.resolve(); await Promise.resolve(); await Promise.resolve(); };

test('reduced motion starts still and allows explicit manual playback', async () => {
	const s = setup(true); s.visible(true);
	assert.equal(s.video.paused, true); assert.equal(s.video.autoplay, false); assert.equal(s.video.requests.length, 0);
	s.toggle.emit('click'); assert.equal(s.video.requests.length, 1);
	s.video.requests[0].resolve(); await settle();
	assert.ok(s.panel.classes.has('is-video-ready')); assert.equal(s.sources.length, 0);
	s.preference.emit('change'); assert.equal(s.video.paused, true);
});

test('late rejection and playing events cannot restart a user-paused section', async () => {
	const s = setup(); s.visible(true); s.toggle.emit('click');
	s.video.requests[0].reject(new Error('blocked')); await settle();
	s.video.emit('error'); s.video.emit('playing');
	assert.equal(s.video.paused, true); assert.equal(s.sources.length, 0); assert.equal(s.image.src, 'poster.jpg');
	assert.equal(s.toggle.attributes.get('aria-label'), 'Animation abspielen');
});

test('fallback stops offscreen, on pause and on live reduced-motion changes', async () => {
	const s = setup(); s.visible(true); s.video.requests[0].reject(new Error('blocked')); await settle();
	assert.equal(s.sources.length, 1);
	s.visible(false); assert.equal(s.sources.length, 0);
	s.visible(true); assert.equal(s.sources.length, 1);
	s.preference.matches = true; s.preference.emit('change'); assert.equal(s.sources.length, 0);
	s.video.emit('error'); assert.equal(s.sources.length, 0);
});

test('stall timers recheck visibility and successful video does not request motion fallback', async () => {
	const s = setup(); s.visible(true); s.video.requests[0].resolve(); await settle();
	assert.equal(s.sources.length, 0); assert.equal(s.image.src, 'poster.jpg');
	s.video.emit('stalled'); const callback = [...s.timers.values()][0];
	s.visible(false); callback(); assert.equal(s.sources.length, 0);
});

test('legacy listeners, promise-less play and missing observers retain manual pause and visibility', async () => {
	const s = setup(false, { legacy: true, voidPlay: true, noObserver: true }); await settle();
	assert.equal(s.video.paused, false); assert.ok(s.panel.classes.has('is-video-ready'));
	s.panel.top = 200; s.window.emit('scroll'); assert.equal(s.video.paused, true);
	s.panel.top = 0; s.window.emit('scroll'); await settle(); assert.equal(s.video.paused, false);
	s.preference.matches = true; s.preference.emit('change'); assert.equal(s.video.paused, true);
});


test('media sources stay unloaded until eligible playback and use the same desktop files at mobile widths', async () => {
	const s = setup(true, { width: 390, pixelRatio: 3 }); s.visible(true);
	assert.equal(s.video.loads, 0); assert.equal(s.video.sourceNodes[0].src, undefined);
	s.toggle.emit('click'); assert.equal(s.video.sourceNodes[0].src, 'desktop.mp4'); assert.equal(s.video.loads, 1);
	s.video.requests[0].resolve(); await settle();
	s.window.innerWidth = 1440; s.visible(false); s.visible(true);
	assert.equal(s.video.loads, 1); assert.equal(s.video.sourceNodes[0].src, 'desktop.mp4');
});

test('shared motion fallbacks suppress responsive still sources and restore them on pause', async () => {
	const s = setup(false, { width: 390 }); s.visible(true); s.video.requests[0].reject(new Error('blocked')); await settle();
	assert.equal(s.sources[0].srcset, 'motion.avif'); assert.equal(s.image.src, 'motion.webp');
	assert.equal(s.posterSource.media, 'not all');
	s.toggle.emit('click'); assert.equal(s.posterSource.media, ''); assert.equal(s.sources.length, 0);
});

test('buffer progress restarts the sustained-stall check; playback and pause cancel it', () => {
	const s = setup(); s.visible(true); let end = 1; s.video.buffered = { length:1, end:()=>end };
	s.video.emit('waiting'); const first = [...s.timers.values()][0];
	s.timers.clear(); // A fired browser timeout is removed from its queue.
	end = 2; first(); assert.equal(s.sources.length, 0);
	s.video.emit('progress'); assert.equal(s.timers.size, 1);
	s.video.emit('playing'); assert.equal(s.timers.size, 0);
	s.video.emit('waiting'); s.toggle.emit('click'); assert.equal(s.timers.size, 0);
});
