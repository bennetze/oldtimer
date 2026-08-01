import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const productionOrigin = 'https://www.oldtimermanufaktur.de';
const githubPagesOrigin = 'https://bennetze.github.io/oldtimer';
const target = process.argv[2];

if (target !== 'production' && target !== 'github-pages') {
	throw new Error('Expected a build target of "production" or "github-pages".');
}

const deployedOrigin = target === 'github-pages' ? githubPagesOrigin : productionOrigin;
const crawlerFiles = ['sitemap.xml', 'robots.txt', 'llms.txt'];

await Promise.all(
	crawlerFiles.map(async (filename) => {
		const outputPath = resolve('dist', filename);
		const source = await readFile(outputPath, 'utf8');
		const prepared = source.replaceAll(productionOrigin, deployedOrigin);

		if (!prepared.includes(deployedOrigin)) {
			throw new Error(`${filename} does not contain the expected deployed origin.`);
		}

		await writeFile(outputPath, prepared);
	}),
);
