import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { lstat, readdir, readFile, writeFile, mkdir, rename, rm, realpath, mkdtemp } from 'node:fs/promises';
import { basename, dirname, join, relative, resolve, sep } from 'node:path';
import sharp from 'sharp';
import { validateVehicleRecord } from '../../src/config/vehicleRecord.js';
import { validateVehicleHtml } from '../../src/config/vehicleHtml.js';
import { discoverVehicleCategory } from './vehicle-files.mjs';
import { categories, sitemapEntries, renderSitemap, checkCrawlerFiles } from './crawlers.mjs';

const MAX_BYTES = 512 * 1024 ** 2;
const sha = (value) => createHash('sha256').update(value).digest('hex');
const jsonBytes = (value) => Buffer.from(`${JSON.stringify(value, null, '\t')}\n`);
const routeKey = /^(aktuelle-projekte|vergangene-projekte|fahrzeugangebote)\/[a-z0-9]+(?:-[a-z0-9]+)*$/;
const pagePrefix = 'src/pages/projekte/';
const redirectFile = 'src/config/vehicle-redirects.json';

async function exists(path) { try { await lstat(path); return true; } catch (error) { if (error.code === 'ENOENT') return false; throw error; } }

// Refuse symlinks in every existing path component, including an otherwise valid
// file below a redirected directory. Resolve the OS's /tmp alias only at entry.
export async function assertSafePath(root, path) {
	const rel = relative(root, path);
	if (rel === '..' || rel.startsWith(`..${sep}`) || rel.startsWith(sep)) throw new Error('Path escapes the selected root.');
	let current = root;
	for (const part of ['', ...rel.split(sep).filter(Boolean)]) {
		current = part ? join(current, part) : current;
		try { if ((await lstat(current)).isSymbolicLink()) throw new Error(`Symlink refused: ${current}`); }
		catch (error) { if (error.code === 'ENOENT') return; throw error; }
	}
}

async function fileHash(path) {
	const hash = createHash('sha256');
	for await (const chunk of createReadStream(path)) hash.update(chunk);
	return hash.digest('hex');
}
async function snapshot(root, paths, limit = Infinity) {
	let total = 0, count = 0;
	const result = {};
	async function walk(path) {
		if (Number.isFinite(limit) && ++count > 2005) throw new Error('Export exceeds file-count limits.');
		await assertSafePath(root, path);
		if (!(await exists(path))) { result[relative(root, path)] = null; return; }
		const info = await lstat(path);
		if (info.isDirectory()) {
			result[`${relative(root, path)}/`] = 'directory';
			for (const name of (await readdir(path)).sort()) await walk(join(path, name));
		} else if (info.isFile()) {
			total += info.size;
			if (total > limit) throw new Error('Export exceeds size limits.');
			result[relative(root, path)] = await fileHash(path);
		}
		else throw new Error(`Unsupported filesystem entry: ${path}`);
	}
	for (const path of paths) await walk(join(root, path));
	return result;
}
const trackedInputs = [pagePrefix.slice(0, -1), redirectFile, 'public/sitemap.xml', 'public/llms.txt', 'public/robots.txt', 'src/config/modificationDates.js'];

export function createVehiclePage(category, slug) {
	if (!routeKey.test(`${category}/${slug}`)) throw new Error('Invalid route.');
	return `---\nimport { getEntry } from 'astro:content';\nimport VehicleDetailPage from '../../../components/VehicleDetailPage.astro';\n\nconst vehicle = await getEntry('vehicles', '${category}/${slug}');\n\nif (!vehicle) {\n\tthrow new Error('Missing vehicle content for ${category}/${slug}.');\n}\n---\n\n<VehicleDetailPage {vehicle} />\n`;
}

export function validateRedirects(mapping, activeKeys) {
	if (!mapping || typeof mapping !== 'object' || Array.isArray(mapping)) throw new Error('Invalid vehicle redirects.');
	for (const [from, to] of Object.entries(mapping)) {
		if (!routeKey.test(from) || !routeKey.test(to) || from === to || activeKeys.has(from) || !activeKeys.has(to)) throw new Error(`Invalid/conflicting redirect: ${from} -> ${to}`);
	}
	return mapping;
}

async function readExport(source) {
	const info = await lstat(source);
	if (info.isSymbolicLink() || !info.isDirectory()) throw new Error('Select an extracted category directory, not a symlink or ZIP.');
	const category = basename(source);
	if (!categories.includes(category)) throw new Error('Select the extracted category directory.');
	const entries = (await readdir(source)).filter((name) => name !== '.DS_Store');
	const folders = [];
	for (const name of entries) {
		await assertSafePath(source, join(source, name));
		if ((await lstat(join(source, name))).isDirectory()) folders.push(name);
	}
	if (folders.length !== 1) throw new Error('Export must contain exactly one vehicle folder.');
	const slug = folders[0];
	if (!routeKey.test(`${category}/${slug}`)) throw new Error('Invalid vehicle folder name.');
	for (const name of entries) if (![slug, `${slug}.astro`].includes(name)) throw new Error(`Unexpected export entry: ${name}`);
	if (entries.includes(`${slug}.astro`)) {
		const wrapper = await lstat(join(source, `${slug}.astro`));
		if (!wrapper.isFile() || wrapper.size > 2 * 1024 ** 2) throw new Error('Invalid or oversized supplied Astro wrapper.');
	}
	const folder = join(source, slug);
	const names = (await readdir(folder)).filter((name) => name !== '.DS_Store').sort();
	if (names.length > 2000) throw new Error('Export exceeds 2000 files.');
	let total = 0;
	const files = new Map();
	const caseNames = new Set();
	const stems = new Set();
	for (const name of names) {
		const path = join(folder, name);
		await assertSafePath(source, path);
		const stat = await lstat(path);
		if (!stat.isFile() || name.includes('..') || !/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(name) || caseNames.has(name.toLowerCase())) throw new Error(`Invalid or duplicate file: ${name}`);
		caseNames.add(name.toLowerCase());
		total += stat.size;
		if (total > MAX_BYTES || stat.size > (name === 'vehicle.json' ? 2 : 50) * 1024 ** 2) throw new Error('Export exceeds size limits.');
		const bytes = await readFile(path);
		if (name !== 'vehicle.json') {
			const extension = name.split('.').at(-1).toLowerCase().replace('jpg', 'jpeg');
			if (!['jpeg', 'png', 'webp', 'avif'].includes(extension)) throw new Error(`Unsupported image: ${name}`);
			const stem = name.replace(/\.[^.]+$/, '').toLowerCase();
			if (stems.has(stem)) throw new Error(`Image conversion collision: ${name}`);
			stems.add(stem);
			const processor = sharp(bytes, { limitInputPixels: 100000000, failOn: 'warning' });
			const metadata = await processor.metadata();
			const format = metadata.format === 'heif' && metadata.compression === 'av1' ? 'avif' : metadata.format;
			if (format !== extension) throw new Error(`Image extension/content mismatch: ${name}`);
			await processor.stats(); // Decode, not just a plausible header.
		}
		files.set(name, bytes);
	}
	if (!files.has('vehicle.json')) throw new Error('Missing vehicle.json.');
	const record = validateVehicleRecord(JSON.parse(files.get('vehicle.json')), validateVehicleHtml);
	if (record.category !== category || record.slug !== slug) throw new Error('Metadata and export location disagree.');
	for (const ref of [record.cardImage, record.leadImage, ...record.blocks.flatMap((block) => block.type === 'gallery' ? block.images.map((item) => item.src) : [])]) {
		if (!files.has(ref.slice(2))) throw new Error(`Missing image: ${ref}`);
	}
	return { record, files };
}

export async function reviewImport(rootInput, sourceInput, from = null) {
	const root = await realpath(rootInput);
	// macOS system aliases are allowed; user-created symlink ancestors are not.
	const source = process.platform === 'darwin' ? resolve(sourceInput).replace(/^\/(tmp|var)(?=\/|$)/, '/private/$1') : resolve(sourceInput);
	await assertSafePath(sep, source);
	if (from !== null && !routeKey.test(from)) throw new Error('--from must be category/slug.');
	if (source === root || source.startsWith(root + sep)) throw new Error('Extract exports outside the website repository.');
	const before = await snapshot(root, trackedInputs);
	const sourceBefore = await snapshot(source, [''], MAX_BYTES);
	const { record, files } = await readExport(source);
	const key = `${record.category}/${record.slug}`;
	const groups = await Promise.all(categories.map((category) => discoverVehicleCategory(join(root, pagePrefix), { key: category })));
	const existing = groups.flat();
	if (from && !existing.some((item) => `${item.category}/${item.slug}` === from)) throw new Error('The explicit original vehicle does not exist.');
	if (from && from.split('/')[1] !== record.slug) throw new Error('Category moves preserve the existing slug.');
	if (existing.some((item) => `${item.category}/${item.slug}` === key && key !== from)) throw new Error('Destination exists. Specify --from for an intentional replacement.');
	if (existing.some((item) => item.category === record.category && item.order === record.order && `${item.category}/${item.slug}` !== from)) throw new Error('Duplicate order in target category. Choose a different order in the tool.');
	const nextGroups = groups.map((group, index) => [...group.filter((item) => `${item.category}/${item.slug}` !== from), ...(categories[index] === record.category ? [{ ...record, route: `/projekte/${key}/` }] : [])]);
	const mapping = await exists(join(root, redirectFile)) ? JSON.parse(await readFile(join(root, redirectFile), 'utf8')) : {};
	if (from && from !== key) {
		if (Object.hasOwn(mapping, key)) delete mapping[key];
		for (const old of Object.keys(mapping)) if (mapping[old] === from) mapping[old] = key;
		mapping[from] = key;
	}
	validateRedirects(mapping, new Set(nextGroups.flat().map((item) => `${item.category}/${item.slug}`)));
	const changes = new Map();
	if (from) {
		for (const path of Object.keys(before)) if (path === `${pagePrefix}${from}.astro` || (path.startsWith(`${pagePrefix}${from}/`) && !path.endsWith('/'))) changes.set(path, null);
	}
	changes.set(`${pagePrefix}${key}.astro`, Buffer.from(createVehiclePage(record.category, record.slug)));
	for (const [name, bytes] of files) changes.set(`${pagePrefix}${key}/${name}`, bytes);
	changes.set(redirectFile, jsonBytes(mapping));
	const sitemap = renderSitemap(sitemapEntries(nextGroups));
	let llms = await readFile(join(root, 'public/llms.txt'), 'utf8');
	if (from && from !== key) llms = llms.replaceAll(`/projekte/${from}/`, `/projekte/${key}/`);
	checkCrawlerFiles({ sitemap, llms, robots: await readFile(join(root, 'public/robots.txt'), 'utf8') }, sitemapEntries(nextGroups));
	changes.set('public/sitemap.xml', Buffer.from(sitemap));
	changes.set('public/llms.txt', Buffer.from(llms));
	for (const [path, bytes] of changes) if ((bytes ? sha(bytes) : null) === before[path]) changes.delete(path);
	const afterSource = await snapshot(source, [''], MAX_BYTES);
	if (JSON.stringify(sourceBefore) !== JSON.stringify(afterSource)) throw new Error('Export changed during review. Retry.');
	// Refuse a review assembled while another editor changed the repository.
	if (JSON.stringify(before) !== JSON.stringify(await snapshot(root, trackedInputs))) throw new Error('Website changed during review. Retry after other edits finish.');
	const summary = [...changes].map(([path, bytes]) => ({ path, action: bytes === null ? 'remove' : before[path] ? 'change' : 'add', before: before[path] || null, after: bytes ? sha(bytes) : null }));
	const token = sha(JSON.stringify({ root, source, from, before, sourceFiles: afterSource, summary }));
	const textChanges = [];
	for (const [path, bytes] of changes) {
		if (!/\.(json|astro|xml|txt)$/.test(path)) continue;
		const previous = before[path] ? await readFile(join(root, path), 'utf8') : null;
		textChanges.push({ path, before: previous, after: bytes ? bytes.toString('utf8') : null });
	}
	if (JSON.stringify(before) !== JSON.stringify(await snapshot(root, trackedInputs))) throw new Error('Website changed while preparing differences. Retry.');
	return { root, source, from, key, token, summary, textChanges, changes, before, sourceFiles: afterSource };
}

export async function applyImport(review, approvedToken, { afterWrite } = {}) {
	if (approvedToken !== review.token) throw new Error('Approval token does not match this review.');
	// Reconstruct from current bytes; do not trust a mutable review file as instructions.
	const fresh = await reviewImport(review.root, review.source, review.from);
	if (fresh.token !== approvedToken) throw new Error('Stale approval: export or website changed. Run check again.');
	const root = fresh.root;
	await assertSafePath(root, join(root, '.cache'));
	await mkdir(join(root, '.cache'), { recursive: true });
	const lock = join(root, '.cache/vehicle-import.lock');
	await mkdir(lock); // Exclusive directory; an interrupted import blocks another apply.
	let backup;
	const written = [];
	try {
		backup = await mkdtemp(join(root, '.cache/vehicle-import-backup-'));
		await writeFile(join(backup, 'review.json'), jsonBytes({ token: fresh.token, from: fresh.from, to: fresh.key, summary: fresh.summary }));
		for (const [path, bytes] of fresh.changes) {
			await assertSafePath(root, join(root, path));
			if (await exists(join(root, path))) { await mkdir(dirname(join(backup, 'before', path)), { recursive: true }); await writeFile(join(backup, 'before', path), await readFile(join(root, path))); }
			if (bytes) { await mkdir(dirname(join(backup, 'stage', path)), { recursive: true }); await writeFile(join(backup, 'stage', path), bytes); }
		}
		if (JSON.stringify(fresh.before) !== JSON.stringify(await snapshot(root, trackedInputs))) throw new Error('Website changed during staging; nothing applied.');
		// Write additions/replacements first, remove the previous pair last.
		const ordered = [...fresh.changes].sort((a, b) => Number(a[1] === null) - Number(b[1] === null));
		for (const [path, bytes] of ordered) {
			await assertSafePath(root, join(root, path));
			written.push(path);
			if (bytes) { await mkdir(dirname(join(root, path)), { recursive: true }); await rename(join(backup, 'stage', path), join(root, path)); }
			else await rm(join(root, path));
			await afterWrite?.(path); // Test-only fault injection; never exposed by CLI.
		}
		if (fresh.from && fresh.from !== fresh.key) await rm(join(root, pagePrefix, fresh.from), { recursive: false, force: false }).catch(async (error) => {
			// fs.rm does not remove directories without recursive; rmdir only removes an empty one.
			if (['ERR_FS_EISDIR', 'EISDIR'].includes(error.code)) { const { rmdir } = await import('node:fs/promises'); await rmdir(join(root, pagePrefix, fresh.from)); }
			else throw error;
		});
		await Promise.all(categories.map((key) => discoverVehicleCategory(join(root, pagePrefix), { key })));
		await writeFile(join(backup, 'COMPLETED'), 'Import completed. Backup retained for manual recovery.\n');
		return { backup, changes: fresh.summary };
	} catch (error) {
		try {
			for (const path of written.reverse()) {
				await assertSafePath(root, join(root, path));
				const original = join(backup, 'before', path);
				if (await exists(original)) { await mkdir(dirname(join(root, path)), { recursive: true }); await writeFile(join(root, path), await readFile(original)); }
				else await rm(join(root, path), { force: true });
			}
			const { rmdir } = await import('node:fs/promises');
			await rmdir(join(root, pagePrefix, fresh.key)).catch((failure) => { if (!['ENOENT', 'ENOTEMPTY'].includes(failure.code)) throw failure; });
		} catch (rollbackError) { throw new Error(`Import failed: ${error.message}. Rollback also failed: ${rollbackError.message}. Keep lock and recover from ${backup}.`, { cause: rollbackError }); }
		await rm(lock, { recursive: true });
		throw new Error(`Import rolled back: ${error.message}. Backup: ${backup || 'not created'}`, { cause: error });
	}
	finally { if (backup && await exists(join(backup, 'COMPLETED'))) await rm(lock, { recursive: true }); }
}
