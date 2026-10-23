import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import sharp from 'sharp';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { validVehicleFilename } from '../src/config/vehicleRecord.js';
import { readVehicleTool } from '../scripts/lib/vehicle-tool.mjs';
import { validateVehicleRecord } from '../src/config/vehicleRecord.js';

const source = await readVehicleTool('editor.js');
const watermarkSource = source.slice(source.indexOf('        async function watermarkedFile('), source.indexOf('        async function previewPool('));
const outputSource = source.slice(source.indexOf('        const preparedWatermarkFiles ='), source.indexOf('        function editorSnapshot()'));
const record = { slug:'test-car', category:'aktuelle-projekte', title:'Fahrzeug', titleEn:'Car', description:'Beschreibung', descriptionEn:'Description', sourceUrl:'https://www.oldtimermanufaktur.de/projekte/aktuelle-projekte/test-car/', order:1, dateModified:'2026-10-18', cardImage:'./card.jpg', cardImageAlt:'Karte', cardImageAltEn:'Card', leadImage:'./photo.png', leadImageAlt:'Bild', leadImageAltEn:'Photo', blocks:[{type:'gallery',images:[{src:'./photo.png',alt:'Bild',altEn:'Photo',caption:'Text',captionEn:'Caption'},{src:'./card.jpg',alt:'Karte',altEn:'Card'}]}] };
async function fixture() {
  const jpeg = await sharp({create:{width:8,height:6,channels:3,background:'#ddd'}}).jpeg().toBuffer();
  const png = await sharp(jpeg).png().toBuffer();
  const images = [{name:'card.jpg',file:new File([jpeg],'card.jpg',{type:'image/jpeg'})},{name:'photo.png',file:new File([png],'photo.png',{type:'image/png'})}];
  let calls = 0;
  const window = {VehicleWatermark:async file => {
    calls++;
    const bytes = await sharp(Buffer.from(await file.arrayBuffer())).webp().toBuffer();
    return new File([bytes],file.name.replace(/\.[^.]+$/,'.webp'),{type:'image/webp'});
  }};
  const prepare = vm.runInNewContext(`${watermarkSource}\n${outputSource}; prepareOutputSnapshot`, {
    window, TextEncoder, maxImageBytes:50*1024**2, maxExportBytes:512*1024**2,
    setStatus(){}, validateRecord:validateVehicleRecord,
    async checkImage(file) { assert.equal((await sharp(Buffer.from(await file.arrayBuffer())).metadata()).format,'webp'); },
  });
  return {window,prepare,calls:()=>calls,snapshot:{record:structuredClone(record),recordText:JSON.stringify(record),images,watermarkEnabled:true}};
}

test('checkbox records preference synchronously without processing originals', () => {
  let listener, changed = 0, processed = 0;
  const original = {};
  const state = {cardFile:original,images:[original]};
  const checkboxSource = source.slice(source.indexOf('        $("#watermark-all").addEventListener("change"'),source.indexOf('        $("#gallery-files").addEventListener'));
  vm.runInNewContext(checkboxSource, {state,window:{VehicleWatermark(){processed++;}}, $:()=>({addEventListener(type,callback){listener=callback;}}),notifyChange(){changed++;},setStatus(){}});
  assert.equal(listener({target:{checked:true}}),undefined);
  assert.equal(state.watermarkEnabled,true);
  assert.equal(processed,0);
  assert.equal(state.cardFile,original);
  listener({target:{checked:false}});
  assert.equal(state.watermarkEnabled,false);
  assert.equal(changed,2);
});

test('final output converts once, remaps every reference and preserves original snapshot', async () => {
  const f = await fixture(), before = JSON.stringify(f.snapshot.record);
  const bytes = await Promise.all(f.snapshot.images.map(image=>image.file.arrayBuffer()));
  assert.equal(await f.prepare({...f.snapshot,watermarkEnabled:false}).then(s=>s.images),f.snapshot.images);
  assert.equal(f.calls(),0);
  const output = await f.prepare(f.snapshot);
  assert.equal(f.calls(),2);
  assert.equal(output.record.cardImage,'./card.webp');
  assert.equal(output.record.leadImage,'./photo.webp');
  assert.equal(output.record.blocks[0].images[0].src,'./photo.webp');
  assert.equal(output.record.blocks[0].images[1].src,'./card.webp');
  assert.equal(output.record.blocks[0].images[0].captionEn,'Caption');
  assert.equal(JSON.stringify(f.snapshot.record),before);
  assert.equal(f.snapshot.images[0].name,'card.jpg');
  assert.equal(f.snapshot.images[0].file.type,'image/jpeg');
  for (const [i,image] of f.snapshot.images.entries()) assert.deepEqual(await image.file.arrayBuffer(),bytes[i]);
  for (const image of output.images) assert.equal((await sharp(Buffer.from(await image.file.arrayBuffer())).metadata()).format,'webp');
  await f.prepare(f.snapshot);
  assert.equal(f.calls(),2,'repeated output should reuse prepared copies');
  assert.equal(await f.prepare(output),output,'prepared output should not be stamped twice');
  validateVehicleRecord(JSON.parse(output.recordText));
});

test('missing helper, failed conversion and filename collisions preserve preference and originals', async () => {
  const f = await fixture(), originals=f.snapshot.images;
  delete f.window.VehicleWatermark;
  await assert.rejects(f.prepare(f.snapshot),/nicht geladen/);
  f.window.VehicleWatermark=async()=>{throw new Error('conversion failed');};
  await assert.rejects(f.prepare(f.snapshot),/conversion failed/);
  const collision={...f.snapshot,images:[originals[0],{...originals[1],name:'card.png'}]};
  await assert.rejects(f.prepare(collision),/kollidieren/);
  assert.equal(f.snapshot.watermarkEnabled,true);
  assert.equal(f.snapshot.images,originals);
  assert.equal(f.snapshot.images[0].file.name,'card.jpg');
});

test('output uses captured preference even if draft changes during conversion', async () => {
  const f=await fixture(),convert=f.window.VehicleWatermark;
  let release;
  f.window.VehicleWatermark=async file=>{await new Promise(resolve=>{release=resolve;});return convert(file);};
  const pending=f.prepare(f.snapshot);
  const draft={watermarkEnabled:false};
  release();
  // Subsequent images need no pause; the in-flight snapshot retains its preference.
  f.window.VehicleWatermark=convert;
  const output=await pending;
  assert.equal(draft.watermarkEnabled,false);
  assert.equal(output.watermarkEnabled,true);
  assert.equal(output.record.cardImage,'./card.webp');
});


test('deferred output produces a valid ZIP containing only the vehicle pair and derived files', async t => {
  const f=await fixture(),output=await f.prepare(f.snapshot);
  const checkZip=source.slice(source.indexOf('        function checkZipEntries('),source.indexOf('        function validateRecord('));
  const zipSource=source.slice(source.indexOf('        const crcTable ='),source.indexOf('        async function generate()'));
  const makeZip=vm.runInNewContext(`${checkZip}\n${zipSource}; makeZip`,{TextEncoder,Blob,maxImageBytes:50*1024**2,maxExportBytes:512*1024**2,validVehicleFilename});
  const base=`${output.record.category}/${output.record.slug}`;
  const entries=[{name:`${base}.astro`,data:'---\n// fixture page\n---\n'}, {name:`${base}/vehicle.json`,data:output.recordText},...output.images.map(image=>({name:`${base}/${image.name}`,data:image.file}))];
  const zip=await makeZip(entries),directory=await mkdtemp(join(tmpdir(),'watermark-output-'));
  t.after(()=>rm(directory,{recursive:true,force:true}));
  const path=join(directory,'export.zip');await writeFile(path,Buffer.from(await zip.arrayBuffer()));
  assert.match(execFileSync('unzip',['-t',path],{encoding:'utf8'}),/No errors detected/);
  const names=execFileSync('unzip',['-Z1',path],{encoding:'utf8'}).trim().split('\n');
  assert.deepEqual(names,entries.map(entry=>entry.name));
  const json=JSON.parse(execFileSync('unzip',['-p',path,`${base}/vehicle.json`],{encoding:'utf8'}));
  validateVehicleRecord(json);
  for(const ref of [json.cardImage,json.leadImage,...json.blocks.flatMap(block=>block.images.map(image=>image.src))]) {
    const bytes=execFileSync('unzip',['-p',path,`${base}/${ref.slice(2)}`]);
    assert.equal((await sharp(bytes).metadata()).format,'webp');
  }
});
