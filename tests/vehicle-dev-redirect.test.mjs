import test from 'node:test';
import assert from 'node:assert/strict';
import { vehicleDevRedirect } from '../src/config/vehicleDevRedirects.js';

test('dev preview follows category moves in both languages and deployment bases', () => {
	const map = { 'fahrzeugangebote/test-car': 'aktuelle-projekte/test-car' };
	for (const base of ['/', '/oldtimer/']) {
		for (const lang of ['', 'en/']) {
			assert.equal(vehicleDevRedirect(`${base}${lang}projekte/fahrzeugangebote/test-car/`, base, map), `${base}${lang}projekte/aktuelle-projekte/test-car/`);
		}
	}
	for (const path of ['/projekte/aktuelle-projekte/test-car/', '/projekte/fahrzeugangebote/', '/outside/', '/en/projekte/fahrzeugangebote/../test-car/']) assert.equal(vehicleDevRedirect(path, '/', map), null);
	assert.equal(vehicleDevRedirect('/projekte/fahrzeugangebote/test-car/', '/', { 'fahrzeugangebote/test-car': 'https://example.com/' }), null);
});
