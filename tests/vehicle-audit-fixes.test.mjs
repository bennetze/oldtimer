import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { createHash } from 'node:crypto';
import { readFile, mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { load } from 'cheerio';
import { readVehicleTool } from '../scripts/lib/vehicle-tool.mjs';
import { vehicleColors, vehicleImageWidths } from '../src/config/vehiclePresentation.js';
import { annotateVehicleLanguageParts } from '../src/config/vehicleLanguageParts.js';
import { verifyVehicleStory } from '../scripts/lib/vehicle-output.mjs';
import { vehicleRedirectMiddleware } from '../src/config/vehicleDevServer.mjs';
import { finalizeCsp } from '../src/i18n/csp.js';
import { vehicleError, formatVehicleError } from '../scripts/lib/vehicle-errors.mjs';

test('offline presentation shares exact website story styles, colors, source targets and Lora font bytes', async () => {
 const context={window:{}};vm.runInNewContext(await readVehicleTool('vehicle-presentation.js'),context);
 const p=context.window.VehiclePresentation;
 assert.deepEqual({...p.colors},vehicleColors);assert.deepEqual({...p.widths},vehicleImageWidths);
 assert.ok(Object.isFrozen(p)&&Object.isFrozen(p.colors));
 const component=await readFile('src/components/VehicleDetailPage.astro','utf8');
 const css=component.match(/<style>([\s\S]*?)<\/style>/)[1].replace(/:global\(([^)]+)\)/g,'$1');
 assert.equal(p.websiteCss,css);
 assert.equal(p.gradientCss,await readFile('src/styles/gradientPalette.css','utf8'));
 for(const [key,value] of Object.entries(vehicleColors)) assert.ok(css.includes(`.om-color-${key}`)&&css.includes(value));
 assert.equal(p.fontDataUrl,'data:font/ttf;base64,'+(await readFile('src/assets/fonts/lora-variable.ttf')).toString('base64'));
 const texture=await readFile('src/components/BackgroundTexture.astro','utf8');assert.equal(p.textureCss,texture.match(/<style>([\s\S]*?)<\/style>/)[1]);assert.ok(p.textureDataUrl.startsWith('data:image/svg+xml;base64,'));
 assert.ok((await readVehicleTool('watermark.js')).includes('VehiclePresentation?.fontDataUrl'));
});

test('story verifier independently rejects absent, mistranslated, misplaced and mis-sized side text', () => {
 const image={src:'./photo.jpg',alt:'Side',caption:'Caption',size:'medium'};
 const blocks=[{type:'copy',html:'<p>Ordinary</p>'},{type:'contact',html:'<p>Contact</p>'},{type:'gallery',textSide:'right',html:'<p>Side</p>',images:[image]}];
 const markup='<article class="vehicle-story"><div class="story-copy"><p>Ordinary</p></div><aside class="story-contact"><div><p>Contact</p></div></aside><div class="story-gallery story-gallery--sized story-gallery--text story-gallery--text-right"><div class="story-copy story-side-copy"><p>Side</p></div><figure class="story-image story-image--medium"><img src="/photo.webp" alt="Side"><figcaption>Caption</figcaption></figure></div></article>';
 // Authored annotations are part of the independent rendering contract.
 const $=load(markup);$('.story-copy, .story-contact > div').each((_,node)=>$(node).html(annotateVehicleLanguageParts($(node).html(),'en')));
 verifyVehicleStory($,blocks,'en','test');
 for(const change of [html=>html.replace('story-side-copy','missing'),html=>html.replace('>Side</p>','>Deutsch</p>'),html=>html.replace('story-gallery--text-right','wrong'),html=>html.replace('story-image--medium','story-image--small'),html=>html.replace('alt="Side"','alt="Wrong"')]) assert.throws(()=>verifyVehicleStory(load(change($.html())),blocks,'en','test'));
});


test('pre-Astro development redirect preserves exact queries for both bases and languages', async t => {
 const root=await mkdtemp(join(tmpdir(),'redirect-query-'));t.after(()=>rm(root,{recursive:true,force:true}));
 await mkdir(join(root,'src/config'),{recursive:true});await writeFile(join(root,'src/config/vehicle-redirects.json'),JSON.stringify({'vergangene-projekte/car':'aktuelle-projekte/car'}));
 for(const base of ['/','/oldtimer/']) for(const lang of ['','en/']) for(const query of ['?lang=de&x=1','?lang=en&x=%26']) {
  let result;vehicleRedirectMiddleware(root,base)({method:'GET',url:`${base}${lang}projekte/vergangene-projekte/car/${query}`},{writeHead(status,headers){result={status,headers};},end(){}},error=>{throw error||new Error('redirect absent');});
  assert.equal(result.status,301);assert.equal(result.headers.Location,`${base}${lang}projekte/aktuelle-projekte/car/${query}`);
 }
});

test('redirect forwarding hash authorizes only its fixed script and keeps strict CSP', () => {
 const script='(()=>{const target=new URL("/projekte/aktuelle-projekte/car/",location.origin);target.search=location.search;target.hash=location.hash;location.replace(target.href)})();';
 const $=load(`<head><meta http-equiv="content-security-policy" content="default-src 'none'; script-src 'self'; object-src 'none'"><script>${script}</script></head>`);finalizeCsp($);
 assert.ok($('meta').attr('content').includes("'sha256-"+createHash('sha256').update(script).digest('base64')+"'"));assert.ok(!$('meta').attr('content').includes('unsafe-inline'));
 const forwarded=[];vm.runInNewContext(script,{URL,location:{origin:'https://example.com',search:'?lang=de&x=1',hash:'#gallery',replace:url=>forwarded.push(url)}});assert.equal(forwarded[0],'https://example.com/projekte/aktuelle-projekte/car/?lang=de&x=1#gallery');
});

test('guided errors have additive stable codes and German actionable output including routes and backups', () => {
 for(const code of ['UNSAFE_PATH','EXPORT_LIMIT','INVALID_EXPORT','INVALID_IMAGE','INVALID_ROUTE','INVALID_REDIRECT','PROJECT_SOURCE','ORIGINAL_MISSING','SLUG_CHANGED','DESTINATION_EXISTS','DUPLICATE_ORDER','STALE_REVIEW','LOCK_CHANGED','BACKUP_INVALID','WRITE_VERIFY','EXTERNAL_EDIT','ROLLBACK_FAILED','ROLLED_BACK']) {
  const error=vehicleError(code,'English diagnostic',{detail:'aktuelle-projekte/car',backup:'.cache/backup'});assert.equal(error.message,'English diagnostic');assert.equal(error.code,code);const output=formatVehicleError(error);assert.ok(output.includes('aktuelle-projekte/car')&&output.includes('.cache/backup'));assert.ok(!output.includes('English diagnostic'));
 }
 assert.match(formatVehicleError(Object.assign(new Error('permission denied'),{code:'EACCES',path:'/project'})),/Kein Zugriff.*project/);
});
