export function fragmentId(hash) {
	if (!hash?.startsWith('#') || hash.length === 1) return null;
	try { return decodeURIComponent(hash.slice(1)); }
	catch { return null; }
}
