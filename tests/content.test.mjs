import test from 'node:test';
import { load } from 'cheerio';
import assert from 'node:assert/strict';
import { validateVehicleHtml } from '../src/config/vehicleHtml.js';
import { fragmentId } from '../src/config/fragments.js';
import { pageModified, modificationDates } from '../src/config/modificationDates.js';
import { sitemapEntries, renderSitemap, checkCrawlerFiles, productionOrigin } from '../scripts/lib/crawlers.mjs';

test('vehicle HTML retains German copy, formatting and safe contact links', () => {
	const html = '<p>Größe &amp; Qualität <strong>Original</strong><br /><a href="mailto:info@oldtimermanufaktur.de">E-Mail</a></p>';
	assert.match(load(validateVehicleHtml(html)).text(), /Größe & Qualität/);
	assert.match(validateVehicleHtml(html), /href="mailto:info@oldtimermanufaktur.de"/);
});

test('vehicle HTML rejects active content with useful context', () => {
	for (const html of ['<script>alert(1)</script>', '<p onclick="alert(1)">Hi</p>', '<body onload="alert(1)">Hi</body>', '<iframe src="https://example.com"></iframe>', '<a href="java&#x73;cript:alert(1)">Hi</a>', '<a href="jav&#9;ascript:alert(1)">Hi</a>', '<a href="data:text/html,x">Hi</a>', '<a href="//example.com">Hi</a>', '<svg onload="alert(1)"></svg>', '<p style="color:red">Hi</p>']) {
		assert.throws(() => validateVehicleHtml(html, 'vehicle/test, block 2'), /vehicle\/test, block 2:/);
	}
});

test('fragment lookup handles encoded, malformed and selector-like IDs safely', () => {
	assert.equal(fragmentId('#über-uns'), 'über-uns');
	assert.equal(fragmentId('#%C3%BCber-uns'), 'über-uns');
	assert.equal(fragmentId('#a[b]'), 'a[b]');
	assert.equal(fragmentId('#%'), null);
	assert.equal(fragmentId('#'), null);
});

const groups = [[], [], []];
const entries = sitemapEntries(groups);
const files = {
	sitemap: renderSitemap(entries),
	llms: `# Site\n\n> Summary\n\n## Pages\n\n[Home](${productionOrigin}/)\n`,
	robots: `User-agent: *\nAllow: /\nSitemap: ${productionOrigin}/sitemap.xml\n`,
};

test('empty categories keep canonical archive routes with stable reviewed dates', () => {
	assert.equal(entries.length, 7);
	assert.ok(entries.every(([, date]) => date === modificationDates.shared));
	assert.equal(pageModified('/projekte/test/car/', ['2026-10-01']), '2026-10-01');
	assert.equal(renderSitemap(sitemapEntries(groups)), files.sitemap);
});

test('crawler validation preserves approved manual wording and rejects drift', () => {
	checkCrawlerFiles(files, entries);
	assert.throws(() => checkCrawlerFiles({ ...files, sitemap: files.sitemap.replace('2026-09-05', '2026-09-04') }, entries), /npm run vehicles:sync/);
	for (const path of ['/404.html', '/impressum/', '/absent/', '/oldtimer-kaufen/']) {
		assert.throws(() => checkCrawlerFiles({ ...files, llms: files.llms + `[Bad](${productionOrigin}${path})` }, entries), /non-canonical/);
	}
	assert.throws(() => checkCrawlerFiles({ ...files, robots: files.robots.replace(productionOrigin, 'https://example.com') }, entries), /production sitemap/);
});
