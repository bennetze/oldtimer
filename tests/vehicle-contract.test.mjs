import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readVehicleTool } from '../scripts/lib/vehicle-tool.mjs';
import { readFile, glob } from 'node:fs/promises';
import { validateVehicleRecord, validVehicleDate } from '../src/config/vehicleRecord.js';
import { languagePath } from '../src/i18n/language.js';

const tool = await readVehicleTool('editor.js');
const contract = tool.slice(tool.indexOf('        function validVehicleDate('), tool.indexOf('        const categories ='));
const browser = vm.runInNewContext(`${contract}; ({ validateVehicleRecord, validVehicleDate });`, { URL });
const record = { slug:'test-car', category:'aktuelle-projekte', title:'Fahrzeug', titleEn: 'Fahrzeug', description:'Beschreibung', descriptionEn: 'Beschreibung', sourceUrl:'https://example.com', order:-12, dateModified:'2024-02-29', cardImage:'./card.jpg', cardImageAlt:'Karte', cardImageAltEn: 'Karte', leadImage:'./card.jpg', leadImageAlt:'Titel', leadImageAltEn: 'Titel', blocks:[] };

test('embedded offline record contract agrees with website on valid and invalid fixtures', () => {
	const fixtures = [{...record,slug:'con'}, {...record,slug:'a'.repeat(250)}, {...record,cardImage:'./NUL.jpg'}, {...record,cardImage:'./'+'a'.repeat(251)+'.jpg'}, record, {...record,order:0}, {...record,order:Number.MAX_SAFE_INTEGER+1}, {...record,dateModified:'2026-02-29'}, {...record,slug:'index'}, {...record,cardImage:'./../outside.jpg'}, {...record,cardImage:'./card.svg'}, {...record,leadImage:'./card.png'}, {...record,category:'other'}, {...record,extra:true}, {...record,blocks:[{type:'gallery',images:[]}]}, {...record,blocks:[{type:'gallery',images:[{src:'./card.jpg',alt:'Karte',caption:5}]}]}];
	for (const fixture of fixtures) {
		const accepts = (validate) => { try {validate(fixture); return true;} catch {return false;} };
		assert.equal(accepts(browser.validateVehicleRecord),accepts(validateVehicleRecord),JSON.stringify(fixture));
	}
	assert.equal(validVehicleDate('2024-02-29'),true);
	assert.equal(validVehicleDate('2026-02-29'),false);
});

test('404 language links target actual static files on both deployment bases', () => {
	for (const base of ['/', '/oldtimer/']) {
		assert.equal(languagePath(`${base}404/`, 'de', base),`${base}404.html`);
		assert.equal(languagePath(`${base}404.html`, 'en', base),`${base}en/404/`);
		assert.equal(languagePath(`${base}en/404/`, 'de', base),`${base}404.html`);
	}
});


test('every maintained vehicle is accepted by the unmodified offline editor, including category moves and ordinary edits', async () => {
	for await (const file of glob('src/pages/projekte/*/*/vehicle.json')) {
		const vehicle = JSON.parse(await readFile(file, 'utf8'));
		browser.validateVehicleRecord(vehicle);
		const moved = { ...vehicle, category: vehicle.category === 'aktuelle-projekte' ? 'vergangene-projekte' : 'aktuelle-projekte' };
		browser.validateVehicleRecord(moved);
		assert.equal(JSON.stringify(moved.blocks), JSON.stringify(vehicle.blocks));
		const edited = structuredClone(vehicle);
		const paragraph = edited.blocks.find(block => block.type === 'copy');
		if (paragraph) paragraph.html = '<p>Bearbeitete Fahrzeugbeschreibung.</p>';
		browser.validateVehicleRecord(edited);
	}
});
