// Run against dev or preview. PLAYWRIGHT_MODULE can point to a bundled runtime.
// Example: SITE_URL=http://127.0.0.1:4321 node scripts/test-homepage-layout.mjs
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const engines = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const site = (process.env.SITE_URL || 'http://127.0.0.1:4321').replace(/\/$/, '');
const output = process.env.SCREENSHOT_DIR;
if (output) await mkdir(output, { recursive: true });

for (const name of (process.env.BROWSERS || 'chromium,firefox,webkit').split(',')) {
	const browser = await engines[name].launch({ headless: true, timeout: 15000 });
	try {
		for (const [width, height] of [[1440, 900], [390, 844], [320, 568], [844, 390]]) {
			const context = await browser.newContext({
				viewport: { width, height }, locale: 'de-DE', hasTouch: width < 900,
				isMobile: name !== 'firefox' && width < 900,
			});
			try {
				const page = await context.newPage();
				const errors = [];
				page.on('pageerror', error => errors.push(error.message));
				await page.addInitScript(() => {
					window.cspFailures = [];
					document.addEventListener('securitypolicyviolation', event => window.cspFailures.push(event.violatedDirective));
				});
				for (const language of ['de', 'en']) {
					await page.goto(`${site}/${language === 'en' ? 'en/' : ''}?lang=${language}`);
					await page.evaluate(() => document.fonts.ready);
					const panels = await page.locator('.media-panel').evaluateAll(elements => elements.map(panel => {
						const bounds = panel.getBoundingClientRect();
						return {
							id: panel.id, height: bounds.height, width: bounds.width,
							posterPosition: getComputedStyle(panel.querySelector('picture')).position,
							content: [...panel.querySelectorAll('h1, h2, .section-cta')].map(element => {
								const box = element.getBoundingClientRect();
								return { x: box.x - bounds.x, y: box.y - bounds.y, width: box.width, height: box.height };
							}),
						};
					}));
					assert.equal(panels.length, 4);
					for (const panel of panels) {
						const label = `${name} ${width}×${height} ${language} #${panel.id}`;
						assert.ok(Math.abs(panel.height - height) < 2, `${label}: section exceeds viewport`);
						assert.equal(panel.posterPosition, 'absolute', `${label}: poster affects layout`);
						for (const box of panel.content) {
							assert.ok(box.y >= 0 && box.y + box.height <= panel.height, `${label}: content clipped vertically`);
							assert.ok(box.x >= -1 && box.x + box.width <= panel.width + 1, `${label}: content clipped horizontally`);
							assert.ok(Math.abs(box.x + box.width / 2 - panel.width / 2) < 2, `${label}: content off center horizontally`);
						}
						const top = panel.content[0].y;
						const last = panel.content.at(-1);
						assert.ok((top + last.y + last.height) / 2 > panel.height / 2, `${label}: content should sit in the lower half`);
						assert.ok(last.y + last.height <= panel.height - 100, `${label}: content overlaps the bottom control area`);
						await page.locator(`#${panel.id}`).evaluate(element => element.scrollIntoView({ block: 'start' }));
						assert.ok(Math.abs(await page.locator(`#${panel.id}`).evaluate(element => element.getBoundingClientRect().top)) < 2, `${label}: section navigation leaves an offset`);
						// WebKit screenshot helpers inject styles blocked by the real CSP.
						if (output && name === 'chromium') await page.screenshot({ caret: 'initial', path: resolve(output, `${name}-${width}-${height}-${language}-${panel.id}.png`) });
					}
					assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
					await page.locator('.menu-toggle').click();
					await page.waitForFunction(() => document.querySelector('.menu-toggle').getAttribute('aria-expanded') === 'true');
					await page.keyboard.press('Shift+Tab');
					assert.ok(await page.evaluate(() => !!document.activeElement.closest('#site-menu')));
					await page.keyboard.press('Tab');
					assert.ok(await page.evaluate(() => !!document.activeElement.closest('#site-menu')));
					await page.keyboard.press('Escape');
					assert.ok(await page.evaluate(() => document.activeElement.classList.contains('menu-toggle')));
					if (width === 390) assert.equal(await page.locator('.cursor').evaluate(element => getComputedStyle(element).display), 'none');
					assert.deepEqual(await page.evaluate(() => window.cspFailures), []);
					console.log(`Passed ${name} ${width}×${height} ${language}`);
				}
				assert.deepEqual(errors, []);
			} finally {
				await context.close();
			}
		}
	} finally {
		await browser.close();
	}
}
