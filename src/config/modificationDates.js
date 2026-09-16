// Reviewed content dates, never the build clock. Advance shared when site-wide
// output changes; advance a template/page date for a more limited change.
export const modificationDates = {
	shared: '2026-09-14',
	archive: '2026-09-14',
	vehicle: '2026-09-14',
	pages: {
		'/': '2026-09-15',
		'/handwerk/': '2026-09-14',
		'/ueber-uns/': '2026-09-14',
		'/projekte/': '2026-08-06',
	},
};

export function pageModified(path, contentDates = []) {
	path = path.replace(/^\/en(?=\/)/, '');
	const template = /^\/projekte\/[^/]+\/[^/]+\/$/.test(path)
		? modificationDates.vehicle
		: path.startsWith('/projekte/') ? modificationDates.archive : undefined;
	return [modificationDates.shared, modificationDates.pages[path], template, ...contentDates]
		.filter(Boolean).sort().at(-1);
}
