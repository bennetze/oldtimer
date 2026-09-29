import { createHash, randomUUID } from 'node:crypto';
import { mkdir, readFile, writeFile, readdir, rename, rm, realpath } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import sharp from 'sharp';
import { discoverVehicleCategory } from './vehicle-files.mjs';
import { limitVehicleGalleryBlocks, GITHUB_PAGES_GALLERY_IMAGE_LIMIT } from '../../src/config/vehicleGalleryPolicy.js';
import { assertSafePath } from './vehicle-import.mjs';
import { validVehicleFilename } from '../../src/config/vehicleRecord.js';

const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const settings = JSON.stringify({ version: 3, sharp: sharp.versions, rotate: true, quality: 72, effort: 5, smartSubsample: true });
export function validateGalleryManifest(value, target) {
	const fail = () => { throw new Error('Invalid vehicle gallery cache manifest. Remove the affected cache manifest and rebuild.'); };
	const object = value => value && typeof value === 'object' && !Array.isArray(value);
	if (!object(value) || value.version !== 3 || value.target !== target || !object(value.images)) fail();
	for (const [route, record] of Object.entries(value.images)) {
		const parts = route.split('/');
		if (parts.length !== 5 || parts[0] !== '' || parts[1] !== 'vehicle-gallery' || !['aktuelle-projekte', 'vergangene-projekte', 'fahrzeugangebote'].includes(parts[2]) || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(parts[3]) || !validVehicleFilename(parts[3] + '.astro') || !validVehicleFilename(parts[4]) || !parts[4].endsWith('.webp')) fail();
		if (!object(record) || record.route !== route || typeof record.fingerprint !== 'string' || !/^[a-f0-9]{64}/.test(record.fingerprint) || !Array.isArray(record.variants) || record.variants.length > 3) fail();
		const seen = new Set();
		for (const image of [record, ...record.variants]) {
			if (!object(image) || !Number.isSafeInteger(image.width) || image.width < 1 || image.width > 1600 || !Number.isSafeInteger(image.height) || image.height < 1 || image.width * image.height > 100000000 || !Number.isSafeInteger(image.bytes) || image.bytes < 1 || image.bytes > 50 * 1024 ** 2 || !/^[a-f0-9]{64}$/.test(image.hash) || seen.has(image.route)) fail();
			seen.add(image.route);
			if (image !== record && (! [480, 800, 960].includes(image.width) || image.width >= record.width || image.route !== route.replace(/\/([^/]+)$/, `/_responsive/${image.width}/$1`))) fail();
		}
	}
	return value;
}
async function readOptional(path) {
	try { return await readFile(path); }
	catch (error) { if (error.code === 'ENOENT') return null; throw error; }
}
async function atomicWrite(path, bytes) {
	await mkdir(dirname(path), { recursive: true });
	const temporary = `${path}.${randomUUID()}.tmp`;
	try { await writeFile(temporary, bytes); await rename(temporary, path); }
	finally { await rm(temporary, { force: true }); }
}

export async function generateVehicleGallery(root, target = 'production', outputTarget = 'public') {
	if (!['production', 'github-pages'].includes(target) || !['public', 'dist'].includes(outputTarget)) throw new Error('Invalid gallery target.');
	root = await realpath(root);
	const safeRead = async path => { await assertSafePath(root, path); return readOptional(path); };
	const safeWrite = async (path, bytes) => { await assertSafePath(root, path); return atomicWrite(path, bytes); };
	const limit = target === 'github-pages' ? GITHUB_PAGES_GALLERY_IMAGE_LIMIT : Infinity;
	const pagesRoot = join(root, 'src/pages/projekte');
	const cacheRoot = join(root, '.cache/vehicle-gallery-v3');
	const manifestPath = join(cacheRoot, `${target}.json`);
	const previousBytes = await safeRead(manifestPath);
	const previous = previousBytes ? validateGalleryManifest(JSON.parse(previousBytes), target) : { images: {} };
	const groups = await Promise.all(['aktuelle-projekte', 'vergangene-projekte', 'fahrzeugangebote'].map(key => discoverVehicleCategory(pagesRoot, { key })));
	const tasks = [];
	for (const vehicle of groups.flat()) {
		const detailSources = new Set([vehicle.leadImage, ...limitVehicleGalleryBlocks(vehicle.blocks, limit).filter(block => block.type === 'gallery').flatMap(block => block.images.map(image => image.src))]);
		for (const source of new Set([vehicle.cardImage, ...detailSources])) {
			const route = `/vehicle-gallery/${vehicle.category}/${vehicle.slug}/${source.slice(2).replace(/\.[^.]+$/, '.webp')}`;
			tasks.push({ input: join(pagesRoot, vehicle.category, vehicle.slug, source.slice(2)), route, card: source === vehicle.cardImage, detail: detailSources.has(source) });
		}
	}
	const images = {};
	const expected = new Set();
	let generated = 0, reused = 0, bytes = 0, cursor = 0;
	async function processImage(task) {
		await assertSafePath(root, task.input);
		const input = await readFile(task.input);
		const fingerprint = hash(input) + settings + JSON.stringify({ card: task.card, detail: task.detail, target });
		const old = previous.images[task.route];
		// Only trust a reusable entry when every derivative still has its recorded bytes.
		let valid = old?.fingerprint === fingerprint;
		if (valid) {
			for (const image of [old, ...old.variants]) {
				const cached = await safeRead(join(cacheRoot, 'images', image.route));
				if (!cached || cached.length !== image.bytes || hash(cached) !== image.hash) { valid = false; break; }
				try {
					const metadata = await sharp(cached).metadata();
					if (metadata.format !== 'webp' || metadata.width !== image.width || metadata.height !== image.height) { valid = false; break; }
				} catch { valid = false; break; }
			}
		}
		let record;
		if (valid) { record = old; reused++; }
		else {
			const metadata = await sharp(input).metadata();
			const sourceWidth = metadata.orientation >= 5 ? metadata.height : metadata.width;
			const primaryWidth = Math.min(sourceWidth, 1600);
			const widths = new Set([primaryWidth]);
			if (task.card) for (const width of [480, 960]) widths.add(Math.min(sourceWidth, width));
			if (task.detail && target === 'production') widths.add(Math.min(sourceWidth, 800));
			const derivatives = [];
			for (const width of [...widths].sort((a, b) => a - b)) {
				const route = width === primaryWidth ? task.route : task.route.replace(/\/([^/]+)$/, `/_responsive/${width}/$1`);
				const { data, info } = await sharp(input).rotate().resize({ width, withoutEnlargement: true }).webp({ quality: 72, effort: 5, smartSubsample: true }).toBuffer({ resolveWithObject: true });
				await safeWrite(join(cacheRoot, 'images', route), data);
				derivatives.push({ route, width: info.width, height: info.height, hash: hash(data), bytes: data.length });
			}
			const primary = derivatives.find(image => image.route === task.route);
			record = { ...primary, fingerprint, variants: derivatives.filter(image => image !== primary) };
			generated++;
		}
		images[task.route] = record;
		for (const image of [record, ...record.variants]) {
			const output = join(root, outputTarget, image.route);
			expected.add(output);
			const existing = await safeRead(output);
			if (!existing || hash(existing) !== image.hash) await safeWrite(output, await safeRead(join(cacheRoot, 'images', image.route)));
			bytes += image.bytes;
		}
	}
	async function worker() { while (cursor < tasks.length) await processImage(tasks[cursor++]); }
	await Promise.all(Array.from({ length: Math.min(8, tasks.length) }, worker));
	async function prune(directory) {
		await assertSafePath(root, directory);
		let entries;
		try { entries = await readdir(directory, { withFileTypes: true }); }
		catch (error) { if (error.code === 'ENOENT') return; throw error; }
		for (const entry of entries) {
			const path = join(directory, entry.name);
			await assertSafePath(root, path);
			if (entry.isDirectory()) { await prune(path); if (!(await readdir(path)).length) await rm(path, { recursive: true }); }
			else if (!expected.has(path)) await rm(path);
		}
	}
	await prune(join(root, outputTarget, 'vehicle-gallery'));
	const manifest = { version: 3, target, images: Object.fromEntries(Object.entries(images).sort(([a], [b]) => a.localeCompare(b))) };
	const serialized = Buffer.from(JSON.stringify(manifest));
	if (!previousBytes?.equals(serialized)) await safeWrite(manifestPath, serialized);
	return { target, outputTarget, galleryImages: tasks.length, derivatives: expected.size, generated, reused, outputMegabytes: Number((bytes / 1024 ** 2).toFixed(1)) };
}
