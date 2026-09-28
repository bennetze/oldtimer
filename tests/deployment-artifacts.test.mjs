import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm, writeFile, access } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { verifyDeploymentArtifacts } from '../scripts/lib/deployment-artifacts.mjs';

test('deployment gate accepts static output and rejects leaks and executables', async () => {
	const root = await mkdtemp(join(tmpdir(), 'oldtimer-artifacts-'));
	try {
		await writeFile(join(root, 'index.html'), '<h1>Website</h1>');
		await writeFile(join(root, '.htaccess'), 'ErrorDocument 404 /404.html');
		await verifyDeploymentArtifacts(root);
		for (const name of ['.DS_Store', '.env.production', 'bundle.js.map', 'index.php', 'server.exe', 'dump.sql', 'photo.jpg.bak', 'private.key', 'package-lock.json']) {
			await writeFile(join(root, name), 'fixture');
			await assert.rejects(verifyDeploymentArtifacts(root), /deployment artifact/i);
			await rm(join(root, name));
		}
		await mkdir(join(root, 'node_modules'));
		await assert.rejects(verifyDeploymentArtifacts(root), /deployment artifact/i);
		await rm(join(root, 'node_modules'), { recursive: true });
		await writeFile(join(root, '.DS_Store'), 'Finder metadata');
		await verifyDeploymentArtifacts(root, { removeOsMetadata: true });
		await assert.rejects(access(join(root, '.DS_Store')), { code: 'ENOENT' });
		await writeFile(join(root, 'leak.js'), `const token = "npm_${'x'.repeat(36)}";`);
		await assert.rejects(verifyDeploymentArtifacts(root, { removeOsMetadata: true }), /Possible credential/);
	} finally {
		await rm(root, { recursive: true, force: true });
	}
});
