import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { load } from 'cheerio';
import { pathToFileURL } from 'node:url';
import { validateRedirects } from './lib/vehicle-import.mjs';
import { discoverVehicleCategory } from './lib/vehicle-files.mjs';
import { categories } from './lib/crawlers.mjs';

export async function prepareVehicleRedirects(root, target) {
	if (!['production', 'github-pages'].includes(target)) throw new Error('Invalid redirect build target.');
	const mapping = JSON.parse(await readFile(join(root, 'src/config/vehicle-redirects.json'), 'utf8'));
	const vehicles = (await Promise.all(categories.map((key) => discoverVehicleCategory(join(root, 'src/pages/projekte'), { key })))).flat();
	validateRedirects(mapping, new Set(vehicles.map((item) => `${item.category}/${item.slug}`)));
	const base = target === 'github-pages' ? '/oldtimer' : '';
	const origin = target === 'github-pages' ? 'https://bennetze.github.io' : 'https://www.oldtimermanufaktur.de';
	const apache = [];
	for (const [from, to] of Object.entries(mapping)) {
		// Reuse the destination's complete head (CSP/OG/local assets), remove active
		// UI and emit a noindex, accessible redirect outside source discovery.
		for (const language of ['', 'en/']) {
			const destination = join(root, 'dist', language, 'projekte', to, 'index.html');
			let html;
			try { html = await readFile(destination, 'utf8'); }
			catch (error) { if (language && error.code === 'ENOENT') continue; throw error; }
			const $ = load(html);
			const url = `${base}/${language}projekte/${to}/`;
			$('link[rel="canonical"], link[rel="alternate"], script, meta[name="robots"], meta[http-equiv="refresh"]').remove();
			$('head').append('<meta name="robots" content="noindex,follow">');
			$('<meta http-equiv="refresh">').attr('content', `0;url=${url}`).appendTo('head');
			$('meta[property="og:url"]').attr('content', `${origin}${base}/${language}projekte/${from}/`);
			$('body').empty();
			const main = $('<main id="main-content" tabindex="-1"></main>');
			main.append($('<h1></h1>').text(language ? 'Vehicle moved' : 'Fahrzeug verschoben'));
			main.append($('<a></a>').attr('href', url).text(language ? 'Open vehicle page' : 'Zur Fahrzeugseite'));
			$('body').append(main);
			const output = join(root, 'dist', language, 'projekte', from, 'index.html');
			await mkdir(dirname(output), { recursive: true });
			await writeFile(output, $.html());
			apache.push(`RedirectMatch 301 ^/${language}projekte/${from}/?$ /${language}projekte/${to}/`);
		}
	}
	const htaccess = join(root, 'dist/.htaccess');
	const original = (await readFile(htaccess, 'utf8')).replace(/\n# BEGIN VEHICLE MOVES[\s\S]*?# END VEHICLE MOVES\n?/g, '\n');
	await writeFile(htaccess, `${original}${apache.length ? `\n# BEGIN VEHICLE MOVES\n${apache.join('\n')}\n# END VEHICLE MOVES\n` : ''}`);
	console.log(`Prepared ${Object.keys(mapping).length} vehicle move redirects.`);
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await prepareVehicleRedirects(process.cwd(), process.argv[2]);
