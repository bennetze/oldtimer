// Optional QA dependencies remain outside the application lockfile.
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
import { readFile, mkdir, writeFile } from 'node:fs/promises';
const source = await readFile(
	process.env.AXE_SOURCE || new URL('../node_modules/axe-core/axe.min.js', import.meta.url),
	'utf8',
);
const b = await chromium.launch({ channel: 'chrome' }),
	results = [];
const out = process.env.QA_OUTPUT || '.codex-qa/browser-2026-10-25/accessibility';
await mkdir(out, { recursive: true });
for (const width of [1440, 390]) {
	const p = await b.newPage({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
	for (const lang of ['de', 'en'])
		for (const route of [
			'/',
			'/handwerk/',
			'/ueber-uns/',
			'/projekte/',
			'/projekte/aktuelle-projekte/',
			'/projekte/vergangene-projekte/seite/2/',
			'/projekte/fahrzeugangebote/',
			'/projekte/fahrzeugangebote/73-emw-327-2-1954/',
			'/impressum/',
			'/datenschutz/',
			'/404.html',
		]) {
			await p.goto(
				(process.env.SITE_URL || 'http://127.0.0.1:4330') +
					(lang === 'en' ? '/en' : '') +
					route +
					'?lang=' +
					lang,
			);
			await p.evaluate(() => document.fonts.ready);
			await p.evaluate(source);
			const run = async (state) => {
				const r = await p.evaluate(() =>
					axe.run(document, {
						runOnly: {
							type: 'tag',
							values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'],
						},
					}),
				);
				const row = {
					width,
					lang,
					route,
					state,
					violations: r.violations.map((v) => ({
						id: v.id,
						impact: v.impact,
						description: v.description,
						nodes: v.nodes.map((n) => ({ target: n.target, summary: n.failureSummary })),
					})),
					incomplete: r.incomplete.map((v) => ({ id: v.id, nodes: v.nodes.length })),
				};
				results.push(row);
				if (row.violations.length) console.log(JSON.stringify(row));
			};
			await run('page');
			if (route === '/') {
				await p.locator('.menu-toggle').click();
				await run('menu');
			}
			if (route.includes('73-emw')) {
				await p.locator('[data-lightbox-trigger]').first().click();
				await run('lightbox');
			}
		}
	await p.close();
}
await b.close();
await writeFile(out + '/results.json', JSON.stringify(results, null, 2));
console.log(
	results.length +
		' states; ' +
		results.reduce((n, r) => n + r.violations.length, 0) +
		' violations',
);

if (results.some((row) => row.violations.length)) process.exitCode = 1;
