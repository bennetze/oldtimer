import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
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
	pause() { this.paused = true; }
	play() { return new Promise((resolve, reject) => this.requests.push({ resolve: () => { this.paused = false; resolve(); }, reject })); }
}
class Image extends Element {}
function setup(reduced = false) {
	const preference = new Element(); preference.matches = reduced;
	const video = new Video();
	const image = new Image(); image.dataset = { motionPoster: 'poster.jpg', motionAvif: 'motion.avif', motionWebp: 'motion.webp' }; image.src = 'poster.jpg';
	const picture = new Element(); const sources = [];
	picture.prepend = (source) => { sources.push(source); source.remove = () => sources.splice(sources.indexOf(source), 1); };
	picture.querySelectorAll = () => [...sources];
	const toggle = new Element(); const panel = new Element();
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
	window.IntersectionObserver = Observer;
	vm.runInNewContext(script, { document, window, HTMLElement: Element, HTMLVideoElement: Video, HTMLImageElement: Image, HTMLMediaElement: { HAVE_FUTURE_DATA: 3 }, IntersectionObserver: Observer });
	return { video, image, sources, toggle, panel, preference, document, timers, visible: (value) => intersect([{ isIntersecting: value, intersectionRatio: value ? 1 : 0 }]) };
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
