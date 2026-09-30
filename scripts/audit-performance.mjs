// Local-only, serial browser audit. Never changes the website or deployment output.
import { createServer } from 'node:http';
import { readFile, mkdir, writeFile, readdir } from 'node:fs/promises';
import { resolve, extname, sep, join } from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { load } from 'cheerio';
const root = resolve(process.env.PERFORMANCE_ROOT || 'dist');
const output = resolve(process.env.PERFORMANCE_OUTPUT || '.codex-qa/performance');
const base = process.argv.includes('--pages') ? '/oldtimer' : '';
const port = Number(process.env.PORT || 4329);
const records = [];
let cacheMode = 'cold';
const suites = new Map();
const types = { '.html':'text/html; charset=utf-8', '.js':'text/javascript', '.css':'text/css', '.woff2':'font/woff2', '.webp':'image/webp', '.jpg':'image/jpeg', '.png':'image/png', '.avif':'image/avif', '.svg':'image/svg+xml', '.mp4':'video/mp4', '.webm':'video/webm' };
const vehicleFolders = await readdir(join(root, 'projekte/vergangene-projekte'), {withFileTypes:true});
const details = await Promise.all(vehicleFolders.filter(e=>e.isDirectory() && e.name !== 'seite').map(async e=>{
 const path = `/projekte/vergangene-projekte/${e.name}/`;
 return {path, bytes:(await readFile(join(root,path,'index.html'))).length};
}));
const longest = details.sort((a,b)=>b.bytes-a.bytes)[0]?.path;
const routes = ['/', '/handwerk/', '/ueber-uns/', '/projekte/', '/projekte/aktuelle-projekte/', '/projekte/vergangene-projekte/', '/projekte/vergangene-projekte/seite/2/', '/projekte/fahrzeugangebote/', longest, '/impressum/', '/datenschutz/', '/404.html', '/en/', '/en/handwerk/', '/en/projekte/vergangene-projekte/', longest && `/en${longest}`].filter(Boolean);
const median = values => { const sorted=values.filter(Number.isFinite).sort((a,b)=>a-b); return sorted.length ? sorted[Math.floor(sorted.length/2)] : null; };
function summary() {
 const groups = new Map();
 for(const record of records){if(record.prime) continue;const key=JSON.stringify([record.route,record.width,record.motion,record.cache]);if(!groups.has(key))groups.set(key,[]);groups.get(key).push(record);}
 return [...groups.values()].map(rows=>({route:rows[0].route,width:rows[0].width,motion:rows[0].motion,cache:rows[0].cache,runs:rows.length,...Object.fromEntries(['lcp','cls','bytes','requests','longTaskMs','videoStartup'].map(key=>[key,median(rows.map(r=>r[key]))]))}));
}
function instrumentation(index, schedule, suite) {
 return `(() => {
 const scenario=${JSON.stringify(schedule[index])};
 const reduced=scenario.motion==='reduce';
 const nativeMatch=window.matchMedia.bind(window);
 window.matchMedia=query=>{const result=nativeMatch(query);if(query.includes('prefers-reduced-motion'))Object.defineProperty(result,'matches',{get:()=>reduced});return result;};
 let lcp=null,cls=0,longTaskMs=null,videoStartup=null;const observers=[];
 const observe=(type,callback)=>{if(typeof PerformanceObserver==='undefined'||!PerformanceObserver.supportedEntryTypes?.includes(type))return false;const observer=new PerformanceObserver(list=>list.getEntries().forEach(callback));observer.observe({type,buffered:true});observers.push({observer,callback});return true;};
 observe('largest-contentful-paint',e=>lcp=e.startTime);
 let sessionStart=0,lastShift=0,sessionScore=0;
 observe('layout-shift',e=>{if(e.hadRecentInput)return;if(e.startTime-lastShift>1000||e.startTime-sessionStart>5000){sessionStart=e.startTime;sessionScore=0;}lastShift=e.startTime;sessionScore+=e.value;cls=Math.max(cls,sessionScore);});
 if(observe('longtask',e=>longTaskMs+=e.duration))longTaskMs=0;
 document.addEventListener('playing',e=>{if(e.target.matches('[data-motion-video]')&&videoStartup===null)videoStartup=performance.now();},true);
 document.addEventListener('DOMContentLoaded',()=>setTimeout(async()=>{
 for(const {observer,callback} of observers)observer.takeRecords().forEach(callback);
 const resources=performance.getEntriesByType('resource');const navigation=performance.getEntriesByType('navigation')[0];
 const result={...scenario,width:innerWidth,height:innerHeight,lcp,cls,longTaskMs,videoStartup,bytes:resources.reduce((n,e)=>n+e.transferSize, navigation?.transferSize||0),requests:resources.length+1,resources:resources.map(e=>({url:e.name,bytes:e.transferSize,duration:e.duration,type:e.initiatorType})),videos:[...document.querySelectorAll('video')].map(v=>({src:v.currentSrc,paused:v.paused,ready:v.readyState})),nodes:document.querySelectorAll('*').length,userAgent:navigator.userAgent};
 await fetch('/__performance/result',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(result)});
 location.href=${JSON.stringify(index+1<schedule.length?`/__performance/run?index=${index+1}&suite=${suite}`:'/__performance/report')};
 },6000),{once:true});
 })();`;
}
createServer(async(req,res)=>{
 try {
 const url=new URL(req.url,`http://127.0.0.1:${port}`);
 if(url.pathname==='/__performance/result'&&req.method==='POST'){
 if(req.headers.origin!==url.origin){res.writeHead(403);res.end();return;}
 let body='';for await(const chunk of req){body+=chunk;if(body.length>1024*1024)throw new Error('Oversized result');}
 records.push(JSON.parse(body));await mkdir(output,{recursive:true});await writeFile(join(output,'results.json'),JSON.stringify({records,summary:summary()},null,2));res.end('saved');return;
 }
 if(url.pathname==='/__performance/report'){res.setHeader('Content-Type','text/html; charset=utf-8');res.end(`<h1>Local performance audit</h1><pre>${JSON.stringify(summary(),null,2).replace(/</g,'&lt;')}</pre>`);return;}
 let pathname=url.pathname;let script;
 if(pathname==='/__performance/run'){
 const suite=url.searchParams.get('suite');const schedule=suites.get(suite)||[];const index=Number(url.searchParams.get('index')||0);const scenario=schedule[index];
 if(!scenario||!routes.includes(scenario.route)||!['cold','warm'].includes(scenario.cache)||!['reduce','normal'].includes(scenario.motion))throw new Error('Invalid audit scenario');
 cacheMode=scenario.cache;pathname=base+scenario.route;script=instrumentation(index,schedule,suite);
 } else if(pathname==='/__performance'){
 const selected=url.searchParams.get('route');const chosen=selected?routes.filter(route=>route===selected):routes;
 const schedule=chosen.flatMap(route=>['normal','reduce'].flatMap(motion=>['cold','warm'].flatMap(cache=>Array.from({length:cache==='warm'?4:3},(_,run)=>({route,motion,cache,run,prime:cache==='warm'&&run===0})))));
 const suite=randomUUID();suites.set(suite,schedule);
 res.setHeader('Content-Type','text/html; charset=utf-8');res.end(`<h1>Local performance audit</h1><p>Set the browser viewport to 1440 × 900 or 390 × 844. Each scenario takes six seconds. Warm samples follow an excluded priming visit. Unsupported metrics are null. Transfer totals exclude requests still in flight.</p><a href="/__performance/run?index=0&suite=${suite}">Start ${schedule.length} visits</a>`);return;
 }
 // Instrumented navigation retains the real route, so links/localization work normally.
 if(script){const target=new URL(pathname,url.origin);target.searchParams.set('lang',pathname.includes('/en/')?'en':'de');target.searchParams.set('__perf',`${url.searchParams.get('suite')}:${url.searchParams.get('index')}`);res.writeHead(302,{Location:target.pathname+target.search});pending.set(target.pathname+target.search,script);res.end();return;}
 const relative=base&&pathname.startsWith(base+'/')?pathname.slice(base.length):pathname;
 const file=resolve(root,'.'+decodeURIComponent(relative)+(relative.endsWith('/')?'index.html':''));
 if(!file.startsWith(root+sep))throw new Error('Invalid path');
 let bytes=await readFile(file);const injection=pending.get(url.pathname+url.search);pending.delete(url.pathname+url.search);
 if(injection){
 const token=url.searchParams.get('__perf');
 if(cacheMode==='cold') bytes=Buffer.from(bytes.toString().replace(/(\/(?:oldtimer\/)?(?:_astro|vehicle-gallery)\/[^\s"'<>(),;?]+)/g, `$1?__perf_cache=${encodeURIComponent(token)}`));
 const $=load(bytes.toString());const meta=$('meta[http-equiv="content-security-policy"]');const digest=createHash('sha256').update(injection).digest('base64');meta.attr('content',meta.attr('content').replace(/(script-src-elem[^;]*)/,'$1 '+`'sha256-${digest}'`));meta.after(`<script>${injection}</script>`);
 for(const [selector,directive] of [['script:not([src])','script-src-elem'],['style','style-src-elem']]){
 $(selector).each((_,node)=>{const hash=createHash('sha256').update($(node).html()||'').digest('base64');meta.attr('content',meta.attr('content').replace(new RegExp(`(${directive}[^;]*)`),`$1 'sha256-${hash}'`));});
 }
 bytes=Buffer.from($.html());}
 const token=url.searchParams.get('__perf_cache');
 if(token && ['.css','.js'].includes(extname(file))){
 let text=bytes.toString();
 text=text.replace(/(\/(?:oldtimer\/)?_astro\/[^\s"'<>(),;?]+)/g, `$1?__perf_cache=${encodeURIComponent(token)}`);
 text=text.replace(/(["'])(\.\/[^"']+\.js)\1/g, `$1$2?__perf_cache=${encodeURIComponent(token)}$1`);
 bytes=Buffer.from(text);
 }
 res.setHeader('Content-Type',types[extname(file)]||'application/octet-stream');res.setHeader('Cache-Control',extname(file)==='.html'||cacheMode==='cold'?'no-store':'public, max-age=3600');
 res.setHeader('Accept-Ranges','bytes');
 if(req.headers.range){const match=/^bytes=(\d+)-(\d*)$/.exec(req.headers.range);if(!match)throw new Error('Invalid range');const start=Number(match[1]);const end=Math.min(match[2]?Number(match[2]):bytes.length-1,bytes.length-1);if(start>end){res.writeHead(416);res.end();return;}res.writeHead(206,{'Content-Range':`bytes ${start}-${end}/${bytes.length}`,'Content-Length':end-start+1});res.end(bytes.subarray(start,end+1));return;}
 res.setHeader('Content-Length',bytes.length);res.end(bytes);
 }catch(error){res.writeHead(400);res.end(error.message);}
}).listen(port,'127.0.0.1',()=>console.log(`Local serial audit: http://127.0.0.1:${port}/__performance — results: ${output}`));
const pending=new Map();
