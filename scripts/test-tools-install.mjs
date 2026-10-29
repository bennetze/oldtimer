// Opt-in, networked integration test. Never installs into the real checkout.
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, cp, writeFile, readFile, rm, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn, spawnSync } from 'node:child_process';

const source = fileURLToPath(new URL('../', import.meta.url));
const parent = await mkdtemp(join(tmpdir(), 'Editor install ä & spaces '));
const root = join(parent, 'Website');
const cleanEnv = { ...process.env, NODE_ENV: 'production', npm_config_cache: join(parent, 'npm-cache') };
let panel;
async function run(command, args, env = cleanEnv) {
	const child = spawn(command, args, { cwd: tmpdir(), env, stdio: ['ignore', 'pipe', 'pipe'] });
	let output = '';
	child.stdout.on('data', chunk => { output += chunk; });
	child.stderr.on('data', chunk => { output += chunk; });
	const timer = setTimeout(() => child.kill(), 8 * 60 * 1000);
	try {
		const status = await new Promise((resolve, reject) => { child.once('error', reject); child.once('close', resolve); });
		assert.equal(status, 0, output);
		assert.match(output, /Einrichtung erfolgreich/);
	} finally { clearTimeout(timer); }
}
try {
	await mkdir(root);
	for (const file of ['package.json', 'package-lock.json', '.npmrc', 'scripts', 'src/config']) {
		await cp(join(source, file), join(root, file), { recursive: true });
	}
	// The setup test needs no companion repository. This small internal-editor
	// fixture checks server startup; full authoring regressions remain separate.
	const editor = join(parent, 'Intern');
	await mkdir(editor);
	const files = ['styles.css', 'workflow.css', 'project-access.js', 'project-save.js', 'project-ui.js', 'website-tools.js', 'vehicle-presentation.js', 'watermark.js', 'editor.js'];
	await writeFile(join(editor, 'index.html'), '<head><meta name="vehicle-editor" content="internal"></head>' + files.filter(f => f.endsWith('.js')).map(f => `<script src="${f}"></script>`).join(''));
	for (const file of files) await writeFile(join(editor, file), file === 'editor.js' ? 'window.VehicleProjectUI();' : '// Fixture');
	let command, args, node, npmCli;
	if (process.platform === 'win32') {
		command = join(process.env.SystemRoot, 'System32/WindowsPowerShell/v1.0/powershell.exe');
		cleanEnv.PATH = [join(process.env.SystemRoot, 'System32'), dirname(command)].join(';');
		cleanEnv.LOCALAPPDATA = join(parent, 'Local App Data');
		args = ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', join(root, 'scripts/setup-tools.ps1'), '--setup-only'];
		node = join(cleanEnv.LOCALAPPDATA, 'Oldtimermanufaktur/tools-node/node.exe');
		npmCli = join(dirname(node), 'node_modules/npm/bin/npm-cli.js');
	} else {
		command = '/bin/sh';
		args = [join(root, 'scripts/setup-tools.sh'), '--setup-only'];
		const bin = join(parent, 'base utilities');
		await mkdir(bin);
		for (const name of ['dirname', 'uname', 'curl', 'tar', 'awk', 'rm', 'mv', 'mkdir', 'mktemp', 'sha256sum', 'shasum', 'sh', 'chmod']) {
			const found = spawnSync('/bin/sh', ['-c', `command -v ${name}`], { encoding: 'utf8' });
			if (found.status === 0) await symlink(found.stdout.trim(), join(bin, name));
		}
		cleanEnv.PATH = bin; // No Node, npm or system package manager.
		node = join(root, '.cache/tools-node/bin/node');
		npmCli = join(root, '.cache/tools-node/lib/node_modules/npm/bin/npm-cli.js');
	}
	console.log('1/4: Real bootstrap without Node/npm on PATH …');
	await run(command, args);
	assert.equal((await readFile(join(root, 'node_modules/.tools-setup'), 'utf8')).length, 64);
	console.log('2/4: Healthy restart with npm forced offline …');
	await run(command, args, { ...cleanEnv, npm_config_offline: 'true' });
	console.log('3/4: Repair a missing native image package …');
	await rm(join(root, 'node_modules/sharp'), { recursive: true });
	await run(command, args);
	console.log('4/4: Start the real local server and fetch the editor fixture …');
	panel = spawn(node, [join(root, 'scripts/start-tools.mjs'), '--no-open'], { cwd: tmpdir(), env: { ...cleanEnv, npm_execpath: npmCli }, stdio: ['ignore', 'pipe', 'pipe'] });
	let output = '';
	const url = await new Promise((resolve, reject) => {
		const timer = setTimeout(() => reject(new Error('Server start timed out. ' + output)), 30000);
		panel.once('error', error => { clearTimeout(timer); reject(error); });
		panel.once('exit', code => { clearTimeout(timer); reject(new Error(`Server exited ${code}. ${output}`)); });
		panel.stdout.on('data', chunk => {
			output += chunk;
			const match = output.match(/Werkzeuge: (http:\/\/\S+)/);
			if (match) { clearTimeout(timer); resolve(match[1]); }
		});
		panel.stderr.on('data', chunk => { output += chunk; });
	});
	const response = await fetch(url);
	assert.equal(response.status, 200);
	assert.match(await response.text(), /content="local-launcher"/);
	console.log(`Passed on ${process.platform}/${process.arch}: download, clean install, offline restart, native-package repair, server startup.`);
} finally {
	if (panel && panel.exitCode === null) {
		const stopped = new Promise(resolve => panel.once('exit', resolve));
		panel.kill('SIGTERM');
		await stopped;
	}
	await rm(parent, { recursive: true, force: true, maxRetries: 5, retryDelay: 500 });
}
