import test from 'node:test';
import assert from 'node:assert/strict';
import { tmpdir } from 'node:os';
import { runToolsInstall } from '../scripts/lib/tools-install-process.mjs';

const waitForStart = () => {
	let resolve;
	const started = new Promise(done => { resolve = done; });
	return { started, output: (_stream, text) => { if (text.includes('INSTALL_STARTED')) resolve(); } };
};

test('installer exposes live stdout/stderr and heartbeat before it exits', async () => {
	const fixture = waitForStart();
	const chunks = [];
	const pulses = [];
	let complete = false;
	const running = runToolsInstall(tmpdir(), ['-e', 'console.log("INSTALL_STARTED"); console.error("DOWNLOAD_ACTIVITY"); setTimeout(()=>console.log("DONE"),250)'], {
		onOutput(stream, text) { chunks.push({ stream, text }); fixture.output(stream, text); },
		onProgress: progress => pulses.push(progress), heartbeatMs: 30, timeoutMs: 5000,
	}).then(result => { complete = true; return result; });
	await fixture.started;
	assert.equal(complete, false, 'Progress must be visible while installation is still running.');
	const result = await running;
	assert.equal(result.status, 0);
	assert.ok(chunks.some(chunk => chunk.stream === 'stderr' && chunk.text.includes('DOWNLOAD_ACTIVITY')));
	assert.ok(pulses.length > 0);
	assert.match(result.stdout, /DONE/);
});

test('a silent installer times out and its process is stopped', async () => {
	const result = await runToolsInstall(tmpdir(), ['-e', 'setInterval(()=>{},1000)'], { heartbeatMs: 30, timeoutMs: 250 });
	assert.equal(result.status, 1);
	assert.equal(result.timedOut, true);
});

test('cancellation stops installation before returning and preserves the abort status', async () => {
	const controller = new AbortController();
	const fixture = waitForStart();
	const running = runToolsInstall(tmpdir(), ['-e', 'console.log("INSTALL_STARTED"); setInterval(()=>{},1000)'], {
		onOutput: fixture.output, signal: controller.signal, timeoutMs: 5000,
	});
	await fixture.started;
	controller.abort();
	const result = await running;
	assert.equal(result.status, 1);
	assert.equal(result.interrupted, true);
});

test('failed installation retains its actual exit status and stderr', async () => {
	const result = await runToolsInstall(tmpdir(), ['-e', 'console.error("REGISTRY_UNREACHABLE"); process.exit(7)']);
	assert.equal(result.status, 7);
	assert.match(result.stderr, /REGISTRY_UNREACHABLE/);
});

test('cancellation also stops a lifecycle child which ignores SIGTERM', async () => {
	const controller = new AbortController();
	let ready;
	const started = new Promise(resolve => { ready = resolve; });
	const grandchild = 'process.on("SIGTERM",()=>{}); process.send(process.pid); setInterval(()=>{},1000)';
	const installer = `const {spawn}=require('node:child_process'); const child=spawn(process.execPath,['-e',${JSON.stringify(grandchild)}],{stdio:['ignore','ignore','ignore','ipc']}); child.on('message',pid=>console.log('GRANDCHILD:'+pid)); setInterval(()=>{},1000)`;
	const running = runToolsInstall(tmpdir(), ['-e', installer], {
		signal: controller.signal, timeoutMs: 10000,
		onOutput(_stream, text) { const match = text.match(/GRANDCHILD:(\d+)/); if (match) ready(Number(match[1])); },
	});
	const pid = await started;
	controller.abort();
	assert.equal((await running).interrupted, true);
	// Signal delivery/reaping can finish just after taskkill/kill returns.
	let stopped = false;
	for (let attempt = 0; attempt < 50; attempt++) {
		try { process.kill(pid, 0); } catch (error) { if (error.code === 'ESRCH') { stopped = true; break; } throw error; }
		await new Promise(resolve => setTimeout(resolve, 20));
	}
	assert.ok(stopped, 'Lifecycle child must not remain running after cancellation.');
});
