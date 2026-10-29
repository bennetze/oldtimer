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
  const record = { slug:'test-car', category:'aktuelle-projekte', title:'Testfahrzeug 1957', titleEn: 'Test vehicle 1957', description:'Test für den lokalen Import.', descriptionEn: 'Local import test.', sourceUrl:'https://www.oldtimermanufaktur.de/aktuelle-projekte/item/test-car', order:-42, dateModified:'2026-09-01', year:'1957', cardImage:'./card.jpg', cardImageAlt:'Kartenansicht', cardImageAltEn: 'Card view', leadImage:'./image-002.jpg', leadImageAlt:'Titelansicht', leadImageAltEn: 'Lead view', blocks:[{type:'copy',html:'<p><strong>Originaltext</strong> mit Umlauten: äöü.</p>', htmlEn: '<p><strong>Original story</strong> in English.</p>'},{type:'gallery',images:[{src:'./image-002.jpg',alt:'Zuerst', altEn: 'First',caption:'Bild zwei', captionEn: 'Second image'},{src:'./image-001.jpg',alt:'Danach', altEn: 'Next'},{src:'./image-002.jpg',alt:'Wiederholung', altEn: 'Repeated view',caption:'Anderer Kontext', captionEn: 'Another context'}]},{type:'contact',html:'<p>Bitte kontaktieren Sie uns.</p>', htmlEn: '<p>Please contact us.</p>'}] };
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
    const added = t.state.images[0];
    eq(added.alt, '', 'German alternative must be authored');
    eq(added.altEn, '', 'English alternative must be authored');
    const alt = d.querySelector(`[data-image-alt="${added.id}"]:not([data-language="en"])`);
    assert(t.validate().errors.some(message => message.includes('Alternativtext')), 'missing alternatives must be reported before export');
    alt.value = 'Test – Aufnahme 1 der Fahrzeugdokumentation';
    alt.dispatchEvent(new w.Event('input', { bubbles: true }));
    assert(t.validate().errors.some(message => message.includes('nummerierten Platzhalter')), 'placeholder must be reported before export');
    click(`[data-image-remove="${t.state.images[0].id}"]`);
  });
  await test('Corrupt image is refused without replacing the valid card', async () => {
    await t.setCardFile(image('card.jpg')); const original = t.state.cardFile;
    await t.setCardFile(new w.File(['corrupt'],'bad.jpg',{type:'image/jpeg'}));
    assert(t.state.cardFile === original,'card changed');
  });
  await test('Sanitizer output is accepted by independent website HTML validation', async () => {
    const payloads = ['<html><body onload=alert(1)><p>Text</p></body></html>', '<p><strong>malformed</p></strong>', '<ul><li>one<li>two</ul>', '<a href="mailto:info@example.com">Contact</a>', '<a href="https://user:pass@example.com">Unsafe</a>', '<b>Fett</b><i>Kursiv</i>', '<p style="color:red" onclick="x()">Text</p>', '<svg onload="x()"></svg><p>Safe</p>', '<a href="java&#x73;cript:x()">Link</a>', '<a href="//example.com">Link</a>', '<a href="http://example.com">Link</a>', '<a href="#foo">Link</a>', '<a href="https://example.com">Link</a>', '<p>Text</p><img src="https://example.com/tracker">'];
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
    assert(t.validate().errors.some(error=>error.includes('Englisch')), 'missing English title accepted');
    await t.generate(); await new Promise(resolve=>w.requestAnimationFrame(()=>w.requestAnimationFrame(resolve))); eq(d.activeElement.id, 'title-en', 'invalid field focus');
    input('title-en', record.titleEn);
    const caption = d.querySelector('[data-entry-caption="0"][data-language="en"]');
    caption.value=''; caption.dispatchEvent(new w.Event('input',{bubbles:true}));
    assert(t.validate().errors.some(error=>error.includes('Beide Bildunterschriften')), 'unpaired caption accepted');
  });
  await test('German-only imports are rejected without replacing current work', async () => {
    await t.importVehicle(filesFor());
    const old = JSON.parse(JSON.stringify(record));
    for (const key of Object.keys(old)) if (key.endsWith('En')) delete old[key];
    for (const block of old.blocks) { delete block.htmlEn; for (const item of block.images || []) {delete item.altEn; delete item.captionEn;} }
    assert(!d.querySelector('#legacy-import'), 'legacy import checkbox still present');
    assert(!await t.importVehicle(filesFor(old)), 'German-only import accepted');
    eq(t.createRecord(),record,'rejected import preserves current work');
  });
  await test('Unsafe English HTML is rejected without replacing current work', async () => {
    const bad=JSON.parse(JSON.stringify(record));bad.blocks[0].htmlEn='<p onclick="evil()">Unsafe</p>';
    await t.importVehicle(filesFor(bad));eq(t.createRecord(),record,'unsafe English import');
  });
  await test('Each rich-text toolbar restores only its own language selection', async () => {
    await t.importVehicle(filesFor());
    t.showStep('content');
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
  await test('Filename stems and payload limits agree with checked saves', async () => {
    await t.importVehicle(filesFor());
    const preserved = t.state.images[0]; preserved.originalName='IMAGE-004.png'; preserved.outputName=preserved.originalName;
    await t.addGalleryFiles([image('new-one.jpg'),image('new-two.jpg')]);
    const stems=[t.state.cardName,...t.state.images.map(item=>item.outputName)].map(name=>name.replace(/\.[^.]+$/,'').toLowerCase());
    assert(new Set(stems).size===stems.length,'case/conversion collision');
    for(const [name,data] of [['vehicle.json',{size:2*1024**2+1}],['card.jpg',{size:50*1024**2+1}]]) {
      let rejected=false;try{t.checkZipEntries([{name:'aktuelle-projekte/test-car/'+name,data}]);}catch{rejected=true;}assert(rejected,'oversized '+name);
    }
    for(const slug of ['con','nul','aux','a'.repeat(250)]) {let rejected=false;try{t.validateRecord({...record,slug});}catch{rejected=true;}assert(rejected,'unsafe slug '+slug);}
    for(const html of ['<body onload=x()><p>Text</p></body>','<html><p>Text</p></html>']) {
      for(const language of ['html','htmlEn']) {let rejected=false;try{t.validateRecord({...record,blocks:[{type:'copy',html:'<p>Text</p>',htmlEn:'<p>Text</p>',[language]:html}]});}catch{rejected=true;}assert(rejected,'wrapper accepted');}
    }
  });
  await test('A real download exports an immutable bilingual snapshot', async () => {
    await t.importVehicle(filesFor());
    t.showStep('review');
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
    assert(d.querySelector('#status').textContent.includes('ZIP mit'),d.querySelector('#status').textContent);
  });
  await test('Desktop and 390px layout do not overflow', async () => {
    for (const width of [1440,390]) { frame.style.width=`${width}px`; await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))); assert(d.documentElement.scrollWidth<=width,`overflow at ${width}: ${d.documentElement.scrollWidth}`); }
  });
  await test('Side text and image sizes round trip with independent bilingual editors', async () => {
    await t.importVehicle(filesFor());
    click('[data-add-block="image-text"]');
    const block = t.state.blocks.at(-1);
    click(`[data-gallery-block="${block.id}"][value="__card__"]`);
    const article = d.querySelector(`[data-block-id="${block.id}"]`);
    for (const [language, value] of [['de','<p>Text links</p>'],['en','<p>Text on the left</p>']]) {
      const editor = article.querySelector(`[data-editor][data-language="${language}"]`);
      editor.innerHTML=value;editor.dispatchEvent(new w.Event('input',{bubbles:true}));
    }
    const size=article.querySelector('[data-image-size]');size.value='medium';size.dispatchEvent(new w.Event('change',{bubbles:true}));
    const side=article.querySelector('[data-text-side]');side.value='right';side.dispatchEvent(new w.Event('change',{bubbles:true}));
    const value=t.createRecord();t.validateRecord(value);
    eq(value.blocks.at(-1).images[0].size,'medium','size');eq(value.blocks.at(-1).textSide,'right','side');
    const files=[new w.File([JSON.stringify(value)],'vehicle.json',{type:'application/json'}),...filesFor().slice(1)];
    await t.importVehicle(files);eq(t.createRecord(),value,'side round trip');
    click('#open-page-preview');
    assert(d.querySelector('#page-preview-frame').srcdoc.includes('side-right'),'side preview');click('#close-page-preview');
    t.showStep('content');
    for (const width of [1440,390]) {frame.style.width=`${width}px`;await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));assert(d.documentElement.scrollWidth<=width,'new controls overflow at '+width);}
  });
  await test('Fixed text colors survive sanitation without allowing arbitrary CSS', async () => {
    for (const value of ['#e04444', '#ff9aa2', '#c94f59']) {
      assert(t.sanitizeHtml(`<p><font color="${value}">Rot</font></p>`).includes('om-color-red'), 'current or historical red lost: '+value);
    }
    const clean=t.sanitizeHtml('<p><font color="#ff9aa2">Rot</font> <span class="om-color-cyan">Cyan</span><span style="background:url(https://bad)">Safe</span></p>');
    assert(clean.includes('om-color-red') && clean.includes('om-color-cyan'),'palette lost');assert(!clean.includes('style='),'unsafe CSS retained');
    const response=await fetch('/html',{method:'POST',body:JSON.stringify([clean])});assert(response.ok,await response.text());
    t.showStep('content');
    const editor=d.querySelector('[data-editor][data-language="en"]');
    editor.innerHTML='<p>Color selection</p>';editor.dispatchEvent(new w.Event('input',{bubbles:true}));
    editor.focus();const range=d.createRange();range.selectNodeContents(editor);w.getSelection().removeAllRanges();w.getSelection().addRange(range);d.dispatchEvent(new w.Event('selectionchange'));
    const color=editor.closest('.language-editor').querySelector('[data-text-color]');color.dispatchEvent(new w.MouseEvent('mousedown',{bubbles:true}));color.focus();color.value='#e04444';color.dispatchEvent(new w.Event('change',{bubbles:true}));
    assert(t.sanitizeHtml(editor.innerHTML).includes('om-color-red'),'color dropdown lost selected text');
    assert(w.getSelection().toString().length>0,'color command lost selection');
    editor.closest('.language-editor').querySelector('[data-command="bold"]').click();
    assert(editor.innerHTML.includes('<b>') || editor.innerHTML.includes('<strong>'),'following formatting lost selection: '+editor.innerHTML);
    t.validateRecord(t.createRecord());
  });
  await test('Watermarks change exported bytes once and preserve image dimensions', async () => {
    await t.importVehicle(filesFor());
    const before=t.state.cardFile, beforeSize=await w.createImageBitmap(before);
    click('#watermark-all');
    for(let n=0;t.state.busy && n<200;n++)await new Promise(resolve=>setTimeout(resolve,25));
    assert(!t.state.busy,'watermark timed out');
    assert(t.state.cardFile===before,'checkbox changed original card');
    const snapshot=await t.prepareOutputSnapshot(t.editorSnapshot());
    assert(snapshot.images[0].file!==before && snapshot.images.every(image=>image.file.type==='image/webp'),'output not marked');
    const after=await w.createImageBitmap(snapshot.images[0].file);eq([after.width,after.height],[beforeSize.width,beforeSize.height],'dimensions');after.close();beforeSize.close();
    assert(d.querySelector('#watermark-all').checked,'watermark checkbox must reflect exported bytes');
    assert(snapshot.images.every(image=>image.name.endsWith('.webp')),'filename/MIME mismatch');
    t.validateRecord(snapshot.record);
    const prefix=`${snapshot.record.category}/${snapshot.record.slug}`;
    const zip=await t.makeZip([{name:`${prefix}.astro`,data:t.createAstro(snapshot.record.category,snapshot.record.slug)},{name:`${prefix}/vehicle.json`,data:snapshot.recordText},...snapshot.images.map(image=>({name:`${prefix}/${image.name}`,data:image.file}))]);
    await fetch('/zip',{method:'POST',body:zip});
  });

  const settle = () => new Promise(resolve => w.requestAnimationFrame(() => w.requestAnimationFrame(resolve)));
  const finishWatermark = async () => { for(let n=0;t.state.busy && n<400;n++)await new Promise(resolve=>setTimeout(resolve,10));assert(!t.state.busy,'watermark timed out'); };
  const selectEditor = (editor, start, end=start) => {
    editor.focus();const range=d.createRange();
    if(start===undefined){range.selectNodeContents(editor);range.collapse(false);}
    else {const walker=d.createTreeWalker(editor,w.NodeFilter.SHOW_TEXT);const nodes=[];let node;while(node=walker.nextNode())nodes.push(node);
      const point=offset=>{for(const node of nodes){if(offset<=node.length)return[node,offset];offset-=node.length;}return[editor,editor.childNodes.length];};
      range.setStart(...point(start));range.setEnd(...point(end));}
    w.getSelection().removeAllRanges();w.getSelection().addRange(range);d.dispatchEvent(new w.Event('selectionchange'));
  };
  const newTextEditor = language => {click('[data-add-block="copy"]');const block=t.state.blocks.at(-1);return d.querySelector(`[data-editor="${block.id}"][data-language="${language}"]`);};
  const command = (editor, name, value) => editor.closest('.language-editor').querySelector(`[data-command="${name}"]${value ? `[data-value="${value}"]` : ''}`).click();
  const color = (editor, value) => {const input=editor.closest('.language-editor').querySelector('[data-text-color]');input.dispatchEvent(new w.MouseEvent('mousedown',{bubbles:true}));input.focus();input.value=value;input.dispatchEvent(new w.Event('change',{bubbles:true}));};
  const type = (editor, text) => {assert(d.activeElement===editor,'formatting must return focus to its editor');d.execCommand('insertText',false,text);};
  const htmlFor = editor => t.state.blocks.find(block=>block.id===editor.dataset.editor)[editor.dataset.language==='en'?'htmlEn':'html'];
  await test('Color dropdown starts with Standard and all seven colors survive independent HTML validation', async () => {
    await t.importVehicle(filesFor());t.showStep('content');
    const dropdown=d.querySelector('[data-text-color]');eq(dropdown.options[0].textContent,'Standard','first color');eq(dropdown.options.length,7,'palette count');
    const html=['black','red','green','blue','cyan','yellow','magenta'].map(color=>t.sanitizeHtml(`<p><span class="om-color-${color}">${color}</span></p>`));
    const response=await fetch('/html',{method:'POST',body:JSON.stringify(html)});assert(response.ok,await response.text());
  });
  await test('Empty bilingual editors accept heading, bold, italic and color before the first typed character', async () => {
    for(const language of ['de','en']) {
      const editor=newTextEditor(language);
      command(editor,'formatBlock','h2');command(editor,'bold');command(editor,'italic');color(editor,'#e04444');type(editor,'Start');await settle();
      eq(editor.textContent,'Start','typed text');const html=htmlFor(editor);
      assert(html.includes('<h2>') && html.includes('<strong>') && html.includes('<em>') && html.includes('om-color-red'),'combined empty-editor formatting: '+html+' live: '+editor.innerHTML);
      eq(w.getSelection().anchorOffset,5,'caret at end');
    }
  });
  await test('Formatting in the middle preserves the caret and can be toggled off before more typing', async () => {
    const editor=newTextEditor('de');selectEditor(editor);type(editor,'Alpha Omega');
    selectEditor(editor,6);command(editor,'bold');command(editor,'italic');color(editor,'#4f8fe8');type(editor,'Mitte ');await settle();
    eq(editor.textContent,'Alpha Mitte Omega','middle insertion');
    const html=htmlFor(editor);assert(html.includes('<strong>') && html.includes('<em>') && html.includes('om-color-blue'),'middle styles: '+html+' live: '+editor.innerHTML);
    command(editor,'bold');command(editor,'italic');color(editor,'#ffffff');type(editor,'Normal ');await settle();
    eq(editor.textContent.replace(/\u00a0/g,' '),'Alpha Mitte Normal Omega','styles toggled off');assert(!htmlFor(editor).includes('om-color-blue') || htmlFor(editor).includes('Normal'), 'Standard typing lost');
  });
  await test('Selected text retains combined formatting and selection across dropdowns and language switches', async () => {
    const de=newTextEditor('de');const block=t.state.blocks.at(-1);const en=d.querySelector(`[data-editor="${block.id}"][data-language="en"]`);
    selectEditor(de);type(de,'Deutsch');selectEditor(en);type(en,'English');
    selectEditor(de,0,7);command(de,'bold');command(de,'italic');color(de,'#d957bd');eq(w.getSelection().toString(),'Deutsch','selection preserved');
    selectEditor(en,0,7);color(en,'#22bfd0');command(en,'formatBlock','h2');
    assert(htmlFor(de).includes('om-color-magenta') && htmlFor(de).includes('<strong>') && htmlFor(de).includes('<em>'),'German combination: '+htmlFor(de));
    assert(htmlFor(en).includes('om-color-cyan') && htmlFor(en).includes('<h2>'),'English combination: '+htmlFor(en));
    selectEditor(de,7);type(de,' weiter');eq(de.textContent,'Deutsch weiter','return to German');eq(en.textContent,'English','English unchanged');
  });
  await test('Paragraphs and lists remain editable after multiple format changes', async () => {
    const editor=newTextEditor('en');command(editor,'formatBlock','h2');type(editor,'Title');command(editor,'formatBlock','p');command(editor,'insertUnorderedList');type(editor,' item');
    eq(editor.textContent,'Title item','list typing');assert(htmlFor(editor).includes('<ul>'),'list persisted');
    command(editor,'insertUnorderedList');command(editor,'formatBlock','p');command(editor,'removeFormat');type(editor,' plain');eq(editor.textContent,'Title item plain','paragraph typing');
  });
  await test('Undo and redo preserve formatted typing instead of resetting the editor DOM', async () => {
    const editor=newTextEditor('de');selectEditor(editor);type(editor,'Vorher');selectEditor(editor,6);color(editor,'#e04444');command(editor,'bold');type(editor,' Nachher');
    d.execCommand('undo');await settle();eq(editor.textContent,'Vorher','undo typing');
    d.execCommand('redo');await settle();eq(editor.textContent,'Vorher Nachher','redo typing');assert(t.sanitizeHtml(editor.innerHTML).includes('om-color-red'),'redo color');
  });
  await test('Changing format order before typing keeps the complete combination in either language', async () => {
    const orders = [['color','bold','italic','heading'],['italic','heading','color','bold'],['bold','color','heading','italic']];
    for(const language of ['de','en']) for(const order of orders) {
      const editor=newTextEditor(language);
      for(const action of order) {
        if(action==='color')color(editor,'#36b96b');
        else if(action==='heading')command(editor,'formatBlock','h2');
        else command(editor,action);
      }
      type(editor,'Kombination');await settle();const html=htmlFor(editor);
      assert(html.includes('<h2>') && html.includes('<strong>') && html.includes('<em>') && html.includes('om-color-green'),'order '+order+': '+html+' live: '+editor.innerHTML);
    }
  });
  await test('Repeated color changes and clearing formatting retain text and native undo', async () => {
    const editor=newTextEditor('en');selectEditor(editor);type(editor,'A choice');selectEditor(editor,2,8);command(editor,'bold');command(editor,'italic');
    for(const value of ['#e04444','#e9c52f','#ffffff','#22bfd0']) {color(editor,value);eq(w.getSelection().toString(),'choice','color selection');}
    assert(htmlFor(editor).includes('om-color-cyan') && htmlFor(editor).includes('<strong>') && htmlFor(editor).includes('<em>'),'combined selected styles');
    command(editor,'removeFormat');eq(w.getSelection().toString(),'choice','clear selection');assert(!htmlFor(editor).includes('om-color-') && !htmlFor(editor).includes('<strong>') && !htmlFor(editor).includes('<em>'),'clear format serialization: '+htmlFor(editor));
    d.execCommand('undo');await settle();assert(t.sanitizeHtml(editor.innerHTML).includes('om-color-cyan'),'undo restores color');
  });
  await test('Imported palette spans can be reset with the normal formatting control', async () => {
    await t.importVehicle(filesFor({...record,blocks:[{type:'copy',html:'<p><span class="om-color-red"><strong>Importiert</strong></span></p>',htmlEn:'<p>Imported</p>'}]}));t.showStep('content');
    const editor=d.querySelector('[data-editor][data-language="de"]');selectEditor(editor,0,10);command(editor,'removeFormat');
    assert(!htmlFor(editor).includes('om-color-') && !htmlFor(editor).includes('<strong>'),'imported reset: '+htmlFor(editor));
    eq(editor.textContent,'Importiert','reset retained imported text');
  });
  await test('Clear formatting also resets pending styles before any text is typed', async () => {
    const editor=newTextEditor('en');command(editor,'bold');command(editor,'italic');color(editor,'#d957bd');command(editor,'removeFormat');type(editor,'Plain');
    assert(!htmlFor(editor).includes('<strong>') && !htmlFor(editor).includes('<em>') && !htmlFor(editor).includes('om-color-magenta'),'pending clear: '+htmlFor(editor));
    eq(editor.textContent,'Plain','plain typing');
  });
  await test('Block controls stay pinned at the top during long desktop and mobile stories', async () => {
    for(const width of [1440,390]) {
      frame.style.width=`${width}px`;await settle();
      const controls=d.querySelector('.block-controls');w.scrollTo(0,controls.getBoundingClientRect().top+w.scrollY+300);await settle();
      const bounds=controls.getBoundingClientRect();assert(bounds.top>=-1 && bounds.top<=1,'sticky top at '+width+': '+bounds.top);assert(bounds.bottom<frame.clientHeight,'sticky controls cover viewport');assert(d.documentElement.scrollWidth<=width,'sticky overflow');
    }
    eq(d.querySelector('[data-add-block="image-text"]').textContent.trim(),'+ Text neben Bild','matching plus label');w.scrollTo(0,0);
  });
  await test('Watermark preference never processes imported, added or replaced draft images', async () => {
    await t.importVehicle(filesFor());const original=t.state.cardFile,images=t.state.images.map(image=>image.file),names=t.state.images.map(image=>image.outputName),native=w.VehicleWatermark;let calls=0;
    w.VehicleWatermark=async file=>{calls++;return native(file);};
    try {
      click('#watermark-all');assert(t.state.watermarkEnabled && !t.state.busy,'checkbox must respond synchronously');
      await t.addGalleryFiles([image('added.jpg')]);const added=t.state.images.at(-1);Object.assign(added,{alt:'Zusatzbild',altEn:'Additional image',altTouched:true,altEnTouched:true});t.renderImages();assert(added.file.type==='image/jpeg','adding an image processed it');
      await t.setCardFile(image('replacement.jpg'));assert(t.state.cardFile.type==='image/jpeg','replacing the card processed it');
      const draft=t.editorSnapshot();assert(calls===0,'checkbox/import/snapshot generated watermarks');
      const output=await t.prepareOutputSnapshot(draft);assert(calls===4 && output.images.every(image=>image.file.type==='image/webp'),'final preparation must process all images');
      const again=await t.prepareOutputSnapshot(t.editorSnapshot());assert(calls===4 && again.images[0].file===output.images[0].file,'repeat output did not reuse prepared originals');
      click('#watermark-all');assert(!t.state.watermarkEnabled && !t.state.busy,'unchecking was not immediate');
      const unmarked=await t.prepareOutputSnapshot(t.editorSnapshot());assert(unmarked.images[0].file===t.state.cardFile && unmarked.images[0].name.endsWith('.jpg'),'disabled output changed originals');
      assert(t.state.images.slice(0,2).every((item,index)=>item.file===images[index]),'processing mutated gallery bytes');eq(t.state.images.slice(0,2).map(image=>image.outputName),names,'processing renamed draft');assert(added.file.type==='image/jpeg','processed draft addition');
      await t.importVehicle(filesFor());const before=t.state.cardFile;click('#watermark-all');click('#watermark-all');assert(t.state.cardFile===before && calls===4,'preference toggle did work');
    } finally {w.VehicleWatermark=native;}
  });
  await test('Watermark failures at output preserve the preference and all draft images', async () => {
    await t.importVehicle(filesFor());const before=t.state.cardFile,originals=t.state.images.map(image=>image.file),native=w.VehicleWatermark;let calls=0;
    w.VehicleWatermark=async file=>{if(++calls===2)throw new Error('Testfehler');return native(file);};
    try {
      click('#watermark-all');assert(calls===0 && !t.state.busy,'checkbox must not start conversion');
      let failed=false;try{await t.prepareOutputSnapshot(t.editorSnapshot());}catch(error){failed=error.message==='Testfehler';}assert(failed,'conversion failure ignored');
      assert(d.querySelector('#watermark-all').checked && t.state.watermarkEnabled,'output failure lost preference');assert(t.state.cardFile===before && t.state.images.every((image,index)=>image.file===originals[index]),'failed output changed draft');
    } finally {w.VehicleWatermark=native;}
    t.resetEditor();click('#watermark-all');assert(d.querySelector('#watermark-all').checked && !t.state.busy,'empty draft preference');await t.setCardFile(image('fresh.jpg'));assert(t.state.cardFile.type==='image/jpeg','first card was processed before output');t.resetEditor();assert(!d.querySelector('#watermark-all').checked,'new draft retained preference');
  });
  await test('Missing watermark helper is reported only at output and never changes imported images', async () => {
    await t.importVehicle(filesFor());const before=t.state.cardFile,images=t.state.images.map(image=>image.file),native=w.VehicleWatermark;
    w.VehicleWatermark=undefined;
    try {
      t.showStep('images');click('#watermark-all');assert(d.querySelector('#watermark-all').checked && !t.state.busy,'missing helper blocked preference');
      await t.generate();assert(d.querySelector('#workspace-status').textContent.includes('watermark.js'),'output needs an actionable German error');
      assert(t.state.cardFile===before && t.state.images.every((image,index)=>image.file===images[index]),'missing helper changed draft');
    } finally {w.VehicleWatermark=native;}
  });
  await test('Structural moves restore stable focus; block undo preserves bilingual content and later edits', async () => {
    await t.importVehicle(filesFor());t.showStep('content');
    const blocks=t.state.blocks, first=blocks[0], second=blocks[1];
    click(`[data-block-move="down"][data-id="${first.id}"]`);
    assert(d.activeElement.dataset.id===first.id || d.activeElement.closest('[data-block-id]')?.dataset.blockId===first.id,'moved focus lost');
    click(`[data-block-remove="${first.id}"]`);
    assert(d.activeElement!==d.body,'removed focus lost');assert(!d.querySelector('#block-undo').hidden,'undo hidden');
    second.html='<p>Spätere Änderung</p>'; second.htmlEn='<p>Later edit</p>';
    click('#restore-block');eq(t.state.blocks.find(b=>b.id===first.id),first,'full block restored');eq(second.htmlEn,'<p>Later edit</p>','other edit overwritten');
    assert(d.activeElement.closest('[data-block-id]')?.dataset.blockId===first.id,'restored focus');
    for(let i=0;i<22;i++){click('[data-add-block="copy"]');click(`[data-block-remove="${t.state.blocks.at(-1).id}"]`);}
    assert(d.querySelector('#undo-count').textContent.includes('20'),'history limit');t.resetEditor();assert(d.querySelector('#block-undo').hidden,'reset history');
  });
  await test('Undo omits intentionally removed images and retains gallery occurrence metadata', async () => {
    await t.importVehicle(filesFor());t.showStep('content');const gallery=t.state.blocks.find(b=>b.type==='gallery');const original=structuredClone(gallery);
    click(`[data-block-remove="${gallery.id}"]`);const imageId=t.state.images[0].id;click(`[data-image-remove="${imageId}"]`);click('#restore-block');
    const restored=t.state.blocks.find(b=>b.id===gallery.id);assert(!restored.imageIds.includes(imageId),'removed image restored');
    eq(restored.imageMeta,original.imageMeta.filter((_,i)=>original.imageIds[i]!==imageId),'surviving metadata');assert(d.querySelector('#workspace-status').textContent.includes('entfernt'),'omission not explained');
  });
  await test('Independent description counters, card details and nonblocking image quality respond to usage', async () => {
    await t.importVehicle(filesFor());t.fields.description.value='Deutsch';t.fields.descriptionEn.value='English text';t.updateSummary();
    eq(d.querySelector('#description-count').textContent,'7','German count');eq(d.querySelector('#description-count-en').textContent,'12','English count');
    assert(d.querySelector('[data-file-summary="card-file"]').textContent.includes('px'),'card dimensions');assert(d.querySelector('#card-drop .file-control label').textContent==='Kartenbild ersetzen','replacement label');
    assert(t.validate().warnings.length>0,'small source warning missing');assert(t.validate().errors.length===0,'quality blocked export');
    const before=t.state.cardFile;await t.setCardFile(null);assert(t.state.cardFile===before,'cancel replaced card');
    assert(t.sanitizeHtml('<p><font color="#c94f59">Legacy</font></p>').includes('om-color-red'),'old palette not normalized');
  });
  await test('Handle-only dragging preserves order, occurrence metadata and focus alongside move buttons', async () => {
    await t.importVehicle(filesFor());t.showStep('content');
    const transfer=new w.DataTransfer(),first=t.state.blocks[0],last=t.state.blocks.at(-1);
    const denied=new w.DragEvent('dragstart',{bubbles:true,cancelable:true,dataTransfer:transfer});d.querySelector(`[data-block-id="${first.id}"] .editor`).dispatchEvent(denied);assert(denied.defaultPrevented,'editing surface started drag');
    d.querySelector(`[data-block-id="${first.id}"] .drag-handle`).dispatchEvent(new w.DragEvent('dragstart',{bubbles:true,cancelable:true,dataTransfer:transfer}));
    d.querySelector(`[data-block-id="${last.id}"]`).dispatchEvent(new w.DragEvent('drop',{bubbles:true,cancelable:true,dataTransfer:transfer}));eq(t.state.blocks.at(-1).id,first.id,'block drag order');assert(d.activeElement.closest('[data-block-id]')?.dataset.blockId===first.id,'block drag focus');
    const image=t.state.images[0],target=t.state.images[1],metadata=structuredClone(t.createRecord().blocks.filter(b=>b.type==='gallery'));
    d.querySelector(`[data-image-id="${image.id}"] .drag-handle`).dispatchEvent(new w.DragEvent('dragstart',{bubbles:true,cancelable:true,dataTransfer:new w.DataTransfer()}));
    d.querySelector(`[data-image-id="${target.id}"]`).dispatchEvent(new w.DragEvent('drop',{bubbles:true,cancelable:true,dataTransfer:new w.DataTransfer()}));eq(t.state.images[1].id,image.id,'image drag order');eq(t.createRecord().blocks.filter(b=>b.type==='gallery'),metadata,'drag changed occurrences');
  });
  await test('Structural rerenders preserve live rich-text nodes, selection and native typing undo', async () => {
    await t.importVehicle(filesFor());t.showStep('content');const editor=newTextEditor('en');selectEditor(editor);type(editor,'Persistent typing');await settle();const id=editor.dataset.editor;assert(d.queryCommandEnabled('undo'),'undo missing before move');
    click(`[data-block-move="up"][data-id="${id}"]`);assert(d.querySelector(`[data-editor="${id}"][data-language="en"]`)===editor,'editor node replaced');
    selectEditor(editor);const undone=d.execCommand('undo');await settle();assert(!editor.textContent.includes('Persistent typing'),'native typing undo lost: '+undone+' moveBefore='+typeof d.querySelector('#block-list').moveBefore+' '+editor.innerHTML);
  });
  await test('Complete release fixture exports ordinary/contact, adjacent galleries and every side-text size', async () => {
    const fixture={...record,slug:'audit-fixes-car',order:1987654321000,title:'Audit-Fahrzeug',titleEn:'Audit vehicle',sourceUrl:'https://www.oldtimermanufaktur.de/projekte/aktuelle-projekte/audit-fixes-car/',blocks:[
      {type:'copy',html:'<p><span class="om-color-red">Deutsche Geschichte</span></p>',htmlEn:'<p><span class="om-color-red">English story</span></p>'},
      {type:'contact',html:'<p>Kontakt zur Werkstatt</p>',htmlEn:'<p>Contact the workshop</p>'},
      ...[0,1].map(i=>({type:'gallery',images:[{src:'./card.jpg',alt:'Karosserie',altEn:'Bodywork',caption:'Bild '+i,captionEn:'Photo '+i}]})),
      ...['left','right'].flatMap(textSide=>['small','medium','large'].map(size=>({type:'gallery',textSide,html:`<p>Text ${textSide} ${size}</p>`,htmlEn:`<p>Story ${textSide} ${size}</p>`,images:[{src:'./card.jpg',alt:'Karosserie',altEn:'Bodywork',caption:'Detail',captionEn:'Detail',size}]})))
    ]};
    await t.importVehicle(filesFor(fixture));const snapshot=t.editorSnapshot(),folder=`${snapshot.record.category}/${snapshot.record.slug}`;
    const zip=await t.makeZip([{name:folder+'.astro',data:t.createAstro(snapshot.record.category,snapshot.record.slug)},{name:folder+'/vehicle.json',data:snapshot.recordText},...snapshot.images.map(image=>({name:folder+'/'+image.name,data:image.file}))]);
    await fetch('/zip',{method:'POST',body:zip});frame.style.width='1440px';t.showStep('review');
  });
  const response = await fetch('/result',{method:'POST',body:JSON.stringify(results,null,2)});
  document.getElementById('results').textContent=JSON.stringify({passed:results.filter(x=>x.pass).length,total:results.length,saved:response.ok,results},null,2);
});
