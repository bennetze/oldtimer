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
  await test('Review invalidates when edits change and saving updates actual fixture files', async () => {
    input('#title','Geänderter Testwagen');click('[data-step-target="review"]');
    click('#prepare-save'); await wait(()=>!d.querySelector('#save-project').disabled);
    assert(d.querySelector('#save-review').textContent.includes('src/pages/projekte/aktuelle-projekte/test-car/vehicle.json'),'review paths missing');
    input('#title-en','Updated test car');assert(d.querySelector('#save-project').disabled,'stale review still savable');
    click('#prepare-save'); await wait(()=>!d.querySelector('#save-project').disabled);click('#save-project');
    await wait(()=>d.querySelector('#save-review').textContent.startsWith('Änderungen im Projekt gespeichert.'));
    const root=await w.fixtureRoot, A=w.VehicleProjectAccess;
    const record=JSON.parse(await A.text(root,'src/pages/projekte/aktuelle-projekte/test-car/vehicle.json'));
    assert(record.title==='Geänderter Testwagen'&&record.titleEn==='Updated test car','saved content incorrect');
    assert(!await A.hasDirectory(root,w.VehicleProjectSave.lock),'lock left after save');
  });
  await test('Category move preserves slug and produces redirect with no original pair', async () => {
    click('[data-step-target="vehicle"]');const category=t.fields.category;category.value='vergangene-projekte';category.dispatchEvent(new w.Event('change',{bubbles:true}));
    click('[data-step-target="review"]');click('#prepare-save');await wait(()=>!d.querySelector('#save-project').disabled);click('#save-project');await wait(()=>d.querySelector('#save-review').textContent.startsWith('Änderungen im Projekt gespeichert.'));
    const root=await w.fixtureRoot,A=w.VehicleProjectAccess;
    assert(!await A.hasDirectory(root,'src/pages/projekte/aktuelle-projekte/test-car'),'original directory remains');
    const mapping=JSON.parse(await A.text(root,'src/config/vehicle-redirects.json'));assert(mapping['aktuelle-projekte/test-car']==='vergangene-projekte/test-car','redirect missing');
  });
  await test('Every workflow step fits desktop and 390px widths', async () => {
    for(const width of [1440,390]) {frame.style.width=`${width}px`;for(const step of ['project','selection','vehicle','images','content','review']) {click(`[data-step-target="${step}"]`);await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));assert(d.documentElement.scrollWidth<=width,`${step} overflow at ${width}: ${d.documentElement.scrollWidth}`);}}
  });
  await fetch('/result',{method:'POST',body:JSON.stringify({suite:'project-workflow',results},null,2)});
  document.getElementById('results').textContent=JSON.stringify({passed:results.filter(result=>result.pass).length,total:results.length,results},null,2);
});
