import SftpClient from 'ssh2-sftp-client';
import { spawn } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ionosConnection, deploymentFiles, uploadIonos } from './lib/ionos-deploy.mjs';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const mode = process.argv.slice(2);
const client = new SftpClient();
try {
	if (mode.length > 1 || (mode.length && !['--check', '--dry-run'].includes(mode[0]))) throw new Error('Erlaubt: npm run deploy, npm run deploy:check oder npm run deploy -- --dry-run.');
	const connection = mode[0] === '--dry-run' ? null : await ionosConnection(root);
	if (mode[0] !== '--check') {
		const cli = process.env.npm_execpath;
		if (!cli || !/npm-cli\.js$/.test(cli)) throw new Error('Bitte npm run deploy verwenden.');
		console.log('Produktionswebsite wird erstellt …');
		await new Promise((resolve, reject) => {
			const child = spawn(process.execPath, [cli, 'run', 'build'], { cwd: root, env: { ...process.env, DEPLOY_TARGET: 'production' }, stdio: 'inherit' });
			child.once('error', reject);
			child.once('close', code => code === 0 ? resolve() : reject(new Error('Erstellen fehlgeschlagen. Es wurde nichts übertragen.')));
		});
	}
	const files = mode[0] === '--check' ? null : await deploymentFiles(join(root, 'dist'));
	if (mode[0] === '--dry-run') console.log(`${files.length} Produktionsdateien geprüft. Ziel: IONOS / — nichts übertragen.`);
	else {
		await client.connect(connection);
		if (mode[0] === '--check') {
			await client.list('/');
			console.log('IONOS-Verbindung erfolgreich. Webspace / lesbar. Nichts verändert.');
		} else await uploadIonos(client, files);
	}
} catch (error) {
	console.error(error.message);
	process.exitCode = 1;
} finally {
	await client.end().catch(() => {});
}
