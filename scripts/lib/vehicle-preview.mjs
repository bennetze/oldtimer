import { vehicleError } from './vehicle-errors.mjs';
import { randomUUID } from 'node:crypto';
import { mkdir, writeFile, rename, rm, lstat } from 'node:fs/promises';
import { join } from 'node:path';
import { assertSafePath } from './vehicle-import.mjs';
import { generateVehicleGallery } from './vehicle-gallery.mjs';

export const previewStatePath = '.cache/vehicle-preview-state.json';

export async function publishPreviewState(root, phase, message = '') {
	const path = join(root, previewStatePath);
	await assertSafePath(root, path);
	await mkdir(join(root, '.cache'), { recursive: true });
	const temporary = `${path}.${randomUUID()}.tmp`;
	try {
		await writeFile(temporary, JSON.stringify({ id: randomUUID(), pid: process.pid, phase, message }));
		await rename(temporary, path);
	} finally { await rm(temporary, { force: true }); }
}

export async function refreshVehiclePreview(root) {
	const lock = join(root, '.cache/vehicle-import.lock');
	await assertSafePath(root, lock);
	const active = await lstat(lock).catch(error => { if (error.code === 'ENOENT') return null; throw error; });
	if (active) throw vehicleError('IMPORT_LOCK', 'Eine Übernahme läuft oder wurde unterbrochen (.cache/vehicle-import.lock). Bitte die Übernahme abschließen oder die Sicherung anhand der Fahrzeuganleitung wiederherstellen. Die Sperre nicht einfach löschen.');
	let result;
	try { result = await generateVehicleGallery(root, 'production', 'public'); }
	catch (error) { throw vehicleError('PREVIEW_FAILED', error.message, { cause: error }); }
	await publishPreviewState(root, 'ready');
	return result;
}
