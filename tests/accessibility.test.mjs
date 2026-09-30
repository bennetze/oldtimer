import test from 'node:test';
import assert from 'node:assert/strict';
import { watchMedia, setIsolated, systemPointerPreference, createModal } from '../src/scripts/accessibility.js';

class Element {
	attributes = new Map(); style = {}; children = []; listeners = new Map();
	getAttribute(key) { return this.attributes.get(key) ?? null; }
	setAttribute(key, value) { this.attributes.set(key, value); }
	removeAttribute(key) { this.attributes.delete(key); }
	hasAttribute(key) { return this.attributes.has(key); }
	querySelectorAll() { return this.children; }
	addEventListener(key, callback) { this.listeners.set(key, [...(this.listeners.get(key) ?? []), callback]); }
	dispatchEvent(event) { for (const listener of this.listeners.get(event.type) ?? []) listener(event); }
	focus() { this.ownerDocument.activeElement = this; }
}

test('legacy media listener registers live preference changes', () => {
	let callback; const query = { addListener(listener) { callback = listener; } };
	let changes = 0; watchMedia(query, () => changes++); callback(); assert.equal(changes, 1);
	assert.doesNotThrow(() => watchMedia({}, () => {}));
});
test('fallback isolation restores original tabindex, ARIA and pointer state idempotently', () => {
	const root = new Element(), link = new Element(), disabled = new Element(); root.children = [link, disabled];
	root.style.pointerEvents = 'auto'; root.setAttribute('aria-hidden', 'false'); disabled.setAttribute('tabindex', '-1');
	setIsolated(root, true); setIsolated(root, true);
	assert.equal(root.getAttribute('aria-hidden'), 'true'); assert.equal(link.getAttribute('tabindex'), '-1');
	setIsolated(root, false);
	assert.equal(root.getAttribute('aria-hidden'), 'false'); assert.equal(link.getAttribute('tabindex'), null);
	assert.equal(disabled.getAttribute('tabindex'), '-1'); assert.equal(root.style.pointerEvents, 'auto');
	setIsolated(root, false);
});
test('native isolation preserves an already inert background', () => {
	const root = new Element(); root.inert = true; setIsolated(root, true); setIsolated(root, false); assert.equal(root.inert, true);
});
test('explicit pointer preference survives visits without cookies and storage failure stays usable', () => {
	const values = new Map(); const storage = { getItem: key => values.get(key), setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) };
	const choice = systemPointerPreference(() => storage); assert.equal(choice.enabled, false);
	choice.set(true); assert.equal(systemPointerPreference(() => storage).enabled, true);
	choice.set(false); assert.equal(values.size, 0);
	const blocked = systemPointerPreference(() => { throw Error('storage denied'); }); blocked.set(true); assert.equal(blocked.enabled, true);
});
test('fallback gallery modal traps Tab, isolates siblings, closes with Escape and restores focus', () => {
	const body = new Element(), shell = new Element(), main = new Element(), dialog = new Element(), close = new Element(), opener = new Element();
	const doc = { body, activeElement: opener };
	for (const node of [body, shell, main, dialog, close, opener]) node.ownerDocument = doc;
	body.children = [shell]; shell.parentElement = body; shell.children = [main, dialog]; dialog.parentElement = shell; dialog.children = [close];
	body.style.overflow = 'auto'; const modal = createModal(dialog); modal.open(opener);
	assert.equal(dialog.hasAttribute('open'), true); assert.equal(doc.activeElement, close);
	assert.equal(main.getAttribute('aria-hidden'), 'true'); assert.equal(body.style.overflow, 'hidden');
	let prevented = false;
	dialog.dispatchEvent({ type: 'keydown', key: 'Tab', preventDefault() { prevented = true; } }); assert.equal(prevented, true); assert.equal(doc.activeElement, close);
	dialog.dispatchEvent({ type: 'keydown', key: 'Escape', preventDefault() {} });
	assert.equal(dialog.hasAttribute('open'), false); assert.equal(main.getAttribute('aria-hidden'), null);
	assert.equal(doc.activeElement, opener); assert.equal(body.style.overflow, 'auto');
});

test('native modal visits every link and wraps focus independently of browser Tab preferences', () => {
	const dialog = new Element(), close = new Element(), link = new Element(), last = new Element(), opener = new Element();
	const doc = { body: new Element(), activeElement: opener };
	for (const node of [dialog, close, link, last, opener]) node.ownerDocument = doc;
	dialog.children = [close, link, last];
	dialog.showModal = () => dialog.setAttribute('open', '');
	dialog.close = () => { dialog.removeAttribute('open'); dialog.dispatchEvent({ type: 'close' }); };
	const modal = createModal(dialog); modal.open(opener);
	const tab = shiftKey => dialog.dispatchEvent({ type: 'keydown', key: 'Tab', shiftKey, preventDefault() {} });
	tab(false); assert.equal(doc.activeElement, link);
	tab(false); assert.equal(doc.activeElement, last);
	tab(false); assert.equal(doc.activeElement, close);
	tab(true); assert.equal(doc.activeElement, last);
	modal.close(); assert.equal(doc.activeElement, opener);
});
