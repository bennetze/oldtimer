import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';
import test from 'node:test';

const component = await readFile(new URL('../src/components/SiteChrome.astro', import.meta.url), 'utf8');
const source = component.slice(component.indexOf('\tif (cursor instanceof HTMLElement) {'), component.indexOf('\n\tconst focusableMenuItems'));

function harness({ supported = true, maskSupported = true, legacy = false } = {}) {
	class Element {
		constructor(kind = '') {
			this.kind = kind;
			this.listeners = {};
			this.style = {};
			const classes = new Set();
			this.classList = {
				add: (...names) => names.forEach(name => classes.add(name)),
				remove: (...names) => names.forEach(name => classes.delete(name)),
				contains: name => classes.has(name),
				toggle: (name, active) => active ? classes.add(name) : classes.delete(name),
			};
		}
		addEventListener(type, handler) { (this.listeners[type] ??= []).push(handler); }
		emit(type, event = {}) { for (const handler of this.listeners[type] ?? []) handler(event); }
		closest(selector) { return this.kind && selector.split(', ').includes(this.kind) ? this : null; }
	}
	const cursor = new Element();
	const document = new Element();
	document.documentElement = new Element();
	document.querySelector = () => document.dialogOpen ? {} : null;
	const window = new Element();
	const preferences = [];
	window.matchMedia = () => {
		const preference = new Element();
		preference.matches = preferences.length === 0;
		if (legacy) {
			preference.addListener = handler => Element.prototype.addEventListener.call(preference, 'change', handler);
			preference.addEventListener = undefined;
		}
		preferences.push(preference);
		return preference;
	};
	const frames = new Map();
	let nextFrame = 1;
	window.requestAnimationFrame = callback => { const id = nextFrame++; frames.set(id, callback); return id; };
	window.cancelAnimationFrame = id => frames.delete(id);
	window.PointerEvent = function () {};
	runInNewContext(source, { cursor, document, window, Element, HTMLElement: Element, CSS: { supports: property => property.includes('mask-image') ? maskSupported : supported }, interactiveSelector: 'a, button, [role="button"]' });
	return {
		cursor, document, window, preferences, frames,
		active: () => document.documentElement.classList.contains('has-custom-cursor'),
		move: (kind = '', pointerType = 'mouse', x = 100) => window.emit('pointermove', { target: new Element(kind), pointerType, clientX: x, clientY: 80 }),
		flush: () => { const callbacks = [...frames.values()]; frames.clear(); callbacks.forEach(callback => callback()); },
	};
}

test('cursor enables only after positioning; motion coalesces and stops when idle', () => {
	const h = harness();
	assert.equal(h.active(), false);
	h.move(); h.move('button', 'mouse', 240);
	assert.equal(h.frames.size, 1);
	assert.equal(h.active(), false);
	h.flush();
	assert.equal(h.active(), true);
	assert.match(h.cursor.style.transform, /240px/);
	assert.equal(h.cursor.classList.contains('is-active'), true);
	assert.equal(h.frames.size, 0);
	h.document.emit('keydown');
	assert.equal(h.active(), false);
});

test('unsupported effects and live accessibility/breakpoint changes preserve native cursor', () => {
	for (const options of [{ supported: false }, { maskSupported: false }]) {
		const unsupported = harness(options);
		unsupported.move(); unsupported.flush();
		assert.equal(unsupported.active(), false);
	}
	for (const legacy of [false, true]) {
		for (let index = 0; index < 3; index++) {
			const h = harness({ legacy });
			h.move(); h.flush();
			h.move();
			h.preferences[index].matches = index !== 0;
			h.preferences[index].emit('change');
			h.flush();
			assert.equal(h.active(), false);
			assert.equal(h.frames.size, 0);
		}
	}
});

test('touch, forms, dialogs and leaving the page restore the native pointer', () => {
	for (const kind of ['input', 'textarea', 'select', 'dialog', 'iframe']) {
		const h = harness(); h.move(); h.flush(); h.move(kind); h.flush();
		assert.equal(h.active(), false, kind);
	}
	const h = harness(); h.move(); h.flush(); h.move('', 'touch'); h.flush();
	assert.equal(h.active(), false);
	h.move(); h.document.dialogOpen = true; h.move(); h.flush();
	assert.equal(h.active(), false);
	h.document.dialogOpen = false;
	for (const [target, event] of [[h.window, 'blur'], [h.document, 'visibilitychange'], [h.document.documentElement, 'pointerleave']]) {
		h.move(); h.flush(); h.move(); target.emit(event); h.flush();
		assert.equal(h.active(), false, event);
	}
});
