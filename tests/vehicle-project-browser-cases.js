const frame = document.getElementById('editor');
frame.addEventListener('load', async () => {
  const w = frame.contentWindow, d = frame.contentDocument, t = w.vehicleTest;
  const results = [], assert = (condition, message) => { if (!condition) throw new Error(message); };
  const wait = async predicate => { const start = Date.now(); while (!predicate()) { if (Date.now() - start > 15000) throw new Error('Timed out: ' + d.querySelector('#selection-feedback').textContent + d.querySelector('#save-review').textContent); await new Promise(resolve => setTimeout(resolve, 20)); } };
  const test = async (name, run) => { try { await run(); results.push({ name, pass:true }); } catch(error) { results.push({name,pass:false,error:error.message}); } document.getElementById('results').textContent = JSON.stringify(results,null,2); };
  const click = selector => d.querySelector(selector).click();
  const input = (selector,value) => { const field=d.querySelector(selector); field.value=value; field.dispatchEvent(new w.Event('input',{bubbles:true})); };
  w.confirm = () => true;
  await test('Full workflow starts at project selection with all six steps', async () => {
    assert(d.querySelectorAll('[data-step-target]').length===6,'six steps missing');
    assert(!d.querySelector('[data-step="project"]').hidden,'project step hidden');
    assert(d.querySelector('[data-step-target="vehicle"]').disabled,'editor opened without project');
    assert(!d.querySelector('.app-header'),'top bar remains');
    click('#choose-project'); await wait(()=>!d.querySelector('[data-step="selection"]').hidden);
    assert(d.querySelectorAll('.vehicle-row').length===1,'fixture vehicle not listed');
    assert(d.querySelector('.vehicle-row time').textContent==='17.09.2026','wrong modification date');
  });
  await test('Category filter and new vehicle reset retain the project', async () => {
    const filter=d.querySelector('#category-filter');filter.value='fahrzeugangebote';filter.dispatchEvent(new w.Event('change'));
    assert(d.querySelectorAll('.vehicle-row').length===0,'category filter failed');
    click('#start-new');
    assert(!d.querySelector('[data-step="vehicle"]').hidden,'new editor not shown');
    assert(t.fields.category.value==='fahrzeugangebote','category default');
    assert(!t.state.cardFile && t.fields.title.value==='','old state retained');
    assert(d.querySelector('#prepare-save').disabled,'incomplete save enabled');
    click('[data-step-target="selection"]');filter.value='';filter.dispatchEvent(new w.Event('change'));
  });
  await test('Existing vehicle loads and preserves imported data and images', async () => {
    click('.vehicle-row'); await wait(()=>!d.querySelector('[data-step="vehicle"]').hidden && !t.state.busy);
    assert(t.fields.title.value==='Testwagen','vehicle title');
    assert(t.fields.dateModified.value==='2026-09-17','imported date');
    assert(t.fields.slug.readOnly,'imported slug is editable');
    assert(t.state.cardFile,'image missing');
  });
  await test('Cancelling folder selection and denied access preserve current work', async () => {
    const picker=w.showDirectoryPicker;
    input('#title','Ungespeicherter Entwurf');
    click('[data-step-target="project"]');
    w.showDirectoryPicker=async()=>{throw new w.DOMException('Cancelled','AbortError');};
    click('#choose-project');await new Promise(resolve=>setTimeout(resolve,30));
    assert(t.fields.title.value==='Ungespeicherter Entwurf','cancel lost draft');
    w.showDirectoryPicker=async()=>{throw new w.DOMException('Denied','NotAllowedError');};
    click('#choose-project');await wait(()=>d.querySelector('#project-feedback').classList.contains('feedback-error'));
    assert(t.fields.title.value==='Ungespeicherter Entwurf','denied permission lost draft');
    w.showDirectoryPicker=picker;click('[data-step-target="vehicle"]');
  });
  await test('Unsaved edits cannot be discarded without confirmation', async () => {
    click('[data-step-target="selection"]');w.confirm=()=>false;click('#start-new');
    assert(t.fields.title.value==='Ungespeicherter Entwurf','declined discard lost draft');
    w.confirm=()=>true;click('[data-step-target="vehicle"]');
  });
  await test('Image import restores navigation and keyboard-accessible controls', async () => {
    await t.setCardFile(t.state.cardFile);
    assert(!d.querySelector('[data-step-target="images"]').disabled,'navigation remained disabled after import');
    assert(!d.querySelector('#step-next').disabled,'next remained disabled after import');
  });
  const exportFeedback = () => ['#status','#workspace-status','#save-review'].map(selector=>d.querySelector(selector).textContent).join(' ');
  const ready = () => !t.state.busy && d.querySelector('#save-review').dataset.reviewState === 'ready';
  const reviewed = async () => { click('[data-step-target="review"]');click('#prepare-save');await wait(ready); };
  const captureZip = async () => {
    const create=w.URL.createObjectURL, originalClick=w.HTMLAnchorElement.prototype.click;
    let blob=null;
    w.URL.createObjectURL=value=>{if(value.type==='application/zip')blob=value;return create.call(w.URL,value);};
    w.HTMLAnchorElement.prototype.click=function(){if(!this.download)originalClick.call(this);};
    try {await t.generate();return blob;} finally {w.URL.createObjectURL=create;w.HTMLAnchorElement.prototype.click=originalClick;}
  };
  const zipEntries = async blob => {
    assert(blob, 'no ZIP produced');
    const bytes=new Uint8Array(await blob.arrayBuffer()), view=new DataView(bytes.buffer), entries=new Map();
    let offset=0;
    while(view.getUint32(offset,true)===0x04034b50){
      assert(view.getUint16(offset+8,true)===0,'unexpected ZIP compression');
      const size=view.getUint32(offset+18,true),nameLength=view.getUint16(offset+26,true),extra=view.getUint16(offset+28,true);
      const name=new TextDecoder().decode(bytes.slice(offset+30,offset+30+nameLength));
      offset+=30+nameLength+extra;entries.set(name,bytes.slice(offset,offset+size));offset+=size;
    }
    return entries;
  };
  await test('Review and ZIP export are read-only; edits invalidate the previous review', async () => {
    const root=await w.fixtureRoot,A=w.VehicleProjectAccess,before=await A.snapshot(root);
    assert(!d.querySelector('#save-project'),'direct save button returned');
    input('#title','Geänderter Testwagen');await reviewed();
    assert(d.querySelector('#save-review').textContent.includes('src/pages/projekte/aktuelle-projekte/test-car/vehicle.json'),'review paths missing');
    input('#title-en','Updated test car');
    assert(d.querySelector('#save-review').dataset.reviewState==='stale','stale review retained');
    const entries=await zipEntries(await captureZip());
    const record=JSON.parse(new TextDecoder().decode(entries.get('aktuelle-projekte/test-car/vehicle.json')));
    assert(record.title==='Geänderter Testwagen'&&record.titleEn==='Updated test car','ZIP did not contain latest draft');
    assert(entries.has('aktuelle-projekte/test-car.astro')&&entries.has('aktuelle-projekte/test-car/card.jpg'),'page/folder pair incomplete');
    assert(A.same(before,await A.snapshot(root)),'export changed website source files');
    assert(!await A.hasDirectory(root,w.VehicleProjectSave.lock),'export created a project lock');
  });
  await test('Watermark preference invalidates review and exports checked copies without writing source', async () => {
    const root=await w.fixtureRoot,A=w.VehicleProjectAccess,before=await A.snapshot(root),original=t.state.cardFile;
    await reviewed();click('[data-step-target="images"]');click('#watermark-all');await wait(()=>!t.state.busy);
    assert(t.state.watermarkEnabled && d.querySelector('#watermark-all').checked,'checkbox not active');
    assert(d.querySelector('#save-review').dataset.reviewState==='stale','watermark retained old review');
    let entries=await zipEntries(await captureZip());assert(entries.has('aktuelle-projekte/test-car/card.webp'),'marked filename missing');assert(!entries.has('aktuelle-projekte/test-car/card.jpg'),'unmarked copy exported');
    click('[data-step-target="images"]');click('#watermark-all');await wait(()=>!t.state.busy);
    assert(!t.state.watermarkEnabled && t.state.cardFile===original,'original draft not restored');assert(d.querySelector('#save-review').dataset.reviewState==='stale','restoration retained review');
    entries=await zipEntries(await captureZip());assert(entries.has('aktuelle-projekte/test-car/card.jpg'),'restored filename missing');
    assert(A.same(before,await A.snapshot(root)),'watermark review/export wrote project files');
  });
  await test('Category changes export only the new pair and explain separate redirect handling', async () => {
    const root=await w.fixtureRoot,A=w.VehicleProjectAccess;
    click('[data-step-target="vehicle"]');input('#category','vergangene-projekte');
    const entries=await zipEntries(await captureZip());
    assert(entries.has('vergangene-projekte/test-car.astro'),'new route missing');
    assert(!entries.has('src/config/vehicle-redirects.json'),'ZIP unexpectedly includes project configuration');
    assert(d.querySelector('#save-review').textContent.includes('ursprüngliche Fahrzeug'),'move selection instructions missing');
    assert(d.querySelector('#transfer-command').textContent === 'npm run vehicles:transfer','transfer command needs technical options');
    assert(await A.hasDirectory(root,'src/pages/projekte/aktuelle-projekte/test-car'),'export removed original');
    assert(!await A.hasDirectory(root,'src/pages/projekte/vergangene-projekte/test-car'),'export wrote destination');
    input('#category','aktuelle-projekte');
  });
  await test('Project changes during export validation reject the download and preserve the draft', async () => {
    const A=w.VehicleProjectAccess,original=A.snapshot;let release,entered;
    const started=new Promise(resolve=>entered=resolve);
    A.snapshot=async(...args)=>{entered();await new Promise(resolve=>release=resolve);return original(...args);};
    try {
      const pending=captureZip();await started;A.snapshot=original;
      assert(t.state.busy,'export did not lock controls');
      input('#title-en','Changed during export validation');release();
      assert(await pending===null,'stale ZIP downloaded');
      assert(exportFeedback().includes('während der Prüfung geändert'),'stale draft error missing');
      assert(t.fields.titleEn.value==='Changed during export validation','draft lost');
    } finally {A.snapshot=original;release?.();}
  });
  await test('Gallery occurrence moves and removal invalidate read-only reviews', async () => {
    t.state.blocks.push({id:'occurrence-test',type:'gallery',imageIds:['__card__','__card__'],imageMeta:[{alt:'Erste',altEn:'First'},{alt:'Zweite',altEn:'Second'}]});t.renderBlocks();t.updateSummary();
    await reviewed();click('[data-entry-move="1"]');
    assert(d.querySelector('#save-review').dataset.reviewState==='stale','move retained review');
    await reviewed();click('[data-entry-remove="0"]');
    assert(d.querySelector('#save-review').dataset.reviewState==='stale','remove retained review');
  });
  await test('A new car exports a complete pair and rejects destination and order collisions', async () => {
    const image=t.state.cardFile,root=await w.fixtureRoot,A=w.VehicleProjectAccess,before=await A.snapshot(root);
    click('[data-step-target="selection"]');click('#start-new');
    input('#category','aktuelle-projekte');input('#title','Brand new car');input('#title-en','Brand new car');input('#description','Seitenansicht');input('#description-en','Side view');
    input('#card-alt','Fahrzeug von vorn');input('#card-alt-en','Front view of the car');input('#lead-alt','Fahrzeug von vorn');input('#lead-alt-en','Front view of the car');
    await t.setCardFile(image);
    input('#slug','test-car');
    assert(await captureZip()===null,'existing route exported as a new car');
    assert(exportFeedback().includes('existiert bereits'),'destination conflict not explained');
    input('#slug','brand-new-car');t.fields.autoOrder.checked=false;t.fields.autoOrder.dispatchEvent(new w.Event('change',{bubbles:true}));input('#order','123');
    assert(await captureZip()===null,'duplicate order exported');
    assert(exportFeedback().includes('bereits vergeben'),'order conflict not explained');
    input('#order','124');
    const entries=await zipEntries(await captureZip());
    const record=JSON.parse(new TextDecoder().decode(entries.get('aktuelle-projekte/brand-new-car/vehicle.json')));
    t.validateRecord(record);
    assert(record.slug==='brand-new-car'&&record.order===124,'new vehicle metadata incorrect');
    assert(entries.has('aktuelle-projekte/brand-new-car.astro')&&entries.has('aktuelle-projekte/brand-new-car/card.jpg'),'new pair incomplete');
    assert(A.same(before,await A.snapshot(root)),'new export wrote project files');
  });
  let recoveryCandidate;
  await test('A candidate with interrupted recovery preserves the current project and draft', async () => {
    const root=await w.fixtureRoot, storage=await w.navigator.storage.getDirectory();
    const candidate=await storage.getDirectoryHandle('pending-'+w.crypto.randomUUID(),{create:true});
    recoveryCandidate=candidate;
    const id=w.crypto.randomUUID(),backup='.cache/vehicle-browser-backup-'+id,A=w.VehicleProjectAccess;
    const journal={id,backup,key:'aktuelle-projekte/test-car',from:null,targetExisted:false,phase:'writing',entries:[{path:'public/sitemap.xml',before:null,after:'a'.repeat(64)}]};
    await A.write(candidate,backup+'/journal.json',JSON.stringify(journal));await A.write(candidate,w.VehicleProjectSave.lock+'/browser.json',JSON.stringify({id,backup}));
    const picker=w.showDirectoryPicker, title=t.fields.title.value, name=d.querySelector('#project-name').textContent;
    w.showDirectoryPicker=async()=>candidate;
    try {
      click('[data-step-target="project"]');click('#choose-project');await wait(()=>!t.state.busy && !d.querySelector('#recover-project').hidden);
      assert(t.fields.title.value===title,'candidate lost draft');assert(d.querySelector('#project-name').textContent===name,'candidate replaced project');
      assert(!d.querySelector('[data-step-target="vehicle"]').disabled,'previous project became unavailable');
    } finally {w.showDirectoryPicker=picker;}
  });
  await test('Historical recovery requests write permission explicitly and preserves the draft on denial', async () => {
    const original=recoveryCandidate.requestPermission,title=t.fields.title.value;let mode;
    recoveryCandidate.requestPermission=async options=>{mode=options.mode;return 'denied';};
    try {
      click('#recover-project');await wait(()=>!t.state.busy && d.querySelector('#project-feedback').textContent.includes('Schreibzugriff'));
      assert(mode==='readwrite','recovery did not request write permission');
      assert(t.fields.title.value===title,'denied recovery discarded the draft');
    } finally {recoveryCandidate.requestPermission=original;}
  });
  await test('Every workflow step fits desktop and 390px widths', async () => {
    for(const width of [1440,390]) {frame.style.width=`${width}px`;for(const step of ['project','selection','vehicle','images','content','review']) {click(`[data-step-target="${step}"]`);await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));assert(d.documentElement.scrollWidth<=width,`${step} overflow at ${width}: ${d.documentElement.scrollWidth}`);}}
  });
  await fetch('/result',{method:'POST',body:JSON.stringify({suite:'project-workflow',results},null,2)});
  document.getElementById('results').textContent=JSON.stringify({passed:results.filter(result=>result.pass).length,total:results.length,results},null,2);
});
