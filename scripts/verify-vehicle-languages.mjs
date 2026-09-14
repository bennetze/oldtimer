import assert from 'node:assert/strict';
import { globSync, readFileSync } from 'node:fs';
import { load } from 'cheerio';
import { localizeVehicle } from '../src/config/vehicleLocale.js';
import { limitVehicleGalleryBlocks, GITHUB_PAGES_GALLERY_IMAGE_LIMIT } from '../src/config/vehicleGalleryPolicy.js';

const fragment = html => load(html, {}, false).html();
let count = 0;
for (const file of globSync('src/pages/projekte/*/*/vehicle.json')) {
	const record = JSON.parse(readFileSync(file, 'utf8'));
	for (const language of ['de', 'en']) {
		const route = `${language === 'en' ? 'en/' : ''}projekte/${record.category}/${record.slug}/`;
		const $ = load(readFileSync(`dist/${route}index.html`, 'utf8'));
		const content = localizeVehicle(record, language);
		const base = $('html').attr('data-site-base');
		const blocks = limitVehicleGalleryBlocks(content.blocks, base === '/' ? Infinity : GITHUB_PAGES_GALLERY_IMAGE_LIMIT);
		assert.equal($('h1').text(), content.title, route);
		assert.equal($('title').text(), `${content.title} | Die Oldtimermanufaktur`, route);
		assert.equal($('meta[name="description"]').attr('content'), content.description, route);
		assert.equal($('meta[property="og:image:alt"]').attr('content'), content.leadImageAlt, route);
		assert.equal($('.vehicle-lead img').attr('alt'), content.leadImageAlt, route);
		const copy = $('.story-copy, .story-contact > div:first-child').toArray();
		const expectedCopy = blocks.filter(block => block.type !== 'gallery');
		assert.equal(copy.length, expectedCopy.length, route);
		copy.forEach((node, index) => assert.equal(fragment($(node).html()), fragment(expectedCopy[index].html), `${route}: block ${index}`));
		const images = blocks.filter(block => block.type === 'gallery').flatMap(block => block.images);
		assert.deepEqual($('.story-image img').toArray().map(node => $(node).attr('alt')), images.map(image => image.alt), route);
		assert.deepEqual($('.story-image figcaption').toArray().map(node => $(node).text()), images.filter(image => image.caption).map(image => image.caption), route);
		const json = $('script[type="application/ld+json"]').text();
		assert.ok(!json.includes('__authored'), route);
		if (json) {
			const graph = JSON.parse(json)['@graph'];
			const vehicle = graph.find(node => node['@type'] === 'Vehicle');
			assert.equal(vehicle.name, content.title); assert.equal(vehicle.description, content.description);
			const page = graph.find(node => node['@type'] === 'ItemPage');
			assert.equal(page.description, content.description);
		}
		const archive = load(readFileSync(`dist/${language === 'en' ? 'en/' : ''}projekte/${record.category}/index.html`, 'utf8'));
		const card = archive(`a[href*="/projekte/${record.category}/${record.slug}/"]`).closest('.vehicle-card');
		assert.equal(card.find('h2').text(), content.title, route);
		assert.equal(card.attr('data-search-value'), content.title, route);
		assert.equal(card.find('img').attr('alt'), content.cardImageAlt, route);
		count++;
	}
}
console.log(`Verified ${count} vehicle language pages against their authored records, including archive cards and metadata.`);
