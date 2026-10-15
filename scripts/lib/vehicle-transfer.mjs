import { reviewImport, applyImport } from './vehicle-import.mjs';
import { publishPreviewState, refreshVehiclePreview } from './vehicle-preview.mjs';

// Approval remains bound to the exact review; applyImport rechecks all inputs.
export async function transferVehicle(root, source, from, { write, confirm, validateReview }) {
	write('Fahrzeug wird geprüft …');
	const review = await reviewImport(root, source, from);
	if (validateReview) await validateReview(review);
	if (from && from !== review.key) write(`Kategoriewechsel: ${from} → ${review.key}`);
	if (!review.summary.length) {
		write('Keine Änderungen.');
		await refreshVehiclePreview(review.root);
		write('Vorschau aktualisiert.');
		return null;
	}
	write('Prüfung erfolgreich.');
	if ((await confirm('Fahrzeug übernehmen? JA / Nein: ')).trim() !== 'JA') {
		write('Abgebrochen.');
		return null;
	}
	write('Fahrzeug wird übernommen …');
	await publishPreviewState(review.root, 'updating');
	let result;
	try { result = await applyImport(review, review.token); }
	catch (error) {
		await publishPreviewState(review.root, 'blocked', 'Übernahme fehlgeschlagen. Bitte die Meldung im Übernahme-Terminal prüfen.').catch(() => {});
		throw error;
	}
	write('Fahrzeug gespeichert.');
	write('Vorschaubilder werden erstellt …');
	try {
		await refreshVehiclePreview(review.root);
		result.previewReady = true;
		write('Fertig. Browserseite neu laden.');
	} catch (error) {
		result.previewReady = false;
		await publishPreviewState(review.root, 'blocked', 'Fahrzeug gespeichert; Vorschaubilder konnten nicht erstellt werden. npm run dev neu starten.').catch(() => {});
		write(`Fahrzeug gespeichert. Vorschau fehlgeschlagen: ${error.message}`);
		write(`Sicherung: ${result.backup}`);
		write('Bitte npm run dev neu starten.');
	}
	return result;
}
