import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
const component = await readFile(new URL('../src/components/VehicleDetailPage.astro', import.meta.url), 'utf8');
const source = component.split('<script>')[1].split('</script>')[0];
test('lightbox dismisses empty stage and Escape, preserves image clicks and restores focus', () => {
	class Element {
		listeners = {}; dataset = {}; focused = false;
		classList = { contains: name => name === this.kind };
		addEventListener(name, callback) { this.listeners[name] = callback; }
		emit(name, event = {}) { this.listeners[name]?.(event); }
		focus() { this.focused = true; }
		removeAttribute(name) { delete this[name]; }
	}
	class Image extends Element {}
	class Dialog extends Element {
		open = false;
		showModal() { this.open = true; }
		close() { this.open = false; this.emit('close'); }
	}
	const dialog = new Dialog(), image = new Image(), close = new Element(), trigger = new Element();
	trigger.dataset = { lightboxSrc: '/photo.webp', lightboxAlt: 'Car' };
	dialog.querySelector = selector => selector === '[data-lightbox-image]' ? image : close;
	vm.runInNewContext(source, { document: { querySelector: () => dialog, querySelectorAll: () => [trigger] }, Element, HTMLElement: Element, HTMLImageElement: Image, HTMLDialogElement: Dialog });
	trigger.emit('click'); assert.equal(dialog.open, true); assert.equal(image.alt, 'Car');
	dialog.emit('click', { target: image }); assert.equal(dialog.open, true);
	const stage = new Element(); stage.kind = 'image-lightbox__stage';
	dialog.emit('click', { target: stage }); assert.equal(dialog.open, false); assert.equal(trigger.focused, true); assert.equal(image.src, undefined);
	trigger.emit('click'); dialog.emit('keydown', { key: 'Escape', preventDefault() {} }); assert.equal(dialog.open, false);
	trigger.emit('click'); dialog.emit('click', { target: dialog }); assert.equal(dialog.open, false);
});
