import { lstat, readdir, realpath } from 'node:fs/promises';
import { basename, join, resolve, sep } from 'node:path';
import { assertSafePath, inspectVehicleExport, exportFolderCategory } from './vehicle-import.mjs';
import { discoverVehicleCategory } from './vehicle-files.mjs';
import { categories } from './crawlers.mjs';
import { transferVehicle } from './vehicle-transfer.mjs';

const labels = { 'aktuelle-projekte': 'Aktuelle Projekte', 'vergangene-projekte': 'Vergangene Projekte', fahrzeugangebote: 'Fahrzeugangebote' };
const plain = text => text.replace(/[\u0000-\u001f\u007f-\u009f]/g, ' ');

export function folderInput(text, platform = process.platform) {
	let value = text.trim();
	if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
	else if (platform !== 'win32') value = value.replace(/\\([ ()'"\t])/g, '$1');
	if (!value) throw new Error('Kein Ordner angegeben. Bitte den Befehl erneut starten und den entpackten Ordner hineinziehen.');
	const path = resolve(value);
	return platform === 'darwin' ? path.replace(/^\/(tmp|var)(?=\/|$)/, '/private/$1') : path;
}

export async function transferWizard(rootInput, { write, confirm }) {
	write('Fahrzeug übernehmen');
	const root = await realpath(rootInput);
	let source = folderInput(await confirm('Entpackten Ordner hierher ziehen und Eingabetaste drücken: '));
	await assertSafePath(sep, source);
	if (source === root || source.startsWith(root + sep)) throw new Error('Bitte die ZIP außerhalb des Website-Ordners entpacken. Die vorhandenen Projektdateien nicht verschieben oder löschen.');
	if (!(await lstat(source)).isDirectory()) throw new Error('Bitte einen entpackten Ordner auswählen, keine ZIP-Datei.');
	if (!exportFolderCategory(basename(source))) {
		const contained = [];
		for (const name of await readdir(source)) {
			if (!exportFolderCategory(name)) continue;
			await assertSafePath(source, join(source, name));
			if ((await lstat(join(source, name))).isDirectory()) contained.push(name);
		}
		if (contained.length !== 1) throw new Error('Bitte den Ordner einer einzelnen entpackten Fahrzeug-ZIP hineinziehen.');
		source = join(source, contained[0]);
	}
	const record = await inspectVehicleExport(source);
	const vehicles = [];
	for (const key of categories) vehicles.push(...await discoverVehicleCategory(join(root, 'src/pages/projekte'), { key }));
	// Matching slugs only suggest choices. The user must select the exact original.
	const matches = vehicles.filter(vehicle => vehicle.slug === record.slug);
	write(`\nFahrzeug: ${plain(record.title)}\nKategorie: ${labels[record.category]}`);
	let from = null;
	if (matches.length) {
		write('Vorhandenes Fahrzeug auswählen:');
		matches.forEach((vehicle, index) => write(`${index + 1}: ${plain(vehicle.title)} – ${labels[vehicle.category]} (${vehicle.category}/${vehicle.slug})`));
		write('0: Abbrechen');
		const choice = (await confirm('Nummer eingeben: ')).trim();
		if (!/^[1-9][0-9]*$/.test(choice) || Number(choice) > matches.length) {
			write('Abgebrochen.');
			return null;
		}
		const selected = matches[Number(choice) - 1];
		from = `${selected.category}/${selected.slug}`;
	} else write('Neues Fahrzeug.');
	return transferVehicle(root, source, from, { write, confirm });
}
