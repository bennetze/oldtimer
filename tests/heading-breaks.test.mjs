import test from 'node:test';
import assert from 'node:assert/strict';
import { load } from 'cheerio';
import { formatHeadingBreaks } from '../src/i18n/headingBreaks.js';

test('heading breaks preserve wording and add boundaries after role separators', () => {
	const $ = load('<h2>Karosseriebau/Stellmacherei</h2><p>Karosseriebau/Stellmacherei</p>');
	formatHeadingBreaks($);
	assert.equal($('h2').text(), 'Karosseriebau/Stellmacherei');
	assert.equal($('h2 wbr').length, 1);
	assert.equal($('p wbr').length, 0);
});

test('authored model numbers stay intact and year labels remain together in both languages', () => {
	const $ = load('<h1 data-authored>BMW 327/28 Sportcabriolet, Baujahr 1939</h1><h2 data-authored>BMW 327/28 Sport Cabriolet, year 1939</h2>');
	const original = $('h1,h2').map((_, node) => $(node).text()).get();
	formatHeadingBreaks($);
	assert.deepEqual($('h1,h2').map((_, node) => $(node).text()).get(), original);
	assert.deepEqual($('.heading-phrase').map((_, node) => $(node).text()).get(), ['Baujahr 1939', 'year 1939']);
	assert.equal($('wbr').length, 0);
	assert.equal($('[data-authored]').length, 2);
});

test('heading fragments keep text escaped rather than interpreting markup', () => {
	const $ = load('<h1></h1>');
	const title = '<img src=x onerror=alert(1)> Bodywork/Coachbuilding, year 1957';
	$('h1').text(title);
	formatHeadingBreaks($);
	assert.equal($('h1').text(), title);
	assert.equal($('img').length, 0);
});

test('long legal headings break at compound boundaries without changing vehicle text', () => {
	const title = 'Verbraucherstreitbeilegung/Universalschlichtungsstelle';
	const $ = load('<article class="legal-copy"><h2></h2></article><h1 data-authored></h1>');
	$('h1,h2').text(title);
	formatHeadingBreaks($);
	assert.equal($('h2').text(), 'Verbraucher\u00adstreitbeilegung/Universal\u00adschlichtungsstelle');
	assert.equal($('h1').text(), title);
});
