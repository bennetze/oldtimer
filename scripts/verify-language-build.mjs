import assert from 'node:assert/strict';
import { globSync, readFileSync } from 'node:fs';
import { load } from 'cheerio';
import { normalize, translate } from '../src/i18n/translate.js';

const dictionary = JSON.parse(readFileSync(new URL('../src/i18n/en.json', import.meta.url)));
const invariant = new Set(['DIE OLDTIMERMANUFAKTUR', 'Die Oldtimermanufaktur', 'DE', 'EN', 'Deutsch', 'English', 'Sitemap', 'llms.txt', 'Social Media', 'Mario Schrank', 'Anton Schrank', 'Fax', 'info@oldtimermanufaktur.de', '36452 Kaltennordheim-Fischbach/Rhön', 'N']);
const missing = new Set();
let count = 0;
for (const file of globSync('dist/**/*.html')) {
	if (file.startsWith('dist/en/')) continue;
	const de = load(readFileSync(file, 'utf8'));
	// Redirect stubs are deliberately not translated or indexed.
	if (de('meta[http-equiv="refresh"]').length) continue;
	const englishFile = file === 'dist/404.html' ? 'dist/en/404/index.html' : file.replace('dist/', 'dist/en/');
	const en = load(readFileSync(englishFile, 'utf8'));
	assert.equal(en('html').attr('lang'), 'en', englishFile);
	assert.equal(de('html').attr('lang'), 'de', file);
	assert.equal(en('[data-language="en"][aria-current="true"]').length, 1);
	assert.equal(de('[data-language="de"][aria-current="true"]').length, 1);
	assert.equal(en('meta[property="og:locale"]').attr('content'), 'en_GB');
	assert.equal(en('meta[property="og:description"]').attr('content'), en('meta[name="description"]').attr('content'));
	if (!en('meta[name="robots"]').attr('content').includes('noindex')) {
		const canonical = en('link[rel="canonical"]').attr('href');
		assert.equal(en('link[hreflang="en"]').attr('href'), canonical);
		assert.equal(en('link[hreflang="de"]').attr('href'), de('link[rel="canonical"]').attr('href'));
		const graph = JSON.parse(en('script[type="application/ld+json"]').text())['@graph'];
		const page = graph.find(node => node['@id'] === `${canonical}#webpage`);
		assert.equal(page.inLanguage, 'en-GB');
		assert.equal(page.description, en('meta[name="description"]').attr('content'));
	}
	const checkText = (value) => {
		const text = normalize(value || '');
		if (!/[a-zäöüß]/i.test(text) || text.startsWith('©') || invariant.has(text)) return;
		if (text.endsWith(' | Die Oldtimermanufaktur') && Object.hasOwn(dictionary, text.replace(' | Die Oldtimermanufaktur', ''))) return;
		if (!Object.hasOwn(dictionary, text) && translate(text) === text) missing.add(text);
	};
	de('script,style').remove();
	de('*').contents().each((_, node) => { if (node.type === 'text') checkText(node.data); });
	de('*').each((_, node) => {
		for (const attribute of ['alt', 'aria-label', 'placeholder', 'title', 'data-lightbox-alt']) checkText(de(node).attr(attribute));
	});
	for (const selector of ['meta[name="description"]', 'meta[property="og:image:alt"]']) checkText(de(selector).attr('content'));
	// Catch cross-record dictionary collisions that would turn a title into prose.
	assert.ok(en('h1').text().length < de('h1').text().length * 2 + 30, `${englishFile}: expanded title`);
	assert.ok(!en('#hero-title').text().includes('HISTORYN'));
	count++;
}
assert.deepEqual([...missing], [], 'Missing English translations. Add entries to src/i18n/en.json.');
console.log(`Verified ${count} language pairs: translation coverage, language links and localized metadata.`);
