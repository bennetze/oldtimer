import test from 'node:test';
import assert from 'node:assert/strict';
import { restoreArchiveQuery, saveArchiveQuery } from '../src/scripts/archiveHistory.js';

test('archive Back restoration preserves filters, clear state and unrelated history', () => {
	const history = { state: { other: 42 }, replaceState(value) { this.state = structuredClone(value); } };
	saveArchiveQuery(history, '/projekte/fahrzeugangebote/', 'Franklin');
	assert.equal(restoreArchiveQuery(history, '/projekte/fahrzeugangebote/'), 'Franklin');
	assert.equal(history.state.other, 42);
	assert.equal(restoreArchiveQuery(history, '/projekte/aktuelle-projekte/', 'BMW'), 'BMW');
	saveArchiveQuery(history, '/projekte/fahrzeugangebote/', '');
	assert.equal(restoreArchiveQuery(history, '/projekte/fahrzeugangebote/', 'stale browser value'), '');
	assert.doesNotThrow(() => saveArchiveQuery({ replaceState() { throw Error('restricted'); } }, '/archive/', 'BMW'));
});
