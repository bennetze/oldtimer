import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { load } from 'cheerio';
import { finalizeCsp } from '../src/i18n/csp.js';
test('CSP precedes resources and hashes localized scripts without altering attribute policy', () => {
	const $ = load(`<html><head><meta charset="UTF-8"><script>const language = 'en';</script><link rel="stylesheet" href="/site.css"><meta http-equiv="content-security-policy" content="default-src 'self'; script-src-elem 'self'; script-src-attr 'none'"></head></html>`);
	finalizeCsp($); finalizeCsp($);
	const policy = $('head').children().eq(1);
	assert.equal(policy.attr('http-equiv'), 'content-security-policy');
	const hash = createHash('sha256').update($('script').html()).digest('base64');
	assert.ok(policy.attr('content').includes(`'sha256-${hash}'`));
	assert.match(policy.attr('content'), /script-src-attr 'none'$/);
	assert.equal(policy.attr('content').split(hash).length, 2);
});
