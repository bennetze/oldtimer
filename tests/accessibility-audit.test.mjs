import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

test('built accessibility audit rejects numbered vehicle alternatives in both languages', async () => {
 const root = await mkdtemp(join(tmpdir(), 'vehicle-alt-audit-'));
 try {
  for (const [alt, rejected] of [
   ['BMW – Aufnahme 12 der Fahrzeugdokumentation', true],
   ['BMW – photograph 12 in the vehicle record', true],
   ['BMW – Open engine bay showing the engine and pipework.', false],
  ]) {
   await writeFile(join(root, 'index.html'), `<html lang="de"><head><title>Fixture</title></head><body><a class="skip-link" href="#main-content">Skip</a><a class="menu-toggle" href="#site-footer">Menu</a><main id="main-content" tabindex="-1"><h1>Vehicle</h1><img alt="${alt}"></main><footer id="site-footer"></footer></body></html>`);
   const result = spawnSync(process.execPath, ['scripts/audit-accessibility.mjs', root], { encoding: 'utf8' });
   assert.equal(result.status, rejected ? 1 : 0, result.stderr || result.stdout);
   const report = JSON.parse(result.stdout);
   assert.equal(report.genericAlternatives, rejected ? 1 : 0);
   assert.equal(report.failures.length, rejected ? 1 : 0);
  }
 } finally { await rm(root, { recursive: true, force: true }); }
});
