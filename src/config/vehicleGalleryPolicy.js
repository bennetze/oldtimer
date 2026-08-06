export const GITHUB_PAGES_GALLERY_IMAGE_LIMIT = 4;

export function limitVehicleGalleryBlocks(blocks, galleryImageLimit = Number.POSITIVE_INFINITY) {
	if (!Number.isFinite(galleryImageLimit)) return blocks;

	let remainingImages = Math.max(0, Math.floor(galleryImageLimit));
	return blocks.flatMap((block) => {
		if (block.type !== 'gallery') return [block];

		const images = block.images.slice(0, remainingImages);
		remainingImages -= images.length;
		return images.length ? [{ ...block, images }] : [];
	});
}
