import { access, chmod, copyFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const website = fileURLToPath(new URL('../', import.meta.url));
const parent = dirname(website.replace(/[\\/]$/, ''));
await access(join(parent, 'Website/package.json'));
await access(join(parent, 'Intern/index.html'));
for (const extension of ['command', 'cmd', 'sh']) {
	const destination = join(parent, `Bearbeitung.${extension}`);
	await copyFile(new URL(`launchers/Bearbeitung.${extension}`, import.meta.url), destination);
	if (extension !== 'cmd') await chmod(destination, 0o755);
}
console.log('Startdateien im übergeordneten Website-Ordner aktualisiert.');
