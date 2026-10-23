import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createControlPanel } from './lib/control-panel.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const panel = await createControlPanel(root).catch(error => {
	console.error(error.message);
	process.exit(1);
});
console.log(`Werkzeuge: ${panel.url}`);
console.log('Dieses Fenster offen lassen. Strg+C beendet Werkzeuge und Vorschau.');
if (!process.argv.includes('--no-open')) {
	const command = process.platform === 'darwin' ? ['open', panel.url] : process.platform === 'win32' ? ['rundll32.exe', 'url.dll,FileProtocolHandler', panel.url] : ['xdg-open', panel.url];
	const browser = spawn(command[0], command.slice(1), { stdio: 'ignore', windowsHide: true });
	browser.on('error', () => console.log('Bitte den Link oben im Browser öffnen.'));
	browser.on('exit', code => { if (code) console.log('Bitte den Link oben im Browser öffnen.'); });
}
let closing = false;
async function close() {
	if (closing) return;
	closing = true;
	console.log('Werkzeuge werden beendet. Eine laufende Übernahme oder Löschung wird zuerst abgeschlossen …');
	await panel.close();
}
process.on('SIGINT', close);
process.on('SIGTERM', close);
