import { vehicleError } from './vehicle-errors.mjs';
import { validateVehicleBlocks } from '../../src/config/vehicleHtml.js';
import { validateVehicleRecord, validVehicleFilename } from '../../src/config/vehicleRecord.js';
import { access, lstat, readdir, readFile } from 'node:fs/promises';
import { basename, extname, join } from 'node:path';

const exists = async (path) => {
	try {
		await access(path);
		return true;
	} catch {
		return false;
	}
};

function getReferencedImages(record) {
	const images = [record.cardImage, record.leadImage];
	for (const block of record.blocks ?? []) {
		if (block.type === 'gallery') {
			for (const image of block.images ?? []) images.push(image.src);
		}
	}
	return [...new Set(images.filter(Boolean))];
}

export async function discoverVehicleCategory(pagesRoot, category) {
	const directory = join(pagesRoot, category.key);
	if ((await lstat(directory)).isSymbolicLink()) throw vehicleError('UNSAFE_PATH', `${category.key}: symlink directory refused.`, { detail: category.key });
	const entries = await readdir(directory, { withFileTypes: true });
	if (entries.some((entry) => entry.isSymbolicLink())) throw vehicleError('UNSAFE_PATH', `${category.key}: symlink entry refused.`, { detail: category.key });
	const pageSlugs = entries
		.filter((entry) => entry.isFile() && extname(entry.name) === '.astro' && entry.name !== 'index.astro')
		.map((entry) => basename(entry.name, '.astro'))
		.sort();
	const folderSlugs = entries
		.filter((entry) => entry.isDirectory() && entry.name !== 'seite')
		.map((entry) => entry.name)
		.sort();

	const missingFolders = pageSlugs.filter((slug) => !folderSlugs.includes(slug));
	const missingPages = folderSlugs.filter((slug) => !pageSlugs.includes(slug));
	if (missingFolders.length || missingPages.length) {
		throw vehicleError('PROJECT_SOURCE',
			`${category.key}: unmatched pages/folders. Missing folders: ${missingFolders.join(', ') || 'none'}; missing pages: ${missingPages.join(', ') || 'none'}.`, { detail: `${category.key}: ${[...missingFolders, ...missingPages].join(', ')}` },
		);
	}

	const vehicles = [];
	for (const slug of pageSlugs) {
		const vehicleDirectory = join(directory, slug);
		const files = (await readdir(vehicleDirectory, { withFileTypes: true })).filter(entry => entry.name !== '.DS_Store');
		if (files.length > 2000) throw vehicleError('EXPORT_LIMIT', `${slug}: exceeds 2000 vehicle files.`, { detail: slug });
		let total = 0;
		const names = new Set(), stems = new Set();
		for (const entry of files) {
			const image = entry.name !== 'vehicle.json';
			const stem = entry.name.replace(/\.[^.]+$/, '').toLowerCase();
			if (!entry.isFile() || !validVehicleFilename(entry.name) || names.has(entry.name.toLowerCase()) || (image && (!/\.(jpe?g|png|webp|avif)$/i.test(entry.name) || !validVehicleFilename(stem + '.webp') || stems.has(stem)))) throw vehicleError('PROJECT_SOURCE', `${slug}: unexpected nested, unsafe or colliding vehicle file ${entry.name}.`, { detail: slug });
			names.add(entry.name.toLowerCase()); if (image) stems.add(stem);
			const size = (await lstat(join(vehicleDirectory, entry.name))).size;
			total += size;
			if (size > (image ? 50 : 2) * 1024 ** 2 || total > 512 * 1024 ** 2) throw vehicleError('EXPORT_LIMIT', `${slug}: vehicle payload exceeds size limits.`, { detail: slug });
		}
		const dataPath = join(vehicleDirectory, 'vehicle.json');
		if (!(await exists(dataPath))) {
			throw vehicleError('PROJECT_SOURCE', `${category.key}/${slug}: missing vehicle.json.`, { detail: category.key });
		}

		if (!(await lstat(dataPath)).isFile() || (await lstat(dataPath)).isSymbolicLink()) throw vehicleError('PROJECT_SOURCE', `${slug}: unsafe vehicle.json.`, { detail: slug });
		let record;
		try { record = validateVehicleRecord(JSON.parse(await readFile(dataPath, 'utf8'))); }
		catch (error) { if (['EACCES', 'EPERM', 'ENOENT'].includes(error.code)) throw error; throw vehicleError('PROJECT_SOURCE', error.message, { detail: dataPath }); }
		if (record.slug !== slug || record.category !== category.key) {
			throw vehicleError('PROJECT_SOURCE', `${category.key}/${slug}: slug or category does not match its filesystem location.`, { detail: category.key });
		}
		if (!record.title || !record.description || !record.sourceUrl || !Number.isFinite(record.order)) {
			throw vehicleError('PROJECT_SOURCE', `${category.key}/${slug}: incomplete required metadata.`, { detail: category.key });
		}

		for (const image of getReferencedImages(record)) {
			if (!image.startsWith('./') || image.includes('..')) {
				throw vehicleError('INVALID_IMAGE', `${category.key}/${slug}: image path must remain inside its vehicle folder: ${image}`, { detail: category.key });
			}
			if (!(await exists(join(vehicleDirectory, image))) || !(await lstat(join(vehicleDirectory, image))).isFile() || (await lstat(join(vehicleDirectory, image))).isSymbolicLink()) {
				throw vehicleError('INVALID_IMAGE', `${category.key}/${slug}: missing referenced image ${image}.`, { detail: category.key });
			}
		}

		try { validateVehicleBlocks(record.blocks ?? [], `${category.key}/${slug}`); }
		catch (error) { throw vehicleError('PROJECT_SOURCE', error.message, { detail: `${category.key}/${slug}/vehicle.json` }); }
		vehicles.push({ ...record, route: `/projekte/${category.key}/${slug}/` });
	}

	const orderKeys = new Set();
	for (const vehicle of vehicles) {
		if (orderKeys.has(vehicle.order)) {
			throw vehicleError('DUPLICATE_ORDER', `${category.key}: duplicate order value ${vehicle.order}.`, { detail: category.key });
		}
		orderKeys.add(vehicle.order);
	}

	return vehicles.sort((left, right) => left.order - right.order || left.title.localeCompare(right.title, 'de'));
}
