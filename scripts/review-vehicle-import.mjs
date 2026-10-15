import { reviewImport, applyImport } from './lib/vehicle-import.mjs';
import { publishPreviewState, refreshVehiclePreview } from './lib/vehicle-preview.mjs';

const [mode, source, ...args] = process.argv.slice(2);
const options = {};
for (let i = 0; i < args.length; i += 2) {
	if (!['--from', '--approve'].includes(args[i]) || !args[i + 1] || options[args[i]]) throw new Error('Expected --from category/slug and/or --approve TOKEN.');
	options[args[i]] = args[i + 1];
}
if (!['check', 'apply'].includes(mode) || !source) throw new Error('Usage: npm run vehicles:review -- check|apply /extracted/category [--from category/slug] [--approve TOKEN]');
let applying = false;
try {
	const review = await reviewImport(process.cwd(), source, options['--from'] || null);
	console.log(JSON.stringify({ from: review.from, to: review.key, changes: review.summary, textChanges: review.textChanges, approvalToken: review.token }, null, 2));
	if (mode === 'apply') {
		if (!options['--approve']) throw new Error('Run check, review the differences, then pass its token with --approve.');
		await publishPreviewState(review.root, 'updating');
		applying = true;
		console.log(JSON.stringify(await applyImport(review, options['--approve']), null, 2));
		applying = false;
		try { await refreshVehiclePreview(review.root); }
		catch (error) {
			await publishPreviewState(review.root, 'blocked', 'Fahrzeug gespeichert, aber Vorschauvorbereitung fehlgeschlagen. npm run dev neu starten.');
			console.error(`Fahrzeug gespeichert, aber Vorschauvorbereitung fehlgeschlagen: ${error.message}. npm run dev neu starten; nicht erneut als neues Fahrzeug importieren.`);
			process.exitCode = 1;
		}
		console.log('Run npm test, npm run build and npm run build:pages before publishing. No deployment performed.');
	}
} catch (error) {
	if (applying) await publishPreviewState(process.cwd(), 'blocked', 'Übernahme fehlgeschlagen. Bitte das Übernahme-Terminal und die aufbewahrte Sicherung prüfen.').catch(() => {});
	console.error(error.message); process.exitCode = 1;
}
