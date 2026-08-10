import { readFile, readdir, rm } from 'node:fs/promises';
import { join } from 'node:path';

const distRoot = join(process.cwd(), 'dist');
const assetsRoot = join(process.cwd(), 'dist', '_astro');
const pagesOnlyFallback = /^(hero-site|handwerk|ueberuns|projekte)-motion\..+\.webp$/;
const searchableOutput = /\.(?:css|html|js)$/;
const candidates = [];
const removed = [];

for (const entry of await readdir(assetsRoot, { withFileTypes: true })) {
	if (!entry.isFile() || !pagesOnlyFallback.test(entry.name)) continue;
	candidates.push(entry.name);
}

async function assertUnreferenced(directory) {
	for (const entry of await readdir(directory, { withFileTypes: true })) {
		const path = join(directory, entry.name);
		if (entry.isDirectory()) {
			await assertUnreferenced(path);
			continue;
		}

		if (!searchableOutput.test(entry.name)) continue;
		const contents = await readFile(path, 'utf8');
		const referencedFallback = candidates.find((candidate) => contents.includes(candidate));
		if (referencedFallback) {
			throw new Error(
				`Cannot prune referenced GitHub Pages motion fallback ${referencedFallback} from ${path}.`,
			);
		}
	}
}

await assertUnreferenced(distRoot);

for (const candidate of candidates) {
	await rm(join(assetsRoot, candidate));
	removed.push(candidate);
}

console.log(
	JSON.stringify(
		{
			target: 'github-pages',
			removedMotionWebpFallbacks: removed.length,
		},
		null,
		2,
	),
);
