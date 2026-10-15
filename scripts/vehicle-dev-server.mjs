import { dev } from 'astro';
import { pathToFileURL } from 'node:url';

const args = process.argv.slice(2);
const serverOptions = {};
for (let i = 0; i < args.length; i++) {
	if (args[i] === '--port' && /^\d+$/.test(args[i + 1] || '')) serverOptions.port = Number(args[++i]);
	else if (args[i] === '--host') serverOptions.host = args[i + 1] && !args[i + 1].startsWith('--') ? args[++i] : true;
	else throw new Error('Vorschau: Unterstützte Optionen sind --port NUMMER und --host [ADRESSE].');
}
const server = await dev({ root: pathToFileURL(`${process.cwd()}/`), server: serverOptions });
console.log(`Vorschau bereit: http://localhost:${server.address.port}`);
let stopping = false;
async function stop() {
	if (stopping) return;
	stopping = true;
	await server.stop();
	process.exit(0);
}
process.once('SIGINT', stop);
process.once('SIGTERM', stop);
