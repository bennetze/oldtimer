import { createServer } from 'node:http';
import { randomUUID, createHash } from 'node:crypto';
import { mkdtemp, mkdir, readFile, readdir, lstat, realpath, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, dirname, join } from 'node:path';
import { spawn } from 'node:child_process';
import { transferWizard } from './vehicle-transfer-wizard.mjs';
import { transferVehicle } from './vehicle-transfer.mjs';
import { deleteWizard } from './vehicle-delete.mjs';
import { assertSafePath } from './vehicle-import.mjs';

const editorFiles = ['styles.css', 'workflow.css', 'project-access.js', 'project-save.js', 'project-ui.js', 'website-tools.js', 'editor.js'];
const types = { '/': ['index.html', 'text/html'], '/index.html': ['index.html', 'text/html'], ...Object.fromEntries(editorFiles.map(file => ['/' + file, [file, file.endsWith('.css') ? 'text/css' : 'text/javascript']])) };
const clean = text => String(text).replace(/\x1b\[[0-9;]*[A-Za-z]/g, '').replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, '');
const safePart = part => typeof part === 'string' && part && part !== '.' && part !== '..' && !/[\\/:*?"<>|\u0000-\u001f]/.test(part) && !/[. ]$/.test(part) && !/^(con|prn|aux|nul|com[0-9]|lpt[0-9])(?:\.|$)/i.test(part);

// Only fixed package scripts can run. npm's JS entry avoids Windows shell quoting.
export function runPackageCommand(root, name, onOutput, npmCli = process.env.npm_execpath) {
	if (!['dev', 'build', 'deploy'].includes(name)) throw new Error('Unbekannte Aktion.');
	if (!npmCli || !/npm-cli\.js$/.test(npmCli)) throw new Error('Bitte die Werkzeuge über den Startknopf oder npm run tools starten.');
	const child = spawn(process.execPath, [npmCli, 'run', name], {
		cwd: root, env: { ...process.env, NO_COLOR: '1', FORCE_COLOR: '0' },
		stdio: ['ignore', 'pipe', 'pipe'], detached: process.platform !== 'win32', windowsHide: true,
	});
	child.stdout.setEncoding('utf8'); child.stderr.setEncoding('utf8');
	child.stdout.on('data', onOutput); child.stderr.on('data', onOutput);
	const done = new Promise((resolve, reject) => {
		child.once('error', reject);
		child.once('close', (code, signal) => resolve({ code, signal }));
	});
	return {
		done,
		async stop() {
			if (process.platform === 'win32') {
				await new Promise((resolve, reject) => {
					const killer = spawn('taskkill', ['/pid', String(child.pid), '/t', '/f'], { windowsHide: true });
					killer.once('error', reject); killer.once('close', resolve);
				});
			} else {
				try { process.kill(-child.pid, 'SIGTERM'); } catch (error) { if (error.code !== 'ESRCH') throw error; }
			}
			await done;
		},
	};
}

export async function createControlPanel(rootInput, options = {}) {
	const root = await realpath(rootInput), token = randomUUID();
	let assets;
	try { assets = await realpath(options.editorRoot || join(dirname(root), 'oldtimer-intern')); await readFile(join(assets, 'index.html')); }
	catch { throw new Error('Editor nicht gefunden. Bitte oldtimer und oldtimer-intern nebeneinander im selben Ordner ablegen.'); }
	const workspace = await realpath(await mkdtemp(join(tmpdir(), 'oldtimer-tools-')));
	const uploads = new Map();
	let origin, active = null, preview = null, revision = 0, shuttingDown = false;
	const state = { project: root, task: null, preview: { running: false, url: null, log: '' } };
	const run = options.runCommand || runPackageCommand;
	function append(target, text) { target.log = (target.log + clean(text)).slice(-80000); revision++; }
	function ask(task, question) {
		if (shuttingDown) return Promise.resolve('');
		return new Promise(resolve => {
			const choices = task.messages.map(text => /^(\d+): (.+)$/.exec(text)).filter(Boolean).filter(match => match[1] !== '0').map(match => ({ value: match[1], label: match[2] }));
			task.prompt = { id: randomUUID(), question, kind: question.includes('Nummer eingeben') ? 'choice' : question.includes('JA / Nein') ? 'approval' : 'search', choices };
			task.answer = resolve; revision++;
		});
	}
	function snapshot() {
		const task = state.task && { id: state.task.id, name: state.task.name, status: state.task.status, log: state.task.log, prompt: state.task.prompt, error: state.task.error, committed: !!state.task.committed };
		return { revision, project: root, task, preview: state.preview };
	}
	function requireIdle() { if (active || shuttingDown) throw new Error('Bitte die laufende Aktion zuerst abschließen.'); }
	async function projectSnapshot() {
		const result = {};
		async function walk(path, depth = 0) {
			await assertSafePath(root, join(root, path)); result[path + '/'] = 'directory';
			for (const name of (await readdir(join(root, path))).filter(name => name !== '.DS_Store').sort()) {
				const child = path + '/' + name;
				await assertSafePath(root, join(root, child));
				const info = await lstat(join(root, child));
				if (info.isDirectory()) { if (depth >= 2) throw new Error('Unerwarteter Fahrzeug-Unterordner.'); await walk(child, depth + 1); }
				else if (info.isFile()) result[child] = createHash('sha256').update(await readFile(join(root, child))).digest('hex');
				else throw new Error('Nicht unterstützte Projektdatei.');
			}
		}
		await walk('src/pages/projekte');
		for (const path of ['src/config/vehicle-redirects.json', 'src/config/modificationDates.js', 'public/sitemap.xml', 'public/llms.txt', 'public/robots.txt']) {
			await assertSafePath(root, join(root, path));
			try { result[path] = createHash('sha256').update(await readFile(join(root, path))).digest('hex'); }
			catch (error) { if (error.code !== 'ENOENT') throw error; result[path] = null; }
		}
		return result;
	}
	async function start(name, uploadId) {
		requireIdle();
		if (!['transfer', 'delete', 'build', 'deploy'].includes(name)) throw new Error('Unbekannte Aktion.');
		if (['build', 'deploy'].includes(name) && preview) throw new Error('Bitte zuerst die Vorschau stoppen, damit Bilder und Ausgabedateien ungestört erstellt werden können.');
		const upload = name === 'transfer' && uploads.get(uploadId);
		if (name === 'transfer' && (!upload || !upload.files.size || upload.busy)) throw new Error('Die Fahrzeugdateien wurden nicht vollständig vorbereitet. Bitte erneut speichern.');
		const task = { id: randomUUID(), name, status: 'running', log: '', messages: [], prompt: null, error: null };
		state.task = task; revision++;
		if (upload) uploads.delete(uploadId);
		const work = async () => {
			try {
				if (name === 'build' || name === 'deploy') {
					if (name === 'deploy' && await ask(task, 'Website auf GitHub Pages veröffentlichen? JA / Nein: ') !== 'JA') { append(task, 'Abgebrochen.\n'); return; }
					const command = run(root, name, text => append(task, text));
					const result = await command.done;
					if (result.code !== 0) throw new Error('Aktion fehlgeschlagen. Bitte die Meldung oben prüfen.');
					append(task, name === 'build' ? 'Website erstellt. Ausgabe: dist/\n' : 'GitHub Pages veröffentlicht.\n');
				} else {
					const interaction = {
						write(text) { task.messages.push(String(text)); append(task, text + '\n'); },
						validateReview(review) {
							if (!upload?.draft) return;
							const expected = Object.fromEntries(Object.entries(review.before).map(([path, hash]) => [path.replaceAll('\\', '/'), hash]).filter(([path]) => !path.endsWith('/.DS_Store')));
							const received = upload.project.snapshot;
							if (Object.keys(expected).length !== Object.keys(received).length || !Object.entries(expected).every(([path, hash]) => received[path] === hash)) throw new Error('Das Website-Projekt wurde seit der Auswahl geändert. Bitte die Fahrzeugliste aktualisieren; der Entwurf bleibt erhalten.');
						},
						async confirm(question) {
							if (name === 'transfer' && question.startsWith('Entpackten Ordner')) return Promise.resolve(join(workspace, upload.id, upload.top));
							if (name === 'transfer' && question.includes('JA / Nein')) {
								// The wizard and immutable review have validated this staged record.
								const records = [...upload.files].filter(path => path.endsWith('/vehicle.json'));
								if (records.length === 1) {
									const record = JSON.parse(await readFile(join(workspace, upload.id, records[0]), 'utf8'));
									append(task, `Fahrzeug: ${record.title}\n`);
									append(task, `Zielroute: /projekte/${record.category}/${record.slug}/\n`);
								}
							}
							return ask(task, name === 'transfer' && upload.draft && question.includes('JA / Nein') ? 'Fahrzeug im angezeigten Projekt speichern? JA / Nein: ' : question).then(answer => {
								if (answer === '\u0000') { const error = new Error('Abgebrochen.'); error.code = 'CANCELLED'; throw error; }
								return answer;
							});
						},
					};
					let result;
					if (name === 'transfer' && upload.draft) {
						append(task, upload.from ? `Original: /projekte/${upload.from}/\n` : 'Neues Fahrzeug.\n');
						// The selected original is explicit; never infer replacement from a slug/title.
						result = await transferVehicle(root, join(workspace, upload.id, upload.top), upload.from, interaction);
					} else result = await (name === 'transfer' ? transferWizard(root, interaction) : deleteWizard(root, interaction));
					task.committed = !!result;
					if (result?.backup) append(task, `Sicherung: ${result.backup}\n`);
					if (result?.previewReady === false) task.status = 'warning';
					if (result) append(task, 'Bitte die Fahrzeugliste im Editor aktualisieren. Erstellen und Veröffentlichen sind separate Schritte.\n');
				}
			} catch (error) { task.status = error.code === 'CANCELLED' ? 'done' : 'error'; task.error = error.code === 'CANCELLED' ? null : error.message; append(task, error.message + '\n'); }
			finally {
				task.prompt = null; task.answer = null;
				if (upload) await rm(join(workspace, upload.id), { recursive: true, force: true }).catch(error => append(task, `Temporärer Ordner konnte nicht entfernt werden: ${error.message}\n`));
				if (task.status === 'running') task.status = 'done';
				active = null; revision++;
			}
		};
		// Defer until active holds the promise, including synchronous failures.
		active = Promise.resolve().then(work);
	}
	async function startPreview() {
		requireIdle();
		if (preview) throw new Error('Die Vorschau läuft bereits.');
		state.preview = { running: true, url: null, log: '' }; revision++;
		let output = '';
		let command;
		try { command = run(root, 'dev', text => {
			append(state.preview, text); output = (output + clean(text)).slice(-4000);
			const match = /Vorschau bereit: (http:\/\/localhost:\d+)/.exec(output);
			if (match) { state.preview.url = match[1]; revision++; }
		if (/Vorschau pausiert|Vorschau wird neu gestartet|Vorschau konnte nicht|Bitte die Meldung|Vorschau fehlgeschlagen|Übernahme fehlgeschlagen|Löschen fehlgeschlagen/.test(clean(text))) { state.preview.url = null; output = ''; }
		}); } catch (error) { state.preview.running = false; revision++; throw error; }
		preview = command;
		command.done.catch(error => append(state.preview, error.message + '\n')).finally(() => {
			if (preview === command) { preview = null; state.preview.running = false; state.preview.url = null; revision++; }
		});
	}
	async function readBody(request, limit = 65536) {
		const chunks = []; let size = 0;
		for await (const chunk of request) { size += chunk.length; if (size > limit) throw new Error('Datei oder Anfrage ist zu groß.'); chunks.push(chunk); }
		return Buffer.concat(chunks);
	}
	const server = createServer(async (request, response) => {
		const headers = {
			'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer',
			'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self'; img-src 'self' blob: data:; frame-src 'self'; object-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'",
		};
		function send(code, data) { response.writeHead(code, { ...headers, 'Content-Type': 'application/json; charset=utf-8' }); response.end(JSON.stringify(data)); }
		try {
			if (request.headers.host !== new URL(origin).host || (request.headers.origin && request.headers.origin !== origin)) { send(403, { error: 'Zugriff verweigert.' }); return; }
			const url = new URL(request.url, origin);
			if (request.method === 'GET' && types[url.pathname]) {
				const [file, type] = types[url.pathname];
				let contents = await readFile(join(assets, file));
				if (file === 'index.html') contents = contents.toString().replace('</head>', '<meta name="vehicle-tools" content="local-launcher">\n</head>');
				response.writeHead(200, { ...headers, 'Content-Type': type + '; charset=utf-8' }); response.end(contents); return;
			}
			if (request.headers.authorization !== `Bearer ${token}`) { send(403, { error: 'Bitte die Werkzeuge über den Startknopf neu öffnen.' }); return; }
			if (request.method === 'GET' && url.pathname === '/api/state') { send(200, snapshot()); return; }
			if (request.method !== 'POST') { send(404, { error: 'Unbekannte Aktion.' }); return; }
			if (url.pathname === '/api/upload/file') {
				requireIdle();
				const upload = uploads.get(url.searchParams.get('id')), path = url.searchParams.get('path');
				const parts = path?.split('/');
				if (!upload || upload.busy || !parts || parts.length < 2 || !parts.every(safePart) || parts[0] !== upload.top) throw new Error('Ungültiger Dateipfad.');
				if (upload.files.has(path) || upload.files.size >= 2000) throw new Error('Doppelte Datei oder zu viele Dateien.');
				upload.busy = true;
				try {
					const bytes = await readBody(request, 128 * 1024 * 1024);
					if (upload.size + bytes.length > 2 * 1024 * 1024 * 1024) throw new Error('Der Fahrzeugordner ist größer als 2 GB.');
					const target = join(workspace, upload.id, ...parts);
					await mkdir(dirname(target), { recursive: true }); await writeFile(target, bytes, { flag: 'wx' });
					upload.files.add(path); upload.size += bytes.length;
				} finally { upload.busy = false; }
				send(200, { ok: true }); return;
			}
			const body = JSON.parse((await readBody(request, ['/api/project/check', '/api/upload/start'].includes(url.pathname) ? 2 * 1024 * 1024 : 65536)).toString() || '{}');
			if (url.pathname === '/api/project/check') {
				requireIdle();
				const expected = await projectSnapshot(), received = body.snapshot;
				const same = body.name === basename(root) && received && typeof received === 'object' && !Array.isArray(received) && Object.keys(expected).length === Object.keys(received).length && Object.entries(expected).every(([key, value]) => received[key] === value);
				if (!same) throw new Error(`Bitte den Website-Ordner des Startprogramms auswählen: ${root}. Bei externen Änderungen die Fahrzeugliste aktualisieren.`);
				send(200, { ok: true }); return;
			}
			if (url.pathname === '/api/upload/start') {
				requireIdle();
				if (!safePart(body.top)) throw new Error('Ungültiger Ordnername.');
				if (body.draft !== undefined && typeof body.draft !== 'boolean') throw new Error('Ungültiger Speichervorgang.');
				if (body.draft && body.from !== null && (typeof body.from !== 'string' || !/^(aktuelle-projekte|vergangene-projekte|fahrzeugangebote)\/[a-z0-9]+(?:-[a-z0-9]+)*$/.test(body.from))) throw new Error('Ungültige ursprüngliche Fahrzeugroute.');
				if (body.draft && (body.project?.name !== basename(root) || !body.project.snapshot || typeof body.project.snapshot !== 'object' || Array.isArray(body.project.snapshot))) throw new Error('Bitte zuerst das Website-Projekt des Startprogramms auswählen und prüfen.');
				for (const [id, upload] of uploads) { if (upload.busy) throw new Error('Die Ordnerauswahl läuft noch.'); await rm(join(workspace, id), { recursive: true, force: true }); uploads.delete(id); }
				const id = randomUUID(); uploads.set(id, { id, top: body.top, draft: !!body.draft, from: body.draft ? body.from : null, project: body.draft ? body.project : null, files: new Set(), size: 0, busy: false }); send(200, { id }); return;
			}
			if (url.pathname === '/api/start') { await start(body.name, body.upload); send(200, { ok: true }); return; }
			if (url.pathname === '/api/answer') {
				const task = state.task;
				if (!task?.answer || task.id !== body.task || task.prompt.id !== body.prompt || typeof body.value !== 'string' || body.value.length > 1000) throw new Error('Diese Auswahl ist nicht mehr aktuell. Bitte die Seite neu laden.');
				const selected = task.prompt.kind === 'choice' && task.prompt.choices.find(choice => choice.value === body.value.trim());
				if (selected) append(task, `Ausgewählt: ${selected.label}\n`);
				const answer = task.answer; task.answer = null; task.prompt = null; revision++; answer(body.value); send(200, { ok: true }); return;
			}
			if (url.pathname === '/api/preview/start') { await startPreview(); send(200, { ok: true }); return; }
			if (url.pathname === '/api/preview/stop') { requireIdle(); if (preview) await preview.stop(); send(200, { ok: true }); return; }
			send(404, { error: 'Unbekannte Aktion.' });
		} catch (error) { if (!response.headersSent) send(400, { error: error.message }); else response.end(); }
	});
	try { await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); }); }
	catch (error) { await rm(workspace, { recursive: true, force: true }); throw error; }
	origin = `http://127.0.0.1:${server.address().port}`;
	return {
		url: `${origin}/#${token}`, origin, token,
		async close() {
			shuttingDown = true;
			if (state.task?.answer) { const answer = state.task.answer; state.task.answer = null; answer(''); }
			if (active) await active; // Never interrupt a committed vehicle transaction.
			if (preview) await preview.stop();
			await new Promise(resolve => server.close(resolve));
			await rm(workspace, { recursive: true, force: true });
		},
	};
}
