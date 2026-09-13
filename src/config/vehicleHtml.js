import { load } from 'cheerio';

const allowedTags = new Set(['p', 'h2', 'h3', 'strong', 'em', 'br', 'blockquote', 'ul', 'ol', 'li', 'a']);

export function validateVehicleHtml(html, context = 'Vehicle HTML') {
	const fail = (reason) => { throw new Error(`${context}: ${reason}`); };
	// Preserve wrapper tags during validation rather than letting the HTML parser
	// silently discard a body/html element containing an event handler.
	const $ = load(html, { xml: { xmlMode: false, decodeEntities: true } }, false);
	$('*').each((_, element) => {
		if (!allowedTags.has(element.name)) fail(`unsupported <${element.name}> element`);
		for (const [name, value] of Object.entries(element.attribs)) {
			if (element.name !== 'a' || !['href', 'title'].includes(name)) {
				fail(`unsupported ${name} attribute on <${element.name}>`);
			}
			if (name === 'href') {
				if (/[\u0000-\u0020\u007f\\]/.test(value)) fail('invalid link URL');
				const relative = value.startsWith('/') && !value.startsWith('//');
				let url;
				try { url = new URL(value, relative ? 'https://www.oldtimermanufaktur.de' : undefined); }
				catch { fail('invalid link URL'); }
				if (!['https:', 'mailto:', 'tel:'].includes(url.protocol) || !url.pathname || url.username || url.password) {
					fail('unsupported link URL');
				}
			}
		}
	});
	if (!$.root().text().trim()) fail('empty editorial content');
	// Render the validated serialization, never the unchecked original string.
	return $.html();
}

export function validateVehicleBlocks(blocks, context) {
	return blocks.map((block, index) => block.type === 'copy' || block.type === 'contact'
		? { ...block, html: validateVehicleHtml(block.html, `${context}, block ${index + 1}`) }
		: block);
}
