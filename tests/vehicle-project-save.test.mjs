import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readVehicleTool } from '../scripts/lib/vehicle-tool.mjs';
import { mkdtemp, mkdir, readFile, writeFile, readdir, lstat, rm } from 'node:fs/promises';
import { join, basename } from 'node:path';
import { tmpdir } from 'node:os';
import { webcrypto } from 'node:crypto';
import sharp from 'sharp';
import { validateVehicleRecord } from '../src/config/vehicleRecord.js';
import { validateVehicleHtml } from '../src/config/vehicleHtml.js';
import { reviewImport, createVehiclePage } from '../scripts/lib/vehicle-import.mjs';
import { sitemapEntries, renderSitemap } from '../scripts/lib/crawlers.mjs';

// Real disposable files, behind the same small interface as browser directory handles.
function filesystem(root, faults = {}) {
  const error = e => { e.name = ({ ENOENT: 'NotFoundError', ENOTDIR: 'TypeMismatchError', EISDIR: 'TypeMismatchError', EACCES: 'NotAllowedError' })[e.code] || e.name; throw e; };
  async function stat(path) { try { const value = await lstat(path); if (value.isSymbolicLink()) throw new Error('Symlinks refused'); return value; } catch (e) { return error(e); } }
  function handle(path, kind) {
    return {
      name: basename(path), kind,
      async getDirectoryHandle(name, { create = false } = {}) { const target = join(path, name); try { if (create) await mkdir(target, { recursive: true }); if (!(await stat(target)).isDirectory()) throw new Error('Not a directory'); return handle(target, 'directory'); } catch(e) { return error(e); } },
      async getFileHandle(name, { create = false } = {}) { const target = join(path, name); try { if (create) await writeFile(target, '', { flag: 'ax' }).catch(e => { if (e.code !== 'EEXIST') throw e; }); if (!(await stat(target)).isFile()) throw new Error('Not a file'); return handle(target, 'file'); } catch(e) { return error(e); } },
      async getFile() { try { await faults.read?.(path); return new File([await readFile(path)], basename(path)); } catch (e) { return error(e); } },
      async createWritable() { let data; return { async write(value) { if (faults.write?.(path)) throw new Error('Simulated write failure'); data = value instanceof Blob ? Buffer.from(await value.arrayBuffer()) : value; }, async close() { await writeFile(path, data); await faults.close?.(path); }, async abort() {} }; },
      async removeEntry(name) { try { const target = join(path, name); if (faults.remove?.(target)) throw new Error("Simulated cleanup failure"); if ((await stat(target)).isDirectory()) { const { rmdir } = await import('node:fs/promises'); await rmdir(target); } else await rm(target); } catch (e) { return error(e); } },
      async *entries() { for (const entry of await readdir(path, { withFileTypes: true })) yield [entry.name, handle(join(path, entry.name), entry.isDirectory() ? 'directory' : 'file')]; },
    };
  }
  return handle(root, 'directory');
}
const context = vm.createContext({ window: {}, crypto: webcrypto, Blob, File, TextEncoder, Uint8Array, structuredClone, URL, console });
for (const name of ['project-access.js', 'project-save.js']) vm.runInContext(await readVehicleTool(name), context);
const A = context.window.VehicleProjectAccess, S = context.window.VehicleProjectSave;
const api = { validateRecord: value => validateVehicleRecord(value, validateVehicleHtml), createAstro: createVehiclePage, async checkImage(file) { const bytes = Buffer.from(await file.arrayBuffer()); const image = sharp(bytes); const metadata = await image.metadata(); await image.stats(); return new File([bytes], file.name, { type: `image/${metadata.format}` }); } };
const plain = value => JSON.parse(JSON.stringify(value));
async function fixture(t) {
  const base = await mkdtemp(join(tmpdir(), 'vehicle-browser-save-')); t.after(() => rm(base, { recursive: true, force: true }));
  const root = join(base, 'site');
  for (const path of ['src/config', 'src/components', 'public', ...A.categories.map(category => A.prefix + category)]) await mkdir(join(root, path), { recursive: true });
  for (const path of ['package.json', 'astro.config.mjs', 'src/content.config.ts', 'src/components/VehicleDetailPage.astro']) await writeFile(join(root, path), 'fixture');
  await writeFile(join(root, 'src/config/modificationDates.js'), await readFile(new URL('../src/config/modificationDates.js', import.meta.url)));
  await writeFile(join(root, 'src/config/vehicle-redirects.json'), '{}\n');
  await writeFile(join(root, 'public/sitemap.xml'), renderSitemap(sitemapEntries([[], [], []])));
  await writeFile(join(root, 'public/llms.txt'), '# Website\n\n> Beschreibung\n\n## Seiten\n\n[Start](https://www.oldtimermanufaktur.de/)\n');
  await writeFile(join(root, 'public/robots.txt'), 'Sitemap: https://www.oldtimermanufaktur.de/sitemap.xml\n');
  const record = { slug:'test-car', category:A.categories[0], title:'Testwagen', titleEn:'Test car', description:'Beschreibung', descriptionEn:'Description', sourceUrl:'https://www.oldtimermanufaktur.de/projekte/aktuelle-projekte/test-car/', order:123, dateModified:'2026-09-17', cardImage:'./card.jpg', cardImageAlt:'Karte', cardImageAltEn:'Card', leadImage:'./card.jpg', leadImageAlt:'Titel', leadImageAltEn:'Lead', blocks:[] };
  const image = new File([await sharp({ create: { width: 4, height: 3, channels: 3, background: '#ddd' } }).jpeg().toBuffer()], 'card.jpg', { type: 'image/jpeg' });
  const faults = {}, handle = filesystem(root, faults);
  const snapshot = { record, images: [{ name:'card.jpg', file:image }] };
  return { root, base, record, image, snapshot, faults, handle, async project() { return A.inspect(handle, api.validateRecord); }, async prepare(from = null) { return S.prepare(await this.project(), snapshot, from, api); } };
}

test('browser save matches checked importer bytes and preserves an immutable review', async t => {
  const f = await fixture(t), review = await f.prepare();
  const source = join(f.base, 'export', f.record.category); await mkdir(join(source, f.record.slug), { recursive:true });
  await writeFile(join(source, 'test-car/vehicle.json'), JSON.stringify(f.record, null, '\t')+'\n');
  await writeFile(join(source, 'test-car/card.jpg'), Buffer.from(await f.image.arrayBuffer()));
  const native = await reviewImport(f.root, source);
  assert.deepEqual(plain(review.summary).map(({path,before,after})=>({path,before,after})).sort((a,b)=>a.path.localeCompare(b.path)), native.summary.map(({path,before,after})=>({path,before,after})).sort((a,b)=>a.path.localeCompare(b.path)));
  f.record.title = 'Changed after review';
  const result = await S.apply(review); assert.ok(result.backup);
  assert.equal(JSON.parse(await readFile(join(f.root, A.prefix, review.key, 'vehicle.json'))).title, 'Testwagen');
  assert.equal(await A.hasDirectory(f.handle, S.lock), false);
  assert.equal((await f.project()).vehicles.length, 1);
});

test('replacement and category move update redirects, sitemap, and remove the original pair', async t => {
  const f = await fixture(t); await S.apply(await f.prepare()); const from = `${f.record.category}/${f.record.slug}`;
  f.record.category = A.categories[1]; f.record.sourceUrl = `https://www.oldtimermanufaktur.de/projekte/${f.record.category}/${f.record.slug}/`;
  const review = await f.prepare(from); await S.apply(review);
  assert.equal(await A.hasDirectory(f.handle, A.prefix + from), false);
  assert.deepEqual(JSON.parse(await A.text(f.handle, 'src/config/vehicle-redirects.json')), { [from]:review.key });
  assert.equal((await f.project()).vehicles[0].key, review.key);
  assert.match(await A.text(f.handle, 'public/sitemap.xml'), /\/en\/projekte\/vergangene-projekte\/test-car\//);
  const again = await f.prepare(review.key); assert.equal(again.summary.length, 0);
});

test('source changes, existing destinations, duplicate orders and invalid data block writes', async t => {
  const f = await fixture(t); const reviewed = await f.prepare();
  await A.write(f.handle, 'public/llms.txt', '# Changed'); await assert.rejects(S.apply(reviewed), /geändert/);
  await A.write(f.handle, 'public/llms.txt', '# Website\n\n> Beschreibung\n\n## Seiten\n\n[Start](https://www.oldtimermanufaktur.de/)\n');
  await S.apply(await f.prepare()); await assert.rejects(f.prepare(), /existiert/);
  f.record.slug = 'other-car'; await assert.rejects(f.prepare(), /Sortierwert/);
  f.record.order++; f.record.titleEn = ''; await assert.rejects(f.prepare());
  f.record.titleEn = 'English'; f.snapshot.images[0].name = 'card.png'; await assert.rejects(f.prepare(), /Bildinhalt/);
});

test('write failures restore originals; interrupted rollback is recoverable', async t => {
  const f = await fixture(t); await S.apply(await f.prepare()); const from = `${f.record.category}/${f.record.slug}`;
  const before = await A.snapshot(f.handle); f.record.title = 'Edited'; let once = false;
  f.faults.write = path => { if (!once && path.endsWith('/test-car/vehicle.json') && !path.includes('backup-')) { once = true; return true; } return false; };
  await assert.rejects(S.apply(await f.prepare(from)), /wiederhergestellt/); assert.deepEqual(await A.snapshot(f.handle), before);
  f.faults.close = path => { if (path.endsWith('/test-car/vehicle.json') && !path.includes('backup-')) { f.faults.write = candidate => candidate === path; throw new Error('Interrupted after durable write'); } };
  await assert.rejects(S.apply(await f.prepare(from)), /nicht abgeschlossen/);
  assert.ok(await S.readJournal(f.handle));
  delete f.faults.write; delete f.faults.close; await S.restore(f.handle); assert.deepEqual(await A.snapshot(f.handle), before);
});

test('foreign locks and tampered recovery journals are never removed', async t => {
  const f = await fixture(t); await A.directory(f.handle, S.lock, true);
  await assert.rejects(S.readJournal(f.handle), /Website-Importer/); await assert.rejects(f.prepare(), /aktiv/);
  assert.equal(await A.hasDirectory(f.handle, S.lock), true);
  await A.write(f.handle, `${S.lock}/browser.json`, JSON.stringify({id:'bad',backup:'../outside'}));
  await assert.rejects(S.restore(f.handle), /Ungültige/);
  assert.equal(await A.hasDirectory(f.handle, S.lock), true);
});

test('restricted configuration parsing and archive pagination match website output', async () => {
  const source = await readFile(new URL('../src/config/modificationDates.js', import.meta.url), 'utf8'); const dates = S.parseDates(source);
  assert.throws(() => S.parseDates(source.replace("shared:", "shared: alert(1), ignored:")));
  assert.throws(() => S.parseDates(source.replace('.sort().at(-1)', '.sort().at(0)')));
  const groups = [[], Array.from({length:49}, (_,index)=>({category:A.categories[1],slug:`car-${index}`,title:`Car ${index}`,order:index,dateModified:'2026-09-10',route:`/projekte/${A.categories[1]}/car-${index}/`})), []];
  assert.equal(S.renderSitemap(S.sitemapEntries(groups.flat(), dates)), renderSitemap(sitemapEntries(groups)));
});

test('failed new-file writes clean up empty files and restore an empty category', async t => {
  const f = await fixture(t), before = await A.snapshot(f.handle); let once = false;
  f.faults.write = path => { if (!once && path.endsWith('/test-car.astro') && !path.includes('backup-')) { once = true; return true; } return false; };
  await assert.rejects(S.apply(await f.prepare()), /wiederhergestellt/);
  assert.deepEqual(await A.snapshot(f.handle), before);
});

test('revoked access leaves a recoverable journal; recovery preserves conflicting external edits', async t => {
  const f = await fixture(t); await S.apply(await f.prepare()); const from = `${f.record.category}/${f.record.slug}`;
  f.record.title = 'Edited';
  f.faults.close = path => { if (path.endsWith('/test-car/vehicle.json') && !path.includes('backup-')) { f.faults.write = candidate => { if(candidate === path) throw new DOMException('Access revoked', 'NotAllowedError'); }; throw new DOMException('Access revoked', 'NotAllowedError'); } };
  await assert.rejects(S.apply(await f.prepare(from)), /nicht abgeschlossen/);
  assert.ok(await S.readJournal(f.handle)); delete f.faults.write; delete f.faults.close;
  await A.write(f.handle, `${A.prefix}${from}/vehicle.json`, JSON.stringify({...f.record,title:'External edit'}));
  await assert.rejects(S.restore(f.handle), /zwischenzeitlich geändert/);
  assert.equal(JSON.parse(await A.text(f.handle, `${A.prefix}${from}/vehicle.json`)).title, 'External edit');
  assert.equal(await A.hasDirectory(f.handle, S.lock), true);
});

test('loaded project snapshots detect changes before review and reject malformed folder pairs', async t => {
  const f = await fixture(t), project = await f.project();
  await A.write(f.handle, 'public/robots.txt', 'changed');
  await assert.rejects(S.prepare(project,f.snapshot,null,api), /außerhalb/);
  await A.directory(f.handle, `${A.prefix}aktuelle-projekte/orphan`, true);
  await assert.rejects(f.project(), /zusammen vorhanden/);
});

test('completed cleanup failure reports committed and ignores obsolete damaged backups', async t => {
  const f = await fixture(t); await S.apply(await f.prepare());
  f.record.title = 'Committed';
  f.faults.remove = path => path.endsWith('/vehicle-import.lock');
  const result = await S.apply(await f.prepare(`${f.record.category}/${f.record.slug}`));
  assert.equal(result.committed, true); assert.equal(result.cleanupPending, true);
  const journal = await S.readJournal(f.handle); assert.equal(journal.phase, 'completed');
  await A.write(f.handle, `${journal.backup}/before/${journal.entries[0].path}`, 'damaged obsolete backup');
  await assert.rejects(S.restore(f.handle), /cleanup/);
  delete f.faults.remove;
  await S.restore(f.handle); await S.restore(f.handle);
  assert.equal(JSON.parse(await A.text(f.handle, `${A.prefix}${journal.key}/vehicle.json`)).title, 'Committed');
  assert.equal(await A.hasDirectory(f.handle, S.lock), false);
});

test('recovery rechecks bytes and lock ownership after backup reads', async t => {
  for (const foreign of [false, true]) {
    const f = await fixture(t); await S.apply(await f.prepare());
    f.record.title = 'Committed'; f.faults.remove = path => path.endsWith('/vehicle-import.lock');
    await S.apply(await f.prepare(`${f.record.category}/${f.record.slug}`)); delete f.faults.remove;
    const journal = await S.readJournal(f.handle); journal.phase = 'writing';
    await A.write(f.handle, `${journal.backup}/journal.json`, JSON.stringify(journal));
    const path = journal.entries.find(entry => entry.path.endsWith('/vehicle.json')).path;
    let reads = 0;
    f.faults.read = async candidate => {
      if (candidate.endsWith(`/before/${path}`) && ++reads === 2) {
        if (foreign) await A.write(f.handle, `${S.lock}/foreign.txt`, 'Another writer');
        else await A.write(f.handle, path, 'External edit');
      }
    };
    await assert.rejects(S.restore(f.handle), foreign ? /fremde/ : /zwischenzeitlich/);
    assert.equal(await A.hasDirectory(f.handle, S.lock), true);
    if (!foreign) assert.equal(await A.text(f.handle, path), 'External edit');
    delete f.faults.read;
  }
});

test('review mutations and literal whitespace changes fail closed', async t => {
  const f = await fixture(t), review = await f.prepare();
  review.changes.set(review.summary[0].path, new Uint8Array([1]));
  await assert.rejects(S.apply(review), /verändert/);
  const source = await readFile(new URL('../src/config/modificationDates.js', import.meta.url), 'utf8');
  assert.throws(() => S.parseDates(source.replace("path.startsWith('/projekte/')", "path.startsWith('/pro jekte/')")));
  assert.throws(() => S.parseDates(source.replace('replace(/', 'replace(/ ')));
});

test('damaged writing backups stop restoration before any source mutation', async t => {
  const f = await fixture(t); await S.apply(await f.prepare()); f.record.title='After';
  f.faults.remove=path=>path.endsWith('/vehicle-import.lock');
  await S.apply(await f.prepare(`${f.record.category}/${f.record.slug}`)); delete f.faults.remove;
  const journal=await S.readJournal(f.handle);journal.phase='writing';
  await A.write(f.handle,`${journal.backup}/journal.json`,JSON.stringify(journal));
  const entry=journal.entries.find(entry=>entry.before);
  await A.write(f.handle,`${journal.backup}/before/${entry.path}`,'damaged');
  const before=await A.snapshot(f.handle);
  await assert.rejects(S.restore(f.handle),/beschädigt/);
  assert.deepEqual(await A.snapshot(f.handle),before);
  journal.targetExisted=false;
  await A.write(f.handle,`${journal.backup}/journal.json`,JSON.stringify(journal));
  await assert.rejects(S.restore(f.handle),/Beschädigtes/);
  assert.equal(await A.hasDirectory(f.handle,S.lock),true);
});

test('browser and CLI plans agree across every category and archive boundary', async t => {
  const f=await fixture(t);let from=null;
  for(const category of A.categories) {
    f.record.category=category;f.record.sourceUrl=`https://www.oldtimermanufaktur.de/projekte/${category}/${f.record.slug}/`;
    const source=join(f.base,'export',category);await mkdir(join(source,f.record.slug),{recursive:true});
    await writeFile(join(source,f.record.slug,'vehicle.json'),JSON.stringify(f.record,null,'\t')+'\n');
    await writeFile(join(source,f.record.slug,'card.jpg'),Buffer.from(await f.image.arrayBuffer()));
    const browser=await f.prepare(from),cli=await reviewImport(f.root,source,from);
    const hashes=entries=>plain(entries).map(({path,before,after})=>({path,before,after})).sort((a,b)=>a.path.localeCompare(b.path));
    assert.deepEqual(hashes(browser.summary),hashes(cli.summary));
    await S.apply(browser);from=browser.key;
  }
  const dates=S.parseDates(await readFile(new URL('../src/config/modificationDates.js',import.meta.url),'utf8'));
  for(const count of [0,1,23,24,25,48,49]) {
    const groups=A.categories.map((category,index)=>Array.from({length:index===1?count:1},(_,i)=>({category,slug:`car-${i}`,title:`Wagen ${i}`,order:i,dateModified:'2026-09-01',route:`/projekte/${category}/car-${i}/`})));
    assert.equal(S.renderSitemap(S.sitemapEntries(groups.flat(),dates)),renderSitemap(sitemapEntries(groups)));
  }
});
