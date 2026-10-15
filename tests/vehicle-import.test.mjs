import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, readdir, rm, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { reviewImport, applyImport, createVehiclePage, validateRedirects } from '../scripts/lib/vehicle-import.mjs';
import { transferVehicle } from '../scripts/lib/vehicle-transfer.mjs';
import { transferWizard, folderInput } from '../scripts/lib/vehicle-transfer-wizard.mjs';
import { refreshVehiclePreview } from '../scripts/lib/vehicle-preview.mjs';
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
	const record = { slug: 'test-car', category: categories[0], title: 'Älterer Wagen', titleEn: 'Älterer Wagen', description: 'Dokumentation', descriptionEn: 'Dokumentation', sourceUrl: `${productionOrigin}/projekte/${categories[0]}/test-car/`, order: -123, dateModified: '2026-09-12', cardImage: './card.jpg', cardImageAlt: 'Vorderansicht', cardImageAltEn: 'Vorderansicht', leadImage: './card.jpg', leadImageAlt: 'Titelbild', leadImageAltEn: 'Titelbild', blocks: [{ type: 'copy', html: '<p><strong>Original</strong></p>', htmlEn: '<p><strong>Original</strong></p>' }, { type: 'gallery', images: [{ src: './card.jpg', alt: 'Erste Verwendung', altEn: 'Erste Verwendung' }, { src: './card.jpg', alt: 'Zweite Verwendung', altEn: 'Zweite Verwendung', caption: 'Anderer Kontext', captionEn: 'Anderer Kontext' }] }] };
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

test('interactive transfer cancellation writes nothing and confirmation cannot approve stale data', async (t) => {
	const f = await fixture(t);
	const original = await reviewImport(f.root, f.source);
	const messages = [];
	let opened = false;
	assert.equal(await transferVehicle(f.root, f.source, null, {
		write: message => messages.push(message),
		openReview: async () => { opened = true; },
		confirm: async () => { assert.ok(messages.includes('Prüfung erfolgreich.')); return ''; },
	}), null);
	assert.deepEqual((await reviewImport(f.root, f.source)).before, original.before);
	assert.ok(!(await readdir(f.root)).includes('.cache'));
	assert.equal(opened, false, 'transfer must not open another page');
	assert.ok(messages.length <= 4, 'transfer logs should stay short');
	assert.ok(!messages.some(message => /HTML|Prüfung öffnen|Prüfsumme/.test(message)));
	await assert.rejects(transferVehicle(f.root, f.source, null, {
		write() {},
		async confirm() {
			f.record.title = 'Changed after review';
			await writeFile(join(f.source, 'test-car/vehicle.json'), JSON.stringify(f.record));
			return 'JA';
		},
	}), /Stale approval/);
	assert.deepEqual(await readdir(join(f.root, 'src/pages/projekte', categories[0])), []);
});

test('transfer CLI refuses piped approval and unsupported arguments before writing', async (t) => {
	const f = await fixture(t);
	const script = fileURLToPath(new URL('../scripts/transfer-vehicle.mjs', import.meta.url));
	for (const args of [[], [f.source], [f.source, '--yes']]) {
		const result = spawnSync(process.execPath, [script, ...args], { cwd: f.root, input: 'JA\n', encoding: 'utf8' });
		assert.equal(result.status, 1);
		assert.match(result.stderr, /interaktiven Terminal|Aufruf:/);
	}
	assert.ok(!(await readdir(f.root)).includes('.cache'));
	assert.deepEqual(await readdir(join(f.root, 'src/pages/projekte', categories[0])), []);
});

for (const scenario of ['new', 'category', 'content', 'content-and-category']) {
	test(`transfer wizard handles ${scenario} without command options`, async (t) => {
		const f = await fixture(t);
		const old = `${categories[0]}/test-car`;
		if (scenario !== 'new') {
			const review = await reviewImport(f.root, f.source);
			await applyImport(review, review.token);
		}
		let source = f.source;
		const moves = scenario.includes('category');
		if (moves) {
			const { rename } = await import('node:fs/promises');
			source = join(f.dir, 'export', categories[1]);
			await rename(f.source, source);
			f.record.category = categories[1];
			f.record.sourceUrl = `${productionOrigin}/projekte/${categories[1]}/test-car/`;
		}
		if (scenario.includes('content')) f.record.title = 'Edited vehicle';
		await writeFile(join(source, 'test-car/vehicle.json'), JSON.stringify(f.record));
		const messages = [], answers = [`"${join(f.dir, 'export')}"`, ...(scenario === 'new' ? [] : ['1']), 'JA'];
		const result = await transferWizard(f.root, { write: text => messages.push(text), confirm: async () => answers.shift() });
		assert.ok(result.backup);
		assert.equal(result.previewReady, true);
		const manifest = JSON.parse(await readFile(join(f.root, '.cache/vehicle-gallery-v3/production.json')));
		const route = `/vehicle-gallery/${f.record.category}/test-car/card.webp`;
		assert.ok(manifest.images[route], 'transferred vehicle is missing from the preview manifest');
		assert.ok((await readFile(join(f.root, 'public', route))).length);
		assert.equal(answers.length, 0);
		assert.deepEqual(JSON.parse(await readFile(join(f.root, 'src/pages/projekte', f.record.category, 'test-car/vehicle.json'))), f.record);
		assert.deepEqual(await readFile(join(f.root, 'src/pages/projekte', f.record.category, 'test-car/card.jpg')), f.image);
		if (scenario !== 'new') assert.ok(messages.some(text => text.includes(old)));
		if (moves) {
			assert.deepEqual(await readdir(join(f.root, 'src/pages/projekte', categories[0])), []);
			assert.deepEqual(JSON.parse(await readFile(join(f.root, 'src/config/vehicle-redirects.json'))), { [old]: `${categories[1]}/test-car` });
		}
	});
}

test('wizard requires explicit original selection and refuses project folders', async (t) => {
	const f = await fixture(t);
	const initial = await reviewImport(f.root, f.source);
	await applyImport(initial, initial.token);
	f.record.title = 'Must not replace';
	await writeFile(join(f.source, 'test-car/vehicle.json'), JSON.stringify(f.record));
	const before = await reviewImport(f.root, f.source, `${categories[0]}/test-car`);
	for (const choice of ['', '0', 'JA', '99']) {
		const answers = [f.source, choice];
		assert.equal(await transferWizard(f.root, { write() {}, confirm: async () => answers.shift() }), null);
	}
	assert.deepEqual((await reviewImport(f.root, f.source, `${categories[0]}/test-car`)).before, before.before);
	await assert.rejects(transferWizard(f.root, { write() {}, confirm: async () => f.root }), /außerhalb/);
	assert.equal(folderInput('"/private/tmp/folder with spaces"', 'darwin'), '/private/tmp/folder with spaces');
	assert.equal(folderInput('/private/tmp/folder\\ with\\ spaces ', 'darwin'), '/private/tmp/folder with spaces');
	assert.throws(() => folderInput(''), /Kein Ordner/);
});

test('preview preparation failure reports a saved vehicle and retains its backup', async (t) => {
	const f = await fixture(t);
	await mkdir(join(f.root, '.cache/vehicle-gallery-v3'), { recursive: true });
	await writeFile(join(f.dir, 'foreign-cache.json'), '{}');
	await symlink(join(f.dir, 'foreign-cache.json'), join(f.root, '.cache/vehicle-gallery-v3/production.json'));
	const messages = [];
	const result = await transferVehicle(f.root, f.source, null, { write: text => messages.push(text), confirm: async () => 'JA' });
	assert.equal(result.previewReady, false);
	assert.deepEqual(JSON.parse(await readFile(join(f.root, 'src/pages/projekte', f.record.category, 'test-car/vehicle.json'))), f.record);
	assert.ok(messages.some(text => text.includes('Fahrzeug gespeichert. Vorschau fehlgeschlagen:')));
	assert.match(await readFile(join(result.backup, 'COMPLETED'), 'utf8'), /completed/);
	assert.equal(JSON.parse(await readFile(join(f.root, '.cache/vehicle-preview-state.json'))).phase, 'blocked');
});

test('preview does not serve a project with an active or interrupted import lock', async (t) => {
	const f = await fixture(t);
	await mkdir(join(f.root, '.cache/vehicle-import.lock'), { recursive: true });
	await assert.rejects(refreshVehiclePreview(f.root), /Übernahme läuft oder wurde unterbrochen/);
	assert.ok((await readdir(join(f.root, '.cache'))).includes('vehicle-import.lock'));
	assert.ok(!(await readdir(join(f.root, '.cache'))).includes('vehicle-gallery-v3'));
});

for (const suffix of [' 4', ' (2)']) {
	for (const scenario of ['new', 'category', 'content', 'content-and-category']) {
		test(`collision-renamed export ${suffix} supports ${scenario}`, async (t) => {
			const f = await fixture(t);
			if (scenario !== 'new') {
				const review = await reviewImport(f.root, f.source);
				await applyImport(review, review.token);
			}
			if (scenario.includes('category')) f.record.category = categories[1];
			if (scenario.includes('content')) f.record.title = 'Edited in renamed export';
			f.record.sourceUrl = `${productionOrigin}/projekte/${f.record.category}/test-car/`;
			await writeFile(join(f.source, 'test-car/vehicle.json'), JSON.stringify(f.record));
			const { rename } = await import('node:fs/promises');
			const renamed = join(f.dir, 'export', f.record.category + suffix);
			await rename(f.source, renamed);
			// Same escaped space format produced by dragging the reported Finder folder.
			const answers = [renamed.replaceAll(' ', '\\ '), ...(scenario === 'new' ? [] : ['1']), 'JA'];
			const result = await transferWizard(f.root, { write() {}, confirm: async () => answers.shift() });
			assert.ok(result.backup);
			assert.equal(answers.length, 0);
			assert.deepEqual(JSON.parse(await readFile(join(f.root, 'src/pages/projekte', f.record.category, 'test-car/vehicle.json'))), f.record);
			if (scenario.includes('category')) {
				assert.deepEqual(await readdir(join(f.root, 'src/pages/projekte', categories[0])), []);
				assert.deepEqual(JSON.parse(await readFile(join(f.root, 'src/config/vehicle-redirects.json'))), { [`${categories[0]}/test-car`]: `${categories[1]}/test-car` });
			}
		});
	}
}

test('renamed export folders still reject metadata mismatch and ambiguous exports', async (t) => {
	const f = await fixture(t);
	const { rename } = await import('node:fs/promises');
	const wrong = join(f.dir, 'export', `${categories[1]} 4`);
	await rename(f.source, wrong);
	await assert.rejects(transferWizard(f.root, { write() {}, confirm: async () => wrong }), /Metadata and export location disagree/);
	await mkdir(join(f.dir, 'export', `${categories[0]} 2`));
	await assert.rejects(transferWizard(f.root, { write() {}, confirm: async () => join(f.dir, 'export') }), /einzelnen entpackten/);
});

test('interactive transfer moves the exact original with backup, redirects and crawler updates', async (t) => {
	const f = await fixture(t);
	const initial = await reviewImport(f.root, f.source);
	await applyImport(initial, initial.token);
	const old = `${categories[0]}/test-car`;
	await writeFile(join(f.root, 'public/llms.txt'), `# Website\n\n> Beschreibung\n\n## Seiten\n\n[Fahrzeug](${productionOrigin}/projekte/${old}/)\n`);
	const { rename } = await import('node:fs/promises');
	const movedSource = join(f.dir, 'export', categories[1]);
	await rename(f.source, movedSource);
	f.record.category = categories[1];
	f.record.sourceUrl = `${productionOrigin}/projekte/${categories[1]}/test-car/`;
	await writeFile(join(movedSource, 'test-car/vehicle.json'), JSON.stringify(f.record));
	await assert.rejects(transferVehicle(f.root, movedSource, 'fahrzeugangebote/test-car', { write() {}, confirm: async () => 'JA' }), /original vehicle does not exist/);
	const result = await transferVehicle(f.root, movedSource, old, { write() {}, confirm: async () => 'JA' });
	assert.match(await readFile(join(result.backup, 'COMPLETED'), 'utf8'), /completed/);
	assert.deepEqual(await readdir(join(f.root, 'src/pages/projekte', categories[0])), []);
	assert.deepEqual(JSON.parse(await readFile(join(f.root, 'src/config/vehicle-redirects.json'))), { [old]: `${categories[1]}/test-car` });
	for (const file of ['sitemap.xml', 'llms.txt']) {
		const text = await readFile(join(f.root, 'public', file), 'utf8');
		assert.ok(text.includes(`/projekte/${categories[1]}/test-car/`));
		assert.ok(!text.includes(`/projekte/${old}/`));
	}
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

test('rollback preserves concurrent edits and foreign locks', async t => {
  for (const foreign of [false, true]) {
    const f = await fixture(t);
    let review = await reviewImport(f.root, f.source); await applyImport(review, review.token);
    f.record.title = 'Changed'; await writeFile(join(f.source, 'test-car/vehicle.json'), JSON.stringify(f.record));
    review = await reviewImport(f.root, f.source, `${f.record.category}/test-car`);
    let path;
    await assert.rejects(applyImport(review, review.token, { async afterWrite(written) {
      path = written;
      if (foreign) await writeFile(join(f.root, '.cache/vehicle-import.lock/cli.json'), JSON.stringify({id:'foreign'}));
      else await writeFile(join(f.root, written), 'External edit');
      throw new Error('Interrupted');
    } }), /Rollback also failed/);
    assert.ok((await readdir(join(f.root, '.cache'))).includes('vehicle-import.lock'));
    if (!foreign) assert.equal(await readFile(join(f.root, path), 'utf8'), 'External edit');
  }
});

test('writes stop when a later destination changes during apply', async t => {
  const f = await fixture(t), review = await reviewImport(f.root, f.source);
  const next = review.summary.find(entry => entry.path.endsWith('/vehicle.json')).path;
  let injected = false;
  await assert.rejects(applyImport(review, review.token, { async afterWrite() {
    if (injected) return; injected = true;
    await mkdir(join(f.root, 'src/pages/projekte', f.record.category, f.record.slug), {recursive:true});
    await writeFile(join(f.root, next), 'External edit');
  } }), /changed before writing/);
  assert.equal(await readFile(join(f.root, next), 'utf8'), 'External edit');
});
