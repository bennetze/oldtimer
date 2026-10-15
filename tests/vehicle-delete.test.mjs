import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, readdir, rm, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { reviewDeletion, applyDeletion, createVehiclePage } from '../scripts/lib/vehicle-import.mjs';
import { deleteVehicle, deleteWizard } from '../scripts/lib/vehicle-delete.mjs';
import { categories, productionOrigin, sitemapEntries, renderSitemap, checkCrawlerFiles } from '../scripts/lib/crawlers.mjs';
import { discoverVehicleCategory } from '../scripts/lib/vehicle-files.mjs';
import { refreshVehiclePreview } from '../scripts/lib/vehicle-preview.mjs';

async function fixture(t) {
	const dir = await mkdtemp(join(tmpdir(), 'vehicle-delete-'));
	t.after(() => rm(dir, { recursive: true, force: true }));
	const root = join(dir, 'site');
	for (const category of categories) await mkdir(join(root, 'src/pages/projekte', category), { recursive: true });
	await mkdir(join(root, 'src/config'), { recursive: true });
	await mkdir(join(root, 'public'), { recursive: true });
	const image = await sharp({ create: { width: 4, height: 3, channels: 3, background: '#ddd' } }).jpeg().toBuffer();
	async function add(category, slug, order, title = slug) {
		const record = { category, slug, order, title, titleEn: 'Test car', description: 'Testfahrzeug', descriptionEn: 'Test vehicle', dateModified: '2026-10-14', sourceUrl: `${productionOrigin}/projekte/${category}/${slug}/`, cardImage: './card.jpg', cardImageAlt: 'Testwagen', cardImageAltEn: 'Test car', leadImage: './card.jpg', leadImageAlt: 'Testwagen', leadImageAltEn: 'Test car', blocks: [] };
		const folder = join(root, 'src/pages/projekte', category, slug);
		await mkdir(folder);
		await writeFile(join(folder, 'vehicle.json'), JSON.stringify(record));
		await writeFile(join(folder, 'card.jpg'), image);
		await writeFile(folder + '.astro', createVehiclePage(category, slug));
		return record;
	}
	const record = await add(categories[0], 'test-car', 1, 'Älterer Wagen');
	await add(categories[2], 'keep-car', 1, 'Weiterer Wagen');
	const groups = async () => Promise.all(categories.map(key => discoverVehicleCategory(join(root, 'src/pages/projekte'), { key })));
	const sync = async () => writeFile(join(root, 'public/sitemap.xml'), renderSitemap(sitemapEntries(await groups())));
	await sync();
	await writeFile(join(root, 'public/llms.txt'), `# Website\n\n> Beschreibung\n\n## Seiten\n\n[Start](${productionOrigin}/)\n`);
	await writeFile(join(root, 'public/robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${productionOrigin}/sitemap.xml\n`);
	await writeFile(join(root, 'src/config/vehicle-redirects.json'), '{}\n');
	return { root, dir, record, image, add, groups, sync, from: `${record.category}/${record.slug}` };
}

test('deletion review is read-only; confirmed deletion backs up the exact pair and updates bilingual crawlers', async t => {
	const f = await fixture(t);
	const old = `${categories[1]}/test-car`, keep = `${categories[0]}/keep-car`;
	await writeFile(join(f.root, 'src/config/vehicle-redirects.json'), JSON.stringify({ [old]: f.from, [keep]: `${categories[2]}/keep-car` }));
	const llms = `# Website\n\n> Beschreibung\n\n## Seiten\n\n[Start](${productionOrigin}/)\n- [Wagen](${productionOrigin}/projekte/${f.from}/): Alter Fahrzeugeintrag.\n[Car](${productionOrigin}/en/projekte/${f.from}/)\n[Alt](${productionOrigin}/projekte/${old}/) und [Start](${productionOrigin}/).\nUnveränderter Text.\n`;
	await writeFile(join(f.root, 'public/llms.txt'), llms);
	const review = await reviewDeletion(f.root, f.from);
	assert.equal(await readFile(join(f.root, 'public/llms.txt'), 'utf8'), llms);
	assert.ok(!(await readdir(f.root)).includes('.cache'));
	assert.ok((await f.groups()).flat().some(item => item.slug === 'test-car'));
	await assert.rejects(applyDeletion(review, 'wrong'), /Bestätigung/);
	// Caller-provided change instructions are not trusted.
	review.changes.set('public/robots.txt', Buffer.from('bad'));
	const result = await applyDeletion(review, review.token);
	assert.deepEqual(await readdir(join(f.root, 'src/pages/projekte', categories[0])), []);
	assert.deepEqual(JSON.parse(await readFile(join(f.root, 'src/config/vehicle-redirects.json'))), { [keep]: `${categories[2]}/keep-car` });
	assert.deepEqual(await readFile(join(result.backup, 'before/src/pages/projekte', f.from, 'card.jpg')), f.image);
	assert.equal(JSON.parse(await readFile(join(result.backup, 'review.json'))).operation, 'delete');
	assert.match(await readFile(join(result.backup, 'COMPLETED'), 'utf8'), /completed/);
	const crawler = Object.fromEntries(await Promise.all(['sitemap', 'llms', 'robots'].map(async name => [name, await readFile(join(f.root, 'public', name + (name === 'sitemap' ? '.xml' : '.txt')), 'utf8')])));
	checkCrawlerFiles(crawler, sitemapEntries(await f.groups()));
	assert.doesNotMatch(crawler.sitemap, /test-car/);
	assert.doesNotMatch(crawler.llms, /test-car/);
	assert.doesNotMatch(crawler.llms, /Alter Fahrzeugeintrag/);
	assert.match(crawler.llms, /Unveränderter Text\./);
	assert.match(crawler.llms, /Alt und \[Start\]/);
	assert.ok((await f.groups()).flat().some(item => item.slug === 'keep-car'));
	assert.ok(!(await readdir(join(f.root, '.cache'))).includes('vehicle-import.lock'));
});

test('deletion cancellation and invalid selections leave project bytes unchanged', async t => {
	const f = await fixture(t), before = (await reviewDeletion(f.root, f.from)).before;
	for (const choice of ['', '0', 'JA', '99', '-1']) {
		const answers = ['test-car', choice];
		assert.equal(await deleteWizard(f.root, { write() {}, confirm: async () => answers.shift() }), null);
		assert.equal(answers.length, 0);
	}
	for (const answer of ['', 'Nein', 'ja']) {
		const answers = ['test-car', '1', answer];
		assert.equal(await deleteWizard(f.root, { write() {}, confirm: async () => answers.shift() }), null);
	}
	assert.equal(await deleteWizard(f.root, { write() {}, confirm: async () => 'kein-treffer' }), null);
	assert.deepEqual((await reviewDeletion(f.root, f.from)).before, before);
	assert.ok(!(await readdir(f.root)).includes('.cache'));
});

test('guided deletion selects an exact route when slugs and titles repeat and refreshes preview', async t => {
	const f = await fixture(t);
	await f.add(categories[1], 'test-car', 1, f.record.title);
	await f.sync();
	await refreshVehiclePreview(f.root);
	const answers = ['ÄLTERER', '2', 'JA'], messages = [];
	const result = await deleteWizard(f.root, { write: text => messages.push(text), confirm: async () => answers.shift() });
	assert.equal(result.previewReady, true);
	assert.equal(answers.length, 0);
	assert.ok((await f.groups()).flat().some(item => `${item.category}/${item.slug}` === f.from));
	assert.ok(!(await f.groups()).flat().some(item => `${item.category}/${item.slug}` === `${categories[1]}/test-car`));
	const manifest = JSON.parse(await readFile(join(f.root, '.cache/vehicle-gallery-v3/production.json')));
	assert.ok(manifest.images[`/vehicle-gallery/${f.from}/card.webp`]);
	assert.ok(!manifest.images[`/vehicle-gallery/${categories[1]}/test-car/card.webp`]);
	await assert.rejects(readFile(join(f.root, 'public/vehicle-gallery', categories[1], 'test-car/card.webp')), /ENOENT/);
	assert.equal(JSON.parse(await readFile(join(f.root, '.cache/vehicle-preview-state.json'))).phase, 'ready');
	assert.ok(messages.some(text => text.includes(`(${categories[1]}/test-car)`)));
	assert.ok(messages.includes('Fahrzeug gelöscht.'));
	assert.ok(!messages.some(text => /HTML|Prüfsumme|Browser öffnen/.test(text)));
});

test('deletion adjusts archive pagination and removes retired pagination links', async t => {
	const f = await fixture(t);
	for (let i = 1; i <= 25; i++) await f.add(categories[1], `car-${i}`, i);
	await f.sync();
	await writeFile(join(f.root, 'public/llms.txt'), `# Website\n\n> Beschreibung\n\n## Seiten\n\n[Start](${productionOrigin}/)\n- [Seite 2](${productionOrigin}/projekte/${categories[1]}/seite/2/)\n- [Page 2](${productionOrigin}/en/projekte/${categories[1]}/seite/2/)\n`);
	const review = await reviewDeletion(f.root, `${categories[1]}/car-25`);
	await applyDeletion(review, review.token);
	assert.doesNotMatch(await readFile(join(f.root, 'public/sitemap.xml'), 'utf8'), /seite\/2/);
	assert.doesNotMatch(await readFile(join(f.root, 'public/llms.txt'), 'utf8'), /seite\/2/);
	assert.equal((await f.groups())[1].length, 24);
});

test('deletion rejects stale approvals, unsafe paths, invalid keys and foreign locks', async t => {
	const f = await fixture(t);
	await assert.rejects(reviewDeletion(f.root, '../bad'), /gültiges/);
	await assert.rejects(reviewDeletion(f.root, `${categories[0]}/missing`), /nicht mehr vorhanden/);
	let review = await reviewDeletion(f.root, f.from);
	await writeFile(join(f.root, 'public/llms.txt'), (await readFile(join(f.root, 'public/llms.txt'), 'utf8')) + '\n');
	await assert.rejects(applyDeletion(review, review.token), /seit der Prüfung geändert/);
	review = await reviewDeletion(f.root, f.from);
	const card = join(f.root, 'src/pages/projekte', f.from, 'card.jpg');
	await writeFile(card, 'Changed externally');
	await assert.rejects(applyDeletion(review, review.token), /seit der Prüfung geändert/);
	await writeFile(card, f.image);
	review = await reviewDeletion(f.root, f.from);
	await mkdir(join(f.root, '.cache/vehicle-import.lock'), { recursive: true });
	await writeFile(join(f.root, '.cache/vehicle-import.lock/foreign'), 'do not remove');
	await assert.rejects(applyDeletion(review, review.token), /Übernahme oder Löschung läuft oder wurde unterbrochen/);
	assert.equal(await readFile(join(f.root, '.cache/vehicle-import.lock/foreign'), 'utf8'), 'do not remove');
	assert.deepEqual(await readFile(card), f.image);
	await rm(card);
	await writeFile(join(f.dir, 'outside.jpg'), f.image);
	await symlink(join(f.dir, 'outside.jpg'), card);
	await assert.rejects(reviewDeletion(f.root, f.from), /Symlink/);
});

test('deletion cannot confirm data changed after the user saw the review', async t => {
	const f = await fixture(t);
	await assert.rejects(deleteVehicle(f.root, f.from, {
		write() {},
		async confirm() {
			await writeFile(join(f.root, 'src/pages/projekte', f.from, 'card.jpg'), 'External photo edit');
			return 'JA';
		},
	}), /seit der Prüfung geändert/);
	assert.equal(await readFile(join(f.root, 'src/pages/projekte', f.from, 'card.jpg'), 'utf8'), 'External photo edit');
	assert.equal(JSON.parse(await readFile(join(f.root, '.cache/vehicle-preview-state.json'))).phase, 'blocked');
});

test('failed deletion restores originals and preserves concurrent edits or foreign locks', async t => {
	for (const mode of ['rollback', 'external', 'foreign']) {
		const f = await fixture(t), review = await reviewDeletion(f.root, f.from);
		let injected = false, changed;
		await assert.rejects(applyDeletion(review, review.token, { async afterWrite(path) {
			if (!path.includes(`${f.from}/`) || injected) return;
			injected = true; changed = path;
			if (mode === 'external') await writeFile(join(f.root, path), 'External edit');
			if (mode === 'foreign') await writeFile(join(f.root, '.cache/vehicle-import.lock/cli.json'), JSON.stringify({ id: 'foreign' }));
			throw new Error('simulated failure');
		} }), mode === 'rollback' ? /rolled back/ : /Rollback also failed/);
		assert.ok(injected);
		const cache = await readdir(join(f.root, '.cache'));
		assert.ok(cache.some(name => name.startsWith('vehicle-import-backup-')));
		if (mode === 'rollback') {
			assert.deepEqual((await reviewDeletion(f.root, f.from)).before, review.before);
			assert.ok(!cache.includes('vehicle-import.lock'));
		} else {
			assert.ok(cache.includes('vehicle-import.lock'));
			if (mode === 'external') assert.equal(await readFile(join(f.root, changed), 'utf8'), 'External edit');
		}
	}
});

test('post-commit preview failure reports deletion as saved and retains backup', async t => {
	const f = await fixture(t);
	await mkdir(join(f.root, '.cache/vehicle-gallery-v3'), { recursive: true });
	await writeFile(join(f.dir, 'outside.json'), '{}');
	await symlink(join(f.dir, 'outside.json'), join(f.root, '.cache/vehicle-gallery-v3/production.json'));
	const messages = [];
	const result = await deleteVehicle(f.root, f.from, { write: text => messages.push(text), confirm: async () => 'JA' });
	assert.equal(result.previewReady, false);
	assert.ok(!(await f.groups()).flat().some(item => `${item.category}/${item.slug}` === f.from));
	assert.match(await readFile(join(result.backup, 'COMPLETED'), 'utf8'), /completed/);
	assert.ok(messages.some(text => text.includes('Fahrzeug gelöscht. Vorschau fehlgeschlagen:')));
	assert.ok(messages.some(text => text.includes(result.backup)));
	assert.equal(JSON.parse(await readFile(join(f.root, '.cache/vehicle-preview-state.json'))).phase, 'blocked');
});

test('deletion CLI rejects piped approval and arguments before changing the project', async t => {
	const f = await fixture(t), before = (await reviewDeletion(f.root, f.from)).before;
	const script = fileURLToPath(new URL('../scripts/delete-vehicle.mjs', import.meta.url));
	for (const args of [[], ['--yes'], [f.from]]) {
		const result = spawnSync(process.execPath, [script, ...args], { cwd: f.root, input: 'test-car\n1\nJA\n', encoding: 'utf8' });
		assert.equal(result.status, 1);
		assert.match(result.stderr, /interaktiven Terminal|nur npm run vehicles:delete/);
	}
	assert.deepEqual((await reviewDeletion(f.root, f.from)).before, before);
	assert.ok(!(await readdir(f.root)).includes('.cache'));
});
