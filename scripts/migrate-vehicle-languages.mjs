import { globSync, readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { load } from 'cheerio';
import { normalize, translate } from '../src/i18n/translate.js';
import { validateVehicleRecord } from '../src/config/vehicleRecord.js';
import { validateVehicleHtml } from '../src/config/vehicleHtml.js';

const dictionary = JSON.parse(readFileSync(new URL('../src/i18n/en.json', import.meta.url)));
export function migrateVehicle(record) {
	const result = structuredClone(record);
	const htmlEnglish = (html) => {
		const $ = load(html, {}, false);
		$('*').contents().each((_, node) => {
			if (node.type !== 'text') return;
			const key = normalize(node.data);
			if (/[a-zäöüß]/i.test(key) && !Object.hasOwn(dictionary, key)) throw new Error(`Missing reviewed translation: ${key}`);
			node.data = translate(node.data);
		});
		$('[title]').each((_, node) => $(node).attr('title', translate($(node).attr('title'))));
		return $.html();
	};
	for (const key of ['title', 'description', 'cardImageAlt', 'leadImageAlt']) result[`${key}En`] ??= translate(result[key]);
	for (const block of result.blocks) {
		if (block.type !== 'gallery') block.htmlEn ??= htmlEnglish(block.html);
		else for (const image of block.images) {
			image.altEn ??= translate(image.alt);
			if (image.caption !== undefined) image.captionEn ??= translate(image.caption);
		}
	}
	validateVehicleRecord(result, validateVehicleHtml);
	return result;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
	const apply = process.argv.includes('--write');
	if (process.argv.slice(2).some(arg => !['--write', '--check'].includes(arg))) throw new Error('Use --check (read only) or --write.');
	const changes = [], errors = [];
	for (const file of globSync('src/pages/projekte/*/*/vehicle.json')) {
		try {
			const original = JSON.parse(readFileSync(file, 'utf8'));
			const migrated = migrateVehicle(original);
			if (JSON.stringify(original) !== JSON.stringify(migrated)) changes.push([file, migrated]);
		} catch (error) { errors.push(`${file}: ${error.message}`); }
	}
	if (errors.length) throw new Error(errors.join('\n'));
	if (apply) for (const [file, record] of changes) writeFileSync(file, `${JSON.stringify(record, null, '\t')}\n`);
	console.log(`${apply ? 'Migrated' : 'Ready to migrate'} ${changes.length} vehicles. All records validated; no unresolved editorial translations.`);
}
