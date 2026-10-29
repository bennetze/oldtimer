import { spawn } from 'node:child_process';
import { join } from 'node:path';

// Installations must not block the event loop: output, logs, status messages and
// cancellation all need to work while npm is downloading or unpacking files.
export async function runToolsInstall(root, args, {
	onOutput = () => {}, onProgress = () => {},
	heartbeatMs = 10000, timeoutMs = 20 * 60 * 1000, signal,
} = {}) {
	const started = Date.now();
	let lastOutput = started;
	let stdout = '', stderr = '', interrupted = false, timedOut = false, failure;
	let stopping;
	const child = spawn(process.execPath, args, {
		cwd: root, env: process.env, stdio: ['ignore', 'pipe', 'pipe'],
		detached: process.platform !== 'win32', windowsHide: true,
	});
	const stop = () => {
		if (stopping) return stopping;
		stopping = (async () => {
			if (!child.pid) return;
			if (process.platform === 'win32') {
				await new Promise(resolve => {
					const killer = spawn(join(process.env.SystemRoot || 'C:\\Windows', 'System32/taskkill.exe'), ['/pid', String(child.pid), '/t', '/f'], { stdio: 'ignore', windowsHide: true });
					killer.once('error', () => { child.kill(); resolve(); });
					killer.once('close', resolve);
				});
			} else {
				try { process.kill(-child.pid, 'SIGTERM'); } catch (error) { if (error.code !== 'ESRCH') throw error; }
				// A lifecycle script may ignore SIGTERM. Bound shutdown for the group.
				await new Promise(resolve => setTimeout(resolve, 1000));
				try { process.kill(-child.pid, 'SIGKILL'); } catch (error) { if (error.code !== 'ESRCH') throw error; }
			}
		})();
		return stopping;
	};
	const interrupt = () => { interrupted = true; void stop().catch(error => { failure = error; }); };
	process.on('SIGINT', interrupt);
	process.on('SIGTERM', interrupt);
	signal?.addEventListener('abort', interrupt, { once: true });
	if (signal?.aborted) interrupt();
	const receive = (stream, chunk) => {
		const text = chunk.toString();
		lastOutput = Date.now();
		// Bound returned output; the onOutput consumer retains the complete log.
		if (stream === 'stdout') stdout = (stdout + text).slice(-1024 * 1024);
		else stderr = (stderr + text).slice(-1024 * 1024);
		try { onOutput(stream, text); }
		catch (error) { failure = error; void stop().catch(error => { failure = error; }); }
	};
	child.stdout.on('data', chunk => receive('stdout', chunk));
	child.stderr.on('data', chunk => receive('stderr', chunk));
	const heartbeat = setInterval(() => onProgress({ elapsedMs: Date.now() - started, quietMs: Date.now() - lastOutput }), heartbeatMs);
	const timeout = setTimeout(() => { timedOut = true; void stop().catch(error => { failure = error; }); }, timeoutMs);
	try {
		const status = await new Promise(resolve => {
			child.once('error', error => { failure = error; });
			child.once('close', resolve);
		});
		if (stopping) await stopping;
		return { status: interrupted || timedOut || failure ? 1 : status, stdout, stderr, interrupted, timedOut, error: failure };
	} finally {
		clearInterval(heartbeat); clearTimeout(timeout);
		signal?.removeEventListener('abort', interrupt);
		process.off('SIGINT', interrupt); process.off('SIGTERM', interrupt);
	}
}
