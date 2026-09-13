// Runs in the head, before paint. No persistence, network lookup or fingerprinting.
(() => {
	const root = document.documentElement;
	const base = root.dataset.siteBase || '/';
	const url = new URL(location.href);
	const relative = url.pathname.slice(base.length);
	const english = /^en(?:\/|$)/.test(relative);
	const explicit = url.searchParams.get('lang');
	const chosen = explicit === 'de' || explicit === 'en' ? explicit : null;
	const preferred = /^de(?:-|$)/i.test(navigator.languages?.[0] || navigator.language || '') ? 'de' : 'en';
	// /en/ is an explicit shareable choice. Bare German routes detect the browser.
	const language = chosen || (english ? 'en' : preferred);
	if (root.dataset.notFound === 'true' && root.lang !== language) {
		url.pathname = `${base}${language === 'en' ? 'en/404/' : '404.html'}`;
		location.replace(url.href);
		return;
	}
	if (root.dataset.notFound !== 'true' && (language === 'en') !== english) {
		let path = relative.replace(/^en(?:\/|$)/, '');
		if (/^404(?:\/|\.html)?$/.test(path)) path = language === 'en' ? '404/' : '404.html';
		url.pathname = `${base}${language === 'en' ? 'en/' : ''}${path}`;
		location.replace(url.href);
		return;
	}
	document.addEventListener('DOMContentLoaded', () => {
		for (const link of document.querySelectorAll('a[href]')) {
			const target = new URL(link.href, location.href);
			if (target.origin !== location.origin || !target.pathname.startsWith(base)) continue;
			if (link.hasAttribute('data-language')) {
				target.search = url.search;
				target.searchParams.set('lang', link.dataset.language);
				target.hash = url.hash;
			} else if (chosen && (target.pathname.endsWith('/') || target.pathname.endsWith('.html'))) {
				target.searchParams.set('lang', language);
			} else continue;
			link.href = `${target.pathname}${target.search}${target.hash}`;
		}
	});
})();
