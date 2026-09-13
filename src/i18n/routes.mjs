import { readdirSync } from 'node:fs';
import { resolve, relative } from 'node:path';

// Reuse every existing page and its getStaticPaths; vehicle discovery remains unchanged.
export default function englishRoutes() {
	return {
		name: 'oldtimer-english-routes',
		hooks: {
			'astro:config:setup': ({ injectRoute }) => {
				const root = resolve('src/pages');
				for (const file of readdirSync(root, { recursive: true })) {
					if (!file.endsWith('.astro')) continue;
					const route = file.replace(/\.astro$/, '').replace(/(^|\/)index$/, '');
					injectRoute({ pattern: `/en/${route}`, entrypoint: `./${relative(process.cwd(), resolve(root, file))}` });
				}
			},
		},
	};
}
