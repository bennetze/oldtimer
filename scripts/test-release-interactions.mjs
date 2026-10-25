// Runs on the built preview with an external optional Playwright runtime.
import { mkdir, writeFile } from 'node:fs/promises';
const engines = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const name = process.env.BROWSER || 'chromium',
	base = process.env.SITE_URL || 'http://127.0.0.1:4330';
const out = process.env.QA_OUTPUT || `.codex-qa/browser-2026-10-25/${name}-interactions`;
await mkdir(out, { recursive: true });
const results = [];
const check = (label, pass, detail) => {
	results.push({ label, pass: !!pass, detail });
	if (!pass) console.log('FAIL', label, JSON.stringify(detail));
};
const browser = await engines[name].launch({
	headless: name !== 'firefox',
	...(name === 'chromium' ? { channel: 'chrome' } : {}),
});
try {
	for (const [width, height] of [
		[1440, 900],
		[390, 844],
		[320, 568],
		[844, 390],
	])
		for (const lang of ['de', 'en']) {
			const c = await browser.newContext({
				viewport: { width, height },
				locale: lang === 'de' ? 'de-DE' : 'en-GB',
				hasTouch: width < 900,
				isMobile: name !== 'firefox' && width < 900,
			});
			const p = await c.newPage();
			p.setDefaultTimeout(10000);
			const label = `${name} ${width}x${height} ${lang}`,
				prefix = lang === 'en' ? '/en' : '';
			const url = (path) => `${base}${prefix}${path}?lang=${lang}`;
			const errors = [];
			p.on('pageerror', (e) => errors.push(e.message));
			try {
				await c.addInitScript(() => {
					window.qaCsp = [];
					document.addEventListener('securitypolicyviolation', (e) =>
						window.qaCsp.push(e.violatedDirective),
					);
				});
				await p.goto(url('/projekte/fahrzeugangebote/'));
				const input = p.locator('[data-vehicle-search-input]');
				await input.fill('zzzxq-no-match');
				await p.waitForFunction(() =>
					[...document.querySelectorAll('[data-vehicle-card]')].every(
						(el) => !el.getAnimations().some((a) => a.playState === 'running'),
					),
				);
				check(
					label + ' empty search',
					(await p.locator('[data-vehicle-card]:visible').count()) === 0 &&
						(await p.locator('[data-vehicle-search-empty]').isVisible()),
				);
				await input.fill('EMW 327');
				await p.waitForFunction(() =>
					[...document.querySelectorAll('[data-vehicle-card]')].every(
						(el) => !el.getAnimations().some((a) => a.playState === 'running'),
					),
				);
				const count = await p.locator('[data-vehicle-card]:visible').count();
				check(label + ' search results', count > 0, count);
				check(label + ' query stays local', !p.url().includes('EMW'));
				await input.evaluate((el) => {
					el.form.addEventListener('submit', (e) => e.preventDefault());
				});
				await p.keyboard.press('Enter');
				check(label + ' Enter keeps filter', (await input.inputValue()) === 'EMW 327');
				await p.locator('[data-vehicle-card]:visible a').first().click();
				await p.waitForURL((u) => !/\/fahrzeugangebote\/$/.test(u.pathname));
				const trigger = p.locator('[data-lightbox-trigger]').first();
				await trigger.focus();
				await p.keyboard.press('Enter');
				await p.locator('[data-image-lightbox]').waitFor({ state: 'visible' });
				check(
					label + ' lightbox focus',
					await p.evaluate(() => document.activeElement.matches('[data-lightbox-close]')),
				);
				await p.keyboard.press('Tab');
				check(
					label + ' lightbox trap',
					await p.evaluate(() => !!document.activeElement.closest('[data-image-lightbox]')),
				);
				await p.keyboard.press('Escape');
				check(
					label + ' lightbox return',
					await trigger.evaluate((el) => el === document.activeElement),
				);
				// Simulate browsers that do not restore form controls on Back.
				await p.goBack();
				await p.waitForFunction(
					() => document.querySelector('[data-vehicle-search-input]')?.value === 'EMW 327',
				);
				await p.waitForFunction(() =>
					[...document.querySelectorAll('[data-vehicle-card]')].every(
						(el) => !el.getAnimations().some((a) => a.playState === 'running'),
					),
				);
				check(
					label + ' Back restores search',
					(await input.inputValue()) === 'EMW 327' &&
						(await p.locator('[data-vehicle-card]:visible').count()) === count,
				);
				await input.evaluate((el) => {
					el.value = '';
					window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true }));
				});
				check(
					label + ' history restores without browser form state',
					(await input.inputValue()) === 'EMW 327',
				);
				await p.locator('[data-vehicle-search-clear]').click();
				await p.waitForFunction(() =>
					[...document.querySelectorAll('[data-vehicle-card]')].every(
						(el) => !el.getAnimations().some((a) => a.playState === 'running'),
					),
				);
				check(
					label + ' clear restores offers',
					(await input.inputValue()) === '' &&
						(await p.locator('[data-vehicle-card]:visible').count()) === 10,
				);
				if (width <= 760) {
					await p.locator('.category-switcher__toggle').click();
					check(
						label + ' category opens',
						(await p.locator('.category-switcher__toggle').getAttribute('aria-expanded')) ===
							'true',
					);
					await p.keyboard.press('Escape');
					await p.waitForFunction(
						() =>
							document.querySelector('.category-switcher__toggle').getAttribute('aria-expanded') ===
							'false',
					);
					check(
						label + ' category closes and returns focus',
						await p
							.locator('.category-switcher__toggle')
							.evaluate(
								(el) =>
									el === document.activeElement && el.getAttribute('aria-expanded') === 'false',
							),
					);
				}
				const response = await p.goto(url('/missing-release-test/'));
				check(label + ' unknown route', response.status() === 404);
				check(
					label + ' 404 noindex',
					(await p.locator('meta[name="robots"]').getAttribute('content')).includes('noindex'),
				);
				await p.locator('.not-found__link').click();
				check(label + ' 404 recovery', new URL(p.url()).pathname === prefix + '/');
				await p.goto(url('/'));
				const panel = p.locator('[data-motion-panel]').first(),
					video = panel.locator('video'),
					toggle = panel.locator('[data-motion-toggle]');
				await p.waitForFunction(
					() => {
						const el = document.querySelector('[data-motion-panel]');
						return (
							el.classList.contains('is-video-ready') || el.classList.contains('is-motion-fallback')
						);
					},
					{},
					{ timeout: 15000 },
				);
				const playing = await video.evaluate((v) => !v.paused && v.muted && v.loop);
				check(label + ' normal motion', playing, await panel.getAttribute('class'));
				await toggle.click();
				check(label + ' pauses motion', await video.evaluate((v) => v.paused));
				await toggle.click();
				await p.waitForFunction(() => !document.querySelector('[data-motion-panel] video').paused);
				check(label + ' resumes motion', true);
				for (let index = 1; index < 4; index++) {
					const next = p.locator('[data-motion-panel]').nth(index);
					await next.scrollIntoViewIfNeeded();
					await p.waitForFunction((i) => {
						const panel = document.querySelectorAll('[data-motion-panel]')[i];
						return (
							!panel.querySelector('video').paused && panel.classList.contains('is-video-ready')
						);
					}, index);
					check(
						label + ' section ' + index + ' only visible video plays',
						await p
							.locator('[data-motion-panel] video')
							.evaluateAll(
								(videos, i) => videos.every((video, j) => (j === i ? !video.paused : video.paused)),
								index,
							),
					);
					// Locator auto-scrolling can move the last short-screen section
					// below the playback visibility threshold. Click the visible control
					// directly, as a visitor does, without moving the page first.
					const nextToggle = next.locator('[data-motion-toggle]');
					const bounds = await nextToggle.boundingBox();
					if (!bounds || bounds.y < 0 || bounds.y + bounds.height > height + 1) {
						throw new Error('Motion control is outside the visible viewport');
					}
					await p.mouse.click(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
					check(
						label + ' section ' + index + ' pause',
						await next.locator('video').evaluate((v) => v.paused),
					);
					await nextToggle.evaluate((el) => el.focus({ preventScroll: true }));
					await p.keyboard.press('Enter');
					await p.waitForFunction(
						(i) => !document.querySelectorAll('[data-motion-panel] video')[i].paused,
						index,
					);
					check(label + ' section ' + index + ' resume', true);
				}
				check(
					label + ' no eager fallback',
					await p.evaluate(() => {
						const urls = [...document.querySelectorAll('[data-motion-image]')]
							.flatMap((el) => [el.dataset.motionAvif, el.dataset.motionWebp])
							.filter(Boolean)
							.map((url) => new URL(url, location.href).href);
						return (
							!document.querySelector('[data-motion-generated-source]') &&
							!performance.getEntriesByType('resource').some((entry) => urls.includes(entry.name))
						);
					}),
				);
				await p.emulateMedia({ reducedMotion: 'reduce' });
				await p.waitForFunction(() =>
					[...document.querySelectorAll('[data-motion-panel] video')].every((v) => v.paused),
				);
				check(label + ' live reduced motion pauses', true);
				await toggle.click();
				await p.waitForFunction(() => !document.querySelector('[data-motion-panel] video').paused);
				check(label + ' reduced motion manual play', true);
				await p.emulateMedia({ reducedMotion: 'reduce' });
				await p.goto(url('/'));
				check(
					label + ' fresh reduced motion stays still',
					await p
						.locator('[data-motion-panel] video')
						.evaluateAll((videos) => videos.every((v) => v.paused && !v.currentSrc)),
				);
				await p.emulateMedia({ reducedMotion: 'no-preference' });
				const blocked = await c.newPage();
				await blocked.addInitScript(() => {
					HTMLMediaElement.prototype.play = () =>
						Promise.reject(new DOMException('QA autoplay blocked', 'NotAllowedError'));
				});
				await blocked.goto(url('/'));
				await blocked.waitForFunction(() =>
					document.querySelector('[data-motion-panel]').classList.contains('is-motion-fallback'),
				);
				check(
					label + ' blocked autoplay fallback',
					await blocked
						.locator('[data-motion-panel] video')
						.first()
						.evaluate((v) => v.paused),
				);
				await blocked.locator('[data-motion-toggle]').first().click();
				check(
					label + ' fallback pause restores still',
					(await blocked.locator('[data-motion-generated-source]').count()) === 0,
				);
				await blocked.close();
				await p.goto(url('/ueber-uns/'));
				const film = p.locator('[data-native-video] video');
				await film.evaluate((v) => (v.muted = true));
				await p.locator('.native-video__play').click();
				await p.waitForFunction(() => !document.querySelector('[data-native-video] video').paused);
				check(
					label + ' company film controls and focus',
					await film.evaluate((v) => v.controls && v === document.activeElement),
				);
				await film.evaluate((v) => v.pause());
				check(label + ' company film subtitle track', (await film.locator('track').count()) === 1);
				const nojs = await browser.newContext({
					viewport: { width, height },
					javaScriptEnabled: false,
				});
				const fallback = await nojs.newPage();
				await fallback.goto(url('/'));
				await fallback.locator('.menu-toggle').click();
				check(
					label + ' no-script navigation',
					await fallback.locator('#site-footer .footer-primary a').first().isVisible(),
				);
				await fallback.goto(url('/projekte/fahrzeugangebote/73-emw-327-2-1954/'));
				check(
					label + ' no-script image links',
					(await fallback.locator('[data-lightbox-trigger]').first().getAttribute('href')) !== null,
				);
				await nojs.close();
				check(
					label + ' CSP',
					!(await p.evaluate(() => window.qaCsp)).length,
					await p.evaluate(() => window.qaCsp),
				);
				check(label + ' no errors', !errors.length, errors);
			} catch (e) {
				check(label + ' execution', false, e.message);
			} finally {
				await c.close();
			}
			console.log(label + ' done');
		}
} finally {
	await browser.close();
	await writeFile(out + '/results.json', JSON.stringify(results, null, 2));
}
console.log(`${results.length} checks; ${results.filter((r) => !r.pass).length} failures`);
if (results.some((r) => !r.pass)) process.exitCode = 1;
