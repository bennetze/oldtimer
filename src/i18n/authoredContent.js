import { translate } from './translate.js';

// Only site-owned text passes through the dictionary. Authored vehicle fields
// carry an explicit boundary so identical wording in other records cannot collide.
export function translateSiteText($) {
	$('*').contents().each((_, node) => {
		if (node.type === 'text' && !$(node).parents('script,style,[data-authored]').length) node.data = translate(node.data);
	});
	$('*').each((_, node) => {
		if ($(node).closest('[data-authored]').length) return;
		for (const attribute of ['alt', 'aria-label', 'placeholder', 'title', 'data-search-value', 'data-lightbox-alt']) {
			const value = $(node).attr(attribute);
			if (value) $(node).attr(attribute, translate(value));
		}
	});
	$('meta[name="description"],meta[property="og:title"],meta[property="og:description"],meta[property="og:image:alt"]').each((_, node) => {
		if (!$(node).is('[data-authored]')) $(node).attr('content', translate($(node).attr('content') || ''));
	});
}

export function localizeStructuredData(value, english, localizeUrl, key = '') {
	if (Array.isArray(value)) return value.map(entry => localizeStructuredData(entry, english, localizeUrl, key));
	if (value && typeof value === 'object') {
		if (english && value['@type'] === 'AutoRepair') return { ...value, description: translate(String(value.description || '')) };
		if (english && value['@type'] === 'WebSite') return { ...value, inLanguage: ['de-DE', 'en-GB'] };
		const authored = Array.isArray(value.__authored) ? value.__authored : [];
		return Object.fromEntries(Object.entries(value).filter(([k]) => k !== '__authored').map(([k, v]) => [k, authored.includes(k) ? v : localizeStructuredData(v, english, localizeUrl, k)]));
	}
	if (!english || typeof value !== 'string') return value;
	if (key === 'inLanguage') return 'en-GB';
	if (['name', 'description', 'caption', 'serviceType'].includes(key)) return translate(value);
	if (['url', '@id', 'item', 'mainEntityOfPage'].includes(key)) return localizeUrl(value);
	return value;
}
