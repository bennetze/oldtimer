import test from 'node:test';
import assert from 'node:assert/strict';
import { load } from 'cheerio';
import { formatLegalLinkBreaks } from '../src/i18n/linkBreaks.js';

test('literal legal URLs and email addresses wrap at punctuation without changing text or targets', () => {
	const urls = ['info@oldtimermanufaktur.de', 'https://www.instagram.com/oldtimermanufaktur_schrank/', 'https://www.facebook.com/profile.php?id=123&lang=de'];
	const $ = load('<article class="legal-copy"></article>');
	for (const url of urls) $('.legal-copy').append($('<a></a>').attr('href', url).text(url));
	formatLegalLinkBreaks($);
	assert.deepEqual($('a').map((_, node) => $(node).text()).get(), urls);
	assert.deepEqual($('a').map((_, node) => $(node).attr('href')).get(), urls);
	assert.equal($('[data-link-breaks]').length, 3);
	assert.ok($('wbr').length > 3);
	assert.equal($('a').eq(1).find('span').first().text(), 'https://');
});

test('descriptive links and authored vehicle content remain intact', () => {
	const $ = load('<article class="legal-copy"><a href="https://example.com">Kontakt zur Datenschutzaufsicht in Thüringen</a></article><article data-authored><a href="mailto:test@example.com">test@example.com</a></article>');
	const before = $.html();
	formatLegalLinkBreaks($);
	assert.equal($.html(), before);
});

test('URL-like text remains escaped', () => {
	const $ = load('<article class="legal-copy"><a></a></article>');
	const text = 'https://example.com/<img src=x onerror=alert(1)>';
	$('a').text(text);
	formatLegalLinkBreaks($);
	assert.equal($('a').text(), text);
	assert.equal($('img').length, 0);
});
