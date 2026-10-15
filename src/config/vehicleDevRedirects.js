const routeKey = /^(aktuelle-projekte|vergangene-projekte|fahrzeugangebote)\/[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function vehicleDevRedirect(pathname, base, mapping) {
	const prefix = base.replace(/\/?$/, '/');
	if (!pathname.startsWith(prefix)) return null;
	const path = pathname.slice(prefix.length);
	const match = /^(en\/)?projekte\/(.+?)\/?$/.exec(path);
	if (!match || !routeKey.test(match[2]) || !Object.hasOwn(mapping, match[2])) return null;
	const target = mapping[match[2]];
	if (typeof target !== 'string' || !routeKey.test(target) || target === match[2]) return null;
	return `${prefix}${match[1] || ''}projekte/${target}/`;
}
