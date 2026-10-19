import { formatVehicleError } from './vehicle-errors.mjs';
import { realpath } from 'node:fs/promises';
import { join } from 'node:path';
import { categories } from './crawlers.mjs';
import { discoverVehicleCategory } from './vehicle-files.mjs';
import { assertSafePath, reviewDeletion, applyDeletion } from './vehicle-import.mjs';
import { publishPreviewState, refreshVehiclePreview } from './vehicle-preview.mjs';

const labels = { 'aktuelle-projekte': 'Aktuelle Projekte', 'vergangene-projekte': 'Vergangene Projekte', fahrzeugangebote: 'Fahrzeugangebote' };
const plain = text => text.replace(/[\u0000-\u001f\u007f-\u009f]/g, ' ');

export async function deleteVehicle(root, from, { write, confirm }) {
	write('Fahrzeug wird geprüft …');
	const review = await reviewDeletion(root, from);
	write(`Fahrzeug: ${plain(review.vehicle.title)} (${from})`);
	if ((await confirm('Dieses Fahrzeug löschen? JA / Nein: ')).trim() !== 'JA') {
		write('Abgebrochen.');
		return null;
	}
	await publishPreviewState(review.root, 'updating');
	let result;
	try { result = await applyDeletion(review, review.token); }
	catch (error) {
		await publishPreviewState(review.root, 'blocked', 'Löschen fehlgeschlagen. Bitte die Meldung im Lösch-Terminal prüfen.').catch(() => {});
		throw error;
	}
	write('Fahrzeug gelöscht.');
	write(`Sicherung: ${result.backup}`);
	write('Vorschau wird aktualisiert …');
	try {
		await refreshVehiclePreview(review.root);
		result.previewReady = true;
		write('Fertig. Browserseite neu laden.');
	} catch (error) {
		result.previewReady = false;
		await publishPreviewState(review.root, 'blocked', 'Fahrzeug gelöscht; Vorschau fehlgeschlagen. npm run dev neu starten.').catch(() => {});
		write(`Fahrzeug gelöscht. Vorschau fehlgeschlagen: ${formatVehicleError(error)}`);
		write('Bitte npm run dev neu starten.');
	}
	return result;
}

export async function deleteWizard(rootInput, { write, confirm }) {
	write('Fahrzeug löschen');
	const root = await realpath(rootInput);
	const pages = join(root, 'src/pages/projekte');
	await assertSafePath(root, pages);
	const groups = await Promise.all(categories.map(key => discoverVehicleCategory(pages, { key })));
	const vehicles = groups.flat().sort((a, b) => a.title.localeCompare(b.title, 'de') || `${a.category}/${a.slug}`.localeCompare(`${b.category}/${b.slug}`));
	if (!vehicles.length) { write('Keine Fahrzeuge vorhanden.'); return null; }
	const search = (await confirm('Suchbegriff (Enter: alle): ')).trim().toLocaleLowerCase('de');
	const matches = vehicles.filter(vehicle => `${vehicle.title} ${labels[vehicle.category]} ${vehicle.category}/${vehicle.slug}`.toLocaleLowerCase('de').includes(search));
	if (!matches.length) { write('Kein Fahrzeug gefunden.'); return null; }
	matches.forEach((vehicle, index) => write(`${index + 1}: ${plain(vehicle.title)} – ${labels[vehicle.category]} (${vehicle.category}/${vehicle.slug})`));
	write('0: Abbrechen');
	const choice = (await confirm('Nummer eingeben: ')).trim();
	if (!/^[1-9][0-9]*$/.test(choice) || Number(choice) > matches.length) { write('Abgebrochen.'); return null; }
	const selected = matches[Number(choice) - 1];
	return deleteVehicle(root, `${selected.category}/${selected.slug}`, { write, confirm });
}
