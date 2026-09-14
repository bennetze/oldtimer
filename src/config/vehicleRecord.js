// Browser counterpart is embedded verbatim in oldtimer-fahrzeuge/index.html.
export function validVehicleDate(value) {
	if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
	const date = new Date(`${value}T12:00:00Z`);
	return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function validateVehicleRecord(record, checkHtml = () => {}, { legacy = false } = {}) {
	const fail = (message) => { throw new Error(`vehicle.json: ${message}`); };
	const object = (value, allowed, context) => {
		if (!value || typeof value !== 'object' || Array.isArray(value)) fail(`${context}: Expected an object.`);
		for (const key of Object.keys(value)) if (!allowed.includes(key)) fail(`${context}: unknown field ${key}.`);
	};
	const text = (value, context) => { if (typeof value !== 'string' || !value.trim()) fail(`${context}: Text is required.`); };
	const image = (value) => {
		if (typeof value !== 'string' || !/^\.\/[A-Za-z0-9][A-Za-z0-9._-]*\.(jpe?g|png|webp|avif)$/i.test(value) || value.includes('..')) fail(`Invalid image path: ${value}`);
	};
	object(record, ['slug', 'category', 'title', 'description', 'sourceUrl', 'order', 'dateModified', 'year', 'cardImage', 'cardImageAlt', 'leadImage', 'leadImageAlt', 'blocks', 'titleEn', 'descriptionEn', 'cardImageAltEn', 'leadImageAltEn'], 'Vehicle');
	if (typeof record.slug !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(record.slug) || ['index', 'seite'].includes(record.slug)) fail('Invalid or reserved Slug.');
	if (!['aktuelle-projekte', 'vergangene-projekte', 'fahrzeugangebote'].includes(record.category)) fail('Invalid category.');
	for (const key of ['title', 'description', 'cardImageAlt', 'leadImageAlt']) text(record[key], key);
	for (const key of ['titleEn', 'descriptionEn', 'cardImageAltEn', 'leadImageAltEn']) {
		if (!legacy || record[key] !== undefined) text(record[key], key);
	}
	if (!Number.isSafeInteger(record.order)) fail('Order must be a safe integer.');
	if (!validVehicleDate(record.dateModified)) fail('Invalid calendar date.');
	if (record.year !== undefined && (typeof record.year !== 'string' || !/^\d{4}$/.test(record.year))) fail('Year must contain four digits.');
	try {
		const url = new URL(record.sourceUrl);
		if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) fail('Invalid source URL.');
	} catch { fail('Invalid source URL.'); }
	image(record.cardImage); image(record.leadImage);
	if (!Array.isArray(record.blocks)) fail('Content blocks are required.');
	for (const [index, block] of record.blocks.entries()) {
		if (block?.type === 'copy' || block?.type === 'contact') {
			object(block, ['type', 'html', 'htmlEn'], `Block ${index + 1}`);
			text(block.html, `Block ${index + 1}`);
			checkHtml(block.html, `Block ${index + 1} Deutsch`);
			if (!legacy || block.htmlEn !== undefined) {
				text(block.htmlEn, `Block ${index + 1} English`);
				checkHtml(block.htmlEn, `Block ${index + 1} English`);
			}
		} else if (block?.type === 'gallery') {
			object(block, ['type', 'images'], `Block ${index + 1}`);
			if (!Array.isArray(block.images) || !block.images.length) fail(`Gallery ${index + 1} is empty.`);
			for (const item of block.images) {
				object(item, ['src', 'alt', 'caption', 'altEn', 'captionEn'], `Gallery ${index + 1}`);
				image(item.src); text(item.alt, `Gallery ${index + 1}: Alternative text`);
				if (!legacy || item.altEn !== undefined) text(item.altEn, `Gallery ${index + 1}: English alternative text`);
				if (item.captionEn !== undefined && typeof item.captionEn !== 'string') fail('English caption must be text.');
				if (!legacy && Boolean(item.caption?.trim()) !== Boolean(item.captionEn?.trim())) fail('Captions must be provided in both languages or omitted in both.');
				if (item.caption !== undefined && typeof item.caption !== 'string') fail('Caption must be text.');
			}
		} else fail(`Unknown block type in block ${index + 1}.`);
	}
	const refs = [record.cardImage, record.leadImage, ...record.blocks.flatMap((block) => block.type === 'gallery' ? block.images.map((item) => item.src) : [])];
	const stems = new Map();
	for (const ref of new Set(refs)) {
		const stem = ref.replace(/\.[^.]+$/, '').toLowerCase();
		if (stems.has(stem) && stems.get(stem) !== ref) fail(`Images collide after WebP conversion: ${ref}`);
		stems.set(stem, ref);
	}
	return record;
}
