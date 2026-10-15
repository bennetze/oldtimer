import { spawn } from 'node:child_process';
import { readFile, realpath } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { previewStatePath, refreshVehiclePreview, publishPreviewState } from './lib/vehicle-preview.mjs';

// A fresh Astro process reloads the content store AND the injected English routes.
const root = await realpath(process.cwd());
const cli = fileURLToPath(new URL('./vehicle-dev-server.mjs', import.meta.url));
let child, childDone, stopped = false, timer, lastState;
async function readState() {
	try { return JSON.parse(await readFile(join(root, previewStatePath), 'utf8')); }
	catch (error) { if (error.code === 'ENOENT') return null; throw error; }
}
async function stopChild() {
	if (!child) return;
	const current = child;
	child = null;
	current.kill('SIGTERM');
	await childDone;
}
function publisherAlive(state) {
	if (!Number.isSafeInteger(state?.pid) || state.pid < 1) return false;
	try { process.kill(state.pid, 0); return true; }
	catch (error) { return error.code !== 'ESRCH'; }
}
function startChild() {
	if (stopped) return;
	child = spawn(process.execPath, [cli, ...process.argv.slice(2)], { cwd: root, stdio: 'inherit' });
	const current = child;
	childDone = new Promise(resolve => {
		current.once('error', error => { console.error(error.message); resolve(); child = null; stopped = true; clearTimeout(timer); process.exitCode = 1; });
		current.once('exit', code => {
			resolve();
			if (child === current && !stopped) {
				child = null; stopped = true; clearTimeout(timer); process.exitCode = code || 1;
			}
		});
	});
}
async function tick() {
	if (stopped) return;
	try {
		const state = await readState();
		if (state?.phase === 'updating' && !publisherAlive(state)) {
			try { await refreshVehiclePreview(root); }
			catch (error) { await publishPreviewState(root, 'blocked', error.message); }
		}
		if (state?.id !== lastState?.id) {
			lastState = state;
			await stopChild();
			if (state?.phase === 'ready') { console.log('Vorschau wird neu gestartet …'); startChild(); }
			else console.log(state?.message || 'Vorschau pausiert …');
		}
	} catch (error) { console.error(`Vorschau konnte nicht aktualisiert werden: ${error.message}`); }
	if (!stopped) timer = setTimeout(tick, 250);
}
async function shutdown() {
	stopped = true; clearTimeout(timer); await stopChild();
}
process.once('SIGINT', shutdown);
process.once('SIGTERM', shutdown);
try {
	console.log('Vorschaubilder werden geprüft …');
	const initialState = await readState();
	if (initialState?.phase === 'updating' && publisherAlive(initialState)) {
		console.log('Warte auf die Übernahme …');
		lastState = initialState;
		timer = setTimeout(tick, 250);
	} else {
		await refreshVehiclePreview(root);
		lastState = await readState();
		startChild();
		timer = setTimeout(tick, 250);
	}
} catch (error) {
	console.error(`Vorschau konnte nicht gestartet werden: ${error.message}`);
	process.exitCode = 1;
}
