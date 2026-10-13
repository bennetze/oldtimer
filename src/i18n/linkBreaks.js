// Format literal URLs after localization. Keep wording and destinations intact,
// but allow narrow text columns to wrap at punctuation instead of inside names.
export function formatLegalLinkBreaks($) {
	$('.legal-copy a').each((_, anchor) => {
		$(anchor).contents().each((_, node) => {
			if (node.type !== 'text' || !/^(?:https?:\/\/|www\.|[^\s@]+@[^\s@]+\.)/.test(node.data.trim())) return;
			const text = node.data;
			const parts = [];
			let start = 0;
			for (const match of text.matchAll(/https?:\/\/|[\/.@?&=_-]/g)) {
				const end = match.index + match[0].length;
				parts.push($('<span></span>').text(text.slice(start, end))[0], $('<wbr>')[0]);
				start = end;
			}
			parts.push($('<span></span>').text(text.slice(start))[0]);
			$(node).replaceWith(parts);
			$(anchor).attr('data-link-breaks', '');
		});
	});
}
