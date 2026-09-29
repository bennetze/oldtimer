import { readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { vehicleImageRoute, type VehicleEntry } from './vehicles';

interface Derivative { route: string; width: number; height: number; }
interface Manifest { images: Record<string, Derivative & { variants: Derivative[] }>; }
const manifests = new Map<string, { stamp: string; manifest: Manifest }>();

export function vehicleImage(vehicle: VehicleEntry, source: string, kind: 'card' | 'detail', base: string) {
	const target = base === '/' ? 'production' : 'github-pages';
	const path = join(process.cwd(), '.cache/vehicle-gallery-v3', `${target}.json`);
	const stat = import.meta.env.DEV ? statSync(path) : undefined;
	const stamp = stat ? `${stat.mtimeMs}:${stat.size}` : 'build';
	let cached = manifests.get(target);
	if (!cached || cached.stamp !== stamp) {
		cached = { stamp, manifest: JSON.parse(readFileSync(path, 'utf8')) };
		manifests.set(target, cached);
	}
	const route = vehicleImageRoute(vehicle, source);
	const image = cached.manifest.images[route];
	if (!image) throw new Error(`Missing generated image metadata: ${route}. Run npm run vehicles:gallery.`);
	const sitePath = (value: string) => `${base.replace(/\/?$/, '/')}${value.slice(1)}`;
	const candidates = [image, ...image.variants].filter(candidate => candidate === image || (kind === 'card' ? [480, 960].includes(candidate.width) : candidate.width === 800));
	const responsive = kind === 'detail' && target === 'github-pages' ? [] : candidates.sort((a, b) => a.width - b.width);
	return {
		src: sitePath(route), width: image.width, height: image.height,
		srcset: responsive.length > 1 ? responsive.map(candidate => `${sitePath(candidate.route)} ${candidate.width}w`).join(', ') : undefined,
	};
}
