// Run against dev or built preview; PLAYWRIGHT_MODULE may select the bundled runtime.
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
const output = process.env.SCREENSHOT_DIR;
if (output) await mkdir(output, { recursive: true });
const engines = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const site = (process.env.SITE_URL || 'http://127.0.0.1:4321').replace(/\/$/, '');
for (const name of (process.env.BROWSERS || 'chromium,firefox,webkit').split(',')) {
	const browser = await engines[name].launch({ headless: true, ...(process.env.BROWSER_CHANNEL ? { channel: process.env.BROWSER_CHANNEL } : {}) });
	try {
		for (const width of [1440, 390]) {
			const page = await browser.newPage({ viewport: { width, height: 900 }, locale: 'de-DE' });
			const errors = [];
			page.on('pageerror', error => errors.push(error.message));
			await page.addInitScript(() => {
				window.cspFailures = [];
				document.addEventListener('securitypolicyviolation', event => window.cspFailures.push(event.violatedDirective));
			});
			await page.goto(`${site}/`);
			await page.locator('.menu-toggle').click();
			await page.locator('.menu-nav__link').nth(1).waitFor({ state: 'visible' });
			await page.waitForTimeout(800);
			// A modifier must leave the dialog open and preserve native link handling.
			assert.deepEqual(await page.locator('.menu-nav__link').nth(1).evaluate(link => {
				let intercepted;
				link.addEventListener('click', event => { intercepted = event.defaultPrevented; event.preventDefault(); }, { once: true });
				link.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, ctrlKey: true }));
				return { intercepted, hidden: document.querySelector('#site-menu').getAttribute('aria-hidden') };
			}), { intercepted: false, hidden: 'false' });
			if (output) await page.screenshot({ path: resolve(output, `${name}-${width}-menu.png`) });
			assert.equal(await page.locator('.menu-panel').evaluate(el => {
				el.closest('.menu-overlay').classList.add('is-navigating');
				const duration = getComputedStyle(el).transitionDuration;
				el.closest('.menu-overlay').classList.remove('is-navigating');
				return duration;
			}), '0.18s');
			await page.locator('.menu-nav__link').nth(1).focus();
			const destination = page.waitForURL(`${site}/handwerk/`);
			const started = Date.now();
			await page.keyboard.press('Enter');
			assert.equal(new URL(page.url()).pathname.endsWith('/handwerk/'), false, 'navigation interrupted menu exit');
			assert.equal(await page.locator('#site-menu').getAttribute('aria-hidden'), 'true');
			await destination;
			assert.ok(Date.now() - started >= 140, 'menu exit was skipped');
			assert.deepEqual(await page.evaluate(() => window.cspFailures), []);
			if (output) {
				await page.waitForTimeout(400);
				await page.screenshot({ path: resolve(output, `${name}-${width}-destination.png`) });
			}
			await page.goBack();
			assert.equal(await page.locator('html').evaluate(el => el.classList.contains('page-is-leaving')), false);
			assert.equal(await page.locator('main').evaluate(el => el.inert), false);
			await page.locator('.menu-toggle').click();
			await page.keyboard.press('Escape');
			assert.equal(await page.locator('.menu-toggle').evaluate(el => el === document.activeElement), true);
			await page.goto(`${site}/ueber-uns/`);
			await page.locator('.menu-toggle').click();
			await page.waitForTimeout(800);
			await page.locator('.menu-nav__link').last().click();
			await page.waitForURL(`${site}/ueber-uns/#kontakt`);
			assert.equal(await page.locator('html').evaluate(el => el.classList.contains('page-is-leaving')), false);
			assert.equal(await page.evaluate(() => document.activeElement.id), 'kontakt');
			await page.emulateMedia({ reducedMotion: 'reduce' });
			await page.locator('.menu-toggle').click();
			await page.locator('.menu-nav__link').nth(3).click();
			await page.waitForURL(`${site}/projekte/`);
			assert.equal(await page.locator('body').evaluate(el => getComputedStyle(el, '::after').animationName), 'none');
			assert.deepEqual(await page.evaluate(() => window.cspFailures), []);
			assert.deepEqual(errors, []);
			console.log(`Passed menu navigation: ${name} ${width}px`);
			await page.close();
		}
	} finally { await browser.close(); }
}
