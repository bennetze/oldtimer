import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile, rm, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ionosConnection, deploymentFiles, uploadIonos, verifyIonosHost } from '../scripts/lib/ionos-deploy.mjs';

async function fixture(t) {
	const root = await mkdtemp(join(tmpdir(), 'ionos-deploy-'));
	t.after(() => rm(root, { recursive: true, force: true }));
	await mkdir(join(root, '_astro'));
	await writeFile(join(root, 'index.html'), '<link rel="canonical" href="https://www.oldtimermanufaktur.de/">');
	await writeFile(join(root, '404.html'), '<meta name="robots" content="noindex">');
	await writeFile(join(root, '.htaccess'), 'ErrorDocument 404 /404.html');
	await writeFile(join(root, '_astro/style.css'), 'body {}');
	return root;
}

function remote() {
	const data = new Map([['/', 'd'], ['/index.php', Buffer.from('existing application')], ['/index.html', Buffer.from('old')]]);
	const renames = [], puts = [];
	const client = {
		sftp: { mkdir(path, callback) { if (data.has(path)) callback(new Error('exists')); else { data.set(path, 'd'); callback(); } } },
		async exists(path) { return !data.has(path) ? false : Buffer.isBuffer(data.get(path)) ? '-' : data.get(path); },
		async mkdir(path) { assert.ok(!data.has(path)); data.set(path, 'd'); },
		async put(source, path) { data.set(path, Buffer.isBuffer(source) ? source : await readFile(source)); puts.push(path); },
		async stat(path) { return { size: data.get(path).length }; },
		async chmod() {},
		async posixRename(from, to) { data.set(to, data.get(from)); data.delete(from); renames.push(to); },
		async delete(path) { data.delete(path); },
		async rmdir(path) { data.delete(path); },
		async get(path) { if (!data.has(path)) throw new Error('missing'); return data.get(path); },
	};
	return { client, data, renames, puts };
}

test('IONOS config stays local, permits environment overrides and verifies host keys', async t => {
	const root = await fixture(t);
	await assert.rejects(ionosConnection(root, {}), /Zugang fehlt/);
	await writeFile(join(root, '.env.ionos'), 'IONOS_USER=fixture\nIONOS_PASSWORD="test # password"\n');
	const config = await ionosConnection(root, { IONOS_USER: 'override' });
	assert.equal(config.username, 'override');
	assert.equal(config.password, 'test # password');
	assert.equal(config.port, 22);
	assert.equal(config.hostVerifier(Buffer.from('untrusted key')), false);
	assert.equal(verifyIonosHost(Buffer.from('untrusted key')), false);
	await assert.rejects(ionosConnection(root, { IONOS_HOST: 'example.com' }), /IONOS_HOST/);
});

test('artifact validation rejects Pages output, leaked credentials and symlinks before uploading', async t => {
	const root = await fixture(t);
	assert.equal((await deploymentFiles(root)).length, 4);
	await writeFile(join(root, 'index.html'), '<link rel="canonical" href="https://bennetze.github.io/oldtimer/">');
	await assert.rejects(deploymentFiles(root), /Produktionsbuild/);
	await writeFile(join(root, 'index.html'), '<link rel="canonical" href="https://www.oldtimermanufaktur.de/">');
	await writeFile(join(root, '.env.ionos'), 'IONOS_PASSWORD=private');
	await assert.rejects(deploymentFiles(root), /deployment artifact/);
	await rm(join(root, '.env.ionos'));
	if (process.platform !== 'win32') {
		await symlink(join(root, 'index.html'), join(root, 'linked.html'));
		await assert.rejects(deploymentFiles(root), /symlink/);
	}
});

test('deployment strips OS metadata from every folder without relaxing artifact checks', async t => {
	const root = await fixture(t);
	for (const relative of ['.DS_Store', '_astro/.DS_Store', '_astro/Thumbs.db']) await writeFile(join(root, relative), 'OS metadata');
	const files = await deploymentFiles(root);
	assert.equal(files.length, 4);
	assert.ok(files.every(file => !/\.DS_Store|Thumbs\.db/.test(file.relative)));
	for (const relative of ['.DS_Store', '_astro/.DS_Store', '_astro/Thumbs.db']) await assert.rejects(readFile(join(root, relative)), { code: 'ENOENT' });
	await writeFile(join(root, '_astro/private.key'), 'not deployable');
	await assert.rejects(deploymentFiles(root), /deployment artifact/);
});

test('upload places dist contents at /, replaces files atomically, and leaves unrelated files', async t => {
	const root = await fixture(t), r = remote();
	await uploadIonos(r.client, await deploymentFiles(root), () => {});
	assert.deepEqual(r.renames, ['/_astro/style.css', '/404.html', '/index.html', '/.htaccess']);
	assert.equal(r.data.get('/index.php').toString(), 'existing application');
	assert.equal(r.data.get('/index.html').toString(), await readFile(join(root, 'index.html'), 'utf8'));
	assert.ok(![...r.data.keys()].some(path => /upload-|deploy.lock|\/dist\//.test(path)));
});

test('foreign locks and symlink destinations block publication without overwriting data', async t => {
	const root = await fixture(t), files = await deploymentFiles(root);
	const r = remote();
	r.data.set('/.website-deploy.lock', 'd');
	await assert.rejects(uploadIonos(r.client, files, () => {}), /gesperrt/);
	assert.ok(r.data.has('/.website-deploy.lock'));
	assert.deepEqual(r.puts, []);
	for (const path of ['/_astro', '/index.html']) {
		const r = remote(); r.data.set(path, 'l');
		await assert.rejects(uploadIonos(r.client, files, () => {}), /regulär/);
		assert.deepEqual(r.renames, []);
		assert.equal(r.data.get(path), 'l');
	}
});

test('failed transfers preserve the destination, clean owned temporary files and report partial progress', async t => {
	const root = await fixture(t), r = remote();
	const put = r.client.put;
	r.client.put = async (source, path) => { if (String(source).endsWith('index.html')) throw new Error('network failure'); return put(source, path); };
	await assert.rejects(uploadIonos(r.client, await deploymentFiles(root), () => {}), /2 Dateien bereits veröffentlicht/);
	assert.equal(r.data.get('/index.html').toString(), 'old');
	assert.ok(!r.data.has('/.website-deploy.lock'));
	assert.ok(![...r.data.keys()].some(path => /upload-/.test(path)));
});

test('parallel transfers have unique temporary files, bounded concurrency and finish assets before pages', async t => {
	const root = await fixture(t), r = remote();
	for (let i = 0; i < 16; i++) await writeFile(join(root, '_astro', `asset-${i}.css`), String(i));
	let active = 0, maximum = 0;
	const pending = new Set(), put = r.client.put, rmdir = r.client.rmdir;
	r.client.put = async (source, path, options) => {
		if (Buffer.isBuffer(source)) return put(source, path);
		assert.ok(!pending.has(path), 'Concurrent uploads share a temporary file');
		assert.equal(options.writeStreamOptions.mode, 0o644);
		pending.add(path); maximum = Math.max(maximum, ++active);
		await new Promise(resolve => setTimeout(resolve, 5));
		await put(source, path);
		pending.delete(path); active--;
	};
	r.client.rmdir = async path => { assert.equal(active, 0); return rmdir(path); };
	await uploadIonos(r.client, await deploymentFiles(root), () => {});
	assert.ok(maximum > 1 && maximum <= 8);
	assert.ok(r.renames.slice(0, 17).every(path => path.startsWith('/_astro/')));
	assert.deepEqual(r.renames.slice(-3), ['/404.html', '/index.html', '/.htaccess']);
});
