// Test-only localhost harness. The distributed editor remains one offline file.
import { createServer } from 'node:http';
import { readFile, writeFile, mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import sharp from 'sharp';
import { validateVehicleHtml } from '../src/config/vehicleHtml.js';

const tool = resolve(process.env.VEHICLE_TOOL_PATH || '../oldtimer-fahrzeuge/index.html');
const output = await mkdtemp(join(tmpdir(), 'vehicle-browser-'));
const fixtureImage = (await sharp({ create: { width: 80, height: 60, channels: 3, background: '#999' } }).jpeg().toBuffer()).toString('base64');
const tests = await readFile(new URL('../tests/vehicle-browser-cases.js', import.meta.url), 'utf8');
const source = await readFile(tool, 'utf8');
const hooks = `\nwindow.vehicleTest = { state, fields, sanitizeHtml, validateRecord, checkImage, checkZipEntries, importVehicle, setCardFile, addGalleryFiles, createRecord, createAstro, generate, makeZip, validate, updateAutoText, updateSummary, renderBlocks, renderImages, renumberImages, localDate };\n`;
const instrumented = source.replace('\n      })();\n', `${hooks}      })();\n`);
const server = createServer(async (req, res) => {
	try {
		if (req.method === 'GET' && req.url === '/editor') { res.setHeader('Content-Type', 'text/html; charset=utf-8'); res.end(instrumented); return; }
		if (req.method === 'GET' && req.url === '/') { res.setHeader('Content-Type', 'text/html; charset=utf-8'); res.end(`<!doctype html><html><head><title>Vehicle browser regression</title></head><body><h1>Vehicle browser regression</h1><pre id="results">Running…</pre><iframe title="Editor test" id="editor" src="/editor" style="width:1440px;height:900px"></iframe><script>const fixtureImage=${JSON.stringify(fixtureImage)};${tests}</script></body></html>`); return; }
		if (req.method === 'POST' && ['/result', '/zip', '/html'].includes(req.url)) {
			if (req.headers.origin !== `http://127.0.0.1:${server.address().port}`) { res.writeHead(403); res.end(); return; }
			const chunks = []; let length = 0;
			for await (const chunk of req) { length += chunk.length; if (length > 2 * 1024 ** 2) throw new Error('Oversized test result.'); chunks.push(chunk); }
			const data = Buffer.concat(chunks);
			if (req.url === '/html') { for (const html of JSON.parse(data)) validateVehicleHtml(html); res.end('validated'); return; }
			const name = req.url === '/zip' ? 'export.zip' : 'results.json';
			await writeFile(join(output, name), data); console.log(`Saved ${join(output, name)}`); res.end('saved'); return;
		}
		res.writeHead(404); res.end();
	} catch (error) { res.writeHead(400); res.end(error.message); }
});
server.listen(Number(process.env.PORT || 8767), '127.0.0.1', () => console.log(`Open http://127.0.0.1:${server.address().port}/ — artifacts: ${output}`));
