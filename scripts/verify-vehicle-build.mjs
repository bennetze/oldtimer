import assert from 'node:assert/strict';
import { access, readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import {
	GITHUB_PAGES_GALLERY_IMAGE_LIMIT,
	limitVehicleGalleryBlocks,
} from '../src/config/vehicleGalleryPolicy.js';
import { discoverVehicleCategory } from './lib/vehicle-files.mjs';

const target = process.argv[2];
if (target !== 'production' && target !== 'github-pages') {
	throw new Error('Expected a build target of "production" or "github-pages".');
}

const root = process.cwd();
const pagesRoot = join(root, 'src/pages/projekte');
const distRoot = join(root, 'dist');
const categories = [
	{ key: 'aktuelle-projekte' },
	{ key: 'vergangene-projekte' },
	{ key: 'fahrzeugangebote' },
];
const groups = await Promise.all(
	categories.map((category) => discoverVehicleCategory(pagesRoot, category)),
);
const vehicles = groups.flat();
const githubPages = target === 'github-pages';
const galleryImageLimit = githubPages
	? GITHUB_PAGES_GALLERY_IMAGE_LIMIT
	: Number.POSITIVE_INFINITY;
const deployedOrigin = githubPages
	? 'https://bennetze.github.io/oldtimer'
	: 'https://www.oldtimermanufaktur.de';
const assetBase = githubPages ? '/oldtimer/_astro/' : '/_astro/';
const galleryAssetBase = githubPages ? '/oldtimer/vehicle-gallery/' : '/vehicle-gallery/';

const routeFile = (route) => join(distRoot, route.replace(/^\//, ''), 'index.html');
const readRoute = (route) => readFile(routeFile(route), 'utf8');
const occurrences = (source, pattern) => source.match(pattern)?.length ?? 0;

for (const vehicle of vehicles) {
	const html = await readRoute(vehicle.route);
	const galleryImages = limitVehicleGalleryBlocks(vehicle.blocks ?? [], galleryImageLimit)
		.filter((block) => block.type === 'gallery')
		.flatMap((block) => block.images ?? []);
	assert.match(html, /property="og:title"/);
	assert.match(html, /property="og:description"/);
	assert.match(html, /property="og:image"/);
	assert.match(html, /property="og:url"/);
	assert.ok(html.includes(assetBase), `${vehicle.route}: incorrect Astro asset base for ${target}.`);
	assert.ok(html.includes(galleryAssetBase), `${vehicle.route}: incorrect gallery asset base for ${target}.`);
	assert.ok(html.includes(`${deployedOrigin}${vehicle.route}`), `${vehicle.route}: incorrect absolute metadata URL.`);
	assert.equal(
		occurrences(html, /<button[^>]+data-lightbox-trigger/g),
		galleryImages.length,
		`${vehicle.route}: gallery image count.`,
	);
	for (const image of galleryImages) {
		const filename = image.src.replace(/^\.\//, '').replace(/\.[^.]+$/, '.webp');
		await access(join(distRoot, 'vehicle-gallery', vehicle.category, vehicle.slug, filename));
	}
	if (githubPages) {
		assert.doesNotMatch(html, /type="application\/ld\+json"/);
		assert.doesNotMatch(html, /rel="canonical"/);
	} else {
		assert.match(html, /"@type":"ItemPage"/);
		assert.match(html, /"@type":"Vehicle"/);
		assert.match(html, /"@type":"BreadcrumbList"/);
		assert.match(html, /rel="canonical"/);
	}
}

const pageSize = 24;
const archiveCounts = new Map([
	['/projekte/aktuelle-projekte/', { total: groups[0].length, visible: groups[0].length }],
	['/projekte/vergangene-projekte/', { total: groups[1].length, visible: Math.min(pageSize, groups[1].length) }],
	['/projekte/fahrzeugangebote/', { total: groups[2].length, visible: groups[2].length }],
]);
for (const [route, expectedCards] of archiveCounts) {
	const html = await readRoute(route);
	assert.equal(occurrences(html, /<article class="vehicle-card"/g), expectedCards.total, `${route}: searchable card inventory.`);
	assert.equal(
		occurrences(html, /<article class="vehicle-card"[^>]+data-default-visible="true"/g),
		expectedCards.visible,
		`${route}: default-visible card count.`,
	);
	assert.match(html, /<form class="archive-search" role="search"/);
	assert.ok(html.includes(galleryAssetBase), `${route}: incorrect gallery asset base for ${target}.`);
	if (!githubPages) {
		assert.match(html, /"@type":"CollectionPage"/);
		assert.match(html, /"@type":"ItemList"/);
	}
}

const pastPages = Math.ceil(groups[1].length / pageSize);
for (let page = 2; page <= pastPages; page += 1) {
	const html = await readRoute(`/projekte/vergangene-projekte/seite/${page}/`);
	const expectedCards = Math.min(pageSize, groups[1].length - (page - 1) * pageSize);
	assert.equal(occurrences(html, /<article class="vehicle-card"/g), groups[1].length, `Past page ${page}: searchable card inventory.`);
	assert.equal(
		occurrences(html, /<article class="vehicle-card"[^>]+data-default-visible="true"/g),
		expectedCards,
		`Past page ${page}: default-visible card count.`,
	);
}
await assert.rejects(access(routeFile(`/projekte/vergangene-projekte/seite/${pastPages + 1}/`)));

const htmlFiles = [];
async function collectHtml(directory) {
	for (const entry of await readdir(directory, { withFileTypes: true })) {
		const path = join(directory, entry.name);
		if (entry.isDirectory()) await collectHtml(path);
		else if (entry.name.endsWith('.html')) htmlFiles.push(path);
	}
}
await collectHtml(distRoot);
for (const path of htmlFiles) {
	const html = await readFile(path, 'utf8');
	assert.doesNotMatch(
		html,
		/(?:src|srcset|href)="https:\/\/www\.oldtimermanufaktur\.de\/(?:images|media)\//,
		`${path}: external legacy asset request.`,
	);
}

const expectedRoutes = [
	'/',
	'/ueber-uns/',
	'/handwerk/',
	'/projekte/',
	...categories.map(({ key }) => `/projekte/${key}/`),
	...Array.from({ length: Math.max(pastPages - 1, 0) }, (_, index) =>
		`/projekte/vergangene-projekte/seite/${index + 2}/`),
	...vehicles.map(({ route }) => route),
];
const sitemap = await readFile(join(distRoot, 'sitemap.xml'), 'utf8');
const sitemapLocations = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
assert.deepEqual(
	new Set(sitemapLocations),
	new Set(expectedRoutes.map((route) => `${deployedOrigin}${route}`)),
	'Sitemap routes are stale or incomplete.',
);
assert.equal(sitemapLocations.length, expectedRoutes.length, 'Sitemap contains duplicate routes.');

const robots = await readFile(join(distRoot, 'robots.txt'), 'utf8');
assert.ok(robots.includes(`Sitemap: ${deployedOrigin}/sitemap.xml`));
const notFound = await readFile(join(distRoot, '404.html'), 'utf8');
assert.match(notFound, /name="robots" content="noindex,follow,noarchive"/);
const representativeArchive = await readRoute('/projekte/aktuelle-projekte/');
if (githubPages) {
	assert.match(representativeArchive, /name="robots" content="noindex,follow,noarchive"/);
} else {
	assert.doesNotMatch(representativeArchive, /name="robots" content="noindex/);
}

console.log(
	JSON.stringify(
		{
			target,
			galleryImageLimit: Number.isFinite(galleryImageLimit) ? galleryImageLimit : 'all',
			vehicles: vehicles.length,
			categories: Object.fromEntries(categories.map((category, index) => [category.key, groups[index].length])),
			pastPages,
			pastPageSizes: Array.from({ length: pastPages }, (_, index) =>
				Math.min(pageSize, groups[1].length - index * pageSize)),
			sitemapUrls: sitemapLocations.length,
			htmlFiles: htmlFiles.length,
		},
		null,
		2,
	),
);
