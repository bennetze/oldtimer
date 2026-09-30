import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { watchMedia, setIsolated, systemPointerPreference } from '../src/scripts/accessibility.js';
const component = await readFile(new URL('../src/components/SiteChrome.astro', import.meta.url), 'utf8');
const source = component.split('<script>')[1].split('</script>')[0].replace(/import .*;/g, '');
function harness() {
	class Element {
		listeners = {}; attributes = {}; children = []; inert = false;
		classes = new Set();
		classList = { add: name => this.classes.add(name), remove: name => this.classes.delete(name), contains: name => this.classes.has(name), toggle: (name, active) => active ? this.classes.add(name) : this.classes.delete(name) };
		addEventListener(name, callback) { (this.listeners[name] ??= []).push(callback); }
		emit(name, event = {}) { for (const callback of this.listeners[name] ?? []) callback(event); }
		setAttribute(name, value) { this.attributes[name] = value; }
		getAttribute(name) { return this.attributes[name]; }
		removeAttribute(name) { delete this.attributes[name]; }
		closest() { return null; }
		querySelectorAll() { return []; }
		focus() {}
	}
	const window = new Element(); window.scrollY = 0;
	const preference = new Element(); preference.matches = false;
	window.matchMedia = () => preference;
	window.performance = { now: () => 0 };
	const frames = new Map(); let next = 1;
	window.requestAnimationFrame = callback => { frames.set(next, callback); return next++; };
	window.cancelAnimationFrame = id => frames.delete(id);
	window.scrollTo = (_, y) => { window.scrollY = y; };
	window.getComputedStyle = () => ({ scrollMarginTop: '0' });
	window.location = { hash: '', pathname: '/', search: '' };
	const sections = ['start', 'craft', 'company', 'projects'].map((id, index) => {
		const section = new Element(); section.id = id; section.y = index * 1000;
		section.getBoundingClientRect = () => ({ top: section.y - window.scrollY });
		section.scrollIntoView = () => { window.scrollY = section.y; };
		return section;
	});
	const footer = new Element(); footer.y = 4000;
	footer.getBoundingClientRect = () => ({ top: footer.y - window.scrollY });
	footer.scrollIntoView = () => { window.scrollY = footer.y; };
	const controls = sections.map(section => { const control = new Element(); control.attributes['data-section-target'] = `#${section.id}`; control.attributes['data-scroll-target'] = `#${section.id}`; return control; });
	controls[0].classList.add('is-active');
	const indicator = new Element(); indicator.querySelectorAll = () => controls;
	const menu = new Element(); menu.attributes['aria-hidden'] = 'true';
	const menuToggle = new Element();
	const document = new Element(); document.body = new Element(); document.documentElement = new Element();
	const lookup = { '[data-section-indicator]': indicator, '#site-footer': footer, '.menu-overlay': menu, '.menu-toggle': menuToggle, '.site-shell': new Element() };
	sections.forEach(section => { lookup[`#${section.id}`] = section; });
	document.querySelector = selector => lookup[selector] ?? null;
	document.querySelectorAll = selector => selector === '[data-scroll-target]' ? controls : [];
	document.getElementById = id => sections.find(section => section.id === id);
	let observe;
	class Observer { constructor(callback) { observe = callback; } observe() {} }
	window.IntersectionObserver = Observer;
	vm.runInNewContext(source, { watchMedia, setIsolated, systemPointerPreference, HTMLInputElement: Element, document, window, Element, HTMLElement: Element, IntersectionObserver: Observer });
	const key = code => { const event = { code, target: new Element(), defaultPrevented: false, preventDefault() { this.defaultPrevented = true; } }; window.emit('keydown', event); return event; };
	const flush = () => { const pending = [...frames.values()]; frames.clear(); pending.forEach(callback => callback(2000)); };
	return { document, click: index => controls[index].emit('click', { preventDefault() {} }), window, preference, sections, controls, key, frames, flush, menuToggle, observe: entries => observe(entries) };
}
test('global arrow keys preserve native navigation without interception or animation', () => {
	const s = harness();
	for (const code of ['ArrowDown', 'ArrowUp', 'Home', 'End', 'PageUp', 'PageDown']) {
		assert.equal(s.key(code).defaultPrevented, false); s.flush(); assert.equal(s.window.scrollY, 0); assert.equal(s.frames.size, 0);
	}
});
test('section controls still scroll; live motion and opening menu stop pending scrolling', () => {
	const s = harness(); s.click(1); assert.equal(s.frames.size, 1);
	s.preference.matches = true; s.preference.emit('change'); assert.equal(s.frames.size, 0);
	s.click(2); assert.equal(s.window.scrollY, 2000); assert.equal(s.frames.size, 0);
	s.preference.matches = false; s.click(3); s.menuToggle.emit('click', { preventDefault() {} }); assert.equal(s.frames.size, 0);
	s.observe(s.sections.map(target => ({ target, isIntersecting: false, intersectionRatio: 0 })));
	assert.equal(s.controls[3].classList.contains('is-active'), true);
});

test('older CSS APIs activate a visible keyboard-focus fallback', () => {
	const s = harness();
	assert.equal(s.document.documentElement.classList.contains('legacy-focus'), true);
});
