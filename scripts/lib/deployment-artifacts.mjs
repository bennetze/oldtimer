import assert from 'node:assert/strict';
import { readFile, readdir, rm } from 'node:fs/promises';
import { extname, join, relative } from 'node:path';

const forbiddenName = /^(?:\.DS_Store|Thumbs\.db|\.env(?:\..*)?|\.npmrc|\.git|\.cache|\.astro|\.codex-qa|node_modules(?: .*)?|package(?:-lock)?\.json|vehicle\.json)$/i;
const forbiddenExtension = /\.(?:map|log|bak|backup|old|orig|tmp|swp|swo|pem|key|p8|p12|pfx|jks|keystore|exe|dll|so|dylib|bat|cmd|ps1|jar|war|class|php\d*|phtml|phar|cgi|pl|py|rb|sh|asp|aspx|jsp|sql|zip|tar|gz|tgz|7z)$/i;
const credential = /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|\b(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{40,}|AKIA[0-9A-Z]{16}|npm_[A-Za-z0-9]{30,})\b/;
const textExtensions = new Set(['.html', '.js', '.css', '.svg', '.json', '.xml', '.txt']);

/** Check the actual deployable tree, including files copied unchanged from public/. */
export async function verifyDeploymentArtifacts(root, { removeOsMetadata = false } = {}) {
	async function visit(directory) {
		for (const entry of await readdir(directory, { withFileTypes: true })) {
			const path = join(directory, entry.name);
			const label = relative(root, path);
			// Finder may recreate metadata during a build. Strip only these known
			// disposable files at the final packaging gate, not arbitrary failures.
			if (removeOsMetadata && entry.isFile() && ['.DS_Store', 'Thumbs.db'].includes(entry.name)) {
				await rm(path, { force: true });
				continue;
			}
			assert.ok(!entry.isSymbolicLink(), `Deployment symlink: ${label}`);
			assert.ok(!forbiddenName.test(entry.name) && !forbiddenExtension.test(entry.name) && !entry.name.endsWith('~'), `Unexpected deployment artifact: ${label}`);
			assert.ok(!entry.name.startsWith('.') || entry.name === '.htaccess' || entry.name === '.nojekyll' || entry.name === '.well-known', `Unexpected hidden deployment artifact: ${label}`);
			if (entry.isDirectory()) await visit(path);
			else if (textExtensions.has(extname(entry.name).toLowerCase()) || entry.name === '.htaccess') {
				assert.ok(!credential.test(await readFile(path, 'utf8')), `Possible credential in deployment artifact: ${label}`);
			}
		}
	}
	await visit(root);
}
