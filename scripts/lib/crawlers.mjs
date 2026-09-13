import { pageModified } from '../../src/config/modificationDates.js';

export const productionOrigin = 'https://www.oldtimermanufaktur.de';
export const categories = ['aktuelle-projekte', 'vergangene-projekte', 'fahrzeugangebote'];
const escapeXml = (value) => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&apos;');

export function sitemapEntries(groups) {
	const entries = ['/', '/ueber-uns/', '/handwerk/', '/projekte/'].map((path) => [path, pageModified(path)]);
	categories.forEach((category, index) => {
		const dates = groups[index].map((vehicle) => vehicle.dateModified);
		const path = `/projekte/${category}/`;
		entries.push([path, pageModified(path, dates)]);
		if (category === 'vergangene-projekte') {
			for (let page = 2; page <= Math.ceil(groups[index].length / 24); page++) {
				const paginatedPath = `${path}seite/${page}/`;
				entries.push([paginatedPath, pageModified(paginatedPath, dates)]);
			}
		}
	});
	for (const vehicle of groups.flat()) entries.push([vehicle.route, pageModified(vehicle.route, [vehicle.dateModified])]);
	if (new Set(entries.map(([path]) => path)).size !== entries.length) throw new Error('Duplicate sitemap route.');
	return [...entries, ...entries.map(([path, date]) => [`/en${path}`, date])];
}

export function renderSitemap(entries) {
	return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.map(([path, date]) => `\t<url>\n\t\t<loc>${escapeXml(productionOrigin + path)}</loc>\n\t\t<lastmod>${date}</lastmod>\n\t</url>`).join('\n')}\n</urlset>\n`;
}

export function checkCrawlerFiles({ sitemap, llms, robots }, entries) {
	if (sitemap !== renderSitemap(entries)) throw new Error('Sitemap is stale. Run npm run vehicles:sync and review public/sitemap.xml.');
	const canonicalUrls = new Set(entries.map(([path]) => productionOrigin + path));
	const links = [...llms.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)].map((match) => match[1]);
	if (!llms.startsWith('# ') || !/^> /m.test(llms) || !/^## /m.test(llms) || !links.length) throw new Error('llms.txt must retain its Markdown title, summary, sections and canonical links.');
	for (const link of links) {
		if (!canonicalUrls.has(link)) throw new Error(`llms.txt contains a non-canonical or missing page: ${link}. Update the manual summary.`);
	}
	const references = [...robots.matchAll(/^Sitemap:\s*(\S+)\s*$/gim)].map((match) => match[1]);
	if (references.length !== 1 || references[0] !== `${productionOrigin}/sitemap.xml`) throw new Error('robots.txt must reference the production sitemap.');
}
