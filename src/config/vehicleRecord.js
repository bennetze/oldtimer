// Browser counterpart is embedded verbatim in oldtimer-fahrzeuge/index.html.
// Keep the fixture parity test when changing this dependency-free contract.
export function validVehicleDate(value) {
	if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
	const date = new Date(`${value}T12:00:00Z`);
	return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function validateVehicleRecord(record, checkHtml = () => {}) {
	const fail = (message) => { throw new Error(`vehicle.json: ${message}`); };
	const object = (value, allowed, context) => {
		if (!value || typeof value !== 'object' || Array.isArray(value)) fail(`${context}: Objekt erwartet.`);
		for (const key of Object.keys(value)) if (!allowed.includes(key)) fail(`${context}: unbekanntes Feld ${key}.`);
	};
	const text = (value, context) => { if (typeof value !== 'string' || !value.trim()) fail(`${context}: Text fehlt.`); };
	const image = (value) => {
		if (typeof value !== 'string' || !/^\.\/[A-Za-z0-9][A-Za-z0-9._-]*\.(jpe?g|png|webp|avif)$/i.test(value) || value.includes('..')) fail(`Ungültiger Bildpfad: ${value}`);
	};
	object(record, ['slug', 'category', 'title', 'description', 'sourceUrl', 'order', 'dateModified', 'year', 'cardImage', 'cardImageAlt', 'leadImage', 'leadImageAlt', 'blocks'], 'Fahrzeug');
	if (typeof record.slug !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(record.slug) || ['index', 'seite'].includes(record.slug)) fail('Ungültiger oder reservierter Slug.');
	if (!['aktuelle-projekte', 'vergangene-projekte', 'fahrzeugangebote'].includes(record.category)) fail('Ungültige Kategorie.');
	for (const key of ['title', 'description', 'cardImageAlt', 'leadImageAlt']) text(record[key], key);
	if (!Number.isSafeInteger(record.order)) fail('Sortiernummer muss eine sichere ganze Zahl sein.');
	if (!validVehicleDate(record.dateModified)) fail('Ungültiges Kalenderdatum.');
	if (record.year !== undefined && (typeof record.year !== 'string' || !/^\d{4}$/.test(record.year))) fail('Baujahr muss vier Ziffern enthalten.');
	try {
		const url = new URL(record.sourceUrl);
		if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) fail('Ungültige Quell-URL.');
	} catch { fail('Ungültige Quell-URL.'); }
	image(record.cardImage); image(record.leadImage);
	if (!Array.isArray(record.blocks)) fail('Inhaltsblöcke fehlen.');
	for (const [index, block] of record.blocks.entries()) {
		if (block?.type === 'copy' || block?.type === 'contact') {
			object(block, ['type', 'html'], `Block ${index + 1}`);
			text(block.html, `Block ${index + 1}`);
			checkHtml(block.html, `Block ${index + 1}`);
		} else if (block?.type === 'gallery') {
			object(block, ['type', 'images'], `Block ${index + 1}`);
			if (!Array.isArray(block.images) || !block.images.length) fail(`Galerie ${index + 1} ist leer.`);
			for (const item of block.images) {
				object(item, ['src', 'alt', 'caption'], `Galerie ${index + 1}`);
				image(item.src); text(item.alt, `Galerie ${index + 1}: Alternativtext`);
				if (item.caption !== undefined && typeof item.caption !== 'string') fail('Bildunterschrift muss Text sein.');
			}
		} else fail(`Unbekannter Blocktyp in Block ${index + 1}.`);
	}
	const refs = [record.cardImage, record.leadImage, ...record.blocks.flatMap((block) => block.type === 'gallery' ? block.images.map((item) => item.src) : [])];
	const stems = new Map();
	for (const ref of new Set(refs)) {
		const stem = ref.replace(/\.[^.]+$/, '').toLowerCase();
		if (stems.has(stem) && stems.get(stem) !== ref) fail(`Bilder kollidieren nach WebP-Konvertierung: ${ref}`);
		stems.set(stem, ref);
	}
	return record;
}
