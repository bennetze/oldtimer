const frame = document.getElementById('editor');
frame.addEventListener('load', async () => {
  const w = frame.contentWindow, d = frame.contentDocument, t = w.vehicleTest;
  const results = [], assert = (condition, message) => { if (!condition) throw new Error(message); };
  const stable = value => Array.isArray(value) ? value.map(stable) : value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort().map(key => [key, stable(value[key])])) : value;
  const eq = (a, b, label) => assert(JSON.stringify(stable(a)) === JSON.stringify(stable(b)), `${label}: ${JSON.stringify(a)} != ${JSON.stringify(b)}`);
  const test = async (name, run) => { try { await run(); results.push({ name, pass: true }); } catch (error) { results.push({ name, pass: false, error: error.message }); } document.getElementById('results').textContent = JSON.stringify(results, null, 2); };
  const image = (name) => new w.File([Uint8Array.from(atob(fixtureImage), (c) => c.charCodeAt(0))], name, { type: 'image/jpeg', lastModified: 1 });
  const input = (id, value) => { d.getElementById(id).value = value; d.getElementById(id).dispatchEvent(new w.Event('input', { bubbles: true })); };
  const click = (selector) => d.querySelector(selector).click();
  const record = { slug:'test-car', category:'aktuelle-projekte', title:'Testfahrzeug 1957', titleEn: 'Testfahrzeug 1957', description:'Test für den lokalen Import.', descriptionEn: 'Test für den lokalen Import.', sourceUrl:'https://www.oldtimermanufaktur.de/aktuelle-projekte/item/test-car', order:-42, dateModified:'2026-09-01', year:'1957', cardImage:'./card.jpg', cardImageAlt:'Kartenansicht', cardImageAltEn: 'Kartenansicht', leadImage:'./image-002.jpg', leadImageAlt:'Titelansicht', leadImageAltEn: 'Titelansicht', blocks:[{type:'copy',html:'<p><strong>Originaltext</strong> mit Umlauten: äöü.</p>', htmlEn: '<p><strong>Originaltext</strong> mit Umlauten: äöü.</p>'},{type:'gallery',images:[{src:'./image-002.jpg',alt:'Zuerst', altEn: 'Zuerst',caption:'Bild zwei', captionEn: 'Bild zwei'},{src:'./image-001.jpg',alt:'Danach', altEn: 'Danach'},{src:'./image-002.jpg',alt:'Wiederholung', altEn: 'Wiederholung',caption:'Anderer Kontext', captionEn: 'Anderer Kontext'}]},{type:'contact',html:'<p>Bitte kontaktieren Sie uns.</p>', htmlEn: '<p>Bitte kontaktieren Sie uns.</p>'}] };
  const filesFor = (data = record) => [new w.File([JSON.stringify(data)], 'vehicle.json', {type:'application/json'}), image('card.jpg'), image('image-001.jpg'), image('image-002.jpg')];
  w.confirm = () => true; // Only test fixture replacement prompts.
  await test('An English-only draft is protected before importing another vehicle', async () => {
    input('title-en', 'Unfinished English draft');w.confirm=()=>false;
    try {await t.importVehicle(filesFor());eq(t.fields.titleEn.value,'Unfinished English draft','draft protection');}
    finally {w.confirm=()=>true;input('title-en','');}
  });
  await test('German slug, local date, canonical URL and default alt text', () => {
    input('title','Prüfung ÄÖÜ ß 1957'); input('description','Lokaler Test'); input('title-en', 'Test car 1957'); input('description-en', 'Local test');
    eq(t.fields.slug.value,'pruefung-aeoeue-ss-1957','slug');
    eq(t.fields.dateModified.value,t.localDate(),'date');
    assert(t.fields.sourceUrl.value.endsWith('/aktuelle-projekte/pruefung-aeoeue-ss-1957/'),'URL');
    eq(t.fields.cardAlt.value,t.fields.title.value,'alt');
  });
  await test('Gallery image import before choosing a card is supported', async () => {
    await t.addGalleryFiles([image('first.jpg')]);
    assert(t.state.images.length === 1, 'gallery-first import failed');
    click(`[data-image-remove="${t.state.images[0].id}"]`);
  });
  await test('Corrupt image is refused without replacing the valid card', async () => {
    await t.setCardFile(image('card.jpg')); const original = t.state.cardFile;
    await t.setCardFile(new w.File(['corrupt'],'bad.jpg',{type:'image/jpeg'}));
    assert(t.state.cardFile === original,'card changed');
  });
  await test('Sanitizer output is accepted by independent website HTML validation', async () => {
    const payloads = ['<b>Fett</b><i>Kursiv</i>', '<p style="color:red" onclick="x()">Text</p>', '<svg onload="x()"></svg><p>Safe</p>', '<a href="java&#x73;cript:x()">Link</a>', '<a href="//example.com">Link</a>', '<a href="http://example.com">Link</a>', '<a href="#foo">Link</a>', '<a href="https://example.com">Link</a>', '<p>Text</p><img src="https://example.com/tracker">'];
    const html = payloads.map((value) => t.sanitizeHtml(value));
    const response = await fetch('/html',{method:'POST',body:JSON.stringify(html)});
    assert(response.ok,await response.text());
  });
  await test('Card-only lead validates and ZIP writer produces a complete archive', async () => {
    assert(t.validate().errors.length === 0,t.validate().errors.join(','));
    t.state.autoOrderValue=Date.now(); const value=t.createRecord(); t.validateRecord(value);
    eq(value.cardImage,value.leadImage,'card-only lead'); assert(value.order>0,'append order');
    const base=`${value.category}/${value.slug}`;
    const zip=await t.makeZip([{name:`${base}.astro`,data:t.createAstro(value.category,value.slug)},{name:`${base}/vehicle.json`,data:JSON.stringify(value)},{name:`${base}/card.jpg`,data:t.state.cardFile}]);
    await fetch('/zip',{method:'POST',body:zip});
  });
  await test('Folder import round trip preserves metadata, gallery repetitions, captions and image names', async () => {
    await t.importVehicle(filesFor()); eq(t.createRecord(), record, 'record');
    assert(t.fields.slug.readOnly,'slug must be locked'); assert(!t.fields.autoOrder.checked,'order preserved');
  });
  await test('Import rejects unknown fields and missing images without discarding current work', async () => {
    await t.importVehicle(filesFor({...record, futureField:true})); eq(t.createRecord(),record,'unknown field protection');
    await t.importVehicle(filesFor().slice(0,2)); eq(t.createRecord(),record,'missing image protection');
  });
  await test('Category move preserves slug and order and updates canonical URL', () => {
    t.fields.category.value='vergangene-projekte'; t.fields.category.dispatchEvent(new w.Event('change',{bubbles:true}));
    const value=t.createRecord(); eq(value.order,-42,'order'); eq(value.slug,record.slug,'slug');
    assert(value.sourceUrl.endsWith('/vergangene-projekte/test-car/'),'new canonical');
  });
  await test('Image removal repairs lead and all repeated gallery references', () => {
    const imageId=t.state.leadImageId; click(`[data-image-remove="${imageId}"]`);
    eq(t.state.leadImageId,'__card__','lead fallback');
    assert(t.state.blocks.every(block=>!block.imageIds.includes(imageId)),'dangling gallery reference');
  });
  await test('New images renumber and keep alternatives through reorder', async () => {
    await t.importVehicle(filesFor()); await t.addGalleryFiles([image('new.jpg'),image('another.jpg')]);
    const added=t.state.images.at(-1); added.alt='Eigener Text'; added.altTouched=true;
    click(`[data-image-move="up"][data-id="${added.id}"]`);
    eq(t.state.images.find(item=>item.id===added.id).alt,'Eigener Text','alt after reorder');
    assert(new Set(t.state.images.map(item=>item.outputName)).size===t.state.images.length,'duplicate names');
  });
  await test('Copy/contact/gallery blocks reorder and remove through buttons', () => {
    const before=t.state.blocks[0].id; click('[data-add-block="copy"]');
    const added=t.state.blocks.at(-1).id; click(`[data-block-move="up"][data-id="${added}"]`);
    assert(t.state.blocks.at(-1).id!==added,'block move'); click(`[data-block-remove="${added}"]`);
    eq(t.state.blocks[0].id,before,'original block');
  });
  await test('Real calendar dates, safe integers and ZIP limits fail closed', () => {
    for (const patch of [{dateModified:'2026-02-30'},{order:Number.MAX_SAFE_INTEGER+1},{slug:'index'}]) {
      let rejected=false; try {t.validateRecord({...record,...patch});} catch {rejected=true;} assert(rejected,JSON.stringify(patch));
    }
    let rejected=false;try { t.checkZipEntries([{name:'../bad',data:'x'}]); } catch {rejected=true;} assert(rejected,'path check');
    rejected=false;try { t.checkZipEntries([{name:'aktuelle-projekte/test-car/card.jpg',data:{size:600*1024**2}}]); } catch {rejected=true;} assert(rejected,'size check');
  });
  await test('English fields and rich text edit independently and survive reorder', async () => {
    await t.importVehicle(filesFor());
    input('title-en', 'Distinct English title'); input('description-en', 'Distinct English description');
    eq(t.fields.title.value, record.title, 'German title');
    const block = t.state.blocks[0];
    const en = d.querySelector(`[data-editor="${block.id}"][data-language="en"]`);
    en.innerHTML = '<p>Independent <em>English</em> text.</p>'; en.dispatchEvent(new w.Event('input', {bubbles:true}));
    eq(block.html, record.blocks[0].html, 'German rich text');
    click(`[data-block-move="down"][data-id="${block.id}"]`);
    eq(t.state.blocks.find(item=>item.id===block.id).htmlEn, '<p>Independent <em>English</em> text.</p>', 'English after reorder');
    t.validateRecord(t.createRecord());
  });
  await test('Repeated gallery occurrence translations remain independent', async () => {
    await t.importVehicle(filesFor());
    const block = t.state.blocks[1];
    const inputEn = d.querySelector(`[data-entry-block="${block.id}"][data-entry-alt="2"][data-language="en"]`);
    inputEn.value = 'Different English context'; inputEn.dispatchEvent(new w.Event('input', {bubbles:true}));
    const value = t.createRecord();
    eq(value.blocks[1].images[0].altEn, record.blocks[1].images[0].altEn, 'first occurrence');
    eq(value.blocks[1].images[2].altEn, 'Different English context', 'last occurrence');
    eq(value.blocks[1].images[2].alt, record.blocks[1].images[2].alt, 'German occurrence');
  });
  await test('Missing English and unpaired captions block export and identify the field', async () => {
    await t.importVehicle(filesFor()); input('title-en', '');
    assert(t.validate().errors.some(error=>error.includes('English')), 'missing English title accepted');
    await t.generate(); eq(d.activeElement.id, 'title-en', 'invalid field focus');
    input('title-en', record.titleEn);
    const caption = d.querySelector('[data-entry-caption="0"][data-language="en"]');
    caption.value=''; caption.dispatchEvent(new w.Event('input',{bubbles:true}));
    assert(t.validate().errors.some(error=>error.includes('both captions')), 'unpaired caption accepted');
  });
  await test('Legacy imports require explicit selection and cannot export until translated', async () => {
    await t.importVehicle(filesFor());
    const old = JSON.parse(JSON.stringify(record));
    for (const key of Object.keys(old)) if (key.endsWith('En')) delete old[key];
    for (const block of old.blocks) { delete block.htmlEn; for (const item of block.images || []) {delete item.altEn; delete item.captionEn;} }
    await t.importVehicle(filesFor(old)); eq(t.createRecord(),record,'legacy import without opt-in');
    d.querySelector('#legacy-import').checked=true;
    await t.importVehicle(filesFor(old)); eq(t.fields.titleEn.value,'','legacy English stays empty');
    eq(t.fields.title.value,record.title,'legacy German preserved');
    assert(t.validate().errors.some(error=>error.includes('English')), 'incomplete legacy export accepted');
    d.querySelector('#legacy-import').checked=false;
    await t.importVehicle(filesFor());
  });
  await test('Unsafe English HTML is rejected without replacing current work', async () => {
    const bad=JSON.parse(JSON.stringify(record));bad.blocks[0].htmlEn='<p onclick="evil()">Unsafe</p>';
    await t.importVehicle(filesFor(bad));eq(t.createRecord(),record,'unsafe English import');
  });
  await test('Each rich-text toolbar restores only its own language selection', async () => {
    await t.importVehicle(filesFor());
    const block=t.state.blocks[0];
    const de=d.querySelector(`[data-editor="${block.id}"][data-language="de"]`);
    const en=d.querySelector(`[data-editor="${block.id}"][data-language="en"]`);
    en.innerHTML='<p>English selection</p>';en.dispatchEvent(new w.Event('input',{bubbles:true}));
    const select=editor=>{editor.focus();const range=d.createRange();range.selectNodeContents(editor);w.getSelection().removeAllRanges();w.getSelection().addRange(range);d.dispatchEvent(new w.Event('selectionchange'));};
    select(en);select(de);
    en.closest('.language-editor').querySelector('[data-command="bold"]').click();
    assert(/<(strong|b)>/.test(en.innerHTML),'English bold selection not restored');
    eq(block.html,record.blocks[0].html,'German unchanged by English toolbar');
    t.validateRecord(t.createRecord());
  });
  await test('A real download exports an immutable bilingual snapshot', async () => {
    await t.importVehicle(filesFor());
    let clicked=false,blob;
    const originalClick=w.HTMLAnchorElement.prototype.click, originalUrl=w.URL.createObjectURL;
    w.HTMLAnchorElement.prototype.click=function(){clicked=true; originalClick.call(this);};
    w.URL.createObjectURL=function(value){if(value.type==='application/zip')blob=value;return originalUrl.call(this,value);};
    try {
      const generating=t.generate();t.fields.titleEn.value='Changed after export started';
      await generating;assert(clicked,'download was not triggered');assert(blob,'ZIP blob was not produced');
      const bytes=new Uint8Array(await blob.arrayBuffer()), view=new DataView(bytes.buffer), decoder=new TextDecoder();
      let position=0,exported;
      while(view.getUint32(position,true)===0x04034b50){
        const size=view.getUint32(position+18,true),nameLength=view.getUint16(position+26,true),extra=view.getUint16(position+28,true);
        const name=decoder.decode(bytes.slice(position+30,position+30+nameLength));const data=position+30+nameLength+extra;
        if(name.endsWith('/vehicle.json'))exported=JSON.parse(decoder.decode(bytes.slice(data,data+size)));
        position=data+size;
      }
      eq(exported,record,'immutable exported record');
      const response=await fetch('/zip',{method:'POST',body:blob});assert(response.ok,'ZIP artifact save failed');
    } finally {w.HTMLAnchorElement.prototype.click=originalClick;w.URL.createObjectURL=originalUrl;t.fields.titleEn.value=record.titleEn;}
    assert(d.querySelector('#status').textContent.includes('ZIP created'),d.querySelector('#status').textContent);
  });
  await test('Desktop and 390px layout do not overflow', async () => {
    for (const width of [1440,390]) { frame.style.width=`${width}px`; await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))); assert(d.documentElement.scrollWidth<=width,`overflow at ${width}: ${d.documentElement.scrollWidth}`); }
  });
  const response = await fetch('/result',{method:'POST',body:JSON.stringify(results,null,2)});
  document.getElementById('results').textContent=JSON.stringify({passed:results.filter(x=>x.pass).length,total:results.length,saved:response.ok,results},null,2);
});
