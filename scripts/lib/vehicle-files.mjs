import { access, readdir, readFile } from 'node:fs/promises';
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
	const entries = await readdir(directory, { withFileTypes: true });
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
		throw new Error(
			`${category.key}: unmatched pages/folders. Missing folders: ${missingFolders.join(', ') || 'none'}; missing pages: ${missingPages.join(', ') || 'none'}.`,
		);
	}

	const vehicles = [];
	for (const slug of pageSlugs) {
		const vehicleDirectory = join(directory, slug);
		const dataPath = join(vehicleDirectory, 'vehicle.json');
		if (!(await exists(dataPath))) {
			throw new Error(`${category.key}/${slug}: missing vehicle.json.`);
		}

		const record = JSON.parse(await readFile(dataPath, 'utf8'));
		if (record.slug !== slug || record.category !== category.key) {
			throw new Error(`${category.key}/${slug}: slug or category does not match its filesystem location.`);
		}
		if (!record.title || !record.description || !record.sourceUrl || !Number.isFinite(record.order)) {
			throw new Error(`${category.key}/${slug}: incomplete required metadata.`);
		}

		for (const image of getReferencedImages(record)) {
			if (!image.startsWith('./') || image.includes('..')) {
				throw new Error(`${category.key}/${slug}: image path must remain inside its vehicle folder: ${image}`);
			}
			if (!(await exists(join(vehicleDirectory, image)))) {
				throw new Error(`${category.key}/${slug}: missing referenced image ${image}.`);
			}
		}

		vehicles.push({ ...record, route: `/projekte/${category.key}/${slug}/` });
	}

	const orderKeys = new Set();
	for (const vehicle of vehicles) {
		if (orderKeys.has(vehicle.order)) {
			throw new Error(`${category.key}: duplicate order value ${vehicle.order}.`);
		}
		orderKeys.add(vehicle.order);
	}

	return vehicles.sort((left, right) => left.order - right.order || left.title.localeCompare(right.title, 'de'));
}
