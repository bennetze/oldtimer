// Static accessibility invariants, not a WCAG or assistive-technology certification.
import { readdir, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { load } from 'cheerio';
const root = process.argv[2] || 'dist';
const files = [];
async function collect(dir) {
	for (const entry of await readdir(dir, { withFileTypes: true })) {
		const path = join(dir, entry.name);
		if (entry.isDirectory()) await collect(path);
		else if (entry.name.endsWith('.html')) files.push(path);
	}
}
await collect(root);
const failures = [];
const headingJumps = [];
let redirects = 0;
let images = 0, galleryLinks = 0, genericAlternatives = 0;
for (const file of files) {
	const $ = load(await readFile(file, 'utf8'));
	if ($('meta[http-equiv="refresh"]').length) { redirects++; continue; }
	const fail = message => failures.push(`${relative(root, file)}: ${message}`);
	if (!['de', 'en'].includes($('html').attr('lang'))) fail('missing/invalid language');
	if ($('main#main-content[tabindex="-1"]').length !== 1) fail('exactly one focusable main required');
	if ($('h1').length !== 1) fail('exactly one primary heading required');
	let level = 0;
	$('h1,h2,h3,h4,h5,h6').each((_, node) => { const next = Number(node.tagName.slice(1)); if (next > level + 1) headingJumps.push(`${relative(root, file)}: ${node.tagName} after h${level}`); level = next; });
	if (!$('title').text().trim()) fail('missing page title');
	if (!$('a.skip-link[href="#main-content"]').length) fail('missing skip link');
	const ids = new Set();
	$('[id]').each((_, node) => { const id = $(node).attr('id'); if (ids.has(id)) fail(`duplicate ID: ${id}`); ids.add(id); });
	$('[aria-labelledby], [aria-describedby], [aria-controls]').each((_, node) => {
		for (const key of ['aria-labelledby', 'aria-describedby', 'aria-controls']) {
			for (const id of ($(node).attr(key)?.split(/\s+/) || [])) if (!ids.has(id)) fail(`${key} target missing: ${id}`);
		}
	});
	$('img').each((_, node) => {
		images++;
		if ($(node).attr('alt') === undefined) fail('image missing alternative attribute');
		if (/Aufnahme \d+ der Fahrzeugdokumentation|photograph \d+ in the vehicle record/.test($(node).attr('alt') || '')) genericAlternatives++;
	});
	$('button, a[href], input:not([type="hidden"])').each((_, node) => {
		const el = $(node);
		const id = el.attr('id');
		const label = el.attr('aria-label') || (el.attr('aria-labelledby') || '').split(/\s+/).map(id => $(`[id="${id}"]`).text()).join(' ') ||
			(id ? $(`label[for="${id}"]`).text() : '') || el.closest('label').text() || el.text() || el.find('img').attr('alt');
		if (!label?.trim()) fail(`unnamed control: ${node.tagName}`);
	});
	$('input[aria-label][id]').each((_, node) => {
		const label = $(`label[for="${$(node).attr('id')}"]`).text().replace(/\s+/g, ' ').trim().toLowerCase();
		if (label && !$(node).attr('aria-label').toLowerCase().includes(label)) fail('input accessible name must contain its visible label');
	});
	$('[data-lightbox-trigger]').each((_, node) => {
		galleryLinks++;
		if (node.tagName !== 'a' || $(node).attr('href') !== $(node).attr('data-lightbox-src')) fail('gallery requires a direct image link fallback');
	});
	if ($('[data-system-pointer]').length !== 1) fail('missing pointer preference');
	if ($('.menu-toggle').attr('href') !== '#site-footer') fail('missing non-script navigation fallback');
	if ($('[data-vehicle-search]').length && !$('[data-vehicle-search-status][role="status"][aria-atomic="true"]').length) fail('missing search status semantics');
}
console.log(JSON.stringify({ pages: files.length, redirects, images, galleryLinks, genericAlternatives, headingJumps, failures }, null, 2));
if (failures.length) process.exitCode = 1;
