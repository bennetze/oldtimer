import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';
import { validateVehicleRecord, validVehicleDate } from '../src/config/vehicleRecord.js';
import { languagePath } from '../src/i18n/language.js';

const tool = await readFile(new URL('../../oldtimer-fahrzeuge/index.html', import.meta.url), 'utf8');
const contract = tool.slice(tool.indexOf('        function validVehicleDate('), tool.indexOf('        const categories ='));
const browser = vm.runInNewContext(`${contract}; ({ validateVehicleRecord, validVehicleDate });`, { URL });
const record = { slug:'test-car', category:'aktuelle-projekte', title:'Fahrzeug', description:'Beschreibung', sourceUrl:'https://example.com', order:-12, dateModified:'2024-02-29', cardImage:'./card.jpg', cardImageAlt:'Karte', leadImage:'./card.jpg', leadImageAlt:'Titel', blocks:[] };

test('embedded offline record contract agrees with website on valid and invalid fixtures', () => {
	const fixtures = [record, {...record,order:0}, {...record,order:Number.MAX_SAFE_INTEGER+1}, {...record,dateModified:'2026-02-29'}, {...record,slug:'index'}, {...record,cardImage:'./../outside.jpg'}, {...record,cardImage:'./card.svg'}, {...record,leadImage:'./card.png'}, {...record,category:'other'}, {...record,extra:true}, {...record,blocks:[{type:'gallery',images:[]}]}, {...record,blocks:[{type:'gallery',images:[{src:'./card.jpg',alt:'Karte',caption:5}]}]}];
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
