import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, cp, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { createControlPanel } from '../scripts/lib/control-panel.mjs';

const templates = fileURLToPath(new URL('../scripts/launchers/', import.meta.url));

test('relocated Website/Intern layout serves the internal editor without path overrides', async t => {
	const parent = await mkdtemp(join(tmpdir(), 'Website with spaces '));
	t.after(() => rm(parent, { recursive: true, force: true }));
	const root = join(parent, 'Website');
	await mkdir(root);
	await cp(new URL('../../Intern/', import.meta.url), join(parent, 'Intern'), {
		recursive: true, filter: source => !source.split('/').includes('.git'),
	});
	const panel = await createControlPanel(root);
	t.after(() => panel.close());
	const html = await (await fetch(panel.origin)).text();
	assert.match(html, /content="internal"/);
	assert.match(html, /content="local-launcher"/);
	assert.equal((await fetch(panel.origin + '/website-tools.js')).status, 200);
});

test('parent shell launchers target the inner website from any working directory', async t => {
	const parent = await mkdtemp(join(tmpdir(), 'Website with spaces '));
	t.after(() => rm(parent, { recursive: true, force: true }));
	await mkdir(join(parent, 'Website/scripts'), { recursive: true });
	await cp(new URL('../scripts/setup-tools.sh', import.meta.url), join(parent, 'Website/scripts/setup-tools.sh'));
	for (const file of ['package.json', 'package-lock.json', '.npmrc', 'scripts/start-tools.mjs', 'scripts/lib/tools-setup.mjs', 'scripts/lib/tools-install-process.mjs']) {
		await mkdir(join(parent, 'Website', file, '..'), { recursive: true });
		await writeFile(join(parent, 'Website', file), '{}');
	}
	const bin = join(parent, 'bin');
	await mkdir(bin);
	await writeFile(join(bin, 'npm'), '#!/bin/sh\npwd\nprintf "%s\\n" "$@"\n', { mode: 0o755 });
	for (const [extension, shell] of [['sh', '/bin/sh'], ...(process.platform === 'darwin' ? [['command', '/bin/zsh']] : [])]) {
		const launcher = join(parent, `Bearbeitung.${extension}`);
		await cp(join(templates, `Bearbeitung.${extension}`), launcher);
		const result = spawnSync(shell, [launcher, '--no-open'], {
			cwd: tmpdir(), env: { ...process.env, PATH: `${bin}:${process.env.PATH}` }, input: '\n', encoding: 'utf8',
		});
		assert.equal(result.status, 0, result.stderr);
		assert.ok(result.stdout.includes(join(parent, 'Website')));
		assert.match(result.stdout, /run\ntools\n--\n--no-open/);
	}
	const windows = await readFile(join(templates, 'Bearbeitung.cmd'), 'utf8');
	assert.match(windows, /cd \/d "%~dp0Website"/);
	assert.match(windows, /powershell\.exe -NoProfile -ExecutionPolicy Bypass -File/);
	assert.match(windows, /scripts\\setup-tools\.ps1/);
});
