import { readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
// Companion-editor integrations remain mandatory in npm test, independently.
const editorSuites = new Set(['vehicle-contract.test.mjs', 'vehicle-project-save.test.mjs']);
const suites = readdirSync(new URL('../tests/', import.meta.url)).filter(file => file.endsWith('.test.mjs') && !editorSuites.has(file)).sort();
const result = spawnSync(process.execPath, ['--test', ...suites.map(file => fileURLToPath(new URL(`../tests/${file}`, import.meta.url)))], { stdio: 'inherit' });
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
