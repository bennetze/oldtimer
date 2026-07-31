// @ts-check
import { defineConfig } from 'astro/config';

const isGitHubPages = process.env.DEPLOY_TARGET === 'github-pages';

// https://astro.build/config
export default defineConfig({
	site: isGitHubPages
		? 'https://bennetze.github.io'
		: 'https://www.oldtimermanufaktur.de',
	base: isGitHubPages ? '/oldtimer' : '/',
	devToolbar: {
		enabled: false,
	},
});
