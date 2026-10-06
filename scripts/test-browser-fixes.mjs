// Run against a root-base localhost production preview. Playwright is an optional QA runtime.
const { chromium, webkit } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
import { mkdir, writeFile } from 'node:fs/promises';
const base=process.env.SITE_URL || 'http://127.0.0.1:4321';
const out=process.env.SCREENSHOT_DIR || '.codex-qa/browser-fixes';
await mkdir(out, { recursive: true });
const checks=[];
const check=(label,pass,detail)=>{checks.push({label,pass,detail});if(!pass)console.log('FAIL',label,detail);};
for(const[name,engine,options]of[['chrome',chromium,{channel:'chrome'}],['webkit',webkit,{}]]){
 const b=await engine.launch(name === 'chrome' ? (process.env.CHROME_CHANNEL ? { channel: process.env.CHROME_CHANNEL } : {}) : options);
 for(const[w,h]of[[1440,900],[390,844],[320,568],[844,390]])for(const lang of ['de','en'])for(const motion of ['reduce','no-preference']){
 const c=await b.newContext({viewport:{width:w,height:h},hasTouch:w<900,isMobile:w<900,locale:lang==='de'?'de-DE':'en-GB',reducedMotion:motion});const p=await c.newPage();const errors=[];p.on('pageerror',e=>errors.push(e.message));await c.addInitScript(()=>{window.csp=[];document.addEventListener('securitypolicyviolation',e=>window.csp.push(e.violatedDirective));});const prefix=`${name}-${w}x${h}-${lang}-${motion}`;
 await p.goto(base+(lang==='en'?'/en':'')+'/projekte/fahrzeugangebote/?lang='+lang,{waitUntil:'networkidle'});await p.evaluate(()=>document.fonts.ready);const heading=await p.locator('h1').evaluate(el=>{const r=new Range();r.selectNodeContents(el);return{lines:r.getClientRects().length,width:el.scrollWidth,client:el.clientWidth};});check(prefix+' heading single line',w>=680||heading.lines===1,heading);
 await p.screenshot({path:out+'/'+prefix+'-offers.png'});
 await p.goto(base+(lang==='en'?'/en':'')+'/datenschutz/?lang='+lang,{waitUntil:'networkidle'});await p.locator('.menu-toggle').click();await p.waitForTimeout(1400);check(prefix+' menu solid background',await p.locator('.menu-panel').evaluate(el=>getComputedStyle(el).backgroundColor==='rgba(16, 16, 16, 0.96)'));
 await p.keyboard.press('Shift+Tab');await p.waitForFunction(()=>{const r=document.activeElement.getBoundingClientRect();return !!document.activeElement.closest('#site-menu')&&r.top>=0&&r.bottom<=innerHeight;},null,{timeout:1500});check(prefix+' last control visible',await p.evaluate(()=>{const r=document.activeElement.getBoundingClientRect();return !!document.activeElement.closest('#site-menu')&&r.top>=0&&r.bottom<=innerHeight;}));await p.screenshot({path:out+'/'+prefix+'-menu.png'});await p.keyboard.press('Escape');check(prefix+' focus restored',await p.evaluate(()=>document.activeElement.matches('.menu-toggle')));
 await p.goto(base+(lang==='en'?'/en':'')+'/projekte/fahrzeugangebote/73-emw-327-2-1954/?lang='+lang,{waitUntil:'networkidle'});const trigger=p.locator('[data-lightbox-trigger]').first();const alt=await trigger.getAttribute('data-lightbox-alt');check(prefix+' thumbnail/link descriptions',!!alt&&!/Aufnahme \d+|photograph \d+/.test(alt)&&(await trigger.locator('img').getAttribute('alt'))===alt&&(await trigger.getAttribute('aria-label')).includes(alt));await trigger.click();check(prefix+' lightbox alternative',await p.locator('[data-image-lightbox] img').getAttribute('alt')===alt);await p.keyboard.press('Escape');check(prefix+' lightbox focus restored',await trigger.evaluate(el=>el===document.activeElement));
 await p.goto(base+(lang==='en'?'/en':'')+'/ueber-uns/?lang='+lang,{waitUntil:'networkidle'});await p.locator('#site-footer').scrollIntoViewIfNeeded();await p.locator('#site-footer a[href*="impressum"]').click();check(prefix+' footer legal destination',new URL(p.url()).pathname===(lang==='en'?'/en':'')+'/impressum/');
 const response=await p.goto(base+(lang==='en'?'/en':'')+'/missing-browser-fix-route?lang='+lang,{waitUntil:'networkidle'});check(prefix+' missing route 404',response.status()===404&&await p.locator('.not-found__number').textContent()==='404');check(prefix+' 404 noindex',(await p.locator('meta[name="robots"]').getAttribute('content')).includes('noindex'));await p.locator('.not-found__link').click();check(prefix+' 404 home recovery',new URL(p.url()).pathname===(lang==='en'?'/en/':'/'));
 check(prefix+' no browser errors',errors.length===0,errors);check(prefix+' no CSP violations',(await p.evaluate(()=>window.csp)).length===0);
 await c.close();
 }
 await b.close();console.log(name+' targeted matrix complete');
}
await writeFile(out+'/targeted-report.json',JSON.stringify(checks,null,2));console.log('Checks',checks.length,'Failures',checks.filter(x=>!x.pass).length);

if (checks.some(check => !check.pass)) process.exitCode = 1;
