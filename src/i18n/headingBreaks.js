// Run after localization so break opportunities work in both languages without
// changing authored wording, metadata, or the vehicle records themselves.
export function formatHeadingBreaks($) {
	$('h1,h2,h3,h4,h5,h6').each((_, heading) => {
		$(heading).find('*').addBack().contents().each((_, node) => {
			if (node.type !== 'text') return;
			let text = node.data;
			if ($(heading).closest('.legal-copy').length) {
				// Prefer the boundaries of these German compounds over browser
				// dictionaries that may leave a short grammatical ending alone.
				for (const [word, separation] of [
					['Vertretungsberechtigter', 'Vertretungs\u00adberechtigter'],
					['Verbraucherstreitbeilegung', 'Verbraucher\u00adstreitbeilegung'],
					['Universalschlichtungsstelle', 'Universal\u00adschlichtungsstelle'],
				]) text = text.replaceAll(word, separation);
				node.data = text;
			}
			const matches = [...text.matchAll(/\/(?=\p{L})|\b(?:Baujahr|Bj\.|year)\s+\d{4}\b|\bManaging Director\b/gu)];
			if (!matches.length) return;
			$(heading).attr('data-heading-breaks', '');
			const parts = [];
			let start = 0;
			for (const match of matches) {
				parts.push($('<span></span>').text(text.slice(start, match.index))[0]);
				if (match[0] === '/') {
					parts.push($('<span>/</span>')[0], $('<wbr>')[0]);
				} else {
					const phrase = $('<span class="heading-phrase"></span>').text(match[0]);
					parts.push(phrase[0]);
				}
				start = match.index + match[0].length;
			}
			const tail = $('<span></span>').text(text.slice(start));
			parts.push(tail[0]);
			$(node).replaceWith(parts);
		});
	});
}
