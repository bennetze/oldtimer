import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { vehicleDevRedirect } from './vehicleDevRedirects.js';

export function vehicleRedirectMiddleware(root, base) {
	return (request, response, next) => {
		if (!['GET', 'HEAD'].includes(request.method)) return next();
		try {
			// Astro deliberately removes searches from prerendered Request objects.
			// This Connect middleware still receives the original Node request URL.
			const url = new URL(request.originalUrl || request.url, 'http://localhost');
			const mapping = JSON.parse(readFileSync(join(root, 'src/config/vehicle-redirects.json'), 'utf8'));
			const destination = vehicleDevRedirect(url.pathname, base, mapping);
			if (!destination) return next();
			response.writeHead(301, { Location: destination + url.search });
			response.end();
		} catch (error) { next(error); }
	};
}

export default function vehicleDevServer() {
	return {
		name: 'oldtimer-vehicle-dev-redirects',
		hooks: {
			'astro:server:setup': ({ server }) => {
				server.middlewares.use(vehicleRedirectMiddleware(server.config.root, server.config.base));
			},
		},
	};
}
