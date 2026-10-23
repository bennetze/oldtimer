import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, readdir, rm, realpath } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import vm from 'node:vm';
import { request as httpRequest } from 'node:http';
import sharp from 'sharp';
import { createControlPanel } from '../scripts/lib/control-panel.mjs';
import { createVehiclePage } from '../scripts/lib/vehicle-import.mjs';
import { categories, productionOrigin, sitemapEntries, renderSitemap } from '../scripts/lib/crawlers.mjs';
import { discoverVehicleCategory } from '../scripts/lib/vehicle-files.mjs';

async function fixture(t, options) {
	const dir = await realpath(await mkdtemp(join(tmpdir(), 'control-panel-test-')));
	const root = join(dir, 'site');
	for (const category of categories) await mkdir(join(root, 'src/pages/projekte', category), { recursive: true });
	await mkdir(join(root, 'src/config'), { recursive: true });
	await mkdir(join(root, 'public'), { recursive: true });
	const image = await sharp({ create: { width: 4, height: 3, channels: 3, background: '#ddd' } }).jpeg().toBuffer();
	const record = { category: categories[0], slug: 'test-car', order: 1, title: 'Testwagen', titleEn: 'Test car', description: 'Testfahrzeug', descriptionEn: 'Test vehicle', dateModified: '2026-10-14', sourceUrl: `${productionOrigin}/projekte/${categories[0]}/test-car/`, cardImage: './card.jpg', cardImageAlt: 'Testwagen', cardImageAltEn: 'Test car', leadImage: './card.jpg', leadImageAlt: 'Testwagen', leadImageAltEn: 'Test car', blocks: [] };
	const folder = join(root, 'src/pages/projekte', categories[0], record.slug);
	await mkdir(folder);
	await writeFile(join(folder, 'vehicle.json'), JSON.stringify(record));
	await writeFile(join(folder, 'card.jpg'), image);
	await writeFile(folder + '.astro', createVehiclePage(record.category, record.slug));
	const groups = await Promise.all(categories.map(key => discoverVehicleCategory(join(root, 'src/pages/projekte'), { key })));
	await writeFile(join(root, 'public/sitemap.xml'), renderSitemap(sitemapEntries(groups)));
	await writeFile(join(root, 'public/llms.txt'), `# Website\n\n> Beschreibung\n\n## Seiten\n\n[Start](${productionOrigin}/)\n`);
	await writeFile(join(root, 'public/robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${productionOrigin}/sitemap.xml\n`);
	await writeFile(join(root, 'src/config/vehicle-redirects.json'), '{}\n');
	const panel = await createControlPanel(root, { editorRoot: fileURLToPath(new URL('../../oldtimer-intern/', import.meta.url)), ...options });
	t.after(async () => { await panel.close(); await rm(dir, { recursive: true, force: true }); });
	async function request(path, data, bytes, extra = {}) {
		return fetch(panel.origin + '/api/' + path, {
			method: data === undefined && bytes === undefined ? 'GET' : 'POST',
			headers: { Authorization: `Bearer ${panel.token}`, 'Content-Type': 'application/json', ...extra },
			body: bytes === undefined ? data === undefined ? undefined : JSON.stringify(data) : bytes,
		});
	}
	async function api(path, data, bytes) { const response = await request(path, data, bytes); const result = await response.json(); assert.equal(response.status, 200, JSON.stringify(result)); return result; }
	async function wait(predicate) {
		for (let i = 0; i < 200; i++) { const state = await api('state'); if (predicate(state)) return state; await new Promise(resolve => setTimeout(resolve, 20)); }
		throw new Error('Timed out waiting for panel.');
	}
	async function answer(task, value) { return api('answer', { task: task.id, prompt: task.prompt.id, value }); }
	async function selectedSnapshot() {
		const snapshot = {};
		async function walk(path) {
			snapshot[path + '/'] = 'directory';
			for (const name of await readdir(join(root, path))) {
				const child = path + '/' + name;
				try { await readdir(join(root, child)); await walk(child); }
				catch (error) { if (error.code !== 'ENOTDIR') throw error; snapshot[child] = createHash('sha256').update(await readFile(join(root, child))).digest('hex'); }
			}
		}
		await walk('src/pages/projekte');
		for (const path of ['src/config/vehicle-redirects.json', 'src/config/modificationDates.js', 'public/sitemap.xml', 'public/llms.txt', 'public/robots.txt']) {
			try { snapshot[path] = createHash('sha256').update(await readFile(join(root, path))).digest('hex'); }
			catch (error) { if (error.code !== 'ENOENT') throw error; snapshot[path] = null; }
		}
		return { name: 'site', snapshot };
	}
	async function upload(next = record, top = 'Export mit Leerzeichen', mode = {}) {
		const { id } = await api('upload/start', { top, ...(mode.draft ? { project: await selectedSnapshot() } : {}), ...mode });
		const prefix = mode.draft ? top : `${top}/${next.category} 4`;
		for (const [path, bytes] of [
			[`${prefix}/${next.slug}.astro`, createVehiclePage(next.category, next.slug)],
			[`${prefix}/${next.slug}/vehicle.json`, JSON.stringify(next)],
			[`${prefix}/${next.slug}/card.jpg`, image],
		]) await api('upload/file?id=' + id + '&path=' + encodeURIComponent(path), {}, bytes);
		return id;
	}
	return { root, folder, record, panel, request, api, wait, answer, upload, selectedSnapshot };
}

test('panel rejects foreign origins, missing tokens, arbitrary commands and traversal', async t => {
	const f = await fixture(t);
	assert.equal((await fetch(f.panel.origin + '/api/state')).status, 403);
	assert.equal((await f.request('state', undefined, undefined, { Origin: 'https://example.com' })).status, 403);
	const hostStatus = await new Promise(resolve => {
		const request = httpRequest(f.panel.origin + '/api/state', { headers: { Host: 'evil.example', Authorization: `Bearer ${f.panel.token}` } }, response => { response.resume(); resolve(response.statusCode); });
		request.end();
	});
	assert.equal(hostStatus, 403);
	assert.equal((await f.request('start', { name: 'shell' })).status, 400);
	const { id } = await f.api('upload/start', { top: 'Export' });
	for (const path of ['Export/../../escape', 'Export/../escape', 'Export/C:\\escape', '/escape']) {
		assert.equal((await f.request('upload/file?id=' + id + '&path=' + encodeURIComponent(path), {}, 'bad')).status, 400);
	}
	const page = await fetch(f.panel.origin);
	assert.match(page.headers.get('content-security-policy'), /frame-ancestors 'none'/);
	const html = await page.text();
	assert.match(html, /Oldtimer-Fahrzeugeditor/);
	assert.match(html, /name="vehicle-tools"/);
	assert.match(html, /website-tools.js/);
	assert.equal((await fetch(f.panel.origin + '/AGENTS.md')).status, 403);
});

test('launcher serves every classic editor script, including the watermark helper', async t => {
	const f = await fixture(t);
	const html = await (await fetch(f.panel.origin)).text();
	const scripts = [...html.matchAll(/<script\s+src="([^"]+)"\s*><\/script>/g)].map(match => match[1]);
	assert.ok(scripts.includes('watermark.js'), 'Watermark helper is missing from the editor.');
	assert.ok(scripts.includes('project-ui.js') && scripts.includes('website-tools.js'), 'Internal project workflow is missing.');
	assert.ok(!scripts.includes('demo-ui.js'), 'Demo workflow must not be served by the launcher.');
	assert.match(html, /name="vehicle-editor" content="internal"/);
	assert.doesNotMatch(html, /Demo starten/);
	const headers = await fetch(f.panel.origin);
	assert.match(headers.headers.get('content-security-policy'), /font-src 'self' data:/);
	const editor = fileURLToPath(new URL('../../oldtimer-intern/', import.meta.url));
	for (const file of scripts) {
		const response = await fetch(new URL(file, f.panel.origin));
		assert.equal(response.status, 200, `${file} is unavailable in the launcher.`);
		assert.match(response.headers.get('content-type'), /^text\/javascript/);
		assert.equal(await response.text(), await readFile(join(editor, file), 'utf8'), `${file} must match the offline editor.`);
	}
});

async function editorCopy(t) {
	const directory = await realpath(await mkdtemp(join(tmpdir(), 'internal-editor-test-')));
	t.after(() => rm(directory, { recursive: true, force: true }));
	const source = fileURLToPath(new URL('../../oldtimer-intern/', import.meta.url));
	const html = await readFile(join(source, 'index.html'), 'utf8');
	const files = ['index.html', ...[...html.matchAll(/(?:src|href)="([^"/]+\.(?:js|css))"/g)].map(match => match[1])];
	for (const file of new Set(files)) await writeFile(join(directory, file), await readFile(join(source, file)));
	return directory;
}

test('launcher rejects a demo checkout and a mixed editor before serving any actions', async t => {
	const directory = await editorCopy(t);
	const html = await readFile(join(directory, 'index.html'), 'utf8');
	await writeFile(join(directory, 'index.html'), html.replace('content="internal"', 'content="demo"'));
	await assert.rejects(createControlPanel(directory, { editorRoot: directory }), /Demo nicht verwenden/);
	await writeFile(join(directory, 'index.html'), html);
	await writeFile(join(directory, 'editor.js'), 'window.VehicleDemoUI({});');
	await assert.rejects(createControlPanel(directory, { editorRoot: directory }), /Demo nicht verwenden/);
	await writeFile(join(directory, 'editor.js'), 'window.UnknownEditor({});');
	await assert.rejects(createControlPanel(directory, { editorRoot: directory }), /Editor-Dateien passen nicht zusammen/);
	await rm(join(directory, 'watermark.js'));
	await assert.rejects(createControlPanel(directory, { editorRoot: directory }), /fehlt oder ist unvollständig/);
});

test('a running launcher retains its complete editor when checkout files change', async t => {
	const directory = await editorCopy(t);
	const f = await fixture(t, { editorRoot: directory });
	const original = await (await fetch(f.panel.origin)).text();
	const script = await readFile(join(directory, 'editor.js'), 'utf8');
	await writeFile(join(directory, 'index.html'), '<h1>Demo starten</h1>');
	await writeFile(join(directory, 'editor.js'), 'window.VehicleDemoUI({});');
	assert.equal(await (await fetch(f.panel.origin)).text(), original);
	assert.equal(await (await fetch(f.panel.origin + '/editor.js')).text(), script);
	await assert.rejects(createControlPanel(directory, { editorRoot: directory }), /Demo nicht verwenden/);
});

test('direct draft save handles new, move, edit and combined save with the exact selected original', async t => {
	const f = await fixture(t);
	let car = { ...f.record, slug: 'direct-car', order: 2 }, from = null;
	for (const change of [{}, { category: categories[1] }, { title: 'Bearbeitet' }, { category: categories[2], title: 'Angebot' }]) {
		car = { ...car, ...change };
		car.sourceUrl = `${productionOrigin}/projekte/${car.category}/${car.slug}/`;
		const upload = await f.upload(car, car.category, { draft: true, from });
		await f.api('start', { name: 'transfer', upload });
		let state = await f.wait(s => s.task?.prompt || s.task?.status === 'error');
		assert.equal(state.task.prompt?.kind, 'approval', state.task.log);
		assert.match(state.task.prompt.question, /speichern/);
		if (from) assert.ok(state.task.log.includes(`Original: /projekte/${from}/`));
		assert.ok(state.task.log.includes(`Zielroute: /projekte/${car.category}/${car.slug}/`));
		await f.answer(state.task, 'JA');
		state = await f.wait(s => s.task.status !== 'running');
		assert.equal(state.task.status, 'done', state.task.log);
		assert.equal(state.task.committed, true);
		assert.match(state.task.log, /Sicherung:/);
		const saved = JSON.parse(await readFile(join(f.root, 'src/pages/projekte', car.category, car.slug, 'vehicle.json')));
		assert.equal(saved.title, car.title);
		assert.equal(saved.titleEn, car.titleEn);
		if (from && from !== `${car.category}/${car.slug}`) await assert.rejects(readFile(join(f.root, 'src/pages/projekte', from, 'vehicle.json')), /ENOENT/);
		from = `${car.category}/${car.slug}`;
	}
});

test('direct draft save never guesses replacement; cancellation and stale approval retain sources', async t => {
	const f = await fixture(t), before = await readFile(join(f.folder, 'vehicle.json'));
	const changed = { ...f.record, title: 'Geändert' };
	await f.api('start', { name: 'transfer', upload: await f.upload(changed, changed.category, { draft: true, from: null }) });
	let state = await f.wait(s => s.task.status !== 'running');
	assert.equal(state.task.status, 'error');
	assert.deepEqual(await readFile(join(f.folder, 'vehicle.json')), before);
	for (const answer of ['Nein', 'JA']) {
		await f.api('start', { name: 'transfer', upload: await f.upload(changed, changed.category, { draft: true, from: `${f.record.category}/${f.record.slug}` }) });
		state = await f.wait(s => s.task.prompt);
		assert.deepEqual(await readFile(join(f.folder, 'vehicle.json')), before);
		if (answer === 'JA') await writeFile(join(f.folder, 'card.jpg'), 'external edit');
		await f.answer(state.task, answer);
		state = await f.wait(s => s.task.status !== 'running');
		assert.equal(state.task.status, answer === 'JA' ? 'error' : 'done', state.task.log);
		assert.deepEqual(await readFile(join(f.folder, 'vehicle.json')), before);
	}
	assert.equal(await readFile(join(f.folder, 'card.jpg'), 'utf8'), 'external edit');
	for (const from of [undefined, '../car', 'JA', 'aktuelle-projekte/car/../../other']) {
		assert.equal((await f.request('upload/start', { top: 'aktuelle-projekte', draft: true, from })).status, 400);
	}
});

test('direct save refuses original source changed while draft files were being staged', async t => {
	const f = await fixture(t), project = await f.selectedSnapshot();
	const external = { ...f.record, title: 'Extern geändert' };
	await writeFile(join(f.folder, 'vehicle.json'), JSON.stringify(external));
	await f.api('start', { name: 'transfer', upload: await f.upload({ ...f.record, title: 'Entwurf' }, f.record.category, { draft: true, from: `${f.record.category}/${f.record.slug}`, project }) });
	const state = await f.wait(s => s.task.status !== 'running');
	assert.equal(state.task.status, 'error');
	assert.match(state.task.log, /seit der Auswahl geändert/);
	assert.equal(state.task.prompt, null);
	assert.equal(JSON.parse(await readFile(join(f.folder, 'vehicle.json'))).title, external.title);
	assert.ok(!(await readdir(f.root)).includes('.cache'));
});

test('launcher verifies the selected full project against its own source bytes', async t => {
	const f = await fixture(t), snapshot = {};
	snapshot['src/pages/projekte/'] = 'directory';
	for (const category of categories) snapshot[`src/pages/projekte/${category}/`] = 'directory';
	snapshot[`src/pages/projekte/${f.record.category}/${f.record.slug}/`] = 'directory';
	for (const path of [
		`src/pages/projekte/${f.record.category}/${f.record.slug}.astro`,
		`src/pages/projekte/${f.record.category}/${f.record.slug}/vehicle.json`,
		`src/pages/projekte/${f.record.category}/${f.record.slug}/card.jpg`,
		'src/config/vehicle-redirects.json', 'src/config/modificationDates.js', 'public/sitemap.xml', 'public/llms.txt', 'public/robots.txt',
	]) {
		try { snapshot[path] = createHash('sha256').update(await readFile(join(f.root, path))).digest('hex'); }
		catch (error) { if (error.code !== 'ENOENT') throw error; snapshot[path] = null; }
	}
	await f.api('project/check', { name: 'site', snapshot });
	assert.equal((await f.request('project/check', { name: 'other', snapshot })).status, 400);
	const card = `src/pages/projekte/${f.record.category}/${f.record.slug}/card.jpg`;
	assert.equal((await f.request('project/check', { name: 'site', snapshot: { ...snapshot, [card]: 'changed' } })).status, 400);
	await writeFile(join(f.folder, 'card.jpg'), 'external change');
	assert.equal((await f.request('project/check', { name: 'site', snapshot })).status, 400);
});

test('unmodified file entry has no launcher marker and tools script makes no requests', async () => {
	const editor = fileURLToPath(new URL('../../oldtimer-intern/', import.meta.url));
	assert.doesNotMatch(await readFile(join(editor, 'index.html'), 'utf8'), /name="vehicle-tools"/);
	vm.runInNewContext(await readFile(join(editor, 'website-tools.js'), 'utf8'), {
		document: { querySelector: () => null },
		fetch() { throw new Error('Offline editor attempted a network request.'); },
	});
});

test('browser transfer requires exact selection, preserves sources on cancel and rejects stale prompts', async t => {
	const f = await fixture(t), original = await readFile(join(f.folder, 'vehicle.json'));
	await f.api('start', { name: 'transfer', upload: await f.upload({ ...f.record, title: 'Geändert' }) });
	let state = await f.wait(s => s.task?.prompt?.kind === 'choice');
	assert.match(state.task.prompt.choices[0].label, /aktuelle-projekte\/test-car/);
	assert.equal((await f.request('start', { name: 'delete' })).status, 400);
	await f.answer(state.task, '1');
	state = await f.wait(s => s.task?.prompt?.kind === 'approval');
	const prompt = state.task;
	assert.match(prompt.log, /Ausgewählt:.*aktuelle-projekte\/test-car/);
	assert.match(prompt.log, /Zielroute: \/projekte\/aktuelle-projekte\/test-car\//);
	assert.deepEqual(await readFile(join(f.folder, 'vehicle.json')), original);
	await f.answer(prompt, 'Nein');
	await f.wait(s => s.task?.status === 'done');
	assert.equal((await f.request('answer', { task: prompt.id, prompt: prompt.prompt.id, value: 'JA' })).status, 400);
	assert.deepEqual(await readFile(join(f.folder, 'vehicle.json')), original);
	assert.ok(!(await readdir(f.root)).includes('.cache'));
});

test('browser performs checked new, move, edit and combined transfer then deletion with backups', async t => {
	const f = await fixture(t);
	let car = { ...f.record, slug: 'new-car', order: 2, sourceUrl: `${productionOrigin}/projekte/${categories[0]}/new-car/` };
	for (const change of [{}, { category: categories[1] }, { title: 'Bearbeitet' }, { category: categories[2], title: 'Angebot' }]) {
		car = { ...car, ...change, sourceUrl: `${productionOrigin}/projekte/${change.category || car.category}/${car.slug}/` };
		await f.api('start', { name: 'transfer', upload: await f.upload(car) });
		let state = await f.wait(s => s.task?.prompt || s.task?.status === 'error');
		if (state.task.prompt?.kind === 'choice') { await f.answer(state.task, '1'); state = await f.wait(s => s.task?.prompt?.kind === 'approval' || s.task?.status === 'error'); }
		assert.equal(state.task.prompt?.kind, 'approval', state.task.log);
		await f.answer(state.task, 'JA');
		state = await f.wait(s => s.task?.status !== 'running');
		assert.equal(state.task.status, 'done', state.task.log);
		assert.match(state.task.log, /Sicherung:/);
		assert.equal(JSON.parse(await readFile(join(f.root, 'src/pages/projekte', car.category, car.slug, 'vehicle.json'))).title, car.title);
		assert.equal(JSON.parse(await readFile(join(f.root, '.cache/vehicle-preview-state.json'))).phase, 'ready');
	}
	await f.api('start', { name: 'delete' });
	let state = await f.wait(s => s.task?.prompt?.kind === 'search');
	await f.answer(state.task, 'new-car');
	state = await f.wait(s => s.task?.prompt?.kind === 'choice');
	assert.match(state.task.prompt.choices[0].label, /fahrzeugangebote\/new-car/);
	await f.answer(state.task, '1');
	state = await f.wait(s => s.task?.prompt?.kind === 'approval');
	await f.answer(state.task, 'JA');
	state = await f.wait(s => s.task?.status !== 'running');
	assert.equal(state.task.status, 'done', state.task.log);
	assert.match(state.task.log, /Fahrzeug gelöscht/);
	assert.match(state.task.log, /Sicherung:/);
	assert.deepEqual(await readdir(join(f.root, 'src/pages/projekte', categories[2])), []);
	assert.equal(JSON.parse(await readFile(join(f.folder, 'vehicle.json'))).title, f.record.title);
});

test('changed vehicle bytes after browser review block deletion', async t => {
	const f = await fixture(t);
	await f.api('start', { name: 'delete' });
	let state = await f.wait(s => s.task?.prompt?.kind === 'search'); await f.answer(state.task, 'test-car');
	state = await f.wait(s => s.task?.prompt?.kind === 'choice'); await f.answer(state.task, '1');
	state = await f.wait(s => s.task?.prompt?.kind === 'approval');
	await writeFile(join(f.folder, 'card.jpg'), 'external change');
	await f.answer(state.task, 'JA');
	state = await f.wait(s => s.task?.status !== 'running');
	assert.equal(state.task.status, 'error');
	assert.match(state.task.log, /seit der Prüfung geändert/);
	assert.equal(await readFile(join(f.folder, 'card.jpg'), 'utf8'), 'external change');
});

test('preview lifecycle and publication approval use fixed commands', async t => {
	const calls = []; let finishPreview;
	const f = await fixture(t, { runCommand(root, name, output) {
		calls.push(name);
		if (name === 'dev') {
			output('Vorschau bereit: http://localhost:4329\n');
			const done = new Promise(resolve => { finishPreview = resolve; });
			return { done, stop: async () => finishPreview({ code: 0 }) };
		}
		output('completed\n'); return { done: Promise.resolve({ code: 0 }) };
	} });
	await f.api('preview/start', {});
	assert.equal((await f.api('state')).preview.url, 'http://localhost:4329');
	assert.equal((await f.request('start', { name: 'build' })).status, 400);
	await f.api('preview/stop', {});
	await f.wait(s => !s.preview.running);
	await f.api('start', { name: 'build' }); await f.wait(s => s.task?.status === 'done');
	await f.api('start', { name: 'deploy' });
	let state = await f.wait(s => s.task?.prompt); await f.answer(state.task, 'Nein'); await f.wait(s => s.task?.status === 'done');
	assert.deepEqual(calls, ['dev', 'build']);
	await f.api('start', { name: 'deploy' });
	state = await f.wait(s => s.task?.prompt); await f.answer(state.task, 'JA'); await f.wait(s => s.task?.status === 'done');
	assert.deepEqual(calls, ['dev', 'build', 'deploy']);
});
