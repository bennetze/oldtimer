import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
test('legacy migration entry points fail before writes and direct users to checked review', async () => {
	const cwd = await mkdtemp(join(tmpdir(), 'oldtimer-retired-import-'));
	try {
		for (const file of ['../scripts/import-legacy-vehicles.mjs', '../scripts/historical/import-legacy-vehicles.mjs']) {
			const result = spawnSync(process.execPath, [fileURLToPath(new URL(file, import.meta.url))], { cwd, encoding: 'utf8', timeout: 2000 });
			assert.equal(result.status, 1);
			assert.match(result.stderr, /vehicles:review/);
			assert.deepEqual(await readdir(cwd), []);
		}
	} finally { await rm(cwd, { recursive: true, force: true }); }
});
