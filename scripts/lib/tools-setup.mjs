import { createHash } from 'node:crypto';
import { readFile, mkdir, writeFile, rm, open, rename } from 'node:fs/promises';
import { hostname } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { createWriteStream } from 'node:fs';
import { finished } from 'node:stream/promises';
import { runToolsInstall } from './tools-install-process.mjs';

export function atLeast(actual, minimum) {
	const parts = String(actual ?? '').trim().replace(/^v/, '').split('.').map(Number);
	const required = minimum.replace(/^>=/, '').split('.').map(Number);
	if (parts.length !== 3 || parts.some(part => !Number.isInteger(part))) return false;
	for (let i = 0; i < 3; i++) {
		if (parts[i] !== required[i]) return parts[i] > required[i];
	}
	return true;
}

export function runNode(root, args, stdio = 'inherit') {
	return spawnSync(process.execPath, args, { cwd: root, env: process.env, stdio, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024, timeout: 120000 });
}

async function lockSetup(root) {
	await mkdir(join(root, '.cache'), { recursive: true });
	const path = join(root, '.cache/tools-setup.lock');
	for (let attempt = 0; attempt < 2; attempt++) {
		try {
			const file = await open(path, 'wx');
			await file.writeFile(JSON.stringify({ pid: process.pid, host: hostname(), platform: process.platform }));
			return async () => { await file.close(); await rm(path, { force: true }); };
		} catch (error) {
			if (error.code !== 'EEXIST') throw error;
			let owner;
			try { owner = JSON.parse(await readFile(path, 'utf8')); } catch { /* Another start may still be writing the owner. */ }
			if (owner?.host === hostname() && owner.platform === process.platform && Number.isSafeInteger(owner.pid) && owner.pid > 0) {
				try { process.kill(owner.pid, 0); }
				catch (error) {
					if (error.code === 'ESRCH' && attempt === 0) {
						// Serialize stale-lock recovery and recheck the owner, so a
						// second launcher cannot remove a newly acquired lock.
						let recovery;
						try {
							recovery = await open(path + '.reclaim', 'wx');
							const current = JSON.parse(await readFile(path, 'utf8'));
							if (JSON.stringify(current) !== JSON.stringify(owner)) throw new Error('Einrichtung wurde zwischenzeitlich gestartet. Bitte erneut versuchen.');
							await rm(path);
						} finally {
							if (recovery) { await recovery.close(); await rm(path + '.reclaim', { force: true }); }
						}
						continue;
					}
				}
			}
			throw new Error(`Eine andere Einrichtung läuft oder ist nicht eindeutig beendet. Andere Startfenster schließen und erneut starten. Sperrdatei: ${path}`);
		}
	}
}

// No editor imports before dependencies (including native image processing) pass.
export async function prepareTools(root, npmCli, run) {
	// Check the distribution before taking a lock or touching node_modules.
	const inputs = await Promise.all(['package.json', 'package-lock.json', '.npmrc'].map(async file => {
		try { return await readFile(join(root, file)); }
		catch { throw new Error(`Projektdatei ${file} fehlt oder ist nicht lesbar. Kopiervorgang abschließen und den vollständigen Website-Ordner erneut starten.`); }
	}));
	const pkg = JSON.parse(inputs[0]);
	if (!atLeast(process.versions.node, pkg.engines.node)) throw new Error('Node.js ist zu alt. Bitte über Bearbeitung starten; dort wird Node.js automatisch eingerichtet.');
	const release = await lockSetup(root);
	const logPath = join(root, '.cache/tools-setup.log');
	let diagnostics = '';
	const check = (args) => {
		const result = (run || ((args, stdio) => runNode(root, args, stdio)))(args, 'pipe');
		diagnostics += [result.stdout, result.stderr, result.error?.message].filter(Boolean).join('\n') + '\n';
		return result;
	};
	const versionMatches = cli => {
		const result = check([cli, '--version']);
		return result.status === 0 && atLeast(result.stdout, pkg.engines.npm);
	};
	const install = async args => {
		await writeFile(logPath, diagnostics);
		console.log(`Installationsprotokoll: ${logPath}`);
		let result;
		if (run) {
			result = check(args);
			if (result.stdout) process.stdout.write(result.stdout);
			if (result.stderr) process.stderr.write(result.stderr);
		} else {
			const log = createWriteStream(logPath, { flags: 'a' });
			let logError;
			log.on('error', error => { logError = error; });
			result = await runToolsInstall(root, args, {
				onOutput(stream, text) {
					if (logError) throw logError;
					log.write(text);
					if (stream === 'stdout') process.stdout.write(text);
					// Verbose download activity goes into the live log. Keep warnings
					// and failures visible without flooding the German startup screen.
					else if (/npm (?:warn|error|ERR!)/i.test(text)) process.stderr.write(text);
				},
				onProgress({ elapsedMs, quietMs }) {
					console.log(`Einrichtung läuft seit ${Math.floor(elapsedMs / 1000)} s. Letzte npm-Ausgabe vor ${Math.floor(quietMs / 1000)} s.`);
				},
			});
			log.end();
			await finished(log);
			diagnostics = await readFile(logPath, 'utf8');
		}
		if (result.error) console.error(result.error.message);
		if (result.interrupted) throw new Error('Einrichtung abgebrochen. Bearbeitung kann erneut gestartet werden.');
		if (result.timedOut) throw new Error('Einrichtung nach 20 Minuten abgebrochen. Projekt auf ein lokales Laufwerk kopieren und erneut starten.');
		await writeFile(logPath, diagnostics);
		return result.status === 0;
	};
	try {
		if (!versionMatches(npmCli)) {
			const npmRoot = join(root, '.cache/tools-npm');
			const localCli = join(npmRoot, 'node_modules/npm/bin/npm-cli.js');
			if (!versionMatches(localCli)) {
				console.log('Passende npm-Version wird lokal eingerichtet …');
				if (!await install([npmCli, 'install', '--prefix', npmRoot, '--no-save', '--package-lock=false', '--ignore-scripts', '--loglevel=http', pkg.packageManager])
					|| !versionMatches(localCli)) throw new Error('npm konnte nicht eingerichtet werden.');
			}
			npmCli = localCli;
		}
		const hash = createHash('sha256');
		for (const input of inputs) hash.update(input);
		hash.update(`${process.platform}/${process.arch}/${process.versions.modules}`);
		const fingerprint = hash.digest('hex');
		const marker = join(root, 'node_modules/.tools-setup');
		let previous;
		try { previous = await readFile(marker, 'utf8'); } catch (error) { if (error.code !== 'ENOENT') throw error; }
		const healthy = () => check([npmCli, 'ls', '--all', '--include=dev', '--include=optional']).status === 0
			&& check(['--input-type=module', '-e', 'import sharp from "sharp"; await sharp({create:{width:1,height:1,channels:3,background:"white"}}).webp().toBuffer(); await import("astro"); await import("cheerio"); await import("ssh2-sftp-client");']).status === 0;
		console.log('Website-Pakete werden geprüft …');
		if (previous !== fingerprint || !healthy()) {
			await rm(marker, { force: true });
			console.log('Website-Pakete werden eingerichtet. Beim ersten Start kann dies einige Minuten dauern …');
			if (!await install([npmCli, 'ci', '--include=dev', '--include=optional', '--loglevel=http']) || !healthy()) throw new Error('Website-Pakete konnten nicht eingerichtet oder geprüft werden.');
			await mkdir(join(root, 'node_modules'), { recursive: true });
			await writeFile(marker + '.tmp', fingerprint);
			await rename(marker + '.tmp', marker);
		}
		return npmCli;
	} catch (error) {
		diagnostics += '\n' + error.message + '\n';
		await writeFile(logPath, diagnostics);
		throw new Error(`${error.message}\nInternetverbindung und Schreibrechte prüfen und erneut starten. Diagnose: ${logPath}`);
	} finally { await release(); }
}
