import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { createModal } from '../src/scripts/accessibility.js';
const component = await readFile(new URL('../src/components/VehicleDetailPage.astro', import.meta.url), 'utf8');
const source = component.split('<script>')[1].split('</script>')[0].replace(/import .*;/g, '');
test('lightbox dismisses empty stage and Escape, preserves image clicks and restores focus', () => {
	class Element {
		listeners = {}; dataset = {}; focused = false;
		attributes = new Map();
		hasAttribute(name) { return name === 'open' ? this.open : this.attributes.has(name); }
		querySelectorAll() { return [close]; }
		classList = { contains: name => name === this.kind };
		addEventListener(name, callback) { (this.listeners[name] ??= []).push(callback); }
		emit(name, event = {}) { for (const listener of this.listeners[name] ?? []) listener(event); }
		focus() { this.focused = true; }
		removeAttribute(name) { delete this[name]; }
	}
	class Image extends Element {}
	class Dialog extends Element {
		open = false;
		showModal() { this.open = true; }
		close() { this.open = false; this.emit('close'); }
	}
	const doc = { activeElement: null };
	const dialog = new Dialog(), image = new Image(), close = new Element(), trigger = new Element();
	dialog.ownerDocument = doc;
	trigger.dataset = { lightboxSrc: '/photo.webp', lightboxAlt: 'Car' };
	dialog.querySelector = selector => selector === '[data-lightbox-image]' ? image : close;
	vm.runInNewContext(source, { createModal, document: { querySelector: () => dialog, querySelectorAll: () => [trigger] }, Element, HTMLElement: Element, HTMLImageElement: Image, HTMLDialogElement: Dialog });
	trigger.emit('click', { preventDefault() {} }); assert.equal(dialog.open, true); assert.equal(image.alt, 'Car');
	dialog.emit('click', { target: image }); assert.equal(dialog.open, true);
	const stage = new Element(); stage.kind = 'image-lightbox__stage';
	dialog.emit('click', { target: stage }); assert.equal(dialog.open, false); assert.equal(trigger.focused, true); assert.equal(image.src, undefined);
	trigger.emit('click', { preventDefault() {} }); dialog.emit('keydown', { key: 'Escape', preventDefault() {} }); assert.equal(dialog.open, false);
	trigger.emit('click', { preventDefault() {} }); dialog.emit('click', { target: dialog }); assert.equal(dialog.open, false);
});
