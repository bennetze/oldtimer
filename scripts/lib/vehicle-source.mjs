// Read the client's original vehicle documentation without its site chrome.
import * as cheerio from 'cheerio';
const origin = 'https://www.oldtimermanufaktur.de';

function normalizeText(value) {
	return value
		.replaceAll('\u00a0', ' ')
		.replace(/[ \t]+/g, ' ')
		.replace(/ *\n */g, '\n')
		.replace(/\n{3,}/g, '\n\n')
		.trim();
}

function escapeHtml(value) {
	return value
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;');
}

function absoluteUrl(path) {
	return new URL(path, origin).href;
}

function getImageUrl(element) {
	const link = element.name === 'a' ? element.attribs?.href : undefined;
	const source = element.name === 'img' ? element.attribs?.src : undefined;
	const url = link ?? source;

	if (!url || url.includes('/transparent.gif')) {
		return undefined;
	}

	return absoluteUrl(url);
}

function tokenizeInline($, nodes, wrapper = 'p') {
	const blocks = [];
	let html = '';
	let gallery = [];

	const flushText = () => {
		const normalized = normalizeText(html.replace(/^(?:<br\s*\/?\s*>)+|(?:<br\s*\/?\s*>)+$/gi, ''));
		if (normalized && normalizeText(cheerio.load(normalized).text())) {
			blocks.push({ type: 'copy', html: `<${wrapper}>${normalized}</${wrapper}>` });
		}
		html = '';
	};

	const flushGallery = () => {
		if (gallery.length) {
			blocks.push({ type: 'gallery-source', urls: gallery });
		}
		gallery = [];
	};

	const appendText = (fragment) => {
		flushGallery();
		html += fragment;
	};

	const appendImage = (url) => {
		if (!url) return;
		flushText();
		gallery.push(url);
	};

	const walk = (node) => {
		if (node.type === 'text') {
			appendText(escapeHtml(node.data ?? ''));
			return;
		}

		if (node.type !== 'tag') return;
		const name = node.name.toLowerCase();
		const element = $(node);

		if (name === 'script' || name === 'style') return;
		if (name === 'br') {
			appendText('<br />');
			return;
		}
		if (name === 'img') {
			appendImage(getImageUrl(node));
			return;
		}
		if (name === 'a' && element.hasClass('sigFreeLink')) {
			appendImage(getImageUrl(node));
			return;
		}
		if (name === 'ul' && element.hasClass('sigFreeContainer')) {
			element.find('a.sigFreeLink').each((_, anchor) => appendImage(getImageUrl(anchor)));
			return;
		}

		const allowedName = name === 'b' ? 'strong' : name === 'i' ? 'em' : name;
		const preserve = ['strong', 'em'].includes(allowedName);
		if (preserve) appendText(`<${allowedName}>`);
		for (const child of node.children ?? []) walk(child);
		if (preserve) appendText(`</${allowedName}>`);
	};

	for (const node of nodes) walk(node);
	flushText();
	flushGallery();
	return blocks;
}

export function extractVehicleSource($) {
	const blocks = [];
	const groups = [];
	const fullText = $('.itemFullText').first();

	const processBlock = (node) => {
		if (node.type === 'text') {
			if (normalizeText(node.data ?? '')) {
				blocks.push(...tokenizeInline($, [node]));
			}
			return;
		}
		if (node.type !== 'tag') return;

		const name = node.name.toLowerCase();
		const element = $(node);
		if (name === 'script' || name === 'style') return;


		if (name === 'img' || name === 'a') {
			blocks.push(...tokenizeInline($, [node]));
			return;
		}
		if (name === 'ul' && element.hasClass('sigFreeContainer')) {
			const urls = [];
			element.find('a.sigFreeLink').each((_, anchor) => {
				const url = getImageUrl(anchor);
				if (url) urls.push(url);
			});
			if (urls.length) blocks.push({ type: 'gallery-source', urls });
			return;
		}

		if (['p', 'h2', 'h3', 'blockquote'].includes(name)) {
			const wrapper = name === 'blockquote' ? 'blockquote' : name;
			blocks.push(...tokenizeInline($, node.children ?? [], wrapper));
			return;
		}

		for (const child of node.children ?? []) processBlock(child);
	};

	const collectGroup = (node) => {
		// Structural/clearing divs may contain a whole article. Only an actual
		// paragraph/gallery is a photo-and-copy group, never the outer wrapper.
		if (node.type === 'tag' && !['p', 'h2', 'h3', 'blockquote', 'ul'].includes(node.name) && !['img', 'a'].includes(node.name)) {
			if (['script', 'style'].includes(node.name)) return;
			for (const child of node.children ?? []) collectGroup(child);
			return;
		}
		const start = blocks.length;
		processBlock(node);
		if (blocks.length > start) groups.push(Array.from({ length: blocks.length - start }, (_, index) => start + index));
	};
	for (const child of fullText[0]?.children ?? []) collectGroup(child);

	return { groups, blocks: blocks.filter((block) => {
		if (block.type !== 'copy') return true;
		const text = normalizeText(cheerio.load(block.html).text());
		return Boolean(text);
	}) };
}
