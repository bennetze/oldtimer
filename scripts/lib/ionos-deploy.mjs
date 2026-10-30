import { createHash, randomUUID } from 'node:crypto';
import { readFile, readdir, lstat } from 'node:fs/promises';
import { join, posix } from 'node:path';
import { parseEnv } from 'node:util';
import { verifyDeploymentArtifacts } from './deployment-artifacts.mjs';

// Published IONOS webhosting host keys, checked 2026-10-30:
// https://www.ionos.de/hilfe/hosting/ssh-zugaenge-einrichten-und-verwalten/uebersicht-der-ssh-fingerabdruecke-im-ionos-webhosting/
const fingerprints = new Set([
	'J4oM+B2g7zZWAI3DolXR1e4vdIMrGO301kEN14/slsQ',
	'psLDE8kfhoS9GWrc/GTrdlPvyKPcWcGZv2JxOCvwF3w',
	'1gx2w8Rtv3wCgi7Jh8myf/KVd72cRQbow03UP8P095Q',
]);
export const verifyIonosHost = key => fingerprints.has(createHash('sha256').update(key).digest('base64').replace(/=+$/, ''));

// Wait for every in-flight request before cleanup, even when one worker fails.
async function concurrent(items, work) {
	let next = 0, failure;
	await Promise.all(Array.from({ length: Math.min(8, items.length) }, async () => {
		while (!failure) {
			const index = next++;
			if (index >= items.length) return;
			try { await work(items[index], index); } catch (error) { failure ??= error; }
		}
	}));
	if (failure) throw failure;
}

const priority = file => file.relative === '.htaccess' ? 3 : file.relative === 'index.html' ? 2 : file.relative.endsWith('.html') ? 1 : 0;

export async function ionosConnection(root, environment = process.env) {
	let local = {};
	try { local = parseEnv(await readFile(join(root, '.env.ionos'), 'utf8')); }
	catch (error) { if (error.code !== 'ENOENT') throw error; }
	const env = { ...local, ...environment };
	const host = env.IONOS_HOST || 'home122505102.1and1-data.host';
	if (!/^[a-z0-9.-]+\.(?:1and1-data\.host|webspace-data\.io)$/.test(host)) throw new Error('IONOS_HOST muss ein IONOS-Webspace-Server sein.');
	if (!env.IONOS_USER || (!env.IONOS_PASSWORD && !env.IONOS_PRIVATE_KEY)) {
		throw new Error('IONOS-Zugang fehlt. Bitte .env.ionos anhand von .env.ionos.example lokal ausfüllen.');
	}
	return {
		host, port: 22, username: env.IONOS_USER,
		...(env.IONOS_PRIVATE_KEY ? { privateKey: await readFile(env.IONOS_PRIVATE_KEY), passphrase: env.IONOS_PASSPHRASE } : { password: env.IONOS_PASSWORD }),
		hostVerifier: verifyIonosHost, readyTimeout: 30000, keepaliveInterval: 10000,
	};
}

export async function deploymentFiles(dist) {
	if (!(await lstat(dist)).isDirectory() || (await lstat(dist)).isSymbolicLink()) throw new Error('dist/ muss ein echter Ordner sein.');
	await verifyDeploymentArtifacts(dist, { removeOsMetadata: true });
	const html = await readFile(join(dist, 'index.html'), 'utf8');
	if (!/<link\b[^>]*rel="canonical"[^>]*href="https:\/\/www\.oldtimermanufaktur\.de\/"/.test(html)
		&& !/<link\b[^>]*href="https:\/\/www\.oldtimermanufaktur\.de\/"[^>]*rel="canonical"/.test(html)) {
		throw new Error('dist/ enthält keinen Produktionsbuild für oldtimermanufaktur.de.');
	}
	if (!(await readFile(join(dist, '.htaccess'), 'utf8')).includes('ErrorDocument 404 /404.html')) throw new Error('Produktions-.htaccess fehlt oder ist ungültig.');
	await readFile(join(dist, '404.html'));
	const files = [];
	async function walk(directory, prefix = '') {
		for (const entry of await readdir(directory, { withFileTypes: true })) {
			// Finder can recreate these after validation while dist/ is open.
			if (entry.isFile() && ['.DS_Store', 'Thumbs.db'].includes(entry.name)) continue;
			const relative = posix.join(prefix, entry.name);
			if (entry.isDirectory()) await walk(join(directory, entry.name), relative);
			else if (entry.isFile()) files.push({ relative, local: join(directory, entry.name), size: (await lstat(join(directory, entry.name))).size });
			else throw new Error(`Nicht unterstützte Ausgabedatei: ${relative}`);
		}
	}
	await walk(dist);
	// Upload dependencies before pages; activate the root entry and Apache rules last.
	return files.sort((a, b) => priority(a) - priority(b) || a.relative.localeCompare(b.relative));
}

/** Upload dist's contents to the SFTP account root. Never delete unrelated files. */
export async function uploadIonos(client, files, output = console.log) {
	const lock = '/.website-deploy.lock';
	const id = randomUUID();
	// Non-recursive mkdir is exclusive. A foreign/interrupted lock is never removed.
	await new Promise((resolve, reject) => client.sftp.mkdir(lock, error => error
		? reject(new Error('IONOS-Veröffentlichung gesperrt oder keine Schreibrechte. Bitte /.website-deploy.lock prüfen; eine fremde Sperre nicht entfernen.')) : resolve()));
	let published = 0;
	try {
		await client.put(Buffer.from(id), lock + '/owner');
		const directories = new Set(['/']);
		let checked = 0;
		output(`${files.length} IONOS-Zielpfade werden geprüft …`);
		// Check every destination before changing published files, including symlink parents.
		await concurrent(files, async file => {
			const parts = file.relative.split('/');
			let directory = '';
			for (const part of parts.slice(0, -1)) {
				directory += '/' + part;
				if (directories.has(directory)) continue;
				directories.add(directory);
				const type = await client.exists(directory);
				if (type && type !== 'd') throw new Error(`Zielordner ist kein regulärer Ordner: ${directory}`);
			}
			const target = '/' + file.relative, type = await client.exists(target);
			if (type && type !== '-') throw new Error(`Zieldatei ist keine reguläre Datei: ${target}`);
			if (++checked % 1000 === 0) output(`${checked} / ${files.length} Zielpfade geprüft …`);
		});
		output('Zielprüfung abgeschlossen. Dateien werden übertragen …');
		// Create parents before children, with bounded parallel requests at each level.
		const depth = path => path.split('/').length;
		const pending = [...directories].filter(path => path !== '/');
		for (const level of [...new Set(pending.map(depth))].sort((a, b) => a - b)) {
			await concurrent(pending.filter(path => depth(path) === level), async path => {
				if (!await client.exists(path)) await client.mkdir(path);
			});
		}
		for (const phase of [0, 1, 2, 3]) await concurrent(files.filter(file => priority(file) === phase), async (file, index) => {
			const target = '/' + file.relative;
			const temporary = posix.join(posix.dirname(target), `.website-upload-${id}-${phase}-${index}`);
			let renamed = false;
			try {
				await client.put(file.local, temporary, { writeStreamOptions: { mode: 0o644 } });
				if ((await client.stat(temporary)).size !== file.size) throw new Error(`Unvollständige Übertragung: ${file.relative}`);
				// OpenSSH rename replaces the destination atomically, without a delete gap.
				await client.posixRename(temporary, target);
				renamed = true; published++;
				if (published % 100 === 0) output(`${published} / ${files.length} Dateien übertragen …`);
			} finally {
				if (!renamed) await client.delete(temporary).catch(() => {});
			}
		});
		output(`${published} Dateien nach IONOS / übertragen.`);
	} catch (error) {
		throw new Error(`IONOS-Übertragung fehlgeschlagen (${published} Dateien bereits veröffentlicht). Erneut veröffentlichen, um die Übertragung abzuschließen. ${error.message}`, { cause: error });
	} finally {
		// Verify ownership even during error cleanup.
		try {
			if ((await client.get(lock + '/owner')).toString() === id) {
				await client.delete(lock + '/owner');
				await client.rmdir(lock);
			}
		} catch { output('Sperre konnte nicht entfernt werden. Vor erneutem Veröffentlichen /.website-deploy.lock prüfen.'); }
	}
}
