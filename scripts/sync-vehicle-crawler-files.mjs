import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { discoverVehicleCategory } from './lib/vehicle-files.mjs';
import { categories, sitemapEntries, renderSitemap, checkCrawlerFiles } from './lib/crawlers.mjs';

const check = process.argv.includes('--check');
const root = process.cwd();
const groups = await Promise.all(categories.map((key) => discoverVehicleCategory(join(root, 'src/pages/projekte'), { key })));
const entries = sitemapEntries(groups);
const publicPath = (filename) => join(root, 'public', filename);
if (!check) await writeFile(publicPath('sitemap.xml'), renderSitemap(entries));
checkCrawlerFiles({
	sitemap: await readFile(publicPath('sitemap.xml'), 'utf8'),
	llms: await readFile(publicPath('llms.txt'), 'utf8'),
	robots: await readFile(publicPath('robots.txt'), 'utf8'),
}, entries);
console.log(`${check ? 'Validated' : 'Synchronized'} ${entries.length} sitemap URLs; manual llms.txt and robots.txt validated without rewriting.`);
