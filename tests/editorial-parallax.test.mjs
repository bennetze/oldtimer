import test from 'node:test';
import assert from 'node:assert/strict';
import { boundedParallaxOffset, orderedParallaxOffsets } from '../src/scripts/editorialParallax.js';

test('media stays inside its stage throughout entering, crossing and leaving the viewport', () => {
	for (const [top, bottom] of [[100, 700], [130, 550], [400, 900]]) {
		for (let request = -400; request <= 400; request += 10) {
			const offset = boundedParallaxOffset(request, 196, top, bottom, 100, 900);
			assert.ok(top + offset >= 100);
			assert.ok(bottom + offset <= 900);
			assert.ok(Math.abs(offset) <= 196);
		}
	}
});

test('full-height and oversized media do not gain a displacement outside their stage', () => {
	assert.equal(boundedParallaxOffset(-120, 170, 100, 900, 100, 900), 0);
	assert.equal(boundedParallaxOffset(120, 170, 100, 900, 100, 900), 0);
	assert.equal(boundedParallaxOffset(-120, 170, 100, 1000, 100, 900), 0);
});


test('headings and content animate independently while retaining reading order and clearance', () => {
	for (const scale of [1, 0.18]) {
		const observed = new Set();
		for (let distance = -3000; distance <= 3000; distance += 20) {
			const blocks = [
				{ top: 100, bottom: 170, range: 48 * scale, requested: distance * 0.08 * scale },
				{ top: 242, bottom: 1200, range: 120 * scale, requested: distance * 0.18 * scale },
				{ top: 1300, bottom: 1400, range: 120 * scale, requested: distance * 0.18 * scale },
			];
			const offsets = orderedParallaxOffsets(blocks, 100, 1550);
			observed.add(offsets[1]);
			blocks.forEach((block, index) => {
				assert.ok(Math.abs(offsets[index]) <= block.range + 0.001);
				assert.ok(block.top + offsets[index] >= 100);
				assert.ok(block.bottom + offsets[index] <= 1550);
				if (index) assert.ok(block.top + offsets[index] >= blocks[index - 1].bottom + offsets[index - 1] + 24 - 0.001);
			});
		}
		assert.ok(observed.size > 10, 'motion must remain visible rather than being disabled');
	}
});

test('short sections and tight natural gaps cannot force neighbouring animated blocks to cross', () => {
	for (const headingRequest of [-100, 100]) for (const contentRequest of [-200, 200]) {
		const offsets = orderedParallaxOffsets([
			{ top: 0, bottom: 80, range: 48, requested: headingRequest },
			{ top: 90, bottom: 400, range: 120, requested: contentRequest },
		], 0, 400);
		assert.ok(80 + offsets[0] + 10 <= 90 + offsets[1]);
		assert.equal(offsets[1], 0);
	}
});
