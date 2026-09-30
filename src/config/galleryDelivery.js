export function galleryDeliveryRoute(image, target) {
	return target === 'production' ? image.route.replace(/\/([^/]+)$/, `/_immutable/${image.hash}/$1`) : image.route;
}

