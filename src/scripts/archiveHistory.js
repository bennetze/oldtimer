// Keep the local filter with its history entry; never put it into request URLs.
export function restoreArchiveQuery(history, path, fallback = '') {
	const saved = history.state?.vehicleArchiveSearch;
	return saved?.path === path && typeof saved.query === 'string' ? saved.query : fallback;
}

export function saveArchiveQuery(history, path, query) {
	try {
		const previous = history.state;
		history.replaceState({ ...(previous && typeof previous === 'object' ? previous : {}), vehicleArchiveSearch: { path, query } }, '');
	} catch {
		// Restricted/over-quota history must not disable local filtering.
	}
}
