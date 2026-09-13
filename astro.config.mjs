// @ts-check
import { defineConfig } from 'astro/config';
import englishRoutes from './src/i18n/routes.mjs';

const isGitHubPages = process.env.DEPLOY_TARGET === 'github-pages';

// https://astro.build/config
export default defineConfig({
	integrations: [englishRoutes()],
	site: isGitHubPages
		? 'https://bennetze.github.io'
		: 'https://www.oldtimermanufaktur.de',
	base: isGitHubPages ? '/oldtimer' : '/',
	security: {
		csp: {
			algorithm: 'SHA-256',
			directives: [
				"default-src 'self'", "base-uri 'self'", "object-src 'none'",
				"connect-src 'self'", "font-src 'self'", "form-action 'self'",
				"frame-src 'none'", "img-src 'self' data:", "media-src 'self'",
			],
			scriptDirective: {
				resources: [{ resource: "'self'", kind: 'element' }, { resource: "'none'", kind: 'attribute' }],
			},
			styleDirective: {
				resources: [{ resource: "'self'", kind: 'element' }, { resource: "'unsafe-inline'", kind: 'attribute' }],
			},
		},
	},
	devToolbar: {
		enabled: false,
	},
});
