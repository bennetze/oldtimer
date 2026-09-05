// Reviewed content dates, never the build clock. Advance shared when site-wide
// output changes; advance a template/page date for a more limited change.
export const modificationDates = {
	shared: '2026-09-05',
	archive: '2026-09-05',
	vehicle: '2026-09-05',
	pages: {
		'/': '2026-09-05',
		'/handwerk/': '2026-08-03',
		'/ueber-uns/': '2026-08-03',
		'/projekte/': '2026-08-06',
	},
};

export function pageModified(path, contentDates = []) {
	const template = /^\/projekte\/[^/]+\/[^/]+\/$/.test(path)
		? modificationDates.vehicle
		: path.startsWith('/projekte/') ? modificationDates.archive : undefined;
	return [modificationDates.shared, modificationDates.pages[path], template, ...contentDates]
		.filter(Boolean).sort().at(-1);
}
