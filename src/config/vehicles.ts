import { getCollection, type CollectionEntry } from 'astro:content';

export type VehicleEntry = CollectionEntry<'vehicles'>;
export type VehicleCategoryKey = VehicleEntry['data']['category'];

export const vehicleCategories = [
	{
		key: 'aktuelle-projekte',
		label: 'Aktuelle Projekte',
		heading: 'Aktuelle Projekte',
		description:
			'Einblicke in laufende Restaurierungen und aktuelle Arbeiten an historischen Fahrzeugen.',
	},
	{
		key: 'vergangene-projekte',
		label: 'Abgeschlossene Projekte',
		heading: 'Abgeschlossene Projekte',
		description:
			'Abgeschlossene Restaurierungen und ausgewählte Referenzen aus der Geschichte unserer Manufaktur.',
	},
	{
		key: 'fahrzeugangebote',
		label: 'Fahrzeugangebote',
		heading: 'Fahrzeugangebote',
		description: 'Ausgewählte historische Fahrzeuge aus dem aktuellen Angebot unserer Manufaktur.',
	},
] as const;

export const categoryByKey = Object.fromEntries(
	vehicleCategories.map((category) => [category.key, category]),
) as Record<VehicleCategoryKey, (typeof vehicleCategories)[number]>;

export const vehicleRoute = (vehicle: VehicleEntry) =>
	`/projekte/${vehicle.data.category}/${vehicle.data.slug}/`;

export const vehicleImageRoute = (vehicle: VehicleEntry, source: string) => {
	const filename = source.replace(/^\.\//, '').replace(/\.[^.]+$/, '.webp');
	return `/vehicle-gallery/${vehicle.data.category}/${vehicle.data.slug}/${filename}`;
};

export function vehicleSlugsFromPageGlob(pageModules: Record<string, unknown>) {
	return Object.keys(pageModules)
		.map((path) => path.split('/').at(-1) ?? '')
		.filter((filename) => filename.endsWith('.astro') && filename !== 'index.astro')
		.map((filename) => filename.replace(/\.astro$/, ''))
		.sort();
}

export async function getDiscoveredVehicles(
	category: VehicleCategoryKey,
	pageModules: Record<string, unknown>,
) {
	const pageSlugs = vehicleSlugsFromPageGlob(pageModules);
	const pageSlugSet = new Set(pageSlugs);
	const collectionEntries = await getCollection(
		'vehicles',
		(entry) => entry.data.category === category,
	);
	const entryBySlug = new Map(collectionEntries.map((entry) => [entry.data.slug, entry]));

	const missingRecords = pageSlugs.filter((slug) => !entryBySlug.has(slug));
	const orphanRecords = collectionEntries
		.filter((entry) => !pageSlugSet.has(entry.data.slug))
		.map((entry) => entry.data.slug);

	if (missingRecords.length || orphanRecords.length) {
		throw new Error(
			`${category}: page/folder mismatch. Missing records: ${missingRecords.join(', ') || 'none'}; orphan records: ${orphanRecords.join(', ') || 'none'}.`,
		);
	}

	return pageSlugs
		.map((slug) => entryBySlug.get(slug))
		.filter((entry): entry is VehicleEntry => Boolean(entry))
		.sort(
			(left, right) =>
				left.data.order - right.data.order || left.data.title.localeCompare(right.data.title, 'de'),
		);
}

export async function getCategoryVehicles(category: VehicleCategoryKey) {
	return (await getCollection('vehicles', (entry) => entry.data.category === category)).sort(
		(left, right) =>
			left.data.order - right.data.order || left.data.title.localeCompare(right.data.title, 'de'),
	);
}
