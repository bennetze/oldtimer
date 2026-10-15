const frame = document.getElementById('editor');
frame.addEventListener('load', async () => {
  const win = frame.contentWindow, doc = frame.contentDocument, results = [];
  if (!doc?.getElementById('website-tools')) return;
  const $ = selector => doc.querySelector(selector);
  const wait = async condition => {
    for (let i = 0; i < 400; i++) { if (condition()) return; await new Promise(resolve => setTimeout(resolve, 25)); }
    throw new Error('Timed out.');
  };
  const check = (value, message) => { if (!value) throw new Error(message); };
  async function run(name, work) { try { await work(); results.push({ name, pass: true }); } catch (error) { results.push({ name, pass: false, error: error.message }); } }
  win.confirm = () => true;
  await run('Launcher tools stay inside the sixth step and require project/vehicle selection', async () => {
    check(!$('#website-tools').hidden && $('#website-tools').closest('[data-step="review"]'), 'Tools are outside final step.');
    check($('#tools-transfer').disabled && $('#tools-delete').disabled, 'Actions enabled before selection.');
    $('#choose-project').click(); await wait(() => doc.querySelector('.vehicle-row'));
    doc.querySelector('.vehicle-row').click(); await wait(() => !$('#prepare-save').disabled);
    doc.querySelector('[data-step-target="review"]').click();
    check(!$('#tools-transfer').disabled && !$('#tools-delete').disabled, 'Complete draft cannot be saved.');
    check(win.toolsFixture.verified === 1, 'Selected project was not verified with launcher.');
  });
  await run('Tool prompts lock editing while preserving read-only review and keyboard access', async () => {
    $('#prepare-save').click(); await wait(() => $('#save-review').dataset.reviewState === 'ready');
    $('#tools-delete').click(); await wait(() => !$('#tools-prompt').hidden);
    check($('#vehicle-form').inert && !$('#tools-prompt').closest('.sidebar').inert, 'Prompt is inert or draft is unlocked.');
    check(doc.querySelector('[data-step-target="vehicle"]').disabled, 'Navigation is not locked.');
    $('#tools-answer').value = 'test'; $('#tools-answer').dispatchEvent(new win.Event('input', { bubbles: true }));
    check($('#save-review').dataset.reviewState === 'ready', 'Prompt invalidated the review.');
    $('#tools-cancel').click(); await wait(() => $('#tools-prompt').hidden && !$('#vehicle-form').inert);
    check($('#save-review').dataset.reviewState === 'ready', 'Cancellation lost the review.');
  });
  await run('Current draft saves without a ZIP download, extraction or folder picker', async () => {
    const click = win.HTMLAnchorElement.prototype.click;
    let downloads = 0;
    win.HTMLAnchorElement.prototype.click = function () { downloads++; };
    try { $('#tools-transfer').click(); await wait(() => !$('#tools-prompt').hidden); }
    finally { win.HTMLAnchorElement.prototype.click = click; }
    check(downloads === 0 && !$('#tools-folder'), 'Direct save requires ZIP or folder picker.');
    check(win.toolsFixture.lastUpload.draft && win.toolsFixture.lastUpload.from === 'aktuelle-projekte/test-car', 'Original is not bound to selected vehicle.');
    check(win.toolsFixture.files.length === 3, 'Draft did not prepare the page, record and image.');
    check(JSON.parse(win.toolsFixture.files.find(file => file.path.endsWith('/vehicle.json')).bytes).title === $('#title').value, 'Staged record differs from draft.');
    $('#tools-cancel').click(); await wait(() => $('#tools-prompt').hidden && !$('#vehicle-form').inert);
    check($('#save-review').dataset.reviewState === 'ready', 'Cancellation lost the checked draft.');
  });
  await run('Draft changes are staged afresh and incomplete drafts block saving', async () => {
    const english = $('#description-en'), previous = english.value;
    english.value = ''; english.dispatchEvent(new win.Event('input', { bubbles: true }));
    await wait(() => $('#tools-transfer').disabled);
    english.value = previous; english.dispatchEvent(new win.Event('input', { bubbles: true }));
    await wait(() => !$('#tools-transfer').disabled);
    const title = $('#title'); title.value += ' geändert'; title.dispatchEvent(new win.Event('input', { bubbles: true }));
    check($('#save-review').dataset.reviewState === 'stale', 'Draft edit did not invalidate review.');
    $('#tools-transfer').click(); await wait(() => !$('#tools-prompt').hidden);
    check(JSON.parse(win.toolsFixture.files.find(file => file.path.endsWith('/vehicle.json')).bytes).title === title.value, 'Save used an obsolete export.');
    $('#tools-cancel').click(); await wait(() => $('#tools-prompt').hidden && !$('#vehicle-form').inert);
  });
  await run('Preview controls and publication confirmation remain separate from vehicle export', async () => {
    $('#tools-preview-start').click(); await wait(() => !$('#tools-preview-link').hidden);
    check($('#tools-build').disabled && $('#tools-deploy').disabled, 'Build allowed during preview.');
    $('#tools-preview-stop').click(); await wait(() => !$('#tools-deploy').disabled);
    $('#tools-deploy').click(); await wait(() => !$('#tools-prompt').hidden);
    check($('#tools-answer-label').textContent.includes('JA'), 'Publication lacks approval.');
    $('#tools-cancel').click(); await wait(() => $('#tools-prompt').hidden && !$('#vehicle-form').inert);
    check(win.toolsFixture.published === 0, 'Cancelled publication ran.');
  });
  await run('A committed deletion invalidates review and asks to refresh without clearing the draft', async () => {
    const title = $('#title').value;
    $('#tools-delete').click(); await wait(() => !$('#tools-prompt').hidden);
    $('#tools-prompt').dispatchEvent(new win.Event('submit', { bubbles: true, cancelable: true }));
    await wait(() => !$('#tools-choices').hidden);
    $('#tools-choice-list input').checked = true;
    $('#tools-prompt').dispatchEvent(new win.Event('submit', { bubbles: true, cancelable: true }));
    await wait(() => !$('#tools-text-answer').hidden && $('#tools-answer-label').textContent.includes('JA'));
    $('#tools-answer').value = 'JA';
    $('#tools-prompt').dispatchEvent(new win.Event('submit', { bubbles: true, cancelable: true }));
    await wait(() => !$('#tools-refresh').hidden && !$('#vehicle-form').inert);
    check($('#title').value === title && $('#tools-delete').disabled, 'Draft lost or stale project still enabled.');
    $('#tools-refresh').click(); await wait(() => !doc.querySelector('[data-step="selection"]').hidden);
    doc.querySelector('.vehicle-row').click(); await wait(() => !$('#tools-delete').disabled);
  });
  await run('Integrated final step fits desktop and mobile without horizontal overflow', async () => {
    doc.querySelector('[data-step-target="review"]').click();
    for (const width of [1440, 390]) {
      frame.style.width = width + 'px'; await new Promise(resolve => setTimeout(resolve, 50));
      check(doc.documentElement.scrollWidth <= width + 1, 'Horizontal overflow at ' + width);
    }
    frame.style.width = '1440px';
  });
  await run('Outstanding website prompts stay reachable after loss of project selection', async () => {
    win.VehicleWebsiteTools.attach({ context: () => ({ ready: false, busy: false, stale: false, exported: null }), setBusy() {}, changed() {}, refresh() {} });
    await win.fetch('/api/start', { method: 'POST', body: JSON.stringify({ name: 'deploy' }) });
    await wait(() => doc.querySelector('.website-tools-recovery[open]'));
    check($('#website-tools').closest('dialog') && !$('#tools-prompt').hidden, 'Outstanding prompt is unreachable.');
    $('#tools-cancel').click(); await wait(() => !doc.querySelector('.website-tools-recovery'));
    check($('#website-tools').closest('[data-step="review"]'), 'Final step was not restored.');
  });
  document.getElementById('results').textContent = JSON.stringify(results, null, 2);
  await fetch('/result', { method: 'POST', body: JSON.stringify({ suite: 'website-tools', results }) });
});
