import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, readdir, rm, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import sharp from 'sharp';
import { reviewImport, applyImport, createVehiclePage, validateRedirects } from '../scripts/lib/vehicle-import.mjs';
import { categories, sitemapEntries, renderSitemap, productionOrigin } from '../scripts/lib/crawlers.mjs';
import { validateVehicleRecord } from '../src/config/vehicleRecord.js';

async function fixture(t) {
	const dir = await mkdtemp(join(tmpdir(), 'vehicle-review-'));
	t.after(() => rm(dir, { recursive: true, force: true }));
	const root = join(dir, 'site');
	const source = join(dir, 'export', categories[0]);
	for (const category of categories) await mkdir(join(root, 'src/pages/projekte', category), { recursive: true });
	await mkdir(join(root, 'src/config'), { recursive: true });
	await mkdir(join(root, 'public'), { recursive: true });
	await mkdir(join(source, 'test-car'), { recursive: true });
	const record = { slug: 'test-car', category: categories[0], title: 'Älterer Wagen', description: 'Dokumentation', sourceUrl: `${productionOrigin}/projekte/${categories[0]}/test-car/`, order: -123, dateModified: '2026-09-12', cardImage: './card.jpg', cardImageAlt: 'Vorderansicht', leadImage: './card.jpg', leadImageAlt: 'Titelbild', blocks: [{ type: 'copy', html: '<p><strong>Original</strong></p>' }, { type: 'gallery', images: [{ src: './card.jpg', alt: 'Erste Verwendung' }, { src: './card.jpg', alt: 'Zweite Verwendung', caption: 'Anderer Kontext' }] }] };
	const image = await sharp({ create: { width: 4, height: 3, channels: 3, background: '#ddd' } }).jpeg().toBuffer();
	await writeFile(join(source, 'test-car/card.jpg'), image);
	await writeFile(join(source, 'test-car/vehicle.json'), JSON.stringify(record));
	await writeFile(join(source, 'test-car.astro'), '<script>UNTRUSTED_ASTRO</script>');
	await writeFile(join(root, 'public/sitemap.xml'), renderSitemap(sitemapEntries([[], [], []])));
	await writeFile(join(root, 'public/llms.txt'), `# Website\n\n> Beschreibung\n\n## Seiten\n\n[Start](${productionOrigin}/)\n`);
	await writeFile(join(root, 'public/robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${productionOrigin}/sitemap.xml\n`);
	await writeFile(join(root, 'src/config/vehicle-redirects.json'), '{}\n');
	return { dir, root, source, record, image };
}

test('review is read-only; explicit apply preserves data and regenerates trusted Astro', async (t) => {
	const { root, source, record, image } = await fixture(t);
	const review = await reviewImport(root, source);
	assert.equal((await readdir(join(root, 'src/pages/projekte', record.category))).length, 0);
	assert.ok(review.summary.some((entry) => entry.action === 'add'));
	assert.ok(review.textChanges.some((entry) => entry.path.endsWith('vehicle.json') && JSON.parse(entry.after).title === record.title));
	await assert.rejects(applyImport(review, 'wrong'), /token/);
	const result = await applyImport(review, review.token);
	assert.deepEqual(JSON.parse(await readFile(join(root, 'src/pages/projekte', record.category, record.slug, 'vehicle.json'))), record);
	assert.deepEqual(await readFile(join(root, 'src/pages/projekte', record.category, record.slug, 'card.jpg')), image);
	assert.equal(await readFile(join(root, 'src/pages/projekte', record.category, `${record.slug}.astro`), 'utf8'), createVehiclePage(record.category, record.slug));
	assert.match(await readFile(join(result.backup, 'COMPLETED'), 'utf8'), /completed/);
	await assert.rejects(reviewImport(root, source), /Destination exists/);
	const again = await reviewImport(root, source, `${record.category}/${record.slug}`);
	assert.deepEqual(again.summary, []);
});

test('edited vehicle and category move retain original until checked replacement and create redirects', async (t) => {
	const f = await fixture(t);
	let review = await reviewImport(f.root, f.source); await applyImport(review, review.token);
	f.record.title = 'Überarbeitet';
	await writeFile(join(f.source, 'test-car/vehicle.json'), JSON.stringify(f.record));
	review = await reviewImport(f.root, f.source, `${f.record.category}/test-car`); await applyImport(review, review.token);
	const old = `${f.record.category}/test-car`;
	const { rename } = await import('node:fs/promises');
	const movedSource = join(f.dir, 'export', categories[1]);
	await rename(f.source, movedSource); f.record.category = categories[1];
	await writeFile(join(movedSource, 'test-car/vehicle.json'), JSON.stringify(f.record));
	review = await reviewImport(f.root, movedSource, old); await applyImport(review, review.token);
	assert.deepEqual(JSON.parse(await readFile(join(f.root, 'src/config/vehicle-redirects.json'))), { [old]: `${categories[1]}/test-car` });
	assert.deepEqual(await readdir(join(f.root, 'src/pages/projekte', categories[0])), []);
});

test('changed source or destination invalidates approval', async (t) => {
	const f = await fixture(t);
	let review = await reviewImport(f.root, f.source);
	await writeFile(join(f.source, 'test-car.astro'), 'different');
	await assert.rejects(applyImport(review, review.token), /Stale approval/);
	review = await reviewImport(f.root, f.source);
	await writeFile(join(f.root, 'public/llms.txt'), (await readFile(join(f.root, 'public/llms.txt'), 'utf8')) + '\n');
	await assert.rejects(applyImport(review, review.token), /Stale approval/);
});

test('interrupted replacement restores previous bytes and retains backup', async (t) => {
	const f = await fixture(t);
	let review = await reviewImport(f.root, f.source); await applyImport(review, review.token);
	const old = await readFile(join(f.root, 'src/pages/projekte', f.record.category, 'test-car/vehicle.json'));
	f.record.title = 'Interrupted'; await writeFile(join(f.source, 'test-car/vehicle.json'), JSON.stringify(f.record));
	review = await reviewImport(f.root, f.source, `${f.record.category}/test-car`);
	await assert.rejects(applyImport(review, review.token, { afterWrite() { throw new Error('simulated interruption'); } }), /rolled back/);
	assert.deepEqual(await readFile(join(f.root, 'src/pages/projekte', f.record.category, 'test-car/vehicle.json')), old);
});

test('traversal, symlinks, corrupt/mislabeled images and unsafe HTML fail closed', async (t) => {
	const f = await fixture(t);
	await assert.rejects(reviewImport(f.root, f.source, '../bad'), /--from/);
	await writeFile(join(f.source, 'test-car/card.jpg'), 'not a jpeg');
	await assert.rejects(reviewImport(f.root, f.source), /unsupported|image|Input/i);
	await writeFile(join(f.source, 'test-car/card.jpg'), f.image);
	await symlink(join(f.source, 'test-car/card.jpg'), join(f.source, 'test-car/alias.jpg'));
	await assert.rejects(reviewImport(f.root, f.source), /Symlink/);
	await rm(join(f.source, 'test-car/alias.jpg'));
	f.record.blocks[0].html = '<p onclick="alert(1)">Text</p>';
	await writeFile(join(f.source, 'test-car/vehicle.json'), JSON.stringify(f.record));
	await assert.rejects(reviewImport(f.root, f.source), /unsupported onclick/);
});

test('dates, safe order, reserved slugs and redirect conflicts are rejected', () => {
	assert.throws(() => validateVehicleRecord({}), /Slug/);
	assert.throws(() => validateRedirects({ 'aktuelle-projekte/a': 'aktuelle-projekte/a' }, new Set()), /redirect/);
});

test('duplicate order and filename conversion collisions fail before any replacement', async (t) => {
	const f = await fixture(t);
	const review = await reviewImport(f.root, f.source); await applyImport(review, review.token);
	const { rename } = await import('node:fs/promises');
	await rename(join(f.source, 'test-car'), join(f.source, 'other-car'));
	await rm(join(f.source, 'test-car.astro'));
	f.record.slug = 'other-car';
	await writeFile(join(f.source, 'other-car/vehicle.json'), JSON.stringify(f.record));
	await assert.rejects(reviewImport(f.root, f.source), /Duplicate order/);
	f.record.order = 999;
	await writeFile(join(f.source, 'other-car/vehicle.json'), JSON.stringify(f.record));
	await writeFile(join(f.source, 'other-car/card.png'), await sharp(f.image).png().toBuffer());
	await assert.rejects(reviewImport(f.root, f.source), /collision/);
});

test('move redirect artifacts remain noindex and work on production and Pages bases', async (t) => {
	const f = await fixture(t);
	const review = await reviewImport(f.root, f.source); await applyImport(review, review.token);
	const from = `${categories[1]}/test-car`, to = `${categories[0]}/test-car`;
	await writeFile(join(f.root, 'src/config/vehicle-redirects.json'), JSON.stringify({[from]:to}));
	await mkdir(join(f.root, 'dist/projekte', to),{recursive:true});
	await writeFile(join(f.root, 'dist/.htaccess'),'ErrorDocument 404 /404.html\n');
	await writeFile(join(f.root, 'dist/projekte', to, 'index.html'),'<html><head><meta property="og:url" content="old"><link rel="canonical" href="old"><script>test()</script></head><body><main>Vehicle</main></body></html>');
	const {prepareVehicleRedirects} = await import('../scripts/prepare-vehicle-redirects.mjs');
	for (const target of ['production','github-pages']) {
		await prepareVehicleRedirects(f.root,target);
		const html=await readFile(join(f.root,'dist/projekte',from,'index.html'),'utf8');
		assert.match(html,/noindex,follow/); assert.doesNotMatch(html,/<script|rel="canonical"/);
		assert.ok(html.includes(`url=${target==='github-pages'?'/oldtimer':''}/projekte/${to}/`));
	}
});

 test('symlink in a source ancestor is rejected', async (t) => {
	const f = await fixture(t);
	const alias = join(f.dir, 'linked-export');
	await symlink(join(f.dir, 'export'), alias);
	await assert.rejects(reviewImport(f.root, join(alias, categories[0])), /Symlink/);
});
