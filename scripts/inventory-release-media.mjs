// Inventory the actual root production artifact, without asserting rights approval.
import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import { basename, extname } from 'node:path';
import { createHash } from 'node:crypto';
const media = /\.(?:avif|webp|png|jpe?g|gif|svg|ico|mp4|webm|woff2?|ttf|otf)$/i;
const homepage = await readFile('dist/index.html', 'utf8');
if (/\b(?:href|src)="\/oldtimer\//.test(homepage)) throw new Error('Build the root production target before inventorying release media.');
try {
 const ledger = await readFile('release/published-media-inventory.csv', 'utf8');
 // Preserve any completed approval/evidence cells in an existing ledger.
 if (ledger.trim().split('\n').slice(1).some(line => !line.endsWith(',"pending",""'))) {
  throw new Error('Existing media ledger contains decisions or evidence; reconcile it manually instead of overwriting approvals.');
 }
} catch (error) { if (error.code !== 'ENOENT') throw error; }
async function walk(dir) {
 const files=[];
 for (const entry of await readdir(dir,{withFileTypes:true})) {
  const path=dir+'/'+entry.name;
  if(entry.isDirectory()) files.push(...await walk(path)); else files.push(path);
 }
 return files.sort();
}
const sources=(await walk('src/assets')).filter(p=>media.test(p));
const records=(await walk('src/pages/projekte')).filter(p=>p.endsWith('/vehicle.json'));
for(const path of records) {
 const r=JSON.parse(await readFile(path,'utf8'));const dir=path.slice(0,path.lastIndexOf('/'));
 for(const name of new Set([r.cardImage,r.leadImage,...r.blocks.filter(b=>b.type==='gallery').flatMap(b=>b.images.map(i=>i.src))])) sources.push(dir+'/'+name.replace(/^\.\//,''));
}
const names=new Map();
for(const p of new Set(sources)) { const key=basename(p,extname(p));names.set(key,[...(names.get(key)||[]),p]); }
const rows=[];
for(const file of (await walk('dist')).filter(p=>media.test(p))) {
 const route='/'+file.slice(5);let parents=[];let mapping='';
 if(route.startsWith('/vehicle-gallery/')) {
  const parts=route.split('/');const [category,slug]=parts.slice(2,4);const name=basename(file).replace(/\.[a-f0-9]{12,64}(?=\.webp$)/,'').replace(/\.webp$/,'');
  parents=sources.filter(p=>p.startsWith(`src/pages/projekte/${category}/${slug}/`) && basename(p,extname(p))===name);mapping='vehicle route and filename';
 } else if(route.startsWith('/_astro/')) {
  const stem=basename(file).split('.')[0];parents=names.get(stem)||[];mapping='Astro source basename';
  if(parents.length>1) { const digest=createHash('sha256').update(await readFile(file)).digest('hex');const exact=[];for(const p of parents)if(createHash('sha256').update(await readFile(p)).digest('hex')===digest)exact.push(p);if(exact.length)parents=exact; }
 } else { parents=['public'+route];mapping='public file'; }
 const family=/\.(?:woff2?|ttf|otf)$/.test(file)?'font':/brand|favicon|apple-touch/.test(parents.join(' '))?'brand':/\.(?:mp4|webm)$/.test(file)||/motion|poster/.test(file)?'video family':route.startsWith('/vehicle-gallery/')?'vehicle photograph':'photograph or graphic';
 const license=family==='font'?(file.includes('cinzel')?'public/licenses/Cinzel-OFL-1.1.txt':'public/licenses/CormorantGaramond-OFL-1.1.txt'):file.includes('geo-alt-fill')?'public/licenses/Bootstrap-Icons-MIT.txt':'';
 const bytes=await readFile(file);
 rows.push({route,sha256:createHash('sha256').update(bytes).digest('hex'),bytes:bytes.length,family,source:parents.join('; '),mapping,license,evidence:license?'license text present; provenance and derivative verification require approval':'no per-file rights evidence supplied',approver:family==='font'?'release owner and developer':'company rights representative',status:'pending',evidenceReference:''});
}
// Imported SVGs can be rendered inline and still require a rights record.
for(const source of ['src/assets/graphics/germany-silhouette.svg','src/assets/graphics/geo-alt-fill.svg']) {
 const bytes=await readFile(source);rows.push({route:'inline:'+source,sha256:createHash('sha256').update(bytes).digest('hex'),bytes:bytes.length,family:'inline graphic',source,mapping:'inline source import',license:source.includes('geo-alt')?'public/licenses/Bootstrap-Icons-MIT.txt':'public-domain provenance recorded in MEDIA-RIGHTS-REGISTER.md',evidence:'recorded provenance; source verification and release approval pending',approver:'release owner and developer',status:'pending',evidenceReference:''});
}
await mkdir('release',{recursive:true});
const keys=Object.keys(rows[0]);const quote=x=>'"'+String(x??'').replaceAll('"','""')+'"';
await writeFile('release/published-media-inventory.csv',[keys.map(quote).join(','),...rows.map(r=>keys.map(k=>quote(r[k])).join(','))].join('\n')+'\n');
const counts={};for(const r of rows)counts[r.family]=(counts[r.family]||0)+1;
await writeFile('release/media-inventory-summary.json',JSON.stringify({reviewedDate:'2026-10-06',target:'root production build, preview safeguards enabled',entries:rows.length,counts,unresolvedSources:rows.filter(r=>!r.source||r.source.includes(';')).map(r=>r.route),allRightsStatuses:'pending; no production approval inferred'},null,2)+'\n');
console.log(JSON.stringify({entries:rows.length,counts,unresolvedSources:rows.filter(r=>!r.source||r.source.includes(';')).length}));
