import test from 'node:test';
import assert from 'node:assert/strict';
import { load } from 'cheerio';
import { annotateVehicleLanguageParts } from '../src/config/vehicleLanguageParts.js';
import { validateVehicleHtml } from '../src/config/vehicleHtml.js';

test('foreign phrases gain language semantics without changing authored text or structure', () => {
	const source = '<p><strong>The WINNER!</strong><br>1. Platz &amp; &quot;Best of Show&quot; danach.</p><p><em>The Winner is:</em></p>';
	const html = annotateVehicleLanguageParts(validateVehicleHtml(source), 'de');
	const $ = load(html, {}, false);
	assert.equal($.root().text(), load(source, {}, false).root().text());
	assert.deepEqual($('[lang="en"]').map((_, el) => $(el).text()).get(), ['The WINNER!', 'Best of Show', 'The Winner is:']);
	assert.equal($('p').length, 2);
	assert.equal($('strong > span').length, 1);
	assert.equal($('br').length, 1);
	assert.equal(annotateVehicleLanguageParts(html, 'de'), html);
	assert.equal(annotateVehicleLanguageParts(source, 'en'), source);
});

test('language annotation does not bypass the authored HTML security boundary', () => {
	assert.throws(() => annotateVehicleLanguageParts(validateVehicleHtml('<p onclick="evil()">The WINNER!</p>'), 'de'));
	const source = '<p>&lt;img src=x onerror=evil()&gt; The WINNER!</p>';
	const html = annotateVehicleLanguageParts(validateVehicleHtml(source), 'de');
	assert.equal(load(html, {}, false)('img').length, 0);
	assert.equal(load(html, {}, false).root().text(), load(source, {}, false).root().text());
});
