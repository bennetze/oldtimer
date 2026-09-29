// Test-only localhost harness. The distributed editor remains an offline HTML entry point with local assets.
import { createServer } from 'node:http';
import { readFile, writeFile, mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import sharp from 'sharp';
import { vehicleToolPath } from './lib/vehicle-tool.mjs';
import { validateVehicleHtml } from '../src/config/vehicleHtml.js';

const tool = await vehicleToolPath();
const output = await mkdtemp(join(tmpdir(), 'vehicle-browser-'));
const fixtureImage = (await sharp({ create: { width: 80, height: 60, channels: 3, background: '#999' } }).jpeg().toBuffer()).toString('base64');
const tests = await readFile(new URL('../tests/vehicle-browser-cases.js', import.meta.url), 'utf8');
let source = await readFile(tool, 'utf8');
// Inline local assets only in this disposable harness. Production uses classic scripts.
for (const name of ['styles.css', 'workflow.css']) { const asset = await readFile(join(dirname(tool), name), 'utf8'); source = source.replace(`<link rel="stylesheet" href="${name}" />`, () => `<style>${asset}</style>`); }
for (const name of ['project-access.js', 'project-save.js', 'project-ui.js', 'editor.js']) { const asset = await readFile(join(dirname(tool), name), 'utf8'); source = source.replace(`<script src="${name}"></script>`, () => `<script>${asset}</script>`); }
// Legacy editor cases operate without a selected project; project cases have their own harness.
const workflowSource = source;
source = source.replace(/        workflow = window.VehicleProjectUI\([^\n]+\);\n/, '').replace('showStep("project");', 'showStep("vehicle");');
const hooks = `\nwindow.vehicleTest = { state, fields, sanitizeHtml, validateRecord, checkImage, checkZipEntries, importVehicle, setCardFile, addGalleryFiles, createRecord, createAstro, generate, makeZip, validate, updateAutoText, updateSummary, renderBlocks, renderImages, renumberImages, editorSnapshot, localDate, showStep, resetEditor };\n`;
const instrumented = source.replace('\n      })();\n', `${hooks}      })();\n`);
const workflowTests = await readFile(new URL('../tests/vehicle-project-browser-cases.js', import.meta.url), 'utf8');
const dateSource = await readFile(new URL('../src/config/modificationDates.js', import.meta.url), 'utf8');
const fixtureRecord = { slug:'test-car', category:'aktuelle-projekte', title:'Testwagen', titleEn:'Test car', description:'Beschreibung', descriptionEn:'Description', sourceUrl:'https://www.oldtimermanufaktur.de/projekte/aktuelle-projekte/test-car/', order:123, dateModified:'2026-09-17', cardImage:'./card.jpg', cardImageAlt:'Karte', cardImageAltEn:'Card', leadImage:'./card.jpg', leadImageAlt:'Titel', leadImageAltEn:'Lead', blocks:[] };
const fixtureLlms = '# Website\n\n> Beschreibung\n\n## Seiten\n\n[Start](https://www.oldtimermanufaktur.de/)\n';
const fixtureSetup = `<script>
window.fixtureRoot = (async () => {
 const storage = await navigator.storage.getDirectory();
 const root = await storage.getDirectoryHandle('vehicle-test-' + crypto.randomUUID(), {create:true});
 const write = async (path,data) => {const names=path.split('/');const name=names.pop();let dir=root;for(const part of names) dir=await dir.getDirectoryHandle(part,{create:true});const stream=await (await dir.getFileHandle(name,{create:true})).createWritable();await stream.write(data);await stream.close();};
 for(const category of ['aktuelle-projekte','vergangene-projekte','fahrzeugangebote']) await write('src/pages/projekte/'+category+'/index.astro','fixture');
 for(const path of ['package.json','astro.config.mjs','src/content.config.ts','src/components/VehicleDetailPage.astro']) await write(path,'fixture');
 await write('src/config/modificationDates.js',${JSON.stringify(dateSource)});
 await write('src/config/vehicle-redirects.json','{}');
 await write('public/sitemap.xml','fixture');
 await write('public/robots.txt','Sitemap: https://www.oldtimermanufaktur.de/sitemap.xml');
 await write('public/llms.txt',${JSON.stringify(fixtureLlms)});
 await write('src/pages/projekte/aktuelle-projekte/test-car.astro','fixture');
 await write('src/pages/projekte/aktuelle-projekte/test-car/vehicle.json',${JSON.stringify(JSON.stringify(fixtureRecord))});
 await write('src/pages/projekte/aktuelle-projekte/test-car/card.jpg',Uint8Array.from(atob(${JSON.stringify(fixtureImage)}),c=>c.charCodeAt(0)));
 return root;
})();
window.showDirectoryPicker = async () => window.fixtureRoot;
</script>`;
const workflowEditor = workflowSource.replace('<body>', () => '<body>' + fixtureSetup).replace('\n      })();\n', () => hooks + '      })();\n');
const server = createServer(async (req, res) => {
	try {
        if (req.method === 'GET' && req.url === '/workflow-editor') { res.setHeader('Content-Type','text/html; charset=utf-8');res.end(workflowEditor);return; }
        if (req.method === 'GET' && req.url === '/workflow') { res.setHeader('Content-Type','text/html; charset=utf-8');res.end(`<!doctype html><html><head><title>Project workflow regression</title></head><body><h1>Project workflow regression</h1><pre id="results">Running…</pre><iframe title="Project editor" id="editor" src="/workflow-editor" style="width:1440px;height:900px"></iframe><script>${workflowTests}</script></body></html>`);return; }
		if (req.method === 'GET' && req.url === '/editor') { res.setHeader('Content-Type', 'text/html; charset=utf-8'); res.end(instrumented); return; }
		if (req.method === 'GET' && req.url === '/') { res.setHeader('Content-Type', 'text/html; charset=utf-8'); res.end(`<!doctype html><html><head><title>Vehicle browser regression</title></head><body><h1>Vehicle browser regression</h1><pre id="results">Running…</pre><iframe title="Editor test" id="editor" src="/editor" style="width:1440px;height:900px"></iframe><script>const fixtureImage=${JSON.stringify(fixtureImage)};${tests}</script></body></html>`); return; }
		if (req.method === 'POST' && ['/result', '/zip', '/html'].includes(req.url)) {
			if (req.headers.origin !== `http://127.0.0.1:${server.address().port}`) { res.writeHead(403); res.end(); return; }
			const chunks = []; let length = 0;
			for await (const chunk of req) { length += chunk.length; if (length > 2 * 1024 ** 2) throw new Error('Oversized test result.'); chunks.push(chunk); }
			const data = Buffer.concat(chunks);
			if (req.url === '/html') { for (const html of JSON.parse(data)) validateVehicleHtml(html); res.end('validated'); return; }
			const name = req.url === '/zip' ? 'export.zip' : JSON.parse(data).suite === 'project-workflow' ? 'workflow-results.json' : 'results.json';
			await writeFile(join(output, name), data); console.log(`Saved ${join(output, name)}`); res.end('saved'); return;
		}
		res.writeHead(404); res.end();
	} catch (error) { res.writeHead(400); res.end(error.message); }
});
server.listen(Number(process.env.PORT || 8767), '127.0.0.1', () => console.log(`Open http://127.0.0.1:${server.address().port}/ — artifacts: ${output}`));
