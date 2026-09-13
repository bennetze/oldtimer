import { defineMiddleware } from 'astro:middleware';
import { createHash } from 'node:crypto';
import { load } from 'cheerio';
import { translate } from './i18n/translate.js';
import { languagePath } from './i18n/language.js';

// Static rendering keeps both languages readable without JavaScript. The same
// transformation also runs in dev, with one set of shared Astro page templates.
export const onRequest = defineMiddleware(async (context, next) => {
	const response = await next();
	if (!response.headers.get('content-type')?.includes('text/html')) return response;
	const base = import.meta.env.BASE_URL.replace(/\/?$/, '/');
	const english = /^en(?:\/|$)/.test(context.url.pathname.slice(base.length));
	const $ = load(await response.text());
	$('html').attr('lang', english ? 'en' : 'de');
	if ($('.not-found').length) $('html').attr('data-not-found', 'true');
	$(`[data-language="${english ? 'en' : 'de'}"]`).attr('aria-current', 'true');
	const origin = context.site?.origin || context.url.origin;
	const localizeUrl = (value: string) => {
		const url = new URL(value, origin);
		if (url.origin !== origin || !url.pathname.startsWith(base)) return value;
		if (!url.pathname.endsWith('/') && !url.pathname.endsWith('/404')) return value;
		if (url.hash === '#organization' || url.hash === '#website') return value;
		url.pathname = languagePath(url.pathname, 'en', base);
		return value.startsWith('/') ? `${url.pathname}${url.search}${url.hash}` : url.href;
	};
	if (!$('meta[name="robots"]').attr('content')?.includes('noindex')) {
		for (const lang of ['de', 'en', 'x-default']) {
			$('<link>').attr({ rel: 'alternate', hreflang: lang, href: new URL(languagePath(context.url.pathname, lang === 'en' ? 'en' : 'de', base), origin).href }).appendTo('head');
		}
	}
	if (english) {
		$('meta[property="og:locale"]').attr('content', 'en_GB');
		// The German Geschichte(n) suffix has no English equivalent.
		$('.hero-title__letter').remove();
		$('*').contents().each((_, node) => {
			if (node.type === 'text' && !$(node).parents('script,style').length) node.data = translate(node.data);
		});
		$('*').each((_, node) => {
			for (const attribute of ['alt', 'aria-label', 'placeholder', 'title', 'data-search-value', 'data-lightbox-alt']) {
				const value = $(node).attr(attribute);
				if (value) $(node).attr(attribute, translate(value));
			}
		});
		$('meta[name="description"],meta[property="og:title"],meta[property="og:description"],meta[property="og:image:alt"]').each((_, node) => {
			$(node).attr('content', translate($(node).attr('content') || ''));
		});
		$('a[href]:not([data-language]),link[rel="prev"],link[rel="next"]').each((_, node) => {
			const value = $(node).attr('href')!;
			if (value.startsWith(base) || value.startsWith(`${origin}${base}`)) $(node).attr('href', localizeUrl(value));
		});
		const localizeData = (value: unknown, key = ''): unknown => {
			if (Array.isArray(value)) return value.map((entry) => localizeData(entry, key));
			if (value && typeof value === 'object') {
				const node = value as Record<string, unknown>;
				if (node['@type'] === 'AutoRepair') return { ...node, description: translate(String(node.description || '')) };
				if (node['@type'] === 'WebSite') return { ...node, inLanguage: ['de-DE', 'en-GB'] };
				return Object.fromEntries(Object.entries(node).map(([k, v]) => [k, localizeData(v, k)]));
			}
			if (typeof value !== 'string') return value;
			if (key === 'inLanguage') return 'en-GB';
			if (['name', 'description', 'caption', 'serviceType'].includes(key)) return translate(value);
			if (['url', '@id', 'item', 'mainEntityOfPage'].includes(key) && value.startsWith(origin)) return localizeUrl(value);
			return value;
		};
		$('script[type="application/ld+json"]').each((_, node) => {
			$(node).text(JSON.stringify(localizeData(JSON.parse($(node).text()))).replace(/</g, '\\u003c'));
		});
	}
	// JSON-LD changes during localization; keep every inline script CSP-authorized.
	const policy = $('meta[http-equiv="content-security-policy"]');
	const hashes = $('script:not([src])').toArray().map((node) => `'sha256-${createHash('sha256').update($(node).html() || '').digest('base64')}'`);
	if (policy.length) policy.attr('content', (policy.attr('content') || '').replace(/(script-src(?:-elem)?)(?=\s|;|$)([^;]*)/g, (_, name, values) => `${name} ${[...new Set([...values.trim().split(/\s+/).filter(Boolean), ...hashes])].join(' ')}`));
	return new Response($.html(), { status: response.status, statusText: response.statusText, headers: response.headers });
});
