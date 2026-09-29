import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, utimes, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import sharp from 'sharp';
import { generateVehicleGallery } from '../scripts/lib/vehicle-gallery.mjs';

const record = { slug: 'test-car', category: 'aktuelle-projekte', title: 'Auto', titleEn: 'Car', description: 'Text', descriptionEn: 'Text', sourceUrl: 'https://example.com/', order: 1, dateModified: '2026-09-30', cardImage: './card.png', leadImage: './card.png', cardImageAlt: 'Auto', cardImageAltEn: 'Car', leadImageAlt: 'Auto', leadImageAltEn: 'Car', blocks: [] };
test('gallery fingerprints bytes, repairs corruption, deduplicates widths and prunes target output', async () => {
	const root = await mkdtemp(join(tmpdir(), 'oldtimer-gallery-test-'));
	try {
		for (const category of ['aktuelle-projekte', 'vergangene-projekte', 'fahrzeugangebote']) await mkdir(join(root, 'src/pages/projekte', category), { recursive: true });
		const folder = join(root, 'src/pages/projekte/aktuelle-projekte/test-car');
		await mkdir(folder);
		await writeFile(`${folder}.astro`, '');
		await writeFile(join(folder, 'vehicle.json'), JSON.stringify(record));
		const source = join(folder, 'card.png');
		const make = background => sharp({ create: { width: 1200, height: 900, channels: 3, background } }).png().toBuffer();
		await writeFile(source, await make('red'));
		let result = await generateVehicleGallery(root);
		assert.equal(result.generated, 1);
		assert.equal(result.derivatives, 4); // 480, 800, 960 and the unscaled 1200px original.
		const manifestPath = join(root, '.cache/vehicle-gallery-v3/production.json');
		const manifest = JSON.parse(await readFile(manifestPath));
		const image = Object.values(manifest.images)[0];
		assert.equal(image.width, 1200); assert.equal(image.height, 900);
		for (const item of [image, ...image.variants]) {
			const metadata = await sharp(join(root, 'public', item.route)).metadata();
			assert.equal(metadata.width, item.width); assert.equal(metadata.height, item.height);
		}
		const output = join(root, 'public', image.route);
		const timestamp = (await stat(output)).mtimeMs;
		result = await generateVehicleGallery(root);
		assert.equal(result.reused, 1); assert.equal((await stat(output)).mtimeMs, timestamp);
		const inconsistent = structuredClone(manifest);
		inconsistent.images[image.route].width = 1100;
		await writeFile(manifestPath, JSON.stringify(inconsistent));
		assert.equal((await generateVehicleGallery(root)).generated, 1);
		const corrupt = await readFile(output); corrupt[corrupt.length - 1] ^= 1;
		await writeFile(output, corrupt);
		await generateVehicleGallery(root);
		assert.notDeepEqual(await readFile(output), corrupt);
		const cache = join(root, '.cache/vehicle-gallery-v3/images', image.route);
		await writeFile(cache, corrupt);
		assert.equal((await generateVehicleGallery(root)).generated, 1);
		await writeFile(source, await make('blue'));
		await utimes(source, 1, 1);
		assert.equal((await generateVehicleGallery(root)).generated, 1);
		await writeFile(join(root, 'public/vehicle-gallery/stale.webp'), 'stale');
		result = await generateVehicleGallery(root, 'github-pages');
		assert.equal(result.derivatives, 3);
		await assert.rejects(readFile(join(root, 'public/vehicle-gallery/stale.webp')), { code: 'ENOENT' });
		await assert.rejects(readFile(join(root, 'public', image.variants.find(item => item.width === 800).route)), { code: 'ENOENT' });
		await writeFile(source, await sharp({ create: { width: 300, height: 200, channels: 3, background: 'red' } }).png().toBuffer());
		assert.equal((await generateVehicleGallery(root)).derivatives, 1);
	} finally { await rm(root, { recursive: true, force: true }); }
});

test('gallery manifests reject escaped routes and invalid derivative metadata', async () => {
  const { validateGalleryManifest } = await import('../scripts/lib/vehicle-gallery.mjs');
  const route = '/vehicle-gallery/aktuelle-projekte/test-car/card.webp';
  const image = {route,width:1200,height:900,bytes:100,hash:'a'.repeat(64),fingerprint:'b'.repeat(64),variants:[]};
  const manifest = record => ({version:3,target:'production',images:{[route]:record}});
  assert.doesNotThrow(() => validateGalleryManifest(manifest(image),'production'));
  for (const bad of [{...image,route:'/outside'}, {...image,width:0}, {...image,hash:'bad'}, {...image,variants:[{...image,route:'/../../outside',width:480}]}]) assert.throws(() => validateGalleryManifest(manifest(bad),'production'), /manifest/);
  assert.throws(() => validateGalleryManifest({version:3,target:'production',images:{'/../../outside':image}},'production'), /manifest/);
});
