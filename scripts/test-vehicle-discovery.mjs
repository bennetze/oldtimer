import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { discoverVehicleCategory } from './lib/vehicle-files.mjs';

const category = { key: 'fixture-projects' };
const fixtureRoot = await mkdtemp(join(tmpdir(), 'oldtimer-vehicle-discovery-'));
const categoryRoot = join(fixtureRoot, category.key);

async function addPair(slug, order) {
	const folder = join(categoryRoot, slug);
	await mkdir(folder, { recursive: true });
	await writeFile(join(categoryRoot, `${slug}.astro`), '---\n---\n');
	await writeFile(join(folder, 'card.jpg'), 'fixture image');
	await writeFile(join(folder, 'lead.jpg'), 'fixture image');
	await writeFile(
		join(folder, 'vehicle.json'),
		JSON.stringify({
			slug,
			category: category.key,
			title: `Fixture ${order}`,
			description: 'A complete automatic-discovery fixture vehicle.',
			sourceUrl: 'https://example.com/fixture',
			order,
			cardImage: './card.jpg',
			leadImage: './lead.jpg',
			blocks: [],
		}),
	);
}

try {
	await mkdir(categoryRoot, { recursive: true });
	await addPair('one', 1);
	assert.deepEqual((await discoverVehicleCategory(fixtureRoot, category)).map(({ slug }) => slug), ['one']);

	await addPair('two', 2);
	assert.deepEqual((await discoverVehicleCategory(fixtureRoot, category)).map(({ slug }) => slug), ['one', 'two']);

	await rm(join(categoryRoot, 'two.astro'));
	await rm(join(categoryRoot, 'two'), { recursive: true });
	assert.deepEqual((await discoverVehicleCategory(fixtureRoot, category)).map(({ slug }) => slug), ['one']);

	await writeFile(join(categoryRoot, 'orphan.astro'), '---\n---\n');
	await assert.rejects(
		discoverVehicleCategory(fixtureRoot, category),
		/unmatched pages\/folders.*Missing folders: orphan/,
	);
	console.log('Vehicle discovery fixture passed: add, remove, and unmatched-pair failure.');
} finally {
	await rm(fixtureRoot, { recursive: true });
}
