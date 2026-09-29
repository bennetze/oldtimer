import { access, readFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// One test-only resolver; never loaded by the offline deliverable.
export async function vehicleToolPath(name = 'index.html') {
	const configured = process.env.VEHICLE_TOOL_PATH;
	const entry = configured ? resolve(configured) : fileURLToPath(new URL('../../../oldtimer-intern/index.html', import.meta.url));
	try { await access(entry); await access(join(dirname(entry), name)); }
	catch { throw new Error(`Offline vehicle editor unavailable at ${entry}. Set VEHICLE_TOOL_PATH to its index.html.`); }
	return join(dirname(entry), name);
}

export async function readVehicleTool(name) {
	return readFile(await vehicleToolPath(name), 'utf8');
}
