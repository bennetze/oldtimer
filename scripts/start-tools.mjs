import { fileURLToPath } from 'node:url';
import { prepareTools } from './lib/tools-setup.mjs';

try {
	const npmCli = process.env.npm_execpath;
	if (!npmCli || !/npm-cli\.js$/.test(npmCli)) throw new Error('Bitte über Bearbeitung oder npm run tools starten.');
	process.env.npm_execpath = await prepareTools(fileURLToPath(new URL('../', import.meta.url)), npmCli);
	if (process.argv.includes('--setup-only')) console.log('Einrichtung erfolgreich.');
	else await import('./control-panel.mjs');
} catch (error) {
	console.error(error.message);
	process.exitCode = 1;
}
