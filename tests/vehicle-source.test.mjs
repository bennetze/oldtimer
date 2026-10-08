import test from 'node:test';
import assert from 'node:assert/strict';
import { load } from 'cheerio';
import { extractVehicleSource } from '../scripts/lib/vehicle-source.mjs';
import { GITHUB_PAGES_GALLERY_IMAGE_LIMIT, limitVehicleGalleryBlocks } from '../src/config/vehicleGalleryPolicy.js';

test('source extraction retains copy and photos inside clear:both wrappers and paragraph boundaries', () => {
	const { blocks, groups } = extractVehicleSource(load(`<div class="itemFullText"><p>Before</p><div style="clear: both"><p><img src="/one.jpg">Caption</p><p>Restored paragraph<img src="/two.jpg"></p></div><p>After</p></div>`));
	assert.deepEqual(blocks.map(block => block.urls ?? load(block.html).text()), ['Before', ['https://www.oldtimermanufaktur.de/one.jpg'], 'Caption', 'Restored paragraph', ['https://www.oldtimermanufaktur.de/two.jpg'], 'After']);
	assert.deepEqual(groups, [[0], [1, 2], [3, 4], [5]]);
});

test('source extraction preserves repeated gallery photos in their original positions', () => {
	const { blocks } = extractVehicleSource(load(`<div class="itemFullText"><ul class="sigFreeContainer"><li><a class="sigFreeLink" href="/full.jpg"><img src="/thumbnail.jpg"></a></li></ul><p>Between</p><p><img src="/full.jpg"></p></div>`));
	assert.deepEqual(blocks.map(block => block.urls ?? load(block.html).text()), [['https://www.oldtimermanufaktur.de/full.jpg'], 'Between', ['https://www.oldtimermanufaktur.de/full.jpg']]);
});

test('preview galleries keep all photos and following descriptions', () => {
	const blocks = [{ type: 'gallery', images: Array.from({ length: 12 }, (_, index) => ({ src: `./${index}.jpg` })) }, { type: 'copy', html: '<p>The final photo</p>' }];
	assert.equal(limitVehicleGalleryBlocks(blocks, GITHUB_PAGES_GALLERY_IMAGE_LIMIT), blocks);
});

test('direct photos inside structural clearing containers are retained independently of paragraphs', () => {
	const { blocks } = extractVehicleSource(load('<div class="itemFullText"><div style="clear:both"><img src="/direct.jpg"><img src="/second.jpg"><p>Their caption</p></div></div>'));
	assert.deepEqual(blocks.flatMap(block => block.urls ?? []), ['https://www.oldtimermanufaktur.de/direct.jpg', 'https://www.oldtimermanufaktur.de/second.jpg']);
});

