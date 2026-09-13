export function preferredLanguage(languages = [], language = '') {
	const primary = languages[0] || language;
	return /^de(?:-|$)/i.test(primary) ? 'de' : 'en';
}

export function languagePath(pathname, language, base = '/') {
	const prefix = base.endsWith('/') ? base : `${base}/`;
	let path = pathname.startsWith(prefix) ? pathname.slice(prefix.length) : '';
	path = path.replace(/^en(?:\/|$)/, '');
	if (/^404(?:\.html|\/)?$/.test(path)) return `${prefix}${language === 'en' ? 'en/404/' : '404.html'}`;
	return `${prefix}${language === 'en' ? 'en/' : ''}${path}`;
}
