const messages = {
	IMPORT_LOCK: 'Eine Übernahme läuft oder wurde unterbrochen (.cache/vehicle-import.lock). Bitte den Vorgang abschließen oder die Sicherung anhand der Fahrzeuganleitung wiederherstellen. Die Sperre nicht einfach löschen.',
	PREVIEW_FAILED: 'Die Vorschau konnte nicht vorbereitet werden. Bitte die Bilddateien und Berechtigungen prüfen und npm run dev neu starten.',
	UNSAFE_PATH: 'Der Dateipfad ist unsicher oder enthält eine Verknüpfung. Bitte einen normalen Projekt- oder Exportordner auswählen.',
	EXPORT_LIMIT: 'Der Export überschreitet die zulässige Datei- oder Datengröße. Bitte weniger oder kleinere Dateien exportieren.',
	INVALID_EXPORT: 'Der Fahrzeugexport ist unvollständig oder ungültig. Bitte eine einzelne ZIP außerhalb des Projekts entpacken und erneut auswählen.',
	INVALID_IMAGE: 'Eine Bilddatei ist ungültig, fehlt oder kollidiert nach der Konvertierung. Bitte Dateinamen, Bildtyp und Bildzuordnung im Editor prüfen.',
	INVALID_ROUTE: 'Kategorie oder Fahrzeugroute ist ungültig. Bitte das genaue ursprüngliche Fahrzeug erneut auswählen.',
	INVALID_REDIRECT: 'Die Fahrzeugweiterleitungen sind widersprüchlich. Bitte die Weiterleitungsdatei im Website-Projekt prüfen lassen.',
	PROJECT_SOURCE: 'Der Fahrzeugordner ist unvollständig oder widersprüchlich. Bitte das angegebene Fahrzeugpaar und seine vehicle.json prüfen.',
	ORIGINAL_MISSING: 'Das ursprüngliche Fahrzeug ist nicht mehr vorhanden. Bitte die Fahrzeugliste aktualisieren und erneut auswählen.',
	SLUG_CHANGED: 'Ein Kategoriewechsel muss den ursprünglichen Slug behalten. Bitte das richtige Original auswählen.',
	DESTINATION_EXISTS: 'Am Ziel existiert bereits ein Fahrzeug. Bitte im Editor das genaue Original öffnen oder einen anderen Slug wählen.',
	DUPLICATE_ORDER: 'Der Sortierwert ist in der Zielkategorie bereits vergeben. Bitte unter „Technische Angaben“ einen anderen Sortierwert wählen und erneut speichern oder exportieren.',
	STALE_REVIEW: 'Export oder Website wurden seit der Prüfung geändert. Bitte andere Änderungen abschließen, die Fahrzeugliste aktualisieren und erneut prüfen.',
	LOCK_CHANGED: 'Die Importsperre wurde verändert. Bitte die Sperre behalten und den Vorgang anhand der Fahrzeuganleitung wiederherstellen.',
	BACKUP_INVALID: 'Die Sicherung konnte nicht verifiziert werden. Bitte die Sperre und Sicherung behalten und den Vorgang prüfen lassen.',
	WRITE_VERIFY: 'Die geschriebenen Dateien konnten nicht verifiziert werden. Bitte die Sicherung und die Meldung zur Wiederherstellung beachten.',
	EXTERNAL_EDIT: 'Eine externe Änderung wurde geschützt. Bitte die betroffene Datei und die Sicherung manuell vergleichen.',
	ROLLBACK_FAILED: 'Die Übernahme und die Wiederherstellung sind fehlgeschlagen. Bitte Sperre und Sicherung behalten und anhand der Fahrzeuganleitung wiederherstellen.',
	ROLLED_BACK: 'Die Übernahme wurde zurückgesetzt. Die ursprünglichen Dateien sind wiederhergestellt. Bitte die Ursache beheben und erneut prüfen.',
};

export function vehicleError(code, diagnostic, details = {}) {
	return Object.assign(new Error(diagnostic, details.cause ? { cause: details.cause } : undefined), { code, vehicleDetails: details, userMessage: messages[code] });
}

export function formatVehicleError(error) {
	const details = error.vehicleDetails || {};
	let message = error.userMessage || ({ EACCES: 'Kein Zugriff. Bitte die Ordnerberechtigung prüfen und erneut erteilen.', EPERM: 'Kein Zugriff. Bitte die Ordnerberechtigung prüfen und erneut erteilen.', ENOENT: 'Eine benötigte Datei fehlt. Bitte den Ordner und die Fahrzeugdateien prüfen.', EEXIST: 'Das Ziel oder die Importsperre existiert bereits. Bitte den laufenden Vorgang abschließen und die Fahrzeugliste aktualisieren.' })[error.code];
	if (!message) message = /[äöüßÄÖÜ]|^(Bitte|Die |Das |Eine |Kein|Fahrzeug|Ungültig|Abgebrochen|Unbekannte|Editor)/.test(error.message || '') ? error.message : 'Die Fahrzeugdaten konnten nicht verarbeitet werden. Bitte Projektordner, Pflichtangaben, Bilddateien und Dateizuordnungen prüfen.';
	if (details.detail || error.path) message += ` Datei/Route: ${details.detail || error.path}`;
	if (details.cause) message += ` Ursache: ${formatVehicleError(details.cause)}`;
	if (details.rollback) message += ` Wiederherstellung: ${formatVehicleError(details.rollback)}`;
	if (details.backup) message += ` Sicherung: ${details.backup}`;
	return message;
}
