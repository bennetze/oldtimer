import test from 'node:test';
import assert from 'node:assert/strict';
import { load } from 'cheerio';
import { validateVehicleRecord } from '../src/config/vehicleRecord.js';
import { validateVehicleHtml } from '../src/config/vehicleHtml.js';
import { localizeVehicle, vehicleLanguage } from '../src/config/vehicleLocale.js';
import { translateSiteText, localizeStructuredData } from '../src/i18n/authoredContent.js';
import { migrateVehicle } from '../scripts/migrate-vehicle-languages.mjs';

const fixture = () => ({ slug: 'test-car', category: 'aktuelle-projekte', title: 'Fahrzeug', titleEn: 'A personal English title', description: 'Beschreibung', descriptionEn: 'A description absent from the dictionary', cardImage: './card.jpg', leadImage: './card.jpg', cardImageAlt: 'Vorne', cardImageAltEn: 'Front', leadImageAlt: 'Seite', leadImageAltEn: 'Side', order: -5, dateModified: '2026-09-13', sourceUrl: 'https://example.com/', blocks: [{ type: 'copy', html: '<p>Text</p>', htmlEn: '<h2>Different structure</h2><p>English prose.</p>' }, { type: 'gallery', images: [{ src: './card.jpg', alt: 'Erstes', altEn: 'First', caption: 'Kontext', captionEn: 'Context' }, { src: './card.jpg', alt: 'Zweites', altEn: 'Second' }] }] });

test('complete English is mandatory, captions pair, and both HTML languages are validated', () => {
	validateVehicleRecord(fixture(), validateVehicleHtml);
	for (const field of ['titleEn', 'descriptionEn', 'cardImageAltEn', 'leadImageAltEn']) {
		const record = fixture(); delete record[field]; assert.throws(() => validateVehicleRecord(record));
	}
	for (const change of [r => r.blocks[0].htmlEn = '', r => r.blocks[0].htmlEn = '<p onclick="evil()">English</p>', r => delete r.blocks[1].images[0].altEn, r => delete r.blocks[1].images[0].captionEn, r => r.blocks[1].images[1].captionEn = 'Unpaired']) {
		const record = fixture(); change(record); assert.throws(() => validateVehicleRecord(record, validateVehicleHtml));
	}
});

test('locale selection retains shared references, occurrence metadata and original records', () => {
	const record = fixture(), before = structuredClone(record);
	assert.equal(localizeVehicle(record, 'de'), record);
	const english = localizeVehicle(record, 'en');
	assert.equal(english.title, record.titleEn);
	assert.equal(english.blocks[0].html, record.blocks[0].htmlEn);
	assert.deepEqual(english.blocks[1].images.map(image => image.alt), ['First', 'Second']);
	assert.equal(english.blocks[1].images[0].src, english.blocks[1].images[1].src);
	assert.deepEqual(record, before);
	for (const base of ['/', '/oldtimer/']) {
		assert.equal(vehicleLanguage(`${base}en/projekte/car/`, base), 'en');
		assert.equal(vehicleLanguage(`${base}projekte/car/`, base), 'de');
	}
});

test('authored DOM and metadata bypass dictionary collisions while shared labels translate', () => {
	const $ = load('<title data-authored>Über uns</title><meta name="description" data-authored content="Handwerk"><main><h1 data-authored>Über uns</h1><article data-authored data-search-value="Handwerk"><img alt="Über uns"><p>Brand new wording</p></article><a>Über uns</a></main>');
	translateSiteText($);
	assert.equal($('h1').text(), 'Über uns');
	assert.equal($('title').text(), 'Über uns');
	assert.equal($('meta').attr('content'), 'Handwerk');
	assert.equal($('img').attr('alt'), 'Über uns');
	assert.equal($('article').attr('data-search-value'), 'Handwerk');
	assert.equal($('a').text(), 'About us');
	const graph = { name: 'Über uns', description: 'Handwerk', __authored: ['name', 'description'], inLanguage: 'de-DE', url: '/projekte/car/', child: { name: 'Über uns' } };
	const en = localizeStructuredData(graph, true, value => `/en${value}`);
	assert.equal(en.name, 'Über uns'); assert.equal(en.description, 'Handwerk'); assert.equal(en.child.name, 'About us');
	assert.equal(en.inLanguage, 'en-GB'); assert.equal(en.url, '/en/projekte/car/');
	assert.ok(!JSON.stringify(en).includes('__authored'));
	assert.ok(!JSON.stringify(localizeStructuredData(graph, false, value => value)).includes('__authored'));
});

test('migration is idempotent and preserves authored English and shared/German data', () => {
	const record = fixture(); assert.deepEqual(migrateVehicle(record), record);
	const old = fixture(); delete old.titleEn; old.blocks[0] = { type: 'copy', html: '<p>Über uns</p>' };
	const migrated = migrateVehicle(old);
	assert.equal(migrated.blocks[0].htmlEn, '<p>About us</p>');
	assert.equal(migrated.blocks[0].html, old.blocks[0].html);
	assert.equal(migrated.descriptionEn, old.descriptionEn);
	assert.deepEqual(migrateVehicle(migrated), migrated);
	old.blocks[0].html = '<p>A missing reviewed German fragment</p>';
	assert.throws(() => migrateVehicle(old), /Missing reviewed/);
});
