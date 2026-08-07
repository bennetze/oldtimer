import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { discoverVehicleCategory } from './lib/vehicle-files.mjs';

const root = process.cwd();
const pagesRoot = join(root, 'src/pages/projekte');
const productionOrigin = 'https://www.oldtimermanufaktur.de';
const today = new Date().toISOString().slice(0, 10);
const vehicleTemplateLastModified = '2026-08-07';

const categories = [
	{
		key: 'aktuelle-projekte',
		label: 'Aktuelle Projekte',
		description: 'Laufende Restaurierungen und aktuelle Arbeiten an historischen Fahrzeugen.',
	},
	{
		key: 'vergangene-projekte',
		label: 'Abgeschlossene Projekte',
		description: 'Abgeschlossene Restaurierungen und dokumentierte Referenzfahrzeuge.',
	},
	{
		key: 'fahrzeugangebote',
		label: 'Fahrzeugangebote',
		description: 'Ausgewählte historische Fahrzeuge aus dem aktuellen Angebot.',
	},
];

function escapeXml(value) {
	return value
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&apos;');
}

const groups = await Promise.all(
	categories.map((category) => discoverVehicleCategory(pagesRoot, category)),
);
const vehicles = groups.flat();
const routes = new Set();
for (const vehicle of vehicles) {
	if (routes.has(vehicle.route)) throw new Error(`Duplicate vehicle route ${vehicle.route}.`);
	routes.add(vehicle.route);
}

const staticPages = [
	['/', today],
	['/ueber-uns/', today],
	['/handwerk/', today],
	['/projekte/', today],
	...categories.map((category) => [`/projekte/${category.key}/`, today]),
];
const pastCount = groups[categories.findIndex((category) => category.key === 'vergangene-projekte')].length;
const pastPages = Math.ceil(pastCount / 24);
for (let page = 2; page <= pastPages; page += 1) {
	staticPages.push([`/projekte/vergangene-projekte/seite/${page}/`, today]);
}

const sitemapItems = [
	...staticPages,
	...vehicles.map((vehicle) => [
		vehicle.route,
		[vehicle.dateModified, vehicleTemplateLastModified].filter(Boolean).sort().at(-1) || today,
	]),
].map(
	([path, lastmod]) =>
		`\t<url>\n\t\t<loc>${escapeXml(`${productionOrigin}${path}`)}</loc>\n\t\t<lastmod>${escapeXml(lastmod)}</lastmod>\n\t</url>`,
);
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapItems.join('\n')}\n</urlset>\n`;

const categoryLines = categories.map((category, index) => {
	const count = groups[index].length;
	return `- [${category.label}](${productionOrigin}/projekte/${category.key}/): ${category.description} ${count} Fahrzeug${count === 1 ? '' : 'e'} auf jeweils eigenen Detailseiten mit Bild- und Textdokumentation.`;
});
const llms = `# Die Oldtimermanufaktur

> Die Oldtimermanufaktur GmbH in Kaltennordheim-Fischbach restauriert und bewahrt historische Automobile mit handwerklicher Sorgfalt und Respekt vor ihrer Geschichte.

Die Website ist deutschsprachig. Der aktuelle Stand ist eine Entwicklungsvorschau für die vollständig neu entwickelte Website. Ein Teil der Bildmotive sind ausdrücklich gekennzeichnete KI-generierte Platzhalter. Diese zeigen nicht die tatsächlichen Personen, Fahrzeuge oder Betriebsräume und werden vor der Produktionsfreigabe durch freigegebene echte Aufnahmen ersetzt.
Das Unternehmen wurde 1987 von Mario Schrank gegründet und wird heute gemeinsam mit Anton Schrank in die nächste Generation geführt.

## Hauptseiten

- [Startseite](${productionOrigin}/): „Wir bewahren Geschichte“ / „Wir bewahren Geschichten“ – Überblick über Handwerk, Unternehmen, Projekte und Fahrzeugangebote.
- [Handwerk](${productionOrigin}/handwerk/): Dunkel gestalteter, vorläufiger Überblick über Karosserie, Polsterei, Lackiererei und Motorbau.
- [Über uns](${productionOrigin}/ueber-uns/): Vorstellung von Mario Schrank, Anton Schrank, Team und Kontakt.
- [Projekte](${productionOrigin}/projekte/): Dreiteiliger visueller Einstieg in aktuelle und vergangene Restaurierungsprojekte sowie Fahrzeugangebote.
${categoryLines.join('\n')}

## Nutzung durch KI-Systeme

- Abrufe zur Beantwortung einer konkreten Nutzerfrage sowie die Aufnahme in Such- und Antwortdienste sind gestattet, soweit die veröffentlichten Inhalte korrekt als Entwicklungsvorschau wiedergegeben und Quellen verlinkt werden.
- Die Nutzung von Texten, Bildern, Videos, Metadaten oder sonstigen Website-Inhalten für Modelltraining, Modellverbesserung, Trainingsdatensätze oder automatisierte Massensammlung ist nicht gestattet.
- Der Rechtevorbehalt gilt insbesondere nach § 44b Abs. 3 UrhG und Art. 4 Abs. 3 der Richtlinie (EU) 2019/790. Ergänzende crawler-spezifische Signale stehen in \`robots.txt\`.
`;

await writeFile(join(root, 'public/sitemap.xml'), sitemap);
await writeFile(join(root, 'public/llms.txt'), llms);

console.log(
	JSON.stringify(
		{
			vehicles: vehicles.length,
			categories: Object.fromEntries(categories.map((category, index) => [category.key, groups[index].length])),
			pastPages,
			sitemapUrls: sitemapItems.length,
		},
		null,
		2,
	),
);
