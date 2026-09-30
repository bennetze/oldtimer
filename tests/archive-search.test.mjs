import test from 'node:test';
import assert from 'node:assert/strict';
import { createCardFilter } from '../src/scripts/archiveSearch.js';
function card(title, visible = true) {
	return {
		dataset: { searchValue: title, defaultVisible: String(visible) }, hidden: !visible, inert: false, animations: [], calls: 0,
		getAnimations() { return this.animations; },
		animate() {
			this.calls++;
			let resolve, reject;
			const animation = { finished: new Promise((yes, no) => { resolve = yes; reject = no; }), finish: () => resolve(), cancel: () => reject(new Error('cancelled')) };
			this.animations = [animation];
			return animation;
		},
	};
}
function preference() { return { matches: false, addEventListener(_, callback) { this.change = callback; } }; }
test('search changes only affected cards and cancelled exits cannot hide restored results', async () => {
	const cards = [card('BMW Coupé'), card('Mercedes', false)];
	const reduced = preference(); const filter = createCardFilter(cards, reduced);
	filter(''); assert.equal(cards[0].calls, 0); assert.equal(cards[1].calls, 0);
	assert.deepEqual(filter('mercedes'), { searching: true, count: 1 });
	assert.equal(cards[0].inert, true); assert.equal(cards[0].hidden, false);
	const staleExit = cards[0].animations[0];
	assert.deepEqual(filter('BMW coupe'), { searching: true, count: 1 });
	staleExit.finish(); await Promise.resolve();
	assert.equal(cards[0].hidden, false); assert.equal(cards[0].inert, false);
	const calls = cards[0].calls;
	filter('BMW'); assert.equal(cards[0].calls, calls);
	assert.equal(filter('no-match').count, 0);
	reduced.matches = true; reduced.change();
	assert.equal(cards[0].hidden, true); assert.equal(cards[1].hidden, true);
	filter(''); assert.equal(cards[0].hidden, false); assert.equal(cards[1].hidden, true);
	await Promise.resolve();
});

test('missing animation APIs and native inert fall back to immediate, nonfocusable results', () => {
	const item = card('BMW'); delete item.getAnimations; delete item.animate; delete item.inert;
	const filter = createCardFilter([item], { matches: false, addListener() {} });
	assert.equal(filter('Mercedes').count, 0); assert.equal(item.hidden, true);
	filter(''); assert.equal(item.hidden, false);
});


test('deferred cards materialize once for a restored query and clear back to the current page', () => {
	const initial = card('BMW'); const deferred = card('Mercedes', false); let loads = 0;
	const filter = createCardFilter([initial], {matches:true,addEventListener(){}}, () => { loads++; return [deferred]; });
	assert.equal(filter('').count, 1); assert.equal(loads, 0);
	assert.equal(filter('mercedes').count, 1); assert.equal(loads, 1); assert.equal(deferred.hidden, false);
	assert.equal(filter('Mercedes').count, 1); assert.equal(loads, 1);
	filter(''); assert.equal(initial.hidden, false); assert.equal(deferred.hidden, true);
});
