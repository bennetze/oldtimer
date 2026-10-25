// Check painted gradient layers on every generated route at desktop/mobile widths.
// Use SITE_URL for the preview origin/base and an external PLAYWRIGHT_MODULE.
import assert from 'node:assert/strict';
import { globSync } from 'node:fs';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { load } from 'cheerio';

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const origin = (process.env.SITE_URL || 'http://127.0.0.1:4335').replace(/\/$/, '');
const output = process.env.QA_OUTPUT || '/tmp/oldtimer-gradient-backgrounds';
await mkdir(output, { recursive: true });
const routes = [];
for (const file of globSync('dist/**/*.html').sort()) {
	const $ = load(await readFile(file, 'utf8'));
	if ($('meta[http-equiv="refresh"]').length) continue;
	const route = `/${file.slice('dist/'.length).replace(/index\.html$/, '')}`;
	const kind = $('main.gradient-palette').length ? 'gradient' : $('main.projects-page').length ? 'photos' : $('main.not-found').length ? 'error-photo' : 'home';
	assert.ok(kind !== 'home' || ['/', '/en/'].includes(route), `Unreviewed background: ${route}`);
	routes.push({ route, kind, language: $('html').attr('lang') });
}
const browser = await chromium.launch({ headless: true, channel: 'chrome' });
const results = [];
try {
	for (const width of [1440, 390]) {
		const page = await browser.newPage({ viewport: { width, height: 900 }, locale: 'de-DE', reducedMotion: 'reduce' });
		for (const { route, kind, language } of routes) {
			const response = await page.goto(`${origin}${route}?lang=${language}`, { waitUntil: 'domcontentloaded' });
			assert.equal(response.status(), 200, `${route}: response`);
			assert.equal(new URL(page.url()).pathname, new URL(`${origin}${route}`).pathname, `${route}: unexpected redirect`);
			assert.equal(await page.locator('html').getAttribute('lang'), language, `${route}: language`);
			if (kind === 'gradient') {
				const actual = await page.locator('main.gradient-palette').evaluate(main => {
					const s = getComputedStyle(main);
					const layers = [];
					for (const el of main.querySelectorAll('.editorial-opening, .story, .vehicle-grid, .vehicle-masthead, .vehicle-documentation, .legal-hero, .legal-body')) {
						const layer = getComputedStyle(el, '::before');
						if (layer.backgroundImage.includes('linear-gradient')) layers.push({ selector: el.className, image: layer.backgroundImage, content: layer.content, width: el.getBoundingClientRect().width, height: el.getBoundingClientRect().height });
					}
					return { editorial: main.classList.contains('editorial-page'), yellow: s.getPropertyValue('--gradient-cream').trim(), surface: s.backgroundColor, layers, overflow: document.documentElement.scrollWidth > innerWidth + 1 };
				});
				assert.equal(actual.yellow, '#efda76', `${route}: current yellow`);
				assert.equal(actual.surface, actual.editorial ? 'rgb(6, 32, 25)' : 'rgb(239, 218, 118)', `${route}: actual background color`);
				assert.ok(actual.layers.length, `${route}: missing painted gradient`);
				for (const layer of actual.layers) {
					assert.ok(layer.image.includes('oklab(0.88523') && layer.image.includes('oklab(0.220773'), `${route}: stale gradient on ${layer.selector}`);
					assert.ok(layer.width > 0 && layer.height > 0 && layer.content !== 'none', `${route}: hidden gradient layer`);
				}
				assert.equal(actual.overflow, false, `${route}: horizontal overflow at ${width}`);
				results.push({ route, width, language, kind, ...actual });
				const sampleVehicle = await page.locator('main.vehicle-detail').count() && !results.some(r => r.width === width && r.screenshot === 'vehicle');
				if (route === '/impressum/' || sampleVehicle) {
					const name = sampleVehicle ? 'vehicle' : 'impressum';
					await page.screenshot({ path: `${output}/${name}-${width}.png` });
					results.at(-1).screenshot = name;
				}
			} else {
				// Photo-only overview/error layouts have no yellow-to-green background to recolor.
				assert.equal(await page.locator('main.gradient-palette').count(), 0);
				results.push({ route, width, language, kind });
			}
		}
		console.log(`Verified actual backgrounds on ${routes.length} routes at ${width}px.`);
		await page.close();
	}
} finally {
	await browser.close();
	await writeFile(`${output}/results.json`, JSON.stringify(results, null, 2) + '\n');
}
console.log(JSON.stringify({ pages: routes.length, gradientPages: routes.filter(r => r.kind === 'gradient').length, checks: results.length, output }));
