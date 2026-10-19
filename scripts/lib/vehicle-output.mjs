import assert from 'node:assert/strict';
import { load } from 'cheerio';
import { annotateVehicleLanguageParts } from '../../src/config/vehicleLanguageParts.js';

const fragment = html => load(html, {}, false).html();

// Compare authored records with the rendered story, independently of the component.
export function verifyVehicleStory($, blocks, language, route) {
	const runs = [];
	for (const block of blocks) {
		if (block.type === 'gallery' && !block.textSide && runs.at(-1)?.type === 'gallery' && !runs.at(-1).textSide) runs.at(-1).images.push(...block.images);
		else runs.push({ ...block, ...(block.images ? { images: [...block.images] } : {}) });
	}
	const nodes = $('.vehicle-story').children('.story-copy, .story-contact, .story-gallery').toArray();
	assert.equal(nodes.length, runs.length, `${route}: story run count`);
	for (const [index, block] of runs.entries()) {
		const node = $(nodes[index]);
		const context = `${route}: story run ${index + 1}`;
		assert.ok(node.hasClass(block.type === 'gallery' ? 'story-gallery' : `story-${block.type}`), `${context}: type`);
		if (block.type !== 'gallery' || block.textSide) {
			const copy = block.type === 'copy' ? node : node.children(block.type === 'contact' ? 'div:first-child' : '.story-side-copy');
			assert.equal(copy.length, 1, `${context}: authored copy count`);
			assert.equal(fragment(copy.html()), fragment(annotateVehicleLanguageParts(block.html, language)), `${context}: ${language} copy`);
		}
		if (block.type !== 'gallery') continue;
		assert.equal(node.hasClass('story-gallery--text'), Boolean(block.textSide), `${context}: side text`);
		assert.equal(node.children('.story-side-copy').length, block.textSide ? 1 : 0, `${context}: side text count`);
		assert.equal(node.hasClass('story-gallery--text-right'), block.textSide === 'right', `${context}: text position`);
		assert.equal(node.hasClass('story-gallery--wide'), Boolean(block.textSide && block.images[0]?.size === 'large'), `${context}: wide side image`);
		assert.equal(node.hasClass('story-gallery--sized'), block.images.some(image => image.size && image.size !== 'small'), `${context}: sized image run`);
		assert.equal(node.hasClass('story-gallery--multiple'), block.images.length > 1, `${context}: multiple image run`);
		if (block.textSide) assert.equal(block.images.length, 1, `${context}: one side image`);
		const figures = node.children('.story-image').toArray();
		assert.equal(figures.length, block.images.length, `${context}: image count`);
		for (const [imageIndex, image] of block.images.entries()) {
			const figure = $(figures[imageIndex]);
			assert.ok(figure.hasClass(`story-image--${image.size || 'small'}`), `${context}: image size`);
			assert.equal(figure.find('img').attr('alt'), image.alt, `${context}: alternative`);
			assert.equal(figure.find('img').attr('src').split('/').at(-1), image.src.slice(2).replace(/\.[^.]+$/, '.webp'), `${context}: image order`);
			assert.equal(figure.find('figcaption').text(), image.caption || '', `${context}: caption`);
		}
	}
}
