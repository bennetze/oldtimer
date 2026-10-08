// Browser QA for every vehicle at desktop/mobile widths. Use an available
// Playwright installation through PLAYWRIGHT_MODULE; no runtime dependency is added.
import assert from 'node:assert/strict';
import { load } from 'cheerio';
import { globSync, readFileSync, mkdirSync, writeFileSync } from 'node:fs';
const { chromium, firefox, webkit } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const origin = process.env.VEHICLE_PREVIEW_URL || 'http://127.0.0.1:4321';
const screenshots = process.env.VEHICLE_SCREENSHOTS || '/tmp/oldtimer-vehicle-qa';
mkdirSync(screenshots, { recursive: true });
const records = globSync('src/pages/projekte/*/*/vehicle.json').map(file => JSON.parse(readFileSync(file, 'utf8')));
const samples = ['170-bmw-507-roadster', '185-bmw-503-coupe-baujahr-1959', '173-mercedes-280-sl-baujahr-1970', '181-bmw-502-baur-coupe-baujahr-1954', '73-emw-327-2-1954'];
const results = [];
const launchOptions = engine => ({ headless: true, ...(engine === chromium && process.env.CHROMIUM_EXECUTABLE ? { executablePath: process.env.CHROMIUM_EXECUTABLE } : {}) });
const browser = await chromium.launch(launchOptions(chromium));
try {
	for (const width of [1440, 900, 390]) {
		const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce', locale: 'de-DE' });
		const page = await context.newPage();
		for (const record of records) {
			const route = `/projekte/${record.category}/${record.slug}/`;
			await page.goto(origin + route, { waitUntil: 'load' });
			await page.evaluate(() => document.fonts.ready);
			// Load the entire documentation during QA, even photos far below the fold.
			// This also prevents lazy-loading blanks in scrolled screenshots.
			await page.locator('.vehicle-lead img, .vehicle-story img').evaluateAll(async images => {
				images.forEach(image => { image.loading = 'eager'; });
				await Promise.all(images.map(image => image.decode()));
			});
			const expectedBlocks = record.blocks.map(block => block.type === 'gallery' ? { type: 'gallery', photos: block.images.map(image => image.src.slice(2).replace(/\.[^.]+$/, '.webp')) } : { type: block.type, text: load(block.html).text().replace(/\s+/g, ' ').trim() });
			const actualBlocks = await page.locator('.vehicle-story > .story-copy, .vehicle-story > .story-contact, .vehicle-story > .story-gallery').evaluateAll(blocks => blocks.map(block => block.classList.contains('story-gallery') ? { type: 'gallery', photos: [...block.querySelectorAll('img')].map(image => image.getAttribute('src').split('/').at(-1)) } : { type: block.classList.contains('story-contact') ? 'contact' : 'copy', text: (block.classList.contains('story-contact') ? block.firstElementChild : block).textContent.replace(/\s+/g, ' ').trim() }));
			assert.deepEqual(actualBlocks.flatMap(block => block.type === 'gallery' ? block.photos.map(photo => ({ photo })) : [block]), expectedBlocks.flatMap(block => block.type === 'gallery' ? block.photos.map(photo => ({ photo })) : [block]), `${width} ${route}: editor photo/text sequence`);
			const metrics = await page.evaluate(() => {
				const story = document.querySelector('.vehicle-story');
				const images = [...story.querySelectorAll('.story-image img')];
				const bounds = [...story.querySelectorAll('.story-copy, .story-contact, .story-gallery, .story-image')].map(node => { const r = node.getBoundingClientRect(); return { left: r.left, right: r.right }; });
				const distant = [...story.children].some((node, index, nodes) => index && ((node.matches('.story-copy') && nodes[index - 1].matches('.story-gallery')) || (node.matches('.story-gallery') && nodes[index - 1].matches('.story-copy'))) && node.getBoundingClientRect().top - nodes[index - 1].getBoundingClientRect().bottom > 21);
				const vertical = [...story.children].every((node, index, nodes) => !index || node.getBoundingClientRect().top >= nodes[index - 1].getBoundingClientRect().bottom - 1);
				const columns = [...story.querySelectorAll('.story-gallery')].map(gallery => ({ count: gallery.children.length, actual: getComputedStyle(gallery).gridTemplateColumns.split(' ').length }));
				return { distant, vertical, columns, sourceHeader: document.querySelectorAll('.vehicle-lead img').length, overflow: document.documentElement.scrollWidth > innerWidth + 1, images: images.length, tooWide: images.some(image => image.getBoundingClientRect().width > 421), cropped: images.some(image => getComputedStyle(image).objectFit !== 'contain'), outside: bounds.some(r => r.left < -1 || r.right > innerWidth + 1) };
			});
			assert.equal(metrics.sourceHeader, !record.blocks.some(block => block.type === 'gallery' && block.images.some(image => image.src === record.leadImage)) ? 1 : 0, `${width} ${route}: missing original header`);
			assert.equal(metrics.images, record.blocks.flatMap(block => block.images ?? []).length, `${width} ${route}: incomplete images`);
			assert.equal(metrics.distant, false, `${width} ${route}: adjacent text/photo spacing`);
			assert.equal(metrics.vertical, true, `${width} ${route}: content must stack vertically`);
			assert.equal(metrics.overflow, false, `${width} ${route}: horizontal overflow`);
			assert.equal(metrics.outside, false, `${width} ${route}: content outside viewport`);
			assert.equal(metrics.tooWide, false, `${width} ${route}: oversized photograph`);
			assert.equal(metrics.cropped, false, `${width} ${route}: cropped photograph`);
			assert.ok(metrics.columns.every(columns => columns.actual === Math.min(columns.count, width >= 1100 ? 3 : width >= 760 ? 2 : 1)), `${width} ${route}: source photo/copy grouping`);
			results.push({ width, route, images: metrics.images });
			if (samples.includes(record.slug)) {
				await page.screenshot({ path: `${screenshots}/${record.slug}-${width}.png` });
				const mixed = page.locator('.story-gallery').first();
				if (await mixed.count()) { await mixed.scrollIntoViewIfNeeded(); await page.screenshot({ path: `${screenshots}/${record.slug}-${width}-group.png` }); }
			}
		}
		await context.close();
		console.log(`Checked ${records.length} complete vehicle pages at ${width}px.`);
	}
} finally { await browser.close(); }
// The lightbox code was retained, but its smaller/repositioned links need a
// keyboard/focus check in the three available engines on desktop and mobile.
for (const engine of [chromium, firefox, webkit]) {
	let instance;
	try { instance = await engine.launch(launchOptions(engine)); }
	catch (error) { console.log(`${engine.name()} unavailable: ${error.message.split('\n')[0]}`); continue; }
	try {
		for (const width of [1440, 390]) {
			const page = await instance.newPage({ viewport: { width, height: 900 }, reducedMotion: 'reduce', locale: 'de-DE' });
			await page.goto(origin + '/projekte/aktuelle-projekte/170-bmw-507-roadster/');
			const trigger = page.locator('[data-lightbox-trigger]').first();
			await trigger.focus(); await page.keyboard.press('Enter');
			await page.locator('[data-image-lightbox]').waitFor({ state: 'visible' });
			assert.equal(await page.evaluate(() => document.activeElement.matches('[data-lightbox-close]')), true);
			await page.keyboard.press('Tab');
			assert.equal(await page.evaluate(() => document.activeElement.closest('[data-image-lightbox]') !== null), true);
			await page.keyboard.press('Escape');
			assert.equal(await page.evaluate(() => document.activeElement.matches('[data-lightbox-trigger]')), true);
			await page.close();
		}
		console.log(`Lightbox keyboard and focus checks passed in ${engine.name()} at both widths.`);
	} finally { await instance.close(); }
}
writeFileSync(`${screenshots}/results.json`, JSON.stringify(results, null, 2));
