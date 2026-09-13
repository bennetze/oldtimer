import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, globSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { load } from 'cheerio';
import { languagePath, preferredLanguage } from '../src/i18n/language.js';
import { normalize, translate } from '../src/i18n/translate.js';

const script = readFileSync(new URL('../src/scripts/language.js', import.meta.url), 'utf8');
const dictionary = JSON.parse(readFileSync(new URL('../src/i18n/en.json', import.meta.url)));
function visit(path, { languages = ['en-US'], language = '', base = '/', lang = path.startsWith(`${base}en/`) ? 'en' : 'de', notFound = false, links = [] } = {}) {
	const url = new URL(path, 'https://example.com');
	let redirected;
	const callbacks = [];
	const anchors = links.map(([href, chosen]) => ({
		href: new URL(href, url).href,
		dataset: chosen ? { language: chosen } : {},
		hasAttribute: (name) => name === 'data-language' && Boolean(chosen),
	}));
	const document = {
		documentElement: { lang, dataset: { siteBase: base, notFound: String(notFound) } },
		addEventListener: (_, callback) => callbacks.push(callback),
		querySelectorAll: () => anchors,
	};
	const context = { URL, document, navigator: { languages, language }, location: { href: url.href, origin: url.origin, replace: (value) => { redirected = new URL(value); } } };
	for (const name of ['localStorage', 'sessionStorage', 'indexedDB']) Object.defineProperty(context, name, { get() { throw new Error(`Unexpected ${name}`); } });
	Object.defineProperty(document, 'cookie', { get() { throw new Error('Unexpected cookie access'); }, set() { throw new Error('Unexpected cookie write'); } });
	runInNewContext(script, context);
	callbacks.forEach((callback) => callback());
	return { redirected, anchors };
}

test('first preferred browser language selects German only for German locales', () => {
	for (const language of ['de', 'de-DE', 'de-AT', 'de-CH', 'DE-de']) {
		assert.equal(preferredLanguage([language]), 'de');
		assert.equal(visit('/handwerk/', { languages: [language] }).redirected, undefined);
	}
	for (const language of ['en-GB', 'fr-FR', 'es', 'ja-JP', '']) {
		assert.equal(visit('/handwerk/', { languages: [language] }).redirected.pathname, '/en/handwerk/');
	}
	assert.equal(visit('/', { languages: ['fr-FR', 'de-DE'] }).redirected.pathname, '/en/');
	assert.equal(visit('/', { languages: [], language: 'de-CH' }).redirected, undefined);
});

test('explicit selection overrides detection and survives links, reload and fragments', () => {
	const { redirected, anchors } = visit('/handwerk/?lang=de&q=BMW#motorbau', {
		links: [['/projekte/'], ['#motorbau'], ['/en/handwerk/?lang=en', 'en'], ['/favicon.svg'], ['mailto:info@example.com'], ['https://other.example/']],
	});
	assert.equal(redirected, undefined);
	assert.equal(anchors[0].href, '/projekte/?lang=de');
	assert.equal(anchors[1].href, '/handwerk/?lang=de&q=BMW#motorbau');
	assert.equal(anchors[2].href, '/en/handwerk/?lang=en&q=BMW#motorbau');
	assert.equal(anchors[3].href, 'https://example.com/favicon.svg');
	assert.equal(anchors[4].href, 'mailto:info@example.com');
	assert.equal(anchors[5].href, 'https://other.example/');
	assert.equal(visit(anchors[0].href).redirected, undefined);
	assert.equal(visit('/en/handwerk/', { languages: ['de-DE'] }).redirected, undefined);
	assert.equal(visit('/en/handwerk/?lang=de#motorbau').redirected.href, 'https://example.com/handwerk/?lang=de#motorbau');
});

test('base path, invalid choices and English error pages never create redirect loops', () => {
	const redirected = visit('/oldtimer/projekte/?lang=invalid#cars', { base: '/oldtimer/' }).redirected;
	assert.equal(redirected.href, 'https://example.com/oldtimer/en/projekte/?lang=invalid#cars');
	assert.equal(visit(redirected.pathname + redirected.search, { base: '/oldtimer/' }).redirected, undefined);
	assert.equal(visit('/missing', { notFound: true }).redirected.pathname, '/en/404/');
	assert.equal(visit('/en/missing', { notFound: true, lang: 'de' }).redirected.pathname, '/en/404/');
	assert.equal(visit('/en/404/', { notFound: true, lang: 'en' }).redirected, undefined);
	assert.equal(languagePath('/oldtimer/en/404/', 'de', '/oldtimer/'), '/oldtimer/404.html');
	assert.equal(languagePath('/404.html', 'en'), '/en/404/');
});

test('every vehicle copy fragment has an explicit reviewed translation', () => {
	for (const file of globSync('src/pages/**/vehicle.json')) {
		const vehicle = JSON.parse(readFileSync(file, 'utf8'));
		for (const block of vehicle.blocks) {
			if (!block.html) continue;
			const $ = load(block.html);
			$('*').contents().each((_, node) => {
				if (node.type !== 'text') return;
				const text = normalize(node.data);
				if (!/[a-zäöüß]/i.test(text)) return;
				assert.ok(Object.hasOwn(dictionary, text), `${file}: add an English translation for ${text}`);
			});
		}
	}
});

test('generated labels, titles and alternatives are localized without changing model names', () => {
	assert.equal(translate('Abgeschlossene Projekte – Seite 2 | Die Oldtimermanufaktur'), 'Completed projects – Page 2 | Die Oldtimermanufaktur');
	assert.equal(translate('BMW Z1 Roadster, Baujahr 1990 – Aufnahme 2 der Fahrzeugdokumentation vergrößern'), 'BMW Z1 Roadster, year 1990 – photograph 2 in the vehicle record — enlarge');
	assert.equal(translate('  Über uns\n'), '  About us\n');
	assert.equal(`${translate('Wir bewahren')} ${translate('Geschichte')}`, 'WE PRESERVE HISTORY AND STORIES.');
});
