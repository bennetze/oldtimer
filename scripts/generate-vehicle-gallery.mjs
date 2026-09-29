import { generateVehicleGallery } from './lib/vehicle-gallery.mjs';
console.log(JSON.stringify(await generateVehicleGallery(process.cwd(), process.argv[2] ?? 'production', process.argv[3] ?? 'public'), null, 2));
