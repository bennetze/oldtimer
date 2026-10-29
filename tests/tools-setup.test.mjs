import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { prepareTools, atLeast } from '../scripts/lib/tools-setup.mjs';

async function fixture(t) {
	const root = await mkdtemp(join(tmpdir(), 'tools setup '));
	t.after(() => rm(root, { recursive: true, force: true }));
	await writeFile(join(root, 'package.json'), JSON.stringify({ engines: { node: '>=22.12.0', npm: '>=11.18.0' }, packageManager: 'npm@11.18.0' }));
	await writeFile(join(root, 'package-lock.json'), '{}');
	await writeFile(join(root, '.npmrc'), 'strict-allow-scripts=true\n');
	return root;
}

function runner({ broken = false, fail = false, oldNpm = false } = {}) {
	const calls = [];
	const run = (args) => {
		calls.push(args);
		if (args.includes('--version')) return { status: 0, stdout: oldNpm && args[0] === 'npm-cli.js' ? '10.0.0' : '11.18.0' };
		if (args.includes('ci')) { broken = false; return { status: fail ? 1 : 0 }; }
		return { status: broken ? 1 : 0 };
	};
	return { calls, run, break: () => { broken = true; } };
}

test('runtime versions enforce minimum minor and patch versions', () => {
	assert.equal(atLeast('22.11.9', '>=22.12.0'), false);
	assert.equal(atLeast('22.12.0', '>=22.12.0'), true);
	assert.equal(atLeast('24.0.0', '>=22.12.0'), true);
	assert.equal(atLeast('11.17.9', '>=11.18.0'), false);
	assert.equal(atLeast('invalid', '>=11.18.0'), false);
});

test('fresh setup, healthy offline restart, missing dependencies and changed lockfile', async t => {
	const root = await fixture(t);
	const mock = runner();
	await prepareTools(root, 'npm-cli.js', mock.run);
	assert.equal(mock.calls.filter(args => args.includes('ci')).length, 1);
	await prepareTools(root, 'npm-cli.js', mock.run);
	assert.equal(mock.calls.filter(args => args.includes('ci')).length, 1);
	mock.break();
	await prepareTools(root, 'npm-cli.js', mock.run);
	assert.equal(mock.calls.filter(args => args.includes('ci')).length, 2);
	await writeFile(join(root, 'package-lock.json'), '{"changed":true}');
	await prepareTools(root, 'npm-cli.js', mock.run);
	assert.equal(mock.calls.filter(args => args.includes('ci')).length, 3);
	assert.ok(mock.calls.some(args => args.includes('--include=optional')));
});

test('failed install does not mark setup ready and next start retries', async t => {
	const root = await fixture(t);
	await assert.rejects(prepareTools(root, 'npm-cli.js', runner({ fail: true }).run), /Internetverbindung/);
	await assert.rejects(readFile(join(root, 'node_modules/.tools-setup')), { code: 'ENOENT' });
	await prepareTools(root, 'npm-cli.js', runner().run);
	assert.equal((await readFile(join(root, 'node_modules/.tools-setup'), 'utf8')).length, 64);
});

test('old npm reuses compatible private npm without changing global installation', async t => {
	const root = await fixture(t);
	const mock = runner({ oldNpm: true });
	const cli = await prepareTools(root, 'npm-cli.js', mock.run);
	assert.equal(cli, join(root, '.cache/tools-npm/node_modules/npm/bin/npm-cli.js'));
	assert.ok(mock.calls.find(args => args[0] === cli && args.includes('ci')));
});

test('missing private npm is installed at the declared version before dependencies', async t => {
	const root = await fixture(t);
	const calls = [];
	let installed = false;
	const run = args => {
		calls.push(args);
		if (args.includes('--version')) return { status: installed ? 0 : 1, stdout: '11.18.0' };
		if (args.includes('install')) installed = true;
		return { status: 0 };
	};
	await prepareTools(root, 'npm-cli.js', run);
	const install = calls.find(args => args.includes('install'));
	assert.ok(install.includes('npm@11.18.0'));
	assert.ok(install.includes('--ignore-scripts'));
	assert.ok(install.includes(join(root, '.cache/tools-npm')));
});

test('an active setup lock prevents a second installer from touching dependencies', async t => {
	const { mkdir } = await import('node:fs/promises');
	const { hostname } = await import('node:os');
	const root = await fixture(t);
	await mkdir(join(root, '.cache'));
	const owner = JSON.stringify({ pid: process.pid, host: hostname(), platform: process.platform });
	await writeFile(join(root, '.cache/tools-setup.lock'), owner);
	const mock = runner();
	await assert.rejects(prepareTools(root, 'npm-cli.js', mock.run), /andere Einrichtung/);
	assert.equal(mock.calls.length, 0);
	assert.equal(await readFile(join(root, '.cache/tools-setup.lock'), 'utf8'), owner);
});

test('an interrupted installer releases its stale local lock on the next start', async t => {
	const { mkdir } = await import('node:fs/promises');
	const { hostname } = await import('node:os');
	const { spawn } = await import('node:child_process');
	const root = await fixture(t);
	const exited = spawn(process.execPath, ['-e', ''], { stdio: 'ignore' });
	const pid = exited.pid;
	await new Promise(resolve => exited.once('exit', resolve));
	await mkdir(join(root, '.cache'));
	await writeFile(join(root, '.cache/tools-setup.lock'), JSON.stringify({ pid, host: hostname(), platform: process.platform }));
	await prepareTools(root, 'npm-cli.js', runner().run);
	await assert.rejects(readFile(join(root, '.cache/tools-setup.lock')), { code: 'ENOENT' });
});

test('an incomplete project stops before installation and keeps its existing files', async t => {
	const root = await fixture(t);
	await rm(join(root, 'package-lock.json'));
	const mock = runner();
	await assert.rejects(prepareTools(root, 'npm-cli.js', mock.run), /package-lock.json.*Kopiervorgang/);
	assert.equal(mock.calls.length, 0);
	assert.ok(await readFile(join(root, 'package.json')));
});

test('native dependency failures preserve diagnostics, clear the lock, and can be retried', async t => {
	const root = await fixture(t);
	const mock = runner();
	const run = (args, stdio) => args.includes('--input-type=module') ? { status: 1, stderr: 'Native image processor ABI mismatch' } : mock.run(args, stdio);
	await assert.rejects(prepareTools(root, 'npm-cli.js', run), /tools-setup.log/);
	assert.match(await readFile(join(root, '.cache/tools-setup.log'), 'utf8'), /ABI mismatch/);
	await assert.rejects(readFile(join(root, 'node_modules/.tools-setup')), { code: 'ENOENT' });
	await assert.rejects(readFile(join(root, '.cache/tools-setup.lock')), { code: 'ENOENT' });
	await prepareTools(root, 'npm-cli.js', runner().run);
});
