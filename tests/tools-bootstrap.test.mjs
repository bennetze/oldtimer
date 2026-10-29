import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, cp, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

async function inputs(root) {
 for (const file of ['package.json', 'package-lock.json', '.npmrc', 'scripts/start-tools.mjs', 'scripts/lib/tools-setup.mjs', 'scripts/lib/tools-install-process.mjs']) {
  await mkdir(join(root, file, '..'), { recursive: true });
  await writeFile(join(root, file), '{}');
 }
}

test('shell bootstrap installs a checksum-verified local runtime without a package manager', async t => {
	if (process.platform === 'win32') return t.skip('POSIX bootstrap test');
	const { createHash } = await import('node:crypto');
	const parent = await mkdtemp(join(tmpdir(), 'runtime with spaces '));
	t.after(() => rm(parent, { recursive: true, force: true }));
	const root = join(parent, 'Website');
	await inputs(root);
	const bin = join(parent, 'bin');
	const name = 'node-v24.0.0-linux-x64';
	await mkdir(join(root, 'scripts'), { recursive: true });
	await mkdir(bin);
	await mkdir(join(parent, name, 'bin'), { recursive: true });
	await cp(new URL('../scripts/setup-tools.sh', import.meta.url), join(root, 'scripts/setup-tools.sh'));
	await writeFile(join(bin, 'node'), '#!/bin/sh\nexit 1\n', { mode: 0o755 });
	await writeFile(join(bin, 'uname'), '#!/bin/sh\ncase "$1" in -s) echo Linux ;; -m) echo x86_64 ;; esac\n', { mode: 0o755 });
	await writeFile(join(parent, name, 'bin/node'), '#!/bin/sh\nexit 0\n', { mode: 0o755 });
	await writeFile(join(parent, name, 'bin/npm'), '#!/bin/sh\npwd\nprintf "%s\\n" "$@"\n', { mode: 0o755 });
	const archive = join(parent, name + '.tar.gz');
	const packed = spawnSync('tar', ['-czf', archive, '-C', parent, name]);
	assert.equal(packed.status, 0);
	const hash = createHash('sha256').update(await readFile(archive)).digest('hex');
	await writeFile(join(parent, 'sums'), `${hash}  ${name}.tar.gz\n`);
	await writeFile(join(bin, 'curl'), '#!/bin/sh\nfor arg do\n case "$arg" in *SHASUMS256.txt) source="$FIXTURE/sums" ;; *tar.gz) source="$FIXTURE/node-v24.0.0-linux-x64.tar.gz" ;; esac\n destination="$arg"\ndone\ncp "$source" "$destination"\n', { mode: 0o755 });
	const run = () => spawnSync('/bin/sh', [join(root, 'scripts/setup-tools.sh'), '--no-open'], {
		cwd: tmpdir(), env: { ...process.env, PATH: `${bin}:${process.env.PATH}`, FIXTURE: parent }, encoding: 'utf8',
	});
	let result = run();
	assert.equal(result.status, 0, result.stderr);
	assert.match(result.stdout, /run\ntools\n--\n--no-open/);
	assert.ok((await readFile(join(root, '.cache/tools-node/bin/node'), 'utf8')).includes('exit 0'));
	// A corrupted archive must never become the active runtime.
	await rm(join(root, '.cache'), { recursive: true });
	await writeFile(archive, 'corrupt download');
	result = run();
	assert.notEqual(result.status, 0);
	assert.match(result.stdout, /Prüfsumme/);
	await assert.rejects(readFile(join(root, '.cache/tools-node/bin/node')), { code: 'ENOENT' });
});


test('PowerShell repairs a broken runtime, starts offline, and preserves it on checksum failure', async t => {
	const powershell = process.env.TOOLS_PWSH || (process.platform === 'win32' ? 'powershell.exe' : 'pwsh');
	if (spawnSync(powershell, ['-NoProfile', '-Command', 'exit 0']).status !== 0) return t.skip('PowerShell is unavailable; set TOOLS_PWSH to its executable');
	const root = await mkdtemp(join(tmpdir(), 'Windows setup & spaces '));
	t.after(() => rm(root, { recursive: true, force: true }));
	await inputs(root);
	await cp(new URL('../scripts/setup-tools.ps1', import.meta.url), join(root, 'scripts/setup-tools.ps1'));
	const runtime = join(root, 'Local App Data/Oldtimermanufaktur/tools-node');
	await mkdir(join(runtime, 'node_modules/npm/bin'), { recursive: true });
	await writeFile(join(runtime, 'node.exe'), 'broken original');
	await writeFile(join(runtime, 'node_modules/npm/bin/npm-cli.js'), 'broken npm');
	let fixtureNode = process.execPath;
	if (process.platform !== 'win32') {
		fixtureNode = join(root, 'fixture-node');
		await writeFile(fixtureNode, '#!/bin/sh\nexec ' + JSON.stringify(process.execPath) + ' \"$@\"\n', { mode: 0o755 });
	}
	const harness = join(root, 'check.ps1');
	await writeFile(harness, `
$ErrorActionPreference = 'Stop'
$env:LOCALAPPDATA = Join-Path $PSScriptRoot 'Local App Data'
# Hide the test host's Node/npm, while using its real binary in the fixture archive.
function Get-Command { param($Name, $CommandType, $ErrorAction) return $null }
function Invoke-WebRequest {
  param($Uri, $OutFile, [switch]$UseBasicParsing, $TimeoutSec)
  if ($env:MOCK_NETWORK_OFF) { throw 'Network must not be used on a healthy repeat start' }
  if ($OutFile) { Set-Content $OutFile 'fixture' }
  else {
    $fixture = Join-Path $PSScriptRoot 'hash-fixture'
    Set-Content $fixture 'fixture'
    $hash = (Get-FileHash $fixture -Algorithm SHA256).Hash.ToLowerInvariant()
    if ($env:MOCK_BAD_HASH) { $hash = '0' * 64 }
    return @{ Content = "$hash  node-v24.0.0-win-x64.zip" }
  }
}
function Expand-Archive {
  param($LiteralPath, $DestinationPath)
  $unpacked = Join-Path $DestinationPath 'node-v24.0.0-win-x64'
  New-Item -ItemType Directory (Join-Path $unpacked 'node_modules/npm/bin') -Force | Out-Null
  Copy-Item -LiteralPath $env:TOOLS_TEST_NODE -Destination (Join-Path $unpacked 'node.exe')
  Set-Content (Join-Path $unpacked 'node_modules/npm/bin/npm-cli.js') 'if(process.argv.includes("--version")) console.log("11.18.0"); else console.log("TOOLS_STARTED",JSON.stringify(process.argv.slice(2)));'
}
$env:PROCESSOR_ARCHITECTURE = 'AMD64'
$env:PROCESSOR_ARCHITEW6432 = ''
& (Join-Path $PSScriptRoot 'scripts/setup-tools.ps1') --setup-only 'argument with spaces & symbols'
exit $LASTEXITCODE
`);
	const run = env => spawnSync(powershell, ['-NoProfile', '-File', harness], { env: { ...process.env, TOOLS_TEST_NODE: fixtureNode, ...env }, encoding: 'utf8' });
	let result = run({});
	assert.equal(result.status, 0, result.stdout + result.stderr);
	assert.match(result.stdout, /TOOLS_STARTED/);
	assert.match(result.stdout, /"argument with spaces & symbols"/);
	assert.ok((await readFile(join(runtime, 'node.exe'))).length > 50);
	result = run({ MOCK_NETWORK_OFF: '1' });
	assert.equal(result.status, 0, result.stdout + result.stderr);
	await writeFile(join(runtime, 'node.exe'), 'broken original');
	result = run({ MOCK_BAD_HASH: '1' });
	assert.notEqual(result.status, 0);
	assert.match(result.stdout, /Pruefsumme/);
	assert.equal(await readFile(join(runtime, 'node.exe'), 'utf8'), 'broken original');
});
