import { access, mkdir, stat, writeFile } from 'node:fs/promises';
import { extname, join, relative } from 'node:path';
import * as cheerio from 'cheerio';

const origin = 'https://www.oldtimermanufaktur.de';
const outputRoot = join(process.cwd(), 'src/pages/projekte');
const migrationDate = '2026-08-06';
const pageConcurrency = 2;
const imageConcurrency = 3;
const missingImages = [];
const recoveredImages = [];

const categories = [
	{
		key: 'aktuelle-projekte',
		legacyPath: '/aktuelle-projekte',
		starts: [0],
		expected: 13,
	},
	{
		key: 'vergangene-projekte',
		legacyPath: '/referenzen',
		starts: [0, 24, 48, 72, 96, 120],
		expected: 134,
	},
	{
		key: 'fahrzeugangebote',
		legacyPath: '/fahrzeugangebote',
		starts: [0],
		expected: 10,
	},
];

const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function fetchResponse(url, attempts = 4) {
	let lastError;

	for (let attempt = 1; attempt <= attempts; attempt += 1) {
		try {
			const response = await fetch(url, {
				headers: {
					'User-Agent': 'Oldtimermanufaktur site migration/1.0',
					Accept: 'text/html,application/xhtml+xml,image/avif,image/webp,image/*,*/*;q=0.8',
				},
				redirect: 'follow',
			});

			if (!response.ok) {
				throw new Error(`${response.status} ${response.statusText}`);
			}

			return response;
		} catch (error) {
			lastError = error;
			if (attempt < attempts) {
				await sleep(attempt * 650);
			}
		}
	}

	throw new Error(`Failed to fetch ${url}: ${lastError?.message ?? lastError}`);
}

async function fetchText(url) {
	return (await fetchResponse(url)).text();
}

async function mapConcurrent(items, concurrency, worker) {
	const results = new Array(items.length);
	let cursor = 0;

	async function run() {
		while (cursor < items.length) {
			const index = cursor;
			cursor += 1;
			results[index] = await worker(items[index], index);
		}
	}

	await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, run));
	return results;
}

async function existingImage(destinationBase) {
	for (const extension of ['.jpg', '.png', '.webp', '.avif', '.gif']) {
		const candidate = `${destinationBase}${extension}`;
		try {
			await access(candidate);
			if ((await stat(candidate)).size > 0) return candidate;
		} catch {
			// Try the next supported extension.
		}
	}
	return undefined;
}

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

function extractBlocks($) {
	const blocks = [];
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
		if (name === 'div' && element.attr('style')?.includes('clear')) return;

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

	for (const child of fullText[0]?.children ?? []) processBlock(child);

	return blocks.filter((block) => {
		if (block.type !== 'copy') return true;
		const text = normalizeText(cheerio.load(block.html).text());
		return Boolean(text);
	});
}

function extractYear(title) {
	return title.match(/(?:Baujahr|Bj\.?)[ ,:]*(\d{4})/i)?.[1];
}

function makeDescription(title, blocks) {
	const firstCopy = blocks.find((block) => {
		if (block.type !== 'copy') return false;
		return normalizeText(cheerio.load(block.html).text()).length >= 80;
	});
	const text = firstCopy ? normalizeText(cheerio.load(firstCopy.html).text()) : title;
	const description = text.length > 155 ? `${text.slice(0, 152).trimEnd()}…` : text;
	return description || title;
}

function normalizeMigratedHtml(html) {
	return html.replace(
		/Diese E-Mail-Adresse ist vor Spambots geschützt! Zur Anzeige muss JavaScript eingeschaltet sein!/g,
		'<a href="mailto:info@oldtimermanufaktur.de">info@oldtimermanufaktur.de</a>',
	);
}

function imageExtension(url, contentType = '') {
	const extension = extname(new URL(url).pathname).toLowerCase();
	if (['.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif'].includes(extension)) {
		return extension === '.jpeg' ? '.jpg' : extension;
	}

	if (contentType.includes('png')) return '.png';
	if (contentType.includes('webp')) return '.webp';
	if (contentType.includes('avif')) return '.avif';
	if (contentType.includes('gif')) return '.gif';
	return '.jpg';
}

async function downloadImage(url, destinationBase, { required = false } = {}) {
	const existing = await existingImage(destinationBase);
	if (existing) return existing;

	let response = await fetchResponse(url);
	let resolvedUrl = url;
	let type = response.headers.get('content-type') ?? '';
	if (!type.startsWith('image/') && url.endsWith('.jpg')) {
		const uppercaseExtensionUrl = `${url.slice(0, -4)}.JPG`;
		try {
			const fallbackResponse = await fetchResponse(uppercaseExtensionUrl);
			const fallbackType = fallbackResponse.headers.get('content-type') ?? '';
			if (fallbackType.startsWith('image/')) {
				response = fallbackResponse;
				resolvedUrl = uppercaseExtensionUrl;
				type = fallbackType;
				recoveredImages.push({ sourceUrl: url, recoveredUrl: uppercaseExtensionUrl });
			}
		} catch {
			// The legacy URL remains unavailable; report it below.
		}
	}
	if (!type.startsWith('image/')) {
		const message = `Expected image content for ${url}, received ${type || 'unknown type'}`;
		if (required) throw new Error(message);
		missingImages.push({ url, reason: message });
		console.warn(`Skipping unavailable legacy image: ${url}`);
		return undefined;
	}
	const extension = imageExtension(resolvedUrl, type);
	const destination = `${destinationBase}${extension}`;
	const image = Buffer.from(await response.arrayBuffer());
	if (!image.length) {
		const message = `Legacy image response was empty for ${url}`;
		if (required) throw new Error(message);
		missingImages.push({ url, reason: message });
		console.warn(`Skipping empty legacy image: ${url}`);
		return undefined;
	}
	await writeFile(destination, image);
	return destination;
}

function wrapperSource(category, slug) {
	return `---\nimport { getEntry } from 'astro:content';\nimport VehicleDetailPage from '../../../components/VehicleDetailPage.astro';\n\nconst vehicle = await getEntry('vehicles', '${category}/${slug}');\n\nif (!vehicle) {\n\tthrow new Error('Missing vehicle content for ${category}/${slug}.');\n}\n---\n\n<VehicleDetailPage {vehicle} />\n`;
}

async function inventoryCategory(category) {
	const pageUrls = category.starts.map((start) =>
		`${origin}${category.legacyPath}${start ? `?start=${start}` : ''}`,
	);
	const pages = await mapConcurrent(pageUrls, 3, fetchText);
	const items = [];

	for (const html of pages) {
		const $ = cheerio.load(html);
		$('.catItemView').each((_, item) => {
			const link = $(item).find('.catItemTitle a').first();
			const href = link.attr('href');
			const title = normalizeText(link.text());
			const cardSource = $(item).find('.catItemImage img').first().attr('src');
			if (!href || !title || !cardSource) return;

			const slug = href.split('/item/')[1]?.replace(/\/+$/, '');
			if (!slug) throw new Error(`Cannot derive a slug from ${href}`);
			items.push({
				category: category.key,
				slug,
				title,
				sourceUrl: absoluteUrl(href),
				cardSourceUrl: absoluteUrl(cardSource.replace(/_S(?=\.[^.]+$)/, '_XL')),
			});
		});
	}

	const uniqueItems = [...new Map(items.map((item) => [item.slug, item])).values()];
	if (uniqueItems.length !== category.expected) {
		throw new Error(
			`${category.key}: expected ${category.expected} vehicles, found ${uniqueItems.length}.`,
		);
	}

	return uniqueItems;
}

async function importVehicle(item, order) {
	const html = await fetchText(item.sourceUrl);
	const $ = cheerio.load(html);
	const sourceTitle = normalizeText($('.itemTitle').first().text()) || item.title;
	const sourceBlocks = extractBlocks($);
	const imageUrls = [];
	for (const block of sourceBlocks) {
		if (block.type === 'gallery-source') {
			for (const url of block.urls) {
				if (!imageUrls.includes(url)) imageUrls.push(url);
			}
		}
	}

	const vehicleDirectory = join(outputRoot, item.category, item.slug);
	await mkdir(vehicleDirectory, { recursive: true });

	const cardPath = await downloadImage(item.cardSourceUrl, join(vehicleDirectory, 'card'), {
		required: true,
	});
	const imagePaths = await mapConcurrent(imageUrls, imageConcurrency, async (url, index) => {
		return downloadImage(url, join(vehicleDirectory, `image-${String(index + 1).padStart(3, '0')}`));
	});
	const localImages = new Map(
		imageUrls.flatMap((url, index) => {
			const path = imagePaths[index];
			return path ? [[url, `./${relative(vehicleDirectory, path)}`]] : [];
		}),
	);

	let imageSequence = 0;
	const blocks = sourceBlocks.flatMap((block) => {
		if (block.type === 'copy') {
			const html = normalizeMigratedHtml(block.html);
			const plainText = normalizeText(cheerio.load(html).text()).toLowerCase();
			return [{
				type:
					plainText.includes('preis auf anfrage') ||
					plainText.includes('kontaktieren sie uns')
						? 'contact'
						: 'copy',
				html,
			}];
		}

		const images = block.urls.flatMap((url) => {
			const src = localImages.get(url);
			if (!src) return [];
			imageSequence += 1;
			return [{
				src,
				alt: `${sourceTitle} – Aufnahme ${imageSequence} der Fahrzeugdokumentation`,
			}];
		});
		if (!images.length) return [];

		return [{
			type: 'gallery',
			images,
		}];
	});

	const firstDownloadedImage = imagePaths.find(Boolean);
	const firstImage = firstDownloadedImage
		? `./${relative(vehicleDirectory, firstDownloadedImage)}`
		: `./${relative(vehicleDirectory, cardPath)}`;
	const record = {
		slug: item.slug,
		category: item.category,
		title: sourceTitle,
		description: makeDescription(sourceTitle, blocks),
		sourceUrl: item.sourceUrl,
		order,
		dateModified: migrationDate,
		...(extractYear(sourceTitle) ? { year: extractYear(sourceTitle) } : {}),
		cardImage: `./${relative(vehicleDirectory, cardPath)}`,
		cardImageAlt: sourceTitle,
		leadImage: firstImage,
		leadImageAlt: `${sourceTitle} – Fahrzeugdokumentation`,
		blocks,
	};

	await writeFile(join(vehicleDirectory, 'vehicle.json'), `${JSON.stringify(record, null, '\t')}\n`);
	await writeFile(
		join(outputRoot, item.category, `${item.slug}.astro`),
		wrapperSource(item.category, item.slug),
	);

	return {
		...item,
		images: imagePaths.filter(Boolean).length + 1,
		blocks: blocks.length,
	};
}

await mkdir(outputRoot, { recursive: true });
for (const category of categories) {
	await mkdir(join(outputRoot, category.key), { recursive: true });
}

const inventoryGroups = await mapConcurrent(categories, 3, inventoryCategory);
const inventory = inventoryGroups.flatMap((items, categoryIndex) =>
	items.map((item, index) => ({ ...item, order: index + 1, categoryIndex })),
);

let completed = 0;
const imported = await mapConcurrent(inventory, pageConcurrency, async (item) => {
	const result = await importVehicle(item, item.order);
	completed += 1;
	console.log(`[${completed}/${inventory.length}] ${item.category}/${item.slug}`);
	return result;
});

const audit = {
	migratedAt: new Date().toISOString(),
	origin,
	vehicles: imported.length,
	images: imported.reduce((sum, item) => sum + item.images, 0),
	blocks: imported.reduce((sum, item) => sum + item.blocks, 0),
	missingImages,
	recoveredImages,
	categories: Object.fromEntries(
		categories.map((category) => [
			category.key,
			imported.filter((item) => item.category === category.key).length,
		]),
	),
};

await writeFile(
	join(process.cwd(), 'VEHICLE-MIGRATION-AUDIT.json'),
	`${JSON.stringify(audit, null, '\t')}\n`,
);
console.log(JSON.stringify(audit, null, 2));
