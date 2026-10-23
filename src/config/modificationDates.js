// Reviewed content dates, never the build clock. Advance shared when site-wide
// output changes; advance a template/page date for a more limited change.
export const modificationDates = {
	shared: '2026-10-14',
	archive: '2026-10-23',
	vehicle: '2026-10-14',
	pages: {
		'/impressum/': '2026-10-11',
		'/datenschutz/': '2026-10-09',
		'/404.html': '2026-09-28',
		'/': '2026-10-09',
		'/handwerk/': '2026-10-23',
		'/ueber-uns/': '2026-10-23',
		'/projekte/': '2026-10-13',
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
