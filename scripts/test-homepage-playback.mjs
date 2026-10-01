// Local browser harness for the real built homepage, including its CSP.
// Open /?lang=de&motion-test=normal (or reduce / blocked) in each browser.
// Keep the tested browser tab in the foreground throughout the run.
// Results stay local; no analytics or production assets are changed.
import { createServer } from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve, extname, sep, join } from 'node:path';
import { createHash } from 'node:crypto';
import { load } from 'cheerio';

const root = resolve(process.env.PLAYBACK_ROOT || 'dist');
const output = resolve(process.env.PLAYBACK_OUTPUT || '.codex-qa/playback');
const port = Number(process.env.PORT || process.argv.find(arg => arg.startsWith('--port='))?.slice(7) || 4330);
const base = process.argv.includes('--pages') ? '/oldtimer' : '';
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.avif': 'image/avif', '.svg': 'image/svg+xml', '.mp4': 'video/mp4', '.webm': 'video/webm' };
const records = [];
function instrument(scenario) {
	return `(() => {
	const scenario = ${JSON.stringify(scenario)};
	const nativeMatch = window.matchMedia.bind(window);
	window.matchMedia = query => {
		const media = nativeMatch(query);
		if (query.includes('prefers-reduced-motion')) Object.defineProperty(media, 'matches', { get: () => scenario === 'reduce' });
		return media;
	};
	if (scenario === 'blocked') HTMLMediaElement.prototype.play = () => Promise.reject(new DOMException('Harness blocks playback', 'NotAllowedError'));
	const errors = [];
	window.addEventListener('error', event => errors.push(event.message));
	let startup;
	document.addEventListener('playing', () => { startup ??= performance.now(); }, { capture: true });
	const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
	document.addEventListener('DOMContentLoaded', async () => {
		if (document.hidden) await new Promise(resolve => {
			const visible = () => { if (!document.hidden) { document.removeEventListener('visibilitychange', visible); resolve(); } };
			document.addEventListener('visibilitychange', visible);
		});
		let backgrounded = false;
		document.addEventListener('visibilitychange', () => { if (document.hidden) backgrounded = true; });
		const panels = [...document.querySelectorAll('[data-motion-panel]')];
		const checks = [], samples = [];
		const check = (name, pass) => checks.push({ name, pass: Boolean(pass) });
		await wait(800);
		const hero = panels[0].querySelector('video');
		if (scenario === 'reduce') {
			check('Reduced motion starts paused without fetching video', hero.paused && !hero.currentSrc);
			panels[0].querySelector('[data-motion-toggle]').click();
		} else if (scenario === 'blocked') {
			samples.push({ section: 'blocked-startup', paused: hero.paused, src: hero.currentSrc, classes: panels[0].className, hidden: document.hidden });
			check('Blocked video uses fallback with decoder paused', hero.paused && panels[0].classList.contains('is-motion-fallback'));
			panels[0].querySelector('[data-motion-toggle]').click();
			await wait(100);
			check('Pause restores a still fallback', !panels[0].querySelector('[data-motion-generated-source]'));
		}
		if (scenario !== 'blocked') {
			for (const panel of panels) {
				panel.scrollIntoView({ behavior: 'instant' });
				const video = panel.querySelector('video');
				if (scenario === 'reduce' && panel !== panels[0]) panel.querySelector('[data-motion-toggle]').click();
				await wait(1000);
				const quality = video.getVideoPlaybackQuality?.();
				let frames = 0, callback;
				const count = () => { frames++; callback = video.requestVideoFrameCallback(count); };
				if (video.requestVideoFrameCallback) callback = video.requestVideoFrameCallback(count);
				const start = performance.now();
				await wait(panel === panels[0] ? 12000 : 3000);
				if (callback !== undefined) video.cancelVideoFrameCallback(callback);
				const final = video.getVideoPlaybackQuality?.();
				samples.push({ section: panel.id, src: video.currentSrc, width: video.videoWidth, fps: callback === undefined ? null : frames * 1000 / (performance.now() - start), dropped: final && quality ? final.droppedVideoFrames - quality.droppedVideoFrames : null, currentTime: video.currentTime });
				check(panel.id + ' plays muted and looping', !video.paused && video.muted && video.loop && panel.classList.contains('is-video-ready'));
				check(panel.id + ' is the only playing decoder', panels.every(other => other === panel || other.querySelector('video').paused));
				const toggle = panel.querySelector('[data-motion-toggle]');
				toggle.click(); await wait(150);
				check(panel.id + ' pauses manually', video.paused);
				toggle.click(); await wait(150);
			}
			const fallbackUrls = panels.flatMap(panel => [...panel.querySelectorAll('[data-motion-avif], [data-motion-webp]')].flatMap(image => [image.dataset.motionAvif, image.dataset.motionWebp]).filter(Boolean));
			check('Successful videos never fetch animated fallback', !performance.getEntriesByType('resource').some(entry => fallbackUrls.some(url => entry.name === new URL(url, location.href).href)));
		}
		check('Browser remained in the foreground during measurement', !backgrounded);
		const result = { scenario, userAgent: navigator.userAgent, width: innerWidth, height: innerHeight, startup, samples, checks, errors };
		await fetch('/__playback/result', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(result) });
		const report = document.createElement('pre'); report.textContent = JSON.stringify(result, null, 2); document.body.replaceChildren(report); window.scrollTo({ top: 0, behavior: 'instant' });
	}, { once: true });
	})();`;
}
createServer(async (req, res) => {
	try {
		const url = new URL(req.url, `http://localhost:${port}`);
		if (url.pathname === '/__playback/result' && req.method === 'POST') {
			if (req.headers.origin !== url.origin) { res.writeHead(403); res.end(); return; }
			let body = ''; for await (const chunk of req) { body += chunk; if (body.length > 100000) throw new Error('Oversized result'); }
			records.push(JSON.parse(body)); await mkdir(output, { recursive: true });
			await writeFile(join(output, 'results.json'), JSON.stringify(records, null, 2));
			console.log(JSON.stringify(records.at(-1))); res.end('saved'); return;
		}
		const relative = base && url.pathname.startsWith(base + '/') ? url.pathname.slice(base.length) : url.pathname;
		const file = resolve(root, '.' + decodeURIComponent(relative) + (relative.endsWith('/') ? 'index.html' : ''));
		if (!file.startsWith(root + sep)) throw new Error('Invalid path');
		let bytes = await readFile(file);
		const scenario = url.searchParams.get('motion-test');
		if (extname(file) === '.html' && ['normal', 'reduce', 'blocked'].includes(scenario)) {
			const script = instrument(scenario); const $ = load(bytes.toString());
			const meta = $('meta[http-equiv="content-security-policy"]');
			const hash = createHash('sha256').update(script).digest('base64');
			meta.attr('content', meta.attr('content').replace(/(script-src-elem[^;]*)/, `$1 'sha256-${hash}'`));
			meta.after(`<script>${script}</script>`); bytes = Buffer.from($.html());
		}
		res.setHeader('Content-Type', types[extname(file)] || 'application/octet-stream');
		res.setHeader('Cache-Control', 'no-store'); res.setHeader('Accept-Ranges', 'bytes');
		if (req.headers.range) {
			const range = /^bytes=(\d+)-(\d*)$/.exec(req.headers.range);
			if (!range) throw new Error('Invalid range');
			const start = Number(range[1]), end = Math.min(range[2] ? Number(range[2]) : bytes.length - 1, bytes.length - 1);
			if (start > end) { res.writeHead(416); res.end(); return; }
			res.writeHead(206, { 'Content-Range': `bytes ${start}-${end}/${bytes.length}`, 'Content-Length': end - start + 1 });
			res.end(bytes.subarray(start, end + 1)); return;
		}
		res.setHeader('Content-Length', bytes.length); res.end(bytes);
	} catch (error) { res.writeHead(400); res.end(error.message); }
}).listen(port, '127.0.0.1', () => console.log(`Playback harness: http://localhost:${port}${base}/?lang=de&motion-test=normal — results: ${output}`));
