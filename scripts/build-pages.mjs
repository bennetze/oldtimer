import { spawn } from 'node:child_process';

// Set the deployment environment without POSIX-only inline shell syntax.
const cli = process.env.npm_execpath;
if (!cli || !/npm-cli\.js$/.test(cli)) throw new Error('Bitte npm run build:pages verwenden.');
const child = spawn(process.execPath, [cli, 'run', 'build:pages:steps'], {
	cwd: process.cwd(), env: { ...process.env, DEPLOY_TARGET: 'github-pages' }, stdio: 'inherit',
});
child.on('error', error => { console.error(error.message); process.exitCode = 1; });
child.on('exit', code => { process.exitCode = code ?? 1; });
