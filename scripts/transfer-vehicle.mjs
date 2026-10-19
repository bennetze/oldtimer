import { formatVehicleError } from './lib/vehicle-errors.mjs';
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { transferVehicle } from './lib/vehicle-transfer.mjs';
import { transferWizard } from './lib/vehicle-transfer-wizard.mjs';

const [source, ...args] = process.argv.slice(2);
try {
	if (args.length && (args.length !== 2 || args[0] !== '--from' || !args[1])) {
		throw new Error('Aufruf: npm run vehicles:transfer -- "/Pfad/zur/entpackten/kategorie" [--from ursprüngliche-kategorie/fahrzeug-slug]');
	}
	if (!stdin.isTTY || !stdout.isTTY) throw new Error('Bitte in einem interaktiven Terminal ausführen. Für getrennte Prüfung und Freigabe vehicles:review verwenden.');
	const terminal = createInterface({ input: stdin, output: stdout });
	try {
		const interaction = {
			write: text => console.log(text),
			confirm: question => terminal.question(question),
		};
		const result = source ? await transferVehicle(process.cwd(), source, args[1] || null, interaction) : await transferWizard(process.cwd(), interaction);
		if (result?.previewReady === false) process.exitCode = 1;
	} finally { terminal.close(); }
} catch (error) {
	console.error(`Übernahme nicht abgeschlossen: ${formatVehicleError(error)}`);
	process.exitCode = 1;
}
