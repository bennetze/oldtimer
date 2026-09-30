import { load } from 'cheerio';

// Visually reviewed English phrases in German copy. Proper names and technical
// terms remain in the original language context. Never translate authored text.
const englishPhrase = /\b(?:The Winner is:|The WINNER!|Best of Show)/gi;

export function annotateVehicleLanguageParts(validatedHtml, language) {
	if (language !== 'de') return validatedHtml;
	const $ = load(validatedHtml, {}, false);
	$('*').contents().toArray().forEach(node => {
		if (node.type !== 'text' || $(node).parents('[lang]').length) return;
		const text = node.data;
		const matches = [...text.matchAll(englishPhrase)];
		if (!matches.length) return;
		const fragments = [];
		let start = 0;
		for (const match of matches) {
			if (match.index > start) fragments.push($('<span>').text(text.slice(start, match.index)).html());
			fragments.push($.html($('<span>').attr('lang', 'en').text(match[0])));
			start = match.index + match[0].length;
		}
		if (start < text.length) fragments.push($('<span>').text(text.slice(start)).html());
		$(node).replaceWith(fragments.join(''));
	});
	return $.html();
}
