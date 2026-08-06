import { lstat, readdir } from 'node:fs/promises';
import { join } from 'node:path';

const root = join(process.cwd(), 'dist');
const maxFiles = 1800;
const maxBytes = 150 * 1024 * 1024;
let files = 0;
let bytes = 0;

async function inspect(directory) {
	for (const entry of await readdir(directory, { withFileTypes: true })) {
		const path = join(directory, entry.name);
		if (entry.isDirectory()) {
			await inspect(path);
			continue;
		}

		const metadata = await lstat(path);
		files += 1;
		bytes += metadata.size;
	}
}

await inspect(root);

const megabytes = Number((bytes / 1024 / 1024).toFixed(1));
if (files > maxFiles || bytes > maxBytes) {
	throw new Error(
		`GitHub Pages artifact is too large for the preview safety budget: ${files} files, ${megabytes} MiB. ` +
			`Keep it below ${maxFiles} files and ${maxBytes / 1024 / 1024} MiB to avoid the 10-minute Pages deployment timeout.`,
	);
}

console.log(
	JSON.stringify(
		{
			target: 'github-pages',
			files,
			megabytes,
			limits: {
				files: maxFiles,
				megabytes: maxBytes / 1024 / 1024,
			},
		},
		null,
		2,
	),
);
