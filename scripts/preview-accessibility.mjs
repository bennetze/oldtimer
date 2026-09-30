// Local-only audit fixtures. Never modifies dist or deploys these test overrides.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { createHash } from 'node:crypto';
const root = resolve('dist');
const base = process.argv[2] === 'github-pages' ? '/oldtimer' : '';
const styles = {
	controls: '.scroll-cue { opacity: 1 !important; color: #fff !important; filter: drop-shadow(1px 0 0 #111) drop-shadow(-1px 0 0 #111) drop-shadow(0 1px 0 #111) drop-shadow(0 -1px 0 #111); } .section-indicator__dot::after { background: #fff !important; box-shadow: 0 0 0 1px #111; } .section-indicator--light .section-indicator__dot::after { background: #111 !important; box-shadow: 0 0 0 1px #fff; }',
	focus: '.scroll-cue:focus-visible, .hero-motion-toggle:focus-visible, .section-indicator__dot:focus-visible { outline: 2px solid #fff !important; outline-offset: 3px !important; box-shadow: 0 0 0 6px #111 !important; } .section-indicator--light .section-indicator__dot:focus-visible { outline-color: #111 !important; box-shadow: 0 0 0 6px #fff !important; }',
	spacing: '* { line-height: 1.5 !important; letter-spacing: .12em !important; word-spacing: .16em !important; } p { margin-bottom: 2em !important; }',
	media: '.media-panel__shade { background-color: rgba(12,12,12,.56) !important; }',
	text: 'html { font-size: 200% !important; }',
	header: '.site-header { background: rgba(16,16,16,.85) !important; } .site-shell--light .site-header { background: rgba(238,238,238,.96) !important; }',
	search: '.archive-search__field { border-color: rgba(17,17,17,.55) !important; } .archive-search input:focus-visible { outline: 2px solid #111 !important; outline-offset: 4px; } .archive-search input::placeholder { color: #555 !important; }',
};
const legacy = `delete HTMLElement.prototype.inert; HTMLDialogElement.prototype.showModal = undefined; HTMLDialogElement.prototype.close = undefined; Element.prototype.animate = undefined; Element.prototype.getAnimations = undefined; delete window.IntersectionObserver; MediaQueryList.prototype.addEventListener = undefined; const originalCssSupports = CSS.supports.bind(CSS); CSS.supports = (...args) => args[0] === "selector(:focus-visible)" ? false : originalCssSupports(...args);`;
const reduced = `const originalMatchMedia = window.matchMedia.bind(window); window.matchMedia = query => { const result = originalMatchMedia(query); if (query.includes('prefers-reduced-motion')) Object.defineProperty(result, 'matches', {get: () => true}); return result; };`;
const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.jpg': 'image/jpeg', '.jpeg':'image/jpeg', '.png':'image/png', '.webp':'image/webp', '.avif':'image/avif', '.mp4':'video/mp4', '.webm':'video/webm', '.svg':'image/svg+xml', '.woff2':'font/woff2', '.json':'application/json' };
createServer(async (req, res) => {
	try {
		const url = new URL(req.url, 'http://localhost');
		if (url.pathname === '/__audit/style.css') { res.setHeader('Content-Type', 'text/css'); res.end(styles[url.searchParams.get('mode')] || ''); return; }
		const pathname = base && url.pathname.startsWith(base + '/') ? url.pathname.slice(base.length) : url.pathname;
		const path = resolve(root, '.' + decodeURIComponent(pathname) + (pathname.endsWith('/') ? 'index.html' : ''));
		if (!path.startsWith(root + sep)) { res.writeHead(403); res.end(); return; }
		let data = await readFile(path);
		if (extname(path) === '.html') {
			let html = data.toString(); const mode = url.searchParams.get('audit');
			if (mode === 'nojs') html = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
			if (styles[mode]) html = html.replace('</head>', `<link rel="stylesheet" href="/__audit/style.css?mode=${mode}"></head>`);
			const script = mode === 'legacy' ? legacy : ['reduced', 'controls', 'focus'].includes(mode) ? reduced : null;
			if (script) {
				const hash = createHash('sha256').update(script).digest('base64');
				html = html.replace(/(script-src-elem[^;"\n]*)/, `$1 'sha256-${hash}'`);
				html = html.replace(/(<meta[^>]*http-equiv="content-security-policy"[^>]*>)/i, `$1<script>${script}</script>`);
			}
			data = Buffer.from(html);
		}
		res.setHeader('Content-Type', types[extname(path)] || 'application/octet-stream'); res.end(data);
	} catch { res.writeHead(404); res.end('Not found'); }
}).listen(4327, '127.0.0.1', () => console.log('Local accessibility fixtures: http://127.0.0.1:4327/?lang=de&audit=legacy (nojs, spacing, text, reduced, header, search, media)'));
