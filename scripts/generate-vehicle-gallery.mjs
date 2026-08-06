import { copyFile, mkdir, readdir, rm, stat } from 'node:fs/promises';
import { basename, extname, join } from 'node:path';
import sharp from 'sharp';
import {
	GITHUB_PAGES_GALLERY_IMAGE_LIMIT,
	limitVehicleGalleryBlocks,
} from '../src/config/vehicleGalleryPolicy.js';
import { discoverVehicleCategory } from './lib/vehicle-files.mjs';

const target = process.argv[2] ?? 'production';
if (target !== 'production' && target !== 'github-pages') {
	throw new Error('Expected a build target of "production" or "github-pages".');
}
const outputTarget = process.argv[3] ?? 'public';
if (outputTarget !== 'public' && outputTarget !== 'dist') {
	throw new Error('Expected an output target of "public" or "dist".');
}

const galleryImageLimit = target === 'github-pages'
	? GITHUB_PAGES_GALLERY_IMAGE_LIMIT
	: Number.POSITIVE_INFINITY;

const root = process.cwd();
const pagesRoot = join(root, 'src/pages/projekte');
const cacheRoot = join(root, '.cache/vehicle-gallery-v2');
const outputRoot = join(root, outputTarget, 'vehicle-gallery');
const categories = [
	{ key: 'aktuelle-projekte' },
	{ key: 'vergangene-projekte' },
	{ key: 'fahrzeugangebote' },
];

const groups = await Promise.all(
	categories.map((category) => discoverVehicleCategory(pagesRoot, category)),
);
const tasks = [];

for (const vehicles of groups) {
	for (const vehicle of vehicles) {
		const sources = new Set([vehicle.cardImage, vehicle.leadImage]);
		const blocks = limitVehicleGalleryBlocks(vehicle.blocks ?? [], galleryImageLimit);
		for (const block of blocks) {
			if (block.type !== 'gallery') continue;
			for (const image of block.images ?? []) sources.add(image.src);
		}

		for (const source of sources) {
			const inputName = basename(source);
			const outputName = `${basename(inputName, extname(inputName))}.webp`;
			tasks.push({
				input: join(pagesRoot, vehicle.category, vehicle.slug, inputName),
				cache: join(cacheRoot, vehicle.category, vehicle.slug, outputName),
				output: join(outputRoot, vehicle.category, vehicle.slug, outputName),
			});
		}
	}
}

const expectedOutputs = new Set(tasks.map((task) => task.output));

async function pruneUnexpectedOutputs(directory) {
	let entries;
	try {
		entries = await readdir(directory, { withFileTypes: true });
	} catch (error) {
		if (error?.code === 'ENOENT') return;
		throw error;
	}

	for (const entry of entries) {
		const path = join(directory, entry.name);
		if (entry.isDirectory()) {
			await pruneUnexpectedOutputs(path);
			if ((await readdir(path)).length === 0) await rm(path, { recursive: true });
		} else if (!expectedOutputs.has(path)) {
			await rm(path);
		}
	}
}

await pruneUnexpectedOutputs(outputRoot);

let generated = 0;
let reused = 0;
let bytes = 0;
let cursor = 0;
const workerCount = Math.min(8, tasks.length);

async function processImage(task) {
	await mkdir(join(task.cache, '..'), { recursive: true });
	await mkdir(join(task.output, '..'), { recursive: true });

	const inputStat = await stat(task.input);
	let cacheStat;
	try {
		cacheStat = await stat(task.cache);
	} catch {
		cacheStat = undefined;
	}

	if (!cacheStat || cacheStat.mtimeMs < inputStat.mtimeMs) {
		await sharp(task.input)
			.rotate()
			.resize({ width: 1600, withoutEnlargement: true })
			.webp({ quality: 72, effort: 5, smartSubsample: true })
			.toFile(task.cache);
		cacheStat = await stat(task.cache);
		generated += 1;
	} else {
		reused += 1;
	}

	let outputStat;
	try {
		outputStat = await stat(task.output);
	} catch (error) {
		if (error?.code !== 'ENOENT') throw error;
	}

	if (!outputStat || outputStat.dev !== cacheStat.dev || outputStat.ino !== cacheStat.ino) {
		await copyFile(task.cache, task.output);
	}
	bytes += cacheStat.size;
}

async function worker() {
	while (cursor < tasks.length) {
		const index = cursor;
		cursor += 1;
		await processImage(tasks[index]);
	}
}

await Promise.all(Array.from({ length: workerCount }, worker));

console.log(
	JSON.stringify(
		{
			target,
			outputTarget,
			galleryImageLimit: Number.isFinite(galleryImageLimit) ? galleryImageLimit : 'all',
			galleryImages: tasks.length,
			generated,
			reused,
			outputMegabytes: Number((bytes / 1024 / 1024).toFixed(1)),
		},
		null,
		2,
	),
);
