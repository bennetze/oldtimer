import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { deleteWizard } from './lib/vehicle-delete.mjs';

try {
	if (process.argv.length > 2) throw new Error('Bitte nur npm run vehicles:delete ausführen.');
	if (!stdin.isTTY || !stdout.isTTY) throw new Error('Bitte in einem interaktiven Terminal ausführen.');
	const terminal = createInterface({ input: stdin, output: stdout });
	try {
		const result = await deleteWizard(process.cwd(), {
			write: text => console.log(text),
			confirm: question => terminal.question(question),
		});
		if (result?.previewReady === false) process.exitCode = 1;
	} finally { terminal.close(); }
} catch (error) {
	console.error(`Löschen nicht abgeschlossen: ${error.message}`);
	process.exitCode = 1;
}
