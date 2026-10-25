// Optional release QA runtime; never deploys or edits vehicle records.
// PLAYWRIGHT_MODULE points to an external Playwright installation.
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { globSync } from 'node:fs';
const engines = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const engine = process.env.BROWSER || 'chromium';
const suite = process.env.SUITE || 'smoke';
const base = (process.env.SITE_URL || 'http://127.0.0.1:4330').replace(/\/$/, '');
const out = process.env.QA_OUTPUT || `.codex-qa/browser-2026-10-25/${engine}-${suite}`;
await mkdir(out, { recursive: true });
const results = [],
	failures = [];
const browser = await engines[engine].launch({
	headless: process.env.BROWSER_HEADED !== '1',
	...(engine === 'chromium' ? { channel: 'chrome' } : {}),
});
const check = (label, pass, detail) => {
	results.push({ label, pass: !!pass, ...(detail === undefined ? {} : { detail }) });
	if (!pass) {
		failures.push(label);
		console.log('FAIL', label, JSON.stringify(detail));
	}
};
const routeUrl = (route, lang) => `${base}${lang === 'en' ? '/en' : ''}${route}?lang=${lang}`;
const topRoutes = [
	'/',
	'/ueber-uns/',
	'/handwerk/',
	'/projekte/',
	'/projekte/aktuelle-projekte/',
	'/projekte/vergangene-projekte/',
	'/projekte/vergangene-projekte/seite/2/',
	'/projekte/fahrzeugangebote/',
	'/impressum/',
	'/datenschutz/',
	'/404.html',
];
const records = await Promise.all(
	globSync('src/pages/projekte/*/*/vehicle.json').map(async (file) =>
		JSON.parse(await readFile(file, 'utf8')),
	),
);
let visits = 0;
try {
	for (const [width, height] of suite === 'smoke'
		? [
				[1440, 900],
				[390, 844],
				[320, 568],
				[844, 390],
			]
		: [
				[1440, 900],
				[390, 844],
			]) {
		const context = await browser.newContext({
			viewport: { width, height },
			locale: 'de-DE',
			hasTouch: width < 900,
			isMobile: engine !== 'firefox' && width < 900,
			reducedMotion: 'reduce',
		});
		const page = await context.newPage();
		page.setDefaultTimeout(10000);
		const errors = [];
		page.on('pageerror', (e) => errors.push(e.message));
		await page.addInitScript(() => {
			window.qaCsp = [];
			document.addEventListener('securitypolicyviolation', (e) =>
				window.qaCsp.push({ directive: e.violatedDirective, uri: e.blockedURI }),
			);
		});
		const routes =
			suite === 'vehicles' ? records.map((r) => `/projekte/${r.category}/${r.slug}/`) : topRoutes;
		for (const lang of ['de', 'en'])
			for (const route of routes) {
				const label = `${engine} ${width}x${height} ${lang} ${route}`;
				try {
					const response = await page.goto(routeUrl(route, lang), { waitUntil: 'load' });
					await page.evaluate(() => document.fonts.ready);
					check(
						label + ' response',
						response.status() === (route === '/404.html' && lang === 'en' ? 404 : 200),
						response.status(),
					);
					check(label + ' language', (await page.locator('html').getAttribute('lang')) === lang);
					check(
						label + ' no horizontal overflow',
						await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
					);
					check(
						label + ' main and heading',
						(await page.locator('main#main-content[tabindex="-1"]').count()) === 1 &&
							(await page.locator('h1').count()) === 1,
					);
					if (suite === 'vehicles') {
						const bad = await page
							.locator('.vehicle-lead img,.vehicle-story img')
							.evaluateAll(async (images) => {
								images.forEach((i) => (i.loading = 'eager'));
								await Promise.all(images.map((i) => i.decode().catch(() => {})));
								return images.filter((i) => !i.naturalWidth).map((i) => i.src);
							});
						check(label + ' images decode', bad.length === 0, bad);
						const outside = await page
							.locator('.story-copy,.story-contact,.story-gallery,.vehicle-title')
							.evaluateAll((els) =>
								els
									.filter((el) => {
										const r = el.getBoundingClientRect();
										return r.left < -1 || r.right > innerWidth + 1;
									})
									.map((el) => el.className),
							);
						check(label + ' content within viewport', outside.length === 0, outside);
					} else {
						check(
							label + ' heading fits',
							await page.locator('h1').evaluate((el) => {
								const r = el.getBoundingClientRect();
								return (
									(r.width <= 1 && r.height <= 1) ||
									(r.left >= -1 &&
										r.right <= innerWidth + 1 &&
										el.scrollWidth <= el.clientWidth + 1)
								);
							}),
						);
						await page.locator('.menu-toggle').click();
						await page.waitForFunction(() => document.activeElement.matches('.menu-close'));
						check(
							label + ' menu name fits',
							await page
								.locator('.menu-panel__top span')
								.evaluate((el) => el.scrollWidth <= el.clientWidth + 1),
						);
						await page.keyboard.press('Shift+Tab');
						check(
							label + ' menu last focus visible',
							await page.evaluate(() => {
								const a = document.activeElement,
									r = a.getBoundingClientRect();
								return !!a.closest('#site-menu') && r.top >= 0 && r.bottom <= innerHeight + 1;
							}),
						);
						await page.keyboard.press('Tab');
						check(
							label + ' menu cycle',
							await page.evaluate(() => document.activeElement.matches('.menu-close')),
						);
						await page.keyboard.press('Escape');
						check(
							label + ' menu focus return',
							await page.evaluate(() => document.activeElement.matches('.menu-toggle')),
						);
					}
					check(
						label + ' CSP',
						!(await page.evaluate(() => window.qaCsp)).length,
						await page.evaluate(() => window.qaCsp),
					);
					check(label + ' script errors', errors.length === 0, errors.splice(0));
					// WebKit's screenshot helper injects a style that the real CSP blocks.
					// Record application CSP results before invoking the screenshot helper.
					if (suite === 'smoke' && [1440, 390, 320].includes(width))
						await page.screenshot({
							caret: 'initial',
							path: `${out}/${width}-${lang}-${route.replace(/\W/g, '_')}.png`,
						});
					visits++;
				} catch (e) {
					check(label + ' execution', false, e.message);
				}
			}
		await context.close();
		console.log(
			`${engine} ${suite}: ${width}px complete, ${visits} visits, ${failures.length} failures`,
		);
	}
} finally {
	await browser.close();
	await writeFile(
		`${out}/results.json`,
		JSON.stringify(
			{ engine, suite, visits, checks: results.length, failures: failures.length, results },
			null,
			2,
		),
	);
}
console.log(`${visits} visits; ${results.length} checks; ${failures.length} failures`);
if (failures.length) process.exitCode = 1;
